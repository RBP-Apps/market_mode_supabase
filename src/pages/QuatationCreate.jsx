import { useState, useEffect, useCallback, useRef } from "react";
import emailjs from "@emailjs/browser";
import QuotationPreview from "../components/layout/QuotationPreview";
import supabase from "../utils/supabase";
import AdminLayout from "../components/layout/AdminLayout";
import QuotationListView from "../components/QuotationCreate/QuotationListView";
import QuotationFormView from "../components/QuotationCreate/QuotationFormView";
import SendQuotationModal from "../components/QuotationCreate/SendQuotationModal";
import Quotation10kvModal from "../components/QuotationCreate/Quotation10kvModal";

const replacePlaceholders = (text, formData = {}, productDetails = {}) => {
  if (!text || typeof text !== 'string') return text;

  const rating = formData.rating || "";
  const match = rating.match(/(\d+(?:\.\d+)?)\s*(?:KW|MW|KV|KVp|KWp|Wp|W)/i);
  const val = match ? parseFloat(match[1]) : 2.5;
  const isMW = rating.toLowerCase().includes("mw");

  const extractNum = (str) => {
    if (!str) return 0;
    const m = String(str).match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
  };

  const Capacity_MWP = extractNum(formData.capacityMwp) || (isMW ? val : val / 1000);
  const Capacity_WP = Capacity_MWP * 1000000;
  const Capacity_kWP = Capacity_MWP * 1000;
  const Module_Count = Math.round(Capacity_WP / 600);
  const Land_Acres = Capacity_MWP * 3;
  const Annual_Generation = Capacity_kWP * 1500;
  const Annual_Generation_Lakh = Annual_Generation / 100000;
  const CO2_Tonnes = (Annual_Generation * 0.82) / 1000;

  const epcRate = parseFloat(productDetails.rate || 0);
  const Material_Cost = extractNum(formData.priceMaterial) || Math.round(Capacity_WP * epcRate);
  const GST_Supply = Math.round(Material_Cost * 0.089);
  const Total_A = Material_Cost + GST_Supply;

  const OM_Cost = extractNum(formData.priceOm) || Math.round(Capacity_kWP * 2500);
  const OM_GST = Math.round(OM_Cost * 0.18);
  const Total_B = OM_Cost + OM_GST;

  const Total_Project_Cost = Total_A + Total_B;
  const CAPEX_CR = Total_A / 10000000;

  const Tariff_Low = parseFloat(formData.tariffLow) || 6.5;
  const Tariff_High = parseFloat(formData.tariffHigh) || 8.0;
  const Savings_Low = Annual_Generation * Tariff_Low;
  const Savings_High = Annual_Generation * Tariff_High;
  const Payback_Low = Savings_Low > 0 ? Total_A / Savings_Low : 0;
  const Payback_High = Savings_High > 0 ? Total_A / Savings_High : 0;
  const Savings_25_Low = Savings_Low * 25;
  const Savings_25_High = Savings_High * 25;

  const toWordsIndianLocal = (num) => {
    const a = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    function numToWords(n) {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
      if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + numToWords(n % 100) : "");
      return "";
    }
    let n = Math.round(num);
    if (n === 0) return "Zero";
    let str = "";
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    if (crore > 0) str += numToWords(crore) + " Crore ";
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    if (lakh > 0) str += numToWords(lakh) + " Lakh ";
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    if (thousand > 0) str += numToWords(thousand) + " Thousand ";
    if (n > 0) str += numToWords(n) + " ";
    return (str.trim() + " Only.").replace(/\s+/g, " ");
  };
  const PRICE_WORDS = toWordsIndianLocal(Total_Project_Cost);

  return text
    .replace(/\{\{CAPACITY_MWP\}\}/g, Capacity_MWP.toFixed(3).replace(/\.?0+$/, ''))
    .replace(/\{\{CAPACITY_WP\}\}/g, Capacity_WP.toLocaleString("en-IN"))
    .replace(/\{\{MODULE_COUNT\}\}/g, Module_Count.toLocaleString("en-IN"))
    .replace(/\{\{LAND_ACRES\}\}/g, Land_Acres.toFixed(1))
    .replace(/\{\{ANNUAL_GEN\}\}/g, Annual_Generation.toLocaleString("en-IN"))
    .replace(/\{\{CO2_TONNES\}\}/g, Math.round(CO2_Tonnes).toLocaleString("en-IN"))
    .replace(/\{\{PRICE_MATERIAL\}\}/g, Material_Cost.toLocaleString("en-IN"))
    .replace(/\{\{PRICE_GST_SUPPLY\}\}/g, GST_Supply.toLocaleString("en-IN"))
    .replace(/\{\{PRICE_TOTAL_A\}\}/g, Total_A.toLocaleString("en-IN"))
    .replace(/\{\{PRICE_OM\}\}/g, OM_Cost.toLocaleString("en-IN"))
    .replace(/\{\{PRICE_OM_GST\}\}/g, OM_GST.toLocaleString("en-IN"))
    .replace(/\{\{PRICE_TOTAL_B\}\}/g, Total_B.toLocaleString("en-IN"))
    .replace(/\{\{PRICE_TOTAL\}\}/g, Total_Project_Cost.toLocaleString("en-IN"))
    .replace(/\{\{PRICE_WORDS\}\}/g, PRICE_WORDS)
    .replace(/\{\{CAPEX_CR\}\}/g, CAPEX_CR.toFixed(2))
    .replace(/\{\{TARIFF_LOW\}\}/g, Tariff_Low.toFixed(2))
    .replace(/\{\{TARIFF_HIGH\}\}/g, Tariff_High.toFixed(2))
    .replace(/\{\{SAVINGS_LOW\}\}/g, Savings_Low.toLocaleString("en-IN"))
    .replace(/\{\{SAVINGS_HIGH\}\}/g, Savings_High.toLocaleString("en-IN"))
    .replace(/\{\{PAYBACK_LOW\}\}/g, Payback_Low.toFixed(1))
    .replace(/\{\{PAYBACK_HIGH\}\}/g, Payback_High.toFixed(1))
    .replace(/\{\{SAVINGS_25_LOW\}\}/g, Savings_25_Low.toLocaleString("en-IN"))
    .replace(/\{\{SAVINGS_25_HIGH\}\}/g, Savings_25_High.toLocaleString("en-IN"));
};

// ─── Helper for Excel Wording ────────────────────────────────────────────────
function convertNumberToWordsExcel(num) {
  if (!num || isNaN(num)) return "";
  const total = Math.round(parseFloat(num));
  if (total === 0) return "Zero Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function getWords99(n) {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return tens[t] + (o ? " " + ones[o] : "");
  }

  const crore = Math.floor(total / 10000000);
  const lakh = Math.floor((total % 10000000) / 100000);
  const thousand = Math.floor((total % 100000) / 1000);
  const hundred = Math.floor((total % 1000) / 100);
  const remaining = total % 100;

  const croreHundreds = Math.floor(crore / 100);
  const croreRemainder = crore % 100;

  let parts = [];

  if (crore > 0) {
    let croreStr = "";
    if (croreHundreds > 0) {
      croreStr += getWords99(croreHundreds) + " Hundred";
      if (croreRemainder > 0) {
        croreStr += " " + getWords99(croreRemainder);
      }
    } else {
      croreStr += getWords99(croreRemainder);
    }
    parts.push(croreStr + " Crore");
  }

  if (lakh > 0) {
    parts.push(getWords99(lakh) + " Lakh");
  }

  if (thousand > 0) {
    parts.push(getWords99(thousand) + " Thousand");
  }

  if (hundred > 0) {
    parts.push(getWords99(hundred) + " Hundred");
  }

  if (remaining > 0) {
    parts.push(getWords99(remaining));
  }

  return parts.join(" ") + " Only";
}

function toWordsIndianTokenMap(total) {
  if (!total || isNaN(total)) return "";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function getWords99Hyphen(n) {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return tens[t] + (o ? "-" + ones[o] : "");
  }

  const crore = Math.floor(total / 10000000);
  const lakh = Math.floor((total % 10000000) / 100000);
  const thousand = Math.floor((total % 100000) / 1000);
  const hundred = Math.floor((total % 1000) / 100);
  const remaining = total % 100;

  const croreHundreds = Math.floor(crore / 100);
  const croreRemainder = crore % 100;

  let parts = [];

  if (crore > 0) {
    let croreStr = "";
    if (croreHundreds > 0) {
      croreStr += getWords99Hyphen(croreHundreds) + " Hundred";
      if (croreRemainder > 0) {
        croreStr += " " + getWords99Hyphen(croreRemainder);
      }
    } else {
      croreStr += getWords99Hyphen(croreRemainder);
    }
    parts.push(croreStr + " Crore");
  }

  if (lakh > 0) {
    parts.push(getWords99Hyphen(lakh) + " Lakh");
  }

  if (thousand > 0) {
    parts.push(getWords99Hyphen(thousand) + " Thousand");
  }

  if (hundred > 0) {
    parts.push(getWords99Hyphen(hundred) + " Hundred");
  }

  if (remaining > 0) {
    parts.push(getWords99Hyphen(remaining));
  }

  return parts.join(" ") + " Only";
}

const getPartWords = (val) => {
  if (val === 0) return "Zero";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  if (val < 20) return ones[val];
  const t = Math.floor(val / 10);
  const o = val % 10;
  return tens[t] + (o ? " " + ones[o] : "");
};

export default function QuatationCreate() {
  // State for list/view mode
  const [viewMode, setViewMode] = useState("list"); // "list" or "form"
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // State for list view
  const [activeTab, setActiveTab] = useState("pending");
  const [fmsData, setFmsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dealerBankMap, setDealerBankMap] = useState({});
  const [show10kvModal, setShow10kvModal] = useState(false);

  // Send Modal States
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingBoth, setSendingBoth] = useState(false);

  // Form States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerMap, setCustomerMap] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [dropdownOptions, setDropdownOptions] = useState({
    salesperson: [],
    customer: [],
    dealer: [],
    structureType: [],
    roofType: [],
    systemType: [],
    needType: [],
    projectMode: [],
    stage: [],
    status: [],
    failureHours: [],
    loadDetails: [],
    rating: [],
    referenceBy: [],
    placeOfInstallation: [],
  });

  const [showPreview, setShowPreview] = useState(false);
  const [isSubmittingToSheet, setIsSubmittingToSheet] = useState(false);

  const [productDetails, setProductDetails] = useState({
    productName: "",
    bom: "",
    size: "",
    gst: "",
    rate: "",
    amount: "",
  });

  const [productMap, setProductMap] = useState({});
  const [salespersons, setSalespersons] = useState(["S N Sahoo"]);

  const [formData, setFormData] = useState({
    date: "",
    salesperson: "",
    customer: "",
    contactNo: "",
    email: "",
    dealer: "",
    phoneNo: "",
    structureType: "",
    placeOfInstallation: "",
    termsConditions:
      "On Grid:\n1. We will process for approval from competent authority for net metering. Any other approval is in your scope.\n2. Processing fee payable to CREDA/CSPDCL as applicable.\n3. Generation Guarantee of 1.5kWh/W per annum",
    rating: "",
    qty: "1",
    subCentral: "",
    subState: "",
    disc: "",
    referenceBy: "",
    bankAccount: "",
    accountNo: "",
    ifscCode: "",
    branch: "",
    loadDetails: "",
    failureHours: "",
    needType: "",
    enquiryNumber: "",
    generalTerms:
      "1. Power output from Control Panel will be in customers scope.\n2. Civil work other than Module Mounting Structure will be in customer's scope.\n3. Our offer is valid for 15 Days. Any custom specifications will be charged extra.\n4. Regular cleaning of Modules with plain water (soft) for desired generation guarantee in customer's scope.\n5. Detailed Quotation with engineering document will be provided on finalisation, for systems above 10KW.\n6. Subsidy (if any) is subject to government approval and will be directly credited in customer's account.\n7. Transportation inclusive. Insurance inclusive upto site and thereafter in customer's scope.\n8. Payment 50% advance on booking, Balance 50% against PI before dispatch of material.\n9. Delivery within 2 weeks from sanction and installation immediately thereafter.\n10. AMC inclusive for 5 years and chargeable thereafter.\n11. Structure height consider 5 feet, for additional height should charge extra.\n12. DC, AC, Earthing cable length considered 30 meter, for additional length should charge extra.",

    // 10 kW+ specific fields
    proposalFor: "",
    preparedFor: "",
    dated: "",
    capacityMwp: "",
    moduleCount: "",
    landAcres: "",
    annualGen: "",
    co2Tonnes: "",
    capacityWp: "",
    tariffLow: "",
    savingsLow: "",
    tariffHigh: "",
    savingsHigh: "",
    capexCr: "",
    savings25Low: "",
    savings25High: "",
    priceMaterial: "",
    priceGstSupply: "",
    priceTotalA: "",
    priceOm: "",
    priceOmGst: "",
    priceTotalB: "",
    priceTotal: "",
    priceWords: "",

    // Manual input fields for MWp
    generationGuarantee: "",
    moduleWattage: "",
    landNeeded: "",
    gridEmissionFactor: "",
    effectiveGST: "",
    gstOnOM: "",
    plantLife: "",
    gridTariffConservative: "",
    gridTariffHigher: "",
    plantCapacity: "",
    epcRate: "",
    comprehensiveOM: "",
  });

  const isMoreThan10KW = (rating) => {
    if (!rating) return false;
    const match = rating.match(/(\d+(?:\.\d+)?)\s*(?:KW|MW|KV|KVp|KWp|Wp|W)/i);
    if (match) {
      const value = parseFloat(match[1]);
      const isMW = /MW/i.test(rating);
      if (isMW) return true;
      return value >= 10;
    }
    return false;
  };

  const getParsedCapacityMwp = (rating) => {
    if (!rating) return 2.5;
    const match = rating.match(/(\d+(?:\.\d+)?)\s*(?:KW|MW|KV|KVp|KWp|Wp|W)/i);
    const val = match ? parseFloat(match[1]) : 2.5;
    const isMW = rating.toLowerCase().includes("mw");
    return isMW ? val : val / 1000;
  };

  useEffect(() => {
    if (!formData.rating) return;
    if (isMoreThan10KW(formData.rating)) {
      const pc = parseFloat(formData.plantCapacity) || 0;
      const er = parseFloat(formData.epcRate) || 0;
      const co = parseFloat(formData.comprehensiveOM) || 0;
      const gtc = parseFloat(formData.gridTariffConservative) || 0;
      const gth = parseFloat(formData.gridTariffHigher) || 0;
      const gg = parseFloat(formData.generationGuarantee) || 0;
      const mw = parseFloat(formData.moduleWattage) || 0;
      const ln = parseFloat(formData.landNeeded) || 0;
      const gef = parseFloat(formData.gridEmissionFactor) || 0;
      const egst = parseFloat(formData.effectiveGST) || 0;
      const go = parseFloat(formData.gstOnOM) || 0;
      const pl = parseFloat(formData.plantLife) || 0;

      const capWp = pc * 1000000;
      const capKwp = pc * 1000;
      const modExact = mw > 0 ? Math.round(capWp / mw) : 0;
      const modRounded = Math.round(modExact / 10) * 10;
      const annualGen = capKwp * gg;
      const annualGenLakh = annualGen / 100000;
      const landRequiredVal = pc * ln;
      const co2AvoidedVal = (annualGen * gef) / 1000;

      const materialCostVal = capWp * er;
      const gstMaterialVal = (materialCostVal * egst) / 100;
      const totalAVal = materialCostVal + gstMaterialVal;
      const omCostVal = co;
      const gstOMVal = (omCostVal * go) / 100;
      const totalBVal = omCostVal + gstOMVal;
      const totalProjectCostVal = totalAVal + totalBVal;

      const savingsConsVal = annualGen * gtc;
      const savingsHighVal = annualGen * gth;
      const paybackConsVal = savingsConsVal > 0 ? totalAVal / savingsConsVal : 0;
      const paybackHighVal = savingsHighVal > 0 ? totalAVal / savingsHighVal : 0;
      const grossSavingsConsVal = savingsConsVal * pl;
      const grossSavingsHighVal = savingsHighVal * pl;

      const croreVal = Math.floor(totalProjectCostVal / 10000000);
      const lakhVal = Math.floor((totalProjectCostVal % 10000000) / 100000);
      const thousandVal = Math.floor((totalProjectCostVal % 100000) / 1000);
      const hundredVal = Math.floor((totalProjectCostVal % 1000) / 100);
      const remainingValue = Math.round(totalProjectCostVal % 100);
      const croreHundredsVal = Math.floor(croreVal / 100);
      const croreRemainderVal = croreVal % 100;

      const newFields = {
        capacityWp: String(capWp),
        capacityKwp: String(capKwp),
        moduleCountExact: String(modExact),
        moduleCountRounded: String(modRounded),
        annualGeneration: String(annualGen),
        annualGenerationLakhUnits: String(annualGenLakh),
        landRequired: String(landRequiredVal),
        co2Avoided: String(co2AvoidedVal),
        materialCost: String(materialCostVal),
        gstOnMaterial: String(gstMaterialVal),
        totalASystem: String(totalAVal),
        omCost: String(omCostVal),
        gstOnOMAmount: String(gstOMVal),
        totalBComc: String(totalBVal),
        totalProjectCost: String(totalProjectCostVal),
        annualSavingsConservative: String(savingsConsVal),
        annualSavingsHigher: String(savingsHighVal),
        simplePaybackConservative: paybackConsVal.toFixed(2),
        simplePaybackHigher: paybackHighVal.toFixed(2),
        grossSavings25Conservative: String(grossSavingsConsVal),
        grossSavings25Higher: String(grossSavingsHighVal),

        crore: getPartWords(croreVal),
        lakh: getPartWords(lakhVal),
        thousand: getPartWords(thousandVal),
        hundred: getPartWords(hundredVal),
        rest: getPartWords(remainingValue),
        croreHundreds: getPartWords(croreHundredsVal),
        croreRemainder: getPartWords(croreRemainderVal),
        amountInWords: convertNumberToWordsExcel(totalProjectCostVal),

        // Also set the old fields to keep template generation working!
        proposalFor: `${pc} MWp`,
        preparedFor: formData.preparedFor || formData.customer || "",
        dated: formData.dated || formData.date || new Date().toISOString().split("T")[0],
        capacityMwp: `${pc} MWp`,
        moduleCount: modRounded.toString(),
        landAcres: `~${landRequiredVal.toFixed(1)} acres`,
        annualGen: `${annualGenLakh.toFixed(1)} Lakh`,
        co2Tonnes: Math.round(co2AvoidedVal).toString(),
        tariffLow: gtc.toString(),
        savingsLow: Math.round(savingsConsVal).toLocaleString("en-IN"),
        tariffHigh: gth.toString(),
        savingsHigh: Math.round(savingsHighVal).toLocaleString("en-IN"),
        capexCr: (totalAVal / 10000000).toFixed(2),
        savings25Low: Math.round(grossSavingsConsVal).toLocaleString("en-IN"),
        savings25High: Math.round(grossSavingsHighVal).toLocaleString("en-IN"),
        priceMaterial: Math.round(materialCostVal).toLocaleString("en-IN"),
        priceGstSupply: Math.round(gstMaterialVal).toLocaleString("en-IN"),
        priceTotalA: Math.round(totalAVal).toLocaleString("en-IN"),
        priceOm: Math.round(omCostVal).toLocaleString("en-IN"),
        priceOmGst: Math.round(gstOMVal).toLocaleString("en-IN"),
        priceTotalB: Math.round(totalBVal).toLocaleString("en-IN"),
        priceTotal: Math.round(totalProjectCostVal).toLocaleString("en-IN"),
        priceWords: toWordsIndianTokenMap(totalProjectCostVal),
      };

      const bomData = {
        manualInputs: {
          customerName: formData.preparedFor || formData.customer || "",
          proposalDate: formData.dated || formData.date || "",
          plantCapacity: String(pc),
          epcRate: String(er),
          comprehensiveOM: String(co),
          gridTariffConservative: String(gtc),
          gridTariffHigher: String(gth),
          generationGuarantee: String(gg),
          moduleWattage: String(mw),
          landNeeded: String(ln),
          gridEmissionFactor: String(gef),
          effectiveGST: String(egst),
          gstOnOM: String(go),
          plantLife: String(pl),
        }
      };
      const bomStr = JSON.stringify(bomData);

      const hasChanged = Object.keys(newFields).some(
        key => String(formData[key]) !== String(newFields[key])
      );

      if (hasChanged) {
        setFormData(prev => ({ ...prev, ...newFields }));
      }

      if (
        String(productDetails.rate) !== String(er) ||
        String(productDetails.amount) !== String(totalAVal) ||
        productDetails.bom !== bomStr
      ) {
        setProductDetails(prev => ({
          ...prev,
          rate: String(er),
          amount: String(totalAVal),
          bom: bomStr
        }));
      }
    }
  }, [
    formData.rating,
    formData.customer,
    formData.date,
    formData.plantCapacity,
    formData.epcRate,
    formData.comprehensiveOM,
    formData.gridTariffConservative,
    formData.gridTariffHigher,
    formData.generationGuarantee,
    formData.moduleWattage,
    formData.landNeeded,
    formData.gridEmissionFactor,
    formData.effectiveGST,
    formData.gstOnOM,
    formData.plantLife,
    productMap,
    productDetails.rate,
    productDetails.amount
  ]);

  // Helpers
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };


  const fetchQuotationCopyData = async () => {
    try {
      let quotationMap = {};

      // 1. Fetch from new_quatation_create
      const { data, error } = await supabase
        .from('new_quatation_create')
        .select('enquiry_number, planned, actual, quatation_copy, is_10kv, status, bill_of_material, salesperson, customer, quotation_date, product');

      if (error) {
        console.warn("is_10kv column query failed, falling back without new columns:", error);
        const { data: fbData, error: fbError } = await supabase
          .from('new_quatation_create')
          .select('enquiry_number, planned, actual, quatation_copy');

        if (fbError) throw fbError;

        if (fbData) {
          fbData.forEach(row => {
            quotationMap[row.enquiry_number] = {
              planned2: row.planned,
              actual2: row.actual,
              quotationCopy: row.quatation_copy,
              is10kv: false,
              status: 'Approved',
              billOfMaterial: null,
              salesperson: "",
              customer: "",
              quotationDate: row.planned,
              product: ""
            };
          });
        }
      } else if (data) {
        data.forEach(row => {
          quotationMap[row.enquiry_number] = {
            planned2: row.planned,
            actual2: row.actual,
            quotationCopy: row.quatation_copy,
            is10kv: row.is_10kv || false,
            status: row.status || 'Approved',
            billOfMaterial: row.bill_of_material,
            salesperson: row.salesperson || "",
            customer: row.customer || "",
            quotationDate: row.quotation_date || row.planned,
            product: row.product || ""
          };
        });
      }

      // 2. Fetch from quatation_10kw
      const { data: q10Data, error: q10Error } = await supabase
        .from('quatation_10kw')
        .select('enquiry_number, created_at, dated, quatation_copy, status, prepared_for, proposal_for');

      if (!q10Error && q10Data) {
        q10Data.forEach(row => {
          if (!quotationMap[row.enquiry_number]) {
            quotationMap[row.enquiry_number] = {
              planned2: row.dated || row.created_at,
              actual2: row.created_at,
              quotationCopy: row.quatation_copy,
              is10kv: true,
              status: row.status || 'Approved',
              billOfMaterial: null,
              salesperson: "",
              customer: row.prepared_for || "",
              quotationDate: row.dated || row.created_at,
              product: row.proposal_for || ""
            };
          } else {
            quotationMap[row.enquiry_number].is10kv = true;
            if (row.status) {
              quotationMap[row.enquiry_number].status = row.status;
            }
          }
        });
      }

      return quotationMap;
    } catch (err) {
      console.error(err);
      return {};
    }
  };



  const fetchFMSData = async () => {
    setLoading(true);

    try {
      const { data: rows, error: fmsError } = await supabase
        .from("new_quatation_create")
        .select(`
          *,
          enquiries!left (
            beneficiary_name,
            beneficiary_number,
            address,
            village_block,
            district,
            contact_number,
            present_load,
            bp_number,
            cspdcl_contract_demand,
            avg_electricity_bill,
            future_load_requirement,
            roof_type,
            system_type,
            project_mode,
            structure_type,
            load_details,
            need_type
          )
        `)
        .not('planned', 'is', null);

      if (fmsError) throw fmsError;

      const formattedData = (rows || []).map((row) => {
        const enq = row.enquiries || {};

        return {
          id: row.id,
          enquiryNumber: row.enquiry_number || "",
          beneficiaryName: enq.beneficiary_name || row.customer || "",
          address: enq.address || row.place_of_installation || "",
          villageBlock: enq.village_block || "",
          district: enq.district || "",
          beneficiaryNumber: enq.beneficiary_number || "",
          contactNumber: enq.beneficiary_number || enq.contact_number || row.contact_no || "",
          presentLoad: enq.present_load || row.product || "",
          structureType: row.structure_type || enq.structure_type || "",
          loadDetails: row.load_details || enq.load_details || "",
          hoursOfFailure: "",
          needType: row.need_type || enq.need_type || "",
          qty: row.qty || enq.cspdcl_contract_demand || "",
          projectMode: enq.project_mode || "",
          systemType: enq.system_type || "",
          roofType: enq.roof_type || "",
          futureLoadRequirement: enq.future_load_requirement || "",
          avgElectricityBill: enq.avg_electricity_bill || "",
          cspdclContractDemand: enq.cspdcl_contract_demand || "",
          bpNumber: enq.bp_number || "",

          planned2: row.planned || null,
          actual2: row.actual || null,
          quotationCopy: row.quatation_copy || null,
          is10kv: row.is_10kv || false,
          status: row.status || null,
          directorApproval: row.director_approval || 'Pending',
          billOfMaterial: row.bill_of_material || null,
          salesperson: row.salesperson || "",
          quotationDate: row.quotation_date || "",
          product: row.product || "",

          planned1: "",
          actual1: "",
        };
      });

      setFmsData(formattedData);

    } catch (err) {
      console.error("❌ Error fetching FMS data:", err);
    } finally {
      setLoading(false);
    }
  };



  const uploadPDFToDrive = async (pdfBlob, fileName) => {
    try {
      const filePath = `${Date.now()}_${fileName}`;
      const { data, error } = await supabase.storage
        .from("Quotation_file")
        .upload(filePath, pdfBlob, { contentType: "application/pdf" });

      if (error) throw error;
      const { data: urlData } = supabase.storage.from("Quotation_file").getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading PDF:", error);
      return null;
    }
  };

  const updateSendStatus = async (enquiryNumber, sendType) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('new_quatation_create')
        .select('id, send_status')
        .eq('enquiry_number', enquiryNumber)
        .single();

      if (fetchError) return;

      const currentStatus = data.send_status || "";
      let newStatus = currentStatus;

      if (sendType === 'whatsapp')
        newStatus = currentStatus ? `${currentStatus}, WhatsApp` : 'WhatsApp';
      else if (sendType === 'email')
        newStatus = currentStatus ? `${currentStatus}, Email` : 'Email';

      const { error: updateError } = await supabase
        .from('new_quatation_create')
        .update({
          send_status: newStatus,
          send_status_time: new Date().toISOString().split('T')[0]   // ✅ added
        })
        .eq('id', data.id);

      if (updateError) throw updateError;

      fetchFMSData();

    } catch (error) {
      console.error("Error updating send status:", error);
    }
  };

  const sendWhatsApp = async (quotationData) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-quotation', {
        body: {
          phone: quotationData.contactNumber,
          customerName: quotationData.beneficiaryName,
          pdfUrl: quotationData.quotationCopy || null, // PDF document for header (optional)
        },
      });

      console.log(data)
      console.log(error)
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("WhatsApp Send Error:", error);
      throw error;
    }
  };

  const sendEmail = async (quotationData) => {
    try {
      const templateParams = {
        customer_name: quotationData.beneficiaryName,
        enquiry_number: quotationData.enquiryNumber,
        product_name: quotationData.presentLoad || "Solar System",
        quotation_link: quotationData.quotationCopy,
        to_email: quotationData.email || "", // Need to ensure email is available
        reply_to: import.meta.env.VITE_USER_ACCOUNT || "sahoo@rbpindia.com",
      };

      const result = await emailjs.send(
        import.meta.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_mkdtlae",
        import.meta.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_quotation",
        templateParams,
        import.meta.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "JN3T3k1LsQ0KSOn-A"
      );
      return result;
    } catch (error) {
      console.error("Email Send Error:", error);
      throw error;
    }
  };

  const handleSend = async (sendType, quotationData) => {
    if (sendType === 'whatsapp') setSendingWhatsApp(true);
    else if (sendType === 'email') setSendingEmail(true);

    try {
      if (sendType === 'whatsapp') {
        await sendWhatsApp(quotationData);
      } else if (sendType === 'email') {
        await sendEmail(quotationData);
      }

      await updateSendStatus(quotationData.enquiryNumber, sendType);
      setShowSendModal(false);
      setSelectedQuotation(null);
      alert(`${sendType === 'whatsapp' ? 'WhatsApp' : 'Email'} sent successfully!`);
    } catch (error) {
      console.error("Send Error:", error);
      alert(`Failed to send ${sendType}. Please check your credentials.`);
    } finally {
      if (sendType === 'whatsapp') setSendingWhatsApp(false);
      else if (sendType === 'email') setSendingEmail(false);
    }
  };

  const handleSendBoth = async (quotationData) => {
    setSendingBoth(true);
    try {
      const waPromise = sendWhatsApp(quotationData).then(() => updateSendStatus(quotationData.enquiryNumber, "whatsapp"));
      const mailPromise = sendEmail(quotationData).then(() => updateSendStatus(quotationData.enquiryNumber, "email"));

      await Promise.all([waPromise, mailPromise]);

      setShowSendModal(false);
      setSelectedQuotation(null);
      alert("WhatsApp and Email sent successfully!");
    } catch (error) {
      console.error("Send Both Error:", error);
      alert("Failed to send one or both notifications.");
    } finally {
      setSendingBoth(false);
    }
  };

  const handleViewQuotation = (row) => {
    setSelectedQuotation(row);
    setShowSendModal(true);
  };
  const submitToSheet = async (formDataToSubmit, quotationCopyUrl = null, statusVal = 'Approved') => {
    if (isMoreThan10KW(formDataToSubmit.rating)) {
      const rowData = {
        enquiry_number: formDataToSubmit.enquiryNumber,
        proposal_for: formDataToSubmit.proposalFor || formDataToSubmit.capacity || formDataToSubmit.rating,
        prepared_for: formDataToSubmit.preparedFor || formDataToSubmit.customer,
        dated: formDataToSubmit.dated || formDataToSubmit.date,
        capacity_mwp: formDataToSubmit.capacityMwp,
        module_count: formDataToSubmit.moduleCount,
        land_acres: formDataToSubmit.landAcres,
        annual_gen: formDataToSubmit.annualGen,
        co2_tonnes: formDataToSubmit.co2Tonnes,
        capacity_wp: formDataToSubmit.capacityWp,
        tariff_low: formDataToSubmit.tariffLow,
        savings_low: formDataToSubmit.savingsLow,
        tariff_high: formDataToSubmit.tariffHigh,
        savings_high: formDataToSubmit.savingsHigh,
        capex_cr: formDataToSubmit.capexCr,
        savings_25_low: formDataToSubmit.savings25Low,
        savings_25_high: formDataToSubmit.savings25High,
        price_material: formDataToSubmit.priceMaterial,
        price_gst_supply: formDataToSubmit.priceGstSupply,
        price_total_a: formDataToSubmit.priceTotalA,
        price_om: formDataToSubmit.priceOm,
        price_om_gst: formDataToSubmit.priceOmGst,
        price_total_b: formDataToSubmit.priceTotalB,
        price_total: formDataToSubmit.priceTotal,
        price_words: formDataToSubmit.priceWords,
        quatation_copy: quotationCopyUrl,
        status: statusVal,
      };

      // Also upsert to new_quatation_create to maintain FMS pipeline compatibility
      const totalCostNum = parseFloat(formDataToSubmit.priceTotal?.replace(/,/g, '')) || parseFloat(productDetails.amount) || null;
      const rateNum = parseFloat(productDetails.rate) || null;
      const amountNum = parseFloat(productDetails.amount) || null;

      const quatationCreateRow = {
        actual: new Date().toISOString(),
        quotation_date: formDataToSubmit.date || new Date().toISOString().split('T')[0],
        salesperson: formDataToSubmit.salesperson,
        customer: formDataToSubmit.customer,
        contact_no: formDataToSubmit.contactNo,
        email: formDataToSubmit.email,
        dealer: formDataToSubmit.dealer,
        alternative_phone_no: formDataToSubmit.phoneNo,
        structure_type: formDataToSubmit.structureType || "Roof Top",
        place_of_installation: formDataToSubmit.placeOfInstallation,
        terms_conditions: replacePlaceholders(formDataToSubmit.termsConditions || "", formDataToSubmit, productDetails),
        product: formDataToSubmit.rating,
        qty: 1,
        need_type: formDataToSubmit.needType,
        reference_by: formDataToSubmit.referenceBy,
        bank_name: formDataToSubmit.bankAccount,
        account_no: formDataToSubmit.accountNo,
        ifsc_code: formDataToSubmit.ifscCode,
        branch: formDataToSubmit.branch,
        general_terms_conditions: replacePlaceholders(formDataToSubmit.generalTerms || "", formDataToSubmit, productDetails),
        // hours_of_failures: formDataToSubmit.failureHours,
        load_details: formDataToSubmit.loadDetails,
        product_name: productDetails.productName || formDataToSubmit.rating,
        bill_of_material: productDetails.bom,
        size: productDetails.size || `${formDataToSubmit.plantCapacity} MWp`,
        rate: rateNum,
        amount: amountNum,
        enquiry_number: formDataToSubmit.enquiryNumber,
        net_cost: totalCostNum,
        quatation_copy: quotationCopyUrl,
        is_10kv: true,
        status: statusVal,
      };

      const [res1, res2] = await Promise.all([
        supabase.from('quatation_10kw').upsert(rowData, { onConflict: 'enquiry_number' }),
        supabase.from('new_quatation_create').upsert(quatationCreateRow, { onConflict: 'enquiry_number' })
      ]);

      if (res1.error) throw res1.error;
      if (res2.error) throw res2.error;
    } else {
      const currentTimestamp = new Date();
      const amount = parseFloat(productDetails.amount || 0);
      const disc = parseFloat(formDataToSubmit.disc || 0);
      const gst = parseFloat(productDetails.gst || 0);
      const central = parseFloat(formDataToSubmit.subCentral || 0);
      const state = parseFloat(formDataToSubmit.subState || 0);

      const afterDiscount = amount - (amount * disc) / 100;
      const gstAmount = gst < 1 ? afterDiscount * gst : (afterDiscount * gst) / 100;
      const afterGST = afterDiscount + gstAmount;
      const netCost = afterGST - central - state;

      const rowData = {
        // quatation_no: formDataToSubmit.quotationNo,
        actual: new Date().toISOString(),
        quotation_date: formDataToSubmit.date,
        salesperson: formDataToSubmit.salesperson,
        customer: formDataToSubmit.customer,
        contact_no: formDataToSubmit.contactNo,
        email: formDataToSubmit.email,
        dealer: formDataToSubmit.dealer,
        alternative_phone_no: formDataToSubmit.phoneNo,
        structure_type: formDataToSubmit.structureType,
        place_of_installation: formDataToSubmit.placeOfInstallation,
        terms_conditions: replacePlaceholders(formDataToSubmit.termsConditions, formDataToSubmit, productDetails),
        product: formDataToSubmit.rating,
        qty: parseFloat(formDataToSubmit.qty) || null,
        central_subsidy: central || null,
        state_subsidy: state || null,
        discount_percent: disc || null,
        need_type: formDataToSubmit.needType,
        reference_by: formDataToSubmit.referenceBy,
        bank_name: formDataToSubmit.bankAccount,
        account_no: formDataToSubmit.accountNo,
        ifsc_code: formDataToSubmit.ifscCode,
        branch: formDataToSubmit.branch,
        general_terms_conditions: replacePlaceholders(formDataToSubmit.generalTerms, formDataToSubmit, productDetails),
        // hours_of_failures: formDataToSubmit.failureHours,
        load_details: formDataToSubmit.loadDetails,
        product_name: productDetails.productName,
        bill_of_material: productDetails.bom,
        size: productDetails.size,
        gst: gst || null,
        rate: parseFloat(productDetails.rate) || null,
        amount: amount || null,
        enquiry_number: formDataToSubmit.enquiryNumber,
        net_cost: netCost,
        quatation_copy: quotationCopyUrl,
        status: statusVal,
      };

      const { error } = await supabase
        .from('new_quatation_create')
        .upsert(rowData, { onConflict: 'enquiry_number' });
      if (error) throw error;
    }
  };

  const handlePreview = (e) => {
    e.preventDefault();
    const is10kw = isMoreThan10KW(formData.rating);
    const required = is10kw
      ? ["salesperson", "customer", "contactNo", "rating"]
      : ["salesperson", "customer", "contactNo", "structureType", "rating", "qty"];

    for (const f of required) {
      if (!formData[f]) {
        alert(`Please fill in ${f.replace(/([A-Z])/g, " $1").toLowerCase()}`);
        return;
      }
    }
    if (is10kw) {
      setShow10kvModal(true);
    } else {
      setShowPreview(true);
    }
  };


  const handleSubmitWithPDF = async (pdfBlob, sendWhatsAppFlag = false) => {
    setIsSubmittingToSheet(true);

    try {
      const fileName = `Quotation_${formData.customer || "Customer"}.pdf`;
      const url = await uploadPDFToDrive(pdfBlob, fileName);

      const originalBOM = productMap[formData.rating]?.bom || "";
      const isBOMModified = productDetails.bom && productDetails.bom !== originalBOM;
      const statusVal = isBOMModified ? 'Pending' : 'Approved';

      await submitToSheet(formData, url, statusVal);

      setSuccessMessage("Quotation created successfully!");

      if (sendWhatsAppFlag) {
        try {
          const quotationDataForWa = {
            contactNumber: formData.contactNo,
            beneficiaryName: formData.customer,
            quotationCopy: url,
            enquiryNumber: formData.enquiryNumber
          };
          await sendWhatsApp(quotationDataForWa);
          await updateSendStatus(formData.enquiryNumber, 'whatsapp');
        } catch (waError) {
          console.error("Auto WhatsApp Send Error:", waError);
          alert("Quotation saved, but failed to send WhatsApp automatically: " + waError.message);
        }
      }

      setFormData(prev => ({
        ...prev,
        customer: "",
        salesperson: "",
        contactNo: "",
        email: "",
        phoneNo: "",
        rating: "",
        qty: "1",
        enquiryNumber: "",
        generationGuarantee: "",
        moduleWattage: "",
        landNeeded: "",
        gridEmissionFactor: "",
        effectiveGST: "",
        gstOnOM: "",
        plantLife: "",
        gridTariffConservative: "",
        gridTariffHigher: "",
        plantCapacity: "",
        epcRate: "",
        comprehensiveOM: "",
      }));

      setShowPreview(false);
      fetchFMSData();

    } catch (error) {
      console.error("ERROR 👉", error);
      alert(error.message || "Something went wrong");
    } finally {
      setIsSubmittingToSheet(false);
    }
  };

  const handleSave10kv = async (formVal, productVal, pdfBlob, sendWhatsAppFlag = false) => {
    try {
      const fileName = `Quotation_10kv_${formVal.preparedFor || formVal.customer || "Customer"}.pdf`;
      const url = await uploadPDFToDrive(pdfBlob, fileName);
      if (!url) {
        throw new Error("Failed to upload PDF");
      }

      const originalBOM = productMap[formVal.rating]?.bom || "";
      const isBOMModified = productVal.bom && productVal.bom !== originalBOM;
      const statusVal = isBOMModified ? 'Pending' : 'Approved';

      const rowData = {
        enquiry_number: formVal.enquiryNumber,
        proposal_for: formVal.proposalFor || formVal.capacity || formVal.rating,
        prepared_for: formVal.preparedFor || formVal.customer,
        dated: formVal.dated || formVal.date,
        capacity_mwp: formVal.capacityMwp,
        module_count: formVal.moduleCount,
        land_acres: formVal.landAcres,
        annual_gen: formVal.annualGen,
        co2_tonnes: formVal.co2Tonnes,
        capacity_wp: formVal.capacityWp,
        tariff_low: formVal.tariffLow,
        savings_low: formVal.savingsLow,
        tariff_high: formVal.tariffHigh,
        savings_high: formVal.savingsHigh,
        capex_cr: formVal.capexCr,
        savings_25_low: formVal.savings25Low,
        savings_25_high: formVal.savings25High,
        price_material: formVal.priceMaterial,
        price_gst_supply: formVal.priceGstSupply,
        price_total_a: formVal.priceTotalA,
        price_om: formVal.priceOm,
        price_om_gst: formVal.priceOmGst,
        price_total_b: formVal.priceTotalB,
        price_total: formVal.priceTotal,
        price_words: formVal.priceWords,
        quatation_copy: url,
        status: statusVal,
      };

      // Also upsert to new_quatation_create to maintain FMS pipeline compatibility and status/BOM details
      const totalCostNum = parseFloat(formVal.priceTotal?.replace(/,/g, '')) || parseFloat(productVal.amount) || null;
      const rateNum = parseFloat(productVal.rate) || null;
      const amountNum = parseFloat(productVal.amount) || null;

      const quatationCreateRow = {
        actual: new Date().toISOString(),
        quotation_date: formVal.date || new Date().toISOString().split('T')[0],
        salesperson: formVal.salesperson,
        customer: formVal.preparedFor || formVal.customer,
        contact_no: formVal.contactNo,
        email: formVal.email,
        dealer: formVal.dealer,
        alternative_phone_no: formVal.phoneNo,
        structure_type: formVal.structureType || "Roof Top",
        place_of_installation: formVal.placeOfInstallation,
        terms_conditions: replacePlaceholders(formVal.termsConditions || "", formVal, productVal),
        product: formVal.rating,
        qty: 1,
        need_type: formVal.needType,
        reference_by: formVal.referenceBy,
        bank_name: formVal.bankAccount,
        account_no: formVal.accountNo,
        ifsc_code: formVal.ifscCode,
        branch: formVal.branch,
        general_terms_conditions: replacePlaceholders(formVal.generalTerms || "", formVal, productVal),
        // hours_of_failures: formVal.failureHours,
        load_details: formVal.loadDetails,
        product_name: productVal.productName || formVal.rating,
        bill_of_material: productVal.bom,
        size: productVal.size || `${formVal.plantCapacity} MWp`,
        rate: rateNum,
        amount: amountNum,
        enquiry_number: formVal.enquiryNumber,
        net_cost: totalCostNum,
        quatation_copy: url,
        is_10kv: true,
        status: statusVal,
      };

      const [res1, res2] = await Promise.all([
        supabase.from('quatation_10kw').upsert(rowData, { onConflict: 'enquiry_number' }),
        supabase.from('new_quatation_create').upsert(quatationCreateRow, { onConflict: 'enquiry_number' })
      ]);

      if (res1.error) throw res1.error;
      if (res2.error) throw res2.error;

      if (sendWhatsAppFlag) {
        try {
          const quotationDataForWa = {
            contactNumber: formVal.contactNo,
            beneficiaryName: formVal.preparedFor || formVal.customer,
            quotationCopy: url,
            enquiryNumber: formVal.enquiryNumber
          };
          await sendWhatsApp(quotationDataForWa);
          await updateSendStatus(formVal.enquiryNumber, 'whatsapp');
        } catch (waError) {
          console.error("Auto WhatsApp Send Error:", waError);
          alert("10kv Quotation saved, but failed to send WhatsApp automatically: " + waError.message);
        }
      }

      alert("10kv Quotation saved successfully!");
      setShow10kvModal(false);
      setViewMode("list");
      fetchFMSData();
    } catch (err) {
      console.error("Error saving 10kv quotation:", err);
      alert("Failed to save 10kv quotation: " + err.message);
    }
  };

  const fetchProductData = async () => {
    try {
      const { data, error } = await supabase.from('product_list').select('*').order('id', { ascending: true });
      if (error) throw error;

      const products = [];
      const pMap = {};

      (data || []).forEach(row => {
        const code = row.product_code ? String(row.product_code).trim() : "";
        const name = row.product_name ? String(row.product_name).trim() : "";

        // Determine primary key / label
        const primaryKey = code || name;

        if (primaryKey) {
          const productData = {
            productName: name || code,
            bom: row.bill_of_material || "",
            size: row.size || "",
            rate: row.selling_price || 0,
            gst: row.tax_percent || 0,
            centerSubsidy: row.center_subsidy || 0,
            stateSubsidy: row.state_subsidy || 0
          };

          // Add to dropdown options
          if (code) products.push(code);
          if (name && name !== code) products.push(name);

          // Map both code and name so lookup works regardless of what is selected or saved
          if (code) pMap[code] = productData;
          if (name) pMap[name] = productData;
        }
      });

      const uniqueProducts = [...new Set(products)];
      setDropdownOptions(prev => ({ ...prev, rating: uniqueProducts }));
      setProductMap(pMap);
    } catch (err) {
      console.error("❌ Error fetching product data:", err);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const { data, error } = await supabase.from('dropdown').select('*');
      if (error) throw error;

      if (data && data.length > 0) {
        // Unique values for each classification column
        const structureTypes = [...new Set(data.map(item => item.structure_type).filter(Boolean))];
        const roofTypes = [...new Set(data.map(item => item.roof_type).filter(Boolean))];
        const systemTypes = [...new Set(data.map(item => item.system_type).filter(Boolean))];
        const needTypes = [...new Set(data.map(item => item.need_type).filter(Boolean))];
        const projectModes = [...new Set(data.map(item => item.project_mode).filter(Boolean))];
        const stages = [...new Set(data.map(item => item.stage).filter(Boolean))];
        const statuses = [...new Set(data.map(item => item.status).filter(Boolean))];
        const vendors = [...new Set(data.map(item => item.vendor_name).filter(Boolean))];

        setDropdownOptions(prev => ({
          ...prev,
          structureType: structureTypes,
          roofType: roofTypes,
          systemType: systemTypes,
          needType: needTypes,
          projectMode: projectModes,
          stage: stages,
          status: statuses,
          salesperson: vendors
        }));
      }
    } catch (err) {
      console.error("❌ Error fetching dropdown data:", err);
    }
  };

  const fetchFMSDataForForm = async () => {
    try {
      const { data, error } = await supabase.from('fms').select('*');
      if (error) throw error;
      const customers = [];
      const cMap = {};
      const failureHours = new Set();
      const loadDetails = new Set();
      const places = new Set();

      data.forEach(row => {
        if (row.beneficiary_name) {
          customers.push(row.beneficiary_name);
          cMap[row.beneficiary_name] = {
            contactNo: row.beneficiary_number || row.contact_number || "",
            phoneNo: row.contact_number || "",
            dealer: row.address,
            email: row.bp_number,
            rating: row.present_load,
            qty: row.cspdcl_contract_demand,
            structureType: row.structure_type,
            needType: row.need_type,
            loadDetails: row.load_details,
            failureHours: row.failure_hours,
            placeOfInstallation: row.address,
            enquiryNumber: row.enquiry_number
          };
        }
        if (row.failure_hours) failureHours.add(row.failure_hours);
        if (row.load_details) loadDetails.add(row.load_details);
        if (row.address) places.add(row.address);
      });

      setDropdownOptions(prev => ({
        ...prev,
        customer: customers,
        failureHours: [...failureHours],
        loadDetails: [...loadDetails],
        placeOfInstallation: [...places]
      }));
      setCustomerMap(cMap);
    } catch (err) { console.error(err); }
  };

  const fetchDealerData = async () => {
    try {
      const { data, error } = await supabase.from('Master2').select('*');
      if (error) throw error;
      const dealers = [];
      const dMap = {};
      data.forEach(row => {
        if (row.dealer) {
          dealers.push(row.dealer);
          dMap[row.dealer] = {
            bankAccount: row.our_bank_name || "",
            accountNo: row.account_no || "",
            ifscCode: row.ifsc_code || "",
            branch: row.branch || ""
          };
        }
      });
      setDropdownOptions(prev => ({ ...prev, dealer: dealers }));
      setDealerBankMap(dMap);
    } catch (err) { console.error(err); }
  };


  useEffect(() => {
    fetchFMSData();
  }, []);

  useEffect(() => {
    if (viewMode === "form") {
      // const init = async () => {
      //   const no = await generateQuotationNumber();
      //   setFormData(prev => ({ ...prev, quotationNo: no, date: getCurrentDate() }));
      // };
      // init();
      fetchFMSDataForForm();
      fetchDealerData();
      fetchProductData();
      fetchDropdownData();
    }
  }, [viewMode]);

  useEffect(() => {
    let filtered = fmsData.filter(item => {
      if (activeTab === "pending") {
        return item.planned2 && !item.actual2;
      } else if (activeTab === "bom_approval") {
        return item.planned2 && item.actual2 && item.status === "Pending";
      } else if (activeTab === "director_approval") {
        return item.planned2 && item.actual2 && (item.directorApproval !== "Done");
      } else {
        return item.planned2 && item.actual2 && item.status !== "Pending";
      }
    });

    if (searchTerm.trim() !== "") {
      const t = searchTerm.toLowerCase();

      filtered = filtered.filter(i =>
        (i.enquiryNumber || "").toLowerCase().includes(t) ||
        (i.beneficiaryName || "").toLowerCase().includes(t) ||
        (i.contactNumber || "").toLowerCase().includes(t)
      );
    }

    setFilteredData(filtered);

  }, [fmsData, activeTab, searchTerm]);

  useEffect(() => {
    if (selectedEnquiry && viewMode === "form") {
      setFormData(prev => ({
        ...prev,
        customer: selectedEnquiry.beneficiaryName,
        contactNo: selectedEnquiry.beneficiaryNumber || selectedEnquiry.contactNumber || "",
        structureType: selectedEnquiry.structureType,
        placeOfInstallation: selectedEnquiry.address,
        rating: "",
        loadDetails: selectedEnquiry.loadDetails,
        failureHours: selectedEnquiry.hoursOfFailure,
        needType: selectedEnquiry.needType,
        qty: selectedEnquiry.qty || "1",
        enquiryNumber: selectedEnquiry.enquiryNumber,
        generationGuarantee: "",
        moduleWattage: "",
        landNeeded: "",
        gridEmissionFactor: "",
        effectiveGST: "",
        gstOnOM: "",
        plantLife: "",
        gridTariffConservative: "",
        gridTariffHigher: "",
        plantCapacity: "",
        epcRate: "",
        comprehensiveOM: "",
      }));
    }
  }, [selectedEnquiry, viewMode]);

  // Product Autofill Logic
  useEffect(() => {
    if (!formData.rating) {
      setProductDetails({
        productName: "",
        bom: "",
        size: "",
        gst: 0,
        rate: 0,
        amount: "0.00",
      });
      setFormData(prev => ({
        ...prev,
        subCentral: "",
        subState: ""
      }));
      return;
    }

    const p = productMap[formData.rating] || {};
    const qty = parseFloat(formData.qty || 0);
    const rate = parseFloat(p.rate || 0);

    setProductDetails({
      productName: p.productName || "",
      bom: p.bom || "",
      size: p.size || "",
      gst: p.gst || 0,
      rate: rate || 0,
      amount: (qty * rate).toFixed(2),
    });

    setFormData(prev => ({
      ...prev,
      subCentral: p.centerSubsidy !== undefined && p.centerSubsidy !== null ? String(p.centerSubsidy) : "",
      subState: p.stateSubsidy !== undefined && p.stateSubsidy !== null ? String(p.stateSubsidy) : ""
    }));
  }, [formData.rating, productMap]); // Removed formData.qty to prevent overwriting manual edits on qty change

  const handleCustomerChange = (e) => {
    const v = e.target.value;
    const d = customerMap[v] || {};
    setFormData(prev => ({
      ...prev,
      customer: v,
      contactNo: d.contactNo || "",
      phoneNo: d.phoneNo || "",
      dealer: d.dealer || "",
      email: d.email || "",
      rating: "",
      qty: d.qty || "",
      structureType: d.structureType || "",
      needType: d.needType || "",
      loadDetails: d.loadDetails || "",
      failureHours: d.failureHours || "",
      placeOfInstallation: d.placeOfInstallation || "",
      enquiryNumber: d.enquiryNumber || "",
      generationGuarantee: "",
      moduleWattage: "",
      landNeeded: "",
      gridEmissionFactor: "",
      effectiveGST: "",
      gstOnOM: "",
      plantLife: "",
      gridTariffConservative: "",
      gridTariffHigher: "",
      plantCapacity: "",
      epcRate: "",
      comprehensiveOM: "",
    }));
  };

  const handleDealerChange = (e) => {
    const v = e.target.value;
    const d = dealerBankMap[v] || {};
    setFormData(prev => ({
      ...prev,
      dealer: v,
      bankAccount: d.bankAccount || "",
      accountNo: d.accountNo || "",
      ifscCode: d.ifscCode || "",
      branch: d.branch || ""
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (e) => {
    const v = e.target.value;
    setFormData(prev => ({ ...prev, rating: v }));
  };

  const handleProductDetailsChange = (e) => {
    const { name, value } = e.target;
    setProductDetails((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "rate") {
        const qty = parseFloat(formData.qty || 0);
        const rate = parseFloat(value || 0);
        updated.amount = (qty * rate).toFixed(2);
      }
      return updated;
    });
  };

  const handleQuantityChange = (e) => {
    const v = e.target.value;
    setFormData((prev) => ({ ...prev, qty: v }));
    // Recalculate amount using current rate (which might be manually edited)
    setProductDetails((prev) => ({
      ...prev,
      amount: (parseFloat(v || 0) * parseFloat(prev.rate || 0)).toFixed(2),
    }));
  };

  const handleViewClick = (enquiry) => { setSelectedEnquiry(enquiry); setViewMode("form"); };
  const handleBackToList = () => { setViewMode("list"); setSelectedEnquiry(null); };
  const handleRefresh = () => fetchFMSData();

  const handleApproveBOM = async (enquiryNumber, is10kv) => {
    try {
      const confirmApproval = window.confirm(`Are you sure you want to approve the modified BOM for Enquiry No. ${enquiryNumber}?`);
      if (!confirmApproval) return;

      const [res1, res2] = await Promise.all([
        supabase.from('new_quatation_create').update({ status: 'Approved' }).eq('enquiry_number', enquiryNumber),
        supabase.from('quatation_10kw').update({ status: 'Approved' }).eq('enquiry_number', enquiryNumber)
      ]);

      if (res1.error) throw res1.error;

      alert(`BOM for Enquiry No. ${enquiryNumber} approved successfully.`);
      fetchFMSData();
    } catch (err) {
      console.error("Error approving BOM:", err);
      alert("Failed to approve BOM: " + err.message);
    }
  };

  const handleDirectorApproval = async (enquiryNumber, approvalStatus) => {
    try {
      const confirmAction = window.confirm(`Are you sure you want to set Director Approval to '${approvalStatus}' for Enquiry No. ${enquiryNumber}?`);
      if (!confirmAction) return;

      const updatePayload = {
        director_approval: approvalStatus
      };

      let updateError = null;

      const res1 = await supabase
        .from('new_quatation_create')
        .update(updatePayload)
        .eq('enquiry_number', enquiryNumber);

      if (res1.error) {
        updateError = res1.error;
      }

      await supabase
        .from('quatation_10kw')
        .update(updatePayload)
        .eq('enquiry_number', enquiryNumber);

      if (updateError) throw updateError;

      alert(`Director Approval set to '${approvalStatus}' for Enquiry No. ${enquiryNumber}`);
      fetchFMSData();
    } catch (err) {
      console.error("Error updating director approval:", err);
      alert("Failed to update Director Approval: " + err.message);
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {viewMode === "list" ? (
            <QuotationListView
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              fmsData={fmsData}
              filteredData={filteredData}
              loading={loading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleRefresh={handleRefresh}
              handleViewClick={handleViewClick}
              handleViewQuotation={handleViewQuotation}
              onOpen10kv={() => setShow10kvModal(true)}
              productMap={productMap}
              handleApproveBOM={handleApproveBOM}
              handleDirectorApproval={handleDirectorApproval}
            />
          ) : (
            <QuotationFormView
              formData={formData} setFormData={setFormData} productDetails={productDetails} setProductDetails={setProductDetails} handleProductDetailsChange={handleProductDetailsChange} selectedEnquiry={selectedEnquiry} handleBackToList={handleBackToList} successMessage={successMessage} dropdownOptions={dropdownOptions} salespersons={salespersons} handleCustomerChange={handleCustomerChange} handleDealerChange={handleDealerChange} handleChange={handleChange} handleProductChange={handleProductChange} handleQuantityChange={handleQuantityChange} handlePreview={handlePreview} getCurrentDate={getCurrentDate}
            />
          )}
          <SendQuotationModal
            showSendModal={showSendModal} setShowSendModal={setShowSendModal} selectedQuotation={selectedQuotation} sendingWhatsApp={sendingWhatsApp} sendingEmail={sendingEmail} sendingBoth={sendingBoth} handleSend={handleSend} handleSendBoth={handleSendBoth}
          />
        </div>
        {showPreview && (
          <QuotationPreview
            formData={formData} productDetails={productDetails} onClose={() => setShowPreview(false)} onSubmit={handleSubmitWithPDF} isSubmitting={isSubmittingToSheet}
          />
        )}
        {show10kvModal && (
          <Quotation10kvModal
            isOpen={show10kvModal}
            onClose={() => setShow10kvModal(false)}
            fmsData={fmsData}
            dropdownOptions={dropdownOptions}
            productMap={productMap}
            customerMap={customerMap}
            dealerBankMap={dealerBankMap}
            onSave={handleSave10kv}
            initialFormData={formData}
            initialProductDetails={productDetails}
          />
        )}
      </div>
    </AdminLayout>
  );
}

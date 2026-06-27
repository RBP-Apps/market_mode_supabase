import React, { useState, useEffect, useRef } from "react";
import { X, Eye, Save, Sparkles, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import CoverPage from "./ProposalPages/CoverPage";
import AboutPage from "./ProposalPages/AboutPage";
import TrackRecordPage from "./ProposalPages/TrackRecordPage";
import BoardroomPage from "./ProposalPages/BoardroomPage";
import ProjectGlancePage from "./ProposalPages/ProjectGlancePage";
import TechnicalSpecsPage from "./ProposalPages/TechnicalSpecsPage";
import TechnicalSpecsContPage from "./ProposalPages/TechnicalSpecsContPage";
import ScopeOfWorkPage from "./ProposalPages/ScopeOfWorkPage";
import IndicativeSavingsPage from "./ProposalPages/IndicativeSavingsPage";
import PriceSchedulePage from "./ProposalPages/PriceSchedulePage";
import GeneralTermsPage from "./ProposalPages/GeneralTermsPage";
import AcceptancePage from "./ProposalPages/AcceptancePage";
import ThankYouPage from "./ProposalPages/ThankYouPage";
import supabase from "../../utils/supabase";

// ─── Number to Words (Indian System) ─────────────────────────────────────────
function toWords(num) {
  if (!num || isNaN(num)) return "";
  const n = Math.round(parseFloat(num));
  if (n === 0) return "Zero Rupees Only";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function conv(x) {
    if (x === 0) return "";
    if (x < 20) return ones[x] + " ";
    if (x < 100) return tens[Math.floor(x / 10)] + (x % 10 ? " " + ones[x % 10] : "") + " ";
    return ones[Math.floor(x / 100)] + " Hundred " + conv(x % 100);
  }
  let result = "";
  let rem = n;
  if (rem >= 10000000) { result += conv(Math.floor(rem / 10000000)) + "Crore "; rem %= 10000000; }
  if (rem >= 100000) { result += conv(Math.floor(rem / 100000)) + "Lakh "; rem %= 100000; }
  if (rem >= 1000) { result += conv(Math.floor(rem / 1000)) + "Thousand "; rem %= 1000; }
  if (rem > 0) { result += conv(rem); }
  return "Rupees " + result.trim() + " Only";
}

export default function Quotation10kvModal({
  isOpen,
  onClose,
  fmsData,
  dropdownOptions,
  productMap,
  customerMap,
  dealerBankMap,
  onSave,
  initialFormData,
  initialProductDetails,
}) {
  const previewRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Pending enquiries for dropdown selection
  const pendingEnquiries = fmsData.filter((item) => item.planned2 && !item.actual2);

  // Form state
  const [formData, setFormData] = useState({
    enquiryNumber: initialFormData?.enquiryNumber || "",
    date: initialFormData?.date || new Date().toISOString().split("T")[0],
    salesperson: initialFormData?.salesperson || "",
    customer: initialFormData?.customer || "",
    contactNo: initialFormData?.contactNo || "",
    email: initialFormData?.email || "",
    dealer: initialFormData?.dealer || "",
    phoneNo: initialFormData?.phoneNo || "",
    structureType: initialFormData?.structureType || "",
    placeOfInstallation: initialFormData?.placeOfInstallation || "",
    capacity: initialFormData?.capacity || initialFormData?.proposalFor || initialFormData?.rating || "2.5 MWp",
    termsConditions:
      initialFormData?.termsConditions ||
      "On Grid:\n1. We will process for approval from competent authority for net metering. Any other approval is in your scope.\n2. Processing fee payable to CREDA/CSPDCL as applicable.\n3. Generation Guarantee of 1.5kWh/W per annum",
    rating: initialFormData?.rating || "",
    qty: initialFormData?.qty || "1",
    subCentral: initialFormData?.subCentral || "0",
    subState: initialFormData?.subState || "0",
    disc: initialFormData?.disc || "0",
    referenceBy: initialFormData?.referenceBy || "",
    bankAccount: initialFormData?.bankAccount || "",
    accountNo: initialFormData?.accountNo || "",
    ifscCode: initialFormData?.ifscCode || "",
    branch: initialFormData?.branch || "",
    loadDetails: initialFormData?.loadDetails || "",
    failureHours: initialFormData?.failureHours || "",
    needType: initialFormData?.needType || "",
    payment_mode: initialFormData?.payment_mode || "Chq/Online",
    generalTerms:
      initialFormData?.generalTerms ||
      "1. Power output from Control Panel will be in customers scope.\n2. Civil work other than Module Mounting Structure will be in customer's scope.\n3. Our offer is valid for 15 Days. Any custom specifications will be charged extra.\n4. Regular cleaning of Modules with plain water (soft) for desired generation guarantee in customer's scope.\n5. Detailed Quotation with engineering document will be provided on finalisation, for systems above 10KW.\n6. Subsidy (if any) is subject to government approval and will be directly credited in customer's account.\n7. Transportation inclusive. Insurance inclusive upto site and thereafter in customer's scope.\n8. Payment 50% advance on booking, Balance 50% against PI before dispatch of material.\n9. Delivery within 2 weeks from sanction and installation immediately thereafter.\n10. AMC inclusive for 5 years and chargeable thereafter.\n11. Structure height consider 5 feet, for additional height should charge extra.\n12. DC, AC, Earthing cable length considered 30 meter, for additional length should charge extra.",
    
    // 10 kW+ specific overrides
    proposalFor: initialFormData?.proposalFor || "",
    preparedFor: initialFormData?.preparedFor || "",
    dated: initialFormData?.dated || "",
    capacityMwp: initialFormData?.capacityMwp || "",
    moduleCount: initialFormData?.moduleCount || "",
    landAcres: initialFormData?.landAcres || "",
    annualGen: initialFormData?.annualGen || "",
    co2Tonnes: initialFormData?.co2Tonnes || "",
    capacityWp: initialFormData?.capacityWp || "",
    tariffLow: initialFormData?.tariffLow || "",
    savingsLow: initialFormData?.savingsLow || "",
    tariffHigh: initialFormData?.tariffHigh || "",
    savingsHigh: initialFormData?.savingsHigh || "",
    capexCr: initialFormData?.capexCr || "",
    savings25Low: initialFormData?.savings25Low || "",
    savings25High: initialFormData?.savings25High || "",
    priceMaterial: initialFormData?.priceMaterial || "",
    priceGstSupply: initialFormData?.priceGstSupply || "",
    priceTotalA: initialFormData?.priceTotalA || "",
    priceOm: initialFormData?.priceOm || "",
    priceOmGst: initialFormData?.priceOmGst || "",
    priceTotalB: initialFormData?.priceTotalB || "",
    priceTotal: initialFormData?.priceTotal || "",
    priceWords: initialFormData?.priceWords || "",
  });

  const [productDetails, setProductDetails] = useState({
    productName: initialProductDetails?.productName || "",
    bom: initialProductDetails?.bom || "",
    size: initialProductDetails?.size || "",
    gst: initialProductDetails?.gst || "0",
    rate: initialProductDetails?.rate || "0",
    amount: initialProductDetails?.amount || "0.00",
  });

  // Technical Specifications dynamic state
  const [specsData, setSpecsData] = useState([
    {
      id: "overview",
      title: "A. System Overview",
      rows: [
        { id: "type", label: "Type", value: "Solar PV power generating system" },
        { id: "capacity", label: "Solar array capacity (nominal)", value: "2.5 MWp (25,00,000 Wp) at Standard Test Conditions" },
        { id: "input_volt", label: "System input voltage", value: "180 VDC - 1500 VDC" },
        { id: "output_volt", label: "System output voltage (nominal)", value: "415 VAC, 50 Hz" },
        { id: "pcu_rating", label: "PCU rating", value: "2.5 MWp inverter with suitable MPPT charge controller; output 415 VAC, 50 Hz" }
      ]
    },
    {
      id: "modules",
      title: "B. Solar Array (Modules)",
      rows: [
        { id: "make", label: "Make of solar modules", value: "Premier / Rayzon / Waaree or equivalent" },
        { id: "origin", label: "Country of origin", value: "India" },
        { id: "mod_type", label: "Module type", value: "TOPCon Bifacial" },
        { id: "panel_out", label: "Single panel output (nominal)", value: "590-625 Wp at Standard Test Conditions" }
      ]
    },
    {
      id: "ajb",
      title: "C. Array & Main Junction Box (AJB / MJB)",
      rows: [
        { id: "ajb_type", label: "Type", value: "Array Junction Box (AJB) and control panels" },
        { id: "material", label: "Material", value: "AJB — thermoplastic polystyrene (part of inverter)" },
        { id: "hardware", label: "Hardware / accessories", value: "As required" },
        { id: "cable_entry", label: "Cable entry", value: "Through cable glands" },
        { id: "cable_glands", label: "Cable glands", value: "Polyamide or equivalent, suitable type and size" }
      ]
    },
    {
      id: "structure",
      title: "D. Module Mounting Structure",
      rows: [
        { id: "struct_type", label: "Type", value: "Ground mounting" },
        { id: "material", label: "Material", value: "Hot-dip galvanised steel (minimum 80 microns thickness)" },
        { id: "dimension", label: "Overall Dimension", value: "As per structural design drawing" },
        { id: "wind_rating", label: "Wind Rating", value: "150 km/h" },
        { id: "tilt", label: "Tilt Angle", value: "21–22° (fixed)" },
        { id: "foundation", label: "Foundation", value: "M15 concrete anchor / pile foundation" },
        { id: "no_structs", label: "No. of Structures", value: "As required" },
        { id: "hardware", label: "Hardware", value: "Stainless steel SS 304 fasteners" }
      ]
    },
    {
      id: "pcu",
      title: "E. Power Conditioning Unit (String Inverter)",
      rows: [
        { id: "pcu_rating", label: "PCU / Inverter Rating", value: "2.5 MWp inverter / 100 kW to 250 kW string inverters" },
        { id: "make", label: "Make", value: "Solis / Growatt / Sungrow / FIMER or equivalent" },
        { id: "charge_controller", label: "Charge Controller", value: "MPPT type (integrated)" },
        { id: "input_volt", label: "Array Input Voltage (Nominal)", value: "1000 VDC to 1500 VDC" },
        { id: "output_volt", label: "Output Voltage (Nominal)", value: "415 VAC, 3-phase, 50 Hz" },
        { id: "temp", label: "Operating Temperature", value: "0°C to 60°C" },
        { id: "efficiency", label: "Max Efficiency", value: "98.8%" }
      ]
    },
    {
      id: "cabling",
      title: "F. Cabling",
      rows: [
        { id: "type", label: "Type", value: "DC solar cable & AC power cable" },
        { id: "make", label: "Make", value: "Polycab / KEI / Havells or equivalent" },
        { id: "conductor", label: "Conductor", value: "Electrolytic grade copper (DC) / Aluminium (AC)" },
        { id: "insulation", label: "Insulation / Sheath", value: "XLPE insulation, UV resistant sheathing" },
        { id: "lugs", label: "Lugs for Termination", value: "Tinned copper / bi-metallic lugs" }
      ]
    }
  ]);

  const [specsDescription, setSpecsDescription] = useState(
    "All cables shall be sized to minimize voltage drop and power loss. Appropriate conduits, cable trays, and casing shall be provided for protection against weathering and mechanical damage. Earthing and lightning protection shall be installed as per CSPDCL / CEA guidelines."
  );

  // Synchronize capacity field updates automatically to default specs rows
  useEffect(() => {
    if (formData.capacity) {
      setSpecsData(prev => prev.map(section => {
        if (section.id === "overview") {
          return {
            ...section,
            rows: section.rows.map(row => {
              if (row.id === "capacity") {
                const isKW = formData.capacity.toLowerCase().includes("kw");
                const capNum = parseFloat(formData.capacity) || 2.5;
                const wpVal = isKW ? (capNum * 1000) : (capNum * 1000000);
                return {
                  ...row,
                  value: `${formData.capacity} (${wpVal.toLocaleString("en-IN")} Wp) at Standard Test Conditions`
                };
              }
              if (row.id === "pcu_rating") {
                return {
                  ...row,
                  value: `${formData.capacity} inverter with suitable MPPT charge controller; output 415 VAC, 50 Hz`
                };
              }
              return row;
            })
          };
        }
        if (section.id === "pcu") {
          return {
            ...section,
            rows: section.rows.map(row => {
              if (row.id === "pcu_rating") {
                return {
                  ...row,
                  value: `${formData.capacity} inverter / 100 kW to 250 kW string inverters`
                };
              }
              return row;
            })
          };
        }
        return section;
      }));
    }
  }, [formData.capacity]);

  // Technical Specs management functions
  const addSpecRow = (sectionId) => {
    setSpecsData(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          rows: [...section.rows, { id: `row_${Date.now()}`, label: "New Spec Key", value: "New Spec Value" }]
        };
      }
      return section;
    }));
  };

  const deleteSpecRow = (sectionId, rowId) => {
    setSpecsData(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          rows: section.rows.filter(row => row.id !== rowId)
        };
      }
      return section;
    }));
  };

  const moveSpecRow = (sectionId, index, direction) => {
    setSpecsData(prev => prev.map(section => {
      if (section.id === sectionId) {
        const rows = [...section.rows];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < rows.length) {
          const temp = rows[index];
          rows[index] = rows[targetIndex];
          rows[targetIndex] = temp;
        }
        return { ...section, rows };
      }
      return section;
    }));
  };

  const updateSpecRow = (sectionId, rowId, field, newVal) => {
    setSpecsData(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          rows: section.rows.map(row => row.id === rowId ? { ...row, [field]: newVal } : row)
        };
      }
      return section;
    }));
  };

  const updateSectionTitle = (sectionId, title) => {
    setSpecsData(prev => prev.map(section => {
      if (section.id === sectionId) {
        return { ...section, title };
      }
      return section;
    }));
  };

  const addSpecSection = () => {
    const nextChar = String.fromCharCode(65 + specsData.length);
    setSpecsData(prev => [
      ...prev,
      {
        id: `section_${Date.now()}`,
        title: `${nextChar}. New Specifications Section`,
        rows: [{ id: `row_${Date.now()}`, label: "New Key", value: "New Value" }]
      }
    ]);
  };

  const deleteSpecSection = (sectionId) => {
    setSpecsData(prev => prev.filter(section => section.id !== sectionId));
  };

  const moveSpecSection = (index, direction) => {
    const list = [...specsData];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < list.length) {
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      setSpecsData(list);
    }
  };


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
  }, [formData.rating, productMap]);

  // Recalculate amount if quantity or rating rate changes



  // Helper calculations
  const amount = parseFloat(productDetails.amount || 0);
  const disc = parseFloat(formData.disc || 0);
  const gstRaw = parseFloat(productDetails.gst || 0);
  const gstPct = gstRaw < 1 ? gstRaw * 100 : gstRaw;

  const afterDisc = amount - (amount * disc) / 100;
  const gstAmt = gstRaw < 1 ? afterDisc * gstRaw : (afterDisc * gstRaw) / 100;
  const grandTotal = afterDisc + gstAmt;

  const central = parseFloat(formData.subCentral || 0);
  const stateSub = parseFloat(formData.subState || 0);
  const netCost = grandTotal - central - stateSub;






  // Generate PDF blob by capturing each page component individually
  const buildPDFBlob = async () => {
    const previewContainer = previewRef.current;
    if (!previewContainer) throw new Error("Preview container not found");

    // Find all pages
    const pages = previewContainer.querySelectorAll("[data-pdf-page]");
    if (pages.length === 0) throw new Error("No pages found to generate PDF");

    try {
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        putOnlyUsedFonts: true,
        floatPrecision: 16,
      });

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i];

        // Render this specific page to canvas
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794,
          windowHeight: 1123,
          onclone: (clonedDoc) => {
            // Find the page in cloned document to reset transforms if any
            const clonedPage = clonedDoc.querySelector(`[data-pdf-page="${i + 1}"]`);
            if (clonedPage) {
              clonedPage.style.transform = "none";
              clonedPage.style.margin = "0";
              clonedPage.style.boxShadow = "none";
              clonedPage.style.border = "none";

              // Hide edit controls and buttons in cloned page
              const editControls = clonedPage.querySelectorAll(".spec-edit-controls, .spec-btn");
              editControls.forEach(el => {
                el.style.display = "none";
              });

              // Replace input and textarea elements with standard text/spans
              const inputs = clonedPage.querySelectorAll("input, textarea");
              inputs.forEach(input => {
                const span = clonedDoc.createElement("span");
                span.textContent = input.value;
                span.className = input.className;
                span.style.cssText = input.style.cssText;

                // If it is a textarea, preserve whitespaces
                if (input.tagName.toLowerCase() === "textarea") {
                  span.style.whiteSpace = "pre-wrap";
                }

                span.style.border = "none";
                span.style.background = "none";
                span.style.padding = "4px";
                span.style.display = "block";

                input.parentNode.replaceChild(span, input);
              });
            }
          }
        });

        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        const pdfWidth = 210;
        const pdfHeight = 297;

        // If not the first page, add a new page in jsPDF
        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      }

      return pdf.output("blob");
    } catch (err) {
      console.error("Critical PDF Gen Error:", err);
      throw err;
    }
  };

  const handleSaveClick = async () => {
    if (!formData.enquiryNumber) {
      alert("Please select or enter an Enquiry Number");
      return;
    }
    if (!formData.customer) {
      alert("Customer Name is required");
      return;
    }
    setIsGenerating(true);
    try {
      const pdfBlob = await buildPDFBlob();
      const updatedProductDetails = {
        ...productDetails,
        bom: JSON.stringify({ specsData, specsDescription })
      };
      await onSave(formData, updatedProductDetails, pdfBlob);
      onClose();
    } catch (err) {
      alert("Error generating and saving 10kv Quotation: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[290mm] h-[95vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-800 px-6 py-4 flex justify-between items-center shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">Create & Edit 10kV Quotation</h2>
              <p className="text-teal-100 text-xs mt-0.5">Customize details on the left and see the real-time PDF update on the right.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Workspace: Split Pane */}
        <div className="flex flex-1 overflow-hidden">

          {/* Right Pane: Live PDF Preview (100% Width) */}
          <div className="w-full bg-gray-200 overflow-y-auto p-6 flex flex-col items-center gap-6" ref={previewRef}>

            {/* Page 1 */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Page 1 of 13 (Cover Page)
              </div>
              <div className="shadow-2xl scale-90 origin-top" data-pdf-page="1" data-pdf-preview-10kv="true">
                <CoverPage formData={formData} />
              </div>
            </div>

            {/* Page 2 */}
            <div className="flex flex-col items-center gap-2 mt-8">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Page 2 of 13 (About RBP Energy)
              </div>
              <div className="shadow-2xl scale-90 origin-top" data-pdf-page="2" data-pdf-preview-10kv="true">
                <AboutPage />
              </div>
            </div>

            {/* Page 3 */}
            <div className="flex flex-col items-center gap-2 mt-8">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Page 3 of 13 (Track Record at a Glance)
              </div>
              <div className="shadow-2xl scale-90 origin-top" data-pdf-page="3" data-pdf-preview-10kv="true">
                <TrackRecordPage />
              </div>
            </div>

            {/* Page 4 */}
            <div className="flex flex-col items-center gap-2 mt-8">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Page 4 of 13 (The Boardroom)
              </div>
              <div className="shadow-2xl scale-90 origin-top" data-pdf-page="4" data-pdf-preview-10kv="true">
                <BoardroomPage />
              </div>
            </div>

            {/* Page 5 */}
            <div className="flex flex-col items-center gap-2 mt-8">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Page 5 of 13 (Your Project at a Glance)
              </div>
              <div className="shadow-2xl scale-90 origin-top" data-pdf-page="5" data-pdf-preview-10kv="true">
                <ProjectGlancePage formData={formData} />
              </div>
            </div>

            {/* Page 6 */}
            <div className="flex flex-col items-center gap-2 mt-8">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Page 6 of 13 (Technical Specifications)
              </div>
              <div className="shadow-2xl scale-90 origin-top" data-pdf-page="6" data-pdf-preview-10kv="true">
                <TechnicalSpecsPage
                  specsData={specsData}
                  onUpdateTitle={updateSectionTitle}
                  onUpdateRow={updateSpecRow}
                  onDeleteRow={deleteSpecRow}
                  onMoveRow={moveSpecRow}
                  onAddRow={addSpecRow}
                  onDeleteSection={deleteSpecSection}
                  onMoveSection={moveSpecSection}
                />
              </div>
            </div>

            {/* Page 7 */}
            <div className="flex flex-col items-center gap-2 mt-8">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Page 7 of 13 (Technical Specifications Continuation)
              </div>
              <div className="shadow-2xl scale-90 origin-top" data-pdf-page="7" data-pdf-preview-10kv="true">
                <TechnicalSpecsContPage
                  specsData={specsData}
                  description={specsDescription}
                  onUpdateTitle={updateSectionTitle}
                  onUpdateRow={updateSpecRow}
                  onDeleteRow={deleteSpecRow}
                  onMoveRow={moveSpecRow}
                  onAddRow={addSpecRow}
                  onDeleteSection={deleteSpecSection}
                  onMoveSection={moveSpecSection}
                  onAddSection={addSpecSection}
                  onUpdateDescription={setSpecsDescription}
                />
              </div>
            </div>

            {/* Page 8 */}
            <div className="flex flex-col items-center gap-2 mt-8">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Page 8 of 13 (Scope of Work)
              </div>
              <div className="shadow-2xl scale-90 origin-top" data-pdf-page="8" data-pdf-preview-10kv="true">
                <ScopeOfWorkPage />
              </div>
            </div>

            {/* Page 9 */}
            <div className="flex flex-col items-center gap-2 mt-8">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Page 9 of 13 (Indicative Generation, Savings & Payback)
              </div>
              <div className="shadow-2xl scale-90 origin-top" data-pdf-page="9" data-pdf-preview-10kv="true">
                <IndicativeSavingsPage formData={formData} productDetails={productDetails} />
              </div>
            </div>

            {/* Page 10 */}
            <div className="flex flex-col items-center gap-2 mt-8">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Page 10 of 13 (Price Schedule)
              </div>
              <div className="shadow-2xl scale-90 origin-top" data-pdf-page="10" data-pdf-preview-10kv="true">
                <PriceSchedulePage formData={formData} productDetails={productDetails} />
              </div>
            </div>

            {/* Page 11 */}
            <div className="flex flex-col items-center gap-2 mt-8">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Page 11 of 13 (General & Commercial Terms)
              </div>
              <div className="shadow-2xl scale-90 origin-top" data-pdf-page="11" data-pdf-preview-10kv="true">
                <GeneralTermsPage />
              </div>
            </div>

            {/* Page 12 */}
            <div className="flex flex-col items-center gap-2 mt-8">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Page 12 of 13 (Acceptance)
              </div>
              <div className="shadow-2xl scale-90 origin-top" data-pdf-page="12" data-pdf-preview-10kv="true">
                <AcceptancePage formData={formData} />
              </div>
            </div>

            {/* Page 13 */}
            <div className="flex flex-col items-center gap-2 mt-8">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Page 13 of 13 (Thank You)
              </div>
              <div className="shadow-2xl scale-90 origin-top" data-pdf-page="13" data-pdf-preview-10kv="true">
                <ThankYouPage />
              </div>
            </div>

          </div>

        </div>

        {/* Footer actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors text-sm font-medium flex items-center gap-1.5"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            disabled={isGenerating}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-700 to-emerald-800 text-white rounded-xl hover:from-teal-800 hover:to-emerald-900 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 text-sm font-bold shadow-lg hover:shadow-xl"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save & Generate 10kV Quotation
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import QuotationPreview from "../components/layout/QuotationPreview";
import supabase from "../utils/supabase";
import AdminLayout from "../components/layout/AdminLayout";
import QuotationListView from "../components/QuotationCreate/QuotationListView";
import QuotationFormView from "../components/QuotationCreate/QuotationFormView";
import SendQuotationModal from "../components/QuotationCreate/SendQuotationModal";

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
  const [salespersons, setSalespersons] = useState(["S N Sahu"]);

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
    qty: "",
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
  });

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
    const { data, error } = await supabase
      .from('quatation_create')
      .select('enquiry_number, planned_2, actual_2, quatation_copy');

    if (error) throw error;

    const quotationMap = {};
    if (data) {
      data.forEach(row => {
        quotationMap[row.enquiry_number] = {
          planned2: row.planned_2,
          actual2: row.actual_2,
          quotationCopy: row.quatation_copy
        };
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
    const quotationMap = await fetchQuotationCopyData();

    const { data: fmsRows, error: fmsError } = await supabase
      .from("fms")
      .select("*")
      .not('planned_1', 'is', null);

    if (fmsError) throw fmsError;

    const formattedData = fmsRows.map((row) => {
      const qData = quotationMap[row.enquiry_number] || {};

      return {
        id: row.id,
        enquiryNumber: row.enquiry_number || "",
        beneficiaryName: row.beneficiary_name || "",
        address: row.address || "",
        villageBlock: row.village_block || "",
        district: row.district || "",
        contactNumber: row.contact_number || "",
        presentLoad: row.present_load || "",
        structureType: row.structure_type || "",
        loadDetails: row.load_details || "",
        hoursOfFailure: row.failure_hours || "",
        needType: row.need_type || "",
        qty: row.cspdcl_contract_demand || "",
        projectMode: row.project_mode || "",
        systemType: row.system_type || "",
        roofType:  row.roof_type || "",
        futureLoadRequirement: row.future_load_requirement || "",
        avgElectricityBill: row.avg_electricity_bill || "",
        cspdclContractDemand: row.cspdcl_contract_demand || "",
        bpNumber : row.bp_number || "",
        

        // 🔥 IMPORTANT (NEW)
        planned2: qData.planned2 || null,
        actual2: qData.actual2 || null,
        quotationCopy: qData.quotationCopy || null,

        // old fields
        planned1: row.planned_1 || "",
        actual1: row.actual_1 || "",
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
      .from('quatation_create')
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
      .from('quatation_create')
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

  const handleSend = async (sendType, quotationData) => {
    if (sendType === 'whatsapp') setSendingWhatsApp(true);
    else if (sendType === 'email') setSendingEmail(true);
    try {
      await updateSendStatus(quotationData.enquiryNumber, sendType);
      setShowSendModal(false);
      setSelectedQuotation(null);
      alert(`${sendType === 'whatsapp' ? 'WhatsApp' : 'Email'} status updated!`);
    } catch (error) {
      alert("Error occurred. Please try again.");
    } finally {
      if (sendType === 'whatsapp') setSendingWhatsApp(false);
      else if (sendType === 'email') setSendingEmail(false);
    }
  };

  const handleSendBoth = async (quotationData) => {
    setSendingBoth(true);
    try {
      await updateSendStatus(quotationData.enquiryNumber, "whatsapp");
      await updateSendStatus(quotationData.enquiryNumber, "email");
      setShowSendModal(false);
      setSelectedQuotation(null);
      alert("WhatsApp and Email status updated!");
    } catch (error) {
      alert("Error occurred. Please try again.");
    } finally {
      setSendingBoth(false);
    }
  };

  const handleViewQuotation = (row) => {
    setSelectedQuotation(row);
    setShowSendModal(true);
  };

  const submitToSheet = async (formDataToSubmit, quotationCopyUrl = null) => {
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
      actual_2: new Date().toISOString(),
      quotation_date: formDataToSubmit.date,
      salesperson: formDataToSubmit.salesperson,
      customer: formDataToSubmit.customer,
      contact_no: formDataToSubmit.contactNo,
      email: formDataToSubmit.email,
      dealer: formDataToSubmit.dealer,
      alternative_phone_no: formDataToSubmit.phoneNo,
      structure_type: formDataToSubmit.structureType,
      place_of_installation: formDataToSubmit.placeOfInstallation,
      terms_conditions: formDataToSubmit.termsConditions,
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
      general_terms_conditions: formDataToSubmit.generalTerms,
      hours_of_failures: formDataToSubmit.failureHours,
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
    };

    const { error } = await supabase
      .from('quatation_create')
      .upsert(rowData, { onConflict: 'enquiry_number' });
    if (error) throw error;
  };

  const handlePreview = (e) => {
    e.preventDefault();
    const required = ["salesperson", "customer", "contactNo", "structureType", "rating", "qty"];
    for (const f of required) {
      if (!formData[f]) {
        alert(`Please fill in ${f.replace(/([A-Z])/g, " $1").toLowerCase()}`);
        return;
      }
    }
    setShowPreview(true);
  };


  const handleSubmitWithPDF = async (pdfBlob) => {
  setIsSubmittingToSheet(true);

  try {
    const fileName = `Quotation_${formData.customer || "Customer"}.pdf`;
    const url = await uploadPDFToDrive(pdfBlob, fileName);

    await submitToSheet(formData, url);

    setSuccessMessage("Quotation created successfully!");

    setFormData(prev => ({
      ...prev,
      customer: "",
      salesperson: "",
      contactNo: "",
      email: "",
      phoneNo: "",
      rating: "",
      qty: "",
      enquiryNumber: ""
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

  const fetchProductData = async () => {
    try {
      const { data, error } = await supabase.from('product_list').select('*');
      if (error) throw error;
      
      const products = [];
      const pMap = {};
      
      data.forEach(row => {
        if (row.product_code) {
          products.push(row.product_code);
          pMap[row.product_code] = {
            productName: row.product_name || "",
            bom: row.bill_of_material || "",
            size: row.size || "",
            rate: row.selling_price || 0,
            gst: row.tax_percent || 0
          };
        }
      });
      
      setDropdownOptions(prev => ({ ...prev, rating: products }));
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
            contactNo: row.contact_number, 
            phoneNo: row.contact_number, 
            dealer: row.address, 
            email: row.bp_number, 
            rating: row.present_load, 
            qty: row.cspdcl_contract_demand, 
            structureType: row.structure_type, 
            needType: row.need_type 
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
    } else {
      return item.planned2 && item.actual2;
    }
  });

  if (searchTerm.trim() !== "") {
    const t = searchTerm.toLowerCase();

    filtered = filtered.filter(i =>
      (i.enquiryNumber || "").toLowerCase().includes(t) ||
      (i.beneficiaryName || "").toLowerCase().includes(t)
    );
  }

  setFilteredData(filtered);

}, [fmsData, activeTab, searchTerm]);

  useEffect(() => {
    if (selectedEnquiry && viewMode === "form") {
      setFormData(prev => ({
        ...prev,
        customer: selectedEnquiry.beneficiaryName, 
        contactNo: selectedEnquiry.contactNumber, 
        structureType: selectedEnquiry.structureType, 
        placeOfInstallation: selectedEnquiry.address, 
        rating: selectedEnquiry.presentLoad, 
        loadDetails: selectedEnquiry.loadDetails, 
        failureHours: selectedEnquiry.hoursOfFailure, 
        needType: selectedEnquiry.needType, 
        qty: selectedEnquiry.qty,
        enquiryNumber: selectedEnquiry.enquiryNumber
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
      rating: d.rating || "", 
      qty: d.qty || "", 
      structureType: d.structureType || "", 
      needType: d.needType || "" 
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

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {viewMode === "list" ? (
            <QuotationListView
              activeTab={activeTab} setActiveTab={setActiveTab} fmsData={fmsData} filteredData={filteredData} loading={loading} searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleRefresh={handleRefresh} handleViewClick={handleViewClick} handleViewQuotation={handleViewQuotation}
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
      </div>
    </AdminLayout>
  );
}

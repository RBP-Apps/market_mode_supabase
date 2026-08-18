import React from "react";
import { ArrowLeft, FileSignature, Printer, Download, CheckCircle, Trash2, Eye, Zap, FileText, TrendingUp, Coins } from "lucide-react";
import QuotationInfoSection from "./QuotationInfoSection";
import CustomerDetailsSection from "./CustomerDetailsSection";
import InstallationDetailsSection from "./InstallationDetailsSection";
import PowerLoadInfoSection from "./PowerLoadInfoSection";
import CostCalculationSection from "./CostCalculationSection";
import HybridSelector from "./HybridSelector";

export default function QuotationFormView({
  isEditMode,
  formData,
  setFormData,
  productDetails,
  setProductDetails,
  handleProductDetailsChange,
  selectedEnquiry,
  handleBackToList,
  successMessage,
  dropdownOptions,
  salespersons,
  handleCustomerChange,
  handleDealerChange,
  handleChange,
  handleProductChange,
  handleQuantityChange,
  handlePreview,
  getCurrentDate,
}) {
  // Enhanced styling classes
  const sectionClass =
    "bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 relative";
  const sectionHeaderClass =
    "bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-xl";
  const sectionTitleClass =
    "text-white font-semibold flex items-center text-lg";
  const labelClass = "block text-sm font-medium text-gray-600 mb-1.5";
  const inputClass =
    "w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-gray-700";
  const selectClass =
    "w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-gray-700 appearance-none cursor-pointer";

  return (
    <>
      {/* Header with Back Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBackToList}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Back to list"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {isEditMode
                ? `Edit Quotation for ${formData.customer || selectedEnquiry?.beneficiaryName || "Customer"}`
                : selectedEnquiry
                  ? `Create Quotation for ${selectedEnquiry.beneficiaryName}`
                  : "Create New Quotation"}
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <FileSignature className="h-4 w-4" />
              {isEditMode
                ? "Modify prefilled quotation data. Saving will create a new quotation copy."
                : "Fill in the details to generate a professional quotation"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2 shadow-sm">
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2 shadow-sm">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg flex items-center shadow-md animate-pulse">
          <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      <form className="space-y-6">
        {/* Product Selection */}
        <div className={`${sectionClass} z-[25]`}>
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 rounded-t-xl">
            <h2 className={sectionTitleClass}>
              <Zap className="h-5 w-5 mr-2" />
              Product Selection
            </h2>
          </div>
          <div className="p-6">
            <div className="max-w-md">
              <HybridSelector
                label="Product"
                name="rating"
                value={formData.rating}
                onChange={handleProductChange}
                options={dropdownOptions.rating}
                icon={Zap}
                required={true}
                inputClass={inputClass}
                selectClass={selectClass}
                labelClass={labelClass}
              />
            </div>
          </div>
        </div>

        <CustomerDetailsSection
          formData={formData}
          handleChange={handleChange}
          handleCustomerChange={handleCustomerChange}
          handleDealerChange={handleDealerChange}
          salespersons={salespersons}
          dropdownOptions={dropdownOptions}
          sectionClass={`${sectionClass} z-[24]`}
          sectionTitleClass={sectionTitleClass}
          labelClass={labelClass}
          inputClass={inputClass}
          selectClass={selectClass}
        />

        {(() => {
          const rating = formData.rating;
          const isMoreThan10KW = (r) => {
            if (!r) return false;
            const match = r.match(/(\d+(?:\.\d+)?)\s*(?:KW|MW|KV|KVp|KWp|Wp|W)/i);
            if (match) {
              const value = parseFloat(match[1]);
              const isMW = /MW/i.test(r);
              if (isMW) return true;
              return value >= 10;
            }
            return false;
          };

          if (isMoreThan10KW(rating)) {
            return (
              <>

                <div className={`${sectionClass} z-[23]`}>
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-xl">
                    <h2 className={sectionTitleClass}>
                      <FileText className="h-5 w-5 mr-2" />
                      PRIMARY INPUTS (Edit Every Proposal)
                    </h2>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Prepared For */}
                    <div>
                      <label className={labelClass}>Prepared For</label>
                      <input
                        type="text"
                        name="preparedFor"
                        value={formData.preparedFor || ""}
                        onChange={handleChange}
                        placeholder="e.g. Mr. Subham Singhal"
                        className={inputClass}
                      />
                    </div>

                    {/* Proposal Date */}
                    <div>
                      <label className={labelClass}>Proposal Date</label>
                      <input
                        type="date"
                        name="dated"
                        value={formData.dated || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    {/* Plant Capacity */}
                    <div>
                      <label className={labelClass}>Plant Capacity (MWp)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="plantCapacity"
                        value={formData.plantCapacity || ""}
                        onChange={handleChange}
                        placeholder="e.g. 1.5"
                        className={inputClass}
                      />
                    </div>

                    {/* EPC Rate */}
                    <div>
                      <label className={labelClass}>EPC Rate (₹ per Wp)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="epcRate"
                        value={formData.epcRate || ""}
                        onChange={handleChange}
                        placeholder="e.g. 32"
                        className={inputClass}
                      />
                    </div>

                    {/* Comprehensive O&M */}
                    <div>
                      <label className={labelClass}>Comprehensive O&M – Lump Sum (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="comprehensiveOM"
                        value={formData.comprehensiveOM || ""}
                        onChange={handleChange}
                        placeholder="e.g. 500000"
                        className={inputClass}
                      />
                    </div>

                    {/* Grid Tariff Conservative */}
                    <div>
                      <label className={labelClass}>Grid Tariff – Conservative (₹/unit)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="gridTariffConservative"
                        value={formData.gridTariffConservative || ""}
                        onChange={handleChange}
                        placeholder="e.g. 7.50"
                        className={inputClass}
                      />
                    </div>

                    {/* Grid Tariff Higher */}
                    <div>
                      <label className={labelClass}>Grid Tariff – Higher (₹/unit)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="gridTariffHigher"
                        value={formData.gridTariffHigher || ""}
                        onChange={handleChange}
                        placeholder="e.g. 9.00"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>


                <div className={`${sectionClass} z-[22]`}>
                  <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-4 rounded-t-xl">
                    <h2 className={sectionTitleClass}>
                      <Zap className="h-5 w-5 mr-2" />
                      Assumptions
                    </h2>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Generation Guarantee */}
                    <div>
                      <label className={labelClass}>
                        Generation Guarantee (kWh per kWp / yr)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="generationGuarantee"
                        value={formData.generationGuarantee || ""}
                        onChange={handleChange}
                        placeholder="e.g. 1500"
                        className={inputClass}
                      />
                    </div>

                    {/* Module Wattage */}
                    <div>
                      <label className={labelClass}>Module Wattage (Wp)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="moduleWattage"
                        value={formData.moduleWattage || ""}
                        onChange={handleChange}
                        placeholder="e.g. 600"
                        className={inputClass}
                      />
                    </div>

                    {/* Land Needed */}
                    <div>
                      <label className={labelClass}>Land Needed (Acres per MW)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="landNeeded"
                        value={formData.landNeeded || ""}
                        onChange={handleChange}
                        placeholder="e.g. 4.5"
                        className={inputClass}
                      />
                    </div>

                    {/* Grid Emission Factor */}
                    <div>
                      <label className={labelClass}>
                        Grid Emission Factor (kg CO₂ / kWh)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        name="gridEmissionFactor"
                        value={formData.gridEmissionFactor || ""}
                        onChange={handleChange}
                        placeholder="e.g. 0.716"
                        className={inputClass}
                      />
                    </div>

                    {/* Effective GST */}
                    <div>
                      <label className={labelClass}>
                        Effective GST on Supply & Install (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="effectiveGST"
                        value={formData.effectiveGST || ""}
                        onChange={handleChange}
                        placeholder="e.g. 13.8"
                        className={inputClass}
                      />
                    </div>

                    {/* GST on O&M */}
                    <div>
                      <label className={labelClass}>GST on O&M (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="gstOnOM"
                        value={formData.gstOnOM || ""}
                        onChange={handleChange}
                        placeholder="e.g. 18"
                        className={inputClass}
                      />
                    </div>

                    {/* Plant Life */}
                    <div>
                      <label className={labelClass}>
                        Plant Life for Savings (Years)
                      </label>
                      <input
                        type="number"
                        name="plantLife"
                        value={formData.plantLife || ""}
                        onChange={handleChange}
                        placeholder="e.g. 25"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>


                <div className={`${sectionClass} z-[21]`}>
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4 rounded-t-xl">
                    <h2 className={sectionTitleClass}>
                      <TrendingUp className="h-5 w-5 mr-2" />
                      CALCULATED OUTPUTS
                    </h2>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">

                    <div>
                      <label className={labelClass}>Capacity (Wp)</label>
                      <input
                        type="number"
                        name="capacityWp"
                        value={formData.capacityWp || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Capacity (kWp)</label>
                      <input
                        type="number"
                        name="capacityKwp"
                        value={formData.capacityKwp || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Module Count (Exact)</label>
                      <input
                        type="number"
                        name="moduleCountExact"
                        value={formData.moduleCountExact || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Module Count (Rounded)</label>
                      <input
                        type="number"
                        name="moduleCountRounded"
                        value={formData.moduleCountRounded || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Annual Generation (kWh)</label>
                      <input
                        type="number"
                        name="annualGeneration"
                        value={formData.annualGeneration || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Annual Generation (Lakh Units)</label>
                      <input
                        type="number"
                        name="annualGenerationLakhUnits"
                        value={formData.annualGenerationLakhUnits || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Land Required (Acres)</label>
                      <input
                        type="number"
                        name="landRequired"
                        value={formData.landRequired || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>CO₂ Avoided (Tonnes / Yr)</label>
                      <input
                        type="number"
                        name="co2Avoided"
                        value={formData.co2Avoided || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Material Cost (₹)</label>
                      <input
                        type="number"
                        name="materialCost"
                        value={formData.materialCost || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>GST on Material (₹)</label>
                      <input
                        type="number"
                        name="gstOnMaterial"
                        value={formData.gstOnMaterial || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Total A – System (₹)</label>
                      <input
                        type="number"
                        name="totalASystem"
                        value={formData.totalASystem || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>O&M (₹)</label>
                      <input
                        type="number"
                        name="omCost"
                        value={formData.omCost || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>GST on O&M (₹)</label>
                      <input
                        type="number"
                        name="gstOnOMAmount"
                        value={formData.gstOnOMAmount || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Total B – COMC (₹)</label>
                      <input
                        type="number"
                        name="totalBComc"
                        value={formData.totalBComc || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass}>TOTAL PROJECT COST A+B (₹)</label>
                      <input
                        type="number"
                        name="totalProjectCost"
                        value={formData.totalProjectCost || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Annual Savings – Conservative (₹)</label>
                      <input
                        type="number"
                        name="annualSavingsConservative"
                        value={formData.annualSavingsConservative || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Annual Savings – Higher (₹)</label>
                      <input
                        type="number"
                        name="annualSavingsHigher"
                        value={formData.annualSavingsHigher || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Simple Payback – Conservative (Yrs)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="simplePaybackConservative"
                        value={formData.simplePaybackConservative || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Simple Payback – Higher (Yrs)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="simplePaybackHigher"
                        value={formData.simplePaybackHigher || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass}>25-Year Gross Savings – Conservative (₹)</label>
                      <input
                        type="number"
                        name="grossSavings25Conservative"
                        value={formData.grossSavings25Conservative || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass}>25-Year Gross Savings – Higher (₹)</label>
                      <input
                        type="number"
                        name="grossSavings25Higher"
                        value={formData.grossSavings25Higher || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                  </div>
                </div>

                {/* Card 4: Pricing Schedule */}
                <div className={`${sectionClass} z-[20]`}>
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 rounded-t-xl">
                    <h2 className={sectionTitleClass}>
                      <Coins className="h-5 w-5 mr-2" />
                      Amount in words — helper
                    </h2>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

                    <div>
                      <label className={labelClass}>Crore</label>
                      <input
                        type="text"
                        name="crore"
                        value={formData.crore || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Lakh</label>
                      <input
                        type="text"
                        name="lakh"
                        value={formData.lakh || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Thousand</label>
                      <input
                        type="text"
                        name="thousand"
                        value={formData.thousand || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Hundred</label>
                      <input
                        type="text"
                        name="hundred"
                        value={formData.hundred || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Rest</label>
                      <input
                        type="text"
                        name="rest"
                        value={formData.rest || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Crore Hundreds</label>
                      <input
                        type="text"
                        name="croreHundreds"
                        value={formData.croreHundreds || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass}>Crore Remainder</label>
                      <input
                        type="text"
                        name="croreRemainder"
                        value={formData.croreRemainder || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className={labelClass}>Amount in Words</label>
                      <textarea
                        name="amountInWords"
                        value={formData.amountInWords || ""}
                        onChange={handleChange}
                        className={`${inputClass} h-20 resize-none`}
                      />
                    </div>

                  </div>
                </div>
              </>
            );
          } else {
            return (
              <>
                <QuotationInfoSection
                  formData={formData}
                  handleChange={handleChange}
                  sectionClass={`${sectionClass} z-[23]`}
                  sectionHeaderClass={sectionHeaderClass}
                  sectionTitleClass={sectionTitleClass}
                  labelClass={labelClass}
                  inputClass={inputClass}
                />

                <InstallationDetailsSection
                  formData={formData}
                  handleChange={handleChange}
                  dropdownOptions={dropdownOptions}
                  sectionClass={`${sectionClass} z-[22]`}
                  sectionTitleClass={sectionTitleClass}
                  labelClass={labelClass}
                  inputClass={inputClass}
                  selectClass={selectClass}
                />

                <PowerLoadInfoSection
                  formData={formData}
                  handleChange={handleChange}
                  handleProductChange={handleProductChange}
                  handleQuantityChange={handleQuantityChange}
                  productDetails={productDetails}
                  handleProductDetailsChange={handleProductDetailsChange}
                  dropdownOptions={dropdownOptions}
                  sectionClass={`${sectionClass} z-[21]`}
                  sectionTitleClass={sectionTitleClass}
                  labelClass={labelClass}
                  inputClass={inputClass}
                  selectClass={selectClass}
                />

                <CostCalculationSection
                  formData={formData}
                  productDetails={productDetails}
                  sectionClass={`${sectionClass} z-[20]`}
                  sectionTitleClass={sectionTitleClass}
                />
              </>
            );
          }
        })()}

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  date: getCurrentDate(),
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
                  generalTerms:
                    "1. Power output from Control Panel will be in customers scope.\n2. Civil work other than Module Mounting Structure will be in customer's scope.\n3. Our offer is valid for 15 Days. Any custom specifications will be charged extra.\n4. Regular cleaning of Modules with plain water (soft) for desired generation guarantee in customer's scope.\n5. Detailed Quotation with engineering document will be provided on finalisation, for systems above 10KW.\n6. Subsidy (if any) is subject to government approval and will be directly credited in customer's account.\n7. Transportation inclusive. Insurance inclusive upto site and thereafter in customer's scope.\n8. Payment 50% advance on booking, Balance 50% against PI before dispatch of material.\n9. Delivery within 2 weeks from sanction and installation immediately thereafter.\n10. AMC inclusive for 5 years and chargeable thereafter.\n11. Structure height consider 5 feet, for additional height should charge extra.\n12. DC cable length 40 meter, AC cable length 30 meter, and earthing cable length 50 meter considered; any additional length will be charged extra.",
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
                });
                setProductDetails({
                  productName: "",
                  bom: "",
                  size: "",
                  gst: "",
                  rate: "",
                  amount: "",
                });
              }}
              className="px-6 py-3 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2 shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              Clear Form
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePreview}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl text-base font-medium"
            >
              <Eye className="h-5 w-5" />
              Preview & Submit
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

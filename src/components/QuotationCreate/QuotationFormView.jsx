import React from "react";
import { ArrowLeft, FileSignature, Printer, Download, CheckCircle, Trash2, Eye } from "lucide-react";
import QuotationInfoSection from "./QuotationInfoSection";
import CustomerDetailsSection from "./CustomerDetailsSection";
import InstallationDetailsSection from "./InstallationDetailsSection";
import PowerLoadInfoSection from "./PowerLoadInfoSection";
import CostCalculationSection from "./CostCalculationSection";

export default function QuotationFormView({
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
    "bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300";
  const sectionHeaderClass =
    "bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4";
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
              {selectedEnquiry
                ? `Create Quotation for ${selectedEnquiry.beneficiaryName}`
                : "Create New Quotation"}
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <FileSignature className="h-4 w-4" />
              Fill in the details to generate a professional quotation
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
        <QuotationInfoSection
          formData={formData}
          handleChange={handleChange}
          sectionClass={sectionClass}
          sectionHeaderClass={sectionHeaderClass}
          sectionTitleClass={sectionTitleClass}
          labelClass={labelClass}
          inputClass={inputClass}
        />

        <CustomerDetailsSection
          formData={formData}
          handleChange={handleChange}
          handleCustomerChange={handleCustomerChange}
          handleDealerChange={handleDealerChange}
          salespersons={salespersons}
          dropdownOptions={dropdownOptions}
          sectionClass={sectionClass}
          sectionTitleClass={sectionTitleClass}
          labelClass={labelClass}
          inputClass={inputClass}
          selectClass={selectClass}
        />

        <InstallationDetailsSection
          formData={formData}
          handleChange={handleChange}
          dropdownOptions={dropdownOptions}
          sectionClass={sectionClass}
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
          sectionClass={sectionClass}
          sectionTitleClass={sectionTitleClass}
          labelClass={labelClass}
          inputClass={inputClass}
          selectClass={selectClass}
        />

        <CostCalculationSection
          formData={formData}
          productDetails={productDetails}
          sectionClass={sectionClass}
          sectionTitleClass={sectionTitleClass}
        />

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
                    "1. Power output from Control Panel will be in customers scope.\n2. Civil work other than Module Mounting Structure will be in customer's scope.\n3. Our offer is valid for 15 Days. Any custom specifications will be charged extra.\n4. Regular cleaning of Modules with plain water (soft) for desired generation guarantee in customer's scope.\n5. Detailed Quotation with engineering document will be provided on finalisation, for systems above 10KW.\n6. Subsidy (if any) is subject to government approval and will be directly credited in customer's account.\n7. Transportation inclusive. Insurance inclusive upto site and thereafter in customer's scope.\n8. Payment 50% advance on booking, Balance 50% against PI before dispatch of material.\n9. Delivery within 2 weeks from sanction and installation immediately thereafter.\n10. AMC inclusive for 5 years and chargeable thereafter.\n11. Structure height consider 5 feet, for additional height should charge extra.\n12. DC, AC, Earthing cable length considered 30 meter, for additional length should charge extra.",
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

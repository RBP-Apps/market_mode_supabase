import React from "react";
import {
  Zap,
  Package,
  Grid,
  Percent,
  FileText,
  CreditCard,
  Fingerprint,
  Map,
  Clock,
  Save,
} from "lucide-react";
import HybridSelector from "./HybridSelector";

export default function PowerLoadInfoSection({
  formData,
  handleChange,
  handleProductChange,
  handleQuantityChange,
  productDetails,
  dropdownOptions,
  sectionClass,
  sectionTitleClass,
  labelClass,
  inputClass,
  selectClass,
}) {
  return (
    <div className={sectionClass}>
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
        <h2 className={sectionTitleClass}>
          <Zap className="h-5 w-5 mr-2" />
          Power & Load Information
        </h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          {/* Product */}
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

          {/* Qty */}
          <div className="space-y-1">
            <label className={labelClass}>
              <Package className="inline h-4 w-4 mr-1 text-amber-500" />
              Quantity *
            </label>
            <input
              type="number"
              name="qty"
              value={formData.qty}
              onChange={handleQuantityChange}
              className={inputClass}
              placeholder="Enter quantity"
              required
            />
          </div>

          {/* Central Subsidy */}
          <div className="space-y-1">
            <label className={labelClass}>
              <Grid className="inline h-4 w-4 mr-1 text-amber-500" />
              Central Subsidy
            </label>
            <input
              type="text"
              name="subCentral"
              value={formData.subCentral}
              onChange={handleChange}
              className={inputClass}
              placeholder="Enter central sub"
            />
          </div>

          {/* State Subsidy */}
          <div className="space-y-1">
            <label className={labelClass}>
              <Grid className="inline h-4 w-4 mr-1 text-amber-500" />
              State Subsidy
            </label>
            <input
              type="text"
              name="subState"
              value={formData.subState}
              onChange={handleChange}
              className={inputClass}
              placeholder="Enter state sub"
            />
          </div>

          {/* Discount */}
          <div className="space-y-1">
            <label className={labelClass}>
              <Percent className="inline h-4 w-4 mr-1 text-amber-500" />
              Discount
            </label>
            <input
              type="text"
              name="disc"
              value={formData.disc}
              onChange={handleChange}
              className={inputClass}
              placeholder="Enter discount"
            />
          </div>

          {/* Need Type */}
          <HybridSelector
            label="Need Type"
            name="needType"
            value={formData.needType}
            onChange={handleChange}
            options={dropdownOptions.needType}
            icon={FileText}
            required={true}
            inputClass={inputClass}
            selectClass={selectClass}
            labelClass={labelClass}
          />

          {/* Bank Account */}
          <div className="space-y-1">
            <label className={labelClass}>
              <CreditCard className="inline h-4 w-4 mr-1 text-amber-500" />
              Bank Name
            </label>
            <input
              type="text"
              name="bankAccount"
              value={formData.bankAccount}
              onChange={handleChange}
              className={inputClass}
              placeholder="Bank name"
              readOnly
            />
          </div>

          {/* Account No */}
          <div className="space-y-1">
            <label className={labelClass}>
              <CreditCard className="inline h-4 w-4 mr-1 text-amber-500" />
              Account No.
            </label>
            <input
              type="text"
              name="accountNo"
              value={formData.accountNo}
              onChange={handleChange}
              className={inputClass}
              placeholder="Account number"
              readOnly
            />
          </div>

          {/* IFSC Code */}
          <div className="space-y-1">
            <label className={labelClass}>
              <Fingerprint className="inline h-4 w-4 mr-1 text-amber-500" />
              IFSC Code
            </label>
            <input
              type="text"
              name="ifscCode"
              value={formData.ifscCode}
              onChange={handleChange}
              className={inputClass}
              placeholder="IFSC code"
              readOnly
            />
          </div>

          {/* Branch */}
          <div className="space-y-1">
            <label className={labelClass}>
              <Map className="inline h-4 w-4 mr-1 text-amber-500" />
              Branch
            </label>
            <input
              type="text"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              className={inputClass}
              placeholder="Branch"
              readOnly
            />
          </div>
        </div>

        {/* Additional Fields Row */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-amber-100">
              <HybridSelector
                label="Hours Of Failure"
                name="failureHours"
                value={formData.failureHours}
                onChange={handleChange}
                options={dropdownOptions.failureHours}
                icon={Clock}
                inputClass={inputClass}
                selectClass={selectClass}
                labelClass={labelClass}
              />

              <HybridSelector
                label="Load details/Application"
                name="loadDetails"
                value={formData.loadDetails}
                onChange={handleChange}
                options={dropdownOptions.loadDetails}
                icon={FileText}
                inputClass={inputClass}
                selectClass={selectClass}
                labelClass={labelClass}
              />
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <h3 className="text-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6 flex items-center">
            <Package className="h-6 w-6 mr-2 text-green-600" />
            Product Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1 col-span-2 lg:col-span-4">
              <label className={labelClass}>
                <Package className="inline h-4 w-4 mr-1 text-green-500" />
                Product Name
              </label>
              <input
                type="text"
                value={productDetails.productName}
                className={`${inputClass} bg-gray-100 h-[60px] text-base`}
                placeholder="Auto-fetched"
                readOnly
              />
            </div>

            <div className="space-y-1 col-span-4">
              <label className={labelClass}>
                <FileText className="inline h-4 w-4 mr-1 text-green-500" />
                BILL OF MATERIAL (BOM)
              </label>
              <textarea
                value={productDetails.bom}
                className={`${inputClass} bg-gray-100 min-h-[180px] text-sm leading-relaxed`}
                placeholder="Auto-fetched BOM"
                readOnly
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>
                <Zap className="inline h-4 w-4 mr-1 text-green-500" />
                Size
              </label>
              <input
                type="text"
                value={productDetails.size}
                className={`${inputClass} bg-gray-100 `}
                placeholder="Auto-fetched"
                readOnly
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>
                <Percent className="inline h-4 w-4 mr-1 text-green-500" />
                GST %
              </label>
              <input
                type="text"
                value={productDetails.gst}
                className={`${inputClass} bg-gray-100 `}
                placeholder="Auto-fetched"
                readOnly
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>
                <CreditCard className="inline h-4 w-4 mr-1 text-green-500" />
                Rate (₹)
              </label>
              <input
                type="text"
                value={productDetails.rate}
                className={`${inputClass} bg-gray-100 `}
                placeholder="Auto-fetched"
                readOnly
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>
                <Save className="inline h-4 w-4 mr-1 text-green-500" />
                Amount (₹)
              </label>
              <input
                type="text"
                value={productDetails.amount}
                className={`${inputClass} bg-green-50 font-semibold text-green-700 border-green-200`}
                placeholder="Rate × Quantity"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

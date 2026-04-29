import React from "react";
import { User, Phone, Mail, Building } from "lucide-react";
import HybridSelector from "./HybridSelector";

export default function CustomerDetailsSection({
  formData,
  handleChange,
  handleCustomerChange,
  handleDealerChange,
  salespersons,
  dropdownOptions,
  sectionClass,
  sectionTitleClass,
  labelClass,
  inputClass,
  selectClass,
}) {
  return (
    <div className={sectionClass}>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <h2 className={sectionTitleClass}>
          <User className="h-5 w-5 mr-2" />
          Customer Details
        </h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          {/* Salesperson */}
         <HybridSelector
  label="Salesperson"
  name="salesperson"
  value={formData.salesperson ?? "S N Sahu"}  // ✅ default only when null/undefined
  onChange={handleChange} // ✅ allow typing
  options={["S N Sahu"]}
  icon={User}
  required={true}
  inputClass={inputClass}
  selectClass={selectClass}
  labelClass={labelClass}
/>

          {/* Customer */}
          <HybridSelector
            label="Customer Name"
            name="customer"
            value={formData.customer}
            onChange={handleCustomerChange}
            options={dropdownOptions.customer}
            icon={User}
            required={true}
            inputClass={inputClass}
            selectClass={selectClass}
            labelClass={labelClass}
          />

          {/* Contact No */}
          <div className="space-y-1">
            <label className={labelClass}>
              <Phone className="inline h-4 w-4 mr-1 text-indigo-500" />
              Contact Number *
            </label>
            <input
              type="tel"
              name="contactNo"
              value={formData.contactNo}
              onChange={handleChange}
              className={inputClass}
              placeholder="Enter contact number"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className={labelClass}>
              <Mail className="inline h-4 w-4 mr-1 text-indigo-500" />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
              placeholder="Enter email address"
            />
          </div>

          {/* Dealer Field */}
          <HybridSelector
            label="Dealer"
            name="dealer"
            value={formData.dealer}
            onChange={handleDealerChange}
            options={dropdownOptions.dealer}
            icon={Building}
            inputClass={inputClass}
            selectClass={selectClass}
            labelClass={labelClass}
          />

          {/* Phone No */}
          <div className="space-y-1">
            <label className={labelClass}>
              <Phone className="inline h-4 w-4 mr-1 text-indigo-500" />
              Alternate Phone
            </label>
            <input
              type="tel"
              name="phoneNo"
              value={formData.phoneNo}
              onChange={handleChange}
              className={inputClass}
              placeholder="Enter alternate phone"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

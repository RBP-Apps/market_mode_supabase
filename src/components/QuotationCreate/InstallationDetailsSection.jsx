import React from "react";
import { Home, Building, MapPin, FileText } from "lucide-react";
import HybridSelector from "./HybridSelector";

export default function InstallationDetailsSection({
  formData,
  handleChange,
  dropdownOptions,
  sectionClass,
  sectionTitleClass,
  labelClass,
  inputClass,
  selectClass,
}) {
  return (
    <div className={sectionClass}>
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
        <h2 className={sectionTitleClass}>
          <Home className="h-5 w-5 mr-2" />
          Installation Details
        </h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          {/* Structure Type */}
          <HybridSelector
            label="Structure Type"
            name="structureType"
            value={formData.structureType}
            onChange={handleChange}
            options={dropdownOptions.structureType}
            icon={Building}
            required={true}
            inputClass={inputClass}
            selectClass={selectClass}
            labelClass={labelClass}
          />

          {/* Place of installation */}
          <HybridSelector
            label="Installation Place"
            name="placeOfInstallation"
            value={formData.placeOfInstallation}
            onChange={handleChange}
            options={dropdownOptions.placeOfInstallation}
            icon={MapPin}
            inputClass={inputClass}
            selectClass={selectClass}
            labelClass={labelClass}
          />

          {/* Terms & Conditions - Always visible */}
          <div className="space-y-1 col-span-full">
            <label className={labelClass}>
              <FileText className="inline h-4 w-4 mr-1 text-purple-500" />
              Terms & Conditions (Click to edit)
            </label>
            <textarea
              name="termsConditions"
              value={formData.termsConditions}
              onChange={handleChange}
              className={`${inputClass} min-h-[120px] resize-y`}
              placeholder="Enter terms & conditions"
            />
          </div>

          {/* General Terms & Conditions - Always visible */}
          <div className="space-y-1 col-span-full mt-4">
            <label className={labelClass}>
              <FileText className="inline h-4 w-4 mr-1 text-purple-500" />
              General Terms & Conditions (Click to edit)
            </label>
            <textarea
              name="generalTerms"
              value={formData.generalTerms}
              onChange={handleChange}
              className={`${inputClass} min-h-[200px] resize-y`}
              placeholder="Enter general terms & conditions"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { FileText, Calendar, UserCheck } from "lucide-react";

export default function QuotationInfoSection({ formData, handleChange, sectionClass, sectionHeaderClass, sectionTitleClass, labelClass, inputClass }) {
  return (
    <div className={sectionClass}>
      <div className={sectionHeaderClass}>
        <h2 className={sectionTitleClass}>
          <FileText className="h-5 w-5 mr-2" />
          Quotation Information
        </h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Date */}
          <div className="space-y-1">
            <label className={labelClass}>
              <Calendar className="inline h-4 w-4 mr-1 text-blue-500" />
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          {/* Reference By */}
          <div className="space-y-1">
            <label className={labelClass}>
              <UserCheck className="inline h-4 w-4 mr-1 text-blue-500" />
              Reference By
            </label>
            <input
              type="text"
              name="referenceBy"
              value={formData.referenceBy}
              onChange={handleChange}
              className={inputClass}
              placeholder="Enter reference"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

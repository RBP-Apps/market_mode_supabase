import React, { useState } from "react";
import { Edit2, List } from "lucide-react";

export default function HybridSelector({
  label,
  name,
  value,
  onChange,
  options = [],
  icon: Icon,
  placeholder = "",
  required = false,
  inputClass = "",
  selectClass = "",
  labelClass = "",
}) {
  const [isManualMode, setIsManualMode] = useState(false);

  const toggleMode = () => {
    setIsManualMode(!isManualMode);
  };

  return (
    <div className="space-y-1.5 group relative">
      <div className="flex justify-between items-center pr-1">
        <label className={labelClass}>
          {Icon && <Icon className="inline h-4 w-4 mr-1.5 opacity-80" />}
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {/* Toggle Mode Button */}
        <button
          type="button"
          onClick={toggleMode}
          className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 flex items-center gap-1 shadow-sm border border-gray-200"
          title={isManualMode ? "Switch to Dropdown" : "Enter Manually"}
        >
          {isManualMode ? (
            <>
              <List className="h-3 w-3" />
              Dropdown
            </>
          ) : (
            <>
              <Edit2 className="h-3 w-3" />
              Manual
            </>
          )}
        </button>
      </div>

      <div className="relative">
        {isManualMode ? (
          <input
            type="text"
            name={name}
            value={value || ""}
            onChange={onChange}
            className={`${inputClass} border-blue-200 focus:border-blue-500 bg-blue-25/30 animate-in fade-in transition-all duration-200`}
            placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
            required={required}
          />
        ) : (
          <div className="relative">
            <select
              name={name}
              value={value || ""}
              onChange={onChange}
              className={`${selectClass} animate-in fade-in transition-all duration-200`}
              required={required}
            >
              <option value="">Select {label}</option>
              {options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {/* Custom arrow for select if appearance-none is used */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-40">
              <List className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { Edit2, List, Search, ChevronDown, Check } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const toggleMode = () => {
    setIsManualMode(!isManualMode);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectOption = (opt) => {
    onChange({
      target: {
        name,
        value: opt,
      },
    });
    setIsOpen(false);
    setSearchTerm("");
  };

  const filteredOptions = options.filter((opt) =>
    String(opt || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="relative w-full" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`${selectClass} text-left flex justify-between items-center bg-white cursor-pointer select-none min-h-[38px] w-full`}
            >
              <span className="truncate">
                {value ? value : `Select ${label}`}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 ml-2" />
            </button>

            {/* Hidden input for HTML5 form validation */}
            <input
              type="text"
              name={name}
              value={value || ""}
              required={required}
              className="sr-only pointer-events-none"
              tabIndex={-1}
              readOnly
            />

            {isOpen && (
              <div className="absolute z-[9999] mt-1 w-full rounded-md bg-white shadow-xl border border-gray-200 py-1 text-sm max-h-60 overflow-y-auto">
                {/* Search Input */}
                <div className="px-3 py-2 sticky top-0 bg-white border-b border-gray-100 flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder={`Search ${label.toLowerCase()}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border-none p-0 focus:ring-0 text-sm placeholder-gray-400 focus:outline-none"
                    autoFocus
                  />
                </div>
                {/* Options List */}
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-gray-500 text-center">No results found</div>
                ) : (
                  filteredOptions.map((option, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectOption(option)}
                      className={`w-full text-left px-3 py-2 hover:bg-indigo-50 flex items-center justify-between transition-colors duration-150 ${
                        value === option ? "bg-indigo-50 font-semibold text-indigo-700" : "text-gray-700"
                      }`}
                    >
                      <span className="truncate">{option}</span>
                      {value === option && <Check className="h-4 w-4 text-indigo-600 shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

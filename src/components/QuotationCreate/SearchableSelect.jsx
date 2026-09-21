import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

export default function SearchableSelect({
  name,
  value = "",
  onChange,
  options = [],
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  selectClass = "",
  required = false,
  disabled = false,
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => String(opt || "").toLowerCase().includes(q));
  }, [options, searchTerm]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Auto-focus search input when opening & reset search when closing
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1);
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    } else {
      setSearchTerm("");
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Handle option selection
  const handleSelectOption = (opt) => {
    if (onChange) {
      const syntheticEvent = {
        target: { name, value: opt },
        currentTarget: { name, value: opt },
      };
      onChange(syntheticEvent);
    }
    setIsOpen(false);
    setSearchTerm("");
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelectOption(filteredOptions[highlightedIndex]);
      } else if (filteredOptions.length === 1) {
        handleSelectOption(filteredOptions[0]);
      }
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex + 1]; // +1 accounting for clear button
      if (activeEl?.scrollIntoView) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className="relative w-full" ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`${selectClass} text-left flex justify-between items-center bg-gray-50 hover:bg-white focus:bg-white min-h-[42px] transition-all duration-200 ${
          disabled ? "opacity-60 cursor-not-allowed bg-gray-100" : "cursor-pointer"
        } ${isOpen ? "ring-2 ring-blue-500 border-blue-500 bg-white" : ""}`}
      >
        <span
          className={`truncate select-none ${
            !value ? "text-gray-400 font-normal" : "text-gray-800 font-medium"
          }`}
        >
          {value || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 shrink-0 ml-2 transition-transform duration-200 pointer-events-none ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {/* Hidden input for form tracking / validation */}
      <input
        type="text"
        name={name}
        value={value || ""}
        required={required}
        readOnly
        tabIndex={-1}
        className="sr-only"
        onChange={() => {}}
      />

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 w-full rounded-lg bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Sticky Search Header */}
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder-gray-400"
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div ref={listRef} className="max-h-60 overflow-y-auto py-1 divide-y divide-gray-50">
            {/* Option to clear / deselect */}
            <button
              type="button"
              onClick={() => handleSelectOption("")}
              className={`w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-50 italic flex items-center justify-between transition-colors ${
                !value ? "bg-gray-50 font-medium text-gray-600" : ""
              }`}
            >
              <span>-- Select System ID --</span>
              {!value && <Check className="h-3.5 w-3.5 text-gray-500" />}
            </button>

            {options.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-400 italic">
                No options available
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-400 italic">
                No results found for "{searchTerm}"
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(value) === String(opt);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between transition-colors duration-150 ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : isHighlighted
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700 hover:bg-blue-50/60 hover:text-blue-900"
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

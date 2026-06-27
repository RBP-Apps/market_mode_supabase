import React from "react";

// Reusable SpecificationRow Component
function SpecificationRow({
  row,
  index,
  totalRows,
  onUpdateRow,
  onDeleteRow,
  onMoveRow,
  isFirstRowOfD = false
}) {
  return (
    <tr className="group relative border-b border-slate-300">
      {/* Left Column: Label */}
      <td
        className="font-bold text-[10.5px] p-2 text-left leading-normal"
        style={{
          backgroundColor: "rgba(0, 140, 149, 0.06)",
          color: "#00695C",
          width: "220px",
          verticalAlign: "middle",
          borderRight: "1px solid #CBD5E1"
        }}
      >
        {onUpdateRow ? (
          <textarea
            value={row.label}
            onChange={(e) => onUpdateRow(row.id, "label", e.target.value)}
            className="bg-transparent border-0 outline-none w-full font-bold text-[10.5px] text-[#00695C] resize-none focus:bg-white p-1 rounded focus:ring-1 focus:ring-[#00695C]/30 leading-normal"
            rows={1}
            style={{ display: "block" }}
          />
        ) : (
          row.label
        )}
      </td>
      
      {/* Right Column: Value */}
      <td
        className="text-gray-700 text-[10px] p-2 text-left leading-relaxed relative"
        style={{
          backgroundColor: "#ffffff",
          verticalAlign: "middle"
        }}
      >
        <div className="flex items-center justify-between w-full">
          {onUpdateRow ? (
            <textarea
              value={row.value}
              onChange={(e) => onUpdateRow(row.id, "value", e.target.value)}
              className="bg-transparent border-0 outline-none flex-1 text-gray-700 text-[10px] resize-none focus:bg-gray-50 p-1 rounded focus:ring-1 focus:ring-[#008C95]/30 leading-relaxed"
              rows={2}
              style={{ display: "block" }}
            />
          ) : (
            row.value
          )}

          {/* Row Actions - Hidden in print */}
          {onUpdateRow && (
            <div className="spec-edit-controls hidden group-hover:flex items-center gap-1 ml-2 bg-white/95 shadow-md border border-gray-200 rounded p-1 absolute right-2 z-10">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => onMoveRow(index, "up")}
                className="p-1 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-30 text-[9px] font-bold"
                title="Move Up"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={index === totalRows - 1}
                onClick={() => onMoveRow(index, "down")}
                className="p-1 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-30 text-[9px] font-bold"
                title="Move Down"
              >
                ▼
              </button>
              {!isFirstRowOfD && (
                <button
                  type="button"
                  onClick={() => onDeleteRow(row.id)}
                  className="p-1 hover:bg-red-50 text-red-600 rounded text-[9px] font-bold"
                  title="Delete Row"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// Reusable SpecificationSection Component
function SpecificationSection({
  section,
  isPage6 = false,
  onUpdateTitle,
  onUpdateRow,
  onDeleteRow,
  onMoveRow,
  onAddRow,
  onDeleteSection,
  onMoveSection,
  sectionIdx,
  totalSections
}) {
  const isStructureFirstRow = isPage6 && section.id === "structure";
  const rowsToRender = isStructureFirstRow ? [section.rows[0]] : (section.rows || []);

  return (
    <div className="w-full mb-4 group/section relative">
      <table className="w-full border-collapse" style={{ border: "1px solid #CBD5E1" }}>
        <thead>
          <tr>
            <th
              className="text-white font-bold text-[11px] p-2 text-left relative"
              style={{ backgroundColor: "#00695C" }}
            >
              <div className="flex items-center justify-between">
                {onUpdateTitle ? (
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => onUpdateTitle(section.id, e.target.value)}
                    className="bg-transparent border-0 outline-none w-[70%] font-bold text-[11px] text-white p-1 rounded focus:bg-teal-800 focus:ring-1 focus:ring-white/30"
                  />
                ) : (
                  section.title
                )}

                {/* Section Action Controls - Hidden in print */}
                {onUpdateTitle && onMoveSection && (
                  <div className="spec-edit-controls hidden group-hover/section:flex items-center gap-1.5 bg-teal-800/90 border border-teal-700 rounded p-1">
                    <button
                      type="button"
                      disabled={sectionIdx === 0}
                      onClick={() => onMoveSection(sectionIdx, "up")}
                      className="p-0.5 hover:bg-teal-700 rounded text-white disabled:opacity-30 text-[9px] font-bold"
                      title="Move Section Up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={sectionIdx === totalSections - 1}
                      onClick={() => onMoveSection(sectionIdx, "down")}
                      className="p-0.5 hover:bg-teal-700 rounded text-white disabled:opacity-30 text-[9px] font-bold"
                      title="Move Section Down"
                    >
                      ▼
                    </button>
                    {onDeleteSection && (
                      <button
                        type="button"
                        onClick={() => onDeleteSection(section.id)}
                        className="p-0.5 hover:bg-red-700 text-red-200 rounded text-[9px] font-bold"
                        title="Delete Section"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-0">
              <table className="w-full border-collapse">
                <tbody>
                  {rowsToRender.map((row, rIdx) => (
                    <SpecificationRow
                      key={row.id || rIdx}
                      row={row}
                      index={rIdx}
                      totalRows={rowsToRender.length}
                      onUpdateRow={onUpdateRow}
                      onDeleteRow={onDeleteRow}
                      onMoveRow={onMoveRow}
                      isFirstRowOfD={isStructureFirstRow}
                    />
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
      
      {/* Add Row Button - Hidden in print */}
      {!isStructureFirstRow && onAddRow && (
        <div className="spec-edit-controls mt-1 flex justify-end">
          <button
            type="button"
            onClick={() => onAddRow(section.id)}
            className="spec-btn px-2 py-0.5 border border-dashed border-teal-600 text-teal-700 hover:bg-teal-50 rounded text-[9px] font-semibold transition-all"
          >
            + Add Row
          </button>
        </div>
      )}
    </div>
  );
}

export default function TechnicalSpecsPage({
  specsData = [],
  onUpdateTitle,
  onUpdateRow,
  onDeleteRow,
  onMoveRow,
  onAddRow,
  onDeleteSection,
  onMoveSection
}) {
  // Filter sections that belong to Page 6: overview, modules, ajb
  const page6Sections = specsData.filter(s => s.id === "overview" || s.id === "modules" || s.id === "ajb");

  // Section D (structure) should only show its first row on Page 6
  const sectionD = specsData.find(s => s.id === "structure");

  return (
    <div
      className="relative flex flex-col justify-between overflow-hidden shadow-2xl select-none bg-white"
      style={{
        width: "794px",
        height: "1123px",
        fontFamily: "'Poppins', sans-serif",
        boxSizing: "border-box",
        padding: "40px 50px 30px 50px",
        margin: "0 auto",
        flexShrink: 0
      }}
    >
      {/* Import Poppins Font */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        `}
      </style>

      {/* Main Page Layout Wrapper */}
      <div className="flex flex-col flex-1">
        
        {/* HEADER: Logo at top-right */}
        <div className="flex justify-end w-full mb-4">
          <img
            src="/Logo.PNG"
            alt="RBP Logo"
            crossOrigin="anonymous"
            style={{
              height: "42px",
              objectFit: "contain"
            }}
          />
        </div>

        {/* SECTION HEADER BAR */}
        <div className="w-full mb-4">
          {/* Accent orange line */}
          <div className="w-full h-[2px] bg-[#F7941D] mb-1.5" />
          
          {/* Header Bar */}
          <div className="flex w-full h-[32px] items-stretch">
            {/* Left Section Code */}
            <div
              className="flex items-center justify-center text-white font-bold text-[14px]"
              style={{
                backgroundColor: "#F7941D",
                width: "42px"
              }}
            >
              05
            </div>
            
            {/* Right Title Text */}
            <div
              className="flex items-center text-white font-bold text-[14px] pl-4 flex-1"
              style={{
                backgroundColor: "#008C95"
              }}
            >
              Technical Specifications
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col justify-start overflow-hidden">
          
          {/* Introduction Paragraph */}
          <p className="text-gray-700 text-[11px] leading-relaxed text-justify mb-4">
            Technical details of the solar power system shall be as under:
          </p>

          {/* Dynamic Specifications Sections */}
          <div className="flex-1 overflow-hidden">
            {page6Sections.map((section) => {
              const globalIdx = specsData.findIndex(s => s.id === section.id);
              return (
                <SpecificationSection
                  key={section.id}
                  section={section}
                  isPage6={true}
                  onUpdateTitle={onUpdateTitle}
                  onUpdateRow={onUpdateRow}
                  onDeleteRow={onDeleteRow}
                  onMoveRow={onMoveRow}
                  onAddRow={onAddRow}
                  onDeleteSection={onDeleteSection}
                  onMoveSection={onMoveSection}
                  sectionIdx={globalIdx}
                  totalSections={specsData.length}
                />
              );
            })}
            {sectionD && sectionD.rows && sectionD.rows.length > 0 && (
              <SpecificationSection
                key={sectionD.id}
                section={sectionD}
                isPage6={true}
                onUpdateTitle={onUpdateTitle}
                onUpdateRow={onUpdateRow}
                onDeleteRow={onDeleteRow}
                onMoveRow={onMoveRow}
                onAddRow={onAddRow}
                onDeleteSection={onDeleteSection}
                onMoveSection={onMoveSection}
                sectionIdx={specsData.findIndex(s => s.id === sectionD.id)}
                totalSections={specsData.length}
              />
            )}
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <div className="w-full shrink-0 mt-4">
        {/* Divider line */}
        <div className="w-full h-[0.75px] bg-gray-200 mb-2" />
        
        {/* Footer content */}
        <div className="flex justify-between items-center text-[9px] text-gray-400 font-medium px-1">
          <div>RBP Energy (India) Pvt. Ltd.</div>
          <div>Renewable Energy Solutions</div>
          <div>Page 6 of 14</div>
        </div>
      </div>
    </div>
  );
}

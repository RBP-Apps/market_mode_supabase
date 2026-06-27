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
  isContinuationOfD = false,
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
  if (!section || !section.rows) return null;
  const rowsToRender = isContinuationOfD ? section.rows.slice(1) : (section.rows || []);

  if (rowsToRender.length === 0) return null;

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
                    value={isContinuationOfD ? `${section.title} (Continued)` : section.title}
                    onChange={(e) => {
                      const baseTitle = e.target.value.replace(" (Continued)", "");
                      onUpdateTitle(section.id, baseTitle);
                    }}
                    className="bg-transparent border-0 outline-none w-[70%] font-bold text-[11px] text-white p-1 rounded focus:bg-teal-800 focus:ring-1 focus:ring-white/30"
                  />
                ) : (
                  isContinuationOfD ? `${section.title} (Continued)` : section.title
                )}

                {/* Section Action Controls - Hidden in print */}
                {onUpdateTitle && onMoveSection && !isContinuationOfD && (
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
                    />
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
      
      {/* Add Row Button - Hidden in print */}
      {!isContinuationOfD && onAddRow && (
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

export default function TechnicalSpecsContPage({
  specsData = [],
  description = "",
  onUpdateTitle,
  onUpdateRow,
  onDeleteRow,
  onMoveRow,
  onAddRow,
  onDeleteSection,
  onMoveSection,
  onAddSection,
  onUpdateDescription
}) {
  // Find Section D
  const sectionD = specsData.find(s => s.id === "structure") || {};

  // Filter sections that belong to Page 7: E (pcu), F (cabling), and user-added sections
  const otherSections = specsData.filter((s) => s.id !== "overview" && s.id !== "modules" && s.id !== "ajb" && s.id !== "structure");

  const sectionE = specsData.find(s => s.id === "pcu");
  const sectionF = specsData.find(s => s.id === "cabling");

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

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col justify-start overflow-hidden pt-2">
          
          {/* Section D Remaining Rows */}
          {sectionD && sectionD.rows && sectionD.rows.length > 1 && (
            <SpecificationSection
              key={sectionD.id}
              section={sectionD}
              isContinuationOfD={true}
              onUpdateTitle={onUpdateTitle}
              onUpdateRow={onUpdateRow}
              onDeleteRow={onDeleteRow}
              onMoveRow={(index, direction) => onMoveRow(sectionD.id, index + 1, direction)}
              onAddRow={onAddRow}
              sectionIdx={specsData.findIndex(s => s.id === sectionD.id)}
              totalSections={specsData.length}
            />
          )}

          {/* Section E (PCU) */}
          {sectionE && (
            <SpecificationSection
              key={sectionE.id}
              section={sectionE}
              onUpdateTitle={onUpdateTitle}
              onUpdateRow={onUpdateRow}
              onDeleteRow={onDeleteRow}
              onMoveRow={(index, direction) => onMoveRow(sectionE.id, index, direction)}
              onAddRow={onAddRow}
              onDeleteSection={onDeleteSection}
              onMoveSection={onMoveSection}
              sectionIdx={specsData.findIndex(s => s.id === sectionE.id)}
              totalSections={specsData.length}
            />
          )}

          {/* Section F (Cabling) */}
          {sectionF && (
            <SpecificationSection
              key={sectionF.id}
              section={sectionF}
              onUpdateTitle={onUpdateTitle}
              onUpdateRow={onUpdateRow}
              onDeleteRow={onDeleteRow}
              onMoveRow={(index, direction) => onMoveRow(sectionF.id, index, direction)}
              onAddRow={onAddRow}
              onDeleteSection={onDeleteSection}
              onMoveSection={onMoveSection}
              sectionIdx={specsData.findIndex(s => s.id === sectionF.id)}
              totalSections={specsData.length}
            />
          )}

          {/* Other User Added Sections */}
          {otherSections.map((sec) => {
            if (sec.id === "pcu" || sec.id === "cabling") return null;
            return (
              <SpecificationSection
                key={sec.id}
                section={sec}
                onUpdateTitle={onUpdateTitle}
                onUpdateRow={onUpdateRow}
                onDeleteRow={onDeleteRow}
                onMoveRow={(index, direction) => onMoveRow(sec.id, index, direction)}
                onAddRow={onAddRow}
                onDeleteSection={onDeleteSection}
                onMoveSection={onMoveSection}
                sectionIdx={specsData.findIndex(s => s.id === sec.id)}
                totalSections={specsData.length}
              />
            );
          })}

          {/* Add Section Button - Hidden in print */}
          {onAddSection && (
            <div className="spec-edit-controls mb-4 flex justify-start">
              <button
                type="button"
                onClick={onAddSection}
                className="spec-btn px-3 py-1 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 rounded text-[10px] font-bold transition-all shadow-sm"
              >
                + Add New Section
              </button>
            </div>
          )}

          {/* Bottom Description Paragraph */}
          {onUpdateDescription ? (
            <div className="mt-2 mb-4 relative group/desc">
              <textarea
                value={description}
                onChange={(e) => onUpdateDescription(e.target.value)}
                className="bg-transparent border-0 outline-none w-full text-gray-700 text-[10px] leading-relaxed text-justify resize-none focus:bg-gray-50 p-1 rounded focus:ring-1 focus:ring-[#008C95]/30"
                rows={3}
                style={{ display: "block" }}
              />
            </div>
          ) : (
            description && (
              <p className="text-gray-700 text-[10px] leading-relaxed text-justify mt-2 mb-4">
                {description}
              </p>
            )
          )}

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
          <div>Page 7 of 14</div>
        </div>
      </div>
    </div>
  );
}

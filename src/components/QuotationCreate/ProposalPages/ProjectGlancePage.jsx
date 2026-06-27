import React from "react";

// Reusable SpecificationTable component as requested
function SpecificationTable({ data }) {
  return (
    <table className="w-full border-collapse" style={{ border: "1px solid #CBD5E1" }}>
      <thead>
        <tr>
          <th
            colSpan="2"
            className="text-white font-bold text-[11.5px] p-3 text-left"
            style={{ backgroundColor: "#00695C" }}
          >
            Project at a Glance
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index} style={{ borderBottom: "1px solid #E2E8F0" }}>
            {/* Left Column: Attribute Label */}
            <td
              className="font-bold text-[10.5px] p-3.5 text-left leading-normal"
              style={{
                backgroundColor: "rgba(0, 140, 149, 0.06)",
                color: "#00695C",
                width: "200px",
                verticalAlign: "middle",
                borderRight: "1px solid #CBD5E1"
              }}
            >
              {row.label}
            </td>
            
            {/* Right Column: Value */}
            <td
              className="text-gray-700 text-[10px] p-3.5 text-left leading-relaxed"
              style={{
                backgroundColor: "#ffffff",
                verticalAlign: "middle"
              }}
            >
              {row.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ProjectGlancePage({ formData = {} }) {
  const capacityStr = formData.proposalFor || formData.capacity || "2.5 MWp";
  const capacityMwp = formData.capacityMwp || capacityStr;
  
  // Extract number and unit to make page calculations dynamic
  const capacityNum = parseFloat(capacityStr) || 2.5;
  const isKW = capacityStr.toLowerCase().includes("kw");
  
  // Calculate dynamic statistics
  const watts = formData.capacityWp ? parseFloat(String(formData.capacityWp).replace(/,/g, "")) : (isKW ? capacityNum * 1000 : capacityNum * 1000000);
  const calculatedModuleCount = Math.round(watts / 600);
  const approxModuleCount = formData.moduleCount 
    ? `${parseFloat(formData.moduleCount).toLocaleString("en-IN")} modules`
    : `~${calculatedModuleCount.toLocaleString("en-IN")} modules of ~600 Wp`;
  
  const landRequired = formData.landAcres || (isKW 
    ? `~${Math.round(capacityNum * 90).toLocaleString("en-IN")} sq ft of shadow-free rooftop area` 
    : `~${(capacityNum * 3).toFixed(1)} acres of shadow-free, south-facing land (3 acres per MW)`);
  
  const kWp = isKW ? capacityNum : capacityNum * 1000;
  const annualGenKwh = kWp * 1500;
  const estAnnualGeneration = formData.annualGen 
    ? `${formData.annualGen} units / year`
    : (annualGenKwh >= 100000 
      ? `${(annualGenKwh / 100000).toFixed(1)}+ lakh units / year (minimum guarantee of 1,500 kWh per kWp)` 
      : `${annualGenKwh.toLocaleString("en-IN")}+ kWh / year (minimum guarantee of 1,500 kWh per kWp)`);
  
  const co2AvoidedVal = Math.round((annualGenKwh * 0.8) / 1000);
  const co2Avoided = formData.co2Tonnes 
    ? `${formData.co2Tonnes} tonnes / year`
    : `~${co2AvoidedVal.toLocaleString("en-IN")}+ tonnes per year`;

  // Dynamic table specifications array
  const specs = [
    {
      label: "System type",
      value: `${capacityMwp} grid-connected solar PV plant (without battery bank)`
    },
    {
      label: "Module technology",
      value: "TOPCon Bifacial, 590-625 Wp — Premier / Rayzon / Waaree or equivalent (Made in India)"
    },
    {
      label: "Approx. module count",
      value: approxModuleCount
    },
    {
      label: "Mounting",
      value: "Hot-dip galvanised ground-mount, 21–22° tilt, 150 km/h wind rating"
    },
    {
      label: "Land required",
      value: landRequired
    },
    {
      label: "Est. annual generation",
      value: estAnnualGeneration
    },
    {
      label: "CO₂ avoided",
      value: co2Avoided
    },
    {
      label: "Generation guarantee",
      value: "1,500 kWh / kWp per annum (subject to upkeep conditions)"
    }
  ];

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
        <div className="w-full mb-5">
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
              04
            </div>
            
            {/* Right Title Text */}
            <div
              className="flex items-center text-white font-bold text-[14px] pl-4 flex-1"
              style={{
                backgroundColor: "#008C95"
              }}
            >
              Your Project at a Glance
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col justify-start">
          
          {/* Introduction Paragraph */}
          <p className="text-gray-700 text-[11px] leading-relaxed text-justify mb-5">
            A summary of the proposed {capacityStr} grid-connected solar PV power plant. Detailed technical 
            specifications follow in the next section.
          </p>

          {/* Reusable Specification Table component */}
          <SpecificationTable data={specs} />

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
          <div>Page 5 of 14</div>
        </div>
      </div>
    </div>
  );
}

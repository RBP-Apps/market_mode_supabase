import React from "react";

// Reusable BulletItem Component
function BulletItem({ text }) {
  return (
    <li className="flex items-start gap-2.5 mb-2.5 last:mb-0">
      {/* Orange square bullet */}
      <span
        className="w-1.5 h-1.5 mt-1.5 shrink-0"
        style={{
          backgroundColor: "#F7941D"
        }}
      />
      {/* Bullet Text */}
      <span className="text-gray-700 text-[11px] leading-relaxed font-normal">
        {text}
      </span>
    </li>
  );
}

export default function ScopeOfWorkPage() {
  const rbpScope = [
    "Supply of the complete solar PV system.",
    "Drawings and design of the solar power plant.",
    "Installation and commissioning of the plant.",
    "Warranty of the system.",
    "Maintenance charges as applicable.",
    "Documentation and liaisoning for grid synchronisation."
  ];

  const clientScope = [
    "South-facing, shadow-free land at the ratio of 3 acres per MW.",
    "Statutory approvals from local authorities / the state electricity distribution company (e.g. for net metering), if required.",
    "Electricity, water and drainage for panel cleaning and for installation and commissioning.",
    "A suitable, secure place to store material and equipment, with security against theft or damage.",
    "Access and adequate security for all staff and visitors before and after work commences.",
    "Regular cleaning and upkeep of the modules and system.",
    "Insurance of the system against fire, theft, damage, terrorism and natural calamities.",
    "Cost of LT panel, HT yard, transmission line and evacuation to the substation — extra, at actuals."
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
        <div className="w-full mb-6">
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
              06
            </div>
            
            {/* Right Title Text */}
            <div
              className="flex items-center text-white font-bold text-[14px] pl-4 flex-1"
              style={{
                backgroundColor: "#008C95"
              }}
            >
              Scope of Work
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col justify-start overflow-hidden">
          
          {/* Section 1: RBP Scope */}
          <div className="mb-6">
            <h3
              className="font-bold text-[13.5px] mb-3 text-left"
              style={{ color: "#00695C" }}
            >
              RBP Energy (India) Pvt. Ltd.
            </h3>
            <ul className="list-none pl-0">
              {rbpScope.map((item, index) => (
                <BulletItem key={index} text={item} />
              ))}
            </ul>
          </div>

          {/* Section 2: Client Scope */}
          <div className="mb-6">
            <h3
              className="font-bold text-[13.5px] mb-3 text-left"
              style={{ color: "#00695C" }}
            >
              Client
            </h3>
            <ul className="list-none pl-0">
              {clientScope.map((item, index) => (
                <BulletItem key={index} text={item} />
              ))}
            </ul>
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
          <div>Page 8 of 14</div>
        </div>
      </div>
    </div>
  );
}

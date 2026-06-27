import React from "react";

export default function TrackRecordPage() {
  const stats = [
    { value: "121+ MW", label: "Solar capacity installed" },
    { value: "14 Yrs", label: "Industry legacy" },
    { value: "98%", label: "Fleet uptime" },
    { value: "4.96 L", label: "Units generated / day" },
    { value: "5,000+", label: "Solar power plants" },
    { value: "30,000+", label: "Solar irrigation pumps" },
    { value: "12,000+", label: "Home-lighting systems" },
    { value: "1,100+", label: "Solar dual pumps" },
    { value: "₹425 Cr", label: "Annual group revenue" }
  ];

  const roadAhead = [
    {
      title: "Geographical Expansion",
      description: "Operations extended into five additional states — Maharashtra, Uttar Pradesh, Haryana, Jharkhand and Rajasthan — broadening our reach across India."
    },
    {
      title: "Backward Integration",
      description: "Entered solar-structure manufacturing to improve efficiency, quality control and lead-times."
    },
    {
      title: "Manufacturing Powerhouse",
      description: "Planned solar-module manufacturing facilities to strengthen our leadership across the value chain."
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
              02
            </div>
            
            {/* Right Title Text */}
            <div
              className="flex items-center text-white font-bold text-[14px] pl-4 flex-1"
              style={{
                backgroundColor: "#008C95"
              }}
            >
              Track Record at a Glance
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col justify-start">
          
          {/* 3x3 STATISTICS GRID */}
          <div className="grid grid-cols-3 gap-[2px] bg-white w-full mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center p-5 text-center"
                style={{
                  backgroundColor: "rgba(0, 140, 149, 0.06)",
                  height: "82px",
                  boxSizing: "border-box"
                }}
              >
                <div
                  className="font-extrabold text-[18px] leading-tight"
                  style={{ color: "#008C95" }}
                >
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium text-[9.5px] mt-1 leading-normal">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* ROAD AHEAD SECTION */}
          <div className="w-full">
            <h3 className="font-bold text-[12px] text-[#008C95] mb-3">
              The Road Ahead
            </h3>

            {/* Document-style 2-column table */}
            <table className="w-full border-collapse" style={{ border: "1px solid #E2E8F0" }}>
              <tbody>
                {roadAhead.map((row, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #E2E8F0" }}>
                    {/* Left Column: Category */}
                    <td
                      className="font-bold text-[10.5px] p-4 text-left leading-snug"
                      style={{
                        backgroundColor: "rgba(0, 140, 149, 0.06)",
                        color: "#008C95",
                        width: "185px",
                        verticalAlign: "middle",
                        borderRight: "1px solid #E2E8F0"
                      }}
                    >
                      {row.title}
                    </td>
                    
                    {/* Right Column: Description */}
                    <td
                      className="text-gray-700 text-[10px] p-4 text-justify leading-relaxed"
                      style={{
                        backgroundColor: "#ffffff",
                        verticalAlign: "middle"
                      }}
                    >
                      {row.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <div>Page 3 of 14</div>
        </div>
      </div>
    </div>
  );
}

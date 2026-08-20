import React from "react";

export default function CoverPage({ formData }) {
  // Extract values from formData or use defaults
  const clientName = formData.preparedFor || formData.customer || "Mr. Subham Singhal";
  const capacity = formData.rating || formData.product || formData.proposalFor || formData.capacity || "2.5 MWp";
  const formatDateString = (dateInput) => {
    if (!dateInput) return "";
    if (String(dateInput).startsWith("Dated:") || isNaN(Date.parse(dateInput))) {
      return dateInput;
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput;
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const day = d.getDate();
    let suffix = "th";
    if (day === 1 || day === 21 || day === 31) suffix = "st";
    else if (day === 2 || day === 22) suffix = "nd";
    else if (day === 3 || day === 23) suffix = "rd";
    return `Dated: ${day}${suffix} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const proposalDate = formatDateString(formData.dated) || (formData.date ? formatDateString(formData.date) : "Dated: 9th June 2026");

  const stats = [
    { number: "121+ MW", label: "Installed" },
    { number: "14 Yrs", label: "Legacy" },
    { number: "5000+", label: "Solar Plants" },
    { number: "98%", label: "Uptime" }
  ];

  return (
    <div
      className="relative flex flex-col justify-between overflow-hidden shadow-2xl select-none"
      style={{
        width: "794px",
        height: "1123px",
        backgroundColor: "#F7941D",
        fontFamily: "'Poppins', sans-serif",
        boxSizing: "border-box",
        padding: "0",
        margin: "0 auto",
        flexShrink: 0
      }}
    >


      {/* Abstract Background Shapes (Opacity 5-8%) */}
      {/* Top Right large circle */}
      <div
        className="absolute rounded-full border border-white"
        style={{
          width: "550px",
          height: "550px",
          top: "-150px",
          right: "-150px",
          opacity: "0.06",
          pointerEvents: "none"
        }}
      />
      <div
        className="absolute rounded-full border border-white"
        style={{
          width: "650px",
          height: "650px",
          top: "-200px",
          right: "-200px",
          opacity: "0.04",
          pointerEvents: "none"
        }}
      />

      {/* Bottom Left curved circles */}
      <div
        className="absolute rounded-full border border-white"
        style={{
          width: "400px",
          height: "400px",
          bottom: "-100px",
          left: "-150px",
          opacity: "0.06",
          pointerEvents: "none"
        }}
      />
      <div
        className="absolute rounded-full border border-white"
        style={{
          width: "500px",
          height: "500px",
          bottom: "-150px",
          left: "-200px",
          opacity: "0.04",
          pointerEvents: "none"
        }}
      />

      {/* Bottom Right faded circle */}
      <div
        className="absolute rounded-full bg-white"
        style={{
          width: "250px",
          height: "250px",
          bottom: "100px",
          right: "-80px",
          opacity: "0.05",
          filter: "blur(20px)",
          pointerEvents: "none"
        }}
      />

      {/* TOP SECTION: Header */}
      <div className="pt-[40px] px-[50px] z-10">
        <div className="text-[11px] text-white uppercase tracking-wider font-medium opacity-90">
          STRICTLY PRIVATE & CONFIDENTIAL
        </div>
        <div className="text-[12px] text-white uppercase tracking-widest font-bold mt-1">
          SOLAR EPC PROPOSAL
        </div>
        <div className="w-[100px] h-[1.5px] bg-white mt-2" />
      </div>

      {/* MID SECTION: Logo Card & Proposal Title */}
      <div className="flex flex-col items-center justify-center flex-1 px-[50px] z-10 -mt-[20px]">
        {/* Floating White Logo Card */}
        <div
          className="bg-white rounded-[18px] flex flex-col items-center justify-center p-[25px] shadow-2xl"
          style={{
            width: "390px",
            height: "170px",
            boxShadow: "0px 15px 35px rgba(0,0,0,0.22)",
            boxSizing: "border-box"
          }}
        >
          <img
            src="/Logo.PNG"
            alt="RBP Logo"
            crossOrigin="anonymous"
            className="object-contain"
            style={{
              maxWidth: "250px",
              maxHeight: "120px"
            }}
          />
        </div>

        {/* Proposal Details */}
        <div className="text-center mt-[30px] w-full px-[30px]">
          <div className="text-[16px] text-white font-medium opacity-95 mb-1.5">
            Proposal for
          </div>
          <h1 className="text-[32px] text-white font-[800] tracking-tight leading-snug mb-2 block">
            {capacity}
          </h1>
          <h2 className="text-[20px] text-white font-bold tracking-wide leading-snug block mb-4">
            Grid-Connected Solar PV Power Plant
          </h2>
          <div className="w-[110px] h-[1.5px] bg-white mx-auto opacity-80 mb-6" />

          <div className="text-[11px] text-white uppercase tracking-[3px] font-semibold opacity-90 mb-1">
            PREPARED FOR
          </div>
          <h3 className="text-[28px] text-white font-bold leading-snug block mb-1">
            {clientName}
          </h3>
          <div className="text-[15px] text-white font-normal opacity-90">
            {proposalDate}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="flex flex-wrap justify-center gap-[16px] mt-[45px] w-full px-[20px]">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center rounded-[12px] shadow-sm px-2"
              style={{
                width: "155px",
                height: "82px",
                backgroundColor: "rgba(255, 255, 255, 0.10)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                boxSizing: "border-box"
              }}
            >
              <div className="text-[22px] font-bold text-white leading-none mb-1.5 whitespace-nowrap">
                {stat.number}
              </div>
              <div className="text-[11px] font-medium leading-none whitespace-nowrap" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM SECTION: Sticky Footer */}
      <div
        className="w-full flex flex-col justify-between px-[50px] py-[15px] border-t-2 border-[#F7941D] z-10 shrink-0"
        style={{
          height: "95px",
          backgroundColor: "#008C95",
          boxSizing: "border-box"
        }}
      >
        <div className="flex items-center justify-between w-full">
          {/* Left: Small Logo */}
          <div className="text-[26px] font-extrabold text-white tracking-tighter select-none">
            RBP
          </div>

          {/* Center: Company Name & Address */}
          <div className="text-right">
            <div className="text-[13px] font-bold text-white tracking-wide">
              RBP ENERGY (INDIA) PVT. LTD.
            </div>
            <div className="text-[9.5px] font-medium mt-0.5" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
              303 Guru Ghasidas Plaza, Ampara, G.E Road, Raipur (C.G.) - 492 001
            </div>
          </div>
        </div>

        {/* Contact Numbers, Email & Website Line */}
        <div className="text-center text-[9px] pt-1.5 flex justify-center space-x-1.5 font-medium" style={{ color: "rgba(255, 255, 255, 0.9)", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <span>Sales: +91 92000 12500</span>
          <span className="opacity-40">|</span>
          <span>Service: +91 92000 12400</span>
          <span className="opacity-40">|</span>
          <span>info@rbpindia.com</span>
          <span className="opacity-40">•</span>
          <span>www.rbpindia.com</span>
        </div>
      </div>
    </div>
  );
}

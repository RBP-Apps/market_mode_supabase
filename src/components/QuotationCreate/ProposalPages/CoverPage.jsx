import React from "react";

export default function CoverPage({ formData }) {
  // Extract values from formData or use defaults
  const clientName = formData.preparedFor || formData.customer || "Mr. Subham Singhal";
  const capacity = formData.proposalFor || formData.capacity || "2.5 MWp";
  const proposalDate = formData.dated || (formData.date
    ? (() => {
        const d = new Date(formData.date);
        const months = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        // Format day suffix (e.g., 9th)
        const day = d.getDate();
        let suffix = "th";
        if (day === 1 || day === 21 || day === 31) suffix = "st";
        else if (day === 2 || day === 22) suffix = "nd";
        else if (day === 3 || day === 23) suffix = "rd";

        return `Dated: ${day}${suffix} ${months[d.getMonth()]} ${d.getFullYear()}`;
      })()
    : "Dated: 9th June 2026");

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
      {/* Import Poppins Font */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
          
          /* Fade Down for Logo Card */
          @keyframes fadeDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Fade Up for Titles */
          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Scale In for Stats */
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          .animate-fade-down {
            animation: fadeDown 300ms ease-out forwards;
          }

          .animate-fade-up {
            animation: fadeUp 300ms ease-out forwards;
          }

          .animate-scale-in {
            animation: scaleIn 300ms ease-out forwards;
          }
        `}
      </style>

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
          className="bg-white rounded-[18px] flex flex-col items-center justify-center p-[25px] shadow-2xl animate-fade-down"
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
        <div className="text-center mt-[60px] space-y-[30px] animate-fade-up">
          <div className="space-y-[10px]">
            <div className="text-[18px] text-white font-medium opacity-95">
              Proposal for
            </div>
            <div className="text-[58px] text-white font-[800] leading-none tracking-tight">
              {capacity}
            </div>
            <div className="text-[24px] text-white font-bold tracking-wide">
              Grid-Connected Solar PV Power Plant
            </div>
            <div className="w-[110px] h-[1.5px] bg-white mx-auto mt-4 opacity-80" />
          </div>

          <div className="space-y-[12px] pt-[35px]">
            <div className="text-[11px] text-white uppercase tracking-[3px] font-semibold opacity-90">
              PREPARED FOR
            </div>
            <div className="text-[34px] text-white font-bold leading-tight">
              {clientName}
            </div>
            <div className="text-[16px] text-white font-normal opacity-90">
              {proposalDate}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="flex flex-wrap justify-center gap-[20px] mt-[45px] w-full px-[20px] animate-scale-in">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center rounded-[12px] border border-white/20 shadow-sm"
              style={{
                width: "140px",
                height: "82px",
                backgroundColor: "rgba(255, 255, 255, 0.10)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                boxSizing: "border-box"
              }}
            >
              <div className="text-[24px] font-bold text-white leading-tight">
                {stat.number}
              </div>
              <div className="text-[11px] text-white/90 font-medium">
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
            <div className="text-[9.5px] text-white/90 font-medium mt-0.5">
              303 Guru Ghasidas Plaza, Ampara, G.E Road, Raipur (C.G.) - 492 001
            </div>
          </div>
        </div>

        {/* Contact Numbers, Email & Website Line */}
        <div className="text-center text-[9px] text-white/90 border-t border-white/10 pt-1.5 flex justify-center gap-1.5 font-medium">
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

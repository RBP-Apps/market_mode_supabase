import React from "react";

export default function ThankYouPage() {
  const contacts = [
    { name: "Gaurav Jain", phone: "+91 92291 50555" },
    { name: "Jaikishan Bajaj", phone: "+91 93034 08600" },
    { name: "Saurabh Pandey", phone: "+91 93015 04289" }
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
      {/* Decorative Circular Outlines (Background Graphic) */}
      <div
        className="absolute rounded-full"
        style={{
          width: "480px",
          height: "480px",
          left: "-120px",
          bottom: "-60px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          pointerEvents: "none"
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "600px",
          height: "600px",
          right: "-150px",
          bottom: "-150px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          pointerEvents: "none"
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "360px",
          height: "360px",
          right: "-50px",
          bottom: "-50px",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          pointerEvents: "none"
        }}
      />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col items-center justify-start pt-16 z-10 px-10">

        {/* LOGO CARD */}
        <div
          className="bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center p-6 mb-16"
          style={{
            width: "370px",
            height: "160px"
          }}
        >
          <img
            src="/Logo.PNG"
            alt="RBP Logo"
            crossOrigin="anonymous"
            style={{
              height: "54px",
              objectFit: "contain",
              marginBottom: "8px"
            }}
          />
          <div className="text-[11px] font-bold text-[#00695C] tracking-wider uppercase whitespace-nowrap leading-none mb-1.5">
            RBP Energy (India) Pvt. Ltd.
          </div>
          <div className="text-[9.5px] text-gray-500 font-medium whitespace-nowrap leading-none">
            Central India's Solar EPC Leader
          </div>
        </div>

        {/* MAIN HEADING */}
        <h2 className="text-[#0D2E27] font-bold text-[21px] text-center leading-normal mb-6">
          “We’re not just creating green energy.<br />
          We’re powering India’s independence.”
        </h2>

        {/* DIVIDER */}
        <div className="w-[80px] h-[1px] mb-6" style={{ backgroundColor: "rgba(255, 255, 255, 0.3)" }} />

        {/* DESCRIPTION */}
        <p className="text-[12px] text-center leading-relaxed mb-16" style={{ color: "rgba(13, 46, 39, 0.8)" }}>
          We look forward to partnering with you to build<br />
          a sustainable and energy-efficient future.
        </p>

        {/* CONTACT CARDS */}
        <div className="flex justify-between w-full space-x-4 mt-4">
          {contacts.map((contact, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-lg flex flex-col items-center justify-center py-4 px-3 flex-1 border-t-[3.5px]"
              style={{
                borderColor: "#008C95",
                height: "75px"
              }}
            >
              <div className="text-[11.5px] font-bold text-gray-800 mb-1">
                {contact.name}
              </div>
              <div className="text-[10.5px] font-semibold text-[#008C95]">
                {contact.phone}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* FOOTER */}
      <div
        className="w-full text-center flex flex-col justify-center items-center py-6 z-10"
        style={{
          backgroundColor: "#008C95",
          color: "#white"
        }}
      >
        {/* Contact Links */}
        <div className="text-white text-[10.5px] font-semibold flex items-center justify-center space-x-4 mb-2">
          <span>info@rbpindia.com</span>
          <span className="opacity-50">•</span>
          <span>www.rbpindia.com</span>
          <span className="opacity-50">•</span>
          <span>+91 92000 12500</span>
        </div>

        {/* Registered Office */}
        <p className="text-[9px] leading-relaxed mb-3" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
          Registered Office: 303, Guru Ghasidas Plaza, Amapara, G.E. Road, Raipur (C.G.) – 492 001
        </p>

        {/* Confidentiality disclaimer */}
        <div className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "rgba(255, 255, 255, 0.6)" }}>
          Strictly Private & Confidential
        </div>
      </div>
    </div>
  );
}

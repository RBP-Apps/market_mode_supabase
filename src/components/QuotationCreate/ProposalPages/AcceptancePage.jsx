import React from "react";

export default function AcceptancePage({ formData = {} }) {
  const clientName = formData.customer || "Mr. Subham Singhal";

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
              10
            </div>
            
            {/* Right Title Text */}
            <div
              className="flex items-center text-white font-bold text-[14px] pl-4 flex-1"
              style={{
                backgroundColor: "#008C95"
              }}
            >
              Acceptance
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col justify-start overflow-hidden">
          
          {/* Acceptance Statement */}
          <p className="text-gray-700 text-[11px] leading-relaxed text-justify mb-20 px-0.5">
            Agreed to all the terms and conditions mentioned herein above, with the best of health and spirit.
          </p>

          {/* Signature Section - Two equal columns */}
          <div className="flex justify-between items-start w-full px-0.5 mt-10">
            {/* Left Column (RBP Energy) */}
            <div style={{ width: "320px" }}>
              {/* Signature Line */}
              <div className="w-full h-[0.75px] bg-gray-400 mb-4" />
              
              <div
                className="font-bold text-[12px] mb-1"
                style={{ color: "#00695C" }}
              >
                For RBP Energy (India) Pvt. Ltd.
              </div>
              <div className="text-gray-500 text-[10.5px]">
                Authorised Signatory
              </div>
            </div>

            {/* Right Column (Client) */}
            <div style={{ width: "320px" }}>
              {/* Signature Line */}
              <div className="w-full h-[0.75px] bg-gray-400 mb-4" />
              
              <div
                className="font-bold text-[12px] mb-1"
                style={{ color: "#00695C" }}
              >
                For the Client
              </div>
              <div className="text-gray-500 text-[10.5px]">
                {clientName}
              </div>
            </div>
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
          <div>Page 12 of 14</div>
        </div>
      </div>
    </div>
  );
}

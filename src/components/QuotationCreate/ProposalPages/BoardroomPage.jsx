import React from "react";

// Reusable DirectorCard Component as requested
function DirectorCard({ name, designation, description }) {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "rgba(0, 140, 149, 0.04)",
        border: "1px solid #E2E8F0",
        borderTop: "3.5px solid #F7941D",
        padding: "16px 20px",
        boxSizing: "border-box"
      }}
    >
      {/* Profile Header: Name & Designation on the same line */}
      <div className="flex items-baseline gap-2 mb-2">
        <span
          className="font-bold text-[13px]"
          style={{ color: "#00695C" }}
        >
          {name}
        </span>
        <span
          className="font-bold text-[9.5px]"
          style={{ color: "#F7941D" }}
        >
          {designation}
        </span>
      </div>
      
      {/* Profile Description */}
      <p className="text-gray-700 text-[10px] leading-relaxed text-justify m-0">
        {description}
      </p>
    </div>
  );
}

export default function BoardroomPage() {
  const directors = [
    {
      name: "Mr. Gaurav Jain",
      designation: "Director — Strategy & Growth",
      description: "An Electronics & Telecommunication Engineer with an MBA from S.P. Jain Institute of Management and Research, Mumbai. He took the reins of the family's construction and real-estate business, Bhilai Builders Pvt. Ltd., before venturing into the energy sector. His strategic leadership has been pivotal in establishing RBP Energy Group as a prominent force in India's renewable-energy transition, with a vision to take RBP Energy public for a greener India."
    },
    {
      name: "Mr. Jaikishan Bajaj",
      designation: "Director — Marketing & Operations",
      description: "A Mechanical Engineer with an instinct for marketing, blending technical acumen with strategic market insight. He serves as President of the Chhattisgarh Solar Association and is an active member of the Institution of Engineers (India). Under his leadership, RBP Energy Group has reached an annual revenue of ₹425 crore."
    },
    {
      name: "Mr. Saurabh Pandey",
      designation: "Director — Solar Electrification",
      description: "Beginning his career at CREDA, Mr. Pandey developed deep expertise in solar electrification. Active in the sector since 2008, he has executed projects involving approximately 1,000,000 solar pumps and 15 community irrigation systems, making a significant impact on sustainable agriculture."
    },
    {
      name: "Mr. Siddharth Khandelwal",
      designation: "Director — Finance",
      description: "A Civil Engineer (B.Tech, IIT Madras) with an MBA in Finance from the Indian School of Business. After a career in finance — particularly solar finance — he now drives RBP's financial strategy, championing quality service to ease the world's transition to renewable energy."
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
              03
            </div>
            
            {/* Right Title Text */}
            <div
              className="flex items-center text-white font-bold text-[14px] pl-4 flex-1"
              style={{
                backgroundColor: "#008C95"
              }}
            >
              The Boardroom
            </div>
          </div>
        </div>

        {/* CONTENT AREA: Stacked Director Cards */}
        <div className="flex-1 flex flex-col gap-4 justify-start">
          {directors.map((director, index) => (
            <DirectorCard
              key={index}
              name={director.name}
              designation={director.designation}
              description={director.description}
            />
          ))}
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
          <div>Page 4 of 14</div>
        </div>
      </div>
    </div>
  );
}

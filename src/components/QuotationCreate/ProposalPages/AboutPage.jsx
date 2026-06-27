import React from "react";

export default function AboutPage() {
  const achievements = [
    "121+ MW of solar systems installed nationwide, with 55 MW of ground-mounted plants currently in execution.",
    "5,000+ rooftop and ground solar power plants across 33 districts of Chhattisgarh.",
    "30,000+ solar irrigation pumps (2 HP-10 HP) empowering farmers.",
    "12,000+ solar home-lighting systems with Lithium Ferro-Phosphate batteries across 100+ villages, including SAUBHAGYA, RVE and DDG schemes under REC and the Government of Chhattisgarh.",
    "1,100+ solar dual pumps supplying safe drinking water under the Jal Jeevan Mission.",
    "60+ solar high-masts and 500+ solar street-lights improving rural safety."
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
              01
            </div>
            
            {/* Right Title Text */}
            <div
              className="flex items-center text-white font-bold text-[14px] pl-4 flex-1"
              style={{
                backgroundColor: "#008C95"
              }}
            >
              About RBP Energy
            </div>
          </div>
        </div>

        {/* CONTENT AREA: Single column document styling */}
        <div className="flex-1 text-[11px] leading-[1.6] text-gray-800 space-y-5 pr-2">
          
          {/* Intro Paragraph */}
          <p className="text-justify font-normal">
            RBP Energy (India) Pvt. Ltd. is a Central-India solar EPC leader, accredited by leading State Nodal Agencies 
            (including CREDA) for solar power installations and RESCO projects. For over 14 years we have designed, 
            engineered, built and commissioned utility-grade solar assets for industrial, commercial, residential and 
            government clients across Chhattisgarh, Maharashtra, Jharkhand, Uttar Pradesh, Haryana, Rajasthan and 
            Madhya Pradesh.
          </p>

          {/* Our Vision */}
          <div className="space-y-1">
            <h3 className="font-bold text-[12px] text-[#F7941D]">
              Our Vision
            </h3>
            <p className="text-justify">
              To lead India's renewable-energy transition by delivering world-class solar power plants and integrated 
              EPC solutions that power a sustainable, competitive and self-reliant future.
            </p>
          </div>

          {/* Our Mission */}
          <div className="space-y-1">
            <h3 className="font-bold text-[12px] text-[#F7941D]">
              Our Mission
            </h3>
            <p className="text-justify">
              To design, engineer, finance, build and maintain high-performing solar assets for industries, 
              businesses and communities — making clean-energy adoption faster, simpler and more affordable 
              across India.
            </p>
          </div>

          {/* What we have delivered */}
          <div className="space-y-2">
            <h3 className="font-bold text-[12px] text-[#008C95]">
              What we have delivered
            </h3>
            <ul className="space-y-2.5 pl-1">
              {achievements.map((item, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  {/* Square bullet point matching reference */}
                  <span
                    className="shrink-0 mt-[6px]"
                    style={{
                      width: "4px",
                      height: "4px",
                      backgroundColor: "#F7941D",
                      borderRadius: "0"
                    }}
                  />
                  <span className="text-justify">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Our corporate philosophy */}
          <div className="space-y-2 pt-1">
            <h3 className="font-bold text-[12px] text-[#008C95]">
              Our corporate philosophy
            </h3>
            <p className="text-justify">
              We make clean energy available to homeowners, businesses, industries, schools, non-profits and 
              government organisations at a lower cost than power generated by burning fossil fuels. Systems are 
              installed to the highest engineering standards while keeping the switch simple for our customers — a 
              cleaner, more affordable alternative to the monthly utility bill. We call this Better Energy.
            </p>
            <p className="text-justify">
              Our strength lies in delivering advanced technology at affordable prices, backed by strategic 
              partnerships with leading global corporations and India's top engineers. From drawing and design to technology, installation and commissioning, every detail is handled in‑house. We also manufacture MS structures, LED and street lights, and charge controllers.
            </p>
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
          <div>Page 2 of 14</div>
        </div>
      </div>
    </div>
  );
}

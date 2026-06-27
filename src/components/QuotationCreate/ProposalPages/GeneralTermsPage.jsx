import React from "react";

export default function GeneralTermsPage() {
  const commercialTerms = [
    {
      label: "Price basis",
      value: "CIF up to a single-point location in Chhattisgarh."
    },
    {
      label: "Taxes & duties",
      value: "All taxes and duties are shown in the price schedule. Any new taxes or rate changes due to government policy during dispatch will be to the consignee's account."
    },
    {
      label: "Packing",
      value: "Prices are inclusive of packing, done as per our standard practice."
    },
    {
      label: "Freight & insurance",
      value: "Inclusive of freight and transit insurance. Storage insurance is to be provided by the customer."
    },
    {
      label: "Validity of offer",
      value: "Valid for 15 days from the date of offer, thereafter subject to our reconfirmation. Installation, operation and maintenance are executed through registered associate firms on a turnkey basis."
    },
    {
      label: "Terms of payment",
      value: "100% in advance — 25% on booking confirmation, 45% before procurement and manufacturing, 25% prior to material dispatch, 5% before installation and commissioning."
    },
    {
      label: "Period of installation",
      value: "Within 3 months from the date of sanction from CREDA, subject to the site being clear and suitable for installation."
    },
    {
      label: "Right & lien of property",
      value: "We retain rights to all supplied equipment, materials and parts until their full invoice value is paid as per terms."
    },
    {
      label: "Jurisdiction",
      value: "Subject to the jurisdiction of Raipur courts only."
    }
  ];

  const warrantyTerms = [
    {
      label: "Solar modules",
      value: "5 years on product & workmanship; 12 years on 90% power output; 30 years on 80% power output."
    },
    {
      label: "Balance of supply",
      value: "60 months on product & workmanship (inverter); 12 months against manufacturing defects for switchgear."
    },
    {
      label: "Generation guarantee",
      value: "Minimum generation guarantee of 1,500 kWh per kWp per annum."
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
        padding: "30px 50px 25px 50px", // Slightly reduced padding to guarantee single page fit
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
        <div className="flex justify-end w-full mb-3">
          <img
            src="/Logo.PNG"
            alt="RBP Logo"
            crossOrigin="anonymous"
            style={{
              height: "40px",
              objectFit: "contain"
            }}
          />
        </div>

        {/* SECTION HEADER BAR */}
        <div className="w-full mb-4">
          {/* Accent orange line */}
          <div className="w-full h-[2px] bg-[#F7941D] mb-1.5" />
          
          {/* Header Bar */}
          <div className="flex w-full h-[30px] items-stretch">
            {/* Left Section Code */}
            <div
              className="flex items-center justify-center text-white font-bold text-[13px]"
              style={{
                backgroundColor: "#F7941D",
                width: "40px"
              }}
            >
              09
            </div>
            
            {/* Right Title Text */}
            <div
              className="flex items-center text-white font-bold text-[13px] pl-4 flex-1"
              style={{
                backgroundColor: "#008C95"
              }}
            >
              General & Commercial Terms
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col justify-start overflow-hidden">
          
          {/* Introductory Sentence */}
          <p className="text-gray-700 text-[10.5px] leading-relaxed text-justify mb-3 px-0.5">
            RBP Energy (India) Pvt. Ltd. and the Client agree to abide by the terms and conditions set out below.
          </p>

          {/* Commercial Terms Table */}
          <div className="w-full mb-4">
            <table className="w-full border-collapse" style={{ border: "1px solid #CBD5E1" }}>
              <tbody>
                {commercialTerms.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #CBD5E1" }} className="last:border-b-0">
                    <td
                      className="font-bold text-[10px] p-2 text-left border-r border-[#CBD5E1] leading-normal"
                      style={{
                        backgroundColor: "rgba(0, 140, 149, 0.06)",
                        color: "#00695C",
                        width: "180px",
                        verticalAlign: "middle"
                      }}
                    >
                      {row.label}
                    </td>
                    <td className="text-gray-700 text-[9.5px] p-2 text-left bg-white leading-relaxed">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section Header: Warranty & Generation Guarantee */}
          <h3
            className="font-bold text-[12.5px] mb-2 text-left"
            style={{ color: "#00695C" }}
          >
            Warranty & Generation Guarantee
          </h3>

          {/* Warranty Terms Table */}
          <div className="w-full">
            <table className="w-full border-collapse" style={{ border: "1px solid #CBD5E1" }}>
              <tbody>
                {warrantyTerms.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #CBD5E1" }} className="last:border-b-0">
                    <td
                      className="font-bold text-[10px] p-2 text-left border-r border-[#CBD5E1] leading-normal"
                      style={{
                        backgroundColor: "rgba(0, 140, 149, 0.06)",
                        color: "#00695C",
                        width: "180px",
                        verticalAlign: "middle"
                      }}
                    >
                      {row.label}
                    </td>
                    <td className="text-gray-700 text-[9.5px] p-2 text-left bg-white leading-relaxed">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <div className="w-full shrink-0 mt-3">
        {/* Divider line */}
        <div className="w-full h-[0.75px] bg-gray-200 mb-2" />
        
        {/* Footer content */}
        <div className="flex justify-between items-center text-[9px] text-gray-400 font-medium px-1">
          <div>RBP Energy (India) Pvt. Ltd.</div>
          <div>Renewable Energy Solutions</div>
          <div>Page 11 of 14</div>
        </div>
      </div>
    </div>
  );
}

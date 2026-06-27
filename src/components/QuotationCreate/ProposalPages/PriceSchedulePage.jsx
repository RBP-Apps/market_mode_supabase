import React from "react";

// Helper to convert number to Indian Words
function toWordsIndian(num) {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function numToWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + numToWords(n % 100) : "");
    return "";
  }

  let n = Math.round(num);
  if (n === 0) return "Zero";

  let str = "";

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  if (crore > 0) {
    str += numToWords(crore) + " Crore ";
  }

  const lakh = Math.floor(n / 100000);
  n %= 100000;
  if (lakh > 0) {
    str += numToWords(lakh) + " Lakh ";
  }

  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (thousand > 0) {
    str += numToWords(thousand) + " Thousand ";
  }

  if (n > 0) {
    str += numToWords(n) + " ";
  }

  // Format dash-separated numbers nicely if needed or just return
  return (str.trim() + " Only.").replace(/\s+/g, " ");
}

export default function PriceSchedulePage({ formData = {}, productDetails = {} }) {
  // Parse capacity
  const capacity = formData.proposalFor || formData.capacity || "2.5 MWp";
  const capNum = parseFloat(capacity) || 2.5;
  const isKW = capacity.toLowerCase().includes("kw");
  const capacityKW = isKW ? capNum : capNum * 1000;

  // Parse total cost A (amount from productDetails)
  const costClean = String(productDetails.amount || "").replace(/,/g, "");
  const totalAmountA = formData.priceTotalA 
    ? parseFloat(String(formData.priceTotalA).replace(/,/g, "")) 
    : (parseFloat(costClean) || 102910500); // Default: 10,29,10,500

  // Back-calculate plant cost and GST for Row 1 & Row 2
  // A = PlantCost * 1.089
  const plantCost = formData.priceMaterial 
    ? parseFloat(String(formData.priceMaterial).replace(/,/g, "")) 
    : Math.round(totalAmountA / 1.089);
  const gstAmountA = formData.priceGstSupply 
    ? parseFloat(String(formData.priceGstSupply).replace(/,/g, "")) 
    : (totalAmountA - plantCost);

  // Calculate COMC (Row 4 & Row 5 & Row 6)
  // COMC is ₹5 Lakhs per MW per year for 5 years = ₹25 Lakhs per MW = ₹2500 per kW
  const comcBase = formData.priceOm 
    ? parseFloat(String(formData.priceOm).replace(/,/g, "")) 
    : Math.round(capacityKW * 2500); // 62,50,000 for 2.5 MWp
  const gstAmountB = formData.priceOmGst 
    ? parseFloat(String(formData.priceOmGst).replace(/,/g, "")) 
    : Math.round(comcBase * 0.18);
  const totalAmountB = formData.priceTotalB 
    ? parseFloat(String(formData.priceTotalB).replace(/,/g, "")) 
    : (comcBase + gstAmountB);

  // Row 7 (Total Project Cost)
  const totalProjectCost = formData.priceTotal 
    ? parseFloat(String(formData.priceTotal).replace(/,/g, "")) 
    : (totalAmountA + totalAmountB);

  const formattedPlantCost = Math.round(plantCost).toLocaleString("en-IN");
  const formattedGstA = Math.round(gstAmountA).toLocaleString("en-IN");
  const formattedTotalA = Math.round(totalAmountA).toLocaleString("en-IN");
  const formattedComc = Math.round(comcBase).toLocaleString("en-IN");
  const formattedGstB = Math.round(gstAmountB).toLocaleString("en-IN");
  const formattedTotalB = Math.round(totalAmountB).toLocaleString("en-IN");
  const formattedProjectCost = Math.round(totalProjectCost).toLocaleString("en-IN");

  const amountInWords = formData.priceWords || toWordsIndian(totalProjectCost);

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
              08
            </div>
            
            {/* Right Title Text */}
            <div
              className="flex items-center text-white font-bold text-[14px] pl-4 flex-1"
              style={{
                backgroundColor: "#008C95"
              }}
            >
              Price Schedule
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col justify-start overflow-hidden">
          
          {/* Pricing Table */}
          <div className="w-full mb-4">
            <table className="w-full border-collapse" style={{ border: "1px solid #CBD5E1" }}>
              <thead>
                <tr style={{ backgroundColor: "#00695C" }}>
                  <th className="text-white font-bold text-[11px] p-2.5 text-center border-r border-[#CBD5E1]/20" style={{ width: "40px" }}>#</th>
                  <th className="text-white font-bold text-[11px] p-2.5 text-left border-r border-[#CBD5E1]/20">Description</th>
                  <th className="text-white font-bold text-[11px] p-2.5 text-right" style={{ width: "130px" }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {/* Row 1 */}
                <tr style={{ borderBottom: "1px solid #CBD5E1" }}>
                  <td className="text-gray-700 text-[10.5px] p-2.5 text-center border-r border-[#CBD5E1] bg-white">1</td>
                  <td className="text-gray-700 text-[10.5px] p-2.5 text-left border-r border-[#CBD5E1] bg-white leading-relaxed">
                    {capacity} solar power plant material as per the technical specifications above, with installation and commissioning (grid-connected, without battery bank)
                  </td>
                  <td className="text-gray-700 text-[10.5px] p-2.5 text-right border-r border-[#CBD5E1] bg-white font-medium">{formattedPlantCost}</td>
                </tr>

                {/* Row 2 */}
                <tr style={{ borderBottom: "1px solid #CBD5E1" }}>
                  <td className="text-gray-700 text-[10.5px] p-2.5 text-center border-r border-[#CBD5E1] bg-white">2</td>
                  <td className="text-gray-700 text-[10.5px] p-2.5 text-left border-r border-[#CBD5E1] bg-white">
                    GST @ 8.9% (70% supply @ 12% + 30% service @ 18%)
                  </td>
                  <td className="text-gray-700 text-[10.5px] p-2.5 text-right border-r border-[#CBD5E1] bg-white font-medium">{formattedGstA}</td>
                </tr>

                {/* Row 3 (Total Amount A - Highlighted) */}
                <tr style={{ borderBottom: "1px solid #CBD5E1", backgroundColor: "rgba(0, 140, 149, 0.06)" }}>
                  <td className="text-[#00695C] font-bold text-[10.5px] p-2.5 text-center border-r border-[#CBD5E1]">3</td>
                  <td className="text-[#00695C] font-bold text-[10.5px] p-2.5 text-left border-r border-[#CBD5E1]">
                    Total Amount (A)
                  </td>
                  <td className="text-[#00695C] font-bold text-[10.5px] p-2.5 text-right border-r border-[#CBD5E1]">{formattedTotalA}</td>
                </tr>

                {/* Row 4 */}
                <tr style={{ borderBottom: "1px solid #CBD5E1" }}>
                  <td className="text-gray-700 text-[10.5px] p-2.5 text-center border-r border-[#CBD5E1] bg-white">4</td>
                  <td className="text-gray-700 text-[10.5px] p-2.5 text-left border-r border-[#CBD5E1] bg-white">
                    Comprehensive Operation & Maintenance (COMC)
                  </td>
                  <td className="text-gray-700 text-[10.5px] p-2.5 text-right border-r border-[#CBD5E1] bg-white font-medium">{formattedComc}</td>
                </tr>

                {/* Row 5 */}
                <tr style={{ borderBottom: "1px solid #CBD5E1" }}>
                  <td className="text-gray-700 text-[10.5px] p-2.5 text-center border-r border-[#CBD5E1] bg-white">5</td>
                  <td className="text-gray-700 text-[10.5px] p-2.5 text-left border-r border-[#CBD5E1] bg-white">
                    GST @ 18%
                  </td>
                  <td className="text-gray-700 text-[10.5px] p-2.5 text-right border-r border-[#CBD5E1] bg-white font-medium">{formattedGstB}</td>
                </tr>

                {/* Row 6 (Total COMC B - Highlighted) */}
                <tr style={{ borderBottom: "1px solid #CBD5E1", backgroundColor: "rgba(0, 140, 149, 0.06)" }}>
                  <td className="text-[#00695C] font-bold text-[10.5px] p-2.5 text-center border-r border-[#CBD5E1]">6</td>
                  <td className="text-[#00695C] font-bold text-[10.5px] p-2.5 text-left border-r border-[#CBD5E1]">
                    Total COMC Amount (B)
                  </td>
                  <td className="text-[#00695C] font-bold text-[10.5px] p-2.5 text-right border-r border-[#CBD5E1]">{formattedTotalB}</td>
                </tr>

                {/* Row 7 (Total Project Cost A + B - Orange Highlighted) */}
                <tr style={{ backgroundColor: "#F7941D" }}>
                  <td className="text-white font-bold text-[11px] p-2.5 text-center border-r border-[#CBD5E1]/20">7</td>
                  <td className="text-white font-bold text-[11px] p-2.5 text-left border-r border-[#CBD5E1]/20">
                    Total Project Cost (A + B)
                  </td>
                  <td className="text-white font-bold text-[11px] p-2.5 text-right">{formattedProjectCost}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* In Words Section */}
          <div className="text-[11px] mb-6 px-1">
            <span className="font-bold text-gray-800">In words: </span>
            <span className="italic text-gray-700">{amountInWords}</span>
          </div>

          {/* Information Table */}
          <div className="w-full">
            <table className="w-full border-collapse" style={{ border: "1px solid #CBD5E1" }}>
              <tbody>
                {/* Subsidy Row */}
                <tr style={{ borderBottom: "1px solid #CBD5E1" }}>
                  <td
                    className="font-bold text-[11px] p-3 text-left border-r border-[#CBD5E1]"
                    style={{
                      backgroundColor: "rgba(0, 140, 149, 0.06)",
                      color: "#00695C",
                      width: "160px"
                    }}
                  >
                    Subsidy
                  </td>
                  <td className="text-gray-700 text-[10.5px] p-3 text-left bg-white leading-relaxed">
                    No subsidy is available from the central or state government for systems other than residential up to 3 kW.
                  </td>
                </tr>
                
                {/* Processing Fee Row */}
                <tr>
                  <td
                    className="font-bold text-[11px] p-3 text-left border-r border-[#CBD5E1]"
                    style={{
                      backgroundColor: "rgba(0, 140, 149, 0.06)",
                      color: "#00695C"
                    }}
                  >
                    Processing fee
                  </td>
                  <td className="text-gray-700 text-[10.5px] p-3 text-left bg-white leading-relaxed">
                    As applicable, payable by you to CSPDCL for the system-approval application.
                  </td>
                </tr>
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
          <div>Page 10 of 14</div>
        </div>
      </div>
    </div>
  );
}

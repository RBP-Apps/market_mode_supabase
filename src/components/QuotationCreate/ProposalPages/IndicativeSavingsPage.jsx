import React from "react";

export default function IndicativeSavingsPage({ formData = {}, productDetails = {} }) {
  // Parse capacity
  const capacity = formData.proposalFor || formData.capacity || "2.5 MWp";
  const capNum = parseFloat(capacity) || 2.5;
  const isKW = capacity.toLowerCase().includes("kw");
  const capacityKW = isKW ? capNum : capNum * 1000;
  const annualGen = formData.annualGen 
    ? parseFloat(String(formData.annualGen).replace(/,/g, "")) 
    : (capacityKW * 1500); // in kWh per annum
  const lakhUnits = annualGen / 100000;

  // Parse cost
  const capexCrVal = formData.capexCr ? parseFloat(formData.capexCr) * 10000000 : null;
  const costClean = String(productDetails.amount || "").replace(/,/g, "");
  const costNum = capexCrVal || parseFloat(costClean) || 102900000; // Default to 10.29 Cr

  // Calculate savings & payback
  const tariff1 = formData.tariffLow ? parseFloat(formData.tariffLow) : 6.5;
  const savings1 = formData.savingsLow ? parseFloat(String(formData.savingsLow).replace(/,/g, "")) : (annualGen * tariff1);
  const payback1 = costNum / savings1;

  const tariff2 = formData.tariffHigh ? parseFloat(formData.tariffHigh) : 8.0;
  const savings2 = formData.savingsHigh ? parseFloat(String(formData.savingsHigh).replace(/,/g, "")) : (annualGen * tariff2);
  const payback2 = costNum / savings2;

  // Format helper for currency (lakh/crore)
  const formatCroreOrLakh = (val) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    } else {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
  };

  // 25-year lifetime gross savings
  const lifeSavings1 = formData.savings25Low ? parseFloat(String(formData.savings25Low).replace(/,/g, "")) : (savings1 * 25);
  const lifeSavings2 = formData.savings25High ? parseFloat(String(formData.savings25High).replace(/,/g, "")) : (savings2 * 25);

  const costCrStr = formData.capexCr ? `${formData.capexCr} Cr` : (costNum >= 10000000 ? `${(costNum / 10000000).toFixed(2)} Cr` : `${(costNum / 100000).toFixed(2)} Lakh`);
  const lifeSavings1Str = formData.savings25Low ? `₹${formData.savings25Low}` : (lifeSavings1 >= 10000000 ? `₹${Math.round(lifeSavings1 / 10000000)} Cr` : `₹${(lifeSavings1 / 100000).toFixed(1)} Lakh`);
  const lifeSavings2Str = formData.savings25High ? `₹${formData.savings25High}` : (lifeSavings2 >= 10000000 ? `₹${Math.round(lifeSavings2 / 10000000)} Cr` : `₹${(lifeSavings2 / 100000).toFixed(1)} Lakh`);

  // CO2 avoided (0.8 kg/kWh)
  const co2Avoided = formData.co2Tonnes ? parseFloat(String(formData.co2Tonnes).replace(/,/g, "")) : Math.round(annualGen * 0.0008);

  const tableData = [
    {
      scenario: "Conservative",
      tariff: `₹${tariff1.toFixed(1)} / unit`,
      savings: `~${formatCroreOrLakh(savings1)} / yr`,
      payback: `~${payback1.toFixed(1)} years`
    },
    {
      scenario: "Higher tariff",
      tariff: `₹${tariff2.toFixed(1)} / unit`,
      savings: `~${formatCroreOrLakh(savings2)} / yr`,
      payback: `~${payback2.toFixed(1)} years`
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
              07
            </div>
            
            {/* Right Title Text */}
            <div
              className="flex items-center text-white font-bold text-[14px] pl-4 flex-1"
              style={{
                backgroundColor: "#008C95"
              }}
            >
              Indicative Generation, Savings & Payback
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col justify-start overflow-hidden">
          
          {/* Introduction Paragraph */}
          <p className="text-gray-700 text-[11px] leading-relaxed text-justify mb-6">
            Based on RBP’s minimum generation guarantee of 1,500 kWh per kWp per annum, the {capacity} plant is expected to generate approximately {lakhUnits.toFixed(1)} lakh units (kWh) per year. The figures below are illustrative, to help you assess returns; actual savings depend on your applicable tariff, consumption pattern and the prevailing net-metering / open-access policy.
          </p>

          {/* Comparison Table */}
          <div className="w-full mb-6">
            <table className="w-full border-collapse" style={{ border: "1px solid #CBD5E1" }}>
              <thead>
                <tr style={{ backgroundColor: "#00695C" }}>
                  <th className="text-white font-bold text-[11px] p-3 text-left border-r border-[#CBD5E1]/20">Scenario</th>
                  <th className="text-white font-bold text-[11px] p-3 text-center border-r border-[#CBD5E1]/20">Grid tariff</th>
                  <th className="text-white font-bold text-[11px] p-3 text-center border-r border-[#CBD5E1]/20">Annual savings</th>
                  <th className="text-white font-bold text-[11px] p-3 text-center">Simple payback</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #CBD5E1" }} className="last:border-b-0">
                    {/* Scenario (Bold) */}
                    <td
                      className="font-bold text-[11px] p-3 text-left border-r border-[#CBD5E1]"
                      style={{
                        backgroundColor: "rgba(0, 140, 149, 0.04)",
                        color: "#00695C",
                        width: "25%"
                      }}
                    >
                      {row.scenario}
                    </td>
                    {/* Grid tariff */}
                    <td className="text-gray-700 text-[10.5px] p-3 text-center border-r border-[#CBD5E1] bg-white">
                      {row.tariff}
                    </td>
                    {/* Annual savings */}
                    <td className="text-gray-700 text-[10.5px] p-3 text-center border-r border-[#CBD5E1] bg-white">
                      {row.savings}
                    </td>
                    {/* Simple payback */}
                    <td className="text-gray-700 text-[10.5px] p-3 text-center bg-white">
                      {row.payback}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Description Paragraph */}
          <p className="text-gray-700 text-[11px] leading-relaxed text-justify mt-2">
            Simple payback is calculated on the EPC capital cost of ₹{costCrStr} (excluding O&M). Over a 25-year life, indicative gross savings range from roughly {lifeSavings1Str} to {lifeSavings2Str} at flat tariffs — materially higher once annual tariff escalation is considered. A {capacity} plant also avoids an estimated {co2Avoided.toLocaleString("en-IN")}+ tonnes of CO2 per year. These projections are indicative engineering estimates and not a financial guarantee or investment advice.
          </p>

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
          <div>Page 9 of 14</div>
        </div>
      </div>
    </div>
  );
}

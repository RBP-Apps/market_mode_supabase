import { useState } from "react";
import { Eye, XCircle, Save } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RBP_LOGO_BASE64 } from "../../utils/rbpLogo";

// ─── Number to Words (Indian System) ─────────────────────────────────────────
function toWords(num) {
  if (!num || isNaN(num)) return "";
  const n = Math.round(parseFloat(num));
  if (n === 0) return "Zero Rupees Only";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function conv(x) {
    if (x === 0) return "";
    if (x < 20) return ones[x] + " ";
    if (x < 100) return tens[Math.floor(x / 10)] + (x % 10 ? " " + ones[x % 10] : "") + " ";
    return ones[Math.floor(x / 100)] + " Hundred " + conv(x % 100);
  }
  let result = "";
  let rem = n;
  if (rem >= 10000000) { result += conv(Math.floor(rem / 10000000)) + "Crore "; rem %= 10000000; }
  if (rem >= 100000) { result += conv(Math.floor(rem / 100000)) + "Lakh "; rem %= 100000; }
  if (rem >= 1000) { result += conv(Math.floor(rem / 1000)) + "Thousand "; rem %= 1000; }
  if (rem > 0) { result += conv(rem); }
  return "Rupees " + result.trim() + " Only";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function QuotationPreview({ formData, productDetails, onClose, onSubmit, isSubmitting }) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Calculations
  const amount = parseFloat(productDetails.amount || 0);
  const disc = parseFloat(formData.disc || 0);
  const gstRaw = parseFloat(productDetails.gst || 0);
  const gstPct = gstRaw < 1 ? gstRaw * 100 : gstRaw;
  const afterDisc = amount - (amount * disc) / 100;
  const gstAmt = gstRaw < 1 ? afterDisc * gstRaw : (afterDisc * gstRaw) / 100;
  const grandTotal = afterDisc + gstAmt;
  const central = parseFloat(formData.subCentral || 0);
  const stateSub = parseFloat(formData.subState || 0);
  const netCost = grandTotal - central - stateSub;
  const qty = parseFloat(formData.qty || 0);
  const rate = parseFloat(productDetails.rate || 0);

  const fmt = (v) =>
    parseFloat(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const quotationDate = formData.date
    ? (() => {
      const d = new Date(formData.date);
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
    })()
    : "";

  // ─── Build PDF ──────────────────────────────────────────────────────────────
  const buildPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const PW = 210;   // page width
    const PH = 297;   // page height
    const ML = 8;     // margin left
    const MR = 8;     // margin right
    const CW = PW - ML - MR;  // content width = 194

    // ── Helpers ──
    const bold = (s = 8) => { doc.setFont("helvetica", "bold"); doc.setFontSize(s); };
    const normal = (s = 7.5) => { doc.setFont("helvetica", "normal"); doc.setFontSize(s); };
    const black = () => doc.setTextColor(0, 0, 0);
    const blue = () => doc.setTextColor(0, 0, 200);
    const white = () => doc.setTextColor(255, 255, 255);
    const darkRed = () => doc.setTextColor(160, 0, 0);
    const rh = (v) => `Rs.${fmt(v)}`;

    // ── OUTER BORDER ──
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.4);
    doc.rect(ML - 2, 4, CW + 4, PH - 8);

    let y = 6;

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. TOP HEADER
    // ═══════════════════════════════════════════════════════════════════════════
    doc.setFillColor(255, 140, 0);
    doc.rect(ML, y, 35, 7, "F");
    bold(10); white();
    doc.text("Quotation", ML + 2, y + 5);

    normal(8); black();
    doc.text("****", PW / 2, y + 5, { align: "center" });

    doc.setFillColor(255, 255, 100);
    doc.rect(PW - MR - 18, y, 18, 7, "F");
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); darkRed();
    doc.text("Original", PW - MR - 9, y + 4.8, { align: "center" });

    y += 9;

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. COMPANY (left) + LOGO (center) + QUOTATION INFO (right)
    // ═══════════════════════════════════════════════════════════════════════════
    const topSectionY = y;

    // LEFT COLUMN (x=8 to ~x=77)
    black();
    normal(7.5);
    doc.text("Dealer:-", ML, y + 2);

    bold(8);
    doc.text("C/o:-  RBP ENERGY (INDIA)PVT.LTD.", ML, y + 7);

    normal(6.8);
    doc.text("3303 Guru Ghasidas Plaza, Amapara, G.E Road,", ML, y + 12);
    doc.text("RAIPUR (C.G) - 492 001, India", ML, y + 16.5);

    blue(); doc.setFontSize(6.8);
    doc.text("e: enquiry@rbpindia.com, www.rbpindia.com", ML, y + 21.5);

    black(); normal(6.8);
    doc.text("#N/A", ML, y + 26.5);
    doc.text("Sales +91 92000 12500 | Service +91 82000 12400", ML, y + 31.5);

    // CENTER: RBP Logo image
    const logoW = 44;
    const logoH = 28;
    const logoX = (PW - logoW) / 2;  // centered
    const logoY = topSectionY + 2;
    try {
      doc.addImage(RBP_LOGO_BASE64, "PNG", logoX, logoY, logoW, logoH);
    } catch (e) {
      // fallback: draw teal circles + RBP text
      const cx = PW / 2 - 12;
      for (let i = 0; i < 3; i++) {
        doc.setFillColor(0, 170, 170);
        doc.circle(cx + i * 12, logoY + 8, 5, "F");
        doc.setFillColor(255, 255, 255);
        doc.circle(cx + i * 12, logoY + 8, 3, "F");
      }
      bold(16); doc.setTextColor(0, 140, 140);
      doc.text("RBP", cx - 2, logoY + 22);
      black();
    }

    // RIGHT COLUMN (x=132 to x=202)
    const RX = 132;  // right column start
    black(); normal(7.5);

    // Line 1: RBP/2025-Quotation  [1002 yellow]  Dated  26/03/26
    doc.text("RBP/2025-Quotation", RX, y + 2);

    // Yellow box for quotation number
    const qno = String(formData.quotationNo || "");
    doc.setFillColor(255, 255, 0);
    doc.rect(RX + 44, y - 1.5, 18, 6.5, "F");
    doc.setDrawColor(150, 150, 0);
    doc.setLineWidth(0.2);
    doc.rect(RX + 44, y - 1.5, 18, 6.5, "S");
    bold(9); black();
    doc.text(qno, RX + 53, y + 3.3, { align: "center" });

    // Dated - top right
    normal(7.5); black();
    doc.text("Dated", PW - MR - 2, y - 1, { align: "right" });
    bold(8);
    doc.text(quotationDate, PW - MR - 2, y + 4, { align: "right" });

    // Payment Mode
    normal(7.5);
    doc.text("Payment Mode :- Chq/Online", RX, y + 9);

    // Salesperson
    doc.text(String(formData.salesperson || ""), RX, y + 15);

    // Email Id
    doc.text(`Email Id :- ${String(formData.email || "sales1@rbpindia.com")}`, RX, y + 21);

    // Reference By + Sub Dealer on same line
    doc.text(`Reference By :-`, RX, y + 27);
    doc.text(`Sub Dealer:-`, RX + 45, y + 27);

    y = topSectionY + 36;

    // ── Separator ──
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(ML, y, PW - MR, y);
    y += 3;

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. BUYER (left) + TERMS & CONDITIONS (right)
    // ═══════════════════════════════════════════════════════════════════════════
    const TERMS_X = PW / 2 + 2;  // terms column start

    // Orange Buyer badge
    doc.setFillColor(255, 140, 0);
    doc.rect(ML, y, 28, 6.5, "F");
    bold(9); white();
    doc.text("Buyer", ML + 2, y + 4.7);

    // Terms header
    bold(7.5); black();
    doc.text("Terms & Conditions:", TERMS_X, y + 4.7);

    y += 8;

    // Customer name (bold, larger)
    bold(9.5); black();
    doc.text(String(formData.customer || ""), ML, y);

    // Terms content on right side
    const tW = PW - MR - TERMS_X - 1;
    normal(6.5); black();
    const tLines = (formData.termsConditions || "").split("\n");
    let tY = y;
    tLines.forEach((line) => {
      if (line.trim() && tY < y + 28) {
        const wrapped = doc.splitTextToSize(line, tW);
        wrapped.forEach((l) => {
          if (tY < y + 28) { doc.text(l, TERMS_X, tY); tY += 3.8; }
        });
      }
    });

    y += 6;

    // City + For
    normal(7.5); black();
    doc.text(String(formData.placeOfInstallation || ""), ML, y);
    doc.text(`For:- ${String(formData.needType || "Residential")}`, ML + 52, y);

    y += 5;

    // Structure type
    doc.text(`Stucture:-   ${String(formData.structureType || "Normal")}`, ML, y);

    y += 5;

    // Phone + State/District - centered + bold
    bold(8.5); black();
    const centerLine = `${String(formData.contactNo || "")}     ${String(formData.loadDetails || "CHHATISHGARH")}`;
    doc.text(centerLine, PW / 2, y, { align: "center" });

    y += 5;

    // Email
    normal(7.5); black();
    doc.text("Email", ML, y);

    y += 6;

    // ── Separator ──
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(ML, y, PW - MR, y);
    y += 2;

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. PRODUCT TABLE
    // ═══════════════════════════════════════════════════════════════════════════
    autoTable(doc, {
      startY: y,
      tableWidth: CW,
      head: [[
        { content: "SL", styles: { halign: "center" } },
        { content: "Part Code", styles: { halign: "center" } },
        { content: "Product Name", styles: { halign: "center" } },
        { content: "BOM", styles: { halign: "center" } },
        { content: "Size", styles: { halign: "center" } },
        { content: "GST %", styles: { halign: "center" } },
        { content: "Rate", styles: { halign: "right" } },
        { content: "Quantity", styles: { halign: "center", fillColor: [255, 255, 0], textColor: [0, 0, 0] } },
        { content: "Amount", styles: { halign: "right" } },
      ]],
      body: [[
        { content: "1", styles: { halign: "center", valign: "top" } },
        { content: String(formData.rating || ""), styles: { halign: "center", valign: "top", fontSize: 7 } },
        { content: String(productDetails.productName || ""), styles: { valign: "top", fontSize: 7 } },
        { content: String(productDetails.bom || ""), styles: { valign: "top", fontSize: 6.8 } },
        { content: String(productDetails.size || ""), styles: { halign: "center", valign: "top", fontSize: 7 } },
        { content: `${gstPct.toFixed(2)}%`, styles: { halign: "center", valign: "top", fontSize: 7 } },
        { content: fmt(rate), styles: { halign: "right", valign: "top", fontSize: 7 } },
        { content: String(qty), styles: { halign: "center", valign: "top", fontSize: 7, fillColor: [255, 255, 180] } },
        { content: rh(amount), styles: { halign: "right", valign: "top", fontSize: 7 } },
      ]],
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 7.5,
        fontStyle: "bold",
        lineWidth: 0.3,
        lineColor: [80, 80, 80],
        halign: "center",
      },
      bodyStyles: {
        fontSize: 7,
        lineWidth: 0.3,
        lineColor: [80, 80, 80],
        minCellHeight: 30,
        valign: "top",
      },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 22 },
        2: { cellWidth: 28 },
        3: { cellWidth: 50 },
        4: { cellWidth: 11 },
        5: { cellWidth: 13 },
        6: { cellWidth: 21 },
        7: { cellWidth: 16 },
        8: { cellWidth: 25 },
      },
      margin: { left: ML, right: MR },
      tableLineColor: [80, 80, 80],
      tableLineWidth: 0.3,
    });

    y = doc.lastAutoTable.finalY + 3;

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. BANK (left) + TOTALS (right)
    // ═══════════════════════════════════════════════════════════════════════════
    const bankY = y;
    const MID_X = PW / 2;
    const TLX = MID_X + 5;   // totals label start
    const TVX = PW - MR - 1; // totals value right-align

    // Bank details (left)
    normal(7.5); black();
    doc.text("Our Bank", ML, bankY + 5);
    doc.text(`Account N  ${String(formData.accountNo || "")}`, ML, bankY + 10);
    doc.text(`IFSC Cod   ${String(formData.ifscCode || "")}`, ML, bankY + 15);
    doc.text(`Branch :   ${String(formData.branch || "")}`, ML, bankY + 20);

    // Totals (right side)
    // Row 0: %  →  Rs.0.00
    normal(7.5); black();
    doc.text("%", TVX - 28, bankY + 3, { align: "right" });
    bold(7.5);
    doc.text(rh(0), TVX, bankY + 3, { align: "right" });

    const totRows = [
      ["Total", rh(amount)],
      [`GST @ ${gstPct.toFixed(2)}%`, rh(gstAmt)],
      ["Grand Total", rh(grandTotal)],
      ["Central Subsidy", central > 0 ? rh(central) : ""],
      ["State Subsidy", stateSub > 0 ? rh(stateSub) : ""],
    ];

    totRows.forEach(([lbl, val], i) => {
      const ry = bankY + 8 + i * 5.2;
      normal(7.5); doc.text(lbl, TLX, ry);
      if (val) { bold(7.5); doc.text(val, TVX, ry, { align: "right" }); }
    });

    y = bankY + 34;

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. GENERAL TERMS & CONDITIONS (cyan background)
    // ═══════════════════════════════════════════════════════════════════════════
    const GT_H = 42;
    doc.setFillColor(0, 204, 204);
    doc.rect(ML, y, CW, GT_H, "F");

    bold(7.5); black();
    doc.text("General Terms & Conditions:", ML + 2, y + 5);

    // Split terms into two columns
    const gtLines = (formData.generalTerms || "").split("\n").filter(l => l.trim());
    const half = Math.ceil(gtLines.length / 2);
    const colW = CW / 2 - 5;

    normal(6.3); black();
    let gt1Y = y + 10;
    gtLines.slice(0, half).forEach(line => {
      if (gt1Y < y + GT_H - 5) {
        const ws = doc.splitTextToSize(line, colW);
        doc.text(ws, ML + 2, gt1Y);
        gt1Y += ws.length * 3.3;
      }
    });

    let gt2Y = y + 10;
    gtLines.slice(half).forEach(line => {
      if (gt2Y < y + GT_H - 5) {
        const ws = doc.splitTextToSize(line, colW);
        doc.text(ws, ML + CW / 2 + 2, gt2Y);
        gt2Y += ws.length * 3.3;
      }
    });

    // Net Cost row at bottom of cyan box
    bold(7); black();
    doc.text("Total Amount Chargeable (in words)", ML + 2, y + GT_H - 3);
    doc.text("(E. & O.E.)", ML + 76, y + GT_H - 3);
    doc.text("Net Cost :", MID_X + 8, y + GT_H - 3);
    bold(7.5);
    doc.text(rh(netCost), TVX, y + GT_H - 3, { align: "right" });

    y += GT_H + 2;

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. AMOUNT IN WORDS
    // ═══════════════════════════════════════════════════════════════════════════
    normal(7); black();
    doc.text(toWords(netCost), ML + 2, y + 3);
    doc.text("E. & O.E.", TVX, y + 3, { align: "right" });

    y += 8;

    // ═══════════════════════════════════════════════════════════════════════════
    // 8. WARRANTY + SOLAR PRODUCT RANGE
    // ═══════════════════════════════════════════════════════════════════════════
    const WX = ML;
    const SX = PW / 2 + 2;
    const halfW = PW / 2 - ML - 2;

    // Vertical divider
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);

    // Headers
    bold(8); black();
    doc.text("Warranty", WX + halfW / 2, y, { align: "center" });
    doc.text("SOLAR PRODUCT RANGE", SX + halfW / 2, y, { align: "center" });

    y += 4;

    const wRows = [
      "1. Solar Modules 5 Year against Manufacturing defect,",
      "   10 Year limited warranty on 90% Power Output,",
      "   25 Year Limited warranty on 80% Power Output.",
      "2. Inverter: 5 Years for 1Ph & 5 Years for 3Ph manufacturer's warranty",
      "3. Balance Of System 5 Year against manufacturing defect.",
      "4. Switchgear - On Actuals",
    ];
    const sRows = [
      [false, "1. POWER PLANTS (1kW - 500KW)"],
      [false, "2. IRRIGATION & DRINKING WATER DUAL PUMPS"],
      [false, "3. STREET LIGHTS & HIGH MASTS"],
      [false, "4. HOME LIGHTING SYSTEMS"],
      [true, "MANUFACTURING:"],
      [true, "MS STRUCTURES & LED n STREET LIGHTS"],
    ];

    normal(6.5); black();
    wRows.forEach((line, i) => { doc.setFont("helvetica", "normal"); doc.text(line, WX, y + i * 4); });
    sRows.forEach(([bl, line], i) => {
      doc.setFont("helvetica", bl ? "bold" : "normal");
      doc.text(line, SX, y + i * 4);
    });

    y += wRows.length * 4 + 3;

    // ═══════════════════════════════════════════════════════════════════════════
    // 9. DECLARATION
    // ═══════════════════════════════════════════════════════════════════════════
    doc.setFillColor(255, 255, 210);
    doc.setDrawColor(150, 150, 100);
    doc.setLineWidth(0.2);
    doc.rect(ML, y, CW, 9, "FD");

    bold(7); black();
    doc.text("Declaration:", ML + 2, y + 5);
    normal(7);
    doc.text(
      "We declare that this Quotation shows the actual price of the goods described and that all particulars are true and correct.",
      ML + 24, y + 5
    );

    y += 11;

    // ═══════════════════════════════════════════════════════════════════════════
    // 10. FOOTER
    // ═══════════════════════════════════════════════════════════════════════════
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.text(
      "This is a computer generated quotation. Hence, requires no signature. Subject to Raipur Jurisdiction.",
      PW / 2, y, { align: "center" }
    );

    return doc.output("blob");
  };

  // ─── Submit handler ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdfBlob = buildPDF();
      await onSubmit(pdfBlob);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Error generating PDF: " + err.message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ─── HTML Preview ─────────────────────────────────────────────────────────────
  const gtAllLines = (formData.generalTerms || "").split("\n").filter(l => l.trim());
  const gtHalf = Math.ceil(gtAllLines.length / 2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-3 rounded-t-xl flex justify-between items-center z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Quotation Preview — RBP Format
          </h2>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Document Preview */}
        <div className="p-4 bg-gray-100">
          <div style={{
            background: "#fff", margin: "0 auto", border: "1px solid #888",
            maxWidth: "820px", fontFamily: "Arial, sans-serif", fontSize: "11px",
          }}>

            {/* TOP HEADER */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px" }}>
              <span style={{ background: "#ff8c00", color: "#fff", fontWeight: "bold", padding: "2px 12px", fontSize: "12px" }}>Quotation</span>
              <span style={{ color: "#555" }}>****</span>
              <span style={{ background: "#ffff64", color: "#a00", fontWeight: "bold", padding: "2px 8px", border: "1px solid #bbb", fontSize: "10px" }}>Original</span>
            </div>

            {/* COMPANY + LOGO + QUOTATION DETAILS */}
            <div style={{ display: "flex", padding: "0 8px 6px", gap: "4px" }}>

              {/* Left */}
              <div style={{ width: "37%", fontSize: "10px" }}>
                <div style={{ color: "#666" }}>Dealer:-</div>
                <div style={{ fontWeight: "bold", fontSize: "11px" }}>C/o:-&nbsp;&nbsp;RBP ENERGY (INDIA)PVT.LTD.</div>
                <div>3303 Guru Ghasidas Plaza, Amapara, G.E Road,</div>
                <div>RAIPUR (C.G) - 492 001, India</div>
                <div style={{ color: "#00c" }}>e: enquiry@rbpindia.com, www.rbpindia.com</div>
                <div>#N/A</div>
                <div>Sales +91 92000 12500 | Service +91 82000 12400</div>
              </div>

              {/* Center: Real Logo */}
              <div style={{ width: "26%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src="/New Logo (For PDF).PNG" alt="RBP Logo" style={{ maxWidth: "140px", maxHeight: "80px", objectFit: "contain" }} />
              </div>

              {/* Right */}
              <div style={{ width: "37%", fontSize: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
                  <span>RBP/2025-Quotation</span>
                  <span style={{ background: "#ffff00", fontWeight: "bold", padding: "1px 6px", border: "1px solid #aaa", minWidth: "30px", textAlign: "center" }}>
                    {formData.quotationNo || ""}
                  </span>
                  <span style={{ marginLeft: "6px", color: "#555" }}>Dated</span>
                  <span style={{ fontWeight: "bold" }}>{quotationDate}</span>
                </div>
                <div>Payment Mode :- Chq/Online</div>
                <div style={{ fontWeight: "600" }}>{formData.salesperson || ""}</div>
                <div>Email Id :- {formData.email || "sales1@rbpindia.com"}</div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <span>Reference By :-</span>
                  <span>Sub Dealer:-</span>
                </div>
              </div>
            </div>

            <hr style={{ borderColor: "#ccc", margin: "0" }} />

            {/* BUYER + TERMS */}
            <div style={{ display: "flex", padding: "4px 8px", gap: "6px" }}>
              <div style={{ width: "48%" }}>
                <div>
                  <span style={{ background: "#ff8c00", color: "#fff", fontWeight: "bold", padding: "1px 10px", fontSize: "11px" }}>Buyer</span>
                </div>
                <div style={{ fontWeight: "bold", fontSize: "12px", marginTop: "3px" }}>{formData.customer || ""}</div>
                <div style={{ display: "flex", gap: "16px", fontSize: "10px" }}>
                  <span>{formData.placeOfInstallation || ""}</span>
                  <span>For:- {formData.needType || "Residential"}</span>
                </div>
                <div style={{ fontSize: "10px" }}>Stucture:-&nbsp;&nbsp; {formData.structureType || "Normal"}</div>
                <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "11px", margin: "3px 0" }}>
                  {formData.contactNo || ""}&nbsp;&nbsp;&nbsp;&nbsp;{formData.loadDetails || "CHHATISHGARH"}
                </div>
                <div style={{ fontSize: "10px" }}>Email</div>
              </div>
              <div style={{ width: "52%", borderLeft: "1px solid #eee", paddingLeft: "8px" }}>
                <div style={{ fontWeight: "bold", fontSize: "10px", marginBottom: "3px" }}>Terms &amp; Conditions:</div>
                <div style={{ whiteSpace: "pre-line", fontSize: "9px", color: "#333" }}>
                  {formData.termsConditions || ""}
                </div>
              </div>
            </div>

            <hr style={{ borderColor: "#ccc", margin: "0" }} />

            {/* PRODUCT TABLE */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
              <thead>
                <tr>
                  {["SL", "Part Code", "Product Name", "BOM", "Size", "GST %", "Rate", "Quantity", "Amount"].map((h, i) => (
                    <th key={h} style={{
                      border: "1px solid #777", padding: "3px 4px", textAlign: i === 7 ? "center" : i >= 6 ? "right" : "center",
                      background: i === 7 ? "#ffff00" : "#fff", fontWeight: "bold", fontSize: "10px",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #777", padding: "4px", textAlign: "center", verticalAlign: "top" }}>1</td>
                  <td style={{ border: "1px solid #777", padding: "4px", textAlign: "center", verticalAlign: "top", fontSize: "9px" }}>{formData.rating || ""}</td>
                  <td style={{ border: "1px solid #777", padding: "4px", verticalAlign: "top", fontSize: "9px" }}>{productDetails.productName || ""}</td>
                  <td style={{ border: "1px solid #777", padding: "4px", verticalAlign: "top", fontSize: "8.5px", whiteSpace: "pre-line" }}>{productDetails.bom || ""}</td>
                  <td style={{ border: "1px solid #777", padding: "4px", textAlign: "center", verticalAlign: "top", fontSize: "9px" }}>{productDetails.size || ""}</td>
                  <td style={{ border: "1px solid #777", padding: "4px", textAlign: "center", verticalAlign: "top", fontSize: "9px" }}>{gstPct.toFixed(2)}%</td>
                  <td style={{ border: "1px solid #777", padding: "4px", textAlign: "right", verticalAlign: "top", fontSize: "9px" }}>{fmt(rate)}</td>
                  <td style={{ border: "1px solid #777", padding: "4px", textAlign: "center", verticalAlign: "top", fontSize: "9px", background: "#ffffbb" }}>{qty}</td>
                  <td style={{ border: "1px solid #777", padding: "4px", textAlign: "right", verticalAlign: "top", fontSize: "9px" }}>Rs.{fmt(amount)}</td>
                </tr>
              </tbody>
            </table>

            {/* BANK + TOTALS */}
            <div style={{ display: "flex", padding: "6px 8px" }}>
              <div style={{ width: "50%", fontSize: "10px", lineHeight: "1.6" }}>
                <div>Our Bank</div>
                <div>Account N&nbsp; {formData.accountNo || ""}</div>
                <div>IFSC Cod&nbsp;&nbsp; {formData.ifscCode || ""}</div>
                <div>Branch :&nbsp;&nbsp; {formData.branch || ""}</div>
              </div>
              <div style={{ width: "50%", fontSize: "10px" }}>
                <table style={{ marginLeft: "auto", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ paddingRight: "12px", textAlign: "right" }}>%</td>
                      <td style={{ fontWeight: "bold", minWidth: "80px", textAlign: "right" }}>Rs.0.00</td>
                    </tr>
                    <tr>
                      <td style={{ paddingRight: "12px" }}>Total</td>
                      <td style={{ fontWeight: "bold", textAlign: "right" }}>Rs.{fmt(amount)}</td>
                    </tr>
                    <tr>
                      <td style={{ paddingRight: "12px" }}>GST @ {gstPct.toFixed(2)}%</td>
                      <td style={{ fontWeight: "bold", textAlign: "right" }}>Rs.{fmt(gstAmt)}</td>
                    </tr>
                    <tr>
                      <td style={{ paddingRight: "12px" }}>Grand Total</td>
                      <td style={{ fontWeight: "bold", textAlign: "right" }}>Rs.{fmt(grandTotal)}</td>
                    </tr>
                    <tr>
                      <td style={{ paddingRight: "12px" }}>Central Subsidy</td>
                      <td style={{ fontWeight: "bold", textAlign: "right" }}>{central > 0 ? `Rs.${fmt(central)}` : ""}</td>
                    </tr>
                    <tr>
                      <td style={{ paddingRight: "12px" }}>State Subsidy</td>
                      <td style={{ fontWeight: "bold", textAlign: "right" }}>{stateSub > 0 ? `Rs.${fmt(stateSub)}` : ""}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* GENERAL TERMS - CYAN */}
            <div style={{ background: "#00cccc", padding: "6px 8px" }}>
              <div style={{ fontWeight: "bold", fontSize: "10px", marginBottom: "4px" }}>General Terms &amp; Conditions:</div>
              <div style={{ display: "flex", gap: "8px", fontSize: "8.5px", lineHeight: "1.5" }}>
                <div style={{ width: "50%", whiteSpace: "pre-line" }}>{gtAllLines.slice(0, gtHalf).join("\n")}</div>
                <div style={{ width: "50%", whiteSpace: "pre-line" }}>{gtAllLines.slice(gtHalf).join("\n")}</div>
              </div>
            </div>

            {/* NET COST ROW */}
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #888", padding: "3px 6px", fontWeight: "bold", fontSize: "9.5px" }}>
              <span>Total Amount Chargeable (in words)</span>
              <span style={{ marginLeft: "12px" }}>(E. &amp; O.E.)</span>
              <span style={{ marginLeft: "auto" }}>Net Cost :</span>
              <span style={{ marginLeft: "10px" }}>Rs.{fmt(netCost)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "2px 6px", fontSize: "9px" }}>
              <span>{toWords(netCost)}</span>
              <span style={{ marginLeft: "auto", fontWeight: "bold" }}>E. &amp; O.E.</span>
            </div>

            {/* WARRANTY + SOLAR PRODUCT RANGE */}
            <div style={{ display: "flex", borderTop: "1px solid #ccc", padding: "4px 8px" }}>
              <div style={{ width: "50%" }}>
                <div style={{ fontWeight: "bold", textAlign: "center", marginBottom: "3px", fontSize: "10px" }}>Warranty</div>
                <div style={{ fontSize: "8.5px", lineHeight: "1.55" }}>
                  <div>1. Solar Modules 5 Year against Manufacturing defect,</div>
                  <div>&nbsp;&nbsp;&nbsp;10 Year limited warranty on 90% Power Output,</div>
                  <div>&nbsp;&nbsp;&nbsp;25 Year Limited warranty on 80% Power Output.</div>
                  <div>2. Inverter: 5 Years for 1Ph &amp; 5 Years for 3Ph manufacturer's warranty</div>
                  <div>3. Balance Of System 5 Year against manufacturing defect.</div>
                  <div>4. Switchgear - On Actuals</div>
                </div>
              </div>
              <div style={{ width: "50%", borderLeft: "1px solid #ccc", paddingLeft: "8px" }}>
                <div style={{ fontWeight: "bold", textAlign: "center", marginBottom: "3px", fontSize: "10px" }}>SOLAR PRODUCT RANGE</div>
                <div style={{ fontSize: "8.5px", lineHeight: "1.55" }}>
                  <div>1. POWER PLANTS (1kW - 500KW)</div>
                  <div>2. IRRIGATION &amp; DRINKING WATER DUAL PUMPS</div>
                  <div>3. STREET LIGHTS &amp; HIGH MASTS</div>
                  <div>4. HOME LIGHTING SYSTEMS</div>
                  <div style={{ fontWeight: "bold" }}>MANUFACTURING:</div>
                  <div style={{ fontWeight: "bold" }}>MS STRUCTURES &amp; LED n STREET LIGHTS</div>
                </div>
              </div>
            </div>

            {/* DECLARATION */}
            <div style={{ background: "#ffffcc", borderTop: "1px solid #ccc", borderBottom: "1px solid #ccc", padding: "4px 8px", fontSize: "9.5px" }}>
              <span style={{ fontWeight: "bold" }}>Declaration: </span>
              We declare that this Quotation shows the actual price of the goods described and that all particulars are true and correct.
            </div>

            {/* FOOTER */}
            <div style={{ textAlign: "center", fontStyle: "italic", fontSize: "9px", padding: "4px 8px", color: "#444" }}>
              This is a computer generated quotation. Hence, requires no signature. Subject to Raipur Jurisdiction.
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-3 rounded-b-xl border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 text-sm"
          >
            <XCircle className="h-4 w-4" /> Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isGeneratingPDF}
            className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            {isSubmitting || isGeneratingPDF ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating &amp; Submitting...
              </>
            ) : (
              <><Save className="h-4 w-4" /> Submit &amp; Save</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
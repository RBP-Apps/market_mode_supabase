import { useState, useRef } from "react";
import { Eye, XCircle, Save } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  const previewRef = useRef(null);

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

  const qty = formData.qty || 0;
  const rate = parseFloat(productDetails.rate || 0);

  const fmt = (v) =>
    parseFloat(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const quotationDate = formData.date
    ? (() => {
      const d = new Date(formData.date);
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
    })()
    : "";

  // ─── Bulletproof PDF Generation ──────────────────────────────────────────────
  const buildPDF = async () => {
    const element = previewRef.current;
    if (!element) throw new Error("Preview element not found");

    try {
      // Capture at exactly A4 Portrait dimensions
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: 1123,
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.querySelector("[data-pdf-preview]");
          if (clonedEl) {
            clonedEl.style.width = "794px";
            clonedEl.style.height = "1123px";
            clonedEl.style.minHeight = "1123px";
            clonedEl.style.maxHeight = "1123px";
            clonedEl.style.boxShadow = "none";
            clonedEl.style.border = "none";
            clonedEl.style.margin = "0";
            clonedEl.style.padding = "23px";
            clonedEl.style.overflow = "hidden";
            clonedEl.style.display = "flex";
            clonedEl.style.flexDirection = "column";
            clonedEl.style.boxSizing = "border-box";
          }
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        putOnlyUsedFonts: true,
        floatPrecision: 16
      });

      // Fit image to A4 width, scale height proportionally to avoid cut-off
      const pdfWidth = 210;
      const pdfPageHeight = 297;
      const imgHeightMm = (canvas.height * pdfWidth) / canvas.width;

      if (imgHeightMm <= pdfPageHeight) {
        // Content fits — place at top, exact proportional height
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, imgHeightMm, undefined, 'FAST');
      } else {
        // Content slightly overflows — scale down uniformly to fit A4
        const scale = pdfPageHeight / imgHeightMm;
        const scaledWidth = pdfWidth * scale;
        const xOffset = (pdfWidth - scaledWidth) / 2;
        pdf.addImage(imgData, "JPEG", xOffset, 0, scaledWidth, pdfPageHeight, undefined, 'FAST');
      }
      return pdf.output("blob");
    } catch (err) {
      console.error("Critical PDF Gen Error:", err);
      throw err;
    }
  };

  const handleSubmit = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdfBlob = await buildPDF();
      await onSubmit(pdfBlob);
    } catch (err) {
      alert("Error generating PDF: " + err.message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const gtLines = (formData.generalTerms || "").split("\n").filter(l => l.trim());
  const tcLines = (formData.termsConditions || "").split("\n").filter(l => l.trim());

  const colors = {
    teal: "#00506b",
    tealLight: "#e6f0f3",
    orange: "#f3a000",
    yellow: "#fff200",
    cyan: "#16d9d9",
    beige: "#efe0a5",
    footer: "#5f5f5f",
    rowAlt: "#f8f9fa",
    border: "#ced4da",
    textMain: "#212529",
    textMuted: "#6c757d",
    link: "#0056b3"
  };

  const cellStyle = {
    border: `1px solid ${colors.border}`,
    padding: "3px 6px",
    fontSize: "8px",
    verticalAlign: "middle",
    color: colors.textMain,
    lineHeight: "1.3"
  };

  const labelStyle = {
    ...cellStyle,
    fontWeight: "bold",
    color: colors.textMain,
    width: "35%"
  };



  const headerCellStyle = {
    ...cellStyle,
    background: colors.teal,
    color: "#fff",
    fontWeight: "bold",
    fontSize: "8.5px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",

    // CHANGE THIS PART
    textAlign: "center",
    verticalAlign: "middle",
    // padding: "0px 8px",
    padding: "2px 8px",
    height: "24px",
    // lineHeight: "24px",
    lineHeight: "20px",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-[230mm] w-full max-h-[95vh] flex flex-col overflow-hidden">

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-3 flex justify-between items-center z-10 shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Quotation Preview
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isGeneratingPDF}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting || isGeneratingPDF ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="h-4 w-4" />}
              Save & Download
            </button>
            <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="p-4 bg-gray-100 flex-1 overflow-y-auto flex justify-center">
          <div
            ref={previewRef}
            data-pdf-preview="true"
            style={{
              background: "#fff",
              border: `1px solid ${colors.border}`,
              width: "210mm",
              height: "297mm",
              padding: "6mm",
              boxSizing: "border-box",
              fontFamily: "Arial, sans-serif",
              fontSize: "8px",
              color: colors.textMain,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              position: "relative",
              flexShrink: 0
            }}
          >
            {/* Header Content */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: colors.teal, letterSpacing: "1px" }}>QUOTATION</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <img
                  src="/Logo.PNG"
                  alt="RBP Logo"
                  crossOrigin="anonymous"
                  style={{ width: "120px", maxHeight: "50px", objectFit: "contain" }}
                />
              </div>
              <div style={{ width: "80px" }}></div>
            </div>

            {/* Layout using Tables for Absolute Positioning Confidence */}
            <table style={{ borderCollapse: "separate", borderSpacing: "6px 0", marginLeft: "-6px", width: "calc(100% + 12px)", marginBottom: "5px" }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: "top", width: "50%", padding: "0" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr><td style={labelStyle}>Dealer</td><td style={cellStyle}>: {formData.dealer || ""}</td></tr>
                        <tr><td style={labelStyle}>Co.</td><td style={{ ...cellStyle, fontWeight: "bold" }}>: RBP ENERGY INDIA PVT LTD.</td></tr>
                        <tr><td style={labelStyle}>Address</td><td style={cellStyle}>: 303, Guru Ghasidas Plaza, Amapara, G.E. Road</td></tr>
                        <tr><td style={labelStyle}>City/State</td><td style={cellStyle}>: RAIPUR (C.G.) 492 001, India</td></tr>
                        <tr><td style={labelStyle}>Email ID</td><td style={{ ...cellStyle, color: colors.link, textDecoration: "underline" }}>: enquiry@rbpindia.com</td></tr>
                        <tr><td style={labelStyle}>Website</td><td style={{ ...cellStyle, color: colors.link, textDecoration: "underline" }}>: www.rbpindia.com</td></tr>
                        <tr><td style={labelStyle}>Sales No.</td><td style={cellStyle}>: +91 93000 12300</td></tr>
                        <tr><td style={labelStyle}>Service No.</td><td style={cellStyle}>: +91 93000 12300</td></tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={{ verticalAlign: "top", width: "50%", padding: "0" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td style={labelStyle}>Date</td>
                          <td style={{ ...cellStyle, fontWeight: "bold" }}>
                            : {quotationDate}</td></tr>
                        <tr><td style={labelStyle}>Quotation No.</td><td style={cellStyle}>: RBP/2025/Quotation/ <span style={{ background: colors.yellow, fontWeight: "bold", padding: "3px 6px", }}>{formData.enquiryNumber || ""}</span></td></tr>
                        <tr><td style={labelStyle}>Payment Mode</td><td style={{ ...cellStyle, fontWeight: "bold" }}>: {formData.payment_mode || "Chq/Online"}</td></tr>
                        <tr><td style={labelStyle}>Salesperson</td><td style={cellStyle}>: {formData.salesperson || ""}</td></tr>
                        <tr><td style={labelStyle}>Email ID</td><td style={cellStyle}>: {formData.email || ""}</td></tr>
                        <tr><td style={labelStyle}>Reference By</td><td style={cellStyle}>: {formData.referenceBy || ""}</td></tr>
                        <tr><td style={labelStyle}>Job Details</td><td style={cellStyle}>: -</td></tr>
                        <tr><td style={{ ...cellStyle, border: "none" }}>&nbsp;</td><td style={{ ...cellStyle, border: "none" }}>&nbsp;</td></tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Buyer & Terms */}
            <table style={{ borderCollapse: "separate", borderSpacing: "6px 0", marginLeft: "-6px", width: "calc(100% + 12px)", marginBottom: "5px" }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: "top", width: "50%", padding: "0" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr><th style={headerCellStyle}>Buyer Details</th></tr></thead>
                      <tbody>
                        <tr>
                          <td style={{ ...cellStyle, padding: "0" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", border: "none" }}>
                              <tbody>
                                <tr><td style={{ ...labelStyle, border: "none", borderBottom: `1px solid ${colors.border}` }}>Customer</td><td style={{ ...cellStyle, border: "none", borderBottom: `1px solid ${colors.border}`, fontWeight: "bold" }}>: {formData.customer || ""}</td></tr>
                                <tr><td style={{ ...labelStyle, border: "none", borderBottom: `1px solid ${colors.border}` }}>Address</td><td style={{ ...cellStyle, border: "none", borderBottom: `1px solid ${colors.border}` }}>: {formData.placeOfInstallation || ""}</td></tr>
                                <tr><td style={{ ...labelStyle, border: "none", borderBottom: `1px solid ${colors.border}` }}>Type</td><td style={{ ...cellStyle, border: "none", borderBottom: `1px solid ${colors.border}` }}>: {formData.needType || ""}</td></tr>
                                <tr><td style={{ ...labelStyle, border: "none", borderBottom: `1px solid ${colors.border}` }}>Structure</td><td style={{ ...cellStyle, border: "none", borderBottom: `1px solid ${colors.border}` }}>: {formData.structureType || ""}</td></tr>
                                <tr><td style={{ ...labelStyle, border: "none" }}>Contact</td><td style={{ ...cellStyle, border: "none", fontWeight: "bold" }}>: {formData.contactNo || ""} {formData.phoneNo ? `, ${formData.phoneNo}` : ""}</td></tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={{ verticalAlign: "top", width: "50%", padding: "0" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr><th style={headerCellStyle}>Terms & Conditions</th></tr></thead>
                      <tbody>
                        <tr>
                          <td style={{ ...cellStyle, height: "80px", verticalAlign: "top" }}>
                            <div style={{ fontSize: "8.5px" }}>
                              {tcLines.map((line, idx) => (
                                <div key={idx} style={{ marginBottom: "3px" }}>{idx + 1}. {line}</div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Product Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "5px" }}>
              <thead>
                <tr style={{ height: "18px" }}>
                  <th style={{ ...headerCellStyle, width: "4%", textAlign: "center" }}>Sr.</th>
                  <th style={{ ...headerCellStyle, width: "10%", textAlign: "center" }}>Part Code</th>
                  <th style={{ ...headerCellStyle, width: "15%", textAlign: "center" }}>Product Name</th>
                  <th style={{ ...headerCellStyle, width: "35%", textAlign: "center" }}>BOM</th>
                  <th style={{ ...headerCellStyle, width: "8%", textAlign: "center" }}>Size</th>
                  <th style={{ ...headerCellStyle, width: "8%", textAlign: "center" }}>GST %</th>
                  <th style={{ ...headerCellStyle, width: "10%", textAlign: "center" }}>Rate</th>
                  <th style={{ ...headerCellStyle, width: "10%", textAlign: "center" }}>Quantity</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...cellStyle, textAlign: "center", verticalAlign: "top" }}>1</td>
                  <td style={{ ...cellStyle, textAlign: "center", verticalAlign: "top" }}>{formData.rating || ""}</td>
                  <td style={{ ...cellStyle, verticalAlign: "top", fontSize: "9px" }}>{productDetails.productName || ""}</td>
                  <td style={{ ...cellStyle, verticalAlign: "top", fontSize: "8.5px", whiteSpace: "pre-line" }}>{productDetails.bom || ""}</td>
                  <td style={{ ...cellStyle, textAlign: "center", verticalAlign: "top" }}>{productDetails.size || ""}</td>
                  <td style={{ ...cellStyle, textAlign: "center", verticalAlign: "top" }}>{gstPct.toFixed(2)}%</td>
                  <td style={{ ...cellStyle, textAlign: "right", verticalAlign: "top" }}>{fmt(rate)}</td>
                  <td style={{ ...cellStyle, textAlign: "center", verticalAlign: "top", background: "#fff9c4", fontWeight: "bold" }}>{qty}</td>
                </tr>
              </tbody>
            </table>

            {/* Bank Details */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "5px" }}>
              <thead><tr><th style={headerCellStyle} colSpan="2">Our Bank Name</th></tr></thead>
              <tbody>
                <tr><td style={labelStyle}>Account No.</td><td style={cellStyle}>: {formData.accountNo || ""}</td></tr>
                <tr><td style={labelStyle}>IFSC Code</td><td style={cellStyle}>: {formData.ifscCode || ""}</td></tr>
                <tr><td style={labelStyle}>Branch</td><td style={cellStyle}>: {formData.branch || ""}</td></tr>
                <tr><td style={labelStyle}>A/c Bank Name</td><td style={cellStyle}>: {formData.bankAccount || ""}</td></tr>
              </tbody>
            </table>

            {/* General Terms & Price Summary */}
            <table style={{ borderCollapse: "separate", borderSpacing: "6px 0", marginLeft: "-6px", width: "calc(100% + 12px)", marginBottom: "5px" }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: "top", width: "55%", padding: "0" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr><th style={headerCellStyle}>General Terms & Conditions</th></tr></thead>
                      <tbody>
                        <tr>
                          <td style={{ ...cellStyle, height: "90px", verticalAlign: "top" }}>
                            <div style={{ fontSize: "7.5px" }}>
                              {gtLines.map((line, idx) => (<div key={idx} style={{ marginBottom: "2px" }}>{line}</div>))}
                            </div>
                          </td>
                        </tr>
                        <tr><td style={{ ...cellStyle, border: "none", fontWeight: "bold", fontStyle: "italic", padding: "5px 0" }}>{toWords(netCost)}</td></tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={{ verticalAlign: "top", width: "45%", padding: "0" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr><th style={headerCellStyle}>Price Summary</th></tr></thead>
                      <tbody>
                        <tr>
                          <td style={{ ...cellStyle, padding: "0" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", border: "none" }}>
                              <tbody>
                                <tr><td style={{ ...cellStyle, border: "none", borderBottom: `1px solid ${colors.border}` }}>Discount @ {disc}%</td><td style={{ ...cellStyle, border: "none", borderBottom: `1px solid ${colors.border}`, textAlign: "right" }}>{fmt((amount * disc) / 100)}</td></tr>
                                <tr><td style={{ ...cellStyle, border: "none", borderBottom: `1px solid ${colors.border}` }}>Less</td><td style={{ ...cellStyle, border: "none", borderBottom: `1px solid ${colors.border}`, textAlign: "right" }}>{fmt(afterDisc)}</td></tr>
                                <tr><td style={{ ...cellStyle, border: "none", borderBottom: `1px solid ${colors.border}` }}>SGST @ {(gstPct / 2).toFixed(2)}%</td><td style={{ ...cellStyle, border: "none", borderBottom: `1px solid ${colors.border}`, textAlign: "right" }}>{fmt(gstAmt / 2)}</td></tr>
                                <tr><td style={{ ...cellStyle, border: "none", borderBottom: `1px solid ${colors.border}` }}>CGST @ {(gstPct / 2).toFixed(2)}%</td><td style={{ ...cellStyle, border: "none", borderBottom: `1px solid ${colors.border}`, textAlign: "right" }}>{fmt(gstAmt / 2)}</td></tr>
                                <tr style={{ background: "#f8f9fa" }}><td style={{ ...cellStyle, border: "none", fontWeight: "bold" }}>Grand Total</td><td style={{ ...cellStyle, border: "none", textAlign: "right", fontWeight: "bold" }}>{fmt(grandTotal)}</td></tr>
                                <tr><td style={{ ...cellStyle, border: "none", borderBottom: `1px solid ${colors.border}` }}>Central Subsidy</td><td style={{ ...cellStyle, border: "none", borderBottom: `1px solid ${colors.border}`, textAlign: "right" }}>{fmt(central)}</td></tr>
                                <tr><td style={{ ...cellStyle, border: "none" }}>State Subsidy</td><td style={{ ...cellStyle, border: "none", textAlign: "right" }}>{fmt(stateSub)}</td></tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                        <tr style={{ background: colors.yellow }}>
                          <td style={{ ...cellStyle, border: `1px solid ${colors.border}`, padding: "4px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "7.5px" }}>
                              <span>Total Amount Chargeable (in words)</span>
                              <span>( {toWords(netCost).replace("Rupees ", "").toUpperCase()} )</span>
                            </div>
                          </td>
                        </tr>
                        <tr style={{ background: colors.teal }}>
                          <td style={{ ...cellStyle, color: "#fff", textAlign: "right", fontWeight: "bold", fontSize: "10px", padding: "3px 8px" }}>Net Cost : ₹ {fmt(netCost)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Warranty Section */}
            <div style={{ display: "flex", width: "100%", background: colors.beige, border: `1px solid ${colors.border}`, padding: "5px 8px", alignItems: "center" }}>
              <div style={{ width: "45%" }}>
                <div style={{ fontWeight: "bold", textAlign: "center", marginBottom: "3px", textTransform: "uppercase", fontSize: "8px" }}>Warranty</div>
                <div style={{ fontSize: "7.5px", lineHeight: "1.3" }}>
                  <div>1. Solar Module 5 Year against Manufacturing defect</div>
                  <div style={{ marginLeft: "8px" }}>10 Year limited warranty on 90% Power Output.</div>
                  <div style={{ marginLeft: "8px" }}>25 Year Limited warranty on 80% Power Output.</div>
                  <div>2. Inverter : 5 Years for IP 65 & 5 Years for 3Ph manufacturer's warranty</div>
                  <div>3. Balance Of System 5 Year against manufacturing defect.</div>
                  <div>4. Switchgear - On Actuals</div>
                </div>
              </div>
              <div style={{ width: "10%", textAlign: "center" }}>
                <div style={{ width: "30px", height: "30px", background: colors.teal, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              </div>
              <div style={{ width: "45%" }}>
                <div style={{ fontWeight: "bold", textAlign: "center", marginBottom: "3px", textTransform: "uppercase", fontSize: "8px" }}>Solar Product Range</div>
                <div style={{ fontSize: "7.5px", lineHeight: "1.3" }}>
                  <div>1. POWER PLANTS (1KW - 500KW)</div>
                  <div>2. IRRIGATION & DRINKING WATER DUAL PUMPS</div>
                  <div>3. STREET LIGHTS & HIGH MASTS</div>
                  <div>4. HOME LIGHTING SYSTEMS</div>
                  <div style={{ fontWeight: "bold", marginTop: "2px" }}>MANUFACTURING :</div>
                  <div style={{ fontWeight: "bold" }}>MS STRUCTURES & LED n STREET LIGHTS</div>
                </div>
              </div>
            </div>

            {/* Declaration */}
            <div style={{ marginTop: "5px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={headerCellStyle}>Declaration</th></tr></thead>
                <tbody>
                  <tr>
                    <td style={{ ...cellStyle, textAlign: "center", borderTop: "none" }}>
                      <div>We declare that this Quotation shows the actual price of the goods described and that all particulars are true and correct.</div>
                      <div style={{ fontWeight: "bold", marginTop: "3px" }}>This is a computer generated quotation. Hence, requires no signature. Subject to Raipur Jurisdiction.</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ flex: 1 }}></div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="bg-gray-50 px-6 py-3 rounded-b-xl border-t flex justify-end gap-3 mt-auto shrink-0">
          <button onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 text-sm"><XCircle className="h-4 w-4" /> Cancel</button>
          <button onClick={handleSubmit} disabled={isSubmitting || isGeneratingPDF} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm font-bold shadow-lg">
            {isSubmitting || isGeneratingPDF ? <>Processing...</> : <><Save className="h-4 w-4" /> Finalize & Save Quotation</>}
          </button>
        </div>

      </div>
    </div>
  );
}
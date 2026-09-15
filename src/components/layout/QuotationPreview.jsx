import { useState, useRef, useMemo, useLayoutEffect, useEffect } from "react";
import { XCircle, Save, Download, Sun } from "lucide-react";
import jsPDF from "jspdf";
// html-to-image renders through an SVG foreignObject, so the *browser* does the
// layout and painting. html2canvas reimplements CSS in JS and mis-paints this
// sheet — it clips table-row backgrounds and section caption bars, which would
// silently cut lines out of the terms & conditions. Do not swap it back.
import { toCanvas } from "html-to-image";

// ─── A4 Page Geometry (96 DPI :: 210mm × 297mm) ──────────────────────────────
const PAGE_W = 794;                       // A4 width  in px @96dpi
const PAGE_H = 1123;                      // A4 height in px @96dpi
const PAD_X = 22;                         // left/right print margin (px)
const PAD_Y = 16;                         // top/bottom print margin (px)
const CONTENT_W = PAGE_W - PAD_X * 2;     // 750px usable width
const AVAIL_H = PAGE_H - PAD_Y * 2;       // 1091px usable height
const MIN_FIT = 0.45;                     // never shrink text below this ratio
const FIT_TOLERANCE = 0.004;              // convergence threshold
const MAX_FIT_PASSES = 10;                // safety guard on the fit loop
const FOOT_GAP = 6;                       // footer marginTop — excluded from offsetHeight

// ─── Number to Words (Indian Rupee Currency Format) ─────────────────────────
function toWords(num) {
  if (!num || isNaN(num)) return "Zero Rupees Only";
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

// ─── Helper to parse numbers safely without comma truncation ────────────────
const parseNum = (val) => {
  if (val === undefined || val === null || val === "") return 0;
  const clean = String(val).replace(/,/g, "").replace(/[^\d.-]/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function QuotationPreview({
  formData = {},
  productDetails = {},
  productMap = {},
  dealerBankMap = {},
  selectedEnquiry = null,
  onClose,
  onSubmit,
  isSubmitting
}) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);

  // Auto-fit scale: 1 = native design size, < 1 = text auto-shrunk to fit A4
  const [fit, setFit] = useState(1);
  const [assetRevision, setAssetRevision] = useState(0);
  const fitPassRef = useRef(0);

  const pageRef = useRef(null);
  const contentRef = useRef(null);
  const bodyRef = useRef(null);
  const footRef = useRef(null);

  // Retrieve matching product info from productMap if available.
  // Memoised so the auto-fit reset effect below does not re-fire on every render.
  const selectedProduct = useMemo(
    () => (productMap && formData.rating ? productMap[formData.rating] : null) || {},
    [productMap, formData.rating]
  );
  const dealerBank = useMemo(
    () => (dealerBankMap && formData.dealer ? dealerBankMap[formData.dealer] : null) || {},
    [dealerBankMap, formData.dealer]
  );

  // All 23 database columns and form parameters mapped with smart fallbacks
  const systemKey = formData.rating || selectedProduct.system_key || "Solar Power System";
  const systemId = formData.systemId || formData.system_id || selectedProduct.system_id || "SYS-RBP";
  const moduleType = formData.moduleType || formData.module_type || selectedProduct.module_type || "Mono PERC Half-Cut";
  const structure = formData.structure || formData.structureType || selectedProduct.structure || "Elevated GI Structure";
  const mode = formData.mode || selectedProduct.mode || "On-Grid";
  const phase = formData.phase || selectedProduct.phase || "1 Phase (230V)";
  const capacityKwp = selectedProduct.capacity_kwp || formData.capacity_kwp || productDetails.size || "3.00 kWp";
  const actualKwp = selectedProduct.actual_kwp || formData.actual_kwp || capacityKwp;
  const ratingWp = selectedProduct.rating_wp || formData.rating_wp || "550 Wp";
  const panelsCount = selectedProduct.panels || formData.panels || "";
  const specPart1 = selectedProduct.spec_part_1 || formData.spec_part_1 || "";
  const specStructure = selectedProduct.spec_line_d_structure || formData.spec_line_d_structure || "";
  const specPart2 = selectedProduct.spec_part_2 || formData.spec_part_2 || "";

  // Client Details
  const customerName = formData.customer || selectedEnquiry?.beneficiaryName || "Valued Customer";
  const contactNo = formData.contactNo || selectedEnquiry?.contactNumber || selectedEnquiry?.contactNo || "—";
  const phoneNo = formData.phoneNo || selectedEnquiry?.alternativePhoneNo || selectedEnquiry?.phoneNo || "";
  const email = formData.email || selectedEnquiry?.email || "—";
  const placeOfInstallation = formData.placeOfInstallation || selectedEnquiry?.address || "Site Address as provided";
  const needType = formData.needType || selectedEnquiry?.needType || "Residential Grid-Tied System";
  const loadDetails = formData.loadDetails || selectedEnquiry?.loadDetails || "—";
  const failureHours = formData.failureHours || selectedEnquiry?.hoursOfFailure || "";
  const referenceBy = formData.referenceBy || selectedEnquiry?.referenceBy || "Direct / RBP Channel";
  const salesperson = formData.salesperson || selectedEnquiry?.salesperson || "S N Sahoo";
  const dealer = formData.dealer || selectedEnquiry?.dealer || "RBP Authorized Central Division";
  const enquiryNo = formData.enquiryNumber || selectedEnquiry?.enquiryNumber || "2025/001";
  const roofType = formData.roofType || formData.structureType || "RCC Flat Roof";
  const projectMode = formData.projectMode || "Turnkey Supply, Installation & Commissioning";
  const paymentMode = formData.payment_mode || "Chq / Online / RTGS";

  // Bank details with official defaults
  const bankName = formData.bankAccount || dealerBank.bankAccount || "State Bank of India";
  const accountNo = formData.accountNo || dealerBank.accountNo || "—";
  const ifscCode = formData.ifscCode || dealerBank.ifscCode || "—";
  const branch = formData.branch || dealerBank.branch || "Raipur Branch";

  // Terms and Conditions text from form
  const termsConditions = formData.termsConditions ||
    "On Grid:\n1. We will process for approval from competent authority for net metering. Any other approval is in your scope.\n2. Processing fee payable to CREDA/CSPDCL as applicable.\n3. Generation Guarantee of 1.5kWh/W per annum";

  const generalTerms = formData.generalTerms ||
    "1. Power output from Control Panel will be in customers scope.\n2. Civil work other than Module Mounting Structure will be in customer's scope.\n3. Our offer is valid for 15 Days. Any custom specifications will be charged extra.\n4. Regular cleaning of Modules with plain water (soft) for desired generation guarantee in customer's scope.\n5. Detailed Quotation with engineering document will be provided on finalisation, for systems above 10KW.\n6. Subsidy (if any) is subject to government approval and will be directly credited in customer's account.\n7. Transportation inclusive. Insurance inclusive upto site and thereafter in customer's scope.\n8. Payment 50% advance on booking, Balance 50% against PI before dispatch of material.\n9. Delivery within 2 weeks from sanction and installation immediately thereafter.\n10. AMC inclusive for 5 years and chargeable thereafter.\n11. Structure height consider 5 feet, for additional height should charge extra.\n12. DC cable length 40 meter, AC cable length 30 meter, and earthing cable length 50 meter considered; any additional length will be charged extra.";

  // Split General Terms into balanced 2-column layout (deterministic — no CSS columns,
  // which html2canvas cannot render reliably)
  const generalTermLines = generalTerms.split("\n").map((l) => l.trim()).filter(Boolean);
  const gtSplitAt = Math.ceil(generalTermLines.length / 2);
  const gtColLeft = generalTermLines.slice(0, gtSplitAt);
  const gtColRight = generalTermLines.slice(gtSplitAt);

  // Financial calculations
  const qty = parseNum(formData.qty) || 1;
  const rate = parseNum(productDetails.rate || formData.original_rate || selectedProduct.original_rate);
  const amount = parseNum(productDetails.amount) || (qty * rate);

  const disc = parseNum(formData.disc);
  const discountAmount = (amount * disc) / 100;
  const taxableAmount = amount - discountAmount;

  const gstRaw = parseNum(productDetails.gst || formData.gst_percent || selectedProduct.gst_percent) || 13.8;
  const gstPct = gstRaw < 1 ? gstRaw * 100 : gstRaw;
  const gstAmount = gstRaw < 1 ? taxableAmount * gstRaw : (taxableAmount * gstPct) / 100;

  const grandTotal = taxableAmount + gstAmount;

  const centralSubsidy = parseNum(formData.subCentral || selectedProduct.central_subsidy_segment);
  const stateSubsidy = parseNum(formData.subState || selectedProduct.state_subsidy_segment);
  const applicableSubsidy = parseNum(formData.applicableSubsidy || selectedProduct.applicable_subsidy);
  const totalSubsidy = (centralSubsidy + stateSubsidy) > 0 ? (centralSubsidy + stateSubsidy) : applicableSubsidy;
  const netCost = Math.max(0, grandTotal - totalSubsidy);

  const fmt = (v) =>
    parseNum(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const quotationDate = formData.date
    ? (() => {
      const d = new Date(formData.date);
      return isNaN(d.getTime()) ? formData.date : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    })()
    : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  // ─── AUTO-FIT ENGINE ────────────────────────────────────────────────────────
  // The content is laid out at width CONTENT_W / fit and then visually scaled by
  // `fit`. Because layout width grows as `fit` shrinks, the effective font size
  // is (designPx × fit) while the content still spans the full 750px print
  // width — i.e. genuine text auto-sizing, not a letterboxed shrink.
  //
  // offsetHeight / scrollHeight are layout values and are NOT affected by CSS
  // transforms, so we can measure the untransformed height directly and run a
  // fixed-point iteration until it settles.
  //
  // Intentionally dependency-free: it must re-measure after *any* render that
  // could change content height. It cannot loop forever because it only calls
  // setFit while the measured target still differs from the applied ratio by
  // more than FIT_TOLERANCE, and MAX_FIT_PASSES caps any oscillation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!bodyRef.current || !footRef.current) return;

    // The body is a flex column that grows to fill leftover space, so its own
    // offsetHeight is the *stretched* height. Sum the sections instead to get
    // the true natural content height.
    const bodyNaturalH = Array.from(bodyRef.current.children).reduce((sum, el) => {
      const cs = window.getComputedStyle(el);
      return sum + el.offsetHeight + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
    }, 0);

    const naturalH = bodyNaturalH + footRef.current.offsetHeight + FOOT_GAP;
    if (naturalH <= FOOT_GAP) return;

    const target = Math.max(MIN_FIT, Math.min(1, AVAIL_H / naturalH));
    if (Math.abs(target - fit) > FIT_TOLERANCE && fitPassRef.current < MAX_FIT_PASSES) {
      fitPassRef.current += 1;
      setFit(target);
    }
  });

  // Fonts and the logo bitmap land after first paint and change the measured
  // height — re-run the fit loop once they settle.
  useEffect(() => {
    let alive = true;
    const remeasure = () => {
      if (!alive) return;
      fitPassRef.current = 0;
      setAssetRevision((r) => r + 1);
    };

    if (document.fonts?.ready) document.fonts.ready.then(remeasure).catch(() => { });

    const imgs = Array.from(pageRef.current?.querySelectorAll("img") || []);
    imgs.forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", remeasure, { once: true });
        img.addEventListener("error", remeasure, { once: true });
      }
    });

    return () => { alive = false; };
  }, []);

  // Re-fit whenever the underlying quotation data changes
  useEffect(() => {
    fitPassRef.current = 0;
  }, [formData, productDetails, selectedProduct]);

  // Layout geometry derived from the current fit ratio
  const layoutW = CONTENT_W / fit;
  const layoutH = AVAIL_H / fit;

  // ─── SINGLE-PAGE A4 PDF GENERATION ──────────────────────────────────────────
  // Captures an off-screen, untransformed clone of the exact preview DOM, then
  // places it on one A4 page. Cloning out of the modal avoids ancestor
  // overflow clipping and the CSS transform, so the raster is a 1:1 copy of the
  // sheet and the PDF is pixel-identical to what the preview shows.
  const buildPDF = async () => {
    const src = contentRef.current;
    if (!src) throw new Error("Preview page element not found");

    const naturalW = src.offsetWidth || layoutW;

    const holder = document.createElement("div");
    holder.setAttribute("aria-hidden", "true");
    holder.style.cssText =
      `position:fixed;left:-20000px;top:0;width:${naturalW}px;background:#ffffff;` +
      `margin:0;padding:0;overflow:visible;pointer-events:none;z-index:-1;`;

    const clone = src.cloneNode(true);
    clone.style.position = "static";
    clone.style.top = "auto";
    clone.style.left = "auto";
    clone.style.transform = "none";
    clone.style.width = `${naturalW}px`;
    clone.style.minHeight = `${layoutH}px`;
    clone.style.boxShadow = "none";
    clone.style.margin = "0";
    holder.appendChild(clone);
    document.body.appendChild(holder);

    try {
      // Wait for fonts + the cloned logo to be paint-ready
      if (document.fonts?.ready) await document.fonts.ready;
      await Promise.all(
        Array.from(clone.querySelectorAll("img")).map(
          (img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((res) => {
                img.addEventListener("load", res, { once: true });
                img.addEventListener("error", res, { once: true });
              })
        )
      );
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const naturalH = Math.max(clone.scrollHeight, clone.offsetHeight, Math.round(layoutH));

      // Normalise the raster to ~2250px wide (≈270 DPI across 198mm) whatever
      // the fit ratio is, so small auto-shrunk text stays sharp and the file
      // size stays predictable.
      const pixelRatio = Math.min(3, Math.max(1.6, 2250 / naturalW));

      const canvas = await toCanvas(clone, {
        pixelRatio,
        backgroundColor: "#ffffff",
        width: naturalW,
        height: naturalH,
        // The sheet uses only system font stacks, so there is nothing to embed.
        // Skipping avoids fetching the Poppins / Material Icons / FontAwesome
        // stylesheets index.html pulls from CDNs, which is slow and can fail.
        skipFonts: true,
      });

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        putOnlyUsedFonts: true,
        compress: true,
        floatPrecision: 16,
      });

      const PDF_W = 210;
      const PDF_H = 297;
      const marginXmm = (PAD_X / PAGE_W) * PDF_W;
      const marginYmm = (PAD_Y / PAGE_H) * PDF_H;
      const boxW = PDF_W - marginXmm * 2;
      const boxH = PDF_H - marginYmm * 2;

      // Uniform contain-fit inside the printable box — guarantees exactly one page
      const k = Math.min(boxW / canvas.width, boxH / canvas.height);
      const drawW = canvas.width * k;
      const drawH = canvas.height * k;
      const x = (PDF_W - drawW) / 2;
      const y = marginYmm;

      // PNG (lossless) — the sheet is dense small text and hairline table
      // borders, which JPEG fringes badly. Flat colours keep the size modest.
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, drawW, drawH, undefined, "FAST");

      return pdf.output("blob");
    } catch (err) {
      console.error("Critical PDF Gen Error:", err);
      throw err;
    } finally {
      if (holder.parentNode) holder.parentNode.removeChild(holder);
    }
  };

  const handleSubmit = async () => {
    setIsGeneratingPDF(true);
    await new Promise((r) => setTimeout(r, 100));
    try {
      const pdfBlob = await buildPDF();
      await onSubmit(pdfBlob, sendWhatsApp);
    } catch (err) {
      alert("Error generating PDF: " + err.message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDirectDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    await new Promise((r) => setTimeout(r, 100));
    try {
      const pdfBlob = await buildPDF();
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Solar_Quotation_${enquiryNo || customerName || "RBP"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      alert("Error downloading PDF: " + err.message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Shared section chrome
  const boxStyle = { border: "1px solid #cbd5e1", borderRadius: "5px", overflow: "hidden", background: "#f8fafc" };
  const capStyle = (bg) => ({
    background: bg, color: "#ffffff", padding: "3px 8px", fontSize: "8.2px",
    fontWeight: "bold", letterSpacing: "0.3px", display: "flex", justifyContent: "space-between",
  });
  const cellK = { padding: "2px 7px", color: "#64748b", borderBottom: "1px solid #e2e8f0" };
  const cellV = { padding: "2px 7px", color: "#0f172a", borderBottom: "1px solid #e2e8f0" };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-[240mm] w-full max-h-[97vh] flex flex-col overflow-hidden border border-slate-700">

        {/* Modal Top Control Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 px-6 py-3.5 flex justify-between items-center z-10 shrink-0 border-b border-indigo-900/60 shadow-md">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shadow-inner">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Executive Solar Quotation Preview
                <span className="text-[10px] uppercase font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  Single-Page A4 Engine
                </span>
              </h2>
              <p className="text-[11px] text-slate-300">
                Exact single-source: the PDF is a pixel-identical 1-page A4 render of this preview
                <span className="ml-2 text-amber-300 font-semibold">
                  • Auto text fit: {Math.round(fit * 100)}%
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDirectDownloadPDF}
              disabled={isSubmitting || isGeneratingPDF}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
              title="Download the single-page A4 PDF directly"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isGeneratingPDF}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg hover:shadow-emerald-900/40 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting || isGeneratingPDF ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save & Submit
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition ml-1 cursor-pointer"
              title="Close preview"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Container with the single A4 target page */}
        <div className="p-4 bg-slate-950/90 flex-1 overflow-y-auto flex flex-col items-center">

          {/* ══════════════════════════════════════════════════════════════════════
              SINGLE A4 PAGE — 794px × 1123px (210mm × 297mm @ 96dpi)
              Everything (commercial + technical + terms + sign-off) on one sheet.
             ══════════════════════════════════════════════════════════════════════ */}
          <div
            ref={pageRef}
            data-pdf-page="true"
            data-asset-rev={assetRevision}
            style={{
              background: "#ffffff",
              width: `${PAGE_W}px`,
              height: `${PAGE_H}px`,
              minHeight: `${PAGE_H}px`,
              maxHeight: `${PAGE_H}px`,
              boxSizing: "border-box",
              position: "relative",
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            }}
          >
            {/* Auto-scaling content layer: laid out at CONTENT_W/fit then scaled by `fit`
                so the effective font size is (designPx × fit) at full print width. */}
            <div
              ref={contentRef}
              data-pdf-content="true"
              style={{
                position: "absolute",
                top: `${PAD_Y}px`,
                left: `${PAD_X}px`,
                width: `${layoutW}px`,
                minHeight: `${layoutH}px`,
                transform: `scale(${fit})`,
                transformOrigin: "top left",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxSizing: "border-box",
                fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif",
                fontSize: "8.5px",
                color: "#0f172a",
                lineHeight: 1.35,
                background: "#ffffff",
              }}
            >
              {/* ─── MEASURED BODY ─────────────────────────────────────────────
                  Grows into any leftover vertical space and spreads the slack
                  evenly between sections, so a short quotation is typeset down
                  the full sheet instead of leaving one dead gap above the
                  footer. flexShrink:0 / flexBasis:auto keep sections at their
                  natural height — only the auto-fit ratio ever shrinks text. */}
              <div
                ref={bodyRef}
                style={{
                  flexGrow: 1,
                  flexShrink: 0,
                  flexBasis: "auto",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >

                {/* ─── 1. TOP HEADER & CORPORATE BRANDING ────────────────────── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0b2545", paddingBottom: "6px", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <img
                      src="/Logo.PNG"
                      alt="RBP Energy India Pvt. Ltd."
                      crossOrigin="anonymous"
                      style={{ width: "118px", maxHeight: "48px", objectFit: "contain" }}
                    />
                    <div>
                      <div style={{ fontSize: "14.5px", fontWeight: "900", color: "#0b2545", letterSpacing: "0.5px" }}>
                        RBP ENERGY INDIA PVT. LTD.
                      </div>
                      <div style={{ fontSize: "7.8px", color: "#334155", fontWeight: "700", marginTop: "1px" }}>
                        Solar Power System Designer, Manufacturer &amp; Turnkey EPC Contractor
                      </div>
                      <div style={{ fontSize: "7.2px", color: "#64748b", marginTop: "1px" }}>
                        Regd. Office: 303, Guru Ghasidas Plaza, Amapara, G.E. Road, Raipur (C.G.) 492001
                      </div>
                      <div style={{ fontSize: "7.2px", color: "#64748b" }}>
                        Helpline: +91 92000 12500 / +91 92000 12400 | Web: www.rbpindia.com | Email: info@rbpindia.com
                      </div>
                    </div>
                  </div>

                  {/* Document Meta Tag */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      display: "inline-block",
                      background: "#0b2545",
                      color: "#ffffff",
                      padding: "3px 12px",
                      borderRadius: "4px",
                      fontWeight: "800",
                      fontSize: "10.5px",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      borderBottom: "2px solid #f59e0b"
                    }}>
                      Solar Quotation
                    </div>
                    <div style={{ marginTop: "4px", fontSize: "8px", color: "#1e293b" }}>
                      <strong>Ref No:</strong> <span style={{ color: "#1d4ed8", fontWeight: "bold" }}>RBP/QTN/{enquiryNo}</span>
                    </div>
                    <div style={{ fontSize: "7.8px", color: "#334155", marginTop: "1px" }}>
                      <strong>Date:</strong> {quotationDate} | <strong>Validity:</strong> 15 Days
                    </div>
                    <div style={{ fontSize: "7.2px", color: "#059669", fontWeight: "700", marginTop: "1px" }}>
                      ✓ MNRE / PM Surya Ghar Approved Design
                    </div>
                  </div>
                </div>

                {/* ─── 2. TWO-COLUMN DETAILS GRID (Buyer & Vendor Profile) ───── */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                  {/* Left Column: Quotation Prepared For (Client & Site) */}
                  <div style={{ ...boxStyle, flex: 1 }}>
                    <div style={capStyle("#1e40af")}>
                      <span>QUOTATION PREPARED FOR / CLIENT SITE</span>
                      <span style={{ fontSize: "7px", opacity: 0.9 }}>Buyer Info</span>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7.8px" }}>
                      <tbody>
                        <tr>
                          <td style={{ ...cellK, width: "34%" }}>Customer Name:</td>
                          <td style={{ ...cellV, fontWeight: "bold" }}>{customerName}</td>
                        </tr>
                        <tr>
                          <td style={cellK}>Installation Site:</td>
                          <td style={cellV}>{placeOfInstallation}</td>
                        </tr>
                        <tr>
                          <td style={cellK}>Contact / Mobile:</td>
                          <td style={{ ...cellV, fontWeight: "600" }}>
                            {contactNo}{phoneNo ? ` / ${phoneNo}` : ""}
                          </td>
                        </tr>
                        <tr>
                          <td style={cellK}>Email Address:</td>
                          <td style={cellV}>{email}</td>
                        </tr>
                        <tr>
                          <td style={{ ...cellK, borderBottom: "none" }}>Need &amp; Load Info:</td>
                          <td style={{ ...cellV, borderBottom: "none", fontWeight: "600" }}>
                            {needType} {loadDetails && loadDetails !== "—" ? `• Load: ${loadDetails}` : ""} {failureHours ? `• Outage: ${failureHours}h` : ""}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Right Column: Issued By / EPC Contractor & Dealer */}
                  <div style={{ ...boxStyle, flex: 1 }}>
                    <div style={capStyle("#0b2545")}>
                      <span>ISSUED BY / EPC CONTRACTOR &amp; PARTNER</span>
                      <span style={{ fontSize: "7px", opacity: 0.9 }}>Vendor Info</span>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7.8px" }}>
                      <tbody>
                        <tr>
                          <td style={{ ...cellK, width: "34%" }}>EPC Contractor:</td>
                          <td style={{ ...cellV, fontWeight: "bold" }}>RBP Energy India Pvt. Ltd.</td>
                        </tr>
                        <tr>
                          <td style={cellK}>Dealer / Partner:</td>
                          <td style={{ ...cellV, fontWeight: "600" }}>{dealer}</td>
                        </tr>
                        <tr>
                          <td style={cellK}>Sales Representative:</td>
                          <td style={{ ...cellV, fontWeight: "600" }}>{salesperson}</td>
                        </tr>
                        <tr>
                          <td style={cellK}>Project Mode:</td>
                          <td style={cellV}>{projectMode}</td>
                        </tr>
                        <tr>
                          <td style={{ ...cellK, borderBottom: "none" }}>Structure &amp; Reference:</td>
                          <td style={{ ...cellV, borderBottom: "none", color: "#1e40af", fontWeight: "600" }}>
                            Roof: {roofType} • Ref: {referenceBy}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ─── 3. TECHNICAL SPECIFICATIONS BANNER (All Solar DB Fields) ── */}
                <div style={{ ...boxStyle, marginBottom: "6px" }}>
                  <div style={{ ...capStyle("#0b2545"), alignItems: "center" }}>
                    <span>⚡ SOLAR SYSTEM TECHNICAL CONFIGURATION &amp; PARAMETERS</span>
                    <span style={{ fontSize: "7.2px", color: "#93c5fd" }}>All 23 Parameters Synchronized</span>
                  </div>

                  {/* 6-Column High-Contrast Spec Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", padding: "5px 7px", gap: "6px", background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
                    <div>
                      <div style={{ fontSize: "6.8px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>System Key</div>
                      <div style={{ fontSize: "8.2px", fontWeight: "bold", color: "#1d4ed8" }}>{systemKey}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "6.8px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>System ID</div>
                      <div style={{ fontSize: "8.2px", fontWeight: "bold", color: "#0f172a" }}>{systemId}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "6.8px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Module Tech</div>
                      <div style={{ fontSize: "8.2px", fontWeight: "bold", color: "#0f172a" }}>{moduleType}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "6.8px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Mounting Structure</div>
                      <div style={{ fontSize: "8.2px", fontWeight: "bold", color: "#0f172a" }}>{structure}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "6.8px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Operating Mode</div>
                      <div style={{ marginTop: "1px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "1px 5px",
                          borderRadius: "3px",
                          fontSize: "7.5px",
                          fontWeight: "bold",
                          background: mode.toLowerCase().includes("on-grid") ? "#dcfce7" : "#fef3c7",
                          color: mode.toLowerCase().includes("on-grid") ? "#166534" : "#92400e"
                        }}>
                          {mode}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "6.8px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Phase Type</div>
                      <div style={{ fontSize: "8.2px", fontWeight: "bold", color: "#0f172a" }}>{phase}</div>
                    </div>
                  </div>

                  {/* Sub-bar showing hardware output parameters */}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 8px", background: "#f1f5f9", fontSize: "7.5px", color: "#334155" }}>
                    <span><strong>Nominal Capacity:</strong> {capacityKwp}</span>
                    <span><strong>Module Rating:</strong> {ratingWp || "550 Wp"}</span>
                    <span><strong>Total Panels:</strong> {panelsCount ? `${panelsCount} Nos.` : "Standard Layout"}</span>
                    <span><strong>Actual Generation Output:</strong> {actualKwp ? `${actualKwp}` : `${capacityKwp}`}</span>
                    <span><strong>Payment Terms:</strong> {paymentMode}</span>
                  </div>
                </div>

                {/* ─── 4. BILL OF MATERIALS & SCOPE OF SUPPLY TABLE ───────────── */}
                <div style={{ border: "1px solid #cbd5e1", borderRadius: "5px", overflow: "hidden", marginBottom: "6px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7.8px" }}>
                    <thead>
                      <tr style={{ background: "#0b2545", color: "#ffffff", textAlign: "left", fontSize: "7.8px" }}>
                        <th style={{ padding: "4px 6px", width: "4%", textAlign: "center" }}>#</th>
                        <th style={{ padding: "4px 6px", width: "21%" }}>System / Package</th>
                        <th style={{ padding: "4px 6px", width: "45%" }}>Bill of Materials &amp; Technical Scope of Supply (BOM)</th>
                        <th style={{ padding: "4px 6px", width: "8%", textAlign: "center" }}>Capacity</th>
                        <th style={{ padding: "4px 6px", width: "5%", textAlign: "center" }}>Qty</th>
                        <th style={{ padding: "4px 6px", width: "8%", textAlign: "right" }}>Original Rate</th>
                        <th style={{ padding: "4px 6px", width: "9%", textAlign: "right" }}>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ background: "#ffffff" }}>
                        <td style={{ padding: "6px 5px", textAlign: "center", verticalAlign: "top", borderBottom: "1px solid #e2e8f0" }}>1</td>
                        <td style={{ padding: "6px 6px", verticalAlign: "top", borderBottom: "1px solid #e2e8f0" }}>
                          <div style={{ fontWeight: "bold", color: "#0f172a", fontSize: "8.8px" }}>
                            {productDetails.productName || systemKey}
                          </div>
                          <div style={{ color: "#475569", fontSize: "7.2px", marginTop: "2px" }}>
                            Model ID: {systemId} | {mode} {phase}
                          </div>
                          <div style={{ display: "inline-block", background: "#f1f5f9", padding: "1px 5px", borderRadius: "3px", fontSize: "6.8px", color: "#475569", marginTop: "3px", fontWeight: "600" }}>
                            Structure: {structure}
                          </div>
                        </td>
                        <td style={{ padding: "6px 6px", verticalAlign: "top", borderBottom: "1px solid #e2e8f0" }}>
                          <div style={{ fontSize: "7.3px", color: "#334155", lineHeight: "1.32" }}>
                            {productDetails.bom && productDetails.bom.trim().length > 30 ? (
                              <div style={{ whiteSpace: "pre-line" }}>{productDetails.bom}</div>
                            ) : (
                              <>
                                {specPart1 ? (
                                  <div style={{ marginBottom: "3px" }}>
                                    • <strong>Modules &amp; Generation:</strong> {specPart1}
                                  </div>
                                ) : (
                                  <div style={{ marginBottom: "3px" }}>
                                    • <strong>Solar Modules:</strong> Tier-1 {ratingWp ? `${ratingWp} High Efficiency Modules` : "High Efficiency Modules"} {panelsCount ? `(${panelsCount} Nos.)` : ""} with anti-reflective PID-resistant glass and IP68 bypass protection.
                                  </div>
                                )}
                                {specStructure ? (
                                  <div style={{ marginBottom: "3px" }}>
                                    • <strong>Mounting &amp; Structure:</strong> {specStructure}
                                  </div>
                                ) : (
                                  <div style={{ marginBottom: "3px" }}>
                                    • <strong>Mounting Structure:</strong> Customized {structure} mounting structure hot-dip galvanized and engineered for wind resistance up to 150 km/h.
                                  </div>
                                )}
                                {specPart2 ? (
                                  <div>
                                    • <strong>Inverter, Cables &amp; BOS:</strong> {specPart2}
                                  </div>
                                ) : (
                                  <div>
                                    • <strong>Electrical BOS:</strong> High-efficiency grid-tied solar string inverter, copper chemical earthing kits, SPD-equipped ACDB/DCDB protection boxes, UV-resistant DC solar cables.
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "6px 4px", textAlign: "center", verticalAlign: "top", fontWeight: "bold", borderBottom: "1px solid #e2e8f0", color: "#0f172a" }}>
                          {capacityKwp}
                        </td>
                        <td style={{ padding: "6px 4px", textAlign: "center", verticalAlign: "top", fontWeight: "bold", borderBottom: "1px solid #e2e8f0", color: "#0f172a" }}>
                          {qty}
                        </td>
                        <td style={{ padding: "6px 6px", textAlign: "right", verticalAlign: "top", borderBottom: "1px solid #e2e8f0", color: "#334155" }}>
                          ₹ {fmt(rate)}
                        </td>
                        <td style={{ padding: "6px 6px", textAlign: "right", verticalAlign: "top", fontWeight: "bold", borderBottom: "1px solid #e2e8f0", color: "#0f172a" }}>
                          ₹ {fmt(amount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ─── 5. SPLIT COMMERCIAL & BANK / WARRANTY SECTION ──────────── */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                  {/* Left Column: Bank Details & Warranty Assurances */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    {/* Bank Remittance Details */}
                    <div style={boxStyle}>
                      <div style={{ ...capStyle("#0b2545"), fontSize: "7.8px" }}>
                        <span>OFFICIAL BANK DETAILS (FOR RTGS / NEFT / CHEQUE)</span>
                        <span style={{ fontSize: "6.8px", color: "#93c5fd" }}>Remittance Info</span>
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7.5px" }}>
                        <tbody>
                          <tr>
                            <td style={{ ...cellK, width: "35%" }}>Beneficiary Name:</td>
                            <td style={{ ...cellV, fontWeight: "bold" }}>RBP ENERGY INDIA PVT. LTD.</td>
                          </tr>
                          <tr>
                            <td style={cellK}>Bank Name:</td>
                            <td style={{ ...cellV, fontWeight: "600" }}>{bankName}</td>
                          </tr>
                          <tr>
                            <td style={cellK}>Account Number:</td>
                            <td style={{ ...cellV, fontWeight: "bold", color: "#1d4ed8" }}>{accountNo}</td>
                          </tr>
                          <tr>
                            <td style={{ ...cellK, borderBottom: "none" }}>IFSC / Branch:</td>
                            <td style={{ ...cellV, borderBottom: "none", fontWeight: "600" }}>{ifscCode} | {branch}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Standard Warranty Package */}
                    <div style={{ border: "1px solid #fde68a", borderRadius: "5px", padding: "5px 7px", background: "#fffbeb" }}>
                      <div style={{ fontSize: "7.8px", fontWeight: "bold", color: "#92400e", marginBottom: "2px", textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
                        <span>🛡️ Standard Solar Warranty Package</span>
                        <span style={{ fontSize: "6.8px", color: "#b45309" }}>30 Years Performance</span>
                      </div>
                      <div style={{ fontSize: "7.2px", color: "#78350f", lineHeight: "1.28" }}>
                        <div>• <strong>Solar Modules:</strong> 12 Yrs Workmanship &amp; 30 Yrs Linear Performance (Min 80% generation).</div>
                        <div>• <strong>Solar Grid Inverter:</strong> 8 Yrs (≤20kW) / 5 Yrs (&gt;20kW) Comprehensive Manufacturer Warranty.</div>
                        <div>• <strong>Mounting Structure &amp; BOS:</strong> 5 Years against corrosion &amp; structural integrity.</div>
                        <div>• <strong>System Workmanship &amp; AMC:</strong> 5 Years Comprehensive System Coverage.</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Commercial & Subsidy Calculation Breakdown */}
                  <div style={{ flex: 1, border: "1px solid #cbd5e1", borderRadius: "5px", overflow: "hidden", background: "#ffffff" }}>
                    <div style={{ ...capStyle("#0b2545"), fontSize: "7.8px" }}>
                      <span>COMMERCIAL PRICING &amp; SUBSIDY BREAKDOWN</span>
                      <span style={{ fontSize: "6.8px", color: "#93c5fd" }}>Direct Benefit Transfer</span>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7.8px" }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: "2px 7px", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>Base Amount ({qty} × ₹{fmt(rate)}):</td>
                          <td style={{ padding: "2px 7px", textAlign: "right", fontWeight: "600", borderBottom: "1px solid #e2e8f0" }}>₹ {fmt(amount)}</td>
                        </tr>
                        {disc > 0 && (
                          <tr>
                            <td style={{ padding: "2px 7px", color: "#dc2626", borderBottom: "1px solid #e2e8f0" }}>Special Discount ({disc}%):</td>
                            <td style={{ padding: "2px 7px", textAlign: "right", color: "#dc2626", fontWeight: "600", borderBottom: "1px solid #e2e8f0" }}>- ₹ {fmt(discountAmount)}</td>
                          </tr>
                        )}
                        <tr>
                          <td style={{ padding: "2px 7px", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>Taxable Supply Value:</td>
                          <td style={{ padding: "2px 7px", textAlign: "right", fontWeight: "bold", borderBottom: "1px solid #e2e8f0" }}>₹ {fmt(taxableAmount)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "2px 7px", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>CGST @ {(gstPct / 2).toFixed(1)}% + SGST @ {(gstPct / 2).toFixed(1)}%:</td>
                          <td style={{ padding: "2px 7px", textAlign: "right", fontWeight: "600", borderBottom: "1px solid #e2e8f0" }}>+ ₹ {fmt(gstAmount)}</td>
                        </tr>
                        <tr style={{ background: "#f8fafc" }}>
                          <td style={{ padding: "2.5px 7px", fontWeight: "bold", color: "#0f172a", borderBottom: "1px solid #e2e8f0" }}>Total Cost (Inclusive of GST):</td>
                          <td style={{ padding: "2.5px 7px", textAlign: "right", fontWeight: "bold", color: "#0f172a", borderBottom: "1px solid #e2e8f0" }}>₹ {fmt(grandTotal)}</td>
                        </tr>

                        {/* Government Subsidy Sections */}
                        {centralSubsidy > 0 && (
                          <tr>
                            <td style={{ padding: "2px 7px", color: "#15803d", borderBottom: "1px solid #e2e8f0" }}>Central Subsidy (PM Surya Ghar):</td>
                            <td style={{ padding: "2px 7px", textAlign: "right", color: "#15803d", fontWeight: "bold", borderBottom: "1px solid #e2e8f0" }}>- ₹ {fmt(centralSubsidy)}</td>
                          </tr>
                        )}
                        {stateSubsidy > 0 && (
                          <tr>
                            <td style={{ padding: "2px 7px", color: "#15803d", borderBottom: "1px solid #e2e8f0" }}>State Subsidy (CREDA / State Govt):</td>
                            <td style={{ padding: "2px 7px", textAlign: "right", color: "#15803d", fontWeight: "bold", borderBottom: "1px solid #e2e8f0" }}>- ₹ {fmt(stateSubsidy)}</td>
                          </tr>
                        )}
                        {applicableSubsidy > 0 && centralSubsidy === 0 && stateSubsidy === 0 && (
                          <tr>
                            <td style={{ padding: "2px 7px", color: "#15803d", borderBottom: "1px solid #e2e8f0" }}>Applicable Subsidy (DBT):</td>
                            <td style={{ padding: "2px 7px", textAlign: "right", color: "#15803d", fontWeight: "bold", borderBottom: "1px solid #e2e8f0" }}>- ₹ {fmt(applicableSubsidy)}</td>
                          </tr>
                        )}

                        {/* NET PAYABLE BOX */}
                        <tr style={{ background: "#0b2545", color: "#ffffff" }}>
                          <td style={{ padding: "5px 8px", fontWeight: "bold", fontSize: "8.8px" }}>
                            NET PAYABLE BY CUSTOMER (Ex Battery):
                          </td>
                          <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: "900", fontSize: "11px", color: "#fbbf24" }}>
                            ₹ {fmt(netCost)}
                          </td>
                        </tr>
                        <tr style={{ background: "#fffbeb" }}>
                          <td colSpan={2} style={{ padding: "3px 7px", fontSize: "6.8px", color: "#78350f", fontStyle: "italic" }}>
                            <strong>In Words:</strong> {toWords(netCost)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ─── 6. TERMS & CONDITIONS | PROJECT COMMITMENT ─────────────── */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                  {/* Terms & Conditions (from form) */}
                  <div style={{ ...boxStyle, flex: 1, background: "#ffffff" }}>
                    <div style={{ ...capStyle("#1e40af"), fontSize: "7.8px" }}>
                      <span>TERMS &amp; CONDITIONS</span>
                      <span style={{ fontSize: "6.8px", color: "#bfdbfe" }}>Technical Scope &amp; Approvals</span>
                    </div>
                    <div style={{ padding: "5px 8px", fontSize: "7.2px", color: "#334155", lineHeight: "1.35", whiteSpace: "pre-line", background: "#f8fafc" }}>
                      {termsConditions}
                    </div>
                  </div>

                  {/* Statutory Undertaking & Commitments */}
                  <div style={{ flex: 1, border: "1px solid #fde68a", borderRadius: "5px", overflow: "hidden", background: "#fffbeb" }}>
                    <div style={{ ...capStyle("#b45309"), fontSize: "7.8px" }}>
                      <span>★ PROJECT EXECUTION &amp; GENERATION COMMITMENT</span>
                      <span style={{ fontSize: "6.8px", color: "#fed7aa" }}>Undertaking</span>
                    </div>
                    <div style={{ padding: "5px 8px", fontSize: "7.2px", color: "#78350f", lineHeight: "1.32" }}>
                      <div>• <strong>Annual Yield:</strong> Estimated generation of 1,500 units (kWh) per kWp installed per year subject to shadow-free conditions and periodic cleaning.</div>
                      <div>• <strong>Net Metering &amp; Subsidies:</strong> Facilitation and documentation for Net Metering sanction and central/state subsidy approvals executed by RBP Energy India Pvt. Ltd.</div>
                      <div>• <strong>Delivery &amp; Dispatch:</strong> Supply of materials commences within 10 to 14 business days from technical feasibility approval.</div>
                    </div>
                  </div>
                </div>

                {/* ─── 7. GENERAL TERMS & CONDITIONS (2-column, full width) ───── */}
                <div style={{ border: "1px solid #cbd5e1", borderRadius: "5px", overflow: "hidden", marginBottom: "6px", background: "#f8fafc" }}>
                  <div style={{ ...capStyle("#0b2545"), fontSize: "7.8px" }}>
                    <span>GENERAL TERMS &amp; CONDITIONS</span>
                    <span style={{ fontSize: "6.8px", color: "#93c5fd" }}>Commercial Terms &amp; Guidelines</span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", padding: "5px 9px", fontSize: "7.1px", color: "#334155", lineHeight: "1.36" }}>
                    <div style={{ flex: 1 }}>
                      {gtColLeft.map((line, i) => (
                        <div key={`gtl-${i}`} style={{ marginBottom: "1px" }}>{line}</div>
                      ))}
                    </div>
                    <div style={{ width: "1px", background: "#e2e8f0", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      {gtColRight.map((line, i) => (
                        <div key={`gtr-${i}`} style={{ marginBottom: "1px" }}>{line}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ─── 8. OFFICIAL ACCEPTANCE & SIGN-OFF BLOCK ────────────────── */}
                <div style={{ display: "flex", gap: "8px" }}>
                  {/* Client Acceptance Box */}
                  <div style={{ flex: 1, border: "1px solid #cbd5e1", borderRadius: "5px", padding: "7px 8px", background: "#ffffff" }}>
                    <div style={{ fontWeight: "bold", color: "#0f172a", fontSize: "8.2px", marginBottom: "3px" }}>
                      CLIENT ACCEPTANCE &amp; CONFIRMATION
                    </div>
                    <div style={{ fontSize: "7.2px", color: "#64748b", marginBottom: "22px", lineHeight: "1.3" }}>
                      I / We hereby approve and accept the technical specifications, BOM, pricing, and all terms &amp; conditions stated above.
                    </div>
                    <div style={{ borderTop: "1px dashed #94a3b8", paddingTop: "4px", display: "flex", justifyContent: "space-between", fontSize: "7px", color: "#475569" }}>
                      <span>Authorized Signature &amp; Seal</span>
                      <span>Date: _______________</span>
                    </div>
                  </div>

                  {/* Contractor Sign-Off Box */}
                  <div style={{ flex: 1, border: "1px solid #cbd5e1", borderRadius: "5px", padding: "7px 8px", background: "#f8fafc", textAlign: "right" }}>
                    <div style={{ fontWeight: "bold", color: "#0b2545", fontSize: "8.5px" }}>
                      FOR RBP ENERGY INDIA PVT. LTD.
                    </div>
                    <div style={{ fontSize: "7px", color: "#64748b", marginTop: "2px" }}>
                      Authorized Central EPC Division
                    </div>
                    <div style={{ height: "22px", display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: "2px" }}>
                      <div style={{ border: "1px solid #059669", borderRadius: "3px", padding: "2px 8px", fontSize: "6.8px", color: "#059669", background: "#ecfdf5", fontWeight: "bold" }}>
                        ✓ Digitally Certified Quotation
                      </div>
                    </div>
                    <div style={{ borderTop: "1px dashed #94a3b8", paddingTop: "4px", marginTop: "3px", fontSize: "7.2px", fontWeight: "bold", color: "#1e293b" }}>
                      Authorized Signatory
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── MEASURED FOOTER (pinned to page bottom) ──────────────────── */}
              <div
                ref={footRef}
                style={{ borderTop: "1.5px solid #cbd5e1", paddingTop: "5px", marginTop: `${FOOT_GAP}px`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "7px", color: "#64748b" }}
              >
                <div>
                  RBP ENERGY INDIA PVT. LTD. • Raipur (C.G.) • Helpline: +91 92000 12500 / 12400 • www.rbpindia.com
                </div>
                <div style={{ fontWeight: "bold", color: "#0b2545" }}>
                  Page 1 of 1 • Subject to Raipur Jurisdiction
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-slate-500">
            Single A4 sheet · 210mm × 297mm · text auto-fitted at {Math.round(fit * 100)}% of design size
          </div>

        </div>

        {/* Modal Bottom Control Bar */}
        <div className="bg-slate-900 px-6 py-3 border-t border-slate-800 flex items-center justify-between shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
            <input
              type="checkbox"
              checked={sendWhatsApp}
              onChange={(e) => setSendWhatsApp(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="font-medium text-emerald-400">Send Copy to Customer on WhatsApp Automatically</span>
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDirectDownloadPDF}
              disabled={isSubmitting || isGeneratingPDF}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700 active:scale-95 cursor-pointer"
            >
              <Download className="h-4 w-4 text-indigo-400" />
              Download PDF Only
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700 active:scale-95 cursor-pointer"
            >
              <XCircle className="h-4 w-4" />
              Close
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isGeneratingPDF}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg hover:shadow-emerald-900/30 disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {isSubmitting || isGeneratingPDF ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Generating PDF &amp; Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Quotation &amp; Upload</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

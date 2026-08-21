export const ROUTE_MAP = [
  { href: "/dashboard/admin", label: "Dashboard" },
  { href: "/dashboard/assign-task", label: "Enquiry Form" },
  { href: "/dashboard/LeadPage", label: "Lead Page" },
  { href: "/dashboard/AssignServey", label: "Assign Survey" },
  { href: "/dashboard/SurveyReport", label: "Site Survey" },
  { href: "/dashboard/QuotationCreatePage", label: "Quotation Create" },
  { href: "/dashboard/Followup", label: "Sales Call" },
  { href: "/dashboard/Payment", label: "Payment" },
  { href: "/dashboard/DocumentsUpload", label: "Documents Uploads" },
  { href: "/dashboard/RegistrationPage", label: "Registration" },
  { href: "/dashboard/PaymentConfirmation", label: "Payment Confirmation" },
  { href: "/dashboard/DispatchPlanne", label: "Dispatch Planner" },
  { href: "/dashboard/Dispatchmaterial", label: "Dispatch Material" },
  { href: "/dashboard/DCRPage", label: "DCR Creation" },
  { href: "/dashboard/Materialreceived", label: "IP Material Received" },
  { href: "/dashboard/Installation", label: "Installation" },
  { href: "/dashboard/QCPage", label: "QC" },
  { href: "/dashboard/CSPDL_Inspection", label: "CSPDL Inspection" },
  { href: "/dashboard/IpPayment", label: "IP Payment" },
  { href: "/dashboard/FinalPayment", label: "Financial" },
  { href: "/dashboard/Billing", label: "Billings and Payment Details" },
  { href: "/dashboard/OrderPlace", label: "Solarkart" },
  { href: "/dashboard/InformToCustomer", label: "Inform To Customer" },
  { href: "/dashboard/CspdclForSynconization", label: "Mandatory Documents for Synchronization" },
  { href: "/dashboard/Inspection", label: "Inspection" },
  { href: "/dashboard/ProjectCommission", label: "Project Synchronisation" },
  { href: "/dashboard/Redemption", label: "Subsidy Redemption" },
  { href: "/dashboard/SubsidyDisbursal", label: "Subsidy Disbursal" },
  { href: "/dashboard/Insurance", label: "Insurance" },
  { href: "/dashboard/ModuleEntry", label: "Module Entry" },
  { href: "/dashboard/analysis-graph", label: "Analysis Graph" },
  { href: "/dashboard/all-graph", label: "All Graph" },
  { href: "/dashboard/weekly-performance-report", label: "Weekly Report" },
  { href: "/dashboard/monthly-performance-report", label: "Monthly Report" },
  { href: "/dashboard/AddUser", label: "Add User" },
  { href: "/dashboard/Dropdown", label: "Dropdown" },
  { href: "/dashboard/ProductList", label: "Product List" },
  { href: "/dashboard/DispatchApproval", label: "Dispatch Approval" },
  { href: "/dashboard/BankProcess", label: "Bank Process" },
];

export function getFirstAccessibleRoute(userRole, pageAccess) {
  const role = (userRole || "").toLowerCase();
  const pages = pageAccess || "ALL";

  if (role === "admin" || pages === "ALL" || !pages) {
    return "/dashboard/admin";
  }

  const allowedLabels = pages.split(",").map(p => p.trim()).filter(Boolean);

  // Find first route from ROUTE_MAP whose label matches allowedLabels
  const matched = ROUTE_MAP.find(route =>
    allowedLabels.some(p => {
      const cleanName = p.split("(")[0].split("[")[0].trim();
      return cleanName === route.label;
    })
  );

  return matched ? matched.href : "/dashboard/admin";
}

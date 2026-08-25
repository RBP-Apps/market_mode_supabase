"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  FileText,
  Phone,
  MapPin,
  User,
  Zap,
  Building2,
  X,
  AlertCircle,
  Loader2,
  Filter,
  Download,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Calendar,
  ArrowRight,
  Layers,
  Lock,
  FileSpreadsheet,
  TrendingUp,
  UserCheck
} from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Debounce hook for smooth search
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

// Master list of pages in the system
const MASTER_SYSTEM_PAGES = [
  { name: "Enquiry Form", key: "enquiry_form", category: "Lead Generation", fmsIndex: 1 },
  { name: "Assign Survey", key: "assign_survey", category: "Survey & Field", fmsIndex: 2 },
  { name: "Site Survey", key: "site_survey", category: "Survey & Field", fmsIndex: 3 },
  { name: "Quotation Create", key: "quotation_create", category: "Sales & Estimation", fmsIndex: 4 },
  { name: "Sales Call", key: "sales_call", category: "Sales & Estimation", fmsIndex: 5 },
  { name: "Payment", key: "payment", category: "Finance", fmsIndex: 6 },
  { name: "Documents Uploads", key: "documents_uploads", category: "Documentation", fmsIndex: 7 },
  { name: "Registration", key: "registration", category: "Documentation", fmsIndex: 8 },
  { name: "Payment Confirmation", key: "payment_confirmation", category: "Finance", fmsIndex: 9 },
  { name: "Dispatch Planner", key: "dispatch_planner", category: "Logistics", fmsIndex: 10 },
  { name: "Dispatch Material", key: "dispatch_material", category: "Logistics", fmsIndex: 11 },
  { name: "Installation", key: "installation", category: "Field Ops", fmsIndex: 12 },
  { name: "QC", key: "qc", category: "Quality Control", fmsIndex: 13 },
  { name: "CSPDL Inspection", key: "cspdcl_inspection", category: "Inspection & Govt", fmsIndex: 14 },
  { name: "Project Synchronisation", key: "project_sync", category: "Field Ops", fmsIndex: 15 },
  { name: "Subsidy Redemption", key: "subsidy_redemption", category: "Finance", fmsIndex: 16 },
  { name: "Subsidy Disbursal", key: "subsidy_disbursal", category: "Finance", fmsIndex: 17 },
  { name: "Insurance", key: "insurance", category: "Documentation", fmsIndex: 18 },
  { name: "Add User", key: "add_user", category: "Administration", fmsIndex: 0 }
]

export default function LeadPage() {
  // Main Tab Control: "dashboard" or "leads"
  const [activeTab, setActiveTab] = useState("dashboard")

  // ================= STATE FOR CUSTOMER LEADS (EXISTING LOGIC) =================
  const [leadData, setLeadData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [districtFilter, setDistrictFilter] = useState("ALL")
  const [systemFilter, setSystemFilter] = useState("ALL")
  const [selectedLead, setSelectedLead] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // ================= STATE FOR PAGE-WISE DASHBOARD =================
  const [systemUsers, setSystemUsers] = useState([])
  const [fmsRecords, setFmsRecords] = useState([])
  const [paymentRecords, setPaymentRecords] = useState([])
  const [dashSearchTerm, setDashSearchTerm] = useState("")
  const [dashPageFilter, setDashPageFilter] = useState("ALL")
  const [dashStatusFilter, setDashStatusFilter] = useState("ALL")
  const [dashUserFilter, setDashUserFilter] = useState("ALL")
  const [dashDateFilter, setDashDateFilter] = useState("ALL")
  const [dashActivityType, setDashActivityType] = useState("ALL")
  const [selectedDashboardPage, setSelectedDashboardPage] = useState(null)
  const [showDashDetailModal, setShowDashDetailModal] = useState(false)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const debouncedDashSearchTerm = useDebounce(dashSearchTerm, 300)

  // Helper date formatter
  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return "—"
    try {
      if (typeof dateString === "string" && dateString.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        return dateString
      }
      const date = new Date(dateString)
      if (isNaN(date.getTime()) || date.getFullYear() === 1970) return "—"
      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const year = date.getFullYear()
      const hours = date.getHours().toString().padStart(2, "0")
      const minutes = date.getMinutes().toString().padStart(2, "0")
      return `${day}/${month}/${year} ${hours}:${minutes}`
    } catch (e) {
      return dateString
    }
  }, [])

  // Fetch all data for leads & dashboard
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        { data: enqData, error: enqError },
        { data: fData, error: fError },
        { data: pData, error: pError },
        { data: userData, error: uError }
      ] = await Promise.all([
        supabase.from("enquiries").select("*").order("id", { ascending: false }),
        supabase.from("fms").select("*").order("id", { ascending: false }),
        supabase.from("payments").select("*").order("id", { ascending: false }),
        supabase.from("login").select("id, username, name, role, page, department")
      ])

      if (enqError) throw enqError

      const mappedLeads = (enqData || []).map((row) => ({
        id: row.id,
        enquiryNumber: row.enquiry_number || `EN-${row.id}`,
        timestamp: row.timestamp,
        beneficiaryName: row.beneficiary_name || "—",
        beneficiaryNumber: row.beneficiary_number || "—",
        contactNumber: row.contact_number || "—",
        address: row.address || "—",
        villageBlock: row.village_block || "—",
        district: row.district || "—",
        presentLoad: row.present_load || "—",
        bpNumber: row.bp_number || "—",
        cspdclContractDemand: row.cspdcl_contract_demand || "—",
        avgElectricityBill: row.avg_electricity_bill || "",
        futureLoadRequirement: row.future_load_requirement || "—",
        loadDetails: row.load_details || "—",
        structureType: row.structure_type || "—",
        roofType: row.roof_type || "—",
        systemType: row.system_type || "—",
        needType: row.need_type || "—",
        projectMode: row.project_mode || "—",
        firmName: row.firm_name || row.vendor_name || "—",
        paymentType: row.payment_type || "—",
        assignedBy: row.assigned_by || "—",
        reference: row.reference || "—",
        stage: row.stage || "Enquiry Received"
      }))

      setLeadData(mappedLeads)
      setFmsRecords(fData || [])
      setPaymentRecords(pData || [])
      setSystemUsers(userData || [])

    } catch (err) {
      console.error("Error fetching lead/dashboard data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Get unique districts & system types for customer leads filters
  const uniqueDistricts = useMemo(() => {
    const list = leadData.map((item) => item.district).filter((d) => d && d !== "—")
    return ["ALL", ...Array.from(new Set(list))]
  }, [leadData])

  const uniqueSystemTypes = useMemo(() => {
    const list = leadData.map((item) => item.systemType).filter((s) => s && s !== "—")
    return ["ALL", ...Array.from(new Set(list))]
  }, [leadData])

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leadData.filter((lead) => {
      const matchesSearch = debouncedSearchTerm
        ? Object.values(lead).some(
            (val) => val && val.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          )
        : true
      const matchesDistrict = districtFilter === "ALL" || lead.district === districtFilter
      const matchesSystem = systemFilter === "ALL" || lead.systemType === systemFilter
      return matchesSearch && matchesDistrict && matchesSystem
    })
  }, [leadData, debouncedSearchTerm, districtFilter, systemFilter])

  // ================= COMPUTED PAGE-WISE DASHBOARD METRICS =================
  const pageMetricsList = useMemo(() => {
    const now = new Date()

    return MASTER_SYSTEM_PAGES.map((pageObj) => {
      let totalWork = 0
      let completed = 0
      let pending = 0
      let inProgress = 0
      let activityCount = 0
      let lastActivityDate = null
      let lastUpdatedBy = "—"
      const taskTimeline = []

      // 1. Process for "Enquiry Form"
      if (pageObj.name === "Enquiry Form") {
        totalWork = leadData.length
        activityCount = leadData.length
        completed = leadData.length
        pending = 0
        inProgress = 0

        if (leadData.length > 0) {
          const latest = leadData[0]
          lastActivityDate = latest.timestamp
          lastUpdatedBy = latest.assignedBy || "System Admin"

          leadData.slice(0, 15).forEach((l) => {
            taskTimeline.push({
              enquiryNumber: l.enquiryNumber,
              user: l.assignedBy || "Admin",
              action: `Created Enquiry for ${l.beneficiaryName}`,
              status: "Completed",
              timestamp: l.timestamp,
              details: `District: ${l.district}, System: ${l.systemType}`
            })
          })
        }
      } 
      // 2. Process for "Add User"
      else if (pageObj.name === "Add User") {
        totalWork = systemUsers.length
        completed = systemUsers.length
        activityCount = systemUsers.length
        lastActivityDate = new Date().toISOString()
        lastUpdatedBy = "Admin"

        systemUsers.forEach((u) => {
          taskTimeline.push({
            enquiryNumber: u.username,
            user: "Admin",
            action: `Account ${u.username} (${u.role})`,
            status: u.page ? "Active Permission" : "No Permission",
            timestamp: new Date().toISOString(),
            details: `Dept: ${u.department || "General"}, Access: ${u.page || "None"}`
          })
        })
      }
      // 3. Process for FMS & Other Pipeline Stages
      else {
        const idx = pageObj.fmsIndex
        if (idx > 0 && fmsRecords.length > 0) {
          fmsRecords.forEach((fmsRow) => {
            const actualVal = fmsRow[`actual_${idx}`]
            const plannedVal = fmsRow[`planned_${idx}`]
            const statusVal = fmsRow[`status_${idx}`] || fmsRow.stage || ""
            const enqNum = fmsRow.enquiry_number || `EN-${fmsRow.id}`
            const userStr = fmsRow.surveyor_name || fmsRow.assigned_by || "System Staff"

            if (actualVal || plannedVal || statusVal) {
              totalWork++
              activityCount++

              let currentTaskStatus = "Pending"
              if (actualVal) {
                completed++
                currentTaskStatus = "Completed"
                if (!lastActivityDate || new Date(actualVal) > new Date(lastActivityDate)) {
                  lastActivityDate = actualVal
                  lastUpdatedBy = userStr
                }
              } else if (plannedVal) {
                pending++
                inProgress++
                currentTaskStatus = "In Progress"
              }

              taskTimeline.push({
                enquiryNumber: enqNum,
                user: userStr,
                action: `${pageObj.name} processing for ${enqNum}`,
                status: currentTaskStatus,
                timestamp: actualVal || plannedVal || new Date().toISOString(),
                details: `Status: ${statusVal || currentTaskStatus}`
              })
            }
          })
        }
      }

      // Determine Page Overall Status
      let overallStatus = "No Activity"
      if (totalWork > 0) {
        if (pending === 0 && completed > 0) {
          overallStatus = "Completed"
        } else if (completed > 0 && pending > 0) {
          overallStatus = "In Progress"
        } else if (pending > 0 && completed === 0) {
          overallStatus = "Pending"
        } else {
          overallStatus = "In Progress"
        }
      }

      // Check User Access/Permissions for this page
      const usersWithAccess = systemUsers.filter((u) => {
        if (!u.page) return false
        if (u.page === "ALL") return true
        return u.page.includes(pageObj.name)
      })

      return {
        ...pageObj,
        totalWork,
        completed,
        pending,
        inProgress,
        activityCount,
        lastActivityDate,
        lastUpdatedBy,
        status: overallStatus,
        usersWithAccess,
        taskTimeline: taskTimeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      }
    })
  }, [leadData, fmsRecords, systemUsers])

  // Filtered Page Metrics based on Dashboard Controls
  const filteredPageMetrics = useMemo(() => {
    return pageMetricsList.filter((p) => {
      // Search term filter
      const matchesSearch = debouncedDashSearchTerm
        ? p.name.toLowerCase().includes(debouncedDashSearchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(debouncedDashSearchTerm.toLowerCase()) ||
          p.lastUpdatedBy.toLowerCase().includes(debouncedDashSearchTerm.toLowerCase())
        : true

      // Page Name filter
      const matchesPage = dashPageFilter === "ALL" || p.name === dashPageFilter

      // Status filter
      const matchesStatus = dashStatusFilter === "ALL" || p.status === dashStatusFilter

      // User filter
      const matchesUser =
        dashUserFilter === "ALL" ||
        p.lastUpdatedBy.toLowerCase().includes(dashUserFilter.toLowerCase()) ||
        p.usersWithAccess.some((u) => u.username.toLowerCase().includes(dashUserFilter.toLowerCase()))

      // Activity Type filter
      let matchesActivity = true
      if (dashActivityType === "RECENT") {
        if (!p.lastActivityDate) matchesActivity = false
        else {
          const diffDays = (new Date() - new Date(p.lastActivityDate)) / (1000 * 3600 * 24)
          matchesActivity = diffDays <= 7
        }
      } else if (dashActivityType === "NO_ACTIVITY") {
        matchesActivity = p.totalWork === 0 || p.status === "No Activity"
      }

      // Date Range filter
      let matchesDate = true
      if (dashDateFilter !== "ALL" && p.lastActivityDate) {
        const actDate = new Date(p.lastActivityDate)
        const now = new Date()
        if (dashDateFilter === "TODAY") {
          matchesDate = actDate.toDateString() === now.toDateString()
        } else if (dashDateFilter === "WEEK") {
          const diffDays = (now - actDate) / (1000 * 3600 * 24)
          matchesDate = diffDays <= 7
        } else if (dashDateFilter === "MONTH") {
          matchesDate = actDate.getMonth() === now.getMonth() && actDate.getFullYear() === now.getFullYear()
        }
      } else if (dashDateFilter !== "ALL" && !p.lastActivityDate) {
        matchesDate = false
      }

      return matchesSearch && matchesPage && matchesStatus && matchesUser && matchesActivity && matchesDate
    })
  }, [
    pageMetricsList,
    debouncedDashSearchTerm,
    dashPageFilter,
    dashStatusFilter,
    dashUserFilter,
    dashActivityType,
    dashDateFilter
  ])

  // Dashboard Overview Summary Statistics
  const dashStats = useMemo(() => {
    const totalPages = MASTER_SYSTEM_PAGES.length
    const completedPages = pageMetricsList.filter((p) => p.status === "Completed").length
    const pendingPages = pageMetricsList.filter((p) => p.status === "Pending").length
    const inProgressPages = pageMetricsList.filter((p) => p.status === "In Progress").length
    const noActivityPages = pageMetricsList.filter((p) => p.status === "No Activity" || p.totalWork === 0).length
    const totalActivities = pageMetricsList.reduce((acc, p) => acc + p.activityCount, 0)
    
    // Recent activities count in last 7 days
    const recentActivitiesCount = pageMetricsList.filter((p) => {
      if (!p.lastActivityDate) return false
      const diffDays = (new Date() - new Date(p.lastActivityDate)) / (1000 * 3600 * 24)
      return diffDays <= 7
    }).length

    return {
      totalPages,
      completedPages,
      pendingPages,
      inProgressPages,
      noActivityPages,
      totalActivities,
      recentActivitiesCount
    }
  }, [pageMetricsList])

  // Combined Recent Activity Stream for Dashboard
  const recentActivityStream = useMemo(() => {
    const allTimelineItems = []
    pageMetricsList.forEach((p) => {
      p.taskTimeline.forEach((item) => {
        allTimelineItems.push({
          ...item,
          pageName: p.name,
          category: p.category
        })
      })
    })
    return allTimelineItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15)
  }, [pageMetricsList])

  // ================= EXPORT FUNCTIONS =================

  // 1. Export Customer Leads Excel / CSV
  const exportToExcel = useCallback(() => {
    if (filteredLeads.length === 0) {
      alert("No lead data available to export.")
      return
    }

    const headers = [
      "Enquiry No", "Date / Time", "Beneficiary Name", "Beneficiary Number", "Contact Number",
      "Address", "Village / Block", "District", "Present Load", "BP Number", "CSPDCL Demand",
      "Future Load", "Load Details", "Structure Type", "Roof Type", "System Type", "Need Type",
      "Project Mode", "Payment Type", "Firm / Vendor", "Assigned By", "Reference", "Stage"
    ]

    const rows = filteredLeads.map((lead) => [
      lead.enquiryNumber, formatDateTime(lead.timestamp), lead.beneficiaryName, lead.beneficiaryNumber,
      lead.contactNumber, lead.address, lead.villageBlock, lead.district, lead.presentLoad,
      lead.bpNumber, lead.cspdclContractDemand, lead.futureLoadRequirement, lead.loadDetails,
      lead.structureType, lead.roofType, lead.systemType, lead.needType, lead.projectMode,
      lead.paymentType, lead.firmName, lead.assignedBy, lead.reference, lead.stage
    ])

    const formatValue = (val) => {
      if (val === undefined || val === null) return '""'
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return `"${str}"`
    }

    const csvContent = "\uFEFF" + [
      headers.map(formatValue).join(','),
      ...rows.map((row) => row.map(formatValue).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    const timestamp = new Date().toISOString().split("T")[0]
    link.download = `Leads_Summary_${timestamp}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }, [filteredLeads, formatDateTime])

  // 2. Export Lead Summary PDF
  const exportToPDF = useCallback(() => {
    if (filteredLeads.length === 0) {
      alert("No lead data available to export PDF.")
      return
    }

    const doc = new jsPDF("landscape")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.setTextColor(37, 99, 235)
    doc.text("RBP ENERGY INDIA PVT LTD", 14, 15)

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    doc.text("CUSTOMER LEADS SUMMARY REPORT", 14, 22)

    const now = new Date().toLocaleString("en-IN")
    doc.setFontSize(9)
    doc.text(`Generated: ${now} | Filtered Records: ${filteredLeads.length} of ${leadData.length} total leads`, 14, 28)
    doc.text(`Filters — District: ${districtFilter} | System: ${systemFilter} | Search: "${searchTerm || "None"}"`, 14, 33)

    doc.setLineWidth(0.5)
    doc.setDrawColor(220, 224, 230)
    doc.line(14, 36, 283, 36)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)
    doc.text("1. EXECUTIVE SUMMARY & BREAKDOWN", 14, 43)

    const distCounts = {}
    filteredLeads.forEach(l => {
      distCounts[l.district || "Unspecified"] = (distCounts[l.district || "Unspecified"] || 0) + 1
    })
    const distSummaryStr = Object.entries(distCounts).map(([k, v]) => `${k}: ${v}`).join(" | ")

    const sysCounts = {}
    filteredLeads.forEach(l => {
      sysCounts[l.systemType || "Unspecified"] = (sysCounts[l.systemType || "Unspecified"] || 0) + 1
    })
    const sysSummaryStr = Object.entries(sysCounts).map(([k, v]) => `${k}: ${v}`).join(" | ")

    const summaryData = [
      ["Total Records Evaluated", `${filteredLeads.length} leads`],
      ["District-wise Breakdown", distSummaryStr || "N/A"],
      ["System Type Breakdown", sysSummaryStr || "N/A"]
    ]

    autoTable(doc, {
      startY: 46,
      head: [["Summary Metric", "Details"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 8.5, font: "helvetica", cellPadding: 2.5 },
      columnStyles: { 0: { cellWidth: 50, fontStyle: "bold" }, 1: { cellWidth: "auto" } },
      margin: { left: 14, right: 14 }
    })

    const startTableY = doc.lastAutoTable.finalY + 8
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)
    doc.text("2. DETAILED LEAD RECORDS TABLE", 14, startTableY)

    const tableHeaders = [
      ["S.No", "Enquiry No", "Date", "Beneficiary Name", "Contact No", "District", "Present Load", "System", "Roof/Structure", "Payment", "Vendor/Firm"]
    ]

    const tableRows = filteredLeads.map((lead, idx) => [
      idx + 1, lead.enquiryNumber, formatDateTime(lead.timestamp).split(' ')[0],
      lead.beneficiaryName, lead.contactNumber, lead.district, lead.presentLoad,
      lead.systemType, `${lead.roofType} / ${lead.structureType}`, lead.paymentType, lead.firmName
    ])

    autoTable(doc, {
      startY: startTableY + 3,
      head: tableHeaders,
      body: tableRows,
      theme: "striped",
      headStyles: { fillColor: [30, 58, 138], fontStyle: "bold", fontSize: 8.5 },
      styles: { fontSize: 8, font: "helvetica", cellPadding: 2 },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages()
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(150, 150, 150)
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, 283 - 25, 200, { align: "right" })
        doc.text("RBP Energy India Pvt Ltd — Confidential Lead Summary Report", 14, 200)
      }
    })

    const timestamp = new Date().toISOString().split("T")[0]
    doc.save(`Leads_Summary_Report_${timestamp}.pdf`)
  }, [filteredLeads, leadData, districtFilter, systemFilter, searchTerm, formatDateTime])

  // 3. Export Comprehensive Page-wise Activity Dashboard PDF Summary
  const exportDashboardPDF = useCallback(() => {
    if (filteredPageMetrics.length === 0) {
      alert("No page activity data available for PDF export.")
      return
    }

    const doc = new jsPDF("landscape")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.setTextColor(30, 58, 138) // Deep Blue
    doc.text("RBP ENERGY INDIA PVT LTD", 14, 14)

    doc.setFontSize(12)
    doc.setTextColor(79, 70, 229) // Indigo
    doc.text("CENTRALIZED PAGE-WISE ACTIVITY & ACCESS DASHBOARD REPORT", 14, 21)

    const now = new Date().toLocaleString("en-IN")
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated On: ${now} | System Total Pages: ${dashStats.totalPages}`, 14, 27)

    const filterAppliedStr = `Page: ${dashPageFilter} | Status: ${dashStatusFilter} | User: ${dashUserFilter} | Date: ${dashDateFilter} | Search: "${dashSearchTerm || "None"}"`
    doc.text(`Applied Filters: ${filterAppliedStr}`, 14, 32)

    doc.setLineWidth(0.5)
    doc.setDrawColor(226, 232, 240)
    doc.line(14, 35, 283, 35)

    // Section 1: Executive KPI Overview
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10.5)
    doc.setTextColor(30, 41, 59)
    doc.text("1. SYSTEM EXECUTIVE ACTIVITY METRICS", 14, 42)

    const kpiData = [
      [
        `Total System Pages: ${dashStats.totalPages}`,
        `Completed Pages: ${dashStats.completedPages}`,
        `In-Progress Pages: ${dashStats.inProgressPages}`,
        `Pending Pages: ${dashStats.pendingPages}`
      ],
      [
        `No Activity Pages: ${dashStats.noActivityPages}`,
        `Total Logged Actions: ${dashStats.totalActivities}`,
        `Recent Active Modules (7D): ${dashStats.recentActivitiesCount}`,
        `Total Active Users: ${systemUsers.length}`
      ]
    ]

    autoTable(doc, {
      startY: 45,
      body: kpiData,
      theme: "grid",
      styles: { fontSize: 8.5, font: "helvetica", cellPadding: 3, fontStyle: "bold", textColor: [30, 41, 59] },
      columnStyles: {
        0: { fillColor: [243, 244, 246] },
        1: { fillColor: [236, 253, 245] },
        2: { fillColor: [239, 246, 255] },
        3: { fillColor: [254, 243, 199] }
      },
      margin: { left: 14, right: 14 }
    })

    // Section 2: Page-wise Activity & Work Table
    const startTableY = doc.lastAutoTable.finalY + 8
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10.5)
    doc.setTextColor(30, 41, 59)
    doc.text("2. PAGE-WISE WORK & ACCESS BREAKDOWN", 14, startTableY)

    const tableHeaders = [
      ["S.No", "Page / Module Name", "Category", "Total Work", "Completed", "Pending", "In Progress", "Last Activity", "Last Updated By", "Status", "Access Count"]
    ]

    const tableRows = filteredPageMetrics.map((p, idx) => [
      idx + 1,
      p.name,
      p.category,
      p.totalWork,
      p.completed,
      p.pending,
      p.inProgress,
      p.lastActivityDate ? formatDateTime(p.lastActivityDate) : "No Activity",
      p.lastUpdatedBy,
      p.status,
      `${p.usersWithAccess.length} Users`
    ])

    autoTable(doc, {
      startY: startTableY + 3,
      head: tableHeaders,
      body: tableRows,
      theme: "striped",
      headStyles: { fillColor: [67, 56, 202], fontStyle: "bold", fontSize: 8.5 },
      styles: { fontSize: 8, font: "helvetica", cellPadding: 2.5 },
      margin: { left: 14, right: 14 }
    })

    // Section 3: Recent Activity Log Highlights
    if (recentActivityStream.length > 0) {
      const startLogY = doc.lastAutoTable.finalY + 8
      if (startLogY < 170) {
        doc.setFont("helvetica", "bold")
        doc.setFontSize(10.5)
        doc.setTextColor(30, 41, 59)
        doc.text("3. RECENT SYSTEM ACTIVITY TIMELINE HIGHLIGHTS", 14, startLogY)

        const logHeaders = [["Module Page", "Enquiry / Target", "Action Performed", "Updated By", "Status", "Timestamp"]]
        const logRows = recentActivityStream.slice(0, 8).map((log) => [
          log.pageName,
          log.enquiryNumber,
          log.action,
          log.user,
          log.status,
          formatDateTime(log.timestamp)
        ])

        autoTable(doc, {
          startY: startLogY + 3,
          head: logHeaders,
          body: logRows,
          theme: "grid",
          headStyles: { fillColor: [30, 58, 138], fontStyle: "bold", fontSize: 8 },
          styles: { fontSize: 7.5, font: "helvetica", cellPadding: 2 },
          margin: { left: 14, right: 14 }
        })
      }
    }

    // Footer with Page Numbers
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(150, 150, 150)
      doc.text(`Page ${i} of ${pageCount}`, 283 - 25, 200, { align: "right" })
      doc.text("RBP Energy India Pvt Ltd — Page-wise Activity & Access Executive Summary Report", 14, 200)
    }

    const timestamp = new Date().toISOString().split("T")[0]
    doc.save(`Page_Activity_Dashboard_Report_${timestamp}.pdf`)
  }, [filteredPageMetrics, dashStats, systemUsers, dashPageFilter, dashStatusFilter, dashUserFilter, dashDateFilter, dashSearchTerm, recentActivityStream, formatDateTime])

  const handleViewLead = (lead) => {
    setSelectedLead(lead)
    setShowDetailModal(true)
  }

  const handleViewPageDetail = (pageObj) => {
    setSelectedDashboardPage(pageObj)
    setShowDashDetailModal(true)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header Section */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent flex items-center">
              <Activity className="h-7 w-7 mr-2.5 text-indigo-600 inline-block" />
              Lead & Page Activity Dashboard
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Centralized page-wise task monitoring, activity status, user permissions & lead management.
            </p>
          </div>

          {/* Action Buttons & PDF Export */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {activeTab === "dashboard" ? (
              <button
                onClick={exportDashboardPDF}
                disabled={loading || filteredPageMetrics.length === 0}
                className="inline-flex items-center px-3.5 py-2 border border-indigo-200 text-xs font-semibold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                title="Export Page Activity Dashboard PDF Summary Report"
              >
                <FileText className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                Export Dashboard PDF
              </button>
            ) : (
              <>
                <button
                  onClick={exportToPDF}
                  disabled={loading || filteredLeads.length === 0}
                  className="inline-flex items-center px-3.5 py-2 border border-rose-200 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  title="Download Lead Summary PDF Report"
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5 text-rose-600" />
                  PDF Summary
                </button>

                <button
                  onClick={exportToExcel}
                  disabled={loading || filteredLeads.length === 0}
                  className="inline-flex items-center px-3.5 py-2 border border-emerald-200 text-xs font-semibold rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  title="Download Table Data in Excel/CSV"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                  Excel Export
                </button>
              </>
            )}

            <button
              onClick={fetchAllData}
              disabled={loading}
              className="inline-flex items-center px-3.5 py-2 border border-blue-200 text-xs font-semibold rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex border-b border-gray-200 space-x-2 bg-gray-50/50 p-1.5 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "text-gray-600 hover:text-blue-700 hover:bg-white/80"
            }`}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Page Activity & Access Dashboard
            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === "dashboard" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"}`}>
              {dashStats.totalPages} Pages
            </span>
          </button>

          <button
            onClick={() => setActiveTab("leads")}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "leads"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "text-gray-600 hover:text-blue-700 hover:bg-white/80"
            }`}
          >
            <Users className="h-4 w-4 mr-2" />
            Customer Leads List
            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === "leads" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"}`}>
              {leadData.length} Records
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PAGE-WISE ACTIVITY & ACCESS DASHBOARD */}
        {/* ========================================================================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Executive KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {/* Card 1: Total Pages */}
              <div
                onClick={() => {
                  setDashStatusFilter("ALL")
                  setDashActivityType("ALL")
                }}
                className={`bg-white p-3.5 rounded-xl border shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${
                  dashStatusFilter === "ALL" && dashActivityType === "ALL"
                    ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/10"
                    : "border-slate-200 hover:border-blue-300"
                }`}
                title="Click to view all system pages"
              >
                <div className="flex justify-between items-center text-blue-600 mb-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Total Pages</span>
                  <Layers className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{dashStats.totalPages}</h3>
                <p className="text-[10px] text-gray-400 mt-1">Click to view all</p>
              </div>

              {/* Card 2: Completed */}
              <div
                onClick={() => {
                  setDashStatusFilter("Completed")
                  setDashActivityType("ALL")
                }}
                className={`p-3.5 rounded-xl border shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${
                  dashStatusFilter === "Completed"
                    ? "border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-100/40"
                    : "bg-emerald-50/20 border-emerald-200 hover:border-emerald-400"
                }`}
                title="Click to filter Completed pages"
              >
                <div className="flex justify-between items-center text-emerald-600 mb-1">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase">Completed</span>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-bold text-emerald-900">{dashStats.completedPages}</h3>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1">Click to filter</p>
              </div>

              {/* Card 3: In Progress */}
              <div
                onClick={() => {
                  setDashStatusFilter("In Progress")
                  setDashActivityType("ALL")
                }}
                className={`p-3.5 rounded-xl border shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${
                  dashStatusFilter === "In Progress"
                    ? "border-blue-600 ring-2 ring-blue-500/30 bg-blue-100/40"
                    : "bg-blue-50/20 border-blue-200 hover:border-blue-400"
                }`}
                title="Click to filter In-Progress pages"
              >
                <div className="flex justify-between items-center text-blue-600 mb-1">
                  <span className="text-[11px] font-bold text-blue-800 uppercase">In Progress</span>
                  <Clock className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-bold text-blue-900">{dashStats.inProgressPages}</h3>
                <p className="text-[10px] text-blue-600 font-semibold mt-1">Click to filter</p>
              </div>

              {/* Card 4: Pending */}
              <div
                onClick={() => {
                  setDashStatusFilter("Pending")
                  setDashActivityType("ALL")
                }}
                className={`p-3.5 rounded-xl border shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${
                  dashStatusFilter === "Pending"
                    ? "border-amber-600 ring-2 ring-amber-500/30 bg-amber-100/40"
                    : "bg-amber-50/20 border-amber-200 hover:border-amber-400"
                }`}
                title="Click to filter Pending pages"
              >
                <div className="flex justify-between items-center text-amber-600 mb-1">
                  <span className="text-[11px] font-bold text-amber-800 uppercase">Pending</span>
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-bold text-amber-900">{dashStats.pendingPages}</h3>
                <p className="text-[10px] text-amber-600 font-semibold mt-1">Click to filter</p>
              </div>

              {/* Card 5: No Activity */}
              <div
                onClick={() => {
                  setDashStatusFilter("No Activity")
                  setDashActivityType("NO_ACTIVITY")
                }}
                className={`p-3.5 rounded-xl border shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${
                  dashStatusFilter === "No Activity" || dashActivityType === "NO_ACTIVITY"
                    ? "border-rose-600 ring-2 ring-rose-500/30 bg-rose-100/40"
                    : "bg-rose-50/20 border-rose-200 hover:border-rose-400"
                }`}
                title="Click to filter No Activity pages"
              >
                <div className="flex justify-between items-center text-rose-600 mb-1">
                  <span className="text-[11px] font-bold text-rose-800 uppercase">No Activity</span>
                  <X className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-bold text-rose-900">{dashStats.noActivityPages}</h3>
                <p className="text-[10px] text-rose-600 font-semibold mt-1">Click to filter</p>
              </div>

              {/* Card 6: Total Actions */}
              <div
                onClick={() => {
                  setDashStatusFilter("ALL")
                  setDashActivityType("ALL")
                }}
                className="bg-white p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md hover:border-indigo-400"
                title="Click to view all logged actions"
              >
                <div className="flex justify-between items-center text-indigo-600 mb-1">
                  <span className="text-[11px] font-bold text-indigo-800 uppercase">Total Actions</span>
                  <Activity className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-bold text-indigo-900">{dashStats.totalActivities}</h3>
                <p className="text-[10px] text-indigo-600 font-semibold mt-1">Click to view all</p>
              </div>

              {/* Card 7: Recent Active */}
              <div
                onClick={() => {
                  setDashActivityType("RECENT")
                  setDashStatusFilter("ALL")
                }}
                className={`p-3.5 rounded-xl border shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${
                  dashActivityType === "RECENT"
                    ? "border-purple-600 ring-2 ring-purple-500/30 bg-purple-100/40"
                    : "bg-purple-50/20 border-purple-200 hover:border-purple-400"
                }`}
                title="Click to filter Recent Active pages (7D)"
              >
                <div className="flex justify-between items-center text-purple-600 mb-1">
                  <span className="text-[11px] font-bold text-purple-800 uppercase">Recent Active</span>
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-bold text-purple-900">{dashStats.recentActivitiesCount}</h3>
                <p className="text-[10px] text-purple-600 font-semibold mt-1">Click to filter (7D)</p>
              </div>
            </div>

            {/* Powerful Filter Controls Bar */}
            <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-xs space-y-3">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                  Dashboard Filter Controls
                </h3>
                {(dashSearchTerm || dashPageFilter !== "ALL" || dashStatusFilter !== "ALL" || dashUserFilter !== "ALL" || dashDateFilter !== "ALL" || dashActivityType !== "ALL") && (
                  <button
                    onClick={() => {
                      setDashSearchTerm("")
                      setDashPageFilter("ALL")
                      setDashStatusFilter("ALL")
                      setDashUserFilter("ALL")
                      setDashDateFilter("ALL")
                      setDashActivityType("ALL")
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                {/* Search Bar */}
                <div className="relative col-span-1 sm:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={15} />
                  <input
                    type="text"
                    placeholder="Search Page, Category, User..."
                    value={dashSearchTerm}
                    onChange={(e) => setDashSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-1.5 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white w-full"
                  />
                </div>

                {/* Page-wise Filter */}
                <div>
                  <select
                    value={dashPageFilter}
                    onChange={(e) => setDashPageFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-full"
                  >
                    <option value="ALL">All Pages / Modules</option>
                    {MASTER_SYSTEM_PAGES.map((p) => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status-wise Filter */}
                <div>
                  <select
                    value={dashStatusFilter}
                    onChange={(e) => setDashStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-full"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Completed">Completed Only</option>
                    <option value="In Progress">In Progress Only</option>
                    <option value="Pending">Pending Only</option>
                    <option value="No Activity">No Activity Only</option>
                  </select>
                </div>

                {/* Date-wise Filter */}
                <div>
                  <select
                    value={dashDateFilter}
                    onChange={(e) => setDashDateFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-full"
                  >
                    <option value="ALL">All Time</option>
                    <option value="TODAY">Updated Today</option>
                    <option value="WEEK">Updated This Week (7D)</option>
                    <option value="MONTH">Updated This Month</option>
                  </select>
                </div>

                {/* Activity Filter */}
                <div>
                  <select
                    value={dashActivityType}
                    onChange={(e) => setDashActivityType(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-full"
                  >
                    <option value="ALL">All Activities</option>
                    <option value="RECENT">Recent Activity (7D)</option>
                    <option value="NO_ACTIVITY">No Activity Pages</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Main Page-wise Activity & Access Table */}
            <div className="rounded-xl border border-indigo-100 shadow-sm bg-white overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b border-indigo-100 flex justify-between items-center">
                <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center">
                  <Layers className="h-4 w-4 mr-2 text-indigo-600" />
                  Page-wise Activity & Access Table
                </h3>
                <span className="text-xs font-medium text-indigo-700">
                  Showing <strong className="text-indigo-900">{filteredPageMetrics.length}</strong> of {dashStats.totalPages} Modules
                </span>
              </div>

              {loading ? (
                <div className="text-center py-16">
                  <Loader2 className="inline-block animate-spin h-8 w-8 text-indigo-600 mb-3" />
                  <p className="text-indigo-600 text-sm font-medium">Computing page activities & permissions...</p>
                </div>
              ) : (
                <div className="overflow-auto" style={{ maxHeight: "60vh" }}>
                  <table className="min-w-full divide-y divide-gray-200 text-left">
                    <thead className="bg-gray-50 sticky top-0 z-10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5">Page Name</th>
                        <th className="px-4 py-3.5">Category</th>
                        <th className="px-4 py-3.5 text-center">Status</th>
                        <th className="px-4 py-3.5 text-center">Total Work</th>
                        <th className="px-4 py-3.5 text-center">Completed</th>
                        <th className="px-4 py-3.5 text-center">Pending</th>
                        <th className="px-4 py-3.5 text-center">In Progress</th>
                        <th className="px-4 py-3.5">Last Activity</th>
                        <th className="px-4 py-3.5">Last Updated By</th>
                        <th className="px-4 py-3.5">Access / Permissions</th>
                        <th className="px-4 py-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 text-xs text-gray-700">
                      {filteredPageMetrics.length > 0 ? (
                        filteredPageMetrics.map((p) => {
                          let badgeBg = "bg-gray-100 text-gray-700"
                          if (p.status === "Completed") badgeBg = "bg-emerald-100 text-emerald-800"
                          else if (p.status === "In Progress") badgeBg = "bg-blue-100 text-blue-800"
                          else if (p.status === "Pending") badgeBg = "bg-amber-100 text-amber-800"
                          else if (p.status === "No Activity") badgeBg = "bg-rose-50 text-rose-700"

                          return (
                            <tr key={p.name} className="hover:bg-indigo-50/20 transition-colors">
                              <td className="px-4 py-3 font-bold text-indigo-950">
                                <div className="flex items-center">
                                  <Layers className="h-3.5 w-3.5 mr-2 text-indigo-500 shrink-0" />
                                  <span>{p.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-500">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]">
                                  {p.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeBg}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-gray-900">{p.totalWork}</td>
                              <td className="px-4 py-3 text-center font-bold text-emerald-600">{p.completed}</td>
                              <td className="px-4 py-3 text-center font-bold text-amber-600">{p.pending}</td>
                              <td className="px-4 py-3 text-center font-bold text-blue-600">{p.inProgress}</td>
                              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                {p.lastActivityDate ? formatDateTime(p.lastActivityDate) : "—"}
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-800">
                                <div className="flex items-center">
                                  <User className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                  <span>{p.lastUpdatedBy}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                  <span className="font-semibold text-indigo-900">
                                    {p.usersWithAccess.length} Users
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => handleViewPageDetail(p)}
                                  className="inline-flex items-center px-2.5 py-1 border border-indigo-200 text-xs font-semibold rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  View Details
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan={11} className="py-12 text-center text-gray-400 font-medium">
                            No system pages match your applied filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Activity Timeline Stream */}
            <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-indigo-600" />
                  System Recent Activity Stream Log
                </h3>
                <span className="text-xs text-gray-500 font-medium">Latest System Updates</span>
              </div>

              <div className="space-y-3">
                {recentActivityStream.length > 0 ? (
                  recentActivityStream.map((act, i) => (
                    <div key={i} className="flex items-start justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 mt-0.5">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-950 text-xs">{act.pageName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                              {act.enquiryNumber}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {act.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 font-medium mt-1">{act.action}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{act.details}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-gray-800 block">{act.user}</span>
                        <span className="text-[10px] text-gray-400">{formatDateTime(act.timestamp)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">No recent activity logs recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CUSTOMER LEADS & ENQUIRIES LIST (EXISTING LOGIC) */}
        {/* ========================================================================= */}
        {activeTab === "leads" && (
          <div className="space-y-6">
            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => {
                  setSearchTerm("")
                  setDistrictFilter("ALL")
                  setSystemFilter("ALL")
                }}
                className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs flex items-center space-x-3 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                title="Click to view all customer leads"
              >
                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Leads</p>
                  <h4 className="text-xl font-bold text-gray-900">{leadData.length}</h4>
                  <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Click to show all</p>
                </div>
              </div>

              <div
                onClick={() => setSearchTerm("")}
                className="bg-white p-4 rounded-xl border border-indigo-100 shadow-xs flex items-center space-x-3 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all"
                title="Click to clear text search"
              >
                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                  <Filter className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Filtered Leads</p>
                  <h4 className="text-xl font-bold text-gray-900">{filteredLeads.length}</h4>
                  <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Matching Search</p>
                </div>
              </div>

              <div
                onClick={() => setDistrictFilter("ALL")}
                className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs flex items-center space-x-3 cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all"
                title="Click to view all districts"
              >
                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Districts Covered</p>
                  <h4 className="text-xl font-bold text-gray-900">{uniqueDistricts.length - 1}</h4>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Click to show all</p>
                </div>
              </div>

              <div
                onClick={() => setSystemFilter("ALL")}
                className="bg-white p-4 rounded-xl border border-purple-100 shadow-xs flex items-center space-x-3 cursor-pointer hover:border-purple-400 hover:shadow-md transition-all"
                title="Click to view all system types"
              >
                <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">System Types</p>
                  <h4 className="text-xl font-bold text-gray-900">{uniqueSystemTypes.length - 1}</h4>
                  <p className="text-[10px] text-purple-600 font-semibold mt-0.5">Click to show all</p>
                </div>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs flex flex-wrap gap-4 items-center justify-between">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by Enquiry No, Name, Contact, Address, District..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white w-full"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center space-x-1.5">
                  <label className="text-xs font-medium text-gray-600">District:</label>
                  <select
                    value={districtFilter}
                    onChange={(e) => setDistrictFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {uniqueDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d === "ALL" ? "All Districts" : d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-1.5">
                  <label className="text-xs font-medium text-gray-600">System:</label>
                  <select
                    value={systemFilter}
                    onChange={(e) => setSystemFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {uniqueSystemTypes.map((s) => (
                      <option key={s} value={s}>
                        {s === "ALL" ? "All Systems" : s}
                      </option>
                    ))}
                  </select>
                </div>

                {(searchTerm || districtFilter !== "ALL" || systemFilter !== "ALL") && (
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setDistrictFilter("ALL")
                      setSystemFilter("ALL")
                    }}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold underline ml-2"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Main Leads Table */}
            <div className="rounded-xl border border-blue-100 shadow-sm bg-white overflow-hidden">
              {loading ? (
                <div className="text-center py-16">
                  <Loader2 className="inline-block animate-spin h-8 w-8 text-blue-600 mb-3" />
                  <p className="text-blue-600 text-sm font-medium">Fetching lead records...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 p-6 rounded-md text-red-800 text-center text-sm border border-red-100">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p>{error}</p>
                  <button className="underline mt-2 font-medium text-red-600 hover:text-red-800" onClick={fetchAllData}>
                    Retry Loading
                  </button>
                </div>
              ) : (
                <div className="overflow-auto" style={{ maxHeight: "68vh" }}>
                  <table className="min-w-full divide-y divide-gray-200 text-left">
                    <thead className="bg-gray-50 sticky top-0 z-10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5 w-20">Action</th>
                        <th className="px-4 py-3.5">Enquiry No</th>
                        <th className="px-4 py-3.5">Date / Time</th>
                        <th className="px-4 py-3.5">Beneficiary Name</th>
                        <th className="px-4 py-3.5">Contact No</th>
                        <th className="px-4 py-3.5">Address</th>
                        <th className="px-4 py-3.5">Village / Block</th>
                        <th className="px-4 py-3.5">District</th>
                        <th className="px-4 py-3.5">Present Load</th>
                        <th className="px-4 py-3.5">System Type</th>
                        <th className="px-4 py-3.5">Roof / Structure</th>
                        <th className="px-4 py-3.5">Payment Type</th>
                        <th className="px-4 py-3.5">Firm / Vendor</th>
                        <th className="px-4 py-3.5">Assigned By</th>
                        <th className="px-4 py-3.5">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 text-xs text-gray-700">
                      {filteredLeads.length > 0 ? (
                        filteredLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleViewLead(lead)}
                                className="inline-flex items-center px-2.5 py-1 border border-blue-200 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                                title="View Lead Details"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View
                              </button>
                            </td>
                            <td className="px-4 py-3 font-semibold text-blue-900">{lead.enquiryNumber}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatDateTime(lead.timestamp)}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">
                              <div className="flex items-center">
                                <User className="h-3.5 w-3.5 mr-1.5 text-gray-400 shrink-0" />
                                <span>{lead.beneficiaryName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono">
                              <div className="flex items-center">
                                <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400 shrink-0" />
                                <span>{lead.contactNumber}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 max-w-xs truncate" title={lead.address}>
                              <div className="flex items-center">
                                <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400 shrink-0" />
                                <span className="truncate">{lead.address}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">{lead.villageBlock}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">{lead.district}</td>
                            <td className="px-4 py-3">{lead.presentLoad}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                                {lead.systemType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {lead.roofType} / {lead.structureType}
                            </td>
                            <td className="px-4 py-3 font-medium text-emerald-700">{lead.paymentType}</td>
                            <td className="px-4 py-3">{lead.firmName}</td>
                            <td className="px-4 py-3">{lead.assignedBy}</td>
                            <td className="px-4 py-3">{lead.reference}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={15} className="py-12 text-center text-gray-400 font-medium">
                            No lead records match your query.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= MODAL 1: PAGE DETAIL & HISTORY TIMELINE MODAL ================= */}
        {showDashDetailModal && selectedDashboardPage && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="font-bold text-base flex items-center">
                    <Layers className="h-5 w-5 mr-2" />
                    Module Details & Activity Log: {selectedDashboardPage.name}
                  </h3>
                  <p className="text-xs text-indigo-100 mt-0.5">
                    Category: {selectedDashboardPage.category} | Overall Status: {selectedDashboardPage.status}
                  </p>
                </div>
                <button
                  onClick={() => setShowDashDetailModal(false)}
                  className="rounded-full p-1.5 bg-white/10 hover:bg-white/20 transition-all text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto text-xs text-gray-700">
                {/* 1. Page Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-gray-500 font-medium block">Total Tasks / Work</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedDashboardPage.totalWork}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 font-medium block">Completed</span>
                    <span className="font-bold text-emerald-700 text-sm">{selectedDashboardPage.completed}</span>
                  </div>
                  <div>
                    <span className="text-amber-700 font-medium block">Pending</span>
                    <span className="font-bold text-amber-700 text-sm">{selectedDashboardPage.pending}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium block">In Progress</span>
                    <span className="font-bold text-blue-700 text-sm">{selectedDashboardPage.inProgress}</span>
                  </div>
                  <div>
                    <span className="text-purple-700 font-medium block">Total Actions</span>
                    <span className="font-bold text-purple-700 text-sm">{selectedDashboardPage.activityCount}</span>
                  </div>
                </div>

                {/* 2. User Permissions for this Page */}
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-2">
                  <h4 className="font-bold text-indigo-900 uppercase text-[11px] tracking-wider flex items-center">
                    <ShieldCheck className="h-4 w-4 mr-1.5 text-indigo-600" />
                    Authorized Users & Role Access List ({selectedDashboardPage.usersWithAccess.length})
                  </h4>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedDashboardPage.usersWithAccess.length > 0 ? (
                      selectedDashboardPage.usersWithAccess.map((u) => (
                        <span key={u.id} className="px-2.5 py-1 rounded-md bg-white border border-indigo-200 text-indigo-900 font-semibold text-xs shadow-2xs flex items-center">
                          <UserCheck className="h-3 w-3 mr-1 text-indigo-600" />
                          {u.name || u.username} ({u.role})
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 italic">No explicit user access configured.</span>
                    )}
                  </div>
                </div>

                {/* 3. Task & Work History Timeline */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 uppercase text-[11px] tracking-wider flex items-center">
                    <Activity className="h-4 w-4 mr-1.5 text-indigo-600" />
                    Task History & Activity Timeline ({selectedDashboardPage.taskTimeline.length})
                  </h4>

                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {selectedDashboardPage.taskTimeline.length > 0 ? (
                      selectedDashboardPage.taskTimeline.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-gray-200 bg-white hover:border-indigo-200 transition-colors flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-indigo-900 text-xs">{item.enquiryNumber}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === "Completed" ? "bg-emerald-100 text-emerald-800" :
                                item.status === "In Progress" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-800 font-medium mt-1">{item.action}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{item.details}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-semibold text-gray-800 block">{item.user}</span>
                            <span className="text-[10px] text-gray-400">{formatDateTime(item.timestamp)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-gray-400 font-medium">
                        No activity records logged for this page module yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3.5 flex justify-between items-center border-t border-gray-200">
                <span className="text-xs text-gray-500 font-medium">
                  Last Updated: {selectedDashboardPage.lastActivityDate ? formatDateTime(selectedDashboardPage.lastActivityDate) : "—"} by {selectedDashboardPage.lastUpdatedBy}
                </span>
                <button
                  onClick={() => setShowDashDetailModal(false)}
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL 2: CUSTOMER LEAD DETAIL MODAL (EXISTING) ================= */}
        {showDetailModal && selectedLead && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-100 transform transition-all">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="font-bold text-base flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Lead Details — {selectedLead.enquiryNumber}
                  </h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Customer: {selectedLead.beneficiaryName} | Created: {formatDateTime(selectedLead.timestamp)}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="rounded-full p-1.5 bg-white/10 hover:bg-white/20 transition-all text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-gray-700">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                  <h4 className="font-bold text-blue-900 uppercase text-[11px] tracking-wider flex items-center">
                    <User className="h-4 w-4 mr-1.5 text-blue-600" />
                    Customer & Location Info
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <span className="text-gray-500 font-medium block">Beneficiary Name</span>
                      <span className="font-bold text-gray-900 text-sm">{selectedLead.beneficiaryName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Contact Number</span>
                      <span className="font-semibold text-gray-800">{selectedLead.contactNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Beneficiary Number</span>
                      <span className="font-semibold text-gray-800">{selectedLead.beneficiaryNumber}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 font-medium block">Address</span>
                      <span className="font-medium text-gray-800">{selectedLead.address}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Village / Block</span>
                      <span className="font-medium text-gray-800">{selectedLead.villageBlock}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">District</span>
                      <span className="font-bold text-blue-700">{selectedLead.district}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 space-y-3">
                  <h4 className="font-bold text-purple-900 uppercase text-[11px] tracking-wider flex items-center">
                    <Zap className="h-4 w-4 mr-1.5 text-purple-600" />
                    Load & Technical Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <span className="text-gray-500 font-medium block">Present Load</span>
                      <span className="font-semibold text-gray-800">{selectedLead.presentLoad}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">BP Number</span>
                      <span className="font-mono text-gray-800">{selectedLead.bpNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">CSPDCL Contract Demand</span>
                      <span className="font-semibold text-gray-800">{selectedLead.cspdclContractDemand}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Future Load Requirement</span>
                      <span className="font-semibold text-gray-800">{selectedLead.futureLoadRequirement}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">System Type</span>
                      <span className="font-bold text-purple-700">{selectedLead.systemType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Need Type</span>
                      <span className="font-semibold text-gray-800">{selectedLead.needType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Roof Type</span>
                      <span className="font-semibold text-gray-800">{selectedLead.roofType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Structure Type</span>
                      <span className="font-semibold text-gray-800">{selectedLead.structureType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Project Mode</span>
                      <span className="font-semibold text-gray-800">{selectedLead.projectMode}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-3">
                  <h4 className="font-bold text-emerald-900 uppercase text-[11px] tracking-wider flex items-center">
                    <Building2 className="h-4 w-4 mr-1.5 text-emerald-600" />
                    Vendor & Payment Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <span className="text-gray-500 font-medium block">Payment Type</span>
                      <span className="font-bold text-emerald-700">{selectedLead.paymentType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Firm / Vendor Name</span>
                      <span className="font-semibold text-gray-800">{selectedLead.firmName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Assigned By</span>
                      <span className="font-semibold text-gray-800">{selectedLead.assignedBy}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Reference</span>
                      <span className="font-semibold text-gray-800">{selectedLead.reference}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Electricity Bill Doc</span>
                      {selectedLead.avgElectricityBill ? (
                        <a
                          href={selectedLead.avgElectricityBill}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-bold underline inline-flex items-center mt-0.5"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View Document
                        </a>
                      ) : (
                        <span className="text-gray-400">Not Uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-3.5 flex justify-end border-t border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

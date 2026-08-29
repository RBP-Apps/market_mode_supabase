"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Search,
  RefreshCw,
  Eye,
  FileText,
  User,
  X,
  Loader2,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Layers,
  TrendingUp,
  UserCheck,
  ArrowDown
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Data Sources
  const [leadData, setLeadData] = useState([])
  const [systemUsers, setSystemUsers] = useState([])
  const [fmsRecords, setFmsRecords] = useState([])
  const [paymentRecords, setPaymentRecords] = useState([])
  const [assignSurveyEstData, setAssignSurveyEstData] = useState([])
  const [assignSurveyActData, setAssignSurveyActData] = useState([])
  const [newQuotationData, setNewQuotationData] = useState([])
  const [newNewQuotationData, setNewNewQuotationData] = useState([])
  const [quotation10kwData, setQuotation10kwData] = useState([])
  const [siteSurveysData, setSiteSurveysData] = useState([])
  const [ipAssignmentsData, setIpAssignmentsData] = useState([])
  const [salesCallsData, setSalesCallsData] = useState([])
  const [documentsUploadsData, setDocumentsUploadsData] = useState([])
  const [registrationData, setRegistrationData] = useState([])
  const [paymentConfirmationsData, setPaymentConfirmationsData] = useState([])
  const [dispatchPlannerData, setDispatchPlannerData] = useState([])
  const [dispatchMaterialData, setDispatchMaterialData] = useState([])
  const [installationData, setInstallationData] = useState([])
  const [qcData, setQcData] = useState([])
  const [inspectionsData, setInspectionsData] = useState([])
  const [subsidyDisbursalsData, setSubsidyDisbursalsData] = useState([])
  const [subsidyRedemptionsData, setSubsidyRedemptionsData] = useState([])
  const [projectInsuranceData, setProjectInsuranceData] = useState([])

  // Dashboard Filters State
  const [dashSearchTerm, setDashSearchTerm] = useState("")
  const [dashPageFilter, setDashPageFilter] = useState("ALL")
  const [dashStatusFilter, setDashStatusFilter] = useState("ALL")
  const [dashUserFilter, setDashUserFilter] = useState("ALL")
  const [dashDateFilter, setDashDateFilter] = useState("ALL")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [selectedDashboardPage, setSelectedDashboardPage] = useState(null)
  const [showDashDetailModal, setShowDashDetailModal] = useState(false)

  // PDF Preview State
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("")
  const [pdfDocInstance, setPdfDocInstance] = useState(null)

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

  // Fetch all data for dashboard from Ankit.sql tables
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        { data: enqData },
        { data: fData },
        { data: pData },
        { data: userData },
        { data: estSurveyData },
        { data: actSurveyData },
        { data: nQuotData },
        { data: nnQuotData },
        { data: q10Data },
        { data: siteSurvData },
        { data: ipData },
        { data: salesData },
        { data: docsData },
        { data: regData },
        { data: payConfData },
        { data: dpData },
        { data: dmData },
        { data: instData },
        { data: qcD },
        { data: inspectData },
        { data: subDisbData },
        { data: subRedData },
        { data: insData }
      ] = await Promise.all([
        supabase.from("enquiries").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("fms").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("payments").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("login").select("id, username, name, role, page, department").then(r => r).catch(() => ({ data: [] })),
        supabase.from("assign_survey").select("*, enquiries:enquiry_id(*)").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("assign_survey_actual").select("*, enquiries:enquiry_id(*)").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("new_quatation_create").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("new_new_quatation_create").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("quatation_10kw").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("site_surveys").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("ip_assignments").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("sales_calls").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("documents_uploads").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("registration").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("payment_confirmations").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("dispatch_planner").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("dispatch_materials").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("installations").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("qc").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("inspections").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("subsidy_disbursals").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("subsidy_redemptions").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] })),
        supabase.from("project_insurance").select("*").order("id", { ascending: false }).then(r => r).catch(() => ({ data: [] }))
      ])

      const mappedLeads = (enqData || []).map((row) => ({
        id: row.id,
        enquiryNumber: row.enquiry_number || `EN-${row.id}`,
        timestamp: row.timestamp,
        beneficiaryName: row.beneficiary_name || "—",
        district: row.district || "—",
        systemType: row.system_type || "—",
        assignedBy: row.assigned_by || "—"
      }))

      setLeadData(mappedLeads)
      setFmsRecords(fData || [])
      setPaymentRecords(pData || [])
      setSystemUsers(userData || [])
      setAssignSurveyEstData(estSurveyData || [])
      setAssignSurveyActData(actSurveyData || [])
      setNewQuotationData(nQuotData || [])
      setNewNewQuotationData(nnQuotData || [])
      setQuotation10kwData(q10Data || [])
      setSiteSurveysData(siteSurvData || [])
      setIpAssignmentsData(ipData || [])
      setSalesCallsData(salesData || [])
      setDocumentsUploadsData(docsData || [])
      setRegistrationData(regData || [])
      setPaymentConfirmationsData(payConfData || [])
      setDispatchPlannerData(dpData || [])
      setDispatchMaterialData(dmData || [])
      setInstallationData(instData || [])
      setQcData(qcD || [])
      setInspectionsData(inspectData || [])
      setSubsidyDisbursalsData(subDisbData || [])
      setSubsidyRedemptionsData(subRedData || [])
      setProjectInsuranceData(insData || [])

    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Computed Page-wise Dashboard Metrics
  const pageMetricsList = useMemo(() => {
    // Prerequisite stage completion sets to ensure accurate stage-wise pending counts
    const completedPaymentsEnqs = new Set(
      (paymentRecords || [])
        .filter((p) => p.actual != null || p.status === "Paid" || p.status === "Completed")
        .map((p) => String(p.enquiry_number || "").trim())
    )
    const completedDocsEnqs = new Set(
      (documentsUploadsData || [])
        .filter((r) => r.planned != null && r.actual != null)
        .map((r) => String(r.enquiry_number || "").trim())
    )
    const completedRegEnqs = new Set(
      (registrationData || [])
        .filter((r) => r.planned != null && r.actual != null)
        .map((r) => String(r.enquiry_number || "").trim())
    )
    const completedPayConfEnqs = new Set(
      (paymentConfirmationsData || [])
        .filter((r) => r.planned != null && r.actual != null)
        .map((r) => String(r.enquiry_number || "").trim())
    )
    const completedDispatchPlannerEnqs = new Set(
      (dispatchPlannerData || [])
        .filter((r) => r.planned != null && r.actual != null)
        .map((r) => String(r.enquiry_number || "").trim())
    )
    const completedDispatchMaterialEnqs = new Set(
      (dispatchMaterialData || [])
        .filter((r) => r.planned != null && r.actual != null)
        .map((r) => String(r.enquiry_number || "").trim())
    )
    const completedInstallationEnqs = new Set(
      (installationData || [])
        .filter((r) => r.planned != null && r.actual != null)
        .map((r) => String(r.enquiry_number || "").trim())
    )
    const completedQcEnqs = new Set(
      (qcData || [])
        .filter((r) => r.planned != null && r.actual != null)
        .map((r) => String(r.enquiry_number || "").trim())
    )

    const processStageTable = (sourceData, fmsIndex, defaultUserRole, prereqSet = null) => {
      let pendingRows = []
      let historyRows = []

      if (sourceData && sourceData.length > 0) {
        pendingRows = sourceData.filter(r => {
          if (!r.actual && (r.planned || r.created_at || r.id)) {
            if (prereqSet) {
              const enqKey = String(r.enquiry_number || "").trim()
              return prereqSet.has(enqKey)
            }
            return true
          }
          return false
        })
        historyRows = sourceData.filter(r => Boolean(r.actual))
      } else if (fmsIndex > 0 && fmsRecords.length > 0) {
        fmsRecords.forEach(fms => {
          const enqKey = String(fms.enquiry_number || "").trim()
          if (fms[`planned_${fmsIndex}`] && !fms[`actual_${fmsIndex}`]) {
            if (!prereqSet || prereqSet.has(enqKey)) {
              pendingRows.push(fms)
            }
          } else if (fms[`actual_${fmsIndex}`]) {
            historyRows.push(fms)
          }
        })
      }

      const pendingCount = pendingRows.length
      const completedCount = historyRows.length
      const totalWorkCount = pendingCount + completedCount
      const activityCountVal = totalWorkCount
      let lastActDate = null
      let lastUser = "—"
      const timeline = []

      pendingRows.forEach(r => {
        const enqNum = r.enquiry_number || `EN-${r.id}`
        const dt = r.planned || r.created_at || new Date().toISOString()
        if (!lastActDate || new Date(dt) > new Date(lastActDate)) {
          lastActDate = dt
          lastUser = r.assigned_by || r.ip_name || defaultUserRole
        }
        timeline.push({
          enquiryNumber: enqNum,
          user: r.assigned_by || r.ip_name || defaultUserRole,
          action: `[Pending] ${enqNum}`,
          status: "Pending",
          timestamp: dt,
          details: `Stage pending completion`
        })
      })

      historyRows.forEach(r => {
        const enqNum = r.enquiry_number || `EN-${r.id}`
        const dt = r.actual || r.created_at || new Date().toISOString()
        if (!lastActDate || new Date(dt) > new Date(lastActDate)) {
          lastActDate = dt
          lastUser = r.assigned_by || r.ip_name || defaultUserRole
        }
        timeline.push({
          enquiryNumber: enqNum,
          user: r.assigned_by || r.ip_name || defaultUserRole,
          action: `[Completed] ${enqNum}`,
          status: "Completed",
          timestamp: dt,
          details: `Stage processing completed`
        })
      })

      return { totalWork: totalWorkCount, completed: completedCount, pending: pendingCount, inProgress: 0, activityCount: activityCountVal, lastActivityDate: lastActDate, lastUpdatedBy: lastUser, taskTimeline: timeline }
    }

    return MASTER_SYSTEM_PAGES.map((pageObj) => {
      let totalWork = 0
      let completed = 0
      let pending = 0
      let inProgress = 0
      let activityCount = 0
      let lastActivityDate = null
      let lastUpdatedBy = "—"
      let subTabs = null
      let taskTimeline = []

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
      // 3. Process for "Assign Survey" (3 Tabs)
      else if (pageObj.name === "Assign Survey" || pageObj.name === "Assign Survey Management") {
        let tab1EstimatePending = assignSurveyEstData.filter(srv => (srv.planned_1 || srv.id) && !srv.actual_1)

        const actEnqIds = new Set(assignSurveyActData.map(a => a.enquiry_id).filter(Boolean))
        const pendingInActualTable = assignSurveyActData.filter(srv => !srv.actual_2)
        const completedEstNotYetInAct = assignSurveyEstData.filter(srv => srv.actual_1 && !srv.actual_2 && !actEnqIds.has(srv.enquiry_id))
        let tab2ActualPending = [...pendingInActualTable, ...completedEstNotYetInAct]

        const completedInAct = assignSurveyActData.filter(srv => Boolean(srv.actual_2))
        const completedActEnqIds = new Set(completedInAct.map(a => a.enquiry_id).filter(Boolean))
        const completedInEst = assignSurveyEstData.filter(srv => Boolean(srv.actual_2) && !completedActEnqIds.has(srv.enquiry_id))
        let tab3SurveyCompleted = [...completedInAct, ...completedInEst]

        if (assignSurveyEstData.length === 0 && assignSurveyActData.length === 0 && fmsRecords.length > 0) {
          fmsRecords.forEach((fms) => {
            if (fms.planned_2 && !fms.actual_2) {
              tab1EstimatePending.push(fms)
            } else if (fms.actual_2) {
              tab3SurveyCompleted.push(fms)
            }
          })
        }

        const tab1Count = tab1EstimatePending.length
        const tab2Count = tab2ActualPending.length
        const tab3Count = tab3SurveyCompleted.length

        totalWork = tab1Count + tab2Count + tab3Count
        completed = tab3Count
        pending = tab1Count
        inProgress = tab2Count
        activityCount = totalWork

        tab1EstimatePending.forEach((srv) => {
          const enqNum = srv.enquiries?.enquiry_number || srv.enquiry_number || `EN-${srv.enquiry_id || srv.id}`
          const dt = srv.planned_1 || srv.created_at || new Date().toISOString()
          if (!lastActivityDate || new Date(dt) > new Date(lastActivityDate)) {
            lastActivityDate = dt
            lastUpdatedBy = srv.assigned_by || srv.surveyor_name || "Staff"
          }
          taskTimeline.push({
            enquiryNumber: enqNum,
            user: srv.surveyor_name || srv.assigned_by || "System",
            action: `[Tab 1: Estimate Pending] ${enqNum}`,
            status: "Pending",
            timestamp: dt,
            details: `Beneficiary: ${srv.enquiries?.beneficiary_name || "—"}, System: ${srv.enquiries?.system_type || "—"}`
          })
        })

        tab2ActualPending.forEach((srv) => {
          const enqNum = srv.enquiries?.enquiry_number || srv.enquiry_number || `EN-${srv.enquiry_id || srv.id}`
          const dt = srv.planned_2 || srv.actual_1 || srv.created_at || new Date().toISOString()
          if (!lastActivityDate || new Date(dt) > new Date(lastActivityDate)) {
            lastActivityDate = dt
            lastUpdatedBy = srv.surveyor_name || "Staff"
          }
          taskTimeline.push({
            enquiryNumber: enqNum,
            user: srv.surveyor_name || "System",
            action: `[Tab 2: Actual Pending] ${enqNum}`,
            status: "In Progress",
            timestamp: dt,
            details: `Beneficiary: ${srv.enquiries?.beneficiary_name || "—"}, System: ${srv.enquiries?.system_type || "—"}`
          })
        })

        tab3SurveyCompleted.forEach((srv) => {
          const enqNum = srv.enquiries?.enquiry_number || srv.enquiry_number || `EN-${srv.enquiry_id || srv.id}`
          const dt = srv.actual_2 || srv.created_at || new Date().toISOString()
          if (!lastActivityDate || new Date(dt) > new Date(lastActivityDate)) {
            lastActivityDate = dt
            lastUpdatedBy = srv.surveyor_name || "Staff"
          }
          taskTimeline.push({
            enquiryNumber: enqNum,
            user: srv.surveyor_name || "System",
            action: `[Tab 3: Survey Completed] ${enqNum}`,
            status: "Completed",
            timestamp: dt,
            details: `Completed Report generated for ${srv.enquiries?.beneficiary_name || "—"}`
          })
        })

        subTabs = [
          { name: "Tab 1 (Estimate Pending)", count: tab1Count, color: "bg-amber-100 text-amber-900 border-amber-300" },
          { name: "Tab 2 (Actual Pending)", count: tab2Count, color: "bg-blue-100 text-blue-900 border-blue-300" },
          { name: "Tab 3 (Survey Completed)", count: tab3Count, color: "bg-emerald-100 text-emerald-900 border-emerald-300" }
        ]
      }
      // 4. Process for "Quotation Create" (4 Tabs)
      else if (pageObj.name === "Quotation Create" || pageObj.name === "Quotation Creation") {
        const quotationRows = newQuotationData || []

        let tab1Pending = quotationRows.filter(item => item.planned != null && !item.actual)
        let tab2BomApproval = quotationRows.filter(item => item.planned != null && item.actual != null && item.status === "Pending")
        let tab3DirectorApproval = quotationRows.filter(item => item.planned != null && item.actual != null && (item.director_approval || item.directorApproval) !== "Done")
        let tab4History = quotationRows.filter(item => item.planned != null && item.actual != null && item.status !== "Pending")

        if (quotationRows.length === 0 && fmsRecords.length > 0) {
          fmsRecords.forEach((fms) => {
            if (fms.planned_4 && !fms.actual_4) {
              tab1Pending.push(fms)
            } else if (fms.actual_4) {
              tab4History.push(fms)
            }
          })
        }

        const tab1Count = tab1Pending.length
        const tab2Count = tab2BomApproval.length
        const tab3Count = tab3DirectorApproval.length
        const tab4Count = tab4History.length

        completed = tab4Count
        pending = tab1Count
        inProgress = tab2Count + tab3Count
        totalWork = completed + pending
        activityCount = totalWork

        tab1Pending.forEach((q) => {
          const enqNum = q.enquiry_number || `EN-${q.id}`
          const dt = q.planned || q.created_at || new Date().toISOString()
          if (!lastActivityDate || new Date(dt) > new Date(lastActivityDate)) {
            lastActivityDate = dt
            lastUpdatedBy = q.salesperson || "Sales Staff"
          }
          taskTimeline.push({
            enquiryNumber: enqNum,
            user: q.salesperson || "Sales Staff",
            action: `[Pending] ${enqNum}`,
            status: "Pending",
            timestamp: dt,
            details: `Awaiting Quotation Generation`
          })
        })

        tab2BomApproval.forEach((q) => {
          const enqNum = q.enquiry_number || `EN-${q.id}`
          const dt = q.updated_at || q.created_at || new Date().toISOString()
          if (!lastActivityDate || new Date(dt) > new Date(lastActivityDate)) {
            lastActivityDate = dt
            lastUpdatedBy = q.salesperson || "Sales Staff"
          }
          taskTimeline.push({
            enquiryNumber: enqNum,
            user: q.salesperson || "Sales Staff",
            action: `[BOM Approval] ${enqNum}`,
            status: "In Progress",
            timestamp: dt,
            details: `Pending BOM Approval`
          })
        })

        tab3DirectorApproval.forEach((q) => {
          const enqNum = q.enquiry_number || `EN-${q.id}`
          const dt = q.updated_at || q.created_at || new Date().toISOString()
          if (!lastActivityDate || new Date(dt) > new Date(lastActivityDate)) {
            lastActivityDate = dt
            lastUpdatedBy = q.salesperson || "Sales Staff"
          }
          taskTimeline.push({
            enquiryNumber: enqNum,
            user: q.salesperson || "Sales Staff",
            action: `[Director Approval] ${enqNum}`,
            status: "In Progress",
            timestamp: dt,
            details: `Pending Director Approval`
          })
        })

        tab4History.forEach((q) => {
          const enqNum = q.enquiry_number || `EN-${q.id}`
          const dt = q.actual || q.updated_at || q.created_at || new Date().toISOString()
          if (!lastActivityDate || new Date(dt) > new Date(lastActivityDate)) {
            lastActivityDate = dt
            lastUpdatedBy = q.salesperson || "Sales Staff"
          }
          taskTimeline.push({
            enquiryNumber: enqNum,
            user: q.salesperson || "Sales Staff",
            action: `[Approved History] ${enqNum}`,
            status: "Completed",
            timestamp: dt,
            details: `Quotation fully approved & final`
          })
        })

        subTabs = [
          { name: "Pending", count: tab1Count, color: "bg-amber-100 text-amber-900 border-amber-300" },
          { name: "BOM Approval", count: tab2Count, color: "bg-purple-100 text-purple-900 border-purple-300" },
          { name: "Director Approval", count: tab3Count, color: "bg-indigo-100 text-indigo-900 border-indigo-300" },
          { name: "History", count: tab4Count, color: "bg-emerald-100 text-emerald-900 border-emerald-300" }
        ]
      }
      // 5. Site Survey / IP Assignment
      else if (pageObj.name === "Site Survey" || pageObj.name === "IP Assignment" || pageObj.name === "Site Survey + IP Assignment") {
        const src = siteSurveysData.length > 0 ? siteSurveysData : ipAssignmentsData
        const res = processStageTable(src, 3, "Site Surveyor")
        totalWork = res.totalWork; completed = res.completed; pending = res.pending; inProgress = res.inProgress; activityCount = res.activityCount; lastActivityDate = res.lastActivityDate; lastUpdatedBy = res.lastUpdatedBy; taskTimeline = res.taskTimeline
      }
      // 6. Sales Call
      else if (pageObj.name === "Sales Call") {
        const res = processStageTable(salesCallsData, 5, "Sales Staff")
        totalWork = res.totalWork; completed = res.completed; pending = res.pending; inProgress = res.inProgress; activityCount = res.activityCount; lastActivityDate = res.lastActivityDate; lastUpdatedBy = res.lastUpdatedBy; taskTimeline = res.taskTimeline
      }
      // 7. Payment
      else if (pageObj.name === "Payment") {
        const res = processStageTable(paymentRecords, 6, "Accounts Staff")
        totalWork = res.totalWork; completed = res.completed; pending = res.pending; inProgress = res.inProgress; activityCount = res.activityCount; lastActivityDate = res.lastActivityDate; lastUpdatedBy = res.lastUpdatedBy; taskTimeline = res.taskTimeline
      }
      // 8. Documents Uploads
      else if (pageObj.name === "Documents Uploads") {
        const res = processStageTable(documentsUploadsData, 7, "Doc Staff", completedPaymentsEnqs)
        totalWork = res.totalWork; completed = res.completed; pending = res.pending; inProgress = res.inProgress; activityCount = res.activityCount; lastActivityDate = res.lastActivityDate; lastUpdatedBy = res.lastUpdatedBy; taskTimeline = res.taskTimeline
      }
      // 9. Registration
      else if (pageObj.name === "Registration") {
        const res = processStageTable(registrationData, 8, "Registration Staff", completedDocsEnqs)
        totalWork = res.totalWork; completed = res.completed; pending = res.pending; inProgress = res.inProgress; activityCount = res.activityCount; lastActivityDate = res.lastActivityDate; lastUpdatedBy = res.lastUpdatedBy; taskTimeline = res.taskTimeline
      }
      // 10. Payment Confirmation
      else if (pageObj.name === "Payment Confirmation") {
        const res = processStageTable(paymentConfirmationsData, 9, "Finance Staff", completedRegEnqs)
        totalWork = res.totalWork; completed = res.completed; pending = res.pending; inProgress = res.inProgress; activityCount = res.activityCount; lastActivityDate = res.lastActivityDate; lastUpdatedBy = res.lastUpdatedBy; taskTimeline = res.taskTimeline
      }
      // 11. Dispatch Planner
      else if (pageObj.name === "Dispatch Planner") {
        const res = processStageTable(dispatchPlannerData, 10, "Logistics Planner", completedPayConfEnqs)
        totalWork = res.totalWork; completed = res.completed; pending = res.pending; inProgress = res.inProgress; activityCount = res.activityCount; lastActivityDate = res.lastActivityDate; lastUpdatedBy = res.lastUpdatedBy; taskTimeline = res.taskTimeline
      }
      // 12. Dispatch Material
      else if (pageObj.name === "Dispatch Material") {
        const res = processStageTable(dispatchMaterialData, 11, "Dispatch Staff", completedDispatchPlannerEnqs)
        totalWork = res.totalWork; completed = res.completed; pending = res.pending; inProgress = res.inProgress; activityCount = res.activityCount; lastActivityDate = res.lastActivityDate; lastUpdatedBy = res.lastUpdatedBy; taskTimeline = res.taskTimeline
      }
      // 13. Installation
      else if (pageObj.name === "Installation") {
        const res = processStageTable(installationData, 12, "Installation Team", completedDispatchMaterialEnqs)
        totalWork = res.totalWork; completed = res.completed; pending = res.pending; inProgress = res.inProgress; activityCount = res.activityCount; lastActivityDate = res.lastActivityDate; lastUpdatedBy = res.lastUpdatedBy; taskTimeline = res.taskTimeline
      }
      // 14. QC
      else if (pageObj.name === "QC") {
        const res = processStageTable(qcData, 13, "QC Inspector", completedInstallationEnqs)
        totalWork = res.totalWork; completed = res.completed; pending = res.pending; inProgress = res.inProgress; activityCount = res.activityCount; lastActivityDate = res.lastActivityDate; lastUpdatedBy = res.lastUpdatedBy; taskTimeline = res.taskTimeline
      }
      // 15. CSPDL Inspection
      else if (pageObj.name === "CSPDL Inspection") {
        const res = processStageTable(inspectionsData, 14, "Inspector", completedQcEnqs)
        totalWork = res.totalWork; completed = res.completed; pending = res.pending; inProgress = res.inProgress; activityCount = res.activityCount; lastActivityDate = res.lastActivityDate; lastUpdatedBy = res.lastUpdatedBy; taskTimeline = res.taskTimeline
      }
      // 16. Subsidy Disbursal
      else if (pageObj.name === "Subsidy Disbursal") {
        const res = processStageTable(subsidyDisbursalsData, 17, "Subsidy Officer")
        totalWork = res.totalWork; completed = res.completed; pending = res.pending; inProgress = res.inProgress; activityCount = res.activityCount; lastActivityDate = res.lastActivityDate; lastUpdatedBy = res.lastUpdatedBy; taskTimeline = res.taskTimeline
      }
      // 17. Subsidy Redemption
      else if (pageObj.name === "Subsidy Redemption") {
        const res = processStageTable(subsidyRedemptionsData, 16, "Subsidy Officer")
        totalWork = res.totalWork; completed = res.completed; pending = res.pending; inProgress = res.inProgress; activityCount = res.activityCount; lastActivityDate = res.lastActivityDate; lastUpdatedBy = res.lastUpdatedBy; taskTimeline = res.taskTimeline
      }
      // 18. Insurance
      else if (pageObj.name === "Insurance") {
        const res = processStageTable(projectInsuranceData, 18, "Insurance Officer")
        totalWork = res.totalWork; completed = res.completed; pending = res.pending; inProgress = res.inProgress; activityCount = res.activityCount; lastActivityDate = res.lastActivityDate; lastUpdatedBy = res.lastUpdatedBy; taskTimeline = res.taskTimeline
      }
      // 19. Other Pipeline Stages / Project Synchronisation
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
        subTabs,
        taskTimeline: taskTimeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      }
    })
  }, [
    leadData,
    fmsRecords,
    paymentRecords,
    systemUsers,
    assignSurveyEstData,
    assignSurveyActData,
    newQuotationData,
    newNewQuotationData,
    quotation10kwData,
    siteSurveysData,
    ipAssignmentsData,
    salesCallsData,
    documentsUploadsData,
    registrationData,
    paymentConfirmationsData,
    dispatchPlannerData,
    dispatchMaterialData,
    installationData,
    qcData,
    inspectionsData,
    subsidyDisbursalsData,
    subsidyRedemptionsData,
    projectInsuranceData
  ])

  // Filtered Page Metrics based on Dashboard Controls
  const filteredPageMetrics = useMemo(() => {
    return pageMetricsList.filter((p) => {
      const matchesSearch = debouncedDashSearchTerm
        ? p.name.toLowerCase().includes(debouncedDashSearchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(debouncedDashSearchTerm.toLowerCase()) ||
          p.lastUpdatedBy.toLowerCase().includes(debouncedDashSearchTerm.toLowerCase())
        : true

      const matchesPage = dashPageFilter === "ALL" || p.name === dashPageFilter
      const matchesStatus = dashStatusFilter === "ALL" || p.status === dashStatusFilter

      const matchesUser =
        dashUserFilter === "ALL" ||
        p.lastUpdatedBy.toLowerCase().includes(dashUserFilter.toLowerCase()) ||
        p.usersWithAccess.some((u) => u.username.toLowerCase().includes(dashUserFilter.toLowerCase()))

      let matchesDate = true
      if (dashDateFilter !== "ALL") {
        if (!p.lastActivityDate) {
          matchesDate = false
        } else {
          const actDate = new Date(p.lastActivityDate)
          const now = new Date()
          if (isNaN(actDate.getTime())) {
            matchesDate = false
          } else if (dashDateFilter === "TODAY") {
            matchesDate = actDate.toDateString() === now.toDateString()
          } else if (dashDateFilter === "WEEK") {
            const diffDays = (now - actDate) / (1000 * 3600 * 24)
            matchesDate = diffDays >= 0 && diffDays <= 7
          } else if (dashDateFilter === "MONTH") {
            const diffDays = (now - actDate) / (1000 * 3600 * 24)
            matchesDate = diffDays >= 0 && diffDays <= 30
          } else if (dashDateFilter === "YEAR") {
            matchesDate = actDate.getFullYear() === now.getFullYear()
          } else if (dashDateFilter === "CUSTOM") {
            if (customStartDate) {
              const start = new Date(customStartDate)
              if (!isNaN(start.getTime()) && actDate < start) {
                matchesDate = false
              }
            }
            if (customEndDate) {
              const end = new Date(customEndDate)
              if (!isNaN(end.getTime()) && actDate > end) {
                matchesDate = false
              }
            }
          }
        }
      }

      return matchesSearch && matchesPage && matchesStatus && matchesUser && matchesDate
    })
  }, [
    pageMetricsList,
    debouncedDashSearchTerm,
    dashPageFilter,
    dashStatusFilter,
    dashUserFilter,
    dashDateFilter,
    customStartDate,
    customEndDate
  ])

  // Dashboard Overview Summary Statistics
  const dashStats = useMemo(() => {
    const totalPages = MASTER_SYSTEM_PAGES.length
    const completedPages = pageMetricsList.filter((p) => p.status === "Completed").length
    const pendingPages = pageMetricsList.filter((p) => p.status === "Pending").length
    const inProgressPages = pageMetricsList.filter((p) => p.status === "In Progress").length
    const noActivityPages = pageMetricsList.filter((p) => p.status === "No Activity" || p.totalWork === 0).length
    const totalActivities = pageMetricsList.reduce((acc, p) => acc + p.activityCount, 0)
    
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

  // Generate Dashboard PDF with Styled UI Cards (Matching Frontend Design)
  const generateDashboardPDF = useCallback(() => {
    if (filteredPageMetrics.length === 0) {
      alert("No page activity data available for PDF export.")
      return null
    }

    const doc = new jsPDF("portrait", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth() // 210mm
    const pageHeight = doc.internal.pageSize.getHeight() // 297mm
    const margin = 14
    const contentWidth = pageWidth - margin * 2 // 182mm

    const drawHeader = (pageNum) => {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(15)
      doc.setTextColor(30, 58, 138) // Blue 900
      doc.text("RBP ENERGY INDIA PVT LTD", margin, 14)

      doc.setFontSize(11)
      doc.setTextColor(79, 70, 229) // Indigo 600
      doc.text("PAGE ACTIVITY & WORKFLOW EXECUTIVE REPORT", margin, 20)

      const now = new Date().toLocaleString("en-IN")
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 116, 139)
      doc.text(`Generated: ${now} | Modules: ${filteredPageMetrics.length}`, pageWidth - margin, 14, { align: "right" })

      let dateStr = dashDateFilter
      if (dashDateFilter === "CUSTOM") {
        dateStr = `Custom (${customStartDate || "Start"} to ${customEndDate || "End"})`
      }
      const filterAppliedStr = `Filters: Page (${dashPageFilter}) | Status (${dashStatusFilter}) | Date (${dateStr})`
      doc.text(filterAppliedStr, pageWidth - margin, 20, { align: "right" })

      doc.setLineWidth(0.4)
      doc.setDrawColor(226, 232, 240)
      doc.line(margin, 24, pageWidth - margin, 24)
    }

    const drawFooter = (pageNum, totalPages) => {
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(148, 163, 184)
      doc.text("RBP Energy India Pvt Ltd — System Process Page Activity & Executive Access Report", margin, pageHeight - 8)
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" })
    }

    // First page header
    drawHeader(1)
    let currentY = 28

    // Calculate Summary Metrics for Filtered Data
    const filteredTotalModules = filteredPageMetrics.length
    const filteredCompleted = filteredPageMetrics.filter((p) => p.status === "Completed").length
    const filteredInProgress = filteredPageMetrics.filter((p) => p.status === "In Progress").length
    const filteredPending = filteredPageMetrics.filter((p) => p.status === "Pending").length

    // --- SECTION 1: TOP EXECUTIVE KPI CARDS ---
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)
    doc.text("EXECUTIVE DASHBOARD SUMMARY", margin, currentY)
    currentY += 4

    const kpiWidth = (contentWidth - 9) / 4 // ~43.25mm each
    const kpiHeight = 18

    const kpiCardsData = [
      { label: "TOTAL MODULES", val: filteredTotalModules, bg: [248, 250, 252], border: [203, 213, 225], textCol: [30, 41, 59] },
      { label: "COMPLETED", val: filteredCompleted, bg: [236, 253, 245], border: [167, 243, 208], textCol: [6, 78, 59] },
      { label: "IN PROGRESS", val: filteredInProgress, bg: [239, 246, 255], border: [191, 219, 254], textCol: [30, 58, 138] },
      { label: "PENDING", val: filteredPending, bg: [254, 243, 199], border: [253, 230, 138], textCol: [120, 53, 15] }
    ]

    kpiCardsData.forEach((card, i) => {
      const kpiX = margin + i * (kpiWidth + 3)
      doc.setDrawColor(...card.border)
      doc.setFillColor(...card.bg)
      doc.roundedRect(kpiX, currentY, kpiWidth, kpiHeight, 2.5, 2.5, "FD")

      doc.setFont("helvetica", "bold")
      doc.setFontSize(7.5)
      doc.setTextColor(...card.textCol)
      doc.text(card.label, kpiX + 3, currentY + 5)

      doc.setFontSize(13)
      doc.text(String(card.val), kpiX + 3, currentY + 13)
    })

    currentY += kpiHeight + 8

    // --- SECTION 2: WORKFLOW PROCESS MODULE CARDS ---
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)
    doc.text("WORKFLOW PROCESS MODULES CARDS", margin, currentY)
    currentY += 4

    filteredPageMetrics.forEach((p, idx) => {
      const hasSubTabs = p.subTabs && p.subTabs.length > 0
      const cardHeight = hasSubTabs ? 42 : 35
      const isLast = idx === filteredPageMetrics.length - 1

      // Page overflow check
      if (currentY + cardHeight + (isLast ? 0 : 6) > pageHeight - 16) {
        doc.addPage()
        drawHeader(doc.internal.getNumberOfPages())
        currentY = 28
      }

      // Draw Main Card Box
      doc.setDrawColor(226, 232, 240) // border slate-200
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(margin, currentY, contentWidth, cardHeight, 3, 3, "FD")

      // Card Header Row: Step Badge + Module Name + Category + Status Badge
      // Step Badge
      doc.setFillColor(224, 231, 255) // Indigo 100
      doc.roundedRect(margin + 3, currentY + 3, 18, 5, 1, 1, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(7)
      doc.setTextColor(67, 56, 202) // Indigo 700
      doc.text(`Step #${String(idx + 1).padStart(2, "0")}`, margin + 4.5, currentY + 6.5)

      // Module Name
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(15, 23, 42) // Slate 900
      doc.text(p.name, margin + 23, currentY + 7)

      // Category Pill
      const catWidth = doc.getTextWidth(p.category) + 4
      const catX = margin + 24 + doc.getTextWidth(p.name)
      doc.setFillColor(241, 245, 249) // Slate 100
      doc.roundedRect(catX, currentY + 3.5, catWidth, 4.5, 1, 1, "F")
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(71, 85, 105)
      doc.text(p.category, catX + 2, currentY + 6.8)

      // Status Badge (Right aligned)
      let statusBg = [241, 245, 249]
      let statusTextCol = [51, 65, 85]
      if (p.status === "Completed") {
        statusBg = [209, 250, 229] // Emerald 100
        statusTextCol = [6, 78, 59]
      } else if (p.status === "In Progress") {
        statusBg = [219, 234, 254] // Blue 100
        statusTextCol = [30, 58, 138]
      } else if (p.status === "Pending") {
        statusBg = [254, 243, 199] // Amber 100
        statusTextCol = [120, 53, 15]
      } else if (p.status === "No Activity") {
        statusBg = [255, 228, 230] // Rose 100
        statusTextCol = [159, 18, 57]
      }

      const statusText = p.status
      const statusWidth = doc.getTextWidth(statusText) + 6
      const statusX = margin + contentWidth - statusWidth - 4
      doc.setFillColor(...statusBg)
      doc.roundedRect(statusX, currentY + 3, statusWidth, 5.5, 2, 2, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(7.5)
      doc.setTextColor(...statusTextCol)
      doc.text(statusText, statusX + 3, currentY + 6.8)

      // Card Metrics Row (4 Box Grid)
      const metricY = currentY + 11
      const metricBoxWidth = (contentWidth - 15) / 4 // ~41.75mm
      const metricBoxHeight = 10

      const metricsArr = [
        { title: "TOTAL WORK", val: p.totalWork, bg: [248, 250, 252], border: [226, 232, 240], col: [15, 23, 42] },
        { title: "COMPLETED / HIST", val: p.completed, bg: [236, 253, 245], border: [167, 243, 208], col: [6, 78, 59] },
        { title: "PENDING", val: p.pending, bg: [254, 243, 199], border: [253, 230, 138], col: [120, 53, 15] },
        { title: "IN PROGRESS", val: p.inProgress, bg: [239, 246, 255], border: [191, 219, 254], col: [30, 58, 138] }
      ]

      metricsArr.forEach((m, mIdx) => {
        const mX = margin + 3 + mIdx * (metricBoxWidth + 3)
        doc.setDrawColor(...m.border)
        doc.setFillColor(...m.bg)
        doc.roundedRect(mX, metricY, metricBoxWidth, metricBoxHeight, 1.5, 1.5, "FD")

        doc.setFont("helvetica", "bold")
        doc.setFontSize(6.5)
        doc.setTextColor(100, 116, 139)
        doc.text(m.title, mX + 2.5, metricY + 3.8)

        doc.setFontSize(9)
        doc.setTextColor(...m.col)
        doc.text(String(m.val), mX + 2.5, metricY + 8)
      })

      let nextRowY = metricY + metricBoxHeight + 3

      // Sub-Tabs Breakdown Row (if available)
      if (hasSubTabs) {
        doc.setFont("helvetica", "bold")
        doc.setFontSize(6.5)
        doc.setTextColor(67, 56, 202)
        doc.text("SUB-TABS:", margin + 4, nextRowY + 3.5)

        let currSubTabX = margin + 20
        p.subTabs.forEach((st) => {
          const subText = `${st.name}: ${st.count}`
          const subW = doc.getTextWidth(subText) + 4
          if (currSubTabX + subW < margin + contentWidth - 4) {
            doc.setFillColor(241, 245, 249)
            doc.setDrawColor(203, 213, 225)
            doc.roundedRect(currSubTabX, nextRowY + 0.5, subW, 4.5, 1, 1, "FD")
            doc.setFont("helvetica", "bold")
            doc.setFontSize(6.5)
            doc.setTextColor(30, 41, 59)
            doc.text(subText, currSubTabX + 2, nextRowY + 3.8)
            currSubTabX += subW + 2.5
          }
        })

        nextRowY += 6
      }

      // Card Audit & Permissions Footer Line
      doc.setFillColor(248, 250, 252) // slate 50
      doc.setDrawColor(241, 245, 249)
      doc.roundedRect(margin + 3, nextRowY, contentWidth - 6, 6, 1, 1, "FD")

      doc.setFont("helvetica", "normal")
      doc.setFontSize(6.5)
      doc.setTextColor(100, 116, 139)

      const actDateStr = p.lastActivityDate ? formatDateTime(p.lastActivityDate) : "—"
      doc.text(`Last Activity: ${actDateStr}  |  Updated By: ${p.lastUpdatedBy}`, margin + 5, nextRowY + 4)

      doc.setFont("helvetica", "bold")
      doc.setTextColor(79, 70, 229)
      doc.text(`Access: ${p.usersWithAccess.length} Users`, margin + contentWidth - 28, nextRowY + 4)

      currentY += cardHeight

      // Down Arrow Indicator between cards
      if (!isLast) {
        doc.setDrawColor(199, 210, 254) // Indigo 200
        doc.setFillColor(238, 242, 255)
        doc.circle(margin + contentWidth / 2, currentY + 2.5, 2.2, "FD")

        doc.setFont("helvetica", "bold")
        doc.setFontSize(7)
        doc.setTextColor(79, 70, 229)
        doc.text("v", margin + contentWidth / 2 - 0.8, currentY + 3.3)

        currentY += 5
      }
    })

    // Draw page numbers on all pages
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      drawFooter(i, totalPages)
    }

    return doc
  }, [filteredPageMetrics, dashPageFilter, dashStatusFilter, dashDateFilter, customStartDate, customEndDate, dashSearchTerm, formatDateTime])

  // Open PDF Preview Modal
  const handleOpenPdfPreview = useCallback(() => {
    const doc = generateDashboardPDF()
    if (!doc) return
    const dataUrl = doc.output("dataurlstring")
    setPdfDocInstance(doc)
    setPdfPreviewUrl(dataUrl)
    setShowPdfPreviewModal(true)
  }, [generateDashboardPDF])

  // Download PDF from Preview
  const handleDownloadPdf = useCallback(() => {
    if (pdfDocInstance) {
      const timestamp = new Date().toISOString().split("T")[0]
      pdfDocInstance.save(`Page_Activity_Dashboard_Report_${timestamp}.pdf`)
    }
  }, [pdfDocInstance])

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
              Page Activity & Access Dashboard
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Centralized page-wise task monitoring, activity status & user permissions.
            </p>
          </div>

          {/* Action Buttons & PDF Export */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={handleOpenPdfPreview}
              disabled={loading || filteredPageMetrics.length === 0}
              className="inline-flex items-center px-3.5 py-2 border border-indigo-200 text-xs font-semibold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              title="Preview & Export Page Activity Dashboard PDF Summary Report"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
              Export Dashboard PDF
            </button>

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

        {/* PAGE-WISE ACTIVITY & ACCESS DASHBOARD */}
        <div className="space-y-6">
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Card 1: Total Pages */}
            <div
              onClick={() => {
                setDashStatusFilter("ALL")
              }}
              className={`bg-white p-3.5 rounded-xl border shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${
                dashStatusFilter === "ALL"
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
          </div>

          {/* Filter Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                Dashboard Filter Controls
              </h3>
              {(dashSearchTerm || dashPageFilter !== "ALL" || dashStatusFilter !== "ALL" || dashUserFilter !== "ALL" || dashDateFilter !== "ALL" || customStartDate || customEndDate) && (
                <button
                  onClick={() => {
                    setDashSearchTerm("")
                    setDashPageFilter("ALL")
                    setDashStatusFilter("ALL")
                    setDashUserFilter("ALL")
                    setDashDateFilter("ALL")
                    setCustomStartDate("")
                    setCustomEndDate("")
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-full font-medium text-gray-700"
                >
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="WEEK">This Week (7 Days)</option>
                  <option value="MONTH">This Month (30 Days)</option>
                  <option value="YEAR">This Year (2026)</option>
                  <option value="CUSTOM">Custom Date & Time Range 📅</option>
                </select>
              </div>
            </div>

            {/* Custom Date & Time Range Pickers */}
            {dashDateFilter === "CUSTOM" && (
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 animate-fade-in">
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-extrabold text-indigo-900 mb-1 flex items-center">
                    <Clock className="h-3 w-3 mr-1 text-indigo-600" />
                    From Date & Time:
                  </label>
                  <input
                    type="datetime-local"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-extrabold text-indigo-900 mb-1 flex items-center">
                    <Clock className="h-3 w-3 mr-1 text-indigo-600" />
                    To Date & Time:
                  </label>
                  <input
                    type="datetime-local"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Process Page Cards (Vertical Stacked Flow with Arrow Indicators & Full Info) */}
          <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
              <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center">
                <Layers className="h-4 w-4 mr-2 text-indigo-600" />
                System Process Modules Workflow Cards ({filteredPageMetrics.length} Modules)
              </h3>
              <span className="text-[11px] text-gray-500 font-medium">
                Click "View Details" on any module card for complete history log
              </span>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <Loader2 className="inline-block animate-spin h-8 w-8 text-indigo-600 mb-3" />
                <p className="text-indigo-600 text-sm font-medium">Computing page activities & permissions...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                {filteredPageMetrics.length > 0 ? (
                  filteredPageMetrics.map((p, index) => {
                    const isSelected = dashPageFilter === p.name
                    const isLast = index === filteredPageMetrics.length - 1

                    let badgeBg = "bg-gray-100 text-gray-700"
                    if (p.status === "Completed") badgeBg = "bg-emerald-100 text-emerald-800"
                    else if (p.status === "In Progress") badgeBg = "bg-blue-100 text-blue-800"
                    else if (p.status === "Pending") badgeBg = "bg-amber-100 text-amber-800"
                    else if (p.status === "No Activity") badgeBg = "bg-rose-50 text-rose-700"

                    return (
                      <div key={p.name} className="w-full flex flex-col items-center">
                        {/* Module Card */}
                        <div
                          className={`w-full p-4 rounded-2xl border transition-all flex flex-col gap-3.5 hover:shadow-md ${
                            isSelected
                              ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40 shadow-xs"
                              : "border-slate-200/90 hover:border-indigo-300 bg-white"
                          }`}
                        >
                          {/* Row 1: Header - Step #, Page Name, Category, Status & View Details Button */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                              <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 shrink-0">
                                Step #{String(index + 1).padStart(2, "0")}
                              </span>
                              <h4 className="text-sm font-bold text-gray-900 flex items-center">
                                <Layers className="h-4 w-4 mr-1.5 text-indigo-500 shrink-0" />
                                {p.name}
                              </h4>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]">
                                {p.category}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${badgeBg}`}>
                                {p.status}
                              </span>
                              <button
                                onClick={() => handleViewPageDetail(p)}
                                className="inline-flex items-center px-3 py-1 border border-indigo-200 text-xs font-semibold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                                View Details
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Metrics Counters (Total Work, Completed, Pending, In Progress) */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-center">
                              <span className="text-[10px] font-bold text-gray-500 block uppercase">Total Work</span>
                              <span className="font-extrabold text-gray-900 text-sm">{p.totalWork}</span>
                            </div>
                            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2 text-center">
                              <span className="text-[10px] font-bold text-emerald-700 block uppercase">Completed / History</span>
                              <span className="font-extrabold text-emerald-900 text-sm">{p.completed}</span>
                            </div>
                            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2 text-center">
                              <span className="text-[10px] font-bold text-amber-700 block uppercase">Pending</span>
                              <span className="font-extrabold text-amber-900 text-sm">{p.pending}</span>
                            </div>
                            <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-2 text-center">
                              <span className="text-[10px] font-bold text-blue-700 block uppercase">In Progress</span>
                              <span className="font-extrabold text-blue-900 text-sm">{p.inProgress}</span>
                            </div>
                          </div>

                          {/* Row 2.5: Sub-Tabs Breakdown Tags */}
                          {p.subTabs && p.subTabs.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 pt-1 pb-0.5">
                              <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider">
                                Sub-Tabs Breakdown:
                              </span>
                              {p.subTabs.map((st, i) => (
                                <span
                                  key={i}
                                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${st.color} shadow-2xs`}
                                >
                                  {st.name}: <strong className="ml-0.5">{st.count}</strong>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Row 3: Audit Info & Access Permissions */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-gray-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                            <div className="flex items-center space-x-4 flex-wrap gap-y-1">
                              <span className="flex items-center font-medium">
                                <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                Last Activity: <strong className="ml-1 text-gray-800">{p.lastActivityDate ? formatDateTime(p.lastActivityDate) : "—"}</strong>
                              </span>
                              <span className="flex items-center font-medium">
                                <User className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                Updated By: <strong className="ml-1 text-gray-800">{p.lastUpdatedBy}</strong>
                              </span>
                            </div>

                            <div className="flex items-center font-semibold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                              Access: {p.usersWithAccess.length} Authorized Users
                            </div>
                          </div>
                        </div>

                        {/* Down Arrow between cards */}
                        {!isLast && (
                          <div className="my-1.5 flex items-center justify-center">
                            <div className="p-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 shadow-2xs">
                              <ArrowDown className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="py-12 text-center text-gray-400 font-medium w-full bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No system process pages match your applied filter.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MODAL: PAGE DETAIL & HISTORY TIMELINE MODAL */}
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

                {/* 1.5. Sub-Tabs Module Breakdown */}
                {selectedDashboardPage.subTabs && selectedDashboardPage.subTabs.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wider flex items-center">
                      <Layers className="h-4 w-4 mr-1.5 text-indigo-600" />
                      Sub-Tabs Workflow Breakdown ({selectedDashboardPage.subTabs.length} Tabs)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {selectedDashboardPage.subTabs.map((st, i) => (
                        <div key={i} className={`p-2.5 rounded-xl border ${st.color} flex flex-col justify-between shadow-2xs`}>
                          <span className="text-[10px] font-bold uppercase block">{st.name}</span>
                          <span className="text-base font-extrabold mt-0.5">{st.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

        {/* PDF PREVIEW MODAL */}
        {showPdfPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-200" />
                    Page Activity Dashboard PDF Preview
                  </h3>
                  <p className="text-xs text-indigo-100 mt-0.5">
                    Review report before downloading | Filtered Modules: {filteredPageMetrics.length}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDownloadPdf}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => setShowPdfPreviewModal(false)}
                    className="rounded-full p-1.5 bg-white/10 hover:bg-white/20 transition-all text-white cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: PDF Preview iFrame */}
              <div className="p-4 bg-slate-100 flex-1 overflow-hidden flex flex-col">
                {pdfPreviewUrl ? (
                  <iframe
                    src={pdfPreviewUrl}
                    className="w-full h-[72vh] rounded-xl border border-slate-300 shadow-inner bg-white"
                    title="PDF Dashboard Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mb-2" />
                    <p className="text-sm font-medium">Generating PDF preview...</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-white px-6 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 shrink-0">
                <span>RBP Energy India Pvt Ltd — Page Activity & Access Executive Summary Report</span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowPdfPreviewModal(false)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    Download Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

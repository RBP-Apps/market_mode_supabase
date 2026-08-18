"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  Search, History, FileText, CheckCircle2, X, Upload,
  Eye, Edit2, RefreshCw, User, Phone, MapPin,
  Trash2, Plus, Calendar, ShieldCheck, Info, ClipboardCopy,
  Package, Truck, Users, MessageSquare
} from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

export default function DispatchPlannerPage() {
  const [activeTab, setActiveTab] = useState("pending") // pending / history
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const [pendingData, setPendingData] = useState([])
  const [historyData, setHistoryData] = useState([])

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("create") // "create" or "edit"
  const [selectedRecord, setSelectedRecord] = useState(null)

  // Form fields
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [ipName, setIpName] = useState("")
  const [ipMobileNumber, setIpMobileNumber] = useState("")
  const [ipAadharCardNumber, setIpAadharCardNumber] = useState("")
  const [challanFile, setChallanFile] = useState(null)
  const [challanPreview, setChallanPreview] = useState("")
  const [existingChallanUrl, setExistingChallanUrl] = useState("")

  // Fetch data from dispatch_planner table joined with enquiries
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data, error }, { data: salesCallsData, error: salesError }] = await Promise.all([
        supabase
          .from("dispatch_planner")
          .select(`
            *,
            enquiries!left (
              beneficiary_name,
              address,
              village_block,
              district,
              contact_number
            )
          `)
          .order("id", { ascending: false }),
        supabase
          .from("sales_calls")
          .select("enquiry_number, planned, actual")
          .not("planned", "is", null)
          .not("actual", "is", null)
      ])

      if (error) throw error
      if (salesError) {
        console.warn("Could not fetch sales_calls for validation:", salesError)
      }

      // Map/Set of enquiry_numbers where sales_calls.planned IS NOT NULL and sales_calls.actual IS NOT NULL
      const completedSalesEnquiries = new Set(
        (salesCallsData || [])
          .filter(sc => sc.planned && sc.actual)
          .map(sc => String(sc.enquiry_number).trim())
      )

      const pending = []
      const history = []

        ; (data || []).forEach(row => {
          const enqNum = String(row.enquiry_number || "").trim()
          if (!row.actual) {
            // Condition for Pending: dispatch_planner.planned IS NOT NULL && dispatch_planner.actual IS NULL && sales_calls.planned IS NOT NULL && sales_calls.actual IS NOT NULL
            if (row.planned && completedSalesEnquiries.has(enqNum)) {
              pending.push(row)
            }
          } else {
            history.push(row)
          }
        })

      setPendingData(pending)
      setHistoryData(history)
    } catch (err) {
      console.error("Error fetching data:", err)
      alert("Failed to fetch dispatch planner data: " + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Open modal helper
  const handleOpenModal = (record, type = "create") => {
    setSelectedRecord(record)
    setModalType(type)
    setWhatsappNumber(record.whatsapp_number || "")
    setIpName(record.ip_name || "")
    setIpMobileNumber(record.ip_mobile_number || "")
    setIpAadharCardNumber(record.ip_aadhar_card_number || "")
    setExistingChallanUrl(record.challan_copy || "")
    setChallanFile(null)
    setChallanPreview("")
    setShowModal(true)
  }

  // File Upload Helper
  const uploadFileToStorage = async (file, enquiryNum) => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${enquiryNum}_challan_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `dispatch_planner/${fileName}`

    const { error } = await supabase.storage
      .from("survey_file")
      .upload(filePath, file)

    if (error) throw error

    const { data } = supabase.storage
      .from("survey_file")
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedRecord) return
    if (!whatsappNumber.trim()) {
      alert("WhatsApp number is required.")
      return
    }
    if (modalType === "create" && !challanFile) {
      alert("Please upload a Challan Copy file.")
      return
    }

    setSubmitting(true)

    try {
      const enqNum = selectedRecord.enquiry_number || "GEN"
      let challanCopyUrl = existingChallanUrl

      if (challanFile) {
        challanCopyUrl = await uploadFileToStorage(challanFile, enqNum)
      }

      const updatePayload = {
        whatsapp_number: whatsappNumber,
        ip_name: ipName,
        ip_mobile_number: ipMobileNumber,
        ip_aadhar_card_number: ipAadharCardNumber,
        challan_copy: challanCopyUrl,
        status: "Completed",
        actual: new Date().toISOString()
      }

      const { error } = await supabase
        .from("dispatch_planner")
        .update(updatePayload)
        .eq("id", selectedRecord.id)

      if (error) throw error

      setSuccessMessage(modalType === "create" ? "Dispatch planned successfully!" : "Dispatch planner details updated!")
      setShowModal(false)
      setSelectedRecord(null)
      await fetchData()
      setTimeout(() => setSuccessMessage(""), 5000)
    } catch (err) {
      console.error("Submission error:", err)
      alert("Operation failed: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Format Date Helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "—"
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  // Search Filtered Data
  const filteredPending = useMemo(() => {
    return pendingData.filter(row => {
      const benName = row.enquiries?.beneficiary_name || ""
      const enqNum = row.enquiry_number || ""
      const dist = row.enquiries?.district || ""
      const val = searchTerm.toLowerCase()
      return (
        benName.toLowerCase().includes(val) ||
        enqNum.toLowerCase().includes(val) ||
        dist.toLowerCase().includes(val)
      )
    })
  }, [pendingData, searchTerm])

  const filteredHistory = useMemo(() => {
    return historyData.filter(row => {
      const benName = row.enquiries?.beneficiary_name || ""
      const enqNum = row.enquiry_number || ""
      const dist = row.enquiries?.district || ""
      const val = searchTerm.toLowerCase()
      return (
        benName.toLowerCase().includes(val) ||
        enqNum.toLowerCase().includes(val) ||
        dist.toLowerCase().includes(val)
      )
    })
  }, [historyData, searchTerm])

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">

        {/* Banner header */}
        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent flex items-center gap-2">
              <Truck className="h-7 w-7 text-blue-700" />
              Dispatch Planner
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Upload Challan Copy & record WhatsApp contact details for dispatch scheduling.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name, district, or enquiry no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              />
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              {successMessage}
            </div>
            <button onClick={() => setSuccessMessage("")} className="text-emerald-500 hover:text-emerald-700 transition">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setActiveTab("pending"); setSearchTerm(""); }}
            className={`px-6 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${activeTab === "pending"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <Package className="h-4 w-4" />
            Pending Planner ({filteredPending.length})
          </button>
          <button
            onClick={() => { setActiveTab("history"); setSearchTerm(""); }}
            className={`px-6 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${activeTab === "history"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <History className="h-4 w-4" />
            History ({filteredHistory.length})
          </button>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <RefreshCw className="h-10 w-10 animate-spin text-blue-600 mb-3" />
              <p className="text-sm font-semibold">Fetching dispatch details...</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead className="sticky top-0 z-20 bg-gray-50 text-center shadow-sm">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Enquiry Number</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Beneficiary Name</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Number</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">District</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Village/Block</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
                    {activeTab === "history" && (
                      <>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Challan Copy</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp Number</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">IP Name</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">IP Mobile</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">IP Aadhar</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider font-semibold text-orange-600">Delay (Days)</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Planned Date</th>
                    {activeTab === "history" && (
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actual Date</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-center text-xs">
                  {activeTab === "pending" ? (
                    filteredPending.length > 0 ? (
                      filteredPending.map(row => (
                        <tr key={row.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenModal(row, "create")}
                              className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-semibold transition"
                            >
                              <Plus className="h-3 w-3" />
                              Plan Dispatch
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-blue-700 font-semibold">{row.enquiry_number || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900">{row.enquiries?.beneficiary_name || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-700">{row.enquiries?.contact_number || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-600">{row.enquiries?.district || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-600">{row.enquiries?.village_block || "—"}</td>
                          <td className="px-4 py-3 max-w-xs truncate text-gray-600 text-left" title={row.enquiries?.address}>
                            {row.enquiries?.address || "—"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatDate(row.planned)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-gray-400 font-medium">
                          No pending dispatch planner tasks found.
                        </td>
                      </tr>
                    )
                  ) : (
                    filteredHistory.length > 0 ? (
                      filteredHistory.map(row => (
                        <tr key={row.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenModal(row, "edit")}
                              className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-semibold transition"
                            >
                              <Edit2 className="h-3 w-3" />
                              Edit
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-blue-700 font-semibold">{row.enquiry_number || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900">{row.enquiries?.beneficiary_name || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-700">{row.enquiries?.contact_number || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-600">{row.enquiries?.district || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-600">{row.enquiries?.village_block || "—"}</td>
                          <td className="px-4 py-3 max-w-xs truncate text-gray-600 text-left" title={row.enquiries?.address}>
                            {row.enquiries?.address || "—"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {row.challan_copy ? (
                              <a
                                href={row.challan_copy}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-md font-semibold transition"
                              >
                                <Eye className="h-3 w-3" />
                                View Copy
                              </a>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-semibold inline-flex items-center gap-1 justify-center py-2.5">
                            <MessageSquare className="h-3 w.5 text-blue-500" />
                            {row.whatsapp_number || "—"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-medium">{row.ip_name || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-700">{row.ip_mobile_number || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-700">{row.ip_aadhar_card_number || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-bold text-orange-600">{row.delay !== null ? row.delay : "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatDate(row.planned)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatDate(row.actual)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={15} className="px-4 py-12 text-center text-gray-400 font-medium">
                          No dispatch planner history records found.
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal for Planning / Editing Dispatch Details */}
        {showModal && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleUp border border-gray-100"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    {modalType === "create" ? "Plan Dispatch Details" : "Edit Dispatch Planner"}
                  </h3>
                  <p className="text-2xs text-blue-100 mt-0.5">
                    Enquiry Number: {selectedRecord.enquiry_number}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

                {/* Beneficiary details card summary */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5 text-2xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Beneficiary:</span>
                    <span className="text-gray-900 font-bold">{selectedRecord.enquiries?.beneficiary_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Contact:</span>
                    <span className="text-gray-900 font-semibold">{selectedRecord.enquiries?.contact_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">District / Area:</span>
                    <span className="text-gray-800">{selectedRecord.enquiries?.district} ({selectedRecord.enquiries?.village_block})</span>
                  </div>
                </div>

                {/* WhatsApp Number Input */}
                <div>
                  <label className="block text-2xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                    WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter 10-digit WhatsApp number"
                    maxLength={15}
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^0-9+]/g, ""))}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/30"
                    required
                  />
                </div>

                {/* IP Name Input */}
                <div>
                  <label className="block text-2xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    IP Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter IP name"
                    value={ipName}
                    onChange={(e) => setIpName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/30"
                  />
                </div>

                {/* IP Mobile Number Input */}
                <div>
                  <label className="block text-2xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-blue-600" />
                    IP Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter 10-digit IP mobile number"
                    maxLength={15}
                    value={ipMobileNumber}
                    onChange={(e) => setIpMobileNumber(e.target.value.replace(/[^0-9+]/g, ""))}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/30"
                  />
                </div>

                {/* IP Aadhar Card Number Input */}
                <div>
                  <label className="block text-2xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                    IP Aadhar Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 12-digit Aadhar card number"
                    maxLength={14}
                    value={ipAadharCardNumber}
                    onChange={(e) => setIpAadharCardNumber(e.target.value.replace(/[^0-9\s]/g, ""))}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/30"
                  />
                </div>

                {/* Challan Copy Upload */}
                <div>
                  <label className="block text-2xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                    Challan Copy (Image or PDF) <span className="text-red-500">*</span>
                  </label>

                  {/* Show existing file link if in edit mode */}
                  {modalType === "edit" && existingChallanUrl && (
                    <div className="mb-2 p-2 border border-emerald-100 bg-emerald-50/50 rounded-lg flex items-center justify-between text-2xs">
                      <span className="text-emerald-800 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Current Challan File exists
                      </span>
                      <a
                        href={existingChallanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </a>
                    </div>
                  )}

                  {/* Upload Drop Zone / Input */}
                  <div className="relative border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-4 transition text-center cursor-pointer bg-slate-50/40">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setChallanFile(file)
                          setChallanPreview(file.name)
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required={modalType === "create"}
                    />
                    <Upload className="mx-auto h-6 w-6 text-gray-400 mb-1.5" />
                    <p className="text-2xs text-gray-600 font-medium">
                      Drag & drop or <span className="text-blue-600 underline">browse</span> file
                    </p>
                    <p className="text-3xs text-gray-400 mt-0.5">Supports PDF, PNG, JPG, JPEG</p>
                  </div>

                  {challanPreview && (
                    <p className="text-2xs text-blue-600 mt-2 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                      Selected: {challanPreview}
                    </p>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-100 text-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Submit
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}

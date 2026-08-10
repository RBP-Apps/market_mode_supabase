"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  CheckCircle2,
  X,
  Search,
  History,
  Eye,
  Upload,
  Edit2,
  AlertCircle,
  Loader2,
  FileCheck,
  Calendar,
  Phone,
  MapPin,
  User,
  Plus
} from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

// Page configuration
const CONFIG = {
  PAGE_CONFIG: {
    title: "DCR Creation",
    historyTitle: "DCR Creation History",
    description: "Manage and track Domestic Content Requirement (DCR) certificates and enquiry details",
    historyDescription: "View and edit completed DCR creation records",
  },
}

// Debounce hook for performance optimization
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  return debouncedValue
}

export default function DCRPage() {
  const [pendingData, setPendingData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Form state
  const [dcrForm, setDcrForm] = useState({
    status: "Yes",
    dcrNumber: "",
    dcrCertificate: null,
    moduleMake: "",
    moduleCapacity: "",
    remarks: ""
  })

  // File upload tracking
  const [fileUpload, setFileUpload] = useState({
    uploading: false,
    uploaded: false,
    url: "",
    error: null,
    name: ""
  })

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Helper date formatter
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "—"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime()) || date.getFullYear() === 1970) return "—"
      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch (e) {
      return dateString
    }
  }, [])

  // Main data fetch from Supabase table / enquiries
  const fetchDcrData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Try fetching from 'dcr_creation' table with joined 'enquiries'
      let res = await supabase
        .from("dcr_creation")
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

      // Fallback 1: Try 'dcr' table if dcr_creation fails
      if (res.error) {
        res = await supabase
          .from("dcr")
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
      }

      // Fallback 2: Try 'enquiries' table directly if standalone DCR table is not created yet
      if (res.error) {
        res = await supabase
          .from("enquiries")
          .select("*")
      }

      if (res.error) throw res.error

      const pending = []
      const history = []

      ;(res.data || []).forEach((row) => {
        const enq = row.enquiries || (row.enquiry_number ? {} : row)
        const enquiryNumber = row.enquiry_number || enq.enquiry_number || ""

        const rowData = {
          _id: row.id,
          enquiryNumber: enquiryNumber || `EN-${row.id}`,
          beneficiaryName: enq.beneficiary_name || row.beneficiary_name || "—",
          address: enq.address || row.address || "—",
          contactNumber: enq.contact_number || row.contact_number || "—",
          villageBlock: enq.village_block || row.village_block || "—",
          district: enq.district || row.district || "—",
          planned: row.planned || row.timestamp || null,
          actual: row.actual || null,
          delay: row.delay || "",
          status: row.status || row.dcr_status || "",
          dcrNumber: row.dcr_number || row.dcr_certificate_no || "",
          dcrCertificate: row.dcr_certificate || row.dcr_copy || "",
          moduleMake: row.module_make || "",
          moduleCapacity: row.module_capacity || "",
          remarks: row.remarks || ""
        }

        if (!row.actual && row.status !== "Done" && row.status !== "Completed") {
          pending.push(rowData)
        } else {
          history.push(rowData)
        }
      })

      setPendingData(pending)
      setHistoryData(history)
    } catch (err) {
      console.error("Error fetching DCR data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDcrData()
  }, [fetchDcrData])

  // Search filters
  const filteredPendingData = useMemo(() => {
    return debouncedSearchTerm
      ? pendingData.filter((record) =>
          Object.values(record).some(
            (value) => value && value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          )
        )
      : pendingData
  }, [pendingData, debouncedSearchTerm])

  const filteredHistoryData = useMemo(() => {
    return debouncedSearchTerm
      ? historyData.filter((record) =>
          Object.values(record).some(
            (value) => value && value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          )
        )
      : historyData
  }, [historyData, debouncedSearchTerm])

  const handleActionClick = useCallback((record) => {
    setSelectedRecord(record)
    setDcrForm({
      status: record.status || "Yes",
      dcrNumber: record.dcrNumber || "",
      dcrCertificate: record.dcrCertificate || null,
      moduleMake: record.moduleMake || "",
      moduleCapacity: record.moduleCapacity || "",
      remarks: record.remarks || ""
    })
    setFileUpload({
      uploading: false,
      uploaded: !!record.dcrCertificate,
      url: record.dcrCertificate || "",
      error: null,
      name: record.dcrCertificate ? "Existing Document" : ""
    })
    setShowModal(true)
  }, [])

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return

    setFileUpload({
      uploading: true,
      uploaded: false,
      url: "",
      error: null,
      name: file.name
    })

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `dcr_${selectedRecord.enquiryNumber}_${Date.now()}.${fileExt}`
      const filePath = `dcr_certificates/${fileName}`

      // Upload to Supabase Storage bucket
      let { error: uploadError } = await supabase.storage
        .from("module_uploads")
        .upload(filePath, file)

      let bucketName = "module_uploads"

      if (uploadError) {
        // Fallback bucket search
        const fallbackRes = await supabase.storage
          .from("survey_file")
          .upload(filePath, file)

        if (fallbackRes.error) throw uploadError
        bucketName = "survey_file"
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      const url = publicUrlData.publicUrl

      setFileUpload({
        uploading: false,
        uploaded: true,
        url: url,
        error: null,
        name: file.name
      })

      setDcrForm((prev) => ({ ...prev, dcrCertificate: url }))
    } catch (err) {
      console.error("DCR File upload error:", err)
      setFileUpload({
        uploading: false,
        uploaded: false,
        url: "",
        error: err.message,
        name: file.name
      })
    }
  }, [selectedRecord])

  const handleSubmit = async () => {
    if (!dcrForm.status) {
      alert("Please select status")
      return
    }

    setIsSubmitting(true)
    try {
      const actualDate = new Date().toISOString()
      const updatePayload = {
        actual: actualDate,
        status: dcrForm.status,
        dcr_number: dcrForm.dcrNumber || null,
        dcr_certificate: dcrForm.dcrCertificate || null,
        dcr_copy: dcrForm.dcrCertificate || null,
        module_make: dcrForm.moduleMake || null,
        module_capacity: dcrForm.moduleCapacity || null,
        remarks: dcrForm.remarks || null
      }

      // Try updating 'dcr_creation'
      let { error: updateError } = await supabase
        .from("dcr_creation")
        .update(updatePayload)
        .eq("enquiry_number", selectedRecord.enquiryNumber)

      if (updateError) {
        // Try updating 'dcr'
        const res2 = await supabase
          .from("dcr")
          .update(updatePayload)
          .eq("enquiry_number", selectedRecord.enquiryNumber)
        updateError = res2.error
      }

      if (updateError) {
        // Fallback upsert
        const res3 = await supabase
          .from("dcr_creation")
          .upsert({
            enquiry_number: selectedRecord.enquiryNumber,
            planned: selectedRecord.planned || new Date().toISOString(),
            ...updatePayload
          }, { onConflict: "enquiry_number" })
        updateError = res3.error
      }

      if (updateError) throw updateError

      setSuccessMessage(`DCR Creation details updated for ${selectedRecord.enquiryNumber}`)
      setShowModal(false)
      fetchDcrData()

      setTimeout(() => setSuccessMessage(""), 4000)
    } catch (err) {
      console.error("Error submitting DCR creation:", err)
      alert("Submission failed: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleSection = useCallback((section) => {
    setShowHistory(section === "history")
    setSearchTerm("")
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {showHistory ? CONFIG.PAGE_CONFIG.historyTitle : CONFIG.PAGE_CONFIG.title}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {showHistory ? CONFIG.PAGE_CONFIG.historyDescription : CONFIG.PAGE_CONFIG.description}
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={showHistory ? "Search DCR history..." : "Search pending DCR creations..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-xs w-full sm:w-80"
            />
          </div>
        </div>

        {/* Section Toggle Buttons */}
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => toggleSection("pending")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              !showHistory
                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center">
              <FileCheck className="h-4.5 w-4.5 mr-2 text-blue-500" />
              Pending DCR Creation ({filteredPendingData.length})
            </div>
          </button>
          <button
            onClick={() => toggleSection("history")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              showHistory
                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center">
              <History className="h-4.5 w-4.5 mr-2 text-blue-500" />
              DCR History ({filteredHistoryData.length})
            </div>
          </button>
        </div>

        {/* Success Message Banner */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center justify-between shadow-xs animate-fade-in">
            <div className="flex items-center font-medium">
              <CheckCircle2 className="h-5 w-5 mr-2 text-emerald-500" />
              <span className="text-sm">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage("")} className="text-emerald-500 hover:text-emerald-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Main List Container */}
        <div className="rounded-xl border border-blue-100 shadow-sm bg-white overflow-hidden">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="inline-block animate-spin h-8 w-8 text-blue-600 mb-3" />
              <p className="text-blue-600 text-sm font-medium">Fetching enquiry & DCR data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-6 rounded-md text-red-800 text-center text-sm border border-red-100">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p>{error}</p>
              <button className="underline mt-2 font-medium text-red-600 hover:text-red-800" onClick={fetchDcrData}>
                Retry Fetching
              </button>
            </div>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: "65vh" }}>
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead className="bg-gray-50 sticky top-0 z-10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 w-28">Action</th>
                    <th className="px-4 py-3.5">Enquiry Number</th>
                    <th className="px-4 py-3.5">Beneficiary Name</th>
                    <th className="px-4 py-3.5">Contact Number</th>
                    <th className="px-4 py-3.5">Address</th>
                    <th className="px-4 py-3.5">Village / Block</th>
                    <th className="px-4 py-3.5">District</th>
                    <th className="px-4 py-3.5">Planned Date</th>
                    {showHistory && (
                      <>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5">DCR Number</th>
                        <th className="px-4 py-3.5">Module Make / Cap.</th>
                        <th className="px-4 py-3.5">DCR Certificate</th>
                        <th className="px-4 py-3.5">Completion Date</th>
                        <th className="px-4 py-3.5">Delay</th>
                        <th className="px-4 py-3.5">Remarks</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-xs text-gray-700">
                  {showHistory ? (
                    filteredHistoryData.length > 0 ? (
                      filteredHistoryData.map((record) => (
                        <tr key={record._id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleActionClick(record)}
                              className="inline-flex items-center px-2.5 py-1 border border-blue-200 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </button>
                          </td>
                          <td className="px-4 py-3 font-semibold text-blue-900">{record.enquiryNumber}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            <div className="flex items-center">
                              <User className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                              {record.beneficiaryName}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                              {record.contactNumber}
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate" title={record.address}>
                            <div className="flex items-center">
                              <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400 shrink-0" />
                              <span className="truncate">{record.address}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">{record.villageBlock}</td>
                          <td className="px-4 py-3">{record.district}</td>
                          <td className="px-4 py-3">{formatDate(record.planned)}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700">
                              {record.status || "Completed"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-medium">{record.dcrNumber || "—"}</td>
                          <td className="px-4 py-3">
                            {record.moduleMake || record.moduleCapacity
                              ? `${record.moduleMake || ""} ${record.moduleCapacity ? `(${record.moduleCapacity})` : ""}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {record.dcrCertificate ? (
                              <a
                                href={record.dcrCertificate}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center underline"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" /> View
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-emerald-700">{formatDate(record.actual)}</td>
                          <td className="px-4 py-3">
                            {record.delay ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                parseInt(record.delay) > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                              }`}>
                                {record.delay} days
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate">{record.remarks || "—"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={15} className="py-12 text-center text-gray-400 font-medium">
                          No completed DCR records found.
                        </td>
                      </tr>
                    )
                  ) : filteredPendingData.length > 0 ? (
                    filteredPendingData.map((record) => (
                      <tr key={record._id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleActionClick(record)}
                            className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-semibold rounded-lg text-white hover:from-blue-700 hover:to-indigo-700 shadow-xs transition-all"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Create DCR
                          </button>
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-900">{record.enquiryNumber}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div className="flex items-center">
                            <User className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            {record.beneficiaryName}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            {record.contactNumber}
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate" title={record.address}>
                          <div className="flex items-center">
                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400 shrink-0" />
                            <span className="truncate">{record.address}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{record.villageBlock}</td>
                        <td className="px-4 py-3">{record.district}</td>
                        <td className="px-4 py-3">{formatDate(record.planned)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400 font-medium">
                        No pending DCR creations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action / Update Modal */}
        {showModal && selectedRecord && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 transform transition-all">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="font-bold text-base">DCR Creation Update</h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Customer: {selectedRecord.beneficiaryName} | Enquiry: {selectedRecord.enquiryNumber}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-full p-1.5 bg-white/10 hover:bg-white/20 transition-all text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* 1. Status Dropdown */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={dcrForm.status}
                    onChange={(e) => setDcrForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Yes">Yes (Completed)</option>
                    <option value="No">No (Pending)</option>
                  </select>
                </div>

                {/* 2. DCR Certificate Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    DCR Certificate Number
                  </label>
                  <input
                    type="text"
                    value={dcrForm.dcrNumber}
                    onChange={(e) => setDcrForm((prev) => ({ ...prev, dcrNumber: e.target.value.toUpperCase() }))}
                    placeholder="Enter DCR Certificate Number (e.g. DCR-2026-XXXX)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                {/* 3. Module Make & Capacity */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Module Make
                    </label>
                    <input
                      type="text"
                      value={dcrForm.moduleMake}
                      onChange={(e) => setDcrForm((prev) => ({ ...prev, moduleMake: e.target.value }))}
                      placeholder="e.g. Tata Power Solar"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Module Capacity
                    </label>
                    <input
                      type="text"
                      value={dcrForm.moduleCapacity}
                      onChange={(e) => setDcrForm((prev) => ({ ...prev, moduleCapacity: e.target.value }))}
                      placeholder="e.g. 540W"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 4. DCR Certificate File Upload */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Upload DCR Certificate (PDF / Image)
                  </label>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e.target.files[0])}
                        className="hidden"
                        id="dcrCertInput"
                      />
                      <label
                        htmlFor="dcrCertInput"
                        className="flex items-center justify-between w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer bg-gray-50 hover:bg-gray-100 text-xs text-gray-600 transition-colors"
                      >
                        <span className="truncate max-w-[220px]">
                          {fileUpload.name || "Choose certificate file..."}
                        </span>
                        <Upload className="h-4 w-4 text-gray-400" />
                      </label>
                    </div>

                    {fileUpload.url && (
                      <a
                        href={fileUpload.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-blue-200 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        title="View Document"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {fileUpload.uploading && (
                    <p className="text-[10px] text-blue-500 animate-pulse flex items-center mt-1">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" /> Uploading to storage...
                    </p>
                  )}
                  {fileUpload.uploaded && (
                    <p className="text-[10px] text-emerald-600 flex items-center mt-1">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Certificate ready
                    </p>
                  )}
                </div>

                {/* 5. Remarks */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Remarks / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={dcrForm.remarks}
                    onChange={(e) => setDcrForm((prev) => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Enter any additional notes..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || fileUpload.uploading}
                  className="inline-flex justify-center rounded-lg shadow-md px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs transition-all disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Save Details
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="inline-flex justify-center rounded-lg border border-gray-300 shadow-xs px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

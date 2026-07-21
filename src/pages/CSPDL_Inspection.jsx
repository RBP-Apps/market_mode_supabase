"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, X, Search, History, MapPin, Users, Phone, Eye, Upload, AlertCircle, FileText, Loader2, ArrowRight } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

// Page configuration
const CONFIG = {
  PAGE_CONFIG: {
    title: "CSPDL Inspection and Solar Meter Inspection",
    historyTitle: "CSPDL Inspection History",
    description: "Manage pending CSPDL inspections and meter installations",
    historyDescription: "View completed CSPDL inspections",
  },
}

// Debounce hook for search optimization
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

export default function CSPDLInspectionPage() {
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

  // Form State
  const [form, setForm] = useState({
    inspectionStatus: "", // 'Yes' or 'No'
    meterInstallationUpload: "", // URL of the uploaded document
  })

  // File upload progress state
  const [fileUpload, setFileUpload] = useState({
    uploading: false,
    uploaded: false,
    url: "",
    error: null,
    name: ""
  })

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

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

  const fetchCSPDLInspections = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("cspdl_inspections")
        .select(`
          *,
          enquiries!left (
            beneficiary_name,
            address,
            contact_number
          )
        `)
        .not("planned", "is", null)

      if (fetchError) throw fetchError

      const pending = []
      const history = []

      if (data) {
        data.forEach((row) => {
          const enq = row.enquiries || {}
          const rowData = {
            id: row.id,
            enquiryNumber: row.enquiry_number || "",
            beneficiaryName: enq.beneficiary_name || "",
            address: enq.address || "",
            contactNumber: enq.contact_number || "",
            planned: row.planned || "",
            actual: row.actual || "",
            delay: row.delay || "",
            status: row.status || "",
            inspectionStatus: row.inspection_status || "",
            meterInstallationUpload: row.meter_installation_upload || "",
          }

          if (row.planned && !row.actual) {
            pending.push(rowData)
          } else if (row.planned && row.actual) {
            history.push(rowData)
          }
        })
      }

      setPendingData(pending)
      setHistoryData(history)
    } catch (err) {
      console.error("Error fetching CSPDL inspections:", err)
      setError("Failed to load CSPDL inspections: " + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCSPDLInspections()
  }, [fetchCSPDLInspections])

  // Filters
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
    setForm({
      inspectionStatus: record.inspectionStatus || "",
      meterInstallationUpload: record.meterInstallationUpload || "",
    })
    setFileUpload({
      uploading: false,
      uploaded: !!record.meterInstallationUpload,
      url: record.meterInstallationUpload || "",
      error: null,
      name: record.meterInstallationUpload ? "Existing File" : ""
    })
    setShowModal(true)
  }, [])

  const handleFileUpload = async (file) => {
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
      const fileName = `cspdl_inspect_${selectedRecord.enquiryNumber}_${Date.now()}.${fileExt}`
      const filePath = `module_uploads/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("module_uploads")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from("module_uploads")
        .getPublicUrl(filePath)

      setFileUpload({
        uploading: false,
        uploaded: true,
        url: data.publicUrl,
        error: null,
        name: file.name
      })

      setForm((prev) => ({ ...prev, meterInstallationUpload: data.publicUrl }))
    } catch (err) {
      console.error("File upload error:", err)
      setFileUpload({
        uploading: false,
        uploaded: false,
        url: "",
        error: err.message,
        name: file.name
      })
    }
  }

  const handleFormSubmit = async () => {
    if (!form.inspectionStatus) {
      alert("Please select Inspection Status.")
      return
    }

    if (form.inspectionStatus === "Yes" && !form.meterInstallationUpload) {
      alert("Please upload the Meter Installation document.")
      return
    }

    setIsSubmitting(true)

    try {
      const actualDate = new Date().toISOString()

      const updatePayload = {
        inspection_status: form.inspectionStatus,
        meter_installation_upload: form.inspectionStatus === "Yes" ? form.meterInstallationUpload : null,
        actual: actualDate,
        status: "Done"
      }

      const { error: updateError } = await supabase
        .from("cspdl_inspections")
        .update(updatePayload)
        .eq("enquiry_number", selectedRecord.enquiryNumber)

      if (updateError) throw updateError

      setShowModal(false)
      setSuccessMessage(`CSPDL Inspection saved successfully for ${selectedRecord.enquiryNumber}`)
      fetchCSPDLInspections()

      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err) {
      console.error("Save error:", err)
      alert("Failed to save inspection: " + err.message)
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
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-700">{CONFIG.PAGE_CONFIG.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {showHistory ? CONFIG.PAGE_CONFIG.historyDescription : CONFIG.PAGE_CONFIG.description}
            </p>
          </div>
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={showHistory ? "Search history..." : "Search pending inspections..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-xs w-64"
              />
            </div>
          </div>
        </div>

        {/* Section Toggle Tabs */}
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => toggleSection("pending")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              !showHistory
                ? "border-blue-500 text-blue-600 bg-blue-50/50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-350"
            }`}
          >
            <div className="flex items-center">
              <FileText className="h-4.5 w-4.5 mr-2 text-blue-500" />
              Pending Inspections ({filteredPendingData.length})
            </div>
          </button>
          <button
            onClick={() => toggleSection("history")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              showHistory
                ? "border-blue-500 text-blue-600 bg-blue-50/50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-355"
            }`}
          >
            <div className="flex items-center">
              <History className="h-4.5 w-4.5 mr-2 text-blue-500" />
              Inspection History ({filteredHistoryData.length})
            </div>
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center font-medium">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
              {successMessage}
            </div>
            <button onClick={() => setSuccessMessage("")} className="text-green-500 hover:text-green-800">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Table Container */}
        <div className="rounded-xl border border-blue-100 shadow-sm bg-white overflow-hidden">
          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="inline-block animate-spin h-8 w-8 text-blue-600 mb-4" />
              <p className="text-blue-600 font-medium text-sm">Loading inspection data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-6 rounded-md text-red-800 text-center text-sm">
              {error}
              <button className="underline ml-2 hover:text-red-900 font-bold" onClick={fetchCSPDLInspections}>
                Try again
              </button>
            </div>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: "60vh" }}>
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead className="bg-gray-50 sticky top-0 z-10 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-4 w-28">Action</th>
                    <th className="px-4 py-4">Enquiry Number</th>
                    <th className="px-4 py-4">Beneficiary Name</th>
                    <th className="px-4 py-4">Address</th>
                    <th className="px-4 py-4">Contact Number</th>
                    <th className="px-4 py-4">Planned Date</th>
                    {showHistory && (
                      <>
                        <th className="px-4 py-4">Inspection Status</th>
                        <th className="px-4 py-4">Meter Installation Copy</th>
                        <th className="px-4 py-4">Confirm Date</th>
                        <th className="px-4 py-4">Delay (Days)</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-150 text-xs text-gray-700">
                  {showHistory ? (
                    filteredHistoryData.length > 0 ? (
                      filteredHistoryData.map((record) => (
                        <tr key={record.id} className="hover:bg-blue-25/30 transition-colors">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleActionClick(record)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold rounded-lg transition-colors"
                            >
                              View / Edit
                            </button>
                          </td>
                          <td className="px-4 py-3 font-semibold text-blue-900">{record.enquiryNumber || "—"}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900 flex items-center">
                            <Users className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            {record.beneficiaryName || "—"}
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate" title={record.address}>
                            <div className="flex items-center">
                              <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400 shrink-0" />
                              <span className="truncate">{record.address || "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                              {record.contactNumber || "—"}
                            </div>
                          </td>
                          <td className="px-4 py-3">{formatDate(record.planned)}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              record.inspectionStatus === "Yes" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            }`}>
                              {record.inspectionStatus || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {record.meterInstallationUpload ? (
                              <a
                                href={record.meterInstallationUpload}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold underline"
                              >
                                <Eye size={13} />
                                View Upload
                              </a>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-green-700 font-semibold">{formatDate(record.actual)}</td>
                          <td className="px-4 py-3 font-semibold">
                            <span className={`px-2 py-0.5 rounded-full ${parseInt(record.delay) > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                              {record.delay || "0"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-4 py-16 text-center text-gray-500 font-medium">
                          {searchTerm ? "No inspection history records matching your search" : "No completed inspections found"}
                        </td>
                      </tr>
                    )
                  ) : filteredPendingData.length > 0 ? (
                    filteredPendingData.map((record) => (
                      <tr key={record.id} className="hover:bg-blue-25/30 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleActionClick(record)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors"
                          >
                            Action
                          </button>
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-950">{record.enquiryNumber || "—"}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900 flex items-center">
                          <Users className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          {record.beneficiaryName || "—"}
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate" title={record.address}>
                          <div className="flex items-center">
                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400 shrink-0" />
                            <span className="truncate">{record.address || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            {record.contactNumber || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3">{formatDate(record.planned)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center text-gray-500 font-medium">
                        {searchTerm ? "No pending inspections matching your search" : "No pending inspections found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-slate-900 bg-opacity-60 transition-opacity backdrop-blur-xs" onClick={() => setShowModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal content */}
            <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-10 border border-blue-50">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white" id="modal-title">
                    CSPDL Inspection Status Update
                  </h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Customer: {selectedRecord.beneficiaryName} | Enquiry No: {selectedRecord.enquiryNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg text-white hover:bg-white/10 p-1.5 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-5">
                {/* 1. Status Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Inspection Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.inspectionStatus}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        inspectionStatus: e.target.value,
                        // Reset file if status changed to No
                        meterInstallationUpload: e.target.value === "No" ? "" : form.meterInstallationUpload
                      })
                      if (e.target.value === "No") {
                        setFileUpload({ uploading: false, uploaded: false, url: "", error: null, name: "" })
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  >
                    <option value="">Select Status</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* 2. Conditionally shown Meter Installation Upload */}
                {form.inspectionStatus === "Yes" && (
                  <div className="p-4 bg-blue-25/55 border border-blue-100 rounded-xl space-y-3">
                    <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Meter Installation Upload <span className="text-red-500">*</span>
                      <span className="text-gray-400 text-[10px] lowercase font-normal ml-1">(image / pdf)</span>
                    </label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e.target.files[0])}
                        className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-750 hover:file:bg-blue-100 cursor-pointer"
                      />

                      {/* File Upload States */}
                      {fileUpload.uploading && (
                        <div className="flex items-center text-xs text-blue-600 bg-blue-50/50 p-2 rounded-lg animate-pulse">
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Uploading document...
                        </div>
                      )}

                      {fileUpload.error && (
                        <div className="flex items-center text-xs text-red-650 bg-red-50/50 p-2 rounded-lg border border-red-100">
                          <AlertCircle className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                          Error: {fileUpload.error}
                        </div>
                      )}

                      {fileUpload.uploaded && (
                        <div className="flex items-center justify-between text-xs text-green-700 bg-green-50/50 p-2 rounded-lg border border-green-100 font-medium">
                          <span className="flex items-center">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                            Uploaded Successfully
                          </span>
                          {form.meterInstallationUpload && (
                            <a
                              href={form.meterInstallationUpload}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center font-bold"
                            >
                              <Eye size={12} className="mr-0.5" /> Preview
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  disabled={isSubmitting || fileUpload.uploading}
                  className="inline-flex justify-center rounded-lg shadow-md px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-55 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Save Status
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, X, Search, History, Edit, AlertCircle, Calendar, FileText } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

// Page configuration
const CONFIG = {
  PAGE_CONFIG: {
    title: "Registration",
    historyTitle: "Registration History",
    description: "Track and confirm customer registration status.",
    historyDescription: "View and edit completed registrations",
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

export default function RegistrationPage() {
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
  const [registrationForm, setRegistrationForm] = useState({
    status: "", // "Yes", "No", or "" (default empty)
    applicationNumber: "",
    applicationDate: ""
  })

  // Validation errors
  const [formErrors, setFormErrors] = useState({
    status: "",
    applicationNumber: "",
    applicationDate: ""
  })

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("registration")
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
        .not("planned", "is", null)

      if (fetchError) throw fetchError

      const pending = []
      const history = []

      ;(data || []).forEach((row) => {
        const enquiryNumber = row.enquiry_number || ""
        const enq = row.enquiries || {}

        const rowData = {
          _id: row.id,
          enquiryNumber: enquiryNumber,
          beneficiaryName: enq.beneficiary_name || "",
          address: enq.address || "",
          contactNumber: enq.contact_number || "",
          villageBlock: enq.village_block || "",
          district: enq.district || "",
          planned: row.planned,
          actual: row.actual,
          delay: row.delay || "",
          status: row.status || "",
          applicationNumber: row.application_number || "",
          applicationDate: row.application_date || ""
        }

        if (!row.actual) {
          pending.push(rowData)
        } else {
          history.push(rowData)
        }
      })

      setPendingData(pending)
      setHistoryData(history)
    } catch (err) {
      console.error("Error fetching registration data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPending = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  const fetchHistory = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Search filter implementation
  const filteredPendingData = useMemo(() => {
    return debouncedSearchTerm
      ? pendingData.filter((record) => {
          const term = debouncedSearchTerm.toLowerCase()
          return (
            (record.enquiryNumber || "").toLowerCase().includes(term) ||
            (record.beneficiaryName || "").toLowerCase().includes(term) ||
            (record.contactNumber || "").toLowerCase().includes(term) ||
            (record.applicationNumber || "").toLowerCase().includes(term)
          )
        })
      : pendingData
  }, [pendingData, debouncedSearchTerm])

  const filteredHistoryData = useMemo(() => {
    return debouncedSearchTerm
      ? historyData.filter((record) => {
          const term = debouncedSearchTerm.toLowerCase()
          return (
            (record.enquiryNumber || "").toLowerCase().includes(term) ||
            (record.beneficiaryName || "").toLowerCase().includes(term) ||
            (record.contactNumber || "").toLowerCase().includes(term) ||
            (record.applicationNumber || "").toLowerCase().includes(term)
          )
        })
      : historyData
  }, [historyData, debouncedSearchTerm])

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value)
  }, [])

  const toggleSection = useCallback((section) => {
    setShowHistory(section === "history")
    setSearchTerm("")
  }, [])

  const handleInputChange = useCallback((field, value) => {
    setRegistrationForm((prev) => ({ ...prev, [field]: value }))
    setFormErrors((prev) => ({ ...prev, [field]: "" }))
  }, [])

  const handleStatusChange = useCallback((value) => {
    setRegistrationForm((prev) => ({
      ...prev,
      status: value,
      applicationNumber: value === "No" ? "" : prev.applicationNumber,
      applicationDate: value === "No" ? "" : prev.applicationDate
    }))
    setFormErrors({
      status: "",
      applicationNumber: "",
      applicationDate: ""
    })
  }, [])

  const handleEdit = useCallback((record) => {
    setSelectedRecord(record)
    setRegistrationForm({
      status: record.status || "",
      applicationNumber: record.applicationNumber || "",
      applicationDate: record.applicationDate || ""
    })
    setFormErrors({
      status: "",
      applicationNumber: "",
      applicationDate: ""
    })
    setShowModal(true)
  }, [])

  const resetForm = useCallback(() => {
    setRegistrationForm({
      status: "",
      applicationNumber: "",
      applicationDate: ""
    })
    setFormErrors({
      status: "",
      applicationNumber: "",
      applicationDate: ""
    })
  }, [])

  const closeModal = useCallback(() => {
    setShowModal(false)
    setSelectedRecord(null)
    resetForm()
  }, [resetForm])

  const handleSubmit = async () => {
    // Validation checks
    const errors = {}
    if (!registrationForm.status) {
      errors.status = "Status is required"
    } else if (registrationForm.status === "Yes") {
      if (!registrationForm.applicationNumber.trim()) {
        errors.applicationNumber = "Application Number is required"
      }
      if (!registrationForm.applicationDate) {
        errors.applicationDate = "Application Date is required"
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const isHistoryRecord = !!selectedRecord.actual
      let updatePayload = {}

      if (isHistoryRecord) {
        // Do not overwrite actual timestamp while editing history records
        if (registrationForm.status === "Yes") {
          updatePayload = {
            status: "Yes",
            application_number: registrationForm.applicationNumber || null,
            application_date: registrationForm.applicationDate || null
          }
        } else {
          updatePayload = {
            status: "No",
            application_number: null,
            application_date: null
          }
        }
      } else {
        // Pending records: actual = current timestamp
        if (registrationForm.status === "Yes") {
          updatePayload = {
            status: "Yes",
            application_number: registrationForm.applicationNumber || null,
            application_date: registrationForm.applicationDate || null,
            actual: new Date().toISOString()
          }
        } else {
          updatePayload = {
            status: "No",
            application_number: null,
            application_date: null,
            actual: new Date().toISOString()
          }
        }
      }

      const { error: updateError } = await supabase
        .from("registration")
        .update(updatePayload)
        .eq("enquiry_number", selectedRecord.enquiryNumber)

      if (updateError) throw updateError

      setSuccessMessage(`Registration updated successfully for ${selectedRecord.enquiryNumber}`)
      closeModal()
      fetchData()

      setTimeout(() => setSuccessMessage(""), 4000)
    } catch (err) {
      console.error("Error submitting registration details:", err)
      alert("Submission failed: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderDelayBadge = (delayVal) => {
    if (!delayVal) return "—"
    const numericDelay = parseInt(delayVal, 10)
    if (isNaN(numericDelay)) return <span>{delayVal}</span>

    if (numericDelay > 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">
          {numericDelay} days
        </span>
      )
    } else {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-600">
          0 Day
        </span>
      )
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
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
              placeholder={showHistory ? "Search history..." : "Search pending records..."}
              value={searchTerm}
              onChange={handleSearch}
              className="pl-9 pr-4 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-80"
            />
          </div>
        </div>

        {/* Section Toggle Buttons */}
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => toggleSection("pending")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              !showHistory
                ? "border-blue-500 text-blue-600 bg-blue-50/50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Pending ({filteredPendingData.length})
            </div>
          </button>
          <button
            onClick={() => toggleSection("history")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              showHistory
                ? "border-blue-500 text-blue-600 bg-blue-50/50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center">
              <History className="h-4 w-4 mr-2" />
              History ({filteredHistoryData.length})
            </div>
          </button>
        </div>

        {/* Success Message Banner */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-emerald-500" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage("")} className="text-emerald-500 hover:text-emerald-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Main List Container */}
        <div className="rounded-xl border border-blue-100 shadow-xs bg-white overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3"></div>
              <p className="text-blue-600 text-sm">Loading registrations...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-6 rounded-md text-red-800 text-center text-sm border border-red-100">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p>{error}</p>
              <button className="underline mt-2 font-medium text-red-600 hover:text-red-800" onClick={fetchData}>
                Retry Fetching
              </button>
            </div>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: "65vh" }}>
              <table className="min-w-full divide-y divide-gray-200 text-center">
                <thead className="bg-gray-50 sticky top-0 z-10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {showHistory ? (
                    <tr>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Enquiry Number</th>
                      <th className="px-3 py-3">Beneficiary Name</th>
                      <th className="px-3 py-3">Contact Number</th>
                      <th className="px-3 py-3">Address</th>
                      <th className="px-3 py-3">Village</th>
                      <th className="px-3 py-3">District</th>
                      <th className="px-3 py-3">Application Number</th>
                      <th className="px-3 py-3">Application Date</th>
                      <th className="px-3 py-3">Actual Date</th>
                      <th className="px-3 py-3">Delay</th>
                      <th className="px-3 py-3">Action</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-3 py-3">Action</th>
                     
                      <th className="px-3 py-3">Enquiry Number</th>
                      <th className="px-3 py-3">Beneficiary Name</th>
                      <th className="px-3 py-3">Contact Number</th>
                      <th className="px-3 py-3">Address</th>
                      <th className="px-3 py-3">Village / Block</th>
                      <th className="px-3 py-3">District</th>
                  
                    </tr>
                  )}
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-xs text-gray-600">
                  {showHistory ? (
                    filteredHistoryData.length > 0 ? (
                      filteredHistoryData.map((record) => (
                        <tr key={record._id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-3 py-3 font-semibold text-gray-900">{record.enquiryNumber}</td>
                          <td className="px-3 py-3 font-medium text-gray-900">{record.beneficiaryName}</td>
                          <td className="px-3 py-3">{record.contactNumber || "—"}</td>
                          <td className="px-3 py-3 max-w-xs truncate" title={record.address}>{record.address || "—"}</td>
                          <td className="px-3 py-3">{record.villageBlock || "—"}</td>
                          <td className="px-3 py-3">{record.district || "—"}</td>
                          <td className="px-3 py-3 font-mono">{record.applicationNumber || "—"}</td>
                          <td className="px-3 py-3">
                            {record.applicationDate ? new Date(record.applicationDate).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-3 py-3">
                            {record.actual ? new Date(record.actual).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-3 py-3">
                            {renderDelayBadge(record.delay)}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              onClick={() => handleEdit(record)}
                              className="inline-flex items-center px-2 py-1 border border-blue-200 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={12} className="py-8 text-center text-gray-400">No Registration History</td>
                      </tr>
                    )
                  ) : (
                    filteredPendingData.length > 0 ? (
                      filteredPendingData.map((record) => (
                        <tr key={record._id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-3 py-3">
                            <button
                              onClick={() => handleEdit(record)}
                              className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-medium rounded-md text-white hover:from-blue-700 hover:to-indigo-700 shadow-xs transition-all"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Update
                            </button>
                          </td>
                          <td className="px-3 py-3 font-semibold text-gray-900">{record.enquiryNumber}</td>
                          <td className="px-3 py-3 font-medium text-gray-900">{record.beneficiaryName}</td>
                          <td className="px-3 py-3">{record.contactNumber || "—"}</td>
                          <td className="px-3 py-3 max-w-xs truncate" title={record.address}>{record.address || "—"}</td>
                          <td className="px-3 py-3">{record.villageBlock || "—"}</td>
                          <td className="px-3 py-3">{record.district || "—"}</td>
                          
                          
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-gray-400">No Pending Registration</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && selectedRecord && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 transform transition-all scale-100">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="font-bold text-lg">Registration Details</h3>
                  <p className="text-xs text-blue-100 mt-0.5">Enquiry: {selectedRecord.enquiryNumber}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-full p-1.5 bg-white/10 hover:bg-white/20 transition-all text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm text-gray-700">
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-gray-400">Beneficiary Name</span>
                    <span className="text-xs font-semibold text-gray-800">{selectedRecord.beneficiaryName || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-gray-400">Contact Number</span>
                    <span className="text-xs font-semibold text-gray-800">{selectedRecord.contactNumber || "—"}</span>
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Registration Status
                  </label>
                  <select
                    value={registrationForm.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select Status</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  {formErrors.status && (
                    <p className="text-[10px] text-red-500 mt-0.5">{formErrors.status}</p>
                  )}
                </div>

                {/* Conditional Fields: Application Number and Date */}
                {registrationForm.status === "Yes" && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">
                        Application Number
                      </label>
                      <input
                        type="text"
                        value={registrationForm.applicationNumber}
                        onChange={(e) => handleInputChange("applicationNumber", e.target.value)}
                        placeholder="Enter Application Number"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {formErrors.applicationNumber && (
                        <p className="text-[10px] text-red-500 mt-0.5">{formErrors.applicationNumber}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">
                        Application Date
                      </label>
                      <input
                        type="date"
                        value={registrationForm.applicationDate}
                        onChange={(e) => handleInputChange("applicationDate", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {formErrors.applicationDate && (
                        <p className="text-[10px] text-red-500 mt-0.5">{formErrors.applicationDate}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 py-1.5 px-4 text-xs font-medium text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-1.5 px-4 text-xs font-semibold text-white hover:from-blue-700 hover:to-indigo-700 shadow-xs focus:outline-none disabled:opacity-55 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

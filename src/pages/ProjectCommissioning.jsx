"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, X, Search, History, MapPin, Users, Phone, Eye, Package, Calendar, Edit, Upload, UserCheck } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

const CONFIG = {
  PAGE_CONFIG: {
    title: "Project Synchronisation",
    historyTitle: "Project Synchronisation History",
    description: "Manage pending project synchronisation records",
    historyDescription: "View completed project synchronisation records",
  },
}

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

function ProjectCommissionPage() {
  const [pendingData, setPendingData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [dropdownOptions, setDropdownOptions] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showCommissionModal, setShowCommissionModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [commissionForm, setCommissionForm] = useState({
    projectCommission: "",
    date: "",
    rbpStaffName: "",
    staffContactNumber: "",
    cspdclMomFile: null,
    certificateFile: null,
  })

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const formatDate = useCallback((dateString) => {
    if (!dateString) return ""
    if (typeof dateString === "string" && dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) return dateString

    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }, [])

  const formatDateForInput = useCallback((dateString) => {
    if (!dateString) return ""
    const str = String(dateString)

    if (str.includes("/")) {
      const parts = str.split("/")
      if (parts.length === 3) {
        const [day, month, year] = parts
        if (parseInt(year) === 1970 || parseInt(year) < 1971) return ""
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      }
    }

    const date = new Date(str)
    if (!isNaN(date.getTime())) {
      if (date.getFullYear() === 1970 || date.getFullYear() < 1971) return ""
      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const year = date.getFullYear()
      return `${year}-${month}-${day}`
    }

    return ""
  }, [])

  const isEmpty = useCallback((value) => {
    return value === null || value === undefined || (typeof value === "string" && value.trim() === "")
  }, [])

  const fetchDropdownOptions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("dropdown")
        .select("stage")

      if (error) throw error

      const options = data
        .map(item => item.stage)
        .filter(val => !isEmpty(val))

      setDropdownOptions(options)
    } catch (error) {
      console.error("Error fetching dropdown:", error)
      setDropdownOptions([])
    }
  }, [isEmpty])

  const fetchSheetData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      await fetchDropdownOptions()

      const { data, error } = await supabase
        .from("project_commissions")
        .select(`
          *,
          enquiries!left (
            beneficiary_name,
            address,
            contact_number
          )
        `)
        .not("planned", "is", null)

      if (error) throw error

      const pending = []
      const history = []
      const rows = data || []

      rows.forEach((row) => {
        const enq = row.enquiries || {}

        const rowData = {
          _id: row.id,
          _enquiryNumber: row.enquiry_number,

          enquiryNumber: row.enquiry_number || "",
          beneficiaryName: enq.beneficiary_name || "",
          address: enq.address || "",
          contactNumber: enq.contact_number || "",

          cspdclMom: row.cspdcl_mom || "",
          projectCommissionCertificate: row.project_commission_certificate || "",
          rbpStaffName: row.rbp_staff_name || "",
          staffContactNumber: row.staff_contact_number || "",

          projectCommission: row.status || "",
          date: formatDate(row.date || ""),
          rawDate: row.date || "",
          actualDate: row.actual || "",
          delay: row.delay || "",
        }

        if (isEmpty(row.actual)) {
          pending.push(rowData)
        } else {
          history.push(rowData)
        }
      })

      setPendingData(pending)
      setHistoryData(history)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load Project Synchronisation data: " + error.message)
      setLoading(false)
    }
  }, [isEmpty, fetchDropdownOptions, formatDate])

  useEffect(() => {
    fetchSheetData()
  }, [fetchSheetData])

  const filteredPendingData = useMemo(() => {
    return debouncedSearchTerm
      ? pendingData.filter((record) =>
        Object.values(record).some(
          (value) => value && value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
        ),
      )
      : pendingData
  }, [pendingData, debouncedSearchTerm])

  const filteredHistoryData = useMemo(() => {
    return debouncedSearchTerm
      ? historyData.filter((record) =>
        Object.values(record).some(
          (value) => value && value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
        ),
      )
      : historyData
  }, [historyData, debouncedSearchTerm])

  const handleCommissionClick = useCallback(
    (record) => {
      setSelectedRecord(record)
      setCommissionForm({
        projectCommission: record.projectCommission || "",
        date: formatDateForInput(record.rawDate || record.date || ""),
        rbpStaffName: record.rbpStaffName || "",
        staffContactNumber: record.staffContactNumber || "",
        cspdclMomFile: null,
        certificateFile: null,
      })
      setShowCommissionModal(true)
    },
    [formatDateForInput],
  )

  const uploadDocumentFile = async (file, folderName) => {
    if (!file || !(file instanceof File)) return null
    const fileExt = file.name.split(".").pop()
    const fileName = `${selectedRecord.enquiryNumber}_${folderName}_${Date.now()}.${fileExt}`
    const filePath = `project_commission/${fileName}`

    const { error: uploadErr } = await supabase.storage
      .from("IP_assignment")
      .upload(filePath, file)

    if (uploadErr) throw uploadErr

    const { data: publicData } = supabase.storage
      .from("IP_assignment")
      .getPublicUrl(filePath)

    return publicData.publicUrl
  }

  const handleCommissionSubmit = async () => {
    if (!commissionForm.projectCommission) {
      alert("Please select status")
      return
    }

    setIsSubmitting(true)

    try {
      const status = commissionForm.projectCommission

      let cspdclMomUrl = selectedRecord.cspdclMom || null
      if (commissionForm.cspdclMomFile) {
        cspdclMomUrl = await uploadDocumentFile(commissionForm.cspdclMomFile, "cspdcl_mom")
      }

      let certificateUrl = selectedRecord.projectCommissionCertificate || null
      if (commissionForm.certificateFile) {
        certificateUrl = await uploadDocumentFile(commissionForm.certificateFile, "certificate")
      }

      const actualDate =
        status === "Done"
          ? (selectedRecord.actualDate || new Date().toISOString())
          : null

      const { error } = await supabase
        .from("project_commissions")
        .update({
          status: status,
          date: commissionForm.date || null,
          actual: actualDate,
          cspdcl_mom: cspdclMomUrl,
          project_commission_certificate: certificateUrl,
          rbp_staff_name: commissionForm.rbpStaffName || null,
          staff_contact_number: commissionForm.staffContactNumber || null,
        })
        .eq("enquiry_number", selectedRecord._enquiryNumber || selectedRecord.enquiryNumber)

      if (error) throw error

      setShowCommissionModal(false)
      setSuccessMessage("Project Synchronisation updated successfully")

      fetchSheetData()

      setTimeout(() => setSuccessMessage(""), 3000)

    } catch (error) {
      console.error(error)
      alert("Update failed: " + error.message)
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
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-xl font-bold tracking-tight text-blue-700">{CONFIG.PAGE_CONFIG.title}</h1>
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={showHistory ? "Search history..." : "Search pending records..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section Toggle Buttons */}
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => toggleSection("pending")}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${!showHistory
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            <div className="flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Pending Commission ({filteredPendingData.length})
            </div>
          </button>
          <button
            onClick={() => toggleSection("history")}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${showHistory
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            <div className="flex items-center">
              <History className="h-4 w-4 mr-2" />
              Commission History ({filteredHistoryData.length})
            </div>
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md flex items-center justify-between text-sm">
            <div className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              {successMessage}
            </div>
            <button onClick={() => setSuccessMessage("")} className="text-green-500 hover:text-green-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Table Container */}
        <div className="rounded-lg border border-blue-200 shadow-md bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-3">
            <h2 className="text-blue-700 font-medium flex items-center text-sm">
              {showHistory ? (
                <>
                  <History className="h-4 w-4 mr-2" />
                  Completed Project Commission
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Pending Project Commission
                </>
              )}
            </h2>
            <p className="text-blue-600 text-xs">
              {showHistory ? CONFIG.PAGE_CONFIG.historyDescription : CONFIG.PAGE_CONFIG.description}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-blue-600 text-sm">Loading project synchronisation data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-800 text-center text-sm">
              {error}{" "}
              <button className="underline ml-2" onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: "60vh" }}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CSPDCL MoM
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project Commission Certificate
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RBP Staff Name
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Contact Number
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enquiry Number
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Beneficiary Name
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Number Of Beneficiary
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {showHistory ? (
                    filteredHistoryData.length > 0 ? (
                      filteredHistoryData.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50">
                          <td className="px-3 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleCommissionClick(record)}
                              className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center shadow-xs transition-colors"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Action
                            </button>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                              {record.projectCommission || "Done"}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">
                            {record.date || "—"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {record.cspdclMom ? (
                              <a
                                href={record.cspdclMom}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center text-xs font-medium"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View MoM
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {record.projectCommissionCertificate ? (
                              <a
                                href={record.projectCommissionCertificate}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center text-xs font-medium"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View Certificate
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 font-medium">
                            {record.rbpStaffName || "—"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">
                            {record.staffContactNumber || "—"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                            {record.enquiryNumber || "—"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900 flex items-center">
                              <Users className="h-3 w-3 mr-1 text-gray-400" />
                              {record.beneficiaryName || "—"}
                            </div>
                          </td>
                          <td className="px-3 py-3 max-w-xs">
                            <div className="text-xs text-gray-900 truncate flex items-center" title={record.address}>
                              <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                              {record.address || "—"}
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900 flex items-center">
                              <Phone className="h-3 w-3 mr-1 text-gray-400" />
                              {record.contactNumber || "—"}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={11} className="px-4 py-8 text-center text-gray-500 text-sm">
                          {searchTerm
                            ? "No history records matching your search"
                            : "No completed project synchronisation found"}
                        </td>
                      </tr>
                    )
                  ) : filteredPendingData.length > 0 ? (
                    filteredPendingData.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleCommissionClick(record)}
                            className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center shadow-xs transition-colors"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Action
                          </button>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                            record.projectCommission === "Done" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {record.projectCommission || "Pending"}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">
                          {record.date || "—"}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {record.cspdclMom ? (
                            <a
                              href={record.cspdclMom}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center text-xs font-medium"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View MoM
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {record.projectCommissionCertificate ? (
                            <a
                              href={record.projectCommissionCertificate}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center text-xs font-medium"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View Certificate
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 font-medium">
                          {record.rbpStaffName || "—"}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">
                          {record.staffContactNumber || "—"}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs font-medium text-blue-900">
                          {record.enquiryNumber || "—"}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900 flex items-center">
                            <Users className="h-3 w-3 mr-1 text-gray-400" />
                            {record.beneficiaryName || "—"}
                          </div>
                        </td>
                        <td className="px-3 py-3 max-w-xs">
                          <div className="text-xs text-gray-900 truncate flex items-center" title={record.address}>
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            {record.address || "—"}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900 flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            {record.contactNumber || "—"}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-gray-500 text-sm">
                        {searchTerm
                          ? "No pending project synchronisation matching your search"
                          : "No pending project synchronisation found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Commission Action Modal */}
      {showCommissionModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative bg-white rounded-xl text-left overflow-hidden shadow-2xl max-w-lg w-full p-6 border border-gray-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Project Commissioning Action
                  </h3>
                  <p className="text-xs text-blue-600 font-medium">
                    Enquiry No: {selectedRecord.enquiryNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCommissionModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <div className="space-y-4">
              {/* Status Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={commissionForm.projectCommission}
                  onChange={(e) => setCommissionForm({ ...commissionForm, projectCommission: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">Select Status</option>
                  <option value="Done">Done</option>
                  <option value="Pending">Pending</option>
                  {dropdownOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Commission Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Commission Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <input
                    type="date"
                    value={commissionForm.date}
                    onChange={(e) => setCommissionForm({ ...commissionForm, date: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* RBP Staff Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  RBP Staff Name
                </label>
                <input
                  type="text"
                  placeholder="Enter RBP Staff Name"
                  value={commissionForm.rbpStaffName}
                  onChange={(e) => setCommissionForm({ ...commissionForm, rbpStaffName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Staff Contact Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Staff Contact Number
                </label>
                <input
                  type="text"
                  placeholder="Enter Staff Contact Number"
                  value={commissionForm.staffContactNumber}
                  onChange={(e) => setCommissionForm({ ...commissionForm, staffContactNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* CSPDCL MoM Document */}
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  CSPDCL MoM
                </label>
                {selectedRecord.cspdclMom && (
                  <div className="mb-2 text-xs text-blue-600 flex items-center bg-blue-50 p-2 rounded border border-blue-100">
                    <Eye className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                    <a href={selectedRecord.cspdclMom} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800 truncate">
                      View Existing CSPDCL MoM
                    </a>
                  </div>
                )}
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setCommissionForm({ ...commissionForm, cspdclMomFile: e.target.files[0] })}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
              </div>

              {/* Project Commission Certificate */}
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Project Commission Certificate
                </label>
                {selectedRecord.projectCommissionCertificate && (
                  <div className="mb-2 text-xs text-blue-600 flex items-center bg-blue-50 p-2 rounded border border-blue-100">
                    <Eye className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                    <a href={selectedRecord.projectCommissionCertificate} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800 truncate">
                      View Existing Certificate
                    </a>
                  </div>
                )}
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setCommissionForm({ ...commissionForm, certificateFile: e.target.files[0] })}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCommissionModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommissionSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default ProjectCommissionPage

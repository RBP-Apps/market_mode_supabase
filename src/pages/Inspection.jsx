"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, X, Search, History, MapPin, Users, Phone, Eye, ClipboardCheck, Calendar, Wrench } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"


// Updated Configuration object
const CONFIG = {
  // Updated Apps Script URL
  APPS_SCRIPT_URL:
    "https://script.google.com/macros/s/AKfycbzF4JjwpmtgsurRYkORyZvQPvRGc06VuBMCJM00wFbOOtVsSyFiUJx5xtb1J0P5ooyf/exec",
  // Updated Google Sheets ID
  SHEET_ID: "1Kp9eEqtQfesdie6l7XEuTZne6Md8_P8qzKfGFcHhpL4",
  // Sheet names
  SOURCE_SHEET_NAME: "FMS",
  DROPDOWN_SHEET_NAME: "Drop-Down Value",
  // Page configuration
  PAGE_CONFIG: {
    title: "Inspection",
    historyTitle: "Inspection History",
    description: "Manage pending inspection records",
    historyDescription: "View completed inspection records",
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

function InspectionPage() {
  const [pendingData, setPendingData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [dropdownOptions, setDropdownOptions] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")
  const [selectedRows, setSelectedRows] = useState({})
  const [statusValues, setStatusValues] = useState({})
  const [dateValues, setDateValues] = useState({})
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [inspectionForm, setInspectionForm] = useState({
    inspection: "",
    date: "",
    remarks: "",
  })
  const [remarksValues, setRemarksValues] = useState({})

  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const formatTimestamp = useCallback(() => {
    const now = new Date()
    const day = now.getDate().toString().padStart(2, "0")
    const month = (now.getMonth() + 1).toString().padStart(2, "0")
    const year = now.getFullYear()
    const hours = now.getHours().toString().padStart(2, "0")
    const minutes = now.getMinutes().toString().padStart(2, "0")
    const seconds = now.getSeconds().toString().padStart(2, "0")
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  }, [])

  const formatDate = useCallback((dateString) => {
    if (!dateString) return ""
    // If it's already in DD/MM/YYYY format, return it
    if (typeof dateString === "string" && dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) return dateString

    const date = new Date(dateString)
    if (isNaN(date.getTime()) || date.getFullYear() === 1970) return ""

    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }, [])

  const formatDateForInput = useCallback((dateString) => {
    if (!dateString) return ""
    const str = String(dateString)
    // extended logic to handle DD/MM/YYYY
    if (str.includes("/")) {
      const [day, month, year] = str.split("/")
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    }
    return str
  }, [])

  const isEmpty = useCallback((value) => {
    return value === null || value === undefined || (typeof value === "string" && value.trim() === "")
  }, [])

  useEffect(() => {
    const role = sessionStorage.getItem("role")
    const user = sessionStorage.getItem("username")
    setUserRole(role || "")
    setUsername(user || "")
  }, [])

  // Fetch dropdown options from "Drop-Down Value" sheet Column H2:H
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
    console.error("Error fetching dropdown options:", error)
    setDropdownOptions([])
  }
}, [isEmpty])



  // Fetch data from FMS sheet starting from row 7
const fetchSheetData = useCallback(async () => {
  try {
    setLoading(true)
    setError(null)

    await fetchDropdownOptions()

    const { data, error } = await supabase
      .from("fms")
      .select("*")
      .not("enquiry_number", "is", null)

    if (error) throw error

    const pending = []
    const history = []

    data.forEach((row) => {
      const rowData = {
        _id: `enquiry_${row.enquiry_number}`,
        _enquiryNumber: row.enquiry_number,

        enquiryNumber: row.enquiry_number || "",
        beneficiaryName: row.beneficiary_name || "",
        address: row.address || "",
        contactNumber: row.contact_number || "",
        surveyorName: row.surveyor_name || "",

        powerPurchaseAgreement: row.power_purchase_agreement || "",
        vendorConsumerAgreement: row.vendor_consumer_agreement || "",
        quotationCopy: row.quotation_copy || "",
        applicationCopy: row.application_copy || "",
        electricityBill: row.electricity_bill_doc || "",
        witnessIdProof: row.witness_id_proof || "",

        inspection: row.status_12 || "",
        date: formatDate(row.actual_12 || ""),
        remarks: row.remark_12 || "",
        actual: row.actual_12 || "",
      }

      // ✅ SAME LOGIC (Pending / History)
      if (isEmpty(row.actual_12)) {
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
    setError("Failed to load Inspection data: " + error.message)
    setLoading(false)
  }
}, [isEmpty, fetchDropdownOptions, formatDate])




  useEffect(() => {
    fetchSheetData()
  }, [fetchSheetData])

  // Initialize status and date values with existing data
  useEffect(() => {
    const initialStatusValues = {}
    const initialDateValues = {}
    const initialRemarksValues = {}
    const allRecords = [...pendingData, ...historyData]

    allRecords.forEach((record) => {
      if (record.inspection && record.inspection !== "") {
        initialStatusValues[record._id] = record.inspection
      }
      if (record.date && record.date !== "") {
        initialDateValues[record._id] = formatDateForInput(record.date)
      }
      if (record.remarks && record.remarks !== "") {
        initialRemarksValues[record._id] = record.remarks
      }
    })

    setStatusValues(initialStatusValues)
    setDateValues(initialDateValues)
    setRemarksValues(initialRemarksValues)
  }, [pendingData, historyData, formatDateForInput])

  // Optimized filtered data with debounced search
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

  const handleRowSelection = useCallback((recordId, isChecked) => {
    setSelectedRows((prev) => ({
      ...prev,
      [recordId]: isChecked,
    }))
  }, [])

  const handleStatusChange = useCallback((recordId, status) => {
    setStatusValues((prev) => ({
      ...prev,
      [recordId]: status,
    }))
    // Clear date if status is not "Done"
    if (status !== "Done") {
      setDateValues((prev) => ({
        ...prev,
        [recordId]: "",
      }))
    }
  }, [])

  const handleDateChange = useCallback((recordId, date) => {
    setDateValues((prev) => ({
      ...prev,
      [recordId]: date,
    }))
  }, [])

  const handleRemarksChange = useCallback((recordId, remarks) => {
    setRemarksValues((prev) => ({
      ...prev,
      [recordId]: remarks,
    }))
  }, [])

  const handleInspectionClick = useCallback(
    (record) => {
      setSelectedRecord(record)
      setInspectionForm({
        inspection: record.inspection || "",
        date: formatDateForInput(record.date || ""),
        remarks: record.remarks || "",
      })
      setShowInspectionModal(true)
    },
    [formatDateForInput],
  )

const handleInspectionSubmit = async () => {
  if (!inspectionForm.inspection) {
    alert("Please select Inspection Status")
    return
  }

  if (inspectionForm.inspection === "Done" && !inspectionForm.date) {
    alert("Please select Inspection Date")
    return
  }

  setIsSubmitting(true)

  try {
    const status = inspectionForm.inspection
    const actualDate = status === "Done"
      ? (selectedRecord.actual || new Date().toISOString())
      : null

    const { error } = await supabase
      .from("fms")
      .update({
        status_12: status,
        actual_12: actualDate,
        remark_12: inspectionForm.remarks || "",
      })
      .eq("enquiry_number", selectedRecord._enquiryNumber)

    if (error) throw error

    const updatedRecord = {
      ...selectedRecord,
      inspection: status,
      date: inspectionForm.date,
      remarks: inspectionForm.remarks,
      actual: actualDate,
    }

    if (status === "Done") {
      setPendingData((prev) => prev.filter((r) => r._id !== selectedRecord._id))
      setHistoryData((prev) => [updatedRecord, ...prev])
    } else {
      setHistoryData((prev) => prev.filter((r) => r._id !== selectedRecord._id))
      setPendingData((prev) => [updatedRecord, ...prev])
    }

    setShowInspectionModal(false)
    setSuccessMessage("Inspection updated successfully")

    setTimeout(() => setSuccessMessage(""), 3000)

  } catch (error) {
    console.error("Error updating inspection:", error)
    alert("Failed to update inspection: " + error.message)
  } finally {
    setIsSubmitting(false)
  }
}


const handleSubmit = async () => {
  const selectedRecordIds = Object.keys(selectedRows).filter((id) => selectedRows[id])

  if (selectedRecordIds.length === 0) {
    alert("Please select at least one record to submit")
    return
  }

  setIsSubmitting(true)

  try {
    const updatePromises = selectedRecordIds.map(async (recordId) => {
      const record =
        pendingData.find((r) => r._id === recordId) ||
        historyData.find((r) => r._id === recordId)

      if (!record) return

      const status = statusValues[recordId] || record.inspection
      const selectedDate = dateValues[recordId]

      const actualDate = status === "Done"
        ? new Date().toISOString()
        : null

      return supabase
        .from("fms")
        .update({
          status_12: status,
          actual_12: actualDate,
          remark_12: remarksValues[recordId] || "",
        })
        .eq("enquiry_number", record._enquiryNumber)
    })

    await Promise.all(updatePromises)

    setSuccessMessage(`Successfully updated ${selectedRecordIds.length} record(s)`)

    fetchSheetData() // refresh

    setSelectedRows({})
    setStatusValues({})
    setDateValues({})
    setRemarksValues({})

    setTimeout(() => setSuccessMessage(""), 3000)

  } catch (error) {
    console.error("Error updating:", error)
    alert("Failed to update: " + error.message)
  } finally {
    setIsSubmitting(false)
  }
}




  const toggleSection = useCallback((section) => {
    setShowHistory(section === "history")
    setSearchTerm("")
    setSelectedRows({})
    setStatusValues({})
    setDateValues({})
    setRemarksValues({})
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
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Pending Inspection ({filteredPendingData.length})
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
              Inspection History ({filteredHistoryData.length})
            </div>
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              {successMessage}
            </div>
            <button onClick={() => setSuccessMessage("")} className="text-green-500 hover:text-green-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Submit Button for Pending Section */}
        {Object.values(selectedRows).some(Boolean) && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 text-sm">
                {Object.values(selectedRows).filter(Boolean).length} record(s) selected
              </span>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-linear-to-r from-green-500 to-blue-600 text-white rounded-md hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Submit Inspection
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Table Container with Fixed Height */}
        <div className="rounded-lg border border-blue-200 shadow-md bg-white overflow-hidden">
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-3">
            <h2 className="text-blue-700 font-medium flex items-center text-sm">
              {showHistory ? (
                <>
                  <History className="h-4 w-4 mr-2" />
                  Completed Inspection
                </>
              ) : (
                <>
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Pending Inspection
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
              <p className="text-blue-600 text-sm">Loading inspection data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-800 text-center text-sm">
              {error}{" "}
              <button className="underline ml-2" onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          ) : (
            /* Table with Fixed Height and Scrolling */
            <div className="overflow-auto" style={{ maxHeight: "60vh" }}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enquiry Number
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Beneficiary Name
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Number Of Beneficiary
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Surveyor Name
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Power Purchase Agreement
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor Consumer Agreement
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quotation Copy
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application Copy
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Electricity Bill
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Witness Id Proof
                    </th>

                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {showHistory ? (
                    filteredHistoryData.length > 0 ? (
                      filteredHistoryData.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50">
                          <td className="px-2 py-3 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedRows[record._id] || false}
                              onChange={(e) => handleRowSelection(record._id, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <select
                              value={statusValues[record._id] || record.inspection || "Select"}
                              onChange={(e) => handleStatusChange(record._id, e.target.value)}
                              disabled={!selectedRows[record._id]}
                              className="text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <option value="Select">Select</option>
                              {dropdownOptions.map((option, index) => (
                                <option key={index} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="relative">
                              <input
                                type="date"
                                value={dateValues[record._id] || formatDateForInput(record.date) || ""}
                                onChange={(e) => handleDateChange(record._id, e.target.value)}
                                disabled={!selectedRows[record._id] || statusValues[record._id] !== "Done"}
                                className="text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed pl-8 w-32"
                              />
                              <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            <textarea
                              value={remarksValues[record._id] || record.remarks || ""}
                              onChange={(e) => {
                                handleRemarksChange(record._id, e.target.value)
                                e.target.style.height = "auto"
                                e.target.style.height = e.target.scrollHeight + "px"
                              }}
                              disabled={!selectedRows[record._id]}
                              placeholder="Enter remarks"
                              rows={1}
                              className="text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed w-48 px-2 py-1 resize-none overflow-hidden block"
                            />
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs font-medium text-gray-900">{record.enquiryNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900 flex items-center">
                              <Users className="h-3 w-3 mr-1 text-gray-400" />
                              {record.beneficiaryName || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 max-w-xs">
                            <div className="text-xs text-gray-900 truncate flex items-center" title={record.address}>
                              <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                              {record.address || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900 flex items-center">
                              <Phone className="h-3 w-3 mr-1 text-gray-400" />
                              {record.contactNumber || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.surveyorName || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            {record.powerPurchaseAgreement ? (
                              <a
                                href={record.powerPurchaseAgreement}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            {record.vendorConsumerAgreement ? (
                              <a
                                href={record.vendorConsumerAgreement}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.quotationCopy || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.applicationCopy || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.electricityBill || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.witnessIdProof || "—"}</div>
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={15} className="px-4 py-8 text-center text-gray-500 text-sm">
                          {searchTerm ? "No history records matching your search" : "No completed inspection found"}
                        </td>
                      </tr>
                    )
                  ) : filteredPendingData.length > 0 ? (
                    filteredPendingData.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-2 py-3 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedRows[record._id] || false}
                            onChange={(e) => handleRowSelection(record._id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <select
                            value={statusValues[record._id] || record.inspection || "Select"}
                            onChange={(e) => handleStatusChange(record._id, e.target.value)}
                            disabled={!selectedRows[record._id]}
                            className="text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="Select">Select</option>
                            {dropdownOptions.map((option, index) => (
                              <option key={index} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <input
                            type="date"
                            value={dateValues[record._id] || ""}
                            onChange={(e) => handleDateChange(record._id, e.target.value)}
                            disabled={!selectedRows[record._id] || statusValues[record._id] !== "Done"}
                            className="text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-2 py-3">
                          <textarea
                            value={remarksValues[record._id] || record.remarks || ""}
                            onChange={(e) => {
                              handleRemarksChange(record._id, e.target.value)
                              e.target.style.height = "auto"
                              e.target.style.height = e.target.scrollHeight + "px"
                            }}
                            disabled={!selectedRows[record._id]}
                            placeholder="Enter remarks"
                            rows={1}
                            className="text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed w-48 px-2 py-1 resize-none overflow-hidden block"
                          />
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs font-medium text-blue-900">{record.enquiryNumber || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900 flex items-center">
                            <Users className="h-3 w-3 mr-1 text-gray-400" />
                            {record.beneficiaryName || "—"}
                          </div>
                        </td>
                        <td className="px-2 py-3 max-w-xs">
                          <div className="text-xs text-gray-900 truncate flex items-center" title={record.address}>
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            {record.address || "—"}
                          </div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900 flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            {record.contactNumber || "—"}
                          </div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.surveyorName || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          {record.powerPurchaseAgreement ? (
                            <a
                              href={record.powerPurchaseAgreement}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          {record.vendorConsumerAgreement ? (
                            <a
                              href={record.vendorConsumerAgreement}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.quotationCopy || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.applicationCopy || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.electricityBill || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.witnessIdProof || "—"}</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={15} className="px-4 py-8 text-center text-gray-500 text-sm">
                        {searchTerm ? "No pending inspection matching your search" : "No pending inspection found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Inspection Modal */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ClipboardCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Edit Inspection
                    </h3>
                    <div className="mt-4 space-y-4">
                      {/* Status Dropdown */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Inspection Status</label>
                        <select
                          value={inspectionForm.inspection}
                          onChange={(e) => setInspectionForm({ ...inspectionForm, inspection: e.target.value })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="">Select Status</option>
                          {dropdownOptions.map((option, index) => (
                            <option key={index} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Date Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Inspection Date</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="date"
                            value={inspectionForm.date}
                            onChange={(e) => setInspectionForm({ ...inspectionForm, date: e.target.value })}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      {/* Remarks Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Remarks</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <textarea
                            value={inspectionForm.remarks}
                            onChange={(e) => {
                              setInspectionForm({ ...inspectionForm, remarks: e.target.value })
                              e.target.style.height = "auto"
                              e.target.style.height = e.target.scrollHeight + "px"
                            }}
                            rows={3}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2 sm:text-sm border-gray-300 rounded-md resize-none overflow-hidden"
                            placeholder="Enter inspection remarks"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleInspectionSubmit}
                  disabled={isSubmitting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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

export default InspectionPage

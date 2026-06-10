"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, X, Search, History, FileText, MapPin, Users, Phone, Eye, DollarSign, Wrench } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"
// Configuration object
const CONFIG = {

  PAGE_CONFIG: {
    title: "Follow-Up",
    historyTitle: "Follow-Up History",
    description: "Manage pending follow-up tasks",
    historyDescription: "View completed follow-up records",
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

function FollowUpPage() {
  const [pendingData, setPendingData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [stageOptions, setStageOptions] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")

  // Follow-up form state
  const [followUpForm, setFollowUpForm] = useState({
    whatDidCustomerSay: "",
    stage: "",
    nextDateOfCall: "",
    valueOfOrder: "",
  })

  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // const formatTimestamp = useCallback(() => {
  //   const now = new Date()
  //   const day = now.getDate().toString().padStart(2, "0")
  //   const month = (now.getMonth() + 1).toString().padStart(2, "0")
  //   const year = now.getFullYear()
  //   const hours = now.getHours().toString().padStart(2, "0")
  //   const minutes = now.getMinutes().toString().padStart(2, "0")
  //   const seconds = now.getSeconds().toString().padStart(2, "0")
  //   return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  // }, [])



  const formatTimestamp = useCallback(() => {
  return new Date().toISOString().split("T")[0]
}, [])




  // Normalize any date value (ISO string, Date object, etc.) to DD/MM/YYYY HH:mm:ss
  // const normalizeTimestamp = useCallback((value) => {
  //   if (!value) return ""
  //   // Already in correct DD/MM/YYYY HH:mm:ss format
  //   if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(value)) {
  //     return value
  //   }
  //   // Convert from ISO / Date object to local DD/MM/YYYY HH:mm:ss
  //   const date = new Date(value)
  //   if (isNaN(date.getTime())) return value
  //   const day = date.getDate().toString().padStart(2, "0")
  //   const month = (date.getMonth() + 1).toString().padStart(2, "0")
  //   const year = date.getFullYear()
  //   const hours = date.getHours().toString().padStart(2, "0")
  //   const minutes = date.getMinutes().toString().padStart(2, "0")
  //   const seconds = date.getSeconds().toString().padStart(2, "0")
  //   return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  // }, [])


  const normalizeTimestamp = useCallback((value) => {
  if (!value) return null

  const date = new Date(value)

  if (isNaN(date.getTime())) return null

  return date.toISOString().split("T")[0]
}, [])




  const formatDateForInput = useCallback((dateString) => {
    if (!dateString) return ""
    // Handle DD/MM/YYYY format
    if (dateString.includes("/")) {
      const [day, month, year] = dateString.split("/")
      return `${year}-${month}-${day}`
    }
    // Handle standard date string
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""

    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${year}-${month}-${day}`
  }, [])

  // const formatDateForStorage = useCallback((dateString) => {
  //   if (!dateString) return ""
  //   const date = new Date(dateString)
  //   const day = date.getDate().toString().padStart(2, "0")
  //   const month = (date.getMonth() + 1).toString().padStart(2, "0")
  //   const year = date.getFullYear()
  //   return `${day}/${month}/${year}`
  // }, [])


  const formatDateForStorage = useCallback((dateString) => {
  if (!dateString) return null

  const date = new Date(dateString)

  if (isNaN(date.getTime())) return null

  return date.toISOString().split("T")[0]
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

  // Fetch dropdown values for stage
const fetchDropdownValues = useCallback(async () => {
  try {
    const { data, error } = await supabase
      .from("dropdown")
      .select("stage")

    if (error) throw error

    // same output format (array of stage values)
    const options = data
      .map((item) => item.stage)
      .filter((val) => val && val.trim() !== "")

    setStageOptions(options)
  } catch (error) {
    console.error("Error fetching dropdown data:", error)

    // fallback same as before
    setStageOptions([
      "Order Received",
      "In Progress",
      "Completed",
      "Cancelled",
    ])
  }
}, [])



const fetchSheetData = useCallback(async () => {
  try {
    setLoading(true)
    setError(null)

    await Promise.all([
      fetchDropdownValues(),

      (async () => {
        // ✅ 1. Fetch both tables
        const [{ data: fmsData, error: fmsError }, { data: qcData, error: qcError }] =
          await Promise.all([
            supabase.from("fms").select("*"),
            supabase.from("quatation_create").select("enquiry_number, net_cost"),
          ])

        if (fmsError) throw fmsError
        if (qcError) throw qcError

        // ✅ 2. Create map for fast lookup
        const quotationMap = {}
        qcData.forEach((item) => {
          quotationMap[item.enquiry_number] = item.net_cost
        })

        const pending = []
        const history = []

        // ✅ 3. Merge data
        fmsData.forEach((row) => {
          const enquiryNumber = row.enquiry_number || ""
          if (!enquiryNumber) return

          const netCost = quotationMap[enquiryNumber] || ""

          const rowData = {
            _id: `enquiry_${enquiryNumber}_${row.id}`,
            _rowIndex: row.id,
            _enquiryNumber: enquiryNumber,

            enquiryNumber: row.enquiry_number || "",
            beneficiaryName: row.beneficiary_name || "",
            address: row.address || "",
            villageBlock: row.village_block || "",
            district: row.district || "",
            contactNumber: row.contact_number || "",
            aadharCard: row.aadhar_card || "",
            addressProof: row.address_proof || "",
            surveyorName: row.surveyor_name || "",
            surveyorContact: row.surveyor_contact || "",
            quotationNumber: row.reference_no || "",

            // ✅ MAIN CHANGE
            valueOfQuotation: netCost,

            quotationCopy: row.url || "",

            actual: row.actual_3 || "",
            whatDidCustomerSay: row.customer_feedback || "",
            stage: row.stage || "",
            nextDateOfCall: row.next_call_date || "",
            valueOfOrder: row.order_value || "",
          }

          const isColumnEmpty = !row.actual_3

          if (isColumnEmpty) {
            pending.push(rowData)
          } else {
            history.push(rowData)
          }
        })

        setPendingData(pending)
        setHistoryData(history)
        setLoading(false)
      })(),
    ])
  } catch (error) {
    console.error("Error fetching data:", error)
    setError("Failed to load Follow-Up data: " + error.message)
    setLoading(false)
  }
}, [fetchDropdownValues])


  useEffect(() => {
    fetchSheetData()
  }, [fetchSheetData])

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

  const handleFollowUpClick = useCallback((record) => {
    setSelectedRecord(record)
    setFollowUpForm({
      whatDidCustomerSay: record.whatDidCustomerSay || "",
      stage: record.stage || "",
      nextDateOfCall: formatDateForInput(record.nextDateOfCall || ""),
      valueOfOrder: record.valueOfOrder || "",
    })
    setShowFollowUpModal(true)
  }, [formatDateForInput])

  const handleInputChange = useCallback((field, value) => {
    setFollowUpForm((prev) => ({ ...prev, [field]: value }))
  }, [])

const handleFollowUpSubmit = async () => {
  if (!followUpForm.stage) {
    alert("Please select a stage")
    return
  }

  setIsSubmitting(true)

  try {
    const isEdit = !isEmpty(selectedRecord.actual)

    const actualDate = isEdit
      ? normalizeTimestamp(selectedRecord.actual)
      : formatTimestamp()

    const { error } = await supabase
      .from("fms")
      .update({
        actual_3: actualDate, // ✅ main column
        customer_feedback: followUpForm.whatDidCustomerSay,
        stage: followUpForm.stage,
        next_call_date: followUpForm.nextDateOfCall
          ? formatDateForStorage(followUpForm.nextDateOfCall)
          : null,
        order_value: followUpForm.valueOfOrder,
      })
      .eq("id", selectedRecord._rowIndex)

    if (error) throw error

    setSuccessMessage(
      `Follow-up completed successfully for Enquiry Number: ${selectedRecord.enquiryNumber}`
    )

    setShowFollowUpModal(false)

    const updatedRecord = {
      ...selectedRecord,
      actual: actualDate,
      whatDidCustomerSay: followUpForm.whatDidCustomerSay,
      stage: followUpForm.stage,
      nextDateOfCall: formatDateForStorage(followUpForm.nextDateOfCall),
      valueOfOrder: followUpForm.valueOfOrder,
    }

    if (isEdit) {
      setHistoryData((prev) =>
        prev.map((rec) =>
          rec._id === selectedRecord._id ? updatedRecord : rec
        )
      )
    } else {
      setPendingData((prev) =>
        prev.filter((rec) => rec._id !== selectedRecord._id)
      )
      setHistoryData((prev) => [updatedRecord, ...prev])
    }

    setTimeout(() => setSuccessMessage(""), 3000)
  } catch (error) {
    console.error("Error submitting follow-up:", error)
    alert("Failed to submit follow-up: " + error.message)
  } finally {
    setIsSubmitting(false)
  }
}

  const toggleSection = useCallback((section) => {
    setShowHistory(section === "history")
    setSearchTerm("")
  }, [])

  const closeFollowUpModal = useCallback(() => {
    setShowFollowUpModal(false)
    setSelectedRecord(null)
    setFollowUpForm({
      whatDidCustomerSay: "",
      stage: "",
      nextDateOfCall: "",
      valueOfOrder: "",
    })
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
                placeholder={showHistory ? "Search history..." : "Search pending follow-ups..."}
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
              <FileText className="h-4 w-4 mr-2" />
              Pending ({filteredPendingData.length})
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
              History ({filteredHistoryData.length})
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

        {/* Table Container with Fixed Height */}
        <div className="rounded-lg border border-blue-200 shadow-md bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-3">
            <h2 className="text-blue-700 font-medium flex items-center text-sm">
              {showHistory ? (
                <>
                  <History className="h-4 w-4 mr-2" />
                  {CONFIG.PAGE_CONFIG.historyTitle}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Pending Follow-Ups
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
              <p className="text-blue-600 text-sm">Loading Follow-Up data...</p>
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
                <thead className="bg-gray-50 sticky top-0 z-10 text-nowrap">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
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
                      Village/Block
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dist.
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Number
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aadhar Card
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address Proof
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Surveyor Name
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Number
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quotation Number
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value Of Quotation
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quotation Copy
                    </th>
                    {showHistory && (
                      <>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          What Did Customer Say
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stage
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value Of Order
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-center">
                  {showHistory ? (
                    filteredHistoryData.length > 0 ? (
                      filteredHistoryData.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50">
                          <td className="px-2 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleFollowUpClick(record)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                              <Wrench className="h-3 w-3 mr-1" />
                              Edit
                            </button>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs font-medium text-gray-900">{record.enquiryNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.beneficiaryName || "—"}</div>
                          </td>
                          <td className="px-2 py-3 max-w-xs">
                            <div className="text-xs text-gray-900 truncate" title={record.address}>
                              {record.address || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.villageBlock || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.district || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.contactNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.aadharCard || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            {record.addressProof ? (
                              <a
                                href={record.addressProof}
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
                            <div className="text-xs text-gray-900">{record.surveyorName || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.surveyorContact || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.quotationNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.valueOfQuotation || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            {record.quotationCopy ? (
                              <a
                                href={record.quotationCopy}
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
                          <td className="px-2 py-3 max-w-xs">
                            <div className="text-xs text-gray-900 truncate" title={record.whatDidCustomerSay}>
                              {record.whatDidCustomerSay || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {record.stage || "—"}
                            </span>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.valueOfOrder || "—"}</div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={17} className="px-4 py-8 text-center text-gray-500 text-sm">
                          {searchTerm ? "No history records matching your search" : "No completed follow-ups found"}
                        </td>
                      </tr>
                    )
                  ) : filteredPendingData.length > 0 ? (
                    filteredPendingData.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-2 py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleFollowUpClick(record)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Follow-Up
                          </button>
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
                          <div className="text-xs text-gray-900">{record.villageBlock || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.district || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900 flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            {record.contactNumber || "—"}
                          </div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.aadharCard || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          {record.addressProof ? (
                            <a
                              href={record.addressProof}
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
                          <div className="text-xs text-gray-900">{record.surveyorName || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.surveyorContact || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.quotationNumber || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900 flex items-center">
                            <DollarSign className="h-3 w-3 mr-1 text-green-500" />
                            {record.valueOfQuotation || "—"}
                          </div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          {record.quotationCopy ? (
                            <a
                              href={record.quotationCopy}
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={14} className="px-4 py-8 text-center text-gray-500 text-sm">
                        {searchTerm ? "No pending follow-ups matching your search" : "No pending follow-ups found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Follow-Up Modal */}
        {showFollowUpModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white border max-w-2xl w-full shadow-2xl rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Follow-Up Form - Enquiry: {selectedRecord.enquiryNumber}
                  </h3>
                  <button onClick={closeFollowUpModal} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2 text-sm">Beneficiary Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium">Enquiry Number:</span> {selectedRecord.enquiryNumber}
                    </div>
                    <div>
                      <span className="font-medium">Name:</span> {selectedRecord.beneficiaryName}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Address:</span> {selectedRecord.address}
                    </div>
                    <div>
                      <span className="font-medium">Contact:</span> {selectedRecord.contactNumber}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* What Did The Customer Say */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      What Did The Customer Say <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={followUpForm.whatDidCustomerSay}
                      onChange={(e) => handleInputChange("whatDidCustomerSay", e.target.value)}
                      placeholder="Enter customer feedback..."
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Stage Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stage <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={followUpForm.stage}
                      onChange={(e) => handleInputChange("stage", e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Select</option>
                      {stageOptions.map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Next Date Of Call - Hide when Order Received is selected */}
                  {followUpForm.stage !== "Order Received" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Next Date Of Call</label>
                      <input
                        type="date"
                        value={followUpForm.nextDateOfCall}
                        onChange={(e) => handleInputChange("nextDateOfCall", e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  )}

                  {/* Value Of Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value Of Order</label>
                    <input
                      type="number"
                      value={followUpForm.valueOfOrder}
                      onChange={(e) => handleInputChange("valueOfOrder", e.target.value)}
                      placeholder="Enter order value"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6 pt-3 border-t">
                  <button
                    onClick={closeFollowUpModal}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFollowUpSubmit}
                    disabled={isSubmitting || !followUpForm.stage || !followUpForm.whatDidCustomerSay}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-md hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
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

export default FollowUpPage

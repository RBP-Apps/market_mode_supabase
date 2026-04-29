"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, X, Search, History, MapPin, Users, Phone, Eye, Package, Truck } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

// Updated Configuration object
const CONFIG = {
  PAGE_CONFIG: {
    title: "Dispatch Materials",
    historyTitle: "Dispatch Materials History",
    description: "Manage pending material dispatch",
    historyDescription: "View completed material dispatch records",
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

function DispatchMaterialsPage() {
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

  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    const role = sessionStorage.getItem("role")
    const user = sessionStorage.getItem("username")
    setUserRole(role || "")
    setUsername(user || "")
  }, [])

  // Fetch dropdown options from Column H2:H
  const fetchDropdownOptions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("dropdown")
        .select("status")

      if (error) throw error

      const options = data
        .map((item) => item.status)
        .filter((val) => val && val.trim() !== "")

      setDropdownOptions(options)
    } catch (error) {
      console.error("Error fetching dropdown options:", error)
      setDropdownOptions([])
    }
  }, [])


  // // Optimized data fetching
  // const fetchSheetData = useCallback(async () => {
  //   try {
  //     setLoading(true)
  //     setError(null)

  //     await fetchDropdownOptions()

  //     const { data, error } = await supabase
  //       .from("fms")
  //       .select("*")

  //     if (error) throw error

  //     const pending = []
  //     const history = []

  //     data.forEach((row) => {
  //       const hasEnquiry = row.enquiry_number && row.enquiry_number.trim() !== ""
  //       if (!hasEnquiry) return

  //       const rowData = {
  //         _id: row.id,
  //         _rowIndex: row.id,

  //         enquiryNumber: row.enquiry_number || "",
  //         beneficiaryName: row.beneficiary_name || "",
  //         address: row.address || "",
  //         villageBlock: row.village_block || "",
  //         district: row.district || "",
  //         contactNumber: row.contact_number || "",

  //         surveyorName: row.surveyor_name || "",
  //         surveyorContact: row.surveyor_contact || "",

  //         orderCopy: row.order_copy || "",

  //         ipName: row.ip_name || "",
  //         ipContact: row.ip_contact || "",

  //         gstNumber: row.gst_number || "",
  //         gstCertificates: row.gst_certificates || "",
  //         bankAccountDetails: row.bank_account_details || "",
  //         aadharCard: row.aadhar_card || "",
  //         panCard: row.pan_card || "",
  //         workOrderNumber: row.order_value || "",
  //         workOrderCopy: row.order_copy || "",

  //         // 🔥 IMPORTANT CHANGE
  //         actual: row.actual_6 || "",
  //         dispatchMaterial: row.status_6 || "",
  //       }

  //       if (!row.actual_6) {
  //         pending.push(rowData)
  //       } else {
  //         history.push(rowData)
  //       }
  //     })

  //     setPendingData(pending)
  //     setHistoryData(history)
  //     setLoading(false)
  //   } catch (error) {
  //     console.error("Error fetching data:", error)
  //     setError("Failed to load data: " + error.message)
  //     setLoading(false)
  //   }
  // }, [fetchDropdownOptions])


  // Optimized data fetching
const fetchSheetData = useCallback(async () => {
  try {
    setLoading(true)
    setError(null)

    await fetchDropdownOptions()

    // 🔹 1. fetch fms
    const { data: fmsData, error: fmsError } = await supabase
      .from("fms")
      .select("*")

    if (fmsError) throw fmsError

    // 🔹 2. fetch quotation
    const { data: quotationData, error: quotationError } = await supabase
      .from("quatation_create")
      .select("*")

    if (quotationError) throw quotationError

    // 🔥 FAST MAP
    const quotationMap = {}
    quotationData.forEach((q) => {
      quotationMap[q.enquiry_number] = q
    })

    const pending = []
    const history = []

    fmsData.forEach((row) => {
      const hasEnquiry = row.enquiry_number && row.enquiry_number.trim() !== ""
      if (!hasEnquiry) return

      // 🔥 merge quotation
      const quotation = quotationMap[row.enquiry_number] || {}

      const rowData = {
        _id: row.id,
        _rowIndex: row.id,

        enquiryNumber: row.enquiry_number || "",
        beneficiaryName: row.beneficiary_name || "",
        address: row.address || "",
        villageBlock: row.village_block || "",
        district: row.district || "",
        contactNumber: row.contact_number || "",

        surveyorName: row.surveyor_name || "",
        surveyorContact: row.surveyor_contact || "",

        orderCopy: row.order_copy || "",

        ipName: row.ip_name || "",
        ipContact: row.ip_contact || "",

        gstNumber: row.gst_number || "",
        gstCertificates: row.gst_certificates || "",
        // bankAccountDetails: row.bank_name || "",
        aadharCard: row.aadhar_card || "",
        panCard: row.pan_card || "",
        workOrderNumber: row.order_value || "",
        workOrderCopy: row.order_copy || "",

        // 🔹 QUOTATION DATA ADD
        amount: quotation.amount || "",
        netCost: quotation.net_cost || "",
        gst: quotation.gst || "",
        rate: quotation.rate || "",
        qty: quotation.qty || "",
        quotationCopy: quotation.quatation_copy || "",
        sendStatus: quotation.send_status || "",
        quotationBank: quotation.bank_name || "",
        bankAccountDetails: quotation.bank_name || "",


        // 🔥 EXISTING LOGIC SAME
        actual: row.actual_6 || "",
        dispatchMaterial: row.status_6 || "",
      }

      if (!row.actual_6) {
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
    setError("Failed to load data: " + error.message)
    setLoading(false)
  }
}, [fetchDropdownOptions])



  useEffect(() => {
    fetchSheetData()
  }, [fetchSheetData])

  // Initialize status values with existing dispatch material values
  useEffect(() => {
    const initialStatusValues = {}
    const allRecords = [...pendingData, ...historyData]
    allRecords.forEach((record) => {
      if (record.dispatchMaterial && record.dispatchMaterial !== "") {
        initialStatusValues[record._id] = record.dispatchMaterial
      }
    })
    setStatusValues(initialStatusValues)
  }, [pendingData, historyData])

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
  }, [])

  const handleSubmit = async () => {
    console.log("🔥 handleSubmit CALLED")
    const selectedRecordIds = Object.keys(selectedRows).filter((id) => selectedRows[id])

    if (selectedRecordIds.length === 0) {
      alert("Please select at least one record to submit")
      return
    }

    const missingStatus = selectedRecordIds.filter(
      (id) => !statusValues[id] || statusValues[id] === "Select"
    )

    if (missingStatus.length > 0) {
      alert("Please select status for all selected records")
      return
    }

    console.log("selectedRows:", selectedRows)
    console.log("selectedRecordIds:", selectedRecordIds)

    setIsSubmitting(true)

    try {
      const updatePromises = selectedRecordIds.map(async (recordId) => {
        const record =
          pendingData.find((r) => r._id === Number(recordId)) ||
          historyData.find((r) => r._id === Number(recordId))

        const status = statusValues[recordId]

        if (!record) return

        let actualDate = null

        if (status === "Done") {
          actualDate = new Date().toISOString().split("T")[0]
        }

        console.log("UPDATE PAYLOAD:", {
          id: record._id,
          status_6: status,
          actual_6: actualDate,
        })

        // 🔥 SUPABASE UPDATE
        const { error } = await supabase
          .from("fms")
          .update({
            status_6: status,
            actual_6: actualDate,
          })
          .eq("enquiry_number", record.enquiryNumber)

        if (error) throw error
      })

      await Promise.all(updatePromises)

      setSuccessMessage(
        `Successfully updated ${selectedRecordIds.length} record(s)`
      )

      fetchSheetData()

      setSelectedRows({})
      setStatusValues({})

      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)
    } catch (error) {
      console.error("Error updating:", error)
      alert("Failed: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleSection = useCallback((section) => {
    setShowHistory(section === "history")
    setSearchTerm("")
    setSelectedRows({})
    setStatusValues({})
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
                placeholder={showHistory ? "Search history..." : "Search pending dispatch materials..."}
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
              Pending Dispatch ({filteredPendingData.length})
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
              Dispatch History ({filteredHistoryData.length})
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
                    <Truck className="h-4 w-4 mr-2" />
                    Submit Dispatch
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
                  Completed Material Dispatch
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Pending Material Dispatch
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
              <p className="text-blue-600 text-sm">Loading Dispatch Materials data...</p>
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
                      Status
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
                      Contact Number Of Beneficiary
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Surveyor Name
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Number
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Copy
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Name
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Number Of IP
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GST Number
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GST Certificates
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bank Account Details
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aadhar Card
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pan Card
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Order Number
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Order Copy
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
                              value={statusValues[record._id] || record.dispatchMaterial || "Select"}
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
                            <div className="text-xs text-gray-900">{record.surveyorName || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.surveyorContact || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            {record.orderCopy ? (
                              <a
                                href={record.orderCopy}
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
                            <div className="text-xs text-gray-900 font-medium text-blue-600">
                              {record.ipName || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.ipContact || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.gstNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            {record.gstCertificates ? (
                              <a
                                href={record.gstCertificates}
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
                            {/* {record.bankAccountDetails ? (
                              <a
                                href={record.bankAccountDetails}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )} */}
                            {record.bankAccountDetails || ""}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            {/* {record.aadharCard ? (
                              <a
                                href={record.aadharCard}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )} */}
                            {record.aadharCard || ""}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            {/* {record.panCard ? (
                              <a
                                href={record.panCard}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )} */}
                            {record.panCard || ""}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.workOrderNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            {record.workOrderCopy ? (
                              <a
                                href={record.workOrderCopy}
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
                        <td colSpan={21} className="px-4 py-8 text-center text-gray-500 text-sm">
                          {searchTerm
                            ? "No history records matching your search"
                            : "No completed dispatch materials found"}
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
                            value={statusValues[record._id] || record.dispatchMaterial || "Select"}
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
                          <div className="text-xs text-gray-900">{record.surveyorName || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.surveyorContact || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          {record.orderCopy ? (
                            <a
                              href={record.orderCopy}
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
                          <div className="text-xs text-gray-900 font-medium text-blue-600">{record.ipName || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.ipContact || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.gstNumber || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          {record.gstCertificates ? (
                            <a
                              href={record.gstCertificates}
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
                          {/* {record.bankAccountDetails ? (
                            <a
                              href={record.bankAccountDetails}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )} */}
                          {record.bankAccountDetails || ""}
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          {/* {record.aadharCard ? (
                            <a
                              href={record.aadharCard}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )} */}
                          {record.aadharCard || ""}
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          {/* {record.panCard ? (
                            <a
                              href={record.panCard}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )} */}
                          {record.panCard || ""}
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.workOrderNumber || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          {record.workOrderCopy ? (
                            <a
                              href={record.workOrderCopy}
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
                      <td colSpan={21} className="px-4 py-8 text-center text-gray-500 text-sm">
                        {searchTerm
                          ? "No pending dispatch materials matching your search"
                          : "No pending dispatch materials found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default DispatchMaterialsPage

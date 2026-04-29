"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, X, Search, History, MapPin, Users, Phone, Eye, DollarSign, Package, Wrench } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

// Configuration object
const CONFIG = {
  
  // Updated page configuration
  PAGE_CONFIG: {
    title: "Solarkart",
    historyTitle: "Varya History",
    description: "Manage pending orders",
    historyDescription: "View completed order records",
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

function OrderReceivePage() {
  const [pendingData, setPendingData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")

  // Order form state
  const [orderForm, setOrderForm] = useState({
    module: "",
    inverter: "",
    bos: "",
    acdb: "",
    dcdb: "",
    orderCopy: "", // Changed from null to empty string for URL storage
  })

  // Professional file upload status state
  const [fileUploads, setFileUploads] = useState({
    orderCopy: { uploading: false, uploaded: false, url: "", error: null, name: "" }
  })

  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const formatDate = useCallback((dateString) => {
    if (!dateString) return ""
    // If it's already in DD/MM/YYYY format, return it
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) return dateString

    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
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

  // Optimized data fetching
// const fetchSupabaseData = useCallback(async () => {
//   try {
//     setLoading(true)
//     setError(null)

//     const { data, error } = await supabase
//       .from("fms")
//       .select("*")
//       .not("enquiry_number", "is", null)

//     if (error) throw error

//     const pending = []
//     const history = []

//     data.forEach((row) => {
//       const record = {
//         _id: row.id,
//         _enquiryNumber: row.enquiry_number,

//         enquiryNumber: row.enquiry_number || "",
//         beneficiaryName: row.beneficiary_name || "",
//         address: row.address || "",
//         villageBlock: row.village_block || "",
//         district: row.district || "",
//         contactNumber: row.contact_number || "",

//         aadharCard: row.aadhar_card || "",
//         addressProof: row.address_proof || "",
//         surveyorName: row.surveyor_name || "",
//         surveyorContact: row.surveyor_contact || "",

//         quotationNumber: row.reference_no || "",
//         quotationValue: row.order_value || "",

//         // 🔥 IMPORTANT CHANGE
//         actualDate: row.actual_4 ? formatDate(row.actual_4) : "",

//         module: row.module || "",
//         inverter: row.inverter || "",
//         bos: row.bos || "",
//         acdb: row.acdb || "",
//         dcdb: row.dcdb || "",
//         orderCopy: row.order_copy || "",
//       }

//       // ✅ SAME LOGIC (as you said)
//       const isActualEmpty = isEmpty(row.actual_4)

//       if (isActualEmpty) {
//         pending.push(record)
//       } else {
//         history.push(record)
//       }
//     })

//     setPendingData(pending)
//     setHistoryData(history)
//     setLoading(false)
//   } catch (err) {
//     console.error("Error fetching supabase data:", err)
//     setError("Failed to load data: " + err.message)
//     setLoading(false)
//   }
// }, [isEmpty, formatDate])


const fetchSupabaseData = useCallback(async () => {
  try {
    setLoading(true)
    setError(null)

    // ✅ 1. Fetch both tables parallel
    const [{ data: fmsData, error: fmsError }, { data: qcData, error: qcError }] =
      await Promise.all([
        supabase.from("fms").select("*").not("enquiry_number", "is", null),
        supabase.from("quatation_create").select("enquiry_number, net_cost"),
      ])

    if (fmsError) throw fmsError
    if (qcError) throw qcError

    // ✅ 2. Create lookup map
    const quotationMap = {}
    qcData.forEach((item) => {
      quotationMap[item.enquiry_number] = item.net_cost
    })

    const pending = []
    const history = []

    // ✅ 3. Merge data
    fmsData.forEach((row) => {
      const enquiryNumber = row.enquiry_number || ""

      const record = {
        _id: row.id,
        _enquiryNumber: enquiryNumber,

        enquiryNumber: enquiryNumber,
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

        // ✅ MAIN CHANGE (net_cost from quatation_create)
        quotationValue: quotationMap[enquiryNumber] || "",

        actualDate: row.actual_4 ? formatDate(row.actual_4) : "",

        module: row.module || "",
        inverter: row.inverter || "",
        bos: row.bos || "",
        acdb: row.acdb || "",
        dcdb: row.dcdb || "",
        orderCopy: row.order_copy || "",
      }

      const isActualEmpty = isEmpty(row.actual_4)

      if (isActualEmpty) {
        pending.push(record)
      } else {
        history.push(record)
      }
    })

    setPendingData(pending)
    setHistoryData(history)
    setLoading(false)
  } catch (err) {
    console.error("Error fetching supabase data:", err)
    setError("Failed to load data: " + err.message)
    setLoading(false)
  }
}, [isEmpty, formatDate])



useEffect(() => {
  fetchSupabaseData()
}, [fetchSupabaseData])

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

  const fileToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }, [])

  const uploadImageToDrive = useCallback(async (file) => {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${selectedRecord._enquiryNumber}_${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from("survey_file")
      .upload(`order/${fileName}`, file)

    if (error) throw error

    const { data: publicUrlData } = supabase.storage
      .from("survey_file")
      .getPublicUrl(`order/${fileName}`)

    return publicUrlData.publicUrl
  } catch (err) {
    console.error("Upload error:", err)
    throw err
  }
}, [selectedRecord])

  const handleOrderClick = useCallback((record) => {
    setSelectedRecord(record)
    setOrderForm({
      module: record.module || "",
      inverter: record.inverter || "",
      bos: record.bos || "",
      acdb: record.acdb || "",
      dcdb: record.dcdb || "",
      orderCopy: record.orderCopy || "",
    })

    // Initialize professional upload status
    setFileUploads({
      orderCopy: {
        uploading: false,
        uploaded: !!record.orderCopy,
        url: record.orderCopy || "",
        error: null,
        name: record.orderCopy ? "Existing Order Copy" : ""
      }
    })

    setShowOrderModal(true)
  }, [])

  const handleFileUpload = useCallback(async (field, file) => {
    if (!file) return

    // Update form state (backward compatibility)
    setOrderForm((prev) => ({ ...prev, [field]: file }))

    // Start professional upload process
    setFileUploads(prev => ({
      ...prev,
      [field]: { ...prev[field], uploading: true, error: null, name: file.name }
    }))

    try {
      const url = await uploadImageToDrive(file)
      setFileUploads(prev => ({
        ...prev,
        [field]: { uploading: false, uploaded: true, url, error: null, name: file.name }
      }))
    } catch (error) {
      console.error(`Upload error for ${field}:`, error)
      setFileUploads(prev => ({
        ...prev,
        [field]: { uploading: false, uploaded: false, url: "", error: error.message, name: file.name }
      }))
    }
  }, [uploadImageToDrive])

  const UploadStatus = ({ field }) => {
    const status = fileUploads[field]
    if (!status) return null

    if (status.uploading) {
      return (
        <div className="flex items-center mt-2 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs animate-pulse">
          <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          Uploading to Drive...
        </div>
      )
    }
    if (status.error) {
      return (
        <div className="flex items-center mt-2 text-red-600 bg-red-50 px-2 py-1 rounded text-xs border border-red-100">
          <X className="h-3 w-3 mr-1" />
          Failed: {status.error}
        </div>
      )
    }
    if (status.uploaded) {
      return (
        <div className="flex items-center mt-2 text-green-600 bg-green-50 px-2 py-1 rounded text-xs border border-green-100 font-medium">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Successfully Uploaded
        </div>
      )
    }
    return null
  }

  const handleInputChange = useCallback((field, value) => {
    setOrderForm((prev) => ({ ...prev, [field]: value }))
  }, [])

const handleOrderSubmit = async () => {
  if (!orderForm.module || !orderForm.inverter) {
    alert("Please fill Module and Inverter")
    return
  }

  setIsSubmitting(true)

  try {
    const uploadingFields = Object.keys(fileUploads).filter(
      (key) => fileUploads[key].uploading
    )

    if (uploadingFields.length > 0) {
      alert("Wait for file upload")
      return
    }

    const isEdit = !isEmpty(selectedRecord.actualDate)

    const actualDate = isEdit
      ? selectedRecord.actualDate
      : new Date().toISOString()

    const orderCopyUrl = fileUploads.orderCopy.url

    // ✅ SUPABASE UPDATE
    const { error } = await supabase
      .from("fms")
      .update({
        actual_4: actualDate,
        module: orderForm.module,
        inverter: orderForm.inverter,
        bos: orderForm.bos,
        acdb: orderForm.acdb,
        dcdb: orderForm.dcdb,
        order_copy: orderCopyUrl,
      })
      .eq("enquiry_number", selectedRecord._enquiryNumber)

    if (error) throw error

    setSuccessMessage(
      `Order processed: ${selectedRecord.enquiryNumber}`
    )

    setShowOrderModal(false)

    const updatedRecord = {
      ...selectedRecord,
      actualDate: actualDate,
      module: orderForm.module,
      inverter: orderForm.inverter,
      bos: orderForm.bos,
      acdb: orderForm.acdb,
      dcdb: orderForm.dcdb,
      orderCopy: orderCopyUrl,
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
  } catch (err) {
    console.error("Submit error:", err)
    alert("Failed: " + err.message)
  } finally {
    setIsSubmitting(false)
  }
}

  const toggleSection = useCallback((section) => {
    setShowHistory(section === "history")
    setSearchTerm("")
  }, [])

  const closeOrderModal = useCallback(() => {
    setShowOrderModal(false)
    setSelectedRecord(null)
    setOrderForm({
      module: "",
      inverter: "",
      bos: "",
      acdb: "",
      dcdb: "",
      orderCopy: null,
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
                placeholder={showHistory ? "Search history..." : "Search pending orders..."}
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
              Pending Orders ({filteredPendingData.length})
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
              Order History ({filteredHistoryData.length})
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
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-3">
            <h2 className="text-blue-700 font-medium flex items-center text-sm">
              {showHistory ? (
                <>
                  <History className="h-4 w-4 mr-2" />
                  Completed Orders
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Pending Orders
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
              <p className="text-blue-600 text-sm">Loading order data...</p>
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
                      Contact Number Of Beneficiary
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
                          Module
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inverter
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          BOS
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ACDB
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          DCDB
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Copy
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
                              onClick={() => handleOrderClick(record)}
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
                            <div className="text-xs text-gray-900">{record.quotationValue || "—"}</div>
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
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.module || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.inverter || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.bos || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.acdb || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.dcdb || "—"}</div>
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
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={20} className="px-4 py-8 text-center text-gray-500 text-sm">
                          {searchTerm ? "No history records matching your search" : "No completed orders found"}
                        </td>
                      </tr>
                    )
                  ) : filteredPendingData.length > 0 ? (
                    filteredPendingData.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-2 py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleOrderClick(record)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-linear-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <Package className="h-3 w-3 mr-1" />
                            Order
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
                            {record.quotationValue || "—"}
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
                        {searchTerm ? "No pending orders matching your search" : "No pending orders found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Modal */}
        {showOrderModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white border max-w-2xl w-full shadow-2xl rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Order Form - Enquiry: {selectedRecord.enquiryNumber}
                  </h3>
                  <button onClick={closeOrderModal} className="text-gray-400 hover:text-gray-600">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Module */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Module <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={orderForm.module}
                      onChange={(e) => handleInputChange("module", e.target.value)}
                      placeholder="Enter module details"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  {/* Inverter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Inverter <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={orderForm.inverter}
                      onChange={(e) => handleInputChange("inverter", e.target.value)}
                      placeholder="Enter inverter details"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  {/* BOS */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">BOS</label>
                    <input
                      type="text"
                      value={orderForm.bos}
                      onChange={(e) => handleInputChange("bos", e.target.value)}
                      placeholder="Enter BOS details"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  {/* ACDB */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ACDB</label>
                    <input
                      type="text"
                      value={orderForm.acdb}
                      onChange={(e) => handleInputChange("acdb", e.target.value)}
                      placeholder="Enter ACDB details"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  {/* DCDB */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">DCDB</label>
                    <input
                      type="text"
                      value={orderForm.dcdb}
                      onChange={(e) => handleInputChange("dcdb", e.target.value)}
                      placeholder="Enter DCDB details"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  {/* Order Copy */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Order Copy <span className="text-gray-500 text-[10px] ml-1">(Image/PDF)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload("orderCopy", e.target.files[0])}
                      className="mt-1 block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <UploadStatus field="orderCopy" />

                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRecord?.orderCopy && (
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-gray-500 font-medium italic">Existing Order:</span>
                          <button
                            type="button"
                            onClick={() => window.open(selectedRecord.orderCopy, "_blank", "noopener,noreferrer")}
                            className="inline-flex items-center px-2 py-1 text-[10px] font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview Previous Order
                          </button>
                        </div>
                      )}

                      {selectedRecord?.quotationCopy && (
                        <div className="flex items-center space-x-2 border-l border-gray-200 pl-2">
                          <button
                            type="button"
                            onClick={() => window.open(selectedRecord.quotationCopy, "_blank", "noopener,noreferrer")}
                            className="inline-flex items-center px-2 py-1 text-[10px] font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Quotation Copy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6 pt-3 border-t">
                  <button
                    onClick={closeOrderModal}
                    disabled={isSubmitting}
                    className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOrderSubmit}
                    disabled={isSubmitting || !orderForm.module || !orderForm.inverter}
                    className="px-3 py-1 bg-linear-to-r from-green-500 to-blue-600 text-white rounded-md hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
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

export default OrderReceivePage

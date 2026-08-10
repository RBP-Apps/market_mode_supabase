"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, X, Search, History, FileText, MapPin, Users, Phone, Eye, DollarSign, Wrench, MessageCircle, Mail, Send } from "lucide-react"

// Helper for direct WhatsApp link
const sendWhatsAppDirect = (phone, text) => {
  if (!phone) {
    alert("Kripya valid WhatsApp number dalein.");
    return;
  }
  let cleanPhone = phone.toString().replace(/\D/g, "");
  if (cleanPhone.length === 10) {
    cleanPhone = "91" + cleanPhone;
  }
  const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
};

// Helper for direct Email mailto link
const sendEmailDirect = (email, subject, body) => {
  if (!email) {
    alert("Kripya Email address dalein.");
    return;
  }
  const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(url, "_blank");
};
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"
// Configuration object
const CONFIG = {

  PAGE_CONFIG: {
    title: "Sales Call",
    historyTitle: "Sales Call History",
    description: "Manage pending Sales Call tasks",
    historyDescription: "View completed Sales Call records",
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
  const [historyFilter, setHistoryFilter] = useState("all") // "all" | "order_received" | "order_not_received"

  // Sales call form state
  const [followUpForm, setFollowUpForm] = useState({
    whatDidCustomerSay: "",
    stage: "",
    nextDateOfCall: "",
    valueOfOrder: "",
    sendWhatsApp: false,
    whatsAppNumber: "",
    whatsAppTemplate: "",
    sendEmail: false,
    emailAddress: "",
    emailSubject: "",
    emailTemplate: "",
  })

  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const formatTimestamp = useCallback(() => {
    return new Date().toISOString().split("T")[0]
  }, [])


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
  const fetchDropdownValues = useCallback(() => {
    // Static Stage Options
    setStageOptions([
      "Order Received",
      "Not Received",
      "Expected Date",
    ])
  }, [])


  const fetchSheetData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      await Promise.all([
        fetchDropdownValues(),

        (async () => {
          // ✅ 1. Fetch both tables
          const [{ data: salesCallsData, error: salesError }, { data: qcData, error: qcError }] =
            await Promise.all([
              supabase
                .from("sales_calls")
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
                .not("planned", "is", null),
              supabase.from("new_quatation_create").select("enquiry_number, net_cost, quatation_copy"),
            ])

          if (salesError) throw salesError
          if (qcError) throw qcError

          // ✅ 2. Create map for fast lookup
          const quotationMap = {}
          qcData.forEach((item) => {
            quotationMap[item.enquiry_number] = {
              netCost: item.net_cost,
              quotationCopy: item.quatation_copy
            }
          })

          const pending = [];
          const history = [];

          // ✅ 3. Merge data
          (salesCallsData || []).forEach((row) => {
            const enquiryNumber = row.enquiry_number || ""
            if (!enquiryNumber) return

            const qData = quotationMap[enquiryNumber] || {}
            const enq = row.enquiries || {}

            const rowData = {
              _id: `enquiry_${enquiryNumber}_${row.id}`,
              _rowIndex: row.id,
              _enquiryNumber: enquiryNumber,

              enquiryNumber: enquiryNumber,
              beneficiaryName: enq.beneficiary_name || "",
              address: enq.address || "",
              villageBlock: enq.village_block || "",
              district: enq.district || "",
              contactNumber: enq.contact_number || "",
              email: "",
              aadharCard: "",
              addressProof: "",
              surveyorName: "",
              surveyorContact: "",
              quotationNumber: "",

              // ✅ MAIN CHANGE
              valueOfQuotation: qData.netCost || "",

              quotationCopy: qData.quotationCopy || "",

              actual: row.actual || "",
              whatDidCustomerSay: row.customer_feedback || "",
              stage: row.stage || "",
              nextDateOfCall: row.next_call_date || "",
              valueOfOrder: row.value_order || "",
            }

            if (!row.actual) {
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
      setError("Failed to load Sales call data: " + error.message)
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

  const orderReceivedCount = useMemo(() => {
    return historyData.filter((r) => r.stage === "Order Received").length
  }, [historyData])

  const orderNotReceivedCount = useMemo(() => {
    return historyData.filter((r) => r.stage !== "Order Received").length
  }, [historyData])

  const filteredHistoryData = useMemo(() => {
    let list = historyData
    if (historyFilter === "order_received") {
      list = list.filter((record) => record.stage === "Order Received")
    } else if (historyFilter === "order_not_received") {
      list = list.filter((record) => record.stage !== "Order Received")
    }

    return debouncedSearchTerm
      ? list.filter((record) =>
        Object.values(record).some(
          (value) => value && value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
        ),
      )
      : list
  }, [historyData, historyFilter, debouncedSearchTerm])

  const handleFollowUpClick = useCallback((record) => {
    setSelectedRecord(record)
    const valOrder = record.valueOfOrder || ""
    const bName = record.beneficiaryName || "Customer"
    const enqNum = record.enquiryNumber || ""

    setFollowUpForm({
      whatDidCustomerSay: record.whatDidCustomerSay || "",
      stage: record.stage || "",
      nextDateOfCall: formatDateForInput(record.nextDateOfCall || ""),
      valueOfOrder: valOrder,
      sendWhatsApp: false,
      whatsAppNumber: "",
      whatsAppTemplate: `Dear Purchase Manager,\n\nNew Order Received!\n\nOrder Details:\n- Enquiry Number: ${enqNum}\n- Customer Name: ${bName}\n- Order Value: ₹${valOrder}\n\nPlease proceed with the procurement and dispatch process.\n\nBest Regards,\nSales Team - RBP Solar`,
      sendEmail: false,
      emailAddress: "gmpurchase@rbpindia.com",
      emailSubject: `New Order Notification - Enquiry #${enqNum}`,
      emailTemplate: `Dear Purchase Manager,\n\nNew Order Received!\n\nOrder Details:\n- Enquiry Number: ${enqNum}\n- Customer Name: ${bName}\n- Order Value: ₹${valOrder}\n\nPlease proceed with the procurement and dispatch process.\n\nBest Regards,\nSales Team - RBP Solar`,
    })
    setShowFollowUpModal(true)
  }, [formatDateForInput])

  const handleInputChange = useCallback((field, value) => {
    setFollowUpForm((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === "valueOfOrder" && selectedRecord) {
        const bName = selectedRecord.beneficiaryName || "Customer"
        const enqNum = selectedRecord.enquiryNumber || ""
        updated.whatsAppTemplate = `Dear Purchase Manager,\n\nNew Order Received!\n\nOrder Details:\n- Enquiry Number: ${enqNum}\n- Customer Name: ${bName}\n- Order Value: ₹${value}\n\nPlease proceed with the procurement and dispatch process.\n\nBest Regards,\nSales Team - RBP Solar`
        updated.emailTemplate = `Dear Purchase Manager,\n\nNew Order Received!\n\nOrder Details:\n- Enquiry Number: ${enqNum}\n- Customer Name: ${bName}\n- Order Value: ₹${value}\n\nPlease proceed with the procurement and dispatch process.\n\nBest Regards,\nSales Team - RBP Solar`
      }
      return updated
    })
  }, [selectedRecord])

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
        .from("sales_calls")
        .update({
          actual: actualDate, // ✅ main column
          customer_feedback: followUpForm.whatDidCustomerSay,
          stage: followUpForm.stage,
          next_call_date: followUpForm.nextDateOfCall
            ? formatDateForStorage(followUpForm.nextDateOfCall)
            : null,
          value_order: followUpForm.valueOfOrder,
        })
        .eq("id", selectedRecord._rowIndex)

      if (error) throw error

      // Trigger Notifications if Stage is Order Received & checked
      if (followUpForm.stage === "Order Received") {
        if (followUpForm.sendWhatsApp && followUpForm.whatsAppNumber) {
          sendWhatsAppDirect(followUpForm.whatsAppNumber, followUpForm.whatsAppTemplate)
        }
        if (followUpForm.sendEmail && followUpForm.emailAddress) {
          sendEmailDirect(followUpForm.emailAddress, followUpForm.emailSubject, followUpForm.emailTemplate)
        }
      }

      setSuccessMessage(
        `Sales call completed successfully for Enquiry Number: ${selectedRecord.enquiryNumber}`
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
      sendWhatsApp: false,
      whatsAppNumber: "",
      whatsAppTemplate: "",
      sendEmail: false,
      emailAddress: "gmpurchase@rbpindia.com",
      emailSubject: "",
      emailTemplate: "",
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
          <div className="flex space-x-2">
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
                History ({historyData.length})
              </div>
            </button>
          </div>

          {/* History Filter Sub-tabs */}
          {showHistory && (
            <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setHistoryFilter("all")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  historyFilter === "all"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                All ({historyData.length})
              </button>
              <button
                onClick={() => setHistoryFilter("order_received")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  historyFilter === "order_received"
                    ? "bg-green-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                Order Received ({orderReceivedCount})
              </button>
              <button
                onClick={() => setHistoryFilter("order_not_received")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  historyFilter === "order_not_received"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                Order Not Received ({orderNotReceivedCount})
              </button>
            </div>
          )}
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
                  Pending Sales call
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
                <thead className="bg-gray-50 sticky top-0 z-10 whitespace-normal text-center">
                  <tr>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enquiry Number
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Beneficiary Name
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Village/Block
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dist.
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Number
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aadhar Card
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address Proof
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Surveyor Name
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Number
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quotation Number
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value Of Quotation
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quotation Copy
                    </th>
                    {showHistory && (
                      <>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          What Did Customer Say
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stage
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                          <td className="px-2 py-3 whitespace-normal">
                            <button
                              onClick={() => handleFollowUpClick(record)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                              <Wrench className="h-3 w-3 mr-1" />
                              Edit
                            </button>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs font-medium text-gray-900">{record.enquiryNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.beneficiaryName || "—"}</div>
                          </td>
                          <td className="px-2 py-3 max-w-xs">
                            <div className="text-xs text-gray-900 whitespace-normal break-words" title={record.address}>
                              {record.address || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.villageBlock || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.district || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.contactNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.aadharCard || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            {record.addressProof ? (
                              <a
                                href={record.addressProof}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center justify-center text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.surveyorName || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.surveyorContact || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.quotationNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.valueOfQuotation || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            {record.quotationCopy ? (
                              <a
                                href={record.quotationCopy}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center justify-center text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-2 py-3 max-w-xs">
                            <div className="text-xs text-gray-900 whitespace-normal break-words" title={record.whatDidCustomerSay}>
                              {record.whatDidCustomerSay || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {record.stage || "—"}
                            </span>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.valueOfOrder || "—"}</div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={17} className="px-4 py-8 text-center text-gray-500 text-sm">
                          {searchTerm
                            ? "No history records matching your search"
                            : historyFilter === "order_received"
                            ? "No Order Received records found in history"
                            : historyFilter === "order_not_received"
                            ? "No Order Not Received records found in history"
                            : "No completed follow-ups found"}
                        </td>
                      </tr>
                    )
                  ) : filteredPendingData.length > 0 ? (
                    filteredPendingData.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-2 py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleFollowUpClick(record)}
                            className="inline-flex items-center justify-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Sales Call
                          </button>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          <div className="text-xs font-medium text-blue-900">{record.enquiryNumber || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          <div className="text-xs text-gray-900 flex items-center justify-center">
                            <Users className="h-3 w-3 mr-1 text-gray-400" />
                            {record.beneficiaryName || "—"}
                          </div>
                        </td>
                        <td className="px-2 py-3 max-w-xs">
                          <div className="text-xs text-gray-900 whitespace-normal break-words flex items-center justify-center" title={record.address}>
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            {record.address || "—"}
                          </div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          <div className="text-xs text-gray-900">{record.villageBlock || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          <div className="text-xs text-gray-900">{record.district || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          <div className="text-xs text-gray-900 flex items-center justify-center">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            {record.contactNumber || "—"}
                          </div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          <div className="text-xs text-gray-900">{record.aadharCard || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          {record.addressProof ? (
                            <a
                              href={record.addressProof}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center justify-center text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          <div className="text-xs text-gray-900">{record.surveyorName || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          <div className="text-xs text-gray-900">{record.surveyorContact || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          <div className="text-xs text-gray-900">{record.quotationNumber || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          <div className="text-xs text-gray-900 flex items-center justify-center">
                            <DollarSign className="h-3 w-3 mr-1 text-green-500" />
                            {record.valueOfQuotation || "—"}
                          </div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          {record.quotationCopy ? (
                            <a
                              href={record.quotationCopy}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center justify-center text-xs"
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
                        {searchTerm ? "No pending follow-ups matching your search" : "No pending Sales call found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sales Call  Modal */}
        {showFollowUpModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white border max-w-2xl w-full shadow-2xl rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Sales Call Form - Enquiry: {selectedRecord.enquiryNumber}
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

                {/* Order Received Notification Section (WhatsApp & Email) */}
                {followUpForm.stage === "Order Received" && (
                  <div className="mt-5 p-4 border border-green-200 bg-gradient-to-br from-green-50/70 to-emerald-50/40 rounded-xl space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-green-200/80 pb-2.5">
                      <h5 className="text-sm font-bold text-green-900 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-green-600" />
                        Send Order Confirmation (WhatsApp & Email)
                      </h5>
                      <span className="text-xs bg-green-100 text-green-800 font-medium px-2.5 py-0.5 rounded-full border border-green-200">
                        Order Received Selected
                      </span>
                    </div>

                    {/* Checkboxes Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* WhatsApp Checkbox */}
                      <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                        followUpForm.sendWhatsApp 
                          ? "border-green-500 bg-white shadow-sm ring-2 ring-green-400/20" 
                          : "border-gray-200 bg-white/80 hover:border-green-300"
                      }`}>
                        <input
                          type="checkbox"
                          checked={followUpForm.sendWhatsApp}
                          onChange={(e) => handleInputChange("sendWhatsApp", e.target.checked)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 rounded border-gray-300 cursor-pointer"
                        />
                        <div className="ml-3 flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-gray-800">WhatsApp Message</span>
                        </div>
                      </label>

                      {/* Email Checkbox */}
                      <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                        followUpForm.sendEmail 
                          ? "border-blue-500 bg-white shadow-sm ring-2 ring-blue-400/20" 
                          : "border-gray-200 bg-white/80 hover:border-blue-300"
                      }`}>
                        <input
                          type="checkbox"
                          checked={followUpForm.sendEmail}
                          onChange={(e) => handleInputChange("sendEmail", e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded border-gray-300 cursor-pointer"
                        />
                        <div className="ml-3 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-semibold text-gray-800">Email Confirmation</span>
                        </div>
                      </label>
                    </div>

                    {/* WhatsApp Details & Template Box */}
                    {followUpForm.sendWhatsApp && (
                      <div className="p-3.5 bg-white rounded-xl border border-green-200 space-y-3 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="block text-xs font-semibold text-gray-700">
                            WhatsApp Number <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => sendWhatsAppDirect(followUpForm.whatsAppNumber, followUpForm.whatsAppTemplate)}
                            className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 border border-green-300 px-3 py-1.5 rounded-lg transition-all"
                          >
                            <Send className="h-3 w-3 mr-1.5" />
                            Send via WhatsApp Web
                          </button>
                        </div>
                        <input
                          type="text"
                          value={followUpForm.whatsAppNumber}
                          onChange={(e) => handleInputChange("whatsAppNumber", e.target.value)}
                          placeholder="Enter 10-digit mobile number"
                          className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                        />
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            WhatsApp Message Template (Editable)
                          </label>
                          <textarea
                            rows={4}
                            value={followUpForm.whatsAppTemplate}
                            onChange={(e) => handleInputChange("whatsAppTemplate", e.target.value)}
                            className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-lg font-mono text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Email Details & Template Box */}
                    {followUpForm.sendEmail && (
                      <div className="p-3.5 bg-white rounded-xl border border-blue-200 space-y-3 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="block text-xs font-semibold text-gray-700">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => sendEmailDirect(followUpForm.emailAddress, followUpForm.emailSubject, followUpForm.emailTemplate)}
                            className="inline-flex items-center text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-300 px-3 py-1.5 rounded-lg transition-all"
                          >
                            <Send className="h-3 w-3 mr-1.5" />
                            Send via Email App
                          </button>
                        </div>
                        <input
                          type="email"
                          value={followUpForm.emailAddress}
                          onChange={(e) => handleInputChange("emailAddress", e.target.value)}
                          placeholder="Enter customer email address"
                          className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Email Subject Line
                          </label>
                          <input
                            type="text"
                            value={followUpForm.emailSubject}
                            onChange={(e) => handleInputChange("emailSubject", e.target.value)}
                            className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none mb-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Email Body Template (Editable)
                          </label>
                          <textarea
                            rows={5}
                            value={followUpForm.emailTemplate}
                            onChange={(e) => handleInputChange("emailTemplate", e.target.value)}
                            className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-lg font-mono text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, X, Search, History, MapPin, Users, Phone, Eye, CreditCard, DollarSign, Calendar, Edit3, Loader2, Download, ChevronDown, ChevronUp } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

// Page configuration
const CONFIG = {
  PAGE_CONFIG: {
    title: "Payment Confirmation/ Loan Section",
    historyTitle: "Payment Confirmation History",
    description: "Confirm and track customer payments",
    historyDescription: "View completed payment confirmations",
  },
}

// Debounce hook for search input
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

export default function PaymentConfirmationPage() {
  const [pendingData, setPendingData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Form Accordion States
  const [show70Payment, setShow70Payment] = useState(false)
  const [show30Payment, setShow30Payment] = useState(false)

  // Form State
  const [form, setForm] = useState({
    paymentType: "",
    chequeNumber: "",
    utrNumber: "",
    paymentDate: "",
    amount: "",
    downPayment: "",
    remainingAmount: "",
    loanSanctionAmount: "",
    payment70UtrNumber: "",
    payment70Date: "",
    payment70Amount: "",
    payment30UtrNumber: "",
    payment30Date: "",
    payment30Amount: "",
  })

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const formatDateForInput = useCallback((dateString) => {
    if (!dateString) return ""
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString

    const parts = dateString.split("/")
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`
    }
    return dateString
  }, [])

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

  const fetchPaymentConfirmations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        { data, error: fetchError },
        { data: registrationData }
      ] = await Promise.all([
        supabase
          .from("payment_confirmations")
          .select(`
            *,
            enquiries!left (
              beneficiary_name,
              address,
              contact_number
            )
          `)
          .not("planned", "is", null),
        supabase
          .from("registration")
          .select("enquiry_number, planned, actual")
          .then((r) => r)
          .catch(() => ({ data: [] }))
      ])

      if (fetchError) throw fetchError

      // Pending condition: Only include when registration table has planned IS NOT NULL and actual IS NOT NULL
      const completedRegistrationEnquiries = new Set(
        (registrationData || [])
          .filter((r) => r.planned != null && r.actual != null)
          .map((r) => r.enquiry_number)
      )

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
            paymentType: row.payment_type || "",
            chequeNumber: row.cheque_number || "",
            utrNumber: row.utr_number || "",
            paymentDate: row.payment_date || "",
            amount: row.amount || "",
            downPayment: row.down_payment || "",
            remainingAmount: row.remainingAmount || "",
            loanSanctionAmount: row.loan_sanction_amount || "",
            payment70UtrNumber: row.payment_70_utr_number || "",
            payment70Date: row.payment_70_date || "",
            payment70Amount: row.payment_70_amount || "",
            payment30UtrNumber: row.payment_30_utr_number || "",
            payment30Date: row.payment_30_date || "",
            payment30Amount: row.payment_30_amount || "",
          }

          if (row.planned && !row.actual) {
            if (completedRegistrationEnquiries.has(row.enquiry_number)) {
              pending.push(rowData)
            }
          } else if (row.planned && row.actual) {
            history.push(rowData)
          }
        })
      }

      setPendingData(pending)
      setHistoryData(history)
    } catch (err) {
      console.error("Error fetching payment confirmations:", err)
      setError("Failed to load payment confirmations: " + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPaymentConfirmations()
  }, [fetchPaymentConfirmations])

  // Search & Filter implementation
  const filteredPendingData = useMemo(() => {
    let data = pendingData
    if (paymentTypeFilter) {
      data = data.filter((record) => record.paymentType === paymentTypeFilter)
    }
    return debouncedSearchTerm
      ? data.filter((record) =>
          Object.values(record).some(
            (value) => value && value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          )
        )
      : data
  }, [pendingData, debouncedSearchTerm, paymentTypeFilter])

  const filteredHistoryData = useMemo(() => {
    let data = historyData
    if (paymentTypeFilter) {
      data = data.filter((record) => record.paymentType === paymentTypeFilter)
    }
    return debouncedSearchTerm
      ? data.filter((record) =>
          Object.values(record).some(
            (value) => value && value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          )
        )
      : data
  }, [historyData, debouncedSearchTerm, paymentTypeFilter])

  const handleActionClick = useCallback((record) => {
    setSelectedRecord(record)
    setForm({
      paymentType: record.paymentType || "",
      chequeNumber: record.chequeNumber || "",
      utrNumber: record.utrNumber || "",
      paymentDate: formatDateForInput(record.paymentDate || ""),
      amount: record.amount || "",
      downPayment: record.downPayment || "",
      remainingAmount: record.remainingAmount || "",
      loanSanctionAmount: record.loanSanctionAmount || "",
      payment70UtrNumber: record.payment70UtrNumber || "",
      payment70Date: formatDateForInput(record.payment70Date || ""),
      payment70Amount: record.payment70Amount || "",
      payment30UtrNumber: record.payment30UtrNumber || "",
      payment30Date: formatDateForInput(record.payment30Date || ""),
      payment30Amount: record.payment30Amount || "",
    })
    setShow70Payment(!!(record.payment70UtrNumber || record.payment70Date || record.payment70Amount))
    setShow30Payment(!!(record.payment30UtrNumber || record.payment30Date || record.payment30Amount))
    setShowModal(true)
  }, [formatDateForInput])

  const handleFormSubmit = async () => {
    if (!form.paymentType) {
      alert("Please select payment type.")
      return
    }

    setIsSubmitting(true)

    try {
      const actualDate = new Date().toISOString()

      const updatePayload = {
        payment_type: form.paymentType,
        cheque_number: form.chequeNumber || null,
        utr_number: form.utrNumber || null,
        payment_date: form.paymentDate || null,
        amount: form.amount ? parseFloat(form.amount) : null,
        down_payment: form.downPayment ? parseFloat(form.downPayment) : null,
        loan_sanction_amount: form.loanSanctionAmount ? parseFloat(form.loanSanctionAmount) : null,
        payment_70_utr_number: form.payment70UtrNumber || null,
        payment_70_date: form.payment70Date || null,
        payment_70_amount: form.payment70Amount ? parseFloat(form.payment70Amount) : null,
        payment_30_utr_number: form.payment30UtrNumber || null,
        payment_30_date: form.payment30Date || null,
        payment_30_amount: form.payment30Amount ? parseFloat(form.payment30Amount) : null,
        actual: actualDate,
        status: "Done"
      }

      const { error: updateError } = await supabase
        .from("payment_confirmations")
        .update(updatePayload)
        .eq("enquiry_number", selectedRecord.enquiryNumber)

      if (updateError) throw updateError

      setShowModal(false)
      setSuccessMessage(`Payment confirmed successfully for ${selectedRecord.enquiryNumber}`)
      fetchPaymentConfirmations()

      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err) {
      console.error("Save error:", err)
      alert("Failed to save confirmation: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Excel Export Handler for History Tab
  const exportToExcel = useCallback(() => {
    const dataToExport = filteredHistoryData

    if (dataToExport.length === 0) {
      alert("No history data available to export")
      return
    }

    const headers = [
      "Enquiry Number",
      "Beneficiary Name",
      "Address",
      "Contact Number",
      "Payment Type",
      "Cheque Number",
      "UTR Number",
      "Payment Date",
      "Amount (₹)",
      "Down Payment (₹)",
      "Remaining Amount (₹)",
      "Loan Sanction Amount (₹)",
      "70% Payment UTR Number",
      "70% Payment Date",
      "70% Payment Amount (₹)",
      "30% Payment UTR Number",
      "30% Payment Date",
      "30% Payment Amount (₹)",
      "Confirm Date",
      "Delay (Days)"
    ]

    const rows = dataToExport.map((record) => [
      record.enquiryNumber || "",
      record.beneficiaryName || "",
      record.address || "",
      record.contactNumber || "",
      record.paymentType || "",
      record.chequeNumber || "",
      record.utrNumber || "",
      formatDate(record.paymentDate),
      record.amount || "",
      record.downPayment || "",
      record.remainingAmount || "",
      record.loanSanctionAmount || "",
      record.payment70UtrNumber || "",
      formatDate(record.payment70Date),
      record.payment70Amount || "",
      record.payment30UtrNumber || "",
      formatDate(record.payment30Date),
      record.payment30Amount || "",
      formatDate(record.actual),
      record.delay || "0"
    ])

    const formatValue = (val) => {
      if (val === undefined || val === null) return '""'
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return `"${str}"`
    }

    const csvContent = [
      headers.map(formatValue).join(','),
      ...rows.map((row) => row.map(formatValue).join(','))
    ].join('\n')

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    const timestamp = new Date().toISOString().split("T")[0]
    link.download = `payment-confirmation-history-${timestamp}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }, [filteredHistoryData, formatDate])

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

          <div className="flex flex-wrap items-center gap-3">
            {showHistory && (
              <button
                onClick={exportToExcel}
                className="inline-flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors shrink-0"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export Excel ({filteredHistoryData.length})
              </button>
            )}

            <select
              value={paymentTypeFilter}
              onChange={(e) => setPaymentTypeFilter(e.target.value)}
              className="px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white shadow-xs"
            >
              <option value="">All Payment Types</option>
              <option value="Cheque">Cheque</option>
              <option value="Bank Finance">Bank Finance</option>
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={showHistory ? "Search history..." : "Search pending confirmations..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white shadow-xs w-60"
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
              <CreditCard className="h-4.5 w-4.5 mr-2 text-blue-500" />
              Pending Confirmations ({filteredPendingData.length})
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
              Confirmation History ({filteredHistoryData.length})
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
              <p className="text-blue-600 font-medium text-sm">Loading payment confirmation data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-6 rounded-md text-red-800 text-center text-sm">
              {error}
              <button className="underline ml-2 hover:text-red-900 font-bold" onClick={fetchPaymentConfirmations}>
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
                    <th className="px-4 py-4">Payment Type</th>
                    <th className="px-4 py-4">Cheque Number</th>
                    <th className="px-4 py-4">UTR Number</th>
                    <th className="px-4 py-4">Payment Date</th>
                    <th className="px-4 py-4">Amount</th>
                    <th className="px-4 py-4">Down Payment</th>
                    <th className="px-4 py-4">Remaining Amount</th>
                    {showHistory && (
                      <>
                        <th className="px-4 py-4">Loan Sanction Amt</th>
                        <th className="px-4 py-4">70% UTR</th>
                        <th className="px-4 py-4">70% Date</th>
                        <th className="px-4 py-4">70% Amt</th>
                        <th className="px-4 py-4">30% UTR</th>
                        <th className="px-4 py-4">30% Date</th>
                        <th className="px-4 py-4">30% Amt</th>
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
                              <Edit3 className="h-3.5 w-3.5 mr-1" />
                              Edit
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
                          <td className="px-4 py-3 font-medium text-gray-900">{record.paymentType || "—"}</td>
                          <td className="px-4 py-3">{record.chequeNumber || "—"}</td>
                          <td className="px-4 py-3">{record.utrNumber || "—"}</td>
                          <td className="px-4 py-3">{formatDate(record.paymentDate)}</td>
                          <td className="px-4 py-3 font-semibold text-green-700">
                            {record.amount ? `₹${parseFloat(record.amount).toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td className="px-4 py-3 font-semibold text-purple-700">
                            {record.downPayment ? `₹${parseFloat(record.downPayment).toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td className="px-4 py-3 font-semibold text-purple-700">
                            {record.remainingAmount ? `₹${parseFloat(record.remainingAmount).toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td className="px-4 py-3 font-semibold text-blue-800">
                            {record.loanSanctionAmount ? `₹${parseFloat(record.loanSanctionAmount).toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td className="px-4 py-3">{record.payment70UtrNumber || "—"}</td>
                          <td className="px-4 py-3">{formatDate(record.payment70Date)}</td>
                          <td className="px-4 py-3 font-semibold text-blue-700">
                            {record.payment70Amount ? `₹${parseFloat(record.payment70Amount).toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td className="px-4 py-3">{record.payment30UtrNumber || "—"}</td>
                          <td className="px-4 py-3">{formatDate(record.payment30Date)}</td>
                          <td className="px-4 py-3 font-semibold text-indigo-700">
                            {record.payment30Amount ? `₹${parseFloat(record.payment30Amount).toLocaleString("en-IN")}` : "—"}
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
                        <td colSpan={21} className="px-4 py-16 text-center text-gray-500 font-medium">
                          {searchTerm || paymentTypeFilter ? "No confirmation history records matching your filter" : "No completed confirmations found"}
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
                            <DollarSign className="h-3.5 w-3.5 mr-1" />
                            Confirm
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
                        <td className="px-4 py-3 font-medium text-gray-900">{record.paymentType || "—"}</td>
                        <td className="px-4 py-3">{record.chequeNumber || "—"}</td>
                        <td className="px-4 py-3">{record.utrNumber || "—"}</td>
                        <td className="px-4 py-3">{formatDate(record.paymentDate)}</td>
                        <td className="px-4 py-3 font-semibold text-green-700">
                          {record.amount ? `₹${parseFloat(record.amount).toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-purple-700">
                          {record.downPayment ? `₹${parseFloat(record.downPayment).toLocaleString("en-IN")}` : "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="px-4 py-16 text-center text-gray-500 font-medium">
                        {searchTerm || paymentTypeFilter ? "No pending confirmations matching your filter" : "No pending confirmations found"}
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
            <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full z-10 border border-blue-50">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white" id="modal-title">
                    Payment Confirmation Form
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

              <div className="px-6 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* 1. Payment Type Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Payment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.paymentType}
                    onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  >
                    <option value="">Select Payment Type</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Finance">Bank Finance</option>
                  </select>
                </div>

                {/* 2. Cheque Number */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Cheque Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Cheque Number"
                    value={form.chequeNumber}
                    onChange={(e) => setForm({ ...form, chequeNumber: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  />
                </div>

                {/* 3. UTR Number */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    UTR Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter UTR Number"
                    value={form.utrNumber}
                    onChange={(e) => setForm({ ...form, utrNumber: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  />
                </div>

                {/* 4. Date */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={form.paymentDate}
                    onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  />
                </div>

                {/* 5. Amount */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter Amount"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  />
                </div>

                {/* 6. Down Payment */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Down Payment (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter Down Payment"
                    value={form.downPayment}
                    onChange={(e) => setForm({ ...form, downPayment: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  />
                </div>

                {/* 7. Remaining Amount */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Remaining Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter Remaining Amount"
                    value={form.remainingAmount}
                    onChange={(e) => setForm({ ...form, remainingAmount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  />
                </div>

                {/* 8. Loan Sanction Amount */}
                <div className="pt-2 border-t border-gray-200">
                  <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                    Loan Sanction Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter Loan Sanction Amount"
                    value={form.loanSanctionAmount}
                    onChange={(e) => setForm({ ...form, loanSanctionAmount: e.target.value })}
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all bg-blue-50/20"
                  />
                </div>

                {/* 9. 70% Payment Section */}
                <div className="border border-blue-200 rounded-xl overflow-hidden bg-blue-50/20">
                  <button
                    type="button"
                    onClick={() => setShow70Payment(!show70Payment)}
                    className="w-full px-4 py-2.5 bg-blue-50 hover:bg-blue-100 flex items-center justify-between text-xs font-bold text-blue-800 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      70% Payment Details
                    </span>
                    <span className="text-blue-600 text-2xs bg-white px-2 py-0.5 rounded-full border border-blue-200 flex items-center">
                      {show70Payment ? (
                        <>Hide <ChevronUp className="h-3 w-3 ml-1" /></>
                      ) : (
                        <>View / Edit <ChevronDown className="h-3 w-3 ml-1" /></>
                      )}
                    </span>
                  </button>
                  {show70Payment && (
                    <div className="p-4 space-y-3 bg-white border-t border-blue-100">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          70% Payment UTR Number
                        </label>
                        <input
                          type="text"
                          placeholder="Enter 70% UTR Number"
                          value={form.payment70UtrNumber}
                          onChange={(e) => setForm({ ...form, payment70UtrNumber: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          70% Payment Date
                        </label>
                        <input
                          type="date"
                          value={form.payment70Date}
                          onChange={(e) => setForm({ ...form, payment70Date: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          70% Payment Amount (₹)
                        </label>
                        <input
                          type="number"
                          placeholder="Enter 70% Amount"
                          value={form.payment70Amount}
                          onChange={(e) => setForm({ ...form, payment70Amount: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 10. 30% Payment Section */}
                <div className="border border-indigo-200 rounded-xl overflow-hidden bg-indigo-50/20">
                  <button
                    type="button"
                    onClick={() => setShow30Payment(!show30Payment)}
                    className="w-full px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-between text-xs font-bold text-indigo-800 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-indigo-600" />
                      30% Payment Details
                    </span>
                    <span className="text-indigo-600 text-2xs bg-white px-2 py-0.5 rounded-full border border-indigo-200 flex items-center">
                      {show30Payment ? (
                        <>Hide <ChevronUp className="h-3 w-3 ml-1" /></>
                      ) : (
                        <>View / Edit <ChevronDown className="h-3 w-3 ml-1" /></>
                      )}
                    </span>
                  </button>
                  {show30Payment && (
                    <div className="p-4 space-y-3 bg-white border-t border-indigo-100">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          30% Payment UTR Number
                        </label>
                        <input
                          type="text"
                          placeholder="Enter 30% UTR Number"
                          value={form.payment30UtrNumber}
                          onChange={(e) => setForm({ ...form, payment30UtrNumber: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          30% Payment Date
                        </label>
                        <input
                          type="date"
                          value={form.payment30Date}
                          onChange={(e) => setForm({ ...form, payment30Date: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          30% Payment Amount (₹)
                        </label>
                        <input
                          type="number"
                          placeholder="Enter 30% Amount"
                          value={form.payment30Amount}
                          onChange={(e) => setForm({ ...form, payment30Amount: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  disabled={isSubmitting}
                  className="inline-flex justify-center rounded-lg shadow-md px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-55 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirm Payment
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

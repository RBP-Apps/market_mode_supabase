"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, X, Search, History, MapPin, Users, Phone, Eye, CreditCard, Wrench, Upload, FileText, Loader2 } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

// Configuration object
const CONFIG = {
  PAGE_CONFIG: {
    title: "Payment",
    historyTitle: "Payment History",
    description: "Manage pending payment records",
    historyDescription: "View completed payment records",
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

function PaymentPage() {
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
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [viewingFileUrl, setViewingFileUrl] = useState(null)

  const isImage = useCallback((url) => {
    if (!url) return false
    const cleanUrl = url.split("?")[0].toLowerCase()
    return cleanUrl.endsWith(".png") || cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".jpeg") || cleanUrl.endsWith(".webp") || cleanUrl.endsWith(".gif")
  }, [])
  
  const [paymentForm, setPaymentForm] = useState({
    paymentType: "",
    checkNo: "",
    date: "",
    amount: "",
    deduction: "",
    loanApply: "",
    submissionUpload: null,
    applicationNumber: "",
    registrationNumber: "",
    feasibilityReport: null,
    digitalLoanApproval: null,
    siteFeasibilityReport: null,
    electricityBill: null,
    aadhaarCard: null,
    panCard: null,
    bankStatement: null,
    vendorConsumerAgreement: null,
  })

  const [fileUploads, setFileUploads] = useState({
    submissionUpload: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    feasibilityReport: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    digitalLoanApproval: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    siteFeasibilityReport: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    electricityBill: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    aadhaarCard: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    panCard: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    bankStatement: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    vendorConsumerAgreement: { uploading: false, uploaded: false, url: "", error: null, name: "" },
  })

  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const formatDateForInput = useCallback((dateString) => {
    if (!dateString) return ""
    if (dateString.includes("/")) {
      const [day, month, year] = dateString.split("/")
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    }
    return dateString
  }, [])

  const isEmpty = useCallback((value) => {
    return value === null || value === undefined || (typeof value === "string" && value.trim() === "")
  }, [])

  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return ""
    if (typeof dateString === "string" && dateString.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/)) return dateString

    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const seconds = date.getSeconds().toString().padStart(2, "0")
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  }, [])

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "—"
    if (typeof dateString === "string" && dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateString
    }

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

  useEffect(() => {
    const role = sessionStorage.getItem("role")
    const user = sessionStorage.getItem("username")
    setUserRole(role || "")
    setUsername(user || "")
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

      const [
        { data: pData, error: pError },
        { data: fmsData, error: fmsError }
      ] = await Promise.all([
        supabase
          .from("payments")
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
          .from("fms")
          .select("enquiry_number, surveyor_name, power_purchase_agreement, vendor_consumer_agreement, quotation_copy, application_copy, electricity_bill_doc, witness_id_proof, actual_12, status_13, status_14, status_15")
      ])

      if (pError) throw pError
      if (fmsError) throw fmsError

      const fmsMap = {}
      if (fmsData) {
        fmsData.forEach(item => {
          if (item.enquiry_number) {
            fmsMap[item.enquiry_number] = {
              surveyorName: item.surveyor_name || "",
              powerPurchaseAgreement: item.power_purchase_agreement || "",
              vendorConsumerAgreement: item.vendor_consumer_agreement || "",
              quotationCopy: item.quotation_copy || "",
              applicationCopy: item.application_copy || "",
              electricityBill: item.electricity_bill_doc || "",
              witnessIdProof: item.witness_id_proof || "",
              inspection: item.actual_12 || "",
              projectCommission: item.status_13 || "",
              subsidyToken: item.status_14 || "",
              subsidyDisbursal: item.status_15 || ""
            }
          }
        })
      }

      const pending = []
      const history = []

      if (pData) {
        pData.forEach((row) => {
          const enqNum = row.enquiry_number || ""
          const enq = row.enquiries || {}
          const fmsRow = fmsMap[enqNum] || {}

          const rowData = {
            _id: row.id,
            _enquiryNumber: enqNum,

            enquiryNumber: enqNum,
            beneficiaryName: enq.beneficiary_name || "",
            address: enq.address || "",
            contactNumber: enq.contact_number || "",
            surveyorName: fmsRow.surveyorName || "",

            paymentType: row.payment_type || "",
            payment: row.status || "",
            checkNo: row.check_number || "",
            date: row.payment_date || "",
            amount: row.amount || "",
            deduction: row.deduction || "",
            actual: row.actual || "",

            loanApply: row.loan_apply || "",
            submissionUpload: row.submission_upload || "",
            applicationNumber: row.application_number || "",
            registrationNumber: row.registration_number || "",
            feasibilityReport: row.feasibility_report || "",
            digitalLoanApproval: row.digital_loan_approval || "",
            siteFeasibilityReport: row.site_feasibility_report || "",
            electricityBillDoc: row.electricity_bill || "",
            aadhaarCard: row.aadhaar_card || "",
            panCard: row.pan_card || "",
            bankStatement: row.bank_statement || "",
            vendorConsumerAgreementDoc: row.vendor_consumer_agreement || "",

            powerPurchaseAgreement: fmsRow.powerPurchaseAgreement || "",
            vendorConsumerAgreement: fmsRow.vendorConsumerAgreement || "",
            quotationCopy: fmsRow.quotationCopy || "",
            applicationCopy: fmsRow.applicationCopy || "",
            electricityBill: fmsRow.electricityBill || "",
            witnessIdProof: fmsRow.witnessIdProof || "",
            inspection: fmsRow.inspection || "",
            projectCommission: fmsRow.projectCommission || "",
            subsidyToken: fmsRow.subsidyToken || "",
            subsidyDisbursal: fmsRow.subsidyDisbursal || ""
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
      setLoading(false)

    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load Payment data: " + error.message)
      setLoading(false)
    }
  }, [isEmpty, fetchDropdownOptions])

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

  const handlePaymentClick = useCallback(
    (record) => {
      setSelectedRecord(record)
      setPaymentForm({
        paymentType: record.paymentType || "",
        checkNo: record.checkNo || "",
        date: formatDateForInput(record.date || ""),
        amount: record.amount || "",
        deduction: record.deduction || "",
        loanApply: record.loanApply || "",
        submissionUpload: record.submissionUpload || null,
        applicationNumber: record.applicationNumber || "",
        registrationNumber: record.registrationNumber || "",
        feasibilityReport: record.feasibilityReport || null,
        digitalLoanApproval: record.digitalLoanApproval || null,
        siteFeasibilityReport: record.siteFeasibilityReport || null,
        electricityBill: record.electricityBillDoc || null,
        aadhaarCard: record.aadhaarCard || null,
        panCard: record.panCard || null,
        bankStatement: record.bankStatement || null,
        vendorConsumerAgreement: record.vendorConsumerAgreementDoc || null,
      })
      setFileUploads({
        submissionUpload: { uploading: false, uploaded: !!record.submissionUpload, url: record.submissionUpload || "", error: null, name: record.submissionUpload ? "Existing File" : "" },
        feasibilityReport: { uploading: false, uploaded: !!record.feasibilityReport, url: record.feasibilityReport || "", error: null, name: record.feasibilityReport ? "Existing File" : "" },
        digitalLoanApproval: { uploading: false, uploaded: !!record.digitalLoanApproval, url: record.digitalLoanApproval || "", error: null, name: record.digitalLoanApproval ? "Existing File" : "" },
        siteFeasibilityReport: { uploading: false, uploaded: !!record.siteFeasibilityReport, url: record.siteFeasibilityReport || "", error: null, name: record.siteFeasibilityReport ? "Existing File" : "" },
        electricityBill: { uploading: false, uploaded: !!record.electricityBillDoc, url: record.electricityBillDoc || "", error: null, name: record.electricityBillDoc ? "Existing File" : "" },
        aadhaarCard: { uploading: false, uploaded: !!record.aadhaarCard, url: record.aadhaarCard || "", error: null, name: record.aadhaarCard ? "Existing File" : "" },
        panCard: { uploading: false, uploaded: !!record.panCard, url: record.panCard || "", error: null, name: record.panCard ? "Existing File" : "" },
        bankStatement: { uploading: false, uploaded: !!record.bankStatement, url: record.bankStatement || "", error: null, name: record.bankStatement ? "Existing File" : "" },
        vendorConsumerAgreement: { uploading: false, uploaded: !!record.vendorConsumerAgreementDoc, url: record.vendorConsumerAgreementDoc || "", error: null, name: record.vendorConsumerAgreementDoc ? "Existing File" : "" },
      })
      setShowPaymentModal(true)
    },
    [formatDateForInput],
  )

  const uploadFileToSupabase = useCallback(async (file, prefix) => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${prefix}_${selectedRecord.enquiryNumber}_${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from("enquery_file")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false
        })

      if (error) throw error

      const { data: publicUrl } = supabase.storage
        .from("enquery_file")
        .getPublicUrl(fileName)

      return publicUrl.publicUrl
    } catch (err) {
      console.error("Storage upload failed:", err)
      throw err
    }
  }, [selectedRecord])

  const handleFileUpload = useCallback((field, file) => {
    if (!file) return

    setPaymentForm((prev) => ({ ...prev, [field]: file }))
    setFileUploads((prev) => ({
      ...prev,
      [field]: { ...prev[field], name: file.name, uploaded: false, error: null }
    }))
  }, [])

  const handlePaymentSubmit = async () => {
    if (!paymentForm.paymentType) {
      alert("Please select Payment Type")
      return
    }

    if (paymentForm.paymentType === "Cheque / RTGS / UPI") {
      if (!paymentForm.checkNo || !paymentForm.date || !paymentForm.amount) {
        alert("Please fill Check No, Date, and Amount")
        return
      }
    }

    setIsSubmitting(true)

    try {
      const uploadPromises = {}
      const fileFields = [
        { name: "submissionUpload", prefix: "sub_upload" },
        { name: "feasibilityReport", prefix: "feas_rep" },
        { name: "digitalLoanApproval", prefix: "dig_loan_app" },
        { name: "siteFeasibilityReport", prefix: "site_feas_rep" },
        { name: "electricityBill", prefix: "elec_bill" },
        { name: "aadhaarCard", prefix: "aadhar_card" },
        { name: "panCard", prefix: "pan_card" },
        { name: "bankStatement", prefix: "bank_stmt" },
        { name: "vendorConsumerAgreement", prefix: "vendor_agreement" }
      ]

      for (const field of fileFields) {
        let fileUrl = paymentForm[field.name]
        if (paymentForm[field.name] instanceof File) {
          setFileUploads(prev => ({
            ...prev,
            [field.name]: { ...prev[field.name], uploading: true }
          }))
          fileUrl = await uploadFileToSupabase(paymentForm[field.name], field.prefix)
          setFileUploads(prev => ({
            ...prev,
            [field.name]: {
              ...prev[field.name],
              uploading: false,
              uploaded: true,
              url: fileUrl
            }
          }))
        }
        uploadPromises[field.name] = fileUrl
      }

      const actualDate = selectedRecord.actual || new Date().toISOString()

      const updatePayload = {
        payment_type: paymentForm.paymentType,
        check_number: paymentForm.paymentType === "Cheque / RTGS / UPI" ? paymentForm.checkNo : null,
        payment_date: paymentForm.paymentType === "Cheque / RTGS / UPI" ? paymentForm.date : null,
        amount: paymentForm.paymentType === "Cheque / RTGS / UPI" ? parseFloat(paymentForm.amount) || null : null,
        deduction: paymentForm.paymentType === "Cheque / RTGS / UPI" ? parseFloat(paymentForm.deduction) || null : null,

        loan_apply: paymentForm.paymentType === "Bank Finance" ? paymentForm.loanApply : null,
        submission_upload: paymentForm.paymentType === "Bank Finance" ? uploadPromises.submissionUpload : null,
        application_number: paymentForm.paymentType === "Bank Finance" ? paymentForm.applicationNumber : null,
        registration_number: paymentForm.paymentType === "Bank Finance" ? paymentForm.registrationNumber : null,
        feasibility_report: paymentForm.paymentType === "Bank Finance" ? uploadPromises.feasibilityReport : null,
        digital_loan_approval: paymentForm.paymentType === "Bank Finance" ? uploadPromises.digitalLoanApproval : null,
        site_feasibility_report: paymentForm.paymentType === "Bank Finance" ? uploadPromises.siteFeasibilityReport : null,
        electricity_bill: paymentForm.paymentType === "Bank Finance" ? uploadPromises.electricityBill : null,
        aadhaar_card: paymentForm.paymentType === "Bank Finance" ? uploadPromises.aadhaarCard : null,
        pan_card: paymentForm.paymentType === "Bank Finance" ? uploadPromises.panCard : null,
        bank_statement: paymentForm.paymentType === "Bank Finance" ? uploadPromises.bankStatement : null,
        vendor_consumer_agreement: paymentForm.paymentType === "Bank Finance" ? uploadPromises.vendorConsumerAgreement : null,

        actual: actualDate,
        status: "Done"
      }

      const { error } = await supabase
        .from("payments")
        .update(updatePayload)
        .eq("enquiry_number", selectedRecord._enquiryNumber)

      if (error) throw error

      setShowPaymentModal(false)
      setSuccessMessage("Payment updated successfully")
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
              <CreditCard className="h-4 w-4 mr-2" />
              Pending Payment ({filteredPendingData.length})
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
              Payment History ({filteredHistoryData.length})
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
                  Completed Payments
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pending Payments
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
              <p className="text-blue-600 text-sm">Loading payment data...</p>
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
                <thead className="bg-gray-50 sticky top-0 z-10 text-nowrap text-center">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Type
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check No
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deduction
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
                    {showHistory && (
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cancellation Cheque
                      </th>
                    )}
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Electricity Bill
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Witness Id Proof
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inspection
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project Commission
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subsidy Token
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subsidy Disbursal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-center">
                  {showHistory ? (
                    filteredHistoryData.length > 0 ? (
                      filteredHistoryData.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50">
                          <td className="px-2 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handlePaymentClick(record)}
                              className="inline-flex items-center px-3 py-1.5 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs font-semibold rounded-md transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </button>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-xs font-semibold text-gray-700">
                            {record.paymentType || "—"}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-600">
                            {record.checkNo || "—"}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-600">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-600">
                            {record.amount || "—"}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-600">
                            {record.deduction || "—"}
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
                              <button
                                onClick={() => setViewingFileUrl(record.powerPurchaseAgreement)}
                                className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            {record.vendorConsumerAgreement ? (
                              <button
                                onClick={() => setViewingFileUrl(record.vendorConsumerAgreement)}
                                className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </button>
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
                          {showHistory && (
                            <td className="px-2 py-3 whitespace-nowrap">
                              <div className="text-xs text-gray-900">{record.cancellationCheque || "—"}</div>
                            </td>
                          )}
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.electricityBill || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.witnessIdProof || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{formatDate(record.inspection)}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.projectCommission || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{formatDateTime(record.subsidyToken)}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{formatDateTime(record.subsidyDisbursal)}</div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={22} className="px-4 py-8 text-center text-gray-500 text-sm">
                          {searchTerm
                            ? "No payment history records matching your search"
                            : "No completed payments found"}
                        </td>
                      </tr>
                    )
                  ) : filteredPendingData.length > 0 ? (
                    filteredPendingData.map((record) => {
                      return (
                        <tr key={record._id} className="hover:bg-gray-50">
                          <td className="px-2 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handlePaymentClick(record)}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
                            >
                              <CreditCard className="h-3.5 w-3.5 mr-1" />
                              Payment
                            </button>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-xs font-semibold text-gray-700">
                            {record.paymentType || "—"}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-600">
                            {record.checkNo || "—"}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-600">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-600">
                            {record.amount || "—"}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-600">
                            {record.deduction || "—"}
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
                              <button
                                onClick={() => setViewingFileUrl(record.powerPurchaseAgreement)}
                                className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            {record.vendorConsumerAgreement ? (
                              <button
                                onClick={() => setViewingFileUrl(record.vendorConsumerAgreement)}
                                className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </button>
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
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{formatDate(record.inspection)}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.projectCommission || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{formatDateTime(record.subsidyToken)}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{formatDateTime(record.subsidyDisbursal)}</div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={21} className="px-4 py-8 text-center text-gray-500 text-sm">
                        {searchTerm ? "No pending payments matching your search" : "No pending payments found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full z-10">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start w-full">
                  <div className="mx-auto shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                      Payment Entry (Enquiry No: {selectedRecord?.enquiryNumber})
                    </h3>
                    <div className="space-y-4">
                      {/* Payment Type Dropdown */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Payment Type</label>
                        <select
                          value={paymentForm.paymentType}
                          onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="">Select Payment Type</option>
                          <option value="Cheque / RTGS / UPI">Cheque / RTGS / UPI</option>
                          <option value="Bank Finance">Bank Finance</option>
                        </select>
                      </div>

                      {/* Cheque / RTGS / UPI Conditional Fields */}
                      {paymentForm.paymentType === "Cheque / RTGS / UPI" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700">Check No</label>
                            <input
                              type="text"
                              value={paymentForm.checkNo}
                              onChange={(e) => setPaymentForm({ ...paymentForm, checkNo: e.target.value })}
                              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700">Date</label>
                            <input
                              type="date"
                              value={paymentForm.date}
                              onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700">Amount</label>
                            <input
                              type="number"
                              value={paymentForm.amount}
                              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700">Deduction</label>
                            <input
                              type="number"
                              value={paymentForm.deduction}
                              onChange={(e) => setPaymentForm({ ...paymentForm, deduction: e.target.value })}
                              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      )}

                      {/* Bank Finance Conditional Fields */}
                      {paymentForm.paymentType === "Bank Finance" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-[50vh] overflow-y-auto">
                          {/* 1. Loan Apply */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-700">Loan Apply</label>
                            <input
                              type="text"
                              value={paymentForm.loanApply}
                              onChange={(e) => setPaymentForm({ ...paymentForm, loanApply: e.target.value })}
                              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder="e.g. Yes / No / In Progress"
                            />
                          </div>

                          {/* 3. Application Number */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-700">Application Number</label>
                            <input
                              type="text"
                              value={paymentForm.applicationNumber}
                              onChange={(e) => setPaymentForm({ ...paymentForm, applicationNumber: e.target.value })}
                              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>

                          {/* 4. Registration Number */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-700">Registration Number</label>
                            <input
                              type="text"
                              value={paymentForm.registrationNumber}
                              onChange={(e) => setPaymentForm({ ...paymentForm, registrationNumber: e.target.value })}
                              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>

                          {/* File fields */}
                          {[
                            { label: "Submission Upload", key: "submissionUpload" },
                            { label: "Feasibility Report", key: "feasibilityReport" },
                            { label: "Digital Loan Approval", key: "digitalLoanApproval" },
                            { label: "Site Feasibility Report", key: "siteFeasibilityReport" },
                            { label: "Electricity Bill", key: "electricityBill" },
                            { label: "Aadhaar Card", key: "aadhaarCard" },
                            { label: "PAN Card", key: "panCard" },
                            { label: "Bank Statement", key: "bankStatement" },
                            { label: "Vendor Consumer Agreement", key: "vendorConsumerAgreement" },
                          ].map((field) => (
                            <div key={field.key} className="space-y-1">
                              <label className="block text-xs font-semibold text-gray-700">
                                {field.label} (Image / PDF)
                              </label>
                              <div className="flex gap-2 items-center">
                                <div className="relative flex-1">
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => handleFileUpload(field.key, e.target.files[0])}
                                    className="hidden"
                                    id={`${field.key}Input`}
                                  />
                                  <label
                                    htmlFor={`${field.key}Input`}
                                    className="flex items-center justify-between w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer bg-white hover:bg-gray-50 text-xs text-gray-600 transition-colors shadow-xs"
                                  >
                                    <span className="truncate max-w-[130px]">
                                      {fileUploads[field.key]?.name || "Select file"}
                                    </span>
                                    {fileUploads[field.key]?.uploading ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                    ) : (
                                      <Upload className="h-4 w-4 text-gray-400" />
                                    )}
                                  </label>
                                </div>
                                {fileUploads[field.key]?.url && (
                                  <button
                                    type="button"
                                    onClick={() => setViewingFileUrl(fileUploads[field.key].url)}
                                    className="p-2 border border-blue-200 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors shrink-0"
                                    title="View Current File"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                <button
                  type="button"
                  onClick={handlePaymentSubmit}
                  disabled={isSubmitting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* File Viewer Modal */}
      {viewingFileUrl && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setViewingFileUrl(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="relative inline-block align-middle bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full z-10">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-900">Document Preview</h3>
                <button
                  type="button"
                  onClick={() => setViewingFileUrl(null)}
                  className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="bg-white p-4 flex justify-center items-center min-h-[300px]">
                {isImage(viewingFileUrl) ? (
                  <div className="flex justify-center bg-gray-100 p-2 rounded-lg max-w-full">
                    <img src={viewingFileUrl} alt="Preview" className="max-w-full max-h-[70vh] object-contain" />
                  </div>
                ) : (
                  <iframe
                    src={viewingFileUrl}
                    title="Document Preview"
                    className="w-full h-[70vh] border-0 rounded-lg"
                  />
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end gap-3 border-t border-gray-200">
                <a
                  href={viewingFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Open in New Tab
                </a>
                <button
                  type="button"
                  onClick={() => setViewingFileUrl(null)}
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default PaymentPage

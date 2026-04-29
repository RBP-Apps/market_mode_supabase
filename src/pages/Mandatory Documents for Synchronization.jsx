"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, X, Search, History, MapPin, Users, Phone, Eye, FileText, Wrench } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"
// Configuration object
const CONFIG = {
  PAGE_CONFIG: {
    title: "Mandatory Documents for Synchronization",
    historyTitle: "Mandatory Documents for Synchronization History",
    description: "Manage pending document submissions",
    historyDescription: "View completed document records",
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

function CSPDCLDocPage() {
  const [pendingData, setPendingData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")

  // Document form state - Updated to use checkboxes that store 'OK' or blank
  const [docForm, setDocForm] = useState({
    powerPurchaseAgreement: "", // Changed from null to empty string for URL storage
    vendorConsumerAgreement: "", // Changed from null to empty string for URL storage
    quotationCopy: false,
    applicationCopy: false,
    physibilityReport: false,
    tokenForSubsidy: false,
    panCard: false,
    aadharCard: false,
    cancellationCheque: false,
    electricityBill: false,
    witnessIdProof: false,
  })

  // Professional file upload status state
  const [fileUploads, setFileUploads] = useState({
    powerPurchaseAgreement: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    vendorConsumerAgreement: { uploading: false, uploaded: false, url: "", error: null, name: "" },
  })

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

    // Return formatted datetime string exactly as "DD/MM/YYYY hh:mm:ss"
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  }, [])

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

  // Optimized data fetching with corrected column mappings
const fetchSheetData = useCallback(async () => {
  try {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from("fms")
      .select("*")

    if (error) throw error

    const pending = []
    const history = []

    data.forEach((row) => {
      if (!row.enquiry_number) return

      const rowData = {
        _id: row.id,
        _enquiryNumber: row.enquiry_number,

        enquiryNumber: row.enquiry_number,
        beneficiaryName: row.beneficiary_name,
        address: row.address,
        contactNumber: row.contact_number,
        surveyorName: row.surveyor_name,

        dispatchMaterial: row.planned_7,
        informToCustomer: row.status_7,

        copyOfReceipt: row.receipt_copy,
        dateOfReceipt: row.receipt_date,
        dateOfInstallation: row.installation_date,
        completeInstallationPhoto: row.installation_photo,

        consumerBillNumber: row.invoice_number,
        vendorBillNumber: row.invoice_amount,

        // DOCUMENT FIELDS (IMPORTANT)
        actual: row.actual_11,

        powerPurchaseAgreement: row.power_purchase_agreement,
        vendorConsumerAgreement: row.vendor_consumer_agreement,
        quotationCopy: row.quotation_copy,
        applicationCopy: row.application_copy,
        physibilityReport: row.physibilty_report,
        tokenForSubsidy: row.token_for_subsidy,
        panCard: row.pan_card_doc,
        aadharCard: row.aadhar_card_doc,
        cancellationCheque: row.cancellation_cheque,
        electricityBill: row.electricity_bill_doc,
        witnessIdProof: row.witness_id_proof,
      }

      if (!row.actual_11) {
        pending.push(rowData)
      } else {
        history.push(rowData)
      }
    })

    setPendingData(pending)
    setHistoryData(history)
    setLoading(false)
  } catch (error) {
    console.error(error)
    setError(error.message)
    setLoading(false)
  }
}, [])




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
    const fileName = `${selectedRecord._enquiryNumber}_doc_${Date.now()}_${file.name}`

    const { error } = await supabase.storage
      .from("IP_assignment")
      .upload(fileName, file)

    if (error) throw error

    const { data } = supabase.storage
      .from("IP_assignment")
      .getPublicUrl(fileName)

    return data.publicUrl
  } catch (error) {
    console.error("Upload error:", error)
    throw error
  }
}, [selectedRecord])



  const handleDocClick = useCallback((record) => {
    setSelectedRecord(record)
    setDocForm({
      powerPurchaseAgreement: record.powerPurchaseAgreement || "",
      vendorConsumerAgreement: record.vendorConsumerAgreement || "",
      quotationCopy: record.quotationCopy === "OK",
      applicationCopy: record.applicationCopy === "OK",
      physibilityReport: record.physibilityReport === "OK",
      tokenForSubsidy: record.tokenForSubsidy === "OK",
      panCard: record.panCard === "OK",
      aadharCard: record.aadharCard === "OK",
      cancellationCheque: record.cancellationCheque === "OK",
      electricityBill: record.electricityBill === "OK",
      witnessIdProof: record.witnessIdProof === "OK",
    })

    // Initialize professional upload status
    setFileUploads({
      powerPurchaseAgreement: {
        uploading: false,
        uploaded: !!record.powerPurchaseAgreement,
        url: record.powerPurchaseAgreement || "",
        error: null,
        name: record.powerPurchaseAgreement ? "Existing Document" : ""
      },
      vendorConsumerAgreement: {
        uploading: false,
        uploaded: !!record.vendorConsumerAgreement,
        url: record.vendorConsumerAgreement || "",
        error: null,
        name: record.vendorConsumerAgreement ? "Existing Document" : ""
      }
    })

    setShowDocModal(true)
  }, [])

  const handleFileUpload = useCallback(async (field, file) => {
    if (!file) return

    // Update form state (backward compatibility)
    setDocForm((prev) => ({ ...prev, [field]: file }))

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

  const handleCheckboxChange = useCallback((field, checked) => {
    setDocForm((prev) => ({ ...prev, [field]: checked }))
  }, [])

const handleDocSubmit = async () => {
  const isEdit = !isEmpty(selectedRecord.actual)

  setIsSubmitting(true)

  try {
    // upload handling
    let powerPurchaseAgreementUrl = fileUploads.powerPurchaseAgreement.url
    let vendorConsumerAgreementUrl = fileUploads.vendorConsumerAgreement.url

    if (docForm.powerPurchaseAgreement instanceof File) {
      powerPurchaseAgreementUrl = await uploadImageToDrive(docForm.powerPurchaseAgreement)
    }

    if (docForm.vendorConsumerAgreement instanceof File) {
      vendorConsumerAgreementUrl = await uploadImageToDrive(docForm.vendorConsumerAgreement)
    }

    const updatePayload = {
      actual_11: isEdit ? selectedRecord.actual : new Date().toISOString(),

      power_purchase_agreement: powerPurchaseAgreementUrl,
      vendor_consumer_agreement: vendorConsumerAgreementUrl,

      quotation_copy: docForm.quotationCopy ? "OK" : "",
      application_copy: docForm.applicationCopy ? "OK" : "",
      physibilty_report: docForm.physibilityReport ? "OK" : "",
      token_for_subsidy: docForm.tokenForSubsidy ? "OK" : "",
      pan_card_doc: docForm.panCard ? "OK" : "",
      aadhar_card_doc: docForm.aadharCard ? "OK" : "",
      cancellation_cheque: docForm.cancellationCheque ? "OK" : "",
      electricity_bill_doc: docForm.electricityBill ? "OK" : "",
      witness_id_proof: docForm.witnessIdProof ? "OK" : "",
    }

    const { error } = await supabase
      .from("fms")
      .update(updatePayload)
      .eq("enquiry_number", selectedRecord._enquiryNumber)

    if (error) throw error

    setSuccessMessage(`Document submitted for ${selectedRecord._enquiryNumber}`)
    setShowDocModal(false)

    fetchSheetData()
  } catch (error) {
    console.error(error)
    alert(error.message)
  } finally {
    setIsSubmitting(false)
  }
}




  const toggleSection = useCallback((section) => {
    setShowHistory(section === "history")
    setSearchTerm("")
  }, [])

  const closeDocModal = useCallback(() => {
    setShowDocModal(false)
    setSelectedRecord(null)
    setDocForm({
      powerPurchaseAgreement: null,
      vendorConsumerAgreement: null,
      quotationCopy: false,
      applicationCopy: false,
      physibilityReport: false,
      tokenForSubsidy: false,
      panCard: false,
      aadharCard: false,
      cancellationCheque: false,
      electricityBill: false,
      witnessIdProof: false,
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
                placeholder={showHistory ? "Search history..." : "Search pending documents..."}
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
              Pending Documents ({filteredPendingData.length})
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
              Document History ({filteredHistoryData.length})
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
                  Completed Documents
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Pending Documents
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
              <p className="text-blue-600 text-sm">Loading CSPDCL Doc data...</p>
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
                      Contact Number Of Beneficiary
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Surveyor Name
                    </th>
                    {!showHistory && (
                      <>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dispatch Material
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inform To Customer
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Copy Of Receipt
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Of Receipt
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Of Installation
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Complete Installation Photo
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Consumer Bill Number
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vendor Bill Number
                        </th>
                      </>
                    )}
                    {showHistory && (
                      <>
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
                          Physibility Report
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Token For Subsidy
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pan Card
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aadhar Card
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cancellation Cheque
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Electricity Bill
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Witness Id Proof
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {showHistory ? (
                    filteredHistoryData.length > 0 ? (
                      filteredHistoryData.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50">
                          <td className="px-2 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleDocClick(record)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Wrench className="h-3 w-3 mr-1" />
                              Edit
                            </button>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.enquiryNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.beneficiaryName || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.address || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.contactNumber || "—"}</div>
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
                            <div className="text-xs text-gray-900">{record.physibilityReport || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.tokenForSubsidy || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.panCard || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.aadharCard || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.cancellationCheque || "—"}</div>
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
                        <td colSpan={17} className="px-4 py-8 text-center text-gray-500 text-sm">
                          {searchTerm ? "No history records matching your search" : "No completed documents found"}
                        </td>
                      </tr>
                    )
                  ) : filteredPendingData.length > 0 ? (
                    filteredPendingData.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-2 py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleDocClick(record)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-linear-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Doc
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
                          <div className="text-xs text-gray-900 flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            {record.contactNumber || "—"}
                          </div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.surveyorName || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{formatDate(record.dispatchMaterial) || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.informToCustomer || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          {record.copyOfReceipt ? (
                            <a
                              href={record.copyOfReceipt}
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
                          <div className="text-xs text-gray-900">{record.dateOfReceipt || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.dateOfInstallation || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          {record.completeInstallationPhoto ? (
                            <a
                              href={record.completeInstallationPhoto}
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
                          <div className="text-xs text-gray-900">{record.consumerBillNumber || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.vendorBillNumber || "—"}</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={15} className="px-4 py-8 text-center text-gray-500 text-sm">
                        {searchTerm ? "No pending documents matching your search" : "No pending documents found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Document Submission Modal */}
        {showDocModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white border max-w-4xl w-full shadow-2xl rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Document Submission Form - Enquiry: {selectedRecord.enquiryNumber}
                  </h3>
                  <button onClick={closeDocModal} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Pre-filled Beneficiary Details */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3 text-sm">Beneficiary Details (Pre-filled)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Enquiry Number</label>
                      <input
                        type="text"
                        value={selectedRecord.enquiryNumber}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Beneficiary Name</label>
                      <input
                        type="text"
                        value={selectedRecord.beneficiaryName}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={selectedRecord.address}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Document Submission Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Power Purchase Agreement */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Power Purchase Agreement <span className="text-red-500">*</span>
                      <span className="text-gray-500 text-xs ml-1">(Image/PDF)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload("powerPurchaseAgreement", e.target.files[0])}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <UploadStatus field="powerPurchaseAgreement" />

                    {selectedRecord?.powerPurchaseAgreement && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-xs text-gray-500 font-medium italic">Existing Doc:</span>
                        <button
                          type="button"
                          onClick={() => window.open(selectedRecord.powerPurchaseAgreement, "_blank", "noopener,noreferrer")}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview Previous
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Vendor Consumer Agreement */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor Consumer Agreement <span className="text-red-500">*</span>
                      <span className="text-gray-500 text-xs ml-1">(Image/PDF)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload("vendorConsumerAgreement", e.target.files[0])}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <UploadStatus field="vendorConsumerAgreement" />

                    {selectedRecord?.vendorConsumerAgreement && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-xs text-gray-500 font-medium italic">Existing Doc:</span>
                        <button
                          type="button"
                          onClick={() => window.open(selectedRecord.vendorConsumerAgreement, "_blank", "noopener,noreferrer")}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview Previous
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Checkbox Fields */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="quotationCopy"
                      checked={docForm.quotationCopy}
                      onChange={(e) => handleCheckboxChange("quotationCopy", e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="quotationCopy" className="ml-2 block text-sm text-gray-900">
                      Quotation Copy
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="applicationCopy"
                      checked={docForm.applicationCopy}
                      onChange={(e) => handleCheckboxChange("applicationCopy", e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="applicationCopy" className="ml-2 block text-sm text-gray-900">
                      Application Copy
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="physibilityReport"
                      checked={docForm.physibilityReport}
                      onChange={(e) => handleCheckboxChange("physibilityReport", e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="physibilityReport" className="ml-2 block text-sm text-gray-900">
                      Physibility Report
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="tokenForSubsidy"
                      checked={docForm.tokenForSubsidy}
                      onChange={(e) => handleCheckboxChange("tokenForSubsidy", e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="tokenForSubsidy" className="ml-2 block text-sm text-gray-900">
                      Token For Subsidy
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="panCard"
                      checked={docForm.panCard}
                      onChange={(e) => handleCheckboxChange("panCard", e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="panCard" className="ml-2 block text-sm text-gray-900">
                      Pan Card
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="aadharCard"
                      checked={docForm.aadharCard}
                      onChange={(e) => handleCheckboxChange("aadharCard", e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="aadharCard" className="ml-2 block text-sm text-gray-900">
                      Aadhar Card
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="cancellationCheque"
                      checked={docForm.cancellationCheque}
                      onChange={(e) => handleCheckboxChange("cancellationCheque", e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="cancellationCheque" className="ml-2 block text-sm text-gray-900">
                      Cancellation Cheque
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="electricityBill"
                      checked={docForm.electricityBill}
                      onChange={(e) => handleCheckboxChange("electricityBill", e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="electricityBill" className="ml-2 block text-sm text-gray-900">
                      Electricity Bill
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="witnessIdProof"
                      checked={docForm.witnessIdProof}
                      onChange={(e) => handleCheckboxChange("witnessIdProof", e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="witnessIdProof" className="ml-2 block text-sm text-gray-900">
                      Witness Id Proof
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 mt-8 pt-4 border-t">
                  <button
                    onClick={closeDocModal}
                    disabled={isSubmitting}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDocSubmit}
                    disabled={
                      isSubmitting ||
                      (!docForm.powerPurchaseAgreement && !selectedRecord?.powerPurchaseAgreement) ||
                      (!docForm.vendorConsumerAgreement && !selectedRecord?.vendorConsumerAgreement)
                    }
                    className="px-6 py-2 bg-linear-to-r from-green-500 to-blue-600 text-white rounded-md hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center shadow-lg transform transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Submit
                      </>
                    )}
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

export default CSPDCLDocPage
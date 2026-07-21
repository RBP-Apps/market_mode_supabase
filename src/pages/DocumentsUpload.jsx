"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, X, Search, History, Eye, User, FileText, Upload, Calendar, Edit2, AlertCircle } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

// Page configuration
const CONFIG = {
  PAGE_CONFIG: {
    title: "Documents Upload",
    historyTitle: "Documents Upload History",
    description: "Manage client document submissions and verification details",
    historyDescription: "View and edit completed document uploads",
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

export default function DocumentsUpload() {
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
  const [surveyForm, setSurveyForm] = useState({
    electricityBill: null, // File or URL string
    aadharNumber: "",
    panNumber: "",
    addressProof: null, // File or URL string
    surveyorName: "",
    panCardCopy: null,
    aadharCardCopy: null,
    registeredMobileNumber: "",
    emailId: "",
    bankDocumentCopy: null,
    propertyTaxReceipt: null,
    sitePreInstallation: null
  })

  // Track upload status/preview
  const [fileUploads, setFileUploads] = useState({
    electricityBill: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    addressProof: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    panCardCopy: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    aadharCardCopy: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    bankDocumentCopy: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    propertyTaxReceipt: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    sitePreInstallation: { uploading: false, uploaded: false, url: "", error: null, name: "" }
  })

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const fetchSheetData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("documents_uploads")
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
          electricityBill: row.electricity_bill || "",
          aadharNumber: row.aadhar_number || "",
          panNumber: row.pan_number || "",
          addressProof: row.address_proof || "",
          surveyorName: row.surveyor_name || "",
          panCardCopy: row.pan_card_copy || "",
          aadharCardCopy: row.aadhar_card_copy || "",
          registeredMobileNumber: row.registered_mobile_number || "",
          emailId: row.email_id || "",
          bankDocumentCopy: row.bank_document_copy || "",
          propertyTaxReceipt: row.property_tax_receipt || "",
          sitePreInstallation: row.site_pre_installation || ""
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
      console.error("Error fetching documents data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSheetData()
  }, [fetchSheetData])

  // Search filter implementation
  const filteredPendingData = useMemo(() => {
    return debouncedSearchTerm
      ? pendingData.filter((record) =>
          Object.values(record).some(
            (value) => value && value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          )
        )
      : pendingData
  }, [pendingData, debouncedSearchTerm])

  const filteredHistoryData = useMemo(() => {
    return debouncedSearchTerm
      ? historyData.filter((record) =>
          Object.values(record).some(
            (value) => value && value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          )
        )
      : historyData
  }, [historyData, debouncedSearchTerm])

  const handleActionClick = useCallback((record) => {
    setSelectedRecord(record)
    setSurveyForm({
      electricityBill: record.electricityBill || null,
      aadharNumber: record.aadharNumber || "",
      panNumber: record.panNumber || "",
      addressProof: record.addressProof || null,
      surveyorName: record.surveyorName || "",
      panCardCopy: record.panCardCopy || null,
      aadharCardCopy: record.aadharCardCopy || null,
      registeredMobileNumber: record.registeredMobileNumber || "",
      emailId: record.emailId || "",
      bankDocumentCopy: record.bankDocumentCopy || null,
      propertyTaxReceipt: record.propertyTaxReceipt || null,
      sitePreInstallation: record.sitePreInstallation || null
    })
    setFileUploads({
      electricityBill: {
        uploading: false,
        uploaded: !!record.electricityBill,
        url: record.electricityBill || "",
        error: null,
        name: record.electricityBill ? "Existing Document" : ""
      },
      addressProof: {
        uploading: false,
        uploaded: !!record.addressProof,
        url: record.addressProof || "",
        error: null,
        name: record.addressProof ? "Existing Document" : ""
      },
      panCardCopy: {
        uploading: false,
        uploaded: !!record.panCardCopy,
        url: record.panCardCopy || "",
        error: null,
        name: record.panCardCopy ? "Existing Document" : ""
      },
      aadharCardCopy: {
        uploading: false,
        uploaded: !!record.aadharCardCopy,
        url: record.aadharCardCopy || "",
        error: null,
        name: record.aadharCardCopy ? "Existing Document" : ""
      },
      bankDocumentCopy: {
        uploading: false,
        uploaded: !!record.bankDocumentCopy,
        url: record.bankDocumentCopy || "",
        error: null,
        name: record.bankDocumentCopy ? "Existing Document" : ""
      },
      propertyTaxReceipt: {
        uploading: false,
        uploaded: !!record.propertyTaxReceipt,
        url: record.propertyTaxReceipt || "",
        error: null,
        name: record.propertyTaxReceipt ? "Existing Document" : ""
      },
      sitePreInstallation: {
        uploading: false,
        uploaded: !!record.sitePreInstallation,
        url: record.sitePreInstallation || "",
        error: null,
        name: record.sitePreInstallation ? "Existing Document" : ""
      }
    })
    setShowModal(true)
  }, [])

  const handleInputChange = useCallback((field, value) => {
    setSurveyForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleFileUpload = useCallback((field, file) => {
    if (!file) return

    setSurveyForm((prev) => ({ ...prev, [field]: file }))
    setFileUploads((prev) => ({
      ...prev,
      [field]: { ...prev[field], uploaded: false, error: null, name: file.name, ready: true }
    }))
  }, [])

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

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // 1. Upload files if they are raw file objects
      let electricityBillUrl = surveyForm.electricityBill
      if (surveyForm.electricityBill instanceof File) {
        setFileUploads(prev => ({ ...prev, electricityBill: { ...prev.electricityBill, uploading: true } }))
        electricityBillUrl = await uploadFileToSupabase(surveyForm.electricityBill, "elec_bill")
        setFileUploads(prev => ({ ...prev, electricityBill: { ...prev.electricityBill, uploading: false, uploaded: true, url: electricityBillUrl } }))
      }

      let addressProofUrl = surveyForm.addressProof
      if (surveyForm.addressProof instanceof File) {
        setFileUploads(prev => ({ ...prev, addressProof: { ...prev.addressProof, uploading: true } }))
        addressProofUrl = await uploadFileToSupabase(surveyForm.addressProof, "addr_proof")
        setFileUploads(prev => ({ ...prev, addressProof: { ...prev.addressProof, uploading: false, uploaded: true, url: addressProofUrl } }))
      }

      let panCardCopyUrl = surveyForm.panCardCopy
      if (surveyForm.panCardCopy instanceof File) {
        setFileUploads(prev => ({ ...prev, panCardCopy: { ...prev.panCardCopy, uploading: true } }))
        panCardCopyUrl = await uploadFileToSupabase(surveyForm.panCardCopy, "pan_card")
        setFileUploads(prev => ({ ...prev, panCardCopy: { ...prev.panCardCopy, uploading: false, uploaded: true, url: panCardCopyUrl } }))
      }

      let aadharCardCopyUrl = surveyForm.aadharCardCopy
      if (surveyForm.aadharCardCopy instanceof File) {
        setFileUploads(prev => ({ ...prev, aadharCardCopy: { ...prev.aadharCardCopy, uploading: true } }))
        aadharCardCopyUrl = await uploadFileToSupabase(surveyForm.aadharCardCopy, "aadhar_card")
        setFileUploads(prev => ({ ...prev, aadharCardCopy: { ...prev.aadharCardCopy, uploading: false, uploaded: true, url: aadharCardCopyUrl } }))
      }

      let bankDocumentCopyUrl = surveyForm.bankDocumentCopy
      if (surveyForm.bankDocumentCopy instanceof File) {
        setFileUploads(prev => ({ ...prev, bankDocumentCopy: { ...prev.bankDocumentCopy, uploading: true } }))
        bankDocumentCopyUrl = await uploadFileToSupabase(surveyForm.bankDocumentCopy, "bank_doc")
        setFileUploads(prev => ({ ...prev, bankDocumentCopy: { ...prev.bankDocumentCopy, uploading: false, uploaded: true, url: bankDocumentCopyUrl } }))
      }

      let propertyTaxReceiptUrl = surveyForm.propertyTaxReceipt
      if (surveyForm.propertyTaxReceipt instanceof File) {
        setFileUploads(prev => ({ ...prev, propertyTaxReceipt: { ...prev.propertyTaxReceipt, uploading: true } }))
        propertyTaxReceiptUrl = await uploadFileToSupabase(surveyForm.propertyTaxReceipt, "prop_tax")
        setFileUploads(prev => ({ ...prev, propertyTaxReceipt: { ...prev.propertyTaxReceipt, uploading: false, uploaded: true, url: propertyTaxReceiptUrl } }))
      }

      let sitePreInstallationUrl = surveyForm.sitePreInstallation
      if (surveyForm.sitePreInstallation instanceof File) {
        setFileUploads(prev => ({ ...prev, sitePreInstallation: { ...prev.sitePreInstallation, uploading: true } }))
        sitePreInstallationUrl = await uploadFileToSupabase(surveyForm.sitePreInstallation, "site_pre_inst")
        setFileUploads(prev => ({ ...prev, sitePreInstallation: { ...prev.sitePreInstallation, uploading: false, uploaded: true, url: sitePreInstallationUrl } }))
      }

      // 2. Prepare payload for DB
      const updatePayload = {
        actual: new Date().toISOString(),
        electricity_bill: electricityBillUrl || null,
        aadhar_number: surveyForm.aadharNumber || null,
        pan_number: surveyForm.panNumber || null,
        address_proof: addressProofUrl || null,
        surveyor_name: surveyForm.surveyorName || null,
        pan_card_copy: panCardCopyUrl || null,
        aadhar_card_copy: aadharCardCopyUrl || null,
        registered_mobile_number: surveyForm.registeredMobileNumber || null,
        email_id: surveyForm.emailId || null,
        bank_document_copy: bankDocumentCopyUrl || null,
        property_tax_receipt: propertyTaxReceiptUrl || null,
        site_pre_installation: sitePreInstallationUrl || null
      }

      const { error: updateError } = await supabase
        .from("documents_uploads")
        .update(updatePayload)
        .eq("enquiry_number", selectedRecord.enquiryNumber)

      if (updateError) throw updateError

      setSuccessMessage(`Documents updated successfully for ${selectedRecord.enquiryNumber}`)
      setShowModal(false)
      fetchSheetData()

      setTimeout(() => setSuccessMessage(""), 4000)
    } catch (err) {
      console.error("Error submitting documents:", err)
      alert("Submission failed: " + err.message)
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
              placeholder={showHistory ? "Search history..." : "Search pending uploads..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              <Upload className="h-4 w-4 mr-2" />
              Pending Uploads ({filteredPendingData.length})
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
              Upload History ({filteredHistoryData.length})
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
              <p className="text-blue-600 text-sm">Fetching document records...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-6 rounded-md text-red-800 text-center text-sm border border-red-100">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p>{error}</p>
              <button className="underline mt-2 font-medium text-red-600 hover:text-red-800" onClick={() => fetchSheetData()}>
                Retry Fetching
              </button>
            </div>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: "65vh" }}>
              <table className="min-w-full divide-y divide-gray-200 text-center">
                <thead className="bg-gray-50 sticky top-0 z-10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3">Action</th>
                    <th className="px-3 py-3">Enquiry Number</th>
                    <th className="px-3 py-3">Beneficiary Name</th>
                    <th className="px-3 py-3">Contact</th>
                    <th className="px-3 py-3">Address</th>
                    <th className="px-3 py-3">Village/Block</th>
                    <th className="px-3 py-3">District</th>
                    {showHistory && (
                      <>
                        <th className="px-3 py-3">PAN Number</th>
                        <th className="px-3 py-3">PAN Card Copy</th>
                        <th className="px-3 py-3">Aadhar Number</th>
                        <th className="px-3 py-3">Aadhar Card Copy</th>
                        <th className="px-3 py-3">Electricity Bill Copy</th>
                        <th className="px-3 py-3">Registered Mobile Number</th>
                        <th className="px-3 py-3">Email ID</th>
                        <th className="px-3 py-3">Bank Document</th>
                        <th className="px-3 py-3">Property Tax Receipt</th>
                        <th className="px-3 py-3">Site Pre Installation</th>
                        <th className="px-3 py-3">Address Proof</th>
                        <th className="px-3 py-3">Surveyor Name</th>
                        <th className="px-3 py-3">Upload Date</th>
                        <th className="px-3 py-3">Delay</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-xs text-gray-600">
                  {showHistory ? (
                    filteredHistoryData.length > 0 ? (
                      filteredHistoryData.map((record) => (
                        <tr key={record._id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-3 py-3">
                            <button
                              onClick={() => handleActionClick(record)}
                              className="inline-flex items-center px-2 py-1 border border-blue-200 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </button>
                          </td>
                          <td className="px-3 py-3 font-semibold text-gray-900">{record.enquiryNumber}</td>
                          <td className="px-3 py-3 font-medium text-gray-900">{record.beneficiaryName}</td>
                          <td className="px-3 py-3">{record.contactNumber || "—"}</td>
                          <td className="px-3 py-3 max-w-xs truncate" title={record.address}>{record.address || "—"}</td>
                          <td className="px-3 py-3">{record.villageBlock || "—"}</td>
                          <td className="px-3 py-3">{record.district || "—"}</td>
                          <td className="px-3 py-3 font-mono">{record.panNumber || "—"}</td>
                          <td className="px-3 py-3">
                            {record.panCardCopy ? (
                              <a
                                href={record.panCardCopy}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                              >
                                <Eye className="h-3.5 w-3.5 mr-0.5" /> View
                              </a>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-3 font-mono">{record.aadharNumber || "—"}</td>
                          <td className="px-3 py-3">
                            {record.aadharCardCopy ? (
                              <a
                                href={record.aadharCardCopy}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                              >
                                <Eye className="h-3.5 w-3.5 mr-0.5" /> View
                              </a>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-3">
                            {record.electricityBill ? (
                              <a
                                href={record.electricityBill}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                              >
                                <Eye className="h-3.5 w-3.5 mr-0.5" /> View
                              </a>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-3">{record.registeredMobileNumber || "—"}</td>
                          <td className="px-3 py-3">{record.emailId || "—"}</td>
                          <td className="px-3 py-3">
                            {record.bankDocumentCopy ? (
                              <a
                                href={record.bankDocumentCopy}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                              >
                                <Eye className="h-3.5 w-3.5 mr-0.5" /> View
                              </a>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-3">
                            {record.propertyTaxReceipt ? (
                              <a
                                href={record.propertyTaxReceipt}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                              >
                                <Eye className="h-3.5 w-3.5 mr-0.5" /> View
                              </a>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-3">
                            {record.sitePreInstallation ? (
                              <a
                                href={record.sitePreInstallation}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                              >
                                <Eye className="h-3.5 w-3.5 mr-0.5" /> View
                              </a>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-3">
                            {record.addressProof ? (
                              <a
                                href={record.addressProof}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                              >
                                <Eye className="h-3.5 w-3.5 mr-0.5" /> View
                              </a>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-3">{record.surveyorName || "—"}</td>
                          <td className="px-3 py-3">
                            {record.actual ? new Date(record.actual).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-3 py-3">
                            {record.delay ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                parseInt(record.delay) > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                              }`}>
                                {record.delay} days
                              </span>
                            ) : "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={21} className="py-8 text-center text-gray-400">No records found.</td>
                      </tr>
                    )
                  ) : (
                    filteredPendingData.length > 0 ? (
                      filteredPendingData.map((record) => (
                        <tr key={record._id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-3 py-3">
                            <button
                              onClick={() => handleActionClick(record)}
                              className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-medium rounded-md text-white hover:from-blue-700 hover:to-indigo-700 shadow-xs transition-all"
                            >
                              <Upload className="h-3.5 w-3.5 mr-1" />
                              Upload
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
                        <td colSpan={7} className="py-8 text-center text-gray-400">No pending uploads.</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showModal && selectedRecord && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 transform transition-all scale-100">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="font-bold text-lg">Upload Client Documents</h3>
                  <p className="text-xs text-blue-100 mt-0.5">Enquiry: {selectedRecord.enquiryNumber}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-full p-1.5 bg-white/10 hover:bg-white/20 transition-all text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* 1. PAN Card Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    PAN Card Number
                  </label>
                  <input
                    type="text"
                    value={surveyForm.panNumber}
                    onChange={(e) => handleInputChange("panNumber", e.target.value.toUpperCase())}
                    placeholder="Enter PAN Card Number"
                    maxLength={10}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                  />
                </div>

                {/* 2. PAN Card Copy */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    PAN Card Copy
                  </label>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload("panCardCopy", e.target.files[0])}
                        className="hidden"
                        id="panCardCopyInput"
                      />
                      <label
                        htmlFor="panCardCopyInput"
                        className="flex items-center justify-between w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer bg-gray-50 hover:bg-gray-100 text-xs text-gray-600 transition-colors"
                      >
                        <span className="truncate max-w-[200px]">
                          {fileUploads.panCardCopy.name || "Select document file"}
                        </span>
                        <Upload className="h-4 w-4 text-gray-400" />
                      </label>
                    </div>

                    {fileUploads.panCardCopy.url && (
                      <a
                        href={fileUploads.panCardCopy.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-blue-200 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        title="View Current File"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {fileUploads.panCardCopy.uploading && (
                    <p className="text-[10px] text-blue-500 animate-pulse">Uploading to Storage...</p>
                  )}
                  {fileUploads.panCardCopy.ready && !fileUploads.panCardCopy.uploading && (
                    <p className="text-[10px] text-amber-600">File selected (Will upload on Submit)</p>
                  )}
                </div>

                {/* 3. Aadhar Card Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Aadhar Card Number
                  </label>
                  <input
                    type="text"
                    value={surveyForm.aadharNumber}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/\D/g, "")
                      handleInputChange("aadharNumber", cleanVal)
                    }}
                    placeholder="Enter Aadhar Card Number"
                    maxLength={12}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 4. Aadhar Card Copy */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Aadhar Card Copy
                  </label>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload("aadharCardCopy", e.target.files[0])}
                        className="hidden"
                        id="aadharCardCopyInput"
                      />
                      <label
                        htmlFor="aadharCardCopyInput"
                        className="flex items-center justify-between w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer bg-gray-50 hover:bg-gray-100 text-xs text-gray-600 transition-colors"
                      >
                        <span className="truncate max-w-[200px]">
                          {fileUploads.aadharCardCopy.name || "Select document file"}
                        </span>
                        <Upload className="h-4 w-4 text-gray-400" />
                      </label>
                    </div>

                    {fileUploads.aadharCardCopy.url && (
                      <a
                        href={fileUploads.aadharCardCopy.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-blue-200 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        title="View Current File"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {fileUploads.aadharCardCopy.uploading && (
                    <p className="text-[10px] text-blue-500 animate-pulse">Uploading to Storage...</p>
                  )}
                  {fileUploads.aadharCardCopy.ready && !fileUploads.aadharCardCopy.uploading && (
                    <p className="text-[10px] text-amber-600">File selected (Will upload on Submit)</p>
                  )}
                </div>

                {/* 5. Three Months Electricity Bill Copy */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Three Months Electricity Bill Copy
                  </label>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload("electricityBill", e.target.files[0])}
                        className="hidden"
                        id="electricityBillInput"
                      />
                      <label
                        htmlFor="electricityBillInput"
                        className="flex items-center justify-between w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer bg-gray-50 hover:bg-gray-100 text-xs text-gray-600 transition-colors"
                      >
                        <span className="truncate max-w-[200px]">
                          {fileUploads.electricityBill.name || "Select document file"}
                        </span>
                        <Upload className="h-4 w-4 text-gray-400" />
                      </label>
                    </div>

                    {fileUploads.electricityBill.url && (
                      <a
                        href={fileUploads.electricityBill.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-blue-200 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        title="View Current File"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {fileUploads.electricityBill.uploading && (
                    <p className="text-[10px] text-blue-500 animate-pulse">Uploading to Storage...</p>
                  )}
                  {fileUploads.electricityBill.ready && !fileUploads.electricityBill.uploading && (
                    <p className="text-[10px] text-amber-600">File selected (Will upload on Submit)</p>
                  )}
                </div>

                {/* 6. Mobile Number Registered in Electricity Bill */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Mobile Number Registered in Electricity Bill
                  </label>
                  <input
                    type="text"
                    value={surveyForm.registeredMobileNumber}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/\D/g, "")
                      handleInputChange("registeredMobileNumber", cleanVal)
                    }}
                    placeholder="Enter Registered Mobile Number"
                    maxLength={10}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 7. Email ID */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Email ID
                  </label>
                  <input
                    type="email"
                    value={surveyForm.emailId}
                    onChange={(e) => handleInputChange("emailId", e.target.value)}
                    placeholder="Enter Email Address"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 8. Cancelled Cheque / Bank Statement / Bank Passbook */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Cancelled Cheque / Bank Statement / Bank Passbook
                  </label>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload("bankDocumentCopy", e.target.files[0])}
                        className="hidden"
                        id="bankDocumentCopyInput"
                      />
                      <label
                        htmlFor="bankDocumentCopyInput"
                        className="flex items-center justify-between w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer bg-gray-50 hover:bg-gray-100 text-xs text-gray-600 transition-colors"
                      >
                        <span className="truncate max-w-[200px]">
                          {fileUploads.bankDocumentCopy.name || "Select document file"}
                        </span>
                        <Upload className="h-4 w-4 text-gray-400" />
                      </label>
                    </div>

                    {fileUploads.bankDocumentCopy.url && (
                      <a
                        href={fileUploads.bankDocumentCopy.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-blue-200 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        title="View Current File"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {fileUploads.bankDocumentCopy.uploading && (
                    <p className="text-[10px] text-blue-500 animate-pulse">Uploading to Storage...</p>
                  )}
                  {fileUploads.bankDocumentCopy.ready && !fileUploads.bankDocumentCopy.uploading && (
                    <p className="text-[10px] text-amber-600">File selected (Will upload on Submit)</p>
                  )}
                </div>

                {/* 9. Property Tax Receipt */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Property Tax Receipt
                  </label>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload("propertyTaxReceipt", e.target.files[0])}
                        className="hidden"
                        id="propertyTaxReceiptInput"
                      />
                      <label
                        htmlFor="propertyTaxReceiptInput"
                        className="flex items-center justify-between w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer bg-gray-50 hover:bg-gray-100 text-xs text-gray-600 transition-colors"
                      >
                        <span className="truncate max-w-[200px]">
                          {fileUploads.propertyTaxReceipt.name || "Select document file"}
                        </span>
                        <Upload className="h-4 w-4 text-gray-400" />
                      </label>
                    </div>

                    {fileUploads.propertyTaxReceipt.url && (
                      <a
                        href={fileUploads.propertyTaxReceipt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-blue-200 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        title="View Current File"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {fileUploads.propertyTaxReceipt.uploading && (
                    <p className="text-[10px] text-blue-500 animate-pulse">Uploading to Storage...</p>
                  )}
                  {fileUploads.propertyTaxReceipt.ready && !fileUploads.propertyTaxReceipt.uploading && (
                    <p className="text-[10px] text-amber-600">File selected (Will upload on Submit)</p>
                  )}
                </div>

                {/* 10. Site Pre Installation */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Site Pre Installation
                  </label>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload("sitePreInstallation", e.target.files[0])}
                        className="hidden"
                        id="sitePreInstallationInput"
                      />
                      <label
                        htmlFor="sitePreInstallationInput"
                        className="flex items-center justify-between w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer bg-gray-50 hover:bg-gray-100 text-xs text-gray-600 transition-colors"
                      >
                        <span className="truncate max-w-[200px]">
                          {fileUploads.sitePreInstallation.name || "Select document file"}
                        </span>
                        <Upload className="h-4 w-4 text-gray-400" />
                      </label>
                    </div>

                    {fileUploads.sitePreInstallation.url && (
                      <a
                        href={fileUploads.sitePreInstallation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-blue-200 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        title="View Current File"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {fileUploads.sitePreInstallation.uploading && (
                    <p className="text-[10px] text-blue-500 animate-pulse">Uploading to Storage...</p>
                  )}
                  {fileUploads.sitePreInstallation.ready && !fileUploads.sitePreInstallation.uploading && (
                    <p className="text-[10px] text-amber-600">File selected (Will upload on Submit)</p>
                  )}
                </div>

                {/* 11. Surveyor Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Surveyor Name
                  </label>
                  <input
                    type="text"
                    value={surveyForm.surveyorName}
                    onChange={(e) => handleInputChange("surveyorName", e.target.value)}
                    placeholder="Enter surveyor name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 py-1.5 px-4 text-xs font-medium text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-1.5 px-4 text-xs font-semibold text-white hover:from-blue-700 hover:to-indigo-700 shadow-xs focus:outline-none disabled:opacity-55 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? "Submitting..." : "Save Documents"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

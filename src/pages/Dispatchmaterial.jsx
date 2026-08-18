"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { 
  CheckCircle2, X, Search, History, MapPin, Users, 
  Phone, Eye, Package, Truck, Upload, Edit2, Plus, FileText 
} from "lucide-react"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("create") // "create" or "edit"
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [statusValue, setStatusValue] = useState("Yes")
  const [tellyPhotoFile, setTellyPhotoFile] = useState(null)
  const [tellyPhotoPreview, setTellyPhotoPreview] = useState("")
  const [existingTellyPhotoUrl, setExistingTellyPhotoUrl] = useState("")

  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    const role = sessionStorage.getItem("role")
    const user = sessionStorage.getItem("username")
    setUserRole(role || "")
    setUsername(user || "")
  }, [])

  // Optimized data fetching
  const fetchSheetData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // fetch dispatch_materials, quotation, and completed dispatch_planner (history) in parallel
      const [{ data: dmData, error: dmError }, { data: quotationData, error: quotationError }, { data: dpHistoryData, error: dpError }] =
        await Promise.all([
          supabase
            .from("dispatch_materials")
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
          supabase
            .from("new_quatation_create")
            .select("*"),
          supabase
            .from("dispatch_planner")
            .select("enquiry_number, actual")
            .not("actual", "is", null),
        ])

      if (dmError) throw dmError
      if (quotationError) throw quotationError
      if (dpError) {
        console.warn("Could not fetch dispatch_planner history for validation:", dpError)
      }

      // FAST MAP for quotations
      const quotationMap = {}
      quotationData.forEach((q) => {
        quotationMap[q.enquiry_number] = q
      })

      // Set of enquiry_numbers available in Dispatch Planner History (actual IS NOT NULL)
      const dpHistoryEnquiries = new Set(
        (dpHistoryData || [])
          .filter((dp) => dp.actual)
          .map((dp) => String(dp.enquiry_number).trim())
      )

      const pending = []
      const history = []

      ;(dmData || []).forEach((row) => {
        const enquiryNumber = row.enquiry_number || ""
        const enq = row.enquiries || {}
        const quotation = quotationMap[enquiryNumber] || {}

        const rowData = {
          _id: row.id,
          _rowIndex: row.id,

          enquiryNumber: enquiryNumber,
          beneficiaryName: enq.beneficiary_name || "",
          address: enq.address || "",
          villageBlock: enq.village_block || "",
          district: enq.district || "",
          contactNumber: enq.contact_number || "",

          surveyorName: "",
          surveyorContact: "",

          orderCopy: "",

          ipName: "",
          ipContact: "",

          gstNumber: "",
          gstCertificates: "",
          aadharCard: "",
          panCard: "",
          workOrderNumber: "",
          workOrderCopy: "",

          // QUOTATION DATA ADD
          amount: quotation.amount || "",
          netCost: quotation.net_cost || "",
          gst: quotation.gst || "",
          rate: quotation.rate || "",
          qty: quotation.qty || "",
          quotationCopy: quotation.quatation_copy || "",
          sendStatus: quotation.send_status || "",
          quotationBank: quotation.bank_name || "",
          bankAccountDetails: quotation.bank_name || "",

          // EXISTING LOGIC
          actual: row.actual || "",
          dispatchMaterial: row.status || "",
          tellyPhoto: row.telly_photo || "",
        }

        if (!row.actual) {
          // Only show in Pending if available in Dispatch Planner History
          if (dpHistoryEnquiries.has(String(enquiryNumber).trim())) {
            pending.push(rowData)
          }
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

  const toggleSection = useCallback((section) => {
    setShowHistory(section === "history")
    setSearchTerm("")
  }, [])

  // Open modal handler
  const handleOpenModal = (record, type = "create") => {
    setSelectedRecord(record)
    setModalType(type)
    setStatusValue(record.dispatchMaterial === "No" ? "No" : "Yes")
    setExistingTellyPhotoUrl(record.tellyPhoto || "")
    setTellyPhotoFile(null)
    setTellyPhotoPreview("")
    setShowModal(true)
  }

  // Handle Modal Submit
  const handleModalSubmit = async (e) => {
    e.preventDefault()

    if (!selectedRecord) return
    if (modalType === "create" && !tellyPhotoFile) {
      alert("Please upload a Tally Photo.")
      return
    }

    setIsSubmitting(true)

    try {
      const enqNum = selectedRecord.enquiryNumber || "GEN"
      let tellyPhotoUrl = existingTellyPhotoUrl

      if (tellyPhotoFile) {
        const fileExt = tellyPhotoFile.name.split(".").pop()
        const fileName = `${enqNum}_telly_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `dispatch_materials/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("survey_file")
          .upload(filePath, tellyPhotoFile)

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from("survey_file")
          .getPublicUrl(filePath)

        tellyPhotoUrl = publicUrlData.publicUrl
      }

      const updatePayload = {
        status: statusValue,
        telly_photo: tellyPhotoUrl,
        actual: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from("dispatch_materials")
        .update(updatePayload)
        .eq("enquiry_number", selectedRecord.enquiryNumber)

      if (updateError) throw updateError

      setSuccessMessage(modalType === "create" ? "Material dispatch submitted successfully!" : "Material dispatch details updated!")
      setShowModal(false)
      setSelectedRecord(null)
      await fetchSheetData()
      setTimeout(() => setSuccessMessage(""), 5000)
    } catch (err) {
      console.error("Submission error:", err)
      alert("Operation failed: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

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
              <table className="min-w-full divide-y divide-gray-200 text-center">
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
                      Contact Number Of Beneficiary
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Surveyor Name
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Number
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Copy
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Name
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Number Of IP
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GST Number
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GST Certificates
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bank Account Details
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aadhar Card
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pan Card
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Order Number
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Order Copy
                    </th>
                    {showHistory && (
                      <>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tally Photo
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
                              type="button"
                              onClick={() => handleOpenModal(record, "edit")}
                              className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-md font-semibold transition inline-flex items-center gap-1"
                            >
                              <Edit2 className="h-3 w-3" />
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
                            <div className="text-xs text-gray-900">{record.surveyorName || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.surveyorContact || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            {record.orderCopy ? (
                              <a
                                href={record.orderCopy}
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
                            <div className="text-xs text-gray-900 font-medium text-blue-600">
                              {record.ipName || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.ipContact || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.gstNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            {record.gstCertificates ? (
                              <a
                                href={record.gstCertificates}
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
                            {record.bankAccountDetails || ""}
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            {record.aadharCard || ""}
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            {record.panCard || ""}
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.workOrderNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            {record.workOrderCopy ? (
                              <a
                                href={record.workOrderCopy}
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
                            <div className={`text-xs font-semibold ${record.dispatchMaterial === "Yes" ? "text-green-600" : "text-red-600"}`}>
                              {record.dispatchMaterial || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            {record.tellyPhoto ? (
                              <a
                                href={record.tellyPhoto}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center justify-center text-xs font-semibold"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Photo
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
                        <td className="px-2 py-3 whitespace-normal">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(record, "create")}
                            className="text-xs bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md font-semibold transition inline-flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Update Dispatch
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
                          <div className="text-xs text-gray-900">{record.surveyorName || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          <div className="text-xs text-gray-900">{record.surveyorContact || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          {record.orderCopy ? (
                            <a
                              href={record.orderCopy}
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
                          <div className="text-xs text-gray-900 font-medium text-blue-600 flex items-center justify-center">{record.ipName || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          <div className="text-xs text-gray-900">{record.ipContact || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          <div className="text-xs text-gray-900">{record.gstNumber || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          {record.gstCertificates ? (
                            <a
                              href={record.gstCertificates}
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
                          {record.bankAccountDetails || ""}
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          {record.aadharCard || ""}
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          {record.panCard || ""}
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          <div className="text-xs text-gray-900">{record.workOrderNumber || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          {record.workOrderCopy ? (
                            <a
                              href={record.workOrderCopy}
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

      {/* Modal for Planning / Editing Dispatch Details */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <form 
            onSubmit={handleModalSubmit}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  {modalType === "create" ? "Update Dispatch Details" : "Edit Dispatch Material"}
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Enquiry Number: {selectedRecord.enquiryNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              
              {/* Beneficiary details card summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Beneficiary Name:</span>
                  <span className="text-gray-900 font-bold">{selectedRecord.beneficiaryName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Contact Number:</span>
                  <span className="text-gray-900 font-semibold">{selectedRecord.contactNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">District / Area:</span>
                  <span className="text-gray-800">{selectedRecord.district} ({selectedRecord.villageBlock})</span>
                </div>
              </div>

              {/* Status input field */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/30"
                  required
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {/* Tally Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  Tally Photo (Image or PDF) <span className="text-red-500">*</span>
                </label>

                {/* Show existing file link if in edit mode */}
                {modalType === "edit" && existingTellyPhotoUrl && (
                  <div className="mb-2 p-2 border border-emerald-100 bg-emerald-50/50 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      Current Tally Photo exists
                    </span>
                    <a
                      href={existingTellyPhotoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </a>
                  </div>
                )}

                {/* Upload Drop Zone / Input */}
                <div className="relative border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-4 transition text-center cursor-pointer bg-slate-50/40">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setTellyPhotoFile(file)
                        setTellyPhotoPreview(file.name)
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required={modalType === "create"}
                  />
                  <Upload className="mx-auto h-6 w-6 text-gray-400 mb-1.5" />
                  <p className="text-xs text-gray-600 font-medium">
                    Drag & drop or <span className="text-blue-600 underline">browse</span> file
                  </p>
                  <p className="text-2xs text-gray-400 mt-0.5">Supports PDF, PNG, JPG, JPEG</p>
                </div>

                {tellyPhotoPreview && (
                  <p className="text-xs text-blue-600 mt-2 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    Selected: {tellyPhotoPreview}
                  </p>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-100 text-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Submit
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}
    </AdminLayout>
  )
}

export default DispatchMaterialsPage

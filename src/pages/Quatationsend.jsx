"use client"

import supabase from "../utils/supabase"

// Configuration object - Only keeping page text
const CONFIG = {
  PAGE_CONFIG: {
    title: "Quotation",
    historyTitle: "Quotation History",
    description: "Manage pending quotation tasks",
    historyDescription: "View completed quotation records",
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

function FMSDataPage() {
  const [pendingData, setPendingData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [statusOptions, setStatusOptions] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showQuotationModal, setShowQuotationModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")

  // Quotation form state
  const [quotationForm, setQuotationForm] = useState({
    quotationNumber: "",
    valueOfQuotation: "",
    quotationCopy: null,
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
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
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

  // Fetch dropdown values for status from Supabase
  const fetchDropdownValues = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('dropdown')
        .select('status')
      
      if (error) throw error
      
      const options = [...new Set(data.map(item => item.status).filter(Boolean))]
      setStatusOptions(options)
    } catch (error) {
      console.error("Error fetching dropdown data:", error)
      setStatusOptions(["Completed", "Pending", "In Progress", "Rejected"])
    }
  }, [])

  // Optimized data fetching from Supabase
  const fetchSheetData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch dropdown values and data in parallel
      await fetchDropdownValues();
      
      const { data: rows, error: fmsError } = await supabase
        .from('fms')
        .select('*, quatation_create!left(*)')
      
      if (fmsError) throw fmsError

      const pending = []
      const history = []

      rows.forEach((row) => {
        const qData = row.quatation_create || {}
        
        // condition based on planned_2 (AF) being not null
        if (!qData.planned_2) return

        const rowData = {
          _id: row.enquiry_number || row.id,
          _enquiryNumber: row.enquiry_number || "",
          _id_primary: row.id,
          // Map to original col structure for UI compatibility
          col1: row.enquiry_number || "",
          col2: row.beneficiary_name || "",
          col3: row.address || "",
          col4: row.village_block || "",
          col5: row.district || "",
          col6: row.contact_number || "",
          col14: row.structure_type || "",
          col15: row.roof_type || "",
          col16: row.system_type || "",
          col17: row.need_type || "",
          col18: row.project_mode || "",
          col22: row.status || "Pending",
          col23: row.survey_report_copy || "",
          col24: row.geotag_photo || "",
          col25: row.three_month_bill_copy || "",
          col26: row.aadhar_card || "",
          col27: row.pan_card || "",
          col28: row.address_proof || "",
          col29: row.surveyor_name || "",
          col30: row.surveyor_contact_number || "",
          col31: qData.planned_2 || "",
          col32: qData.actual_2 || "", // AG - Actual
          col34: qData.quatation_no || "", // AI
          col35: qData.amount || qData.net_cost || "", // AJ
          col36: qData.quatation_copy || "", // AK
          
        }

        if (isEmpty(rowData.col32)) {
          pending.push(rowData)
        } else {
          history.push(rowData)
        }
      })

      setPendingData(pending)
      setHistoryData(history)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching Supabase data:", error)
      setError("Failed to load data: " + error.message)
      setLoading(false)
    }
  }, [fetchDropdownValues, isEmpty])

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

  const handleQuotationClick = useCallback((record) => {
    setSelectedRecord(record)
    setQuotationForm({
      quotationNumber: record.col34 || "",
      valueOfQuotation: record.col35 || "",
      quotationCopy: null,
    })
    setShowQuotationModal(true)
  }, [])

  const handleFileUpload = useCallback((field, file) => {
    setQuotationForm((prev) => ({ ...prev, [field]: file }))
  }, [])

  const handleInputChange = useCallback((field, value) => {
    setQuotationForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const uploadQuotationFile = useCallback(
    async (file) => {
      try {
        const filePath = `${selectedRecord._enquiryNumber}_quotation_${Date.now()}.${file.name.split(".").pop()}`
        const { data, error } = await supabase.storage
          .from("Quotation_file")
          .upload(filePath, file)

        if (error) throw error
        
        const { data: urlData } = supabase.storage
          .from("Quotation_file")
          .getPublicUrl(filePath)
          
        return urlData.publicUrl
      } catch (error) {
        console.error("Error uploading file:", error)
        throw error
      }
    },
    [selectedRecord],
  )

  const handleQuotationSubmit = async () => {
    if (!quotationForm.quotationNumber || !quotationForm.valueOfQuotation) {
      alert("Please fill in Quotation Number and Value of Quotation")
      return
    }

    setIsSubmitting(true)
    try {
      // Upload quotation copy and get URL
      let quotationCopyUrl = selectedRecord.col36 || ""

      if (quotationForm.quotationCopy) {
        quotationCopyUrl = await uploadQuotationFile(quotationForm.quotationCopy)
      }

      // Update data in Supabase quatation_create table
      const { error } = await supabase
        .from('quatation_create')
        .update({
          actual_2: new Date().toISOString(),
          quatation_no: quotationForm.quotationNumber,
          amount: parseFloat(quotationForm.valueOfQuotation),
          quatation_copy: quotationCopyUrl,
          // status_timestamp: new Date()
        })
        .eq('enquiry_number', selectedRecord._enquiryNumber)

      if (error) throw error

      setSuccessMessage(`Quotation submitted successfully for Enquiry Number: ${selectedRecord._enquiryNumber}`)
      setShowQuotationModal(false)

      const isEdit = !isEmpty(selectedRecord.col32)

      const updatedRecord = {
        ...selectedRecord,
        col32: formatTimestamp(),
        col34: quotationForm.quotationNumber,
        col35: quotationForm.valueOfQuotation,
        col36: quotationCopyUrl,
      }

      if (isEdit) {
        setHistoryData((prev) => prev.map((rec) => (rec._id === selectedRecord._id ? updatedRecord : rec)))
      } else {
        setPendingData((prev) => prev.filter((record) => record._id !== selectedRecord._id))
        setHistoryData((prev) => [updatedRecord, ...prev])
      }

      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)
    } catch (error) {
      console.error("Error submitting quotation:", error)
      alert("Failed to submit quotation: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleSection = useCallback((section) => {
    setShowHistory(section === "history")
    setSearchTerm("")
  }, [])

  const closeQuotationModal = useCallback(() => {
    setShowQuotationModal(false)
    setSelectedRecord(null)
    setQuotationForm({
      quotationNumber: "",
      valueOfQuotation: "",
      quotationCopy: null,
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
                placeholder={showHistory ? "Search history..." : "Search pending quotations..."}
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
              <Send className="h-4 w-4 mr-2" />
              Pending Quotations ({filteredPendingData.length})
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
              Quotation History ({filteredHistoryData.length})
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
                  Completed FMS Quotations
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Pending FMS Quotations
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
              <p className="text-blue-600 text-sm">Loading FMS data...</p>
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
                    {showHistory ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Copy Survey Report
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Geotag Photo Site
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Three Months Electricity Bill Copy
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aadhar Card
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pan Card
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
                              onClick={() => handleQuotationClick(record)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                              <Wrench className="h-3 w-3 mr-1" />
                              Edit
                            </button>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs font-medium text-gray-900">{record.col1 || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.col2 || "—"}</div>
                          </td>
                          <td className="px-2 py-3 max-w-xs">
                            <div className="text-xs text-gray-900 truncate" title={record.col3}>
                              {record.col3 || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.col4 || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.col5 || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.col6 || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.col26 || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            {record.col28 ? (
                              <a
                                href={record.col28}
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
                            <div className="text-xs text-gray-900">{record.col29 || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.col30 || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs font-medium text-blue-900">{record.col34 || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-green-700 font-medium">₹{record.col35 || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            {record.col36 ? (
                              <a
                                href={record.col36}
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
                          {searchTerm ? "No history records matching your search" : "No completed quotations found"}
                        </td>
                      </tr>
                    )
                  ) : filteredPendingData.length > 0 ? (
                    filteredPendingData.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-2 py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleQuotationClick(record)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Quotation
                          </button>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs font-medium text-blue-900">{record.col1 || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900 flex items-center">
                            <Users className="h-3 w-3 mr-1 text-gray-400" />
                            {record.col2 || "—"}
                          </div>
                        </td>
                        <td className="px-2 py-3 max-w-xs">
                          <div className="text-xs text-gray-900 truncate flex items-center" title={record.col3}>
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            {record.col3 || "—"}
                          </div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.col4 || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.col5 || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900 flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            {record.col6 || "—"}
                          </div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {record.col22 || "Pending"}
                          </span>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          {record.col23 ? (
                            <a
                              href={record.col23}
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
                          {record.col24 ? (
                            <a
                              href={record.col24}
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
                          {record.col25 ? (
                            <a
                              href={record.col25}
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
                          <div className="text-xs text-gray-900">{record.col26 || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.col27 || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          {record.col28 ? (
                            <a
                              href={record.col28}
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
                          <div className="text-xs text-gray-900">{record.col29 || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.col30 || "—"}</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={16} className="px-4 py-8 text-center text-gray-500 text-sm">
                        {searchTerm ? "No pending quotations matching your search" : "No pending quotations found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quotation Modal with Transparent Background */}
        {showQuotationModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white border max-w-2xl w-full shadow-2xl rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Quotation Form - Enquiry: {selectedRecord.col1}</h3>
                  <button onClick={closeQuotationModal} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2 text-sm">Beneficiary Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium">Enquiry Number:</span> {selectedRecord.col1}
                    </div>
                    <div>
                      <span className="font-medium">Beneficiary Name:</span> {selectedRecord.col2}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Address:</span> {selectedRecord.col3}
                    </div>
                    <div>
                      <span className="font-medium">Contact Number:</span> {selectedRecord.col6}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Quotation Number */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quotation Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={quotationForm.quotationNumber}
                      onChange={(e) => handleInputChange("quotationNumber", e.target.value)}
                      placeholder="Enter quotation number"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  {/* Value Of Quotation */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Value Of Quotation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={quotationForm.valueOfQuotation}
                      onChange={(e) => handleInputChange("valueOfQuotation", e.target.value)}
                      placeholder="Enter quotation value"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Quotation Copy</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload("quotationCopy", e.target.files[0])}
                      className="mt-1 block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {quotationForm.quotationCopy ? (
                      <p className="text-xs text-green-600 mt-1">✓ {quotationForm.quotationCopy.name}</p>
                    ) : selectedRecord.col36 ? (
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-500 mr-2">Current file:</span>
                        <a href={selectedRecord.col36} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center">
                          <Eye className="h-3 w-3 mr-1" /> View
                        </a>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6 pt-3 border-t">
                  <button
                    onClick={closeQuotationModal}
                    disabled={isSubmitting}
                    className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleQuotationSubmit}
                    disabled={isSubmitting || !quotationForm.quotationNumber || !quotationForm.valueOfQuotation}
                    className="px-3 py-1 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-md hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Quotation"}
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

export default FMSDataPage

import { 
  CheckCircle2, X, Search, History, MapPin, Users, Phone, Eye, Wrench, 
  Loader2, CloudUpload, AlertCircle, Trash2, Plus, FileText, File, Upload, 
  Sun, Zap, Shield, Cpu 
} from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"
import { useState, useEffect, useCallback, useMemo } from "react"
const CONFIG = {
  PAGE_CONFIG: {
    title: "Installation",
    historyTitle: "Installation History",
    description: "Manage pending installations",
    historyDescription: "View completed installation records",
  },
}

// Helper to parse complete installation documents JSON or legacy string
const parseCompleteDocs = (docValue, row = {}) => {
  const emptyState = {
    panelFront: [],
    panelBack: [],
    panelSide: [],
    la: [],
    acdb: [],
    earthing: [],
  }

  const formatItem = (item, prefix, idx) => {
    if (typeof item === 'string') {
      return {
        id: `${prefix.toLowerCase().replace(/\s+/g, '_')}_${idx}_${Date.now()}`,
        url: item,
        name: `${prefix} ${idx + 1}`,
        type: item.toLowerCase().includes('.pdf') ? 'pdf' : 'image'
      }
    }
    return item
  }

  // 1. Check array columns from DB table row
  const fromDbColumns = {
    panelFront: Array.isArray(row?.panel_front) ? row.panel_front : [],
    panelBack: Array.isArray(row?.panel_back) ? row.panel_back : [],
    panelSide: Array.isArray(row?.panel_side) ? row.panel_side : [],
    la: Array.isArray(row?.la_copy) ? row.la_copy : [],
    acdb: Array.isArray(row?.acdb_dcdb_inverter_copy) ? row.acdb_dcdb_inverter_copy : [],
    earthing: Array.isArray(row?.earthing_copy) ? row.earthing_copy : [],
  }

  const hasDbColumns = Object.values(fromDbColumns).some(arr => arr && arr.length > 0)
  if (hasDbColumns) {
    return {
      panelFront: fromDbColumns.panelFront.map((item, idx) => formatItem(item, 'Panel Front', idx)),
      panelBack: fromDbColumns.panelBack.map((item, idx) => formatItem(item, 'Panel Back', idx)),
      panelSide: fromDbColumns.panelSide.map((item, idx) => formatItem(item, 'Panel Side', idx)),
      la: fromDbColumns.la.map((item, idx) => formatItem(item, 'LA Copy', idx)),
      acdb: fromDbColumns.acdb.map((item, idx) => formatItem(item, 'ACDB Copy', idx)),
      earthing: fromDbColumns.earthing.map((item, idx) => formatItem(item, 'Earthing Copy', idx)),
    }
  }

  if (!docValue) return emptyState

  // 2. Parse docValue if it's JSON string or Object
  let parsed = docValue
  if (typeof docValue === "string") {
    try {
      parsed = JSON.parse(docValue)
    } catch {
      // Legacy single URL string
      return {
        ...emptyState,
        panelFront: [{ id: `legacy_1_${Date.now()}`, url: docValue, name: "Legacy Installation Photo", type: docValue.toLowerCase().includes('.pdf') ? 'pdf' : 'image' }],
      }
    }
  }

  if (typeof parsed === "object" && parsed !== null) {
    return {
      panelFront: (parsed.panelFront || parsed.panel_front || []).map((item, idx) => formatItem(item, 'Panel Front', idx)),
      panelBack: (parsed.panelBack || parsed.panel_back || []).map((item, idx) => formatItem(item, 'Panel Back', idx)),
      panelSide: (parsed.panelSide || parsed.panel_side || []).map((item, idx) => formatItem(item, 'Panel Side', idx)),
      la: (parsed.la || parsed.la_copy || []).map((item, idx) => formatItem(item, 'LA Copy', idx)),
      acdb: (parsed.acdb || parsed.acdb_dcdb_inverter_copy || []).map((item, idx) => formatItem(item, 'ACDB Copy', idx)),
      earthing: (parsed.earthing || parsed.earthing_copy || []).map((item, idx) => formatItem(item, 'Earthing Copy', idx)),
    }
  }

  return emptyState
}

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

function InstallationPage() {
  const [pendingData, setPendingData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dataLoggerFilter, setDataLoggerFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")

  // State for Complete Installation Photo Modal (4 categories)
  const [showCompleteDocsModal, setShowCompleteDocsModal] = useState(false)
  const [completeDocsState, setCompleteDocsState] = useState({
    panelFront: [],
    panelBack: [],
    panelSide: [],
    la: [],
    acdb: [],
    earthing: [],
  })

  // State for viewing Complete Installation Docs from History/Pending table
  const [viewingCompleteDocsRecord, setViewingCompleteDocsRecord] = useState(null)

  const [dropdownOptions, setDropdownOptions] = useState({
    inverterMake: [],
    inverterCapacity: [],
    moduleMake: [],
    moduleCapacity: [],
    moduleType: [],
    structureMake: [],
    phase: [],
  })
  const [dropdownLoading, setDropdownLoading] = useState(false)
  const [installForm, setInstallForm] = useState({
    inverterMake: "",
    inverterCapacity: "",
    moduleMake: "",
    moduleCapacity: "",
    moduleType: "",
    structureMake: "",
    dateOfInstallation: "",
    routing: "",
    earthing: "",
    baseFoundation: "",
    wiring: "",
    foundationPhoto: null,
    afterInstallationPhoto: null,
    photoWithCustomer: null,
    completeInstallationPhoto: null,
    repeatedCertificate: null,
    projectCommissioningCertificate: null,
    inverterId: "",
    dataLoggerType: "",
    simNumber: "",
    mobileNumber: "",
    dataPlan: "",
  })

  const [fileUploads, setFileUploads] = useState({
    foundationPhoto: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    afterInstallationPhoto: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    photoWithCustomer: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    completeInstallationPhoto: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    repeatedCertificate: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    projectCommissioningCertificate: { uploading: false, uploaded: false, url: "", error: null, name: "" },
  })



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

  const formatDateForInput = useCallback((dateString) => {
    if (!dateString) return ""
    // Check if it's already in YYYY-MM-DD format
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString

    // Handle DD/MM/YYYY format
    const parts = dateString.split("/")
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`
    }
    return ""
  }, [])


  useEffect(() => {
    const role = sessionStorage.getItem("role")
    const user = sessionStorage.getItem("username")
    setUserRole(role || "")
    setUsername(user || "")
  }, [])

const fetchDropdownOptions = useCallback(async () => {
  try {
    setDropdownLoading(true)

    const { data, error } = await supabase
      .from("dropdown")
      .select("*")

    if (error) throw error

    const options = {
      inverterMake: [],
      inverterCapacity: [],
      moduleMake: [],
      moduleCapacity: [],
      moduleType: [],
      structureMake: [],
      phase: [],
    }

    data.forEach((row) => {
      if (row.inverter_make) options.inverterMake.push(row.inverter_make)
      if (row.inverter_capacity) options.inverterCapacity.push(row.inverter_capacity)
      if (row.module_make) options.moduleMake.push(row.module_make)
      if (row.module_capacity) options.moduleCapacity.push(row.module_capacity)
      if (row.module_type) options.moduleType.push(row.module_type)
      if (row.structure_make) options.structureMake.push(row.structure_make)
      if (row.phase) options.phase.push(row.phase)
    })

    Object.keys(options).forEach((key) => {
      options[key] = [...new Set(options[key])]
        .filter((item) => item && item.trim() !== "")
        .sort()
    })

    setDropdownOptions(options)
  } catch (error) {
    console.error("Dropdown error:", error)
    setError("Failed to load dropdown: " + error.message)
  } finally {
    setDropdownLoading(false)
  }
}, [])




const fetchSheetData = useCallback(async () => {
  try {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from("installations")
      .select(`
        *,
        enquiries!left (
          beneficiary_name,
          address,
          contact_number
        )
      `)
      .not("planned", "is", null)

    if (error) throw error

    const pending = []
    const history = [];

    (data || []).forEach((row) => {
      const enquiryNumber = row.enquiry_number || ""
      const enq = row.enquiries || {}

      let docsObj = {}
      if (typeof row.complete_installation_docs === "object" && row.complete_installation_docs !== null) {
        docsObj = row.complete_installation_docs
      } else if (typeof row.complete_installation_docs === "string") {
        try {
          docsObj = JSON.parse(row.complete_installation_docs)
        } catch {
          docsObj = {}
        }
      }

      const rowData = {
        _id: row.id,
        enquiryNumber: enquiryNumber,
        beneficiaryName: enq.beneficiary_name || "",
        address: enq.address || "",
        contactNumber: enq.contact_number || "",
        surveyorName: "",
        surveyorContact: "",
        orderCopy: "",
        ipName: "",
        ipContact: "",

        copyOfReceipt: "",
        dateOfReceipt: "",

        actual: row.actual || "",
        dateOfInstallation: row.installation_date || "",
        routing: row.phase || "",
        earthing: row.earthing || "",
        baseFoundation: row.base_foundation || "",
        wiring: row.wiring || "",

        foundationPhoto: row.plant_photo || "",
        afterInstallationPhoto: row.dcr_certificate || row.installation_photo || "",
        photoWithCustomer: row.module_warranty || "",
        completeInstallationPhoto: row.complete_installation_docs || "",
        rawRow: row,

        inverterMake: row.inverter_make || "",
        inverterCapacity: row.inverter_capacity || "",
        moduleMake: row.module_make || "",
        moduleCapacity: row.module_capacity || "",
        moduleType: row.module_type || "",
        structureMake: row.structure_make || "",

        investorId: row.inverter_id || "",
        repeatedCertificate: row.repeated_certificate || docsObj.repeatedCertificate || "",
        projectCommissioningCertificate: row.project_commissioning_certificate || docsObj.projectCommissioningCertificate || "",
        dataLoggerType: row.data_logger_type || docsObj.dataLoggerType || "",
        simNumber: row.sim_number || docsObj.simNumber || "",
        mobileNumber: row.mobile_number || docsObj.mobileNumber || "",
        dataPlan: row.data_plan || docsObj.dataPlan || "",
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
  } catch (error) {
    console.error("Fetch error:", error)
    setError("Failed: " + error.message)
    setLoading(false)
  }
}, [])




  useEffect(() => {
    fetchSheetData()
    fetchDropdownOptions()
  }, [fetchSheetData, fetchDropdownOptions])

  const filteredPendingData = useMemo(() => {
    let data = pendingData
    if (dataLoggerFilter) {
      data = data.filter((record) => record.dataLoggerType === dataLoggerFilter)
    }
    return debouncedSearchTerm
      ? data.filter((record) =>
        Object.values(record).some(
          (value) => value && value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
        ),
      )
      : data
  }, [pendingData, debouncedSearchTerm, dataLoggerFilter])

  const filteredHistoryData = useMemo(() => {
    let data = historyData
    if (dataLoggerFilter) {
      data = data.filter((record) => record.dataLoggerType === dataLoggerFilter)
    }
    return debouncedSearchTerm
      ? data.filter((record) =>
        Object.values(record).some(
          (value) => value && value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
        ),
      )
      : data
  }, [historyData, debouncedSearchTerm, dataLoggerFilter])

  const handleInstallClick = useCallback((record) => {
    setSelectedRecord(record)
    setCompleteDocsState(parseCompleteDocs(record.completeInstallationPhoto, record.rawRow))
    setInstallForm({
      inverterMake: record.inverterMake || "",
      inverterCapacity: record.inverterCapacity || "",
      moduleMake: record.moduleMake || "",
      moduleCapacity: record.moduleCapacity || "",
      moduleType: record.moduleType || "",
      structureMake: record.structureMake || "",
      dateOfInstallation: formatDateForInput(record.dateOfInstallation || ""),
      routing: record.routing || "",
      earthing: record.earthing || "",
      baseFoundation: record.baseFoundation || "",
      wiring: record.wiring || "",
      foundationPhoto: null,
      afterInstallationPhoto: null,
      photoWithCustomer: null,
      completeInstallationPhoto: null,
      repeatedCertificate: null,
      projectCommissioningCertificate: null,
      inverterId: record.investorId || "",
      dataLoggerType: record.dataLoggerType || "",
      simNumber: record.simNumber || "",
      mobileNumber: record.mobileNumber || "",
      dataPlan: record.dataPlan || "",
    })
    // Initialize file uploads state with existing data and progress tracking
    setFileUploads({
      foundationPhoto: { uploading: false, uploaded: !!record.foundationPhoto, url: record.foundationPhoto || "", error: null, name: record.foundationPhoto ? "Existing Photo" : "", progress: 0 },
      afterInstallationPhoto: { uploading: false, uploaded: !!record.afterInstallationPhoto, url: record.afterInstallationPhoto || "", error: null, name: record.afterInstallationPhoto ? "Existing Photo" : "", progress: 0 },
      photoWithCustomer: { uploading: false, uploaded: !!record.photoWithCustomer, url: record.photoWithCustomer || "", error: null, name: record.photoWithCustomer ? "Existing Photo" : "", progress: 0 },
      completeInstallationPhoto: { uploading: false, uploaded: !!record.completeInstallationPhoto, url: record.completeInstallationPhoto || "", error: null, name: record.completeInstallationPhoto ? "Existing Photo" : "", progress: 0 },
      repeatedCertificate: { uploading: false, uploaded: !!record.repeatedCertificate, url: record.repeatedCertificate || "", error: null, name: record.repeatedCertificate ? "Existing Photo" : "", progress: 0 },
      projectCommissioningCertificate: { uploading: false, uploaded: !!record.projectCommissioningCertificate, url: record.projectCommissioningCertificate || "", error: null, name: record.projectCommissioningCertificate ? "Existing Photo" : "", progress: 0 },
    })
    setShowInstallModal(true)
  }, [formatDateForInput])

  const compressImage = useCallback((file) => {
    return new Promise((resolve) => {
      // Skip if not an image or if it's a small SVG/GIF that might be corrupted by canvas
      if (!file.type.startsWith("image/") || file.type.includes("svg") || file.type.includes("gif") || file.size < 1024 * 1024) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Target high quality but reasonable dimensions for 4G/Mobile networks
          const MAX_DIM = 2500;
          if (width > height) {
            if (width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            console.log(`Optimized ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
            resolve(compressedFile);
          }, "image/jpeg", 0.8);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  }, []);

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
    const fileName = `${selectedRecord.enquiryNumber}_${Date.now()}.${fileExt}`
    const filePath = `installation/${fileName}`

    const { error } = await supabase.storage
      .from("IP_assignment")
      .upload(filePath, file)

    if (error) throw error

    const { data } = supabase.storage
      .from("IP_assignment")
      .getPublicUrl(filePath)

    return data.publicUrl
  } catch (error) {
    console.error("Upload error:", error)
    throw error
  }
}, [selectedRecord])

  // Helper to upload all 4 categories in completeDocsState and return object payload
  const uploadAndBuildCompleteDocsPayload = async (docsState, enquiryNum) => {
    const result = {
      panelFront: [],
      panelBack: [],
      panelSide: [],
      la: [],
      acdb: [],
      earthing: [],
    }

    const categories = ["panelFront", "panelBack", "panelSide", "la", "acdb", "earthing"]

    for (const cat of categories) {
      const items = docsState[cat] || []
      for (const item of items) {
        if (item.file && item.file instanceof File) {
          const fileExt = item.file.name.split(".").pop()
          const fileName = `${enquiryNum}_${cat}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
          const filePath = `installation/complete_docs/${fileName}`

          const { error: uploadErr } = await supabase.storage
            .from("IP_assignment")
            .upload(filePath, item.file)

          if (uploadErr) throw uploadErr

          const { data: publicData } = supabase.storage
            .from("IP_assignment")
            .getPublicUrl(filePath)

          result[cat].push(publicData.publicUrl)
        } else if (item.url) {
          result[cat].push(item.url)
        }
      }
    }

    return result
  }



  const handleFileUpload = useCallback((field, file) => {
    if (!file) return;

    // Only update the form state with the File object
    setInstallForm((prev) => ({ ...prev, [field]: file }))

    // Update the professional upload status to show it's selected but not yet uploading
    setFileUploads(prev => ({
      ...prev,
      [field]: { ...prev[field], uploading: false, uploaded: false, error: null, name: file.name, ready: true }
    }))
  }, [])

  const UploadStatus = ({ field }) => {
    const status = fileUploads[field]
    if (status.uploading) {
      return (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-blue-600 px-2 py-1 rounded text-xs animate-pulse border border-blue-100 bg-blue-50">
            <div className="flex items-center">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              {status.progress < 100 ? "Processing & Uploading..." : "Finalizing on Drive..."}
            </div>
            <span className="font-bold">{status.progress}%</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${status.progress}%` }}
            />
          </div>
        </div>
      )
    }
    if (status.error) {
      return (
        <div className="flex items-center mt-2 text-red-600 bg-red-50 px-2 py-1 rounded text-xs border border-red-100">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed: {status.error}
        </div>
      )
    }
    if (status.uploaded) {
      return (
        <div className="flex items-center mt-2 text-green-600 bg-green-50 px-2 py-1 rounded text-xs border border-green-100 font-medium">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {status.name.includes("Existing") ? "Document Available" : "Successfully Uploaded"}
        </div>
      )
    }
    if (status.ready) {
      return (
        <div className="flex items-center mt-2 text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs border border-amber-100 font-medium italic">
          <CloudUpload className="h-3 w-3 mr-1" />
          File selected: {status.name} (Ready to upload)
        </div>
      )
    }
    return null
  }

  const handleInputChange = useCallback((field, value) => {
    setInstallForm((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === "dataLoggerType" && value === "WiFi") {
        updated.simNumber = ""
        updated.mobileNumber = ""
        updated.dataPlan = ""
      }
      return updated
    })
  }, [])

  const exportToExcel = useCallback(() => {
    const isHistory = showHistory
    const dataToExport = isHistory ? filteredHistoryData : filteredPendingData

    if (dataToExport.length === 0) {
      alert("No data available to export")
      return
    }

    let headers = []
    let rows = []

    if (isHistory) {
      headers = [
        "Enquiry Number",
        "Beneficiary Name",
        "Address",
        "Contact Number Of Beneficiary",
        "Surveyor Name",
        "Contact Number",
        "Dispatch Material",
        "Inform To Customer",
        "Copy Of Receipt",
        "Date Of Receipt",
        "Date Of Installation",
        "Routing",
        "Earthing",
        "Base Foundation",
        "Wiring",
        "Plant Photo",
        "DCR Certificate",
        "Module Warranty certificate",
        "Complete Installation Photo",
        "Repeated Certificate",
        "Project Commissioning Certificate",
        "Inverter Make",
        "Inverter Capacity",
        "Module Make",
        "Module Capacity",
        "Module Type",
        "Structure Make",
        "Inverter ID",
        "Data Logger Type",
        "SIM Number",
        "Mobile Number",
        "Data Plan"
      ]

      rows = dataToExport.map((record) => [
        record.enquiryNumber,
        record.beneficiaryName,
        record.address,
        record.contactNumber,
        record.surveyorName,
        record.surveyorContact,
        record.dispatchMaterial,
        record.informToCustomer,
        record.copyOfReceipt,
        record.dateOfReceipt,
        record.dateOfInstallation,
        record.routing,
        record.earthing,
        record.baseFoundation,
        record.wiring,
        record.foundationPhoto,
        record.afterInstallationPhoto,
        record.photoWithCustomer,
        record.completeInstallationPhoto,
        record.repeatedCertificate,
        record.projectCommissioningCertificate,
        record.inverterMake,
        record.inverterCapacity,
        record.moduleMake,
        record.moduleCapacity,
        record.moduleType,
        record.structureMake,
        record.investorId,
        record.dataLoggerType,
        record.simNumber,
        record.mobileNumber,
        record.dataPlan
      ])
    } else {
      headers = [
        "Enquiry Number",
        "Beneficiary Name",
        "Address",
        "Contact Number Of Beneficiary",
        "Surveyor Name",
        "Contact Number",
        "Order Copy",
        "IP Name",
        "Contact Number Of IP",
        "GST Number",
        "Aadhar Card",
        "Pan Card",
        "Work Order Number",
        "Work Order Copy",
        "Dispatch Material",
        "Inform To Customer",
        "Copy Of Receipt",
        "Date Of Receipt"
      ]

      rows = dataToExport.map((record) => [
        record.enquiryNumber,
        record.beneficiaryName,
        record.address,
        record.contactNumber,
        record.surveyorName,
        record.surveyorContact,
        record.orderCopy,
        record.ipName,
        record.ipContact,
        record.gstNumber,
        record.aadharCard,
        record.panCard,
        record.workOrderNumber,
        record.workOrderCopy,
        record.dispatchMaterial,
        record.informToCustomer,
        record.copyOfReceipt,
        record.dateOfReceipt
      ])
    }

    // Convert values to CSV safe strings (handling comma, quotes and newlines)
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

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    const fileName = isHistory ? "installation-history" : "pending-installations"
    const timestamp = new Date().toISOString().split("T")[0]
    link.download = `${fileName}-${timestamp}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }, [showHistory, filteredHistoryData, filteredPendingData])

const handleInstallSubmit = async () => {
  if (!installForm.dateOfInstallation) {
    alert("Please select the date of installation")
    return
  }

  if (installForm.dataLoggerType === "SIM") {
    if (!installForm.simNumber || !installForm.simNumber.trim()) {
      alert("Please enter the SIM Number")
      return
    }
    if (!installForm.mobileNumber || !installForm.mobileNumber.trim()) {
      alert("Please enter the Mobile Number")
      return
    }
    // if (!/^\d{10}$/.test(installForm.mobileNumber)) {
    //   alert("Mobile Number must be exactly 10 digits")
    //   return
    // }
    if (!/^\d{1,50}$/.test(installForm.mobileNumber)) {
  alert("Mobile Number must be between 1 and 50 digits")
  return
}
    if (!installForm.dataPlan || !installForm.dataPlan.trim()) {
      alert("Please enter the Data Plan")
      return
    }
  }

  setIsSubmitting(true)

  try {
    const actualDate = new Date().toISOString().split("T")[0]

    const currentFileUploads = { ...fileUploads }

    const fields = [
      "foundationPhoto",
      "afterInstallationPhoto",
      "photoWithCustomer",
      "completeInstallationPhoto",
      "repeatedCertificate",
      "projectCommissioningCertificate",
    ]

    for (const field of fields) {
      const file = installForm[field]
      if (file && file instanceof File) {
        const url = await uploadImageToDrive(file)
        currentFileUploads[field] = { url, uploaded: true }
      }
    }

    // Process & upload 4-category complete installation docs
    const completeDocsPayload = await uploadAndBuildCompleteDocsPayload(completeDocsState, selectedRecord.enquiryNumber)

    // Build complete JSON object including metadata & extra fields for jsonb storage
    const completeDocsJsonObject = {
      ...completeDocsPayload,
      repeatedCertificate: currentFileUploads.repeatedCertificate?.url || selectedRecord.repeatedCertificate || "",
      projectCommissioningCertificate: currentFileUploads.projectCommissioningCertificate?.url || selectedRecord.projectCommissioningCertificate || "",
      dataLoggerType: installForm.dataLoggerType || "",
      simNumber: installForm.simNumber || "",
      mobileNumber: installForm.mobileNumber || "",
      dataPlan: installForm.dataPlan || "",
    }

    const { error } = await supabase
      .from("installations")
      .update({
        actual: actualDate,
        installation_date: installForm.dateOfInstallation,
        phase: installForm.routing,
        earthing: installForm.earthing,
        base_foundation: installForm.baseFoundation,
        wiring: installForm.wiring,

        plant_photo: currentFileUploads.foundationPhoto?.url || selectedRecord.foundationPhoto || null,
        dcr_certificate: currentFileUploads.afterInstallationPhoto?.url || selectedRecord.afterInstallationPhoto || null,
        module_warranty: currentFileUploads.photoWithCustomer?.url || selectedRecord.photoWithCustomer || null,
        installation_photo: currentFileUploads.afterInstallationPhoto?.url || selectedRecord.afterInstallationPhoto || null,

        inverter_make: installForm.inverterMake,
        inverter_capacity: installForm.inverterCapacity,
        module_make: installForm.moduleMake,
        module_capacity: installForm.moduleCapacity,
        module_type: installForm.moduleType,
        structure_make: installForm.structureMake,
        inverter_id: installForm.inverterId,

        // 4 Categories System - Text Arrays
        panel_front: completeDocsPayload.panelFront || [],
        panel_back: completeDocsPayload.panelBack || [],
        panel_side: completeDocsPayload.panelSide || [],
        la_copy: completeDocsPayload.la || [],
        acdb_dcdb_inverter_copy: completeDocsPayload.acdb || [],
        earthing_copy: completeDocsPayload.earthing || [],

        // Individual columns for extra fields
        data_logger_type: installForm.dataLoggerType || null,
        sim_number: installForm.simNumber || null,
        mobile_number: installForm.mobileNumber || null,
        data_plan: installForm.dataPlan || null,
        repeated_certificate: currentFileUploads.repeatedCertificate?.url || selectedRecord.repeatedCertificate || null,
        project_commissioning_certificate: currentFileUploads.projectCommissioningCertificate?.url || selectedRecord.projectCommissioningCertificate || null,

        // Full JSONB document storage
        complete_installation_docs: completeDocsJsonObject,
      })
      .eq("enquiry_number", selectedRecord.enquiryNumber)

    if (error) throw error

    setSuccessMessage(`Installation completed for ${selectedRecord.enquiryNumber}`)
    setShowInstallModal(false)

    fetchSheetData()

    setTimeout(() => setSuccessMessage(""), 3000)
  } catch (error) {
    console.error("Submit error:", error)
    alert("Failed: " + error.message)
  } finally {
    setIsSubmitting(false)
  }
}

  const handleAddFilesToCategory = useCallback((categoryKey, fileList, maxLimit = null) => {
    if (!fileList || fileList.length === 0) return
    const currentItems = completeDocsState[categoryKey] || []

    if (maxLimit && currentItems.length >= maxLimit) {
      alert(`Maximum ${maxLimit} files allowed for this section.`)
      return
    }

    const allowedCount = maxLimit ? maxLimit - currentItems.length : fileList.length
    const selectedFiles = Array.from(fileList).slice(0, allowedCount)

    const newItems = selectedFiles.map((file, idx) => {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
      return {
        id: `${categoryKey}_new_${Date.now()}_${idx}`,
        file: file,
        url: URL.createObjectURL(file),
        name: file.name,
        type: isPdf ? "pdf" : "image",
      }
    })

    setCompleteDocsState((prev) => ({
      ...prev,
      [categoryKey]: [...(prev[categoryKey] || []), ...newItems],
    }))
  }, [completeDocsState])

  const handleRemoveFileFromCategory = useCallback((categoryKey, itemId) => {
    setCompleteDocsState((prev) => ({
      ...prev,
      [categoryKey]: (prev[categoryKey] || []).filter((item) => item.id !== itemId),
    }))
  }, [])

  const renderDocCategoryCard = ({ title, categoryKey, maxLimit, icon: CardIcon }) => {
    const items = completeDocsState[categoryKey] || []
    const isLimitReached = maxLimit && items.length >= maxLimit

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <CardIcon className="h-3.5 w-3.5 text-blue-600" />
            {title}
          </span>
          <span className={`text-3xs font-bold px-2 py-0.5 rounded-full ${
            isLimitReached ? "bg-amber-100 text-amber-800" : "bg-blue-50 text-blue-700"
          }`}>
            {maxLimit ? `${items.length}/${maxLimit} Max` : `${items.length} Uploaded`}
          </span>
        </div>

        {/* Uploaded File List */}
        {items.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  {item.type === "pdf" ? (
                    <div className="p-1 bg-red-100 text-red-600 rounded shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-8 w-8 object-cover rounded shrink-0 border border-gray-200"
                    />
                  )}
                  <span className="text-2xs font-semibold text-gray-800 truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                    title="View File"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveFileFromCategory(categoryKey, item.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                    title="Delete File"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add File Dropzone / Input */}
        <div>
          {isLimitReached ? (
            <div className="p-2.5 text-center text-3xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
              Limit Reached (Max {maxLimit})
            </div>
          ) : (
            <label className="relative flex items-center justify-center p-2.5 border border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50 rounded-lg text-2xs font-semibold text-blue-700 cursor-pointer transition">
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple={!maxLimit || maxLimit > 1}
                onChange={(e) => handleAddFilesToCategory(categoryKey, e.target.files, maxLimit)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Plus className="h-3.5 w-3.5 mr-1" />
              Upload File (Image/PDF)
            </label>
          )}
        </div>
      </div>
    )
  }

  const toggleSection = useCallback((section) => {
    setShowHistory(section === "history")
    setSearchTerm("")
  }, [])

  const closeInstallModal = useCallback(() => {
    setShowInstallModal(false)
    setSelectedRecord(null)
    setInstallForm({
      inverterMake: "",
      inverterCapacity: "",
      moduleMake: "",
      moduleCapacity: "",
      moduleType: "",
      structureMake: "",
      dateOfInstallation: "",
      routing: "",
      earthing: "",
      baseFoundation: "",
      wiring: "",
      foundationPhoto: null,
      afterInstallationPhoto: null,
      photoWithCustomer: null,
      completeInstallationPhoto: null,
      investorId: "",
      dataLoggerType: "",
      simNumber: "",
      mobileNumber: "",
      dataPlan: "",
    })
    setFileUploads({
      foundationPhoto: { uploading: false, uploaded: false, url: "", error: null, name: "" },
      afterInstallationPhoto: { uploading: false, uploaded: false, url: "", error: null, name: "" },
      photoWithCustomer: { uploading: false, uploaded: false, url: "", error: null, name: "" },
      completeInstallationPhoto: { uploading: false, uploaded: false, url: "", error: null, name: "" },
      repeatedCertificate: { uploading: false, uploaded: false, url: "", error: null, name: "" },
      projectCommissioningCertificate: { uploading: false, uploaded: false, url: "", error: null, name: "" },
    })
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-xl font-bold tracking-tight text-blue-700">{CONFIG.PAGE_CONFIG.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={showHistory ? "Search history..." : "Search pending installations..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              />
            </div>

            <select
              value={dataLoggerFilter}
              onChange={(e) => setDataLoggerFilter(e.target.value)}
              className="px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-700"
            >
              <option value="">All Data Logger Types</option>
              <option value="WiFi">WiFi</option>
              <option value="SIM">SIM</option>
            </select>

            <button
              onClick={exportToExcel}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-linear-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Export to Excel
            </button>
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
              <Wrench className="h-4 w-4 mr-2" />
              Pending Installations ({filteredPendingData.length})
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
              Installation History ({filteredHistoryData.length})
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
                  Completed Installations
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Pending Installations
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
              <p className="text-blue-600 text-sm">Loading Installation data...</p>
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
                      Contact Number Of Beneficiary
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Surveyor Name
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Number
                    </th>
                    {!showHistory && (
                      <>
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
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dispatch Material
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inform To Customer
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Copy Of Receipt
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Of Receipt
                        </th>
                      </>
                    )}
                    {showHistory && (
                      <>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dispatch Material
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inform To Customer
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Copy Of Receipt
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Of Receipt
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Of Installation
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Routing
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Earthing
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Base Foundation
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Wiring
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plant Photo
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          DCR Certificate
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Module Warranty certificate
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Complete Installation Photo
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Repeated Certificate
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project Commissioning Certificate
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inverter Make
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inverter Capacity
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Module Make
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Module Capacity
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Module Type
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Structure Make
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inverter ID
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data Logger Type
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SIM Number
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mobile Number
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data Plan
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
                              onClick={() => handleInstallClick(record)}
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
                            <div className="text-xs text-gray-900">{record.contactNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.surveyorName || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.surveyorContact || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.dispatchMaterial || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.informToCustomer || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            {record.copyOfReceipt ? (
                              <a
                                href={record.copyOfReceipt}
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
                            <div className="text-xs text-gray-900">{record.dateOfReceipt || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900 font-medium text-green-600">
                              {record.dateOfInstallation || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.routing || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.earthing || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.baseFoundation || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.wiring || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            {record.foundationPhoto ? (
                              <a
                                href={record.foundationPhoto}
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
                            {record.afterInstallationPhoto ? (
                              <a
                                href={record.afterInstallationPhoto}
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
                            {record.photoWithCustomer ? (
                              <a
                                href={record.photoWithCustomer}
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
                            {record.completeInstallationPhoto ? (
                              <button
                                type="button"
                                onClick={() => setViewingCompleteDocsRecord(record)}
                                className="text-blue-600 hover:text-blue-800 flex items-center justify-center text-xs font-semibold bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md mx-auto transition hover:bg-blue-100"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Docs
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            {record.repeatedCertificate ? (
                              <a
                                href={record.repeatedCertificate}
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
                            {record.projectCommissioningCertificate ? (
                              <a
                                href={record.projectCommissioningCertificate}
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
                            <div className="text-xs text-gray-900">{record.inverterMake || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.inverterCapacity || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.moduleMake || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.moduleCapacity || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.moduleType || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.structureMake || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.investorId || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.dataLoggerType || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.simNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.mobileNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-normal">
                            <div className="text-xs text-gray-900">{record.dataPlan || "—"}</div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={33} className="px-4 py-8 text-center text-gray-500 text-sm">
                          {searchTerm ? "No history records matching your search" : "No completed installations found"}
                        </td>
                      </tr>
                    )
                  ) : filteredPendingData.length > 0 ? (
                    filteredPendingData.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-2 py-3 whitespace-normal">
                          <button
                            onClick={() => handleInstallClick(record)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-linear-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm transition-all hover:scale-105 active:scale-95 justify-center"
                          >
                            <Wrench className="h-3 w-3 mr-1" />
                            Install
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
                          <div className="text-xs text-gray-900">{record.ipName || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          <div className="text-xs text-gray-900">{record.ipContact || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          <div className="text-xs text-gray-900">{record.gstNumber || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          {record.aadharCard ? (
                            <a
                              href={record.aadharCard}
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
                          {record.panCard ? (
                            <a
                              href={record.panCard}
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
                          <div className="text-xs text-gray-900">{record.dispatchMaterial || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          <div className="text-xs text-gray-900">{record.informToCustomer || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-normal">
                          {record.copyOfReceipt ? (
                            <a
                              href={record.copyOfReceipt}
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
                          <div className="text-xs text-gray-900">{record.dateOfReceipt || "—"}</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={20} className="px-4 py-8 text-center text-gray-500 text-sm">
                        {searchTerm
                          ? "No pending installations matching your search"
                          : "No pending installations found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Installation Modal */}
        {showInstallModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white border max-w-4xl w-full shadow-2xl rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Installation Form - Enquiry: {selectedRecord.enquiryNumber}
                  </h3>
                  <button onClick={closeInstallModal} className="text-gray-400 hover:text-gray-600">
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

                {/* Installation Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Inverter Make */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Inverter Make</label>
                    <select
                      value={installForm.inverterMake}
                      onChange={(e) => handleInputChange("inverterMake", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={dropdownLoading}
                    >
                      {dropdownLoading ? (
                        <option>Loading options...</option>
                      ) : (
                        <>
                          <option value="">-- Select Inverter Make --</option>
                          {dropdownOptions.inverterMake.map((option, index) => (
                            <option key={`inverter-make-${index}`} value={option}>
                              {option}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  {/* Inverter Capacity */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Inverter Capacity</label>
                    {dropdownLoading ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm">
                        Loading options...
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={installForm.inverterCapacity}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*\.?\d*$/.test(value)) {
                            handleInputChange("inverterCapacity", value);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="-- Enter Inverter Capacity --"
                      />
                    )}
                  </div>


                  {/* Data Logger Type */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Logger Type</label>
                    <select
                      value={installForm.dataLoggerType || ""}
                      onChange={(e) => handleInputChange("dataLoggerType", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">-- Select Data Logger Type --</option>
                      <option value="WiFi">WiFi</option>
                      <option value="SIM">SIM</option>
                    </select>
                  </div>

                  {installForm.dataLoggerType === "SIM" && (
                    <>
                      {/* SIM Number */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SIM Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={installForm.simNumber || ""}
                          onChange={(e) => handleInputChange("simNumber", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Enter SIM Number"
                          required
                        />
                      </div>

                      {/* Mobile Number */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={installForm.mobileNumber || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d*$/.test(val) && val.length <= 50) {
                              handleInputChange("mobileNumber", val);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Enter Mobile Number"
                          required
                        />
                      </div>

                      {/* Data Plan */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data Plan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={installForm.dataPlan || ""}
                          onChange={(e) => handleInputChange("dataPlan", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Enter Data Plan"
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* Module Make */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Module Make</label>
                    <select
                      value={installForm.moduleMake}
                      onChange={(e) => handleInputChange("moduleMake", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={dropdownLoading}
                    >
                      {dropdownLoading ? (
                        <option>Loading options...</option>
                      ) : (
                        <>
                          <option value="">-- Select Module Make --</option>
                          {dropdownOptions.moduleMake.map((option, index) => (
                            <option key={`module-make-${index}`} value={option}>
                              {option}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  {/* Module Capacity */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Module Capacity</label>
                    {dropdownLoading ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm">
                        Loading options...
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={installForm.moduleCapacity}
                        onChange={(e) => handleInputChange("moduleCapacity", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="-- Enter Module Capacity --"
                        disabled={dropdownLoading}
                      />
                    )}
                  </div>

                  {/* Module Type */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Module Type (DCR/N-DCR)</label>
                    <select
                      value={installForm.moduleType}
                      onChange={(e) => handleInputChange("moduleType", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={dropdownLoading}
                    >
                      {dropdownLoading ? (
                        <option>Loading options...</option>
                      ) : (
                        <>
                          <option value="">-- Select Module Type --</option>
                          {dropdownOptions.moduleType.map((option, index) => (
                            <option key={`module-type-${index}`} value={option}>
                              {option}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  {/* Structure Make */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Structure Make</label>
                    <select
                      value={installForm.structureMake}
                      onChange={(e) => handleInputChange("structureMake", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={dropdownLoading}
                    >
                      {dropdownLoading ? (
                        <option>Loading options...</option>
                      ) : (
                        <>
                          <option value="">-- Select Structure Make --</option>
                          {dropdownOptions.structureMake.map((option, index) => (
                            <option key={`structure-make-${index}`} value={option}>
                              {option}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  {/* Investor ID */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Inverter ID</label>
                    <input
                      type="text"
                      value={installForm.inverterId}
                      onChange={(e) => handleInputChange("inverterId", e.target.value)}
                      placeholder="Enter Inverter ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Date Of Installation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Of Installation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={installForm.dateOfInstallation}
                      onChange={(e) => handleInputChange("dateOfInstallation", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Phase */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phase</label>
                    <select
                      value={installForm.routing}
                      onChange={(e) => handleInputChange("routing", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={dropdownLoading}
                    >
                      {dropdownLoading ? (
                        <option>Loading options...</option>
                      ) : (
                        <>
                          <option value="">-- Select Phase --</option>
                          {dropdownOptions.phase.map((option, index) => (
                            <option key={`phase-${index}`} value={option}>
                              {option}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  {/* Earthing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Earthing</label>
                    <input
                      type="text"
                      value={installForm.earthing}
                      onChange={(e) => handleInputChange("earthing", e.target.value)}
                      placeholder="Enter earthing details"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Base Foundation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Base Foundation</label>
                    <input
                      type="text"
                      value={installForm.baseFoundation}
                      onChange={(e) => handleInputChange("baseFoundation", e.target.value)}
                      placeholder="Enter base foundation details"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Wiring */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wiring</label>
                    <input
                      type="text"
                      value={installForm.wiring}
                      onChange={(e) => handleInputChange("wiring", e.target.value)}
                      placeholder="Enter wiring details"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Plant Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plant Photo
                      <span className="text-gray-500 text-xs ml-1">(Image)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload("foundationPhoto", e.target.files[0])}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <UploadStatus field="foundationPhoto" />

                    {selectedRecord?.foundationPhoto && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Existing:</span>
                        <button
                          type="button"
                          onClick={() => window.open(selectedRecord.foundationPhoto, '_blank', 'noopener,noreferrer')}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview Image
                        </button>
                      </div>
                    )}
                  </div>

                  {/* DCR Certificate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      DCR Certificate
                      <span className="text-gray-500 text-xs ml-1">(Image)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload("afterInstallationPhoto", e.target.files[0])}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <UploadStatus field="afterInstallationPhoto" />

                    {selectedRecord?.afterInstallationPhoto && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Existing:</span>
                        <button
                          type="button"
                          onClick={() => window.open(selectedRecord.afterInstallationPhoto, '_blank', 'noopener,noreferrer')}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview Image
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Module Warranty certificate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Module Warranty certificate
                      <span className="text-gray-500 text-xs ml-1">(Image)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload("photoWithCustomer", e.target.files[0])}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <UploadStatus field="photoWithCustomer" />

                    {selectedRecord?.photoWithCustomer && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Existing:</span>
                        <button
                          type="button"
                          onClick={() => window.open(selectedRecord.photoWithCustomer, '_blank', 'noopener,noreferrer')}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview Image
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Complete Installation Photo (4 Categories Upload System) */}
                  <div className="col-span-full md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Complete Installation Documents & Photos
                      </span>
                      <span className="text-2xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        4 Categories System
                      </span>
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => setShowCompleteDocsModal(true)}
                      className="w-full flex items-center justify-between p-3.5 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-100/60 rounded-xl transition cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="p-2.5 bg-blue-600 text-white rounded-lg group-hover:scale-105 transition">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900 group-hover:text-blue-700">
                            Upload / Manage Installation Documents
                          </div>
                          <div className="text-2xs text-gray-500 mt-0.5">
                            Panel Copy (Front, Back, Side), LA Copy, ACDB/Inverter Copy, Earthing Copy
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-3 py-1 bg-blue-600 text-white rounded-lg shadow-2xs flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {Object.values(completeDocsState).reduce((acc, curr) => acc + (curr?.length || 0), 0)} Files Added
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Repeated Certificate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repeated Certificate
                      <span className="text-gray-500 text-xs ml-1">(Image)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload("repeatedCertificate", e.target.files[0])}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <UploadStatus field="repeatedCertificate" />

                    {selectedRecord?.repeatedCertificate && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Existing:</span>
                        <button
                          type="button"
                          onClick={() => window.open(selectedRecord.repeatedCertificate, '_blank', 'noopener,noreferrer')}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview Image
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Project Commissioning Certificate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Commissioning Certificate
                      <span className="text-gray-500 text-xs ml-1">(Image)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload("projectCommissioningCertificate", e.target.files[0])}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <UploadStatus field="projectCommissioningCertificate" />

                    {selectedRecord?.projectCommissioningCertificate && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Existing:</span>
                        <button
                          type="button"
                          onClick={() => window.open(selectedRecord.projectCommissioningCertificate, '_blank', 'noopener,noreferrer')}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview Image
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 mt-8 pt-4 border-t">
                  <button
                    onClick={closeInstallModal}
                    disabled={isSubmitting}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInstallSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-linear-to-r from-green-500 to-blue-600 text-white rounded-md hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Complete Installation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4-Category Complete Installation Documents Upload Modal */}
        {showCompleteDocsModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Complete Installation Documents & Photos
                  </h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Upload Panel (Front, Back, Side), LA, ACDB/DCDB/Inverter, and Earthing files
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCompleteDocsModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                
                {/* Category 1: Panel Installation Copy */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-500 text-white rounded-lg">
                        <Sun className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">1. Panel Installation Copy</h4>
                        <p className="text-2xs text-gray-500">Front (Max 3), Back (Max 3), Side (Max 3)</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderDocCategoryCard({
                      title: "A) Front",
                      categoryKey: "panelFront",
                      maxLimit: 3,
                      icon: Sun,
                    })}

                    {renderDocCategoryCard({
                      title: "B) Back",
                      categoryKey: "panelBack",
                      maxLimit: 3,
                      icon: Sun,
                    })}

                    {renderDocCategoryCard({
                      title: "C) Side",
                      categoryKey: "panelSide",
                      maxLimit: 3,
                      icon: Sun,
                    })}
                  </div>
                </div>

                {/* Category 2: LA Installation Copy */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">2. LA Installation Copy</h4>
                        <p className="text-2xs text-gray-500">Maximum 2 files supported (Image or PDF)</p>
                      </div>
                    </div>
                  </div>

                  {renderDocCategoryCard({
                    title: "LA Copy",
                    categoryKey: "la",
                    maxLimit: 2,
                    icon: Zap,
                  })}
                </div>

                {/* Category 3: ACDB/DCDB/Inverter Installation Copy */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-600 text-white rounded-lg">
                        <Cpu className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">3. ACDB / DCDB / Inverter Installation Copy</h4>
                        <p className="text-2xs text-gray-500">Multiple files supported (Image or PDF)</p>
                      </div>
                    </div>
                  </div>

                  {renderDocCategoryCard({
                    title: "Inverter / ACDB / DCDB Copy",
                    categoryKey: "acdb",
                    maxLimit: null,
                    icon: Cpu,
                  })}
                </div>

                {/* Category 4: Earthing Copy */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">4. Earthing Copy</h4>
                        <p className="text-2xs text-gray-500">Multiple files supported (Image or PDF)</p>
                      </div>
                    </div>
                  </div>

                  {renderDocCategoryCard({
                    title: "Earthing Copy",
                    categoryKey: "earthing",
                    maxLimit: null,
                    icon: Shield,
                  })}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center shrink-0">
                <span className="text-xs font-semibold text-gray-600">
                  Total Files Added: <span className="text-blue-700 font-bold">{Object.values(completeDocsState).reduce((acc, curr) => acc + (curr?.length || 0), 0)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCompleteDocsModal(false)}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Done & Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Complete Installation Docs Modal (History Table View) */}
        {viewingCompleteDocsRecord && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Installation Documents - Enquiry: {viewingCompleteDocsRecord.enquiryNumber}
                  </h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Beneficiary: {viewingCompleteDocsRecord.beneficiaryName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingCompleteDocsRecord(null)}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {(() => {
                  const docs = parseCompleteDocs(viewingCompleteDocsRecord.completeInstallationPhoto, viewingCompleteDocsRecord.rawRow)
                  const categories = [
                    { title: "Panel Installation - Front", items: docs.panelFront, icon: Sun },
                    { title: "Panel Installation - Back", items: docs.panelBack, icon: Sun },
                    { title: "Panel Installation - Side", items: docs.panelSide, icon: Sun },
                    { title: "LA Installation Copy", items: docs.la, icon: Zap },
                    { title: "ACDB / DCDB / Inverter Installation Copy", items: docs.acdb, icon: Cpu },
                    { title: "Earthing Copy", items: docs.earthing, icon: Shield },
                  ]

                  const hasAny = categories.some((c) => c.items && c.items.length > 0)

                  if (!hasAny) {
                    return (
                      <div className="text-center py-12 text-gray-500 text-sm">
                        No documents available for this record.
                      </div>
                    )
                  }

                  return categories.map((cat, idx) => {
                    if (!cat.items || cat.items.length === 0) return null
                    const CatIcon = cat.icon
                    return (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                          <CatIcon className="h-4 w-4 text-blue-600" />
                          {cat.title} ({cat.items.length})
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {cat.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="bg-white border border-gray-200 rounded-lg p-2 flex flex-col items-center justify-between space-y-2 shadow-2xs group">
                              {item.type === "pdf" ? (
                                <div className="h-16 w-full bg-red-50 text-red-600 rounded flex flex-col items-center justify-center p-1">
                                  <FileText className="h-8 w-8" />
                                  <span className="text-3xs font-bold uppercase mt-1">PDF Document</span>
                                </div>
                              ) : (
                                <img
                                  src={item.url}
                                  alt={item.name}
                                  className="h-16 w-full object-cover rounded border border-gray-100"
                                />
                              )}
                              <div className="w-full text-center">
                                <p className="text-2xs font-semibold text-gray-700 truncate" title={item.name}>{item.name}</p>
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 inline-flex items-center gap-1 text-3xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  <Eye className="h-2.5 w-2.5" /> View
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingCompleteDocsRecord(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default InstallationPage
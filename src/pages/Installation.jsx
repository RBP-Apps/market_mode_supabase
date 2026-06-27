"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, X, Search, History, MapPin, Users, Phone, Eye, Wrench, Loader2, CloudUpload, AlertCircle } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

const CONFIG = {

  PAGE_CONFIG: {
    title: "Installation",
    historyTitle: "Installation History",
    description: "Manage pending installations",
    historyDescription: "View completed installation records",
  },
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
      .from("fms")
      .select("*")

    if (error) throw error

    const pending = []
    const history = []

    data.forEach((row) => {
      const hasEnquiry = row.enquiry_number && row.enquiry_number.trim() !== ""
      if (!hasEnquiry) return

      const rowData = {
        _id: row.id,
        enquiryNumber: row.enquiry_number || "",
        beneficiaryName: row.beneficiary_name || "",
        address: row.address || "",
        contactNumber: row.contact_number || "",
        surveyorName: row.surveyor_name || "",
        surveyorContact: row.surveyor_contact || "",
        orderCopy: row.order_copy || "",
        ipName: row.ip_name || "",
        ipContact: row.ip_contact || "",

        copyOfReceipt: row.receipt_copy || "",
        dateOfReceipt: row.receipt_date || "",

        actual: row.actual_9 || "",
        dateOfInstallation: row.installation_date || "",
        routing: row.phase || "",
        earthing: row.earthing || "",
        baseFoundation: row.base_foundation || "",
        wiring: row.wiring || "",

        foundationPhoto: row.plant_photo || "",
        afterInstallationPhoto: row.installation_photo || "",
        photoWithCustomer: row.dcr_certificate || "",
        completeInstallationPhoto: row.module_warranty || "",

        inverterMake: row.inverter_make || "",
        inverterCapacity: row.inverter_capacity || "",
        moduleMake: row.module_make || "",
        moduleCapacity: row.module_capacity || "",
        moduleType: row.module_type || "",
        structureMake: row.structure_make || "",

        investorId: row.inverter_id || "",
        repeatedCertificate: row.repeated_certificate || "",
        projectCommissioningCertificate: row.commissioning_certificate || "",
        dataLoggerType: row.data_logger_type || "",
        simNumber: row.sim_number || "",
        mobileNumber: row.mobile_number || "",
        dataPlan: row.data_plan || "",
      }

      if (!row.actual_9) {
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
    if (!/^\d{10}$/.test(installForm.mobileNumber)) {
      alert("Mobile Number must be exactly 10 digits")
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
        currentFileUploads[field] = { url }
      }
    }

    const { error } = await supabase
      .from("fms")
      .update({
        actual_9: actualDate,
        installation_date: installForm.dateOfInstallation,
        phase: installForm.routing,
        earthing: installForm.earthing,
        base_foundation: installForm.baseFoundation,
        wiring: installForm.wiring,

        plant_photo: currentFileUploads.foundationPhoto?.url,
        installation_photo: currentFileUploads.afterInstallationPhoto?.url,
        dcr_certificate: currentFileUploads.photoWithCustomer?.url,
        module_warranty: currentFileUploads.completeInstallationPhoto?.url,

        inverter_make: installForm.inverterMake,
        inverter_capacity: installForm.inverterCapacity,
        module_make: installForm.moduleMake,
        module_capacity: installForm.moduleCapacity,
        module_type: installForm.moduleType,
        structure_make: installForm.structureMake,

        inverter_id: installForm.inverterId,
        repeated_certificate: currentFileUploads.repeatedCertificate?.url,
        commissioning_certificate: currentFileUploads.projectCommissioningCertificate?.url,

        data_logger_type: installForm.dataLoggerType,
        sim_number: installForm.simNumber,
        mobile_number: installForm.mobileNumber,
        data_plan: installForm.dataPlan,
      })
      .eq("id", Number(selectedRecord._id))

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
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Number
                    </th>
                    {!showHistory && (
                      <>
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
                      </>
                    )}
                    {showHistory && (
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
                          Routing
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Earthing
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Base Foundation
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Wiring
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plant Photo
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          DCR Certificate
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Module Warranty certificate
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Complete Installation Photo
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Repeated Certificate
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project Commissioning Certificate
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inverter Make
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inverter Capacity
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Module Make
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Module Capacity
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Module Type
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Structure Make
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inverter ID
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data Logger Type
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SIM Number
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mobile Number
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data Plan
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
                              onClick={() => handleInstallClick(record)}
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
                            <div className="text-xs text-gray-900">{record.contactNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.surveyorName || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.surveyorContact || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.dispatchMaterial || "—"}</div>
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
                            <div className="text-xs text-gray-900 font-medium text-green-600">
                              {record.dateOfInstallation || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.routing || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.earthing || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.baseFoundation || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.wiring || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            {record.foundationPhoto ? (
                              <a
                                href={record.foundationPhoto}
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
                            {record.afterInstallationPhoto ? (
                              <a
                                href={record.afterInstallationPhoto}
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
                            {record.photoWithCustomer ? (
                              <a
                                href={record.photoWithCustomer}
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
                            {record.repeatedCertificate ? (
                              <a
                                href={record.repeatedCertificate}
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
                            {record.projectCommissioningCertificate ? (
                              <a
                                href={record.projectCommissioningCertificate}
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
                            <div className="text-xs text-gray-900">{record.inverterMake || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.inverterCapacity || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.moduleMake || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.moduleCapacity || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.moduleType || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.structureMake || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.investorId || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.dataLoggerType || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.simNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.mobileNumber || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
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
                        <td className="px-2 py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleInstallClick(record)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-linear-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm transition-all hover:scale-105 active:scale-95"
                          >
                            <Wrench className="h-3 w-3 mr-1" />
                            Install
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
                          <div className="text-xs text-gray-900">{record.ipName || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.ipContact || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.gstNumber || "—"}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          {record.aadharCard ? (
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
                          )}
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          {record.panCard ? (
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
                          )}
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
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{record.dispatchMaterial || "—"}</div>
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
                            if (/^\d*$/.test(val) && val.length <= 10) {
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

                  {/* Complete Installation Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Complete Installation Photo
                      <span className="text-gray-500 text-xs ml-1">(Image)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload("completeInstallationPhoto", e.target.files[0])}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <UploadStatus field="completeInstallationPhoto" />

                    {selectedRecord?.completeInstallationPhoto && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Existing:</span>
                        <button
                          type="button"
                          onClick={() => window.open(selectedRecord.completeInstallationPhoto, '_blank', 'noopener,noreferrer')}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview Image
                        </button>
                      </div>
                    )}
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
      </div>
    </AdminLayout>
  )
}

export default InstallationPage
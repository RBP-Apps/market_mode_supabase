"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  Search, History, FileText, CheckCircle2, X, Upload,
  Eye, Edit2, RefreshCw, User, Phone, MapPin,
  Trash2, Plus, Calendar, ShieldCheck, Info, ClipboardCopy
} from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"


export default function AssignSurveyPage() {
  const [activeTab, setActiveTab] = useState("pending") // pending / history
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Survey data
  const [surveys, setSurveys] = useState([])
  const [searchTerm, setSearchTerm] = useState("")

  // Pending Search term
  const [pendingSearchTerm, setPendingSearchTerm] = useState("")

  // Selected Pending Survey details (for filling)
  const [selectedSurvey, setSelectedSurvey] = useState(null)
  const [showSurveyModal, setShowSurveyModal] = useState(false)

  // File states (Pending form)
  const [geotagPhotos, setGeotagPhotos] = useState([]) // Array of Files
  const [electricityBills, setElectricityBills] = useState([]) // Array of Files
  const [idProof, setIdProof] = useState(null) // File
  const [addressProof, setAddressProof] = useState(null) // File

  // Previews
  const [geotagPreviews, setGeotagPreviews] = useState([])
  const [billPreviews, setBillPreviews] = useState([])
  const [idPreview, setIdPreview] = useState("")
  const [addressPreview, setAddressPreview] = useState("")

  // Survey Input Form State
  const [formData, setFormData] = useState({
    phase: "",
    backupHours: "",
    noOfFloors: "",
    roofTopArea: "",
    gridSupplyAvailable: "",
    controlRoomSpace: "",
    controlRoomArea: "",
    distanceModulesToControlRoom: "",
    distanceModuleToDcdbEarthing: "",
    distanceInverterAcdbToEarthing: "",
    distanceLaToEarthing: "",
    distanceInverterMcbMeter: "",
    shadowFreeAreaTerrace: "",
    surveyorName: "",
    surveyorContact: "",
  })

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [editGeotagPhotos, setEditGeotagPhotos] = useState([])
  const [editElectricityBills, setEditElectricityBills] = useState([])
  const [editIdProof, setEditIdProof] = useState(null)
  const [editAddressProof, setEditAddressProof] = useState(null)
  const [editGeotagPreviews, setEditGeotagPreviews] = useState([])
  const [editBillPreviews, setEditBillPreviews] = useState([])
  const [editIdPreview, setEditIdPreview] = useState("")
  const [editAddressPreview, setEditAddressPreview] = useState("")

  // PDF Preview State
  const [pdfBlob, setPdfBlob] = useState(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("")
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  const [pdfPreviewType, setPdfPreviewType] = useState("create") // "create" or "edit"

  // Actual Survey table state
  const [actualSurveys, setActualSurveys] = useState([])
  const [pendingActualSearchTerm, setPendingActualSearchTerm] = useState("")
  const [isActualSurvey, setIsActualSurvey] = useState(false)

  // Fetch surveys and joined enquiries from assign_survey & assign_survey_actual tables
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const { data: estData, error: estError } = await supabase
        .from("assign_survey")
        .select(`
          *,
          enquiries:enquiry_id (*)
        `)
        .order("id", { ascending: false })

      if (estError) throw estError
      setSurveys(estData || [])

      try {
        const { data: actData, error: actError } = await supabase
          .from("assign_survey_actual")
          .select(`
            *,
            enquiries:enquiry_id (*)
          `)
          .order("id", { ascending: false })

        if (!actError && actData) {
          setActualSurveys(actData)
        } else {
          setActualSurveys([])
        }
      } catch (e) {
        console.warn("Notice: assign_survey_actual fetch warning:", e)
        setActualSurveys([])
      }
    } catch (err) {
      console.error("Error fetching survey data:", err)
      alert("Error loading data: " + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 1. Pending (Estimate Surveys): planned_1 IS NOT NULL AND actual_1 IS NULL in assign_survey
  const pendingSurveys = useMemo(() => {
    return surveys.filter(srv => srv.planned_1 && !srv.actual_1)
  }, [surveys])

  // 2. Pending (Actual Surveys): planned_2 IS NOT NULL AND actual_2 IS NULL in assign_survey_actual
  const pendingActualSurveys = useMemo(() => {
    const actualEnquiryIds = new Set(actualSurveys.map(a => a.enquiry_id).filter(Boolean))

    // Pending in assign_survey_actual (actual_2 is null)
    const pendingInActualTable = actualSurveys.filter(srv => !srv.actual_2)

    // Estimate completed in assign_survey but not yet created in assign_survey_actual
    const completedEstNotYetInActualTable = surveys.filter(srv =>
      srv.actual_1 && !srv.actual_2 && !actualEnquiryIds.has(srv.enquiry_id)
    )

    return [...pendingInActualTable, ...completedEstNotYetInActualTable]
  }, [surveys, actualSurveys])

  // 3. Survey Complete: actual_2 IS NOT NULL in assign_survey_actual
  const completedSurveys = useMemo(() => {
    const completedInActualTable = actualSurveys.filter(srv => Boolean(srv.actual_2))
    const actualEnquiryIds = new Set(completedInActualTable.map(a => a.enquiry_id).filter(Boolean))

    const completedInEstTable = surveys.filter(srv =>
      Boolean(srv.actual_2) && !actualEnquiryIds.has(srv.enquiry_id)
    )

    return [...completedInActualTable, ...completedInEstTable]
  }, [surveys, actualSurveys])

  // Filter pending Estimate table list based on search
  const filteredPending = useMemo(() => {
    if (!pendingSearchTerm) return pendingSurveys
    const lower = pendingSearchTerm.toLowerCase()
    return pendingSurveys.filter(srv =>
      srv.enquiries?.beneficiary_name?.toLowerCase().includes(lower) ||
      srv.enquiries?.enquiry_number?.toLowerCase().includes(lower) ||
      srv.enquiries?.district?.toLowerCase().includes(lower) ||
      srv.enquiries?.system_type?.toLowerCase().includes(lower)
    )
  }, [pendingSurveys, pendingSearchTerm])

  // Filter pending Actual table list based on search
  const filteredPendingActual = useMemo(() => {
    if (!pendingActualSearchTerm) return pendingActualSurveys
    const lower = pendingActualSearchTerm.toLowerCase()
    return pendingActualSurveys.filter(srv =>
      srv.enquiries?.beneficiary_name?.toLowerCase().includes(lower) ||
      srv.enquiries?.enquiry_number?.toLowerCase().includes(lower) ||
      srv.enquiries?.district?.toLowerCase().includes(lower) ||
      srv.enquiries?.system_type?.toLowerCase().includes(lower)
    )
  }, [pendingActualSurveys, pendingActualSearchTerm])

  // Filter completed history table based on search
  const filteredHistory = useMemo(() => {
    if (!searchTerm) return completedSurveys
    const lower = searchTerm.toLowerCase()
    return completedSurveys.filter(srv =>
      srv.enquiries?.beneficiary_name?.toLowerCase().includes(lower) ||
      srv.enquiries?.enquiry_number?.toLowerCase().includes(lower) ||
      srv.surveyor_name?.toLowerCase().includes(lower) ||
      srv.enquiries?.district?.toLowerCase().includes(lower) ||
      srv.enquiries?.system_type?.toLowerCase().includes(lower)
    )
  }, [completedSurveys, searchTerm])

  // Open Survey filling modal for a pending row
  const handleStartSurvey = (surveyRecord, isActual = false) => {
    setSelectedSurvey(surveyRecord)
    setIsActualSurvey(isActual)
    setFormData({
      surveyStage: isActual ? "survey2" : "survey1",
      phase: "",
      backupHours: "",
      noOfFloors: "",
      roofTopArea: "",
      gridSupplyAvailable: "",
      controlRoomSpace: "",
      controlRoomArea: "",
      distanceModulesToControlRoom: "",
      distanceModuleToDcdbEarthing: "",
      distanceInverterAcdbToEarthing: "",
      distanceLaToEarthing: "",
      distanceInverterMcbMeter: "",
      shadowFreeAreaTerrace: "",
      surveyorName: "",
      surveyorContact: "",
    })

    setGeotagPreviews([])
    setBillPreviews([])
    setIdPreview("")
    setAddressPreview("")

    setGeotagPhotos([])
    setElectricityBills([])
    setIdProof(null)
    setAddressProof(null)

    // Reset PDF States
    setPdfBlob(null)
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl)
    }
    setPdfPreviewUrl("")
    setShowPdfPreview(false)

    setShowSurveyModal(true)
  }

  // Handle Input Changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleEditInputChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
  }

  // File Upload Helper
  const uploadFileToStorage = async (file, folder, enquiryNum) => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${enquiryNum}_${folder}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `survey/${fileName}`

    const { error } = await supabase.storage
      .from("survey_file")
      .upload(filePath, file)

    if (error) throw error

    const { data } = supabase.storage
      .from("survey_file")
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  // Handle File Additions (Pending Form)
  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    if (type === "geotag") {
      setGeotagPhotos(prev => [...prev, ...files])
      const newPreviews = files.map(file => URL.createObjectURL(file))
      setGeotagPreviews(prev => [...prev, ...newPreviews])
    } else if (type === "bills") {
      setElectricityBills(prev => [...prev, ...files])
      const newPreviews = files.map(file => URL.createObjectURL(file))
      setBillPreviews(prev => [...prev, ...newPreviews])
    } else if (type === "idProof") {
      setIdProof(files[0])
      setIdPreview(URL.createObjectURL(files[0]))
    } else if (type === "addressProof") {
      setAddressProof(files[0])
      setAddressPreview(URL.createObjectURL(files[0]))
    }
  }

  // Remove File (Pending Form)
  const removeFile = (index, type) => {
    if (type === "geotag") {
      setGeotagPhotos(prev => prev.filter((_, i) => i !== index))
      setGeotagPreviews(prev => prev.filter((_, i) => i !== index))
    } else if (type === "bills") {
      setElectricityBills(prev => prev.filter((_, i) => i !== index))
      setBillPreviews(prev => prev.filter((_, i) => i !== index))
    } else if (type === "idProof") {
      setIdProof(null)
      setIdPreview("")
    } else if (type === "addressProof") {
      setAddressProof(null)
      setAddressPreview("")
    }
  }

  // Submit Completed Survey (Updates the pre-created Pending record in assign_survey)
  const handleSubmitSurvey = async (e) => {
    e.preventDefault()

    if (!selectedSurvey) {
      alert("No beneficiary selected.")
      return
    }

    const systemType = selectedSurvey.enquiries?.system_type

    // Required Field Validations
    if (!formData.surveyStage) return alert("Survey Stage is required.")
    if (!formData.phase) return alert("Phase is required.")
    if (systemType === "Off Grid" && !formData.backupHours) {
      return alert("Required Backup Hours is mandatory for Off Grid systems.")
    }
    if (!formData.noOfFloors) return alert("No. of Floors is required.")
    if (!formData.roofTopArea) return alert("Roof Top Area is required.")
    if (!formData.gridSupplyAvailable) return alert("Grid Supply Available is required.")
    if (!formData.controlRoomSpace) return alert("Space Availability for Control Room is required.")
    if (formData.controlRoomSpace === "Yes" && !formData.controlRoomArea) {
      return alert("Area of Control Room is required.")
    }
    if (!formData.shadowFreeAreaTerrace) return alert("South Facing Shadow Free Area is required.")
    if (!formData.surveyorName) return alert("Surveyor Name is required.")
    if (!formData.surveyorContact) return alert("Surveyor Contact is required.")

    try {
      const blob = generateSurveyPDF(selectedSurvey, formData)
      const previewUrl = URL.createObjectURL(blob)
      setPdfBlob(blob)
      setPdfPreviewUrl(previewUrl)
      setPdfPreviewType("create")
      setShowPdfPreview(true)
    } catch (err) {
      console.error("PDF generation error:", err)
      alert("Failed to generate PDF preview: " + err.message)
    }
  }

  // Handle Edit Click (History modal)
  const handleEditClick = (record) => {
    setEditRecord(record)
    setEditFormData({
      phase: record.phase || "",
      backupHours: record.backup_hours || "",
      noOfFloors: record.no_of_floors || "",
      roofTopArea: record.roof_top_area || "",
      gridSupplyAvailable: record.grid_supply_available || "",
      controlRoomSpace: record.control_room_space || "",
      controlRoomArea: record.control_room_area || "",
      distanceModulesToControlRoom: record.distance_modules_to_control_room || "",
      distanceModuleToDcdbEarthing: record.distance_module_to_dcdb_earthing || "",
      distanceInverterAcdbToEarthing: record.distance_inverter_acdb_to_earthing || "",
      distanceLaToEarthing: record.distance_la_to_earthing || "",
      distanceInverterMcbMeter: record.distance_inverter_mcb_meter || "",
      shadowFreeAreaTerrace: record.shadow_free_area_terrace || "",
      surveyorName: record.surveyor_name || "",
      surveyorContact: record.surveyor_contact || "",
    })

    // Prepopulate file views (existing string URLs)
    setEditGeotagPreviews(record.geotag_photos || [])
    setEditBillPreviews(record.electricity_bills_3months || [])
    setEditIdPreview(record.id_proof || "")
    setEditAddressPreview(record.address_proof || "")

    setEditGeotagPhotos([])
    setEditElectricityBills([])
    setEditIdProof(null)
    setEditAddressProof(null)

    // Reset PDF States
    setPdfBlob(null)
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl)
    }
    setPdfPreviewUrl("")
    setShowPdfPreview(false)

    setShowEditModal(true)
  }

  // Handle File Additions in Edit Modal
  const handleEditFileChange = (e, type) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    if (type === "geotag") {
      setEditGeotagPhotos(prev => [...prev, ...files])
      const newPreviews = files.map(file => URL.createObjectURL(file))
      setEditGeotagPreviews(prev => [...prev, ...newPreviews])
    } else if (type === "bills") {
      setEditElectricityBills(prev => [...prev, ...files])
      const newPreviews = files.map(file => URL.createObjectURL(file))
      setEditBillPreviews(prev => [...prev, ...newPreviews])
    } else if (type === "idProof") {
      setEditIdProof(files[0])
      setEditIdPreview(URL.createObjectURL(files[0]))
    } else if (type === "addressProof") {
      setEditAddressProof(files[0])
      setEditAddressPreview(URL.createObjectURL(files[0]))
    }
  }

  // Remove File in Edit Modal (Both new files and already saved URLs)
  const removeEditFile = (index, type) => {
    if (type === "geotag") {
      const urlCount = editRecord.geotag_photos?.length || 0
      if (index < urlCount) {
        const updatedUrls = editRecord.geotag_photos.filter((_, i) => i !== index)
        setEditRecord(prev => ({ ...prev, geotag_photos: updatedUrls }))
        setEditGeotagPreviews(updatedUrls)
      } else {
        const fileIndex = index - urlCount
        setEditGeotagPhotos(prev => prev.filter((_, i) => i !== fileIndex))
        setEditGeotagPreviews(prev => prev.filter((_, i) => i !== index))
      }
    } else if (type === "bills") {
      const urlCount = editRecord.electricity_bills_3months?.length || 0
      if (index < urlCount) {
        const updatedUrls = editRecord.electricity_bills_3months.filter((_, i) => i !== index)
        setEditRecord(prev => ({ ...prev, electricity_bills_3months: updatedUrls }))
        setEditBillPreviews(updatedUrls)
      } else {
        const fileIndex = index - urlCount
        setEditElectricityBills(prev => prev.filter((_, i) => i !== fileIndex))
        setEditBillPreviews(prev => prev.filter((_, i) => i !== index))
      }
    } else if (type === "idProof") {
      setEditIdProof(null)
      setEditIdPreview("")
      setEditRecord(prev => ({ ...prev, id_proof: "" }))
    } else if (type === "addressProof") {
      setEditAddressProof(null)
      setEditAddressPreview("")
      setEditRecord(prev => ({ ...prev, address_proof: "" }))
    }
  }

  // Update Survey Record
  const handleUpdateSurvey = async (e) => {
    e.preventDefault()

    const systemType = editRecord.enquiries?.system_type

    // Required Field Validations
    if (!editFormData.surveyStage) return alert("Survey Stage is required.")
    if (!editFormData.phase) return alert("Phase is required.")
    if (systemType === "Off Grid" && !editFormData.backupHours) {
      return alert("Required Backup Hours is mandatory for Off Grid systems.")
    }
    if (!editFormData.noOfFloors) return alert("No. of Floors is required.")
    if (!editFormData.roofTopArea) return alert("Roof Top Area is required.")
    if (!editFormData.gridSupplyAvailable) return alert("Grid Supply Available is required.")
    if (!editFormData.controlRoomSpace) return alert("Space Availability for Control Room is required.")
    if (editFormData.controlRoomSpace === "Yes" && !editFormData.controlRoomArea) {
      return alert("Area of Control Room is required.")
    }
    if (!editFormData.shadowFreeAreaTerrace) return alert("South Facing Shadow Free Area is required.")
    if (!editFormData.surveyorName) return alert("Surveyor Name is required.")
    if (!editFormData.surveyorContact) return alert("Surveyor Contact is required.")

    try {
      const blob = generateSurveyPDF(editRecord, {
        phase: editFormData.phase,
        noOfFloors: editFormData.noOfFloors,
        roofTopArea: editFormData.roofTopArea,
        gridSupplyAvailable: editFormData.gridSupplyAvailable,
        controlRoomSpace: editFormData.controlRoomSpace,
        controlRoomArea: editFormData.controlRoomArea,
        backupHours: editFormData.backupHours,
        shadowFreeAreaTerrace: editFormData.shadowFreeAreaTerrace,
        distanceModulesToControlRoom: editFormData.distanceModulesToControlRoom,
        distanceModuleToDcdbEarthing: editFormData.distanceModuleToDcdbEarthing,
        distanceInverterAcdbToEarthing: editFormData.distanceInverterAcdbToEarthing,
        distanceLaToEarthing: editFormData.distanceLaToEarthing,
        distanceInverterMcbMeter: editFormData.distanceInverterMcbMeter,
        surveyorName: editFormData.surveyorName,
        surveyorContact: editFormData.surveyorContact
      })
      const previewUrl = URL.createObjectURL(blob)
      setPdfBlob(blob)
      setPdfPreviewUrl(previewUrl)
      setPdfPreviewType("edit")
      setShowPdfPreview(true)
    } catch (err) {
      console.error("PDF generation error:", err)
      alert("Failed to generate PDF preview: " + err.message)
    }
  }

  // Format date helper
  const generateSurveyPDF = (surveyRecord, data) => {
    const doc = new jsPDF()

    // Title
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.setTextColor(0, 80, 107) // Teal
    doc.text("RBP ENERGY INDIA PVT LTD", 105, 15, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.text("SITE SURVEY REPORT", 105, 21, { align: "center" })
    doc.setLineWidth(0.5)
    doc.setDrawColor(0, 80, 107)
    doc.line(15, 24, 195, 24)

    // Section 1: Beneficiary Details
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(0, 80, 107)
    doc.text("1. BENEFICIARY DETAILS", 15, 31)

    const beneficiaryRows = [
      ["Beneficiary Name", surveyRecord?.enquiries?.beneficiary_name || "—"],
      ["Contact Number", surveyRecord?.enquiries?.contact_number || "—"],
      ["BP Number", surveyRecord?.enquiries?.bp_number || "—"],
      ["Village / Block", surveyRecord?.enquiries?.village_block || "—"],
      ["District", surveyRecord?.enquiries?.district || "—"],
      ["Present Load", surveyRecord?.enquiries?.present_load || "—"],
      ["CSPDCL Demand", surveyRecord?.enquiries?.cspdcl_contract_demand || "—"],
      ["Future Load", surveyRecord?.enquiries?.future_load_requirement || "—"],
      ["System Type", surveyRecord?.enquiries?.system_type || "—"],
      ["Address", surveyRecord?.enquiries?.address || "—"],
      ["Load Details / Application", surveyRecord?.enquiries?.load_details || "—"]
    ]

    autoTable(doc, {
      startY: 34,
      head: [["Field Name", "Details"]],
      body: beneficiaryRows,
      theme: "striped",
      headStyles: { fillColor: [0, 80, 107], fontStyle: "bold" },
      styles: { fontSize: 9, font: "helvetica" },
      margin: { left: 15, right: 15 }
    })

    // Section 2: Survey Specifications
    let currentY = doc.lastAutoTable.finalY + 8
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(0, 80, 107)
    doc.text("2. SURVEY SPECIFICATIONS", 15, currentY)

    const surveyRows = [
      ["Survey Stage", data.surveyStage || "—"],
      ["Phase", data.phase || "—"],
      ["No. of Floors", data.noOfFloors || "—"],
      ["Roof Top Area (Sq. Ft.)", data.roofTopArea || "—"],
      ["Grid Supply Available", data.gridSupplyAvailable || "—"],
      ["Control Room Space", data.controlRoomSpace || "—"],
      ["Control Room Area (Sq. Ft.)", data.controlRoomSpace === "Yes" ? (data.controlRoomArea || "—") : "N/A"],
      ["Terrace South Shadow-Free Space", data.shadowFreeAreaTerrace || "—"]
    ]

    if (surveyRecord?.enquiries?.system_type === "Off Grid") {
      surveyRows.push(["Required Backup Hours", data.backupHours || "—"])
    }

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Field Name", "Details"]],
      body: surveyRows,
      theme: "striped",
      headStyles: { fillColor: [0, 80, 107], fontStyle: "bold" },
      styles: { fontSize: 9, font: "helvetica" },
      margin: { left: 15, right: 15 }
    })

    // Section 3: Distance Specifications
    currentY = doc.lastAutoTable.finalY + 8
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(0, 80, 107)
    doc.text("3. DISTANCE SPECIFICATIONS (METERS)", 15, currentY)

    const distanceRows = [
      ["Modules to Control Room", data.distanceModulesToControlRoom || "—"],
      ["Module to DCDB & Earthing", data.distanceModuleToDcdbEarthing || "—"],
      ["Inverter & ACDB to Earthing", data.distanceInverterAcdbToEarthing || "—"],
      ["LA Point to Earthing", data.distanceLaToEarthing || "—"],
      ["Inverter to MCB; MCB to Meter", data.distanceInverterMcbMeter || "—"]
    ]

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Field Name", "Details"]],
      body: distanceRows,
      theme: "striped",
      headStyles: { fillColor: [0, 80, 107], fontStyle: "bold" },
      styles: { fontSize: 9, font: "helvetica" },
      margin: { left: 15, right: 15 }
    })

    // Section 4: Surveyor Info
    currentY = doc.lastAutoTable.finalY + 8
    if (currentY > 250) {
      doc.addPage()
      currentY = 20
    }
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(0, 80, 107)
    doc.text("4. SURVEYOR INFO", 15, currentY)

    const surveyorRows = [
      ["Surveyor Name", data.surveyorName || "—"],
      ["Surveyor Contact", data.surveyorContact || "—"]
    ]

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Field Name", "Details"]],
      body: surveyorRows,
      theme: "striped",
      headStyles: { fillColor: [0, 80, 107], fontStyle: "bold" },
      styles: { fontSize: 9, font: "helvetica" },
      margin: { left: 15, right: 15 }
    })

    // Footer signature / date
    currentY = doc.lastAutoTable.finalY + 12
    if (currentY > 260) {
      doc.addPage()
      currentY = 20
    }
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(`Report Generated On: ${new Date().toLocaleDateString("en-IN")}`, 15, currentY)
    doc.text("This is an electronically verified site survey report.", 15, currentY + 5)

    return doc.output("blob")
  }

  const handleSubmitSurveyFinal = async () => {
    if (!selectedSurvey || !pdfBlob) return

    setSubmitting(true)

    try {
      const enqNum = selectedSurvey.enquiries?.enquiry_number || "GEN"

      // 1. Upload files
      let geotagUrls = isActualSurvey ? [...(selectedSurvey.geotag_photos || [])] : []
      for (const file of geotagPhotos) {
        const url = await uploadFileToStorage(file, "geotag", enqNum)
        geotagUrls.push(url)
      }

      let billUrls = isActualSurvey ? [...(selectedSurvey.electricity_bills_3months || [])] : []
      for (const file of electricityBills) {
        const url = await uploadFileToStorage(file, "bill", enqNum)
        billUrls.push(url)
      }

      let idProofUrl = isActualSurvey ? (selectedSurvey.id_proof || "") : ""
      if (idProof) {
        idProofUrl = await uploadFileToStorage(idProof, "id_proof", enqNum)
      }

      let addressProofUrl = isActualSurvey ? (selectedSurvey.address_proof || "") : ""
      if (addressProof) {
        addressProofUrl = await uploadFileToStorage(addressProof, "address_proof", enqNum)
      }

      // 2. Upload generated PDF
      const pdfFile = new File([pdfBlob], `${enqNum}_survey_report_${Date.now()}.pdf`, { type: "application/pdf" })
      const pdfUrl = await uploadFileToStorage(pdfFile, "pdf_generate", enqNum)

      const systemType = selectedSurvey.enquiries?.system_type

      if (isActualSurvey) {
        // --- COMPLETING ACTUAL SURVEY ---
        const today = new Date().toISOString().split("T")[0]
        const actualUpdatePayload = {
          enquiry_id: selectedSurvey.enquiry_id,
          planned_2: selectedSurvey.planned_2 || today,
          survey_stage: "survey2",
          phase: formData.phase,
          backup_hours: systemType === "Off Grid" ? formData.backupHours : null,
          no_of_floors: formData.noOfFloors,
          roof_top_area: formData.roofTopArea,
          grid_supply_available: formData.gridSupplyAvailable,
          control_room_space: formData.controlRoomSpace,
          control_room_area: formData.controlRoomSpace === "Yes" ? formData.controlRoomArea : null,
          distance_modules_to_control_room: formData.distanceModulesToControlRoom,
          distance_module_to_dcdb_earthing: formData.distanceModuleToDcdbEarthing,
          distance_inverter_acdb_to_earthing: formData.distanceInverterAcdbToEarthing,
          distance_la_to_earthing: formData.distanceLaToEarthing,
          distance_inverter_mcb_meter: formData.distanceInverterMcbMeter,
          shadow_free_area_terrace: formData.shadowFreeAreaTerrace,
          surveyor_name: formData.surveyorName,
          surveyor_contact: formData.surveyorContact,
          geotag_photos: geotagUrls,
          electricity_bills_3months: billUrls,
          id_proof: idProofUrl,
          address_proof: addressProofUrl,
          pdf_generate: pdfUrl,
          actual_2: new Date().toISOString(), // Actual survey complete condition!
          survey_date: new Date().toISOString()
        }

        const { data: existingActualRec } = await supabase
          .from("assign_survey_actual")
          .select("id")
          .eq("enquiry_id", selectedSurvey.enquiry_id)

        if (existingActualRec && existingActualRec.length > 0) {
          const { error: actualErr } = await supabase
            .from("assign_survey_actual")
            .update(actualUpdatePayload)
            .eq("id", existingActualRec[0].id)
          if (actualErr) throw actualErr
        } else {
          const { error: actualErr } = await supabase
            .from("assign_survey_actual")
            .insert(actualUpdatePayload)
          if (actualErr) throw actualErr
        }

        setSuccessMessage("Actual survey completed! Record moved to Survey Complete.")
        setActiveTab("completed")

      } else {
        // --- COMPLETING ESTIMATE SURVEY ---
        // 1. Update assign_survey record (satisfies DB Trigger condition: planned_1 NOT NULL AND actual_1 NOT NULL)
        const estPayload = {
          survey_stage: "survey1",
          phase: formData.phase,
          backup_hours: systemType === "Off Grid" ? formData.backupHours : null,
          no_of_floors: formData.noOfFloors,
          roof_top_area: formData.roofTopArea,
          grid_supply_available: formData.gridSupplyAvailable,
          control_room_space: formData.controlRoomSpace,
          control_room_area: formData.controlRoomSpace === "Yes" ? formData.controlRoomArea : null,
          distance_modules_to_control_room: formData.distanceModulesToControlRoom,
          distance_module_to_dcdb_earthing: formData.distanceModuleToDcdbEarthing,
          distance_inverter_acdb_to_earthing: formData.distanceInverterAcdbToEarthing,
          distance_la_to_earthing: formData.distanceLaToEarthing,
          distance_inverter_mcb_meter: formData.distanceInverterMcbMeter,
          shadow_free_area_terrace: formData.shadowFreeAreaTerrace,
          surveyor_name: formData.surveyorName,
          surveyor_contact: formData.surveyorContact,
          geotag_photos: geotagUrls,
          electricity_bills_3months: billUrls,
          id_proof: idProofUrl,
          address_proof: addressProofUrl,
          pdf_generate: pdfUrl,
          actual_1: new Date().toISOString(),
          survey_date: new Date().toISOString()
        }

        const { error: estErr } = await supabase
          .from("assign_survey")
          .update(estPayload)
          .eq("id", selectedSurvey.id)

        if (estErr) throw estErr

        // 2. Fallback upsert into assign_survey_actual for Actual Survey stage (planned_2 = CURRENT_DATE, actual_2 = null)
        try {
          const { data: existingRecords } = await supabase
            .from("assign_survey_actual")
            .select("id")
            .eq("enquiry_id", selectedSurvey.enquiry_id)

          const today = new Date().toISOString().split("T")[0]
          const actualPayload = {
            enquiry_id: selectedSurvey.enquiry_id,
            planned_2: today,
            actual_2: null, // Pending Actual Survey!
            survey_stage: "survey2"
          }

          if (!existingRecords || existingRecords.length === 0) {
            await supabase
              .from("assign_survey_actual")
              .insert(actualPayload)
          }
        } catch (e) {
          console.error("Notice: error creating record in assign_survey_actual:", e)
        }

        setSuccessMessage("Estimate survey completed! Automatically moved to Pending (Actual Surveys).")
        setActiveTab("pending_actual")
      }

      setShowPdfPreview(false)
      setShowSurveyModal(false)
      setSelectedSurvey(null)
      setPdfBlob(null)
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
        setPdfPreviewUrl("")
      }

      // Reload Data
      await fetchData()
      setTimeout(() => setSuccessMessage(""), 5000)
    } catch (err) {
      console.error("Submission error:", err)
      alert("Submission failed: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateSurveyFinal = async () => {
    if (!editRecord || !pdfBlob) return

    setSubmitting(true)
    try {
      const enqNum = editRecord.enquiries?.enquiry_number || "GEN"

      // 1. Upload new files if any
      let finalGeotagUrls = [...(editRecord.geotag_photos || [])]
      for (const file of editGeotagPhotos) {
        const url = await uploadFileToStorage(file, "geotag", enqNum)
        finalGeotagUrls.push(url)
      }

      let finalBillUrls = [...(editRecord.electricity_bills_3months || [])]
      for (const file of editElectricityBills) {
        const url = await uploadFileToStorage(file, "bill", enqNum)
        finalBillUrls.push(url)
      }

      let finalIdProofUrl = editRecord.id_proof || ""
      if (editIdProof) {
        finalIdProofUrl = await uploadFileToStorage(editIdProof, "id_proof", enqNum)
      }

      let finalAddressProofUrl = editRecord.address_proof || ""
      if (editAddressProof) {
        finalAddressProofUrl = await uploadFileToStorage(editAddressProof, "address_proof", enqNum)
      }

      // 2. Upload generated PDF
      const pdfFile = new File([pdfBlob], `${enqNum}_survey_report_${Date.now()}.pdf`, { type: "application/pdf" })
      const pdfUrl = await uploadFileToStorage(pdfFile, "pdf_generate", enqNum)

      // 3. Perform database update on target table
      const updatePayload = {
        survey_stage: editFormData.surveyStage || "survey1",
        phase: editFormData.phase,
        backup_hours: editRecord.enquiries?.system_type === "Off Grid" ? editFormData.backupHours : null,
        no_of_floors: editFormData.noOfFloors,
        roof_top_area: editFormData.roofTopArea,
        grid_supply_available: editFormData.gridSupplyAvailable,
        control_room_space: editFormData.controlRoomSpace,
        control_room_area: editFormData.controlRoomSpace === "Yes" ? editFormData.controlRoomArea : null,
        distance_modules_to_control_room: editFormData.distanceModulesToControlRoom,
        distance_module_to_dcdb_earthing: editFormData.distanceModuleToDcdbEarthing,
        distance_inverter_acdb_to_earthing: editFormData.distanceInverterAcdbToEarthing,
        distance_la_to_earthing: editFormData.distanceLaToEarthing,
        distance_inverter_mcb_meter: editFormData.distanceInverterMcbMeter,
        shadow_free_area_terrace: editFormData.shadowFreeAreaTerrace,
        surveyor_name: editFormData.surveyorName,
        surveyor_contact: editFormData.surveyorContact,
        geotag_photos: finalGeotagUrls,
        electricity_bills_3months: finalBillUrls,
        id_proof: finalIdProofUrl,
        address_proof: finalAddressProofUrl,
        pdf_generate: pdfUrl
      }

      const targetTable = (editRecord.planned_2 !== undefined || actualSurveys.some(a => a.id === editRecord.id || (a.enquiry_id && a.enquiry_id === editRecord.enquiry_id)))
        ? "assign_survey_actual"
        : "assign_survey"

      const { error: updateError } = await supabase
        .from(targetTable)
        .update(updatePayload)
        .eq("id", editRecord.id)

      if (updateError) throw updateError

      setShowPdfPreview(false)
      setShowEditModal(false)
      setSuccessMessage("Survey updated successfully!")
      setPdfBlob(null)
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
        setPdfPreviewUrl("")
      }
      await fetchData()
      setTimeout(() => setSuccessMessage(""), 5000)
    } catch (err) {
      console.error("Update error:", err)
      alert("Update failed: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClosePreview = () => {
    setShowPdfPreview(false)
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl)
      setPdfPreviewUrl("")
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "—"
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  return (
    <AdminLayout>
      <div className="p-4 max-w-7xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className=" p-6 rounded-2xl  shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold  flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 " />
              Assign Survey Management
            </h1>
            <p className=" text-sm mt-1">
              Complete details of pending beneficiary site surveys, or check history reports.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30  px-4 py-2 rounded-xl text-sm font-semibold transition border border-white/10"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex space-x-2 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => { setActiveTab("pending"); setPendingSearchTerm("") }}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "pending"
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <FileText className="h-4 w-4" />
            Pending (Estimate Surveys) ({pendingSurveys.length})
          </button>
          <button
            onClick={() => { setActiveTab("pending_actual"); setPendingActualSearchTerm("") }}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "pending_actual"
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <FileText className="h-4 w-4" />
            Pending (Actual Surveys) ({pendingActualSurveys.length})
          </button>
          <button
            onClick={() => { setActiveTab("history"); setSearchTerm("") }}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "history"
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <History className="h-4 w-4" />
            Survey Completed ({completedSurveys.length})
          </button>
        </div>

        {/* Alert/Success Message */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              {successMessage}
            </div>
            <button onClick={() => setSuccessMessage("")} className="text-emerald-600 hover:text-emerald-800">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* TAB 1: PENDING (ESTIMATE SURVEYS) LIST */}
        {activeTab === "pending" && (
          <div className="space-y-4">

            {/* Search filter block */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
              <div className="relative w-full md:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search pending estimate surveys by beneficiary, district..."
                  value={pendingSearchTerm}
                  onChange={(e) => setPendingSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm focus:outline-none transition"
                />
              </div>

              <div className="text-xs text-gray-500 font-semibold">
                Showing {filteredPending.length} pending estimate surveys
              </div>
            </div>

            {/* Pending Estimate Surveys Table */}
            <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
              <div className="overflow-x-auto" style={{ maxHeight: "60vh" }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10 text-center">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Survey No</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Enquiry Number</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Beneficiary Name</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Planned Date</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">District</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Number</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">System Type</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200 text-center">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-500">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                          <p className="text-xs">Loading pending estimate list...</p>
                        </td>
                      </tr>
                    ) : filteredPending.length > 0 ? (
                      filteredPending.map((srv) => (
                        <tr key={srv.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 whitespace-nowrap text-xs">
                            <button
                              type="button"
                              onClick={() => handleStartSurvey(srv, false)}
                              className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg font-bold transition shadow-xs"
                            >
                              <ClipboardCopy className="h-3.5 w-3.5" />
                              Start Estimate Survey
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 font-medium">SRV-{String(srv.id).padStart(3, '0')}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-600 font-semibold">{srv.enquiries?.enquiry_number || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 font-bold">{srv.enquiries?.beneficiary_name || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{formatDate(srv.planned_1)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">{srv.enquiries?.district || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">{srv.enquiries?.contact_number || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 font-semibold text-indigo-700">
                            {srv.enquiries?.system_type || "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400 text-sm">
                          No pending estimate surveys found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: PENDING (ACTUAL SURVEYS) LIST */}
        {activeTab === "pending_actual" && (
          <div className="space-y-4">

            {/* Search filter block */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
              <div className="relative w-full md:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search pending actual surveys by beneficiary, district..."
                  value={pendingActualSearchTerm}
                  onChange={(e) => setPendingActualSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm focus:outline-none transition"
                />
              </div>

              <div className="text-xs text-gray-500 font-semibold">
                Showing {filteredPendingActual.length} pending actual surveys
              </div>
            </div>

            {/* Pending Actual Surveys Table */}
            <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
              <div className="overflow-x-auto" style={{ maxHeight: "60vh" }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10 text-center">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Survey No</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Enquiry Number</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Beneficiary Name</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Planned Date</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">District</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Number</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">System Type</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200 text-center">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-500">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                          <p className="text-xs">Loading pending actual list...</p>
                        </td>
                      </tr>
                    ) : filteredPendingActual.length > 0 ? (
                      filteredPendingActual.map((srv) => (
                        <tr key={srv.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 whitespace-nowrap text-xs">
                            <button
                              type="button"
                              onClick={() => handleStartSurvey(srv, true)}
                              className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg font-bold transition shadow-xs"
                            >
                              <ClipboardCopy className="h-3.5 w-3.5" />
                              Start Actual Survey
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 font-medium">SRV-ACT-{String(srv.id).padStart(3, '0')}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-600 font-semibold">{srv.enquiries?.enquiry_number || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 font-bold">{srv.enquiries?.beneficiary_name || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{formatDate(srv.planned_1)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">{srv.enquiries?.district || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">{srv.enquiries?.contact_number || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 font-semibold text-indigo-700">
                            {srv.enquiries?.system_type || "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400 text-sm">
                          No pending actual surveys found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: HISTORY LIST */}
        {activeTab === "history" && (
          <div className="space-y-4">

            {/* Search filter block */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
              <div className="relative w-full md:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search history by beneficiary, surveyor, district..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm focus:outline-none transition"
                />
              </div>

              <div className="text-xs text-gray-500 font-semibold">
                Showing {filteredHistory.length} completed surveys
              </div>
            </div>

            {/* History Table */}
            <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
              <div className="overflow-x-auto" style={{ maxHeight: "60vh" }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10 text-center">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-blue-600 uppercase tracking-wider">Estimate PDF</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-600 uppercase tracking-wider">Actual PDF</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Survey No</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Enquiry Number</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Beneficiary Name</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Planned Date</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actual Date</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Delay (Days)</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">District</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Surveyor Name</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Surveyor Contact</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">System Type</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Phase</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200 text-center">
                    {loading ? (
                      <tr>
                        <td colSpan={14} className="py-8 text-center text-gray-500">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                          <p className="text-xs">Loading survey history...</p>
                        </td>
                      </tr>
                    ) : filteredHistory.length > 0 ? (
                      filteredHistory.map((srv) => {
                        const estRecord = surveys.find(s => s.enquiry_id === srv.enquiry_id && !s.is_actual)
                        return (
                          <tr key={srv.id} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-3 whitespace-nowrap text-xs">
                              <button
                                type="button"
                                onClick={() => handleEditClick(srv)}
                                className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-semibold transition"
                              >
                                <Edit2 className="h-3 w-3" />
                                Edit
                              </button>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs">
                              {estRecord?.pdf_generate ? (
                                <a
                                  href={estRecord.pdf_generate}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg font-bold transition shadow-2xs"
                                >
                                  <Eye className="h-3 w-3" />
                                  Estimate PDF
                                </a>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs">
                              {srv.pdf_generate ? (
                                <a
                                  href={srv.pdf_generate}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg font-bold transition shadow-2xs"
                                >
                                  <Eye className="h-3 w-3" />
                                  Actual PDF
                                </a>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 font-medium">SRV-{String(srv.id).padStart(3, '0')}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-600 font-semibold">{srv.enquiries?.enquiry_number || "—"}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 font-bold">{srv.enquiries?.beneficiary_name || "—"}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{formatDate(srv.planned_1)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{formatDate(srv.actual_1)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 font-medium">
                              {srv.delay_1 ? (
                                <span className={`px-2 py-0.5 rounded-full ${parseInt(srv.delay_1, 10) > 0 ? "bg-rose-50 text-rose-700 font-semibold" : "bg-emerald-50 text-emerald-700"
                                  }`}>
                                  {srv.delay_1}
                                </span>
                              ) : "0"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">{srv.enquiries?.district || "—"}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">{srv.surveyor_name || "—"}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">{srv.surveyor_contact || "—"}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${srv.enquiries?.system_type === "On Grid" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                                }`}>
                                {srv.enquiries?.system_type || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{srv.phase || "—"}</td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={14} className="py-8 text-center text-gray-400 text-sm">
                          No completed survey records match your search
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* MODAL: START/FILL SURVEY (PENDING WORKFLOW) */}
        {showSurveyModal && selectedSurvey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-scaleUp overflow-hidden">

              {/* Modal Header */}
              <div className={`${isActualSurvey ? "bg-indigo-700" : "bg-blue-700"} text-white px-6 py-4 flex justify-between items-center transition-colors`}>
                <div>
                  <h3 className="font-bold text-lg">
                    {isActualSurvey ? "Perform Actual Site Survey: SRV-ACT-" : "Perform Estimate Site Survey: SRV-"}
                    {String(selectedSurvey.id).padStart(3, '0')}
                  </h3>
                  <p className="text-xs text-blue-100">Enquiry No: {selectedSurvey.enquiries?.enquiry_number} | Beneficiary: {selectedSurvey.enquiries?.beneficiary_name}</p>
                </div>
                <button
                  onClick={() => setShowSurveyModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmitSurvey} className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* 1. Read-Only Beneficiary info inside Modal */}
                <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-gray-500 block">Beneficiary Name</span>
                    <span className="text-gray-900 font-bold">{selectedSurvey.enquiries?.beneficiary_name || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">Contact Number</span>
                    <span className="text-gray-900 font-medium">{selectedSurvey.enquiries?.contact_number || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">BP Number</span>
                    <span className="text-gray-900">{selectedSurvey.enquiries?.bp_number || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">Village / Block</span>
                    <span className="text-gray-900">{selectedSurvey.enquiries?.village_block || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">District</span>
                    <span className="text-gray-900">{selectedSurvey.enquiries?.district || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">Present Load</span>
                    <span className="text-gray-900">{selectedSurvey.enquiries?.present_load || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">CSPDCL Demand</span>
                    <span className="text-gray-900">{selectedSurvey.enquiries?.cspdcl_contract_demand || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">Future Load</span>
                    <span className="text-gray-900">{selectedSurvey.enquiries?.future_load_requirement || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">System Type</span>
                    <span className="text-indigo-700 font-semibold">{selectedSurvey.enquiries?.system_type || "—"}</span>
                  </div>

                  {selectedSurvey.enquiries?.avg_electricity_bill && (
                    <div className="md:col-span-3 flex items-center gap-2 pt-2 border-t border-gray-100">
                      <span className="font-semibold text-gray-500">Electricity Bill Copy:</span>
                      <a
                        href={selectedSurvey.enquiries.avg_electricity_bill}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View File
                      </a>
                    </div>
                  )}

                  <div className="md:col-span-3">
                    <span className="font-semibold text-gray-500 block">Address</span>
                    <span className="text-gray-900">{selectedSurvey.enquiries?.address || "—"}</span>
                  </div>

                  <div className="md:col-span-3">
                    <span className="font-semibold text-gray-500 block">Load Details / Application</span>
                    <span className="text-gray-900">{selectedSurvey.enquiries?.load_details || "—"}</span>
                  </div>
                </div>

                {/* 2. Survey specs form */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-gray-800 border-b border-gray-100 pb-2">Survey Specifications</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Survey Stage <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={isActualSurvey ? "survey2" : "survey1"}
                        className="w-full border border-gray-300 bg-gray-100 font-bold text-gray-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Phase <span className="text-red-500">*</span></label>
                      <select
                        value={formData.phase}
                        onChange={(e) => handleInputChange("phase", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select Phase</option>
                        <option value="Single">Single Phase</option>
                        <option value="Three">Three Phase</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">No. of Floors <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. G+1"
                        value={formData.noOfFloors}
                        onChange={(e) => handleInputChange("noOfFloors", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Roof Top Area (Sq. Ft.) <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. 1200 sqft"
                        value={formData.roofTopArea}
                        onChange={(e) => handleInputChange("roofTopArea", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Grid Supply Available <span className="text-red-500">*</span></label>
                      <select
                        value={formData.gridSupplyAvailable}
                        onChange={(e) => handleInputChange("gridSupplyAvailable", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Control Room Space <span className="text-red-500">*</span></label>
                      <select
                        value={formData.controlRoomSpace}
                        onChange={(e) => handleInputChange("controlRoomSpace", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    {formData.controlRoomSpace === "Yes" && (
                      <div className="space-y-1 animate-fadeIn">
                        <label className="text-xs font-bold text-gray-700">Control Room Area (Sq. Ft.) <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="e.g. 100 sqft"
                          value={formData.controlRoomArea}
                          onChange={(e) => handleInputChange("controlRoomArea", e.target.value)}
                          className="w-full border border-amber-300 bg-amber-50/20 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    )}

                    {selectedSurvey.enquiries?.system_type === "Off Grid" && (
                      <div className="space-y-1 animate-fadeIn">
                        <label className="text-xs font-bold text-gray-700">Required Backup Hours <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="e.g. 4 hours"
                          value={formData.backupHours}
                          onChange={(e) => handleInputChange("backupHours", e.target.value)}
                          className="w-full border border-amber-300 bg-amber-50/25 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Terrace South Shadow-Free Space <span className="text-red-500">*</span></label>
                      <select
                        value={formData.shadowFreeAreaTerrace}
                        onChange={(e) => handleInputChange("shadowFreeAreaTerrace", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Distances form */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-gray-800 border-b border-gray-100 pb-2">Distance Specifications (Meters)</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Modules to Control Room</label>
                      <input
                        type="text"
                        placeholder="e.g. 15m"
                        value={formData.distanceModulesToControlRoom}
                        onChange={(e) => handleInputChange("distanceModulesToControlRoom", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Module to DCDB & Earthing</label>
                      <input
                        type="text"
                        placeholder="e.g. 10m"
                        value={formData.distanceModuleToDcdbEarthing}
                        onChange={(e) => handleInputChange("distanceModuleToDcdbEarthing", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Inverter & ACDB to Earthing</label>
                      <input
                        type="text"
                        placeholder="e.g. 8m"
                        value={formData.distanceInverterAcdbToEarthing}
                        onChange={(e) => handleInputChange("distanceInverterAcdbToEarthing", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">LA Point to Earthing</label>
                      <input
                        type="text"
                        placeholder="e.g. 12m"
                        value={formData.distanceLaToEarthing}
                        onChange={(e) => handleInputChange("distanceLaToEarthing", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-gray-700">Inverter to MCB; MCB to Meter</label>
                      <input
                        type="text"
                        placeholder="e.g. 5m / 2m"
                        value={formData.distanceInverterMcbMeter}
                        onChange={(e) => handleInputChange("distanceInverterMcbMeter", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Uploads Section */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-gray-800 border-b border-gray-100 pb-2">Media & Documents</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">

                    {/* Geotags */}
                    <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                      <label className="block font-bold text-gray-700">Geotag Photos of Site (Multiple)</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "geotag")}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />

                      {geotagPreviews.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 pt-2">
                          {geotagPreviews.map((url, i) => (
                            <div key={i} className="relative group h-12 w-full rounded-lg overflow-hidden border border-gray-200">
                              <img src={url} alt="geotag site" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeFile(i, "geotag")}
                                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow-xs hover:bg-red-600 transition"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bills */}
                    <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                      <label className="block font-bold text-gray-700">Electricity Bills of Last 3 Months (Multiple)</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileChange(e, "bills")}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />

                      {billPreviews.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 pt-2">
                          {billPreviews.map((url, i) => (
                            <div key={i} className="relative group h-12 w-full rounded-lg overflow-hidden border border-gray-200">
                              {url.includes("pdf") ? (
                                <div className="h-full w-full flex items-center justify-center bg-gray-100 text-[10px] text-gray-500 font-bold">PDF</div>
                              ) : (
                                <img src={url} alt="bill copy" className="h-full w-full object-cover" />
                              )}
                              <button
                                type="button"
                                onClick={() => removeFile(i, "bills")}
                                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow-xs hover:bg-red-600 transition"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* 5. Surveyor Credentials */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-gray-800 border-b border-gray-100 pb-2">Surveyor Info</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Surveyor Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="Enter surveyor name"
                        value={formData.surveyorName}
                        onChange={(e) => handleInputChange("surveyorName", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Surveyor Contact <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="Enter surveyor contact"
                        value={formData.surveyorContact}
                        onChange={(e) => handleInputChange("surveyorContact", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Actions Footer */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowSurveyModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-100 text-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Submit Survey
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT COMPLETED SURVEY */}
        {showEditModal && editRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-scaleUp overflow-hidden">

              {/* Modal Header */}
              <div className="bg-indigo-700 text-white px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">Edit Survey: SRV-{String(editRecord.id).padStart(3, '0')}</h3>
                  <p className="text-xs text-indigo-100">Enquiry No: {editRecord.enquiries?.enquiry_number} | Beneficiary: {editRecord.enquiries?.beneficiary_name}</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleUpdateSurvey} className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* 1. Read-Only Enquiry Block inside Modal */}
                <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-gray-500 block">Beneficiary Name</span>
                    <span className="text-gray-900 font-bold">{editRecord.enquiries?.beneficiary_name || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">Contact Number</span>
                    <span className="text-gray-900">{editRecord.enquiries?.contact_number || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">BP Number</span>
                    <span className="text-gray-900">{editRecord.enquiries?.bp_number || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">District</span>
                    <span className="text-gray-900">{editRecord.enquiries?.district || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">Present Load</span>
                    <span className="text-gray-900">{editRecord.enquiries?.present_load || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">CSPDCL Demand</span>
                    <span className="text-gray-900">{editRecord.enquiries?.cspdcl_contract_demand || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">System Type</span>
                    <span className="text-indigo-700 font-semibold">{editRecord.enquiries?.system_type || "—"}</span>
                  </div>
                </div>

                {/* 2. Survey Specs Edit */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-gray-800 border-b border-gray-100 pb-2">Survey Specifications</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Survey Stage</label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={editFormData.surveyStage || "survey1"}
                        className="w-full border border-gray-300 bg-gray-100 font-bold text-gray-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Phase</label>
                      <select
                        value={editFormData.phase}
                        onChange={(e) => handleEditInputChange("phase", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select Phase</option>
                        <option value="Single">Single Phase</option>
                        <option value="Three">Three Phase</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">No. of Floors</label>
                      <input
                        type="text"
                        value={editFormData.noOfFloors}
                        onChange={(e) => handleEditInputChange("noOfFloors", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Roof Top Area</label>
                      <input
                        type="text"
                        value={editFormData.roofTopArea}
                        onChange={(e) => handleEditInputChange("roofTopArea", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Grid Supply Available</label>
                      <select
                        value={editFormData.gridSupplyAvailable}
                        onChange={(e) => handleEditInputChange("gridSupplyAvailable", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Control Room Space</label>
                      <select
                        value={editFormData.controlRoomSpace}
                        onChange={(e) => handleEditInputChange("controlRoomSpace", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    {editFormData.controlRoomSpace === "Yes" && (
                      <div className="space-y-1 animate-fadeIn">
                        <label className="text-xs font-bold text-gray-700">Control Room Area</label>
                        <input
                          type="text"
                          value={editFormData.controlRoomArea}
                          onChange={(e) => handleEditInputChange("controlRoomArea", e.target.value)}
                          className="w-full border border-amber-300 bg-amber-50/20 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    )}

                    {editRecord.enquiries?.system_type === "Off Grid" && (
                      <div className="space-y-1 animate-fadeIn">
                        <label className="text-xs font-bold text-gray-700">Required Backup Hours</label>
                        <input
                          type="text"
                          value={editFormData.backupHours}
                          onChange={(e) => handleEditInputChange("backupHours", e.target.value)}
                          className="w-full border border-amber-300 bg-amber-50/25 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Shadow Free Terrace Space</label>
                      <select
                        value={editFormData.shadowFreeAreaTerrace}
                        onChange={(e) => handleEditInputChange("shadowFreeAreaTerrace", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Distances Edit */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-gray-800 border-b border-gray-100 pb-2">Distance Specifications (Meters)</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Modules to Control Room</label>
                      <input
                        type="text"
                        value={editFormData.distanceModulesToControlRoom}
                        onChange={(e) => handleEditInputChange("distanceModulesToControlRoom", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Module to DCDB & Earthing</label>
                      <input
                        type="text"
                        value={editFormData.distanceModuleToDcdbEarthing}
                        onChange={(e) => handleEditInputChange("distanceModuleToDcdbEarthing", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Inverter & ACDB to Earthing</label>
                      <input
                        type="text"
                        value={editFormData.distanceInverterAcdbToEarthing}
                        onChange={(e) => handleEditInputChange("distanceInverterAcdbToEarthing", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">LA Point to Earthing</label>
                      <input
                        type="text"
                        value={editFormData.distanceLaToEarthing}
                        onChange={(e) => handleEditInputChange("distanceLaToEarthing", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-gray-700">Inverter to MCB; MCB to Meter</label>
                      <input
                        type="text"
                        value={editFormData.distanceInverterMcbMeter}
                        onChange={(e) => handleEditInputChange("distanceInverterMcbMeter", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Edit Media Uploads */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-gray-800 border-b border-gray-100 pb-2">Media & Documents</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">

                    {/* Geotags */}
                    <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                      <label className="block font-bold text-gray-700">Geotag Photos</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleEditFileChange(e, "geotag")}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />

                      {editGeotagPreviews.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 pt-2">
                          {editGeotagPreviews.map((url, i) => (
                            <div key={i} className="relative group h-12 w-full rounded-lg overflow-hidden border border-gray-200">
                              <img src={url} alt="geotag site" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeEditFile(i, "geotag")}
                                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow-xs hover:bg-red-600 transition"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bills */}
                    <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                      <label className="block font-bold text-gray-700">Electricity Bills</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={(e) => handleEditFileChange(e, "bills")}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />

                      {editBillPreviews.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 pt-2">
                          {editBillPreviews.map((url, i) => (
                            <div key={i} className="relative group h-12 w-full rounded-lg overflow-hidden border border-gray-200">
                              {url.includes("pdf") ? (
                                <div className="h-full w-full flex items-center justify-center bg-gray-100 text-[10px] text-gray-500 font-bold">PDF</div>
                              ) : (
                                <img src={url} alt="bill copy" className="h-full w-full object-cover" />
                              )}
                              <button
                                type="button"
                                onClick={() => removeEditFile(i, "bills")}
                                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow-xs hover:bg-red-600 transition"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ID Proof */}
                    <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                      <label className="block font-bold text-gray-700">ID Proof</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleEditFileChange(e, "idProof")}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />

                      {editIdPreview && (
                        <div className="relative h-12 w-20 rounded-lg overflow-hidden border border-gray-200 mt-2">
                          {editIdPreview.includes("pdf") ? (
                            <div className="h-full w-full flex items-center justify-center bg-gray-100 text-[10px] text-gray-500 font-bold">PDF</div>
                          ) : (
                            <img src={editIdPreview} alt="id proof" className="h-full w-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => removeEditFile(null, "idProof")}
                            className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow-xs hover:bg-red-600 transition"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Address Proof */}
                    <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                      <label className="block font-bold text-gray-700">Address Proof</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleEditFileChange(e, "addressProof")}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />

                      {editAddressPreview && (
                        <div className="relative h-12 w-20 rounded-lg overflow-hidden border border-gray-200 mt-2">
                          {editAddressPreview.includes("pdf") ? (
                            <div className="h-full w-full flex items-center justify-center bg-gray-100 text-[10px] text-gray-500 font-bold">PDF</div>
                          ) : (
                            <img src={editAddressPreview} alt="address proof" className="h-full w-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => removeEditFile(null, "addressProof")}
                            className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow-xs hover:bg-red-600 transition"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Surveyor Credentials */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-gray-800 border-b border-gray-100 pb-2">Surveyor Info</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Surveyor Name</label>
                      <input
                        type="text"
                        value={editFormData.surveyorName}
                        onChange={(e) => handleEditInputChange("surveyorName", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Surveyor Contact</label>
                      <input
                        type="text"
                        value={editFormData.surveyorContact}
                        onChange={(e) => handleEditInputChange("surveyorContact", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Actions Footer */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-100 text-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* PDF Preview Modal */}
        {showPdfPreview && pdfPreviewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden animate-scaleUp">

              {/* Preview Modal Header */}
              <div className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-lg">Survey PDF Preview</h3>
                  <p className="text-xs text-blue-100 font-medium">Review the generated survey report PDF before final submission.</p>
                </div>
                <button
                  onClick={handleClosePreview}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Preview Modal Body: iframe to view the PDF */}
              <div className="flex-1 bg-gray-100 p-4 flex items-center justify-center overflow-hidden">
                <iframe
                  src={`${pdfPreviewUrl}#toolbar=1`}
                  className="w-full h-full border border-gray-300 rounded-xl bg-white shadow-xs"
                  title="PDF Survey Preview"
                />
              </div>

              {/* Preview Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center shrink-0">
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-100 text-gray-700 transition flex items-center gap-1.5"
                >
                  <X className="h-4 w-4" />
                  Back / Edit
                </button>
                <button
                  type="button"
                  onClick={pdfPreviewType === "create" ? handleSubmitSurveyFinal : handleUpdateSurveyFinal}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Final Submit
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}

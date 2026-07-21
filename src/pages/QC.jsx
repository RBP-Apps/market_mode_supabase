"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, X, Search, History, Eye, Calendar, Loader2, ShieldCheck, ClipboardCheck, ArrowRight, Upload, Check, AlertCircle, FileText } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

const PHYSICAL_INSPECTION_ITEMS = [
  { id: 1, text: "Anchor fastners should use at the time of Structure installation" },
  { id: 2, text: "Structure Base foundation size should be (400mmX400mmX400mm)" },
  { id: 3, text: "Foundation Haller/Mandir with White Paint" },
  { id: 4, text: "Tightness Check of all structure nut bolts" },
  { id: 5, text: "Proper Cleaning of all PV modules before installation" },
  { id: 6, text: "Physical Proper installation of structure, Modules, Inverter, ACDB, DCDB, Lightening arrestors, Earthings Etc." },
  { id: 7, text: "All wirings should be Proper & routed through Condutive Pipe" },
  { id: 8, text: "Earthing & Power cables are properly dressed or not" },
  { id: 9, text: "Distance between each earthings (It should be minimum 1mtr)" },
  { id: 10, text: "Mid Clamp & End Clamps should Fitting & proper Tightening" },
  { id: 11, text: "DC/AC Cables should route through Pipe/Conduit" },
  { id: 12, text: "ACDB/DCDB/INVERTER should be properly mounted and Covered/Sheild (To avoid Rain Water)" },
  { id: 13, text: "Inverter/ACDB/DCDB Body Earthing should be done (Double Earthing for Inverter)" },
  { id: 14, text: "AC & DC SPD Earthing should be Seperate & Done" },
  { id: 15, text: "LA Earthing should be Seperate" },
  { id: 16, text: "Structure Earthing should be Done" },
  { id: 17, text: "Inverter Grid/PV side connectors should be Tightened" },
  { id: 18, text: "All MC4 Connectors should be tight and Crimped Properly" },
  { id: 19, text: "No loose wirings/connections in ACDB/DCDB/Inverter/PV modules" },
  { id: 20, text: "ACDB/DCDB/Inverter/Motors/Pumps/PV module grounding resistance check (Value should be < 5 Ohms)" },
  { id: 21, text: "DC Fuse rating should be as per design" },
  { id: 22, text: "AC MCB rating should be as per design" },
  { id: 23, text: "Earth pit resistance check (Value should be < 5 Ohms)" },
  { id: 24, text: "Earthing pit chambers/cover should be provided" },
  { id: 25, text: "Proper Danger board & Single Line Diagram (SLD) should be pasted" }
]

const DOCUMENTS_ITEMS = [
  { id: 1, name: "Installation Certificate (Joint Commissioning Report/Work Completion Report)" },
  { id: 2, name: "Copy of Customer Undertaking/Consumer Agreement" },
  { id: 3, name: "Material Receipt/Challan Copy" },
  { id: 4, name: "Inverter Warranty Card/Warranty Certificate" },
  { id: 5, name: "PV Module Warranty Card/Warranty Certificate" },
  { id: 6, name: "PV Module DCR Certificate" },
  { id: 7, name: "Solar Plant Photo (High Quality)" },
  { id: 8, name: "Earthing Pit Photo with Resistance Value" },
  { id: 9, name: "Earthing Pit Chambers/Cover Photo" },
  { id: 10, name: "Structure Foundation Photo" },
  { id: 11, name: "Cable Routing Photo" },
  { id: 12, name: "Safety Checklist / Hazard Identification Sheet" },
  { id: 13, name: "Structure Foundation Size Check Sheet" },
  { id: 14, name: "Inverter & ACDB/DCDB Installation Photo" },
  { id: 15, name: "Net Meter & Solar Meter Installation Photo" }
]

export default function QCPage() {
  const [pendingData, setPendingData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  
  // Modal Form State
  const [activeFormTab, setActiveFormTab] = useState("consumer")
  const [form, setForm] = useState({
    // Prefilled/Editable
    inverterSerial: "",
    inverterMake: "",
    inverterCapacity: "",
    structureType: "",
    structureMake: "",
    
    // Inverter new details
    inverterIpWifi: "",
    
    // DCDB details
    dcdbSerial: "",
    dcSpdMake: "",
    dcFuseMake: "",
    dcMcbMake: "",
    
    // ACDB details
    acdbSerial: "",
    acSpdMake: "",
    acMcbMake: "",
    
    // MMS details
    structureMaterial: "",
    
    // AC wiring
    acCableMake: "",
    acCableSize: "",
    acCableLength: "",
    
    // DC wiring
    dcCableMake: "",
    dcCableSize: "",
    dcCableLength: "",
    
    // Earthing
    earthingCount: "",
    earthingType: "",
    earthingMake: "",
    earthingChemicalMake: "",
    earthingSizeMake: "",
    
    // Solar Meter
    netMeterSerial: "",
    solarMeterSerial: "",
    ctRatio: "",
    
    // Checklist responses
    checklist: {}, // { itemId: { status: 'YES'|'NO', remarks: '' } }
    
    // Documents upload status & links
    documents: {} // { docId: { status: 'YES'|'NO', remarks: '', url: '' } }
  })

  const [uploadingDocId, setUploadingDocId] = useState(null)

  const formatDate = useCallback((dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    if (isNaN(date.getTime()) || date.getFullYear() === 1970) return ""
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
  }, [])

  const fetchFmsData = useCallback(async () => {
    try {
      setLoading(true)

      const [
        { data: qcData, error: qcError },
        { data: fmsData, error: fmsError }
      ] = await Promise.all([
        supabase
          .from("qc")
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
          .select("enquiry_number, bp_number, cspdcl_contract_demand, present_load, installation_date, actual_9")
      ])

      if (qcError) throw qcError
      if (fmsError) throw fmsError

      const fmsMap = {}
      if (fmsData) {
        fmsData.forEach(item => {
          if (item.enquiry_number) {
            fmsMap[item.enquiry_number] = {
              bpNumber: item.bp_number || "",
              sanctionLoad: item.cspdcl_contract_demand || "",
              installedRating: item.present_load || "",
              installationDate: item.installation_date || item.actual_9 || ""
            }
          }
        })
      }

      const pending = []
      const history = []

      if (qcData) {
        qcData.forEach((row) => {
          const enqNum = row.enquiry_number || ""
          const enq = row.enquiries || {}
          const fmsRow = fmsMap[enqNum] || {}

          const rowData = {
            id: row.id,
            enquiryNumber: enqNum,
            beneficiaryName: enq.beneficiary_name || "",
            address: enq.address || "",
            contactNumber: enq.contact_number || "",
            bpNumber: fmsRow.bpNumber || "",
            sanctionLoad: fmsRow.sanctionLoad || "",
            installedRating: fmsRow.installedRating || "",
            installationDate: fmsRow.installationDate || "",
            
            // Fields directly from qc table
            inverterSerial: row.inverter_serial || "",
            inverterMake: row.inverter_make || "",
            inverterCapacity: row.inverter_capacity || "",
            structureType: row.structure_type || "",
            structureMake: row.structure_make || "",
            
            inverterIpWifi: row.inverter_ip_wifi || "",
            dcdbSerial: row.dcdb_serial || "",
            dcSpdMake: row.dc_spd_make || "",
            dcFuseMake: row.dc_fuse_make || "",
            dcMcbMake: row.dc_mcb_make || "",
            
            acdbSerial: row.acdb_serial || "",
            acSpdMake: row.ac_spd_make || "",
            acMcbMake: row.ac_mcb_make || "",
            
            structureMaterial: row.structure_material || "",
            
            acCableMake: row.ac_cable_make || "",
            acCableSize: row.ac_cable_size || "",
            acCableLength: row.ac_cable_length || "",
            
            dcCableMake: row.dc_cable_make || "",
            dcCableSize: row.dc_cable_size || "",
            dcCableLength: row.dc_cable_length || "",
            
            earthingCount: row.earthing_count || "",
            earthingType: row.earthing_type || "",
            earthingMake: row.earthing_make || "",
            earthingChemicalMake: row.earthing_chemical_make || "",
            earthingSizeMake: row.earthing_size_make || "",
            
            netMeterSerial: row.net_meter_serial || "",
            solarMeterSerial: row.solar_meter_serial || "",
            ctRatio: row.ct_ratio || "",
            
            checklist: row.checklist || {},
            documents: row.documents || {},
            remarks: row.remarks || "",

            qcDate: row.planned ? formatDate(row.planned) : "",
            actual: row.actual || "",
            planned: row.planned || ""
          }

          // pending :- planned not or actual null pending me show krega
          // history :- planned or actula dono not null rhegaa to show kregaa
          if (row.planned && !row.actual) {
            pending.push(rowData)
          } else if (row.planned && row.actual) {
            history.push(rowData)
          }
        })
      }

      setPendingData(pending)
      setHistoryData(history)
    } catch (e) {
      console.error("Error fetching QC data:", e)
    } finally {
      setLoading(false)
    }
  }, [formatDate])

  useEffect(() => {
    fetchFmsData()
  }, [fetchFmsData])

  const filteredData = useMemo(() => {
    const data = showHistory ? historyData : pendingData
    if (!searchTerm.trim()) return data
    const query = searchTerm.toLowerCase()
    return data.filter(
      (r) =>
        r.enquiryNumber.toLowerCase().includes(query) ||
        r.beneficiaryName.toLowerCase().includes(query) ||
        r.address.toLowerCase().includes(query)
    )
  }, [showHistory, pendingData, historyData, searchTerm])

  const handleActionClick = useCallback((record) => {
    setSelectedRecord(record)
    setActiveFormTab("consumer")
    
    let parsedQC = {}
    if (record.remarks) {
      try {
        parsedQC = JSON.parse(record.remarks)
      } catch (err) {
        // Not a JSON, keep empty
      }
    }

    // Initialize physical inspection checklist
    const initialChecklist = {}
    PHYSICAL_INSPECTION_ITEMS.forEach(item => {
      initialChecklist[item.id] = record.checklist?.[item.id] || parsedQC.checklist?.[item.id] || { status: "YES", remarks: "" }
    })

    // Initialize documents checklist
    const initialDocs = {}
    DOCUMENTS_ITEMS.forEach(item => {
      initialDocs[item.id] = record.documents?.[item.id] || parsedQC.documents?.[item.id] || { status: "NO", remarks: "", url: "" }
    })

    setForm({
      inverterSerial: record.inverterSerial || parsedQC.inverterSerial || "",
      inverterMake: record.inverterMake || parsedQC.inverterMake || "",
      inverterCapacity: record.inverterCapacity || parsedQC.inverterCapacity || "",
      structureType: record.structureType || parsedQC.structureType || "",
      structureMake: record.structureMake || parsedQC.structureMake || "",
      
      inverterIpWifi: record.inverterIpWifi || parsedQC.inverterIpWifi || "",
      dcdbSerial: record.dcdbSerial || parsedQC.dcdbSerial || "",
      dcSpdMake: record.dcSpdMake || parsedQC.dcSpdMake || "",
      dcFuseMake: record.dcFuseMake || parsedQC.dcFuseMake || "",
      dcMcbMake: record.dcMcbMake || parsedQC.dcMcbMake || "",
      acdbSerial: record.acdbSerial || parsedQC.acdbSerial || "",
      acSpdMake: record.acSpdMake || parsedQC.acSpdMake || "",
      acMcbMake: record.acMcbMake || parsedQC.acMcbMake || "",
      structureMaterial: record.structureMaterial || parsedQC.structureMaterial || "",
      acCableMake: record.acCableMake || parsedQC.acCableMake || "",
      acCableSize: record.acCableSize || parsedQC.acCableSize || "",
      acCableLength: record.acCableLength || parsedQC.acCableLength || "",
      dcCableMake: record.dcCableMake || parsedQC.dcCableMake || "",
      dcCableSize: record.dcCableSize || parsedQC.dcCableSize || "",
      dcCableLength: record.dcCableLength || parsedQC.dcCableLength || "",
      earthingCount: record.earthingCount || parsedQC.earthingCount || "",
      earthingType: record.earthingType || parsedQC.earthingType || "",
      earthingMake: record.earthingMake || parsedQC.earthingMake || "",
      earthingChemicalMake: record.earthingChemicalMake || parsedQC.earthingChemicalMake || "",
      earthingSizeMake: record.earthingSizeMake || parsedQC.earthingSizeMake || "",
      netMeterSerial: record.netMeterSerial || parsedQC.netMeterSerial || "",
      solarMeterSerial: record.solarMeterSerial || parsedQC.solarMeterSerial || "",
      ctRatio: record.ctRatio || parsedQC.ctRatio || "",
      
      checklist: initialChecklist,
      documents: initialDocs
    })
    setShowModal(true)
  }, [])

  const handleFileUpload = async (docId, file) => {
    if (!file) return
    setUploadingDocId(docId)
    try {
      const extension = file.name.split(".").pop()
      const fileName = `qc_${selectedRecord.enquiryNumber}_doc_${docId}_${Date.now()}.${extension}`
      
      const { error: uploadError } = await supabase.storage
        .from("module_uploads")
        .upload(fileName, file)
        
      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from("module_uploads")
        .getPublicUrl(fileName)

      setForm(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [docId]: {
            ...prev.documents[docId],
            status: "YES",
            url: data.publicUrl
          }
        }
      }))
    } catch (err) {
      console.error("Error uploading file:", err)
      alert("Failed to upload document: " + err.message)
    } finally {
      setUploadingDocId(null)
    }
  }

  const handleChecklistStatusChange = (itemId, status) => {
    setForm(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [itemId]: {
          ...prev.checklist[itemId],
          status
        }
      }
    }))
  }

  const handleChecklistRemarksChange = (itemId, remarks) => {
    setForm(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [itemId]: {
          ...prev.checklist[itemId],
          remarks
        }
      }
    }))
  }

  const handleDocStatusChange = (docId, status) => {
    setForm(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docId]: {
          ...prev.documents[docId],
          status
        }
      }
    }))
  }

  const handleDocRemarksChange = (docId, remarks) => {
    setForm(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docId]: {
          ...prev.documents[docId],
          remarks
        }
      }
    }))
  }

  const handleSaveQC = async () => {
    setIsSubmitting(true)
    try {
      const qcJson = JSON.stringify(form)

      const { error } = await supabase
        .from("qc")
        .update({
          actual: new Date().toISOString(),
          remarks: qcJson,
          
          inverter_serial: form.inverterSerial || null,
          inverter_make: form.inverterMake || null,
          inverter_capacity: form.inverterCapacity || null,
          structure_type: form.structureType || null,
          structure_make: form.structureMake || null,
          inverter_ip_wifi: form.inverterIpWifi || null,
          
          dcdb_serial: form.dcdbSerial || null,
          dc_spd_make: form.dcSpdMake || null,
          dc_fuse_make: form.dcFuseMake || null,
          dc_mcb_make: form.dcMcbMake || null,
          
          acdb_serial: form.acdbSerial || null,
          ac_spd_make: form.acSpdMake || null,
          ac_mcb_make: form.acMcbMake || null,
          
          structure_material: form.structureMaterial || null,
          
          ac_cable_make: form.acCableMake || null,
          ac_cable_size: form.acCableSize || null,
          ac_cable_length: form.acCableLength || null,
          
          dc_cable_make: form.dcCableMake || null,
          dc_cable_size: form.dcCableSize || null,
          dc_cable_length: form.dcCableLength || null,
          
          earthing_count: form.earthingCount || null,
          earthing_type: form.earthingType || null,
          earthing_make: form.earthingMake || null,
          earthing_chemical_make: form.earthingChemicalMake || null,
          earthing_size_make: form.earthingSizeMake || null,
          
          net_meter_serial: form.netMeterSerial || null,
          solar_meter_serial: form.solarMeterSerial || null,
          ct_ratio: form.ctRatio || null,
          
          checklist: form.checklist || null,
          documents: form.documents || null
        })
        .eq("enquiry_number", selectedRecord.enquiryNumber)

      if (error) throw error

      setSuccessMessage(`QC completed successfully for ${selectedRecord.beneficiaryName}`)
      setShowModal(false)
      fetchFmsData()
    } catch (e) {
      console.error(e)
      alert("Failed to save QC: " + e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top bar info */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-700">Quality Control (QC)</h1>
            <p className="text-sm text-gray-500 mt-1">Perform quality checks on systems after installation</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={showHistory ? "Search completed QC..." : "Search pending QC..."}
                className="pl-9 pr-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64 shadow-xs"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setShowHistory(false)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${!showHistory
              ? "border-blue-500 text-blue-600 bg-blue-50/50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
          >
            <div className="flex items-center">
              <ShieldCheck className="h-4.5 w-4.5 mr-2" />
              Pending QC ({pendingData.length})
            </div>
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${showHistory
              ? "border-blue-500 text-blue-600 bg-blue-50/50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
          >
            <div className="flex items-center">
              <History className="h-4.5 w-4.5 mr-2" />
              QC History ({historyData.length})
            </div>
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex justify-between items-center shadow-xs animate-in fade-in slide-in-from-top-2">
            <span className="flex items-center font-medium"><CheckCircle2 size={18} className="mr-2 text-green-600" /> {successMessage}</span>
            <X onClick={() => setSuccessMessage("")} size={18} className="cursor-pointer hover:text-green-900" />
          </div>
        )}

        {/* Table View */}
        <div className="bg-white border border-blue-100 rounded-xl shadow-xs overflow-hidden min-h-[400px]">
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-sm text-left text-nowrap">
              <thead className="bg-gray-50 text-gray-700 uppercase text-[11px] tracking-wider font-bold border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-4 w-28">Action</th>
                  <th className="px-4 py-4">Enquiry No</th>
                  <th className="px-4 py-4">Beneficiary Name</th>
                  <th className="px-4 py-4">Site Address</th>
                  <th className="px-4 py-4">Mobile No</th>
                  <th className="px-4 py-4">Installation Date</th>
                  {showHistory && <th className="px-4 py-4">QC Date</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {loading ? (
                  <tr>
                    <td colSpan={showHistory ? 7 : 6} className="p-20 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full border-4 border-blue-50 border-t-blue-600 animate-spin"></div>
                        </div>
                        <p className="text-blue-900 font-bold text-sm">Loading QC Data...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={showHistory ? 7 : 6} className="p-16 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <ClipboardCheck size={36} className="text-gray-300 mb-2" />
                        <p className="font-medium text-gray-500">No QC records found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-25/50 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleActionClick(row)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <Eye size={13} />
                          {showHistory ? "VIEW / EDIT" : "QC CHECK"}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-800 text-xs">{row.enquiryNumber}</td>
                      <td className="px-4 py-3 text-gray-900 font-semibold text-xs">{row.beneficiaryName}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs max-w-xs truncate">{row.address}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs font-mono">{row.contactNumber}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(row.installationDate)}</td>
                      {showHistory && <td className="px-4 py-3 text-green-700 font-semibold text-xs">{row.qcDate}</td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QC PERFORM MODAL */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold">Quality Control (QC) Form</h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Consumer: {selectedRecord.beneficiaryName} | Enquiry No: {selectedRecord.enquiryNumber}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Sub-tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50 shrink-0 overflow-x-auto text-xs sm:text-sm font-semibold">
              {[
                { id: "consumer", label: "01. Consumer & Specs" },
                { id: "physical", label: "02. Physical Inspection" },
                { id: "electrical", label: "03. Electrical Details" },
                { id: "documents", label: "04. Documents Upload" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFormTab(tab.id)}
                  className={`px-5 py-3 border-b-2 transition-all whitespace-nowrap ${
                    activeFormTab === tab.id
                      ? "border-blue-600 text-blue-600 bg-white"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Form Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
              
              {/* TAB 1: CONSUMER & SYSTEM SPECS */}
              {activeFormTab === "consumer" && (
                <div className="space-y-6">
                  {/* Consumer details card */}
                  <div className="bg-blue-25/50 border border-blue-100 rounded-xl p-4 space-y-4">
                    <h4 className="font-bold text-blue-700 flex items-center gap-1.5">
                      <FileText size={16} /> Consumer Information (Read-Only)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="block text-gray-400 font-medium">Consumer Name</span>
                        <span className="font-semibold text-gray-800">{selectedRecord.beneficiaryName || "N/A"}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-medium">BP Number</span>
                        <span className="font-semibold text-gray-800">{selectedRecord.bpNumber || "N/A"}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-medium">Sanction Load</span>
                        <span className="font-semibold text-gray-800">{selectedRecord.sanctionLoad || "N/A"}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-medium">Installed Rating</span>
                        <span className="font-semibold text-gray-800">{selectedRecord.installedRating || "N/A"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-gray-400 font-medium">Site Address</span>
                        <span className="font-semibold text-gray-800">{selectedRecord.address || "N/A"}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-medium">Mobile No</span>
                        <span className="font-semibold text-gray-800">{selectedRecord.contactNumber || "N/A"}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-medium">Date of Installation</span>
                        <span className="font-semibold text-gray-800">{formatDate(selectedRecord.installationDate) || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Prefilled editable components */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-2">System Specs (Verify & Edit)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inverter Make</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors text-xs"
                          value={form.inverterMake}
                          onChange={e => setForm({ ...form, inverterMake: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inverter Capacity</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors text-xs"
                          value={form.inverterCapacity}
                          onChange={e => setForm({ ...form, inverterCapacity: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inverter Serial No</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors text-xs"
                          value={form.inverterSerial}
                          onChange={e => setForm({ ...form, inverterSerial: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Structure Type</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors text-xs"
                          value={form.structureType}
                          onChange={e => setForm({ ...form, structureType: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Structure Make</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors text-xs"
                          value={form.structureMake}
                          onChange={e => setForm({ ...form, structureMake: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inverter IP / Wi-Fi Dongle ID</label>
                        <input
                          type="text"
                          placeholder="Enter Dongle ID"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors text-xs"
                          value={form.inverterIpWifi}
                          onChange={e => setForm({ ...form, inverterIpWifi: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PHYSICAL INSPECTION CHECKLIST */}
              {activeFormTab === "physical" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-150 pb-2">
                    <h4 className="font-bold text-gray-800">Physical Inspection Checklist</h4>
                    <span className="text-xs text-gray-400 font-medium">Verify all installation parameters</span>
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="max-h-[50vh] overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 text-gray-700 uppercase font-bold sticky top-0 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 w-12 text-center">SL</th>
                            <th className="px-4 py-3">Inspection Checklist Point</th>
                            <th className="px-4 py-3 w-40 text-center">Status (YES/NO)</th>
                            <th className="px-4 py-3 w-60">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {PHYSICAL_INSPECTION_ITEMS.map((item, index) => {
                            const val = form.checklist[item.id] || { status: "YES", remarks: "" }
                            return (
                              <tr key={item.id} className="hover:bg-gray-25">
                                <td className="px-4 py-3 text-center text-gray-400 font-bold">{index + 1}</td>
                                <td className="px-4 py-3 text-gray-700 font-semibold">{item.text}</td>
                                <td className="px-4 py-3 text-center">
                                  <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 font-bold text-[10px]">
                                    <button
                                      type="button"
                                      onClick={() => handleChecklistStatusChange(item.id, "YES")}
                                      className={`px-3 py-1 rounded-md transition-all ${
                                        val.status === "YES"
                                          ? "bg-green-600 text-white shadow-xs"
                                          : "text-gray-500 hover:text-gray-850"
                                      }`}
                                    >
                                      YES
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleChecklistStatusChange(item.id, "NO")}
                                      className={`px-3 py-1 rounded-md transition-all ${
                                        val.status === "NO"
                                          ? "bg-red-500 text-white shadow-xs"
                                          : "text-gray-500 hover:text-gray-850"
                                      }`}
                                    >
                                      NO
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="text"
                                    placeholder="Add remarks..."
                                    className="w-full border border-gray-200 rounded-md px-2.5 py-1 text-xs outline-none focus:border-blue-500"
                                    value={val.remarks}
                                    onChange={e => handleChecklistRemarksChange(item.id, e.target.value)}
                                  />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ELECTRICAL COMPONENTS & WIRING DETAILS */}
              {activeFormTab === "electrical" && (
                <div className="space-y-6">
                  {/* DCDB Details */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-blue-700 border-b border-blue-50 pb-1 text-xs uppercase tracking-wider">01. DCDB Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-550 mb-1">DCDB Serial No/Make</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-xs"
                          value={form.dcdbSerial}
                          onChange={e => setForm({ ...form, dcdbSerial: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-550 mb-1">DC SPD Make/Rating</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-xs"
                          value={form.dcSpdMake}
                          onChange={e => setForm({ ...form, dcSpdMake: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-550 mb-1">DC Fuse Make/Rating</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-xs"
                          value={form.dcFuseMake}
                          onChange={e => setForm({ ...form, dcFuseMake: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-550 mb-1">DC MCB/Isolator Make</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-xs"
                          value={form.dcMcbMake}
                          onChange={e => setForm({ ...form, dcMcbMake: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ACDB Details */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-blue-700 border-b border-blue-50 pb-1 text-xs uppercase tracking-wider">02. ACDB Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-550 mb-1">ACDB Serial No/Make</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-xs"
                          value={form.acdbSerial}
                          onChange={e => setForm({ ...form, acdbSerial: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-550 mb-1">AC SPD Make/Rating</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-xs"
                          value={form.acSpdMake}
                          onChange={e => setForm({ ...form, acSpdMake: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-550 mb-1">AC MCB Make/Rating</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-xs"
                          value={form.acMcbMake}
                          onChange={e => setForm({ ...form, acMcbMake: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* MMS Structure Details */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-blue-700 border-b border-blue-50 pb-1 text-xs uppercase tracking-wider">03. MMS Material</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-550 mb-1">Structure Material (HDG / Galvalume / Aluminum)</label>
                        <select
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-xs bg-white"
                          value={form.structureMaterial}
                          onChange={e => setForm({ ...form, structureMaterial: e.target.value })}
                        >
                          <option value="">Select Structure Material</option>
                          <option value="HDG">HDG (Hot Dip Galvanized)</option>
                          <option value="Galvalume">Galvalume</option>
                          <option value="Aluminum">Aluminum</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Wiring Details */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-blue-700 border-b border-blue-50 pb-1 text-xs uppercase tracking-wider">04. Wiring Specifications</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-3.5 bg-gray-50/50 rounded-xl space-y-3 border border-gray-100">
                        <span className="font-bold text-xs text-gray-700 block">AC Cable</span>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Cable Make</label>
                          <input
                            type="text"
                            className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 outline-none focus:border-blue-500 text-xs bg-white"
                            value={form.acCableMake}
                            onChange={e => setForm({ ...form, acCableMake: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Size (Sq.mm) & Core</label>
                          <input
                            type="text"
                            placeholder="e.g. 4 Sq.mm, 4 Core"
                            className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 outline-none focus:border-blue-500 text-xs bg-white"
                            value={form.acCableSize}
                            onChange={e => setForm({ ...form, acCableSize: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Length (Mtrs)</label>
                          <input
                            type="number"
                            className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 outline-none focus:border-blue-500 text-xs bg-white"
                            value={form.acCableLength}
                            onChange={e => setForm({ ...form, acCableLength: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="p-3.5 bg-gray-50/50 rounded-xl space-y-3 border border-gray-100">
                        <span className="font-bold text-xs text-gray-700 block">DC Cable</span>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Cable Make</label>
                          <input
                            type="text"
                            className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 outline-none focus:border-blue-500 text-xs bg-white"
                            value={form.dcCableMake}
                            onChange={e => setForm({ ...form, dcCableMake: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Size (Sq.mm)</label>
                          <input
                            type="text"
                            placeholder="e.g. 4 Sq.mm"
                            className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 outline-none focus:border-blue-500 text-xs bg-white"
                            value={form.dcCableSize}
                            onChange={e => setForm({ ...form, dcCableSize: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Length (Mtrs)</label>
                          <input
                            type="number"
                            className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 outline-none focus:border-blue-500 text-xs bg-white"
                            value={form.dcCableLength}
                            onChange={e => setForm({ ...form, dcCableLength: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Earthing Details */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-blue-700 border-b border-blue-50 pb-1 text-xs uppercase tracking-wider">05. Earthing Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-550 mb-1">No. of Earthings</label>
                        <input
                          type="number"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-xs"
                          value={form.earthingCount}
                          onChange={e => setForm({ ...form, earthingCount: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-550 mb-1">Electrode Type</label>
                        <input
                          type="text"
                          placeholder="Chemical/Pipe/Plate"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-xs"
                          value={form.earthingType}
                          onChange={e => setForm({ ...form, earthingType: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-550 mb-1">Electrode Make</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-xs"
                          value={form.earthingMake}
                          onChange={e => setForm({ ...form, earthingMake: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-550 mb-1">Chemical Make</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-xs"
                          value={form.earthingChemicalMake}
                          onChange={e => setForm({ ...form, earthingChemicalMake: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-550 mb-1">Wire/Strip Size & Make</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-xs"
                          value={form.earthingSizeMake}
                          onChange={e => setForm({ ...form, earthingSizeMake: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Solar Meter Details */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-blue-700 border-b border-blue-50 pb-1 text-xs uppercase tracking-wider">06. Solar & Net Meter Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-550 mb-1">Net Meter Serial No.</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-xs"
                          value={form.netMeterSerial}
                          onChange={e => setForm({ ...form, netMeterSerial: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-550 mb-1">Solar Meter Serial No.</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-xs"
                          value={form.solarMeterSerial}
                          onChange={e => setForm({ ...form, solarMeterSerial: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-550 mb-1">CT Ratio (if applicable)</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-xs"
                          value={form.ctRatio}
                          onChange={e => setForm({ ...form, ctRatio: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: DOCUMENTS CHECKLIST & UPLOADS */}
              {activeFormTab === "documents" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-150 pb-2">
                    <h4 className="font-bold text-gray-800">Documents Requirement Checklist</h4>
                    <span className="text-xs text-gray-400 font-medium">Upload installation & specification files</span>
                  </div>
                  
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="max-h-[50vh] overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 text-gray-700 uppercase font-bold sticky top-0 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 w-12 text-center">SL</th>
                            <th className="px-4 py-3">Document Name</th>
                            <th className="px-4 py-3 w-40 text-center">Status (Yes/No)</th>
                            <th className="px-4 py-3 w-64 text-center">Upload File</th>
                            <th className="px-4 py-3 w-48">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {DOCUMENTS_ITEMS.map((item, index) => {
                            const val = form.documents[item.id] || { status: "NO", remarks: "", url: "" }
                            return (
                              <tr key={item.id} className="hover:bg-gray-25">
                                <td className="px-4 py-3 text-center text-gray-400 font-bold">{index + 1}</td>
                                <td className="px-4 py-3 text-gray-700 font-semibold">{item.name}</td>
                                <td className="px-4 py-3 text-center">
                                  <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 font-bold text-[10px]">
                                    <button
                                      type="button"
                                      onClick={() => handleDocStatusChange(item.id, "YES")}
                                      className={`px-3 py-1 rounded-md transition-all ${
                                        val.status === "YES"
                                          ? "bg-green-600 text-white shadow-xs"
                                          : "text-gray-500 hover:text-gray-850"
                                      }`}
                                    >
                                      YES
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDocStatusChange(item.id, "NO")}
                                      className={`px-3 py-1 rounded-md transition-all ${
                                        val.status === "NO"
                                          ? "bg-red-500 text-white shadow-xs"
                                          : "text-gray-500 hover:text-gray-850"
                                      }`}
                                    >
                                      NO
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    {val.url ? (
                                      <>
                                        <a
                                          href={val.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-blue-600 hover:underline font-bold text-xs"
                                        >
                                          View File
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setForm(prev => ({
                                              ...prev,
                                              documents: {
                                                ...prev.documents,
                                                [item.id]: {
                                                  ...prev.documents[item.id],
                                                  url: ""
                                                }
                                              }
                                            }))
                                          }}
                                          className="text-red-500 hover:text-red-700 text-[10px] font-bold"
                                        >
                                          Remove
                                        </button>
                                      </>
                                    ) : (
                                      <label className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-1.5 border border-dashed border-blue-300 hover:border-blue-500 rounded-lg text-blue-600 bg-blue-25/30 transition-all font-semibold">
                                        <Upload size={12} />
                                        <span>{uploadingDocId === item.id ? "Uploading..." : "Upload"}</span>
                                        <input
                                          type="file"
                                          className="hidden"
                                          disabled={uploadingDocId === item.id}
                                          onChange={e => handleFileUpload(item.id, e.target.files?.[0])}
                                        />
                                      </label>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="text"
                                    placeholder="Add remarks..."
                                    className="w-full border border-gray-200 rounded-md px-2.5 py-1 text-xs outline-none focus:border-blue-500"
                                    value={val.remarks}
                                    onChange={e => handleDocRemarksChange(item.id, e.target.value)}
                                  />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4.5 bg-gray-50 border-t border-gray-200 shrink-0 flex justify-between items-center">
              <div className="flex gap-2">
                {activeFormTab !== "consumer" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeFormTab === "physical") setActiveFormTab("consumer")
                      else if (activeFormTab === "electrical") setActiveFormTab("physical")
                      else if (activeFormTab === "documents") setActiveFormTab("electrical")
                    }}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors text-xs font-bold"
                  >
                    PREVIOUS
                  </button>
                )}
                {activeFormTab !== "documents" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeFormTab === "consumer") setActiveFormTab("physical")
                      else if (activeFormTab === "physical") setActiveFormTab("electrical")
                      else if (activeFormTab === "electrical") setActiveFormTab("documents")
                    }}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                  >
                    NEXT <ArrowRight size={12} />
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-gray-600 transition-colors text-xs font-bold"
                >
                  DISCARD
                </button>
                <button
                  type="button"
                  onClick={handleSaveQC}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-lg shadow-green-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin h-3.5 w-3.5" />
                  ) : (
                    <Check size={14} />
                  )}
                  SAVE QC SUBMISSION
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

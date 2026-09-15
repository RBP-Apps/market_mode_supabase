"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Filter,
  RotateCcw,
  Sun,
  Zap,
  Download,
  RefreshCw,
  Copy,
  Check,
  Layers,
  Settings,
  DollarSign
} from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

export default function SolarSystemsQuoteListPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState("")

  // Global search & Dropdown filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedModuleType, setSelectedModuleType] = useState("ALL")
  const [selectedMode, setSelectedMode] = useState("ALL")
  const [selectedStructure, setSelectedStructure] = useState("ALL")
  const [selectedPhase, setSelectedPhase] = useState("ALL")
  const [selectedCapacity, setSelectedCapacity] = useState("ALL")

  // In-dropdown search states
  const [searchInModuleDropdown, setSearchInModuleDropdown] = useState("")
  const [searchInModeDropdown, setSearchInModeDropdown] = useState("")
  const [searchInStructureDropdown, setSearchInStructureDropdown] = useState("")
  const [searchInPhaseDropdown, setSearchInPhaseDropdown] = useState("")
  const [searchInCapacityDropdown, setSearchInCapacityDropdown] = useState("")

  // Dropdown open states
  const [openModuleDropdown, setOpenModuleDropdown] = useState(false)
  const [openModeDropdown, setOpenModeDropdown] = useState(false)
  const [openStructureDropdown, setOpenStructureDropdown] = useState(false)
  const [openPhaseDropdown, setOpenPhaseDropdown] = useState(false)
  const [openCapacityDropdown, setOpenCapacityDropdown] = useState(false)

  const moduleDropdownRef = useRef(null)
  const modeDropdownRef = useRef(null)
  const structureDropdownRef = useRef(null)
  const phaseDropdownRef = useRef(null)
  const capacityDropdownRef = useRef(null)

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  // Copied spec tooltip indicator
  const [copiedField, setCopiedField] = useState("")

  // Form states
  const initialFormState = {
    system_key: "",
    system_id: "",
    module_type: "",
    structure: "",
    mode: "",
    capacity_kwp: "",
    phase: "",
    rating_wp: "",
    panels: "",
    actual_kwp: "",
    original_rate: "",
    gst_percent: "",
    total_incl_gst_ex_battery: "",
    applicable_subsidy: "",
    central_subsidy_segment: "",
    state_subsidy_segment: "",
    net_ex_battery: "",
    spec_part_1: "",
    spec_line_d_structure: "",
    spec_part_2: ""
  }
  const [formData, setFormData] = useState(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moduleDropdownRef.current && !moduleDropdownRef.current.contains(event.target)) {
        setOpenModuleDropdown(false)
      }
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target)) {
        setOpenModeDropdown(false)
      }
      if (structureDropdownRef.current && !structureDropdownRef.current.contains(event.target)) {
        setOpenStructureDropdown(false)
      }
      if (phaseDropdownRef.current && !phaseDropdownRef.current.contains(event.target)) {
        setOpenPhaseDropdown(false)
      }
      if (capacityDropdownRef.current && !capacityDropdownRef.current.contains(event.target)) {
        setOpenCapacityDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fetch solar systems quotes
  const fetchItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchErr } = await supabase
        .from("solar_systems_quote_list")
        .select("*")
        .order("id", { ascending: true })

      if (fetchErr) throw fetchErr
      setItems(data || [])
    } catch (err) {
      console.error("Error fetching solar systems quote list:", err)
      setError("Failed to fetch solar systems quote list: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  // Toast helpers
  const triggerSuccess = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 4000)
  }

  const triggerError = (msg) => {
    setError(msg)
    setTimeout(() => setError(null), 5000)
  }

  // Handle Form Inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  // Modal Triggers
  const openAddModal = () => {
    setFormData(initialFormState)
    setShowAddModal(true)
  }

  const openEditModal = (item) => {
    setSelectedItem(item)
    setFormData({
      system_key: item.system_key || "",
      system_id: item.system_id || "",
      module_type: item.module_type || "",
      structure: item.structure || "",
      mode: item.mode || "",
      capacity_kwp: item.capacity_kwp || "",
      phase: item.phase || "",
      rating_wp: item.rating_wp || "",
      panels: item.panels || "",
      actual_kwp: item.actual_kwp || "",
      original_rate: item.original_rate || "",
      gst_percent: item.gst_percent || "",
      total_incl_gst_ex_battery: item.total_incl_gst_ex_battery || "",
      applicable_subsidy: item.applicable_subsidy || "",
      central_subsidy_segment: item.central_subsidy_segment || "",
      state_subsidy_segment: item.state_subsidy_segment || "",
      net_ex_battery: item.net_ex_battery || "",
      spec_part_1: item.spec_part_1 || "",
      spec_line_d_structure: item.spec_line_d_structure || "",
      spec_part_2: item.spec_part_2 || ""
    })
    setShowEditModal(true)
  }

  const openViewModal = (item) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  const openDeleteConfirm = (item) => {
    setSelectedItem(item)
    setShowDeleteConfirm(true)
  }

  // Copy helper
  const handleCopy = (text, fieldName) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(""), 2000)
  }

  // Date format helper
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—"
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    } catch {
      return dateStr
    }
  }

  // Add Item
  const handleAddItem = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        system_key: formData.system_key?.trim() || null,
        system_id: formData.system_id?.trim() || null,
        module_type: formData.module_type?.trim() || null,
        structure: formData.structure?.trim() || null,
        mode: formData.mode?.trim() || null,
        capacity_kwp: formData.capacity_kwp?.trim() || null,
        phase: formData.phase?.trim() || null,
        rating_wp: formData.rating_wp?.trim() || null,
        panels: formData.panels?.trim() || null,
        actual_kwp: formData.actual_kwp?.trim() || null,
        original_rate: formData.original_rate?.trim() || null,
        gst_percent: formData.gst_percent?.trim() || null,
        total_incl_gst_ex_battery: formData.total_incl_gst_ex_battery?.trim() || null,
        applicable_subsidy: formData.applicable_subsidy?.trim() || null,
        central_subsidy_segment: formData.central_subsidy_segment?.trim() || null,
        state_subsidy_segment: formData.state_subsidy_segment?.trim() || null,
        net_ex_battery: formData.net_ex_battery?.trim() || null,
        spec_part_1: formData.spec_part_1?.trim() || null,
        spec_line_d_structure: formData.spec_line_d_structure?.trim() || null,
        spec_part_2: formData.spec_part_2?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: insertErr } = await supabase
        .from("solar_systems_quote_list")
        .insert([payload])

      if (insertErr) throw insertErr

      triggerSuccess("Solar system quote created successfully!")
      setShowAddModal(false)
      fetchItems()
    } catch (err) {
      console.error("Error adding solar system quote:", err)
      triggerError("Failed to add solar system quote: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update Item
  const handleEditItem = async (e) => {
    e.preventDefault()
    if (!selectedItem) return
    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        system_key: formData.system_key?.trim() || null,
        system_id: formData.system_id?.trim() || null,
        module_type: formData.module_type?.trim() || null,
        structure: formData.structure?.trim() || null,
        mode: formData.mode?.trim() || null,
        capacity_kwp: formData.capacity_kwp?.trim() || null,
        phase: formData.phase?.trim() || null,
        rating_wp: formData.rating_wp?.trim() || null,
        panels: formData.panels?.trim() || null,
        actual_kwp: formData.actual_kwp?.trim() || null,
        original_rate: formData.original_rate?.trim() || null,
        gst_percent: formData.gst_percent?.trim() || null,
        total_incl_gst_ex_battery: formData.total_incl_gst_ex_battery?.trim() || null,
        applicable_subsidy: formData.applicable_subsidy?.trim() || null,
        central_subsidy_segment: formData.central_subsidy_segment?.trim() || null,
        state_subsidy_segment: formData.state_subsidy_segment?.trim() || null,
        net_ex_battery: formData.net_ex_battery?.trim() || null,
        spec_part_1: formData.spec_part_1?.trim() || null,
        spec_line_d_structure: formData.spec_line_d_structure?.trim() || null,
        spec_part_2: formData.spec_part_2?.trim() || null,
        updated_at: new Date().toISOString()
      }

      const { error: updateErr } = await supabase
        .from("solar_systems_quote_list")
        .update(payload)
        .eq("id", selectedItem.id)

      if (updateErr) throw updateErr

      triggerSuccess("Solar system quote updated successfully!")
      setShowEditModal(false)
      fetchItems()
    } catch (err) {
      console.error("Error updating solar system quote:", err)
      triggerError("Failed to update solar system quote: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Item
  const handleDeleteItem = async () => {
    if (!selectedItem) return
    setIsSubmitting(true)
    setError(null)

    try {
      const { error: deleteErr } = await supabase
        .from("solar_systems_quote_list")
        .delete()
        .eq("id", selectedItem.id)

      if (deleteErr) throw deleteErr

      triggerSuccess("Solar system quote deleted successfully!")
      setShowDeleteConfirm(false)
      fetchItems()
    } catch (err) {
      console.error("Error deleting solar system quote:", err)
      triggerError("Failed to delete solar system quote: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Unique options for filters
  const uniqueModuleTypes = useMemo(() => {
    const list = items.map((i) => i.module_type).filter(Boolean)
    return Array.from(new Set(list)).sort()
  }, [items])

  const uniqueModes = useMemo(() => {
    const list = items.map((i) => i.mode).filter(Boolean)
    return Array.from(new Set(list)).sort()
  }, [items])

  const uniqueStructures = useMemo(() => {
    const list = items.map((i) => i.structure).filter(Boolean)
    return Array.from(new Set(list)).sort()
  }, [items])

  const uniquePhases = useMemo(() => {
    const list = items.map((i) => i.phase).filter(Boolean)
    return Array.from(new Set(list)).sort()
  }, [items])

  const uniqueCapacities = useMemo(() => {
    const list = items.map((i) => i.capacity_kwp).filter(Boolean)
    return Array.from(new Set(list)).sort()
  }, [items])

  // Filtered dropdown options with internal search
  const filteredModuleOptions = useMemo(() => {
    if (!searchInModuleDropdown.trim()) return uniqueModuleTypes
    return uniqueModuleTypes.filter((val) =>
      val.toLowerCase().includes(searchInModuleDropdown.toLowerCase().trim())
    )
  }, [uniqueModuleTypes, searchInModuleDropdown])

  const filteredModeOptions = useMemo(() => {
    if (!searchInModeDropdown.trim()) return uniqueModes
    return uniqueModes.filter((val) =>
      val.toLowerCase().includes(searchInModeDropdown.toLowerCase().trim())
    )
  }, [uniqueModes, searchInModeDropdown])

  const filteredStructureOptions = useMemo(() => {
    if (!searchInStructureDropdown.trim()) return uniqueStructures
    return uniqueStructures.filter((val) =>
      val.toLowerCase().includes(searchInStructureDropdown.toLowerCase().trim())
    )
  }, [uniqueStructures, searchInStructureDropdown])

  const filteredPhaseOptions = useMemo(() => {
    if (!searchInPhaseDropdown.trim()) return uniquePhases
    return uniquePhases.filter((val) =>
      val.toLowerCase().includes(searchInPhaseDropdown.toLowerCase().trim())
    )
  }, [uniquePhases, searchInPhaseDropdown])

  const filteredCapacityOptions = useMemo(() => {
    if (!searchInCapacityDropdown.trim()) return uniqueCapacities
    return uniqueCapacities.filter((val) =>
      val.toLowerCase().includes(searchInCapacityDropdown.toLowerCase().trim())
    )
  }, [uniqueCapacities, searchInCapacityDropdown])

  // Filtered Items computation
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Global search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim()
        const matchGlobal =
          (item.id && String(item.id).toLowerCase().includes(q)) ||
          (item.system_key && item.system_key.toLowerCase().includes(q)) ||
          (item.system_id && item.system_id.toLowerCase().includes(q)) ||
          (item.module_type && item.module_type.toLowerCase().includes(q)) ||
          (item.structure && item.structure.toLowerCase().includes(q)) ||
          (item.mode && item.mode.toLowerCase().includes(q)) ||
          (item.capacity_kwp && item.capacity_kwp.toLowerCase().includes(q)) ||
          (item.phase && item.phase.toLowerCase().includes(q)) ||
          (item.rating_wp && item.rating_wp.toLowerCase().includes(q)) ||
          (item.panels && item.panels.toLowerCase().includes(q)) ||
          (item.actual_kwp && item.actual_kwp.toLowerCase().includes(q)) ||
          (item.original_rate && item.original_rate.toLowerCase().includes(q)) ||
          (item.gst_percent && item.gst_percent.toLowerCase().includes(q)) ||
          (item.total_incl_gst_ex_battery && item.total_incl_gst_ex_battery.toLowerCase().includes(q)) ||
          (item.applicable_subsidy && item.applicable_subsidy.toLowerCase().includes(q)) ||
          (item.central_subsidy_segment && item.central_subsidy_segment.toLowerCase().includes(q)) ||
          (item.state_subsidy_segment && item.state_subsidy_segment.toLowerCase().includes(q)) ||
          (item.net_ex_battery && item.net_ex_battery.toLowerCase().includes(q)) ||
          (item.spec_part_1 && item.spec_part_1.toLowerCase().includes(q)) ||
          (item.spec_line_d_structure && item.spec_line_d_structure.toLowerCase().includes(q)) ||
          (item.spec_part_2 && item.spec_part_2.toLowerCase().includes(q)) ||
          (item.created_at && String(item.created_at).toLowerCase().includes(q)) ||
          (item.updated_at && String(item.updated_at).toLowerCase().includes(q))

        if (!matchGlobal) return false
      }

      // 2. Module Type
      if (selectedModuleType !== "ALL") {
        if (item.module_type !== selectedModuleType) return false
      }

      // 3. Mode
      if (selectedMode !== "ALL") {
        if (item.mode !== selectedMode) return false
      }

      // 4. Structure
      if (selectedStructure !== "ALL") {
        if (item.structure !== selectedStructure) return false
      }

      // 5. Phase
      if (selectedPhase !== "ALL") {
        if (item.phase !== selectedPhase) return false
      }

      // 6. Capacity
      if (selectedCapacity !== "ALL") {
        if (item.capacity_kwp !== selectedCapacity) return false
      }

      return true
    })
  }, [
    items,
    searchTerm,
    selectedModuleType,
    selectedMode,
    selectedStructure,
    selectedPhase,
    selectedCapacity
  ])



  const resetAllFilters = () => {
    setSearchTerm("")
    setSelectedModuleType("ALL")
    setSelectedMode("ALL")
    setSelectedStructure("ALL")
    setSelectedPhase("ALL")
    setSelectedCapacity("ALL")
    setSearchInModuleDropdown("")
    setSearchInModeDropdown("")
    setSearchInStructureDropdown("")
    setSearchInPhaseDropdown("")
    setSearchInCapacityDropdown("")
  }

  const isFiltered =
    searchTerm ||
    selectedModuleType !== "ALL" ||
    selectedMode !== "ALL" ||
    selectedStructure !== "ALL" ||
    selectedPhase !== "ALL" ||
    selectedCapacity !== "ALL"

  // Export to CSV helper
  const exportToCSV = () => {
    if (filteredItems.length === 0) {
      triggerError("No data available to export.")
      return
    }

    const headers = [
      "ID",
      "System Key",
      "System ID",
      "Module Type",
      "Structure",
      "Mode",
      "Capacity (kWp)",
      "Phase",
      "Rating (Wp)",
      "Panels",
      "Actual kWp",
      "Original Rate",
      "GST %",
      "Total Incl GST Ex Battery",
      "Applicable Subsidy",
      "Central Subsidy Segment",
      "State Subsidy Segment",
      "Net Ex Battery",
      "Spec Part 1",
      "Spec Line D Structure",
      "Spec Part 2",
      "Created At",
      "Updated At"
    ]

    const rows = filteredItems.map((item) => [
      item.id,
      `"${(item.system_key || "").replace(/"/g, '""')}"`,
      `"${(item.system_id || "").replace(/"/g, '""')}"`,
      `"${(item.module_type || "").replace(/"/g, '""')}"`,
      `"${(item.structure || "").replace(/"/g, '""')}"`,
      `"${(item.mode || "").replace(/"/g, '""')}"`,
      `"${(item.capacity_kwp || "").replace(/"/g, '""')}"`,
      `"${(item.phase || "").replace(/"/g, '""')}"`,
      `"${(item.rating_wp || "").replace(/"/g, '""')}"`,
      `"${(item.panels || "").replace(/"/g, '""')}"`,
      `"${(item.actual_kwp || "").replace(/"/g, '""')}"`,
      `"${(item.original_rate || "").replace(/"/g, '""')}"`,
      `"${(item.gst_percent || "").replace(/"/g, '""')}"`,
      `"${(item.total_incl_gst_ex_battery || "").replace(/"/g, '""')}"`,
      `"${(item.applicable_subsidy || "").replace(/"/g, '""')}"`,
      `"${(item.central_subsidy_segment || "").replace(/"/g, '""')}"`,
      `"${(item.state_subsidy_segment || "").replace(/"/g, '""')}"`,
      `"${(item.net_ex_battery || "").replace(/"/g, '""')}"`,
      `"${(item.spec_part_1 || "").replace(/"/g, '""')}"`,
      `"${(item.spec_line_d_structure || "").replace(/"/g, '""')}"`,
      `"${(item.spec_part_2 || "").replace(/"/g, '""')}"`,
      `"${item.created_at || ""}"`,
      `"${item.updated_at || ""}"`
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `solar_systems_quote_list_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    triggerSuccess("CSV exported successfully!")
  }

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    return {
      total: items.length,
      capacities: uniqueCapacities.length,
      modules: uniqueModuleTypes.length,
      modes: uniqueModes.length
    }
  }, [items, uniqueCapacities, uniqueModuleTypes, uniqueModes])

  return (
    <AdminLayout>
      <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Toast Alerts */}
        {success && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-emerald-800 shadow-xl border border-emerald-200 animate-in fade-in duration-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-semibold">{success}</span>
          </div>
        )}

        {error && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-rose-800 shadow-xl border border-rose-200 animate-in fade-in duration-200">
            <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-purple-100 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-tr from-amber-500 to-purple-600 rounded-xl text-white shadow-md">
                <Sun className="h-6 w-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 via-indigo-700 to-amber-600 bg-clip-text text-transparent">
                Solar Systems Quote List
              </h1>
            </div>
            <p className="text-xs md:text-sm text-gray-500">
              Manage system configurations, module ratings, net pricing, subsidies, and technical quotation specs.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={fetchItems}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 py-2 px-3.5 text-xs font-semibold text-gray-700 shadow-sm transition active:scale-95 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-gray-500 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 py-2 px-3.5 text-xs font-semibold text-purple-700 shadow-sm transition active:scale-95"
              title="Export filtered records to CSV"
            >
              <Download className="h-3.5 w-3.5 text-purple-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={openAddModal}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 px-4 text-xs md:text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-purple-700 hover:to-indigo-700 transition transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add System Quote</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-purple-50 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 rounded-lg text-purple-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Total Systems</p>
              <p className="text-lg font-bold text-gray-800">{summaryMetrics.total}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-purple-50 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Capacities</p>
              <p className="text-lg font-bold text-gray-800">{summaryMetrics.capacities}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-purple-50 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Module Types</p>
              <p className="text-lg font-bold text-gray-800">{summaryMetrics.modules}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-purple-50 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Modes</p>
              <p className="text-lg font-bold text-gray-800">{summaryMetrics.modes}</p>
            </div>
          </div>
        </div>

        {/* ================= FILTER SECTION ================= */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-900 font-semibold text-sm">
              <Filter className="h-4 w-4 text-purple-600" />
              <span>Search & Dynamic Filters</span>
            </div>
            {isFiltered && (
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* 1. Global Search */}
            <div className="relative xl:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Global Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search key, ID, specs, module..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-xl pl-9 pr-7 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* 2. Module Type Filter */}
            <div className="relative" ref={moduleDropdownRef}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Module Type
              </label>
              <button
                type="button"
                onClick={() => {
                  setOpenModuleDropdown(!openModuleDropdown)
                  setOpenModeDropdown(false)
                  setOpenStructureDropdown(false)
                  setOpenPhaseDropdown(false)
                  setOpenCapacityDropdown(false)
                }}
                className="w-full text-left bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs flex justify-between items-center focus:ring-2 focus:ring-purple-500 transition"
              >
                <span className="truncate font-medium text-gray-800">
                  {selectedModuleType === "ALL" ? "All Modules" : selectedModuleType}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 ml-1 flex-shrink-0" />
              </button>

              {openModuleDropdown && (
                <div className="absolute left-0 right-0 z-30 mt-1 bg-white border border-purple-100 rounded-xl shadow-xl p-2 space-y-2 min-w-[180px]">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search module..."
                      value={searchInModuleDropdown}
                      onChange={(e) => setSearchInModuleDropdown(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg pl-7 pr-2 py-1.5 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedModuleType("ALL")
                        setOpenModuleDropdown(false)
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition ${
                        selectedModuleType === "ALL"
                          ? "bg-purple-100 text-purple-800"
                          : "hover:bg-purple-50 text-gray-700"
                      }`}
                    >
                      All Modules
                    </button>
                    {filteredModuleOptions.length === 0 ? (
                      <div className="p-2 text-center text-gray-400">No match</div>
                    ) : (
                      filteredModuleOptions.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setSelectedModuleType(type)
                            setOpenModuleDropdown(false)
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                            selectedModuleType === type
                              ? "bg-purple-100 text-purple-800 font-semibold"
                              : "hover:bg-purple-50 text-gray-700"
                          }`}
                        >
                          {type}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Mode Filter */}
            <div className="relative" ref={modeDropdownRef}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Mode
              </label>
              <button
                type="button"
                onClick={() => {
                  setOpenModeDropdown(!openModeDropdown)
                  setOpenModuleDropdown(false)
                  setOpenStructureDropdown(false)
                  setOpenPhaseDropdown(false)
                  setOpenCapacityDropdown(false)
                }}
                className="w-full text-left bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs flex justify-between items-center focus:ring-2 focus:ring-purple-500 transition"
              >
                <span className="truncate font-medium text-gray-800">
                  {selectedMode === "ALL" ? "All Modes" : selectedMode}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 ml-1 flex-shrink-0" />
              </button>

              {openModeDropdown && (
                <div className="absolute left-0 right-0 z-30 mt-1 bg-white border border-purple-100 rounded-xl shadow-xl p-2 space-y-2 min-w-[160px]">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search mode..."
                      value={searchInModeDropdown}
                      onChange={(e) => setSearchInModeDropdown(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg pl-7 pr-2 py-1.5 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMode("ALL")
                        setOpenModeDropdown(false)
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition ${
                        selectedMode === "ALL"
                          ? "bg-purple-100 text-purple-800"
                          : "hover:bg-purple-50 text-gray-700"
                      }`}
                    >
                      All Modes
                    </button>
                    {filteredModeOptions.length === 0 ? (
                      <div className="p-2 text-center text-gray-400">No match</div>
                    ) : (
                      filteredModeOptions.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setSelectedMode(mode)
                            setOpenModeDropdown(false)
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                            selectedMode === mode
                              ? "bg-purple-100 text-purple-800 font-semibold"
                              : "hover:bg-purple-50 text-gray-700"
                          }`}
                        >
                          {mode}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Structure Filter */}
            <div className="relative" ref={structureDropdownRef}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Structure
              </label>
              <button
                type="button"
                onClick={() => {
                  setOpenStructureDropdown(!openStructureDropdown)
                  setOpenModuleDropdown(false)
                  setOpenModeDropdown(false)
                  setOpenPhaseDropdown(false)
                  setOpenCapacityDropdown(false)
                }}
                className="w-full text-left bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs flex justify-between items-center focus:ring-2 focus:ring-purple-500 transition"
              >
                <span className="truncate font-medium text-gray-800">
                  {selectedStructure === "ALL" ? "All Structures" : selectedStructure}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 ml-1 flex-shrink-0" />
              </button>

              {openStructureDropdown && (
                <div className="absolute left-0 right-0 z-30 mt-1 bg-white border border-purple-100 rounded-xl shadow-xl p-2 space-y-2 min-w-[180px]">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search structure..."
                      value={searchInStructureDropdown}
                      onChange={(e) => setSearchInStructureDropdown(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg pl-7 pr-2 py-1.5 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStructure("ALL")
                        setOpenStructureDropdown(false)
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition ${
                        selectedStructure === "ALL"
                          ? "bg-purple-100 text-purple-800"
                          : "hover:bg-purple-50 text-gray-700"
                      }`}
                    >
                      All Structures
                    </button>
                    {filteredStructureOptions.length === 0 ? (
                      <div className="p-2 text-center text-gray-400">No match</div>
                    ) : (
                      filteredStructureOptions.map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            setSelectedStructure(st)
                            setOpenStructureDropdown(false)
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                            selectedStructure === st
                              ? "bg-purple-100 text-purple-800 font-semibold"
                              : "hover:bg-purple-50 text-gray-700"
                          }`}
                        >
                          {st}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Phase Filter */}
            <div className="relative" ref={phaseDropdownRef}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Phase
              </label>
              <button
                type="button"
                onClick={() => {
                  setOpenPhaseDropdown(!openPhaseDropdown)
                  setOpenModuleDropdown(false)
                  setOpenModeDropdown(false)
                  setOpenStructureDropdown(false)
                  setOpenCapacityDropdown(false)
                }}
                className="w-full text-left bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs flex justify-between items-center focus:ring-2 focus:ring-purple-500 transition"
              >
                <span className="truncate font-medium text-gray-800">
                  {selectedPhase === "ALL" ? "All Phases" : selectedPhase}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 ml-1 flex-shrink-0" />
              </button>

              {openPhaseDropdown && (
                <div className="absolute left-0 right-0 z-30 mt-1 bg-white border border-purple-100 rounded-xl shadow-xl p-2 space-y-2 min-w-[150px]">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search phase..."
                      value={searchInPhaseDropdown}
                      onChange={(e) => setSearchInPhaseDropdown(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg pl-7 pr-2 py-1.5 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPhase("ALL")
                        setOpenPhaseDropdown(false)
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition ${
                        selectedPhase === "ALL"
                          ? "bg-purple-100 text-purple-800"
                          : "hover:bg-purple-50 text-gray-700"
                      }`}
                    >
                      All Phases
                    </button>
                    {filteredPhaseOptions.length === 0 ? (
                      <div className="p-2 text-center text-gray-400">No match</div>
                    ) : (
                      filteredPhaseOptions.map((ph) => (
                        <button
                          key={ph}
                          type="button"
                          onClick={() => {
                            setSelectedPhase(ph)
                            setOpenPhaseDropdown(false)
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                            selectedPhase === ph
                              ? "bg-purple-100 text-purple-800 font-semibold"
                              : "hover:bg-purple-50 text-gray-700"
                          }`}
                        >
                          {ph}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= TABLE CONTAINER ================= */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 via-indigo-50 to-amber-50/40 flex justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-800 text-base">
                Solar System Quotes
              </h2>
              <span className="text-xs bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full">
                Showing all {filteredItems.length} of {items.length} Records
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
              <p className="mt-3 text-purple-600 text-sm font-medium">Loading solar systems quotes...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 text-gray-500 text-sm">
              <div className="p-3 bg-purple-50 inline-block rounded-full mb-2">
                <Sun className="h-8 w-8 text-purple-400" />
              </div>
              <p className="font-semibold text-base text-gray-700">No solar system quotes found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                {items.length === 0
                  ? "Your table is currently empty. Click 'Add System Quote' to create your first entry!"
                  : "No items match your active filters or search query. Try clearing filters."}
              </p>
              {items.length > 0 && isFiltered && (
                <button
                  onClick={resetAllFilters}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-semibold hover:bg-purple-100 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden xl:block overflow-x-auto max-h-[65vh]">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="bg-purple-800 text-white text-[11px] font-semibold uppercase tracking-wider">
                    <tr>
                      {/* Fixed Top-Left Corner: Actions Header */}
                      <th className="px-3.5 py-3 text-center sticky top-0 left-0 z-30 bg-purple-900 text-white w-28 border-b-2 border-purple-950 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.25)]">
                        Actions
                      </th>
                      <th className="px-3 py-3 text-center sticky top-0 z-20 bg-purple-800 text-white w-14 border-b-2 border-purple-900">ID</th>
                      <th className="px-3 py-3 text-left sticky top-0 z-20 bg-purple-800 text-white min-w-[130px] border-b-2 border-purple-900">System Key</th>
                      <th className="px-3 py-3 text-left sticky top-0 z-20 bg-purple-800 text-white min-w-[110px] border-b-2 border-purple-900">System ID</th>
                      <th className="px-3 py-3 text-left sticky top-0 z-20 bg-purple-800 text-white min-w-[120px] border-b-2 border-purple-900">Module Type</th>
                      <th className="px-3 py-3 text-left sticky top-0 z-20 bg-purple-800 text-white min-w-[120px] border-b-2 border-purple-900">Structure</th>
                      <th className="px-3 py-3 text-center sticky top-0 z-20 bg-purple-800 text-white min-w-[90px] border-b-2 border-purple-900">Mode</th>
                      <th className="px-3 py-3 text-center sticky top-0 z-20 bg-purple-800 text-white min-w-[100px] border-b-2 border-purple-900">Cap (kWp)</th>
                      <th className="px-3 py-3 text-center sticky top-0 z-20 bg-purple-800 text-white min-w-[80px] border-b-2 border-purple-900">Phase</th>
                      <th className="px-3 py-3 text-center sticky top-0 z-20 bg-purple-800 text-white min-w-[90px] border-b-2 border-purple-900">Rating (Wp)</th>
                      <th className="px-3 py-3 text-center sticky top-0 z-20 bg-purple-800 text-white min-w-[70px] border-b-2 border-purple-900">Panels</th>
                      <th className="px-3 py-3 text-center sticky top-0 z-20 bg-purple-800 text-white min-w-[90px] border-b-2 border-purple-900">Actual kWp</th>
                      <th className="px-3 py-3 text-right sticky top-0 z-20 bg-purple-800 text-white min-w-[120px] border-b-2 border-purple-900">Original Rate</th>
                      <th className="px-3 py-3 text-center sticky top-0 z-20 bg-purple-800 text-white min-w-[80px] border-b-2 border-purple-900">GST %</th>
                      <th className="px-3 py-3 text-right sticky top-0 z-20 bg-purple-800 text-white min-w-[130px] border-b-2 border-purple-900">Total (Incl GST)</th>
                      <th className="px-3 py-3 text-right sticky top-0 z-20 bg-purple-800 text-white min-w-[110px] border-b-2 border-purple-900">Subsidy</th>
                      <th className="px-3 py-3 text-right sticky top-0 z-20 bg-purple-800 text-white min-w-[110px] border-b-2 border-purple-900">Central Sub.</th>
                      <th className="px-3 py-3 text-right sticky top-0 z-20 bg-purple-800 text-white min-w-[110px] border-b-2 border-purple-900">State Sub.</th>
                      <th className="px-3 py-3 text-right sticky top-0 z-20 bg-purple-800 text-white min-w-[120px] border-b-2 border-purple-900">Net Ex Battery</th>
                      <th className="px-3 py-3 text-left sticky top-0 z-20 bg-purple-800 text-white min-w-[220px] border-b-2 border-purple-900">Spec Part 1</th>
                      <th className="px-3 py-3 text-left sticky top-0 z-20 bg-purple-800 text-white min-w-[200px] border-b-2 border-purple-900">Spec Line D Structure</th>
                      <th className="px-3 py-3 text-left sticky top-0 z-20 bg-purple-800 text-white min-w-[220px] border-b-2 border-purple-900">Spec Part 2</th>
                      <th className="px-3 py-3 text-center sticky top-0 z-20 bg-purple-800 text-white min-w-[130px] border-b-2 border-purple-900">Created At</th>
                      <th className="px-3 py-3 text-center sticky top-0 z-20 bg-purple-800 text-white min-w-[130px] border-b-2 border-purple-900">Updated At</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-800">
                    {filteredItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-purple-50/50 group transition-colors duration-150">
                        {/* Sticky Action Column */}
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap sticky left-0 z-10 bg-white group-hover:bg-purple-50 transition-colors shadow-[2px_0_5px_-1px_rgba(0,0,0,0.12)] border-b border-gray-100">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openViewModal(item)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                              title="View full details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition"
                              title="Edit system quote"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(item)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                              title="Delete record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* ID */}
                        <td className="px-3 py-2.5 text-center font-mono text-gray-400 border-b border-gray-100">
                          {item.id}
                        </td>

                        {/* System Key */}
                        <td className="px-3 py-2.5 font-semibold text-purple-900 whitespace-nowrap border-b border-gray-100">
                          <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-100">
                            {item.system_key || "—"}
                          </span>
                        </td>

                        {/* System ID */}
                        <td className="px-3 py-2.5 font-medium text-gray-700 whitespace-nowrap border-b border-gray-100">
                          {item.system_id || "—"}
                        </td>

                        {/* Module Type */}
                        <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap border-b border-gray-100">
                          {item.module_type || "—"}
                        </td>

                        {/* Structure */}
                        <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap border-b border-gray-100">
                          {item.structure || "—"}
                        </td>

                        {/* Mode Tag */}
                        <td className="px-3 py-2.5 text-center whitespace-nowrap border-b border-gray-100">
                          {item.mode ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                item.mode.toLowerCase().includes("on-grid") || item.mode.toLowerCase().includes("ongrid")
                                  ? "bg-emerald-100 text-emerald-800"
                                  : item.mode.toLowerCase().includes("off-grid") || item.mode.toLowerCase().includes("offgrid")
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {item.mode}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Capacity kWp */}
                        <td className="px-3 py-2.5 text-center font-bold text-gray-900 whitespace-nowrap border-b border-gray-100">
                          {item.capacity_kwp || "—"}
                        </td>

                        {/* Phase */}
                        <td className="px-3 py-2.5 text-center text-gray-600 whitespace-nowrap border-b border-gray-100">
                          {item.phase || "—"}
                        </td>

                        {/* Rating Wp */}
                        <td className="px-3 py-2.5 text-center text-gray-600 whitespace-nowrap border-b border-gray-100">
                          {item.rating_wp || "—"}
                        </td>

                        {/* Panels */}
                        <td className="px-3 py-2.5 text-center font-medium text-gray-800 whitespace-nowrap border-b border-gray-100">
                          {item.panels || "—"}
                        </td>

                        {/* Actual kWp */}
                        <td className="px-3 py-2.5 text-center text-gray-600 whitespace-nowrap border-b border-gray-100">
                          {item.actual_kwp || "—"}
                        </td>

                        {/* Original Rate */}
                        <td className="px-3 py-2.5 text-right font-medium text-gray-800 whitespace-nowrap border-b border-gray-100">
                          {item.original_rate ? `₹${item.original_rate}` : "—"}
                        </td>

                        {/* GST % */}
                        <td className="px-3 py-2.5 text-center text-gray-600 whitespace-nowrap border-b border-gray-100">
                          {item.gst_percent ? `${item.gst_percent}%` : "—"}
                        </td>

                        {/* Total Incl GST */}
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900 whitespace-nowrap bg-purple-50/20 border-b border-gray-100">
                          {item.total_incl_gst_ex_battery ? `₹${item.total_incl_gst_ex_battery}` : "—"}
                        </td>

                        {/* Applicable Subsidy */}
                        <td className="px-3 py-2.5 text-right font-medium text-emerald-700 whitespace-nowrap border-b border-gray-100">
                          {item.applicable_subsidy ? `₹${item.applicable_subsidy}` : "—"}
                        </td>

                        {/* Central Subsidy Segment */}
                        <td className="px-3 py-2.5 text-right font-medium text-emerald-700 whitespace-nowrap border-b border-gray-100">
                          {item.central_subsidy_segment ? `₹${item.central_subsidy_segment}` : "—"}
                        </td>

                        {/* State Subsidy Segment */}
                        <td className="px-3 py-2.5 text-right font-medium text-emerald-700 whitespace-nowrap border-b border-gray-100">
                          {item.state_subsidy_segment ? `₹${item.state_subsidy_segment}` : "—"}
                        </td>

                        {/* Net Ex Battery */}
                        <td className="px-3 py-2.5 text-right font-bold text-purple-900 whitespace-nowrap bg-purple-50/30 border-b border-gray-100">
                          {item.net_ex_battery ? `₹${item.net_ex_battery}` : "—"}
                        </td>

                        {/* Spec Part 1 */}
                        <td className="px-3 py-2.5 text-gray-700 max-w-[220px] border-b border-gray-100 group/spec1 relative">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate" title={item.spec_part_1 || ""}>
                              {item.spec_part_1 || "—"}
                            </span>
                            {item.spec_part_1 && (
                              <button
                                type="button"
                                onClick={() => handleCopy(item.spec_part_1, `spec1-${item.id}`)}
                                className="opacity-0 group-hover/spec1:opacity-100 p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded transition flex-shrink-0"
                                title="Copy Spec Part 1"
                              >
                                {copiedField === `spec1-${item.id}` ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Spec Line D Structure */}
                        <td className="px-3 py-2.5 text-gray-700 max-w-[200px] border-b border-gray-100 group/specstruct relative">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate" title={item.spec_line_d_structure || ""}>
                              {item.spec_line_d_structure || "—"}
                            </span>
                            {item.spec_line_d_structure && (
                              <button
                                type="button"
                                onClick={() => handleCopy(item.spec_line_d_structure, `spec_struct-${item.id}`)}
                                className="opacity-0 group-hover/specstruct:opacity-100 p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded transition flex-shrink-0"
                                title="Copy Spec Line D Structure"
                              >
                                {copiedField === `spec_struct-${item.id}` ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Spec Part 2 */}
                        <td className="px-3 py-2.5 text-gray-700 max-w-[220px] border-b border-gray-100 group/spec2 relative">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate" title={item.spec_part_2 || ""}>
                              {item.spec_part_2 || "—"}
                            </span>
                            {item.spec_part_2 && (
                              <button
                                type="button"
                                onClick={() => handleCopy(item.spec_part_2, `spec2-${item.id}`)}
                                className="opacity-0 group-hover/spec2:opacity-100 p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded transition flex-shrink-0"
                                title="Copy Spec Part 2"
                              >
                                {copiedField === `spec2-${item.id}` ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Created At */}
                        <td className="px-3 py-2.5 text-center text-[11px] text-gray-500 whitespace-nowrap border-b border-gray-100 font-mono">
                          {formatDateTime(item.created_at)}
                        </td>

                        {/* Updated At */}
                        <td className="px-3 py-2.5 text-center text-[11px] text-gray-500 whitespace-nowrap border-b border-gray-100 font-mono">
                          {formatDateTime(item.updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE & TABLET RESPONSIVE CARDS VIEW */}
              <div className="xl:hidden p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-purple-100 rounded-2xl p-4 bg-white shadow-sm hover:border-purple-300 transition space-y-3"
                  >
                    <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                            ID #{item.id}
                          </span>
                          <span className="text-xs font-bold text-purple-900">
                            {item.system_key || "No Key"}
                          </span>
                          {item.mode && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                              {item.mode}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-800 text-sm mt-1">
                          {item.capacity_kwp ? `${item.capacity_kwp} System` : "Solar System"} {item.phase ? `(${item.phase})` : ""}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openViewModal(item)}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(item)}
                          className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 block">System ID:</span>
                        <span className="font-medium text-gray-800">{item.system_id || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Module Type:</span>
                        <span className="font-medium text-gray-800">{item.module_type || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Structure:</span>
                        <span className="font-medium text-gray-800">{item.structure || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Rating / Panels:</span>
                        <span className="font-medium text-gray-800">
                          {item.rating_wp || "—"} / {item.panels ? `${item.panels} panels` : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Actual kWp:</span>
                        <span className="font-medium text-gray-800">{item.actual_kwp || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Phase:</span>
                        <span className="font-medium text-gray-800">{item.phase || "—"}</span>
                      </div>
                    </div>

                    {/* Financial summary card */}
                    <div className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 p-3 rounded-xl border border-purple-100 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-gray-500 block text-[10px]">Original Rate:</span>
                          <span className="font-medium text-gray-800">
                            {item.original_rate ? `₹${item.original_rate}` : "—"}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-gray-500 block text-[10px]">GST %:</span>
                          <span className="font-medium text-gray-800">
                            {item.gst_percent ? `${item.gst_percent}%` : "—"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-500 block text-[10px]">Total (Incl GST):</span>
                          <span className="font-semibold text-gray-900">
                            {item.total_incl_gst_ex_battery ? `₹${item.total_incl_gst_ex_battery}` : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-purple-100/60 text-xs">
                        <div>
                          <span className="text-gray-500 block text-[10px]">Subsidy (Central/State):</span>
                          <span className="font-semibold text-emerald-700">
                            {item.central_subsidy_segment || item.state_subsidy_segment
                              ? `C: ₹${item.central_subsidy_segment || "0"} | S: ₹${item.state_subsidy_segment || "0"}`
                              : item.applicable_subsidy ? `₹${item.applicable_subsidy}` : "—"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-500 block text-[10px]">Net Ex Battery:</span>
                          <span className="font-bold text-purple-900">
                            {item.net_ex_battery ? `₹${item.net_ex_battery}` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Specs & Timestamps for Mobile */}
                    <div className="space-y-1.5 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      {item.spec_part_1 && (
                        <div>
                          <span className="text-[10px] text-gray-400 font-semibold block">Spec Part 1:</span>
                          <p className="text-gray-700 line-clamp-2">{item.spec_part_1}</p>
                        </div>
                      )}
                      {item.spec_line_d_structure && (
                        <div>
                          <span className="text-[10px] text-gray-400 font-semibold block">Spec Line D Structure:</span>
                          <p className="text-gray-700 line-clamp-2">{item.spec_line_d_structure}</p>
                        </div>
                      )}
                      {item.spec_part_2 && (
                        <div>
                          <span className="text-[10px] text-gray-400 font-semibold block">Spec Part 2:</span>
                          <p className="text-gray-700 line-clamp-2">{item.spec_part_2}</p>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1 border-t border-gray-200/60 font-mono">
                        <span>Created: {formatDateTime(item.created_at)}</span>
                        <span>Updated: {formatDateTime(item.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </>
          )}
        </div>

        {/* ================= MODAL: ADD SOLAR SYSTEM QUOTE ================= */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-purple-100 overflow-hidden my-auto max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Add New Solar System Quote</h3>
                    <p className="text-xs text-purple-100">Fill in technical configurations and pricing specs</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleAddItem} className="p-6 overflow-y-auto space-y-6">
                {/* Group 1: General & Identifiers */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider border-b border-purple-100 pb-1 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-purple-600" />
                    1. System Identifiers
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">System Key *</label>
                      <input
                        type="text"
                        name="system_key"
                        required
                        placeholder="e.g. MONO-3KWP-1P"
                        value={formData.system_key}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">System ID</label>
                      <input
                        type="text"
                        name="system_id"
                        placeholder="e.g. SYS-2024-001"
                        value={formData.system_id}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Mode</label>
                      <input
                        type="text"
                        name="mode"
                        placeholder="e.g. On-Grid, Off-Grid, Hybrid"
                        value={formData.mode}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Phase</label>
                      <input
                        type="text"
                        name="phase"
                        placeholder="e.g. 1 Phase, 3 Phase"
                        value={formData.phase}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Group 2: Technical Specifications */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider border-b border-purple-100 pb-1 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-purple-600" />
                    2. Technical & Hardware Parameters
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Module Type</label>
                      <input
                        type="text"
                        name="module_type"
                        placeholder="e.g. Mono PERC, Bifacial, TopCon"
                        value={formData.module_type}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Structure</label>
                      <input
                        type="text"
                        name="structure"
                        placeholder="e.g. Elevated, Tin Shed, RCC, Ground"
                        value={formData.structure}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Capacity (kWp)</label>
                      <input
                        type="text"
                        name="capacity_kwp"
                        placeholder="e.g. 3 kWp"
                        value={formData.capacity_kwp}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Rating (Wp)</label>
                      <input
                        type="text"
                        name="rating_wp"
                        placeholder="e.g. 540 Wp, 550 Wp"
                        value={formData.rating_wp}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Panels Count</label>
                      <input
                        type="text"
                        name="panels"
                        placeholder="e.g. 6, 10, 18"
                        value={formData.panels}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Actual kWp</label>
                      <input
                        type="text"
                        name="actual_kwp"
                        placeholder="e.g. 3.24 kWp"
                        value={formData.actual_kwp}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Group 3: Financials & Pricing */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider border-b border-purple-100 pb-1 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-purple-600" />
                    3. Pricing & Subsidies
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Original Rate</label>
                      <input
                        type="text"
                        name="original_rate"
                        placeholder="e.g. 1,60,000"
                        value={formData.original_rate}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">GST %</label>
                      <input
                        type="text"
                        name="gst_percent"
                        placeholder="e.g. 12"
                        value={formData.gst_percent}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Total (Incl GST Ex Battery)</label>
                      <input
                        type="text"
                        name="total_incl_gst_ex_battery"
                        placeholder="e.g. 1,85,000"
                        value={formData.total_incl_gst_ex_battery}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Net Ex Battery</label>
                      <input
                        type="text"
                        name="net_ex_battery"
                        placeholder="e.g. 1,07,000"
                        value={formData.net_ex_battery}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Applicable Subsidy (Total)</label>
                      <input
                        type="text"
                        name="applicable_subsidy"
                        placeholder="e.g. 78,000"
                        value={formData.applicable_subsidy}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Central Subsidy Segment</label>
                      <input
                        type="text"
                        name="central_subsidy_segment"
                        placeholder="e.g. 78,000"
                        value={formData.central_subsidy_segment}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-medium text-gray-700 mb-1">State Subsidy Segment</label>
                      <input
                        type="text"
                        name="state_subsidy_segment"
                        placeholder="e.g. 0"
                        value={formData.state_subsidy_segment}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Group 4: Specification Texts */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider border-b border-purple-100 pb-1 flex items-center gap-1.5">
                    <Settings className="h-3.5 w-3.5 text-purple-600" />
                    4. Detailed Quotation Specifications
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Spec Part 1</label>
                      <textarea
                        name="spec_part_1"
                        rows={2}
                        placeholder="Primary specification details, modules, inverter parameters..."
                        value={formData.spec_part_1}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Spec Line D Structure</label>
                      <textarea
                        name="spec_line_d_structure"
                        rows={2}
                        placeholder="Structure specification line (e.g. Galvanized iron structure, wind tolerance)..."
                        value={formData.spec_line_d_structure}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Spec Part 2</label>
                      <textarea
                        name="spec_part_2"
                        rows={2}
                        placeholder="Secondary specifications, cabling, protection devices, earthing..."
                        value={formData.spec_part_2}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-semibold hover:from-purple-700 hover:to-indigo-700 shadow-md transition disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Solar Quote"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL: EDIT SOLAR SYSTEM QUOTE ================= */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-purple-100 overflow-hidden my-auto max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Edit2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Edit Solar System Quote #{selectedItem?.id}</h3>
                    <p className="text-xs text-purple-100">Update system specs, subsidies and pricing</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleEditItem} className="p-6 overflow-y-auto space-y-6">
                {/* Group 1: General & Identifiers */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider border-b border-purple-100 pb-1 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-purple-600" />
                    1. System Identifiers
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">System Key *</label>
                      <input
                        type="text"
                        name="system_key"
                        required
                        value={formData.system_key}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">System ID</label>
                      <input
                        type="text"
                        name="system_id"
                        value={formData.system_id}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Mode</label>
                      <input
                        type="text"
                        name="mode"
                        value={formData.mode}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Phase</label>
                      <input
                        type="text"
                        name="phase"
                        value={formData.phase}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Group 2: Technical Specifications */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider border-b border-purple-100 pb-1 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-purple-600" />
                    2. Technical & Hardware Parameters
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Module Type</label>
                      <input
                        type="text"
                        name="module_type"
                        value={formData.module_type}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Structure</label>
                      <input
                        type="text"
                        name="structure"
                        value={formData.structure}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Capacity (kWp)</label>
                      <input
                        type="text"
                        name="capacity_kwp"
                        value={formData.capacity_kwp}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Rating (Wp)</label>
                      <input
                        type="text"
                        name="rating_wp"
                        value={formData.rating_wp}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Panels Count</label>
                      <input
                        type="text"
                        name="panels"
                        value={formData.panels}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Actual kWp</label>
                      <input
                        type="text"
                        name="actual_kwp"
                        value={formData.actual_kwp}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Group 3: Financials & Pricing */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider border-b border-purple-100 pb-1 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-purple-600" />
                    3. Pricing & Subsidies
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Original Rate</label>
                      <input
                        type="text"
                        name="original_rate"
                        value={formData.original_rate}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">GST %</label>
                      <input
                        type="text"
                        name="gst_percent"
                        value={formData.gst_percent}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Total (Incl GST Ex Battery)</label>
                      <input
                        type="text"
                        name="total_incl_gst_ex_battery"
                        value={formData.total_incl_gst_ex_battery}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Net Ex Battery</label>
                      <input
                        type="text"
                        name="net_ex_battery"
                        value={formData.net_ex_battery}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Applicable Subsidy (Total)</label>
                      <input
                        type="text"
                        name="applicable_subsidy"
                        value={formData.applicable_subsidy}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Central Subsidy Segment</label>
                      <input
                        type="text"
                        name="central_subsidy_segment"
                        value={formData.central_subsidy_segment}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-medium text-gray-700 mb-1">State Subsidy Segment</label>
                      <input
                        type="text"
                        name="state_subsidy_segment"
                        value={formData.state_subsidy_segment}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Group 4: Specification Texts */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider border-b border-purple-100 pb-1 flex items-center gap-1.5">
                    <Settings className="h-3.5 w-3.5 text-purple-600" />
                    4. Detailed Quotation Specifications
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Spec Part 1</label>
                      <textarea
                        name="spec_part_1"
                        rows={2}
                        value={formData.spec_part_1}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Spec Line D Structure</label>
                      <textarea
                        name="spec_line_d_structure"
                        rows={2}
                        value={formData.spec_line_d_structure}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Spec Part 2</label>
                      <textarea
                        name="spec_part_2"
                        rows={2}
                        value={formData.spec_part_2}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-semibold hover:from-purple-700 hover:to-indigo-700 shadow-md transition disabled:opacity-50"
                  >
                    {isSubmitting ? "Updating..." : "Update Solar Quote"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL: VIEW DETAILS ================= */}
        {showViewModal && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-purple-100 overflow-hidden my-auto max-h-[90vh] flex flex-col">
              {/* View Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-purple-800 to-indigo-800 text-white flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Sun className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      {selectedItem.system_key || `System #${selectedItem.id}`}
                    </h3>
                    <p className="text-xs text-purple-200">
                      ID: {selectedItem.id} | System ID: {selectedItem.system_id || "N/A"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-1 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* View Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Financial Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[11px] text-gray-500 block font-medium">Original Rate</span>
                    <span className="text-sm font-bold text-gray-800">
                      {selectedItem.original_rate ? `₹${selectedItem.original_rate}` : "—"}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[11px] text-gray-500 block font-medium">GST %</span>
                    <span className="text-sm font-bold text-gray-800">
                      {selectedItem.gst_percent ? `${selectedItem.gst_percent}%` : "—"}
                    </span>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                    <span className="text-[11px] text-gray-500 block font-medium">Total (Incl GST)</span>
                    <span className="text-sm font-bold text-purple-900">
                      {selectedItem.total_incl_gst_ex_battery ? `₹${selectedItem.total_incl_gst_ex_battery}` : "—"}
                    </span>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <span className="text-[11px] text-gray-500 block font-medium">Net (Ex Battery)</span>
                    <span className="text-sm font-bold text-indigo-900">
                      {selectedItem.net_ex_battery ? `₹${selectedItem.net_ex_battery}` : "—"}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-[11px] text-gray-500 block font-medium">Applicable Subsidy</span>
                    <span className="text-sm font-bold text-emerald-700">
                      {selectedItem.applicable_subsidy ? `₹${selectedItem.applicable_subsidy}` : "—"}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-[11px] text-gray-500 block font-medium">Central Subsidy</span>
                    <span className="text-sm font-bold text-emerald-700">
                      {selectedItem.central_subsidy_segment ? `₹${selectedItem.central_subsidy_segment}` : "—"}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 sm:col-span-2">
                    <span className="text-[11px] text-gray-500 block font-medium">State Subsidy</span>
                    <span className="text-sm font-bold text-emerald-700">
                      {selectedItem.state_subsidy_segment ? `₹${selectedItem.state_subsidy_segment}` : "—"}
                    </span>
                  </div>
                </div>

                {/* Technical Parameters Table */}
                <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                    Technical Specifications
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Module Type</span>
                      <span className="font-semibold text-gray-800">{selectedItem.module_type || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Structure</span>
                      <span className="font-semibold text-gray-800">{selectedItem.structure || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Operating Mode</span>
                      <span className="font-semibold text-gray-800">{selectedItem.mode || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Nominal Capacity</span>
                      <span className="font-semibold text-gray-800">{selectedItem.capacity_kwp || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Phase</span>
                      <span className="font-semibold text-gray-800">{selectedItem.phase || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Module Rating</span>
                      <span className="font-semibold text-gray-800">{selectedItem.rating_wp || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Panels Count</span>
                      <span className="font-semibold text-gray-800">{selectedItem.panels || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Actual Output</span>
                      <span className="font-semibold text-gray-800">{selectedItem.actual_kwp || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Created At</span>
                      <span className="font-medium text-gray-600">
                        {formatDateTime(selectedItem.created_at)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Last Updated</span>
                      <span className="font-medium text-gray-600">
                        {formatDateTime(selectedItem.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Long Specs Sections */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Full Quotation Specifications
                  </h4>

                  {/* Spec Part 1 */}
                  <div className="border border-gray-200 rounded-xl p-3 bg-white space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-gray-600">Specification Part 1:</span>
                      {selectedItem.spec_part_1 && (
                        <button
                          onClick={() => handleCopy(selectedItem.spec_part_1, "spec1")}
                          className="text-[11px] text-purple-600 hover:text-purple-800 flex items-center gap-1"
                        >
                          {copiedField === "spec1" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copiedField === "spec1" ? "Copied" : "Copy"}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedItem.spec_part_1 || <span className="text-gray-400 italic">No text provided</span>}
                    </p>
                  </div>

                  {/* Spec Line D Structure */}
                  <div className="border border-gray-200 rounded-xl p-3 bg-white space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-gray-600">Spec Line D Structure:</span>
                      {selectedItem.spec_line_d_structure && (
                        <button
                          onClick={() => handleCopy(selectedItem.spec_line_d_structure, "spec_struct")}
                          className="text-[11px] text-purple-600 hover:text-purple-800 flex items-center gap-1"
                        >
                          {copiedField === "spec_struct" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copiedField === "spec_struct" ? "Copied" : "Copy"}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedItem.spec_line_d_structure || <span className="text-gray-400 italic">No text provided</span>}
                    </p>
                  </div>

                  {/* Spec Part 2 */}
                  <div className="border border-gray-200 rounded-xl p-3 bg-white space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-gray-600">Specification Part 2:</span>
                      {selectedItem.spec_part_2 && (
                        <button
                          onClick={() => handleCopy(selectedItem.spec_part_2, "spec2")}
                          className="text-[11px] text-purple-600 hover:text-purple-800 flex items-center gap-1"
                        >
                          {copiedField === "spec2" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copiedField === "spec2" ? "Copied" : "Copy"}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedItem.spec_part_2 || <span className="text-gray-400 italic">No text provided</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* View Footer */}
              <div className="flex justify-end gap-2 px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    openEditModal(selectedItem)
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 transition"
                >
                  Edit This Quote
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-white transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL: DELETE CONFIRMATION ================= */}
        {showDeleteConfirm && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-100 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Delete Solar System Quote?</h3>
                  <p className="text-xs text-gray-500">This action cannot be undone.</p>
                </div>
              </div>

              <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100 text-xs space-y-1">
                <p className="text-gray-700">
                  <span className="font-semibold text-rose-900">System Key:</span> {selectedItem.system_key || "N/A"}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold text-rose-900">Capacity:</span> {selectedItem.capacity_kwp || "N/A"} ({selectedItem.mode || "Mode N/A"})
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold text-rose-900">ID:</span> #{selectedItem.id}
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteItem}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? "Deleting..." : "Yes, Delete Record"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

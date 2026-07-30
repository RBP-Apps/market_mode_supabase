"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  Database,
  Building2,
  Activity,
  Zap,
  Wrench,
  Landmark,
  Phone,
  MapPin,
  CreditCard,
  UserCheck
} from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

export default function DropdownPage() {
  // Active Tab: "dropdown" or "master2"
  const [activeTab, setActiveTab] = useState("dropdown")

  // State for Dropdown table
  const [dropdownList, setDropdownList] = useState([])
  // State for Master2 table
  const [master2List, setMaster2List] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState("")

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedColumnFilter, setSelectedColumnFilter] = useState("all")
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all")

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initial Form State matching schema: public.dropdown
  const initialDropdownForm = {
    structure_type: "",
    roof_type: "",
    system_type: "",
    need_type: "",
    project_mode: "",
    stage: "",
    follow_up: "",
    status: "Active",
    inverter_make: "",
    inverter_capacity: "",
    module_make: "",
    module_capacity: "",
    module_type: "",
    structure_make: "",
    vendor_name: "",
    phase: ""
  }

  // Initial Form State matching schema: public.Master2
  const initialMaster2Form = {
    dealer: "",
    address: "",
    contact: "",
    our_bank_name: "",
    account_no: "",
    ifsc_code: "",
    branch: ""
  }

  const [dropdownFormData, setDropdownFormData] = useState(initialDropdownForm)
  const [master2FormData, setMaster2FormData] = useState(initialMaster2Form)

  // Fetch data from Supabase table dropdown
  const fetchDropdownData = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchErr } = await supabase
        .from("dropdown")
        .select("*")
        .order("id", { ascending: false })

      if (fetchErr) throw fetchErr
      setDropdownList(data || [])
    } catch (err) {
      console.error("Error fetching dropdown data:", err)
      setError("Failed to fetch dropdown list: " + (err.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  // Fetch data from Supabase table Master2
  const fetchMaster2Data = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchErr } = await supabase
        .from("Master2")
        .select("*")
        .order("id", { ascending: false })

      if (fetchErr) throw fetchErr
      setMaster2List(data || [])
    } catch (err) {
      console.error("Error fetching Master2 data:", err)
      setError("Failed to fetch Master2 list: " + (err.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "dropdown") {
      fetchDropdownData()
    } else {
      fetchMaster2Data()
    }
    // Reset search on tab change
    setSearchTerm("")
    setSelectedColumnFilter("all")
    setSelectedStatusFilter("all")
  }, [activeTab])

  // Auto-dismiss alert notifications
  const triggerSuccess = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 4000)
  }

  const triggerError = (msg) => {
    setError(msg)
    setTimeout(() => setError(null), 5000)
  }

  // Handle Form input changes for Dropdown
  const handleDropdownInputChange = (e) => {
    const { name, value } = e.target
    setDropdownFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle Form input changes for Master2
  const handleMaster2InputChange = (e) => {
    const { name, value } = e.target
    setMaster2FormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  // Reset & Open Add Modal
  const openAddModal = () => {
    if (activeTab === "dropdown") {
      setDropdownFormData(initialDropdownForm)
    } else {
      setMaster2FormData(initialMaster2Form)
    }
    setShowAddModal(true)
  }

  // Open Edit Modal
  const openEditModal = (item) => {
    setSelectedItem(item)
    if (activeTab === "dropdown") {
      setDropdownFormData({
        structure_type: item.structure_type || "",
        roof_type: item.roof_type || "",
        system_type: item.system_type || "",
        need_type: item.need_type || "",
        project_mode: item.project_mode || "",
        stage: item.stage || "",
        follow_up: item.follow_up || "",
        status: item.status || "Active",
        inverter_make: item.inverter_make || "",
        inverter_capacity: item.inverter_capacity || "",
        module_make: item.module_make || "",
        module_capacity: item.module_capacity || "",
        module_type: item.module_type || "",
        structure_make: item.structure_make || "",
        vendor_name: item.vendor_name || "",
        phase: item.phase || ""
      })
    } else {
      setMaster2FormData({
        dealer: item.dealer || "",
        address: item.address || "",
        contact: item.contact || "",
        our_bank_name: item.our_bank_name || "",
        account_no: item.account_no || "",
        ifsc_code: item.ifsc_code || "",
        branch: item.branch || ""
      })
    }
    setShowEditModal(true)
  }

  // Open Delete Confirmation
  const openDeleteConfirm = (item) => {
    setSelectedItem(item)
    setShowDeleteConfirm(true)
  }

  // Open Detailed View
  const openViewModal = (item) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  // Add Record
  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (activeTab === "dropdown") {
        const payload = {
          structure_type: dropdownFormData.structure_type.trim() || null,
          roof_type: dropdownFormData.roof_type.trim() || null,
          system_type: dropdownFormData.system_type.trim() || null,
          need_type: dropdownFormData.need_type.trim() || null,
          project_mode: dropdownFormData.project_mode.trim() || null,
          stage: dropdownFormData.stage.trim() || null,
          follow_up: dropdownFormData.follow_up.trim() || null,
          status: dropdownFormData.status.trim() || null,
          inverter_make: dropdownFormData.inverter_make.trim() || null,
          inverter_capacity: dropdownFormData.inverter_capacity.trim() || null,
          module_make: dropdownFormData.module_make.trim() || null,
          module_capacity: dropdownFormData.module_capacity.trim() || null,
          module_type: dropdownFormData.module_type.trim() || null,
          structure_make: dropdownFormData.structure_make.trim() || null,
          vendor_name: dropdownFormData.vendor_name.trim() || null,
          phase: dropdownFormData.phase.trim() || null
        }

        const { error: insertErr } = await supabase.from("dropdown").insert([payload])
        if (insertErr) throw insertErr

        triggerSuccess("Dropdown entry created successfully!")
        fetchDropdownData()
      } else {
        const payload = {
          dealer: master2FormData.dealer.trim() || null,
          address: master2FormData.address.trim() || null,
          contact: master2FormData.contact.trim() || null,
          our_bank_name: master2FormData.our_bank_name.trim() || null,
          account_no: master2FormData.account_no.trim() || null,
          ifsc_code: master2FormData.ifsc_code.trim() || null,
          branch: master2FormData.branch.trim() || null
        }

        const { error: insertErr } = await supabase.from("Master2").insert([payload])
        if (insertErr) throw insertErr

        triggerSuccess("Dealer record created successfully!")
        fetchMaster2Data()
      }
      setShowAddModal(false)
    } catch (err) {
      console.error("Error creating entry:", err)
      triggerError("Failed to add entry: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update Record
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!selectedItem) return
    setIsSubmitting(true)
    setError(null)

    try {
      if (activeTab === "dropdown") {
        const payload = {
          structure_type: dropdownFormData.structure_type.trim() || null,
          roof_type: dropdownFormData.roof_type.trim() || null,
          system_type: dropdownFormData.system_type.trim() || null,
          need_type: dropdownFormData.need_type.trim() || null,
          project_mode: dropdownFormData.project_mode.trim() || null,
          stage: dropdownFormData.stage.trim() || null,
          follow_up: dropdownFormData.follow_up.trim() || null,
          status: dropdownFormData.status.trim() || null,
          inverter_make: dropdownFormData.inverter_make.trim() || null,
          inverter_capacity: dropdownFormData.inverter_capacity.trim() || null,
          module_make: dropdownFormData.module_make.trim() || null,
          module_capacity: dropdownFormData.module_capacity.trim() || null,
          module_type: dropdownFormData.module_type.trim() || null,
          structure_make: dropdownFormData.structure_make.trim() || null,
          vendor_name: dropdownFormData.vendor_name.trim() || null,
          phase: dropdownFormData.phase.trim() || null
        }

        const { error: updateErr } = await supabase.from("dropdown").update(payload).eq("id", selectedItem.id)
        if (updateErr) throw updateErr

        triggerSuccess("Dropdown entry updated successfully!")
        fetchDropdownData()
      } else {
        const payload = {
          dealer: master2FormData.dealer.trim() || null,
          address: master2FormData.address.trim() || null,
          contact: master2FormData.contact.trim() || null,
          our_bank_name: master2FormData.our_bank_name.trim() || null,
          account_no: master2FormData.account_no.trim() || null,
          ifsc_code: master2FormData.ifsc_code.trim() || null,
          branch: master2FormData.branch.trim() || null
        }

        const { error: updateErr } = await supabase.from("Master2").update(payload).eq("id", selectedItem.id)
        if (updateErr) throw updateErr

        triggerSuccess("Dealer record updated successfully!")
        fetchMaster2Data()
      }
      setShowEditModal(false)
    } catch (err) {
      console.error("Error updating entry:", err)
      triggerError("Failed to update entry: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Record
  const handleDeleteSubmit = async () => {
    if (!selectedItem) return
    setIsSubmitting(true)
    setError(null)

    try {
      const tableName = activeTab === "dropdown" ? "dropdown" : "Master2"
      const { error: deleteErr } = await supabase.from(tableName).delete().eq("id", selectedItem.id)

      if (deleteErr) throw deleteErr

      triggerSuccess("Record deleted successfully!")
      setShowDeleteConfirm(false)
      if (activeTab === "dropdown") {
        fetchDropdownData()
      } else {
        fetchMaster2Data()
      }
    } catch (err) {
      console.error("Error deleting entry:", err)
      triggerError("Failed to delete entry: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtering Logic for Dropdown Tab
  const filteredDropdownData = useMemo(() => {
    return dropdownList.filter((item) => {
      if (selectedStatusFilter !== "all") {
        if (selectedStatusFilter === "active" && item.status?.toLowerCase() !== "active") return false
        if (selectedStatusFilter === "inactive" && item.status?.toLowerCase() === "active") return false
      }

      if (!searchTerm) return true
      const query = searchTerm.toLowerCase()

      if (selectedColumnFilter !== "all") {
        const val = item[selectedColumnFilter]
        return val ? String(val).toLowerCase().includes(query) : false
      }

      return Object.entries(item).some(([key, val]) => {
        if (key === "id" || key === "created_at" || !val) return false
        return String(val).toLowerCase().includes(query)
      })
    })
  }, [dropdownList, searchTerm, selectedColumnFilter, selectedStatusFilter])

  // Filtering Logic for Master2 Tab
  const filteredMaster2Data = useMemo(() => {
    return master2List.filter((item) => {
      if (!searchTerm) return true
      const query = searchTerm.toLowerCase()

      if (selectedColumnFilter !== "all") {
        const val = item[selectedColumnFilter]
        return val ? String(val).toLowerCase().includes(query) : false
      }

      return Object.entries(item).some(([key, val]) => {
        if (key === "id" || key === "created_at" || !val) return false
        return String(val).toLowerCase().includes(query)
      })
    })
  }, [master2List, searchTerm, selectedColumnFilter])

  // Clear filters
  const resetFilters = () => {
    setSearchTerm("")
    setSelectedColumnFilter("all")
    setSelectedStatusFilter("all")
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Toast Alerts */}
        {success && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-emerald-500 text-white p-4 shadow-2xl animate-fade-in border border-emerald-400">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-semibold">{success}</span>
          </div>
        )}

        {error && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-rose-500 text-white p-4 shadow-2xl animate-fade-in border border-rose-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Database className="h-6 w-6" />
              </span>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Master Configuration Manager
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1 pl-1">
              Manage system configuration options, component specs, dealer details & bank information.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={activeTab === "dropdown" ? fetchDropdownData : fetchMaster2Data}
              className="flex items-center justify-center p-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            </button>
            <button
              onClick={openAddModal}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-2.5 px-5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              {activeTab === "dropdown" ? "Add Dropdown Record" : "Add Dealer Record"}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Switcher */}
        <div className="flex border-b border-gray-200 bg-white rounded-xl p-1 shadow-xs border">
          <button
            onClick={() => setActiveTab("dropdown")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === "dropdown"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/50"
            }`}
          >
            <Database className="h-4 w-4" />
            Dropdown Master Options
          </button>
          <button
            onClick={() => setActiveTab("master2")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === "master2"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/50"
            }`}
          >
            <Landmark className="h-4 w-4" />
            Dealer & Bank Master (Master2)
          </button>
        </div>

        {/* Search & Filters Controls */}
        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Search Input Box */}
            <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition">
              <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder={
                  activeTab === "dropdown"
                    ? "Search across all dropdown fields..."
                    : "Search dealer, bank, address, contact, account no..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm bg-transparent border-0 outline-none placeholder-gray-400"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter by Specific Column */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-blue-600 hidden md:block" />
              {activeTab === "dropdown" ? (
                <select
                  value={selectedColumnFilter}
                  onChange={(e) => setSelectedColumnFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl text-sm py-2 px-3 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Search Field: All Fields</option>
                  <option value="structure_type">Structure Type</option>
                  <option value="roof_type">Roof Type</option>
                  <option value="system_type">System Type</option>
                  <option value="need_type">Need Type</option>
                  <option value="project_mode">Project Mode</option>
                  <option value="stage">Stage</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="status">Status</option>
                  <option value="inverter_make">Inverter Make</option>
                  <option value="inverter_capacity">Inverter Capacity</option>
                  <option value="module_make">Module Make</option>
                  <option value="module_capacity">Module Capacity</option>
                  <option value="module_type">Module Type</option>
                  <option value="structure_make">Structure Make</option>
                  <option value="vendor_name">Vendor Name</option>
                  <option value="phase">Phase</option>
                </select>
              ) : (
                <select
                  value={selectedColumnFilter}
                  onChange={(e) => setSelectedColumnFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl text-sm py-2 px-3 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Search Field: All Fields</option>
                  <option value="dealer">Dealer</option>
                  <option value="address">Address</option>
                  <option value="contact">Contact</option>
                  <option value="our_bank_name">Bank Name</option>
                  <option value="account_no">Account No</option>
                  <option value="ifsc_code">IFSC Code</option>
                  <option value="branch">Branch</option>
                </select>
              )}
            </div>

            {/* Status Filter (Dropdown Tab only) */}
            {activeTab === "dropdown" && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl text-sm py-2 px-3 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Status: All</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Non-Active</option>
                </select>
              </div>
            )}

            {(searchTerm || selectedColumnFilter !== "all" || (activeTab === "dropdown" && selectedStatusFilter !== "all")) && (
              <button
                onClick={resetFilters}
                className="text-xs text-blue-600 font-semibold hover:underline px-2 py-1 text-center"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500 px-1 pt-1">
            <span>
              Showing{" "}
              <strong className="text-gray-800">
                {activeTab === "dropdown" ? filteredDropdownData.length : filteredMaster2Data.length}
              </strong>{" "}
              of {activeTab === "dropdown" ? dropdownList.length : master2List.length} records
            </span>
            {searchTerm && <span>Filtering by search query</span>}
          </div>
        </div>

        {/* Data Table Container */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-xs overflow-hidden">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-3 text-blue-600 font-medium text-sm">
                Loading {activeTab === "dropdown" ? "dropdown" : "dealer"} data...
              </p>
            </div>
          ) : activeTab === "dropdown" ? (
            /* TAB 1: DROPDOWN TABLE */
            filteredDropdownData.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="inline-flex p-4 rounded-full bg-blue-50 text-blue-500">
                  <Database className="h-8 w-8" />
                </div>
                <p className="text-gray-700 font-medium text-base">No dropdown records found.</p>
                {!searchTerm && (
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    <Plus className="h-4 w-4" /> Add Record
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[65vh] custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-100 text-left text-sm whitespace-nowrap">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50/70 sticky top-0 z-10 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-center sticky left-0 bg-blue-50 z-20 shadow-xs">Actions</th>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Structure Type</th>
                      <th className="px-4 py-3">Roof Type</th>
                      <th className="px-4 py-3">System Type</th>
                      <th className="px-4 py-3">Need Type</th>
                      <th className="px-4 py-3">Project Mode</th>
                      <th className="px-4 py-3">Stage</th>
                      <th className="px-4 py-3">Follow Up</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3">Inverter Make</th>
                      <th className="px-4 py-3">Inverter Capacity</th>
                      <th className="px-4 py-3">Module Make</th>
                      <th className="px-4 py-3">Module Capacity</th>
                      <th className="px-4 py-3">Module Type</th>
                      <th className="px-4 py-3">Structure Make</th>
                      <th className="px-4 py-3">Vendor Name</th>
                      <th className="px-4 py-3">Phase</th>
                      <th className="px-4 py-3">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredDropdownData.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/40 transition duration-150">
                        <td className="px-4 py-3 text-center sticky left-0 bg-white hover:bg-blue-50 z-10 border-r border-gray-100">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openViewModal(item)}
                              className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition"
                              title="View Full Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                              title="Edit Record"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(item)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                              title="Delete Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-3 font-semibold text-gray-500 text-xs">#{item.id}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{item.structure_type || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{item.roof_type || "—"}</td>
                        <td className="px-4 py-3 font-medium text-blue-700">{item.system_type || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{item.need_type || "—"}</td>
                        <td className="px-4 py-3 text-gray-800">{item.project_mode || "—"}</td>
                        <td className="px-4 py-3 font-medium text-indigo-700">{item.stage || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{item.follow_up || "—"}</td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              item.status?.toLowerCase() === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.status || "N/A"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-gray-800">{item.inverter_make || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{item.inverter_capacity || "—"}</td>
                        <td className="px-4 py-3 text-gray-800">{item.module_make || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{item.module_capacity || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{item.module_type || "—"}</td>
                        <td className="px-4 py-3 text-gray-800">{item.structure_make || "—"}</td>
                        <td className="px-4 py-3 font-medium text-purple-700">{item.vendor_name || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{item.phase || "—"}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {item.created_at ? new Date(item.created_at).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* TAB 2: MASTER2 (DEALER & BANK) TABLE */
            filteredMaster2Data.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="inline-flex p-4 rounded-full bg-blue-50 text-blue-500">
                  <Landmark className="h-8 w-8" />
                </div>
                <p className="text-gray-700 font-medium text-base">No dealer & bank records found in Master2.</p>
                {!searchTerm && (
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    <Plus className="h-4 w-4" /> Add Dealer Record
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[65vh] custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-100 text-left text-sm whitespace-nowrap">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50/70 sticky top-0 z-10 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-center sticky left-0 bg-blue-50 z-20 shadow-xs">Actions</th>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Dealer</th>
                      <th className="px-4 py-3">Address</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Bank Name</th>
                      <th className="px-4 py-3">Account No</th>
                      <th className="px-4 py-3">IFSC Code</th>
                      <th className="px-4 py-3">Branch</th>
                      <th className="px-4 py-3">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredMaster2Data.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/40 transition duration-150">
                        <td className="px-4 py-3 text-center sticky left-0 bg-white hover:bg-blue-50 z-10 border-r border-gray-100">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openViewModal(item)}
                              className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition"
                              title="View Full Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                              title="Edit Record"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(item)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                              title="Delete Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-3 font-semibold text-gray-500 text-xs">#{item.id}</td>
                        <td className="px-4 py-3 font-bold text-gray-900">{item.dealer || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{item.address || "—"}</td>
                        <td className="px-4 py-3 font-medium text-blue-700">{item.contact || "—"}</td>
                        <td className="px-4 py-3 font-semibold text-indigo-800">{item.our_bank_name || "—"}</td>
                        <td className="px-4 py-3 text-gray-800 font-mono text-xs">{item.account_no || "—"}</td>
                        <td className="px-4 py-3 text-gray-800 font-mono text-xs">{item.ifsc_code || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{item.branch || "—"}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {item.created_at ? new Date(item.created_at).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Modal: Add or Edit Record */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-blue-100 my-6 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  {activeTab === "dropdown" ? <Database className="h-5 w-5" /> : <Landmark className="h-5 w-5" />}
                  <h3 className="text-lg font-bold">
                    {showAddModal
                      ? activeTab === "dropdown"
                        ? "Add New Dropdown Option"
                        : "Add New Dealer & Bank Record"
                      : activeTab === "dropdown"
                      ? "Edit Dropdown Record"
                      : "Edit Dealer & Bank Record"}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                  }}
                  className="p-1 rounded-full text-white/80 hover:bg-white/20 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Body */}
              <form
                onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit}
                className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
              >
                {activeTab === "dropdown" ? (
                  /* Form Fields for Dropdown Tab */
                  <>
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2 border-b border-blue-100 pb-2">
                        <Building2 className="h-4 w-4" /> Section 1: System & Structure Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Structure Type</label>
                          <input
                            type="text"
                            name="structure_type"
                            placeholder="e.g. High Rise, Ground Mount"
                            value={dropdownFormData.structure_type}
                            onChange={handleDropdownInputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Roof Type</label>
                          <input
                            type="text"
                            name="roof_type"
                            placeholder="e.g. RCC, Tin Shed, Tile"
                            value={dropdownFormData.roof_type}
                            onChange={handleDropdownInputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">System Type</label>
                          <input
                            type="text"
                            name="system_type"
                            placeholder="e.g. On-Grid, Off-Grid, Hybrid"
                            value={dropdownFormData.system_type}
                            onChange={handleDropdownInputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Need Type</label>
                          <input
                            type="text"
                            name="need_type"
                            placeholder="e.g. Residential, Commercial"
                            value={dropdownFormData.need_type}
                            onChange={handleDropdownInputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Project Mode</label>
                          <input
                            type="text"
                            name="project_mode"
                            placeholder="e.g. CAPEX, RESCO"
                            value={dropdownFormData.project_mode}
                            onChange={handleDropdownInputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Phase</label>
                          <input
                            type="text"
                            name="phase"
                            placeholder="e.g. 1 Phase, 3 Phase"
                            value={dropdownFormData.phase}
                            onChange={handleDropdownInputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2 border-b border-blue-100 pb-2">
                        <Activity className="h-4 w-4" /> Section 2: Stage & Status Tracking
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Stage</label>
                          <input
                            type="text"
                            name="stage"
                            placeholder="e.g. Survey, Installation, Closed"
                            value={dropdownFormData.stage}
                            onChange={handleDropdownInputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Follow Up</label>
                          <input
                            type="text"
                            name="follow_up"
                            placeholder="e.g. Daily, Pending, Done"
                            value={dropdownFormData.follow_up}
                            onChange={handleDropdownInputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                          <select
                            name="status"
                            value={dropdownFormData.status}
                            onChange={handleDropdownInputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Pending">Pending</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2 border-b border-blue-100 pb-2">
                        <Zap className="h-4 w-4" /> Section 3: Inverter Specifications
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Inverter Make</label>
                          <input
                            type="text"
                            name="inverter_make"
                            placeholder="e.g. Growatt, Solis, Sungrow"
                            value={dropdownFormData.inverter_make}
                            onChange={handleDropdownInputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Inverter Capacity</label>
                          <input
                            type="text"
                            name="inverter_capacity"
                            placeholder="e.g. 5 kW, 10 kW"
                            value={dropdownFormData.inverter_capacity}
                            onChange={handleDropdownInputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2 border-b border-blue-100 pb-2">
                        <Wrench className="h-4 w-4" /> Section 4: Module & Vendor Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Module Make</label>
                          <input
                            type="text"
                            name="module_make"
                            placeholder="e.g. Adani, Waaree, Vikram"
                            value={dropdownFormData.module_make}
                            onChange={handleDropdownInputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Module Capacity</label>
                          <input
                            type="text"
                            name="module_capacity"
                            placeholder="e.g. 540W, 550W"
                            value={dropdownFormData.module_capacity}
                            onChange={handleDropdownInputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Module Type</label>
                          <input
                            type="text"
                            name="module_type"
                            placeholder="e.g. Mono PERC, Bifacial, TopCon"
                            value={dropdownFormData.module_type}
                            onChange={handleDropdownInputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Structure Make</label>
                          <input
                            type="text"
                            name="structure_make"
                            placeholder="e.g. Galvanized Iron, Aluminum"
                            value={dropdownFormData.structure_make}
                            onChange={handleDropdownInputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Vendor Name</label>
                          <input
                            type="text"
                            name="vendor_name"
                            placeholder="e.g. Solar Vendor Ltd."
                            value={dropdownFormData.vendor_name}
                            onChange={handleDropdownInputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Form Fields for Master2 (Dealer & Bank) Tab */
                  <>
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2 border-b border-blue-100 pb-2">
                        <UserCheck className="h-4 w-4" /> Dealer & Contact Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Dealer Name</label>
                          <input
                            type="text"
                            name="dealer"
                            placeholder="e.g. Acme Solar Dealer"
                            value={master2FormData.dealer}
                            onChange={handleMaster2InputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Number</label>
                          <input
                            type="text"
                            name="contact"
                            placeholder="e.g. +91 9876543210"
                            value={master2FormData.contact}
                            onChange={handleMaster2InputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
                          <input
                            type="text"
                            name="address"
                            placeholder="e.g. Plot No. 12, Industrial Area, Raipur"
                            value={master2FormData.address}
                            onChange={handleMaster2InputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2 border-b border-blue-100 pb-2">
                        <Landmark className="h-4 w-4" /> Bank Account Specifications
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Our Bank Name</label>
                          <input
                            type="text"
                            name="our_bank_name"
                            placeholder="e.g. State Bank of India"
                            value={master2FormData.our_bank_name}
                            onChange={handleMaster2InputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Account Number</label>
                          <input
                            type="text"
                            name="account_no"
                            placeholder="e.g. 40123456789"
                            value={master2FormData.account_no}
                            onChange={handleMaster2InputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">IFSC Code</label>
                          <input
                            type="text"
                            name="ifsc_code"
                            placeholder="e.g. SBIN0001234"
                            value={master2FormData.ifsc_code}
                            onChange={handleMaster2InputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Branch</label>
                          <input
                            type="text"
                            name="branch"
                            placeholder="e.g. Main Branch, Raipur"
                            value={master2FormData.branch}
                            onChange={handleMaster2InputChange}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setShowEditModal(false)
                    }}
                    className="rounded-xl border border-gray-300 py-2.5 px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-2.5 px-6 text-sm font-semibold text-white shadow-md focus:outline-none transition disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : showAddModal ? "Create Entry" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Detailed View */}
        {showViewModal && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-blue-100 overflow-hidden">
              <div className="flex justify-between items-center p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  <h3 className="font-bold text-lg">
                    {activeTab === "dropdown" ? "Dropdown" : "Master2"} Record Details (ID: #{selectedItem.id})
                  </h3>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-1 rounded-full text-white/80 hover:bg-white/20 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-2 gap-4 text-sm max-h-[75vh] overflow-y-auto custom-scrollbar">
                {activeTab === "dropdown" ? (
                  <>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Structure Type</span>
                      <span className="font-semibold text-gray-800">{selectedItem.structure_type || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Roof Type</span>
                      <span className="font-semibold text-gray-800">{selectedItem.roof_type || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">System Type</span>
                      <span className="font-semibold text-gray-800">{selectedItem.system_type || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Need Type</span>
                      <span className="font-semibold text-gray-800">{selectedItem.need_type || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Project Mode</span>
                      <span className="font-semibold text-gray-800">{selectedItem.project_mode || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Phase</span>
                      <span className="font-semibold text-gray-800">{selectedItem.phase || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Stage</span>
                      <span className="font-semibold text-gray-800">{selectedItem.stage || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Follow Up</span>
                      <span className="font-semibold text-gray-800">{selectedItem.follow_up || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Inverter Make</span>
                      <span className="font-semibold text-gray-800">{selectedItem.inverter_make || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Inverter Capacity</span>
                      <span className="font-semibold text-gray-800">{selectedItem.inverter_capacity || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Module Make</span>
                      <span className="font-semibold text-gray-800">{selectedItem.module_make || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Module Capacity</span>
                      <span className="font-semibold text-gray-800">{selectedItem.module_capacity || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Module Type</span>
                      <span className="font-semibold text-gray-800">{selectedItem.module_type || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Structure Make</span>
                      <span className="font-semibold text-gray-800">{selectedItem.structure_make || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Vendor Name</span>
                      <span className="font-semibold text-gray-800">{selectedItem.vendor_name || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Status</span>
                      <span className="font-semibold text-emerald-700">{selectedItem.status || "—"}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-gray-50 rounded-xl col-span-2">
                      <span className="text-xs font-semibold text-gray-500 block">Dealer Name</span>
                      <span className="font-bold text-gray-900 text-base">{selectedItem.dealer || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl col-span-2">
                      <span className="text-xs font-semibold text-gray-500 block">Address</span>
                      <span className="font-semibold text-gray-800">{selectedItem.address || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Contact</span>
                      <span className="font-semibold text-blue-700">{selectedItem.contact || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Our Bank Name</span>
                      <span className="font-semibold text-indigo-700">{selectedItem.our_bank_name || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Account Number</span>
                      <span className="font-mono text-gray-800">{selectedItem.account_no || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">IFSC Code</span>
                      <span className="font-mono text-gray-800">{selectedItem.ifsc_code || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Branch</span>
                      <span className="font-semibold text-gray-800">{selectedItem.branch || "—"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-500 block">Created At</span>
                      <span className="text-xs text-gray-600">
                        {selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString() : "—"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirm Delete */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full border border-blue-100 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-3 bg-rose-50 rounded-full">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Record Deletion</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Are you sure you want to delete entry <strong className="text-gray-900">#{selectedItem?.id}</strong>
                {selectedItem?.dealer ? ` (${selectedItem.dealer})` : selectedItem?.structure_type ? ` (${selectedItem.structure_type})` : ""}?
                This operation will permanently remove the record from Supabase table{" "}
                <strong>{activeTab === "dropdown" ? "dropdown" : "Master2"}</strong>.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-xl border border-gray-300 py-2 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSubmit}
                  disabled={isSubmitting}
                  className="rounded-xl bg-rose-600 py-2 px-5 text-sm font-semibold text-white hover:bg-rose-700 focus:outline-none transition disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ? "Deleting..." : "Delete Entry"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

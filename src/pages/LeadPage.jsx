"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  Edit2,
  FileText,
  Phone,
  MapPin,
  User,
  Zap,
  Building2,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
  Calendar,
  Filter,
  Download,
  DollarSign,
  Tag
} from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

// Debounce hook for smooth search
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export default function LeadPage() {
  const [leadData, setLeadData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [districtFilter, setDistrictFilter] = useState("ALL")
  const [systemFilter, setSystemFilter] = useState("ALL")
  
  // Modal state for viewing lead details
  const [selectedLead, setSelectedLead] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Helper date formatter
  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return "—"
    try {
      if (typeof dateString === "string" && dateString.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        return dateString
      }
      const date = new Date(dateString)
      if (isNaN(date.getTime()) || date.getFullYear() === 1970) return "—"
      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const year = date.getFullYear()
      const hours = date.getHours().toString().padStart(2, "0")
      const minutes = date.getMinutes().toString().padStart(2, "0")
      return `${day}/${month}/${year} ${hours}:${minutes}`
    } catch (e) {
      return dateString
    }
  }, [])

  // Fetch all leads from enquiries table
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("enquiries")
        .select("*")
        .order("id", { ascending: false })

      if (fetchError) throw fetchError

      const mapped = (data || []).map((row) => ({
        id: row.id,
        enquiryNumber: row.enquiry_number || `EN-${row.id}`,
        timestamp: row.timestamp,
        beneficiaryName: row.beneficiary_name || "—",
        beneficiaryNumber: row.beneficiary_number || "—",
        contactNumber: row.contact_number || "—",
        address: row.address || "—",
        villageBlock: row.village_block || "—",
        district: row.district || "—",
        presentLoad: row.present_load || "—",
        bpNumber: row.bp_number || "—",
        cspdclContractDemand: row.cspdcl_contract_demand || "—",
        avgElectricityBill: row.avg_electricity_bill || "",
        futureLoadRequirement: row.future_load_requirement || "—",
        loadDetails: row.load_details || "—",
        structureType: row.structure_type || "—",
        roofType: row.roof_type || "—",
        systemType: row.system_type || "—",
        needType: row.need_type || "—",
        projectMode: row.project_mode || "—",
        firmName: row.firm_name || row.vendor_name || "—",
        paymentType: row.payment_type || "—",
        assignedBy: row.assigned_by || "—",
        reference: row.reference || "—",
        stage: row.stage || "Enquiry Received"
      }))

      setLeadData(mapped)
    } catch (err) {
      console.error("Error fetching leads:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Get unique districts & system types for filters
  const uniqueDistricts = useMemo(() => {
    const list = leadData.map((item) => item.district).filter((d) => d && d !== "—")
    return ["ALL", ...Array.from(new Set(list))]
  }, [leadData])

  const uniqueSystemTypes = useMemo(() => {
    const list = leadData.map((item) => item.systemType).filter((s) => s && s !== "—")
    return ["ALL", ...Array.from(new Set(list))]
  }, [leadData])

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leadData.filter((lead) => {
      // Search filter
      const matchesSearch = debouncedSearchTerm
        ? Object.values(lead).some(
            (val) => val && val.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          )
        : true

      // District filter
      const matchesDistrict = districtFilter === "ALL" || lead.district === districtFilter

      // System type filter
      const matchesSystem = systemFilter === "ALL" || lead.systemType === systemFilter

      return matchesSearch && matchesDistrict && matchesSystem
    })
  }, [leadData, debouncedSearchTerm, districtFilter, systemFilter])

  const handleViewLead = (lead) => {
    setSelectedLead(lead)
    setShowDetailModal(true)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center">
              <Users className="h-7 w-7 mr-2.5 text-blue-600 inline-block" />
              Lead Page
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Comprehensive list of all customer leads & enquiry records.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchLeads}
              disabled={loading}
              className="inline-flex items-center px-3.5 py-2 border border-blue-200 text-xs font-semibold rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs flex items-center space-x-3">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Total Leads</p>
              <h4 className="text-xl font-bold text-gray-900">{leadData.length}</h4>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs flex items-center space-x-3">
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Filtered Leads</p>
              <h4 className="text-xl font-bold text-gray-900">{filteredLeads.length}</h4>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs flex items-center space-x-3">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Districts Covered</p>
              <h4 className="text-xl font-bold text-gray-900">{uniqueDistricts.length - 1}</h4>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs flex items-center space-x-3">
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">System Types</p>
              <h4 className="text-xl font-bold text-gray-900">{uniqueSystemTypes.length - 1}</h4>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by Enquiry No, Name, Contact, Address, District..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white w-full"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* District Filter */}
            <div className="flex items-center space-x-1.5">
              <label className="text-xs font-medium text-gray-600">District:</label>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {uniqueDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d === "ALL" ? "All Districts" : d}
                  </option>
                ))}
              </select>
            </div>

            {/* System Filter */}
            <div className="flex items-center space-x-1.5">
              <label className="text-xs font-medium text-gray-600">System:</label>
              <select
                value={systemFilter}
                onChange={(e) => setSystemFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {uniqueSystemTypes.map((s) => (
                  <option key={s} value={s}>
                    {s === "ALL" ? "All Systems" : s}
                  </option>
                ))}
              </select>
            </div>

            {(searchTerm || districtFilter !== "ALL" || systemFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setDistrictFilter("ALL")
                  setSystemFilter("ALL")
                }}
                className="text-xs text-red-600 hover:text-red-800 font-semibold underline ml-2"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Main Leads Table */}
        <div className="rounded-xl border border-blue-100 shadow-sm bg-white overflow-hidden">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="inline-block animate-spin h-8 w-8 text-blue-600 mb-3" />
              <p className="text-blue-600 text-sm font-medium">Fetching lead records...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-6 rounded-md text-red-800 text-center text-sm border border-red-100">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p>{error}</p>
              <button className="underline mt-2 font-medium text-red-600 hover:text-red-800" onClick={fetchLeads}>
                Retry Loading
              </button>
            </div>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: "68vh" }}>
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead className="bg-gray-50 sticky top-0 z-10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 w-20">Action</th>
                    <th className="px-4 py-3.5">Enquiry No</th>
                    <th className="px-4 py-3.5">Date / Time</th>
                    <th className="px-4 py-3.5">Beneficiary Name</th>
                    <th className="px-4 py-3.5">Contact No</th>
                    <th className="px-4 py-3.5">Address</th>
                    <th className="px-4 py-3.5">Village / Block</th>
                    <th className="px-4 py-3.5">District</th>
                    <th className="px-4 py-3.5">Present Load</th>
                    <th className="px-4 py-3.5">System Type</th>
                    <th className="px-4 py-3.5">Roof / Structure</th>
                    <th className="px-4 py-3.5">Payment Type</th>
                    <th className="px-4 py-3.5">Firm / Vendor</th>
                    <th className="px-4 py-3.5">Assigned By</th>
                    <th className="px-4 py-3.5">Reference</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-xs text-gray-700">
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleViewLead(lead)}
                            className="inline-flex items-center px-2.5 py-1 border border-blue-200 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                            title="View Lead Details"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </button>
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-900">{lead.enquiryNumber}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatDateTime(lead.timestamp)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div className="flex items-center">
                            <User className="h-3.5 w-3.5 mr-1.5 text-gray-400 shrink-0" />
                            <span>{lead.beneficiaryName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <div className="flex items-center">
                            <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400 shrink-0" />
                            <span>{lead.contactNumber}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate" title={lead.address}>
                          <div className="flex items-center">
                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400 shrink-0" />
                            <span className="truncate">{lead.address}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{lead.villageBlock}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{lead.district}</td>
                        <td className="px-4 py-3">{lead.presentLoad}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                            {lead.systemType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {lead.roofType} / {lead.structureType}
                        </td>
                        <td className="px-4 py-3 font-medium text-emerald-700">{lead.paymentType}</td>
                        <td className="px-4 py-3">{lead.firmName}</td>
                        <td className="px-4 py-3">{lead.assignedBy}</td>
                        <td className="px-4 py-3">{lead.reference}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={15} className="py-12 text-center text-gray-400 font-medium">
                        No lead records match your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detailed View Modal */}
        {showDetailModal && selectedLead && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-100 transform transition-all">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="font-bold text-base flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Lead Details — {selectedLead.enquiryNumber}
                  </h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Customer: {selectedLead.beneficiaryName} | Created: {formatDateTime(selectedLead.timestamp)}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="rounded-full p-1.5 bg-white/10 hover:bg-white/20 transition-all text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-gray-700">
                {/* 1. Basic & Contact Info */}
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                  <h4 className="font-bold text-blue-900 uppercase text-[11px] tracking-wider flex items-center">
                    <User className="h-4 w-4 mr-1.5 text-blue-600" />
                    Customer & Location Info
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <span className="text-gray-500 font-medium block">Beneficiary Name</span>
                      <span className="font-bold text-gray-900 text-sm">{selectedLead.beneficiaryName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Contact Number</span>
                      <span className="font-semibold text-gray-800">{selectedLead.contactNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Beneficiary Number</span>
                      <span className="font-semibold text-gray-800">{selectedLead.beneficiaryNumber}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 font-medium block">Address</span>
                      <span className="font-medium text-gray-800">{selectedLead.address}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Village / Block</span>
                      <span className="font-medium text-gray-800">{selectedLead.villageBlock}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">District</span>
                      <span className="font-bold text-blue-700">{selectedLead.district}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Technical & Power Details */}
                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 space-y-3">
                  <h4 className="font-bold text-purple-900 uppercase text-[11px] tracking-wider flex items-center">
                    <Zap className="h-4 w-4 mr-1.5 text-purple-600" />
                    Load & Technical Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <span className="text-gray-500 font-medium block">Present Load</span>
                      <span className="font-semibold text-gray-800">{selectedLead.presentLoad}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">BP Number</span>
                      <span className="font-mono text-gray-800">{selectedLead.bpNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">CSPDCL Contract Demand</span>
                      <span className="font-semibold text-gray-800">{selectedLead.cspdclContractDemand}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Future Load Requirement</span>
                      <span className="font-semibold text-gray-800">{selectedLead.futureLoadRequirement}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">System Type</span>
                      <span className="font-bold text-purple-700">{selectedLead.systemType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Need Type</span>
                      <span className="font-semibold text-gray-800">{selectedLead.needType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Roof Type</span>
                      <span className="font-semibold text-gray-800">{selectedLead.roofType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Structure Type</span>
                      <span className="font-semibold text-gray-800">{selectedLead.structureType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Project Mode</span>
                      <span className="font-semibold text-gray-800">{selectedLead.projectMode}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Payment & Vendor Information */}
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-3">
                  <h4 className="font-bold text-emerald-900 uppercase text-[11px] tracking-wider flex items-center">
                    <Building2 className="h-4 w-4 mr-1.5 text-emerald-600" />
                    Vendor & Payment Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <span className="text-gray-500 font-medium block">Payment Type</span>
                      <span className="font-bold text-emerald-700">{selectedLead.paymentType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Firm / Vendor Name</span>
                      <span className="font-semibold text-gray-800">{selectedLead.firmName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Assigned By</span>
                      <span className="font-semibold text-gray-800">{selectedLead.assignedBy}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Reference</span>
                      <span className="font-semibold text-gray-800">{selectedLead.reference}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Electricity Bill Doc</span>
                      {selectedLead.avgElectricityBill ? (
                        <a
                          href={selectedLead.avgElectricityBill}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-bold underline inline-flex items-center mt-0.5"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View Document
                        </a>
                      ) : (
                        <span className="text-gray-400">Not Uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3.5 flex justify-end border-t border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg text-xs transition-colors"
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

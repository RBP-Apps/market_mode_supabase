import React from "react";
import {
  FileText,
  User,
  MapPin,
  Phone,
  Zap,
  Clock,
  Search,
  RefreshCw,
  CheckCircle,
  Copy,
  XCircle,
  Download,
  Eye,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
export default function QuotationListView({
  activeTab,
  setActiveTab,
  fmsData,
  filteredData,
  loading,
  searchTerm,
  setSearchTerm,
  handleRefresh,
  handleViewClick,
  handleViewQuotation,
  onOpen10kv,
  productMap = {},
  handleApproveBOM,
  handleDirectorApproval,
}) {
  const [sheetData, setSheetData] = React.useState({});
  const [selectedBOMRow, setSelectedBOMRow] = React.useState(null);
  const userRole = React.useMemo(() => sessionStorage.getItem('role') || 'user', []);

  const getBOMDisplay = (bomStr, is10kv) => {
    if (!bomStr) return "N/A";
    if (is10kv) {
      try {
        const parsed = JSON.parse(bomStr);
        if (parsed.manualInputs) {
          const inputs = parsed.manualInputs;
          return (
            <div className="text-left text-xs space-y-1">
              <p><strong>Capacity:</strong> {inputs.plantCapacity} MWp</p>
              <p><strong>Epc Rate:</strong> {inputs.epcRate}</p>
              <p><strong>Comprehensive O&M:</strong> {inputs.comprehensiveOM}</p>
              {parsed.specsDescription && <p><strong>Specs Description:</strong> {parsed.specsDescription}</p>}
            </div>
          );
        }
        if (parsed.specsData) {
          return (
            <div className="text-left text-xs space-y-1 border border-gray-100 p-2 rounded bg-gray-50/50 max-h-[300px] overflow-y-auto">
              {parsed.specsData.map((spec, i) => (
                <div key={i} className="border-b border-gray-100 pb-1 mb-1 last:border-b-0 last:pb-0">
                  <span className="font-semibold text-gray-700">{spec.component}:</span> {spec.qty} {spec.uom} <span className="text-gray-500 text-[10px]">({spec.make})</span>
                </div>
              ))}
              {parsed.specsDescription && <p className="mt-2 text-gray-600 italic"><strong>Description:</strong> {parsed.specsDescription}</p>}
            </div>
          );
        }
        return <pre className="whitespace-pre-wrap text-xs text-left bg-gray-50 p-2 rounded">{JSON.stringify(parsed, null, 2)}</pre>;
      } catch (e) {
        return <pre className="whitespace-pre-wrap text-xs text-left bg-gray-50 p-2 rounded">{bomStr}</pre>;
      }
    }
    return <pre className="whitespace-pre-wrap text-left text-xs bg-gray-50 p-2 rounded max-h-40 overflow-y-auto">{bomStr}</pre>;
  };

  const tableColumns = [
    { key: "enquiryNumber", label: "Enquiry No.", icon: FileText },
    { key: "status", label: "Status", icon: FileText },
    { key: "beneficiaryName", label: "Beneficiary Name", icon: User },
    { key: "address", label: "Address", icon: MapPin },
    { key: "villageBlock", label: "Village/Block", icon: MapPin },
    { key: "district", label: "District", icon: MapPin },
    { key: "contactNumber", label: "Contact No.", icon: Phone },
    { key: "presentLoad", label: "Present Load", icon: Zap },
    { key: "bpNumber", label: "BP No.", icon: FileText },
    { key: "cspdclContractDemand", label: "CSPDCL Demand", icon: Zap },
    {
      key: "avgElectricityBill",
      label: "Avg. Bill (6 Months)",
      icon: FileText,
    },
    { key: "futureLoadRequirement", label: "Future Load", icon: Zap },
    { key: "loadDetails", label: "Load Details", icon: FileText },
    { key: "structureType", label: "Structure Type", icon: MapPin },
    { key: "roofType", label: "Roof Type", icon: MapPin },
    { key: "systemType", label: "System Type", icon: Zap },
    { key: "needType", label: "Need Type", icon: FileText },
    { key: "projectMode", label: "Project Mode", icon: FileText },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Enquiry Management
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            View and manage enquiries for quotation creation
          </p>
        </div>

        {/* Refresh Button */}
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2 shadow-sm"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("pending")}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors duration-200 ${activeTab === "pending"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            <Clock className="h-5 w-5" />
            Pending
            <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
              {
                fmsData.filter(
                  (item) => item.planned2 && !item.actual2
                ).length
              }
            </span>
          </button>
          <button
            onClick={() => setActiveTab("bom_approval")}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors duration-200 ${activeTab === "bom_approval"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            <ClipboardList className="h-5 w-5" />
            BOM Approval
            <span className="ml-2 bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-xs font-semibold">
              {
                fmsData.filter(
                  (item) => item.planned2 && item.actual2 && item.status === "Pending"
                ).length
              }
            </span>
          </button>
          <button
            onClick={() => setActiveTab("director_approval")}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors duration-200 ${activeTab === "director_approval"
              ? "border-purple-600 text-purple-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            <ShieldCheck className="h-5 w-5 text-purple-600" />
            Director Approval
            <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-semibold">
              {
                fmsData.filter(
                  (item) => item.planned2 && item.actual2 && item.directorApproval !== "Done"
                ).length
              }
            </span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors duration-200 ${activeTab === "history"
              ? "border-green-500 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            <CheckCircle className="h-5 w-5" />
            History
            <span className="ml-2 bg-green-100 text-green-600 px-2 py-0.5 rounded-full text-xs">
              {
                fmsData.filter(
                  (item) => item.planned2 && item.actual2 && item.status !== "Pending"
                ).length
              }
            </span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Enquiry No., Beneficiary Name, Contact No., District, BP No...."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* Table with fixed header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10 text-center">
              <tr>
                {activeTab === "bom_approval" ? (
                  <>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-48 bg-gray-50 whitespace-normal min-w-[180px]">
                      Action
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 whitespace-normal min-w-[150px]">
                      <div className="flex items-center justify-center gap-1">
                        <FileText className="h-3 w-3" />
                        Quotation No.
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 whitespace-normal min-w-[150px]">
                      <div className="flex items-center justify-center gap-1">
                        <User className="h-3 w-3" />
                        Customer Name
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 whitespace-normal min-w-[150px]">
                      <div className="flex items-center justify-center gap-1">
                        <User className="h-3 w-3" />
                        Submitted By
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 whitespace-normal min-w-[150px]">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        Submission Date
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 whitespace-normal min-w-[150px]">
                      <div className="flex items-center justify-center gap-1">
                        <FileText className="h-3 w-3" />
                        Status
                      </div>
                    </th>
                  </>
                ) : activeTab === "director_approval" ? (
                  <>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-purple-900 uppercase tracking-wider w-52 bg-purple-50 whitespace-normal min-w-[200px]">
                      Action (Director Approval)
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 whitespace-normal min-w-[150px]">
                      <div className="flex items-center justify-center gap-1">
                        <FileText className="h-3 w-3" />
                        Quotation No.
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 whitespace-normal min-w-[150px]">
                      <div className="flex items-center justify-center gap-1">
                        <User className="h-3 w-3" />
                        Customer Name
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 whitespace-normal min-w-[150px]">
                      <div className="flex items-center justify-center gap-1">
                        <Phone className="h-3 w-3" />
                        Contact No.
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 whitespace-normal min-w-[150px]">
                      <div className="flex items-center justify-center gap-1">
                        <Zap className="h-3 w-3" />
                        Product / Capacity
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 whitespace-normal min-w-[150px]">
                      <div className="flex items-center justify-center gap-1">
                        <User className="h-3 w-3" />
                        Salesperson
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 whitespace-normal min-w-[150px]">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        Submission Date
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 whitespace-normal min-w-[150px]">
                      <div className="flex items-center justify-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-purple-600" />
                        Approval Status
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 whitespace-normal min-w-[150px]">
                      <div className="flex items-center justify-center gap-1">
                        <Copy className="h-3 w-3" />
                        Quotation Copy
                      </div>
                    </th>
                  </>
                ) : (
                  <>
                    {/* Pending tab Action column */}
                    {activeTab === "pending" && (
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20 bg-gray-50 whitespace-normal min-w-[100px]">
                        Action
                      </th>
                    )}

                    {/* History tab Action column */}
                    {(activeTab === "history" || activeTab === "10kv_history") && (
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-28 bg-gray-50 whitespace-normal min-w-[100px]">
                        Action
                      </th>
                    )}

                    {(activeTab === "history" || activeTab === "10kv_history") && (
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32 bg-gray-50 whitespace-normal min-w-[120px]">
                        <div className="flex items-center justify-center gap-1">
                          <FileText className="h-3 w-3" />
                          PDF Generate From Sheet
                        </div>
                      </th>
                    )}

                    {/* Baaki saare columns */}
                    {tableColumns.map((column) => (
                      <th
                        key={column.key}
                        className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-normal min-w-[150px] bg-gray-50"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <column.icon className="h-3 w-3" />
                          {column.label}
                        </div>
                      </th>
                    ))}
                  </>
                )}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200 text-center">
              {loading ? (
                <tr>
                  <td
                    colSpan={
                      activeTab === "pending"
                        ? tableColumns.length + 1
                        : activeTab === "bom_approval"
                          ? 6
                          : activeTab === "director_approval"
                            ? 9
                            : (activeTab === "history" || activeTab === "10kv_history")
                              ? tableColumns.length + 3
                              : tableColumns.length
                    }
                    className="px-6 py-12"
                  >
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-500">
                        Loading enquiries...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      activeTab === "pending"
                        ? tableColumns.length + 1
                        : activeTab === "bom_approval"
                          ? 6
                          : activeTab === "director_approval"
                            ? 9
                            : (activeTab === "history" || activeTab === "10kv_history")
                              ? tableColumns.length + 3
                              : tableColumns.length
                    }
                    className="px-6 py-12"
                  >
                    <div className="text-center">
                      <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 text-lg">
                        No enquiries found
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {activeTab === "pending"
                          ? "No pending enquiries with Planned date"
                          : activeTab === "bom_approval"
                            ? "No BOM approvals pending"
                            : activeTab === "director_approval"
                              ? "No Director approvals pending"
                              : "No history records found"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    {activeTab === "bom_approval" ? (
                      <>
                        <td className="px-6 py-4 whitespace-normal text-center min-w-[180px]">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => setSelectedBOMRow(row)}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
                              title="View BOM Details"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View BOM
                            </button>
                            {userRole === 'admin' ? (
                              <button
                                onClick={() => handleApproveBOM(row.enquiryNumber, row.is10kv)}
                                className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium shadow-sm animate-pulse hover:animate-none"
                                title="Approve BOM"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </button>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                Pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm font-medium text-gray-900 min-w-[150px]">
                          {row.enquiryNumber || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-900 min-w-[150px]">
                          {row.beneficiaryName || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.salesperson || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.quotationDate ? new Date(row.quotationDate).toLocaleDateString('en-IN') : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm min-w-[150px]">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {row.status || "Pending"}
                          </span>
                        </td>
                      </>
                    ) : activeTab === "director_approval" ? (
                      <>
                        <td className="px-6 py-4 whitespace-normal text-center min-w-[200px]">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleDirectorApproval && handleDirectorApproval(row.enquiryNumber, 'Done')}
                              className={`inline-flex items-center px-3 py-1.5 rounded-lg transition-colors duration-200 text-xs font-bold shadow-xs ${
                                row.directorApproval === 'Done'
                                  ? 'bg-emerald-600 text-white cursor-default'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-300'
                              }`}
                              title="Approve Quotation (Done)"
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Done
                            </button>
                            <button
                              onClick={() => handleDirectorApproval && handleDirectorApproval(row.enquiryNumber, 'Not Done')}
                              className={`inline-flex items-center px-3 py-1.5 rounded-lg transition-colors duration-200 text-xs font-bold shadow-xs ${
                                row.directorApproval === 'Not Done'
                                  ? 'bg-red-600 text-white cursor-default'
                                  : 'bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-300'
                              }`}
                              title="Mark Not Done"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Not Done
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm font-semibold text-blue-900 min-w-[150px]">
                          {row.enquiryNumber || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm font-medium text-gray-900 min-w-[150px]">
                          {row.beneficiaryName || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-600 min-w-[150px]">
                          {row.contactNumber || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-purple-700 font-medium min-w-[150px]">
                          {row.product || row.presentLoad || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-600 min-w-[150px]">
                          {row.salesperson || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.quotationDate ? new Date(row.quotationDate).toLocaleDateString('en-IN') : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm min-w-[150px]">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            row.directorApproval === 'Done'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : row.directorApproval === 'Not Done'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}>
                            {row.directorApproval || "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm min-w-[150px]">
                          {row.quotationCopy ? (
                            <a
                              href={row.quotationCopy}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-semibold underline inline-flex items-center gap-1"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              View Copy
                            </a>
                          ) : (
                            <span className="text-gray-400">Not Generated</span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Pending tab ka Action button */}
                        {activeTab === "pending" && (
                          <td className="px-6 py-4 whitespace-normal text-center min-w-[100px]">
                            <button
                              onClick={() => handleViewClick(row)}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
                              title="Create Quotation"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </button>
                          </td>
                        )}

                        {/* History or 10kv History tab ka Action button */}
                        {(activeTab === "history" || activeTab === "10kv_history") && (
                          <td className="px-6 py-4 whitespace-normal text-center min-w-[100px]">
                            <button
                              onClick={() => handleViewQuotation(row)}
                              className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors duration-200 text-sm font-medium"
                              title="Send Quotation"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Send
                            </button>
                          </td>
                        )}

                        {(activeTab === "history" || activeTab === "10kv_history") && (
                          <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[120px]">
                            {row.quotationCopy &&
                              row.quotationCopy !== "Not Generated" ? (
                              <a
                                href={row.quotationCopy}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 justify-center"
                              >
                                <Copy className="h-4 w-4" />
                                View Quotation
                              </a>
                            ) : (
                              <span className="text-gray-400">Not Generated</span>
                            )}
                          </td>
                        )}

                        {/* Baaki ke columns */}
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-900 min-w-[150px]">
                          {row.enquiryNumber || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm min-w-[150px]">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            row.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {row.status || "Approved"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-900 min-w-[150px]">
                          {row.beneficiaryName || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.address || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.villageBlock || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.district || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.contactNumber || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.presentLoad || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.bpNumber || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.cspdclContractDemand || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.avgElectricityBill ? (
                            <button
                              onClick={() => window.open(row.avgElectricityBill, "_blank")}
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              View
                            </button>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.futureLoadRequirement || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.loadDetails || "N/A"}
                        </td>
                       
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.structureType || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.roofType || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.systemType || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.needType || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500 min-w-[150px]">
                          {row.projectMode || "N/A"}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Count */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>
              Showing {filteredData.length} of{" "}
              {activeTab === "pending"
                ? fmsData.filter((item) => item.planned2 && !item.actual2).length
                : activeTab === "bom_approval"
                  ? fmsData.filter((item) => item.planned2 && item.actual2 && item.status === "Pending").length
                  : activeTab === "director_approval"
                    ? fmsData.filter((item) => item.planned2 && item.actual2 && item.directorApproval !== "Done").length
                    : activeTab === "history"
                      ? fmsData.filter((item) => item.planned2 && item.actual2 && item.status !== "Pending" && !item.is10kv).length
                      : fmsData.filter((item) => item.planned2 && item.actual2 && item.status !== "Pending" && item.is10kv).length}{" "}
              records
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-blue-500" />
                Pending:{" "}
                {
                  fmsData.filter(
                    (item) => item.planned2 && !item.actual2
                  ).length
                }
              </span>
              <span className="flex items-center gap-1">
                <ClipboardList className="h-4 w-4 text-amber-500" />
                BOM Approval:{" "}
                {
                  fmsData.filter(
                    (item) => item.planned2 && item.actual2 && item.status === "Pending"
                  ).length
                }
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-purple-500" />
                Director Approval:{" "}
                {
                  fmsData.filter(
                    (item) => item.planned2 && item.actual2 && item.directorApproval !== "Done"
                  ).length
                }
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                History:{" "}
                {
                  fmsData.filter(
                    (item) => item.planned2 && item.actual2 && item.status !== "Pending" && !item.is10kv
                  ).length
                }
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-teal-500" />
                10kv History:{" "}
                {
                  fmsData.filter(
                    (item) => item.planned2 && item.actual2 && item.status !== "Pending" && item.is10kv
                  ).length
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end mt-4">
        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2 shadow-sm">
          <Download className="h-4 w-4" />
          Export to Excel
        </button>
      </div>

      {/* BOM Comparison Modal */}
      {selectedBOMRow && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
              <div>
                <h3 className="text-xl font-bold">BOM Comparison Details</h3>
                <p className="text-indigo-100 text-xs mt-1">
                  Enquiry No: <span className="font-semibold">{selectedBOMRow.enquiryNumber}</span> | Customer: <span className="font-semibold">{selectedBOMRow.beneficiaryName}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedBOMRow(null)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Quotation Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="text-xs text-gray-500 uppercase font-semibold">Submitted By</span>
                  <p className="text-sm font-medium text-gray-800">{selectedBOMRow.salesperson || "N/A"}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase font-semibold">Submission Date</span>
                  <p className="text-sm font-medium text-gray-800">
                    {selectedBOMRow.quotationDate ? new Date(selectedBOMRow.quotationDate).toLocaleDateString('en-IN') : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase font-semibold">Rating / Capacity</span>
                  <p className="text-sm font-medium text-gray-800">{selectedBOMRow.product || "N/A"}</p>
                </div>
              </div>

              {/* BOM Comparison Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original BOM */}
                <div className="flex flex-col h-full">
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                    Original BOM
                  </h4>
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 flex-1 min-h-[200px] overflow-y-auto max-h-[350px] custom-scrollbar">
                    {getBOMDisplay(productMap[selectedBOMRow.product]?.bom || "", selectedBOMRow.is10kv)}
                  </div>
                </div>

                {/* Modified BOM */}
                <div className="flex flex-col h-full">
                  <h4 className="font-semibold text-indigo-700 mb-2 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    Modified BOM
                  </h4>
                  <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/10 flex-1 min-h-[200px] overflow-y-auto max-h-[350px] custom-scrollbar">
                    {getBOMDisplay(selectedBOMRow.billOfMaterial, selectedBOMRow.is10kv)}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-150 shrink-0">
              <button
                onClick={() => setSelectedBOMRow(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all font-medium text-sm"
              >
                Close
              </button>
              {userRole === 'admin' && (
                <button
                  onClick={() => {
                    handleApproveBOM(selectedBOMRow.enquiryNumber, selectedBOMRow.is10kv);
                    setSelectedBOMRow(null);
                  }}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-semibold text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve BOM
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

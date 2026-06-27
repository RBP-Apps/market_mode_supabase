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
}) {
  const [sheetData, setSheetData] = React.useState({});

  

  const tableColumns = [
    { key: "enquiryNumber", label: "Enquiry No.", icon: FileText },
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
    { key: "hoursOfFailure", label: "Hours of Failure", icon: Clock },
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

        {/* 10kv Quotation Button & Refresh Button */}
        <div className="flex gap-2">
          <button
            onClick={onOpen10kv}
            className="px-4 py-2 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 hover:border-teal-300 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm font-medium animate-pulse"
          >
            <Zap className="h-4 w-4 text-teal-600" />
            10kv Quotation
          </button>
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
                  (item) => item.planned2 && item.actual2 && !item.is10kv
                ).length
              }
            </span>
          </button>
          <button
            onClick={() => setActiveTab("10kv_history")}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors duration-200 ${activeTab === "10kv_history"
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            <Zap className="h-5 w-5" />
            10kv History
            <span className="ml-2 bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full text-xs">
              {
                fmsData.filter(
                  (item) => item.planned2 && item.actual2 && item.is10kv
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
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50 sticky top-0 z-10 text-center text-nowrap">
              <tr>
                {/* Pending tab Action column */}
                {activeTab === "pending" && (
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 bg-gradient-to-r from-gray-50 to-blue-50">
                    Action
                  </th>
                )}

                {/* History tab Action column */}
                {(activeTab === "history" || activeTab === "10kv_history") && (
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 bg-gradient-to-r from-gray-50 to-blue-50">
                    Action
                  </th>
                )}

               

                {(activeTab === "history" || activeTab === "10kv_history") && (
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32 bg-gradient-to-r from-gray-50 to-blue-50">
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
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gradient-to-r from-gray-50 to-blue-50"
                  >
                    <div className="flex items-center gap-1">
                      <column.icon className="h-3 w-3" />
                      {column.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200 text-center">
              {loading ? (
                <tr>
                  <td
                    colSpan={
                      activeTab === "pending" 
                        ? tableColumns.length + 1 
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
                    {/* Pending tab ka Action button */}
                    {activeTab === "pending" && (
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.quotationCopy &&
                          row.quotationCopy !== "Not Generated" ? (
                          <a
                            href={row.quotationCopy}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.enquiryNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.beneficiaryName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.address || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.villageBlock || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.district || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.contactNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.presentLoad || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.bpNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.cspdclContractDemand || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.futureLoadRequirement || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.loadDetails || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.hoursOfFailure || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.structureType || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.roofType || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.systemType || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.needType || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.projectMode || "N/A"}
                    </td>
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
                : activeTab === "history"
                ? fmsData.filter((item) => item.planned2 && item.actual2 && !item.is10kv).length
                : fmsData.filter((item) => item.planned2 && item.actual2 && item.is10kv).length}{" "}
 
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
                <CheckCircle className="h-4 w-4 text-green-500" />
                History:{" "}
                {
                  fmsData.filter(
                    (item) => item.planned2 && item.actual2 && !item.is10kv
                  ).length
                }
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-teal-500" />
                10kv History:{" "}
                {
                  fmsData.filter(
                    (item) => item.planned2 && item.actual2 && item.is10kv
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
    </>
  );
}

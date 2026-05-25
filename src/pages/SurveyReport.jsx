"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, Upload, X, Search, History, ArrowLeft, FileText, MapPin, Users, Phone, Zap, Building, Eye, DollarSign, Clock, Home, Wrench, Trash2 } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

// Configuration object
const CONFIG = {

  PAGE_CONFIG: {
    title: "Site Survey",
    historyTitle: "FMS Survey History",
    description: "Manage pending survey tasks",
    historyDescription: "View completed survey records",
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
  const [showSurveyModal, setShowSurveyModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Survey form state
  const [surveyForm, setSurveyForm] = useState({
    status: "",
    copySurveyReport: null,
    geotagPhoto: null,
    electricityBill: null,
    aadharNumber: "",
    panNumber: "",
    addressProof: null,
    surveyorName: "",
    contactNumber: ""
  })

  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return ""
    // If it's already in DD/MM/YYYY HH:mm:ss format, return it
    if (typeof dateString === "string" && dateString.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/)) return dateString

    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const seconds = date.getSeconds().toString().padStart(2, "0")
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

  // Fetch dropdown values for status
  const fetchDropdownValues = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("dropdown")
        .select("status");

      if (error) throw error;

      const options = data
        .map((item) => item.status)
        .filter((val) => val && val.trim() !== "");

      setStatusOptions(options);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      setStatusOptions(["Completed", "Pending", "In Progress", "Rejected"]);
    }
  }, []);


  // Optimized data fetching
  const fetchSheetData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await fetchDropdownValues();

      const { data, error } = await supabase
        .from("fms")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;

      const pending = [];
      const history = [];

      data.forEach((row, index) => {
        const enquiryNumber = row.enquiry_number || "";

        const columnT = row.planned_1;
        const columnU = row.actual_1;

        const hasColumnT = !isEmpty(columnT);
        const hasColumnU = !isEmpty(columnU);

        if (!hasColumnT) return;

        const stableId = enquiryNumber
          ? `enquiry_${enquiryNumber}_${row.id}`
          : `row_${row.id}`;

        const rowData = {
          _id: stableId,
          _rowIndex: row.id,
          _enquiryNumber: enquiryNumber,

          col1: row.enquiry_number,
          col2: row.beneficiary_name,
          col3: row.address,
          col4: row.village_block,
          col5: row.district,
          col6: row.contact_number,

          // ✅ ADD THIS PART
          col7: row.present_load,
          col8: row.bp_number,
          col9: row.cspdcl_contract_demand,
          col10: row.avg_electricity_bill,
          col11: row.future_load_requirement,
          col12: row.load_details,
          col13: row.failure_hours,

          col14: row.structure_type,
          col15: row.roof_type,
          col16: row.system_type,
          col17: row.need_type,
          col18: row.project_mode,

          col19: row.planned_1,
          col20: formatDateTime(row.actual_1),
          col22: row.status_1,

          col23: row.survey_report,
          col24: row.geotag_photo,
          col25: row.bill_copy,
          col26: row.aadhar_card,
          col27: row.pan_card,
          col28: row.address_proof,
          col29: row.surveyor_name,
          col30: row.surveyor_contact,
        };

        if (!hasColumnU) {
          pending.push(rowData);
        } else {
          history.push(rowData);
        }
      });

      setPendingData(pending);
      setHistoryData(history);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load FMS data: " + error.message);
      setLoading(false);
    }
  }, [fetchDropdownValues, isEmpty]);



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

  const handleSurveyClick = useCallback((record) => {
    setSelectedRecord(record)
    setSurveyForm({
      status: record.col22 || "",
      copySurveyReport: null,
      geotagPhoto: null,
      electricityBill: null,
      aadharNumber: record.col26 || "",
      panNumber: record.col27 || "",
      addressProof: null,
      surveyorName: record.col29 || "",
      contactNumber: record.col30 || ""
    })
    setShowSurveyModal(true)
  }, [])

  const handleFileUpload = useCallback((field, file) => {
    setSurveyForm(prev => ({ ...prev, [field]: file }))
  }, [])

  const handleInputChange = useCallback((field, value) => {
    setSurveyForm(prev => ({ ...prev, [field]: value }))
  }, [])


  const uploadImageToDrive = useCallback(async (file) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${selectedRecord._enquiryNumber}_${Date.now()}.${fileExt}`;
      const filePath = `survey/${fileName}`;

      const { error } = await supabase.storage
        .from("survey_file")
        .upload(filePath, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from("survey_file")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }, [selectedRecord]);

  const handleSurveySubmit = async () => {
    if (!surveyForm.status) {
      alert("Please select a status");
      return;
    }

    setIsSubmitting(true);

    try {
      let copySurveyReportUrl = selectedRecord.col23 || "";
      let geotagPhotoUrl = selectedRecord.col24 || "";
      let electricityBillUrl = selectedRecord.col25 || "";
      let addressProofUrl = selectedRecord.col28 || "";

      if (surveyForm.copySurveyReport) {
        copySurveyReportUrl = await uploadImageToDrive(surveyForm.copySurveyReport);
      }
      if (surveyForm.geotagPhoto) {
        geotagPhotoUrl = await uploadImageToDrive(surveyForm.geotagPhoto);
      }
      if (surveyForm.electricityBill) {
        electricityBillUrl = await uploadImageToDrive(surveyForm.electricityBill);
      }
      if (surveyForm.addressProof) {
        addressProofUrl = await uploadImageToDrive(surveyForm.addressProof);
      }

      const isEdit = !isEmpty(selectedRecord.col20);

      const now = new Date();
      const currentTimestamp = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const updatePayload = {
        status_1: surveyForm.status,
        survey_report: copySurveyReportUrl,
        geotag_photo: geotagPhotoUrl,
        bill_copy: electricityBillUrl,
        aadhar_card: surveyForm.aadharNumber,
        pan_card: surveyForm.panNumber,
        address_proof: addressProofUrl,
        surveyor_name: surveyForm.surveyorName,
        surveyor_contact: surveyForm.contactNumber,
      };

      // only set actual_1 if new entry
      if (!isEdit) {
        updatePayload.actual_1 = new Date().toISOString();
      }

      const { error } = await supabase
        .from("fms")
        .update(updatePayload)
        .eq("id", selectedRecord._rowIndex);

      if (error) throw error;

      const updatedRecord = {
        ...selectedRecord,
        col20: isEdit ? selectedRecord.col20 : currentTimestamp,
        col22: surveyForm.status,
        col23: copySurveyReportUrl,
        col24: geotagPhotoUrl,
        col25: electricityBillUrl,
        col26: surveyForm.aadharNumber,
        col27: surveyForm.panNumber,
        col28: addressProofUrl,
        col29: surveyForm.surveyorName,
        col30: surveyForm.contactNumber,
      };

      if (isEdit) {
        setHistoryData(prev =>
          prev.map(rec => rec._id === selectedRecord._id ? updatedRecord : rec)
        );
      } else {
        setPendingData(prev =>
          prev.filter(record => record._id !== selectedRecord._id)
        );
        setHistoryData(prev => [updatedRecord, ...prev]);
      }

      setShowSurveyModal(false);
      setSuccessMessage(`Survey completed for Enquiry: ${selectedRecord._enquiryNumber}`);

      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (error) {
      console.error("Error submitting survey:", error);
      alert("Failed: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSection = useCallback((section) => {
    setShowHistory(section === 'history')
    setSearchTerm("")
  }, [])

  // Delete functionality
  const handleDeleteClick = useCallback((record) => {
    setRecordToDelete(record)
    setShowDeleteModal(true)
  }, [])

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false)
    setRecordToDelete(null)
  }, [])

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("fms")
        .delete()
        .eq("id", recordToDelete._rowIndex);

      if (error) throw error;

      setHistoryData(prev =>
        prev.filter(record => record._id !== recordToDelete._id)
      );

      setSuccessMessage(`Deleted Enquiry: ${recordToDelete._enquiryNumber}`);

      setTimeout(() => setSuccessMessage(""), 3000);

      setShowDeleteModal(false);
      setRecordToDelete(null);

    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const closeSurveyModal = useCallback(() => {
    setShowSurveyModal(false)
    setSelectedRecord(null)
    setSurveyForm({
      status: "",
      copySurveyReport: null,
      geotagPhoto: null,
      electricityBill: null,
      aadharNumber: "",
      panNumber: "",
      addressProof: null,
      surveyorName: "",
      contactNumber: ""
    })
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-xl font-bold tracking-tight text-blue-700">
            {CONFIG.PAGE_CONFIG.title}
          </h1>

          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={showHistory ? "Search history..." : "Search pending surveys..."}
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
            onClick={() => toggleSection('pending')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${!showHistory
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Pending Surveys ({filteredPendingData.length})
            </div>
          </button>
          <button
            onClick={() => toggleSection('history')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${showHistory
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center">
              <History className="h-4 w-4 mr-2" />
              Survey History ({filteredHistoryData.length})
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
                  Completed FMS Surveys
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Pending FMS Surveys
                </>
              )}
            </h2>
            <p className="text-blue-600 text-xs">
              {showHistory
                ? CONFIG.PAGE_CONFIG.historyDescription
                : CONFIG.PAGE_CONFIG.description}
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
            <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10 text-nowrap text-center">
                  <tr>
                    {showHistory && (
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                      </th>
                    )}
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
                      Contact Number
                    </th>
                    {showHistory ? (
                      <>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Survey Report
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Geotag Photo
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Electricity Bill
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aadhar
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PAN
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address Proof
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Surveyor
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Present Load
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          BP Number
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CSPDCL Contract Demand
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last 6 Months Avg Bill
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Future Load Requirement
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Load Details/Application
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          No Of Hours Of Failure
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Structure Type
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Roof Type
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          System Type
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Need Type
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project Mode
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
                          <td className="px-2 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteClick(record)}
                              className="inline-flex items-center justify-center p-1.5 border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleSurveyClick(record)}
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
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {record.col22 || "—"}
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
                        <td colSpan={17} className="px-4 py-8 text-center text-gray-500 text-sm">
                          {searchTerm
                            ? "No history records matching your search"
                            : "No completed surveys found"}
                        </td>
                      </tr>
                    )
                  ) : (
                    filteredPendingData.length > 0 ? (
                      filteredPendingData.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50">
                          <td className="px-2 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleSurveyClick(record)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Survey
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
                            <div className="text-xs text-gray-900 flex items-center">
                              <Zap className="h-3 w-3 mr-1 text-yellow-500" />
                              {record.col7 || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.col8 || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900 flex items-center">
                              <Building className="h-3 w-3 mr-1 text-gray-400" />
                              {record.col9 || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            {record.col10 ? (
                              <a
                                href={record.col10}
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
                            <div className="text-xs text-gray-900 flex items-center">
                              <Zap className="h-3 w-3 mr-1 text-blue-500" />
                              {record.col11 || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 max-w-xs">
                            <div className="text-xs text-gray-900 truncate" title={record.col12}>
                              {record.col12 || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900 flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-red-500" />
                              {record.col13 || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900 flex items-center">
                              <Building className="h-3 w-3 mr-1 text-gray-400" />
                              {record.col14 || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900 flex items-center">
                              <Home className="h-3 w-3 mr-1 text-brown-500" />
                              {record.col15 || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900 flex items-center">
                              <Wrench className="h-3 w-3 mr-1 text-purple-500" />
                              {record.col16 || "—"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.col17 || "—"}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.col18 || "—"}</div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={19} className="px-4 py-8 text-center text-gray-500 text-sm">
                          {searchTerm
                            ? "No pending surveys matching your search"
                            : "No pending surveys found"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Survey Modal with Transparent Background */}
        {showSurveyModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white border max-w-2xl w-full shadow-2xl rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Survey Form - Enquiry: {selectedRecord.col1}
                  </h3>
                  <button
                    onClick={closeSurveyModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2 text-sm">Beneficiary Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium">Name:</span> {selectedRecord.col2}
                    </div>
                    <div>
                      <span className="font-medium">Contact:</span> {selectedRecord.col6}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Address:</span> {selectedRecord.col3}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status Dropdown */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={surveyForm.status}
                      onChange={(e) => handleInputChange("status", e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    >
                      <option value="">Select</option>
                      {statusOptions.map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Copy Survey Report */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Copy Survey Report
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload("copySurveyReport", e.target.files[0])}
                        className="mt-1 block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {surveyForm.copySurveyReport && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ New file: {surveyForm.copySurveyReport.name}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center pt-5">
                      {selectedRecord?.col23 ? (
                        <a
                          href={selectedRecord.col23}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 border border-blue-200 rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all shadow-sm"
                          title="View Previous Survey Report"
                        >
                          <Eye className="h-5 w-5" />
                        </a>
                      ) : (
                        <div
                          className="p-2 border border-gray-200 rounded-md text-gray-300 bg-gray-50 cursor-not-allowed"
                          title="No previous file"
                        >
                          <Eye className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Geotag Photo Site */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Geotag Photo Site
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload("geotagPhoto", e.target.files[0])}
                        className="mt-1 block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {surveyForm.geotagPhoto && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ New file: {surveyForm.geotagPhoto.name}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center pt-5">
                      {selectedRecord?.col24 ? (
                        <a
                          href={selectedRecord.col24}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 border border-blue-200 rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all shadow-sm"
                          title="View Previous Geotag Photo"
                        >
                          <Eye className="h-5 w-5" />
                        </a>
                      ) : (
                        <div
                          className="p-2 border border-gray-200 rounded-md text-gray-300 bg-gray-50 cursor-not-allowed"
                          title="No previous file"
                        >
                          <Eye className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Three Months Electricity Bill Copy */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Three Months Electricity Bill Copy
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload("electricityBill", e.target.files[0])}
                        className="mt-1 block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {surveyForm.electricityBill && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ New file: {surveyForm.electricityBill.name}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center pt-5">
                      {selectedRecord?.col25 ? (
                        <a
                          href={selectedRecord.col25}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 border border-blue-200 rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all shadow-sm"
                          title="View Previous Electricity Bill"
                        >
                          <Eye className="h-5 w-5" />
                        </a>
                      ) : (
                        <div
                          className="p-2 border border-gray-200 rounded-md text-gray-300 bg-gray-50 cursor-not-allowed"
                          title="No previous file"
                        >
                          <Eye className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Aadhar Card */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Aadhar Card Number
                    </label>
                    <input
                      type="text"
                      value={surveyForm.aadharNumber}
                      onChange={(e) => handleInputChange("aadharNumber", e.target.value)}
                      placeholder="Enter Aadhar number"
                      maxLength="12"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  {/* Pan Card */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      PAN Card Number
                    </label>
                    <input
                      type="text"
                      value={surveyForm.panNumber}
                      onChange={(e) => handleInputChange("panNumber", e.target.value.toUpperCase())}
                      placeholder="Enter PAN number"
                      maxLength="10"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  {/* Address Proof */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Address Proof
                        <span className="text-gray-500 text-xs ml-1">(Aadhar/PAN image)</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload("addressProof", e.target.files[0])}
                        className="mt-1 block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {surveyForm.addressProof && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ New file: {surveyForm.addressProof.name}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center pt-5">
                      {selectedRecord?.col28 ? (
                        <a
                          href={selectedRecord.col28}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 border border-blue-200 rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all shadow-sm"
                          title="View Previous Address Proof"
                        >
                          <Eye className="h-5 w-5" />
                        </a>
                      ) : (
                        <div
                          className="p-2 border border-gray-200 rounded-md text-gray-300 bg-gray-50 cursor-not-allowed"
                          title="No previous file"
                        >
                          <Eye className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Surveyor Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Surveyor Name
                    </label>
                    <input
                      type="text"
                      value={surveyForm.surveyorName}
                      onChange={(e) => handleInputChange("surveyorName", e.target.value)}
                      placeholder="Enter surveyor name"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  {/* Contact Number */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={surveyForm.contactNumber}
                      onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                      placeholder="Enter contact number"
                      maxLength="10"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-3 border-t">
                  <button
                    onClick={closeSurveyModal}
                    disabled={isSubmitting}
                    className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSurveySubmit}
                    disabled={isSubmitting || !surveyForm.status}
                    className="px-3 py-1 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-md hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Survey"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && recordToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white border max-w-md w-full shadow-2xl rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                  Delete Record
                </h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Are you sure you want to delete this record? This action cannot be undone.
                </p>
                <div className="bg-gray-50 rounded-md p-3 mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Enquiry Number:</span> {recordToDelete._enquiryNumber || recordToDelete.col1}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Beneficiary:</span> {recordToDelete.col2 || "—"}
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeDeleteModal}
                    disabled={isDeleting}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
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
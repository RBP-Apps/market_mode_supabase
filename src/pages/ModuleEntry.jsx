"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, X, Search, History, Upload, Loader2, FileText, ListChecks, Calendar, Clock } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"
import Papa from "papaparse"


// Configuration object
const CONFIG = {
    PAGE_CONFIG: {
        title: "Module Entry",
        historyTitle: "Module Entry History",
        description: "Upload CSV file for module entry",
        historyDescription: "View completed module entry uploads",
    },
    COLUMNS: {
        ACTUAL_TIMESTAMP: 176, // FU
        FILE_URL: 178, // FW
    }
}

// Debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value)
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(handler)
    }, [value, delay])
    return debouncedValue
}

function ModuleEntryPage() {
    const [pendingData, setPendingData] = useState([])
    const [historyData, setHistoryData] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showHistory, setShowHistory] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState("")
    const [showModal, setShowModal] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)
    const [csvFile, setCsvFile] = useState(null)

    const debouncedSearchTerm = useDebounce(searchTerm, 300)

    const formatDisplayTimestamp = useCallback((rawTimestamp) => {
        if (!rawTimestamp) return { date: "—", time: "" }
        try {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            const str = rawTimestamp.toString().trim()
            // Handle "DD/MM/YYYY HH:MM:SS" format
            const parts = str.split(" ")
            const dateParts = parts[0]?.split("/")
            if (dateParts && dateParts.length === 3) {
                const day = parseInt(dateParts[0], 10)
                const monthIndex = parseInt(dateParts[1], 10) - 1
                const year = dateParts[2]
                const timePart = parts[1] || ""
                let timeDisplay = ""
                if (timePart) {
                    const [h, m] = timePart.split(":")
                    const hour = parseInt(h, 10)
                    const ampm = hour >= 12 ? "PM" : "AM"
                    const hour12 = hour % 12 || 12
                    timeDisplay = `${hour12.toString().padStart(2, "0")}:${m} ${ampm}`
                }
                return { date: `${day} ${months[monthIndex]} ${year}`, time: timeDisplay }
            }
            // Fallback: try parsing as a JS Date
            const d = new Date(str)
            if (!isNaN(d.getTime())) {
                const day = d.getDate()
                const month = months[d.getMonth()]
                const year = d.getFullYear()
                const hour = d.getHours()
                const ampm = hour >= 12 ? "PM" : "AM"
                const hour12 = hour % 12 || 12
                const mins = d.getMinutes().toString().padStart(2, "0")
                return { date: `${day} ${month} ${year}`, time: `${hour12.toString().padStart(2, "0")}:${mins} ${ampm}` }
            }
            return { date: str, time: "" }
        } catch {
            return { date: rawTimestamp.toString(), time: "" }
        }
    }, [])

    const isEmpty = useCallback((value) => !value || (typeof value === "string" && value.trim() === ""), [])

    const fetchSheetData = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const { data, error } = await supabase
                .from("fms")
                .select("enquiry_number, beneficiary_name, actual_18, url")
                .not("enquiry_number", "is", null)

            if (error) throw error

            const pending = []
            const history = []

            data.forEach((row) => {
                const rowData = {
                    _id: `mod_${row.enquiry_number}`,
                    _enquiryNumber: row.enquiry_number,

                    enquiryNumber: row.enquiry_number || "",
                    beneficiaryName: row.beneficiary_name || "",

                    actual: row.actual_18 || "",
                    fileUrl: row.url || "",
                }

                if (isEmpty(row.actual_18)) {
                    pending.push(rowData)
                } else {
                    history.push(rowData)
                }
            })

            const sortByEnquiry = (a, b) =>
                a.enquiryNumber.localeCompare(b.enquiryNumber, undefined, { numeric: true })

            setPendingData(pending.sort(sortByEnquiry))
            setHistoryData(history.sort(sortByEnquiry))

        } catch (e) {
            console.error("Fetch error:", e)
            setError("Failed to load Module Entry data")
        } finally {
            setLoading(false)
        }
    }, [isEmpty])




    useEffect(() => { fetchSheetData() }, [fetchSheetData])

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(""), 4000)
            return () => clearTimeout(timer)
        }
    }, [successMessage])

    const filteredData = useMemo(() => {
        const data = showHistory ? historyData : pendingData
        return debouncedSearchTerm
            ? data.filter(r => Object.values(r).some(v => v?.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())))
            : data
    }, [showHistory, pendingData, historyData, debouncedSearchTerm])


    const uploadFileToSupabase = useCallback(async (file, enquiryNumber) => {
        try {
            const fileName = `${enquiryNumber}_module_${Date.now()}.csv`

            const { error } = await supabase.storage
                .from("module_uploads")
                .upload(fileName, file)

            if (error) throw error

            const { data } = supabase.storage
                .from("module_uploads")
                .getPublicUrl(fileName)

            return data.publicUrl

        } catch (error) {
            console.error("Upload error:", error)
            throw error
        }
    }, [])

    const insertModuleData = async (file, enquiryNumber) => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: false,
                complete: async (results) => {
                    try {
                        const rows = results.data

                        // 🔥 FMS se ek baar data lao
                        const { data: fmsData, error } = await supabase
                            .from("fms")
                            .select("bp_number, beneficiary_name")
                            .eq("enquiry_number", enquiryNumber)
                            .single()



                        if (error) throw error

                        // 🔥 bulk insert prepare
                        const insertData = rows
                            .filter((r, index) => r[0] && r[0] !== "module_id")
                            .map((row) => ({
                                module_id: row[0].trim(),
                                enquiry_number: enquiryNumber,
                                bp_number: fmsData?.bp_number,
                                beneficiary_name: fmsData?.beneficiary_name
                            }))

                        console.log("CSV ROWS:", rows)
                        console.log("FMS DATA:", fmsData)
                        console.log("FINAL INSERT:", insertData)

                        if (insertData.length === 0) return resolve()

                        const { error: insertError } = await supabase
                            .from("module_entry")
                            .insert(insertData)


                        if (insertError) {
                            if (insertError.message.includes("duplicate key")) {
                                alert("Module ID already used! Please upload unique module IDs.")
                            } else {
                                alert(insertError.message)
                            }
                            throw insertError
                        }

                        // if (insertError) throw insertError


                        resolve()
                    } catch (err) {
                        reject(err)
                    }
                }
            })
        })
    }


    const handleActionClick = useCallback((record) => {
        setSelectedRecord(record)
        setCsvFile(null)
        setShowModal(true)
    }, [])

    const handleModalSubmit = async () => {
        if (!csvFile) {
            alert("Please select a CSV file to upload")
            return
        }

        setIsSubmitting(true)

        try {
            // const fileUrl = await uploadFileToSupabase(csvFile, selectedRecord.enquiryNumber)
            const enquiryNumber = selectedRecord.enquiryNumber

            // 1️⃣ CSV data ko DB me insert karo
            await insertModuleData(csvFile, enquiryNumber)

            // 2️⃣ file upload karo (same as before)
            const fileUrl = await uploadFileToSupabase(csvFile, enquiryNumber)

            const actualDate = new Date().toISOString()

            const { error } = await supabase
                .from("fms")
                .update({
                    actual_18: actualDate,
                    url: fileUrl,
                })
                .eq("enquiry_number", selectedRecord._enquiryNumber)

            if (error) throw error

            setSuccessMessage("Module entry CSV uploaded successfully")
            setShowModal(false)

            fetchSheetData()

        } catch (e) {
            console.error(e)
            alert("Submission failed: " + e.message)
        } finally {
            setIsSubmitting(false)
        }
    }


    return (
        <AdminLayout>
            <div className="space-y-4">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <h1 className="text-xl font-bold tracking-tight text-blue-700">{CONFIG.PAGE_CONFIG.title}</h1>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder={showHistory ? "Search history..." : "Search pending..."}
                            className="pl-9 pr-4 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64 shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex space-x-2 border-b border-gray-200">
                    <button
                        onClick={() => setShowHistory(false)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${!showHistory
                            ? "border-blue-500 text-blue-600 bg-blue-50/50"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                    >
                        Pending Entries ({pendingData.length})
                    </button>
                    <button
                        onClick={() => setShowHistory(true)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${showHistory
                            ? "border-blue-500 text-blue-600 bg-blue-50/50"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                    >
                        Entry History ({historyData.length})
                    </button>
                </div>

                {successMessage && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex justify-between items-center shadow-sm">
                        <span className="flex items-center"><CheckCircle2 size={16} className="mr-2" /> {successMessage}</span>
                        <X onClick={() => setSuccessMessage("")} size={16} className="cursor-pointer hover:text-green-900" />
                    </div>
                )}

                <div className="bg-white border border-blue-100 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/80 text-gray-700 uppercase text-[11px] tracking-wider font-black border-b">
                                <tr>
                                    <th className="px-3 py-4">Action</th>
                                    <th className="px-3 py-4 font-bold">Enquiry No</th>
                                    <th className="px-3 py-4 font-bold">Beneficiary</th>
                                    {showHistory && <th className="px-3 py-4 font-bold">Uploaded Date</th>}
                                    {showHistory && <th className="px-3 py-4 font-bold">CSV File</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={showHistory ? 5 : 3} className="p-20 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                                                <p className="text-blue-900 font-bold">Loading Data...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={showHistory ? 5 : 3} className="p-12 text-center text-gray-500">
                                            No module entry records found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map(r => (
                                        <tr key={r._id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleActionClick(r)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-1.5 px-3 rounded shadow-sm flex items-center"
                                                >
                                                    <Upload size={12} className="mr-1.5" />
                                                    {showHistory ? "UPDATE CSV" : "UPLOAD CSV"}
                                                </button>
                                            </td>
                                            <td className="px-3 py-4 font-bold text-blue-800 whitespace-nowrap text-xs">{r.enquiryNumber}</td>
                                            <td className="px-3 py-4 text-gray-900 font-bold text-xs whitespace-nowrap">{r.beneficiaryName}</td>
                                            {showHistory && (() => {
                                                const ts = formatDisplayTimestamp(r.actual)
                                                return (
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-800">
                                                                <Calendar size={12} className="text-blue-500" />
                                                                {ts.date}
                                                            </span>
                                                            {ts.time && (
                                                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                                                                    <Clock size={11} className="text-gray-400" />
                                                                    {ts.time}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                )
                                            })()}
                                            {showHistory && (
                                                <td className="px-3 py-4 text-xs whitespace-nowrap">
                                                    {r.fileUrl ? (
                                                        <a
                                                            href={r.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-1 px-2.5 rounded border border-green-200 transition-colors"
                                                        >
                                                            <FileText size={12} />
                                                            View CSV
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400 italic">No file</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Module Entry Upload</h3>
                                <p className="text-xs text-gray-400">Enquiry: {selectedRecord?.enquiryNumber}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-blue-100 rounded-xl p-8 hover:border-blue-300 transition-colors cursor-pointer bg-blue-50/10 group">
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    id="csvUpload"
                                    onChange={(e) => setCsvFile(e.target.files[0])}
                                />
                                <label htmlFor="csvUpload" className="w-full h-full flex flex-col items-center cursor-pointer">
                                    {csvFile ? (
                                        <div className="flex flex-col items-center space-y-2">
                                            <FileText className="h-12 w-12 text-blue-600" />
                                            <p className="text-sm font-bold text-gray-700">{csvFile.name}</p>
                                            <p className="text-xs text-blue-400">{(csvFile.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center space-y-2">
                                            <Upload className="h-12 w-12 text-gray-300 group-hover:text-blue-400" />
                                            <p className="text-sm font-bold text-gray-400 group-hover:text-blue-600">Select CSV File</p>
                                            <p className="text-[10px] text-gray-300 uppercase">Only .csv files allowed</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex space-x-4">
                            <button onClick={() => setShowModal(false)} className="px-6 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                                DISCARD
                            </button>
                            <button
                                onClick={handleModalSubmit}
                                disabled={isSubmitting || !csvFile}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-200 flex items-center justify-center transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                        UPLOADING...
                                    </>
                                ) : (
                                    "SUBMIT MODULE CSV"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}

export default ModuleEntryPage

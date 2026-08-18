"use client";
import { useEffect, useState } from "react";
import supabase from "../utils/supabase";
import AdminLayout from "../components/layout/AdminLayout";

export default function UserRegistration() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [masterData, setMasterData] = useState([]);
  const [masterForm, setMasterForm] = useState({
    department: "",
    given_by: "",
  });

  // ========== PAGE OPTIONS static list ==========
  const pageOptions = [
    "Dashboard",
    "Enquiry Form",
    "Lead Page",
    "Assign Survey",
    "Site Survey",
    "Quotation Create",
    "Sales Call",
    "Payment",
    "Documents Uploads",
    "Registration",
    "Payment Confirmation",
    "Dispatch Planner",
    "Dispatch Material",
    "DCR Creation",
    "IP Material Received",
    "Installation",
    "QC",
    "CSPDL Inspection",
    "IP Payment",
    "Financial",
    "Billings and Payment Details",
    "Solarkart",
    "Inform To Customer",
    "Mandatory Documents for Synchronization",
    "Inspection",
    "Project Synchronisation",
    "Subsidy Redemption",
    "Subsidy Disbursal",
    "Insurance",
    "Module Entry",
    "Analysis Graph",
    "All Graph",
    "Weekly Report",
    "Monthly Report",
    "Add User",
    "Dropdown",
    "Product List",
    "Dispatch Approval",
    "Bank Process"
  ];
  const [loading, setLoading] = useState(false);

  const [pageAccess, setPageAccess] = useState([]);
  const [openPageBox, setOpenPageBox] = useState(false);

  const [editPageAccess, setEditPageAccess] = useState([]);
  const [openEditPageBox, setOpenEditPageBox] = useState(false);

  const togglePage = (page) => {
    setPageAccess((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page],
    );
  };

  const toggleAllPages = () => {
    if (pageAccess.length === pageOptions.length) {
      setPageAccess([]);
    } else {
      setPageAccess([...pageOptions]);
    }
  };

  const toggleEditPage = (page) => {
    setEditPageAccess((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page],
    );
  };

  const toggleAllEditPages = () => {
    if (editPageAccess.length === pageOptions.length) {
      setEditPageAccess([]);
    } else {
      setEditPageAccess([...pageOptions]);
    }
  };

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email_id: "",
    wa_number: "",
    password: "",
    department: "",
    given_by: "",
    role: "USER",
    page: "",
  });

  const [editData, setEditData] = useState(formData);

  // ================= FETCH USERS =================
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("login")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // ================= FETCH MASTER DATA =================
  const fetchMasterData = async () => {
    try {
      const { data, error } = await supabase
        .from("master_hr")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMasterData(data || []);
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchMasterData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "wa_number") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length <= 10) {
        setFormData((prev) => ({
          ...prev,
          wa_number: digitsOnly,
        }));
      }
      return;
    }

    if (name === "username") {
      setFormData((prev) => ({
        ...prev,
        username: value,
        name: value,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === "wa_number") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length <= 10) {
        setEditData((prev) => ({ ...prev, wa_number: digitsOnly }));
      }
      return;
    }
    if (name === "username") {
      setEditData((prev) => ({
        ...prev,
        username: value,
        name: value,
      }));
      return;
    }
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (user) => {
    setEditUserId(user.id);
    setEditData({
      username: user.username || "",
      name: user.name || user.username || "",
      email_id: user.email_id || "",
      wa_number: user.wa_number || "",
      password: user.password || "",
      department: user.department || "",
      given_by: user.given_by || "",
      role: user.role || "USER",
      page: user.page || "",
    });
    setOpenEditPageBox(false);

    if (!user.page || user.page === "ALL") {
      setEditPageAccess([...pageOptions]);
    } else {
      const parsedPages = user.page.split(",").map((p) => p.trim()).filter(Boolean);
      setEditPageAccess(parsedPages);
    }
    setEditOpen(true);
  };

  // ========== HANDLE SUBMIT ADD USER ==========
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password || !formData.role) {
      alert("Please fill in all required fields: Username, Password, and User Role.");
      return;
    }

    if (pageAccess.length === 0) {
      alert("Please select at least one page for Page Access.");
      return;
    }

    const payload = {
      username: formData.username,
      name: formData.name || formData.username,
      password: formData.password,
      email_id: formData.email_id || "",
      wa_number: formData.wa_number || "",
      department: formData.department || "",
      given_by: formData.given_by || "",
      role: formData.role || "USER",
      page:
        pageAccess.length === pageOptions.length ? "ALL" : pageAccess.join(","),
      access: true,
    };

    try {
      const { error } = await supabase.from("login").insert([payload]);

      if (error) throw error;

      setOpen(false);
      setFormData({
        username: "",
        name: "",
        email_id: "",
        wa_number: "",
        password: "",
        department: "",
        given_by: "",
        role: "USER",
        page: "",
      });

      setPageAccess([]);
      fetchUsers();
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Error adding user: " + error.message);
    }
  };

  // ========== HANDLE SUBMIT EDIT USER MODAL ==========
  const handleUpdate = async (e) => {
    if (e) e.preventDefault();

    if (!editData.username || !editData.password || !editData.role) {
      alert("Please fill in required fields: Username, Password, and User Role.");
      return;
    }

    if (editPageAccess.length === 0) {
      alert("Please select at least one page for Page Access.");
      return;
    }

    const payload = {
      username: editData.username,
      name: editData.name || editData.username,
      password: editData.password,
      email_id: editData.email_id || "",
      wa_number: editData.wa_number || "",
      department: editData.department || "",
      given_by: editData.given_by || "",
      role: editData.role || "USER",
      page:
        editPageAccess.length === pageOptions.length ? "ALL" : editPageAccess.join(","),
    };

    try {
      const { error } = await supabase
        .from("login")
        .update(payload)
        .eq("id", editUserId);

      if (error) throw error;

      setEditOpen(false);
      setEditUserId(null);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error updating user: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;

    try {
      const { error } = await supabase.from("login").delete().eq("id", id);

      if (error) throw error;

      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // ========== FILTER USERS FOR GLOBAL SEARCH ==========
  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email_id && u.email_id.toLowerCase().includes(q)) ||
      (u.wa_number && u.wa_number.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.given_by && u.given_by.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.page && u.page.toLowerCase().includes(q))
    );
  });

  // ================= UI =================
  return (
    <AdminLayout>
      <div className="p-2 md:p-4 lg:p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage system accounts and access permissions</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add New User
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0c-.553 0-1 .447-1 1s.447 1 1 1 1-.447 1-1-.447-1-1-1z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Admin Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u) => u.role === "ADMIN").length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Regular Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u) => u.role === "USER").length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Search Results</p>
                <p className="text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SEARCH & FILTER SECTION ================= */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Global Search (Name, Role, Dept, Access, Phone...)"
                className="pl-10 pr-10 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="text-sm text-gray-500 font-medium">
              Showing <span className="text-purple-700 font-bold">{filteredUsers.length}</span> of {users.length} users
            </div>
          </div>
        </div>

        {/* ================= DESKTOP TABLE ================= */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                User Accounts List
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-30">
                <tr className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  <th className="px-3 py-3 text-center font-medium rounded-tl-xl">Username</th>
                  <th className="px-3 py-3 text-center font-medium">Password</th>
                  <th className="px-3 py-3 text-center font-medium">Email</th>
                  <th className="px-3 py-3 text-center font-medium">WhatsApp</th>
                  <th className="px-3 py-3 text-center font-medium">Department</th>
                  <th className="px-3 py-3 text-center font-medium">Given By</th>
                  <th className="px-3 py-3 text-center font-medium">User Role</th>
                  <th className="px-3 py-3 text-center font-medium">Page Access</th>
                  <th className="px-3 py-3 text-center font-medium rounded-tr-xl">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      No matching user accounts found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-100 hover:bg-purple-50 transition-all duration-150"
                    >
                      {/* USERNAME */}
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                            {(u.username || u.name || "U").charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{u.username || u.name}</span>
                        </div>
                      </td>

                      {/* PASSWORD */}
                      <td className="px-3 py-3 text-center font-mono">
                        <span className="bg-gray-50 px-2 py-1 rounded text-xs">
                          {u.password}
                        </span>
                      </td>

                      {/* EMAIL */}
                      <td className="px-3 py-3 text-center">
                        <span className="text-gray-700">{u.email_id || "-"}</span>
                      </td>

                      {/* WHATSAPP */}
                      <td className="px-3 py-3 text-center">
                        <span className="text-gray-700">{u.wa_number || "-"}</span>
                      </td>

                      {/* DEPARTMENT */}
                      <td className="px-3 py-3 text-center">
                        <span className="text-gray-700">{u.department || "-"}</span>
                      </td>

                      {/* GIVEN BY */}
                      <td className="px-3 py-3 text-center">
                        <span className="text-gray-700">{u.given_by || "-"}</span>
                      </td>

                      {/* USER ROLE */}
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* PAGE ACCESS */}
                      <td className="px-3 py-3 text-center">
                        {u.page ? (
                          <div className="text-xs bg-gray-50 px-2 py-1 rounded truncate max-w-[140px] inline-block" title={u.page}>
                            {u.page}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Not set</span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-3 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => handleEdit(u)}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-2.5 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 text-sm text-gray-500">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* ================= MOBILE CARD VIEW ================= */}
        <div className="md:hidden space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                User Accounts
              </h2>
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full">
                {filteredUsers.length} users
              </span>
            </div>

            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No matching user accounts found
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-all duration-200"
                  >
                    {/* USER HEADER */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center mr-3">
                          <span className="font-bold text-purple-700">
                            {(u.username || u.name || "U").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {u.username || u.name}
                          </h3>
                          <div className="flex items-center mt-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}
                            >
                              {u.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(u)}
                          className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-lg font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="px-3 py-1 bg-red-50 text-red-600 text-xs rounded-lg font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* USER DETAILS */}
                    <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                      <div>
                        <p className="text-gray-500 mb-0.5">Password</p>
                        <p className="font-mono bg-gray-50 p-1 rounded">{u.password}</p>
                      </div>

                      <div>
                        <p className="text-gray-500 mb-0.5">User Role</p>
                        <p className="font-medium">{u.role}</p>
                      </div>

                      <div>
                        <p className="text-gray-500 mb-0.5">Email</p>
                        <p className="font-medium truncate">{u.email_id || "-"}</p>
                      </div>

                      <div>
                        <p className="text-gray-500 mb-0.5">WhatsApp</p>
                        <p className="font-medium">{u.wa_number || "-"}</p>
                      </div>

                      <div>
                        <p className="text-gray-500 mb-0.5">Department</p>
                        <p className="font-medium">{u.department || "-"}</p>
                      </div>

                      <div>
                        <p className="text-gray-500 mb-0.5">Given By</p>
                        <p className="font-medium">{u.given_by || "-"}</p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-gray-500 mb-0.5">Page Access</p>
                        <p className="font-medium bg-gray-50 p-1.5 rounded">{u.page || "Not set"}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ================= ADD USER MODAL ================= */}
        {open && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Add New User</h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-white hover:text-gray-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-purple-100 text-sm mt-1">
                  Fields marked with <span className="text-red-300 font-bold">*</span> are required.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Username (REQUIRED) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="username"
                    value={formData.username}
                    placeholder="Enter username"
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Password (REQUIRED) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="password"
                    type="text"
                    value={formData.password}
                    placeholder="Enter password"
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* User Role (REQUIRED) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="USER">Regular User</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                {/* Page Access (REQUIRED) */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Page Access <span className="text-red-500">*</span>
                  </label>

                  {/* Select box */}
                  <div
                    onClick={() => setOpenPageBox(!openPageBox)}
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full cursor-pointer bg-white flex justify-between items-center"
                  >
                    <span className={pageAccess.length === 0 ? "text-gray-400" : "text-gray-800 font-medium"}>
                      {pageAccess.length === 0
                        ? "Select allowed pages"
                        : pageAccess.length === pageOptions.length
                          ? "All Pages"
                          : `${pageAccess.length} selected`}
                    </span>
                    <span>▾</span>
                  </div>

                  {/* Dropdown */}
                  {openPageBox && (
                    <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto border bg-white rounded-lg shadow-lg p-3 space-y-2">
                      {loading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                          <p className="text-gray-500 mt-2">Loading pages...</p>
                        </div>
                      ) : pageOptions.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No pages found</p>
                      ) : (
                        <>
                          {/* All Pages */}
                          <label className="flex items-center gap-2 font-medium text-green-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pageAccess.length === pageOptions.length}
                              onChange={toggleAllPages}
                            />
                            All Pages
                          </label>

                          <hr />

                          {pageOptions.map((page) => (
                            <label key={page} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={pageAccess.includes(page)}
                                onChange={() => togglePage(page)}
                              />
                              <span className="text-sm">{page}</span>
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <hr className="my-2 border-gray-200" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Optional Information</p>

                {/* Email Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="email_id"
                    type="email"
                    value={formData.email_id}
                    placeholder="user@example.com"
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* WhatsApp */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      name="wa_number"
                      value={formData.wa_number}
                      placeholder="10 digit number"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      inputMode="numeric"
                      className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      onChange={handleChange}
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      name="department"
                      value={formData.department}
                      placeholder="Department"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Given By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Given By
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="given_by"
                    value={formData.given_by}
                    placeholder="Given By"
                    onChange={handleChange}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-5 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    Create User Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= EDIT USER MODAL ================= */}
        {editOpen && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Edit User Account</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setEditOpen(false);
                      setEditUserId(null);
                    }}
                    className="text-white hover:text-gray-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-purple-100 text-sm mt-1">
                  Update account details and page permissions
                </p>
              </div>

              <form onSubmit={handleUpdate} className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Username (REQUIRED) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="username"
                    value={editData.username}
                    placeholder="Enter username"
                    onChange={handleEditChange}
                    required
                  />
                </div>

                {/* Password (REQUIRED) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="password"
                    type="text"
                    value={editData.password}
                    placeholder="Enter password"
                    onChange={handleEditChange}
                    required
                  />
                </div>

                {/* User Role (REQUIRED) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="role"
                    value={editData.role}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="USER">Regular User</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                {/* Page Access (REQUIRED) */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Page Access <span className="text-red-500">*</span>
                  </label>

                  {/* Select box */}
                  <div
                    onClick={() => setOpenEditPageBox(!openEditPageBox)}
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full cursor-pointer bg-white flex justify-between items-center"
                  >
                    <span className={editPageAccess.length === 0 ? "text-gray-400" : "text-gray-800 font-medium"}>
                      {editPageAccess.length === 0
                        ? "Select allowed pages"
                        : editPageAccess.length === pageOptions.length
                          ? "All Pages"
                          : `${editPageAccess.length} selected`}
                    </span>
                    <span>▾</span>
                  </div>

                  {/* Dropdown */}
                  {openEditPageBox && (
                    <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto border bg-white rounded-lg shadow-lg p-3 space-y-2">
                      {pageOptions.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No pages found</p>
                      ) : (
                        <>
                          {/* All Pages */}
                          <label className="flex items-center gap-2 font-medium text-green-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editPageAccess.length === pageOptions.length}
                              onChange={toggleAllEditPages}
                            />
                            All Pages
                          </label>

                          <hr />

                          {pageOptions.map((page) => (
                            <label key={page} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={editPageAccess.includes(page)}
                                onChange={() => toggleEditPage(page)}
                              />
                              <span className="text-sm">{page}</span>
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <hr className="my-2 border-gray-200" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Optional Information</p>

                {/* Email Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="email_id"
                    type="email"
                    value={editData.email_id}
                    placeholder="user@example.com"
                    onChange={handleEditChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* WhatsApp */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      name="wa_number"
                      value={editData.wa_number}
                      placeholder="10 digit number"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      inputMode="numeric"
                      className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      onChange={handleEditChange}
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      name="department"
                      value={editData.department}
                      placeholder="Department"
                      onChange={handleEditChange}
                    />
                  </div>
                </div>

                {/* Given By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Given By
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="given_by"
                    value={editData.given_by}
                    placeholder="Given By"
                    onChange={handleEditChange}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditOpen(false);
                      setEditUserId(null);
                    }}
                    className="px-5 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    Update User Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

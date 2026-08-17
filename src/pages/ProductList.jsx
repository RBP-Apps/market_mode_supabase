"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Search, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle2, ChevronDown, Filter, RotateCcw } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

export default function ProductListPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState("")

  // Filter States
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProductCode, setSelectedProductCode] = useState("ALL")
  const [selectedProductName, setSelectedProductName] = useState("ALL")
  const [selectedSellingPrice, setSelectedSellingPrice] = useState("ALL")

  // Search terms inside filter dropdowns
  const [searchInCodeDropdown, setSearchInCodeDropdown] = useState("")
  const [searchInNameDropdown, setSearchInNameDropdown] = useState("")
  const [searchInPriceDropdown, setSearchInPriceDropdown] = useState("")

  // Dropdown visibility states
  const [openCodeDropdown, setOpenCodeDropdown] = useState(false)
  const [openNameDropdown, setOpenNameDropdown] = useState(false)
  const [openPriceDropdown, setOpenPriceDropdown] = useState(false)

  const codeDropdownRef = useRef(null)
  const nameDropdownRef = useRef(null)
  const priceDropdownRef = useRef(null)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Form states
  const initialFormState = {
    serial_no: "",
    product_code: "",
    product_name: "",
    bill_of_material: "",
    size: "",
    selling_price: "",
    units: "",
    subsidy: "",
    tax_percent: "",
    creda_rate: "",
    gold: "",
    platinum: "",
    center_subsidy: "",
    state_subsidy: ""
  }
  const [formData, setFormData] = useState(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (codeDropdownRef.current && !codeDropdownRef.current.contains(event.target)) {
        setOpenCodeDropdown(false)
      }
      if (nameDropdownRef.current && !nameDropdownRef.current.contains(event.target)) {
        setOpenNameDropdown(false)
      }
      if (priceDropdownRef.current && !priceDropdownRef.current.contains(event.target)) {
        setOpenPriceDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fetch all products
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchErr } = await supabase
        .from("product_list")
        .select("*")
        .order("id", { ascending: true })

      if (fetchErr) throw fetchErr
      setProducts(data || [])
    } catch (err) {
      console.error("Error fetching products:", err)
      setError("Failed to fetch products. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Show temporary messages
  const triggerSuccess = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 4000)
  }

  const triggerError = (msg) => {
    setError(msg)
    setTimeout(() => setError(null), 4000)
  }

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  // Set up add modal
  const openAddModal = () => {
    setFormData(initialFormState)
    setShowAddModal(true)
  }

  // Set up edit modal
  const openEditModal = (product) => {
    setSelectedProduct(product)
    setFormData({
      serial_no: product.serial_no || "",
      product_code: product.product_code || "",
      product_name: product.product_name || "",
      bill_of_material: product.bill_of_material || "",
      size: product.size || "",
      selling_price: product.selling_price || "",
      units: product.units || "",
      subsidy: product.subsidy || "",
      tax_percent: product.tax_percent || "",
      creda_rate: product.creda_rate || "",
      gold: product.gold || "",
      platinum: product.platinum || "",
      center_subsidy: product.center_subsidy || "",
      state_subsidy: product.state_subsidy || ""
    })
    setShowEditModal(true)
  }

  // Set up delete confirmation
  const openDeleteConfirm = (product) => {
    setSelectedProduct(product)
    setShowDeleteConfirm(true)
  }

  // Add a new product
  const handleAddProduct = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        serial_no: formData.serial_no ? parseInt(formData.serial_no) : null,
        product_code: formData.product_code || null,
        product_name: formData.product_name || null,
        bill_of_material: formData.bill_of_material || null,
        size: formData.size || null,
        selling_price: formData.selling_price ? parseFloat(formData.selling_price) : null,
        units: formData.units || null,
        subsidy: formData.subsidy ? parseFloat(formData.subsidy) : null,
        tax_percent: formData.tax_percent ? parseFloat(formData.tax_percent) : null,
        creda_rate: formData.creda_rate ? parseFloat(formData.creda_rate) : null,
        gold: formData.gold ? parseFloat(formData.gold) : null,
        platinum: formData.platinum ? parseFloat(formData.platinum) : null,
        center_subsidy: formData.center_subsidy ? parseFloat(formData.center_subsidy) : null,
        state_subsidy: formData.state_subsidy ? parseFloat(formData.state_subsidy) : null
      }

      const { error: insertErr } = await supabase
        .from("product_list")
        .insert([payload])

      if (insertErr) throw insertErr

      triggerSuccess("Product added successfully!")
      setShowAddModal(false)
      fetchProducts()
    } catch (err) {
      console.error("Error adding product:", err)
      triggerError("Failed to add product: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit an existing product
  const handleEditProduct = async (e) => {
    e.preventDefault()
    if (!selectedProduct) return
    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        serial_no: formData.serial_no ? parseInt(formData.serial_no) : null,
        product_code: formData.product_code || null,
        product_name: formData.product_name || null,
        bill_of_material: formData.bill_of_material || null,
        size: formData.size || null,
        selling_price: formData.selling_price ? parseFloat(formData.selling_price) : null,
        units: formData.units || null,
        subsidy: formData.subsidy ? parseFloat(formData.subsidy) : null,
        tax_percent: formData.tax_percent ? parseFloat(formData.tax_percent) : null,
        creda_rate: formData.creda_rate ? parseFloat(formData.creda_rate) : null,
        gold: formData.gold ? parseFloat(formData.gold) : null,
        platinum: formData.platinum ? parseFloat(formData.platinum) : null,
        center_subsidy: formData.center_subsidy ? parseFloat(formData.center_subsidy) : null,
        state_subsidy: formData.state_subsidy ? parseFloat(formData.state_subsidy) : null
      }

      const { error: updateErr } = await supabase
        .from("product_list")
        .update(payload)
        .eq("id", selectedProduct.id)

      if (updateErr) throw updateErr

      triggerSuccess("Product updated successfully!")
      setShowEditModal(false)
      fetchProducts()
    } catch (err) {
      console.error("Error updating product:", err)
      triggerError("Failed to update product: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete a product
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return
    setIsSubmitting(true)
    setError(null)

    try {
      const { error: deleteErr } = await supabase
        .from("product_list")
        .delete()
        .eq("id", selectedProduct.id)

      if (deleteErr) throw deleteErr

      triggerSuccess("Product deleted successfully!")
      setShowDeleteConfirm(false)
      fetchProducts()
    } catch (err) {
      console.error("Error deleting product:", err)
      triggerError("Failed to delete product: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Extract unique options for Product Code, Product Name & Selling Price
  const uniqueProductCodes = useMemo(() => {
    const codes = products.map((p) => p.product_code).filter(Boolean)
    return Array.from(new Set(codes)).sort()
  }, [products])

  const uniqueProductNames = useMemo(() => {
    const names = products.map((p) => p.product_name).filter(Boolean)
    return Array.from(new Set(names)).sort()
  }, [products])

  const uniqueSellingPrices = useMemo(() => {
    const prices = products
      .map((p) => p.selling_price)
      .filter((price) => price !== null && price !== undefined)
    return Array.from(new Set(prices)).sort((a, b) => a - b)
  }, [products])

  // Filtered Options inside the dropdown search fields
  const filteredCodeOptions = useMemo(() => {
    if (!searchInCodeDropdown.trim()) return uniqueProductCodes
    return uniqueProductCodes.filter((code) =>
      code.toLowerCase().includes(searchInCodeDropdown.toLowerCase().trim())
    )
  }, [uniqueProductCodes, searchInCodeDropdown])

  const filteredNameOptions = useMemo(() => {
    if (!searchInNameDropdown.trim()) return uniqueProductNames
    return uniqueProductNames.filter((name) =>
      name.toLowerCase().includes(searchInNameDropdown.toLowerCase().trim())
    )
  }, [uniqueProductNames, searchInNameDropdown])

  const filteredPriceOptions = useMemo(() => {
    if (!searchInPriceDropdown.trim()) return uniqueSellingPrices
    return uniqueSellingPrices.filter((price) =>
      price.toString().includes(searchInPriceDropdown.trim())
    )
  }, [uniqueSellingPrices, searchInPriceDropdown])

  // Main Filtered Products calculation
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Global Search Match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim()
        const matchGlobal =
          (p.product_name && p.product_name.toLowerCase().includes(q)) ||
          (p.product_code && p.product_code.toLowerCase().includes(q)) ||
          (p.size && p.size.toLowerCase().includes(q)) ||
          (p.bill_of_material && p.bill_of_material.toLowerCase().includes(q)) ||
          (p.units && p.units.toLowerCase().includes(q)) ||
          (p.selling_price && p.selling_price.toString().includes(q)) ||
          (p.subsidy && p.subsidy.toString().includes(q)) ||
          (p.serial_no && p.serial_no.toString().includes(q))

        if (!matchGlobal) return false
      }

      // 2. Product Code Dropdown Filter
      if (selectedProductCode && selectedProductCode !== "ALL") {
        if (p.product_code !== selectedProductCode) return false
      }

      // 3. Product Name Dropdown Filter
      if (selectedProductName && selectedProductName !== "ALL") {
        if (p.product_name !== selectedProductName) return false
      }

      // 4. Selling Price Dropdown Filter
      if (selectedSellingPrice && selectedSellingPrice !== "ALL") {
        if (p.selling_price?.toString() !== selectedSellingPrice.toString()) return false
      }

      return true
    })
  }, [products, searchTerm, selectedProductCode, selectedProductName, selectedSellingPrice])

  const resetAllFilters = () => {
    setSearchTerm("")
    setSelectedProductCode("ALL")
    setSelectedProductName("ALL")
    setSelectedSellingPrice("ALL")
    setSearchInCodeDropdown("")
    setSearchInNameDropdown("")
    setSearchInPriceDropdown("")
  }

  const isFiltered =
    searchTerm ||
    selectedProductCode !== "ALL" ||
    selectedProductName !== "ALL" ||
    selectedSellingPrice !== "ALL"

  return (
    <AdminLayout>
      <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Toast Alerts */}
        {success && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700 shadow-lg border border-green-200">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}

        {error && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700 shadow-lg border border-red-200">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-purple-100 shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Product List Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage product pricing, sizes, subsidies, and specifications.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 px-5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-purple-700 hover:to-indigo-700 transition transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Add New Product
          </button>
        </div>

        {/* ================= FILTER SECTION ================= */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-800 font-semibold text-sm">
              <Filter className="h-4 w-4 text-purple-600" />
              <span>Filter & Search Products</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. GLOBAL SEARCH INPUT */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Global Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search code, name, size..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-xl pl-9 pr-8 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
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

            {/* 2. PRODUCT CODE DROPDOWN (WITH INLINE SEARCH) */}
            <div className="relative" ref={codeDropdownRef}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Product Code
              </label>
              <button
                type="button"
                onClick={() => {
                  setOpenCodeDropdown(!openCodeDropdown)
                  setOpenNameDropdown(false)
                  setOpenPriceDropdown(false)
                }}
                className="w-full text-left bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm flex justify-between items-center focus:ring-2 focus:ring-purple-500 transition"
              >
                <span className="truncate font-medium text-gray-800">
                  {selectedProductCode === "ALL" ? "All Product Codes" : selectedProductCode}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
              </button>

              {openCodeDropdown && (
                <div className="absolute left-0 right-0 z-30 mt-1 bg-white border border-purple-100 rounded-xl shadow-xl p-2 space-y-2">
                  {/* SEARCH INSIDE DROPDOWN */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search product code..."
                      value={searchInCodeDropdown}
                      onChange={(e) => setSearchInCodeDropdown(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* OPTIONS LIST */}
                  <div className="max-h-52 overflow-y-auto space-y-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductCode("ALL")
                        setOpenCodeDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg font-medium transition ${selectedProductCode === "ALL" ? "bg-purple-100 text-purple-800" : "hover:bg-purple-50 text-gray-700"}`}
                    >
                      All Product Codes
                    </button>
                    {filteredCodeOptions.length === 0 ? (
                      <div className="p-2 text-center text-gray-400">No match found</div>
                    ) : (
                      filteredCodeOptions.map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            setSelectedProductCode(code)
                            setOpenCodeDropdown(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition ${selectedProductCode === code ? "bg-purple-100 text-purple-800 font-semibold" : "hover:bg-purple-50 text-gray-700"}`}
                        >
                          {code}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. PRODUCT NAME DROPDOWN (WITH INLINE SEARCH) */}
            <div className="relative" ref={nameDropdownRef}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Product Name
              </label>
              <button
                type="button"
                onClick={() => {
                  setOpenNameDropdown(!openNameDropdown)
                  setOpenCodeDropdown(false)
                  setOpenPriceDropdown(false)
                }}
                className="w-full text-left bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm flex justify-between items-center focus:ring-2 focus:ring-purple-500 transition"
              >
                <span className="truncate font-medium text-gray-800">
                  {selectedProductName === "ALL" ? "All Product Names" : selectedProductName}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
              </button>

              {openNameDropdown && (
                <div className="absolute left-0 right-0 z-30 mt-1 bg-white border border-purple-100 rounded-xl shadow-xl p-2 space-y-2">
                  {/* SEARCH INSIDE DROPDOWN */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search product name..."
                      value={searchInNameDropdown}
                      onChange={(e) => setSearchInNameDropdown(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* OPTIONS LIST */}
                  <div className="max-h-52 overflow-y-auto space-y-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductName("ALL")
                        setOpenNameDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg font-medium transition ${selectedProductName === "ALL" ? "bg-purple-100 text-purple-800" : "hover:bg-purple-50 text-gray-700"}`}
                    >
                      All Product Names
                    </button>
                    {filteredNameOptions.length === 0 ? (
                      <div className="p-2 text-center text-gray-400">No match found</div>
                    ) : (
                      filteredNameOptions.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setSelectedProductName(name)
                            setOpenNameDropdown(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition ${selectedProductName === name ? "bg-purple-100 text-purple-800 font-semibold" : "hover:bg-purple-50 text-gray-700"}`}
                        >
                          {name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. SELLING PRICE DROPDOWN (WITH INLINE SEARCH) */}
            <div className="relative" ref={priceDropdownRef}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Selling Price
              </label>
              <button
                type="button"
                onClick={() => {
                  setOpenPriceDropdown(!openPriceDropdown)
                  setOpenCodeDropdown(false)
                  setOpenNameDropdown(false)
                }}
                className="w-full text-left bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm flex justify-between items-center focus:ring-2 focus:ring-purple-500 transition"
              >
                <span className="truncate font-medium text-gray-800">
                  {selectedSellingPrice === "ALL"
                    ? "All Selling Prices"
                    : `₹${parseFloat(selectedSellingPrice).toLocaleString()}`}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
              </button>

              {openPriceDropdown && (
                <div className="absolute left-0 right-0 z-30 mt-1 bg-white border border-purple-100 rounded-xl shadow-xl p-2 space-y-2">
                  {/* SEARCH INSIDE DROPDOWN */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search selling price..."
                      value={searchInPriceDropdown}
                      onChange={(e) => setSearchInPriceDropdown(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* OPTIONS LIST */}
                  <div className="max-h-52 overflow-y-auto space-y-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSellingPrice("ALL")
                        setOpenPriceDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg font-medium transition ${selectedSellingPrice === "ALL" ? "bg-purple-100 text-purple-800" : "hover:bg-purple-50 text-gray-700"}`}
                    >
                      All Selling Prices
                    </button>
                    {filteredPriceOptions.length === 0 ? (
                      <div className="p-2 text-center text-gray-400">No match found</div>
                    ) : (
                      filteredPriceOptions.map((price) => (
                        <button
                          key={price}
                          type="button"
                          onClick={() => {
                            setSelectedSellingPrice(price.toString())
                            setOpenPriceDropdown(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition ${selectedSellingPrice.toString() === price.toString() ? "bg-purple-100 text-purple-800 font-semibold" : "hover:bg-purple-50 text-gray-700"}`}
                        >
                          ₹{price.toLocaleString()}
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
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800 text-base">
              Product List Items
            </h2>
            <span className="text-xs bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full">
              Showing {filteredProducts.length} of {products.length} Products
            </span>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-9 w-9 border-b-2 border-purple-600"></div>
              <p className="mt-3 text-purple-600 text-sm font-medium">Loading product inventory...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">
              <p className="font-medium text-base text-gray-700">No products found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms or filters.</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden lg:block overflow-x-auto max-h-[65vh]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5 text-center w-24">Actions</th>
                      <th className="px-4 py-3.5 text-center w-16">S.No</th>
                      <th className="px-4 py-3.5 text-left">Code</th>
                      <th className="px-4 py-3.5 text-left">Product Name</th>
                      <th className="px-4 py-3.5 text-center">Size</th>
                      <th className="px-4 py-3.5 text-right">Selling Price</th>
                      <th className="px-4 py-3.5 text-center">Units</th>
                      <th className="px-4 py-3.5 text-center">Tax %</th>
                      <th className="px-4 py-3.5 text-right">Creda Rate</th>
                      <th className="px-4 py-3.5 text-right">Gold Rate</th>
                      <th className="px-4 py-3.5 text-right">Platinum</th>
                      <th className="px-4 py-3.5 text-right">Subsidy</th>
                      <th className="px-4 py-3.5 text-right">Center Sub.</th>
                      <th className="px-4 py-3.5 text-right">State Sub.</th>
                      <th className="px-4 py-3.5 text-left min-w-[140px]">BOM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                    {filteredProducts.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-purple-50/50 transition-colors duration-150">
                        {/* Actions (FIRST COLUMN) */}
                        <td className="px-4 py-3 text-center whitespace-nowrap bg-purple-50/20">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition"
                              title="Edit product"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(p)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                              title="Delete product"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* S.No */}
                        <td className="px-4 py-3 text-center font-medium text-gray-500">
                          {p.serial_no ?? idx + 1}
                        </td>

                        {/* Product Code */}
                        <td className="px-4 py-3 font-semibold text-purple-700 whitespace-nowrap">
                          {p.product_code ?? "—"}
                        </td>

                        {/* Product Name */}
                        <td className="px-4 py-3 font-medium text-gray-900 min-w-[180px]">
                          {p.product_name ?? "—"}
                        </td>

                        {/* Size */}
                        <td className="px-4 py-3 text-center whitespace-nowrap text-gray-600">
                          {p.size ?? "—"}
                        </td>

                        {/* Selling Price */}
                        <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap bg-purple-50/30">
                          {p.selling_price ? `₹${p.selling_price.toLocaleString()}` : "—"}
                        </td>

                        {/* Units */}
                        <td className="px-4 py-3 text-center whitespace-nowrap text-gray-600">
                          {p.units ?? "—"}
                        </td>

                        {/* Tax % */}
                        <td className="px-4 py-3 text-center whitespace-nowrap text-gray-600">
                          {p.tax_percent ? `${p.tax_percent}%` : "—"}
                        </td>

                        {/* Creda Rate */}
                        <td className="px-4 py-3 text-right font-medium text-gray-800 whitespace-nowrap">
                          {p.creda_rate ? `₹${p.creda_rate.toLocaleString()}` : "—"}
                        </td>

                        {/* Gold Rate */}
                        <td className="px-4 py-3 text-right font-medium text-amber-700 whitespace-nowrap">
                          {p.gold ? `₹${p.gold.toLocaleString()}` : "—"}
                        </td>

                        {/* Platinum */}
                        <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                          {p.platinum ? `₹${p.platinum.toLocaleString()}` : "—"}
                        </td>

                        {/* Subsidy */}
                        <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                          {p.subsidy ? `₹${p.subsidy.toLocaleString()}` : "—"}
                        </td>

                        {/* Center Subsidy */}
                        <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                          {p.center_subsidy ? `₹${p.center_subsidy.toLocaleString()}` : "—"}
                        </td>

                        {/* State Subsidy */}
                        <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                          {p.state_subsidy ? `₹${p.state_subsidy.toLocaleString()}` : "—"}
                        </td>

                        {/* BOM */}
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={p.bill_of_material}>
                          {p.bill_of_material ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE & TABLET CARD VIEW */}
              <div className="lg:hidden p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {filteredProducts.map((p, idx) => (
                  <div
                    key={p.id}
                    className="border border-purple-100 rounded-2xl p-4 bg-white shadow-sm hover:border-purple-300 transition"
                  >
                    <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                            #{p.serial_no ?? idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-purple-700">
                            {p.product_code || "No Code"}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm mt-1">
                          {p.product_name || "Unnamed Product"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-2 bg-purple-50 text-purple-700 rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(p)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 block">Selling Price</span>
                        <span className="font-bold text-gray-900 text-sm">
                          {p.selling_price ? `₹${p.selling_price.toLocaleString()}` : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Size / Units</span>
                        <span className="font-medium text-gray-800">
                          {p.size || "—"} {p.units ? `(${p.units})` : ""}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Creda Rate</span>
                        <span className="font-medium text-gray-800">
                          {p.creda_rate ? `₹${p.creda_rate.toLocaleString()}` : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Tax %</span>
                        <span className="font-medium text-gray-800">
                          {p.tax_percent ? `${p.tax_percent}%` : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Gold Price</span>
                        <span className="font-medium text-amber-700">
                          {p.gold ? `₹${p.gold.toLocaleString()}` : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Platinum Price</span>
                        <span className="font-medium text-slate-700">
                          {p.platinum ? `₹${p.platinum.toLocaleString()}` : "—"}
                        </span>
                      </div>
                      {p.bill_of_material && (
                        <div className="col-span-2 mt-1 pt-2 border-t border-gray-100">
                          <span className="text-gray-400 block">BOM</span>
                          <span className="text-gray-600 text-xs line-clamp-2">
                            {p.bill_of_material}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Add/Edit Modal Wrapper */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
            <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-purple-100 my-8">
              {/* Header */}
              <div className="flex justify-between items-center p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <h3 className="text-lg font-bold">
                  {showAddModal ? "Add New Product" : "Edit Product Details"}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                  }}
                  className="p-1 rounded-full text-white/80 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={showAddModal ? handleAddProduct : handleEditProduct} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Fields */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-purple-700">Serial No</label>
                    <input
                      type="number"
                      name="serial_no"
                      value={formData.serial_no}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-purple-200 p-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-purple-700">Product Code</label>
                    <input
                      type="text"
                      name="product_code"
                      value={formData.product_code}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-purple-200 p-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-purple-700">Product Name *</label>
                    <input
                      type="text"
                      name="product_name"
                      value={formData.product_name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-purple-200 p-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-purple-700">Size</label>
                    <input
                      type="text"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-purple-200 p-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-purple-700">Units</label>
                    <input
                      type="text"
                      name="units"
                      value={formData.units}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-purple-200 p-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  {/* Pricing / Tax */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-purple-700">Selling Price (₹)</label>
                    <input
                      type="number"
                      step="any"
                      name="selling_price"
                      value={formData.selling_price}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-purple-200 p-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-purple-700">Tax Percent (%)</label>
                    <input
                      type="number"
                      step="any"
                      name="tax_percent"
                      value={formData.tax_percent}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-purple-200 p-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-purple-700">Creda Rate (₹)</label>
                    <input
                      type="number"
                      step="any"
                      name="creda_rate"
                      value={formData.creda_rate}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-purple-200 p-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-purple-700">Subsidy (₹)</label>
                    <input
                      type="number"
                      step="any"
                      name="subsidy"
                      value={formData.subsidy}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-purple-200 p-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-purple-700">Gold Tier Price (₹)</label>
                    <input
                      type="number"
                      step="any"
                      name="gold"
                      value={formData.gold}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-purple-200 p-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-purple-700">Platinum Tier Price (₹)</label>
                    <input
                      type="number"
                      step="any"
                      name="platinum"
                      value={formData.platinum}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-purple-200 p-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-purple-700">Center Subsidy (₹)</label>
                    <input
                      type="number"
                      step="any"
                      name="center_subsidy"
                      value={formData.center_subsidy}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-purple-200 p-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-purple-700">State Subsidy (₹)</label>
                    <input
                      type="number"
                      step="any"
                      name="state_subsidy"
                      value={formData.state_subsidy}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-purple-200 p-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-purple-700">Bill of Material (BOM)</label>
                    <textarea
                      name="bill_of_material"
                      value={formData.bill_of_material}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-lg border border-purple-200 p-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-purple-50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setShowEditModal(false)
                    }}
                    className="rounded-xl border border-gray-300 py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 px-6 text-sm font-semibold text-white shadow hover:shadow-md hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full border border-purple-100">
              <h3 className="text-lg font-bold text-gray-900">Delete Product</h3>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to delete product{" "}
                <span className="font-semibold text-purple-700">
                  "{selectedProduct?.product_name || selectedProduct?.product_code}"
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-xl border border-gray-300 py-2.5 px-4 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProduct}
                  disabled={isSubmitting}
                  className="rounded-xl bg-red-600 py-2.5 px-5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

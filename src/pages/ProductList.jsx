"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle2 } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"
import supabase from "../utils/supabase"

export default function ProductListPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

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

      const { data, error: insertErr } = await supabase
        .from("product_list")
        .insert([payload])
        .select()

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

  // Filter products by search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products
    const query = searchTerm.toLowerCase()
    return products.filter(
      (p) =>
        (p.product_name && p.product_name.toLowerCase().includes(query)) ||
        (p.product_code && p.product_code.toLowerCase().includes(query)) ||
        (p.size && p.size.toLowerCase().includes(query))
    )
  }, [products, searchTerm])

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Toast Alerts */}
        {success && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700 shadow-lg border border-green-200 animate-bounce">
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-purple-100 shadow-xs">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Product List Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Add, update, or delete products and their details.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 py-2 px-4 text-sm font-medium text-white hover:from-purple-700 hover:to-pink-700 transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-purple-50 shadow-xs flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code, name, or size..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm border-0 p-1 focus:ring-0 focus:outline-none placeholder-gray-400"
          />
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-xs overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-2 text-purple-600 text-sm">Loading product data...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              No products found. Click "Add Product" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[70vh]">
              <table className="min-w-full divide-y divide-gray-100 text-center">
                <thead className="bg-purple-50/50 sticky top-0 z-10 text-nowrap">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-purple-700 uppercase">Actions</th>
                    <th className="px-4 py-3 text-xs font-semibold text-purple-700 uppercase">S.No</th>
                    <th className="px-4 py-3 text-xs font-semibold text-purple-700 uppercase">Product Code</th>
                    <th className="px-4 py-3 text-xs font-semibold text-purple-700 uppercase">Product Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-purple-700 uppercase">Size</th>
                    <th className="px-4 py-3 text-xs font-semibold text-purple-700 uppercase">Selling Price</th>
                    <th className="px-4 py-3 text-xs font-semibold text-purple-700 uppercase">Units</th>
                    <th className="px-4 py-3 text-xs font-semibold text-purple-700 uppercase">Tax %</th>
                    <th className="px-4 py-3 text-xs font-semibold text-purple-700 uppercase">Creda Rate</th>
                    <th className="px-4 py-3 text-xs font-semibold text-purple-700 uppercase">Gold Rate</th>
                    <th className="px-4 py-3 text-xs font-semibold text-purple-700 uppercase">Platinum Rate</th>
                    <th className="px-4 py-3 text-xs font-semibold text-purple-700 uppercase">Subsidy</th>
                    <th className="px-4 py-3 text-xs font-semibold text-purple-700 uppercase">Center Subsidy</th>
                    <th className="px-4 py-3 text-xs font-semibold text-purple-700 uppercase">State Subsidy</th>
                    <th className="px-4 py-3 text-xs font-semibold text-purple-700 uppercase">BOM</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-sm">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-purple-50/30 transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1 text-purple-600 hover:text-purple-800 transition"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(p)}
                            className="p-1 text-red-500 hover:text-red-700 transition"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-medium">{p.serial_no ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-purple-700">{p.product_code ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-normal max-w-xs text-gray-900 font-medium text-left">{p.product_name ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{p.size ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-semibold">
                        {p.selling_price ? `₹${p.selling_price.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{p.units ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{p.tax_percent ? `${p.tax_percent}%` : "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                        {p.creda_rate ? `₹${p.creda_rate.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-amber-600 font-medium">
                        {p.gold ? `₹${p.gold.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                        {p.platinum ? `₹${p.platinum.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-750">
                        {p.subsidy ? `₹${p.subsidy.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-750">
                        {p.center_subsidy ? `₹${p.center_subsidy.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-750">
                        {p.state_subsidy ? `₹${p.state_subsidy.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-left text-gray-500" title={p.bill_of_material}>
                        {p.bill_of_material ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal Wrapper */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 overflow-y-auto">
            <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden border border-purple-100 my-8">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-purple-50">
                <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {showAddModal ? "Add New Product" : "Edit Product"}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                  }}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={showAddModal ? handleAddProduct : handleEditProduct} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Fields */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-purple-700">Serial No</label>
                    <input
                      type="number"
                      name="serial_no"
                      value={formData.serial_no}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-purple-200 p-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-purple-700">Product Code</label>
                    <input
                      type="text"
                      name="product_code"
                      value={formData.product_code}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-purple-200 p-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-purple-700">Product Name</label>
                    <input
                      type="text"
                      name="product_name"
                      value={formData.product_name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-purple-200 p-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-purple-700">Size</label>
                    <input
                      type="text"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-purple-200 p-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-purple-700">Units</label>
                    <input
                      type="text"
                      name="units"
                      value={formData.units}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-purple-200 p-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                      className="w-full rounded-lg border border-purple-200 p-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                      className="w-full rounded-lg border border-purple-200 p-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                      className="w-full rounded-lg border border-purple-200 p-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                      className="w-full rounded-lg border border-purple-200 p-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                      className="w-full rounded-lg border border-purple-200 p-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                      className="w-full rounded-lg border border-purple-200 p-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                      className="w-full rounded-lg border border-purple-200 p-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                      className="w-full rounded-lg border border-purple-200 p-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-purple-700">Bill of Material (BOM)</label>
                    <textarea
                      name="bill_of_material"
                      value={formData.bill_of_material}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-lg border border-purple-200 p-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                    className="rounded-lg border border-gray-300 py-2 px-4 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 py-2 px-5 text-sm font-semibold text-white hover:from-purple-700 hover:to-pink-700 transition focus:outline-none disabled:opacity-50"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full border border-purple-100">
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
                  className="rounded-lg border border-gray-300 py-2 px-4 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProduct}
                  disabled={isSubmitting}
                  className="rounded-lg bg-red-600 py-2 px-4 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none transition disabled:opacity-50"
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

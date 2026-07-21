"use client"

import React from "react"
import AdminLayout from "../components/layout/AdminLayout"

export default function DispatchApprovalPage() {
  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        Financial
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage dispatch approvals and tracking details.
          </p>
        </div>
        <div className="bg-white p-12 rounded-2xl border border-blue-50 shadow-xs text-center text-gray-500">
          Content is currently under development.
        </div>
      </div>
    </AdminLayout>
  )
}

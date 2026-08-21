"use client"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import AdminDashboard from "./pages/admin/Dashboard"
import AdminAssignTask from "./pages/admin/AssignTask"
import SurveyReportPage from "./pages/SurveyReport"
import QuotationsendPage from "./pages/Quatationsend"
import FollowupPage from "./pages/Followup"
import OrderPlacePage from "./pages/OrderPlace"
import IPAssigmentPage from "./pages/IPAssigment"
import DispatchmaterialPage from "./pages/Dispatchmaterial"
import InformToCustomerPage from "./pages/InformToCustomer"
import MaterialreceivedPage from "./pages/Materialreceived"
import InstallationPage from "./pages/Installation"
import BillingPage from "./pages/Billing"
import CspdclForSynconizationPage from "./pages/Mandatory Documents for Synchronization"
import InspectionPage from "./pages/Inspection"
import ProjectCommissioningPage from "./pages/ProjectCommissioning"
import RedemptionPage from "./pages/Redemption"
import SubsidyDisbursalPage from "./pages/SubsidyDisbursal"
import PaymentPage from "./pages/Payment"
import EnergyAnalysis from "./pages/EnergyAnalysis"
import AnalysisGraphPage from "./pages/Analysisgraph"
import { DeviceProvider } from "./pages/graph/DeviceContext"
import AllGraph from "./pages/AllGraph"
import WeeklyPerformanceReport from "./pages/graph/WeeklyPerformanceReport"
import MonthlyPerformanceReport from "./pages/graph/MonthlyPerformanceReport"
import InsurancePage from "./pages/Insurance"
import ModuleEntryPage from "./pages/ModuleEntry"
import ProductListPage from "./pages/ProductList"
import DispatchApprovalPage from "./pages/DispatchApproval"
import DispatchPlannerPage from "./pages/DispatchPlanne"
import PaymentConfirmationPage from "./pages/PaymentConfirmation"
import CSPDLInspectionPage from "./pages/CSPDL_Inspection"
import BankProcessPage from "./pages/BankProcess"

import QuotationCreatePage from "./pages/QuatationCreate"
import AddUser from "./pages/AddUser"
import DropdownPage from "./pages/Dropdown"
import QCPage from "./pages/QC"
import IpPayment from "./pages/IpPayment"
import DocumentsUpload from "./pages/DocumentsUpload"
import FinalPayment from "./pages/FinalPayment"
import AssignServey from "./pages/AssignServey"
import DCRPage from "./pages/DCR"
import RegistrationPage from "./pages/Registration"
import LeadPage from "./pages/LeadPage"
import { getFirstAccessibleRoute } from "./utils/navigation"
import "./index.css"

// Auth wrapper component to protect routes
const ProtectedRoute = ({ children, allowedRoles = [], pageLabel }) => {
  const username = sessionStorage.getItem("username")
  const userRole = (sessionStorage.getItem("role") || "").toLowerCase()
  const pageAccess = sessionStorage.getItem("pageAccess") || "ALL"

  // If no user is logged in, redirect to login
  if (!username) {
    return <Navigate to="/login" replace />
  }

  // If role check fails
  if (allowedRoles.length > 0 && !allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
    const fallback = getFirstAccessibleRoute(userRole, pageAccess)
    return <Navigate to={fallback} replace />
  }

  // Check page level permission if pageLabel is specified and user is not admin
  if (pageLabel && userRole !== "admin" && pageAccess !== "ALL") {
    const allowedPages = pageAccess.split(",").map(p => p.trim()).filter(Boolean)
    const isPageAllowed = allowedPages.some(p => {
      const cleanName = p.split("(")[0].split("[")[0].trim()
      return cleanName === pageLabel.trim()
    })
    if (!isPageAllowed) {
      const fallback = getFirstAccessibleRoute(userRole, pageAccess)
      return <Navigate to={fallback} replace />
    }
  }

  return children
}

const DashboardRedirect = () => {
  const username = sessionStorage.getItem("username")
  if (!username) {
    return <Navigate to="/login" replace />
  }
  const userRole = sessionStorage.getItem("role")
  const pageAccess = sessionStorage.getItem("pageAccess")
  const targetRoute = getFirstAccessibleRoute(userRole, pageAccess)
  return <Navigate to={targetRoute} replace />
}

function App() {

  return (
    <DeviceProvider>
      <Router>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Login route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Dashboard redirect */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Admin & User Dashboard route */}
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute pageLabel="Dashboard">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Assign Task route - only for admin */}
          <Route
            path="/dashboard/assign-task"
            element={
              <ProtectedRoute allowedRoles={["admin", "user"]} pageLabel="Enquiry Form">
                <AdminAssignTask />
              </ProtectedRoute>
            }
          />

          {/* Lead Page route */}
          <Route
            path="/dashboard/LeadPage"
            element={
              <ProtectedRoute pageLabel="Lead Page">
                <LeadPage />
              </ProtectedRoute>
            }
          />

          {/* Survey Report route for user */}
          <Route
            path="/dashboard/SurveyReport"
            element={
              <ProtectedRoute pageLabel="Site Survey">
                <SurveyReportPage />
              </ProtectedRoute>
            }
          />
          {/*Quotationsend route for user */}
          <Route
            path="/dashboard/Quotationsend"
            element={
              <ProtectedRoute>
                <QuotationsendPage />
              </ProtectedRoute>
            }
          />
          {/*Follow up route for user */}
          <Route
            path="/dashboard/Followup"
            element={
              <ProtectedRoute pageLabel="Sales Call">
                <FollowupPage />
              </ProtectedRoute>
            }
          />

          {/*Order Place route for user */}
          <Route
            path="/dashboard/OrderPlace"
            element={
              <ProtectedRoute pageLabel="Solarkart">
                <OrderPlacePage />
              </ProtectedRoute>
            }
          />

          {/*IP Assignment route for user */}
          <Route
            path="/dashboard/IPAssigment"
            element={
              <ProtectedRoute>
                <IPAssigmentPage />
              </ProtectedRoute>
            }
          />

          {/*Dispatchmaterial route for user */}
          <Route
            path="/dashboard/Dispatchmaterial"
            element={
              <ProtectedRoute pageLabel="Dispatch Material">
                <DispatchmaterialPage />
              </ProtectedRoute>
            }
          />

          {/*InformToCustomer route for user */}
          <Route
            path="/dashboard/InformToCustomer"
            element={
              <ProtectedRoute pageLabel="Inform To Customer">
                <InformToCustomerPage />
              </ProtectedRoute>
            }
          />

          {/*Materialreceived route for user */}
          <Route
            path="/dashboard/Materialreceived"
            element={
              <ProtectedRoute pageLabel="IP Material Received">
                <MaterialreceivedPage />
              </ProtectedRoute>
            }
          />

          {/*Installation route for user */}
          <Route
            path="/dashboard/Installation"
            element={
              <ProtectedRoute pageLabel="Installation">
                <InstallationPage />
              </ProtectedRoute>
            }
          />

          {/*Billing route for user */}
          <Route
            path="/dashboard/Billing"
            element={
              <ProtectedRoute pageLabel="Billings and Payment Details">
                <BillingPage />
              </ProtectedRoute>
            }
          />

          {/*CspdclForSynconization route for user */}
          <Route
            path="/dashboard/CspdclForSynconization"
            element={
              <ProtectedRoute pageLabel="Mandatory Documents for Synchronization">
                <CspdclForSynconizationPage />
              </ProtectedRoute>
            }
          />

          {/*Inspection route for user */}
          <Route
            path="/dashboard/Inspection"
            element={
              <ProtectedRoute pageLabel="Inspection">
                <InspectionPage />
              </ProtectedRoute>
            }
          />

          {/*ProjectCommissioning route for user */}
          <Route
            path="/dashboard/ProjectCommission"
            element={
              <ProtectedRoute pageLabel="Project Synchronisation">
                <ProjectCommissioningPage />
              </ProtectedRoute>
            }
          />

          {/*Redemption route for user */}
          <Route
            path="/dashboard/Redemption"
            element={
              <ProtectedRoute pageLabel="Subsidy Redemption">
                <RedemptionPage />
              </ProtectedRoute>
            }
          />

          {/*SubsidyDisbursal route for user */}
          <Route
            path="/dashboard/SubsidyDisbursal"
            element={
              <ProtectedRoute pageLabel="Subsidy Disbursal">
                <SubsidyDisbursalPage />
              </ProtectedRoute>
            }
          />

          {/*Payment route for user */}
          <Route
            path="/dashboard/Payment"
            element={
              <ProtectedRoute pageLabel="Payment">
                <PaymentPage />
              </ProtectedRoute>
            }
          />

          {/*Insurance route for user */}
          <Route
            path="/dashboard/Insurance"
            element={
              <ProtectedRoute pageLabel="Insurance">
                <InsurancePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/ModuleEntry"
            element={
              <ProtectedRoute pageLabel="Module Entry">
                <ModuleEntryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/ProductList"
            element={
              <ProtectedRoute pageLabel="Product List">
                <ProductListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/DispatchApproval"
            element={
              <ProtectedRoute pageLabel="Dispatch Approval">
                <DispatchApprovalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/DispatchPlanne"
            element={
              <ProtectedRoute pageLabel="Dispatch Planner">
                <DispatchPlannerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/PaymentConfirmation"
            element={
              <ProtectedRoute pageLabel="Payment Confirmation">
                <PaymentConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/CSPDL_Inspection"
            element={
              <ProtectedRoute pageLabel="CSPDL Inspection">
                <CSPDLInspectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/BankProcess"
            element={
              <ProtectedRoute pageLabel="Bank Process">
                <BankProcessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/QCPage"
            element={
              <ProtectedRoute pageLabel="QC">
                <QCPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/IpPayment"
            element={
              <ProtectedRoute pageLabel="IP Payment">
                <IpPayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/DocumentsUpload"
            element={
              <ProtectedRoute pageLabel="Documents Uploads">
                <DocumentsUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/FinalPayment"
            element={
              <ProtectedRoute pageLabel="Financial">
                <FinalPayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/AssignServey"
            element={
              <ProtectedRoute pageLabel="Assign Survey">
                <AssignServey />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/DCRPage"
            element={
              <ProtectedRoute pageLabel="DCR Creation">
                <DCRPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/RegistrationPage"
            element={
              <ProtectedRoute pageLabel="Registration">
                <RegistrationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/QuotationCreatePage"
            element={
              <ProtectedRoute pageLabel="Quotation Create">
                <QuotationCreatePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/AddUser"
            element={
              <ProtectedRoute pageLabel="Add User">
                <AddUser />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/Dropdown"
            element={
              <ProtectedRoute pageLabel="Dropdown">
                <DropdownPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/energy-analysis"
            element={
              <ProtectedRoute>
                <EnergyAnalysis />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/analysis-graph"
            element={
              <ProtectedRoute pageLabel="Analysis Graph">
                <AnalysisGraphPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/all-graph"
            element={
              <ProtectedRoute pageLabel="All Graph">
                <AllGraph />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/weekly-performance-report"
            element={
              <ProtectedRoute pageLabel="Weekly Report">
                <WeeklyPerformanceReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/monthly-performance-report"
            element={
              <ProtectedRoute pageLabel="Monthly Report">
                <MonthlyPerformanceReport />
              </ProtectedRoute>
            }
          />


          {/* Backward compatibility redirects */}
          <Route path="/admin/*" element={<Navigate to="/dashboard/admin" replace />} />
          <Route path="/admin/dashboard" element={<Navigate to="/dashboard/admin" replace />} />
          <Route path="/admin/assign-task" element={<Navigate to="/dashboard/assign-task" replace />} />
          <Route path="/user/*" element={<Navigate to="/dashboard/admin" replace />} />
        </Routes>
      </Router>
    </DeviceProvider>
  )
}

export default App
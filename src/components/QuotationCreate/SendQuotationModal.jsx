import React from "react";
import {
  FileText,
  MessageCircle,
  Mail,
  Send,
  X,
} from "lucide-react";

export default function SendQuotationModal({
  showSendModal,
  setShowSendModal,
  selectedQuotation,
  sendingWhatsApp,
  sendingEmail,
  sendingBoth,
  handleSend,
  handleSendBoth,
}) {
  if (!showSendModal || !selectedQuotation) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5">
          
          {/* Close Icon */}
          <button
            onClick={() => setShowSendModal(false)}
            className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-red-500 text-white transition-all duration-300 hover:rotate-90 hover:scale-110"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>

            <div>
              <h3 className="text-white font-bold text-2xl">
                Send Quotation
              </h3>
              <p className="text-blue-100 text-sm">
                Share quotation instantly
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">

          {/* Quotation Info */}
          <div className="mb-6 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">
                  Quotation No
                </span>

                <span className="font-bold text-gray-800">
                  {selectedQuotation.enquiryNumber}
                </span>
              </div>

              <div className="border-t border-gray-200"></div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">
                  Customer
                </span>

                <span className="font-semibold text-gray-800 text-right">
                  {selectedQuotation.beneficiaryName}
                </span>
              </div>

              <div className="border-t border-gray-200"></div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">
                  Contact
                </span>

                <span className="font-semibold text-gray-800">
                  {selectedQuotation.contactNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-4">

            {/* First Row */}
            <div className="grid grid-cols-2 gap-4">

              {/* WhatsApp Button */}
              <button
                onClick={() =>
                  handleSend("whatsapp", selectedQuotation)
                }
                disabled={
                  sendingWhatsApp ||
                  sendingEmail ||
                  sendingBoth
                }
                className="group relative overflow-hidden px-4 py-4 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-2xl shadow-lg hover:shadow-green-300 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  {sendingWhatsApp ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span className="font-medium text-sm">
                        Sending...
                      </span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-7 w-7 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-sm text-center">
                        WhatsApp
                      </span>
                    </>
                  )}
                </div>
              </button>

              {/* Email Button */}
              <button
                onClick={() =>
                  handleSend("email", selectedQuotation)
                }
                disabled={
                  sendingWhatsApp ||
                  sendingEmail ||
                  sendingBoth
                }
                className="group relative overflow-hidden px-4 py-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-2xl shadow-lg hover:shadow-blue-300 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  {sendingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span className="font-medium text-sm">
                        Sending...
                      </span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-7 w-7 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-sm text-center">
                        Email
                      </span>
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Send Both Button */}
            <button
              onClick={() =>
                handleSendBoth(selectedQuotation)
              }
              disabled={
                sendingWhatsApp ||
                sendingEmail ||
                sendingBoth
              }
              className="group w-full px-5 py-4 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-700 text-white rounded-2xl shadow-xl hover:shadow-purple-300 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-3">
                {sendingBoth ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span className="font-semibold text-lg">
                      Sending...
                    </span>
                  </>
                ) : (
                  <>
                    <Send className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                    <span className="font-bold text-lg">
                      Send Both
                    </span>
                  </>
                )}
              </div>
            </button>

            {/* Bottom Cancel Button */}
            <button
              onClick={() => setShowSendModal(false)}
              className="mt-2 w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold rounded-2xl hover:scale-[1.02] hover:shadow-lg hover:shadow-red-300 transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
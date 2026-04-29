import React from "react";
import { FileText, MessageCircle, Mail, Send } from "lucide-react";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-xl">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Send Quotation
          </h3>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm mb-2">
              <strong>Quotation No:</strong> {selectedQuotation.enquiryNumber}
            </p>
            <p className="text-sm mb-2">
              <strong>Customer:</strong> {selectedQuotation.beneficiaryName}
            </p>
            <p className="text-sm">
              <strong>Contact:</strong> {selectedQuotation.contactNumber}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleSend("whatsapp", selectedQuotation)}
              disabled={sendingWhatsApp || sendingEmail || sendingBoth}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingWhatsApp ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <MessageCircle className="h-5 w-5" />
                  Send WhatsApp Only
                </>
              )}
            </button>

            <button
              onClick={() => handleSend("email", selectedQuotation)}
              disabled={sendingWhatsApp || sendingEmail || sendingBoth}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingEmail ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5" />
                  Send Email Only
                </>
              )}
            </button>

            <button
              onClick={() => handleSendBoth(selectedQuotation)}
              disabled={sendingWhatsApp || sendingEmail || sendingBoth}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingBoth ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Send Both
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => setShowSendModal(false)}
            className="mt-4 w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

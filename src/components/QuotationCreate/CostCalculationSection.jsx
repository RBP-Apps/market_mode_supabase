import React from "react";
import { Percent } from "lucide-react";

export default function CostCalculationSection({
  formData,
  productDetails,
  sectionClass,
  sectionTitleClass,
}) {
  return (
    <div className={sectionClass}>
      <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
        <h2 className={sectionTitleClass}>
          <Percent className="h-5 w-5 mr-2" />
          Cost Calculation
        </h2>
      </div>

      <div className="p-6">
        {(() => {
          const amount = parseFloat(productDetails.amount || 0);
          const disc = parseFloat(formData.disc || 0);
          const gst = parseFloat(productDetails.gst || 0);
          const central = parseFloat(formData.subCentral || 0);
          const state = parseFloat(formData.subState || 0);

          const discountAmount = (amount * disc) / 100;
          const afterDiscount = amount - discountAmount;

          const gstAmount =
            gst < 1
              ? afterDiscount * gst // decimal case (0.18)
              : (afterDiscount * gst) / 100; // percentage case (18)

          const afterGST = afterDiscount + gstAmount;
          const netCost = afterGST - central - state;

          const displayGST = gst < 1 ? gst * 100 : gst;

          return (
            <>
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  {/* Original Amount */}
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="text-gray-600 font-medium">
                      Original Amount:
                    </span>
                    <span className="text-lg font-semibold text-gray-800">
                      ₹ {amount.toFixed(2)}
                    </span>
                  </div>

                  {/* Discount */}
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="text-gray-600 font-medium">
                      Discount ({disc}%):
                    </span>
                    <span className="text-lg font-semibold text-red-600">
                      - ₹ {discountAmount.toFixed(2)}
                    </span>
                  </div>

                  {/* After Discount */}
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg shadow-sm col-span-1 md:col-span-2">
                    <span className="text-blue-700 font-semibold">
                      After Discount:
                    </span>
                    <span className="text-xl font-bold text-blue-700">
                      ₹ {afterDiscount.toFixed(2)}
                    </span>
                  </div>

                  {/* GST */}
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="text-gray-600 font-medium">
                      GST ({displayGST.toFixed(2)}%):
                    </span>
                    <span className="text-lg font-semibold text-green-600">
                      + ₹ {gstAmount.toFixed(2)}
                    </span>
                  </div>

                  {/* After GST */}
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg shadow-sm col-span-1 md:col-span-2">
                    <span className="text-blue-700 font-semibold">
                      After GST:
                    </span>
                    <span className="text-xl font-bold text-blue-700">
                      ₹ {afterGST.toFixed(2)}
                    </span>
                  </div>

                  {/* Central Subsidy */}
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="text-gray-600 font-medium">
                      Central Subsidy:
                    </span>
                    <span className="text-lg font-semibold text-green-600">
                      - ₹ {central.toFixed(2)}
                    </span>
                  </div>

                  {/* State Subsidy */}
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="text-gray-600 font-medium">
                      State Subsidy:
                    </span>
                    <span className="text-lg font-semibold text-green-600">
                      - ₹ {state.toFixed(2)}
                    </span>
                  </div>

                  {/* NET COST */}
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-md col-span-1 md:col-span-2">
                    <span className="text-white font-bold text-lg">
                      NET COST:
                    </span>
                    <span className="text-white font-bold text-2xl">
                      ₹ {netCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formula */}
              <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold mb-1">Calculation Formula:</p>
                <p>
                  Net Cost = (Amount - Discount) + GST - (Central Subsidy +
                  State Subsidy)
                </p>
                <p className="mt-1">
                  Where: Discount = Amount × {disc}%, GST = (Amount - Discount)
                  × {displayGST}%
                </p>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

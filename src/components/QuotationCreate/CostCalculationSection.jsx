import React from "react";
import { Percent } from "lucide-react";

export default function CostCalculationSection({
  formData = {},
  productDetails = {},
  sectionClass,
  sectionTitleClass,
}) {
  const parseNum = (val) => {
    if (val === undefined || val === null || val === "") return 0;
    const clean = String(val).replace(/,/g, "").replace(/[^\d.-]/g, "");
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const fmt = (v) =>
    parseNum(v).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const amount = parseNum(productDetails.amount);
  const disc = parseNum(formData.disc);
  const gst = parseNum(productDetails.gst);
  const central = parseNum(formData.subCentral);
  const state = parseNum(formData.subState);
  const applicableSubsidy = parseNum(formData.applicableSubsidy);

  const discountAmount = (amount * disc) / 100;
  const afterDiscount = amount - discountAmount;

  const gstAmount =
    gst < 1
      ? afterDiscount * gst // decimal case (0.18)
      : (afterDiscount * gst) / 100; // percentage case (18)

  const afterGST = afterDiscount + gstAmount;
  const totalSubsidy = (central + state) > 0 ? central + state : applicableSubsidy;
  const netCost = Math.max(0, afterGST - totalSubsidy);

  const displayGST = gst < 1 ? gst * 100 : gst;

  return (
    <div className={sectionClass}>
      <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 rounded-t-xl">
        <h2 className={sectionTitleClass}>
          <Percent className="h-5 w-5 mr-2" />
          Cost Calculation
        </h2>
      </div>

      <div className="p-6">
        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {/* Original Amount */}
            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
              <span className="text-gray-600 font-medium">Original Amount:</span>
              <span className="text-lg font-semibold text-gray-800">
                ₹ {fmt(amount)}
              </span>
            </div>

            {/* Discount */}
            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
              <span className="text-gray-600 font-medium">Discount ({disc}%):</span>
              <span className="text-lg font-semibold text-red-600">
                - ₹ {fmt(discountAmount)}
              </span>
            </div>

            {/* After Discount */}
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg shadow-sm col-span-1 md:col-span-2">
              <span className="text-blue-700 font-semibold">After Discount:</span>
              <span className="text-xl font-bold text-blue-700">
                ₹ {fmt(afterDiscount)}
              </span>
            </div>

            {/* GST */}
            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
              <span className="text-gray-600 font-medium">
                GST ({displayGST.toFixed(2)}%):
              </span>
              <span className="text-lg font-semibold text-green-600">
                + ₹ {fmt(gstAmount)}
              </span>
            </div>

            {/* Applicable Subsidy */}
            {formData.applicableSubsidy ? (
              <div className="flex justify-between items-center p-3 bg-emerald-50/70 rounded-lg shadow-sm border border-emerald-200">
                <span className="text-emerald-900 font-medium">
                  Applicable Subsidy:
                </span>
                <span className="text-lg font-bold text-emerald-700">
                  ₹ {applicableSubsidy > 0 ? fmt(applicableSubsidy) : formData.applicableSubsidy}
                </span>
              </div>
            ) : null}

            {/* After GST */}
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg shadow-sm col-span-1 md:col-span-2">
              <span className="text-blue-700 font-semibold">After GST:</span>
              <span className="text-xl font-bold text-blue-700">
                ₹ {fmt(afterGST)}
              </span>
            </div>

            {/* Central Subsidy */}
            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
              <span className="text-gray-600 font-medium">Central Subsidy:</span>
              <span className="text-lg font-semibold text-green-600">
                - ₹ {fmt(central)}
              </span>
            </div>

            {/* State Subsidy */}
            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
              <span className="text-gray-600 font-medium">State Subsidy:</span>
              <span className="text-lg font-semibold text-green-600">
                - ₹ {fmt(state)}
              </span>
            </div>

            {/* NET COST */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-md col-span-1 md:col-span-2">
              <span className="text-white font-bold text-lg">NET COST:</span>
              <span className="text-white font-bold text-2xl">
                ₹ {fmt(netCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Formula */}
        <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-semibold mb-1">Calculation Formula:</p>
          <p>
            Net Cost = (Amount - Discount) + GST - (Central Subsidy + State Subsidy / Applicable Subsidy)
          </p>
          <p className="mt-1">
            Where: Discount = Amount × {disc}%, GST = (Amount - Discount) × {displayGST}%
          </p>
        </div>
      </div>
    </div>
  );
}

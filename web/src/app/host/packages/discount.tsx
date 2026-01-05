"use client";
import { useState } from "react";

export default function DiscountSettingsStep() {
  const [enabled, setEnabled] = useState(false);
  const [percentage, setPercentage] = useState(10);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  function validate() {
    if (enabled && (percentage < 5 || percentage > 70)) {
      setError("Discount must be between 5% and 70%.");
      return false;
    }
    if (enabled && startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      setError("End date must be after start date.");
      return false;
    }
    setError("");
    return true;
  }

  function handleSave() {
    if (!validate()) return;
    // TODO: Call PATCH API to save discount settings
    alert("Discount settings saved!");
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Discount Settings</h1>
      <div className="flex items-center gap-4">
        <label className="font-semibold">Enable Discount</label>
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
      </div>
      {enabled && (
        <div className="space-y-4">
          <div>
            <label className="block font-semibold">Discount Percentage</label>
            <div className="flex gap-2 mt-2">
              {[5, 10, 15, 20, 25, 30, 50, 70].map(val => (
                <button
                  key={val}
                  className={`px-3 py-1 rounded ${percentage === val ? "bg-purple-600 text-white" : "bg-gray-100"}`}
                  onClick={() => setPercentage(val)}
                >
                  {val}%
                </button>
              ))}
              <input
                type="number"
                min={5}
                max={70}
                value={percentage}
                onChange={e => setPercentage(Number(e.target.value))}
                className="ml-4 w-20 border rounded px-2 py-1"
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">Valid range: 5% - 70%</div>
          </div>
          <div className="flex gap-4">
            <div>
              <label className="block font-semibold">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block font-semibold">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-2 py-1" />
            </div>
          </div>
          <div className="mt-4 p-4 rounded bg-green-50 border border-green-200">
            <div className="font-semibold">Pricing Preview</div>
            <div className="text-sm">Original Price: $150/night</div>
            <div className="text-sm">Discount ({percentage}%): -${(150 * percentage / 100).toFixed(2)}</div>
            <div className="text-sm font-bold">Final Price: ${(150 * (1 - percentage / 100)).toFixed(2)}</div>
          </div>
        </div>
      )}
      {error && <div className="text-red-600 font-semibold">{error}</div>}
      <button
        className="mt-6 px-6 py-2 rounded bg-purple-600 text-white font-bold"
        onClick={handleSave}
      >
        Save Discount Settings
      </button>
    </div>
  );
}

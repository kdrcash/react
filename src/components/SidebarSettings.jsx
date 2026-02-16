import React from "react";

export default function SidebarSettings({ cfgTargetYear, setCfgTargetYear }) {
    return (
        <div className="p-5">
            <div className="text-xl font-bold mb-4">⚙️ 분석 설정</div>

            <label className="block text-sm text-slate-200 mb-2">회계 연도</label>
            <input
                type="number"
                min={1900}
                max={2100}
                value={cfgTargetYear}
                onChange={(e) => setCfgTargetYear(Number(e.target.value || 0))}
                className="w-full rounded-lg px-3 py-2 text-slate-900 bg-white border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />

            <div className="mt-6 text-xs uppercase tracking-wider text-slate-300">
                Sidebar (Streamlit 1:1)
            </div>
        </div>
    );
}

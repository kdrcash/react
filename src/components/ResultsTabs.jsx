import React, { useState } from "react";
import DashboardTab from "./dashboard/DashboardTab";
import NameCheckTab from "./namecheck/NameCheckTab";
import DetailDataTab from "./detail/DetailDataTab";

export default function ResultsTabs({ results }) {
    const tabs = [
        { key: "dashboard", label: "🖥️ 통합 대시보드" },
        { key: "namecheck", label: "🔍 확인 필요 항목" },
        { key: "detail", label: "📂 상세 데이터 확인" },
        { key: "download", label: "📥 리포트 다운로드" },
    ];
    const [active, setActive] = useState("dashboard");

    return (
        <div>
            {/* tab bar */}
            <div className="bg-white rounded-2xl shadow-sm p-2 flex gap-2 border border-slate-200">
                {tabs.map((t) => {
                    const on = active === t.key;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setActive(t.key)}
                            className={[
                                "px-4 py-2 rounded-xl font-semibold transition",
                                on
                                    ? "text-white bg-slate-900 shadow"
                                    : "text-slate-600 hover:bg-slate-50",
                            ].join(" ")}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4">
                {active === "dashboard" && <DashboardTab results={results} />}

                {active === "namecheck" && <NameCheckTab results={results} />}

                {active === "detail" && <DetailDataTab results={results} />}

                {active === "download" && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                        다운로드 UI (백엔드 붙이면 파일 생성/다운로드 연결)
                    </div>
                )}
            </div>
        </div>
    );
}

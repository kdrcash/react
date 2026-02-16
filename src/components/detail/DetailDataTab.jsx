import React, { useMemo, useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

function fmtKRW(n) {
    return Number(n || 0).toLocaleString("ko-KR");
}

/**
 * 현재는 샘플 데이터 기반
 * 추후 results 연결 시 buildDetailData만 교체
 */
function buildDetailData(results) {
    const matched = [
        { partner: "snackfee", bank: 100000, tax: 100000, diff: 0 },
    ];

    const bankUnmatched = [
        { partner: "삼성한신아파트입주자", date: "2025-01-02", memo: "관리비", amt: 77000 },
    ];

    const taxUnmatched = [
        { partner: "한훈천NH", date: "2025-01-02", item: "진료재료", amt: 660000 },
    ];

    return { matched, bankUnmatched, taxUnmatched };
}

function SubTab({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={[
                "px-4 py-2 rounded-xl text-sm font-semibold border transition",
                active
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
            ].join(" ")}
        >
            {children}
        </button>
    );
}

export default function DetailDataTab({ results }) {
    const [tab, setTab] = useState("matched");
    const data = useMemo(() => buildDetailData(results), [results]);

    return (
        <div className="space-y-4">
            <Card
                title="상세 데이터 확인"
                subtitle="매칭 결과 및 미매칭 데이터를 표 기반으로 검토합니다."
            >
                <div className="flex gap-2 mb-4">
                    <SubTab active={tab === "matched"} onClick={() => setTab("matched")}>
                        매칭 결과
                    </SubTab>
                    <SubTab active={tab === "bank"} onClick={() => setTab("bank")}>
                        은행 미매칭
                    </SubTab>
                    <SubTab active={tab === "tax"} onClick={() => setTab("tax")}>
                        세금계산서 미매칭
                    </SubTab>
                </div>

                {/* 매칭 결과 */}
                {tab === "matched" && (
                    <div className="overflow-auto border border-slate-200 rounded-2xl">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-slate-700 font-semibold">
                                <tr>
                                    <th className="px-3 py-2 text-left">거래처</th>
                                    <th className="px-3 py-2 text-right">은행 합계</th>
                                    <th className="px-3 py-2 text-right">세금 합계</th>
                                    <th className="px-3 py-2 text-right">차액</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.matched.map((r, i) => (
                                    <tr key={i} className="border-t border-slate-200 hover:bg-slate-50">
                                        <td className="px-3 py-2">{r.partner}</td>
                                        <td className="px-3 py-2 text-right">{fmtKRW(r.bank)}원</td>
                                        <td className="px-3 py-2 text-right">{fmtKRW(r.tax)}원</td>
                                        <td className="px-3 py-2 text-right">
                                            <span className={`font-semibold ${r.diff !== 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                {fmtKRW(r.diff)}원
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 은행 미매칭 */}
                {tab === "bank" && (
                    <div className="overflow-auto border border-slate-200 rounded-2xl">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-slate-700 font-semibold">
                                <tr>
                                    <th className="px-3 py-2 text-left">거래처</th>
                                    <th className="px-3 py-2 text-left">날짜</th>
                                    <th className="px-3 py-2 text-left">적요</th>
                                    <th className="px-3 py-2 text-right">금액</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.bankUnmatched.length === 0 ? (
                                    <tr><td colSpan="4" className="px-3 py-4 text-center text-slate-500">데이터가 없습니다.</td></tr>
                                ) : data.bankUnmatched.map((r, i) => (
                                    <tr key={i} className="border-t border-slate-200 hover:bg-slate-50">
                                        <td className="px-3 py-2">{r.partner}</td>
                                        <td className="px-3 py-2">{r.date}</td>
                                        <td className="px-3 py-2">{r.memo}</td>
                                        <td className="px-3 py-2 text-right font-semibold">
                                            {fmtKRW(r.amt)}원
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 세금 미매칭 */}
                {tab === "tax" && (
                    <div className="overflow-auto border border-slate-200 rounded-2xl">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-slate-700 font-semibold">
                                <tr>
                                    <th className="px-3 py-2 text-left">거래처</th>
                                    <th className="px-3 py-2 text-left">날짜</th>
                                    <th className="px-3 py-2 text-left">품목</th>
                                    <th className="px-3 py-2 text-right">금액</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.taxUnmatched.length === 0 ? (
                                    <tr><td colSpan="4" className="px-3 py-4 text-center text-slate-500">데이터가 없습니다.</td></tr>
                                ) : data.taxUnmatched.map((r, i) => (
                                    <tr key={i} className="border-t border-slate-200 hover:bg-slate-50">
                                        <td className="px-3 py-2">{r.partner}</td>
                                        <td className="px-3 py-2">{r.date}</td>
                                        <td className="px-3 py-2">{r.item}</td>
                                        <td className="px-3 py-2 text-right font-semibold">
                                            {fmtKRW(r.amt)}원
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}

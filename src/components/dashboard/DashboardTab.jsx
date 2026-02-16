import React, { useMemo, useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

/**
 * 결과 객체(results) 구조가 아직 확정되지 않았어도 UI가 깨지지 않게
 * - results가 있으면 가능한 범위에서 숫자/목록을 만들고
 * - 없으면 샘플 데이터로 UI를 유지
 */

function fmtKRW(n) {
    const v = Number(n || 0);
    return v.toLocaleString("ko-KR");
}

function MetricCard({ label, value, helper, tone = "blue" }) {
    const toneMap = {
        blue: "border-indigo-200 bg-indigo-50/50",
        green: "border-emerald-200 bg-emerald-50/50",
        amber: "border-amber-200 bg-amber-50/50",
        slate: "border-slate-200 bg-slate-50",
    };
    return (
        <div className={`rounded-2xl border ${toneMap[tone]} p-4`}>
            <div className="text-sm text-slate-600 font-semibold">{label}</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
            {helper && <div className="mt-1 text-xs text-slate-500">{helper}</div>}
        </div>
    );
}

function FilterPills({ value, onChange }) {
    const items = [
        { k: "all", label: "전체" },
        { k: "exact", label: "완전일치" },
        { k: "partial", label: "부분일치" },
        { k: "diff", label: "불일치" },
    ];
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((it) => {
                const on = value === it.k;
                return (
                    <button
                        key={it.k}
                        onClick={() => onChange(it.k)}
                        className={[
                            "px-3 py-1.5 rounded-xl text-sm font-semibold border transition",
                            on
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                        ].join(" ")}
                    >
                        {it.label}
                    </button>
                );
            })}
        </div>
    );
}

function buildDashboardData(results) {
    // 1) 실제 results가 있으면 여기서 파싱해도 됨
    // 지금은 구조가 고정되지 않았으니 안전하게 fallback 제공

    // 샘플(없을 때)
    const samplePartners = [
        {
            partner: "한훈천NH",
            bank_total: 2000000,
            tax_total: 660000,
            diff: 1340000,
            status: "diff",
            timeline: [
                { date: "2025-01-02", type: "BANK", memo: "한훈천NH", amt: 2000000 },
                { date: "2025-01-02", type: "TAX", memo: "품목: 진료재료", amt: 660000 },
            ],
        },
        {
            partner: "snackfee",
            bank_total: 100000,
            tax_total: 100000,
            diff: 0,
            status: "exact",
            timeline: [{ date: "2025-01-02", type: "BANK", memo: "snackfee", amt: 100000 }],
        },
        {
            partner: "삼성한신아파트입주자",
            bank_total: 77000,
            tax_total: 0,
            diff: 77000,
            status: "partial",
            timeline: [{ date: "2025-01-02", type: "BANK", memo: "관리비", amt: 77000 }],
        },
    ];

    // TODO: results 파싱 로직은 나중에 코어 API 붙이면 여기만 교체하면 됨
    const partners = samplePartners;

    const bankSum = partners.reduce((a, p) => a + (p.bank_total || 0), 0);
    const taxSum = partners.reduce((a, p) => a + (p.tax_total || 0), 0);
    const diffSum = bankSum - taxSum;

    const counts = {
        all: partners.length,
        exact: partners.filter((p) => p.status === "exact").length,
        partial: partners.filter((p) => p.status === "partial").length,
        diff: partners.filter((p) => p.status === "diff").length,
    };

    return { partners, bankSum, taxSum, diffSum, counts };
}

export default function DashboardTab({ results }) {
    const [filter, setFilter] = useState("all");
    const [selectedPartner, setSelectedPartner] = useState(null);

    const data = useMemo(() => buildDashboardData(results), [results]);

    const filteredPartners = useMemo(() => {
        if (filter === "all") return data.partners;
        return data.partners.filter((p) => p.status === filter);
    }, [filter, data.partners]);

    const selected = useMemo(() => {
        if (!selectedPartner) return filteredPartners[0] || null;
        const found =
            filteredPartners.find((p) => p.partner === selectedPartner) ||
            data.partners.find((p) => p.partner === selectedPartner) ||
            null;
        return found;
    }, [selectedPartner, filteredPartners, data.partners]);

    // KPI
    const kpi = [
        {
            label: "총 은행 출금",
            value: `${fmtKRW(data.bankSum)} 원`,
            helper: "업로드된 은행 거래내역 기준",
            tone: "blue",
        },
        {
            label: "총 세금계산서",
            value: `${fmtKRW(data.taxSum)} 원`,
            helper: "업로드된 세금계산서 내역 기준",
            tone: "green",
        },
        {
            label: "차액",
            value: `${fmtKRW(data.diffSum)} 원`,
            helper: "은행 - 세금계산서",
            tone: "amber",
        },
    ];

    return (
        <div className="space-y-4">
            {/* KPI Row */}
            <div className="grid grid-cols-3 gap-3">
                {kpi.map((x) => (
                    <MetricCard key={x.label} {...x} />
                ))}
            </div>

            {/* Filter + Summary */}
            <Card
                title="거래처별 매칭 현황"
                subtitle="필터로 상태를 좁히고, 거래처를 선택하면 우측에서 타임라인을 확인할 수 있습니다."
                right={
                    <div className="flex items-center gap-2">
                        <Badge tone="gray">전체 {data.counts.all}</Badge>
                        <Badge tone="green">완전 {data.counts.exact}</Badge>
                        <Badge tone="yellow">부분 {data.counts.partial}</Badge>
                        <Badge tone="red">불일치 {data.counts.diff}</Badge>
                    </div>
                }
            >
                <div className="flex items-center justify-between gap-3 mb-3">
                    <FilterPills value={filter} onChange={setFilter} />
                    <div className="text-xs text-slate-500">
                        * 현재는 UI 샘플 데이터로 동작 (결과 연결 시 자동 반영)
                    </div>
                </div>

                {/* Split Layout */}
                <div className="grid grid-cols-[420px_1fr] gap-3">
                    {/* Left: Partner List */}
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                            거래처 목록
                        </div>
                        <div className="max-h-[420px] overflow-auto bg-white">
                            {filteredPartners.length === 0 ? (
                                <div className="p-4 text-sm text-slate-500">해당 필터에 데이터가 없습니다.</div>
                            ) : (
                                filteredPartners.map((p) => {
                                    const on = selected?.partner === p.partner;
                                    const badgeTone =
                                        p.status === "exact" ? "green" : p.status === "partial" ? "yellow" : "red";
                                    return (
                                        <button
                                            key={p.partner}
                                            onClick={() => setSelectedPartner(p.partner)}
                                            className={[
                                                "w-full text-left px-3 py-3 border-t border-slate-100 hover:bg-slate-50 transition",
                                                on ? "bg-indigo-50" : "bg-white",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="font-semibold text-slate-900 truncate">{p.partner}</div>
                                                <Badge tone={badgeTone}>
                                                    {p.status === "exact"
                                                        ? "완전"
                                                        : p.status === "partial"
                                                            ? "부분"
                                                            : "불일치"}
                                                </Badge>
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500 flex gap-3">
                                                <span>은행 {fmtKRW(p.bank_total)}원</span>
                                                <span>세금 {fmtKRW(p.tax_total)}원</span>
                                                <span className="font-semibold">차액 {fmtKRW(p.diff)}원</span>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right: Timeline */}
                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                        <div className="bg-slate-50 px-3 py-2 flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-700">타임라인</div>
                            <div className="text-xs text-slate-500">선택 거래처 상세</div>
                        </div>

                        {!selected ? (
                            <div className="p-4 text-sm text-slate-500">좌측에서 거래처를 선택하세요.</div>
                        ) : (
                            <div className="p-4">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <div>
                                        <div className="text-lg font-bold text-slate-900">{selected.partner}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            은행 {fmtKRW(selected.bank_total)}원 · 세금 {fmtKRW(selected.tax_total)}원 · 차액{" "}
                                            {fmtKRW(selected.diff)}원
                                        </div>
                                    </div>
                                    <Button variant="outline">상세 보기</Button>
                                </div>

                                <div className="space-y-2">
                                    {(selected.timeline || []).map((t, idx) => {
                                        const tone =
                                            t.type === "BANK" ? "border-indigo-200 bg-indigo-50/40" : "border-emerald-200 bg-emerald-50/40";
                                        const tagTone = t.type === "BANK" ? "blue" : "green";
                                        return (
                                            <div key={idx} className={`rounded-2xl border ${tone} p-3`}>
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="text-sm font-semibold text-slate-900">{t.memo}</div>
                                                    <Badge tone={tagTone}>{t.type}</Badge>
                                                </div>
                                                <div className="mt-1 text-xs text-slate-600 flex items-center justify-between">
                                                    <span>{t.date}</span>
                                                    <span className="font-bold text-slate-900">{fmtKRW(t.amt)}원</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}

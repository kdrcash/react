import React, { useMemo, useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

function fmtKRW(n) {
    const v = Number(n || 0);
    return v.toLocaleString("ko-KR");
}

/**
 * 결과(results) 구조가 아직 확정되지 않았으니
 * - results.namecheck가 있으면 그걸 사용 (추후 연결)
 * - 없으면 샘플 큐로 UI 동작
 */
function buildQueueData(results) {
    // TODO: results 기반 파싱 (백엔드 연결 시 여기만 교체)
    // 샘플 데이터: "거래처 단위 큐" + 각 거래처에 후보 매칭 카드
    const items = [
        {
            id: "q1",
            partner: "한훈천NH",
            status: "unconfirmed", // unconfirmed | confirmed
            reason: "차액이 큼 (불일치)",
            bank: { date: "2025-01-02", memo: "한훈천NH", amt: 2000000 },
            candidates: [
                {
                    id: "c1",
                    type: "TAX",
                    score: 0.92,
                    date: "2025-01-02",
                    memo: "품목: 진료재료",
                    amt: 660000,
                    diff: 1340000,
                },
                {
                    id: "c2",
                    type: "TAX",
                    score: 0.71,
                    date: "2025-01-03",
                    memo: "품목: 소모품",
                    amt: 1200000,
                    diff: 800000,
                },
            ],
        },
        {
            id: "q2",
            partner: "삼성한신아파트입주자",
            status: "unconfirmed",
            reason: "세금계산서 없음(부분일치)",
            bank: { date: "2025-01-02", memo: "관리비", amt: 77000 },
            candidates: [],
        },
        {
            id: "q3",
            partner: "snackfee",
            status: "confirmed",
            reason: "완전일치로 확정됨",
            bank: { date: "2025-01-02", memo: "snackfee", amt: 100000 },
            candidates: [
                {
                    id: "c3",
                    type: "TAX",
                    score: 1.0,
                    date: "2025-01-02",
                    memo: "간식비",
                    amt: 100000,
                    diff: 0,
                },
            ],
        },
    ];

    // counts
    const counts = {
        all: items.length,
        unconfirmed: items.filter((x) => x.status === "unconfirmed").length,
        confirmed: items.filter((x) => x.status === "confirmed").length,
    };

    return { items, counts };
}

function Pill({ on, children, onClick }) {
    return (
        <button
            onClick={onClick}
            className={[
                "px-3 py-1.5 rounded-xl text-sm font-semibold border transition",
                on
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
            ].join(" ")}
        >
            {children}
        </button>
    );
}

function CandidateCard({ cand, onConfirm }) {
    const tone =
        cand.diff === 0
            ? "border-emerald-200 bg-emerald-50/40"
            : "border-amber-200 bg-amber-50/40";

    return (
        <div className={`rounded-2xl border ${tone} p-3`}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{cand.memo}</div>
                    <div className="text-xs text-slate-600 mt-1 flex gap-3">
                        <span>{cand.date}</span>
                        <span>Score {Math.round((cand.score || 0) * 100)}%</span>
                        <span className="font-semibold">차액 {fmtKRW(cand.diff)}원</span>
                    </div>
                </div>
                <Badge tone={cand.diff === 0 ? "green" : "yellow"}>{cand.type}</Badge>
            </div>

            <div className="mt-2 flex items-center justify-between">
                <div className="text-sm font-bold text-slate-900">{fmtKRW(cand.amt)}원</div>
                <Button variant="primary" onClick={onConfirm} className="px-3 py-1.5 rounded-xl">
                    이 후보로 확정
                </Button>
            </div>
        </div>
    );
}

export default function NameCheckTab({ results }) {
    const { items, counts } = useMemo(() => buildQueueData(results), [results]);

    // filter: all | unconfirmed | confirmed
    const [filter, setFilter] = useState("unconfirmed");
    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState(items?.[0]?.id || null);

    // 확정 상태(프론트 임시)
    // queueId -> confirmedCandidateId | null
    const [confirmedMap, setConfirmedMap] = useState(() => {
        const init = {};
        for (const it of items) {
            if (it.status === "confirmed") init[it.id] = it.candidates?.[0]?.id || "confirmed";
        }
        return init;
    });

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return items
            .filter((it) => {
                const isConfirmed = !!confirmedMap[it.id] || it.status === "confirmed";
                const stat = isConfirmed ? "confirmed" : "unconfirmed";
                if (filter !== "all" && stat !== filter) return false;
                if (q && !it.partner.toLowerCase().includes(q)) return false;
                return true;
            })
            .map((it) => {
                const isConfirmed = !!confirmedMap[it.id] || it.status === "confirmed";
                return { ...it, _stat: isConfirmed ? "confirmed" : "unconfirmed" };
            });
    }, [items, filter, query, confirmedMap]);

    const selected = useMemo(() => {
        const s =
            filtered.find((x) => x.id === selectedId) ||
            items.find((x) => x.id === selectedId) ||
            filtered[0] ||
            null;
        return s;
    }, [filtered, items, selectedId]);

    const clearAll = () => setConfirmedMap({});
    const resetSelected = () => {
        if (!selected) return;
        setConfirmedMap((m) => {
            const n = { ...m };
            delete n[selected.id];
            return n;
        });
    };

    const confirmCandidate = (queueId, candId) => {
        setConfirmedMap((m) => ({ ...m, [queueId]: candId }));
    };

    return (
        <div className="space-y-4">
            {/* Header actions */}
            <Card
                title="확인 필요 항목 (검토 큐)"
                subtitle="자동 매칭이 애매하거나 차액이 있는 건을 검토하고 확정합니다."
                right={
                    <div className="flex items-center gap-2">
                        <Badge tone="gray">전체 {counts.all}</Badge>
                        <Badge tone="yellow">미확정 {counts.unconfirmed}</Badge>
                        <Badge tone="green">확정 {counts.confirmed}</Badge>
                    </div>
                }
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Pill on={filter === "all"} onClick={() => setFilter("all")}>전체</Pill>
                        <Pill on={filter === "unconfirmed"} onClick={() => setFilter("unconfirmed")}>미확정</Pill>
                        <Pill on={filter === "confirmed"} onClick={() => setFilter("confirmed")}>확정됨</Pill>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            className="w-[260px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            placeholder="거래처 검색"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <Button variant="outline" onClick={clearAll}>전체 확정 취소</Button>
                        <Button variant="outline" onClick={resetSelected} disabled={!selected}>선택 해제</Button>
                    </div>
                </div>
            </Card>

            {/* Split: Queue list / Detail */}
            <div className="grid grid-cols-[420px_1fr] gap-3">
                {/* Left list */}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 flex justify-between">
                        <span>검토 목록</span>
                        <span className="text-xs text-slate-500">{filtered.length}건</span>
                    </div>

                    <div className="max-h-[520px] overflow-auto">
                        {filtered.length === 0 ? (
                            <div className="p-4 text-sm text-slate-500">데이터가 없습니다.</div>
                        ) : (
                            filtered.map((it) => {
                                const on = selected?.id === it.id;
                                const isConfirmed = it._stat === "confirmed";
                                return (
                                    <button
                                        key={it.id}
                                        onClick={() => setSelectedId(it.id)}
                                        className={[
                                            "w-full text-left px-3 py-3 border-t border-slate-100 hover:bg-slate-50 transition",
                                            on ? "bg-indigo-50" : "bg-white",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="font-semibold text-slate-900 truncate">{it.partner}</div>
                                            <Badge tone={isConfirmed ? "green" : "yellow"}>
                                                {isConfirmed ? "확정" : "미확정"}
                                            </Badge>
                                        </div>
                                        <div className="mt-1 text-xs text-slate-600 flex justify-between gap-2">
                                            <span className="truncate">{it.reason}</span>
                                            <span className="font-semibold">{fmtKRW(it.bank?.amt)}원</span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right detail */}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <div className="bg-slate-50 px-3 py-2 flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-700">상세</div>
                        {selected ? (
                            <div className="text-xs text-slate-500">선택: {selected.partner}</div>
                        ) : (
                            <div className="text-xs text-slate-500">선택 없음</div>
                        )}
                    </div>

                    {!selected ? (
                        <div className="p-4 text-sm text-slate-500">좌측에서 항목을 선택하세요.</div>
                    ) : (
                        <div className="p-4 space-y-4">
                            {/* Bank row summary */}
                            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-900">은행 출금</div>
                                        <div className="text-xs text-slate-600 mt-1">
                                            {selected.bank?.date} · {selected.bank?.memo}
                                        </div>
                                    </div>
                                    <Badge tone="blue">BANK</Badge>
                                </div>
                                <div className="mt-2 text-xl font-bold text-slate-900">
                                    {fmtKRW(selected.bank?.amt)}원
                                </div>
                            </div>

                            {/* Candidates */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm font-semibold text-slate-900">세금계산서 후보</div>
                                    <div className="text-xs text-slate-500">
                                        후보 {selected.candidates?.length || 0}건
                                    </div>
                                </div>

                                {(!selected.candidates || selected.candidates.length === 0) ? (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                        후보가 없습니다. (미매칭/증빙 누락 가능)
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selected.candidates.map((c) => (
                                            <CandidateCard
                                                key={c.id}
                                                cand={c}
                                                onConfirm={() => confirmCandidate(selected.id, c.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Confirmed state */}
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-slate-700">
                                    현재 상태:{" "}
                                    {confirmedMap[selected.id] ? (
                                        <span className="font-semibold text-emerald-700">확정됨</span>
                                    ) : (
                                        <span className="font-semibold text-amber-700">미확정</span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {confirmedMap[selected.id] ? (
                                        <Button variant="outline" onClick={resetSelected}>확정 해제</Button>
                                    ) : (
                                        <Button variant="outline" onClick={() => alert("후보 선택 후 확정하세요.")}>
                                            확정
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="text-xs text-slate-500">
                                * 현재는 프론트에서만 확정 상태를 관리합니다. (백엔드 연결 시 확정 결과를 저장/반영)
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { buildPreview, detectByType, makeBankFileKey } from "../../lib/filePreview";

function Select({ label, value, options, onChange }) {
    return (
        <label className="block">
            <div className="text-sm font-semibold text-slate-700 mb-1">{label}</div>
            <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map((o) => (
                    <option key={o} value={o}>
                        {o}
                    </option>
                ))}
            </select>
        </label>
    );
}

export default function BankMappingAccordion({
    bankFiles,
    bankConfigMap,
    setBankConfigMap,
}) {
    const [openKey, setOpenKey] = useState(null);
    const [cache, setCache] = useState({}); // fkey -> {cols, preview, headerRowAuto}

    // 파일 업로드되면 자동으로 첫 파일 open
    useEffect(() => {
        if (bankFiles?.length) {
            const k = makeBankFileKey(0, bankFiles[0]);
            setOpenKey((prev) => prev ?? k);
        }
    }, [bankFiles]);

    const ensurePreview = async (i, file, headerRowOverride = null) => {
        const fkey = makeBankFileKey(i, file);
        const existing = cache[fkey];
        if (existing && headerRowOverride == null) return;

        const res = await buildPreview(file, headerRowOverride);
        setCache((m) => ({ ...m, [fkey]: res }));
    };

    const updateCfg = (fkey, patch) => {
        setBankConfigMap((m) => ({ ...m, [fkey]: { ...(m[fkey] || {}), ...patch } }));
    };

    return (
        <Card
            title="은행 컬럼 매핑"
            subtitle="파일별로 헤더 시작 행 + 금액/거래처/적요/날짜 컬럼을 지정합니다."
            right={<Badge tone="blue">Step 2</Badge>}
        >
            <div className="space-y-3">
                {bankFiles.map((file, i) => {
                    const fkey = makeBankFileKey(i, file);
                    const cfg = bankConfigMap[fkey] || {};
                    const cached = cache[fkey];

                    const headerRow = Number.isFinite(cfg.headerRow) ? cfg.headerRow : cached?.headerRow;
                    const cols = cached?.cols || [];
                    const det = cols.length ? detectByType(cols, "bank") : null;

                    const done =
                        !!cols.length &&
                        cfg.amt_col &&
                        cfg.name_col &&
                        cfg.memo_col &&
                        cfg.date_col &&
                        Number.isFinite(cfg.headerRow);

                    // Apply defaults if available and not set
                    useEffect(() => {
                        if (cached && !cfg.amt_col) { // Check if not already set to avoid loop
                            const update = {};
                            if (!cfg.amt_col && det?.amt_default) update.amt_col = det.amt_default;
                            if (!cfg.name_col && det?.name_default) update.name_col = det.name_default;
                            if (!cfg.memo_col && det?.memo_default) update.memo_col = det.memo_default;
                            if (!cfg.date_col && det?.date_default) update.date_col = det.date_default;

                            // Only update if there are changes
                            if (Object.keys(update).length > 0) {
                                updateCfg(fkey, update);
                            }
                        }
                    }, [cached, det, fkey, cfg.amt_col, cfg.name_col, cfg.memo_col, cfg.date_col]); // Added dependencies


                    return (
                        <div key={fkey} className="rounded-2xl border border-slate-200 bg-white">
                            <button
                                className="w-full px-4 py-3 flex items-center justify-between"
                                onClick={async () => {
                                    setOpenKey((k) => (k === fkey ? null : fkey));
                                    await ensurePreview(i, file, Number.isFinite(cfg.headerRow) ? cfg.headerRow : null);
                                }}
                            >
                                <div className="min-w-0 text-left">
                                    <div className="font-semibold text-slate-900 truncate">{file.name}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {done ? "✔ 매핑 완료" : "매핑 필요"}
                                    </div>
                                </div>
                                <Badge tone={done ? "green" : "gray"}>{done ? "완료" : "대기"}</Badge>
                            </button>

                            {openKey === fkey && (
                                <div className="px-4 pb-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="block">
                                            <div className="text-sm font-semibold text-slate-700 mb-1">헤더 시작 행 (0부터)</div>
                                            <input
                                                type="number"
                                                min={0}
                                                max={50}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                                value={Number.isFinite(cfg.headerRow) ? cfg.headerRow : (cached?.headerRow ?? 0)}
                                                onChange={async (e) => {
                                                    const v = Number(e.target.value || 0);
                                                    updateCfg(fkey, { headerRow: v });
                                                    await ensurePreview(i, file, v);
                                                }}
                                            />
                                            <div className="text-xs text-slate-500 mt-1">
                                                헤더행을 맞추면 컬럼 목록이 정확해집니다.
                                            </div>
                                        </label>

                                        <label className="block">
                                            <div className="text-sm font-semibold text-slate-700 mb-1">계좌 라벨(선택)</div>
                                            <input
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                                value={cfg.label ?? file.name}
                                                onChange={(e) => updateCfg(fkey, { label: e.target.value })}
                                            />
                                            <div className="text-xs text-slate-500 mt-1">추적/필터용 라벨</div>
                                        </label>
                                    </div>

                                    <div className="mt-4">
                                        {!cols.length ? (
                                            <div className="text-sm text-slate-600">
                                                컬럼을 읽는 중입니다… (파일을 열어 컬럼을 파싱합니다)
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3">
                                                <Select
                                                    label="은행 금액 컬럼"
                                                    options={cols}
                                                    value={cfg.amt_col || det?.amt_default || cols[0]}
                                                    onChange={(v) => updateCfg(fkey, { amt_col: v })}
                                                />
                                                <Select
                                                    label="은행 거래처 컬럼(매칭 우선)"
                                                    options={cols}
                                                    value={cfg.name_col || det?.name_default || cols[0]}
                                                    onChange={(v) => updateCfg(fkey, { name_col: v })}
                                                />
                                                <Select
                                                    label="은행 적요 컬럼(거래처 비어있을 때 fallback)"
                                                    options={cols}
                                                    value={cfg.memo_col || det?.memo_default || cols[0]}
                                                    onChange={(v) => updateCfg(fkey, { memo_col: v })}
                                                />
                                                <Select
                                                    label="은행 날짜 컬럼"
                                                    options={cols}
                                                    value={cfg.date_col || det?.date_default || cols[0]}
                                                    onChange={(v) => updateCfg(fkey, { date_col: v })}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* preview */}
                                    {cached?.preview?.length > 0 && (
                                        <div className="mt-4">
                                            <div className="text-sm font-semibold text-slate-700 mb-2">미리보기(상위 5행)</div>
                                            <div className="overflow-auto rounded-xl border border-slate-200">
                                                <table className="min-w-full text-sm">
                                                    <thead className="bg-slate-50">
                                                        <tr>
                                                            {Object.keys(cached.preview[0]).slice(0, 8).map((k) => (
                                                                <th key={k} className="text-left px-3 py-2 font-semibold text-slate-700 whitespace-nowrap">
                                                                    {k}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {cached.preview.map((row, idx) => (
                                                            <tr key={idx} className="border-t border-slate-200">
                                                                {Object.keys(row).slice(0, 8).map((k) => (
                                                                    <td key={k} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                                                                        {row[k]}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-2">
                                                * 표시 컬럼은 최대 8개로 제한했습니다(UX 목적).
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

import React, { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { buildPreview, detectByType } from "../../lib/filePreview";

function Select({ label, value, options, onChange }) {
    return (
        <label className="block">
            <div className="text-sm font-semibold text-slate-700 mb-1">{label}</div>
            <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                value={value ?? ""}
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

export default function TaxMappingCard({ taxFile, taxOverrides, setTaxOverrides }) {
    const [cache, setCache] = useState(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            if (!taxFile) return;
            const res = await buildPreview(taxFile, null);
            if (!alive) return;
            setCache(res);
            const det = detectByType(res.cols || [], "tax");

            // 초기 기본값 세팅(이미 선택된 값이 있으면 유지)
            setTaxOverrides((prev) => ({
                amt_col: prev?.amt_col || det.amt_default || res.cols?.[0] || null,
                name_col: prev?.name_col || det.name_default || res.cols?.[0] || null,
                date_col: prev?.date_col || det.date_default || res.cols?.[0] || null,
                item_col: prev?.item_col ?? null,
            }));
        })();
        return () => {
            alive = false;
        };
    }, [taxFile, setTaxOverrides]);

    const cols = cache?.cols || [];
    const done = !!taxOverrides?.amt_col && !!taxOverrides?.name_col && !!taxOverrides?.date_col;

    return (
        <Card
            title={
                <div className="flex items-center gap-2">
                    <span>세금계산서 컬럼 매핑</span>
                    <Badge tone={done ? "green" : "gray"}>{done ? "완료" : "대기"}</Badge>
                </div>
            }
            subtitle="금액/거래처/발행일 컬럼을 선택합니다. 품목 컬럼은 타임라인 표기용(선택)입니다."
            right={<Badge tone="blue">Step 2</Badge>}
        >
            {!taxFile ? (
                <div className="text-sm text-slate-600">세금계산서 파일을 업로드하세요.</div>
            ) : !cols.length ? (
                <div className="text-sm text-slate-600">컬럼을 읽는 중입니다…</div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    <Select
                        label="세금계산서 금액 컬럼"
                        options={cols}
                        value={taxOverrides.amt_col || cols[0]}
                        onChange={(v) => setTaxOverrides((p) => ({ ...(p || {}), amt_col: v }))}
                    />
                    <Select
                        label="세금계산서 거래처/상호 컬럼"
                        options={cols}
                        value={taxOverrides.name_col || cols[0]}
                        onChange={(v) => setTaxOverrides((p) => ({ ...(p || {}), name_col: v }))}
                    />
                    <Select
                        label="세금계산서 작성/발행일 컬럼"
                        options={cols}
                        value={taxOverrides.date_col || cols[0]}
                        onChange={(v) => setTaxOverrides((p) => ({ ...(p || {}), date_col: v }))}
                    />
                    <Select
                        label="세금계산서 품목 컬럼(선택)"
                        options={["(없음)", ...cols]}
                        value={taxOverrides.item_col ? taxOverrides.item_col : "(없음)"}
                        onChange={(v) => setTaxOverrides((p) => ({ ...(p || {}), item_col: v === "(없음)" ? null : v }))}
                    />
                </div>
            )}
        </Card>
    );
}

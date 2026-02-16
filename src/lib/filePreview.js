import * as XLSX from "xlsx";
import Papa from "papaparse";

const MAX_SCAN_ROWS = 30;
const PREVIEW_ROWS = 5;

function toStr(x) {
    if (x === null || x === undefined) return "";
    return String(x).trim();
}

function guessHeaderRow(rows) {
    // rows: array of arrays
    // 가장 "문자/유니크"가 많은 행을 헤더로 가정 (0~MAX_SCAN_ROWS)
    let bestIdx = 0;
    let bestScore = -1;

    const scanN = Math.min(rows.length, MAX_SCAN_ROWS);
    for (let i = 0; i < scanN; i++) {
        const r = rows[i] || [];
        const cells = r.map(toStr).filter(Boolean);
        if (!cells.length) continue;

        const uniq = new Set(cells.map((v) => v.toLowerCase())).size;
        const alpha = cells.filter((v) => /[a-zA-Z가-힣]/.test(v)).length;

        // 유니크 + 문자 비율이 높은 행을 선호
        const score = uniq * 2 + alpha;
        if (score > bestScore) {
            bestScore = score;
            bestIdx = i;
        }
    }
    return bestIdx;
}

function detectDefaults(cols, type) {
    const c = cols.map((x) => String(x));
    const lc = c.map((x) => x.toLowerCase());

    const pick = (keys) => {
        for (let i = 0; i < lc.length; i++) {
            if (keys.some((k) => lc[i].includes(k))) return c[i];
        }
        return c[0] || null;
    };

    const amtKeys = ["금액", "거래금액", "출금", "입금", "amount", "amt"];
    const dateKeys = ["일자", "거래일", "날짜", "date"];
    const nameKeys =
        type === "bank"
            ? ["거래처", "상대", "업체", "상호", "가맹점", "받는", "예금주", "name"]
            : ["거래처", "상호", "공급자", "공급받는", "업체", "name"];
    const memoKeys = ["적요", "내용", "메모", "거래내용", "비고", "상세", "memo", "desc", "note"];
    const itemKeys = ["품목", "내역", "상품", "item", "product"];

    return {
        amt_default: pick(amtKeys),
        date_default: pick(dateKeys),
        name_default: pick(nameKeys),
        memo_default: pick(memoKeys),
        item_default: pick(itemKeys),
    };
}

export async function parseFileToRows(file) {
    const name = (file?.name || "").toLowerCase();
    if (name.endsWith(".csv")) {
        const text = await file.text();
        const res = Papa.parse(text, { skipEmptyLines: true });
        const rows = res.data || [];
        return rows.map((r) => (Array.isArray(r) ? r : [r]));
    }

    // xlsx
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const firstSheet = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheet];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
    return rows;
}

export async function buildPreview(file, headerRowOverride = null) {
    const rows = await parseFileToRows(file);
    const headerRow = headerRowOverride ?? guessHeaderRow(rows);

    const header = (rows[headerRow] || []).map(toStr);
    const cols = header.filter(Boolean);
    const defaults = detectDefaults(cols, "bank"); // bank/tax는 상위에서 다시 지정해도 됨

    // preview: header 이후 PREVIEW_ROWS
    const dataRows = rows.slice(headerRow + 1, headerRow + 1 + PREVIEW_ROWS);
    const preview = dataRows.map((r) => {
        const obj = {};
        for (let i = 0; i < header.length; i++) {
            const key = header[i] || `col_${i}`;
            obj[key] = toStr(r?.[i] ?? "");
        }
        return obj;
    });

    return { headerRow, cols, preview, defaults };
}

export function makeBankFileKey(i, file) {
    return `${i}__${file.name}__${file.size}__${file.lastModified}`;
}

export function detectByType(cols, type) {
    return detectDefaults(cols, type);
}

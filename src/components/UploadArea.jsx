import React, { useMemo } from "react";
import FileDropCard from "./upload/FileDropCard";

/**
 * SaaS Upload UX 버전
 * - 은행: multi
 * - 세금계산서: single
 * - 기존 state 구조 유지 (기능 로직 안 깨짐)
 */
export default function UploadArea({
    bankFiles,
    setBankFiles,
    taxFile,
    setTaxFile,
    // 아래는 다음 Phase(매핑 UI)에서 그대로 사용 예정
    bankConfigMap,
    setBankConfigMap,
    taxOverrides,
    setTaxOverrides,
}) {
    const bankDone = (bankFiles?.length || 0) > 0;
    const taxDone = !!taxFile;

    // 다음 스텝 안내 문구(나중에 Stepper와 연결 가능)
    const nextHint = useMemo(() => {
        if (!bankDone && !taxDone) return "먼저 은행/세금계산서 파일을 업로드하세요.";
        if (bankDone && !taxDone) return "세금계산서 파일을 업로드하세요.";
        if (!bankDone && taxDone) return "은행 거래내역 파일을 업로드하세요.";
        return "업로드 완료! 다음 단계(매핑 확인)로 진행할 수 있어요.";
    }, [bankDone, taxDone]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-slate-600">{nextHint}</div>
                <div className="text-xs text-slate-500">
                    Tip: 은행 특수 엑셀은 CSV로 저장 후 업로드 권장
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* 은행 파일 (multi) */}
                <FileDropCard
                    title="1. 은행 거래내역"
                    description="Excel/CSV 업로드 (여러 개 가능)"
                    hintRight="예: 하나/국민/신한 등 여러 계좌"
                    multiple={true}
                    acceptExts={[".xlsx", ".csv"]}
                    files={bankFiles}
                    onChangeFiles={setBankFiles}
                />

                {/* 세금계산서 (single) */}
                <FileDropCard
                    title="2. 세금계산서 내역"
                    description="Excel/CSV 업로드 (1개)"
                    hintRight="국세청/ERP 추출 파일"
                    multiple={false}
                    acceptExts={[".xlsx", ".csv"]}
                    files={taxFile}
                    onChangeFiles={setTaxFile}
                />
            </div>

            {/* Phase 3~에서 매핑 UI가 들어갈 자리 */}
            {(bankDone || taxDone) && (
                <div className="text-xs text-slate-500">
                    * 다음 단계에서 “컬럼 매핑/헤더행 설정” UI가 이 아래에 표시됩니다.
                </div>
            )}
        </div>
    );
}

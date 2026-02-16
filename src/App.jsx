import React, { useMemo, useState } from "react";
import SidebarSettings from "./components/SidebarSettings";
import UploadArea from "./components/UploadArea";
import ResultsTabs from "./components/ResultsTabs";
import { Stepper } from "./components/ui/Stepper";
import { Button } from "./components/ui/Button";
import BankMappingAccordion from "./components/mapping/BankMappingAccordion";
import TaxMappingCard from "./components/mapping/TaxMappingCard";
import { makeBankFileKey } from "./lib/filePreview";

function Topbar() {
  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b border-slate-200">
      <div className="px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white grid place-items-center font-bold">
            D
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-slate-900">Dr. CA$H</div>
            <div className="text-xs text-slate-500">병의원 자금관리 · 지출증빙 자동 매칭</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm text-slate-700 hover:bg-slate-50">
            도움말
          </button>
          <button className="px-3 py-1.5 rounded-xl bg-indigo-600 text-sm text-white hover:bg-indigo-500">
            상태: 준비됨
          </button>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [cfgTargetYear, setCfgTargetYear] = useState(new Date().getFullYear());
  const [bankFiles, setBankFiles] = useState([]);
  const [taxFile, setTaxFile] = useState(null);
  const [bankConfigMap, setBankConfigMap] = useState({});
  const [taxOverrides, setTaxOverrides] = useState({
    amt_col: null,
    name_col: null,
    date_col: null,
    item_col: null,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  const uploadDone = (bankFiles?.length || 0) > 0 && !!taxFile;

  // ---- Mapping 완료 자동 판정 ----
  const mappingDone = useMemo(() => {
    if (!uploadDone) return false;

    // 은행: 모든 bankFiles에 대해 config가 완성되어야 함
    for (let i = 0; i < bankFiles.length; i++) {
      const fkey = makeBankFileKey(i, bankFiles[i]);
      const cfg = bankConfigMap[fkey] || {};
      const ok =
        Number.isFinite(cfg.headerRow) &&
        !!cfg.amt_col &&
        !!cfg.name_col &&
        !!cfg.memo_col &&
        !!cfg.date_col;
      if (!ok) return false;
    }

    // 세금계산서: amt/name/date는 필수
    const t = taxOverrides || {};
    if (!t.amt_col || !t.name_col || !t.date_col) return false;

    return true;
  }, [uploadDone, bankFiles, bankConfigMap, taxOverrides]);

  // ---- Step 자동 판정 ----
  const stepIndex = useMemo(() => {
    if (!uploadDone) return 0;          // 업로드
    if (!mappingDone) return 1;         // 매핑 확인
    if (!results) return 2;             // 분석 실행 대기
    return 3;                           // 결과 확인
  }, [uploadDone, mappingDone, results]);

  const mappingAnchorRef = React.useRef(null);

  React.useEffect(() => {
    if (stepIndex === 1 && mappingAnchorRef.current) {
      mappingAnchorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [stepIndex]);

  const runAnalysis = async () => {
    if (!bankFiles.length || !taxFile) {
      alert("은행 파일(1개 이상)과 세금계산서 파일을 모두 업로드해주세요.");
      return;
    }
    setIsRunning(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setResults({
        mock: true,
        merged_partner: [],
        bank_detail: [],
        tax_detail_raw: [],
        res: [],
        tax_state: [],
        namecheck: { nc_items: [], confirmed_items: [] },
        unmatched: { tax_unpaid: [], bank_unconfirmed_detail: [] },
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Topbar />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-[320px] shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-5 flex-1">
            <div className="text-xs font-semibold text-slate-500 mb-3">설정</div>
            <SidebarSettings
              cfgTargetYear={cfgTargetYear}
              setCfgTargetYear={setCfgTargetYear}
            />

            <hr className="my-6 border-slate-100" />

            <div className="text-xs font-semibold text-slate-500 mb-3">최근 분석</div>
            <div className="space-y-2">
              <div className="text-sm p-3 rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
                아직 히스토리가 없습니다.
              </div>
            </div>
          </div>
          <div className="p-5 border-t border-slate-100">
            <button className="w-full py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              설정 저장
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">
          <div className="max-w-[1200px] mx-auto p-6">
            {/* Step header */}
            <div className="mb-5">
              <div className="text-sm text-slate-500 mb-2">Workflow</div>
              <div className="text-2xl font-semibold text-slate-900 mb-3">
                지출증빙 자동 매칭
              </div>

              <Stepper
                steps={[
                  { key: "upload", label: "업로드" },
                  { key: "mapping", label: "매핑 확인" },
                  { key: "run", label: "분석 실행" },
                  { key: "result", label: "결과 확인" },
                ]}
                activeIndex={stepIndex}
              />

              <div className="text-sm text-slate-600 mt-3">
                {stepIndex === 0 && "① 은행/세금계산서 파일을 업로드하세요."}
                {stepIndex === 1 && "② 다음: 컬럼 매핑(헤더/컬럼 확인)을 진행하세요."}
                {stepIndex === 2 && "③ 분석 실행을 눌러 매칭을 시작하세요."}
                {stepIndex === 3 && "④ 결과 탭에서 대시보드/검토/다운로드를 진행하세요."}
              </div>
            </div>

            {/* Card: Upload */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-semibold text-slate-900">업로드</div>
                  <div className="text-sm text-slate-500">
                    Excel(.xlsx) / CSV(.csv)
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  은행 특수 엑셀은 CSV 저장 후 업로드 권장
                </div>
              </div>

              <UploadArea
                cfgTargetYear={cfgTargetYear}
                bankFiles={bankFiles}
                setBankFiles={setBankFiles}
                taxFile={taxFile}
                setTaxFile={setTaxFile}
                bankConfigMap={bankConfigMap}
                setBankConfigMap={setBankConfigMap}
                taxOverrides={taxOverrides}
                setTaxOverrides={setTaxOverrides}
              />

              {uploadDone && (
                <div className="mt-6 space-y-4">
                  <BankMappingAccordion
                    bankFiles={bankFiles}
                    bankConfigMap={bankConfigMap}
                    setBankConfigMap={setBankConfigMap}
                  />
                  <TaxMappingCard
                    taxFile={taxFile}
                    taxOverrides={taxOverrides}
                    setTaxOverrides={setTaxOverrides}
                  />
                </div>
              )}

              <div ref={mappingAnchorRef} />
            </section>

            {/* Results */}
            {results && (
              <section className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="font-semibold text-slate-900 mb-4">결과</div>
                <ResultsTabs results={results} />
              </section>
            )}
          </div>

          {/* Sticky Action Bar */}
          <div className="sticky bottom-6 mt-6 z-10">
            <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-2xl shadow-lg px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-slate-600 font-medium">
                {stepIndex === 0 && "업로드가 필요합니다."}
                {stepIndex === 1 && "매핑 확인 후 '매핑 완료' 버튼을 눌러주세요."}
                {stepIndex === 2 && "준비가 완료되었습니다. 분석을 실행하세요."}
                {stepIndex === 3 && "결과 확인 중입니다. 새로 분석하려면 파일을 교체하세요."}
              </div>

              <div className="flex items-center gap-2">
                {results && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResults(null);
                      // setMappingDone(false); // 자동 계산이므로 setter 없음
                      setBankFiles([]);
                      setTaxFile(null);
                      setBankConfigMap({});
                    }}
                  >
                    초기화
                  </Button>
                )}

                <Button
                  variant="primary"
                  onClick={runAnalysis}
                  disabled={isRunning || stepIndex < 2}
                  className="px-6 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:shadow-none"
                >
                  {isRunning ? "분석 중..." : "분석 실행"}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

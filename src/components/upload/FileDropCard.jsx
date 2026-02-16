import React, { useMemo, useRef, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

function bytesToText(bytes) {
    if (bytes == null) return "-";
    const units = ["B", "KB", "MB", "GB"];
    let v = bytes;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i += 1;
    }
    return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function extOk(file, acceptExts = []) {
    if (!acceptExts.length) return true;
    const name = (file?.name || "").toLowerCase();
    return acceptExts.some((e) => name.endsWith(e));
}

export default function FileDropCard({
    title,
    description,
    hintRight,
    multiple = false,
    acceptExts = [".xlsx", ".csv"],
    files,
    onChangeFiles,
}) {
    const inputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const hasFiles = multiple ? (files?.length || 0) > 0 : !!files;

    const badge = useMemo(() => {
        if (!hasFiles) return { tone: "gray", text: "미업로드" };
        return { tone: "green", text: "업로드됨" };
    }, [hasFiles]);

    const openPicker = () => inputRef.current?.click();

    const normalizeDropped = (fileList) => {
        const arr = Array.from(fileList || []);
        const ok = [];
        const bad = [];
        for (const f of arr) {
            if (extOk(f, acceptExts)) ok.push(f);
            else bad.push(f);
        }
        if (bad.length) {
            alert(`지원하지 않는 파일 형식이 포함되어 있어 제외했습니다:\n- ${bad.map((b) => b.name).join("\n- ")}`);
        }
        return ok;
    };

    const setFromFileList = (fileList) => {
        const ok = normalizeDropped(fileList);
        if (multiple) onChangeFiles(ok);
        else onChangeFiles(ok[0] || null);
    };

    const onInputChange = (e) => setFromFileList(e.target.files);

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setFromFileList(e.dataTransfer.files);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const clear = () => (multiple ? onChangeFiles([]) : onChangeFiles(null));

    const list = multiple ? (files || []) : (files ? [files] : []);

    return (
        <Card
            title={
                <div className="flex items-center gap-2">
                    <span>{title}</span>
                    <Badge tone={badge.tone}>{badge.text}</Badge>
                </div>
            }
            subtitle={description}
            right={hintRight ? <div className="text-xs text-slate-500">{hintRight}</div> : null}
        >
            <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={[
                    "rounded-2xl border border-dashed p-4 transition",
                    isDragging ? "border-indigo-400 bg-indigo-50/60" : "border-slate-200 bg-slate-50",
                ].join(" ")}
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-slate-900">드래그 & 드롭 또는 파일 선택</div>
                        <div className="text-sm text-slate-500 mt-1">
                            지원: {acceptExts.join(", ")} {multiple ? "(여러 개 가능)" : "(1개)"}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="file"
                            multiple={multiple}
                            accept={acceptExts.join(",")}
                            onChange={onInputChange}
                            className="hidden"
                        />
                        <Button variant="outline" onClick={openPicker}>
                            파일 선택
                        </Button>
                        {hasFiles && (
                            <Button variant="ghost" onClick={clear}>
                                초기화
                            </Button>
                        )}
                    </div>
                </div>

                {/* 파일 목록 */}
                <div className="mt-4">
                    {!hasFiles ? (
                        <div className="text-sm text-slate-500">선택된 파일 없음</div>
                    ) : (
                        <div className="space-y-2">
                            {list.map((f, idx) => (
                                <div
                                    key={`${f.name}-${idx}`}
                                    className="flex items-center justify-between gap-3 rounded-xl bg-white border border-slate-200 px-3 py-2"
                                >
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-900 truncate">{f.name}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {bytesToText(f.size)} · {f.type || "file"}
                                        </div>
                                    </div>

                                    {/* 단일 파일이면 교체 버튼 의미가 큼, 다중이면 다시 선택 */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {!multiple && (
                                            <Button variant="outline" onClick={openPicker} className="px-3 py-1.5">
                                                교체
                                            </Button>
                                        )}
                                        {!multiple && (
                                            <Button variant="ghost" onClick={clear} className="px-3 py-1.5">
                                                삭제
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

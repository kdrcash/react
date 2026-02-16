import React from "react";

export function Card({ title, subtitle, right, children, className = "" }) {
    return (
        <section className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
            {(title || subtitle || right) && (
                <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
                    <div>
                        {title && <div className="font-semibold text-slate-900">{title}</div>}
                        {subtitle && <div className="text-sm text-slate-500 mt-1">{subtitle}</div>}
                    </div>
                    {right && <div className="shrink-0">{right}</div>}
                </div>
            )}
            <div className="px-5 pb-5">{children}</div>
        </section>
    );
}

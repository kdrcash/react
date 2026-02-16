import React from "react";

const styles = {
    gray: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
    blue: "bg-indigo-100 text-indigo-700",
};

export function Badge({ tone = "gray", children }) {
    const styleClass = styles[tone] || styles.gray;
    return (
        <span className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-semibold ${styleClass}`}>
            {children}
        </span>
    );
}

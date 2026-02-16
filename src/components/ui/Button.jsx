import React from "react";

const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";

const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500",
    secondary: "bg-slate-900 text-white hover:bg-slate-800",
    outline: "border border-slate-200 text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-700 hover:bg-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
};

export function Button({ variant = "primary", className = "", ...props }) {
    const variantClass = variants[variant] || variants.primary;
    return <button className={`${base} ${variantClass} ${className}`} {...props} />;
}

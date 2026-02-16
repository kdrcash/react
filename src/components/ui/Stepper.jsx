import React from "react";

export function Stepper({ steps, activeIndex = 0 }) {
    return (
        <div className="flex items-center gap-2">
            {steps.map((s, i) => {
                const active = i === activeIndex;
                const done = i < activeIndex;

                let circleClass = "h-8 w-8 rounded-full grid place-items-center text-sm font-bold ";
                if (done) circleClass += "bg-emerald-600 text-white";
                else if (active) circleClass += "bg-indigo-600 text-white";
                else circleClass += "bg-slate-100 text-slate-500";

                return (
                    <React.Fragment key={s.key || i}>
                        <div className="flex items-center gap-2">
                            <div
                                className={circleClass}
                            >
                                {i + 1}
                            </div>
                            <div className={active ? "text-slate-900 font-semibold" : "text-slate-500"}>
                                {s.label}
                            </div>
                        </div>
                        {i !== steps.length - 1 && <div className="w-8 h-px bg-slate-200" />}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

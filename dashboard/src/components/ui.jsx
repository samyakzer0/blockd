import React from "react";
import { cn } from "../lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl shadow-lg shadow-black/40 text-slate-100",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1.5 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn("font-semibold leading-none tracking-tight text-slate-100 flex items-center gap-2", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-xs text-slate-400 leading-relaxed", className)} {...props} />;
}

export function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    primary: "bg-indigo-950/80 text-indigo-300 border-indigo-800/60",
    danger: "bg-rose-950/80 text-rose-300 border-rose-800/60",
    warning: "bg-amber-950/80 text-amber-300 border-amber-800/60",
    success: "bg-emerald-950/80 text-emerald-300 border-emerald-800/60",
    purple: "bg-purple-950/80 text-purple-300 border-purple-800/60",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  );
}

export function Button({ className, variant = "default", size = "default", ...props }) {
  const variants = {
    default: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30",
    secondary: "bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60",
    outline: "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300",
    danger: "bg-rose-600 hover:bg-rose-500 text-white",
    ghost: "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200",
  };
  const sizes = {
    default: "h-9 px-4 py-2 text-xs",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-10 rounded-md px-6 text-sm",
    icon: "h-8 w-8 p-0 flex items-center justify-center",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
        variants[variant] || variants.default,
        sizes[size] || sizes.default,
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-1 text-xs shadow-inner placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500 text-slate-100",
        className
      )}
      {...props}
    />
  );
}

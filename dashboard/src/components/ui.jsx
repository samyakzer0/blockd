import React from "react";
import { cn } from "../lib/utils";

// Material 3 Card
export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-[#D3C7AD] bg-white p-5 shadow-sm text-[#28374A] relative overflow-hidden transition-all",
        className
      )}
      {...props}
    >
      <md-elevation></md-elevation>
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn("font-bold text-sm tracking-tight text-[#28374A] flex items-center gap-2 md-typescale-title-medium", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-xs text-[#6B6751] leading-relaxed md-typescale-body-small", className)} {...props} />;
}

// Material 3 Badge / Pill
export function Badge({ className, variant = "default", children, ...props }) {
  const badgeStyles = {
    default: "bg-[#E8E1D1] text-[#28374A] border-[#D3C7AD]",
    primary: "bg-[#FDF4EE] text-[#B8502E] border-[#B8502E]/40",
    terra: "bg-[#B8502E] text-white border-[#B8502E]",
    gold: "bg-[#B8502E] text-white border-[#B8502E]",
    azul: "bg-[#28374A] text-white border-[#28374A]",
    navy: "bg-[#28374A] text-white border-[#28374A]",
    verde: "bg-[#F2F1EC] text-[#6B6751] border-[#6B6751]/50",
    danger: "bg-[#FDF4EE] text-[#B8502E] border-[#B8502E]/60",
    warning: "bg-[#FFF8EE] text-[#9A5B20] border-[#E8C07A]",
    success: "bg-[#F2F6F1] text-[#3D6B42] border-[#93BE98]",
    secondary: "bg-[#F2ECE3] text-[#28374A] border-[#D3C7AD]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-0.5 text-[11px] font-semibold tracking-wide transition-colors md-typescale-label-small shadow-2xs",
        badgeStyles[variant] || badgeStyles.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Material 3 Pill Button
export function Button({
  className,
  variant = "default",
  size = "default",
  disabled,
  children,
  onClick,
  type = "button",
  ...props
}) {
  if (variant === "default" || variant === "terra") {
    return (
      <md-filled-button
        disabled={disabled || undefined}
        onClick={onClick}
        type={type}
        className={cn("cursor-pointer font-medium text-xs", className)}
        style={{
          "--md-filled-button-container-color": "#B8502E",
          "--md-filled-button-label-text-color": "#FFFFFF",
          "--md-filled-button-hover-container-color": "#9A3E20",
          "--md-filled-button-container-shape": "9999px",
        }}
        {...props}
      >
        {children}
      </md-filled-button>
    );
  }

  if (variant === "navy" || variant === "azul") {
    return (
      <md-filled-button
        disabled={disabled || undefined}
        onClick={onClick}
        type={type}
        className={cn("cursor-pointer font-medium text-xs", className)}
        style={{
          "--md-filled-button-container-color": "#28374A",
          "--md-filled-button-label-text-color": "#FFFFFF",
          "--md-filled-button-hover-container-color": "#1C2735",
          "--md-filled-button-container-shape": "9999px",
        }}
        {...props}
      >
        {children}
      </md-filled-button>
    );
  }

  if (variant === "danger") {
    return (
      <md-filled-button
        disabled={disabled || undefined}
        onClick={onClick}
        type={type}
        className={cn("cursor-pointer font-medium text-xs", className)}
        style={{
          "--md-filled-button-container-color": "#B8502E",
          "--md-filled-button-label-text-color": "#FFFFFF",
          "--md-filled-button-hover-container-color": "#9A3E20",
          "--md-filled-button-container-shape": "9999px",
        }}
        {...props}
      >
        {children}
      </md-filled-button>
    );
  }

  if (variant === "outline" || variant === "secondary") {
    return (
      <md-outlined-button
        disabled={disabled || undefined}
        onClick={onClick}
        type={type}
        className={cn("cursor-pointer font-medium text-xs", className)}
        style={{
          "--md-outlined-button-outline-color": "#D3C7AD",
          "--md-outlined-button-label-text-color": "#28374A",
          "--md-outlined-button-hover-outline-color": "#B8502E",
          "--md-outlined-button-container-shape": "9999px",
        }}
        {...props}
      >
        {children}
      </md-outlined-button>
    );
  }

  if (variant === "verde") {
    return (
      <md-filled-tonal-button
        disabled={disabled || undefined}
        onClick={onClick}
        type={type}
        className={cn("cursor-pointer font-medium text-xs", className)}
        style={{
          "--md-filled-tonal-button-container-color": "#F2F1EC",
          "--md-filled-tonal-button-label-text-color": "#6B6751",
          "--md-filled-tonal-button-container-shape": "9999px",
        }}
        {...props}
      >
        {children}
      </md-filled-tonal-button>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8502E] disabled:pointer-events-none disabled:opacity-50 cursor-pointer overflow-hidden p-2 text-xs",
        variant === "ghost" ? "hover:bg-[#E8E1D1]/60 text-[#28374A]" : "border border-[#D3C7AD] bg-white text-[#28374A] hover:bg-[#FAF7F2]",
        size === "icon" ? "h-9 w-9 p-0" : "px-4 py-2",
        className
      )}
      {...props}
    >
      <md-ripple></md-ripple>
      {children}
    </button>
  );
}

// Material 3 Input
export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-xl border border-[#D3C7AD] bg-white px-3.5 py-2 text-xs shadow-2xs placeholder:text-[#6B6751]/60 focus-visible:outline-none focus-visible:border-[#B8502E] focus-visible:ring-2 focus-visible:ring-[#B8502E]/30 text-[#28374A] transition-all font-sans",
        className
      )}
      {...props}
    />
  );
}

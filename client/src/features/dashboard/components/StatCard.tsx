import React from "react";
import { ArrowUpRight } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  icon,
  color,
  onClick,
  className,
}: StatCardProps) {
  const content = (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:shadow-black/[0.03] transition-all duration-300 group ${className || ""} ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${color}12` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        {change && (
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <ArrowUpRight className="w-3 h-3" />
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className="text-[13px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );

  return onClick ? <div onClick={onClick}>{content}</div> : content;
}

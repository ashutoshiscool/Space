"use client";

import React from "react";

interface BurndownPoint {
  date: string;
  idealRemaining: number;
  actualRemaining: number | null;
}

interface CycleBurndownChartProps {
  burndown: BurndownPoint[];
  totalScope: number;
}

export function CycleBurndownChart({
  burndown,
  totalScope,
}: CycleBurndownChartProps) {
  if (!burndown || burndown.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-xs text-zinc-500">
        No burndown data available
      </div>
    );
  }

  const maxVal = Math.max(totalScope, 10);
  const chartHeight = 140;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 20;

  const pointsCount = burndown.length;
  const stepX = (chartWidth - paddingX * 2) / Math.max(1, pointsCount - 1);

  // Generate SVG path for Ideal line
  const idealPath = burndown
    .map((pt, idx) => {
      const x = paddingX + idx * stepX;
      const y =
        paddingY +
        ((maxVal - pt.idealRemaining) / maxVal) * (chartHeight - paddingY * 2);
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Generate SVG path for Actual line
  const actualPoints = burndown.filter((pt) => pt.actualRemaining !== null);
  const actualPath = actualPoints
    .map((pt, idx) => {
      const x = paddingX + idx * stepX;
      const y =
        paddingY +
        ((maxVal - pt.actualRemaining!) / maxVal) * (chartHeight - paddingY * 2);
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between text-xs text-[#6b7280]">
        <span className="font-medium text-[#111827]">Sprint Burndown</span>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-[#9ca3af] border border-dashed border-[#9ca3af]" />
            <span className="text-[#6b7280]">Ideal</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#3e63dd]" />
            <span className="text-[#3e63dd] font-medium">Actual</span>
          </span>
        </div>
      </div>

      <div className="relative rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] p-3">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-44 w-full overflow-visible"
        >
          {/* Horizontal grid lines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = paddingY + ratio * (chartHeight - paddingY * 2);
            const val = Math.round(maxVal * (1 - ratio));
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeDasharray="2 2"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#6b7280"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Ideal line */}
          <path
            d={idealPath}
            fill="none"
            stroke="#9ca3af"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Actual line */}
          {actualPath && (
            <path
              d={actualPath}
              fill="none"
              stroke="#3e63dd"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Actual data points dots */}
          {actualPoints.map((pt, idx) => {
            const x = paddingX + idx * stepX;
            const y =
              paddingY +
              ((maxVal - pt.actualRemaining!) / maxVal) * (chartHeight - paddingY * 2);
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="3.5"
                fill="#3e63dd"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>

        {/* X Axis dates */}
        <div className="flex justify-between px-8 text-[10px] text-[#6b7280] font-mono pt-1">
          <span>{burndown[0]?.date}</span>
          <span>{burndown[Math.floor(burndown.length / 2)]?.date}</span>
          <span>{burndown[burndown.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  );
}

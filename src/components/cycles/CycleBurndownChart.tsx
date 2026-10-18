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
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span className="font-medium text-zinc-300">Sprint Burndown</span>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-zinc-600 border border-dashed border-zinc-400" />
            <span className="text-zinc-400">Ideal</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span className="text-indigo-400 font-medium">Actual</span>
          </span>
        </div>
      </div>

      <div className="relative rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3">
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
                  stroke="#27272a"
                  strokeDasharray="2 2"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#71717a"
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
            stroke="#52525b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Actual line */}
          {actualPath && (
            <path
              d={actualPath}
              fill="none"
              stroke="#6366f1"
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
                fill="#818cf8"
                stroke="#1e1e24"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>

        {/* X Axis dates */}
        <div className="flex justify-between px-8 text-[10px] text-zinc-500 font-mono pt-1">
          <span>{burndown[0]?.date}</span>
          <span>{burndown[Math.floor(burndown.length / 2)]?.date}</span>
          <span>{burndown[burndown.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  );
}

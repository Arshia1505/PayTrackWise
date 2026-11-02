'use client';

import React, { useEffect } from 'react';
import { generateQrMatrix } from '@/lib/finance-engine';

// 1. <MetricPillPod />
export interface MetricPillPodProps {
  label: string;
  value: string;
  badgeText?: string;
  badgeTone?: 'positive' | 'warning' | 'critical' | 'neutral';
  subtext?: string;
  icon?: string;
  className?: string;
}

export function MetricPillPod({
  label,
  value,
  badgeText,
  badgeTone = 'neutral',
  subtext,
  icon = 'analytics',
  className = '',
}: MetricPillPodProps) {
  const badgeClasses =
    badgeTone === 'positive'
      ? 'bg-[#32D74B]/15 text-[#1E8E3E]'
      : badgeTone === 'warning'
      ? 'bg-[#FF9F0A]/15 text-[#B25000]'
      : badgeTone === 'critical'
      ? 'bg-[#FF453A]/15 text-[#D70015]'
      : 'bg-white text-[#48484A] border border-black/[0.06]';

  return (
    <div
      className={`bento-pod p-5 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-medium text-[#636366]">{label}</span>
        {badgeText && (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium ${badgeClasses}`}
          >
            {badgeText}
          </span>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-[28px] font-semibold tracking-[-0.02em] text-[#1C1C1E] tabular-nums">
          {value}
        </div>
        {subtext && <p className="text-[13px] text-[#636366] mt-1">{subtext}</p>}
      </div>
    </div>
  );
}

// 2. <MonochromeBarChart />
export interface MonochromeBarItem {
  label: string;
  value: number;
  formattedValue: string;
  subValue?: string;
  active?: boolean;
  tone?: 'default' | 'warning' | 'critical' | 'positive';
}

export interface MonochromeBarChartProps {
  bars: MonochromeBarItem[];
  heightClass?: string;
}

export function MonochromeBarChart({
  bars,
  heightClass = 'h-48',
}: MonochromeBarChartProps) {
  const maxVal = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className={`w-full ${heightClass} flex items-end justify-between gap-2 sm:gap-4 pt-6 px-1`}>
      {bars.map((bar) => {
        const pct = Math.max(12, Math.round((bar.value / maxVal) * 100));
        const barColor =
          bar.tone === 'critical'
            ? 'bg-[#FF453A]'
            : bar.tone === 'warning'
            ? 'bg-[#FF9F0A]'
            : bar.tone === 'positive'
            ? 'bg-[#32D74B]'
            : bar.active
            ? 'bg-[#1C1C1E]'
            : 'bg-[#636366]/70 hover:bg-[#1C1C1E]';

        return (
          <div
            key={bar.label}
            className="flex-1 h-full flex flex-col items-center justify-end gap-2 group"
          >
            <div className="text-center">
              <span
                className={`text-[12px] font-medium block tabular-nums transition-opacity ${
                  bar.active
                    ? 'opacity-100 text-[#1C1C1E]'
                    : 'opacity-80 group-hover:opacity-100 text-[#636366]'
                }`}
              >
                {bar.formattedValue}
              </span>
              {bar.subValue && (
                <span className="hidden sm:block text-[11px] text-[#8E8E93] tabular-nums">
                  {bar.subValue}
                </span>
              )}
            </div>

            <div className="w-full max-w-[52px] h-full flex items-end">
              <div
                style={{ height: `${pct}%` }}
                className={`w-full rounded-xl transition-all duration-300 ${barColor}`}
              />
            </div>

            <span
              className={`text-[12px] font-medium ${
                bar.active ? 'text-[#1C1C1E]' : 'text-[#636366]'
              }`}
            >
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// 3. <SemiCircleArcGauge />
export interface SemiCircleArcGaugeProps {
  percentage: number;
  centerLabel: string;
  subLabel?: string;
  tone?: 'default' | 'positive' | 'warning' | 'critical';
}

export function SemiCircleArcGauge({
  percentage,
  centerLabel,
  subLabel,
  tone = 'default',
}: SemiCircleArcGaugeProps) {
  const safePct = Math.min(100, Math.max(0, percentage));
  const radius = 80;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (safePct / 100) * circumference;

  const strokeColor =
    tone === 'critical'
      ? '#FF453A'
      : tone === 'warning'
      ? '#FF9F0A'
      : tone === 'positive'
      ? '#32D74B'
      : '#1C1C1E';

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-52 h-28 flex items-end justify-center overflow-hidden">
        <svg viewBox="0 0 200 110" className="w-full h-full">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#E5E5EA"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={strokeColor}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute bottom-1 text-center">
          <div className="text-[24px] font-semibold text-[#1C1C1E] tabular-nums leading-none">
            {centerLabel}
          </div>
        </div>
      </div>
      {subLabel && (
        <span className="text-[13px] text-[#636366] mt-1 text-center tabular-nums">
          {subLabel}
        </span>
      )}
    </div>
  );
}

// 4. <BentoProgressPod />
export interface BentoProgressPodProps {
  title: string;
  subtitle?: string;
  icon?: string;
  currentFormatted: string;
  targetFormatted: string;
  percentage: number;
  badgeText?: string;
  tone?: 'default' | 'positive' | 'warning' | 'critical';
  footerLeft?: string;
  footerRight?: string;
}

export function BentoProgressPod({
  title,
  subtitle,
  icon = 'pie_chart',
  currentFormatted,
  targetFormatted,
  percentage,
  badgeText,
  tone = 'default',
  footerLeft,
  footerRight,
}: BentoProgressPodProps) {
  const safePct = Math.min(100, Math.max(0, percentage));

  const barColor =
    tone === 'critical'
      ? 'bg-[#FF453A]'
      : tone === 'warning'
      ? 'bg-[#FF9F0A]'
      : tone === 'positive'
      ? 'bg-[#1C1C1E]'
      : 'bg-[#1C1C1E]';

  const badgeClass =
    tone === 'critical'
      ? 'bg-[#FF453A]/15 text-[#D70015]'
      : tone === 'warning'
      ? 'bg-[#FF9F0A]/15 text-[#B25000]'
      : tone === 'positive'
      ? 'bg-[#32D74B]/15 text-[#1E8E3E]'
      : 'bg-white text-[#1C1C1E] border border-black/[0.06]';

  return (
    <div className="bento-pod p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-[15px] font-semibold text-[#1C1C1E]">{title}</h3>
            {subtitle && <p className="text-[13px] text-[#636366]">{subtitle}</p>}
          </div>
        </div>
        {badgeText && (
          <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium ${badgeClass}`}>
            {badgeText}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-bold text-[#1C1C1E] tabular-nums">{currentFormatted}</span>
          <span className="text-[#8E8E93] tabular-nums">{targetFormatted}</span>
        </div>

        {/* Progress Bar with 80% Pacing Tick */}
        <div className="relative h-2 w-full rounded-full bg-[#E5E5EA] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${safePct}%` }}
          />
          <div
            style={{ left: '80%' }}
            className="absolute top-0 bottom-0 w-0.5 bg-black/25"
            title="80% Warning Pacing Threshold"
          />
        </div>
      </div>

      {(footerLeft || footerRight) && (
        <div className="flex items-center justify-between text-[11px] text-[#48484A] pt-1">
          <span>{footerLeft}</span>
          <span className="font-semibold text-[#1C1C1E]">{footerRight}</span>
        </div>
      )}
    </div>
  );
}

// 5. <InsetGroupedList />
export function InsetGroupedList({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bento-pod overflow-hidden divide-y divide-black/[0.06] ${className}`}
    >
      {children}
    </div>
  );
}

// 6. <UniversalSheetModal />
export interface UniversalSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  children: React.ReactNode;
}

export function UniversalSheetModal({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidth = 'max-w-lg',
  children,
}: UniversalSheetModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        className={`w-full ${maxWidth} bg-white rounded-t-[28px] sm:rounded-[28px] p-6 space-y-4 animate-in max-h-[92vh] overflow-y-auto`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[19px] font-semibold text-[#1C1C1E]">{title}</h2>
            {subtitle && <p className="text-xs text-[#8E8E93]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-[#EBEBED] flex items-center justify-center text-[#1C1C1E] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}

// 7. <DynamicQrSvg /> (Client-Side ISO/IEC 18004 Reed-Solomon Scannable QR Matrix Renderer)
export function DynamicQrSvg({
  value,
  size = 196,
  badgeLabel = 'UPI',
}: {
  value: string;
  size?: number;
  badgeLabel?: string;
}) {
  const matrix = generateQrMatrix(value);
  const gridCount = matrix.length;

  return (
    <div
      style={{ width: size, height: size }}
      className="relative bg-white p-3 rounded-2xl flex items-center justify-center"
    >
      <svg
        viewBox={`0 0 ${gridCount} ${gridCount}`}
        className="w-full h-full"
        shapeRendering="crispEdges"
      >
        {matrix.map((row, rIdx) =>
          row.map((cell, cIdx) =>
            cell ? (
              <rect
                key={`${rIdx}-${cIdx}`}
                x={cIdx}
                y={rIdx}
                width={1}
                height={1}
                fill="#1C1C1E"
              />
            ) : null
          )
        )}
      </svg>
      <div className="absolute px-1.5 py-0.5 rounded bg-[#1C1C1E] text-white text-[9px] font-semibold tracking-wider border border-white">
        {badgeLabel}
      </div>
    </div>
  );
}


// 8. <PageHeader /> — single consistent page title block
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div className="min-w-0">
        <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.02em]">{title}</h1>
        {description && <p className="text-[15px] text-[#636366] mt-1">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}

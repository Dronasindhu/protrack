import React, { useState, useMemo } from 'react';
import { Holding } from '../types/portfolio';
import { formatCurrency, formatPercentage } from '../utils/portfolioMath';
import { PieChart, BarChart2, Layers } from 'lucide-react';

interface VisualizationsProps {
  holdings: Holding[];
  totalValue: number;
}

// Curated high-contrast aesthetic colors for dark mode
const PALETTE = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#E11D48', // Rose
  '#84CC16', // Lime
  '#A855F7', // Purple
];

export const Visualizations: React.FC<VisualizationsProps> = ({ holdings, totalValue }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<'asset' | 'class'>('asset');

  // Compute allocation slices
  const slices = useMemo(() => {
    if (totalValue <= 0 || holdings.length === 0) return [];

    if (chartMode === 'class') {
      const stockVal = holdings
        .filter((h) => h.type === 'stock')
        .reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
      const cryptoVal = holdings
        .filter((h) => h.type === 'crypto')
        .reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);

      const items = [];
      if (stockVal > 0) {
        items.push({
          label: 'Stocks',
          sublabel: `${holdings.filter((h) => h.type === 'stock').length} Equities`,
          value: stockVal,
          percentage: (stockVal / totalValue) * 100,
          color: '#3B82F6'
        });
      }
      if (cryptoVal > 0) {
        items.push({
          label: 'Crypto',
          sublabel: `${holdings.filter((h) => h.type === 'crypto').length} Digital Assets`,
          value: cryptoVal,
          percentage: (cryptoVal / totalValue) * 100,
          color: '#F59E0B'
        });
      }
      return items;
    }

    // Sort holdings by market value descending
    const sorted = [...holdings].sort(
      (a, b) => b.quantity * b.currentPrice - a.quantity * a.currentPrice
    );

    // If more than 7 items, group remaining into "Other"
    const topItems = sorted.slice(0, 7);
    const rest = sorted.slice(7);

    const result = topItems.map((h, i) => {
      const val = h.quantity * h.currentPrice;
      return {
        label: h.symbol,
        sublabel: h.name,
        value: val,
        percentage: (val / totalValue) * 100,
        color: PALETTE[i % PALETTE.length]
      };
    });

    if (rest.length > 0) {
      const otherVal = rest.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
      result.push({
        label: 'Other',
        sublabel: `${rest.length} other assets`,
        value: otherVal,
        percentage: (otherVal / totalValue) * 100,
        color: '#64748B'
      });
    }

    return result;
  }, [holdings, totalValue, chartMode]);

  // Compute SVG arc paths
  const svgArcs = useMemo(() => {
    let cumulativeAngle = 0;
    const center = 110;
    const radius = 80;
    const innerRadius = 54;

    return slices.map((slice, i) => {
      const angle = (slice.percentage / 100) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle += angle;

      const isFull = angle >= 359.99;

      // Convert angles to radians (offset by -90 deg to start at 12 o'clock)
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const ix1 = center + innerRadius * Math.cos(endRad);
      const iy1 = center + innerRadius * Math.sin(endRad);
      const ix2 = center + innerRadius * Math.cos(startRad);
      const iy2 = center + innerRadius * Math.sin(startRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      let pathData = '';
      if (isFull) {
        // Full circle path
        pathData = `
          M ${center} ${center - radius}
          A ${radius} ${radius} 0 1 0 ${center} ${center + radius}
          A ${radius} ${radius} 0 1 0 ${center} ${center - radius}
          M ${center} ${center - innerRadius}
          A ${innerRadius} ${innerRadius} 0 1 1 ${center} ${center + innerRadius}
          A ${innerRadius} ${innerRadius} 0 1 1 ${center} ${center - innerRadius}
          Z
        `;
      } else {
        pathData = [
          `M ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          `L ${ix1} ${iy1}`,
          `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2}`,
          'Z'
        ].join(' ');
      }

      return {
        ...slice,
        pathData,
        index: i
      };
    });
  }, [slices]);

  // Holdings sorted by return percentage for performance bar chart
  const rankedHoldings = useMemo(() => {
    return [...holdings]
      .map((h) => {
        const costBasis = h.quantity * h.avgBuyPrice;
        const marketVal = h.quantity * h.currentPrice;
        const profitLoss = marketVal - costBasis;
        const returnPct = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
        return {
          symbol: h.symbol,
          name: h.name,
          type: h.type,
          returnPct,
          profitLoss,
          marketVal
        };
      })
      .sort((a, b) => b.returnPct - a.returnPct)
      .slice(0, 6);
  }, [holdings]);

  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
      {/* Allocation Donut Breakdown */}
      <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-200">Asset Allocation Breakdown</h3>
          </div>

          {/* Interactive filter tab buttons */}
          <div className="flex items-center p-1 bg-slate-950/80 border border-slate-800/80 rounded-lg">
            <button
              onClick={() => {
                setChartMode('asset');
                setHoveredIndex(null);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                chartMode === 'asset'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              By Asset
            </button>
            <button
              onClick={() => {
                setChartMode('class');
                setHoveredIndex(null);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                chartMode === 'class'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              By Asset Class
            </button>
          </div>
        </div>

        {totalValue <= 0 || holdings.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm">
            <PieChart className="w-10 h-10 mb-2 stroke-1 opacity-50" />
            <span>No assets to chart. Add your first holding to view allocation.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-4">
            {/* SVG Donut */}
            <div className="md:col-span-6 flex justify-center relative">
              <svg viewBox="0 0 220 220" className="w-56 h-56 transform transition-transform">
                <defs>
                  <filter id="donutGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.4" />
                  </filter>
                </defs>
                <g>
                  {svgArcs.map((arc, i) => {
                    const isHovered = hoveredIndex === i;
                    return (
                      <path
                        key={arc.label + i}
                        d={arc.pathData}
                        fill={arc.color}
                        opacity={hoveredIndex === null || isHovered ? 1 : 0.4}
                        transform={
                          isHovered
                            ? `scale(1.03) translate(-3.3, -3.3)`
                            : 'scale(1)'
                        }
                        style={{
                          transformOrigin: '110px 110px',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    );
                  })}
                </g>
              </svg>

              {/* Center Donut Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                {activeSlice ? (
                  <>
                    <span className="text-[11px] font-medium text-slate-400 truncate max-w-[120px]">
                      {activeSlice.label}
                    </span>
                    <span className="text-base font-bold text-white font-mono tabular-nums leading-tight mt-0.5">
                      {activeSlice.percentage.toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono tabular-nums">
                      {formatCurrency(activeSlice.value)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] font-medium text-slate-400">Total Value</span>
                    <span className="text-sm font-bold text-white font-mono tabular-nums mt-0.5">
                      {formatCurrency(totalValue)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {holdings.length} {holdings.length === 1 ? 'asset' : 'assets'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Interactive Legend Grid */}
            <div className="md:col-span-6 space-y-2">
              {slices.map((slice, i) => {
                const isHovered = hoveredIndex === i;
                return (
                  <div
                    key={slice.label + i}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                      isHovered
                        ? 'bg-slate-800/90 text-white ring-1 ring-slate-700'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <div className="truncate">
                        <span className="font-semibold text-slate-200">{slice.label}</span>
                        {slice.sublabel && slice.sublabel !== slice.label && (
                          <span className="text-slate-500 ml-1.5 hidden sm:inline text-[11px]">
                            {slice.sublabel}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                      <span className="text-slate-400">{formatCurrency(slice.value)}</span>
                      <span className="font-semibold text-slate-200 w-11 text-right">
                        {slice.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Performance & Return Ranking */}
      <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 backdrop-blur-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-200">Return Leaderboard</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">By Total Return</span>
          </div>

          {rankedHoldings.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm">
              <Layers className="w-8 h-8 mb-2 stroke-1 opacity-50" />
              <span>No positions tracked yet.</span>
            </div>
          ) : (
            <div className="mt-4 space-y-3.5">
              {rankedHoldings.map((item) => {
                const isGain = item.returnPct >= 0;
                // Bar width scaling (capped between 4% and 100%)
                const maxPct = Math.max(...rankedHoldings.map((h) => Math.abs(h.returnPct)), 10);
                const barWidth = Math.min(100, Math.max(6, (Math.abs(item.returnPct) / maxPct) * 100));

                return (
                  <div key={item.symbol} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{item.symbol}</span>
                        <span className="text-slate-500 text-[11px] truncate max-w-[110px]">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono tabular-nums">
                        <span className="text-slate-400 text-[11px]">{formatCurrency(item.profitLoss)}</span>
                        <span
                          className={`font-semibold ${
                            isGain ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatPercentage(item.returnPct)}
                        </span>
                      </div>
                    </div>
                    {/* Horizontal Bar */}
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${barWidth}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          isGain ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
          <span>Real-time position ROI</span>
          <span className="font-mono tabular-nums">
            {holdings.length} {holdings.length === 1 ? 'holding' : 'holdings'} analyzed
          </span>
        </div>
      </div>
    </div>
  );
};

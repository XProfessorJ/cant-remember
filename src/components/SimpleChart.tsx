import { useState, useEffect } from 'react';

interface MultiBarChartProps {
  data: Array<{
    date: string;
    reviewsCompleted: number;
    newCards: number;
  }>;
  height?: number;
}

export function MultiBarChart({ data, height = 250 }: MultiBarChartProps) {
  const [chartWidth, setChartWidth] = useState(800);

  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('[data-chart-container]');
      if (container) {
        setChartWidth(container.clientWidth - 60);
      } else {
        setChartWidth(Math.max(600, window.innerWidth - 100));
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500" style={{ height }}>
        <p>暂无数据</p>
      </div>
    );
  }

  const maxReviews = Math.max(...data.map(d => d.reviewsCompleted), 1);
  const maxCards = Math.max(...data.map(d => d.newCards), 1);
  const maxValue = Math.max(maxReviews, maxCards, 1);
  const padding = { top: 30, bottom: 50, left: 50, right: 30 };
  const chartHeight = height - padding.top - padding.bottom;
  const barGroupWidth = (chartWidth - padding.left - padding.right) / data.length;
  const barWidth = Math.max(8, barGroupWidth * 0.28);
  const gap = Math.max(2, barGroupWidth * 0.08);

  // Y轴刻度
  const maxTick = maxValue === 0 ? 5 : Math.max(5, Math.ceil(maxValue / 5) * 5);
  const tickCount = 5;
  const tickStep = maxTick / tickCount;

  return (
    <div className="w-full" data-chart-container>
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={height} style={{ minWidth: '100%' }}>
          {/* 背景网格线 */}
          {Array.from({ length: tickCount + 1 }).map((_, i) => {
            const y = padding.top + ((tickCount - i) / tickCount) * chartHeight;
            return (
              <line
                key={i}
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Y轴标签 */}
          {Array.from({ length: tickCount + 1 }).map((_, i) => {
            const value = Math.round(i * tickStep);
            const y = padding.top + ((tickCount - i) / tickCount) * chartHeight;
            return (
              <text
                key={i}
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                {value}
              </text>
            );
          })}

          {/* 数据条 */}
          {data.map((item, index) => {
            const x = padding.left + index * barGroupWidth;
            const reviewsHeight = (item.reviewsCompleted / maxTick) * chartHeight;
            const cardsHeight = (item.newCards / maxTick) * chartHeight;

            return (
              <g key={index}>
                {/* 完成复习 */}
                <rect
                  x={x + gap}
                  y={padding.top + chartHeight - reviewsHeight}
                  width={barWidth}
                  height={reviewsHeight || 0}
                  fill="#3b82f6"
                  rx={2}
                />
                {/* 新增卡片 */}
                <rect
                  x={x + gap + barWidth + gap}
                  y={padding.top + chartHeight - cardsHeight}
                  width={barWidth}
                  height={cardsHeight || 0}
                  fill="#10b981"
                  rx={2}
                />
              </g>
            );
          })}

          {/* X轴标签 */}
          {data.map((item, index) => {
            // 只显示部分标签，避免拥挤
            const showLabel = data.length <= 14 || index % Math.ceil(data.length / 7) === 0 || index === data.length - 1;
            if (!showLabel) {
              return null;
            }
            const date = new Date(item.date);
            const label = `${date.getMonth() + 1}/${date.getDate()}`;
            const x = padding.left + index * barGroupWidth + barGroupWidth / 2;
            return (
              <text
                key={index}
                x={x}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* 图例 */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-700">完成复习</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-700">新增卡片</span>
        </div>
      </div>
    </div>
  );
}

interface LineChartProps {
  data: Array<{
    date: string;
    averageRating: number;
  }>;
  height?: number;
}

export function SimpleLineChart({ data, height = 250 }: LineChartProps) {
  const [chartWidth, setChartWidth] = useState(800);

  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('[data-chart-container]');
      if (container) {
        setChartWidth(container.clientWidth - 60);
      } else {
        setChartWidth(Math.max(600, window.innerWidth - 100));
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500" style={{ height }}>
        <p>暂无数据</p>
      </div>
    );
  }

  const max = 5;
  const min = 0;
  const padding = { top: 30, bottom: 50, left: 50, right: 30 };
  const chartHeight = height - padding.top - padding.bottom;

  // 过滤出有评分的数据点
  const validData = data
    .map((item, index) => ({
      index,
      value: item.averageRating,
      date: item.date,
    }))
    .filter(point => point.value > 0);

  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500" style={{ height }}>
        <p>暂无评分数据</p>
      </div>
    );
  }

  // 计算路径点
  const points = validData.map((point) => {
    const x = padding.left + (point.index / (data.length - 1 || 1)) * (chartWidth - padding.left - padding.right);
    const normalizedValue = (point.value - min) / (max - min);
    const y = padding.top + (1 - normalizedValue) * chartHeight;
    return {
      x,
      y,
      value: point.value,
      date: point.date,
    };
  });

  // 生成路径字符串
  const pathData = points.length > 1
    ? points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
    : '';

  // Y轴刻度
  const yTicks = [0, 1, 2, 3, 4, 5];

  return (
    <div className="w-full" data-chart-container>
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={height} style={{ minWidth: '100%' }}>
          {/* 背景网格线 */}
          {yTicks.map((value) => {
            const y = padding.top + ((5 - value) / 5) * chartHeight;
            return (
              <line
                key={value}
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Y轴标签 */}
          {yTicks.map((value) => {
            const y = padding.top + ((5 - value) / 5) * chartHeight;
            return (
              <text
                key={value}
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                {value}
              </text>
            );
          })}

          {/* 数据线 */}
          {pathData && (
            <path
              d={pathData}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 数据点 */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={4}
              fill="#8b5cf6"
              stroke="#fff"
              strokeWidth={2}
            />
          ))}

          {/* X轴标签 */}
          {data.map((item, index) => {
            // 只显示部分标签，避免拥挤
            const showLabel = data.length <= 14 || index % Math.ceil(data.length / 7) === 0 || index === data.length - 1;
            if (!showLabel) {
              return null;
            }
            const date = new Date(item.date);
            const label = `${date.getMonth() + 1}/${date.getDate()}`;
            const x = padding.left + (index / (data.length - 1 || 1)) * (chartWidth - padding.left - padding.right);
            return (
              <text
                key={index}
                x={x}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* 图例 */}
      <div className="flex justify-center mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
          <span className="text-sm text-gray-700">平均评分</span>
        </div>
      </div>
    </div>
  );
}


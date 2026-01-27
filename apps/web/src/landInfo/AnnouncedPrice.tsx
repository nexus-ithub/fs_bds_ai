import React, { useState, useEffect, useRef } from "react";
import { Title } from "./Row";
import { XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from "recharts";
import { krwUnit } from "@repo/common";

export interface AnnouncedPriceAvgData {
  city: { year: number; avgPrice: number; landCount: number }[];
  district: { year: number; avgPrice: number; landCount: number }[];
  dong: { year: number; avgPrice: number; landCount: number }[];
  individual: { year: number; price: number }[];
}

interface AnnouncedPriceProps {
  data: AnnouncedPriceAvgData | null;
  cityName?: string;
  districtName?: string;
  dongName?: string;
}

const COLORS = {
  city: { stroke: "#0082FF", fill: "#0082FF15" },        // 한강블루
  district: { stroke: "#A855F7", fill: "#A855F715" },    // 보라
  dong: { stroke: "#14B8A6", fill: "#14B8A620" },        // 틸
  individual: { stroke: "#EF4444", fill: "#EF444425" },  // 빨간색 (가장 강조)
};

export const AnnouncedPrice = React.forwardRef<HTMLDivElement, AnnouncedPriceProps>(
  ({ data, cityName = "시", districtName = "구", dongName = "동" }, ref) => {
    const [visibleLines, setVisibleLines] = useState({
      city: true,
      district: true,
      dong: true,
      individual: true,
    });
    const [showAllYears, setShowAllYears] = useState(false);
    const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
    const chartContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const container = chartContainerRef.current;
      if (!container) return;

      const updateSize = () => {
        const { width, height } = container.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setChartSize({ width, height });
        }
      };

      // 약간의 딜레이 후 크기 체크 (DOM 렌더링 완료 대기)
      const timer = setTimeout(updateSize, 50);

      const observer = new ResizeObserver(updateSize);
      observer.observe(container);
      return () => {
        clearTimeout(timer);
        observer.disconnect();
      };
    }, [data]);

    const isLoading = !data;

    // 모든 연도를 합쳐서 차트 데이터 생성
    const allYears = new Set<number>();
    data?.city.forEach(d => allYears.add(d.year));
    data?.district.forEach(d => allYears.add(d.year));
    data?.dong.forEach(d => allYears.add(d.year));
    data?.individual?.forEach(d => allYears.add(d.year));

    const sortedYears = Array.from(allYears).sort((a, b) => a - b);

    const allChartData = sortedYears.map(year => {
      const cityData = data?.city.find(d => d.year === year);
      const districtData = data?.district.find(d => d.year === year);
      const dongData = data?.dong.find(d => d.year === year);
      const individualData = data?.individual?.find(d => d.year === year);

      return {
        year,
        city: cityData?.avgPrice || null,
        district: districtData?.avgPrice || null,
        dong: dongData?.avgPrice || null,
        individual: individualData?.price || null,
      };
    });

    // 최근 10년치 또는 전체 데이터
    const chartData = showAllYears
      ? allChartData
      : allChartData.slice(-10);

    const displayedYears = chartData.map(d => d.year);

    const formatPrice = (value: number) => {
      if (value >= 10000000) {
        return `${(value / 10000000).toFixed(0)}천만`;
      }
      if (value >= 10000) {
        return `${(value / 10000).toFixed(0)}만`;
      }
      return `${value}`;
    };

    const formatYear = (value: number) => {
      return `'${String(value).slice(-2)}`;
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white border border-line-02 rounded-[8px] p-[14px] shadow-xl">
            <p className="font-s1-p text-text-01 mb-[10px] pb-[8px] border-b border-line-02">{label}년</p>
            <div className="space-y-[6px]">
              {payload.map((entry: any, index: number) => (
                entry.value && (
                  <div key={index} className="flex items-center justify-between gap-[16px]">
                    <div className="flex items-center gap-[6px]">
                      <div
                        className="w-[10px] h-[10px] rounded-full"
                        style={{ backgroundColor: entry.stroke }}
                      />
                      <span className="font-s3 text-text-03">{entry.name}</span>
                    </div>
                    <span className="font-s2-p text-text-01">{krwUnit(entry.value, true)}/㎡</span>
                  </div>
                )
              ))}
            </div>
          </div>
        );
      }
      return null;
    };

    const CustomLegend = () => {
      const items = [
        { key: 'individual', name: '선택 필지', color: COLORS.individual.stroke },
        { key: 'dong', name: dongName, color: COLORS.dong.stroke },
        { key: 'district', name: districtName, color: COLORS.district.stroke },
        { key: 'city', name: cityName, color: COLORS.city.stroke },
      ];

      return (
        <div className="flex justify-center gap-[12px] mt-[8px]">
          {items.map((item) => {
            const isVisible = visibleLines[item.key as keyof typeof visibleLines];
            return (
              <button
                key={item.key}
                onClick={() => setVisibleLines(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                className={`flex items-center gap-[5px] cursor-pointer hover:opacity-70 transition-all ${
                  isVisible ? '' : 'opacity-40'
                }`}
              >
                <div
                  className="w-[16px] h-[3px] rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-c3 text-text-02">{item.name}</span>
              </button>
            );
          })}
        </div>
      );
    };

    return (
      <div ref={ref} className="space-y-[20px]">
        <div className="flex flex-col">
          <Title title="공시지가" />
          <div className="flex items-center justify-between mb-[8px]">
            <p className="font-s3 text-text-03">연도별 평균 공시지가 추이</p>
            {allChartData.length > 10 && (
              <button
                onClick={() => setShowAllYears(!showAllYears)}
                className="font-s3 font-medium text-primary-01 underline underline-offset-2 hover:text-primary-02"
              >
                {showAllYears ? "최근 10년" : "전체 보기"}
              </button>
            )}
          </div>

          <div ref={chartContainerRef} className="w-full h-[200px] relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-bg-02 rounded-[8px]">
                <span className="font-s3 text-text-03">데이터를 불러오는 중...</span>
              </div>
            )}
            {!isLoading && chartSize.width > 0 && chartSize.height > 0 && (
              <AreaChart
                width={chartSize.width}
                height={chartSize.height}
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.city.stroke} stopOpacity={0.12}/>
                    <stop offset="95%" stopColor={COLORS.city.stroke} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDistrict" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.district.stroke} stopOpacity={0.12}/>
                    <stop offset="95%" stopColor={COLORS.district.stroke} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDong" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.dong.stroke} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={COLORS.dong.stroke} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIndividual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.individual.stroke} stopOpacity={0.18}/>
                    <stop offset="95%" stopColor={COLORS.individual.stroke} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: '#888' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E5E5' }}
                  tickFormatter={formatYear}
                  ticks={showAllYears ? displayedYears.filter(y => y % 5 === 0) : displayedYears}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#888' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatPrice}
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} />
                {visibleLines.city && (
                  <Area
                    type="monotone"
                    dataKey="city"
                    name={cityName}
                    stroke={COLORS.city.stroke}
                    strokeWidth={1.5}
                    fill="url(#colorCity)"
                    dot={false}
                    activeDot={{ r: 3, stroke: COLORS.city.stroke, strokeWidth: 1.5, fill: '#fff' }}
                    connectNulls
                  />
                )}
                {visibleLines.district && (
                  <Area
                    type="monotone"
                    dataKey="district"
                    name={districtName}
                    stroke={COLORS.district.stroke}
                    strokeWidth={1.5}
                    fill="url(#colorDistrict)"
                    dot={false}
                    activeDot={{ r: 3, stroke: COLORS.district.stroke, strokeWidth: 1.5, fill: '#fff' }}
                    connectNulls
                  />
                )}
                {visibleLines.dong && (
                  <Area
                    type="monotone"
                    dataKey="dong"
                    name={dongName}
                    stroke={COLORS.dong.stroke}
                    strokeWidth={2}
                    fill="url(#colorDong)"
                    dot={false}
                    activeDot={{ r: 3.5, stroke: COLORS.dong.stroke, strokeWidth: 2, fill: '#fff' }}
                    connectNulls
                  />
                )}
                {visibleLines.individual && (
                  <Area
                    type="monotone"
                    dataKey="individual"
                    name="선택 필지"
                    stroke={COLORS.individual.stroke}
                    strokeWidth={2.5}
                    fill="url(#colorIndividual)"
                    dot={false}
                    activeDot={{ r: 4, stroke: COLORS.individual.stroke, strokeWidth: 2, fill: '#fff' }}
                    connectNulls
                  />
                )}
              </AreaChart>
            )}
          </div>
          <CustomLegend />
        </div>
      </div>
    );
  }
);

AnnouncedPrice.displayName = "AnnouncedPrice";

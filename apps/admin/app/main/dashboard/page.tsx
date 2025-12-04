'use client';

import { HDivider, ArrowUpLong, ArrowDownLong, MinusSmallIcon, Spinner, DotProgress } from "@repo/common";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import useAxiosWithAuth from "../../utils/axiosWithAuth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { calculateChangeRate, ChangeRate } from "../../utils/dashboardUtil";
import { DetailDialog } from "./DetailDialog";
import { trackError } from "../../utils/analytics";


interface UserCountData {
  date: string;
  users: number;
}

const generateEmptyChartData = () => {
  const data = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toLocaleDateString('ko-KR', { 
        month: '2-digit', 
        day: '2-digit' 
      }).replace(/\.$/, ''),
      users: 0
    });
  }
  
  return data;
};

// percentage 계산 함수
const calculatePercentage = (data: { name: string; value: number }[]) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return data.map(item => ({
    ...item,
    percentage: total > 0 ? Number(((item.value / total) * 100).toFixed(1)) : 0
  }));
};

// 색상 팔레트
// const GENDER_COLORS = ['#4091FF', '#FF8E94'];
const GENDER_COLORS = ['#446FFF', '#FF6870']
const AGE_COLORS = ['#4E52FF', '#5A70FF', '#688EFF', '#76ABFF', '#84C9FF', '#5FC4E0', '#7bdaff', '#cffeff'];



const INTEREST_COLOR = '#4e52ff';

export default function Dashboard() {
  const axiosInstance = useAxiosWithAuth();
  const emptyChartData = generateEmptyChartData();
  const [pageviewData, setPageviewData] = useState<UserCountData[]>(emptyChartData);
  const [signupData, setSignupData] = useState<UserCountData[]>(emptyChartData);
  const [reportRanking, setReportRanking] = useState<any[]>([]);
  const [reportViewCount, setReportViewCount] = useState<{today: number, yesterday: number}>({today: 0, yesterday: 0});
  const [bdsRanking, setBdsRanking] = useState<any[]>([]);
  const [askChatData, setAskChatData] = useState<UserCountData[]>([]);

  const [genderDataRaw, setGenderDataRaw] = useState<{name: string, value: number}[]>([]);
  const [ageDataRaw, setAgeDataRaw] = useState<{name: string, value: number}[]>([]);
  const [interestDataRaw, setInterestDataRaw] = useState<{name: string, value: number}[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [openReportDetail, setOpenReportDetail] = useState<boolean>(false);
  const [openBdsDetail, setOpenBdsDetail] = useState<boolean>(false);

  // percentage가 포함된 데이터
  const genderData = calculatePercentage(genderDataRaw);
  const ageData = calculatePercentage(ageDataRaw);
  const interestData = interestDataRaw;

  useEffect(() => {
    const fetchDashboardData = async () => {
      const response = await axiosInstance.get('/dashboard?action=dashboard');
      const data = await response.data;

      if (pageviewData) {
        const formatted = data.pageView.days.map((day: string, idx: number) => ({
            date: new Date(day)
              .toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
              .replace(/\.$/, ''),
            users: data.pageView.data[idx]
          }));
        setPageviewData(formatted);

        const reportViewedItems = data.report
          .filter((item: any) => item.action.id === 'report_viewed')
          .filter((item: any) =>
            item.breakdown_value !== '$$_posthog_breakdown_null_$$' &&
            item.breakdown_value !== 'null null'
          );
        if (reportViewedItems.length > 0) {
          const todayTotal = reportViewedItems.reduce((sum: number, item: any) =>
            sum + item.data[item.data.length - 1], 0
          );

          const yesterdayTotal = reportViewedItems.reduce((sum: number, item: any) =>
            sum + (item.data[item.data.length - 2] || 0), 0
          );

          setReportViewCount({ today: todayTotal, yesterday: yesterdayTotal });
        }

        const reportViewedByRegion = reportViewedItems
          .map((item: any) => ({
            name: item.breakdown_value,
            value: item.count,
            todayCount: item.data[item.data.length - 1],
            yesterdayCount: item.data[item.data.length - 2] || 0
          }))
          .sort((a: any, b: any) => b.value - a.value)
        setReportRanking(reportViewedByRegion);

        const bdsViewedItems = data.bds
          .filter((item: any) => item.action.id === 'bds_viewed')
          .filter((item: any) =>
            item.breakdown_value !== '$$_posthog_breakdown_null_$$' &&
            item.breakdown_value !== 'null null'
          );

        const bdsViewedByRegion = bdsViewedItems
          .map((item: any) => ({
            name: item.breakdown_value,
            value: item.count,
            todayCount: item.data[item.data.length - 1],
            yesterdayCount: item.data[item.data.length - 2] || 0
          }))
          .sort((a: any, b: any) => b.value - a.value)
        setBdsRanking(bdsViewedByRegion);

        const signupData = data.signup;
        if (signupData) {
          const formatted = signupData.days.map((day: string, idx: number) => ({
              date: new Date(day)
                .toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
                .replace(/\.$/, ''),
              users: signupData.data[idx]
            }));
          setSignupData(formatted);
        }

        const askChatData = data.askChat;
        if (askChatData) {
          const formatted = askChatData.days.map((day: string, idx: number) => ({
              date: new Date(day)
                .toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
                .replace(/\.$/, ''),
              users: askChatData.data[idx]
            }));
          setAskChatData(formatted);
        }
      }
    }

    const fetchUserStatistics = async () => {
      const [genderResponse, ageResponse, interestResponse] = await Promise.all([
        axiosInstance.get('/dashboard?action=genderCount'),
        axiosInstance.get('/dashboard?action=ageCount'),
        axiosInstance.get('/dashboard?action=interestCount')
      ]);

      setGenderDataRaw(genderResponse.data);
      setAgeDataRaw(ageResponse.data);
      setInterestDataRaw(interestResponse.data);
    }

    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchDashboardData(),
          fetchUserStatistics()
        ]);
      } catch (error) {
        console.error(error);
        trackError(error, {
          message: "대시보드 조회에 실패했습니다.",
          file: "/dashboard/page.tsx",
          page: window.location.pathname,
          severity: "error"
        })
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const formattedDate = new Date(label).toLocaleDateString('ko-KR', { 
        month: 'long', 
        day: 'numeric' 
      });
      return (
        <div className="bg-white rounded-[8px] shadow-[0_6px_12px_0_rgba(0,0,0,0.06)] border border-line-02">
          <p className="font-s2-p px-[10px] py-[4px] border-b border-line-03">{formattedDate}</p>
          <p className="font-s2 px-[10px] py-[8px]">
            사용자 수: &nbsp;<span>{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };



  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-[8px] shadow-[0_6px_12px_0_rgba(0,0,0,0.06)] border border-line-02 px-[12px] py-[8px]">
          <p className="font-s2">
            {payload[0].payload.name}: <span className="font-s2-p">{payload[0].value.toLocaleString()}명</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-[8px] shadow-[0_6px_12px_0_rgba(0,0,0,0.06)] border border-line-02 px-[12px] py-[8px]">
          <p className="font-s2">
            {payload[0].name}: <span className="font-s2-p">{payload[0].value.toLocaleString()}명 ({payload[0].payload.percentage}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCenterLabel = (total: number, title: string) => {
    return (
      <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle">
        <tspan x="50%" dy="0" className="font-h4 fill-text-03">{title}</tspan>
        <tspan x="50%" dy="1.8em" className="font-h3 fill-text-01">{total.toLocaleString()}명</tspan>
      </text>
    );
  };

  return (
    <div className="w-[960px] flex flex-col gap-[32px] p-[40px] overflow-y-auto scrollbar-hover">
      <div className="flex flex-col gap-[4px]">
        <h2 className="font-h2">DASHBOARD</h2>
        <div className="flex items-center justify-between gap-[12px]">
          <p className="font-s2 text-text-02">사용자들의 데이터를 기반으로 다양한 지표를 제공합니다.</p>
        </div>
        <HDivider className="!bg-line-02 my-[12px]"/>
        {loading 
        ? <div className="flex items-center justify-center">
            <DotProgress size="sm"/>
          </div>
        : <div className="flex items-center gap-[16px]">
            <div className="flex flex-1 flex-col items-center gap-[16px] p-[20px] rounded-[8px] border border-line-02 shadow-[0_6px_12px_0_rgba(0,0,0,0.06)]">
              <h4 className="font-h4">일간 사용자 수</h4>
              <div className="font-h1 flex items-baseline">
                {(pageviewData.at(-1)?.users ?? 0).toLocaleString()}<span className="font-h6 ml-[3px]">명</span>
              </div>
              <div className="flex items-center gap-[6px]">
                <p className="font-s2 text-text-03">전일대비</p>
                <ChangeRate current={pageviewData.at(-1)?.users ?? 0} previous={pageviewData.at(-2)?.users ?? 0} />
              </div>
            </div>
            <div className="flex flex-1 flex-col items-center gap-[16px] p-[20px] rounded-[8px] border border-line-02 shadow-[0_6px_12px_0_rgba(0,0,0,0.06)]">
              <h4 className="font-h4">신규 가입자 수</h4>
              <p className="font-h1">{signupData.at(-1)?.users ?? 0}<span className="font-h6 ml-[3px]">명</span></p>
              <div className="flex items-center gap-[6px]">
                <p className="font-s2 text-text-03">전일대비</p>
                <ChangeRate current={signupData.at(-1)?.users ?? 0} previous={signupData.at(-2)?.users ?? 0} />
              </div>
            </div>
            <div className="flex flex-1 flex-col items-center gap-[16px] p-[20px] rounded-[8px] border border-line-02 shadow-[0_6px_12px_0_rgba(0,0,0,0.06)]">
              <h4 className="font-h4">리포트 조회 수</h4>
              <p className="font-h1">{reportViewCount.today}<span className="font-h6 ml-[3px]">건</span></p>
              <div className="flex items-center gap-[6px]">
                <p className="font-s2 text-text-03">전일대비</p>
                <ChangeRate current={reportViewCount.today} previous={reportViewCount.yesterday} />
              </div>
            </div>
            <div className="flex flex-1 flex-col items-center gap-[16px] p-[20px] rounded-[8px] border border-line-02 shadow-[0_6px_12px_0_rgba(0,0,0,0.06)]">
              <h4 className="font-h4">AI 질의 수</h4>
              <p className="font-h1">{askChatData.at(-1)?.users ?? 0}<span className="font-h6 ml-[3px]">건</span></p>
              <div className="flex items-center gap-[6px]">
                <p className="font-s2 text-text-03">전일대비</p>
                <ChangeRate current={askChatData.at(-1)?.users ?? 0} previous={askChatData.at(-2)?.users ?? 0} />
              </div>
            </div>
          </div>}
      </div>
      {!loading && 
        <>
          <div className="flex items-center gap-[32px]">
            <div className="flex flex-1 flex-col gap-[20px] p-[20px] rounded-[8px] border border-line-02 shadow-[0_6px_12px_0_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <h4 className="font-h4">리포트 조회 지역</h4>
                <button className="font-h6 text-primary" onClick={() => setOpenReportDetail(true)}>전체보기</button>
              </div>
              <div className="flex flex-col gap-[8px]">
                {(() => {
                  const totalCount = reportRanking.reduce((sum, item) => sum + (item.value || 0), 0);
                  
                  return Array.from({ length: 5 }).map((_, index) => {
                    const item = reportRanking[index] ?? { name: "", value: 0, todayCount: 0, yesterdayCount: 0 };
                    const changeRate = calculateChangeRate(item.todayCount, item.yesterdayCount);
                    const percentage = totalCount > 0 ? ((item.value / totalCount) * 100).toFixed(1) : "0.0";

                    let rankDisplay;
                    if (index === 0) rankDisplay = "🥇";
                    else if (index === 1) rankDisplay = "🥈";
                    else if (index === 2) rankDisplay = "🥉";
                    else rankDisplay = index + 1;

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-[16px] font-s1 p-[12px] rounded-[4px] border border-line-02"
                      >
                        <p className="flex items-center">
                          <span className={index >= 3 ? "w-[21.97px] flex justify-center text-text-04" : ""}>
                            {rankDisplay}
                          </span>
                          <span>{item.name}</span>
                        </p>
                        <div className="flex items-center gap-[12px]">
                          <p className="font-s1">{item.value ? `${percentage}%` : ""}</p>
                          {item.name && (
                            <>
                              {changeRate.status === "increase" && <ArrowUpLong />}
                              {changeRate.status === "decrease" && <ArrowDownLong />}
                              {changeRate.status === "same" && <MinusSmallIcon />}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-[20px] p-[20px] rounded-[8px] border border-line-02 shadow-[0_6px_12px_0_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <h4 className="font-h4">빌딩샵 매물 조회 순</h4>
                <button className="font-h6 text-primary" onClick={() => setOpenBdsDetail(true)}>전체보기</button>
              </div>
              <div className="flex flex-col gap-[8px]">
                {(() => {
                  const totalCount = bdsRanking.reduce((sum, item) => sum + (item.value || 0), 0);
                  
                  return Array.from({ length: 5 }).map((_, index) => {
                    const item = bdsRanking[index] ?? { name: "", value: 0, todayCount: 0, yesterdayCount: 0 };
                    const changeRate = calculateChangeRate(item.todayCount, item.yesterdayCount);
                    const percentage = totalCount > 0 ? ((item.value / totalCount) * 100).toFixed(1) : "0.0";

                    let rankDisplay;
                    if (index === 0) rankDisplay = "🥇";
                    else if (index === 1) rankDisplay = "🥈";
                    else if (index === 2) rankDisplay = "🥉";
                    else rankDisplay = index + 1;

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-[16px] font-s1 p-[12px] rounded-[4px] border border-line-02"
                      >
                        <p className="flex items-center">
                          <span className={index >= 3 ? "w-[21.97px] flex justify-center text-text-04" : ""}>
                            {rankDisplay}
                          </span>
                          <span>{item.name}</span>
                        </p>
                        <div className="flex items-center gap-[12px]">
                          <p className="font-s1">{item.value ? `${percentage}%` : ""}</p>
                          {item.name && (
                            <>
                              {changeRate.status === "increase" && <ArrowUpLong />}
                              {changeRate.status === "decrease" && <ArrowDownLong />}
                              {changeRate.status === "same" && <MinusSmallIcon />}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* 새로운 통계 그래프 섹션 */}
          {/* 파이차트 2개 */}
          <div className="grid grid-cols-2 gap-[16px]">
            {/* 성비 분포 */}
            <div className="flex flex-col gap-[20px] p-[20px] rounded-[8px] border border-line-02 shadow-[0_6px_12px_0_rgba(0,0,0,0.06)]">
              <h4 className="font-h4">성비 분포</h4>
              <div className="flex flex-col items-center gap-[20px]">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      fill="#8884d8"
                      dataKey="value"
                      isAnimationActive={false}
                      paddingAngle={2}
                    >
                      {genderData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={GENDER_COLORS[index % GENDER_COLORS.length]}
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} isAnimationActive={false} />
                    {renderCenterLabel(
                      genderData.reduce((sum, item) => sum + item.value, 0),
                      '전체'
                    )}
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-[24px]">
                  {genderData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-[8px]">
                      <div 
                        className="w-[14px] h-[14px] rounded-full" 
                        style={{ backgroundColor: GENDER_COLORS[index] }}
                      />
                      <span className="font-s1 text-text-02">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 연령대 분포 */}
            <div className="flex flex-col gap-[20px] p-[20px] rounded-[8px] border border-line-02 shadow-[0_6px_12px_0_rgba(0,0,0,0.06)]">
              <h4 className="font-h4">연령대 분포</h4>
              <div className="flex flex-col items-center gap-[20px]">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={ageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      fill="#8884d8"
                      dataKey="value"
                      isAnimationActive={false}
                      paddingAngle={2}
                    >
                      {ageData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={AGE_COLORS[index % AGE_COLORS.length]}
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} isAnimationActive={false} />
                    {renderCenterLabel(
                      ageData.reduce((sum, item) => sum + item.value, 0),
                      '전체'
                    )}
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-[12px] justify-center">
                  {ageData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-[6px]">
                      <div 
                        className="w-[12px] h-[12px] rounded-full" 
                        style={{ backgroundColor: AGE_COLORS[index] }}
                      />
                      <span className="font-s2 text-text-02">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 관심분야 막대그래프 */}
          <div className="flex flex-col gap-[20px] p-[20px] rounded-[8px] border border-line-02 shadow-[0_6px_12px_0_rgba(0,0,0,0.06)]">
            <h4 className="font-h4">관심분야</h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={interestData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 13, fill: '#6b7280' }}
                  tickMargin={10}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 13 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  content={<CustomBarTooltip />} 
                  isAnimationActive={false}
                  cursor={false}
                />
                <Bar 
                  dataKey="value" 
                  fill={INTEREST_COLOR}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                  activeBar={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-1 flex-col gap-[20px] p-[20px] rounded-[8px] border border-line-02 shadow-[0_6px_12px_0_rgba(0,0,0,0.06)]">
            <h4 className="font-h4">일간 사용자 추이</h4>
            {loading ? <Spinner /> : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart 
                  data={pageviewData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fontSize: 14, fill: '#6b7280' }}
                    tickMargin={12}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 14 }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#4e52ff"
                    strokeWidth={2}
                    dot={{ fill: '#4e52ff', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-[20px] p-[20px] rounded-[8px] border border-line-02 shadow-[0_6px_12px_0_rgba(0,0,0,0.06)]">
            <h4 className="font-h4">신규 가입자 추이</h4>
            {loading ? <Spinner /> : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart 
                  data={signupData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fontSize: 14, fill: '#6b7280' }}
                    tickMargin={12}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 14 }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#4e52ff"
                    strokeWidth={2}
                    dot={{ fill: '#4e52ff', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      }
      <DetailDialog open={openReportDetail} onClose={() => setOpenReportDetail(false)} type="reportDetail" />
      <DetailDialog open={openBdsDetail} onClose={() => setOpenBdsDetail(false)} type="bdsDetail" />
    </div>
  );
}
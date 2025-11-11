'use client';

import { HDivider, ArrowUpLong, ArrowDownLong, VDivider, MinusIcon, MinusSmallIcon, Spinner, DotProgress } from "@repo/common";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import useAxiosWithAuth from "../../utils/axiosWithAuth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateChangeRate } from "../../utils/dashboardUtil";

interface UserCountData {
  date: string;
  users: number;
}

const ChangeRate = ({current, previous}: {current: number, previous: number}) => {
  const changeRate = calculateChangeRate(current, previous);
  return (
    <p className={`flex items-center font-s2 ${changeRate.status === 'increase' ? 'text-secondary-050' : changeRate.status === 'decrease' ? 'text-primary' : ''} mr-[2px]`}>
      {changeRate.percent}%
      <span>
        {changeRate.status === 'increase' 
          ? <ArrowUpLong /> 
          : changeRate.status === 'decrease' 
          ? <ArrowDownLong /> 
          : <MinusSmallIcon />}
      </span>
    </p>
  );
};

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

export default function Dashboard() {
  const { data: session, status } = useSession();
  const axiosInstance = useAxiosWithAuth();
  const emptyChartData = generateEmptyChartData();
  const [pageviewData, setPageviewData] = useState<UserCountData[]>(emptyChartData);
  const [signupData, setSignupData] = useState<UserCountData[]>(emptyChartData);
  const [reportRanking, setReportRanking] = useState<any[]>([]);
  const [reportViewCount, setReportViewCount] = useState<{today: number, yesterday: number}>({today: 0, yesterday: 0});
  const [bdsRanking, setBdsRanking] = useState<any[]>([]);
  const [askChatData, setAskChatData] = useState<UserCountData[]>([]);

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try{
        const response = await axiosInstance.get('/dashboard');
        const data = await response.data;
        console.log(">>data", data)
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
      } catch(error) {
        console.log(error)
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
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

  return (
    <div className="w-[960px] flex flex-col gap-[32px] p-[40px] overflow-y-auto scrollbar-hover">
      <div className="flex flex-col gap-[4px]">
        <h2 className="font-h2">DASHBOARD</h2>
        <div className="flex items-center justify-between gap-[12px]">
          <p className="font-s2 text-text-02">사용자들의 데이터를 기반으로 다양한 지표를 제공합니다.</p>
          <div className="flex items-center gap-[6px]">
            <p className="font-s3 text-primary">UPDATED</p>
            <VDivider colorClassName="bg-line-04" className="!h-[10px]"/>
            <p className="font-s3">2025.07.21 16:52:32</p>
          </div>
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
                <button className="font-h6 text-primary">전체보기</button>
              </div>
              <div className="flex flex-col gap-[8px]">
              {/* {reportRankingSample.map((item, index) => {
                let rankDisplay;
                if (index === 0) rankDisplay = "🥇";
                else if (index === 1) rankDisplay = "🥈";
                else if (index === 2) rankDisplay = "🥉";
                else rankDisplay = index + 1;

                return (
                  <div key={index} className="flex items-center justify-between gap-[16px] font-s1 p-[12px] rounded-[4px] border border-line-02">
                    <p className="flex items-center">
                      <span className={index >= 3 ? "w-[21.97px] flex justify-center text-text-04" : ""}>
                        {rankDisplay}
                      </span>
                      <span>{item.name}</span>
                    </p>
                    <div className="flex items-center gap-[12px]">
                      <p className="font-s1">{item.value}%</p>
                      {Number(item.value) > Number(item.preValue) && <ArrowUpLong />}
                      {Number(item.value) < Number(item.preValue) && <ArrowDownLong />}
                      {Number(item.value) === Number(item.preValue) && <MinusSmallIcon />}
                    </div>
                  </div>
                );
              })} */}
                {Array.from({ length: 5 }).map((_, index) => {
                  const item = reportRanking[index] ?? { name: "", value: "", todayCount: 0, yesterdayCount: 0 };
                  const changeRate = calculateChangeRate(item.todayCount, item.yesterdayCount);

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
                        <p className="font-s1">{item.value ? `${item.value}건` : ""}</p>
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
                })}

              </div>
            </div>
            <div className="flex flex-1 flex-col gap-[20px] p-[20px] rounded-[8px] border border-line-02 shadow-[0_6px_12px_0_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <h4 className="font-h4">빌딩샵 매물 조회 순</h4>
                <button className="font-h6 text-primary">전체보기</button>
              </div>
              <div className="flex flex-col gap-[8px]">
              {/* {bdsRankingSample.map((item, index) => {
                let rankDisplay;
                if (index === 0) rankDisplay = "🥇";
                else if (index === 1) rankDisplay = "🥈";
                else if (index === 2) rankDisplay = "🥉";
                else rankDisplay = index + 1;

                return (
                  <div key={index} className="flex items-center justify-between gap-[16px] font-s1 p-[12px] rounded-[4px] border border-line-02">
                    <p className="flex items-center">
                      <span className={index >= 3 ? "w-[21.97px] flex justify-center text-text-04" : ""}>
                        {rankDisplay}
                      </span>
                      <span>{item.name}</span>
                    </p>
                    <div className="flex items-center gap-[12px]">
                      <p className="font-s1">{item.value}%</p>
                      {Number(item.value) > Number(item.preValue) && <ArrowUpLong />}
                      {Number(item.value) < Number(item.preValue) && <ArrowDownLong />}
                      {Number(item.value) === Number(item.preValue) && <MinusSmallIcon />}
                    </div>
                  </div>
                );
              })} */}
              {Array.from({ length: 5 }).map((_, index) => {
                  const item = bdsRanking[index] ?? { name: "", value: "", todayCount: 0, yesterdayCount: 0 };
                  const changeRate = calculateChangeRate(item.todayCount, item.yesterdayCount);

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
                        <p className="font-s1">{item.value ? `${item.value}건` : ""}</p>
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
                })}
              </div>
            </div>
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
      
    </div>
  );
}
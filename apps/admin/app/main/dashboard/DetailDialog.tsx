import { Dialog } from "@mui/material"
import { useEffect, useState } from "react"
import useAxiosWithAuth from "../../utils/axiosWithAuth";
import { ArrowDownLong, ArrowUpLong, CloseIcon, DotProgress, MinusSmallIcon } from '@repo/common';
import { calculateChangeRate } from "../../utils/dashboardUtil";

const tabs = ['일간', '주간', '월간'];

export const DetailDialog = ({open, onClose, type}: {open: boolean, onClose: () => void, type: string}) => {
  const axiosInstance = useAxiosWithAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [rawData, setRawData] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('주간');

  useEffect(() => {
    if (!open) return;
    setSelectedTab('주간');
    
    const fetchDashboardData = async () => {
      setLoading(true);
      setRawData([]);
      try{
        const response = await axiosInstance.get('/dashboard?action=' + type + '&interval=월간');
        const data = await response.data;
        const Items = data
          .filter((item: any) => 
            item.breakdown_value !== '$$_posthog_breakdown_null_$$' && 
            item.breakdown_value !== 'null null'
          );
        setRawData(Items);
      } catch(error) {
        console.log(error)
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [open]);

  useEffect(() => {
    if (rawData.length === 0) return;

    const calculateCounts = (item: any) => {
      const dataArray = item.data;
      const daysArray = item.days;
      
      if (selectedTab === '일간') {
        return {
          count: dataArray[dataArray.length - 1] || 0,
          lastCount: dataArray[dataArray.length - 2] || 0
        };
      } else if (selectedTab === '주간') {
        const recentWeekSum = dataArray.slice(-7).reduce((sum: number, val: number) => sum + val, 0);
        const lastWeekSum = dataArray.slice(-14, -7).reduce((sum: number, val: number) => sum + val, 0);
        return {
          count: recentWeekSum,
          lastCount: lastWeekSum
        };
      } else if (selectedTab === '월간') {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        let currentMonthSum = 0;
        let lastMonthSum = 0;
        
        daysArray.forEach((day: string, index: number) => {
          const date = new Date(day);
          const month = date.getMonth();
          const year = date.getFullYear();
          
          if (year === currentYear && month === currentMonth) {
            currentMonthSum += dataArray[index];
          } else if (
            (year === currentYear && month === currentMonth - 1) ||
            (currentMonth === 0 && year === currentYear - 1 && month === 11)
          ) {
            lastMonthSum += dataArray[index];
          }
        });
        
        return {
          count: currentMonthSum,
          lastCount: lastMonthSum
        };
      }
      
      return { count: 0, lastCount: 0 };
    };

    const processedData = rawData
      .map((item: any) => {
        const { count, lastCount } = calculateCounts(item);
        return {
          name: item.breakdown_value,
          value: item.count,
          count: count,
          lastCount: lastCount
        };
      })
      .sort((a: any, b: any) => b.value - a.value);
    
    setData(processedData);
  }, [rawData, selectedTab]);
  
  return (
    <Dialog open={open} onClose={onClose}>
      <div className="flex flex-col w-[420px]">
        <div className="flex items-center justify-between px-[20px] py-[12px] border-b border-line-02">
          <h3 className="font-h3 flex items-center">{type === 'reportDetail' ? '리포트 조회 지역' : '빌딩샵 매물 조회 순'} 상세보기</h3>
          <button onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="flex flex-col px-[20px] py-[8px]">
          <div className="inline-flex self-start border border-line-02 rounded-[4px] divide-x divide-line-02">
            {tabs.map((tab, idx) => (
              <button key={idx} className={`font-s2 px-[8px] py-[6px] ${selectedTab === tab ? 'text-primary' : ' text-text-4'}`} onClick={() => setSelectedTab(tab)}>{tab}</button>
            ))}
          </div>
          <div className="max-h-[280px] min-h-[280px] flex-1 flex overflow-y-auto pt-[8px] scrollbar-hover">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <DotProgress size="sm"/>
              </div>
            ) : data.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p>데이터가 없습니다.</p>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-[4px] pt-[8px]">
                {(() => {
                  const totalCount = data.reduce((sum, item) => sum + (item.value || 0), 0);
                  
                  return Array.from({ length: data.length }).map((_, index) => {
                    const item = data[index] ?? { name: "", value: 0, count: 0, lastCount: 0 };
                    const changeRate = calculateChangeRate(item.count, item.lastCount);
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
            )}
          </div>
        </div>
      </div>
    </Dialog>
  )
}
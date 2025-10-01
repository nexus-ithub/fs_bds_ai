import { HDivider, ArrowUpLong, ArrowDownLong, VDivider, Button } from "@repo/common";

export default function Dashboard() {
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
        <HDivider className="!bg-line-02 my-[16px]"/>
        <div className="flex items-center gap-[16px]">
          <div className="flex flex-1 flex-col items-center gap-[16px] p-[20px] rounded-[8px] border border-line-02 shadow-[0_6px_12px_0_rgba(0,0,0,0.06)]">
            <h4 className="font-h4">일간 사용자 수</h4>
            <p className="font-h1">8,354<span className="font-h6 ml-[2px]">명</span></p>
            <div className="flex items-center gap-[6px]">
              <p className="font-s2 text-text-03">전일대비</p>
              <p className="flex items-center font-s2 text-secondary-050 mr-[2px]">12.8%<span><ArrowUpLong /></span></p>
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center gap-[16px] p-[20px] rounded-[8px] border border-line-02 shadow-[0_6px_12px_0_rgba(0,0,0,0.06)]">
            <h4 className="font-h4">신규 가입자 수</h4>
            <p className="font-h1">125<span className="font-h6 ml-[2px]">명</span></p>
            <div className="flex items-center gap-[6px]">
              <p className="font-s2 text-text-03">전일대비</p>
              <p className="flex items-center font-s2 text-secondary-050 mr-[2px]">12.8%<span><ArrowUpLong /></span></p>
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center gap-[16px] p-[20px] rounded-[8px] border border-line-02 shadow-[0_6px_12px_0_rgba(0,0,0,0.06)]">
            <h4 className="font-h4">리포트 조회 수</h4>
            <p className="font-h1">15,783<span className="font-h6 ml-[2px]">건</span></p>
            <div className="flex items-center gap-[6px]">
              <p className="font-s2 text-text-03">전일대비</p>
              <p className="flex items-center font-s2 text-primary mr-[2px]">5.3%<span><ArrowDownLong /></span></p>
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center gap-[16px] p-[20px] rounded-[8px] border border-line-02 shadow-[0_6px_12px_0_rgba(0,0,0,0.06)]">
            <h4 className="font-h4">AI 질의 수</h4>
            <p className="font-h1">25,395<span className="font-h6 ml-[2px]">건</span></p>
            <div className="flex items-center gap-[6px]">
              <p className="font-s2 text-text-03">전일대비</p>
              <p className="flex items-center font-s2 text-secondary-050 mr-[2px]">12.8%<span><ArrowUpLong /></span></p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-[32px]">
          <div className="flex flex-1 gap-[20px] p-[20px] rounded-[8px] border border-line-02 shadow-[0_6px_12px_0_rgba(0,0,0,0.06)]">
            <h4 className="font-h4">리포트 조회 지역</h4>
            <button className="font-h6 text-primary">전체보기</button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { ChevronDownCustomIcon, ChevronRightCustomIcon, HDivider, VDivider, DownloadIcon, PrintIcon } from "@repo/common"

export const Terms = () => {
  return (
    <div className="min-w-[1440px]">
      <div className="w-[1024px] mx-auto flex flex-col gap-[32px] px-[32px] pt-[32px] pb-[48px]">
        <div className="flex items-center gap-[4px]">
          <p className="font-s2 text-text-04">빌딩샵 고객센터</p>
          <ChevronRightCustomIcon />
          <p className="font-s2 text-text-02">서비스 이용약관</p>
        </div>
        <div className="flex flex-col gap-[32px] items-center">
          <HDivider className="!border-b-line-02"/>
          <div className="flex flex-col items-center gap-[16px]">
            <div className="flex flex-col items-center gap-[8px]">
              <h1 className="font-h1">빌딩샵 서비스 이용약관</h1>
              <p className="font-s3 text-text-02 w-[550px]">본 약관은 주식회사 정인부동산그룹(이하 "회사")이 제공하는 부동산 설계 서비스 ‘빌딩샵’(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
            </div>
            <div className="flex items-center justify-between gap-[8px] w-[160px] pr-[4px] py-[6px] border-b border-line-04">
              <p className="font-b3">2025년 7월 11일 본</p>
              <ChevronDownCustomIcon/>
            </div>
          </div>
          <div className="w-full flex items-center justify-end gap-[20px]">
            <button className="flex items-center gap-[4px]"><span className="font-b3 text-text-02">다운로드</span><DownloadIcon/></button>
            <VDivider colorClassName="bg-line-03" className="!h-[12px]"/>
            <button className="flex items-center gap-[4px]"><span className="font-b3 text-text-02">인쇄하기</span><PrintIcon/></button>
          </div>
        </div>
      </div>
    </div>
  )
}
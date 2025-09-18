import { ChevronDownCustomIcon, ChevronRightCustomIcon, HDivider } from "@repo/common"

export const Privacy = () => {
  return (
    <div className="min-w-[1440px]">
      <div className="w-[1024px] mx-auto flex flex-col gap-[32px] px-[32px] pt-[32px] pb-[48px]">
        <div className="flex items-center gap-[4px]">
          <p className="font-s2 text-text-04">빌딩샵 고객센터</p>
          <ChevronRightCustomIcon />
          <p className="font-s2 text-text-02">개인정보 처리방침</p>
        </div>
        <div className="flex flex-col gap-[32px] items-center">
          <HDivider className="!border-b-line-02"/>
          <div className="flex flex-col items-center gap-[16px]">
            <h1 className="font-h1">빌딩샵 개인정보 처리방침</h1>
            <div className="flex items-center justify-between gap-[8px] w-[160px] pr-[4px] py-[6px] border-b border-line-04">
              <p className="font-b3">2025년 7월 11일 본</p>
              <ChevronDownCustomIcon/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
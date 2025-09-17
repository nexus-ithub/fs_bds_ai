import { BuildingShopBIText, VDivider, AlarmIcon } from "@repo/common"



export const Header = () => {
  return (
    <div className="px-[20px] flex items-center justify-between h-[64px] bg-white border-b border-line-03">
      <BuildingShopBIText/>
      <div className="flex items-center gap-[16px]">
        <div className="flex items-center gap-[8px]">
          <div className="w-[24px] h-[24px] bg-purple-300 rounded-full">😁</div>
          <p className="flex items-center gap-[4px]">
            <span className="font-s2-p">김이름</span>
            <span className="font-s2 text-text-02">고객님</span>
          </p>
        </div>
        <VDivider colorClassName="bg-line-04"/>
        <button>
          <AlarmIcon/>
        </button>
        <VDivider colorClassName="bg-line-04"/>
        <a 
          href="/support"
          target="_blank"
          rel="noopener noreferrer"
          className="font-s2-p">
          고객센터
        </a>
        <VDivider colorClassName="bg-line-04"/>
        <button className="font-s2-p">
          LOGOUT
        </button>
        <VDivider colorClassName="bg-line-04"/>
        <div className="w-[160px] h-full font-b3 text-text-04 rounded-[2px] border border-line-03">
          빌딩샵 관련 사이트 (TODO)
        </div>
      </div>
    </div>
  )
}
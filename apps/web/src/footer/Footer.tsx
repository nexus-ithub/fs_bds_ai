import { HDivider, VDivider, JunginLogo, InstagramIcon, KakaoChannelIcon, NaverBlogIcon, YoutubeIcon } from "@repo/common"

export const Footer = () => {
  return (
    <div className="w-full flex py-[24px] border-t border-line-02">
      <div className="w-[960px] mx-auto flex flex-col gap-[20px]">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-[20px] font-s3 text-text-02">
            <p className="mr-[4px]"><JunginLogo/></p>
            <VDivider className="!h-[12px]"/>
            <p>고객센터</p>
            <VDivider className="!h-[12px]"/>
            <p>이용약관</p>
            <VDivider className="!h-[12px]"/>
            <p>개인정보 처리방침</p>
            <VDivider className="!h-[12px]"/>
          </div>
          <div className="flex items-center gap-[24px]">
            <InstagramIcon/>
            <YoutubeIcon/>
            <KakaoChannelIcon/>
            <NaverBlogIcon/>
          </div>
        </div>
        <div className="flex flex-col gap-[12px]">
          <div className="flex items-center gap-[12px] font-s3 text-text-02">
            <p>{'정인부동산그룹(주)'}</p>
            <VDivider className="!h-[12px]"/>
            <p>대표이사 박준연</p>
            <VDivider className="!h-[12px]"/>
            <p>사업자 등록번호: 272-86-01078</p>
          </div>
          <div className="flex items-center gap-[12px] font-s3 text-text-02">
            <p className="flex items-center gap-[4px]"><span className="font-s3-p text-text-05">T</span>02 558 3366</p>
            <VDivider className="!h-[12px]"/>
            <p className="flex items-center gap-[4px]"><span className="font-s3-p text-text-05">E</span>contact@buildingshop.co.kr</p>
            <VDivider className="!h-[12px]"/>
            <p className="flex items-center gap-[4px]"><span className="font-s3-p text-text-05">ADD.</span>{'서울특별시 강남구 테헤란로 425, 11층 (삼성동, 신일빌딩)'}</p>
          </div>
        </div>
        <HDivider className="!border-b-line-02"/>
        <div className="font-s3 text-text-02">© 2025 JUNGIN REALITY GROUP ALL RIGHTS RESERVED.</div>
      </div>
    </div>
  )
}
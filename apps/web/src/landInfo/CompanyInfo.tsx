import { CI, InstagramIcon, KakaoChannelIcon, NaverBlogIcon, YoutubeIcon } from "@repo/common"
import { VDivider } from "@repo/common"
import { INSTAGRAM_URL, KAKAO_CHANNEL_URL, NAVER_BLOG_URL, YOUTUBE_CHANNEL_URL } from "../constants"


export const CompanyInfo = () => {
  return (
    <div className="flex flex-col p-[20px] bg-surface-second rounded-[8px] gap-[12px]">
      <div className="flex items-center gap-[8px] justify-between">
        <CI/>
        <div className="flex items-center gap-[18px]">
          <button
            onClick={() => window.open(INSTAGRAM_URL)}>
            <InstagramIcon/>
          </button>
          <button
            onClick={() => window.open(YOUTUBE_CHANNEL_URL)}>
            <YoutubeIcon/>
          </button>
          <button
            onClick={() => window.open(KAKAO_CHANNEL_URL)}>
            <KakaoChannelIcon/>
          </button>
          <button
            onClick={() => window.open(NAVER_BLOG_URL)}>
            <NaverBlogIcon/>
          </button>
        </div>
      </div>
      <div className="font-s3 text-text-02 flex items-center justify-between">
        <button className="">서비스소개</button>
        <VDivider/>
        <button className="">고객센터</button>
        <VDivider/>
        <button className="">이용약관</button>
        <VDivider/>
        <button className="flex-shrink-0">개인정보 처리방침</button>
      </div>
      <div className="font-c2 text-text-02 flex items-center gap-[10px]">
        <p><span className="font-c2-p text-text-05 pr-[4px]">T</span>02 558 3366</p>
        <VDivider/>
        <p><span className="font-c2-p text-text-05 pr-[4px]">E</span>contact@buildingshop.co.kr</p>
      </div>
      <p className="font-c2 text-text-02 flex items-center"><span className="font-c2-p text-text-05 pr-[4px]">ADD.</span>서울특별시 강남구 테헤란로 425, 11층 (삼성동, 신일빌딩)</p>
      <p className="font-c2 text-text-02 flex items-center">© 2025 JUNGIN REALITY GROUP ALL RIGHTS RESERVED.</p>
    </div>
  )
}
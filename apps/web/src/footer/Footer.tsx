import { HDivider, VDivider, CI, InstagramIcon, KakaoChannelIcon, NaverBlogIcon, YoutubeIcon } from "@repo/common"
import { INSTAGRAM_URL, KAKAO_CHANNEL_URL, NAVER_BLOG_URL, YOUTUBE_CHANNEL_URL } from "../constants"

export const Footer = () => {
  return (
    <div className="w-full flex py-[24px] border-t border-line-02">
      <div className="w-[960px] mx-auto flex flex-col gap-[20px]">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-[20px] font-s3 text-text-02">
            <p className="mr-[4px]"><CI/></p>
            <VDivider className="!h-[12px]"/>
            <p>고객센터</p>
            <VDivider className="!h-[12px]"/>
            <p>이용약관</p>
            <VDivider className="!h-[12px]"/>
            <p>개인정보 처리방침</p>
            <VDivider className="!h-[12px]"/>
          </div>
          <div className="flex items-center gap-[24px]">
            <button onClick={() => window.open(INSTAGRAM_URL)}>
              <InstagramIcon/>
            </button>
            <button onClick={() => window.open(YOUTUBE_CHANNEL_URL)}>
              <YoutubeIcon/>
            </button>
            <button onClick={() => window.open(KAKAO_CHANNEL_URL)}>
              <KakaoChannelIcon/>
            </button>
            <button onClick={() => window.open(NAVER_BLOG_URL)}>
              <NaverBlogIcon/>
            </button>
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
            <p className="flex items-center gap-[4px]"><span className="font-s3-p text-text-05">T</span>02 558 7222</p>
            <VDivider className="!h-[12px]"/>
            <p className="flex items-center gap-[4px]"><span className="font-s3-p text-text-05">E</span>buildingshopai@gmail.com</p>
            <VDivider className="!h-[12px]"/>
            <p className="flex items-center gap-[4px]"><span className="font-s3-p text-text-05">ADD.</span>{'서울특별시 강남구 테헤란로 425, 11층 (삼성동, 신일빌딩)'}</p>
          </div>
        </div>
        <HDivider colorClassName="bg-line-02"/>
        <div className="font-s3 text-text-02">© 2025 JUNGIN REALITY GROUP ALL RIGHTS RESERVED.</div>
      </div>
    </div>
  )
}
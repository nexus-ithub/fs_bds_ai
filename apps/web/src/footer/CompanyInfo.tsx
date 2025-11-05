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
        <a
          href="https://chip-flare-463.notion.site/AI-29b1c63ec1af80dfb037ffc2fbd448db?source=copy_link"
          target="_blank"
          rel="noopener noreferrer"
        >
          고객센터
        </a>
        <VDivider/>
        <a
          href="https://chip-flare-463.notion.site/29b1c63ec1af80f99a43dc87641afb7c?source=copy_link"
          target="_blank"
          rel="noopener noreferrer"
        >
          이용약관
        </a>
        <VDivider/>
        <a
          href="https://chip-flare-463.notion.site/29b1c63ec1af80cdbfcfe2ca191d8e15?source=copy_link"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0"
        >
          개인정보 처리방침
        </a>
      </div>
      <div className="font-c2 text-text-02 flex items-center gap-[10px]">
        <p className="font-c2-p text-text-03 pr-[4px]">정인부동산그룹(주)</p>
        <VDivider/>
        <p>대표 : 박준연</p>
      </div>
      <p className="font-c2 text-text-02 flex items-center">사업자 등록번호 : 272-86-01078</p>
      <div className="font-c2 text-text-02 flex items-center gap-[10px]">
        <p><span className="font-c2-p text-text-05 pr-[4px]">T</span>02 558 3366</p>
        <VDivider/>
        <p><span className="font-c2-p text-text-05 pr-[4px]">E</span>junginpng@naver.com</p>
      </div>
      <p className="font-c2 text-text-02 flex items-center">
        <span className="font-c2-p text-text-05 pr-[4px]">ADD.</span>
        서울시 강남구 선릉로 340, 4층 404호 (대치동, 대치 EM 프라자)
      </p>
      <p className="font-c2 text-text-02 flex items-center">©JUNGIN REALITY GROUP ALL RIGHTS RESERVED.</p>
    </div>
  )
}
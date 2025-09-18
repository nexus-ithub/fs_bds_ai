import { HDivider, SearchBar } from "@repo/common"
import { format } from "date-fns";
import { useState } from "react"
import { useNavigate } from "react-router-dom";

const NoticeSample = [
  {
    title: "[업데이트] 2025년 공사지가 업데이트",
    date: "2025-07-24",
    content: "[업데이트] 2025년 공사지가 업데이트 내용입니다."
  },
  {
    title: "[공지] 서비스 이용약관 개정에 대한 안내 (2025.07.24 본)",
    date: "2025-07-24",
    content: "[공지] 서비스 이용약관 개정에 대한 안내 (2025.07.24 본) 내용입니다."
  },
  {
    title: "[공지] 빌딩샵 시스템 점검 안내",
    date: "2025-07-24",
    content: "[공지] 빌딩샵 시스템 점검 안내 내용입니다."
  },
  {
    title: "[업데이트] AI 설계 ∙ 임대 분석 리포트 1.3.2 업데이트 안내",
    date: "2025-07-24",
    content: "[업데이트] AI 설계 ∙ 임대 분석 리포트 1.3.2 업데이트 안내 내용입니다."
  },
  {
    title: "[공지] 개인정보 처리방침 개정에 대해 안내 (2025.07.24 본)",
    date: "2025-07-24",
    content: "[공지] 개인정보 처리방침 개정에 대해 안내 (2025.07.24 본) 내용입니다."
  },
]

const FAQSample = [
  {
    title: "일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십",
    date: "2025-07-24",
    content: "공지사항 내용입니다."
  },
  {
    title: "일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십",
    date: "2025-07-24",
    content: "공지사항 내용입니다."
  },
  {
    title: "일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십",
    date: "2025-07-24",
    content: "공지사항 내용입니다."
  },
  {
    title: "일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십",
    date: "2025-07-24",
    content: "공지사항 내용입니다."
  },
  {
    title: "일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십일이삼사오율칠팔구십",
    date: "2025-07-24",
    content: "공지사항 내용입니다."
  },
]

export const SupportMain = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState<string>("");
  return (
    <div className="flex flex-col min-w-[1440px] h-full">
      <div 
        className="flex flex-col items-center justify-center min-w-[1440px] h-[360px] flex-shrink-0"
        style={{
          backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.3) 100%), url('/support_header.jpg')`,
          backgroundSize: "100% 355.469%",
          backgroundPosition: "0px -150px",
          backgroundRepeat: "no-repeat",
          backgroundColor: "lightgray",
        }}>
        <div className="flex flex-col items-center gap-[24px]">
          <h1
            className="text-center font-[Pretendard Variable] font-semibold"
            style={{
              color: "var(--Contents-Text_Reverse, #FFF)",
              fontSize: "40px",
              lineHeight: "48px",
              textShadow: "0 6px 12px rgba(0, 0, 0, 0.06)",
            }}
          >
            빌딩샵AI 고객센터에 궁금한 점을 검색해 보세요.
          </h1>
          <SearchBar 
            value={searchValue} 
            onChange={setSearchValue}
            onSearch={(value) => console.log(value)}
            variant="roundedOutline"
            className="w-[480px]"
            inputClassName="font-b1"
          />
        </div>
      </div>
      <div className="w-[1024px] flex flex-col gap-[32px] mx-auto px-[32px] py-[48px]">
        <div className="flex flex-col gap-[16px]">
          <div className="flex items-center gap-[8px]">
            <h2 className="flex-1 font-h2">공지사항</h2>
            <span 
              className="font-s3 cursor-pointer"
              onClick={() => navigate("/support/notice")}
            >전체 보기</span>
          </div>
          <div className="flex flex-col gap-[4px] px-[20px] py-[4px] border border-line-02 rounded-[8px]">
            {NoticeSample.map((notice, index) => (
              <>
                <div key={index} className="flex items-center h-[48px]">
                  <span className="flex-1 font-s1 text-text-02 line-clamp-1">{notice.title}</span>
                  <span className="font-s1 text-text-02">{format(new Date(notice.date), "yyyy.MM.dd")}</span>
                </div>
                {index !== NoticeSample.length - 1 && (
                  <HDivider className="!border-line-02"/>
                )}
              </>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-[16px]">
          <div className="flex items-center gap-[8px]">
            <h2 className="flex-1 font-h2">FAQ</h2>
            <span 
              className="font-s3 cursor-pointer"
              onClick={() => navigate("/support/faq")}
            >전체 보기</span>
          </div>
          <div className="flex flex-col gap-[4px] px-[20px] py-[4px] border border-line-02 rounded-[8px]">
            {FAQSample.map((faq, index) => (
              <>
                <div key={index} className="flex items-center h-[48px]">
                  <span className="flex-1 font-s1 text-text-02 line-clamp-1">{faq.title}</span>
                </div>
                {index !== FAQSample.length - 1 && (
                  <HDivider className="!border-line-02"/>
                )}
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
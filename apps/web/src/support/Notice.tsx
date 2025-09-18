import { ChevronRightCustomIcon, TabButton } from "@repo/common";
import { VDivider } from "@repo/common";
import { format } from "date-fns";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const NoticeSample = [
  {
    title: "[카테고리] 타이틀입니다. 일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십",
    date: "2025-07-24",
    category: 'C',
    id: 1,
    content: "[카테고리] 내용입니다. 일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십"
  },
  {
    title: "[업데이트] 2025년 공시지가 업데이트",
    date: "2025-07-24",
    category: 'U',
    id: 2,
    content: "[업데이트] 2025년 공시지가 업데이트 내용입니다."
  },
  {
    title: "[공지] 서비스 이용약관 개정에 대한 안내 (2025.07.24 본)",
    date: "2025-07-24",
    category: 'N',
    id: 3,
    content: "[공지] 서비스 이용약관 개정에 대한 안내 (2025.07.24 본) 내용입니다."
  },
  {
    title: "[공지] 빌딩샵 시스템 점검 안내",
    date: "2025-07-24",
    category: 'N',
    id: 4,
    content: "[공지] 빌딩샵 시스템 점검 안내 내용입니다."
  },
  {
    title: "[업데이트] AI 설계 ∙ 임대 분석 리포트 1.3.2 업데이트 안내",
    date: "2025-07-24",
    category: 'U',
    id: 5,
    content: "[업데이트] AI 설계 ∙ 임대 분석 리포트 1.3.2 업데이트 안내 내용입니다."
  },
  {
    title: "[공지] 개인정보 처리방침 개정에 대해 안내 (2025.07.24 본)",
    date: "2025-07-24",
    category: 'N',
    id: 6,
    content: "[공지] 개인정보 처리방침 개정에 대해 안내 (2025.07.24 본) 내용입니다."
  },
  {
    title: "[업데이트] AI 설계 ∙ 임대 분석 리포트 1.3.1 업데이트 안내",
    date: "2025-07-24",
    category: 'U',
    id: 7,
    content: "[업데이트] AI 설계 ∙ 임대 분석 리포트 1.3.1 업데이트 안내 내용입니다."
  },
  {
    title: "[공지] 빌딩샵 시스템 점검 안내",
    date: "2025-07-24",
    category: 'N',
    id: 8,
    content: "[공지] 빌딩샵 시스템 점검 안내 내용입니다."
  },
  {
    title: "[이벤트] 빌딩샵 오픈 이벤트 안내",
    date: "2025-07-24",
    category: 'E',
    id: 9,
    content: "[이벤트] 빌딩샵 오픈 이벤트 안내 내용입니다."
  },
  {
    title: "[공지] 빌딩샵 서비스 Grand Open 안내",
    date: "2025-07-24",
    category: 'N',
    id: 10,
    content: "[공지] 빌딩샵 서비스 Grand Open 안내 내용입니다."
  },
  // {
  //   title: "[카테고리] 타이틀입니다. 일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십",
  //   date: "2025-07-24",
  //   content: "[카테고리] 내용입니다. 일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십"
  // },
  // {
  //   title: "[업데이트] 2025년 공시지가 업데이트",
  //   date: "2025-07-24",
  //   content: "[업데이트] 2025년 공시지가 업데이트 내용입니다."
  // },
  // {
  //   title: "[공지] 서비스 이용약관 개정에 대한 안내 (2025.07.24 본)",
  //   date: "2025-07-24",
  //   content: "[공지] 서비스 이용약관 개정에 대한 안내 (2025.07.24 본) 내용입니다."
  // },
  // {
  //   title: "[공지] 빌딩샵 시스템 점검 안내",
  //   date: "2025-07-24",
  //   content: "[공지] 빌딩샵 시스템 점검 안내 내용입니다."
  // },
  // {
  //   title: "[업데이트] AI 설계 ∙ 임대 분석 리포트 1.3.2 업데이트 안내",
  //   date: "2025-07-24",
  //   content: "[업데이트] AI 설계 ∙ 임대 분석 리포트 1.3.2 업데이트 안내 내용입니다."
  // },
  // {
  //   title: "[공지] 개인정보 처리방침 개정에 대해 안내 (2025.07.24 본)",
  //   date: "2025-07-24",
  //   content: "[공지] 개인정보 처리방침 개정에 대해 안내 (2025.07.24 본) 내용입니다."
  // },
  // {
  //   title: "[업데이트] AI 설계 ∙ 임대 분석 리포트 1.3.1 업데이트 안내",
  //   date: "2025-07-24",
  //   content: "[업데이트] AI 설계 ∙ 임대 분석 리포트 1.3.1 업데이트 안내 내용입니다."
  // },
  // {
  //   title: "[공지] 빌딩샵 시스템 점검 안내",
  //   date: "2025-07-24",
  //   content: "[공지] 빌딩샵 시스템 점검 안내 내용입니다."
  // },
  // {
  //   title: "[이벤트] 빌딩샵 오픈 이벤트 안내",
  //   date: "2025-07-24",
  //   content: "[이벤트] 빌딩샵 오픈 이벤트 안내 내용입니다."
  // },
  // {
  //   title: "[공지] 빌딩샵 서비스 Grand Open 안내",
  //   date: "2025-07-24",
  //   content: "[공지] 빌딩샵 서비스 Grand Open 안내 내용입니다."
  // },
  // {
  //   title: "[카테고리] 타이틀입니다. 일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십",
  //   date: "2025-07-24",
  //   content: "[카테고리] 내용입니다. 일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십"
  // },
  // {
  //   title: "[업데이트] 2025년 공시지가 업데이트",
  //   date: "2025-07-24",
  //   content: "[업데이트] 2025년 공시지가 업데이트 내용입니다."
  // },
  // {
  //   title: "[공지] 서비스 이용약관 개정에 대한 안내 (2025.07.24 본)",
  //   date: "2025-07-24",
  //   content: "[공지] 서비스 이용약관 개정에 대한 안내 (2025.07.24 본) 내용입니다."
  // },
  // {
  //   title: "[공지] 빌딩샵 시스템 점검 안내",
  //   date: "2025-07-24",
  //   content: "[공지] 빌딩샵 시스템 점검 안내 내용입니다."
  // },
  // {
  //   title: "[업데이트] AI 설계 ∙ 임대 분석 리포트 1.3.2 업데이트 안내",
  //   date: "2025-07-24",
  //   content: "[업데이트] AI 설계 ∙ 임대 분석 리포트 1.3.2 업데이트 안내 내용입니다."
  // },
  // {
  //   title: "[공지] 개인정보 처리방침 개정에 대해 안내 (2025.07.24 본)",
  //   date: "2025-07-24",
  //   content: "[공지] 개인정보 처리방침 개정에 대해 안내 (2025.07.24 본) 내용입니다."
  // },
  // {
  //   title: "[업데이트] AI 설계 ∙ 임대 분석 리포트 1.3.1 업데이트 안내",
  //   date: "2025-07-24",
  //   content: "[업데이트] AI 설계 ∙ 임대 분석 리포트 1.3.1 업데이트 안내 내용입니다."
  // },
]

const NOTICE_TABS = [
  { label: '전체', value: '' },
  { label: '공지', value: 'N' },
  { label: '업데이트', value: 'U' },
  { label: '이벤트', value: 'E' },
  { label: '기타', value: 'etc' },
];


export const Notice = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <div className="min-w-[1440px]">
      <div className="w-[1024px] mx-auto flex flex-col gap-[40px] px-[32px] pt-[32px] pb-[48px]">
        <div className="flex items-center gap-[4px]">
          <p className="font-s2 text-text-04">빌딩샵 고객센터</p>
          <ChevronRightCustomIcon />
          <p className="font-s2 text-text-02">공지사항</p>
        </div>
        <div className="flex flex-col gap-[16px]">
          <div className="flex items-center gap-[12px]">
            <h2 className="font-h2 text-text-01">공지사항</h2>
            <VDivider colorClassName="bg-line-04" className="!h-[12px]"/>
            <p className="font-s2 text-text-03">빌딩샵의 다양한 소식과 공지, 업데이트, 이벤트 소식을 한곳에 모아뒀어요. 언제든 편하게 확인하시고 서비스 이용에 참고해 주세요.</p>
          </div>
          <div>
            <div className="flex items-center">
              {
                NOTICE_TABS.map((tab, index) => (
                  <TabButton
                    key={index}
                    className="px-[24px] py-[14px]"
                    fontClassName={'font-s1'}
                    selected={index === selectedTab}
                    onClick={() => {setSelectedTab(index)}}
                  >
                    {tab.label}
                  </TabButton>
                ))
              }
            </div>
            <div className="flex flex-col divide-y divide-line-02 border-t border-b border-line-02">
              {
                NoticeSample.map((notice, index) => (
                  <div key={index} 
                    className="group flex items-center justify-between gap-[6px] h-[56px] cursor-pointer"
                    onClick={() => navigate(`/support/notice/${notice.id}`)}>
                    <p className="flex-1 font-s1 text-text-02 line-clamp-1 group-hover:text-primary">{notice.title}</p>
                    <span className="font-s1 text-text-02 group-hover:text-primary">{format(new Date(notice.date), "yyyy.MM.dd")}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
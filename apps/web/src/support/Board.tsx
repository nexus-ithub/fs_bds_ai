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
]

export const FAQSample = [
  {
    title: "[계정관련] 회원가입은 어떻게 하나요?",
    category: 'A',
    id: 1,
    content: "회원가입은 빌딩샵 홈페이지에서 회원가입 버튼을 클릭하여 진행하시면 됩니다."
  },
  {
    title: "[계정관련] 비밀번호를 잊어버렸는데 어떻게 재설정할 수 있나요?",
    category: 'A',
    id: 2,
    content: "비밀번호를 잃어버렸다면 빌딩샵 홈페이지에서 비밀번호 찾기 버튼을 클릭하여 진행하시면 됩니다."
  },
  {
    title: "[서비스관련] 지도에서 건축물이나 토지를 선택하는 방법은 어떻게 되나요?",
    category: 'S',
    id: 3,
    content: "지도에서 건축물이나 토지를 선택하는 방법은 지도에서 건축물이나 토지를 선택하는 방법을 참고해 주세요."
  },
  {
    title: "[AI 관련] AI가 제공하는 평가 결과는 어느 정도 신뢰할 수 있나요?",
    category: 'AI',
    id: 4,
    content: "AI가 제공하는 평가 결과는 어느 정도 신뢰할 수 있습니다. 그러나 실제 상황과는 다를 수 있으므로, 반드시 실제 상황을 고려하여 판단하시기 바랍니다."
  },
  {
    title: "[기타] 서비스 이용 요금은 어떻게 되나요?",
    category: 'etc',
    id: 5,
    content: "빌딩샵 서비스 이용 요금은 빌딩샵 홈페이지에서 확인하실 수 있습니다."
  },
  {
    title: "[서비스관련] 건축/리모델링/임대 추천 리포트는 어떤 방식으로 제공되나요?",
    category: 'S',
    id: 6,
    content: "건축/리모델링/임대 추천 리포트는 빌딩샵 홈페이지에서 확인하실 수 있습니다."
  },
  {
    title: "[계정관련] 소셜 로그인(카카오/네이버/구글 등)도 지원하나요?",
    category: 'A',
    id: 7,
    content: "소셜 로그인(카카오/네이버/구글 등)도 지원합니다."
  },
  {
    title: "[기타] 공지사항과 업데이트는 어디서 확인할 수 있나요?",
    category: 'etc',
    id: 8,
    content: "공지사항과 업데이트는 빌딩샵 홈페이지에서 확인하실 수 있습니다."
  },
  {
    title: "[서비스관련] 모바일에서도 동일한 기능을 사용할 수 있나요?",
    category: 'S',
    id: 9,
    content: "빌딩샵은 모바일에서도 동일한 기능을 사용할 수 있습니다."
  },
  {
    title: "[계정관련] 회원가입은 어떻게 하나요?",
    category: 'A',
    id: 10,
    content: "회원가입은 빌딩샵 홈페이지에서 회원가입 버튼을 클릭하여 진행하시면 됩니다."
  },
]

const NOTICE_TABS = [
  { label: '전체', value: '' },
  { label: '공지', value: 'N' },
  { label: '업데이트', value: 'U' },
  { label: '이벤트', value: 'E' },
  { label: '기타', value: 'etc' },
];

const FAQ_TABS = [
  { label: '전체', value: '' },
  { label: '계정', value: 'A' },
  { label: '서비스', value: 'S' },
  { label: 'AI', value: 'AI' },
  { label: '기타', value: 'etc' },
];


export const Board = ({type}: {type: 'notice' | 'faq'}) => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);
  const tabs = type === 'notice' ? NOTICE_TABS : FAQ_TABS;

  return (
    <div className="min-w-[1440px]">
      <div className="w-[1024px] mx-auto flex flex-col gap-[40px] px-[32px] pt-[32px] pb-[48px]">
        <div className="flex items-center gap-[4px]">
          <p className="font-s2 text-text-04">빌딩샵 고객센터</p>
          <ChevronRightCustomIcon />
          <p className="font-s2 text-text-02">{type === 'notice' ? '공지사항' : 'FAQ'}</p>
        </div>
        <div className="flex flex-col gap-[16px]">
          <div className="flex items-center gap-[12px]">
            <h2 className="font-h2 text-text-01">{type === 'notice' ? '공지사항' : '빌딩샵 FAQ'}</h2>
            <VDivider colorClassName="bg-line-04" className="!h-[12px]"/>
            <p className="font-s2 text-text-03">
              {type === 'notice' ? 
              '빌딩샵의 다양한 소식과 공지, 업데이트, 이벤트 소식을 한곳에 모아뒀어요. 언제든 편하게 확인하시고 서비스 이용에 참고해 주세요.' : 
              '빌딩샵을 사용하시며 자주 문의 주시는 질문과 답변을 한곳에 모았습니다. 궁금증을 빠르게 해결하실 수 있습니다.'}
            </p>
          </div>
          <div>
            <div className="flex items-center">
              {
                tabs.map((tab, index) => (
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
              {type === 'notice' ? (
                NoticeSample.map((notice, index) => (
                  <div key={index} 
                    className="group flex items-center justify-between gap-[6px] h-[56px] cursor-pointer"
                    onClick={() => navigate(`/support/notice/${notice.id}`)}>
                    <p className="flex-1 font-s1 text-text-02 line-clamp-1 group-hover:text-primary">{notice.title}</p>
                    <span className="font-s1 text-text-02 group-hover:text-primary">{format(new Date(notice.date), "yyyy.MM.dd")}</span>
                  </div>
                ))
              ) : (
                FAQSample.map((faq, index) => (
                  <div key={index} 
                    className="group flex items-center justify-between gap-[6px] h-[56px] cursor-pointer"
                    onClick={() => navigate(`/support/faq/${faq.id}`)}>
                    <p className="flex-1 font-s1 text-text-02 line-clamp-1 group-hover:text-primary">{faq.title}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
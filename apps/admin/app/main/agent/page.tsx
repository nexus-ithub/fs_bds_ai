'use client';
import { Button, HDivider, AILogo, VDivider, CloseIcon, type Question, DotGridIcon, SendIcon } from "@repo/common";
import { useEffect, useState, useRef } from "react";

const QUESTIONS_SAMPLE: Question[] = [
  {
    id: 1,
    icon: "💸",
    question: "부동산 매매 시 사용가능한 금융상품 추천해 주세요.",
    seq: 1,
    selectedYn: "Y",
    deleteYn: "N",
    createdAt: new Date(),
  },
  {
    id: 2,
    icon: "🏠",
    question: "매매 후 재건축 프로세스가 궁금합니다.",
    seq: 2,
    selectedYn: "Y",
    deleteYn: "N",
    createdAt: new Date(),
  },
  {
    id: 3,
    icon: "🏢",
    question: "토지를 매입하고 신축을 할 경우 프로세스가 궁금해요.",
    seq: 3,
    selectedYn: "Y",
    deleteYn: "N",
    createdAt: new Date(),
  },
];

export default function Agent() {
  const [agentName, setAgentName] = useState<string>("빌딩샵AI");
  const [agentNameDesc, setAgentNameDesc] = useState<string>("부동산 매매 및 설계전문 빌딩샵에서 제공하는 부동산 전문 AI 입니다.");
  const [newchatName, setNewchatName] = useState<string>("NEW CHAT");
  const [chatTitle, setChatTitle] = useState<string>("안녕하세요! 빌딩샵AI 입니다.");
  const [chatSubTitle, setChatSubTitle] = useState<string>("부동산 건물 매매 및 건축설계 전문 빌딩샵입니다.\n관련해서 궁금하신것이 있으시면 무엇이든 물어보세요!");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [placeholder, setPlaceholder] = useState<string>("궁금하신 점을 물어보세요.");
  const [warningMsg, setWarningMsg] = useState<string>("빌딩샵은 AI 모델입니다. 제공된 정보를 항상 검증하시기 바랍니다.");

  const [openQuestionSetting, setOpenQuestionSetting] = useState<boolean>(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const nameDescRef = useRef<HTMLInputElement>(null);
  const newchatNameRef = useRef<HTMLInputElement>(null);
  const subTitleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (nameInputRef.current) {
      const tmp = document.createElement("span");
      tmp.style.font = getComputedStyle(nameInputRef.current).font;
      tmp.textContent = agentName || " ";
      document.body.appendChild(tmp);
      nameInputRef.current.style.width = `${tmp.offsetWidth + 4}px`;
      document.body.removeChild(tmp);
    }
  }, [agentName]);

  useEffect(() => {
    if (nameDescRef.current) {
      const tmp = document.createElement("span");
      tmp.style.font = getComputedStyle(nameDescRef.current).font;
      tmp.textContent = agentNameDesc || " ";
      document.body.appendChild(tmp);
      nameDescRef.current.style.width = `${tmp.offsetWidth + 4}px`;
      document.body.removeChild(tmp);
    }
  }, [agentNameDesc]);

  useEffect(() => {
    if (newchatNameRef.current) {
      const tmp = document.createElement("span");
      tmp.style.font = getComputedStyle(newchatNameRef.current).font;
      tmp.textContent = newchatName || " ";
      document.body.appendChild(tmp);
      newchatNameRef.current.style.width = `${tmp.offsetWidth + 25}px`;
      document.body.removeChild(tmp);
    }
  }, [newchatName]);

  useEffect(() => {
    const textarea = subTitleRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [chatSubTitle]);
  
  return (
    <div className="inline-flex flex-col gap-[16px] p-[40px]">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-[4px]">
          <h2 className="font-h2">에이전트 화면 설정</h2>
          <p className="font-s2 text-text-02">고객에게 노출될 AI 에이전트 초기화면을 설정해 보세요.</p>
        </div>
        <Button className="w-[80px]">저장</Button>
      </div>
      <HDivider className="!bg-line-02"/>
      <div className="w-[768px] h-[952px] flex flex-col rounded-[8px] border border-line-03">
        <div className="w-full flex items-center justify-between h-[64px] px-[20px] py-[14px] border-b border-line-02">
          <div className="flex items-center gap-[12px]">
            <AILogo/>
            <input 
              ref={nameInputRef}
              type="text" 
              className="font-s2-p text-text-01 focus:outline-none" 
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              style={{ width: `${agentName.length * 0.6}em` }}
              />
            <VDivider colorClassName="bg-line-04"/>
            <input 
              ref={nameDescRef}
              type="text" 
              className="font-s2-p text-text-01 focus:outline-none" 
              value={agentNameDesc}
              onChange={(e) => setAgentNameDesc(e.target.value)}
              style={{ width: `${agentNameDesc.length * 0.6}em` }}
              />
          </div>
          <div className="flex items-center gap-[12px]">
            <input 
              ref={newchatNameRef}
              type="text" 
              className="font-s3-p text-text-02 px-[12px] py-[8px] border border-line-03 rounded-[4px] focus:outline-none" 
              value={newchatName}
              onChange={(e) => setNewchatName(e.target.value)}
              style={{ width: `${newchatName.length * 0.6}em` }}
              />
            <CloseIcon color="#1A1C20"/>
          </div>
        </div>
        <div className="w-full px-[48px] flex-1">
          <div className="flex flex-col gap-[40px] py-[64px]">
            <div className="flex flex-col gap-[8px] py-[12px]">
              <input 
                type="text" 
                className="font-h2 text-text-01 text-center focus:outline-none" 
                value={chatTitle}
                onChange={(e) => setChatTitle(e.target.value)}
                />
              <textarea
                ref={subTitleRef}
                className="font-b2 text-text-01 focus:outline-none text-center resize-none transition-[height] duration-200 ease-in-out"
                value={chatSubTitle}
                onChange={(e) => setChatSubTitle(e.target.value)}
                />
            </div>
            <div className="flex flex-col gap-[20px]">
              <div className="flex flex-col gap-[16px] p-[24px] rounded-[8px] border border-dashed border-line-03">
                {QUESTIONS_SAMPLE.map((question) => (
                  <div key={question.id} className="flex items-center gap-[6px]">
                    <div className="flex items-center justify-center w-[32px] h-[64px] rounded-[4px] border border-line-02" style={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.05)' }}>
                      <DotGridIcon/>
                    </div>
                    <div className="flex-1 flex items-center gap-[12px] h-[64px] p-[12px] rounded-[4px] border border-line-02" style={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.05)' }}>
                      <span className="w-[40px] h-[40px] flex items-center justify-center rounded-[4px] border border-line-02 bg-grayscale-005">{question.icon}</span>
                      <p className="font-s2">{question.question}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-[6px]" onClick={() => setOpenQuestionSetting(!openQuestionSetting)}>
                  <div className="flex items-center justify-center w-[32px] h-[64px] rounded-[4px] border border-line-02 bg-grayscale-005" style={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.05)' }}>
                    <span className="opacity-30"><DotGridIcon/></span>
                  </div>
                  <div className="flex-1 flex items-center gap-[12px] h-[64px] p-[12px] rounded-[4px] border border-line-02 bg-grayscale-005" style={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.05)' }}>
                    <span className="w-[40px] h-[40px] py-[5px] rounded-[4px] border border-line-02 bg-grayscale-005"></span>
                    <p className="font-s2 text-text-05">추천질문을 선택해 주세요.</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => setOpenQuestionSetting(!openQuestionSetting)}>추천질문 관리</Button>
            </div>
          </div>
        </div>
        <div className="flex flex-col px-[32px]">
          <div className="flex items-center justify-between gap-[10px] px-[16px] py-[12px] rounded-[4px] border border-line-03">
            <div className="flex-1 font-b1 text-text-04">
              <input 
                type="text" 
                className="w-full font-b1 text-text-04 focus:outline-none" 
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                />
            </div>
            <SendIcon/>
          </div>
          <div className="h-[56px] flex items-center justify-center">
            <input 
              type="text"
              className="w-full font-c2 text-text-04 focus:outline-none text-center"
              value={warningMsg}
              onChange={(e) => setWarningMsg(e.target.value)}
              />
          </div>
        </div>
      </div>
      {openQuestionSetting && (
        <div className="fixed inset-y-0 top-[64px] right-0 z-[40] flex justify-end bg-red-200">
          <div className="w-[480px] flex flex-col rounded-[8px] border border-line-03">
            
          </div>
        </div>
      )}
    </div>
  );
}
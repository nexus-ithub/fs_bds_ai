'use client';
import { Button, HDivider, AILogo, VDivider, CloseIcon, type Question, type Agent, DotGridIcon, SendIcon, PlusIcon, MenuDropdown, Checkbox, Spinner, DeleteIcon, EditIcon } from "@repo/common";
import { useEffect, useState, useRef } from "react";
import { DndContext, closestCenter, useSensors, useSensor, MouseSensor, TouchSensor, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import useAxiosWithAuth from "../../utils/axiosWithAuth";
import { Dialog, Menu } from "@mui/material";

const emojis = [
  "🏠", "🏢", "🏣", "🏛️", "🏦", "🏗️", "🏭", "🪜", "🛠", 
  "📐", "💰", "💸", "🧱", "🌳", "🔍", "⭐", "🔔", "❗", "👀", "📅", "✅", "✨", "📌", "📍", "🧭"
];

const SortableQuestionItem = ({ question }: { question: Question }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.8 : 1,
    cursor: 'grab',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="flex items-center gap-[6px]"
    >
      <div 
        className="flex items-center justify-center w-[32px] h-[64px] rounded-[4px] border border-line-02" 
        style={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.05)' }}
      >
        <DotGridIcon/>
      </div>
      <div className="flex-1 flex items-center gap-[12px] h-[64px] p-[12px] rounded-[4px] border border-line-02" style={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.05)' }}>
        <span className="w-[40px] h-[40px] font-h2 flex shrink-0 items-center justify-center rounded-[4px] border border-line-02 bg-grayscale-005">{question.icon}</span>
        <p className="font-s2">{question.question}</p>
      </div>
    </div>
  );
};

export default function Agent() {
  const axiosInstance = useAxiosWithAuth();
  const [agentName, setAgentName] = useState<string>("");
  const [nameDesc, setNameDesc] = useState<string>("");
  const [newchatLabel, setNewchatLabel] = useState<string>("");
  const [chatTitle, setChatTitle] = useState<string>("");
  const [chatSubtitle, setChatSubtitle] = useState<string>("");
  const [placeholder, setPlaceholder] = useState<string>("");
  const [warningMsg, setWarningMsg] = useState<string>("");
  const [setting, setSetting] = useState<Agent | null>(null);
  const [isCheckedRecommends, setIsCheckedRecommends] = useState<boolean>(false);
  const [questionEdit, setQuestionEdit] = useState<Question[]>([]);
  const [selectedEmoji, setSelectedEmoji] = useState<string>("🏢")
  const [newQuestion, setNewQuestion] = useState<string>("")
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hoveredQuestionId, setHoveredQuestionId] = useState<number | null>(null);

  const [openQuestionSetting, setOpenQuestionSetting] = useState<boolean>(false);
  const [openAddQuestion, setOpenAddQuestion] = useState<boolean>(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState<boolean>(false);
  const [getSettingLoading, setGetSettingLoading] = useState<boolean>(false);
  const [saveSettingLoading, setSaveSettingLoading] = useState<boolean>(false);
  const [addQuestionLoading, setAddQuestionLoading] = useState<boolean>(false);
  const [deleteQuestionLoading, setDeleteQuestionLoading] = useState<boolean>(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const nameDescRef = useRef<HTMLInputElement>(null);
  const newchatLabelRef = useRef<HTMLInputElement>(null);
  const subTitleRef = useRef<HTMLTextAreaElement>(null);
  const dragConstraintRef = useRef<HTMLDivElement>(null);
  const questionSettingRef = useRef<HTMLDivElement>(null);
  const deleteConfirmRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const modifiers = [restrictToParentElement];

  // 렌더링을 위해 선택된 질문 목록만 준비하고 seq를 기준으로 정렬합니다.
  const selectedQuestions = questionEdit
    .filter(q => q.selectedYn === "Y")
    .sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setQuestionEdit((prevRecommends) => {
        // 1. 현재 렌더링/드래그 중인 선택된 질문들 (이미 정렬된 상태)
        const selectedItems = prevRecommends
          .filter(q => q.selectedYn === "Y")
          .sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));
        
        // 2. 드래그 전/후 인덱스 찾기
        const oldIndex = selectedItems.findIndex(item => item.id === active.id);
        const newIndex = selectedItems.findIndex(item => item.id === over?.id);
        
        if (oldIndex === -1 || newIndex === -1) return prevRecommends;

        // 3. 순서 변경
        const reorderedSelectedItems = arrayMove(selectedItems, oldIndex, newIndex);

        // 4. 변경된 순서에 따라 seq 값을 업데이트할 Map 생성
        const updatedSelectedMap = new Map(
          reorderedSelectedItems.map((item, index) => [
            item.id, 
            { ...item, seq: index + 1 } 
          ])
        );

        // 5. 전체 questionRecommends 배열을 순회하며 변경된 항목만 업데이트
        return prevRecommends.map(item => {
          if (updatedSelectedMap.has(item.id)) {
            return updatedSelectedMap.get(item.id)!;
          }
          return item; // 선택되지 않은 항목이나 순서 변경 대상이 아닌 항목은 그대로 유지
        });
      });
    }
  };

  const handleQuestionSelect = (question: Question) => {
    const isCurrentlySelected = question.selectedYn === "Y";
    const currentSelectedCount = questionEdit.filter(q => q.selectedYn === "Y").length;
    
    if (!isCurrentlySelected && currentSelectedCount >= 5) {
      alert("추천 질문은 최대 5개까지만 선택 가능합니다.");
      return;
    }

    setQuestionEdit(prev => {
      const newSelectedYn = isCurrentlySelected ? "N" : "Y";
      let newSeq = question.seq; 

      if (newSelectedYn === "Y") {
        const maxSeq = prev
          .filter(q => q.selectedYn === "Y")
          .reduce((max, q) => Math.max(max, q.seq ?? 0), 0);
        newSeq = maxSeq + 1;
      } else {
        newSeq = undefined; 
      }
        
      return prev.map(q => 
        q.id === question.id ? 
        { 
          ...q, 
          selectedYn: newSelectedYn,
          seq: newSeq
        } : 
          q
      );
    });
  };

  const handleSave = async () => {
    const currentlySelected = questionEdit
        .filter(q => q.selectedYn === "Y")
        .sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));
    const reorderedSelectedMap = new Map(
        currentlySelected.map((item, index) => [
            item.id, 
            { ...item, seq: index + 1 } 
        ])
    );
    const finalQuestions = questionEdit.map(item => {
      if (reorderedSelectedMap.has(item.id)) {
        return reorderedSelectedMap.get(item.id)!;
      }
      if (item.selectedYn === "N") {
        return { ...item, seq: undefined };
      }
      return item;
    });
    const newSetting = {
      ...setting,
      agentName,
      nameDesc,
      newchatLabel,
      chatTitle,
      chatSubtitle,
      placeholder,
      warningMsg,
      questions: finalQuestions,
    }
    setSaveSettingLoading(true);
    const response = await axiosInstance.put("/agent", newSetting);
    if (response.data.success) {
      setSetting(newSetting);
      setQuestionEdit(finalQuestions);
    } else {
      alert("저장 실패");
    }
    setSaveSettingLoading(false);
  }

  const handleAddQuestion = async () => {
    if (newQuestion.trim() === '') return;
    const maxId = questionEdit.length > 0 
    ? Math.max(...questionEdit.map(q => q.id)) 
    : 0;
    const newQuestionObj = {
      id: selectedQuestion?.id || maxId + 1,
      icon: selectedEmoji,
      question: newQuestion,
      selectedYn: selectedQuestion?.selectedYn || "N" as "Y" | "N",
      deleteYn: selectedQuestion?.deleteYn || "N" as "Y" | "N",
      createdAt: new Date(),
    };
    setAddQuestionLoading(true);
    let updatedQuestions;
    if (selectedQuestion) {
      updatedQuestions = questionEdit.map(q =>
        q.id === selectedQuestion.id ? newQuestionObj : q
      );
    } else {
      updatedQuestions = [...questionEdit, newQuestionObj];
    }
    const response = await axiosInstance.put("/agent", {
      ...setting,
      questions: updatedQuestions,
    });
    if (response.data.success) {
      setQuestionEdit(updatedQuestions);
    } else {
      alert("추가 실패");
    }
    setNewQuestion('');
    setSelectedEmoji('🏢');
    setOpenAddQuestion(false);
    setSelectedQuestion(null);
    setAddQuestionLoading(false);
  };

  const handleDeleteQuestion = async () => {
    if (!selectedQuestion) return;
    setDeleteQuestionLoading(true);
    const updatedQuestions = questionEdit.filter(q => q.id !== selectedQuestion.id);
    const response = await axiosInstance.put("/agent", {
      ...setting,
      questions: updatedQuestions,
    });
    if (response.data.success) {
      setQuestionEdit(updatedQuestions);
    } else {
      alert("삭제 실패");
    }
    setOpenDeleteConfirm(false);
    setDeleteQuestionLoading(false);
    setSelectedQuestion(null);
  }

  const handleSelectEmoji = (emoji: string) => {
    setSelectedEmoji(emoji);
    setAnchorEl(null);
  };

  useEffect(() => {
    setGetSettingLoading(true);
    axiosInstance.get("/agent").then((response) => {
      if (response.data.success) {
        setSetting(response.data.data);
        setQuestionEdit(response.data.data.questions);
        setAgentName(response.data.data.agentName);
        setNameDesc(response.data.data.nameDesc);
        setNewchatLabel(response.data.data.newchatLabel);
        setChatTitle(response.data.data.chatTitle);
        setChatSubtitle(response.data.data.chatSubtitle);
        setPlaceholder(response.data.data.placeholder);
        setWarningMsg(response.data.data.warningMsg);
      }
    }).finally(() => {
      setGetSettingLoading(false);
    })
  }, [])

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
      tmp.textContent = nameDesc || " ";
      document.body.appendChild(tmp);
      nameDescRef.current.style.width = `${tmp.offsetWidth + 4}px`;
      document.body.removeChild(tmp);
    }
  }, [nameDesc]);

  useEffect(() => {
    if (newchatLabelRef.current) {
      const tmp = document.createElement("span");
      tmp.style.font = getComputedStyle(newchatLabelRef.current).font;
      tmp.textContent = newchatLabel || " ";
      document.body.appendChild(tmp);
      newchatLabelRef.current.style.width = `${tmp.offsetWidth + 25}px`;
      document.body.removeChild(tmp);
    }
  }, [newchatLabel]);

  useEffect(() => {
    const textarea = subTitleRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [chatSubtitle]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (openAddQuestion || openDeleteConfirm || anchorEl) return;
      if (
        openQuestionSetting && 
        questionSettingRef.current && 
        !questionSettingRef.current.contains(target)
      ) {
        setOpenQuestionSetting(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openQuestionSetting, openAddQuestion, openDeleteConfirm, anchorEl]);
  
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] inline-flex">
      {/* w-[858px] */}
      <div className="flex items-center justify-between px-[40px] pt-[40px]">
        <div className="flex flex-col gap-[4px]">
          <h2 className="font-h2">에이전트 화면 설정</h2>
          <p className="font-s2 text-text-02">고객에게 노출될 AI 에이전트 초기화면을 설정해 보세요.</p>
        </div>
        <Button 
          className="w-[80px]" 
          disabled={
            JSON.stringify(setting?.questions) === JSON.stringify(questionEdit) && 
            agentName === setting?.agentName && 
            nameDesc === setting?.nameDesc && 
            newchatLabel === setting?.newchatLabel && 
            chatTitle === setting?.chatTitle && 
            chatSubtitle === setting?.chatSubtitle && 
            placeholder === setting?.placeholder && 
            warningMsg === setting?.warningMsg ||
            getSettingLoading}
          onClick={() => handleSave()}
        >{saveSettingLoading ? <Spinner /> : "저장"}</Button>
      </div>
      <HDivider className="!bg-line-02 my-[16px] !w-[calc(100%-80px)] mx-auto"/>
      <div className="overflow-y-auto flex-1 min-h-0 mx-[40px] pb-[40px] scrollbar-hover">
        <div className="w-[768px] flex flex-col rounded-[8px] border border-line-03">
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
                className="font-s2 text-text-03 focus:outline-none"
                value={nameDesc}
                onChange={(e) => setNameDesc(e.target.value)}
                style={{ width: `${nameDesc.length * 0.6}em` }}
                />
            </div>
            <div className="flex items-center gap-[12px]">
              <input 
                ref={newchatLabelRef}
                type="text" 
                className="font-s3-p text-text-02 px-[12px] py-[8px] border border-line-03 rounded-[4px] focus:outline-none" 
                value={newchatLabel}
                onChange={(e) => setNewchatLabel(e.target.value)}
                style={{ width: `${newchatLabel.length * 0.6}em` }}
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
                  value={chatSubtitle}
                  onChange={(e) => setChatSubtitle(e.target.value)}
                  />
              </div>
              <div className="flex flex-col gap-[20px]">
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={modifiers}>
                  <div 
                    ref={dragConstraintRef}
                    className="flex flex-col gap-[16px] p-[24px] rounded-[8px] border border-dashed border-line-03">
                    <SortableContext items={selectedQuestions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                      {selectedQuestions.map((question) => (<SortableQuestionItem key={question.id} question={question} />))}
                    </SortableContext>
                    <div className="flex items-center gap-[6px] cursor-pointer" onClick={() => setOpenQuestionSetting(true)}> 
                      <div className="flex items-center justify-center w-[32px] h-[64px] rounded-[4px] border border-line-02 bg-grayscale-005" style={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.05)' }}>
                        <span className="opacity-30"><DotGridIcon/></span>
                      </div>
                      <div className="flex-1 flex items-center gap-[12px] h-[64px] p-[12px] rounded-[4px] border border-line-02 bg-grayscale-005" style={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.05)' }}>
                        <span className="w-[40px] h-[40px] py-[5px] rounded-[4px] border border-line-02 bg-grayscale-005"></span>
                        <p className="font-s2 text-text-05">추천질문을 선택해 주세요.</p>
                      </div>
                    </div>
                  </div>
                </DndContext>
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
      </div>
      <div 
        ref={questionSettingRef}
        className={`w-[650px] fixed inset-y-0 top-[64px] right-0 z-[40] flex justify-end bg-white flex flex-col rounded-[8px] transition-transform duration-300 ease-in-out ${
          openQuestionSetting ? 'translate-x-0' : 'translate-x-full'
        }`} 
        style={{ boxShadow: '-16px 0 32px 0 rgba(0, 0, 0, 0.08)' }}>
        <div className="flex items-center justify-between px-[20px] py-[14px] h-[64px] border-b border-line-02">
          <div className="flex items-center gap-[12px]">
            <p className="font-h4">추천질문 설정</p>
            <VDivider colorClassName="bg-line-04"/>
            <p className="font-s2 text-text-03">고객에게 노출될 AI 에이전트 초기화면을 설정해 보세요.</p>
          </div>
          <button onClick={() => setOpenQuestionSetting(false)}><CloseIcon color="#1A1C20"/></button>
        </div>
        <div className="flex-1 flex flex-col gap-[20px] p-[32px] border-b border-line-02 overflow-y-auto">
          <div className="flex flex-col gap-[4px]">
            <p className="font-h4">추천질문 목록 {questionEdit.length}/50</p>
            <div className="flex items-center justify-between gap-[12px]">
              <p className="font-s4 text-text-02">추천질문을 작성하고 관리할 수 있습니다. 4개까지 설정이 가능합니다.</p>
              <button className="flex items-center gap-[4px]" 
                onClick={() => {
                  setOpenAddQuestion(!openAddQuestion); 
                  setAddQuestionLoading(false);
                  setSelectedQuestion(null);
                  setSelectedEmoji('🏢');
                  setNewQuestion('');
                }}>
                <span className="font-s3 text-primary">추천질문 추가하기</span>
                <PlusIcon color="var(--primary-050)"/>
              </button>
            </div>
            <HDivider className="!bg-line-02 mt-[8px]"/>
          </div>
          <div className="flex items-center gap-[20px]">
            <MenuDropdown
              options={[
                { value: "recent", label: "최근등록 순" },
                { value: "popular", label: "인기순" },
              ]}
              value={"recent"}
              onChange={() => {}}
              placeholder="최근등록 순"
              disabled={false}
              padding="minimum"
              width="w-[96px]"
              font="font-s3"
              borderStyle="none"
              optionPadding="4px 6px"
            />
            <Checkbox
              checked={isCheckedRecommends}
              onChange={() => setIsCheckedRecommends(!isCheckedRecommends)}
              label="선택된 질문만 보기"
              labelClassName="font-s3 text-text-04"
              className="!gap-[4px]"
              labelOrderLast={true}
            />
          </div>
          <div className="h-full flex flex-col gap-[16px] p-[24px] rounded-[8px] bg-surface-third overflow-y-auto scrollbar-hover">
            {(isCheckedRecommends
              ? questionEdit?.filter(q => q.selectedYn === "Y")
              : questionEdit
            ).map((question) => (
              <div 
                key={question.id} 
                className="flex items-center gap-[6px] relative"
                onMouseEnter={() => setHoveredQuestionId(question.id)}
                onMouseLeave={() => setHoveredQuestionId(null)}
                >
                <div className="w-[32px] h-[64px] flex items-center justify-center rounded-[4px] border border-line-02 bg-white" style={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.05)' }}>
                  <Checkbox
                    checked={question.selectedYn === "Y"}
                    onChange={() => handleQuestionSelect(question)}
                  />
                </div>
                <div 
                  className="flex-1 h-[64px] flex items-center gap-[12px] p-[12px] rounded-[4px] border border-line-02 bg-white" 
                  style={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.05)' }}
                  onClick={() => handleQuestionSelect(question)}>
                  <span 
                    className="w-[40px] h-[40px] font-h2 flex shrink-0 items-center justify-center rounded-[4px] border border-line-02 bg-grayscale-005">{question.icon}</span>
                  <p className="font-s2">{question.question}</p>
                </div>
                {hoveredQuestionId === question.id && (
                  <div className="flex items-center gap-[6px] absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white h-full px-[6px]">
                    <button 
                      onClick={() => {
                        setSelectedEmoji(question.icon); 
                        setNewQuestion(question.question); 
                        setSelectedQuestion(question);
                        setOpenAddQuestion(!openAddQuestion); 
                        setAddQuestionLoading(false)}}>
                      <EditIcon />
                    </button>
                    <VDivider colorClassName="bg-line-04"/>
                    <button 
                      onClick={() => {
                        setSelectedQuestion(question);
                        setOpenDeleteConfirm(true)}}>
                      <DeleteIcon color="#585C64"/>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Dialog open={openAddQuestion} onClose={() => setOpenAddQuestion(false)}>
        <div className="flex flex-col gap-[16px] py-[24px]">
          <div className="flex items-center justify-between pb-[12px] border-b border-line-02 px-[24px]">
            <p className="font-h3">추천질문 추가</p>
            <button onClick={() => setOpenAddQuestion(false)}><CloseIcon color="#1A1C20"/></button>
          </div>
          <div className="flex items-center gap-[12px] px-[24px]">
            <button
              onClick={(e) => setAnchorEl(e.currentTarget)}
              className="w-[40px] h-[40px] font-h2 flex shrink-0 items-center justify-center rounded-[4px] border border-line-02 bg-grayscale-005"
            >
              {selectedEmoji}
            </button>
            <input
              type="text"
              placeholder="질문 내용을 입력하세요"
              value={newQuestion}
              maxLength={100}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddQuestion();
                }
              }}
              className="w-[400px] font-s1 focus:outline-none border border-line-03 rounded-[4px] px-[12px] py-[7px]"
            />
            <Button 
              onClick={() => handleAddQuestion()}
              disabled={newQuestion.trim() === ''}
              className="w-[56px]"
            >
              {addQuestionLoading ? <Spinner /> : selectedQuestion ? "수정" : "추가"}
            </Button>
          </div>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            transitionDuration={150}
            PaperProps={{
              sx: {
                mt: 0.7,
                padding: "8px",
                width: "260px",
              },
            }}
            MenuListProps={{
              sx: {
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                padding: "8px",
                width: "260px",
              },
            }}
          >
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelectEmoji(emoji)}
                className="w-[40px] h-[40px] font-h2 flex shrink-0 items-center justify-center rounded-[4px] border border-line-02 bg-grayscale-005"
              >
                {emoji}
              </button>
            ))}
          </Menu>
        </div>
      </Dialog>
      <Dialog ref={deleteConfirmRef} open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
        <div className="flex flex-col gap-[20px] min-w-[340px]">
          <h3 className="font-h3 px-[20px] py-[12px] border-b border-line-03">추천 질문 삭제</h3>
          <p className="font-s1 px-[20px] whitespace-pre-line">{`${selectedQuestion?.question}\n질문을 정말 삭제하시겠습니까?`}</p>

          <div className="flex justify-end gap-[12px] px-[20px] py-[12px]">
            <Button variant="bggray" className="w-[60px]" onClick={() => {setOpenDeleteConfirm(false)}}>취소</Button>
            <Button className="w-[100px]" onClick={() => {handleDeleteQuestion();}}>{deleteQuestionLoading ? <Spinner /> : '삭제'}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
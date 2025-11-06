import { useEffect, useMemo, useRef, useState } from "react";
import { Button, type AIReportDebugInfo } from "@repo/common";

type Props = {
  open: boolean;
  onClose: () => void;
  aiReportDebugInfo: AIReportDebugInfo;
};

const groupBySeparator = (arr?: string[], sep = "\n") => {
  if (!arr || arr.length === 0) return [] as string[][];
  return arr.reduce<string[][]>((acc, cur) => {
    if (cur === sep) acc.push([]);
    else acc[acc.length - 1].push(cur);
    return acc;
  }, [[]]).filter(g => g.length > 0);
};

export const AIReportDebugInfoDialog = ({ open, onClose, aiReportDebugInfo }: Props) => {
  if (!aiReportDebugInfo || !open) return null;

  // -------- 그룹화 로직 (중복 제거) --------
  const { buildInfoList, remodelInfoList, rentInfoList, extraInfoList } = useMemo(() => {
    const dev = aiReportDebugInfo?.devDetailInfo;
    return {
      buildInfoList: groupBySeparator(dev?.debugBuildInfo),
      remodelInfoList: groupBySeparator(dev?.debugRemodelInfo),
      rentInfoList: groupBySeparator(dev?.debugRentInfo),
      extraInfoList: dev?.debugExtraInfo ?? [],
    };
  }, [aiReportDebugInfo]);

  // -------- 드래그 상태 --------
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x: 80, y: 80 });
  const [size, setSize] = useState({ w: 1200, h: 720 });
  const dragState = useRef<{ dragging: boolean; offsetX: number; offsetY: number }>({
    dragging: false,
    offsetX: 0,
    offsetY: 0,
  });

  // ESC로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 드래그 핸들러(헤더만)
  const onHeaderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    dragState.current.dragging = true;
    dragState.current.offsetX = startX - pos.x;
    dragState.current.offsetY = startY - pos.y;

    // 포인터 캡처
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragState.current.dragging) return;
    const nextX = e.clientX - dragState.current.offsetX;
    const nextY = e.clientY - dragState.current.offsetY;

    // 화면 밖 이동 방지(살짝 여유)
    const margin = 16;
    const maxX = window.innerWidth - margin;
    const maxY = window.innerHeight - margin;
    const clampedX = Math.min(Math.max(nextX, margin - size.w + 80), maxX);
    const clampedY = Math.min(Math.max(nextY, margin - size.h + 80), maxY);

    setPos({ x: clampedX, y: clampedY });
  };

  const onMouseUp = () => {
    dragState.current.dragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  // 리사이즈(우하단 핸들)
  const resizerRef = useRef<HTMLDivElement | null>(null);
  const resizeState = useRef<{ resizing: boolean; startX: number; startY: number; startW: number; startH: number }>({
    resizing: false,
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
  });

  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    resizeState.current = {
      resizing: true,
      startX: e.clientX,
      startY: e.clientY,
      startW: size.w,
      startH: size.h,
    };
    document.addEventListener("mousemove", onResizeMouseMove);
    document.addEventListener("mouseup", onResizeMouseUp);
  };

  const onResizeMouseMove = (e: MouseEvent) => {
    if (!resizeState.current.resizing) return;
    const deltaX = e.clientX - resizeState.current.startX;
    const deltaY = e.clientY - resizeState.current.startY;
    const nextW = Math.max(640, resizeState.current.startW + deltaX);
    const nextH = Math.max(480, resizeState.current.startH + deltaY);
    setSize({ w: nextW, h: nextH });
  };

  const onResizeMouseUp = () => {
    resizeState.current.resizing = false;
    document.removeEventListener("mousemove", onResizeMouseMove);
    document.removeEventListener("mouseup", onResizeMouseUp);
  };

  // 바깥 클릭으로 닫기 (옵션)
  const backdropOnClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 패널 내부 클릭은 무시
    if (panelRef.current && panelRef.current.contains(e.target as Node)) return;
    onClose();
  };

  return (
    <>
      {/* 반투명 백드롭 */}
      <div
        className="fixed inset-0 z-[1000] pointer-events-none"
        // onMouseDown={backdropOnClick}
      />

      {/* 플로팅 패널 */}
      <div
        ref={panelRef}
        className="fixed z-[1001] shadow-2xl rounded-2xl border border-gray-200 bg-white flex flex-col select-none"
        style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
        role="dialog"
        aria-modal="true"
      >
        {/* 헤더(드래그 핸들) */}
        <div
          className="cursor-move px-4 py-3 border-b border-gray-200 rounded-t-2xl bg-white/90 backdrop-blur sticky top-0"
          onMouseDown={onHeaderMouseDown}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-h3">사업계획서 확인(개발용)</p>
            {/* <div className="flex items-center gap-2">
              <Button  onClick={onClose}>닫기</Button>
            </div> */}
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="p-5 overflow-auto flex-1 space-y-4">
          <div className="flex-1">
            <div className="font-s2 space-y-1 bg-gray-100 p-4 rounded-lg">
              {extraInfoList.map((item, i) => (
                <p key={i}>{item}</p>
              ))}
            </div>
          </div>

          <div className="flex gap-4 min-h-0">
            {/* Build */}
            <section className="flex-1 border border-gray-200 rounded-lg p-2 min-h-[160px]">
              <div className="flex flex-col gap-2 font-s2">
                {buildInfoList.map((group, gi) => (
                  <div className="bg-surface-third p-4 rounded-lg border border-gray-200" key={`b-${gi}`}>
                    {group.map((line, li) => (
                      <p
                        key={li}
                        className={`${line.startsWith("<") ? "text-primary font-bold" : ""} ${li === 0 ? "font-h3" : ""}`}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </section>

            {/* Remodel */}
            <section className="flex-1 border border-gray-200 rounded-lg p-2 min-h-[160px]">
              <div className="flex flex-col gap-2 font-s2">
                {remodelInfoList.map((group, gi) => (
                  <div className="bg-surface-third p-4 rounded-lg border border-gray-200" key={`r-${gi}`}>
                    {group.map((line, li) => (
                      <p
                        key={li}
                        className={`${line.startsWith("<") ? "text-primary font-bold" : ""} ${li === 0 ? "font-h3" : ""}`}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </section>

            {/* Rent */}
            <section className="flex-1 border border-gray-200 rounded-lg p-2 min-h-[160px]">
              <div className="flex flex-col gap-2 font-s2">
                {rentInfoList.map((group, gi) => (
                  <div className="bg-surface-third p-4 rounded-lg border border-gray-200" key={`rent-${gi}`}>
                    {group.map((line, li) => (
                      <p
                        key={li}
                        className={`${line.startsWith("<") ? "text-primary font-bold" : ""} ${li === 0 ? "font-h3" : ""}`}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* 하단 버튼 (스크롤 고정) */}
        <div className="p-3 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-2xl">
          <Button className="w-full py-3" fontSize="font-h4" onClick={onClose}>
            닫기
          </Button>
        </div>

        {/* 우하단 리사이즈 핸들 */}
        <div
          ref={resizerRef}
          onMouseDown={onResizeMouseDown}
          className="absolute bottom-1 right-1 w-8 h-8 cursor-se-resize"
          // 시각적인 가이드(삼각형 모양)
          style={{
            background:
              "linear-gradient(135deg, transparent 0 50%, rgba(0,0,0,0.15) 50% 100%)",
            borderBottomRightRadius: "0.75rem",
          }}
          title="Resize"
        />
      </div>
    </>
  );
};

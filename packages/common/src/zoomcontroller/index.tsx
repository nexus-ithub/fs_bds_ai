import { useEffect, useMemo, useRef, useState } from "react";
import { MinusIcon, PlusIcon } from "../icons";

export function ZoomController({level=5, setLevel}: {level: number, setLevel: React.Dispatch<React.SetStateAction<number>>;}) {
  const minZoom = 1;
  const maxZoom = 14;

  const userFriendlyZoom = useMemo(() => maxZoom - level + minZoom, [level]);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const percent = useMemo(() => ((userFriendlyZoom - minZoom) / (maxZoom - minZoom)) * 100, [userFriendlyZoom]);

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
  const percentToValue = (p: number) => Math.round(minZoom + (p / 100) * (maxZoom - minZoom));

  const applyFromClientY = (clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    // bottom = 0%, top = 100%
    const yFromBottom = rect.bottom - clientY;
    const p = clamp((yFromBottom / rect.height) * 100, 0, 100);
    const newZoom = percentToValue(p);
    setLevel(maxZoom - newZoom + minZoom);
  };

  const handleZoomIn = () => {
    setLevel((prev) => Math.max(prev - 1, minZoom));
  };

  const handleZoomOut = () => {
    setLevel((prev) => Math.min(prev + 1, maxZoom));
  };

  const handlePointerDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    draggingRef.current = true;
    applyFromClientY(e.clientY);
  };

  const handlePointerMove = (e: MouseEvent) => {
    if (!draggingRef.current) return;
    applyFromClientY(e.clientY);
  };

  const handlePointerUp = () => {
    draggingRef.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, []);

  const tickCount = maxZoom - minZoom - 1;
  const ticks = useMemo(() => new Array(tickCount).fill(0), [tickCount]);

  return (
    <div className="flex flex-col rounded-[4px] border-[1px] border-line-03 bg-surface-floating divide-y divide-line-03">
      <button className="w-[48px] h-[48px] flex flex-col justify-center items-center p-[16px]" onClick={handleZoomIn}>
        <PlusIcon />
      </button>

      {/* Custom vertical slider */}
      <div className="relative w-[48px] h-[136px] p-[12px] select-none">
        <div
          ref={trackRef}
          className="relative mx-auto h-full w-[6px] rounded-full bg-[#E6E8EA]"
          onMouseDown={handlePointerDown}
          role="slider"
          aria-valuemin={minZoom}
          aria-valuemax={maxZoom}
          aria-valuenow={userFriendlyZoom}
          aria-orientation="vertical"
        >
          {/* Ticks */}
          <div className="absolute top-0 bottom-0 -left-[7px] w-[4px] pointer-events-none flex flex-col justify-between">
            <div className="h-[1px] w-[4px] bg-line-03" />
            {ticks.map((_, i) => (
              <div key={i} className="h-[1px] w-[4px] bg-line-03" />
            ))}
            <div className="h-[1px] w-[4px] bg-line-03" />
          </div>
          <div className="absolute top-0 bottom-0 -right-[7px] w-[4px] pointer-events-none flex flex-col justify-between">
            <div className="h-[1px] w-[4px] bg-line-03" />
            {ticks.map((_, i) => (
              <div key={i} className="h-[1px] w-[4px] bg-line-03" />
            ))}
            <div className="h-[1px] w-[4px] bg-line-03" />
          </div>

          {/* Blue filled progress */}
          <div
            className="absolute bottom-0 left-0 right-0 mx-auto w-[6px] rounded-b-full bg-primary-030"
            style={{ height: `${percent}%` }}
          />

          {/* Thumb */}
          <div
            className="absolute left-1/2 w-[24px] h-[5px] rounded-[2px] bg-white border shadow-[0_2px_4px_rgba(0,0,0,0.16)] border-primary-030 cursor-pointer"
            style={{ 
              bottom: `calc(${percent}% - 2.5px)`,
              transform: 'translateX(-50%)'
            }}
          />
        </div>
      </div>

      <button className="w-[48px] h-[48px] flex flex col justify-center items-center p-[16px]" onClick={handleZoomOut}>
        <MinusIcon />
      </button>
    </div>
  );
}
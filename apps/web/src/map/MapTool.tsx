import { CadastralIcon, CalcAreaIcon, CalcDistanceIcon, MapIcon, MyLocationIcon, SatelliteIcon, Spinner, StreetViewIcon, ZoomController, type LatLng } from "@repo/common";
import { saveMapState } from "../utils";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ChevronDown, Filter } from "lucide-react";

export type MapFilterType = 'deal' | 'volume' | 'commercial' | 'avg_rent' | 'celebrity' | null;

const MAP_FILTER_OPTIONS: { value: MapFilterType; label: string }[] = [
  { value: 'deal', label: '실거래' },
  { value: 'volume', label: '거래량' },
  { value: 'avg_rent', label: '평균임대료' },
  { value: 'commercial', label: '상권' },
  { value: 'celebrity', label: '유명인/고위공직자' },
];

export const MapFilter = ({
  selected,
  onChange,
}: {
  selected: MapFilterType;
  onChange: (value: MapFilterType) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = MAP_FILTER_OPTIONS.find((o) => o.value === selected)?.label;

  return (
    <>
      {/* Desktop: 왼쪽에 세로 목록 */}
      <div className="hidden md:flex fixed top-[84px] right-[80px] z-40 flex-col gap-[6px] border-[1px] border-line-03 rounded-[4px] bg-surface-floating p-[6px]">
        {MAP_FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(selected === option.value ? null : option.value)}
            className={`px-[12px] py-[6px] rounded-[4px] font-c3-p font-medum whitespace-nowrap border transition-colors
              ${selected === option.value
                ? 'bg-primary text-white border-primary'
                : 'bg-surface-floating text-gray-700 border-line-03 hover:bg-gray-50'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Mobile: 상단 드롭다운 */}
      <div ref={ref} className={`md:hidden fixed top-[144px] right-[14px] ${open ? 'z-50' : 'z-40'}`}>
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-[4px] px-[10px] py-[6px] bg-white rounded-[4px] border text-[12px] font-medium transition-colors
            ${selected
              ? 'border-primary text-primary'
              : 'border-line-03 text-gray-700'
            }`}
        >
          <Filter size={14} />
          <span>{selectedLabel ?? '필터'}</span>
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute top-full right-0 mt-[4px] flex flex-col gap-[4px] border-[1px] border-line-03 rounded-[4px] bg-surface-floating p-[4px] shadow-lg">
            {MAP_FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(selected === option.value ? null : option.value);
                  setOpen(false);
                }}
                className={`px-[12px] py-[6px] rounded-[4px] font-c2-p font-medium whitespace-nowrap border transition-colors text-left
                  ${selected === option.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-floating text-gray-700 border-line-03'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export const MapToolbar = ({
  mapType,
  center,
  level,
  changeMapType,
  setCenter,
  setLevel,
}: {
  mapType: 'normal' | 'skyview' | 'use_district' | 'roadview' | 'area' | 'distance';
  changeMapType: (type: 'normal' | 'skyview' | 'use_district' | 'roadview' | 'area' | 'distance') => void;
  level: number;
  setLevel: React.Dispatch<React.SetStateAction<number>>;
  center: LatLng;
  setCenter: React.Dispatch<React.SetStateAction<LatLng>>;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  const getCurrentLocation = () => {
    setIsLoading(true);

    if (!navigator.geolocation) {
      toast.error('브라우저가 위치 서비스를 지원하지 않습니다.');
      setIsLoading(false);
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setCenter({ lat: latitude, lng: longitude });
      setLevel(4);
      setIsLoading(false);
    };

    const onError = (
      error: GeolocationPositionError,
      isFallback = false
    ) => {
      console.error('위치 정보를 가져올 수 없습니다:', error);

      // fallback 시도 (권한 거부 제외)
      if (!isFallback && error.code !== error.PERMISSION_DENIED) {
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (fallbackError) => onError(fallbackError, true),
          {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 300000, // 5분 캐시
          }
        );
        return;
      }

      // 최종 실패 처리
      switch (error.code) {
        case error.PERMISSION_DENIED:
          toast.error('위치 정보 접근이 거부되었습니다.');
          break;
        case error.POSITION_UNAVAILABLE:
          toast.error('위치 정보를 사용할 수 없습니다.');
          break;
        case error.TIMEOUT:
          toast.error('위치 정보를 가져오는 데 시간이 초과되었습니다.');
          break;
        default:
          toast.error('위치 정보를 가져오지 못했습니다.');
      }

      setIsLoading(false);
    };

    // 1차 시도: 환경에 따라 분기
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      {
        enableHighAccuracy: isMobile,
        timeout: isMobile ? 8000 : 15000,
        maximumAge: isMobile ? 0 : 60000,
      }
    );
  };

  return (
    <>
      <div className="fixed md:top-[84px] top-[184px] right-[14px] md:right-[24px] z-40 font-c3 space-y-[14px]">
        <div className="flex flex-col [&>*:not(:last-child)]:mb-[8px] md:[&>*:not(:last-child)]:mb-0 md:rounded-[4px] md:border-[1px] md:border-line-03 md:bg-surface-floating md:divide-y md:divide-line-03">
          <button
            onClick={() => { changeMapType('normal'); }}
            className="w-[40px] h-[40px] md:w-[48px] md:h-[48px] flex flex-col justify-center items-center gap-[4px] rounded-[4px] border-[1px] border-line-03 bg-surface-floating md:!rounded-none md:!border-x-0 md:!border-b-0 md:first:!border-t-0 md:!bg-transparent">
            <MapIcon color={mapType === 'normal' ? 'var(--color-primary)' : 'var(--gray-060)'} />
            <p className={`hidden md:block ${mapType === 'normal' ? 'text-primary font-c3-p' : ''}`}>일반</p>
          </button>
          <button
            onClick={() => changeMapType('skyview')}
            className="w-[40px] h-[40px] md:w-[48px] md:h-[48px] flex flex-col justify-center items-center gap-[4px] rounded-[4px] border-[1px] border-line-03 bg-surface-floating md:!rounded-none md:!border-x-0 md:!border-b-0 md:first:!border-t-0 md:!bg-transparent">
            <SatelliteIcon color={mapType === 'skyview' ? 'var(--color-primary)' : 'var(--gray-060)'} />
            <p className={`hidden md:block ${mapType === 'skyview' ? 'text-primary font-c3-p' : ''}`}>위성</p>
          </button>
          <button
            onClick={() => changeMapType('use_district')}
            className="w-[40px] h-[40px] md:w-[48px] md:h-[48px] flex flex-col justify-center items-center gap-[4px] rounded-[4px] border-[1px] border-line-03 bg-surface-floating md:!rounded-none md:!border-x-0 md:!border-b-0 md:first:!border-t-0 md:!bg-transparent">
            <CadastralIcon color={mapType === 'use_district' ? 'var(--color-primary)' : 'var(--gray-060)'} />
            <p className={`hidden md:block ${mapType === 'use_district' ? 'text-primary font-c3-p' : ''}`}>지적도</p>
          </button>
          <button
            onClick={() => changeMapType('roadview')}
            className="w-[40px] h-[40px] md:w-[48px] md:h-[48px] flex flex-col justify-center items-center gap-[4px] rounded-[4px] border-[1px] border-line-03 bg-surface-floating md:!rounded-none md:!border-x-0 md:!border-b-0 md:first:!border-t-0 md:!bg-transparent">
            <StreetViewIcon color={mapType === 'roadview' ? 'var(--color-primary)' : 'var(--gray-060)'} />
            <p className={`hidden md:block ${mapType === 'roadview' ? 'text-primary font-c3-p' : ''}`}>거리뷰</p>
          </button>
        </div>
        <div className="hidden md:flex flex-col rounded-[4px] border-[1px] border-line-03 bg-surface-floating divide-y divide-line-03">
          <button
            onClick={() => changeMapType('area')}
            className="w-[48px] h-[48px] flex flex-col justify-center items-center gap-[4px]">
            <CalcAreaIcon color={mapType === 'area' ? 'var(--color-primary)' : 'var(--gray-060)'} />
            <p>면적</p>
          </button>
          <button
            onClick={() => changeMapType('distance')}
            className="w-[48px] h-[48px] flex flex-col justify-center items-center gap-[4px]">
            <CalcDistanceIcon color={mapType === 'distance' ? 'var(--color-primary)' : 'var(--gray-060)'} />
            <p>거리</p>
          </button>
        </div>
        <div className="flex flex-col md:rounded-[4px] md:border-[1px] md:border-line-03 md:bg-surface-floating">
          <button
            onClick={getCurrentLocation}
            className="w-[40px] h-[40px] md:w-[48px] md:h-[48px] flex flex-col justify-center items-center gap-[4px] rounded-[4px] border-[1px] border-line-03 bg-surface-floating md:!rounded-none md:!border-0 md:!bg-transparent">
            {isLoading ? (
              <Spinner />
            ) : (
              <MyLocationIcon />
            )}
            <p className="hidden md:block">내위치</p>
          </button>
        </div>
        <ZoomController level={level} setLevel={setLevel} />
      </div>
    </>
  )
}
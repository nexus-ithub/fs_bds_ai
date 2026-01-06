import { CadastralIcon, CalcAreaIcon, CalcDistanceIcon, MapIcon, MyLocationIcon, SatelliteIcon, Spinner, StreetViewIcon, ZoomController, type LatLng } from "@repo/common";
import { saveMapState } from "../utils";
import { useState } from "react";
import { toast } from "react-toastify";

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

  const getCurrentLocation = () => {
    setIsLoading(true);
    if (!navigator.geolocation) {
      toast.error('브라우저가 위치 서비스를 지원하지 않습니다.')
      setIsLoading(false);
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setCenter({ lat: latitude, lng: longitude });
      setLevel(4);
      setIsLoading(false);
    };

    const onError = (error: GeolocationPositionError, isFallback = false) => {
      console.error('위치 정보를 가져올 수 없습니다:', error);

      // 첫 번째 시도 실패 시 fallback (권한 거부는 제외)
      if (!isFallback && error.code !== error.PERMISSION_DENIED) {
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (err) => onError(err, true),
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000
          }
        );
        return;
      }

      // 최종 실패
      switch (error.code) {
        case error.PERMISSION_DENIED:
          toast.error('위치 정보 접근이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
          break;
        case error.POSITION_UNAVAILABLE:
          toast.error('위치 정보를 사용할 수 없습니다.');
          break;
        case error.TIMEOUT:
          toast.error('위치 정보 요청이 시간 초과되었습니다.');
          break;
        default:
          toast.error('알 수 없는 오류가 발생했습니다.');
          break;
      }
      setIsLoading(false);
    };

    // 첫 번째 시도: 고정밀도 모드 (모바일에서 빠름)
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 0
      }
    );
  };

  return (
    <>
      <div className="fixed md:top-[84px] top-[154px] right-[14px] md:right-[24px] z-40 font-c3 space-y-[14px]">
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
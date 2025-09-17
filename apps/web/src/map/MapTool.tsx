import { CadastralIcon, CalcAreaIcon, CalcDistanceIcon, MapIcon, MyLocationIcon, SatelliteIcon, Spinner, StreetViewIcon, ZoomController } from "@repo/common";
import { saveMapState } from "../utils";
import { useState } from "react";

export const MapToolbar = ({
  mapType,
  level,
  changeMapType,
  setLevel,
}: {
  mapType: 'normal' | 'skyview' | 'use_district' | 'roadview' | 'area' | 'distance';
  changeMapType: (type: 'normal' | 'skyview' | 'use_district' | 'roadview' | 'area' | 'distance') => void;
  level: number;
  setLevel: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentLocation = () => {
    setIsLoading(true);
    if (!navigator.geolocation) {
      // alert('브라우저가 위치 서비스를 지원하지 않습니다.');
      console.log('브라우저가 위치 서비스를 지원하지 않습니다.');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        saveMapState(latitude, longitude, 4);
        setLevel(4);
        setIsLoading(false);
      },
      (error) => {
        console.error('위치 정보를 가져올 수 없습니다:', error);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            // alert('위치 정보 접근이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
            console.log('위치 정보 접근이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
            break;
          case error.POSITION_UNAVAILABLE:
            // alert('위치 정보를 사용할 수 없습니다.');
            console.log('위치 정보를 사용할 수 없습니다.');
            break;
          case error.TIMEOUT:
            // alert('위치 정보 요청이 시간 초과되었습니다.');
            console.log('위치 정보 요청이 시간 초과되었습니다.');
            break;
          default:
            // alert('알 수 없는 오류가 발생했습니다.');
            console.log('알 수 없는 오류가 발생했습니다.');
            break;
        }
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };
  
  return (
    <>
      <div className="fixed top-[84px] right-[24px] z-40 font-c3 space-y-[14px]">
        <div className="flex flex-col rounded-[4px] border-[1px] border-line-03 bg-surface-floating divide-y divide-line-03">
          <button
            onClick={() => {changeMapType('normal'); }}
            className="w-[48px] h-[48px] flex flex-col justify-center items-center gap-[4px]">
            <MapIcon color={mapType === 'normal' ? 'var(--color-primary)' : 'var(--gray-060)'} />
            <p className={mapType === 'normal' ? 'text-primary font-c3-p' : ''}>일반</p>
          </button>
          <button
            onClick={() => changeMapType('skyview')}
            className="w-[48px] h-[48px] flex flex-col justify-center items-center gap-[4px]">
            <SatelliteIcon color={mapType === 'skyview' ? 'var(--color-primary)' : 'var(--gray-060)'} />
            <p className={mapType === 'skyview' ? 'text-primary font-c3-p' : ''}>위성</p>
          </button>
          <button
            onClick={() => changeMapType('use_district')}
            className="w-[48px] h-[48px] flex flex-col justify-center items-center gap-[4px]">
            <CadastralIcon color={mapType === 'use_district' ? 'var(--color-primary)' : 'var(--gray-060)'} />
            <p className={mapType === 'use_district' ? 'text-primary font-c3-p' : ''}>지적도</p>
          </button>      
          <button
            onClick={() => changeMapType('roadview')}
            className="w-[48px] h-[48px] flex flex-col justify-center items-center gap-[4px]">
            <StreetViewIcon color={mapType === 'roadview' ? 'var(--color-primary)' : 'var(--gray-060)'} />
            <p className={mapType === 'roadview' ? 'text-primary font-c3-p' : ''}>거리뷰</p>
          </button>                        
        </div>
        <div className="flex flex-col rounded-[4px] border-[1px] border-line-03 bg-surface-floating divide-y divide-line-03">
          <button 
            onClick={() => changeMapType('area')}
            className="w-[48px] h-[48px] flex flex-col justify-center items-center gap-[4px]">
            <CalcAreaIcon color={mapType === 'area' ? 'var(--color-primary)' : 'var(--gray-060)'}/>
            <p>면적</p>
          </button>
          <button 
            onClick={() => changeMapType('distance')}
            className="w-[48px] h-[48px] flex flex-col justify-center items-center gap-[4px]">
            <CalcDistanceIcon color={mapType === 'distance' ? 'var(--color-primary)' : 'var(--gray-060)'}/>
            <p>거리</p>
          </button>
        </div>    
        <div className="flex flex-col rounded-[4px] border-[1px] border-line-03 bg-surface-floating divide-y divide-line-03">
          <button 
            onClick={getCurrentLocation}
            className="w-[48px] h-[48px] flex flex-col justify-center items-center gap-[4px]">
            {isLoading ? (
              <Spinner />
            ) : (
              <MyLocationIcon />
            )}
            <p>내위치</p>
          </button>
        </div>      
        <div className="flex flex-col rounded-[4px] border-[1px] border-line-03 bg-surface-floating divide-y divide-line-03">
          <ZoomController level={level} setLevel={setLevel}/>
        </div>                              
      </div>
    </>
  )
}
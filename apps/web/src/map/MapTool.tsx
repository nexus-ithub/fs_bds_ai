import { CadastralIcon, CalcAreaIcon, CalcDistanceIcon, MapIcon, MyLocationIcon, SatelliteIcon, StreetViewIcon, ZoomController } from "@repo/common";

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
  return (
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
        <button className="w-[48px] h-[48px] flex flex-col justify-center items-center gap-[4px]">
          <MyLocationIcon />
          <p>내위치</p>
        </button>
      </div>      
      <div className="flex flex-col rounded-[4px] border-[1px] border-line-03 bg-surface-floating divide-y divide-line-03">
        <ZoomController level={level} setLevel={setLevel}/>
      </div>                              
    </div>
  )
}
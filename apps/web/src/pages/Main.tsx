
import useAxiosWithAuth from "../axiosWithAuth";
import { Map, Polygon, MapTypeId } from "react-kakao-maps-sdk";
import { CadastralIcon, CalcAreaIcon, CalcDistanceIcon, MapIcon, MyLocationIcon, SatelliteIcon, StreetViewIcon, type DistrictInfo, type LandInfo, type LandInfoResp, type PlaceList } from "@repo/common";
import { useRef, useState } from "react";
import { convertXYtoLatLng } from "../../utils";
import { LandInfoCard } from "../landInfo/LandInfo";
import { HomeBoard } from "../homeBoard/HomeBoard";
import { loadMapState, saveMapState } from "../utils";

export default function Main() {  
  const axiosInstance = useAxiosWithAuth();
  const [landInfo, setLandInfo] = useState<LandInfoResp | null>(null);
  const [businessDistrict, setBusinessDistrict] = useState<DistrictInfo[] | null>(null);
  const [place, setPlace] = useState<PlaceList | null>(null);
  const defaultMapState = loadMapState();
  const [mapType, setMapType] =
    useState<'normal' | 'skyview' | 'use_district'>('normal');
  const [mapTypeId, setMapTypeId] = useState<'ROADMAP' | 'SKYVIEW' | 'USE_DISTRICT'>('ROADMAP');
  const mapRef = useRef<any>(null);
  
  const changeMapType = (type: 'normal' | 'skyview' | 'use_district') => {
    setMapType(type);
    if(type === 'use_district') {
      setMapTypeId('ROADMAP');
    } else if(type === 'skyview') {
      setMapTypeId('SKYVIEW');
    } else {
      setMapTypeId('ROADMAP');
    }
  }

  const getLandInfo = (lat: number, lng: number) => {
    axiosInstance.get(`/api/land/info?lat=${lat}&lng=${lng}`)
      .then((response) => {
        // console.log(response.data);
        const landInfo = response.data as LandInfoResp;
        // console.log(landInfo);
        setLandInfo(landInfo);
      })
      .catch((error) => {
        console.error(error);
      });
  }
  
  const getBusinessDistrict = (lat: number, lng: number) => {
    axiosInstance.get(`/api/land/business-district?lat=${lat}&lng=${lng}`)
      .then((response) => {
        // console.log(response.data);
        const businessDistrict = response.data as DistrictInfo[];
        // console.log(businessDistrict);
        setBusinessDistrict(businessDistrict);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  const getPlace = (lat: number, lng: number) => {
    console.log('getPlace', lat, lng);
    axiosInstance.get(`/api/land/place?lat=${lat}&lng=${lng}`)
      .then((response) => {
        // console.log(response.data);
        const place = response.data as PlaceList;
        // console.log(place);
        setPlace(place);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  
  // console.log(landInfo?.polygon[0]);
  return (
    <div className="flex w-full h-full">
      <div className="w-[400px] h-full">
        {landInfo ? <LandInfoCard landInfo={landInfo} businessDistrict={businessDistrict} place={place} onClose={() => setLandInfo(null)} /> : <HomeBoard />}
      </div>
      <div className="flex-1 h-full">
        <Map
          ref={mapRef}
          mapTypeId={mapTypeId}
          onClick={(_, mouseEvent) => {
            // console.log(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());

            getLandInfo(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
            getBusinessDistrict(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
            getPlace(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
          }}
          center={{ lat: defaultMapState.centerLat, lng: defaultMapState.centerLng }}
          level={defaultMapState.level}
          onCenterChanged={(map) => {
            // console.log(map.getCenter().getLat(), map.getCenter().getLng());
            saveMapState(map.getCenter().getLat(), map.getCenter().getLng(), map.getLevel());
          }}
          // onDragEnd={(map) => {
          //   console.log(map.getCenter().getLat(), map.getCenter().getLng());
          // }}
          onZoomChanged={(map) => {
            // console.log(map.getLevel());
            saveMapState(map.getCenter().getLat(), map.getCenter().getLng(), map.getLevel());
          }}
          className="w-full h-full"
        >
          {mapType === 'use_district' && (
            <MapTypeId
              type="USE_DISTRICT"
            />
          )}
          {/* {mapType === 'skyview' && (
            <MapTypeId
              type="SKYVIEW"
            />
          )} */}
          {landInfo && (
            <Polygon
              fillColor="var(--color-primary)" // Red fill color
              fillOpacity={0.3} // 70% opacity
              strokeColor="var(--color-primary)" // Black border
              strokeOpacity={1}
              strokeWeight={1.5}
              path={convertXYtoLatLng(landInfo?.land?.polygon || [])} />
          )}
        </Map>
        <div className="fixed top-[84px] right-[24px] z-40 font-c3 space-y-[14px]">
          <div className="flex flex-col rounded-[4px] border-[1px] border-line-03 bg-surface-floating divide-y divide-line-03">
            <button
              onClick={() => changeMapType('normal')}
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
              className="w-[48px] h-[48px] flex flex-col justify-center items-center gap-[4px]">
              <StreetViewIcon />
              <p>거리뷰</p>
            </button>                        
          </div>
          <div className="flex flex-col rounded-[4px] border-[1px] border-line-03 bg-surface-floating divide-y divide-line-03">
            <button className="w-[48px] h-[48px] flex flex-col justify-center items-center gap-[4px]">
              <CalcAreaIcon />
              <p>면적</p>
            </button>
            <button className="w-[48px] h-[48px] flex flex-col justify-center items-center gap-[4px]">
              <CalcDistanceIcon />
              <p>거리</p>
            </button>
          </div>    
          <div className="flex flex-col rounded-[4px] border-[1px] border-line-03 bg-surface-floating divide-y divide-line-03">
            <button className="w-[48px] h-[48px] flex flex-col justify-center items-center gap-[4px]">
              <MyLocationIcon />
              <p>내위치</p>
            </button>
          </div>      
          {/* <div className="flex flex-col rounded-[4px] border-[1px] border-line-03 bg-surface-floating divide-y divide-line-03">
            <button className="w-[48px] h-[48px] flex flex-col justify-center items-center gap-[4px]">
              
            </button>
          </div>                               */}
        </div>
      </div>
    </div>
  );
}
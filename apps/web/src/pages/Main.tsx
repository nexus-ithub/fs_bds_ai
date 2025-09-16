
import useAxiosWithAuth from "../axiosWithAuth";
import { Map, Polygon, MapTypeId, Roadview, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import { CadastralIcon, CalcAreaIcon, CalcDistanceIcon, MapIcon, MyLocationIcon, SatelliteIcon, StreetViewIcon, type DistrictInfo, type LandInfo, type LandInfoResp, type PlaceList, type YoutubeVideo, type PlayerMode, YoutubeLogo, PlusIcon, MinusIcon } from "@repo/common";
import { useEffect, useState } from "react";
import { convertXYtoLatLng } from "../../utils";
import { LandInfoCard } from "../landInfo/LandInfo";
import { HomeBoard } from "../homeBoard/HomeBoard";
import { loadMapState, saveMapState } from "../utils";
import { PictureInPicture, PictureInPicture2, X } from "lucide-react";
import { ZoomController } from "@repo/common";

function MapWalkerIcon({ angle }: { angle: number }) {
  const threshold = 22.5; // 이미지가 변화되어야 되는(각도가 변해야되는) 임계 값
  let className = 'm0'; // 기본값
  
  for (let i = 0; i < 16; i++) { // 각도에 따라 변화되는 앵글 이미지의 수가 16개
    if (angle > (threshold * i) && angle < (threshold * (i + 1))) {
      // 각도(pan)에 따라 아이콘의 class명을 변경
      className = 'm' + i;
      break;
    }
  }
  
  return (
    <div className={`MapWalker ${className}`}>
      <div className="angleBack"></div>
      <div className="figure"></div>
    </div>
  );
}

export default function Main() {  
  const axiosInstance = useAxiosWithAuth();
  const [landInfo, setLandInfo] = useState<LandInfoResp | null>(null);
  const [businessDistrict, setBusinessDistrict] = useState<DistrictInfo[] | null>(null);
  const [place, setPlace] = useState<PlaceList | null>(null);
  const defaultMapState = loadMapState();
  const [mapType, setMapType] =
    useState<'normal' | 'skyview' | 'use_district' | 'roadview' | 'area' | 'distance'>('normal');
  const [mapTypeId, setMapTypeId] = useState<'ROADMAP' | 'SKYVIEW' | 'USE_DISTRICT'>('ROADMAP');
  // const mapRef = useRef<any>(null);
  
  const [roadViewCenter, setRoadViewCenter] = useState<{ lat: number, lng: number, pan: number } | null>(null);
  const [level, setLevel] = useState<number>(defaultMapState.level);
  const [mousePosition, setMousePosition] = useState<{ lat: number, lng: number }>({ lat: 0, lng: 0 });

  const [isDrawingArea, setIsDrawingArea] = useState<boolean>(false);
  const [showAreaOverlay, setShowAreaOverlay] = useState<boolean>(false);
  const [polygonArea, setPolygonArea] = useState<any>();
  const [areaPaths, setAreaPaths] = useState<any[]>([]);

  const [isDrawingDistance, setIsDrawingDistance] = useState<boolean>(false);
  const [distancePaths, setDistancePaths] = useState<any[]>([]);
  const [clickLine, setClickLine] = useState<any>();
  const [moveLine, setMoveLine] = useState<any>();
  const [distances, setDistances] = useState<any[]>([]);



  const changeMapType = (type: 'normal' | 'skyview' | 'use_district' | 'roadview' | 'area' | 'distance') => {
    setMapType(type);
    if(type === 'use_district') {
      setMapTypeId('ROADMAP');
    } else if(type === 'skyview') {
      setMapTypeId('SKYVIEW');
    } else {
      setMapTypeId('ROADMAP');
    }
    setShowAreaOverlay(false);
    setIsDrawingArea(false);
    setIsDrawingDistance(false);
    setAreaPaths([]);
    setDistancePaths([]);
    setClickLine(null);
    setMoveLine(null);
    setDistances([]);
  }

  const [selectedVideo, setSelectedVideo] = useState<YoutubeVideo | null>(null);
  const [openVideoMiniPlayer, setOpenVideoMiniPlayer] = useState<boolean>(false);
  const [playerMode, setPlayerMode] = useState<PlayerMode>(null);

  const getLandInfo = (lat: number, lng: number) => {
    axiosInstance.get(`/api/land/info?lat=${lat}&lng=${lng}`)
      .then((response) => {
        // console.log(response.data);.
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
        {landInfo ? 
          <LandInfoCard landInfo={landInfo} businessDistrict={businessDistrict} place={place} onClose={() => setLandInfo(null)} /> : 
          <HomeBoard 
            selectedVideo={selectedVideo}
            setSelectedVideo={(video) => {
              setSelectedVideo(video);
              setPlayerMode("large");
            }}
            openVideoMiniPlayer={openVideoMiniPlayer}
            setOpenVideoMiniPlayer={setOpenVideoMiniPlayer}
          />}
      </div>
      <div className="flex-1 h-full">
        <Map
          // ref={mapRef}
          mapTypeId={mapTypeId}
          onClick={(_, mouseEvent) => {
            // console.log(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
            if(mapType === 'roadview') {
              setRoadViewCenter({
                lat: mouseEvent.latLng.getLat(),
                lng: mouseEvent.latLng.getLng(),
                pan: 0,
              })
            } else if (mapType === 'area') {
              if (!isDrawingArea) { setAreaPaths([]); }
              setAreaPaths((prev) => [
                ...prev,
                {
                  lat: mouseEvent.latLng.getLat(),
                  lng: mouseEvent.latLng.getLng(),
                },
              ])
              setShowAreaOverlay(false);
              setIsDrawingArea(true);
            } else if (mapType === 'distance') {
              setIsDrawingDistance(true);
            } else {
              getLandInfo(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
              getBusinessDistrict(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
              getPlace(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
            }
          }}
          center={{ lat: defaultMapState.centerLat, lng: defaultMapState.centerLng }}
          level={level}
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
            setLevel(map.getLevel());
          }}
          onRightClick={() => {
            if(mapType === 'area') {
              setShowAreaOverlay(true);
              setIsDrawingArea(false);
            } else if (mapType === 'distance') {
              setIsDrawingDistance(false);
            }
          }}
          onMouseMove={(_, mouseEvent) => {
            setMousePosition({
              lat: mouseEvent.latLng.getLat(),
              lng: mouseEvent.latLng.getLng(),
            })
          }}
          className="w-full h-full"
        >
          {mapType === 'use_district' && (
            <MapTypeId
              type="USE_DISTRICT"
            />
          )}
          {mapType === 'roadview' && (
            <>
              <MapTypeId
                type="ROADVIEW"
              />            
              <MapMarker
                position={roadViewCenter || { lat: 0, lng: 0 }}
                draggable={true}
                onDragEnd={(marker) => {
                  setRoadViewCenter({
                    // @ts-ignore
                    lat: marker.getPosition().getLat(),
                    // @ts-ignore
                    lng: marker.getPosition().getLng(),
                    pan: 0,
                  })
                }}
                image={{
                  src: "https://t1.daumcdn.net/localimg/localimages/07/2018/pc/roadview_minimap_wk_2018.png",
                  size: { width: 26, height: 46 },
                  options: {
                    spriteSize: { width: 1666, height: 168 },
                    spriteOrigin: { x: 705, y: 114 },
                    offset: { x: 13, y: 46 },
                  },
                }}
              />            
            </>
 
          )}
          {landInfo && (
            <Polygon
              fillColor="var(--color-primary)" // Red fill color
              fillOpacity={0.3} // 70% opacity
              strokeColor="var(--color-primary)" // Black border
              strokeOpacity={1}
              strokeWeight={1.5}
              path={convertXYtoLatLng(landInfo?.land?.polygon || [])} />
          )}
          {isDrawingArea && (
            <Polygon
              path={isDrawingArea ? [...areaPaths, mousePosition] : areaPaths}
              strokeWeight={2}
              strokeColor={"var(--color-primary)"}
              strokeOpacity={1}
              strokeStyle={"solid"}
              fillColor={"var(--color-primary)"}
              fillOpacity={0.2}
              onCreate={setPolygonArea}
            />
          )}
          {!isDrawingArea && areaPaths.length > 2 && (
            <Polygon
              path={areaPaths}
              strokeWeight={2}
              strokeColor={"var(--color-primary)"}
              strokeOpacity={1}
              strokeStyle={"solid"}
              fillColor={"var(--color-primary)"}
              fillOpacity={0.2}
            />
          )}
          {showAreaOverlay && areaPaths.length > 2 && polygonArea && (
            <CustomOverlayMap position={areaPaths[areaPaths.length - 1]}>
              <div className="relative px-[8px] py-[4px] bg-white rounded-[4px] shadow-md border border-line-03 font-s2">
                {/* <button
                  onClick={() => {setShowAreaOverlay(false);}}
                  className="absolute -top-2 -right-2 bg-white rounded-full border border-gray-300 p-1"
                >
                  <X size={12} className="text-gray-500" />
                </button> */}
                총면적{" "}
                <span className="font-s2-p text-primary pl-[2px]"> {Math.round(polygonArea.getArea())}</span> m
                <sup>2</sup>
              </div>
            </CustomOverlayMap>
          )}
        </Map>
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
          <div className="flex flex-col rounded-[4px] border-[1px] border-line-03 bg-surface-floating divide-y divide-line-03">
            <ZoomController level={level} setLevel={setLevel}/>
          </div>                              
        </div>
        {roadViewCenter && (
          <div className="fixed top-0 left-[400px] w-[calc(100%-400px)] h-full z-40">
            <Roadview
              onViewpointChange={(viewpoint) => {
                console.log(viewpoint);
                setRoadViewCenter({
                  ...roadViewCenter,
                  pan: viewpoint.getViewpoint().pan,
                })
              }}
              onPositionChanged={(position) => {
                console.log(position);
                setRoadViewCenter({
                  ...roadViewCenter,
                  lat: position.getPosition().getLat(),
                  lng: position.getPosition().getLng(),
                })
              }}
              pan={roadViewCenter.pan}
              position={{ lat: roadViewCenter.lat, lng: roadViewCenter.lng, radius: 10 }}
              className="w-full h-full"
            />
            <Map
              onClick={(_, mouseEvent) => {
                setRoadViewCenter({
                  ...roadViewCenter,
                  lat: mouseEvent.latLng.getLat(),
                  lng: mouseEvent.latLng.getLng(),
                })
              }}
              center={{ lat: roadViewCenter.lat, lng: roadViewCenter.lng }}
              level={4}
              className="absolute bottom-[2px] left-[2px] w-[400px] h-[340px] z-40"
            >
              <MapTypeId
                type="ROADVIEW"
              />
              <CustomOverlayMap
                position={roadViewCenter || { lat: 0, lng: 0 }}
              >
                <MapWalkerIcon angle={roadViewCenter?.pan} />
              </CustomOverlayMap>
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

            <button 
              onClick={() => {
                setRoadViewCenter(null);
              }}
              className="absolute top-[8px] right-[8px] bg-white/80 p-[8px] rounded-[4px] z-40"
            >
              <X size={30} />
            </button>
          </div>
        )}
      </div>
      {openVideoMiniPlayer && (
        <div
          className={`fixed z-50 bg-white rounded-lg overflow-hidden shadow-lg transition-transform duration-300 border border-line-02
            ${playerMode === "large"
              ? "left-[30%] top-[17%] w-[80%] h-[605px] max-w-[960px] aspect-video scale-100"
              : "bottom-2 right-2 w-[480px] h-[320px]"}`
          }
        >
          <div className={`flex items-center justify-between py-[7px] border-b border-line-02 ${playerMode === "mini" ? "h-[44px]" : "h-[64px]"}`}>
            <div className="flex items-center gap-[13px] px-[12px] py-[14px]">
              <p className={playerMode === "mini" ? "font-h4" : "font-h3"}>빌딩의 신</p>
              <YoutubeLogo width={playerMode === "mini" ? 64 : 82} height={playerMode === "mini" ? 14 : 20}/>
            </div>
            <div className={`flex items-center gap-[13px] ${playerMode === "mini" ? "px-[12px]" : "px-[20px]"}`}>
              {playerMode === "mini" ? (
                <button onClick={() => setPlayerMode("large")}>
                  <PictureInPicture2 size={20}/>
                </button>
              ) : (
                <button onClick={() => setPlayerMode("mini")}>
                  <PictureInPicture size={20}/>
                </button>
              )}
              <button onClick={() => setOpenVideoMiniPlayer(false)}>
                <X size={20}/>
              </button>
            </div>
          </div>
          <div className={playerMode === "large" ? "w-[960px] h-[540px]" : "w-[488px] h-[275px]"}>
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo?.videoId}?autoplay=1`}
              allow="autoplay; clipboard-write; encrypted-media; gyroscope;"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
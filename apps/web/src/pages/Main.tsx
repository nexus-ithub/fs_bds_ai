
import useAxiosWithAuth from "../axiosWithAuth";
import { Map, Polygon, MapTypeId, MapMarker } from "react-kakao-maps-sdk";
import { type DistrictInfo, type LandInfo, type PlaceList, type YoutubeVideo, type PlayerMode, YoutubeLogo, type LatLng, type AreaPolygons, type DistanceLines, type PolygonInfo, type BuildingInfo, type EstimatedPrice } from "@repo/common";
import { useEffect, useState } from "react";
import { convertXYtoLatLng } from "../../utils";
import { LandInfoCard } from "../landInfo/LandInfo";
import { HomeBoard } from "../homeBoard/HomeBoard";
import { loadMapState, saveMapState } from "../utils";
import { PictureInPicture, PictureInPicture2, X } from "lucide-react";
import { AreaOverlay, DistanceOverlay, RoadViewOverlay } from "../map/MapLayers";
import { MapToolbar } from "../map/MapTool";

export default function Main() {  
  const axiosInstance = useAxiosWithAuth();
  const [polygon, setPolygon] = useState<PolygonInfo | null>(null);
  const [landInfo, setLandInfo] = useState<LandInfo | null>(null);
  const [buildingList, setBuildingList] = useState<BuildingInfo[] | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<EstimatedPrice | null>(null);
  const [businessDistrict, setBusinessDistrict] = useState<DistrictInfo[] | null>(null);
  const [place, setPlace] = useState<PlaceList | null>(null);
  const defaultMapState = loadMapState();
  const [mapType, setMapType] =
    useState<'normal' | 'skyview' | 'use_district' | 'roadview' | 'area' | 'distance'>('normal');
  const [mapTypeId, setMapTypeId] = useState<'ROADMAP' | 'SKYVIEW' | 'USE_DISTRICT'>('ROADMAP');
  // const mapRef = useRef<any>(null);
  
  const [roadViewCenter, setRoadViewCenter] = useState<{ lat: number, lng: number, pan: number } | null>(null);
  const [level, setLevel] = useState<number>(defaultMapState.level);
  const [mousePosition, setMousePosition] = useState<LatLng>({ lat: 0, lng: 0 });

  const [isDrawingArea, setIsDrawingArea] = useState<boolean>(false);
  const [areaPaths, setAreaPaths] = useState<LatLng[]>([]);
  const [areas, setAreas] = useState<AreaPolygons[]>([]);

  const [isDrawingDistance, setIsDrawingDistance] = useState<boolean>(false);
  const [showDistanceOverlay, setShowDistanceOverlay] = useState<boolean>(false);
  const [distancePaths, setDistancePaths] = useState<any[]>([]);
  const [clickLine, setClickLine] = useState<any>();
  const [moveLine, setMoveLine] = useState<any>();
  const [distances, setDistances] = useState<any[]>([]);
  const [distanceLines, setDistanceLines] = useState<DistanceLines[]>([]);

  const changeMapType = (type: 'normal' | 'skyview' | 'use_district' | 'roadview' | 'area' | 'distance') => {
    setMapType(type);
    if(type === 'use_district') {
      setMapTypeId('ROADMAP');
    } else if(type === 'skyview') {
      setMapTypeId('SKYVIEW');
    } else {
      setMapTypeId('ROADMAP');
    }
    setMousePosition({ lat: 0, lng: 0 });
  }

  const [selectedVideo, setSelectedVideo] = useState<YoutubeVideo | null>(null);
  const [openVideoMiniPlayer, setOpenVideoMiniPlayer] = useState<boolean>(false);
  const [playerMode, setPlayerMode] = useState<PlayerMode>(null);

  const getPolygon = (lat: number, lng: number) => {
    axiosInstance.get(`/api/land/polygon?lat=${lat}&lng=${lng}`)
      .then((response) => {
        // console.log(response.data);.
        const polygon = response.data as PolygonInfo;
        // console.log(polygon);
        setPolygon(polygon);

        getLandInfo(polygon.id);
        getBuildingList(polygon.legDongCode, polygon.jibun);
        getEstimatedPrice(polygon.id);
        getBusinessDistrict(lat, lng);
        getPlace(lat, lng);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  const getLandInfo = (id: string) => {
    axiosInstance.get(`/api/land/info?id=${id}`)
      .then((response) => {
        // console.log(response.data);.
        const landInfo = response.data as LandInfo;
        // console.log(landInfo);
        setLandInfo(landInfo);
      })
      .catch((error) => {
        console.error(error);
      });
  }
  
  const getBuildingList = (legDongCode: string, jibun: string) => {
    axiosInstance.get(`/api/land/building-list?legDongCode=${legDongCode}&jibun=${jibun}`)
      .then((response) => {
        // console.log(response.data);.
        const buildingList = response.data as BuildingInfo[];
        // console.log(buildingList);
        setBuildingList(buildingList);
      })
      .catch((error) => {
        console.error(error);
      });
  }
  
  const getEstimatedPrice = (id: string) => {
    axiosInstance.get(`/api/land/estimated-price?id=${id}`)
      .then((response) => {
        // console.log(response.data);
        const estimatedPrice = response.data as EstimatedPrice;
        // console.log(estimatedPrice);
        setEstimatedPrice(estimatedPrice);
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

  useEffect(() => {
    if (clickLine && moveLine) {
      const totalDistance = Math.round(
        clickLine.getLength() + moveLine.getLength()
      )
      setDistances((prev) => [...prev, totalDistance])
    }
  }, [distancePaths, clickLine, moveLine])

  useEffect(() => {
    // 현재 진행 중인 측정이 있는지 확인하고 초기화
    if (mapType !== 'distance') {
      // 거리 측정이 아닌 다른 모드로 전환 시, 거리 측정 상태 초기화
      setIsDrawingDistance(false);
      setDistancePaths([]);
      setDistances([]);
    }
    if (mapType !== 'area') {
      // 면적 측정이 아닌 다른 모드로 전환 시, 면적 측정 상태 초기화
      setIsDrawingArea(false);
      setAreaPaths([]);
    }
  }, [mapType]);

  // console.log(landInfo?.polygon[0]);
  return (
    <div className="flex w-full h-full">
      <div className="w-[400px] h-full border-r border-line-03">
        {landInfo ? 
          <LandInfoCard 
            landInfo={landInfo} 
            buildingList={buildingList}
            businessDistrict={businessDistrict} 
            place={place} 
            estimatedPrice={estimatedPrice}
            onClose={() => setLandInfo(null)} 
          /> : 
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
              setIsDrawingArea(true);
            } else if (mapType === 'distance') {
              if (!isDrawingDistance) { setDistances([]); setDistancePaths([]); }
              setDistancePaths((prev) => [
                ...prev,
                {
                  lat: mouseEvent.latLng.getLat(),
                  lng: mouseEvent.latLng.getLng(),
                },
              ])
              setIsDrawingDistance(true);
              setShowDistanceOverlay(true);
            } else {
              getPolygon(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
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
              setIsDrawingArea(false);
              setMapType('normal');
              setAreas((prev: AreaPolygons[]) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  paths: areaPaths,
                },
              ]);
            } else if (mapType === 'distance') {
              setDistancePaths([]);
              setDistances([]);
              setIsDrawingDistance(false);
              setMapType('normal');
              setDistanceLines(prev => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  paths: distancePaths,
                  distances,
                },
              ]);
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
          {polygon && (
            <Polygon
              fillColor="var(--color-primary)" // Red fill color
              fillOpacity={0.3} // 70% opacity
              strokeColor="var(--color-primary)" // Black border
              strokeOpacity={1}
              strokeWeight={1.5}
              path={convertXYtoLatLng(polygon?.polygon || [])} />
          )}
          <AreaOverlay
            isDrawingArea={isDrawingArea}
            areaPaths={areaPaths}
            mousePosition={mousePosition}
            areas={areas}
            setAreas={setAreas}
          />
          <DistanceOverlay
            isDrawingDistance={isDrawingDistance}
            distancePaths={distancePaths}
            mousePosition={mousePosition}
            showDistanceOverlay={showDistanceOverlay}
            distances={distances}
            distanceLines={distanceLines}
            setClickLine={setClickLine}
            setMoveLine={setMoveLine}
            setDistanceLines={setDistanceLines}
          />
        </Map>
        <MapToolbar
          mapType={mapType}
          changeMapType={changeMapType}
          level={level}
          setLevel={setLevel}
        />
        {roadViewCenter && (
          <RoadViewOverlay
            roadViewCenter={roadViewCenter}
            setRoadViewCenter={setRoadViewCenter}
            polygon={polygon}
          />
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
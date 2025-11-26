
import useAxiosWithAuth from "../axiosWithAuth";
import { Map, Polygon, MapTypeId, MapMarker } from "react-kakao-maps-sdk";
import { type DistrictInfo, type LandInfo, type PlaceList, type YoutubeVideo, type PlayerMode, YoutubeLogo, type LatLng, type AreaPolygons, type DistanceLines, type PolygonInfo, type BuildingInfo, type EstimatedPrice, Button, BuildingShopBITextSmall, AIShineLogo } from "@repo/common";
import { useEffect, useRef, useState } from "react";
import { convertXYtoLatLng } from "../../utils";
import { LandInfoCard } from "../landInfo/LandInfo";
import { HomeBoard } from "../homeBoard/HomeBoard";
import { loadMapState, saveMapState } from "../utils";
import { PictureInPicture, PictureInPicture2, X } from "lucide-react";
import { AreaOverlay, DistanceOverlay, RoadViewOverlay } from "../map/MapLayers";
import { MapToolbar } from "../map/MapTool";
import { SearchBar } from "../search/SearchBar";
import { AIReport } from "../aiReport/AIReport";
import { AIChat } from "../aiChat/AIChat";
import { toast } from "react-toastify";
import posthog from "posthog-js";

const MAX_FILTER_DIFF = 0.0065; // 720m 정도

export default function Main() {  
  const axiosInstance = useAxiosWithAuth();
  const [polygonList, setPolygonList] = useState<PolygonInfo[] | null>(null);
  const [filteredPolygonList, setFilteredPolygonList] = useState<PolygonInfo[] | null>(null);

  const [landInfo, setLandInfo] = useState<LandInfo | null>(null);
  const [buildingList, setBuildingList] = useState<BuildingInfo[] | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<EstimatedPrice | null>(null);
  const [businessDistrict, setBusinessDistrict] = useState<DistrictInfo[] | null>(null);
  const [place, setPlace] = useState<PlaceList | null>(null);
  const defaultMapState = loadMapState();
  const [mapType, setMapType] =
    useState<'normal' | 'skyview' | 'use_district' | 'roadview' | 'area' | 'distance'>('normal');
  const [mapTypeId, setMapTypeId] = useState<'ROADMAP' | 'SKYVIEW' | 'USE_DISTRICT'>('ROADMAP');
  const mapRef = useRef<any>(null);
  
  const [roadViewCenter, setRoadViewCenter] = useState<{ lat: number, lng: number, pan: number } | null>(null);
  const [level, setLevel] = useState<number>(defaultMapState.level);
  const [center, setCenter] = useState<LatLng>({ lat: defaultMapState.centerLat, lng: defaultMapState.centerLng });
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

  const [openAIReport, setOpenAIReport] = useState<boolean>(false);
  const [openAIChat, setOpenAIChat] = useState<boolean>(false);
  
  const [filter, setFilter] = useState({
    on: false,
    areaRange: [0, 10000],
    farRange: [0, 1000],
    buildingAgeRange: [0, 100],
    usageList: [],
  });

  const [filterCenter, setFilterCenter] = useState<LatLng>({ lat: 0, lng: 0 });
  const [showFilterSetting, setShowFilterSetting] = useState<boolean>(false);
  const [rangeLatDiff, setRangeLatDiff] = useState<number>(0);
  useEffect(() => {
    if(filter.on) {
        const bounds = mapRef.current?.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      const neLat = ne.getLat();
      const swLat = sw.getLat();
      
      console.log('neLat', neLat);
      console.log('swLat', swLat);
      console.log('diff ', neLat - swLat);

      const diff = neLat - swLat;
      setRangeLatDiff(diff);    
      console.log('diff ', diff);
      // console.log('filter', filter);
      // console.log('mapRef.current', mapRef.current?.getBounds().getNorthEast().getLat(), mapRef.current?.getBounds().getNorthEast().getLng());
      // console.log('mapRef.current', mapRef.current?.getBounds().getSouthWest().getLat(), mapRef.current?.getBounds().getSouthWest().getLng());
      if(diff > MAX_FILTER_DIFF) {
        setFilteredPolygonList([]);
        return;
      }

      getFilteredPolygon();
    }else{
      setFilteredPolygonList([]);
    }
  }, [filter, filterCenter, level]);

  const getFilteredPolygon = () => {
    const bounds = mapRef.current?.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    // const neLat = ne.getLat();
    // const swLat = sw.getLat();
    
    // console.log('neLat', neLat);
    // console.log('swLat', swLat);
    // console.log('diff ', neLat - swLat);
    

    axiosInstance.get(`/api/land/polygon-filtered`, {
      params: {
        neLat: ne.getLat(),
        neLng: ne.getLng(),
        swLat: sw.getLat(),
        swLng: sw.getLng(),
        startArea: filter.areaRange[0],
        endArea: filter.areaRange[1],
        startFar: filter.farRange[0],
        endFar: filter.farRange[1],
        startBdAge: filter.buildingAgeRange[0],
        endBdAge: filter.buildingAgeRange[1],
        usages: filter?.usageList?.join(',') || null,
      },
    })
      .then((response) => {
        // console.log(response.data);
        const polygon = response.data as PolygonInfo[];
        console.log('polygon', polygon);
        setFilteredPolygonList(polygon);
      })
      .catch((error) => {
        console.error(error);
        toast.error("필터링 중 오류가 발생했습니다.");
      });
     
  }

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


  const getMainPolygon = (polygon: PolygonInfo[]) => {
    return polygon.find((p) => p.current === 'Y') || polygon[0];
  }
  const getPolygon = ({id, lat, lng, changePosition = false}: {id?: string | null, lat?: number | null, lng?: number | null, changePosition?: boolean}) => {
    setOpenAIReport(false);

    // const url = id ? `/api/land/polygon?id=${id}` : `/api/land/polygon?lat=${lat}&lng=${lng}`;
    const url = id ? `/api/land/polygon-with-sub?id=${id}` : `/api/land/polygon-with-sub?lat=${lat}&lng=${lng}`;

    axiosInstance.get(url)
      .then((response) => {
        // console.log(response.data);.
        const polygon = response.data as PolygonInfo[];
        // console.log(polygon);
        setPolygonList(polygon);

        const mainPolygon = getMainPolygon(polygon);
        getLandInfo(mainPolygon.id);
        getBuildingList(mainPolygon.legDongCode, mainPolygon.jibun);
        getEstimatedPrice(mainPolygon.id);
        getBusinessDistrict(mainPolygon.lat, mainPolygon.lng);
        getPlace(mainPolygon.lat, mainPolygon.lng);
        console.log('changePosition', changePosition, mainPolygon.lat, mainPolygon.lng);
        if(changePosition){
          console.log('setCenter', mainPolygon.lat, mainPolygon.lng);
          setCenter({ lat: mainPolygon.lat, lng: mainPolygon.lng });

          // 지도 중심좌표가 제대로 이동 안되는 현상이 있어 몇번 더 시도 하는 코드 추가
          setTimeout(() => {
            console.log('setLevel', mainPolygon.lat, mainPolygon.lng);
            setCenter({ lat: mainPolygon.lat, lng: mainPolygon.lng });
            setCenter({ lat: mainPolygon.lat, lng: mainPolygon.lng });
          }, 100);
          setLevel(2);
          saveMapState(mainPolygon.lat, mainPolygon.lng, 2);
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error("지도 정보를 가져오는 중 오류가 발생했습니다.");
      });
  }

  
  const getLandInfo = (id: string) => {
    axiosInstance.get(`/api/land/info?id=${id}`)
      .then((response) => {
        // console.log(response.data);.
        const landInfo = response.data as LandInfo[];
        // console.log(landInfo);
        setLandInfo(landInfo[0]);
      })
      .catch((error) => {
        console.error(error);
        toast.error("지형 정보를 가져오는 중 오류가 발생했습니다.");
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
        toast.error("건물 정보를 가져오는 중 오류가 발생했습니다.");
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
        toast.error("추정 가격 정보를 가져오는 중 오류가 발생했습니다.");
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
        toast.error("지역 정보를 가져오는 중 오류가 발생했습니다.");
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
        toast.error("장소 정보를 가져오는 중 오류가 발생했습니다.");
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
            onClose={() => {
              setLandInfo(null)
              setOpenAIReport(false)
            }} 
            onOpenAIReport={() => {
              setOpenAIReport(true)
              console.log('landInfo', landInfo)
            }}
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
          ref={mapRef}
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
              getPolygon({lat: mouseEvent.latLng.getLat(), lng: mouseEvent.latLng.getLng()});
            }
          }}
          center={center}
          level={level}
          onCenterChanged={(map) => {
            // console.log(map.getCenter().getLat(), map.getCenter().getLng());
            saveMapState(map.getCenter().getLat(), map.getCenter().getLng(), map.getLevel());
          }}
          onDragEnd={(map) => {
            console.log('onDragEnd')
            console.log(map.getCenter().getLat(), map.getCenter().getLng());
            setFilterCenter({ lat: map.getCenter().getLat(), lng: map.getCenter().getLng() });
          }}
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
                  id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
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
                  id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
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
                    lat: marker.getPosition().getLat(),
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
          {polygonList && (
            polygonList.map((polygon) => (
              <Polygon
                key={polygon.id}
                fillColor="var(--color-primary)" 
                fillOpacity={polygon.current === 'Y' ? 0.4 : 0.2} // 70% opacity
                strokeColor="var(--color-primary)" 
                strokeOpacity={1}
                strokeWeight={1.5}
                path={convertXYtoLatLng(polygon?.polygon || [])} />
            ))
          )}
          {filteredPolygonList && (
            filteredPolygonList.map((polygon) => (
              <Polygon
                key={polygon.id}
                fillColor="var(--color-secondary)" 
                fillOpacity={0.3} // 70% opacity
                strokeColor="var(--color-secondary)" 
                strokeOpacity={1}
                strokeWeight={1.5}
                path={convertXYtoLatLng(polygon?.polygon || [])} />
            ))
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
          center={center}
          setCenter={setCenter}
        />
        <SearchBar 
          onShowFilterSetting={(on) => {
            console.log('onShowFilterSetting', on);
            setShowFilterSetting(on);
          }}
          onFilterChange={(on, areaRange, farRange, buildingAgeRange, usageList) => {
            console.log('onFilterChange', on, areaRange, farRange, buildingAgeRange, usageList);
            setFilter({
              on,
              areaRange,
              farRange,
              buildingAgeRange,
              usageList,
            });
          }}
          onSelect={(id) => {
            console.log('onSelect', id);
            getPolygon({id, changePosition: true});
          }}
        />
        {
          (filter.on && (rangeLatDiff > MAX_FILTER_DIFF)) && (
            <div className={`fixed z-30 ${showFilterSetting ? 'left-[840px]' : 'left-[425px]'} top-[145px] bg-white rounded-[4px] flex items-center justify-center px-[12px] py-[14px] gap-[10px] shadow-[6px_6px_12px_0_rgba(0,0,0,0.06)]`}>
              <p className="font-c2-p px-[6px] py-[2px] bg-primary text-white">
                TIP
              </p>
              <p className="font-s3 text-text-02">
                필터 결과를 보려면 지도를 더 확대 해주세요. 
              </p>
            </div>
          )
        }
        <Button
          onClick={() => {
            setOpenAIChat(true);
          }}
          className="fixed gap-[8px] z-30 left-[calc(400px+40%)] -translate-x-1/2 bottom-[16px] w-[480px] h-[50px] rounded-full flex items-center justify-center"
        >
          <BuildingShopBITextSmall />
          <p className="font-s1-p text-white">질의하기</p>
          {/* <AIShineLogo/> */}
        </Button>


        {roadViewCenter && (
          <RoadViewOverlay
            roadViewCenter={roadViewCenter}
            setRoadViewCenter={setRoadViewCenter}
            polygon={getMainPolygon(polygonList)}
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
      {
        openAIReport &&
          <AIReport 
            key={landInfo?.id}
            landId={landInfo?.id}
            onClose={() => setOpenAIReport(false)}/>
      }
      {openAIChat && (
        <AIChat
          open={openAIChat}
          onClose={() => setOpenAIChat(false)}
        />
      )}
    </div>
  );
}
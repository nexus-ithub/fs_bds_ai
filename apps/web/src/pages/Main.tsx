
import useAxiosWithAuth from "../axiosWithAuth";
import { Map, Polygon, MapTypeId, MapMarker, CustomOverlayMap, Polyline, MapInfoWindow } from "react-kakao-maps-sdk";
import {
  type AreaPolygons,
  type BuildingInfo,
  Button,
  type Coords,
  type DealAvgInfo,
  type DealInfo,
  type DistanceLines,
  type DistrictInfo,
  type EstimatedPriceInfo,
  krwUnit,
  type LandInfo,
  type LatLng,
  type PlaceList,
  type PlayerMode,
  type PolygonInfo,
  type PolygonInfoWithRepairInfo,
  type RefDealInfo,
  type RentInfo,
  Switch,
  type UsagePolygon,
  YoutubeLogo,
  type YoutubeVideo,
} from "@repo/common";
import { useEffect, useRef, useState } from "react";
import { convertXYtoLatLng } from "../../utils";
import { LandInfoCard } from "../landInfo/LandInfo";
import { HomeBoard } from "../homeBoard/HomeBoard";
import { checkIsAIReportNotAvailable, loadMapState, saveMapState } from "../utils";
import { InfoIcon, PictureInPicture, PictureInPicture2, X, ChevronLeft, ChevronRight, BotMessageSquare, CrownIcon } from "lucide-react";
import { AreaOverlay, DistanceOverlay, RoadViewOverlay } from "../map/MapLayers";
import { MapToolbar } from "../map/MapTool";
import { SearchBar } from "../search/SearchBar";
import { AIReport } from "../aiReport/AIReport";
import { AIChat } from "../aiChat/AIChat";
import { toast } from "react-toastify";
import posthog from "posthog-js";
import { IS_DEVELOPMENT } from "../constants";
import React, { useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { formatDate } from "date-fns";
import { pointOnFeature, booleanPointInPolygon, point } from "@turf/turf";
// import { GNB } from "../components/GNB";
import MainContext from "../contexts/MainContext";


const MAX_FILTER_DIFF = 0.0065; // 720m 정도

const MIN_LEVEL_SIGNUNGU = 6;
const MIN_LEVEL_EUPMYEONDONG = 4;

export default function Main() {
  const axiosInstance = useAxiosWithAuth();
  const [polygonList, setPolygonList] = useState<PolygonInfo[] | null>(null);
  const [filteredPolygonList, setFilteredPolygonList] = useState<PolygonInfo[] | null>(null);
  const [showRemodel, setShowRemodel] = useState<boolean>(false);
  const [showDeal, setShowDeal] = useState<boolean>(false);
  const [showUsage, setShowUsage] = useState<boolean>(false);
  const [showRent, setShowRent] = useState<boolean>(false);
  // const [aiReportResult, setAiReportResult] = useState<AIReportResult | null>(null);
  const [remodelPolygonList, setRemodelPolygonList] = useState<PolygonInfoWithRepairInfo[] | null>(null);
  const [usagePolygonList, setUsagePolygonList] = useState<UsagePolygon[] | null>(null);
  const [rentInfoList, setRentInfoList] = useState<RentInfo[] | null>(null);
  const [landInfo, setLandInfo] = useState<LandInfo | null>(null);
  const [aiReportNotAvailable, setAiReportNotAvailable] = useState<{ result: boolean, message: string }>({ result: true, message: '' });
  const [showRepairInfo, setShowRepairInfo] = useState<boolean>(false);
  const [buildingList, setBuildingList] = useState<BuildingInfo[] | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<EstimatedPriceInfo | null>(null);
  const [businessDistrict, setBusinessDistrict] = useState<DistrictInfo[] | null>(null);
  const [place, setPlace] = useState<PlaceList | null>(null);
  const [dealAvgList, setDealAvgList] = useState<DealAvgInfo[] | null>(null);
  const [dealList, setDealList] = useState<DealInfo[] | null>(null);
  const defaultMapState = loadMapState();
  const [mapType, setMapType] =
    useState<'normal' | 'skyview' | 'use_district' | 'roadview' | 'area' | 'distance'>('normal');
  const [mapTypeId, setMapTypeId] = useState<'ROADMAP' | 'SKYVIEW' | 'USE_DISTRICT'>('ROADMAP');
  const mapRef = useRef<any>(null);
  const clickTimerRef = useRef<number | null>(null);

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
  const [openLeftPanel, setOpenLeftPanel] = useState<boolean>(true);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<number>(0);

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

    if (filter.on) {
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
      if (diff > MAX_FILTER_DIFF) {
        setFilteredPolygonList([]);
        return;
      }

      getFilteredPolygon();
    } else {
      setFilteredPolygonList([]);
    }

    if (IS_DEVELOPMENT && showRemodel) {
      const bounds = mapRef.current?.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      const neLat = ne.getLat();
      const swLat = sw.getLat();

      const diff = neLat - swLat;
      setRangeLatDiff(diff);
      console.log('diff ', diff);
      if (diff > MAX_FILTER_DIFF * 3) {
        setRemodelPolygonList([]);
        toast.error('대수선 결과를 보려면 지도를 조금더 확대 하세요');
        return;
      }

      getRemodelPolygon();
    } else {
      setRemodelPolygonList([]);
    }

    if (IS_DEVELOPMENT && showUsage) {
      getUsagePolygon();
    } else {
      setUsagePolygonList([]);
    }

    // if (IS_DEVELOPMENT && showRent) {
    //   getRentInfo();
    // } else {
    //   setRentInfoList([]);
    // }

  }, [filter, filterCenter, level, showRemodel, showUsage, showRent]);


  useEffect(() => {
    getDealList();
    // getDealList();
  }, [center, level, mapRef?.current]);

  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.relayout();
    }, 500);
    return () => clearTimeout(timer);
  }, [openLeftPanel]);

  useEffect(() => {
    // Reset bottom sheet to collapsed state when landInfo changes
    setIsBottomSheetExpanded(false);
    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(0);
  }, [landInfo]);


  const getDealList = () => {
    const bounds = mapRef.current?.getBounds();
    if (!bounds) return;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    console.log('getDealAvg level', level);


    if (level < MIN_LEVEL_EUPMYEONDONG) {
      setDealAvgList([]);
      axiosInstance.get(`/api/deal`, {
        params: {
          neLat: ne.getLat(),
          neLng: ne.getLng(),
          swLat: sw.getLat(),
          swLng: sw.getLng()
        }
      }).then((response) => {
        setDealList(response.data);
      }).catch((error) => {
        console.error('Error finding deal list:', error);
      });
    } else {
      setDealList([]);
      const latMargin = (ne.getLat() - sw.getLat()) * 0.02;
      const lngMargin = (ne.getLng() - sw.getLng()) * 0.02;
      axiosInstance.get(`/api/deal/avg`, {
        params: {
          neLat: ne.getLat() - latMargin,
          neLng: ne.getLng() - lngMargin,
          swLat: sw.getLat() + latMargin,
          swLng: sw.getLng() + lngMargin,
          type: level >= MIN_LEVEL_SIGNUNGU ? 'sigungu' : 'eupmyeondong'
        }
      }).then((response) => {
        setDealAvgList(response.data);
      }).catch((error) => {
        console.error('Error finding deal avg:', error);
      });
    }

  }



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

  const getRemodelPolygon = () => {
    const bounds = mapRef.current?.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    axiosInstance.get(`/api/land/polygon-repaired`, {
      params: {
        neLat: ne.getLat(),
        neLng: ne.getLng(),
        swLat: sw.getLat(),
        swLng: sw.getLng(),
      },
    })
      .then((response) => {
        // console.log(response.data);
        const polygon = response.data as PolygonInfoWithRepairInfo[];
        console.log('polygon', polygon);
        setRemodelPolygonList(polygon);
      })
      .catch((error) => {
        console.error(error);
        toast.error("대수선 조회중 오류가 발생했습니다.");
      });

  }

  const getUsagePolygon = () => {
    const bounds = mapRef.current?.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    axiosInstance.get(`/api/land/polygon-usage`, {
      params: {
        neLat: ne.getLat(),
        neLng: ne.getLng(),
        swLat: sw.getLat(),
        swLng: sw.getLng(),
      },
    })
      .then((response) => {
        // console.log(response.data);
        const polygon = response.data as UsagePolygon[];
        console.log('polygon', polygon);
        setUsagePolygonList(polygon);
      })
      .catch((error) => {
        console.error(error);
        toast.error("용도지역 조회중 오류가 발생했습니다.");
      });

  }

  // const getRentInfo = () => {
  //   const bounds = mapRef.current?.getBounds();
  //   const ne = bounds.getNorthEast();
  //   const sw = bounds.getSouthWest();

  //   axiosInstance.get(`/api/land/rent-info`, {
  //     params: {
  //       neLat: ne.getLat(),
  //       neLng: ne.getLng(),
  //       swLat: sw.getLat(),
  //       swLng: sw.getLng(),
  //     },
  //   })
  //     .then((response) => {
  //       const result = response.data as RentInfo[];
  //       console.log('result', result);
  //       setRentInfoList(result);
  //     })
  //     .catch((error) => {
  //       console.error(error);
  //       toast.error("임대정보 조회 중 오류가 발생했습니다.");
  //     });

  // }

  const changeMapType = (type: 'normal' | 'skyview' | 'use_district' | 'roadview' | 'area' | 'distance') => {
    setMapType(type);
    if (type === 'use_district') {
      setMapTypeId('ROADMAP');
    } else if (type === 'skyview') {
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
    return polygon?.find((p) => p.current === 'Y') || polygon?.[0];
  }
  const getPolygon = ({ id, lat, lng, changePosition = false }: { id?: string | null, lat?: number | null, lng?: number | null, changePosition?: boolean }) => {

    setRentInfoList([]);
    setAiReportNotAvailable({ result: false, message: '' });
    setShowRepairInfo(false);
    setOpenAIReport(false);

    // const url = id ? `/api/land/polygon?id=${id}` : `/api/land/polygon?lat=${lat}&lng=${lng}`;
    const url = id ? `/api/land/polygon-with-sub?id=${id}` : `/api/land/polygon-with-sub?lat=${lat}&lng=${lng}`;

    axiosInstance.get(url)
      .then((response) => {
        // console.log(response.data);.
        const polygon = response.data as PolygonInfo[];
        if (polygon.length === 0) {
          // toast.warn("현재는 서울시에 한해 정보가 제공되는 점 양해 부탁드립니다.");
          alert("빌딩샵ai 는 현재 서울시를 대상으로한 분석을 제공해 드리고 있습니다. \n서비스이용에 참고해주시길바라며, 이점 양해 부탁드립니다")
          return;
        }
        // console.log(polygon);
        setPolygonList(polygon);

        const mainPolygon = getMainPolygon(polygon);
        getLandInfo(mainPolygon.id);
        getBuildingList(mainPolygon.legDongCode, mainPolygon.jibun);
        getEstimatedPrice(mainPolygon.id);
        getBusinessDistrict(mainPolygon.lat, mainPolygon.lng);
        getPlace(mainPolygon.lat, mainPolygon.lng);
        console.log('changePosition', changePosition, mainPolygon.lat, mainPolygon.lng);
        if (changePosition) {
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
        const result = response.data as LandInfo[];
        // console.log(landInfo);
        const landInfo = result[0];
        setLandInfo(landInfo);
        const aiReportNotAvailable = checkIsAIReportNotAvailable(landInfo);

        console.log(aiReportNotAvailable);
        setAiReportNotAvailable(aiReportNotAvailable);
        setShowRepairInfo(landInfo.lastRepairDivCode != null);
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
        const estimatedPrice = response.data as EstimatedPriceInfo;
        // console.log(estimatedPrice);
        setEstimatedPrice(estimatedPrice);
      })
      .catch((error) => {
        console.error(error);
        toast.error("추정가 정보를 가져오는 중 오류가 발생했습니다.");
      });

    // if (IS_DEVELOPMENT) {
    //   axiosInstance.get(`/api/land/estimated-price-v2?id=${id}`)
    //     .then((response) => {
    //       // console.log(response.data);
    //       const estimatedPriceV2 = response.data as EstimatedPriceV2;
    //       // console.log(estimatedPrice);
    //       setEstimatedPriceV2(estimatedPriceV2);
    //     })
    //     .catch((error) => {
    //       console.error(error);
    //       toast.error("추정가 정보를 가져오는 중 오류가 발생했습니다.");
    //     });
    // } else {
    //   setEstimatedPriceV2(null);
    // }

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

  const getUsageColor = (code: string) => {
    // pointOnFeature
    switch (code) {
      case 'UQA123':
        return "#FFEB3B";
      case 'UQA111':
        return "#B2EBF2";
      case 'UQA122':
        return "#E6EE9C";
      case 'UQA220':
        return "#E53935";
    }

    return "#FFECB3";
  }

  const getPolygonCenter = (polygon: Coords[] | Coords[][]) => {
    if (!polygon || polygon.length === 0) {
      return { lat: 0, lng: 0 };
    }

    const ring = Array.isArray(polygon[0]) ? (polygon[0] as Coords[]) : (polygon as Coords[]);

    const coordinates = ring
      .map((point) => [Number(point.x), Number(point.y)] as [number, number])
      .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

    if (coordinates.length < 3) {
      return { lat: 0, lng: 0 };
    }

    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coordinates.push(first);
    }

    const feature = {
      type: "Feature" as const,
      geometry: {
        type: "Polygon" as const,
        coordinates: [coordinates]
      },
      properties: {}
    };

    // 1단계: pointOnFeature로 중심점 계산
    const center = pointOnFeature(feature);
    let [lng, lat] = center.geometry.coordinates;

    // 2단계: 점이 polygon 내부에 있는지 확인
    let testPoint = point([lng, lat]);
    let isInside = booleanPointInPolygon(testPoint, feature);

    // 3단계: 내부에 없으면 polygon 안으로 이동 시도
    if (!isInside) {
      // 폴리곤의 모든 점들의 평균(centroid) 계산
      const validCoords = coordinates.slice(0, -1); // 마지막 점 제외 (첫 점과 중복)
      let sumX = 0;
      let sumY = 0;
      for (const [x, y] of validCoords) {
        sumX += x;
        sumY += y;
      }
      const centroidLng = sumX / validCoords.length;
      const centroidLat = sumY / validCoords.length;

      // 현재 점에서 centroid 방향으로 점진적으로 이동하면서 내부 점 찾기
      for (let ratio = 0.1; ratio <= 1.0; ratio += 0.2) {
        const newLng = lng + (centroidLng - lng) * ratio;
        const newLat = lat + (centroidLat - lat) * ratio;
        testPoint = point([newLng, newLat]);

        if (booleanPointInPolygon(testPoint, feature)) {
          lng = newLng;
          lat = newLat;
          isInside = true;
          break;
        }
      }

      // 여전히 내부에 없으면 centroid 자체를 사용
      if (!isInside) {
        testPoint = point([centroidLng, centroidLat]);
        if (booleanPointInPolygon(testPoint, feature)) {
          lng = centroidLng;
          lat = centroidLat;
          isInside = true;
          console.log('centroid2', lng, lat);
        }
      }

      // 그래도 내부에 없으면 처음 3개 점의 무게중심 사용 (삼각형 중심 - 거의 항상 내부)
      if (!isInside && coordinates.length >= 3) {
        const [x1, y1] = coordinates[0];
        const [x2, y2] = coordinates[1];
        const [x3, y3] = coordinates[2];
        lng = (x1 + x2 + x3) / 3;
        lat = (y1 + y2 + y3) / 3;
        console.log('centroid', lng, lat);
      }
    }

    return { lat, lng };

  }

  // console.log(landInfo?.polygon[0]);

  const polygonAdditionalInfo = (polygon: PolygonInfo, index: number) => {
    if (!landInfo) return;
    if (aiReportNotAvailable.result && index === 0) {
      return (
        <CustomOverlayMap
          yAnchor={1.1}
          position={getPolygonCenter(polygon?.polygon)}>
          <div className="relative p-[8px] text-sm flex flex-col bg-white text-primary/85 border border-line-03 rounded-[8px] shadow-[0_10px_14px_rgba(0,0,0,0.20)]">
            <div className="font-s3-p">{aiReportNotAvailable.message?.split('\n').map((line, index) => (
              <div key={index} className="flex items-center gap-[3px]">
                {index === 0 && <InfoIcon size={14} />}
                <p>
                  {line}
                </p>
              </div>
            ))}</div>
            <div className="absolute bottom-[-7px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-line-03"></div>
            <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
          </div>
        </CustomOverlayMap>
      )
    } else if (showRepairInfo && index === 0) {
      return (
        <CustomOverlayMap
          yAnchor={1.1}
          position={getPolygonCenter(polygon?.polygon)}>
          <div className="relative p-[8px] text-sm flex flex-col bg-white text-primary/85 border border-line-03 rounded-[8px] shadow-[0_10px_14px_rgba(0,0,0,0.20)]">
            <div className="font-s3-p flex flex-col">
              <p className="flex items-center gap-[3px]"><InfoIcon size={14} /> 해당 건물에 대수선 이력이 있습니다.</p>
              <p>AI 레포트의 사업성에 해당이력은 반영되지 않았음을 알려드립니다.</p>
              <p>보다 상세한 검토가 필요하시면 고객센터를 통해 별도 문의 바랍니다.</p>
            </div>
            <div className="absolute bottom-[-7px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-line-03"></div>
            <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
          </div>
        </CustomOverlayMap>
      )
    }
    return null;
  }

  const resetMainView = useCallback(() => {
    setLandInfo(null);
    setOpenAIReport(false);
    setOpenLeftPanel(true);
  }, []);

  const contextValue = useMemo(() => ({ resetMainView }), [resetMainView]);

  return (
    <MainContext.Provider value={contextValue}>
      <style>{`
        @keyframes dealAvgBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
      <div className="flex w-full h-full pb-0 md:pb-0">
        <div className={`hidden md:block flex h-full border-r border-line-03 transition-all duration-300 ease-in-out z-20 overflow-hidden ${openLeftPanel ? 'w-[400px]' : 'w-0 border-r-0'}`}>
          {/* <div className={`hidden md:block absolute left-0 top-0 h-full w-full md:w-[400px] bg-white border-r border-line-03 transition-transform duration-300 ease-in-out z-20 ${openLeftPanel ? 'translate-x-0' : '-translate-x-full'}`}> */}
          {landInfo ?
            <LandInfoCard
              landInfo={landInfo}
              buildingList={buildingList}
              businessDistrict={businessDistrict}
              estimatedPrice={estimatedPrice}
              place={place}
              onClose={() => {
                setLandInfo(null)
                setOpenAIReport(false)
                setPolygonList(null)
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
        <button
          onClick={() => setOpenLeftPanel(v => !v)}
          className="absolute top-1/2 -translate-y-1/2 z-20 text-text-03 bg-white border border-line-03 rounded-r-[8px] px-[1px] py-[10px] hidden md:block transition-all duration-300"
          style={{ left: openLeftPanel ? '400px' : '0px' }}>
          {openLeftPanel ? <ChevronLeft size={21} /> : <ChevronRight size={21} />}
        </button>
        {/* Mobile BottomSheet */}
        {landInfo && createPortal(
          <div
            onClick={() => {
              setIsBottomSheetExpanded(true);
            }}
            className={`md:hidden z-[60] fixed left-0 right-0 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.1)] ${isDragging ? '' : 'transition-all duration-300'
              } ${isBottomSheetExpanded ? 'rounded-none' : 'rounded-t-[20px]'}`}
            style={{
              top: isDragging
                ? `${Math.max(0, Math.min(window.innerHeight - 380, (isBottomSheetExpanded ? 0 : window.innerHeight - 380) + dragOffset))}px`
                : isBottomSheetExpanded
                  ? '0'
                  : 'auto',
              bottom: 0,
              height: isDragging || isBottomSheetExpanded ? 'auto' : '380px',
            }}
            onTouchStart={(e) => {
              setTouchStart(e.targetTouches[0].clientY);
              setIsDragging(true);
            }}
            onTouchMove={(e) => {
              if (!touchStart) return;
              // 브라우저 기본 pull-to-refresh 동작 방지
              e.preventDefault();
              const currentTouch = e.targetTouches[0].clientY;
              const offset = currentTouch - touchStart;
              setDragOffset(offset);
            }}
            onTouchEnd={() => {
              if (!touchStart) return;

              const threshold = 100; // 100px 이상 드래그 시 상태 변경

              // 아래로 드래그한 경우 (dragOffset > 0)
              if (dragOffset > threshold) {
                setIsBottomSheetExpanded(false);
              }
              // 위로 드래그한 경우 (dragOffset < 0)
              else if (dragOffset < -threshold) {
                setIsBottomSheetExpanded(true);
              }

              // 리셋
              setTouchStart(0);
              setDragOffset(0);
              setIsDragging(false);
            }}
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-[12px] pb-[4px]">
              <div className="w-[40px] h-[4px] bg-gray-300 rounded-full" />
            </div>
            <div
              className="overflow-y-auto h-full"
              style={{
                height: 'calc(100% - 24px)',
              }}
            >
              <LandInfoCard
                landInfo={landInfo}
                buildingList={buildingList}
                businessDistrict={businessDistrict}
                estimatedPrice={estimatedPrice}
                place={place}
                onClose={() => {
                  setLandInfo(null);
                  setOpenAIReport(false);
                  setIsBottomSheetExpanded(false);
                }}
                onOpenAIReport={() => {
                  setOpenAIReport(true);
                  console.log('landInfo', landInfo);
                }}
              />
            </div>
          </div>,
          document.body
        )}
        <div className={`h-full pb-[64px] md:pb-0 flex-1`}>
          <Map
            ref={mapRef}
            mapTypeId={mapTypeId}
            onCreate={(map) => {
              map.setCopyrightPosition(kakao.maps.CopyrightPosition.BOTTOMRIGHT, true);
            }}
            onClick={(_, mouseEvent) => {
              // 더블클릭 시 싱글클릭 이벤트 무시
              if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
                clickTimerRef.current = null;
                return;
              }

              clickTimerRef.current = window.setTimeout(() => {
                clickTimerRef.current = null;

                if (mapType === 'roadview') {
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
                  getPolygon({ lat: mouseEvent.latLng.getLat(), lng: mouseEvent.latLng.getLng() });
                }
              }, 250);
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
              setCenter({
                lat: map.getCenter().getLat(),
                lng: map.getCenter().getLng()
              })
            }}
            onZoomChanged={(map) => {
              // console.log(map.getLevel());
              saveMapState(map.getCenter().getLat(), map.getCenter().getLng(), map.getLevel());
              setLevel(map.getLevel());
            }}
            onRightClick={() => {
              if (mapType === 'area') {
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
            {dealAvgList && (
              dealAvgList.map((dealAvg, index) => (
                <React.Fragment key={dealAvg.id + index}>
                  <CustomOverlayMap
                    clickable={false}
                    yAnchor={1.1}
                    zIndex={index < 3 ? 10 : 1}
                    position={{ lat: dealAvg.lat, lng: dealAvg.lng }}>
                    <div
                      className="relative flex justify-center items-center p-[8px] text-[13px] flex flex-col bg-primary rounded-[8px] shadow-[0_10px_14px_rgba(0,0,0,0.20)] select-none pointer-events-none"
                      style={level >= MIN_LEVEL_EUPMYEONDONG && index < 3 ? { animation: 'dealAvgBounce 2.0s ease-in-out infinite' } : undefined}
                    >
                      {level >= MIN_LEVEL_SIGNUNGU && index < 3 && (
                        <div className="absolute flex items-center gap-[4px] -top-[12px] -right-[12px] bg-red-500 text-white text-[10px] font-bold px-[6px] py-[2px] rounded-full shadow-md whitespace-nowrap">
                          {index === 0 ? <CrownIcon size={14} color="yellow" /> : ''}서울 {index + 1}위
                        </div>
                      )}
                      {level < MIN_LEVEL_SIGNUNGU && level >= MIN_LEVEL_EUPMYEONDONG && index < 3 && (
                        <div className="absolute flex items-center gap-[4px] -top-[12px] -right-[12px] bg-red-500 text-white text-[10px] font-bold px-[6px] py-[2px] rounded-full shadow-md whitespace-nowrap">
                          {index === 0 ? <CrownIcon size={14} color="yellow" /> : ''}이 지역 {index + 1}위
                        </div>
                      )}
                      <span className={`flex items-center text-gray-200`}>{dealAvg.name}</span>
                      <span className={`text-[12px] flex items-center text-gray-200`}>{dealAvg.dealPrice ? krwUnit(dealAvg.dealPrice * 1000, true) : '-'}/평</span>
                    </div>
                  </CustomOverlayMap>
                </React.Fragment>
              ))
            )}
            {dealList && dealList.length > 0 && (
              dealList.map((deal, index) => (
                <React.Fragment key={deal.id + index}>
                  {/* <Polygon
                    fillColor="green"
                    fillOpacity={0.3}
                    strokeColor="green"
                    strokeOpacity={1}
                    strokeWeight={1.5}
                    path={convertXYtoLatLng(dealAvg.polygon || [])} /> */}
                  <CustomOverlayMap
                    clickable={true}
                    yAnchor={1.1}
                    position={{ lat: deal.lat, lng: deal.lng }}>
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        e.preventDefault();
                        // console.log('deal', deal)
                        getPolygon({ id: deal.id || '', changePosition: false });
                      }}
                      className="relative flex justify-center items-center p-[4px] text-[12px] flex flex-col bg-white border border-line-03 rounded-[8px] shadow-[0_10px_14px_rgba(0,0,0,0.20)] select-none">
                      <p className="flex items-center gap-[2px]">
                        <span className={`flex items-center ${deal.type === 'building' ? 'bg-blue-500' : 'bg-green-500'} text-white text-[10px] rounded-[4px] px-[4px] py-[2px]`}>{deal.type === 'building' ? '빌딩' : '토지'}</span>
                        <span className={`flex items-center font-bold ${deal.type === 'building' ? 'text-blue-500' : 'text-green-500'}`}>{deal.dealPrice ? krwUnit(deal.dealPrice * 10000, true) : '-'}</span></p>
                      <p>
                        <span className={`flex items-center text-[11px]`}>{deal.dealDate ? formatDate(deal.dealDate, 'yy년MM월') : '-'}</span></p>

                      {/* <span className={`text-[12px] flex items-center text-gray-200`}>{deal.dealPrice ? krwUnit(deal.dealPrice * 1000, true) : '-'}/평</span> */}
                      <div className="absolute bottom-[-7px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-line-03"></div>
                      <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
                    </button>
                  </CustomOverlayMap>
                </React.Fragment>
              ))
            )}
            {remodelPolygonList && (
              remodelPolygonList.map((polygon) => (
                <React.Fragment key={polygon.id}>
                  <Polygon
                    fillColor="green"
                    fillOpacity={0.3}
                    strokeColor="green"
                    strokeOpacity={1}
                    strokeWeight={1.5}
                    path={convertXYtoLatLng(polygon?.polygon || [])} />

                  <CustomOverlayMap
                    yAnchor={1.1}
                    position={{ lat: polygon.lat, lng: polygon.lng }}>
                    <div className="relative p-[8px] text-sm flex flex-col bg-white border border-line-03 rounded-[8px] shadow-[0_10px_14px_rgba(0,0,0,0.20)]">
                      <span className={`flex items-center font-bold text-green-900 `}>{polygon.repairChangeDivName}({polygon.repairChangeDivCode})</span>
                      <span className="flex items-center text-gray-500 text-[12px]">{polygon.repairCreateDate}</span>
                      <div className="absolute bottom-[-7px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-line-03"></div>
                      <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
                    </div>
                    {/* <div className="p-[8px] text-sm flex flex-col text-[red] font-bold">
                    <span>{polygon.repairChangeDivName}({polygon.repairChangeDivCode})</span>
                    <span>{polygon.repairCreateDate}</span>
                  </div> */}
                  </CustomOverlayMap>
                </React.Fragment>
              ))
            )}
            {usagePolygonList && (
              usagePolygonList.map((polygon) => (
                <React.Fragment key={polygon.id}>
                  <Polygon
                    // fillColor={polygon.usageCode === 'UQA123' ? 'green' : 'red'} 
                    fillColor={getUsageColor(polygon.usageCode)}
                    fillOpacity={0.3}
                    strokeColor="grey"
                    strokeOpacity={0.3}
                    strokeWeight={1.5}
                    path={convertXYtoLatLng(polygon?.polygon || [])} />

                  <CustomOverlayMap
                    position={getPolygonCenter(polygon?.polygon)}>
                    <div className="relative text-sm flex flex-col">
                      <span className={`flex items-center font-bold text-gray-500 `}>{polygon.usageName}</span>
                    </div>
                  </CustomOverlayMap>
                </React.Fragment>
              ))
            )}
            {IS_DEVELOPMENT && showRent && (
              rentInfoList?.map((rentInfo) => (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(rentInfo);
                    window.open(`https://fin.land.naver.com/articles/${rentInfo.atclNo}`, '_blank');
                  }}
                  key={rentInfo.atclNo}>
                  <CustomOverlayMap
                    clickable={true}
                    yAnchor={1.1}
                    position={{ lat: rentInfo.lat, lng: rentInfo.lng }}>
                    <div className="relative p-[8px] text-sm flex flex-col bg-white border border-line-03 rounded-[8px] shadow-[0_10px_14px_rgba(0,0,0,0.20)]">
                      <span className={`flex items-center font-bold ${rentInfo.floorType === '3' ? 'text-red-900' : rentInfo.floorType === '2' ? 'text-blue-700' : 'text-black'}`}>{rentInfo.floorInfo} {rentInfo.roadContact}</span>
                      <span className="flex items-center text-gray-500 text-[12px]">{krwUnit(Number(((rentInfo.rentPrice * 10000) / (Number(rentInfo.exclArea) * 0.3025)).toFixed(0)))}/평</span>
                      <div className="absolute bottom-[-7px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-line-03"></div>
                      <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
                    </div>
                  </CustomOverlayMap>

                </div>
              ))
            )}
            {
              IS_DEVELOPMENT && estimatedPrice && showDeal && (
                estimatedPrice.refDealList?.map((deal: RefDealInfo, index) => (
                  <CustomOverlayMap
                    key={deal.id + index}
                    position={{
                      lat: deal.position.y,
                      lng: deal.position.x
                    }}
                    yAnchor={1.1}
                    xAnchor={0.5}
                  >
                    <div className="relative p-[8px] text-sm flex flex-col bg-white border border-line-03 rounded-[8px] shadow-[0_10px_14px_rgba(0,0,0,0.20)]">
                      <span className={`flex items-center font-bold ${deal.dealType === 'building' ? 'text-blue-600' : 'text-green-600'}`}>{krwUnit(deal.dealPrice, true)}  {deal.dealType === 'building' ? '빌딩' : '토지'}</span>
                      <span className="flex items-center text-gray-500 text-[12px]">{formatDate(new Date(deal.dealDate), "yy.MM")} {deal.usageName?.replace('지역', '')}</span>
                      <div className="absolute bottom-[-7px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-line-03"></div>
                      <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
                    </div>
                  </CustomOverlayMap>
                ))
              )
            }
            {polygonList && (
              polygonList.map((polygon, index) => (

                <React.Fragment key={polygon.id}>
                  <Polygon
                    key={polygon.id}
                    fillColor="var(--color-primary)"
                    fillOpacity={polygon.current === 'Y' ? 0.4 : 0.2} // 70% opacity
                    strokeColor="var(--color-primary)"
                    strokeOpacity={1}
                    strokeWeight={1.5}
                    path={convertXYtoLatLng(polygon?.polygon || [])} />
                  {polygonAdditionalInfo(polygon, index)}


                </React.Fragment>

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
          {roadViewCenter && (
            <RoadViewOverlay
              roadViewCenter={roadViewCenter}
              setRoadViewCenter={setRoadViewCenter}
              polygon={getMainPolygon(polygonList)}
            />
          )}
        </div>

        <div className={`absolute w-[calc(100%-28px)] md:w-[582px] left-[14px] top-[20px] z-40 ${openLeftPanel ? 'md:left-[434px]' : 'md:left-[30px]'}`}>
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
              getPolygon({ id, changePosition: true });
            }}
          />
        </div>
        {
          (filter.on && (rangeLatDiff > MAX_FILTER_DIFF)) && (
            // <div className={`bg-primary text-white outline outline-1 outline-primary absolute z-30 left-[16px] md:left-[424px] ${showFilterSetting ? 'md:left-[844px]' : ''} md:top-[145px] top-[192px] rounded-[4px] flex items-center justify-center md:px-[12px] md:py-[14px] px-[8px] py-[10px] gap-[10px] shadow-[6px_6px_12px_0_rgba(0,0,0,0.06)]`}>
            <div
              style={{ ['--panel-offset' as string]: openLeftPanel ? '400px' : '0px' }}
              className="bg-red-400 text-white outline outline-1 outline-red-400 absolute z-30 left-1/2 -translate-x-1/2 md:left-[calc((100%-var(--panel-offset))/2+var(--panel-offset))] top-[192px] md:top-[145px] rounded-[4px] flex items-center justify-center md:px-[12px] md:py-[14px] px-[8px] py-[10px] gap-[6px] shadow-[6px_6px_12px_0_rgba(0,0,0,0.06)]">
              {/* <p className="font-c2-p px-[6px] py-[2px] bg-primary text-gray-100 border">
                TIP
              </p>
               */}
              <p className="font-c2-p px-[6px] py-[2px] text-gray-100 border">
                TIP
              </p>
              <p className="font-s3 text-gray-100 whitespace-nowrap">
                필터 결과를 보려면 지도를 더 확대 해주세요.
              </p>
            </div>
          )
        }

        <div className={`fixed z-30 left-[16px] ${openLeftPanel ? 'md:left-[434px]' : 'md:left-[30px]'} bottom-[80px] md:bottom-[22px] flex flex-col gap-[12px]`}>
          {
            IS_DEVELOPMENT && (
              <div className="flex flex-col gap-[4px] min-w-[250px]">
                <div className="flex gap-[4px]">
                  {/* <div className="w-[120px] justify-between flex items-center gap-[8px] px-[16px] py-[10px] rounded-[8px] bg-white border border-[blue] shadow-[6px_6px_12px_0_rgba(0,0,0,0.06)]">
                    <p className="font-s2-p">용도</p>
                    <Switch
                      checked={showUsage}
                      onChange={() => {setShowUsage(!showUsage)}}
                      isLabel={true}
                    />
                  </div> */}
                  <div className="w-[120px] justify-between flex items-center gap-[8px] px-[16px] py-[10px] rounded-[8px] bg-white border border-[#446444] shadow-[6px_6px_12px_0_rgba(0,0,0,0.06)]">
                    <p className="font-s2-p">임대</p>
                    <Switch
                      checked={showRent}
                      onChange={() => { setShowRent(!showRent) }}
                      isLabel={true}
                    />
                  </div>
                </div>
                <div className="flex gap-[4px]">
                  <div className="flex items-center gap-[8px] px-[16px] py-[10px] rounded-[8px] bg-white border border-[blue] shadow-[6px_6px_12px_0_rgba(0,0,0,0.06)]">
                    <p className="font-s2-p">실거래</p>
                    <Switch
                      checked={showDeal}
                      onChange={() => { setShowDeal(!showDeal) }}
                      isLabel={true}
                    />
                  </div>
                  <div className="flex items-center gap-[8px] px-[16px] py-[10px] rounded-[8px] bg-white border border-[green] shadow-[6px_6px_12px_0_rgba(0,0,0,0.06)]">
                    <p className="font-s2-p">대수선</p>
                    <Switch
                      checked={showRemodel}
                      onChange={() => { setShowRemodel(!showRemodel) }}
                      isLabel={true}
                    />
                  </div>
                </div>
              </div>
            )
          }
          {/* <Button
            onClick={() => {
              setOpenAIChat(true);
            }}
            className="w-[320px] h-[50px] rounded-full flex items-center justify-center gap-[8px]"
          >
            <BuildingShopBITextSmall />
            <p className="font-s1-p text-white">질의하기</p>
          </Button> */}
          <Button
            onClick={() => {
              setOpenAIChat(true);
            }}
            className="w-[46px] h-[46px] md:w-[60px] md:h-[60px] rounded-full flex items-center justify-center gap-[8px]"
          >
            <BotMessageSquare className="w-[22px] h-[22px] md:w-[32px] md:h-[32px]" />
          </Button>
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
                <YoutubeLogo width={playerMode === "mini" ? 64 : 82} height={playerMode === "mini" ? 14 : 20} />
              </div>
              <div className={`flex items-center gap-[13px] ${playerMode === "mini" ? "px-[12px]" : "px-[20px]"}`}>
                {playerMode === "mini" ? (
                  <button onClick={() => setPlayerMode("large")}>
                    <PictureInPicture2 size={20} />
                  </button>
                ) : (
                  <button onClick={() => setPlayerMode("mini")}>
                    <PictureInPicture size={20} />
                  </button>
                )}
                <button onClick={() => setOpenVideoMiniPlayer(false)}>
                  <X size={20} />
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
          createPortal(
            <AIReport
              key={landInfo?.id}
              landId={landInfo?.id}
              onReportCreated={(reportResult) => {
                setRentInfoList(reportResult.aroundRentInfo);
              }}
              onClose={() => {
                setOpenAIReport(false);
                setRentInfoList([]);
              }}
            />,
            document.body
          )}
        {openAIChat && (
          <AIChat
            open={openAIChat}
            onClose={() => setOpenAIChat(false)}
          />
        )}
        {/* <GNB onHomeClick={() => {
        setLandInfo(null);
        setOpenAIReport(false);
        setOpenLeftPanel(true);
      }} /> */}
      </div>
    </MainContext.Provider >
  );
}
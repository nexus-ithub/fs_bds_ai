
import useAxiosWithAuth from "../axiosWithAuth";
import { Map, Polygon, MapTypeId, MapMarker, CustomOverlayMap, Polyline, MapInfoWindow, MarkerClusterer } from "react-kakao-maps-sdk";
import { type DistrictInfo, type LandInfo, type PlaceList, type YoutubeVideo, type PlayerMode, YoutubeLogo, type LatLng, type AreaPolygons, type DistanceLines, type PolygonInfo, type BuildingInfo, Button, type EstimatedPriceInfo, Switch, type PolygonInfoWithRepairInfo, type RefDealInfo, krwUnit, type UsagePolygon, type Coords, type RentInfo } from "@repo/common";
import { useEffect, useRef, useState } from "react";
import { convertXYtoLatLng } from "../../utils";
import { LandInfoCard } from "../landInfo/LandInfo";
import { HomeBoard } from "../homeBoard/HomeBoard";
import { checkIsAIReportNotAvailable, loadMapState, saveMapState } from "../utils";
import { InfoIcon, PictureInPicture, PictureInPicture2, X, ChevronLeft, ChevronRight, BotMessageSquare } from "lucide-react";
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
  const [openLeftPanel, setOpenLeftPanel] = useState<boolean>(true);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<number>(0);

  // 정치인
  const [showPolitician, setShowPolitician] = useState<boolean>(false);
  const [clickedPolitician, setClickedPolitician] = useState<string | null>(null);
  const [politicianList, setPoliticianList] = useState<any[] | null>(null);
  // 정치인

  // 연예인
  const [showCelebrity, setShowCelebrity] = useState<boolean>(false);
  const [clickedCelebrityDong, setClickedCelebrityDong] = useState<string | null>(null);
  const [celebrityPolygonList, setCelebrityPolygonList] = useState<any[] | null>(null);
  // 연예인

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

    // 정치인
    if (IS_DEVELOPMENT && showPolitician) {
      getPoliticianList();
    } else {
      setPoliticianList([]);
    }
    // 정치인

    // 연예인
    if (IS_DEVELOPMENT && showCelebrity) {
      getCelebrityPolygonList();
    } else {
      setCelebrityPolygonList([]);
    }
    // 연예인

  }, [filter, filterCenter, level, showRemodel, showUsage, showRent, showPolitician, showCelebrity]);

  useEffect(() => {
    // Reset bottom sheet to collapsed state when landInfo changes
    setIsBottomSheetExpanded(false);
    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(0);
  }, [landInfo]);

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

  // 정치인
  const getPoliticianList = () => {
    const bounds = mapRef.current?.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    axiosInstance.get(`/api/politician/list`, {
      params: {
        neLat: ne.getLat(),
        neLng: ne.getLng(),
        swLat: sw.getLat(),
        swLng: sw.getLng(),
        level: level,
      },
    })
      .then((response) => {
        console.log('Politician API response:', response.data);
        setPoliticianList(response.data.data || []);
      })
      .catch((error) => {
        console.error(error);
        setPoliticianList([]);
        toast.error("정치인 부동산 조회 중 오류가 발생했습니다.");
      });
  }
  // 정치인

  // 연예인
  const getCelebrityPolygonList = () => {
    axiosInstance.get(`/api/celebrity/dong-polygons`)
      .then((response) => {
        console.log('Celebrity API response:', response.data);
        setCelebrityPolygonList(response.data.data || []);
      })
      .catch((error) => {
        console.error(error);
        setCelebrityPolygonList([]);
        toast.error("연예인 부동산 조회 중 오류가 발생했습니다.");
      });
  }

  // 연예인 수에 따른 색상 반환 (많을수록 빨강, 적을수록 초록)
  const getCelebrityPolygonColor = (count: number): string => {
    if (count >= 7) return '#DC2626'; // red - 7명 이상
    if (count >= 5) return '#F97316'; // orange - 5~6명
    if (count >= 3) return '#EAB308'; // yellow - 3~4명
    return '#22C55E'; // green - 1~2명
  }

  const getCelebrityPolygonOpacity = (count: number): number => {
    return 0.4; // 동일한 투명도
  }
  // 연예인

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
    return polygon.find((p) => p.current === 'Y') || polygon[0];
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
    <div className="flex w-full h-full relative pb-0 md:pb-0">
      <div className="flex-1 h-full pb-[64px] md:pb-0">
        <Map
          ref={mapRef}
          mapTypeId={mapTypeId}
          onCreate={(map) => {
            map.setCopyrightPosition(kakao.maps.CopyrightPosition.BOTTOMRIGHT, true);
          }}
          onClick={(_, mouseEvent) => {
            // 정치인 또는 연예인 말풍선이 열려있으면 닫기만 하고 return
            if (clickedPolitician !== null || clickedCelebrityDong !== null) {
              setClickedPolitician(null);
              setClickedCelebrityDong(null);
              return;
            }

            // console.log(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
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
          {/* 연예인 */}
          {IS_DEVELOPMENT && showCelebrity && Array.isArray(celebrityPolygonList) && celebrityPolygonList.map((dongPolygon: any) => (
            <React.Fragment key={dongPolygon.legDongCode}>
              <Polygon
                fillColor={getCelebrityPolygonColor(dongPolygon.celebrityCount)}
                fillOpacity={getCelebrityPolygonOpacity(dongPolygon.celebrityCount)}
                strokeColor={getCelebrityPolygonColor(dongPolygon.celebrityCount)}
                strokeOpacity={0.8}
                strokeWeight={2}
                path={convertXYtoLatLng(dongPolygon.polygon || [])}
                onClick={() => {
                  setClickedCelebrityDong(
                    clickedCelebrityDong === dongPolygon.legDongCode ? null : dongPolygon.legDongCode
                  );
                }}
              />
              {/* 동 이름 라벨 */}
              <CustomOverlayMap
                position={{ lat: dongPolygon.lat, lng: dongPolygon.lng }}
                yAnchor={0.5}
                clickable={true}
                zIndex={1}
              >
                <div
                  className="px-2 py-1 bg-white/90 rounded text-xs font-bold cursor-pointer shadow-sm"
                  style={{
                    color: getCelebrityPolygonColor(dongPolygon.celebrityCount),
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: getCelebrityPolygonColor(dongPolygon.celebrityCount),
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setClickedCelebrityDong(
                      clickedCelebrityDong === dongPolygon.legDongCode ? null : dongPolygon.legDongCode
                    );
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {dongPolygon.dongName?.split(' ').pop()} ({dongPolygon.celebrityCount})
                </div>
              </CustomOverlayMap>
              {/* 클릭 시 말풍선 */}
              {clickedCelebrityDong === dongPolygon.legDongCode && (
                <CustomOverlayMap
                  position={{ lat: dongPolygon.lat, lng: dongPolygon.lng }}
                  yAnchor={1.1}
                  clickable={true}
                  zIndex={10}
                >
                  <div
                    className="relative min-w-[200px] max-w-[300px] p-3 bg-white border border-red-300 rounded-lg shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                    onWheel={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                  >
                    {/* 닫기 버튼 */}
                    <button
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClickedCelebrityDong(null);
                      }}
                    >
                      <X size={16} />
                    </button>
                    {/* 헤더 */}
                    <div className="font-bold text-red-600 mb-2 pr-6">
                      ⭐ {dongPolygon.dongName?.split(' ').pop()} 연예인 부동산
                    </div>
                    {/* 연예인 목록 */}
                    <div
                      className="max-h-[200px] overflow-y-auto space-y-2"
                      onWheel={(e) => e.stopPropagation()}
                    >
                      {dongPolygon.celebrities?.map((celeb: any, idx: number) => (
                        <div key={idx} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">{celeb.name}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              celeb.transactionType === '매입' ? 'bg-blue-100 text-blue-600' :
                              celeb.transactionType === '매각' ? 'bg-green-100 text-green-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {celeb.transactionType || '소유'}
                            </span>
                          </div>
                          {celeb.price && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              💰 {celeb.price}
                            </div>
                          )}
                          {celeb.propertyType && (
                            <div className="text-xs text-gray-400">
                              🏢 {celeb.propertyType}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* 말풍선 꼬리 */}
                    <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-red-300"></div>
                    <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
                  </div>
                </CustomOverlayMap>
              )}
            </React.Fragment>
          ))}
          {/* 연예인 */}
          {/* 정치인 */}
          {IS_DEVELOPMENT && showPolitician && Array.isArray(politicianList) && (() => {
            // 같은 좌표끼리 그룹핑
            const groupedByLocation = politicianList.reduce((acc: any, politician: any) => {
              if (politician.isCluster) {
                // 큰 클러스터는 그대로 표시
                acc.push({ ...politician, items: [politician] });
              } else {
                // 개별 마커는 좌표로 그룹핑
                const key = `${politician.lat},${politician.lng}`;
                const existing = acc.find((g: any) => g.locationKey === key);
                if (existing) {
                  existing.items.push(politician);
                } else {
                  acc.push({
                    locationKey: key,
                    lat: politician.lat,
                    lng: politician.lng,
                    items: [politician],
                    isCluster: politician.isCluster
                  });
                }
              }
              return acc;
            }, []);

            return groupedByLocation.map((group: any, groupIdx: number) => {
              const firstItem = group.items[0];
              const itemCount = group.items.length;

              return (
                <React.Fragment key={group.locationKey || group.id || groupIdx}>
                  {group.isCluster ? (
                    /* 큰 클러스터 마커 */
                    <CustomOverlayMap
                      position={{ lat: group.lat, lng: group.lng }}
                      clickable={true}
                    >
                      <div
                        className={`flex items-center justify-center w-[40px] h-[40px] rounded-full text-white font-bold border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform ${
                          group.count >= 50 ? 'bg-red-500' :
                          group.count >= 20 ? 'bg-orange-500' :
                          group.count >= 10 ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (mapRef.current && level > 1) {
                            const nextLevel = level === 4 ? level - 1 : level - 2;
                            mapRef.current.setLevel(nextLevel);
                            mapRef.current.setCenter(new kakao.maps.LatLng(group.lat, group.lng));
                          }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {group.count}
                      </div>
                    </CustomOverlayMap>
                  ) : (
                    <>
                      {/* 개별 마커 */}
                      <CustomOverlayMap
                        position={{ lat: group.lat, lng: group.lng }}
                        yAnchor={1}
                        clickable={true}
                      >
                        <div
                          className={`
                            w-[16px] h-[16px] rounded-full cursor-pointer
                            border-2 border-white transition-transform shadow-md
                            ${firstItem.accuracy_grade === 'A' ? 'bg-red-500' : ''}
                            ${firstItem.accuracy_grade === 'B' ? 'bg-orange-500' : ''}
                            ${firstItem.accuracy_grade === 'C' ? 'bg-yellow-500' : ''}
                            ${firstItem.accuracy_grade === 'F' ? 'bg-gray-500' : ''}
                            ${clickedPolitician === group.locationKey ? 'scale-125' : ''}
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            setClickedPolitician(
                              clickedPolitician === group.locationKey ? null : group.locationKey
                            );
                          }}
                        ></div>
                      </CustomOverlayMap>

                      {/* 클릭 시 말풍선 - 모든 데이터 표시 */}
                      {clickedPolitician === group.locationKey && (
                        <CustomOverlayMap
                          position={{ lat: group.lat, lng: group.lng }}
                          yAnchor={itemCount > 1 ? 1.1 : 1.3}
                          clickable={true}
                        >
                          <div
                            className="relative bg-white border border-gray-300 rounded-lg shadow-xl p-3 min-w-[200px] max-w-[300px]"
                            onClick={(e) => e.stopPropagation()}
                            onWheel={(e) => e.stopPropagation()}
                          >
                            {itemCount > 1 && (
                              <p className="font-bold text-[11px] text-blue-600 mb-2">
                                이 위치에 {itemCount}건의 부동산이 있습니다
                              </p>
                            )}
                            <div className={`flex flex-col gap-2 ${itemCount > 3 ? 'max-h-[300px] overflow-y-auto' : ''}`}>
                              {group.items.map((item: any, idx: number) => (
                                <div key={item.id || idx} className={`flex flex-col gap-1 ${idx > 0 ? 'pt-2 border-t border-gray-200' : ''}`}>
                                  <p className="font-bold text-[13px]">{item.name}</p>
                                  <p className="text-[11px] text-gray-600">{item.organization} · {item.position_title}</p>
                                  <p className="text-[11px] text-gray-600">{item.address_normalized}</p>
                                  <p className="text-[13px] font-semibold text-blue-600">{krwUnit(item.price)}</p>
                                  <p className="text-[10px] text-gray-500">
                                    정확도: {item.accuracy_grade}
                                  </p>
                                </div>
                              ))}
                            </div>
                            {/* 말풍선 꼬리 */}
                            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
                          </div>
                        </CustomOverlayMap>
                      )}
                    </>
                  )}
                </React.Fragment>
              );
            });
          })()}
          {/* 정치인 */}
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
      {/* <div className="w-[400px] h-full border-r border-line-03"> */}
      <div className={`absolute left-0 top-0 h-full w-[400px] bg-white border-r border-line-03 transition-transform duration-300 ease-in-out z-20 ${openLeftPanel ? 'translate-x-0' : '-translate-x-full'}`}>
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
        <button
          onClick={() => setOpenLeftPanel(v => !v)}
          className="absolute -right-[24px] top-1/2 -translate-y-1/2 z-20 text-text-03 bg-white border border-line-03 rounded-r-[8px] px-[1px] py-[10px]">
          {openLeftPanel ? <ChevronLeft size={21} /> : <ChevronRight size={21} />}
        </button>
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
        {
          (filter.on && (rangeLatDiff > MAX_FILTER_DIFF)) && (
            <div className={`fixed z-30 ${showFilterSetting ? 'left-[840px]' : 'left-[425px]'} top-[81px] bg-white rounded-[4px] flex items-center justify-center px-[12px] py-[14px] gap-[10px] shadow-[6px_6px_12px_0_rgba(0,0,0,0.06)]`}>
              <p className="font-c2-p px-[6px] py-[2px] bg-primary text-white">
                TIP
              </p>
              <p className="font-s3 text-text-02 whitespace-nowrap">
                필터 결과를 보려면 지도를 더 확대 해주세요.
              </p>
            </div>
          )
        }
        <div className="fixed z-30 left-[420px] bottom-[22px] flex flex-col gap-[12px]">
          {
            IS_DEVELOPMENT && (
              <div className="flex flex-col gap-[4px] min-w-[250px]">
                {/* 정치인 */}
                <div className="flex gap-[4px]">
                  <div className="flex items-center gap-[8px] px-[16px] py-[10px] rounded-[8px] bg-white border border-[#FF6B6B] shadow-[6px_6px_12px_0_rgba(0,0,0,0.06)]">
                    <p className="font-s2-p">정치인</p>
                    <Switch
                      checked={showPolitician}
                      onChange={() => { setShowPolitician(!showPolitician) }}
                      isLabel={true}
                    />
                  </div>
                  {/* 연예인 */}
                  <div className="flex items-center gap-[8px] px-[16px] py-[10px] rounded-[8px] bg-white border border-[#DC2626] shadow-[6px_6px_12px_0_rgba(0,0,0,0.06)]">
                    <p className="font-s2-p">연예인</p>
                    <Switch
                      checked={showCelebrity}
                      onChange={() => { setShowCelebrity(!showCelebrity) }}
                      isLabel={true}
                    />
                  </div>
                  {/* 연예인 */}
                </div>
                {/* 정치인 */}
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
            className="w-[60px] h-[60px] rounded-full flex items-center justify-center gap-[8px]"
          >
            <BotMessageSquare size={32} />
          </Button>
        </div>
      </div>
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
        />
      }
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
    </MainContext.Provider>
  );
}
import { type User } from "./user";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Coords {
  x: number;
  y: number;
}

export interface AreaPolygons {
  id: string;
  paths: LatLng[];
  polygonArea?: any;
}

export interface DistanceLines {
  id: string;
  paths: LatLng[];
  distances: number[];
}

export interface PolygonInfo {
  id: string;
  legDongCode: string;
  legDongName: string;
  jibun: string;
  lat: number;
  lng: number;
  polygon: Coords[] | Coords[][];
  current: 'Y' | 'N' | null;
}

export interface LandInfo {
  id: string; 
  legDongCode: string;
  legDongName: string;
  jibun: string;
  area: number;
  usageName: string;
  far: number;
  bcr: number;
  jimokName: string;
  curUse: string;
  height: number;
  roadContact: string;
  price: number;
  shape: string;
  // usageList: string;
  sidoName: string;
  sigunguName: string;
  jibunMainNum: string;
  jibunSubNum: string;
  legEupmyeondongName: string; 
  legLiName: string;
  roadName: string;
  // isUnderground: string;
  buildingMainNum: number;
  buildingSubNum: number;
  localBuildingName: string;
  buildingLegName: string;
  // isApartmentHouse: string;
  // roadWidth: string;
  dealPrice: number;
  dealDate: string;
  dealType: string;

  relTotalArea : number; // 연관된 모든 필지의 대지면적
  relTotalPrice : number; // 연관된 모든 필지의 공시지가
  relParcelCount : number; // 연관된 모든 필지의 개수

  relArchAreaSum : number; // 연관된 모든 건축물의 건축면적 합
  relFloorAreaSum : number; // 연관된 모든 건축물의 연면적 합
  
  relBuildingCount : number; // 연관된 모든 건축물의 개수

  relMainUsageName : string; // (연면적이 제일큰) 대표 건축물의 주용도명
  relUseApprovalDate : string; // (연면적이 제일큰) 대표 건축물의 준공일
  relFloorNumber : string; // (연면적이 제일큰) 대표 건축물의 층수
  relGndFloorNumber : string; // (연면적이 제일큰) 대표 건축물의 지상층수
  relBaseFloorNumber : string; // (연면적이 제일큰) 대표 건축물의 지하층수
}

export interface BuildingInfo {
  id: string;
  buildingName: string;
  dongName: string;
  mainUsageName: string;
  etcUsageName: string;
  archArea: number;
  archLandRatio: number;
  totalFloorArea: number;
  floorAreaRatio: number;
  useApprovalDate : string;
  gndFloorNumber: string;
  baseFloorNumber: string;
}

export interface EstimatedPrice {
  estimatedPrice: number;
  per: number;
}


export interface DistrictInfo {
  code: string;
  name: string;
  divCodeName: string;
  totalFootPrintPerHa: number;
  avgDailyCount: number;
  area: number;
  distance: number;
}

export interface PlaceInfo {
  name: string;
  distance: number;
}

export interface PlaceList {
  subway: PlaceInfo[];
  school: PlaceInfo[];
  tour: PlaceInfo[];
  bus: PlaceInfo[];
}

// export interface LandInfoResp {
//   land: LandInfo;
//   buildings: BuildingInfo[];
//   estimatedPrice: number;
//   per: number;
// }

export interface BookmarkedReportType {
  landId: string;
  landInfo: LandInfo;
  buildingId: string;
  buildings: BuildingInfo[];
  estimatedPrice: number;
  estimatedPricePer: number;
  jibun: string;
  legDongCode: string;
  legDongName: string;
  lat: number;
  lng: number;
  polygon: Coords[] | Coords[][];
}

export interface ConsultRequest {
  id: string;
  user: User;
  land: LandInfo;
  content: string;
  consultedYn: string;
  createdAt: string;
}


export const getJibunAddress = (landInfo: LandInfo) => {
  return `${landInfo?.legDongName} ${landInfo?.jibun}`;
}

export const getRoadAddress  = (landInfo: LandInfo) => {
  if(!landInfo?.roadName) {
    return "";
  }
  const subName =
    landInfo.buildingSubNum > 0 ? `-${landInfo.buildingSubNum}` : "";
  
  if (landInfo.localBuildingName === null || landInfo.localBuildingName === "") {
    return `${landInfo.sidoName} ${landInfo.sigunguName} ${landInfo.roadName} ${landInfo.buildingMainNum}${subName} (${landInfo.legEupmyeondongName})`;
  } else {
    return `${landInfo.sidoName} ${landInfo.sigunguName} ${landInfo.roadName} ${landInfo.buildingMainNum}${subName}, ${landInfo.localBuildingName}`;
  }
}

export const getAreaStrWithPyeong = (area ?: any) => {
  // console.log(area);
  if(!area) {
    return '-m² (-평)';
  }

  const areaNum = Number(area);
  // const area = Number(area);
  return (areaNum.toFixed(1) || '-') + 'm² (' + (areaNum * 0.3025).toFixed(1) + '평)';
}
  

export const getRatioStr = (value : any) => {
  if(!value) {
    return '-';
  }
  return Number(value).toFixed(2) + '%';
}


export const getBuildingCreateDate = (date : string) => {
  const dateStr = date?.replace(' ', '');
  if(!dateStr || dateStr.length < 8) {
    return null;
  }
  // 문자열에서 연, 월, 일 추출
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(date.substring(4, 6), 10) - 1; // JS month는 0부터 시작
  const day = parseInt(date.substring(6, 8), 10);
  // console.log('getBuildingCreateDate', date, year, month, day);
  // 준공일 Date 객체 생성
  const completionDate = new Date(year, month, day);
  // console.log('getBuildingCreateDate', completionDate);
  return completionDate;
}

export const getBuildingCreateYear = (date : string) => {
  const dateStr = getBuildingCreateDate(date);
  if(!dateStr) {
    return '';
  }
  return dateStr.getFullYear() + '년';
}


export const getBuildingRelInfoText = (landInfo : LandInfo) => {
  if(!landInfo) {
    return '';
  }
  const arr = []
  if (landInfo.relUseApprovalDate) {
    arr.push(getBuildingCreateYear(landInfo.relUseApprovalDate))
  }
  let floorInfo = ''
  if (landInfo.relGndFloorNumber) {
    floorInfo += landInfo.relGndFloorNumber + 'F'
  }
  if (landInfo.relBaseFloorNumber) {
    floorInfo += '/B' + landInfo.relBaseFloorNumber
  }
  if (floorInfo.length > 0) {
    arr.push(floorInfo)
  }
  return arr.join(' · ')
}

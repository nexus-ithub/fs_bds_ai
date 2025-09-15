
export interface LatLng {
  lat: number;
  lng: number;
}

export interface Coords {
  x: number;
  y: number;
}

export interface LandInfo {
  id: string; 
  legDongCode: string;
  legDongName: string;
  jibun: string;
  area: number;
  usageName: string;
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
  polygon: Coords[] | Coords[][];
}

export interface BuildingInfo {
  buildingName: string;
  dongName: string;
  mainUsageName: string;
  etcUsageName: string;
  archArea: number;
  archLandRatio: number;
  totalFloorArea: number;
  floorAreaRatio: number;
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

export interface LandInfoResp {
  land: LandInfo;
  buildings: BuildingInfo[];
  estimatedPrice: number;
  per: number;
}


export const getJibunAddress = (landInfo: LandInfo) => {
  return `${landInfo.legDongName} ${landInfo.jibun}`;
}

export const getRoadAddress  = (landInfo: LandInfo) => {
  if(!landInfo.roadName) {
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
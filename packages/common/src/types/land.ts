
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
  polygon: Coords[] | Coords[][];
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
  console.log(area);
  if(!area) {
    return '-m² (-평)';
  }

  const areaNum = Number(area);
  // const area = Number(area);
  return (areaNum.toFixed(1) || '-') + 'm² (' + (areaNum * 0.3025).toFixed(1) + '평)';
}
  
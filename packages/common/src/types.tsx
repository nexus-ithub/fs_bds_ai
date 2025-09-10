
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
  area: number;
  possDivName: string; 
  possPersonNum: number;
  usage1Name: string;
  usage2Name: string;
  jimokName: string;
  curUse: string;
  height: number;
  roadContact: string;
  price: number;
  shape: string;
  usageList: string;
  sidoName: string;
  sigunguName: string;
  legEupmyeondongName: string; 
  legLiName: string;
  roadName: string;
  isUnderground: string;
  buildingMainNum: string;
  buildingSubNum: string;
  localBuildingName: string;
  buildingLegName: string;
  isApartmentHouse: string;
  roadWidth: string;
  polygon: Coords[] | Coords[][];
}
  
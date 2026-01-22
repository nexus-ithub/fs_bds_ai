import { Coords } from "./land";


export const TYPE = {
  SIGUNGU: 'sigungu',
  EUPMYEONDONG: 'eupmyeondong'
}


export interface DealAvgInfo {
  id: number;
  legDongCode: string;
  dealPrice: number;
  name: string;
  lat: number;
  lng: number;
  polygon: Coords[] | Coords[][];
}
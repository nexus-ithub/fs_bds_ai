import { type Coords } from "./land";


export type AreaLevel = 'sigungu' | 'eupmyeondong';

export interface DealInfo {
  id: string;
  legDongName: string;
  legDongCode: string;
  dealDate: Date;
  dealPrice: number;
  lat: number;
  lng: number;
  type: "building" | "land";
  // polygon: Coords[] | Coords[][];
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
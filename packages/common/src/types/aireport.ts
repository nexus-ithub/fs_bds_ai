
import { type RentInfo, type EstimatedPrice, type LandUsageInfo } from "./land";



export interface AIReportParam {
  landId: string;
  buildingId: string;
  estimatedPrice: EstimatedPrice;
}

export interface BuildingData {
  id: string;
  floorAreaRatio: string; // 용적률 
  archLandRatio: string; // 건폐율
  useApprovalDate: string; // 사용승인일
  totalFloorArea: string; // 연면적
  archArea: string; // 건축면적 
  landArea: string; // 토지면적 
  gndFloorNumber: number; // 지상층수
  baseFloorNumber: number; // 지하층수 
  structureCodeName: string;
}

export interface LandData {
  id: string;
  legDongName: string; // 법정동명 
  jibun: string; // 지번
  area: number; // 대지면적 
  usageName: string; // 주용도 
  price: number; // 공시지가 
  jimokName: string; // 지목명 
  curUse: string; // 현재용도 
  roadContact: string; // 도로접함
  far: number; // 최대용적율
  bcr: number; // 최대건폐율
  lat: number;
  lng: number;

  usageList: LandUsageInfo[];

  dealPrice: number; // 최근 거래 가격
  dealDate: Date; // 최근 거래 일
  dealType: string; // 최근 거래 유형 "building" (= 건물) or "land" (= 토지)


  relTotalArea: number; // 연관된 모든 필지의 대지면적
  relTotalPrice: number; // 연관된 모든 필지의 공시지가
  relWeightedFar: number; // 연관된 모든 필지의 면적비 가중 평균 건폐율
  relWeightedBcr: number; // 연관된 모든 필지의 면적비 가중 평균 건폐율
  relParcelCount: number; // 연관된 모든 필지의 개수
  relLandIds: string; // 연관된 모든 필지의 id
}


// 토지비 
export interface LandCost {
  // 매입비용
  purchaseCost: number;
  // 취득세 + 법무사비
  acquisitionCost: number;
  // 중개보수
  agentFee: number;
}



// 사업비
export interface ProjectCost {
  // 해체공사비 
  demolitionCost: number;
  // 해체감리비
  demolitionManagementCost: number;
  // 건축설계비 
  constructionDesignCost: number;
  // 건축공사비
  constructionCost: number;

  // 감리비 
  managementCost: number;

  // PM 용역비 
  pmFee: number;
  // 취득세 
  acquisitionTax: number;
  // 예비비
  reserveFee: number;
}


// 건축 정보
export interface BuildInfo {

  buildingArea: number; // 건축면적

  upperFloorCount: number; // 지상층 층수
  lowerFloorCount: number; // 지하층 층수

  publicAreaPerFloor: number; // 공용면적

  upperFloorArea: number; // 지상층 연면적 
  lowerFloorArea: number; // 지하층 연면적
  firstFloorExclusiveArea: number; // 1층 전용면적
  secondFloorExclusiveArea: number; // 2층 이상 총 전용면적
  lowerFloorExclusiveArea: number; // 지하층 총 전용면적


  bcr: number; // 건폐율
  far: number; // 용적율
}


// 금융차입
export interface Loan {
  // 차입비
  loanAmount: number;
  // 사업기간내금융이자
  loanInterest: number;
  // 연간 차입이자
  loanInterestPerYear: number;
}

export interface ReportValue {
  grade: string;

  duration: ProjectDuration;
  // 토지비
  landCost: LandCost;
  // 사업비
  projectCost: ProjectCost;
  // 금융차입
  loan: Loan;
  // 금융차입 (소유자)
  // loanForOwner: Loan;

  // 연간임대수익
  annualRentProfit: number;
  // 연간관리비수익
  annualManagementProfit: number;
  // 연간보증금수익
  annualDepositProfit: number;

  // 세금
  tax: TaxInfo;

  result: ReportResult;
}

export interface ProjectDuration {
  // 기획 (months)
  planningDurationMonths: number;
  // 설계 (months)
  designDurationMonths: number;
  // 공사 (months)
  constructionDurationMonths: number;


}

export interface TaxInfo {
  // 재산세(토지)
  propertyTax: number;
  // 재산세 (건물) + 지역자원신설세
  propertyTaxForBuilding: number;
  // 종합부동산세
  comprehensiveRealEstateTax: number;
}

export interface DevDetailInfo {

  // 건축정보
  buildInfo: BuildInfo;
  // 리모델링 정보
  remodelingInfo: BuildInfo;

  rent: ReportValue; // 임대 (미개발)
  remodel: ReportValue; // 리모델링
  build: ReportValue; // 신축

  // tax: TaxInfo;

  analysisMessage: string;


  debugExtraInfo: string[];
  debugBuildInfo: string[];
  debugRemodelInfo: string[];
  debugRentInfo: string[];
}


export interface ReportResult {
  grade: string;
  // message: string;

  // 총사업비 
  totalProjectCost: number;

  // 초기준비자금 
  initialCapital: number;
  // 실투자금
  // investmentCapital: number;

  // // 연간 순수익
  // annualProfit: number;
  // 연간 임대수익
  annualRentProfit: number;

  // 실투자금대비 임대수익율 
  // rentProfitRatio: number;

  // 개발후 임대수익률
  profitRatio: number;

  // 평균 공시지가 상승률 
  avgPublicLandPriceGrowthRate: number;

  // 연간 자산상승금액
  // assetGrowthAmount: number;
  // 실투자금 대비 연간 수익율 
  // investmentProfitRatio: number;

  // 매각금액
  expectedSaleAmount: number;
}

export interface AIReportResult {
  rent: ReportResult; // 임대 (미개발)
  remodel: ReportResult; // 리모델링
  build: ReportResult; // 신축
  analysisMessage: string;
  summary: string;
  aroundRentInfo?: RentInfo[];
}

export interface AIReportDetail {
  type: 'rent' | 'remodel' | 'build';
  landInfo: LandData;
  buildingList: BuildingData[];
  buildInfo: BuildInfo;
  tax: TaxInfo;
  value: ReportValue; // 계선 결과 / 정보
  result: ReportResult | null; // 최종 결과
}


export interface AIReportDebugInfo {
  landInfo: LandData;
  buildingList: BuildingData[];
  devDetailInfo: DevDetailInfo;
}

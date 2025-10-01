import { type EstimatedPrice } from "./land";



export interface AIReportParam{
  landId: string;
  buildingId: string;
  estimatedPrice: EstimatedPrice;
}

export interface BuildingData{
  id: string;
  floorAreaRatio: number; // 건폐율 
  useApprovalDate: string; // 사용승인일
  totalFloorArea: number; // 연면적
  archArea: number; // 건축면적 
  landArea: number; // 토지면적 
  gndFloorNumber: number; // 지상층수
  baseFloorNumber: number; // 지하층수 
}

export interface LandData{
  id: string;
  legDongName: string; // 법정동명 
  jibun: string; // 지번
  area: number; // 대지면적 
  usageName: string; // 주용도 
  price: number; // 공시지가 
  far: number; // 최대용적율
  bcr: number; // 최대건폐율
  lat: number; 
  lng: number;

  dealPrice: number; // 최근 거래 가격
  dealDate: string; // 최근 거래 일
  dealType: string; // 최근 거래 유형 "building" (= 건물) or "land" (= 토지)
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
} 


// 금융차입
export interface Loan {
  // 차입비
  loanAmount: number;
  // 차입이자
  loanInterest: number;
}

export interface ReportValue {
  grade: string;
  message: string;


  duration: ProjectDuration;
  // 토지비
  landCost: LandCost;
  // 사업비
  projectCost: ProjectCost;
  // 금융차입
  loan: Loan;
  // 금융차입 (소유자)
  loanForOwner: Loan;

  // 연간임대수익
  annualRentProfit: number;
  // 연간관리비수익
  annualManagementProfit: number;
  // 연간보증금수익
  annualDepositProfit: number;
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

export interface AIReportInfo {

  // 건축정보
  buildInfo: BuildInfo;

  rent: ReportValue; // 임대 (미개발)
  remodel: ReportValue; // 리모델링
  build: ReportValue; // 신축

  tax: TaxInfo;

  analysisMessage: string;
}

export interface ReportResult {
  grade: string;
  message: string;
   
  // 초기준비자금 
  initialCapital: number;
  // 실투자금
  investmentCapital: number;
  // 연간 순수익
  annualProfit: number;

  // 실투자금대비 임대수익율 
  rentProfitRatio: number;
  // 연간 자산상승금액
  // assetGrowthAmount: number;
  // 실투자금 대비 연간 수익율 
  investmentProfitRatio: number;

  // 매각금액
  expectedSaleAmount: number;
}

export interface AIReportResult {
  rent: ReportResult; // 임대 (미개발)
  remodel: ReportResult; // 리모델링
  build: ReportResult; // 신축

  analysisMessage: string;
  summary: string;
}




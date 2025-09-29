import { EstimatedPrice } from "./land";



export interface AIReportParam{
  landId: string;
  buildingId: string;
  estimatedPrice: EstimatedPrice;
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
  annualProfit: number;

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

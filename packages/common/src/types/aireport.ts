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
export interface BuildingCost {
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

  // 매입비용 
  purchaseCost: number;
  // 사업비용 (business cost)
  businessCost: number;
  // 사업기간
  businessPeriod: number;
  // 수익률 (profit rate)
  annualProfitRate: number; 
  // 연간수익 (annual profit)
  annualProfit: number;

  // 예상 매각금액
  expectedSellingPrice: number;
}

export interface AIReportInfo {
  rent: ReportValue; // 임대 (미개발)
  remodel: ReportValue; // 리모델링
  build: ReportValue; // 신축

  // 토지비
  landCost: LandCost;
  // 사업비
  buildingCost: BuildingCost;
  // 금융차입
  loan: Loan;

  analysisMessage: string;
}

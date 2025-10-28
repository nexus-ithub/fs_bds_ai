import { db } from '../utils/database';
import { DevDetailInfo, AIReportResult, BuildInfo, BuildingData, BuildingInfo, EstimatedPrice, LandCost, LandData, LandInfo, Loan, PolygonInfo, ProjectCost, ProjectDuration, ReportResult, ReportValue, TaxInfo, AIReportDetail, AIReportDebugInfo } from '@repo/common';
import OpenAI from "openai";
const client = new OpenAI({
  timeout: 20 * 1000, 
});

const krwUnit = (amount: number, firstUnit?: boolean) => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  if (absAmount >= 100000000) {
    const eok = absAmount / 100000000;
    const man = (absAmount % 100000000) / 10000;
    if (man > 0) {
      if (firstUnit) {
        return `${isNegative ? '-' : ''}${eok.toFixed(1)}억`;
      }
      return `${isNegative ? '-' : ''}${Math.floor(eok)}억 ${Math.floor(man)}만원`;
    }
    return `${isNegative ? '-' : ''}${Math.floor(eok)}억`;
  } else if (absAmount >= 10000) {
    const man = absAmount / 10000;
    const remainder = absAmount % 10000;
    if (remainder > 0) {
      if (firstUnit) {
        return `${isNegative ? '-' : ''}${man.toFixed(1)}만`;
      }
      return `${isNegative ? '-' : ''}${Math.floor(man)}만 ${Math.floor(remainder).toLocaleString()}원`;
    }
    return `${isNegative ? '-' : ''}${man.toLocaleString()}만원`;
  }
  return `${isNegative ? '-' : ''}${absAmount.toLocaleString()}원`;
};



const INSTRUCTION_PROMPT = `"""
너는 부동산 분석 전문가로서 
현재 토지와 건물에 대한 내용을 아래의 예와 비슷하게 요약 해야해

"서울 강남구 청담동 95-16은 제2종 일반주거지역에 위치한 지하 1층, 지상 4층 규모의 중소형 빌딩으로, 대지 약 101평, 연면적 약 255평입니다. 2021년에는 약 178억 원에 매매되었으며, 현재 시세는 약 230억~250억 원 수준으로 예측 됩니다. 제2종 일반주거지역이라는 점에서 용적률 제한과 인허가 절차의 제약이 있으며, 인접 건물과의 관계도 고려해야 합니다. 다만, 리모델링 후 상가+주거 혼합 임대 전략으로 안정적인 수익 창출이 가능하며, 지하층은 상업용(바, 스튜디오), 상층부는 오피스텔 또는 공유오피스로 활용 가능합니다. 예상 연 임대수익은 약 1.2억원 수준입니다.
다만, 실거래가와 공시지가 괴리에 따른 세금 부담, 임대 공실 위험, 재건축 관련 규제 등을 충분히 검토해야 하며, 중장기적으로는 재건축 또는 고급 리모델링을 통해 자산가치 상승이 기대되는 건물입니다." 

**** 요약의 주요 조건 ****
- 한국어로 작성
- 고급스럽고 전문적인 톤
- ~입니다. ~합니다 등으로 문장의 끝은 사용자에게 이야기 하듯 작성해줘
- 건물 특징(위치, 용도, 임대료, 준공연도)을 포함하고 건물이 없으면 "현재 건축물 없는 상태"라고 작성 
- 주용도에 따른 제한사항/고려해야할점/긍정적인면 등 지식을 동원해서 용도에 대한 이야기 작성, 만약 주용도가 
  특별한게 없다면 작성하지 않아도 됨  
- 주소를 보고 지식을 동원해서 주변 랜드마크, 대중교통, 개발계획, 개발호재등의 입지의 특징을 설명해주고, 만약 주변입지가 특별한게 없다면 작성하지 않아도 됨 
- 기타로 현재 데이터를 기반으로 추가 내용이 있다면 간단하게 첨부해도 됨
- 신축 / 리모델링 / 임대중 등급이 'A' 는 가장 추천하는 개발 방향이고, 'B'는 두번째로 추천하는 개발 방향이고, 'C'는 가장 추천하지 않는 개발 방향임.
- 등급 이야기는 하지 말고 추천/두번째로 추천/추천하지 않음 용어로 설명해줘 
- 매각금액/투자금/순수익등의 설명은 등급이 "A" 인 것을 기준으로 설명
- 신축 / 리모델링 / 임대중 등급 A, B 까지만 설명 하고 C 에 대해서는 굳이 설명하지 않아도 됨

*** 중요 *** 
- 응답 텍스트는 너무 길지 않게 800자 이내로 작성해줘 
- 프롬프트의 내용이 작성되지 않도록 주의 
- 금액은 1.4억 , 2.3천만원 등으로 표시해줘 

*** 출력 형식 ***
사용자의 질문에 먼저 답변을 작성하고, 그 뒤에 짧은 요약을 작성해줘.
* 요약은 70자 이내로 작성하고 answer 를 참고해서 아래 예처림 등급 A 인 개발방향을 중점으로 서술형으로 요약 작성해줘 
"즉시 수익 창출이 가능하고 리스크가 낮아 안정적 현금 흐름 확보에 유리한 저위험 투자처입니다."
* 반드시 다음과 같은 JSON 형식을 지켜줘
{"answer": "...", "summary": "..."}
"""`;

const RENT_CANDIDATE_RADIUS = 1000;


const BASE_FLOOR_AREA_RATIO = 0.85; // 대지대비지하비율 0.85 
const ACQUISITION_COST_RATIO = 0.047; // 취득세 + 법무사비 비율 
const AGENT_FEE_RATIO = 0.009; // 중개보수 비율 
const MANAGEMENT_FEE_RATIO = 0.7; // 감리비 비율 
const PM_FEE_PER_MONTH = 25000000; // PM 용역비 월단위 
const ACQUISITION_TAX_RATIO = 0.032; // 취득세 비율 
const RESERVE_FEE_RATIO = 0.01; // 예비비 비율 


const LOAN_RATIO = 0.7;
const LOAN_INTEREST_RATIO = 0.035;

const LOAN_RATIO_FOR_OWNER = 0.8;
const LOAN_INTEREST_RATIO_FOR_OWNER = 0.035;

const FAIR_MARKET_RATIO = 0.7; // 공정시장가 비율 

const getBuildProjectDuration = (floorArea : number, debug : boolean = false, debugExtraInfo : string[] = []) => {
  const areaPerPy = floorArea * 0.3025;
  if(areaPerPy < 500){
    if(debug){
      debugExtraInfo.push(`* 소규모 (총연면적 ${areaPerPy.toFixed(1)}평 < 500평)`);
      debugExtraInfo.push(`[개발기간] 19.5개월 (기획 : 1.5개월, 설계 : 6개월, 공사 : 12개월)`);
    }
    return {
      planningDurationMonths: 1.5,
      designDurationMonths: 6,
      constructionDurationMonths: 12
    }
  }else if(areaPerPy < 1500){
    if(debug){
      debugExtraInfo.push(`* 중규모 (총연면적 ${areaPerPy.toFixed(1)}평 < 1500평)`);
      debugExtraInfo.push(`[개발기간] 26개월 (기획 : 2개월, 설계 : 8개월, 공사 : 16개월)`);
    }
    return {
      planningDurationMonths: 2,
      designDurationMonths: 8,
      constructionDurationMonths: 16
    }
  }else{
    if(debug){
      debugExtraInfo.push(`* 대규모 (총연면적 ${areaPerPy.toFixed(1)}평 >= 1500평)`);
      debugExtraInfo.push(`[개발기간] 34개월 (기획 : 3개월, 설계 : 9개월, 공사 : 22개월)`);
    }
    return {
      planningDurationMonths: 3,
      designDurationMonths: 9,
      constructionDurationMonths: 22
    }
  }
}

const getRemodelProjectDuration = (floorArea : number, debug : boolean = false, debugExtraInfo : string[] = []) => {
  const areaPerPy = floorArea * 0.3025;
  if(areaPerPy < 500){
    if(debug){
      debugExtraInfo.push(`* 소규모 (총연면적 ${areaPerPy.toFixed(1)}평 < 500평)`);
      debugExtraInfo.push(`[개발기간] 13.5개월 (기획 : 1.5개월, 설계 : 6개월, 공사 : 6개월)`);
    }
    return {
      planningDurationMonths: 1.5,
      designDurationMonths: 6,
      constructionDurationMonths: 6
    }
  }else if(areaPerPy < 1500){
    if(debug){
      debugExtraInfo.push(`* 중규모 (총연면적 ${areaPerPy.toFixed(1)}평 < 1500평)`);
      debugExtraInfo.push(`[개발기간] 20개월 (기획 : 2개월, 설계 : 8개월, 공사 : 10개월)`);
    }
    return {
      planningDurationMonths: 2,
      designDurationMonths: 8,
      constructionDurationMonths: 10
    }
  }else{
    if(debug){
      debugExtraInfo.push(`* 대규모 (총연면적 ${areaPerPy.toFixed(1)}평 >= 1500평)`);
      debugExtraInfo.push(`[개발기간] 28개월 (기획 : 3개월, 설계 : 9개월, 공사 : 16개월)`);
    }
    return {
      planningDurationMonths: 3,
      designDurationMonths: 9,
      constructionDurationMonths: 16
    }
  }
}


const getDefaultPublicArea = (floorArea : number, floorCount : number) => {

  // m2 면적으로 계산 
  if (floorArea < 500) {
    return 20;
  } else if (floorArea < 1000) {
    return 40;
  } else if (floorArea < 2000) {
    return 70;
  } 

  // 2000 이상은 층당 25% 를 공용면적으로 계산 
  return (floorArea / floorCount) * 0.25;
};



const getDemolitionCostPerPy = (floorArea : number) => {
  const areaPerPy = floorArea * 0.3025;
  if(areaPerPy < 300){
    return 500000;
  }else if(areaPerPy < 500){
    return 700000;
  }else if(areaPerPy < 1000){
    return 1000000;
  }else{
    return 2000000;
  }
}


const getConstructionDesignCostPerPy = (floorArea : number) => {
  const areaPerPy = floorArea * 0.3025;
  if(areaPerPy < 500){
    return 250000;
  }else if(areaPerPy < 1500){
    return 350000;
  }else{
    return 500000;
  }
}


const getConstructionCostPerPy = (floorArea : number) => {
  const areaPerPy = floorArea * 0.3025;
  if(areaPerPy < 500){
    return 9000000;
  }else if(areaPerPy < 1500){
    return 10000000;
  }else{
    return 11000000;
  }
}


const getRemodelingCostPerPy = (floorArea : number) => {
  const areaPerPy = floorArea * 0.3025;
  if(areaPerPy < 500){
    return 5000000;
  }else if(areaPerPy < 1500){
    return 7000000;
  }else{
    return 8000000;
  }
}

const getDemolitionManagementCost = (floorArea : number) => {
  const areaPerPy = floorArea * 0.3025;
  if(areaPerPy < 300){
    return 15000000;
  }else if(areaPerPy < 500){
    return 45000000;
  }else if(areaPerPy < 1000){
    return 90000000;
  }else{
    return 135000000;
  }
}


const getManagementCostPerPy = (floorArea : number, type : 'build' | 'remodel' | 'rent') => {
  const areaPerPy = floorArea * 0.3025;
  if(type === 'build'){
    if(areaPerPy < 500){
      return 20000;
    }else if(areaPerPy < 1500){
      return 40000;
    }else{
      return 70000;
    }
  }else if(type === 'remodel'){
    if(areaPerPy < 500){
      return 18000;
    }else if(areaPerPy < 1500){
      return 36000;
    }else{
      return 65000;
    }
  }else{
    if(areaPerPy < 500){
      return 16000;
    }else if(areaPerPy < 1500){
      return 32000;
    }else{
      return 60000;
    }
  }
}

const getRentProfitRatio = (type : 'build' | 'remodel' | 'rent') => {
  if(type === 'build'){
    return 1.2;
  }else if(type === 'remodel'){
    return 1.1;
  }else{
    return 1.0;
  }
}

const getPropertyTax = (price : number, area : number, debug : boolean, debugExtraInfo : string[]) => {
  // 아래 링크 참고 
  // "사업용토지"를 기준으로 계산 
  // https://xn--989a00af8jnslv3dba.com/%EC%9E%AC%EC%82%B0%EC%84%B8


  const taxBase = price * area * FAIR_MARKET_RATIO; // 과세표준 공정시장가 비율 공시지가 * 70%  
  if(debug){
    debugExtraInfo.push(`[과세표준] ${krwUnit(taxBase)} (공시지가 * 70%(공정시장가액비율))`);
  }

  let propertyTax = 0;
  if(taxBase <= 200000000){ 
    // 2억 이하 : 과세표준 x 0.20%
    propertyTax = taxBase * 0.002;
    if(debug){
      debugExtraInfo.push(`[재산세] ${krwUnit(propertyTax)} (2억 이하 : 과세표준 x 0.2%)`);
    }
  }else if (taxBase <= 1000000000){
    // 10억 이하 : 400000 + (과세표준 - 2억) x 0.3% 
    propertyTax = 400000 + (taxBase - 200000000) * 0.003;
    if(debug){
      debugExtraInfo.push(`[재산세] ${krwUnit(propertyTax)} (10억 이하 : 400000 + (과세표준 - 2억) x 0.3%)`);
    }
  }else{
    // 10억 초과 : 2800000 + (과세표준 - 10억) x 0.4%
    propertyTax = 2800000 + (taxBase - 1000000000) * 0.004;
    if(debug){
      debugExtraInfo.push(`[재산세] ${krwUnit(propertyTax)} (10억 초과 : 2800000 + (과세표준 - 10억) x 0.4%)`);
    }
  }

  if(debug){
    debugExtraInfo.push(`[도시지역분] ${krwUnit(taxBase * 0.0014)} (과세표준 x 0.14%)`);
    debugExtraInfo.push(`[지방교육세] ${krwUnit(propertyTax * 0.2)} (재산세 x 20%)`);
    debugExtraInfo.push(`<재산세(토지)> ${krwUnit(propertyTax + (taxBase * 0.0014) + (propertyTax * 0.2))} (재산세 + 도시지역분 + 지방교육세)`);
  }

  return propertyTax +  // 재산세 
    (taxBase * 0.0014) + // 도시지역분 (0.14%) 
    (propertyTax * 0.2) // 지방교육세 (20%)
}


const getPropertyTaxForBuilding = (taxBase : number) => {
  // 아래 링크 참고 
  // "건축물/기타건축물"를 기준으로 계산 
  // https://xn--989a00af8jnslv3dba.com/%EC%9E%AC%EC%82%B0%EC%84%B8
  // TODO : taxBase 가 아니라 건축물 시가표준액으로 계산해야 함 

  // 시가표준액 * 0.25%
  return taxBase * 0.0025; 
}


function getBuildingAge (useApprovalDateStr: string){
  if (!useApprovalDateStr || useApprovalDateStr.length < 8) {
    return null; // 잘못된 입력 처리
  }

  // 문자열에서 연, 월, 일 추출
  const year = parseInt(useApprovalDateStr.substring(0, 4), 10);
  const month = parseInt(useApprovalDateStr.substring(4, 6), 10) - 1; // JS month는 0부터 시작
  const day = parseInt(useApprovalDateStr.substring(6, 8), 10);

  // 준공일 Date 객체 생성
  const completionDate = new Date(year, month, day);
  const today = new Date();

  // 경과 연수 계산
  let age = today.getFullYear() - completionDate.getFullYear();

  // 아직 올해 준공일이 지나지 않았다면 -1
  const hasPassedAnniversary =
    today.getMonth() > completionDate.getMonth() ||
    (today.getMonth() === completionDate.getMonth() && today.getDate() >= completionDate.getDate());

  if (!hasPassedAnniversary) {
    age -= 1;
  }

  return age;
}


function makeReportValue(report : ReportValue, grade : string, type : 'rent' | 'remodel' | 'build'){
  report.grade = grade;
  // report.message = 'AI 메세지 메세지 메세지 메세지.....';
}


function makeLandCost(landCost : LandCost, estimatedPrice : EstimatedPrice, debug : boolean = false, debugExtraInfo : string[] = []){
  landCost.purchaseCost = estimatedPrice.estimatedPrice;
  landCost.acquisitionCost = estimatedPrice.estimatedPrice * ACQUISITION_COST_RATIO; // 취득세 + 법무사비
  landCost.agentFee = estimatedPrice.estimatedPrice * AGENT_FEE_RATIO; // 중개보수

  if(debug){
    debugExtraInfo.push(`--------------------------------------------`);
    debugExtraInfo.push(`토지비`);
    debugExtraInfo.push(`[매입비용] ${krwUnit(landCost.purchaseCost)} (추정가)`);
    debugExtraInfo.push(`[취득세+법무사비] ${krwUnit(landCost.acquisitionCost)} (추정가 * ${(ACQUISITION_COST_RATIO * 100).toFixed(1)}%)`);
    debugExtraInfo.push(`[중개보수] ${krwUnit(landCost.agentFee)} (추정가 * ${(AGENT_FEE_RATIO * 100).toFixed(1)}%)`);
    debugExtraInfo.push(`<합계> ${krwUnit(landCost.purchaseCost + landCost.acquisitionCost + landCost.agentFee)}`);
    
  }
}



function makeBuildInfo(detailInfo : DevDetailInfo, area : number, far : number, bcr : number, debug : boolean){

  detailInfo.buildInfo.buildingArea = area * (bcr / 100);
  detailInfo.buildInfo.upperFloorArea = area * (far / 100);
  
  detailInfo.buildInfo.upperFloorCount = Math.ceil(Number(detailInfo.buildInfo.upperFloorArea) / Number(detailInfo.buildInfo.buildingArea));
  detailInfo.buildInfo.publicAreaPerFloor = getDefaultPublicArea(detailInfo.buildInfo.upperFloorArea, detailInfo.buildInfo.upperFloorCount);

  detailInfo.buildInfo.lowerFloorCount = 1; // 지하층수는 1로 고정 
  detailInfo.buildInfo.lowerFloorArea = area * detailInfo.buildInfo.lowerFloorCount * BASE_FLOOR_AREA_RATIO;

  const areaPerFloor = detailInfo.buildInfo.upperFloorArea / detailInfo.buildInfo.upperFloorCount;
  detailInfo.buildInfo.firstFloorExclusiveArea = areaPerFloor - (detailInfo.buildInfo.publicAreaPerFloor);
  detailInfo.buildInfo.secondFloorExclusiveArea = detailInfo.buildInfo.upperFloorArea - detailInfo.buildInfo.firstFloorExclusiveArea - (detailInfo.buildInfo.publicAreaPerFloor * (detailInfo.buildInfo.upperFloorCount - 1));
  detailInfo.buildInfo.lowerFloorExclusiveArea = detailInfo.buildInfo.lowerFloorArea - (detailInfo.buildInfo.publicAreaPerFloor * detailInfo.buildInfo.lowerFloorCount);

  if(debug){
    detailInfo.debugExtraInfo.push("\n");
    detailInfo.debugExtraInfo.push("🏗️ 개발계획 (개발후)");
    detailInfo.debugExtraInfo.push(`[건축면적] ${detailInfo.buildInfo.buildingArea.toFixed(1)}m² (${Number(area).toFixed(2)}(면적) * ${bcr / 100}(건폐율))`);
    detailInfo.debugExtraInfo.push(`[지상층연면적] ${detailInfo.buildInfo.upperFloorArea.toFixed(1)}m² (${Number(area).toFixed(2)}(면적) * ${far / 100}(용적률))`);
    detailInfo.debugExtraInfo.push(`[지상층층수] ${detailInfo.buildInfo.upperFloorCount} (${detailInfo.buildInfo.upperFloorArea.toFixed(1)}m² / ${detailInfo.buildInfo.buildingArea.toFixed(1)}m²)`);
    detailInfo.debugExtraInfo.push(`[지하층연면적] ${detailInfo.buildInfo.lowerFloorArea.toFixed(1)}m² (${Number(area).toFixed(2)}(면적) * ${Number(BASE_FLOOR_AREA_RATIO).toFixed(2)}(대지대비지하비율) * ${detailInfo.buildInfo.lowerFloorCount}(지하층수))`);
    detailInfo.debugExtraInfo.push(`[지하층층수] ${detailInfo.buildInfo.lowerFloorCount} (고정값)`);

    detailInfo.debugExtraInfo.push(`[지상층별 면적] ${areaPerFloor.toFixed(1)}m²`);
    detailInfo.debugExtraInfo.push(`[공용면적] ${detailInfo.buildInfo.publicAreaPerFloor.toFixed(1)}m²`);
    detailInfo.debugExtraInfo.push(`[1층 전용면적] ${detailInfo.buildInfo.firstFloorExclusiveArea.toFixed(1)}m² (${areaPerFloor.toFixed(1)}m² (지상 층별면적) - ${detailInfo.buildInfo.publicAreaPerFloor.toFixed(1)}m² (공용면적))`);
    detailInfo.debugExtraInfo.push(`[2층이상(총)전용면적] ${detailInfo.buildInfo.secondFloorExclusiveArea.toFixed(1)}m² (${detailInfo.buildInfo.upperFloorArea.toFixed(1)}m² (지상층연면적) - ${areaPerFloor.toFixed(1)}m² (1층면적) - (${detailInfo.buildInfo.publicAreaPerFloor.toFixed(1)}m² (공용면적) * ${detailInfo.buildInfo.upperFloorCount - 1} (2층이상 층수))`);
    detailInfo.debugExtraInfo.push(`[지하층(총)전용면적] ${detailInfo.buildInfo.lowerFloorExclusiveArea.toFixed(1)}m² (${detailInfo.buildInfo.lowerFloorArea.toFixed(1)}m² (지하층연면적) - ${detailInfo.buildInfo.publicAreaPerFloor.toFixed(1)}m² (공용면적))`);
  }
  // console.log('makeBuildInfo ', buildInfo);
}


function makeProjectCost(
  projectCost: ProjectCost,
  currentFloorArea: number,
  totalFloorArea: number,
  projectDuration: ProjectDuration,
  remodeling: boolean,
  debug: boolean,
  debugExtraInfo: string[]
) {
  // console.log('makeProjectCost ', currentFloorArea, totalFloorArea, projectDuration, remodeling);
  if(debug){
    debugExtraInfo.push(`--------------------------------------------`);
    debugExtraInfo.push(`사업비`);
  }
  if(remodeling){
    projectCost.demolitionCost = 0;
    projectCost.demolitionManagementCost = 0;
    if(debug){
      debugExtraInfo.push(`[해체공사비] 0원`);
      debugExtraInfo.push(`[해체감리비] 0원`);
    }
  }else{
    projectCost.demolitionCost = currentFloorArea * 0.3025 * getDemolitionCostPerPy(currentFloorArea);
    projectCost.demolitionManagementCost = getDemolitionManagementCost(currentFloorArea);
    if(debug){
      debugExtraInfo.push(`[해체공사비] ${krwUnit(projectCost.demolitionCost)} (${( 0.3025 * currentFloorArea ).toFixed(2)}(건물연면적(평)) * ${getDemolitionCostPerPy(currentFloorArea).toLocaleString()}(평당금액))`);
      debugExtraInfo.push(`[해체감리비] ${krwUnit(projectCost.demolitionManagementCost)}원`);
    }
  }

  projectCost.constructionDesignCost = totalFloorArea * 0.3025 * getConstructionDesignCostPerPy(totalFloorArea);

  if(remodeling){
    projectCost.constructionCost = totalFloorArea * 0.3025 * getRemodelingCostPerPy(totalFloorArea);
  }else{
    projectCost.constructionCost = totalFloorArea * 0.3025 * getConstructionCostPerPy(totalFloorArea);
  }
  if(debug){
    debugExtraInfo.push(`[건축설계비] ${krwUnit(projectCost.constructionDesignCost)} (${( totalFloorArea * 0.3025 ).toFixed(2)}(건물연면적(평)) * ${getConstructionDesignCostPerPy(totalFloorArea).toLocaleString()}(평당금액))`);
    if(remodeling){
      debugExtraInfo.push(`[건축공사비] ${krwUnit(projectCost.constructionCost)} (${( totalFloorArea * 0.3025 ).toFixed(2)}(건물연면적(평)) * ${getRemodelingCostPerPy(totalFloorArea).toLocaleString()}(평당금액))`);
    }else{
      debugExtraInfo.push(`[건축공사비] ${krwUnit(projectCost.constructionCost)} (${( totalFloorArea * 0.3025 ).toFixed(2)}(건물연면적(평)) * ${getConstructionCostPerPy(totalFloorArea).toLocaleString()}(평당금액))`);
    }
  }
  projectCost.managementCost = projectCost.constructionDesignCost * MANAGEMENT_FEE_RATIO;
  
  projectCost.pmFee = (projectDuration.planningDurationMonths + projectDuration.designDurationMonths + projectDuration.constructionDurationMonths) * PM_FEE_PER_MONTH;
  
  const totalProjectCost = projectCost.demolitionCost + projectCost.demolitionManagementCost + projectCost.constructionDesignCost + projectCost.constructionCost + projectCost.managementCost + projectCost.pmFee;
  projectCost.acquisitionTax = totalProjectCost * ACQUISITION_TAX_RATIO;
  projectCost.reserveFee = totalProjectCost * RESERVE_FEE_RATIO;


  if(debug){
    debugExtraInfo.push(`[감리비] ${krwUnit(projectCost.managementCost)} (${Number(projectCost.constructionDesignCost.toFixed(1)).toLocaleString()}(건축설계비) * ${MANAGEMENT_FEE_RATIO.toFixed(2)}(감리비율))`);
    debugExtraInfo.push(`[PM 용역비] ${krwUnit(projectCost.pmFee)} (${projectDuration.planningDurationMonths + projectDuration.designDurationMonths + projectDuration.constructionDurationMonths}(프로젝트기간) * ${PM_FEE_PER_MONTH.toFixed(0)}(PM용역비))`);
    debugExtraInfo.push(`<사업비> ${krwUnit(projectCost.demolitionCost + projectCost.demolitionManagementCost + projectCost.constructionDesignCost + projectCost.constructionCost + projectCost.managementCost + projectCost.pmFee)} (해체공사비 + 해체감리비 + 건축설계비 + 건축공사비 + 감리비 + PM 용역비)`);
    debugExtraInfo.push(`[취득세] ${krwUnit(projectCost.acquisitionTax)} (${Number(totalProjectCost.toFixed(0)).toLocaleString()}(총사업비) * ${(ACQUISITION_TAX_RATIO * 100)}%(취득세율))`);
    debugExtraInfo.push(`[예비비] ${krwUnit(projectCost.reserveFee)} (${Number(totalProjectCost.toFixed(0)).toLocaleString()}(총사업비) * ${(RESERVE_FEE_RATIO * 100)}%(예비비율))`);
  }

  // if(debug){
  //   debugExtraInfo.push(`--`);
  //   debugExtraInfo.push(`사업비`);
  //   debugExtraInfo.push(`[해체공사비] ${projectCost.demolitionCost.toFixed(0)}원`);
  //   debugExtraInfo.push(`[해체감리비] ${projectCost.demolitionManagementCost.toFixed(0)}원`);
  //   debugExtraInfo.push(`[건축설계비] ${projectCost.constructionDesignCost.toFixed(0)}원`);
  //   debugExtraInfo.push(`[건축공사비] ${projectCost.constructionCost.toFixed(0)}원`);
  //   debugExtraInfo.push(`[감리비] ${projectCost.managementCost.toFixed(0)}원`);
  //   debugExtraInfo.push(`[PM 용역비] ${projectCost.pmFee.toFixed(0)}원`);
  //   debugExtraInfo.push(`[취득세] ${projectCost.acquisitionTax.toFixed(0)}원`);
  //   debugExtraInfo.push(`[예비비] ${projectCost.reserveFee.toFixed(0)}원`);
  //   debugExtraInfo.push(`합계 ${Number(Number(projectCost.demolitionCost + projectCost.demolitionManagementCost + projectCost.constructionDesignCost + projectCost.constructionCost + projectCost.managementCost + projectCost.pmFee + projectCost.acquisitionTax + projectCost.reserveFee).toFixed(0)).toLocaleString()}원`);
  // }
}


function makeLoan(value : ReportValue, debug : boolean = false, debugExtraInfo : string[] = []){
  const loanAmount = (
    value.projectCost.demolitionCost +
    value.projectCost.demolitionManagementCost +
    value.projectCost.constructionDesignCost +
    value.projectCost.constructionCost +
    value.projectCost.managementCost +
    value.projectCost.pmFee + 
    (value.landCost.purchaseCost + value.landCost.acquisitionCost + value.landCost.agentFee)
  ) * LOAN_RATIO;
  // const totalDuration = value.duration.planningDurationMonths + value.duration.designDurationMonths + value.duration.constructionDurationMonths;
  const loanInterest = loanAmount * ((value.duration.planningDurationMonths + value.duration.designDurationMonths + value.duration.constructionDurationMonths) / 12) * LOAN_INTEREST_RATIO;
  const loanInterestPerYear = loanAmount * LOAN_INTEREST_RATIO;

  if(debug){
    debugExtraInfo.push(`--------------------------------------------`);
    debugExtraInfo.push(`금융차입`);
    debugExtraInfo.push(`[차입비] ${krwUnit(loanAmount)} ((토지비 + 사업비) * ${(LOAN_RATIO * 100).toFixed(2)}%)`);
    debugExtraInfo.push(`[이자/년] ${krwUnit(loanInterestPerYear)} (${krwUnit(loanAmount)} * ${(LOAN_INTEREST_RATIO * 100).toFixed(2)}%)`);
  }

  return {
    loanAmount,
    loanInterest,
    loanInterestPerYear
  }
}


// function makeLoanForOwner(value: ReportValue, debug : boolean = false, debugExtraInfo : string[] = []) { // landCost에 대한 정보를 loan에 반영
//   const loanAmount = (
//     value.projectCost.demolitionCost +
//     value.projectCost.demolitionManagementCost +
//     value.projectCost.constructionDesignCost +
//     value.projectCost.constructionCost +
//     value.projectCost.managementCost +
//     value.projectCost.pmFee
//   ) * LOAN_RATIO_FOR_OWNER;
//   const loanInterest = value.loan.loanAmount * ((value.duration.planningDurationMonths + value.duration.designDurationMonths + value.duration.constructionDurationMonths) / 12) * LOAN_INTEREST_RATIO_FOR_OWNER;
//   const loanInterestPerYear = loanAmount * LOAN_INTEREST_RATIO_FOR_OWNER;
//   if(debug){
//     debugExtraInfo.push(`--------------------------------------------`);
//     debugExtraInfo.push(`금융차입 (소유자)`);
//     debugExtraInfo.push(`[차입비] ${Number(Number(loanAmount).toFixed(0)).toLocaleString()}원 (토지비 + 사업비합계 * ${(LOAN_RATIO * 100).toFixed(2)}%)`);
//     debugExtraInfo.push(`[이자/년] ${Number(Number(loanInterestPerYear).toFixed(0)).toLocaleString()}원 (${Number(loanAmount.toFixed(0)).toLocaleString()}원 * ${(LOAN_INTEREST_RATIO * 100).toFixed(2)}%)`);
//   }
//   return {
//     loanAmount,
//     loanInterest,
//     loanInterestPerYear
//   }
// }

function getCurrentBuildingArchArea(buildingList : BuildingData[], buildInfo : BuildInfo){
  const archArea = buildingList.reduce((acc, building) => acc + ((building.archArea ? Number(building.archArea) : 0)), 0);
  if(archArea > 0){
    return archArea;
  }else{
    const expectedArchArea = buildingList.reduce((acc, building) => {
      let value = 0
      if(Number(building.totalFloorArea) > 0 && (Number(building.gndFloorNumber) + Number(building.baseFloorNumber)) > 0){
        value = (Number(building.totalFloorArea) / (Number(building.gndFloorNumber) + Number(building.baseFloorNumber)));
      }
      return acc + value;
    }, 0);
    if(expectedArchArea > 0){
      return expectedArchArea;
    }
  }


  return buildInfo.buildingArea;
  // }else if(Number(currentBuildingInfo.totalFloorArea) > 0 && (Number(currentBuildingInfo.gndFloorNumber) + Number(currentBuildingInfo.baseFloorNumber)) > 0){
  //   return (Number(currentBuildingInfo.totalFloorArea) / (Number(currentBuildingInfo.gndFloorNumber) + Number(currentBuildingInfo.baseFloorNumber)));
  // }else {
  //   return buildInfo.buildingArea;
  // }
}


function makeProfit(
  type: 'rent' | 'remodel' | 'build',
  value: ReportValue,
  buildInfo: BuildInfo,
  buildingList: BuildingData[],
  firstFloorRentProfitPerPy: number,
  upperFloorRentProfitPerPy: number,
  baseFloorRentProfitPerPy: number,
  debug : boolean = false,
  debugExtraInfo : string[] = []
) {
  
  let rentProfit;
  let managementProfit;
  let currentBuildingArchArea = (buildingList && buildingList.length > 0) ? getCurrentBuildingArchArea(buildingList, buildInfo) : 0;
  // 현재 건축물 대장에 연면적이 없으면 총 연면적을 archArea로 대체 (1층짜리 건물이라고 생각) 
  const curBuildingTotalFloorArea = buildingList?.reduce((total, building) => total + (building.totalFloorArea ? parseFloat(building.totalFloorArea) : 0.00), 0.00);
  let currentBuildingTotalFloorArea = curBuildingTotalFloorArea ? curBuildingTotalFloorArea : currentBuildingArchArea;
 
  // console.log('makeProfit type', type);
  console.log('current totalFloorArea', currentBuildingTotalFloorArea);
  console.log('newBuild totalFloorArea ', buildInfo.upperFloorArea + buildInfo.lowerFloorArea);
 
  // console.log('firstFloorRentProfitPerPy', firstFloorRentProfitPerPy);
  // console.log('upperFloorRentProfitPerPy', upperFloorRentProfitPerPy);
  // console.log('baseFloorRentProfitPerPy', baseFloorRentProfitPerPy);

  if(debug){
    debugExtraInfo.push(`---------------------------------------`);
    debugExtraInfo.push(`임대 수익`);
  }
  
  if(type === 'rent' || (type === 'remodel' && currentBuildingTotalFloorArea > (buildInfo.upperFloorArea + buildInfo.lowerFloorArea))){

    // 현재 건축물대장의 연면적 기준으로 수익률 계산 
    console.log('makeProfit with currentBuilding ', type, buildingList[0]);
    for(const building of buildingList){
      console.log(building);
    }
    const baseFloorNumber = Number(buildingList[0].baseFloorNumber) || 0;
    const gndFloorNumber = Number(buildingList[0].gndFloorNumber) || 1;
    const publicArea = getDefaultPublicArea(currentBuildingTotalFloorArea, gndFloorNumber);
    const firstFloorExclusiveArea = Number(currentBuildingArchArea) - publicArea;
    const currentBuildingTotalLandArea = buildingList?.reduce((total, building) => total + (building.landArea ? parseFloat(building.landArea) : 0.00), 0.00);
    
    const baseExclusiveArea = baseFloorNumber > 0 ? 
      (currentBuildingTotalLandArea * BASE_FLOOR_AREA_RATIO) - publicArea :
      0;
    const totalUpperFloorArea = Number(currentBuildingTotalFloorArea) - firstFloorExclusiveArea - baseExclusiveArea 
    const totalUpperFloorExclusiveArea = totalUpperFloorArea - (publicArea * (gndFloorNumber - 1));

    if(debug){
      if(type === 'remodel'){
        debugExtraInfo.push(`* 현재 건축물의 연 면적이 개발후 연면적 보다 커서 현재 건축물대장의 연면적 기준으로 수익률 계산`);
      }
    }

    // console.log('currentBuilding', currentBuildingInfo);
    // console.log('archArea', currentBuildingArchArea);
    // console.log('publicArea', publicArea);
    // console.log('firstFloorExclusiveArea', firstFloorExclusiveArea);
    // console.log('totalUpperFloorArea', totalUpperFloorArea);
    // console.log('baseExclusiveArea', baseExclusiveArea);
    // console.log('totalUpperFloorExclusiveArea', totalUpperFloorExclusiveArea);
    // console.log('baseExclusiveArea', baseExclusiveArea);
    // console.log('currentBuildingInfo.totalFloorArea', currentBuildingInfo.totalFloorArea);
    
    rentProfit = getRentProfitRatio(type) * (firstFloorRentProfitPerPy * (firstFloorExclusiveArea * 0.3025) + 
      upperFloorRentProfitPerPy * (totalUpperFloorExclusiveArea) * 0.3025 + 
      baseFloorRentProfitPerPy * (baseExclusiveArea * 0.3025));

    if(debug){
      debugExtraInfo.push(`[현재건물연면적] ${currentBuildingTotalFloorArea.toFixed(2)} (${(currentBuildingTotalFloorArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[공용면적] ${publicArea.toFixed(2)} (${(publicArea * 0.3025).toFixed(2)}평)`);
      
      debugExtraInfo.push(`[1층전용면적] ${firstFloorExclusiveArea.toFixed(2)} (${(firstFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[1층임대수익] ${krwUnit(firstFloorRentProfitPerPy * (firstFloorExclusiveArea * 0.3025))} (${krwUnit(firstFloorRentProfitPerPy)} (주변1층평당임대료) * ${(firstFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[지상층전용면적] ${totalUpperFloorExclusiveArea.toFixed(2)} (${(totalUpperFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[지상층(총)임대수익] ${krwUnit(upperFloorRentProfitPerPy * (totalUpperFloorExclusiveArea) * 0.3025)} (${krwUnit(upperFloorRentProfitPerPy)} (주변2층이상평당임대료) * ${(totalUpperFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[지하층전용면적] ${baseExclusiveArea} (${(baseExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[지하층(총)임대수익] ${krwUnit(baseFloorRentProfitPerPy * (baseExclusiveArea * 0.3025))} (${krwUnit(baseFloorRentProfitPerPy)} (주변지하층평당임대료) * ${(baseExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`<임대수익> ${krwUnit(rentProfit)} (${getRentProfitRatio(type)}(수익률가중치) * (1층임대수익 + 지상층임대수익 + 지하층임대수익))`);
    }

    managementProfit = 
      (getManagementCostPerPy(currentBuildingTotalFloorArea, type) 
      * (currentBuildingTotalFloorArea) * 0.3025) / 2;

    if(debug){
      debugExtraInfo.push(`<관리비수익> ${krwUnit(managementProfit)} (${krwUnit(getManagementCostPerPy(currentBuildingTotalFloorArea, type))} * ${(currentBuildingTotalFloorArea* 0.3025).toFixed(2)}평  / 2)`);
    }  
  }else{


    // 신축기준으로 수익률 계산 
    console.log('makeProfit with buildInfo ', type);
    // 월 임대료 수익 
    rentProfit = getRentProfitRatio(type) * ((firstFloorRentProfitPerPy * (buildInfo.firstFloorExclusiveArea * 0.3025)) + 
    (upperFloorRentProfitPerPy * (buildInfo.secondFloorExclusiveArea * 0.3025)) + 
    (baseFloorRentProfitPerPy * buildInfo.lowerFloorExclusiveArea * 0.3025)) // 임대료 

    if(debug){
      debugExtraInfo.push(`[개발후건물연면적] ${(buildInfo.lowerFloorArea + buildInfo.upperFloorArea).toFixed(2)} (${((buildInfo.lowerFloorArea + buildInfo.upperFloorArea) * 0.3025).toFixed(2)}평)`);
      
      debugExtraInfo.push(`[1층전용면적] ${buildInfo.firstFloorExclusiveArea.toFixed(2)} (${(buildInfo.firstFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[1층임대수익] ${krwUnit(firstFloorRentProfitPerPy * (buildInfo.firstFloorExclusiveArea * 0.3025))} (${krwUnit(firstFloorRentProfitPerPy)} (주변1층평당임대료) * ${(buildInfo.firstFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[지상층전용면적] ${buildInfo.secondFloorExclusiveArea.toFixed(2)} (${(buildInfo.secondFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[지상층임대수익] ${krwUnit(upperFloorRentProfitPerPy * (buildInfo.secondFloorExclusiveArea) * 0.3025)} (${krwUnit(upperFloorRentProfitPerPy)} (주변2층이상평당임대료) * ${(buildInfo.secondFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[지하층전용면적] ${buildInfo.lowerFloorExclusiveArea.toFixed(2)} (${(buildInfo.lowerFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[지하층임대수익] ${krwUnit(baseFloorRentProfitPerPy * (buildInfo.lowerFloorExclusiveArea * 0.3025))} (${krwUnit(baseFloorRentProfitPerPy)} (주변지하층평당임대료) * ${(buildInfo.lowerFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`<임대수익> ${krwUnit(rentProfit)} (${getRentProfitRatio(type)}(수익률가중치) * (1층임대수익 + 지상층임대수익 + 지하층임대수익))`);
    }

    // 월 관리비 수익 (1/2 만 수익으로 계산)
    managementProfit = 
      (getManagementCostPerPy(buildInfo.upperFloorArea + buildInfo.lowerFloorArea, type)
      * ((buildInfo.upperFloorArea + buildInfo.lowerFloorArea) * 0.3025)) / 2;

    if(debug){
      debugExtraInfo.push(`<총관리비수익> ${krwUnit(managementProfit)} (${krwUnit(getManagementCostPerPy(buildInfo.upperFloorArea + buildInfo.lowerFloorArea, type))} * ${((buildInfo.firstFloorExclusiveArea + buildInfo.secondFloorExclusiveArea + buildInfo.lowerFloorExclusiveArea) * 0.3025).toFixed(2)}평 / 2)`);
    }


  }


  value.annualRentProfit = rentProfit * 12;  
  value.annualManagementProfit = managementProfit * 12;
  value.annualDepositProfit = rentProfit * 10;
  if(debug){
    debugExtraInfo.push(`<연임대수익> ${krwUnit(value.annualRentProfit)} (${krwUnit(rentProfit)} * 12)`);
    debugExtraInfo.push(`<연관리비수익> ${krwUnit(value.annualManagementProfit)} (${krwUnit(managementProfit)} * 12)`);
    debugExtraInfo.push(`<연보증금수익> ${krwUnit(value.annualDepositProfit)} (${krwUnit(rentProfit)} * 10)`);
  }
  // console.log('makeProfit result', type, value);
}

function makeResult(value : ReportValue, tax : TaxInfo, debug : boolean = false, debugExtraInfo : string[] = []){
  if(debug){
    debugExtraInfo.push(`--`);
    debugExtraInfo.push(`최종`);
  }
  const initialCapital = calculateInitialCapital(value, debug, debugExtraInfo);
  const investmentCapital = calculateRealInvestmentCapital(value, debug, debugExtraInfo);
  const annualProfit = calculateaAnnualProfit(value, tax, debug, debugExtraInfo);
  const rentProfitRatio = annualProfit / investmentCapital;
  if(debug){
    debugExtraInfo.push(`[임대수익률] ${(rentProfitRatio * 100).toFixed(1)}% (${krwUnit(annualProfit)}(연간순수익) / ${krwUnit(investmentCapital)}(실투자금))`);
  }
  const investmentProfitRatio = (annualProfit + (value.landCost.purchaseCost * 0.045)) / investmentCapital;
  if(debug){
    debugExtraInfo.push(`[연간수익률] ${(investmentProfitRatio * 100).toFixed(1)}% (${krwUnit(annualProfit)}(연간순수익) + ${krwUnit(value.landCost.purchaseCost * 0.045)}(자산상승금액 (토지매입비 * 4.5%)) / ${krwUnit(investmentCapital)}(실투자금))`);
  }
  const expectedSaleAmount = (value.annualManagementProfit + value.annualRentProfit) / (3.5 / 100);
  if(debug){
    debugExtraInfo.push(`[매각금액] ${krwUnit(expectedSaleAmount)} (${krwUnit(value.annualManagementProfit)}(연간관리비수익) + ${krwUnit(value.annualRentProfit)}(연간임대수익) / (3.5%))`);
  }

  return {
    grade: value.grade,
    initialCapital: initialCapital,
    investmentCapital: investmentCapital,
    annualProfit: annualProfit,
    rentProfitRatio: rentProfitRatio,
    investmentProfitRatio: investmentProfitRatio,
    expectedSaleAmount: expectedSaleAmount
  } as ReportResult;
}

function calculateInitialCapital(value : ReportValue, debug : boolean = false, debugExtraInfo : string[] = []){

  const result = (value.landCost.purchaseCost) 
            + value.landCost.acquisitionCost 
            + value.landCost.agentFee - ((value.landCost.purchaseCost) * LOAN_RATIO)
  if(debug){
    debugExtraInfo.push(`[초기준비자금] ${krwUnit(result)} (매입비 + 취득세 + 법무사비 + 중개보수 - 금융차입금)`);
  }
  return result;
}

function calculateRealInvestmentCapital(value : ReportValue, debug : boolean = false, debugExtraInfo : string[] = []){

  const result = value.projectCost.demolitionCost +
    value.projectCost.demolitionManagementCost +
    value.projectCost.constructionDesignCost +
    value.projectCost.constructionCost +
    value.projectCost.managementCost +
    value.projectCost.pmFee + 
    // value.projectCost.acquisitionTax +
    // value.projectCost.reserveFee +
    value.landCost.purchaseCost + value.landCost.acquisitionCost + value.landCost.agentFee - value.loan.loanAmount - value.annualDepositProfit;

  if(debug){
    debugExtraInfo.push(
      `[실투자금] ${krwUnit(result)} (` +
      `총사업비 (${krwUnit(
        value.projectCost.demolitionCost +
        value.projectCost.demolitionManagementCost +
        value.projectCost.constructionDesignCost +
        value.projectCost.constructionCost +
        value.projectCost.managementCost +
        value.projectCost.pmFee + 
        value.landCost.purchaseCost +
        value.landCost.acquisitionCost +
        value.landCost.agentFee
      )}) - 보증금 (${krwUnit(value.annualDepositProfit)}) - 금융차입금 (${krwUnit(value.loan.loanAmount)}))`
    );
  }

  return result
}

function calculateInvestmentCapital(value : ReportValue){

  const totalProjectCost = value.projectCost.demolitionCost +
    value.projectCost.demolitionManagementCost +
    value.projectCost.constructionDesignCost +
    value.projectCost.constructionCost +
    value.projectCost.managementCost +
    value.projectCost.pmFee + 
    value.projectCost.acquisitionTax +
    value.projectCost.reserveFee +
    value.landCost.purchaseCost + value.landCost.acquisitionCost + value.landCost.agentFee

  return totalProjectCost 
    - value.annualDepositProfit;
}


function calculateaAnnualProfit(value : ReportValue, tax : TaxInfo, debug : boolean = false, debugExtraInfo : string[] = []){

  const result = value.annualRentProfit + value.annualManagementProfit - (tax.propertyTax + tax.propertyTaxForBuilding + tax.comprehensiveRealEstateTax + value.loan.loanInterestPerYear);

  if(debug){
    debugExtraInfo.push(`[연간 순수익] ${krwUnit(result)} (${krwUnit(value.annualRentProfit)}(연간임대수익) + ${krwUnit(value.annualManagementProfit)}(연간관리비수익) - (${krwUnit(tax.propertyTax)}(토지재산세) + ${krwUnit(tax.propertyTaxForBuilding)}(건물재산세) + ${krwUnit(tax.comprehensiveRealEstateTax)}(종합부동산세) + ${krwUnit(value.loan.loanInterestPerYear)}(금융차입이자))`);
  }
  return result;
}


function newReportValue(): ReportValue {
  return {
    grade: '',  
    // message: '',
    duration: { 
      planningDurationMonths: 0,
      designDurationMonths: 0,
      constructionDurationMonths: 0,
    },
    landCost: {
      purchaseCost: 0,
      acquisitionCost: 0,
      agentFee: 0
    },
    projectCost: {
      demolitionCost: 0,
      demolitionManagementCost: 0,
      constructionDesignCost: 0,
      constructionCost: 0,
      managementCost: 0,
      pmFee: 0,
      acquisitionTax: 0,
      reserveFee: 0
    },
    loan: {
      loanAmount: 0,
      loanInterest: 0,
      loanInterestPerYear: 0
    },
    // loanForOwner: {
    //   loanAmount: 0,
    //   loanInterest: 0,
    //   loanInterestPerYear: 0
    // },
    annualRentProfit: 0,
    annualDepositProfit: 0,
    annualManagementProfit: 0,

    result: null,
  };
}


function reportValueToJsonString(report: ReportValue, result: ReportResult): string {
  if(report && result){
    const reportJson = {
      '등급': report.grade,
      '공사기간': report.duration.constructionDurationMonths + report.duration.designDurationMonths + report.duration.planningDurationMonths,
      '초기준비자금': krwUnit(result.initialCapital, true),
      '실투자금': krwUnit(result.investmentCapital, true),
      '연간 순수익': krwUnit(result.annualProfit, true),
      '임대수익율': result.rentProfitRatio,
      '연간수익율': result.investmentProfitRatio,
      '매각금액': krwUnit(result.expectedSaleAmount, true),
    }
    return JSON.stringify(reportJson);
  }
  return '없음';
}

export class AIReportModel {

  static async makeDevDetailInfo(
    landId: string,
    estimatedPrice: EstimatedPrice,
    debug: boolean = false
  ): Promise<{
    landInfo: LandData;
    buildingList: BuildingData[];
    devDetailInfo: DevDetailInfo;
    debug? : boolean;
  } | null> {
      console.log('landId', landId)
      console.log('estimatedPrice', estimatedPrice)


      const devDetailInfo = {
        rent: newReportValue(),
        remodel: newReportValue(),
        build: newReportValue(),
        buildInfo: {
          buildingArea: 0,
          upperFloorArea: 0,
          lowerFloorArea: 0,
          publicAreaPerFloor: 0,
          upperFloorCount: 0,
          lowerFloorCount: 0,
          firstFloorExclusiveArea: 0,
          secondFloorExclusiveArea: 0,
          lowerFloorExclusiveArea: 0,
        },
        tax: {
          propertyTax: 0,
          propertyTaxForBuilding: 0,
          comprehensiveRealEstateTax: 0,
        },
        analysisMessage: ''
      } as DevDetailInfo;
      
      
      const buildingList = await db.query<BuildingData>(
        `
        WITH
        /* 1) 기준 토지 한 개 선택 */
        base AS (
          SELECT
              li.id,
              li.leg_dong_code,
              li.jibun,
              li.div_code,
              LPAD(CAST(SUBSTRING_INDEX(li.jibun,'-', 1) AS UNSIGNED), 4, '0') AS bun_pad,
              LPAD(
                CAST(
                  IF(LOCATE('-', li.jibun) > 0, SUBSTRING_INDEX(li.jibun,'-',-1), '0'
                ) AS UNSIGNED), 4, '0'
              ) AS ji_pad
          FROM land_info li
          WHERE li.id = ?
          LIMIT 1
        ),

        /* 2) 토지 지번과 매칭되는 건물 ID 수집 (메인주소 + 보조주소) */
        cand_building_ids AS (
          SELECT blh.building_id
          FROM building_leg_headline blh
          JOIN base b
            ON blh.leg_dong_code_val = b.leg_dong_code
          AND blh.bun = b.bun_pad
          AND blh.ji  = b.ji_pad
          UNION   -- 중복 제거를 위해 UNION 사용
          SELECT bsa.building_id
          FROM building_sub_addr bsa
          JOIN base b
            ON bsa.sub_leg_dong_code_val = b.leg_dong_code
          AND bsa.sub_bun = b.bun_pad
          AND bsa.sub_ji  = b.ji_pad
        )

        /* 3) 최종 건물 정보 리스트 */
        SELECT 
          blh.building_id       AS id,
          blh.floor_area_ratio  AS floorAreaRatio,
          blh.arch_land_ratio AS archLandRatio,
          blh.use_approval_date AS useApprovalDate,
          blh.total_floor_area  AS totalFloorArea,
          blh.arch_area         AS archArea,
          blh.land_area         AS landArea,
          blh.gnd_floor_number  AS gndFloorNumber,
          blh.base_floor_number AS baseFloorNumber
        FROM building_leg_headline blh
        JOIN cand_building_ids c
          ON c.building_id = blh.building_id
        ORDER BY blh.total_floor_area DESC;
        `,
        [landId]
      )
      
      const landInfo = await db.query<LandData>(
        `
          WITH
          /* 1) 기준 land_info 한 개 선택 */
          base AS (
            SELECT
                li.id, li.leg_dong_code, li.jibun, li.div_code,
                LPAD(CAST(SUBSTRING_INDEX(li.jibun,'-', 1) AS UNSIGNED), 4, '0') AS bun_pad,
                LPAD(CAST(IF(LOCATE('-', li.jibun) > 0, SUBSTRING_INDEX(li.jibun,'-',-1), '0') AS UNSIGNED), 4, '0') AS ji_pad
            FROM land_info li
            WHERE li.id = ?
            LIMIT 1
          ),
          cand_building_ids AS (
            SELECT blh.building_id
            FROM building_leg_headline blh
            JOIN base b
              ON blh.leg_dong_code_val = b.leg_dong_code
            AND blh.bun = b.bun_pad
            AND blh.ji  = b.ji_pad
            UNION
            SELECT bsa.building_id
            FROM building_sub_addr bsa
            JOIN base b
              ON bsa.sub_leg_dong_code_val = b.leg_dong_code
            AND bsa.sub_bun = b.bun_pad
            AND bsa.sub_ji  = b.ji_pad
          ),
          rows_main AS (
            SELECT blh.building_id, blh.leg_dong_code_val AS leg_code, blh.bun AS bun_pad, blh.ji AS ji_pad
            FROM building_leg_headline blh
            JOIN cand_building_ids c USING (building_id)
          ),
          rows_sub AS (
            SELECT bsa.building_id, bsa.sub_leg_dong_code_val AS leg_code, bsa.sub_bun AS bun_pad, bsa.sub_ji AS ji_pad
            FROM building_sub_addr bsa
            JOIN cand_building_ids c USING (building_id)
          ),
          /* 0패딩 제거 후 'bun[-ji]' 정규 지번 키 생성 */
          row_keys AS (
            SELECT
              building_id,
              leg_code,
              bun_pad,
              ji_pad,
              CONCAT(
                CAST(bun_pad AS UNSIGNED),
                CASE WHEN CAST(ji_pad AS UNSIGNED) > 0
                    THEN CONCAT('-', CAST(ji_pad AS UNSIGNED))
                    ELSE ''
                END
              ) AS jibun_norm
            FROM (
              SELECT * FROM rows_main
              UNION ALL
              SELECT * FROM rows_sub
            ) u
          ),
          /* land_info 매칭으로 관련 필지 id 수집 */
          related_li_ids AS (
            SELECT DISTINCT li2.id AS li_id
            FROM row_keys rk
            JOIN land_info li2
              ON li2.leg_dong_code = rk.leg_code
            AND li2.jibun         = rk.jibun_norm
            JOIN base b        ON li2.div_code = b.div_code
          ),
          /* 기준 필지 항상 포함 */
          final_ids AS (
            SELECT li_id AS id FROM related_li_ids
            UNION
            SELECT id FROM base
          ),
          /* land_char_info의 id별 최신 1건을 파생 테이블로 준비 (LATERAL 미사용) */
          land_char_latest AS (
            SELECT c.*
            FROM land_char_info c
            JOIN (
              SELECT id, MAX(create_date) AS max_cd
              FROM land_char_info
              GROUP BY id
            ) m
              ON m.id = c.id
            AND m.max_cd = c.create_date
          ),
          /* 관련(+기준) 모든 필지 집계 */
          rel_agg AS (
            SELECT
              SUM(li.area)                        AS relTotalArea,     -- 1) area 합
              AVG(lc.price)                       AS relTotalPrice,    -- 2) price 평균
              /* 3) FAR 면적 가중 평균 */
              SUM(CASE WHEN llur.far IS NOT NULL THEN llur.far * li.area ELSE 0 END)
                / NULLIF(SUM(CASE WHEN llur.far IS NOT NULL THEN li.area END), 0) AS relWeightedFar,
              /* 4) BCR 면적 가중 평균 */
              SUM(CASE WHEN llur.bcr IS NOT NULL THEN llur.bcr * li.area ELSE 0 END)
                / NULLIF(SUM(CASE WHEN llur.bcr IS NOT NULL THEN li.area END), 0) AS relWeightedBcr,
              COUNT(*)                            AS relParcelCount    -- 5) 필지 개수
            FROM final_ids f
            JOIN land_info li       ON li.id = f.id
            LEFT JOIN land_char_latest lc ON lc.id = li.id
            LEFT JOIN leg_land_usage_ratio llur
                  ON lc.usage1_name = llur.name
          )
          /* ===== 메인 상세 조회 + 집계치 ===== */
          SELECT 
            li.id AS id,
            li.leg_dong_name AS legDongName,
            li.jibun AS jibun,
            li.area AS area,
            lc.usage1_name AS usageName,
            lc.price AS price,
            llur.far,
            llur.bcr,
            ap.lat,
            ap.lng,
            CASE
              WHEN bd_latest.deal_date IS NULL AND ld_latest.deal_date IS NULL THEN NULL
              WHEN ld_latest.deal_date IS NULL 
                  OR (bd_latest.deal_date IS NOT NULL AND bd_latest.deal_date >= ld_latest.deal_date)
                THEN bd_latest.deal_date
              ELSE ld_latest.deal_date
            END AS dealDate,
            CASE
              WHEN bd_latest.deal_date IS NULL AND ld_latest.deal_date IS NULL THEN NULL
              WHEN ld_latest.deal_date IS NULL 
                  OR (bd_latest.deal_date IS NOT NULL AND bd_latest.deal_date >= ld_latest.deal_date)
                THEN bd_latest.price
              ELSE ld_latest.price
            END AS dealPrice,
            CASE
              WHEN bd_latest.deal_date IS NULL AND ld_latest.deal_date IS NULL THEN NULL
              WHEN ld_latest.deal_date IS NULL 
                  OR (bd_latest.deal_date IS NOT NULL AND bd_latest.deal_date >= ld_latest.deal_date)
                THEN 'building'
              ELSE 'land'
            END AS dealType,
            ra.relTotalArea   AS relTotalArea,
            ra.relTotalPrice  AS relTotalPrice,
            ra.relWeightedFar      AS relWeightedFar,
            ra.relWeightedBcr      AS relWeightedBcr,
            ra.relParcelCount AS relParcelCount
          FROM land_info li
          LEFT JOIN land_char_latest lc
            ON lc.id = li.id
          LEFT JOIN leg_land_usage_ratio llur
            ON lc.usage1_name = llur.name
          LEFT JOIN address_polygon ap
            ON ap.id = li.id
          /* 최신 거래가 1행씩 되도록 윈도우 사용 (필요시 아래 주석의 대안 참고) */
          LEFT JOIN (
            SELECT id, deal_date, price
            FROM (
              SELECT 
                id,
                deal_date,
                price,
                ROW_NUMBER() OVER (PARTITION BY id ORDER BY deal_date DESC) AS rn
              FROM building_deal_list
            ) t
            WHERE t.rn = 1
          ) AS bd_latest
            ON bd_latest.id = li.id
          LEFT JOIN (
            SELECT id, deal_date, price
            FROM (
              SELECT 
                id,
                deal_date,
                price,
                ROW_NUMBER() OVER (PARTITION BY id ORDER BY deal_date DESC) AS rn
              FROM land_deal_list
            ) t
            WHERE t.rn = 1
          ) AS ld_latest
            ON ld_latest.id = li.id
          CROSS JOIN rel_agg ra
          WHERE li.id = ?;
        `,
        [landId, landId]
      )
      console.log('landInfo ', landInfo)
      console.log('currBuildingList ', buildingList)

      const curLandInfo = landInfo[0];
      
      const curBuildingInfo = (buildingList && buildingList.length > 0) ? buildingList[0] : null;
      const curBuildingFar = curBuildingInfo?.floorAreaRatio ? parseFloat(curBuildingInfo.floorAreaRatio) : 0.00; // 용적률

      const curBuildingUseApprovalDate = curBuildingInfo?.useApprovalDate.trim(); // 준공연도 
      const curBuildingAge = curBuildingUseApprovalDate ? getBuildingAge(curBuildingUseApprovalDate) : 40; // 준공연도가 없으면 건물노후(40년)로 설정

      // const curBuildingTotalFloorArea = curBuildingInfo?.totalFloorArea ? parseFloat(curBuildingInfo.totalFloorArea) : 0.00;
      const curBuildingTotalFloorArea = buildingList?.reduce((total, building) => total + (building.totalFloorArea ? parseFloat(building.totalFloorArea) : 0.00), 0.00);
      // console.log('buildingAge ', buildingAge)
      // console.log('floorAreaRatio ', floorAreaRatio)
      // console.log('buildingTotalFloorArea ', buildingTotalFloorArea)

      if(debug){
        devDetailInfo.debugExtraInfo = [];
        if(!curBuildingUseApprovalDate){
          devDetailInfo.debugExtraInfo.push(`* 건축물 대장에 준공년도가 없어 건물노후 40년으로 설정`);
        }
        devDetailInfo.debugExtraInfo.push(`건물 준공연도: ${curBuildingUseApprovalDate || '-'} (건물노후 ${curBuildingAge}년)`);
        devDetailInfo.debugExtraInfo.push(`건물 개수: ${buildingList?.length || 0}개`);
        devDetailInfo.debugExtraInfo.push(`건물 총 연면적: ${curBuildingTotalFloorArea.toFixed(2)}`);
        devDetailInfo.debugExtraInfo.push(`건물 용적률: ${curBuildingFar.toFixed(2)}%`);
        devDetailInfo.debugExtraInfo.push(`=> 개발후 용적률: ${Number(curLandInfo.relWeightedFar).toFixed(0)}%`);
        
      }
    
      console.log('env ', process.env.NODE_ENV)

      if(debug){
        devDetailInfo.debugExtraInfo.push(`✨ 추천`);
      }
      if(curBuildingInfo){
        if(curBuildingAge < 10){
          if(curBuildingFar < (curLandInfo.relWeightedFar * 0.5)){
            console.log('10년 미만 신축 !!')
            if(debug){
              devDetailInfo.debugExtraInfo.push(`준공 10년 미만에 현재 건물 용적률 ${curBuildingFar}이 개발후 용적률의 (50%) ${curLandInfo.relWeightedFar * 0.5}보다 작아 신축을 추천`);
            }
            makeReportValue(devDetailInfo.build, 'A', 'build');
            makeReportValue(devDetailInfo.remodel, 'C', 'remodel');
            makeReportValue(devDetailInfo.rent, 'B', 'rent');
          }else{
            if(debug){
              devDetailInfo.debugExtraInfo.push(`준공 10년 미만에 현재 건물 용적률 ${curBuildingFar}이 개발후 용적률의 (50%) ${curLandInfo.relWeightedFar * 0.5}보다 크므로 임대를 추천`);
            }
            console.log('10년 미만 미개발 !!')
            makeReportValue(devDetailInfo.build, 'B', 'build');
            makeReportValue(devDetailInfo.remodel, 'C', 'remodel');
            makeReportValue(devDetailInfo.rent, 'A', 'rent');
          }
        }else if(curBuildingAge < 20){
          if(curBuildingFar < (curLandInfo.relWeightedFar * 0.5)){
            console.log('20년 미만 신축 !!')
            if(debug){
              devDetailInfo.debugExtraInfo.push(`준공 20년 미만에 현재 건물 용적률 ${curBuildingFar}이 개발후 용적률의 (50%) ${curLandInfo.relWeightedFar * 0.5}보다 작아 신축을 추천`);
            }
            makeReportValue(devDetailInfo.build, 'A', 'build');
            makeReportValue(devDetailInfo.remodel, 'B', 'remodel');
            makeReportValue(devDetailInfo.rent, 'C', 'rent');
          }else{
            console.log('20년 미만 리모델링 !!')
            if(debug){
              devDetailInfo.debugExtraInfo.push(`준공 20년 미만에 현재 건물 용적률 ${curBuildingFar}%이 개발후 용적률의 (50%) ${curLandInfo.relWeightedFar * 0.5}%보다 크므로 리모델링을 추천`);
            }
            makeReportValue(devDetailInfo.build, 'B', 'build');
            makeReportValue(devDetailInfo.remodel, 'A', 'remodel');
            makeReportValue(devDetailInfo.rent, 'C', 'rent');
          }
        }else if(curBuildingAge < 30){
          if(curBuildingFar < (curLandInfo.relWeightedFar * 0.8)){
            console.log('30년 미만 신축 !!')
            if(debug){
              devDetailInfo.debugExtraInfo.push(`준공 30년 미만에 현재 건물 용적률 ${curBuildingFar}%이 개발후 용적률의 (80%) ${curLandInfo.relWeightedFar * 0.8}%보다 작아 신축을 추천`);
            }
            makeReportValue(devDetailInfo.build, 'A', 'build');
            makeReportValue(devDetailInfo.remodel, 'B', 'remodel');
            makeReportValue(devDetailInfo.rent, 'C', 'rent');
          }else{
            console.log('30년 미만 리모델링 !!')
            if(debug){
              devDetailInfo.debugExtraInfo.push(`준공 30년 미만에 현재 건물 용적률 ${curBuildingFar}%이 개발후 용적률의 (80%) ${curLandInfo.relWeightedFar * 0.8}%보다 크므로 리모델링을 추천`);
            }
            makeReportValue(devDetailInfo.build, 'B', 'build');
            makeReportValue(devDetailInfo.remodel, 'A', 'remodel');
            makeReportValue(devDetailInfo.rent, 'C', 'rent');
          }
        }else{
          // 30년 이상
          console.log('30년 이상 신축 !!')
          if(debug){
            devDetailInfo.debugExtraInfo.push(`준공 30년 이상은 신축을 추천`);
          }
          makeReportValue(devDetailInfo.build, 'A', 'build');
          makeReportValue(devDetailInfo.remodel, 'C', 'remodel');
          makeReportValue(devDetailInfo.rent, 'C', 'rent');
        }          
      }else{
        if(debug){
          devDetailInfo.debugExtraInfo.push(`건물이 없어 신축을 추천`);
        }
        makeReportValue(devDetailInfo.build, 'A', 'build');
        devDetailInfo.remodel = null;
        devDetailInfo.rent = null;
        // makeReportValue(aiReport.remodel, 'C', 'remodel');
        // makeReportValue(aiReport.rent, 'C', 'rent');
      }

      const aroundRentInfo = await db.query<any>(
        `WITH filtered AS (
            SELECT
                n.floor_type,
                -- 평당 임대료 = rent_price / (전용면적 평)
                (n.rent_price / (CAST(n.excl_area AS DECIMAL(10,4)) * 0.3025)) AS rent_per_py,
                ST_Distance_Sphere(POINT(?, ?), POINT(n.lng, n.lat)) AS distance_m
            FROM naver_rent_info AS n
            WHERE ST_Distance_Sphere(POINT(?, ?), POINT(n.lng, n.lat)) <= ?
          )
          SELECT DISTINCT
              floor_type,
              PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rent_per_py) 
                  OVER (PARTITION BY floor_type) AS median_rent_per_py
          FROM filtered
          ORDER BY floor_type;
          `,
        [curLandInfo.lng, curLandInfo.lat, curLandInfo.lng, curLandInfo.lat, RENT_CANDIDATE_RADIUS]
      )

      console.log('aroundRentInfo ', aroundRentInfo)

      makeBuildInfo(devDetailInfo, curLandInfo.relTotalArea, curLandInfo.relWeightedFar, curLandInfo.relWeightedBcr, debug);
      // console.log('aiReport.buildInfo ', aiReport.buildInfo);

      // 1층 평균 평당 임대료
      let firstFloorRentProfitPerPy = aroundRentInfo.find((info: any) => info.floor_type === '1')?.median_rent_per_py;
      // 2층이상 평균 평당 임대료
      let upperFloorRentProfitPerPy = aroundRentInfo.find((info: any) => info.floor_type === '2')?.median_rent_per_py;
      // 지하층 평균 평당 임대료
      let baseFloorRentProfitPerPy = aroundRentInfo.find((info: any) => info.floor_type === '3')?.median_rent_per_py;

      // console.log('firstFloorRentProfitPerPy ', firstFloorRentProfitPerPy)
      // console.log('upperFloorRentProfitPerPy ', upperFloorRentProfitPerPy)
      // console.log('baseFloorRentProfitPerPy ', baseFloorRentProfitPerPy)
      
      firstFloorRentProfitPerPy = (firstFloorRentProfitPerPy || upperFloorRentProfitPerPy || baseFloorRentProfitPerPy || 0) * 10000;
      upperFloorRentProfitPerPy = (upperFloorRentProfitPerPy || firstFloorRentProfitPerPy || baseFloorRentProfitPerPy || 0) * 10000;
      baseFloorRentProfitPerPy = (baseFloorRentProfitPerPy || upperFloorRentProfitPerPy || firstFloorRentProfitPerPy || 0) * 10000;
      if(debug){
        devDetailInfo.debugExtraInfo.push(`---`);
        devDetailInfo.debugExtraInfo.push(`💰 주변 평당 임대료`);
        devDetailInfo.debugExtraInfo.push(`1층: ${Number(Number(firstFloorRentProfitPerPy).toFixed(0)).toLocaleString()}원`);
        devDetailInfo.debugExtraInfo.push(`2층 이상: ${Number(Number(upperFloorRentProfitPerPy).toFixed(0)).toLocaleString()}원`);
        devDetailInfo.debugExtraInfo.push(`지하층: ${Number(Number(baseFloorRentProfitPerPy).toFixed(0)).toLocaleString()}원`);
      }
      if(debug){
        devDetailInfo.debugExtraInfo.push(`---`);
        devDetailInfo.debugExtraInfo.push(`🧾 세금`);

      }

      devDetailInfo.tax.propertyTax = getPropertyTax(curLandInfo.relTotalPrice, curLandInfo.relTotalArea, debug, devDetailInfo.debugExtraInfo);
      if(debug){
        devDetailInfo.debugExtraInfo.push(`<재산세(건물)> ${devDetailInfo.tax.propertyTaxForBuilding}원 (작업중..)`);
        devDetailInfo.debugExtraInfo.push(`<종합부동산세> ${devDetailInfo.tax.comprehensiveRealEstateTax}원 (작업중..)`);
        

      }
      // devDetailInfo.tax.propertyTaxForBuilding = getPropertyTaxForBuilding(taxBase);
      
      ////////////////////////////////////////////////////////////////
      // 신축 
      if(devDetailInfo.build){
        if(debug){
          devDetailInfo.debugBuildInfo = [];
          devDetailInfo.debugBuildInfo.push(`============================================`);
          devDetailInfo.debugBuildInfo.push(`🏢 신축`);
        }
        devDetailInfo.build.duration = getBuildProjectDuration(devDetailInfo.buildInfo.upperFloorArea + devDetailInfo.buildInfo.lowerFloorArea, debug, devDetailInfo.debugBuildInfo);
  
        makeLandCost(devDetailInfo.build.landCost, estimatedPrice, debug, devDetailInfo.debugBuildInfo);
        makeProjectCost(
          devDetailInfo.build.projectCost,
          curBuildingTotalFloorArea,
          devDetailInfo.buildInfo.upperFloorArea + devDetailInfo.buildInfo.lowerFloorArea,
          devDetailInfo.build.duration,
          false,
          debug,
          devDetailInfo.debugBuildInfo
        );
        devDetailInfo.build.loan = makeLoan(devDetailInfo.build, debug, devDetailInfo.debugBuildInfo);
        // devDetailInfo.build.loanForOwner = makeLoanForOwner(devDetailInfo.build, debug, devDetailInfo.debugExtraInfo);
        makeProfit(
          'build',
          devDetailInfo.build,
          devDetailInfo.buildInfo,
          buildingList,
          firstFloorRentProfitPerPy,
          upperFloorRentProfitPerPy,
          baseFloorRentProfitPerPy,
          debug,
          devDetailInfo.debugBuildInfo
        );
        devDetailInfo.build.result = makeResult(devDetailInfo.build, devDetailInfo.tax, debug, devDetailInfo.debugBuildInfo);
      }
      // console.log('aiReport.build.projectCost ', aiReport.build.projectCost);
      
      ////////////////////////////////////////////////////////////////
      // 리모델링   
      if(devDetailInfo.remodel){
        if(debug){
          devDetailInfo.debugRemodelInfo = [];
          devDetailInfo.debugRemodelInfo.push(`============================================`);
          devDetailInfo.debugRemodelInfo.push(`🔨리모델링`);
        }
        devDetailInfo.remodel.duration = getRemodelProjectDuration(devDetailInfo.buildInfo.upperFloorArea + devDetailInfo.buildInfo.lowerFloorArea, debug, devDetailInfo.debugRemodelInfo);
        makeLandCost(devDetailInfo.remodel.landCost, estimatedPrice, debug, devDetailInfo.debugRemodelInfo);
        makeProjectCost(
          devDetailInfo.remodel.projectCost,
          curBuildingTotalFloorArea,
          devDetailInfo.buildInfo.upperFloorArea + devDetailInfo.buildInfo.lowerFloorArea,
          devDetailInfo.remodel.duration,
          true,
          debug,
          devDetailInfo.debugRemodelInfo
        );
        devDetailInfo.remodel.loan = makeLoan(devDetailInfo.remodel, debug, devDetailInfo.debugRemodelInfo);
        // devDetailInfo.remodel.loanForOwner = makeLoanForOwner(devDetailInfo.remodel, debug, devDetailInfo.debugExtraInfo);
        makeProfit(
          'remodel',
          devDetailInfo.remodel,
          devDetailInfo.buildInfo,
          buildingList,
          firstFloorRentProfitPerPy,
          upperFloorRentProfitPerPy,
          baseFloorRentProfitPerPy,
          debug,
          devDetailInfo.debugRemodelInfo
        );
        devDetailInfo.remodel.result = makeResult(devDetailInfo.remodel, devDetailInfo.tax, debug, devDetailInfo.debugRemodelInfo);
      }
      ////////////////////////////////////////////////////////////////
      // 임대
      if(devDetailInfo.rent){
        if(debug){
          devDetailInfo.debugRentInfo = [];
          devDetailInfo.debugRentInfo.push(`============================================`);
          devDetailInfo.debugRentInfo.push(`⛺ 임대`);
        }
        // aiReport.rent.duration = getRentProjectDuration(aiReport.buildInfo.upperFloorArea + aiReport.buildInfo.lowerFloorArea);
        makeLandCost(devDetailInfo.rent.landCost, estimatedPrice, debug, devDetailInfo.debugRentInfo);
        // makeProjectCost(
        //   aiReport.rent.projectCost,
        //   building?.totalFloorArea || 0,
        //   aiReport.buildInfo.upperFloorArea + aiReport.buildInfo.lowerFloorArea,
        //   aiReport.rent.duration,
        //   false
        // );
        devDetailInfo.rent.loan = makeLoan(devDetailInfo.rent, debug, devDetailInfo.debugRentInfo);
        // devDetailInfo.rent.loanForOwner = makeLoanForOwner(devDetailInfo.rent, debug, devDetailInfo.debugExtraInfo);
        makeProfit(
          'rent',
          devDetailInfo.rent,
          devDetailInfo.buildInfo,
          buildingList,
          firstFloorRentProfitPerPy,
          upperFloorRentProfitPerPy,
          baseFloorRentProfitPerPy,
          debug,
          devDetailInfo.debugRentInfo
        );
        devDetailInfo.rent.result = makeResult(devDetailInfo.rent, devDetailInfo.tax, debug, devDetailInfo.debugRentInfo);
      }



      // TODO : 건물과세는 건축물 시가표준액으로 계산해야 함 
      // aiReport.tax.propertyTaxForBuilding = getPropertyTax(taxBase);
      // TODO : 종합부동산세 계산 
      // aiReport.tax.comprehensiveRealEstateTax = getComprehensiveRealEstateTax(taxBase);
      

      // console.log('aiReport', aiReport);

      
      return {
        landInfo : curLandInfo,
        buildingList : buildingList,
        devDetailInfo,
      };
        
  }
  
  static async getAIReport(landId: string, estimatedPrice: EstimatedPrice): Promise<AIReportResult | null> {
    try {
      console.log('getAIReport ', landId, estimatedPrice)

      const {
        landInfo,
        buildingList,
        devDetailInfo
      } = await this.makeDevDetailInfo(landId, estimatedPrice);

      console.log('devDetailInfo', devDetailInfo)
      const aiReportResult: AIReportResult = {
        rent: devDetailInfo.rent?.result || null,
        remodel: devDetailInfo.remodel?.result || null,
        build: devDetailInfo.build?.result || null,
        analysisMessage: devDetailInfo.analysisMessage,
        summary: '',
      };

      const input = `"""
          아래 데이터를 참고해서 설명글 작성해줘 
          추정가 : ${krwUnit(estimatedPrice.estimatedPrice, true)}
          주소 : ${landInfo.legDongName + ' ' + landInfo.jibun}
          주용도 : ${landInfo.usageName}
          대지면적 : ${landInfo.relTotalArea}
          공시지가 : ${krwUnit(landInfo.price, true)}원 / m2
          최대용적율 : ${landInfo.relWeightedFar} %
          최대건폐율 : ${landInfo.relWeightedBcr} %
          최근거래정보 : ${landInfo.dealPrice ? ('가격 - ' + (krwUnit(landInfo.dealPrice * 10000, true)) + ', 거래일 - ' + landInfo.dealDate + ', 거래유형 - ' + (landInfo.dealType === 'land' ? '토지' : '건물')) : '없음'}
          현재빌딩정보 : ${(buildingList && buildingList.length > 0) ? '사용승인일 - ' + buildingList[0].useApprovalDate + ', 지상층수 - ' + buildingList[0].gndFloorNumber + ', 지하층수 - ' + buildingList[0].baseFloorNumber : '없음'}
          신축시 개발 가능 층수 : ${devDetailInfo.buildInfo.upperFloorCount + devDetailInfo.buildInfo.lowerFloorCount}
          신축정보 : ${reportValueToJsonString(devDetailInfo.build, aiReportResult.build)}
          리모델링정보 : ${reportValueToJsonString(devDetailInfo.remodel, aiReportResult.remodel)}
          임대정보 : ${reportValueToJsonString(devDetailInfo.rent, aiReportResult.rent)}
             """`;

        // const input = `"""
        //   아래 데이터를 참고해서 설명글 작성해줘 
        //   추정가 : ${estimatedPrice.estimatedPrice}
        //   토지정보 : ${JSON.stringify(land)}
        //   현재빌딩정보 : ${JSON.stringify(building)}
        //   계산결과값 : ${JSON.stringify(aiReport)}
        //   최종결과 : ${JSON.stringify(aiReportResult)}
        // """`;        
      // console.log(input);



      const response = await client.responses.create({
        model: "gpt-4o-mini",
        instructions: INSTRUCTION_PROMPT,
        input: input,
      });
          

      // console.log(response.output_text);
      const outputJson = JSON.parse(response.output_text);
      aiReportResult.analysisMessage = outputJson.answer;
      aiReportResult.summary = outputJson.summary;

      return aiReportResult;
    } catch (error) {
      // console.error('Error getting AI report:', error);
      throw error;
    }
  }
 
  static async getAIReportDetail(landId: string, estimatedPrice: EstimatedPrice): Promise<AIReportDetail | null> {
    try {

      console.log('getAIReportDetail', landId, estimatedPrice)

      const {
        landInfo,
        buildingList,
        devDetailInfo
      } = await this.makeDevDetailInfo(landId, estimatedPrice);
      const {remodel, build, rent} = devDetailInfo;
      const valueArray = [remodel, build, rent].sort((a, b) => b.grade > a.grade ? -1 : 1);
      const resultType = valueArray[0] === remodel ? 'remodel' : valueArray[0] === build ? 'build' : 'rent';
      const resultValue = valueArray[0];
      const result = {
        type: resultType,
        landInfo,
        buildingList,
        value: resultValue,
        tax : devDetailInfo.tax,
        result: {
          grade: resultValue.grade,
          initialCapital: resultValue.result.initialCapital,
          investmentCapital: resultValue.result.investmentCapital,
          annualProfit: resultValue.result.annualProfit,
          rentProfitRatio: resultValue.result.rentProfitRatio,
          investmentProfitRatio: resultValue.result.investmentProfitRatio,
          expectedSaleAmount: resultValue.result.expectedSaleAmount
        },
        buildInfo: devDetailInfo.buildInfo,
      } as AIReportDetail;

      console.log('getAIReportDetail result', result)

      return result;
    } catch (error) {
      // console.error('Error getting AI report:', error);
      throw error;
    }
  }


  static async getAIReportDebugInfo(
    landId: string,
    estimatedPrice: EstimatedPrice
  ): Promise<{
    landInfo: LandData;
    buildingList: BuildingData[];
    devDetailInfo: DevDetailInfo;
  } | null> {
    try {

      console.log('getAIReportDetailDebugInfo ', landId, estimatedPrice)

      const {
        landInfo,
        buildingList,
        devDetailInfo
      } = await this.makeDevDetailInfo(landId, estimatedPrice, true);
      const result = {
        landInfo,
        buildingList,
        devDetailInfo,
      } as AIReportDebugInfo;

      console.log('getAIReportDetail result', result)

      return result;
    } catch (error) {
      // console.error('Error getting AI report:', error);
      throw error;
    }
  }  
}

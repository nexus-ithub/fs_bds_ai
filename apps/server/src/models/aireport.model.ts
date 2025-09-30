import { db } from '../utils/database';
import { AIReportInfo, AIReportResult, BuildInfo, BuildingInfo, EstimatedPrice, LandCost, LandInfo, Loan, PolygonInfo, ProjectCost, ProjectDuration, ReportValue, TaxInfo } from '@repo/common';


const RENT_CANDIDATE_RADIUS = 1000;


const BASE_FLOOR_AREA_RATIO = 0.85; // 대지대비지하비율 0.85 
const ACQUISITION_COST_RATIO = 0.047; // 취득세 + 법무사비 비율 
const AGENT_FEE_RATIO = 0.009; // 중개보수 비율 
const PM_FEE_PER_MONTH = 25000000; // PM 용역비 월단위 
const ACQUISITION_TAX_RATIO = 0.032; // 취득세 비율 
const RESERVE_FEE_RATIO = 0.01; // 예비비 비율 


const LOAN_RATIO = 0.7;
const LOAN_INTEREST_RATIO = 0.035;

const LOAN_RATIO_FOR_OWNER = 0.8;
const LOAN_INTEREST_RATIO_FOR_OWNER = 0.035;

const FAIR_MARKET_RATIO = 0.7; // 공정시장가 비율 

const getBuildProjectDuration = (floorArea : number) => {
  const areaPerPy = floorArea * 0.3025;
  if(areaPerPy < 500){
    return {
      planningDurationMonths: 1.5,
      designDurationMonths: 6,
      constructionDurationMonths: 12
    }
  }else if(areaPerPy < 1500){
    return {
      planningDurationMonths: 2,
      designDurationMonths: 8,
      constructionDurationMonths: 16
    }
  }else{
    return {
      planningDurationMonths: 3,
      designDurationMonths: 9,
      constructionDurationMonths: 22
    }
  }
}

const getRemodelProjectDuration = (floorArea : number) => {
  const areaPerPy = floorArea * 0.3025;
  if(areaPerPy < 500){
    return {
      planningDurationMonths: 1.5,
      designDurationMonths: 6,
      constructionDurationMonths: 6
    }
  }else if(areaPerPy < 1500){
    return {
      planningDurationMonths: 2,
      designDurationMonths: 8,
      constructionDurationMonths: 10
    }
  }else{
    return {
      planningDurationMonths: 3,
      designDurationMonths: 9,
      constructionDurationMonths: 16
    }
  }
}


const getDefaultPublicArea = (floorArea : number) => {

  // m2 면적으로 계산 
  if (floorArea < 500) {
    return 20;
  } else if (floorArea < 1000) {
    return 40;
  }

  return 70;
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
    if(areaPerPy < 5000000){
      return 20000;
    }else if(areaPerPy < 15000000){
      return 40000;
    }else{
      return 70000;
    }
  }else if(type === 'remodel'){
    if(areaPerPy < 5000000){
      return 18000;
    }else if(areaPerPy < 15000000){
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

const getPropertyTax = (taxBase : number) => {
  // 아래 링크 참고 
  // "사업용토지"를 기준으로 계산 
  // https://xn--989a00af8jnslv3dba.com/%EC%9E%AC%EC%82%B0%EC%84%B8

  let propertyTax = 0;
  if(taxBase <= 200000000){ 
    // 2억 이하 : 과세표준 x 0.20%
    propertyTax = taxBase * 0.002;
  }else if (taxBase <= 1000000000){
    // 10억 이하 : 400000 + (과세표준 - 2억) x 0.3% 
    propertyTax = 400000 + (taxBase - 200000000) * 0.003;
  }else{
    // 10억 초과 : 2800000 + (과세표준 - 10억) x 0.4%
    propertyTax = 2800000 + (taxBase - 1000000000) * 0.004;
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
  report.message = 'AI 메세지 메세지 메세지 메세지.....';
}


function makeLandCost(landCost : LandCost, estimatedPrice : EstimatedPrice){
  landCost.purchaseCost = estimatedPrice.estimatedPrice;
  landCost.acquisitionCost = estimatedPrice.estimatedPrice * ACQUISITION_COST_RATIO; // 취득세 + 법무사비
  landCost.agentFee = estimatedPrice.estimatedPrice * AGENT_FEE_RATIO; // 중개보수
}



function makeBuildInfo(buildInfo : BuildInfo, area : number, far : number, bcr : number){

  buildInfo.buildingArea = area * (bcr / 100);
  buildInfo.upperFloorArea = area * (far / 100);
  
  buildInfo.publicAreaPerFloor = getDefaultPublicArea(buildInfo.upperFloorArea);

  buildInfo.upperFloorCount = Math.ceil(Number(buildInfo.upperFloorArea) / Number(buildInfo.buildingArea));
  buildInfo.lowerFloorCount = 1; // 지하층수는 1로 고정 
  buildInfo.lowerFloorArea = area * buildInfo.lowerFloorCount * BASE_FLOOR_AREA_RATIO;

  buildInfo.firstFloorExclusiveArea = buildInfo.buildingArea - (buildInfo.publicAreaPerFloor);
  buildInfo.secondFloorExclusiveArea = buildInfo.upperFloorArea - buildInfo.firstFloorExclusiveArea - (buildInfo.publicAreaPerFloor * (buildInfo.upperFloorCount - 1));
  buildInfo.lowerFloorExclusiveArea = buildInfo.lowerFloorArea - (buildInfo.publicAreaPerFloor * buildInfo.lowerFloorCount);
}


function makeProjectCost(projectCost : ProjectCost, currentFloorArea : number, totalFloorArea : number, projectDuration : ProjectDuration, remodeling : boolean){
  console.log('makeProjectCost ', currentFloorArea, totalFloorArea, projectDuration, remodeling);
  
  if(remodeling){
    projectCost.demolitionCost = 0;
    projectCost.demolitionManagementCost = 0;
  }else{
    projectCost.demolitionCost = currentFloorArea * 0.3025 * getDemolitionCostPerPy(currentFloorArea);
    projectCost.demolitionManagementCost = currentFloorArea * 0.3025 * getDemolitionManagementCost(currentFloorArea);
  }

  projectCost.constructionDesignCost = totalFloorArea * 0.3025 * getConstructionDesignCostPerPy(totalFloorArea);

  if(remodeling){
    projectCost.constructionCost = totalFloorArea * 0.3025 * getRemodelingCostPerPy(totalFloorArea);
  }else{
    projectCost.constructionCost = totalFloorArea * 0.3025 * getConstructionCostPerPy(totalFloorArea);
  }
  
  projectCost.managementCost = projectCost.constructionDesignCost * 0.7;
  
  projectCost.pmFee = (projectDuration.planningDurationMonths + projectDuration.designDurationMonths + projectDuration.constructionDurationMonths) * PM_FEE_PER_MONTH;
  
  const totalProjectCost = projectCost.demolitionCost + projectCost.demolitionManagementCost + projectCost.constructionDesignCost + projectCost.constructionCost + projectCost.managementCost + projectCost.pmFee;
  projectCost.acquisitionTax = totalProjectCost * ACQUISITION_TAX_RATIO;
  projectCost.reserveFee = totalProjectCost * RESERVE_FEE_RATIO;

}


function makeLoan(value : ReportValue){
  const loanAmount = (
    value.projectCost.demolitionCost +
    value.projectCost.demolitionManagementCost +
    value.projectCost.constructionDesignCost +
    value.projectCost.constructionCost +
    value.projectCost.managementCost +
    value.projectCost.pmFee + 
    (value.landCost.purchaseCost + value.landCost.acquisitionCost + value.landCost.agentFee)
  ) * LOAN_RATIO;
  const loanInterest = loanAmount * ((value.duration.planningDurationMonths + value.duration.designDurationMonths + value.duration.constructionDurationMonths) / 12) * LOAN_INTEREST_RATIO;

  return {
    loanAmount,
    loanInterest
  }
}


function makeLoanForOwner(value: ReportValue) { // landCost에 대한 정보를 loan에 반영
  const loanAmount = (
    value.projectCost.demolitionCost +
    value.projectCost.demolitionManagementCost +
    value.projectCost.constructionDesignCost +
    value.projectCost.constructionCost +
    value.projectCost.managementCost +
    value.projectCost.pmFee
  ) * LOAN_RATIO_FOR_OWNER;
  const loanInterest = value.loan.loanAmount * ((value.duration.planningDurationMonths + value.duration.designDurationMonths + value.duration.constructionDurationMonths) / 12) * LOAN_INTEREST_RATIO_FOR_OWNER;

  return {
    loanAmount,
    loanInterest
  }
}


function makeProfit(type : 'rent' | 'remodel' | 'build', value : ReportValue, buildInfo : BuildInfo, firstFloorRentProfitPerPy : number, upperFloorRentProfitPerPy : number, baseFloorRentProfitPerPy : number){
  // 월 임대료 수익 
  const rentProfit =  getRentProfitRatio(type) * (firstFloorRentProfitPerPy * (buildInfo.firstFloorExclusiveArea * 0.3025) + 
  upperFloorRentProfitPerPy * (buildInfo.secondFloorExclusiveArea * 0.3025) + 
  baseFloorRentProfitPerPy * buildInfo.lowerFloorExclusiveArea * 0.3025) // 임대료 

  // 월 관리비 수익 (1/2 만 수익으로 계산)
  const managementProfit = 
    (getManagementCostPerPy(buildInfo.upperFloorArea + buildInfo.lowerFloorArea, type) 
    * (buildInfo.upperFloorArea + buildInfo.lowerFloorArea) * 0.3025) / 2;

  value.annualRentProfit = rentProfit * 12;  
  value.annualManagementProfit = managementProfit * 12;
  value.annualDepositProfit = rentProfit * 10;

  
}

function calculateInitialCapital(value : ReportValue){
  return (value.landCost.purchaseCost) 
            + value.landCost.acquisitionCost 
            + value.landCost.agentFee + ((value.landCost.purchaseCost) - (value.loan.loanAmount));
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
    - value.loan.loanAmount - value.annualDepositProfit;
}


function calculateaAnnualProfit(value : ReportValue, tax : TaxInfo){
  return value.annualRentProfit + value.annualManagementProfit - (tax.propertyTax + tax.propertyTaxForBuilding + tax.comprehensiveRealEstateTax - value.loan.loanInterest);
}


function newReportValue(): ReportValue {
  return {
    grade: '',  
    message: '',
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
      loanInterest: 0
    },
    loanForOwner: {
      loanAmount: 0,
      loanInterest: 0
    },
    annualRentProfit: 0,
    annualDepositProfit: 0,
    annualManagementProfit: 0,
  };
}


export class AIReportModel {

  
  static async getAIReport(landId: string, buildingId: string, estimatedPrice: EstimatedPrice): Promise<AIReportResult | null> {
    try {

      let buildingInfo = null;
      if(buildingId){
        buildingInfo = await db.query<any>(
          `SELECT 
            building_id AS id,
            floor_area_ratio AS floorAreaRatio,
            use_approval_date AS useApprovalDate,
            total_floor_area AS totalFloorArea
            FROM building_leg_headline
            WHERE building_id = ?`,
          [buildingId]
        )        
      }

      const landInfo = await db.query<any>(
        `SELECT 
          land_info.id AS id,
          land_info.area AS area,
          land_char.usage1_name AS usageName,
          land_char.price AS price,
          leg_land_usage_ratio.far,
          leg_land_usage_ratio.bcr,
          polygon.lat,
          polygon.lng
          FROM land_info AS land_info
          LEFT JOIN land_char_info AS land_char
            ON land_char.key = (
              SELECT c.key 
              FROM land_char_info AS c 
              WHERE c.id = land_info.id 
              ORDER BY c.create_date DESC 
              LIMIT 1
            )
          LEFT JOIN address_polygon AS polygon
            ON polygon.id = land_info.id
          LEFT JOIN leg_land_usage_ratio AS leg_land_usage_ratio
            ON land_char.usage1_name = leg_land_usage_ratio.name
          WHERE land_info.id = ?`,
        [landId]
      )   


      console.log('landInfo ', landInfo)
      console.log('buildingInfo ', buildingInfo)

      const land = landInfo[0];
      const building = (buildingInfo && buildingInfo.length > 0) ? buildingInfo[0] : null;
      const floorAreaRatio = building?.floorAreaRatio ? parseFloat(building.floorAreaRatio) : 0.00; // 용적률

      const useApprovalDate = building?.useApprovalDate.trim(); // 준공연도 
      const buildingAge = useApprovalDate ? getBuildingAge(useApprovalDate) : 40; // 준공연도가 없으면 노후 건물(40년)로 설정
      const buildingTotalFloorArea = building?.totalFloorArea ? parseFloat(building.totalFloorArea) : 0.00;
      
      console.log('buildingAge ', buildingAge)
      console.log('floorAreaRatio ', floorAreaRatio)
      console.log('buildingTotalFloorArea ', buildingTotalFloorArea)

      const defaultReportValue = {
        grade: '',  
        message: '',
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
          remodelingCost: 0,
          managementCost: 0,
          remodelingManagementCost: 0,
          pmFee: 0,
          acquisitionTax: 0,
          reserveFee: 0
        },
        loan: {
          loanAmount: 0,
          loanInterest: 0
        },
        loanForOwner: {
          loanAmount: 0,
          loanInterest: 0
        },
        annualRentProfit: 0,
        annualDepositProfit: 0,
        annualManagementProfit: 0,
      };

      const aiReport = {
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
      } as AIReportInfo;


      if(building){
        if(buildingAge < 10){
          if(floorAreaRatio < (land.far * 0.5)){
            console.log('10년 미만 신축 !!')
            makeReportValue(aiReport.build, 'A', 'build');
            makeReportValue(aiReport.remodel, 'C', 'remodel');
            makeReportValue(aiReport.rent, 'B', 'rent');
          }else{
            console.log('10년 미만 미개발 !!')
            makeReportValue(aiReport.build, 'B', 'build');
            makeReportValue(aiReport.remodel, 'C', 'remodel');
            makeReportValue(aiReport.rent, 'A', 'rent');
          }
        }else if(buildingAge < 20){
          if(floorAreaRatio < (land.far * 0.5)){
            console.log('20년 미만 신축 !!')
            makeReportValue(aiReport.build, 'A', 'build');
            makeReportValue(aiReport.remodel, 'B', 'remodel');
            makeReportValue(aiReport.rent, 'C', 'rent');
          }else{
            console.log('20년 미만 리모델링 !!')
            makeReportValue(aiReport.build, 'B', 'build');
            makeReportValue(aiReport.remodel, 'A', 'remodel');
            makeReportValue(aiReport.rent, 'C', 'rent');
          }
        }else if(buildingAge < 30){
          if(floorAreaRatio < (land.far * 0.8)){
            console.log('30년 미만 신축 !!')
            makeReportValue(aiReport.build, 'A', 'build');
            makeReportValue(aiReport.remodel, 'B', 'remodel');
            makeReportValue(aiReport.rent, 'C', 'rent');
          }else{
            console.log('30년 미만 리모델링 !!')
            makeReportValue(aiReport.build, 'B', 'build');
            makeReportValue(aiReport.remodel, 'A', 'remodel');
            makeReportValue(aiReport.rent, 'C', 'rent');
          }
        }else{
          // 30년 이상
          console.log('30년 이상 신축 !!')
          makeReportValue(aiReport.build, 'A', 'build');
          makeReportValue(aiReport.remodel, 'C', 'remodel');
          makeReportValue(aiReport.rent, 'C', 'rent');
        }          
      }else{
        makeReportValue(aiReport.build, 'A', 'build');
        // aiReport.remodel = null;
        // aiReport.rent = null;
        makeReportValue(aiReport.remodel, 'C', 'remodel');
        makeReportValue(aiReport.rent, 'C', 'rent');
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
        [land.lng, land.lat, land.lng, land.lat, RENT_CANDIDATE_RADIUS]
      )

      console.log('aroundRentInfo ', aroundRentInfo)

      makeBuildInfo(aiReport.buildInfo, land.area, land.far, land.bcr);
      // console.log('aiReport.buildInfo ', aiReport.buildInfo);
      
      // 1층 평균 평당 임대료
      let firstFloorRentProfitPerPy = aroundRentInfo.find((info: any) => info.floor_type === '1')?.median_rent_per_py;
      // 2층이상 평균 평당 임대료
      let upperFloorRentProfitPerPy = aroundRentInfo.find((info: any) => info.floor_type === '2')?.median_rent_per_py;
      // 지하층 평균 평당 임대료
      let baseFloorRentProfitPerPy = aroundRentInfo.find((info: any) => info.floor_type === '3')?.median_rent_per_py;

      firstFloorRentProfitPerPy = (firstFloorRentProfitPerPy || upperFloorRentProfitPerPy || baseFloorRentProfitPerPy || 0) * 10000;
      upperFloorRentProfitPerPy = (upperFloorRentProfitPerPy || firstFloorRentProfitPerPy || baseFloorRentProfitPerPy || 0) * 10000;
      baseFloorRentProfitPerPy = (baseFloorRentProfitPerPy || upperFloorRentProfitPerPy || firstFloorRentProfitPerPy || 0) * 10000;
      
      ////////////////////////////////////////////////////////////////
      // 신축 
      aiReport.build.duration = getBuildProjectDuration(aiReport.buildInfo.upperFloorArea + aiReport.buildInfo.lowerFloorArea);
      makeLandCost(aiReport.build.landCost, estimatedPrice);
      makeProjectCost(
        aiReport.build.projectCost,
        buildingTotalFloorArea,
        aiReport.buildInfo.upperFloorArea + aiReport.buildInfo.lowerFloorArea,
        aiReport.build.duration,
        false
      );
      aiReport.build.loan = makeLoan(aiReport.build);
      aiReport.build.loanForOwner = makeLoanForOwner(aiReport.build);
      makeProfit('build', aiReport.build, aiReport.buildInfo, firstFloorRentProfitPerPy, upperFloorRentProfitPerPy, baseFloorRentProfitPerPy);
      // console.log('aiReport.build.projectCost ', aiReport.build.projectCost);
      
      ////////////////////////////////////////////////////////////////
      // 리모델링   
      aiReport.remodel.duration = getRemodelProjectDuration(aiReport.buildInfo.upperFloorArea + aiReport.buildInfo.lowerFloorArea);
      makeLandCost(aiReport.remodel.landCost, estimatedPrice);
      makeProjectCost(
        aiReport.remodel.projectCost,
        buildingTotalFloorArea,
        aiReport.buildInfo.upperFloorArea + aiReport.buildInfo.lowerFloorArea,
        aiReport.remodel.duration,
        true
      );
      aiReport.remodel.loan = makeLoan(aiReport.remodel);
      aiReport.remodel.loanForOwner = makeLoanForOwner(aiReport.remodel);
      makeProfit('remodel', aiReport.remodel, aiReport.buildInfo, firstFloorRentProfitPerPy, upperFloorRentProfitPerPy, baseFloorRentProfitPerPy);
      
      ////////////////////////////////////////////////////////////////
      // 임대
      // aiReport.rent.duration = getRentProjectDuration(aiReport.buildInfo.upperFloorArea + aiReport.buildInfo.lowerFloorArea);
      makeLandCost(aiReport.rent.landCost, estimatedPrice);
      // makeProjectCost(
      //   aiReport.rent.projectCost,
      //   building?.totalFloorArea || 0,
      //   aiReport.buildInfo.upperFloorArea + aiReport.buildInfo.lowerFloorArea,
      //   aiReport.rent.duration,
      //   false
      // );
      aiReport.rent.loan = makeLoan(aiReport.rent);
      aiReport.rent.loanForOwner = makeLoanForOwner(aiReport.rent);
      makeProfit('rent', aiReport.rent, aiReport.buildInfo, firstFloorRentProfitPerPy, upperFloorRentProfitPerPy, baseFloorRentProfitPerPy);

      const taxBase = land.price * land.area * FAIR_MARKET_RATIO; // 과세표준 공정시장가 비율 공시지가 * 70%  
      aiReport.tax.propertyTax = getPropertyTax(taxBase);

      // TODO : 건물과세는 건축물 시가표준액으로 계산해야 함 
      // aiReport.tax.propertyTaxForBuilding = getPropertyTax(taxBase);
      // TODO : 종합부동산세 계산 
      // aiReport.tax.comprehensiveRealEstateTax = getComprehensiveRealEstateTax(taxBase);
      

      console.log(aiReport);

      const aiReportResult: AIReportResult = {
        rent: {
          grade: aiReport.rent.grade,
          message: aiReport.rent.message,
          initialCapital: calculateInitialCapital(aiReport.rent),
          investmentCapital: calculateInvestmentCapital(aiReport.rent),
          annualProfit: calculateaAnnualProfit(aiReport.rent, aiReport.tax),
          rentProfitRatio: calculateaAnnualProfit(aiReport.rent, aiReport.tax) / calculateInvestmentCapital(aiReport.rent),
          // assetGrowthAmount: aiReport.rent.landCost.purchaseCost * 0.045,
          investmentProfitRatio: (calculateaAnnualProfit(aiReport.rent, aiReport.tax) + (aiReport.rent.landCost.purchaseCost * 0.045)) / calculateInvestmentCapital(aiReport.rent),
          expectedSaleAmount: (aiReport.rent.annualManagementProfit + aiReport.rent.annualRentProfit) / (3.5 / 100)
        },
        remodel: {
          grade: aiReport.remodel.grade,
          message: aiReport.remodel.message,
          initialCapital: calculateInitialCapital(aiReport.remodel),
          investmentCapital: calculateInvestmentCapital(aiReport.remodel),
          annualProfit: calculateaAnnualProfit(aiReport.remodel, aiReport.tax),
          rentProfitRatio: calculateaAnnualProfit(aiReport.remodel, aiReport.tax) / calculateInvestmentCapital(aiReport.remodel),
          // assetGrowthAmount: aiReport.remodel.landCost.purchaseCost * 0.045,
          investmentProfitRatio: (calculateaAnnualProfit(aiReport.remodel, aiReport.tax) + (aiReport.remodel.landCost.purchaseCost * 0.045)) / calculateInvestmentCapital(aiReport.remodel),
          expectedSaleAmount: (aiReport.remodel.annualManagementProfit + aiReport.remodel.annualRentProfit) / (3.5 / 100),
        },
        build: {
          grade: aiReport.build.grade,
          message: aiReport.build.message,
          initialCapital: calculateInitialCapital(aiReport.build),
          investmentCapital: calculateInvestmentCapital(aiReport.build),
          annualProfit: calculateaAnnualProfit(aiReport.build, aiReport.tax),
          rentProfitRatio: calculateaAnnualProfit(aiReport.build, aiReport.tax) / calculateInvestmentCapital(aiReport.build),
          // assetGrowthAmount: aiReport.build.landCost.purchaseCost * 0.045,
          investmentProfitRatio: (calculateaAnnualProfit(aiReport.build, aiReport.tax) + (aiReport.build.landCost.purchaseCost * 0.045)) / calculateInvestmentCapital(aiReport.build),
          expectedSaleAmount: (aiReport.build.annualManagementProfit + aiReport.build.annualRentProfit) / (3.5 / 100),
        },
        analysisMessage: aiReport.analysisMessage,
      };
      return aiReportResult;
    } catch (error) {
      // console.error('Error getting AI report:', error);
      throw error;
    }
  }
 


}

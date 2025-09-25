import { db } from '../utils/database';
import { AIReportInfo, BuildingInfo, EstimatedPrice, LandInfo, PolygonInfo, ReportValue } from '@repo/common';



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



export class AIReportModel {

  
  static async getAIReport(landId: string, buildingId: string, estimatedPrice: EstimatedPrice): Promise<AIReportInfo | null> {
    try {

      let buildingInfo = null;
      if(buildingId){
        buildingInfo = await db.query<any>(
          `SELECT 
            building_id AS id,
            floor_area_ratio AS floorAreaRatio,
            use_approval_date AS useApprovalDate
            FROM building_leg_headline
            WHERE building_id = ?`,
          [buildingId]
        )        
      }

      const landInfo = await db.query<any>(
        `SELECT 
          land_info.id AS id,
          land_char.usage1_name AS usageName,
          leg_land_usage_ratio.far,
          leg_land_usage_ratio.bcr
      FROM land_info AS land_info
      LEFT JOIN land_char_info AS land_char
        ON land_char.key = (
          SELECT c.key 
          FROM land_char_info AS c 
          WHERE c.id = land_info.id 
          ORDER BY c.create_date DESC 
          LIMIT 1
        )
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

      console.log('buildingAge ', buildingAge)
      console.log('floorAreaRatio ', floorAreaRatio)
      
      const aiReport = {
        rent: {
          grade: '',  
          message: '',
        },
        remodel: {
          grade: '',  
          message: '',
        },
        build: {
          grade: '',  
          message: '',
        },
        landCost: {
          purchaseCost: 0,
          acquisitionCost: 0,
          agentFee: 0
        },
        buildingCost: {
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
        analysisMessage: 'AI 메세지 메세지 메세지 메세지.....'
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
        aiReport.remodel = null;
        aiReport.rent = null;
        
        // makeReportValue(aiReport.remodel, 'C', 'remodel');
        // makeReportValue(aiReport.rent, 'C', 'rent');
      }

      return aiReport;
    } catch (error) {
      // console.error('Error getting AI report:', error);
      throw error;
    }
  }
 


}

import { db } from '../utils/database';
import { DevDetailInfo, AIReportResult, BuildInfo, BuildingData, BuildingInfo, EstimatedPrice, LandCost, LandData, LandInfo, Loan, PolygonInfo, ProjectCost, ProjectDuration, ReportResult, ReportValue, TaxInfo, AIReportDetail, AIReportDebugInfo, RentInfo, EstimatedPriceInfo } from '@repo/common';
import OpenAI from "openai";
import { LandModel } from './land.model';
import { IS_DEVELOPMENT } from '../constants';
const client = new OpenAI({
  timeout: 20 * 1000,
});



export const getAreaStrWithPyeong = (area?: any) => {
  // console.log(area);
  if (!area) {
    return '-m² (-평)';
  }

  const areaNum = Number(area);
  // const area = Number(area);
  // return (areaNum.toFixed(1) || '-') + 'm² (' + (areaNum * 0.3025).toFixed(1) + '평)';
  const m2 = areaNum.toLocaleString('ko-KR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const pyeong = (areaNum * 0.3025).toLocaleString('ko-KR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return `${m2}m² (${pyeong}평)`;
}

export const krwUnit = (amount: number, firstUnit?: boolean) => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  if (absAmount >= 100000000) {
    const eok = absAmount / 100000000;
    // const man = (absAmount % 100000000) / 10000;
    const man = Math.floor((absAmount % 100000000) / 10000);

    if (man > 0) {
      if (firstUnit) {
        // return `${isNegative ? '-' : ''}${eok.toFixed(1)}억`;
        return `${isNegative ? '-' : ''}${Number(eok.toFixed(1)).toLocaleString()}억`;
      }
      // return `${isNegative ? '-' : ''}${Math.floor(eok)}억 ${Math.floor(man)}만원`;
      return `${isNegative ? '-' : ''}${Math.floor(eok).toLocaleString()}억 ${man.toLocaleString()}만원`;
    }
    // return `${isNegative ? '-' : ''}${Math.floor(eok)}억`;
    return `${isNegative ? '-' : ''}${Math.floor(eok).toLocaleString()}억`;
  } else if (absAmount >= 10000) {
    const man = absAmount / 10000;
    const remainder = absAmount % 10000;
    if (remainder > 0) {
      if (firstUnit) {
        // return `${isNegative ? '-' : ''}${man.toFixed(1)}만`;
        return `${isNegative ? '-' : ''}${Number(man.toFixed(1)).toLocaleString()}만`;
      }
      // return `${isNegative ? '-' : ''}${Math.floor(man)}만 ${Math.floor(remainder).toLocaleString()}원`;
      return `${isNegative ? '-' : ''}${Math.floor(man).toLocaleString()}만 ${Math.floor(remainder).toLocaleString()}원`;
    }
    // return `${isNegative ? '-' : ''}${man.toLocaleString()}만원`;
    return `${isNegative ? '-' : ''}${Math.floor(man).toLocaleString()}만원`;
  }
  return `${isNegative ? '-' : ''}${absAmount.toLocaleString()}원`;
};



// const INSTRUCTION_PROMPT = `"""
// 너는 부동산 분석 전문가로서 
// 현재 토지와 건물에 대한 내용을 아래의 예와 비슷하게 요약 해야해

// "서울 강남구 청담동 95-16은 제2종 일반주거지역에 위치한 지하 1층, 지상 4층 규모의 중소형 빌딩으로, 대지 약 101평, 연면적 약 255평입니다. 2021년 약 178억 원에 거래된 이후 꾸준한 지가 상승을 거쳐, 현재 시장 가치는 230억~250억 원 수준으로 평가됩니다.
// 노후화된 준공 연도 및 현행 건폐율·용적률을 고려할 때, 기존 건물의 유지보수보다는 신축을 통한 고도화 전략이 자산 가치 극대화의 핵심입니다. 특히 저층부 근린생활시설과 상층부 고급 주거를 혼합한 '복합 임대 전략'을 통해 안정적인 현금흐름(연 예상 임대수익 약 1.2억 원 이상) 확보가 가능할 것으로 판단됩니다.
// 다만, 제2종 일반주거지역의 법적 규제와 인동 간격 등 인허가 변수를 사전에 정밀 검토해야 하며, 공시지가 현실화에 따른 세무 리스크 및 시장 공실률 관리가 수반되어야 합니다. 종합적으로 볼 때 본 자산은 개발을 통한 Value-add 전략 수행 시 중장기적인 자산 가치 상승이 확실시되는 우량 투자 물건입니다." 

// **** 요약의 주요 조건 ****
// - 한국어로 작성
// - 고급스럽고 전문적인 톤
// - ~입니다. ~합니다 등으로 문장의 끝은 사용자에게 이야기 하듯 작성해줘
// - 건물 특징(위치, 용도, 임대료, 준공연도)을 포함하고 건물이 없으면 "현재 건축물 없는 상태"라고 작성 
// - 주용도에 따른 제한사항/고려해야할점/긍정적인면 등 지식을 동원해서 용도에 대한 이야기 작성, 만약 주용도가 
//   특별한게 없다면 작성하지 않아도 됨  
// - 등급 이야기는 하지 말고 
// - 추천이유는 "추천이유"를 기반으로 "~때문에 신축이 적합할것으로 판단됩니다."라고 작성해줘
// - 매각금액/투자금/순수익등 데이터를 설명해줘
// - 주소를 보고 지식을 동원해서 주변 랜드마크, 대중교통, 개발계획, 개발호재등의 입지의 특징을 설명해주고, 만약 주변입지가 특별한게 없다면 작성하지 않아도 됨 
// - 기타로 현재 데이터를 기반으로 추가 내용이 있다면 간단하게 첨부해도 됨


// *** 중요 *** 
// - 응답 텍스트는 너무 길지 않게 800자 이내로 작성해줘 
// - 프롬프트의 내용이 작성되지 않도록 주의 
// - 금액은 1.4억 , 2.3천만원 등으로 표시해줘 

// *** 출력 형식 ***
// 사용자의 질문에 먼저 답변을 작성하고, 그 뒤에 짧은 요약을 작성해줘.
// * 요약은 70자 이내로 작성하고 answer 를 참고해서 아래 예처림 등급 A 인 개발방향을 중점으로 서술형으로 요약 작성해줘 
// "즉시 수익 창출이 가능하고 리스크가 낮아 안정적 현금 흐름 확보에 유리한 저위험 투자처입니다."
// * 반드시 다음과 같은 JSON 형식을 지켜줘
// {"answer": "...", "summary": "..."}
// """`;

const INSTRUCTION_PROMPT = `"""
너는 부동산 분석 전문가로서 
현재 토지와 건물에 대한 내용을 아래의 예와 같이 마크다운 리스트 형태로 요약 해야해

예시: 신축의 경우
- 📍 **위치/규모:** 서울 서초구 반포동에 위치한 대지 680.6평, 지하4층~지상8층 규모의 건물입니다.
- 💰 **가치:** 추정가는 712.4억 원이며, 개발후 연간 임대수익은 약 12.24억 원으로 예상됩니다.
- 🎯 **추천 전략:** 신축을 통한 자산가치 상승이 기대됩니다.
- ✅ **장점:** 강남권과 인접하고 대중교통 접근성이 우수하며, 향후 개발로 자산가치 상승이 기대됩니다.
- ⚠️ **유의사항:** 신축시 건축 관련 법적 규제 및 인허가 변수를 사전에 정밀 검토해야 하며, 공시지가 현실화에 따른 세무 리스크 및 시장 공실률 관리가 수반되어야 합니다.

예시: 임대의 경우
- 📍 **위치/규모:** 서울 서초구 반포동에 위치한 대지 680.6평, 지하4층~지상8층 규모의 건물입니다.
- 💰 **가치:** 추정가는 712.4억 원이며, 연간 임대수익은 약 12.24억 원으로 예상됩니다.
- 🎯 **추천 전략:** 임대를 통한 안정적 수익 창출이 권장됩니다.
- ✅ **장점:** 강남권과 인접하고 대중교통 접근성이 우수하며, 향후 개발로 자산가치 상승이 기대됩니다.
- ⚠️ **유의사항:** 임대 관련 법적 규제 및 유지보수 비용에 대한 사전 검토가 필요합니다.

예시: 리모델링의 경우
- 📍 **위치/규모:** 서울 서초구 반포동에 위치한 대지 680.6평, 지하4층~지상8층 규모의 건물입니다.
- 💰 **가치:** 추정가는 712.4억 원이며, 리모델링후 연간 임대수익은 약 12.24억 원으로 예상됩니다.
- 🎯 **추천 전략:** 리모델링을 통한 자산가치 상승이 기대됩니다.
- ✅ **장점:** 강남권과 인접하고 대중교통 접근성이 우수하며, 향후 개발로 자산가치 상승이 기대됩니다.
- ⚠️ **유의사항:** 리모델링시 건축 관련 법적 규제 및 인허가 변수를 사전에 정밀 검토해야 하며, 공시지가 현실화에 따른 세무 리스크 및 시장 공실률 관리가 수반되어야 합니다.


*** 중요 *** 
- 응답 텍스트는 너무 길지 않게 800자 이내로 작성해줘 
- 프롬프트의 내용이 작성되지 않도록 주의 
- 금액은 1.4억 , 2.3천만원 등으로 표시해줘 
- 장점은 주소를 보고 지식을 동원해서 주변 랜드마크, 대중교통, 개발계획, 개발호재등의 입지의 특징을 설명해줘

*** 출력 형식 ***
사용자의 질문에 먼저 답변을 작성하고, 그 뒤에 짧은 요약을 작성해줘.
* 요약은 70자 이내로 작성하고 answer의 추천전략과 장점을 참고해서 서술형으로 요약 작성해줘 
"즉시 수익 창출이 가능하고 리스크가 낮아 안정적 현금 흐름 확보에 유리한 저위험 투자처입니다."
* 반드시 다음과 같은 JSON 형식을 지켜줘
{"answer": "...", "summary": "..."}
"""`;

const BASE_FLOOR_AREA_RATIO = 0.7; // 대지대비지하비율 0.7
const ACQUISITION_COST_RATIO = 0.047; // 취득세 + 법무사비 비율 
const AGENT_FEE_RATIO = 0.009; // 중개보수 비율 
const MANAGEMENT_FEE_RATIO = 0.7; // 감리비 비율 
const PM_FEE_PER_MONTH = 25000000; // PM 용역비 월단위 
const ACQUISITION_TAX_RATIO = 0.032; // 취득세 비율 
const RESERVE_FEE_RATIO = 0.01; // 예비비 비율 


const LOAN_RATIO = 0.7;
const LOAN_INTEREST_RATIO = 0.035;


const PARKING_FLOOR_THRESHOLD = 8.4;
const LEGAL_PARKING_AREA_PER_CAR = 134;
const PARKING_AREA_PER_CAR = 20;



const LOAN_RATIO_FOR_OWNER = 0.8;
const LOAN_INTEREST_RATIO_FOR_OWNER = 0.035;


// 세금 관련 
const FAIR_MARKET_RATIO = 0.7; // 공정시장가 비율 (토지재산세 계산시 사용)

// 아래 법령 링크에서 "가격기준액" 으로 검색하면 건축물가격기준액을 확인할 수 있음
// https://www.mois.go.kr/frt/bbs/type001/commonSelectBoardList.do?bbsId=BBSMSTR_000000000016
// const BUILDING_PRICE_INDEX_BASE = 830000; // (상업용) 건축물가격기준액 (건물기준시가 , 건물 재산세 계산시 사용)
// const BUILDING_PRICE_INDEX_BASE = [
//   { name: "주거용", value: 840000 },
//   { name: "상업용", value: 830000 },
//   { name: "공업용", value: 820000 },
//   { name: "농수산용", value: 630000 },
//   { name: "문화/복지/교육용", value: 840000 },
//   { name: "공공용", value: 830000 },
// ]

const BULILDING_PROPERTY_TAX_RATIO = 0.0025; // 건물 재산세 비율 (기타건축물)

const BUILDING_PRICE_INDEX_BASE = 830000; // DEFAULT 로 주거용 값을 사용


// 아래 법령 링크에서 "지방세 시가표준액 조사산정 기준" 으로 검색하면 건물지수등 확인 가능
// https://www.mois.go.kr/frt/bbs/type001/commonSelectBoardList.do?bbsId=BBSMSTR_000000000016

// 건축물 구조지수 (건물 재산세 계산시 사용)
const STRUCTURE_INDEX_BASE_LIST = [
  { code: "10", name: "조적구조", value: 0.90 },
  { code: "11", name: "벽돌구조", value: 0.90 },
  { code: "12", name: "블록구조", value: 0.60 },
  { code: "13", name: "석구조", value: 1.00 },
  { code: "14", name: "스틸하우스조", value: 1.00 },
  { code: "17", name: "보강콘크리트조", value: 0.95 },
  { code: "19", name: "기타조적구조", value: 0.90 },
  { code: "20", name: "콘크리트구조", value: 1.00 },
  { code: "21", name: "철근콘크리트구조", value: 1.00 },
  { code: "22", name: "프리케스트콘크리트구조", value: 1.00 },
  { code: "23", name: "철파이프조", value: 0.30 },
  { code: "24", name: "돌담 및 토담조", value: 0.35 },
  { code: "26", name: "라멘조", value: 1.00 },
  { code: "27", name: "석회 및 흙혼합 벽돌조", value: 0.35 },
  { code: "29", name: "기타콘크리트구조", value: 1.00 },
  { code: "30", name: "철골구조", value: 1.00 },
  { code: "31", name: "일반철골구조", value: 1.00 },
  { code: "32", name: "경량철골구조", value: 0.65 },
  { code: "33", name: "강파이프구조", value: 1.00 },
  { code: "34", name: "공업화박판강구조(PEB)", value: 1.00 },
  { code: "35", name: "단일형강구조", value: 1.00 },
  { code: "36", name: "트러스구조", value: 1.00 },
  { code: "37", name: "스틸하우스조", value: 1.00 },
  { code: "39", name: "기타강구조", value: 1.00 },
  { code: "40", name: "철골철근콘크리트구조", value: 1.20 },
  { code: "41", name: "철골콘크리트구조", value: 1.20 },
  { code: "42", name: "철골철근콘크리트구조", value: 1.20 },
  { code: "43", name: "철골철근콘크리트합성구조", value: 1.20 },
  { code: "49", name: "기타철골철근콘크리트구조", value: 1.20 },
  { code: "50", name: "목구조", value: 1.25 },
  { code: "51", name: "일반목구조", value: 0.83 },
  { code: "52", name: "통나무구조", value: 1.35 },
  { code: "53", name: "트러스목구조", value: 0.83 },
  { code: "60", name: "블럭/판넬조", value: 0.55 },
  { code: "61", name: "시멘트블럭조", value: 0.60 },
  { code: "63", name: "조립식판넬조", value: 0.55 },
  { code: "70", name: "벽돌/컨테이너조", value: 0.30 },
  { code: "72", name: "흙벽돌조", value: 0.35 },
  { code: "74", name: "컨테이너조", value: 0.30 },
  { code: "80", name: "막구조", value: 0.30 },
  { code: "81", name: "막구조", value: 0.30 },
  { code: "90", name: "기타구조", value: 1.00 },
  { code: "99", name: "기타구조", value: 1.00 },
];


// 건축물 용도지수 (건물 재산세 계산시 사용)
const BUILDING_USAGE_INDEX_BASE = 1.12; // DEFAULT 로 사무실용 건물의 값 사용 (1.12)

// 건축물 위치지수 (건물 재산세 계산시 사용)
export const getBuildingLocationIndex = (price: number): number => {
  const brackets: Array<[max: number, index: number]> = [
    [10, 0.80],     // 10천원/㎡ 이하
    [30, 0.82],     // 10초과 ~ 30이하
    [50, 0.84],     // 30초과 ~ 50이하
    [100, 0.86],    // 50초과 ~ 100이하
    [150, 0.88],    // 100초과 ~ 150이하
    [200, 0.90],    // 150초과 ~ 200이하
    [350, 0.92],    // 200초과 ~ 350이하
    [500, 0.94],    // 350초과 ~ 500이하
    [650, 0.96],    // 500초과 ~ 650이하
    [800, 0.98],    // 650초과 ~ 800이하
    [1000, 1.00],   // 800초과 ~ 1000이하
    [1200, 1.03],   // 1000초과 ~ 1200이하
    [1600, 1.06],   // 1200초과 ~ 1600이하
    [2000, 1.09],   // 1600초과 ~ 2000이하
    [2500, 1.12],   // 2000초과 ~ 2500이하
    [3000, 1.15],   // 2500초과 ~ 3000이하
    [4000, 1.18],   // 3000초과 ~ 4000이하
    [5000, 1.21],   // 4000초과 ~ 5000이하
    [6000, 1.24],   // 5000초과 ~ 6000이하
    [7000, 1.27],   // 6000초과 ~ 7000이하
    [8000, 1.30],   // 7000초과 ~ 8000이하
    [9000, 1.33],   // 8000초과 ~ 9000이하
    [10000, 1.36],  // 9000초과 ~ 10000이하
    [20000, 1.40],  // 10000초과 ~ 20000이하
    [30000, 1.45],  // 20000초과 ~ 30000이하
    [40000, 1.50],  // 30000초과 ~ 40000이하
    [50000, 1.55],  // 40000초과 ~ 50000이하
    [60000, 1.60],  // 50000초과 ~ 60000이하
    [70000, 1.63],  // 60000초과 ~ 70000이하
    [80000, 1.66],  // 70000초과 ~ 80000이하
  ];

  for (const [max, idx] of brackets) {
    if (price <= max) return idx;
  }
  return 1.69;
};


// 건축물 경과연수별 잔가율 (제19조 관련)
export const BUILDING_RESIDUAL_VALUE = [
  // ① 철골철근콘크리트조, 철근콘크리트조, 통나무조 → 50년, 0.10, 0.018
  { code: "40", name: "철골철근콘크리트구조", year: 50, minResidualRatio: 0.10, yearDiscountRatio: 0.018 },
  { code: "41", name: "철골콘크리트구조", year: 40, minResidualRatio: 0.10, yearDiscountRatio: 0.0225 },
  { code: "42", name: "철골철근콘크리트구조", year: 50, minResidualRatio: 0.10, yearDiscountRatio: 0.018 },
  { code: "43", name: "철골철근콘크리트합성구조", year: 50, minResidualRatio: 0.10, yearDiscountRatio: 0.018 },
  { code: "49", name: "기타철골철근콘크리트구조", year: 50, minResidualRatio: 0.10, yearDiscountRatio: 0.018 },
  { code: "21", name: "철근콘크리트구조", year: 50, minResidualRatio: 0.10, yearDiscountRatio: 0.018 },
  { code: "22", name: "프리케스트콘크리트구조", year: 40, minResidualRatio: 0.10, yearDiscountRatio: 0.0225 },
  { code: "26", name: "라멘조", year: 40, minResidualRatio: 0.10, yearDiscountRatio: 0.0225 },
  { code: "52", name: "통나무구조", year: 50, minResidualRatio: 0.10, yearDiscountRatio: 0.018 },

  // ② 철골콘크리트조, 석조, 프리케스트콘크리트조, 목구조 → 40년, 0.10, 0.0225
  { code: "13", name: "석구조", year: 40, minResidualRatio: 0.10, yearDiscountRatio: 0.0225 },
  { code: "50", name: "목구조", year: 40, minResidualRatio: 0.10, yearDiscountRatio: 0.0225 },
  { code: "51", name: "일반목구조", year: 40, minResidualRatio: 0.10, yearDiscountRatio: 0.0225 },
  { code: "53", name: "트러스목구조", year: 40, minResidualRatio: 0.10, yearDiscountRatio: 0.0225 },

  // ③ 철골조, 스틸하우스조, 연와조, 보강콘크리트조, 보강블록조, 황토조, 시멘트벽돌조, ALC조 등 → 30년, 0.10, 0.030
  { code: "30", name: "철골구조", year: 30, minResidualRatio: 0.10, yearDiscountRatio: 0.030 },
  { code: "31", name: "일반철골구조", year: 30, minResidualRatio: 0.10, yearDiscountRatio: 0.030 },
  { code: "32", name: "경량철골구조", year: 20, minResidualRatio: 0.10, yearDiscountRatio: 0.045 },
  { code: "33", name: "강파이프구조", year: 30, minResidualRatio: 0.10, yearDiscountRatio: 0.030 },
  { code: "34", name: "공업화박판강구조(PEB)", year: 30, minResidualRatio: 0.10, yearDiscountRatio: 0.030 },
  { code: "35", name: "단일형강구조", year: 30, minResidualRatio: 0.10, yearDiscountRatio: 0.030 },
  { code: "36", name: "트러스구조", year: 30, minResidualRatio: 0.10, yearDiscountRatio: 0.030 },
  { code: "37", name: "스틸하우스조", year: 30, minResidualRatio: 0.10, yearDiscountRatio: 0.030 },
  { code: "17", name: "보강콘크리트조", year: 30, minResidualRatio: 0.10, yearDiscountRatio: 0.030 },
  { code: "12", name: "블록구조", year: 30, minResidualRatio: 0.10, yearDiscountRatio: 0.030 },
  { code: "11", name: "벽돌구조", year: 30, minResidualRatio: 0.10, yearDiscountRatio: 0.030 },
  { code: "14", name: "스틸하우스조", year: 30, minResidualRatio: 0.10, yearDiscountRatio: 0.030 },
  { code: "19", name: "기타조적구조", year: 30, minResidualRatio: 0.10, yearDiscountRatio: 0.030 },

  // ④ 시멘트블록조, 경량철골조, 조립식패널조, FRP패널조 → 20년, 0.10, 0.045
  { code: "61", name: "시멘트블록조", year: 20, minResidualRatio: 0.10, yearDiscountRatio: 0.045 },
  { code: "63", name: "조립식패널조", year: 20, minResidualRatio: 0.10, yearDiscountRatio: 0.045 },
  { code: "60", name: "블록/판넬조", year: 20, minResidualRatio: 0.10, yearDiscountRatio: 0.045 },

  // ⑤ 석회 및 흙벽돌조, 돌담 및 토담조, 철파이프조, 컨테이너조 → 10년, 0.10, 0.090
  { code: "27", name: "석회 및 흙혼합 벽돌조", year: 10, minResidualRatio: 0.10, yearDiscountRatio: 0.090 },
  { code: "24", name: "돌담 및 토담조", year: 10, minResidualRatio: 0.10, yearDiscountRatio: 0.090 },
  { code: "23", name: "철파이프조", year: 10, minResidualRatio: 0.10, yearDiscountRatio: 0.090 },
  { code: "74", name: "컨테이너조", year: 10, minResidualRatio: 0.10, yearDiscountRatio: 0.090 },

  // 기타
  { code: "20", name: "콘크리트구조", year: 40, minResidualRatio: 0.10, yearDiscountRatio: 0.0225 },
  { code: "80", name: "막구조", year: 10, minResidualRatio: 0.10, yearDiscountRatio: 0.090 },
  { code: "81", name: "막구조", year: 10, minResidualRatio: 0.10, yearDiscountRatio: 0.090 },
  { code: "90", name: "기타구조", year: 30, minResidualRatio: 0.10, yearDiscountRatio: 0.030 },
  { code: "99", name: "기타구조", year: 30, minResidualRatio: 0.10, yearDiscountRatio: 0.030 },
];

const calculateResidualValueRatio = (structureCodeName: string, diffYear: number) => {
  let value = null;
  for (const item of BUILDING_RESIDUAL_VALUE) {
    if (item.name === structureCodeName) {
      value = item;
      break;
    }
  }
  if (!value) {
    value = BUILDING_RESIDUAL_VALUE[0];
  }
  const { yearDiscountRatio, minResidualRatio } = value;

  const ratio = 1 - (yearDiscountRatio * diffYear);

  return Math.max(ratio, minResidualRatio);
}

const getParkingFloorCount = (far: number) => {
  if (far < 300) {
    return 2;
  } else if (far < 400) {
    return 2.5;
  } else if (far < 700) {
    return 3;
  } else if (far < 1000) {
    return 4;
  }

  return 5;
}

const getBuildProjectDuration = (floorArea: number, debug: boolean = false, debugExtraInfo: string[] = []) => {
  const areaPerPy = floorArea * 0.3025;
  if (areaPerPy < 500) {
    if (debug) {
      debugExtraInfo.push(`* 소규모 (총연면적 ${areaPerPy.toFixed(1)}평 < 500평)`);
      debugExtraInfo.push(`[개발기간] 18개월 (기획 : 1개월, 설계 : 5개월, 공사 : 12개월)`);
    }
    return {
      planningDurationMonths: 1,
      designDurationMonths: 5,
      constructionDurationMonths: 12
    }
  } else if (areaPerPy < 1500) {
    if (debug) {
      debugExtraInfo.push(`* 중규모 (총연면적 ${areaPerPy.toFixed(1)}평 < 1500평)`);
      debugExtraInfo.push(`[개발기간] 24개월 (기획 : 2개월, 설계 : 6개월, 공사 : 16개월)`);
    }
    return {
      planningDurationMonths: 2,
      designDurationMonths: 6,
      constructionDurationMonths: 16
    }
  } else {
    if (debug) {
      debugExtraInfo.push(`* 대규모 (총연면적 ${areaPerPy.toFixed(1)}평 >= 1500평)`);
      debugExtraInfo.push(`[개발기간] 31개월 (기획 : 2개월, 설계 : 7개월, 공사 : 22개월)`);
    }
    return {
      planningDurationMonths: 2,
      designDurationMonths: 7,
      constructionDurationMonths: 22
    }
  }
}

const getRemodelProjectDuration = (floorArea: number, debug: boolean = false, debugExtraInfo: string[] = []) => {
  const areaPerPy = floorArea * 0.3025;
  if (areaPerPy < 500) {
    if (debug) {
      debugExtraInfo.push(`* 소규모 (총연면적 ${areaPerPy.toFixed(1)}평 < 500평)`);
      debugExtraInfo.push(`[개발기간] 11개월 (기획 : 1개월, 설계 : 4개월, 공사 : 6개월)`);
    }
    return {
      planningDurationMonths: 1,
      designDurationMonths: 4,
      constructionDurationMonths: 6
    }
  } else if (areaPerPy < 1500) {
    if (debug) {
      debugExtraInfo.push(`* 중규모 (총연면적 ${areaPerPy.toFixed(1)}평 < 1500평)`);
      debugExtraInfo.push(`[개발기간] 17개월 (기획 : 2개월, 설계 : 5개월, 공사 : 10개월)`);
    }
    return {
      planningDurationMonths: 2,
      designDurationMonths: 5,
      constructionDurationMonths: 10
    }
  } else {
    if (debug) {
      debugExtraInfo.push(`* 대규모 (총연면적 ${areaPerPy.toFixed(1)}평 >= 1500평)`);
      debugExtraInfo.push(`[개발기간] 20개월 (기획 : 2개월, 설계 : 6개월, 공사 : 12개월)`);
    }
    return {
      planningDurationMonths: 2,
      designDurationMonths: 6,
      constructionDurationMonths: 12
    }
  }
}

const getPMFeePerMonth = (floorArea: number) => {
  const areaPerPy = floorArea * 0.3025;
  if (areaPerPy < 500) {
    return 15000000;
  }

  return 20000000;
}

const getDefaultPublicArea = (floorArea: number, floorCount: number) => {

  // m2 면적으로 계산 
  if (floorArea < 500) {
    return 20;
  } else if (floorArea < 1200) {
    return 40;
  } else if (floorArea < 2000) {
    return 70;
  }

  // 2000 이상은 층당 25% 를 공용면적으로 계산 
  return (floorArea / floorCount) * 0.25;
};

const getMinExclusiveArea = (floorArea: number, floorCount: number) => {

  // m2 면적으로 계산 
  if (floorArea < 500) {
    return 20;
  } else if (floorArea < 1200) {
    return 40;
  } else if (floorArea < 2000) {
    return 70;
  }

  return (floorArea / floorCount) * 0.25;
};


const getDemolitionCostPerPy = (floorArea: number) => {
  const areaPerPy = floorArea * 0.3025;
  if (areaPerPy < 300) {
    return 500000;
  } else if (areaPerPy < 500) {
    return 700000;
  } else if (areaPerPy < 1000) {
    return 1000000;
  } else {
    return 2000000;
  }
}


const getConstructionDesignCostPerPy = (floorArea: number) => {
  const areaPerPy = floorArea * 0.3025;
  if (areaPerPy < 500) {
    return 250000;
  } else if (areaPerPy < 1500) {
    return 300000;
  } else {
    return 400000;
  }
}


const getConstructionCostPerPy = (floorArea: number) => {
  const areaPerPy = floorArea * 0.3025;
  if (areaPerPy < 500) {
    return 9000000;
  } else if (areaPerPy < 1500) {
    return 10000000;
  } else {
    return 11000000;
  }
}


const getRemodelingCostPerPy = (floorArea: number) => {
  const areaPerPy = floorArea * 0.3025;
  // if(areaPerPy < 500){
  //   return 5000000;
  // }else if(areaPerPy < 1500){
  //   return 7000000;
  // }else{
  //   return 8000000;
  // }
  if (areaPerPy < 500) {
    return 4000000;
  } else if (areaPerPy < 1500) {
    return 4300000;
  } else {
    return 4800000;
  }
}

const getDemolitionManagementCost = (floorArea: number) => {
  const areaPerPy = floorArea * 0.3025;
  if (areaPerPy < 300) {
    return 15000000;
  } else if (areaPerPy < 500) {
    return 45000000;
  } else if (areaPerPy < 1000) {
    return 90000000;
  } else {
    return 135000000;
  }
}


const getManagementCostPerPy = (floorArea: number, type: 'build' | 'remodel' | 'rent') => {
  const areaPerPy = floorArea * 0.3025;
  if (type === 'build') {
    if (areaPerPy < 500) {
      return 20000;
    } else if (areaPerPy < 1500) {
      return 40000;
    } else {
      return 70000;
    }
  } else if (type === 'remodel') {
    if (areaPerPy < 500) {
      return 18000;
    } else if (areaPerPy < 1500) {
      return 36000;
    } else {
      return 65000;
    }
  } else {
    if (areaPerPy < 500) {
      return 16000;
    } else if (areaPerPy < 1500) {
      return 32000;
    } else {
      return 60000;
    }
  }
}

const getRentProfitRatio = (type: 'build' | 'remodel' | 'rent') => {
  if (type === 'build') {
    return 1.2;
  } else if (type === 'remodel') {
    return 1.1;
  } else {
    return 1.0;
  }
}

const getPropertyTax = (price: number, area: number, debug: boolean, debugExtraInfo: string[]) => {
  // 아래 링크 참고 
  // "사업용토지"를 기준으로 계산 
  // https://xn--989a00af8jnslv3dba.com/%EC%9E%AC%EC%82%B0%EC%84%B8


  const taxBase = price * area * FAIR_MARKET_RATIO; // 과세표준 공정시장가 비율 공시지가 * 70%  
  if (debug) {
    debugExtraInfo.push(`[과세표준] ${krwUnit(taxBase)} (공시지가 * 70%(공정시장가액비율))`);
  }

  let propertyTax = 0;
  if (taxBase <= 200000000) {
    // 2억 이하 : 과세표준 x 0.20%
    propertyTax = taxBase * 0.002;
    if (debug) {
      debugExtraInfo.push(`[재산세] ${krwUnit(propertyTax)} (2억 이하 : 과세표준 x 0.2%)`);
    }
  } else if (taxBase <= 1000000000) {
    // 10억 이하 : 400000 + (과세표준 - 2억) x 0.3% 
    propertyTax = 400000 + (taxBase - 200000000) * 0.003;
    if (debug) {
      debugExtraInfo.push(`[재산세] ${krwUnit(propertyTax)} (10억 이하 : 400000 + (과세표준 - 2억) x 0.3%)`);
    }
  } else {
    // 10억 초과 : 2800000 + (과세표준 - 10억) x 0.4%
    propertyTax = 2800000 + (taxBase - 1000000000) * 0.004;
    if (debug) {
      debugExtraInfo.push(`[재산세] ${krwUnit(propertyTax)} (10억 초과 : 2800000 + (과세표준 - 10억) x 0.4%)`);
    }
  }

  if (debug) {
    debugExtraInfo.push(`[도시지역분] ${krwUnit(taxBase * 0.0014)} (과세표준 x 0.14%)`);
    debugExtraInfo.push(`[지방교육세] ${krwUnit(propertyTax * 0.2)} (재산세 x 20%)`);
    debugExtraInfo.push(`<재산세(토지)> ${krwUnit(propertyTax + (taxBase * 0.0014) + (propertyTax * 0.2))} (재산세 + 도시지역분 + 지방교육세)`);
  }

  return propertyTax +  // 재산세 
    (taxBase * 0.0014) + // 도시지역분 (0.14%) 
    (propertyTax * 0.2) // 지방교육세 (20%)
}


const getPropertyTaxForBuilding = (price: number, totalFloorArea: number, structureCodeName: string, useApprovalDateStr: string, debug: boolean, debugExtraInfo: string[]) => {

  const age = useApprovalDateStr ? getBuildingAge(useApprovalDateStr) : 40;

  // 구조지수
  const structureIndex = STRUCTURE_INDEX_BASE_LIST.find((item) => item.name === structureCodeName)?.value || 1.00;
  // 용도지수 
  const usageIndex = BUILDING_USAGE_INDEX_BASE;
  // 위치지수 
  const locationIndex = getBuildingLocationIndex(price);
  // 경과연수별 잔가율 
  const ageIndex = calculateResidualValueRatio(structureCodeName, age);

  // 시가표준액
  const marketPrice = totalFloorArea * (BUILDING_PRICE_INDEX_BASE * structureIndex * usageIndex * locationIndex * ageIndex);
  // 과세표준 
  const taxBase = marketPrice * FAIR_MARKET_RATIO;
  // 재산세 
  const propertyTax = taxBase * BULILDING_PROPERTY_TAX_RATIO;


  if (debug) {
    debugExtraInfo.push(`[구조지수] ${structureIndex} (${structureCodeName})`);
    debugExtraInfo.push(`[용도지수] ${usageIndex} (${BUILDING_USAGE_INDEX_BASE})`);
    debugExtraInfo.push(`[위치지수] ${locationIndex} (공시지가 ${price})`);
    debugExtraInfo.push(`[경과연수] ${age} (${useApprovalDateStr}(준공일))`);
    debugExtraInfo.push(`[잔가율] ${ageIndex} ( 1- (매년상각율 x ${age}(건물경과년수))`);
    debugExtraInfo.push(`[시가표준액] ${krwUnit(marketPrice)} (${totalFloorArea} (연면적) x ${BUILDING_PRICE_INDEX_BASE} (기준액) x ${structureIndex} (구조지수) x ${usageIndex} (용도지수) x ${locationIndex} (위치지수) x ${ageIndex} (잔가율))`);
    debugExtraInfo.push(`[과세표준] ${krwUnit(taxBase)} (${krwUnit(marketPrice)} (시가표준액) x ${FAIR_MARKET_RATIO} (공정시장가액비율)`);
    debugExtraInfo.push(`[재산세(건축물)] ${krwUnit(propertyTax)} (${krwUnit(taxBase)} (과세표준) x ${BULILDING_PROPERTY_TAX_RATIO}(기타건축물재산세율))`);
  }

  let resourceTax = 0;

  if (taxBase <= 6000000) {
    resourceTax = Math.round(taxBase * 0.0004);
    if (debug) {
      debugExtraInfo.push(`[지역자원시설세] ${krwUnit(taxBase * 0.0004)} (6,000,000 이하 : 과세표준 x 0.04%)`);
    }
  } else if (taxBase <= 13000000) {
    resourceTax = Math.round(2400 + ((taxBase - 6000000) * 0.0005));
    if (debug) {
      debugExtraInfo.push(`[지역자원시설세] ${krwUnit(2400 + ((taxBase - 6000000) * 0.0005))} (13,000,000 이하 : 2,400 + ((과세표준 - 6,000,000) x 0.05%)`);
    }
  } else if (taxBase <= 26000000) {
    resourceTax = Math.round(5900 + ((taxBase - 13000000) * 0.0006));
    if (debug) {
      debugExtraInfo.push(`[지역자원시설세] ${krwUnit(5900 + ((taxBase - 13000000) * 0.0006))} (26,000,000 이하 : 5,900 + ((과세표준 - 13,000,000) x 0.06%)`);
    }
  } else if (taxBase <= 39000000) {
    resourceTax = Math.round(13700 + ((taxBase - 26000000) * 0.0008));
    if (debug) {
      debugExtraInfo.push(`[지역자원시설세] ${krwUnit(13700 + ((taxBase - 26000000) * 0.0008))} (39,000,000 이하 : 13,700 + ((과세표준 - 26,000,000) x 0.08%)`);
    }
  } else if (taxBase <= 64000000) {
    resourceTax = Math.round(24100 + ((taxBase - 39000000) * 0.0010));
    if (debug) {
      debugExtraInfo.push(`[지역자원시설세] ${krwUnit(24100 + ((taxBase - 39000000) * 0.0010))} (64,000,000 이하 : 24,100 + ((과세표준 - 39,000,000) x 0.10%)`);
    }
  } else {
    resourceTax = Math.round(49100 + ((taxBase - 64000000) * 0.0012));
    if (debug) {
      debugExtraInfo.push(`[지역자원시설세] ${krwUnit(49100 + ((taxBase - 64000000) * 0.0012))} (64,000,000 초과 : 49,100 + ((과세표준 - 64,000,000) x 0.12%))`);
    }
  }

  if (debug) {
    debugExtraInfo.push(`<재산세(건축물)+지역자원시설세> ${krwUnit(propertyTax + resourceTax)}`);
  }

  // 재산세 + 지역자원시설세
  return propertyTax + resourceTax;
}

function getComprehensiveRealEstateTax(price: number, area: number, propertyTax: number, debug: boolean = false, debugInfo: string[] = []) {
  // 상업용건물은 별도합산토지로 계산 

  const publicPrice = price * area; // 공시지가
  const deductiblePrice = publicPrice - 8_000_000_000; // 80억 공제
  const taxBase = Math.max(deductiblePrice * 1.0, 0); // 과세표준 (공제 금액의 100%)

  if (debug) {
    debugInfo.push(`[과세표준] ${krwUnit(taxBase)} (${krwUnit(publicPrice)} (공시지가) - ${krwUnit(8_000_000_000)} (공제금액) x 100%)`);
  }

  // 산출세액 
  const th1 = 20_000_000_000; // 200억
  const th2 = 40_000_000_000; // 400억
  let grossTax = 0; // 토지분 별도합산세액 
  if (taxBase <= th1) {
    grossTax = taxBase * 0.005; // 0.5%
    if (debug) {
      debugInfo.push(`[산출세액] ${krwUnit(grossTax)} (${krwUnit(taxBase)} (과세표준) x 0.5%)`);
    }
  } else if (taxBase <= th2) {
    grossTax = taxBase * 0.006 - 20_000_000; // 0.6% - 2,000만
    if (debug) {
      debugInfo.push(`[산출세액] ${krwUnit(grossTax)} (${krwUnit(taxBase)} (과세표준) x 0.6% - 2,000만)`);
    }
  } else {
    grossTax = taxBase * 0.007 - 60_000_000; // 0.7% - 6,000만
    if (debug) {
      debugInfo.push(`[산출세액] ${krwUnit(grossTax)} (${krwUnit(taxBase)} (과세표준) x 0.7% - 6,000만)`);
    }
  }

  // 재산세 차감: 80억 초과분에 해당하는 비율만큼
  // 비율 = 과세표준 / 공시가격
  const ratio = taxBase > 0 ? Math.min(1, taxBase / publicPrice) : 0;
  const propertyTaxOffset = propertyTax * ratio;

  // 최종 종부세
  const finalTax = Math.max(0, grossTax - propertyTaxOffset);

  if (debug) {
    debugInfo.push(`[재산세 차감] ${krwUnit(propertyTaxOffset)} (${krwUnit(propertyTax)}(재산세(토지)) x (${krwUnit(taxBase)} (과세표준) / ${krwUnit(publicPrice)} (공시가격)))`);
    debugInfo.push(`<종부세> ${krwUnit(finalTax)} (${krwUnit(grossTax)} (산출세액) - ${krwUnit(propertyTaxOffset)} (재산세 차감))`);
  }

  return finalTax;
}


export function getBuildingAge(useApprovalDateStr: string) {
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


function makeReportValue(report: ReportValue, grade: string) {
  report.grade = grade;
  // report.message = 'AI 메세지 메세지 메세지 메세지.....';
}


function makeLandCost(landCost: LandCost, estimatedPrice: EstimatedPriceInfo, debug: boolean = false, debugExtraInfo: string[] = []) {
  landCost.purchaseCost = estimatedPrice.estimatedPrice;
  landCost.acquisitionCost = estimatedPrice.estimatedPrice * ACQUISITION_COST_RATIO; // 취득세 + 법무사비
  landCost.agentFee = estimatedPrice.estimatedPrice * AGENT_FEE_RATIO; // 중개보수

  if (debug) {
    debugExtraInfo.push(`\n`);
    debugExtraInfo.push(`토지비`);
    debugExtraInfo.push(`[매입비용] ${krwUnit(landCost.purchaseCost)} (추정가)`);
    debugExtraInfo.push(`[취득세+법무사비] ${krwUnit(landCost.acquisitionCost)} (추정가 * ${(ACQUISITION_COST_RATIO * 100).toFixed(1)}%)`);
    debugExtraInfo.push(`[중개보수] ${krwUnit(landCost.agentFee)} (추정가 * ${(AGENT_FEE_RATIO * 100).toFixed(1)}%)`);
    debugExtraInfo.push(`<합계> ${krwUnit(landCost.purchaseCost + landCost.acquisitionCost + landCost.agentFee)}`);
  }
}

function isJungbukIljo(landInfo: LandData) {
  return (landInfo.usageName === '제1종일반주거지역' || landInfo.usageName === '제2종일반주거지역' || landInfo.usageName === '제3종일반주거지역')
    && (!landInfo.roadContact.includes('지정되지않음') && !landInfo.roadContact.includes('광대'));
}


function getFloorInfoForJungbukIljo(buildingArea: number, publicAreaPerFloor: number, maxUpperFloorArea: number, debug: boolean = false, debugExtraInfo: string[] = []): number[] {
  const minExclusiveArea = getMinExclusiveArea(maxUpperFloorArea, Math.ceil(Number(maxUpperFloorArea) / Number(buildingArea)));
  // if (debug) {
  //   debugExtraInfo.push(`☀️ 정북일조 적용`);
  //   debugExtraInfo.push(`[(최대)지상층연면적] ${getAreaStrWithPyeong(maxUpperFloorArea.toFixed(1))} (${Number(area).toFixed(2)}(면적) * ${far / 100}(용적률))`);
  //   // detailInfo.debugExtraInfo.push(`[최대층수] ${maxFloorCount.toFixed(1)}층 (${maxUpperFloorArea.toFixed(1)}m² / ${detailInfo.buildInfo.buildingArea.toFixed(1)}m²)`);
  //   debugExtraInfo.push(`[공용면적] ${publicAreaPerFloor.toFixed(1)}m²`);
  //   debugExtraInfo.push(`[최소지상층별면적] ${getAreaStrWithPyeong(publicAreaPerFloor + minExclusiveArea)}m² (${minExclusiveArea.toFixed(1)}m²(최소전용면적) + ${publicAreaPerFloor.toFixed(1)}m²(공용면적))`);
  // }

  let remainingArea = maxUpperFloorArea;

  let floorNumber = 1;
  const floors = []
  let minFloorArea = publicAreaPerFloor + minExclusiveArea

  while (
    remainingArea >= minFloorArea
  ) {
    let area
    if (floorNumber == 1) {
      area = buildingArea * 0.7; // 1층 건폐율면적의 70%
      remainingArea -= area;
    } else if (floorNumber == 2) {
      area = buildingArea; // 2층 건폐율면적의 100% 
    } else if (floorNumber == 3) {
      area = buildingArea; // 3층 건폐율면적의 100% 
    } else if (floorNumber == 4) {
      area = buildingArea * 0.75; // 건폐율면적의 75% 
    } else {
      area = floors[floors.length - 1] * 0.85; // 직전층의 85%
    }
    console.log('area', floorNumber, area);
    if (floorNumber > 2 && area < minFloorArea) {
      break;
    }
    remainingArea -= area;
    floors.push(area);

    if (debug) {
      if (floorNumber == 1) {
        debugExtraInfo.push(`- 1층 ${getAreaStrWithPyeong(area)} (건축면적의 70%)`);
      } else if (floorNumber == 2) {
        debugExtraInfo.push(`- 2층 ${getAreaStrWithPyeong(area)} (건축면적의 100%)`);
      } else if (floorNumber == 3) {
        debugExtraInfo.push(`- 3층 ${getAreaStrWithPyeong(area)} (건축면적의 100%)`);
      } else if (floorNumber == 4) {
        debugExtraInfo.push(`- 4층 ${getAreaStrWithPyeong(area)} (건축면적의 75%)`);
      } else {
        debugExtraInfo.push(`- ${floorNumber}층 ${getAreaStrWithPyeong(area)} (직전층의 85%)`);
      }
    }

    floorNumber += 1;
  }
  return floors;
}

function createBuildInfo() {
  return {
    buildingArea: 0,
    upperFloorArea: 0,
    lowerFloorArea: 0,
    publicAreaPerFloor: 0,
    upperFloorCount: 0,
    lowerFloorCount: 0,
    firstFloorExclusiveArea: 0,
    secondFloorExclusiveArea: 0,
    lowerFloorExclusiveArea: 0,
    bcr: 0,
    far: 0,
  };
}

function makeRemodelingInfo(landInfo: LandData, buildingList: BuildingData[], debug: boolean, debugExtraInfo: string[] = []): BuildInfo {

  const remodelInfo = createBuildInfo();

  const bcr = landInfo.relWeightedBcr;
  const far = landInfo.relWeightedFar;
  const area = landInfo.relTotalArea;
  const buildingArea = area * (bcr / 100);
  // 현재 건물의 지하층수 
  const currentBuildingBaseFloorNumber = Number(buildingList[0].baseFloorNumber) || 0;
  // 현재 건물의 지상층수 
  const currentBuildingGndFloorNumber = Number(buildingList[0].gndFloorNumber) || 1;
  // 현재 건축물의 건축면적
  remodelInfo.buildingArea = (buildingList && buildingList.length > 0) ? getCurrentBuildingArchArea(buildingList, buildingArea) : 0;
  // 최대 연면적 
  const maxUpperFloorArea = area * (far / 100);


  // 건축물 대장의 총 연면적
  const buildingTotalFloorArea = buildingList?.reduce((total, building) => total + (building.totalFloorArea ? parseFloat(building.totalFloorArea) : 0.00), 0.00);
  // 현재 건축물 대장에 연면적이 없으면 총 연면적을 건축면적으로 대체 (1층짜리 건물이라고 생각)
  const currentBuildingTotalFloorArea = buildingTotalFloorArea ? buildingTotalFloorArea : remodelInfo.buildingArea;

  if (debug) {
    debugExtraInfo.push("🏢 현재 건물정보");
    debugExtraInfo.push(`[총연면적] ${getAreaStrWithPyeong(currentBuildingTotalFloorArea.toFixed(1))}`);
    debugExtraInfo.push(`[지상층층수] ${currentBuildingGndFloorNumber}`);
    debugExtraInfo.push(`[지하층층수] ${currentBuildingBaseFloorNumber}`);
  }
  console.log('current totalFloorArea', currentBuildingTotalFloorArea);

  console.log('makeBuildInfo', landInfo.usageName, landInfo.roadContact);

  // if (debug) {
  //   // debugExtraInfo.push("\n")
  //   // debugExtraInfo.push(`용도 (${landInfo.usageName}, 도로 ${landInfo.roadContact})`);
  //   debugExtraInfo.push("🏗️ 개발계획 (리모델링후)");
  //   debugExtraInfo.push(`[건축면적] ${getAreaStrWithPyeong(remodelInfo.buildingArea.toFixed(1))}`);
  //   debugExtraInfo.push(`[최대가능층수] ${maxFloorCount}`);
  // }

  let firstFloorArea;
  let maxFloorCount;

  if (isJungbukIljo(landInfo)) {
    if (debug) {
      debugExtraInfo.push(`☀️ 정북일조 적용 (리모델링)`);
      debugExtraInfo.push(`[(최대)지상층연면적] ${getAreaStrWithPyeong(maxUpperFloorArea.toFixed(1))} (${Number(area).toFixed(2)}(면적) * ${far / 100}(용적률))`);
      // detailInfo.debugExtraInfo.push(`[최대층수] ${maxFloorCount.toFixed(1)}층 (${maxUpperFloorArea.toFixed(1)}m² / ${detailInfo.buildInfo.buildingArea.toFixed(1)}m²)`);
      debugExtraInfo.push(`[공용면적] ${remodelInfo.publicAreaPerFloor.toFixed(1)}m²`);
      // debugExtraInfo.push(`[최소지상층별면적] ${getAreaStrWithPyeong(remodelInfo.publicAreaPerFloor + minExclusiveArea)}m² (${minExclusiveArea.toFixed(1)}m²(최소전용면적) + ${buildInfo.publicAreaPerFloor.toFixed(1)}m²(공용면적))`);
    }
    const floors = getFloorInfoForJungbukIljo(buildingArea, remodelInfo.publicAreaPerFloor, maxUpperFloorArea, debug, debugExtraInfo);
    maxFloorCount = floors.length
    // 공용면적
    remodelInfo.publicAreaPerFloor = getDefaultPublicArea(maxUpperFloorArea, maxFloorCount);

    firstFloorArea = floors[0];
    // 리모델링 후 지상 층수 (최대 2층 증축 가능)
    remodelInfo.upperFloorCount = Math.min(maxFloorCount, currentBuildingGndFloorNumber + 2);
    remodelInfo.upperFloorArea = Math.min(floors.reduce((a, b) => a + b, 0), remodelInfo.upperFloorCount * buildingArea);

  } else {
    // 최대로 올릴수 있는 층수 (현재 건축면적으로 계산)
    maxFloorCount = Math.max(currentBuildingGndFloorNumber, Math.ceil(Number(maxUpperFloorArea) / Number(remodelInfo.buildingArea)));
    // 공용면적
    remodelInfo.publicAreaPerFloor = getDefaultPublicArea(maxUpperFloorArea, maxFloorCount);
    // 리모델링 후 지상 층수 (최대 2층 증축 가능)
    remodelInfo.upperFloorCount = Math.min(maxFloorCount, currentBuildingGndFloorNumber + 2);
    remodelInfo.upperFloorArea = remodelInfo.upperFloorCount * buildingArea;

    const areaPerFloor = remodelInfo.upperFloorArea / remodelInfo.upperFloorCount;
    firstFloorArea = areaPerFloor;
  }


  remodelInfo.firstFloorExclusiveArea = Math.max(firstFloorArea - (remodelInfo.publicAreaPerFloor), 0);
  remodelInfo.secondFloorExclusiveArea =
    Math.max(
      remodelInfo.upperFloorArea - remodelInfo.firstFloorExclusiveArea - (remodelInfo.publicAreaPerFloor * (remodelInfo.upperFloorCount - 1)),
      0
    );

  remodelInfo.lowerFloorCount = currentBuildingBaseFloorNumber; // 지하 임대층수는 현재 건물 지하 층수
  const lowerAreaPerFloor = area * BASE_FLOOR_AREA_RATIO;

  if (remodelInfo.lowerFloorCount > 0) {
    remodelInfo.lowerFloorArea = lowerAreaPerFloor * remodelInfo.lowerFloorCount;
    // detailInfo.buildInfo.lowerFloorExclusiveArea = detailInfo.buildInfo.lowerFloorArea - (detailInfo.buildInfo.publicAreaPerFloor * detailInfo.buildInfo.lowerFloorCount);
    remodelInfo.lowerFloorExclusiveArea = Math.max(lowerAreaPerFloor - (remodelInfo.publicAreaPerFloor), 0);
  } else {
    remodelInfo.lowerFloorArea = 0;
    remodelInfo.lowerFloorExclusiveArea = 0;
  }

  remodelInfo.bcr = bcr;
  remodelInfo.far = (remodelInfo.upperFloorArea / area) * 100;

  if (debug) {

    debugExtraInfo.push("🏗️ 개발계획 (리모델링후)");
    debugExtraInfo.push(`[최대가능층수] ${maxFloorCount}`);
    debugExtraInfo.push(`[지상층연면적] ${getAreaStrWithPyeong(remodelInfo.upperFloorArea.toFixed(1))}`);
    debugExtraInfo.push(`[지상층층수] ${remodelInfo.upperFloorCount}`);
    debugExtraInfo.push(`[지하층연면적] ${getAreaStrWithPyeong(remodelInfo.lowerFloorArea.toFixed(1))}`);
    debugExtraInfo.push(`[지하층층수] ${remodelInfo.lowerFloorCount} (임대층수 1 + 주차층수 ${remodelInfo.lowerFloorCount - 1})`);

    // detailInfo.debugExtraInfo.push(`[지상층별 면적] ${getAreaStrWithPyeong(areaPerFloor.toFixed(1))}`);
    debugExtraInfo.push(`[공용면적] ${getAreaStrWithPyeong(remodelInfo.publicAreaPerFloor.toFixed(1))}`);
    debugExtraInfo.push(`[1층 전용면적] ${getAreaStrWithPyeong(remodelInfo.firstFloorExclusiveArea.toFixed(1))} (${firstFloorArea.toFixed(1)}m² (1층면적) - ${remodelInfo.publicAreaPerFloor.toFixed(1)}m² (공용면적))`);
    debugExtraInfo.push(`[2층이상(총)전용면적] ${getAreaStrWithPyeong(remodelInfo.secondFloorExclusiveArea.toFixed(1))} (${remodelInfo.upperFloorArea.toFixed(1)}m² (지상층총연면적) - ${firstFloorArea.toFixed(1)}m² (1층면적) - (${remodelInfo.publicAreaPerFloor.toFixed(1)}m² (공용면적) * ${remodelInfo.upperFloorCount - 1} (2층이상 층수))`);
    debugExtraInfo.push(`[지하층(총)전용면적] ${getAreaStrWithPyeong(remodelInfo.lowerFloorExclusiveArea.toFixed(1))} (${lowerAreaPerFloor.toFixed(1)}m² (지하 층별면적) - ${remodelInfo.publicAreaPerFloor.toFixed(1)}m² (공용면적)) => 지하 1개층만 임대층으로 계산`);
  }

  // console.log('makeBuildInfo ', buildInfo);
  return remodelInfo;
}

function makeBuildInfo(landInfo: LandData, debug: boolean, debugExtraInfo: string[]): BuildInfo {
  const buildInfo = createBuildInfo();

  const bcr = landInfo.relWeightedBcr;
  const far = landInfo.relWeightedFar;
  const area = landInfo.relTotalArea;

  buildInfo.buildingArea = area * (bcr / 100);
  const maxUpperFloorArea = area * (far / 100);
  const maxFloorCount = Math.ceil(Number(maxUpperFloorArea) / Number(buildInfo.buildingArea));
  buildInfo.publicAreaPerFloor = getDefaultPublicArea(maxUpperFloorArea, maxFloorCount);

  console.log('makeBuildInfo', landInfo.usageName, landInfo.roadContact);
  let firstFloorArea;

  if (debug) {
    // debugExtraInfo.push("\n")
    debugExtraInfo.push(`용도 (${landInfo.usageName}, 도로 ${landInfo.roadContact})`);
    debugExtraInfo.push("🏗️ 개발계획 (개발후)");
    debugExtraInfo.push(`[건축면적] ${getAreaStrWithPyeong(buildInfo.buildingArea.toFixed(1))} (${Number(area).toFixed(2)}(면적) * ${bcr / 100}(건폐율))`);
  }

  if (isJungbukIljo(landInfo)) {
    console.log('정북일조!!');


    ///////////////////////////////////////////
    //정북일조 적용시 
    const minExclusiveArea = getMinExclusiveArea(maxUpperFloorArea, maxFloorCount);

    if (debug) {
      debugExtraInfo.push(`☀️ 정북일조 적용`);
      debugExtraInfo.push(`[(최대)지상층연면적] ${getAreaStrWithPyeong(maxUpperFloorArea.toFixed(1))} (${Number(area).toFixed(2)}(면적) * ${far / 100}(용적률))`);
      // detailInfo.debugExtraInfo.push(`[최대층수] ${maxFloorCount.toFixed(1)}층 (${maxUpperFloorArea.toFixed(1)}m² / ${detailInfo.buildInfo.buildingArea.toFixed(1)}m²)`);
      debugExtraInfo.push(`[공용면적] ${buildInfo.publicAreaPerFloor.toFixed(1)}m²`);
      debugExtraInfo.push(`[최소지상층별면적] ${getAreaStrWithPyeong(buildInfo.publicAreaPerFloor + minExclusiveArea)}m² (${minExclusiveArea.toFixed(1)}m²(최소전용면적) + ${buildInfo.publicAreaPerFloor.toFixed(1)}m²(공용면적))`);
    }

    const floors = getFloorInfoForJungbukIljo(buildInfo.buildingArea, buildInfo.publicAreaPerFloor, maxUpperFloorArea, debug, debugExtraInfo);

    // let remainingArea = maxUpperFloorArea;

    // let floorNumber = 1;
    // const floors = []
    // let minFloorArea = buildInfo.publicAreaPerFloor + minExclusiveArea
    // console.log('minFloorArea', minFloorArea);
    // console.log('maxUpperFloorArea', maxUpperFloorArea);
    // console.log('maxFloorCount', maxFloorCount);

    // while (
    //   remainingArea >= minFloorArea
    // ) {
    //   let area
    //   if (floorNumber == 1) {
    //     area = buildInfo.buildingArea * 0.7; // 1층 건폐율면적의 70%
    //     remainingArea -= area;
    //   } else if (floorNumber == 2) {
    //     area = buildInfo.buildingArea; // 2층 건폐율면적의 100% 
    //   } else if (floorNumber == 3) {
    //     area = buildInfo.buildingArea; // 3층 건폐율면적의 100% 
    //   } else if (floorNumber == 4) {
    //     area = buildInfo.buildingArea * 0.75; // 건폐율면적의 75% 
    //   } else {
    //     area = floors[floors.length - 1] * 0.85; // 직전층의 85%
    //   }
    //   console.log('area', floorNumber, area);
    //   if (floorNumber > 2 && area < minFloorArea) {
    //     break;
    //   }
    //   remainingArea -= area;
    //   floors.push(area);

    //   if (debug) {
    //     if (floorNumber == 1) {
    //       debugExtraInfo.push(`- 1층 ${getAreaStrWithPyeong(area)} (건축면적의 70%)`);
    //     } else if (floorNumber == 2) {
    //       debugExtraInfo.push(`- 2층 ${getAreaStrWithPyeong(area)} (건축면적의 100%)`);
    //     } else if (floorNumber == 3) {
    //       debugExtraInfo.push(`- 3층 ${getAreaStrWithPyeong(area)} (건축면적의 100%)`);
    //     } else if (floorNumber == 4) {
    //       debugExtraInfo.push(`- 4층 ${getAreaStrWithPyeong(area)} (건축면적의 75%)`);
    //     } else {
    //       debugExtraInfo.push(`- ${floorNumber}층 ${getAreaStrWithPyeong(area)} (직전층의 85%)`);
    //     }
    //   }

    //   floorNumber += 1;
    // }
    buildInfo.upperFloorCount = floors.length;
    buildInfo.upperFloorArea = floors.reduce((a, b) => a + b, 0);
    firstFloorArea = floors[0];
    buildInfo.firstFloorExclusiveArea = Math.max(firstFloorArea - buildInfo.publicAreaPerFloor, 0);
    buildInfo.secondFloorExclusiveArea =
      Math.max(
        buildInfo.upperFloorArea - firstFloorArea - (buildInfo.publicAreaPerFloor * (buildInfo.upperFloorCount - 1)),
        0
      );
    console.log('buildInfo.upperFloorCount', buildInfo.upperFloorCount);
    console.log('buildInfo.upperFloorArea', buildInfo.upperFloorArea);
    console.log('buildInfo.firstFloorExclusiveArea', buildInfo.firstFloorExclusiveArea);
    console.log('buildInfo.publicAreaPerFloor', buildInfo.publicAreaPerFloor);
    console.log('buildInfo.secondFloorCount', buildInfo.upperFloorCount - 1);
  } else {
    ///////////////////////////////////////////
    //정북일조 미적용시 
    buildInfo.upperFloorCount = maxFloorCount;
    buildInfo.upperFloorArea = maxUpperFloorArea;
    const areaPerFloor = buildInfo.upperFloorArea / buildInfo.upperFloorCount;
    firstFloorArea = areaPerFloor;

    buildInfo.firstFloorExclusiveArea = Math.max(areaPerFloor - (buildInfo.publicAreaPerFloor), 0);
    buildInfo.secondFloorExclusiveArea =
      Math.max(
        buildInfo.upperFloorArea - firstFloorArea - (buildInfo.publicAreaPerFloor * (buildInfo.upperFloorCount - 1)),
        0
      );
  }

  buildInfo.lowerFloorCount = 1; // 지하 임대층수는 1로 고정 

  const lowerAreaPerFloor = area * BASE_FLOOR_AREA_RATIO;

  buildInfo.lowerFloorArea = lowerAreaPerFloor * buildInfo.lowerFloorCount;
  // detailInfo.buildInfo.lowerFloorExclusiveArea = detailInfo.buildInfo.lowerFloorArea - (detailInfo.buildInfo.publicAreaPerFloor * detailInfo.buildInfo.lowerFloorCount);
  buildInfo.lowerFloorExclusiveArea = Math.max(lowerAreaPerFloor - (buildInfo.publicAreaPerFloor), 0);

  buildInfo.bcr = bcr;
  buildInfo.far = (buildInfo.upperFloorArea / area) * 100;

  if (debug) {
    debugExtraInfo.push("[지하주차층계산]");
  }

  if (isJungbukIljo(landInfo)) {
    const legalParkingCount = (buildInfo.upperFloorArea + buildInfo.lowerFloorArea) / LEGAL_PARKING_AREA_PER_CAR;
    if (debug) {
      debugExtraInfo.push(`* 1,2,3종 일반 주거지역에 포함`);
      debugExtraInfo.push(`법정주차필요대수 ${legalParkingCount.toFixed(1)} (${(buildInfo.upperFloorArea + buildInfo.lowerFloorArea).toFixed(1)}m² / ${LEGAL_PARKING_AREA_PER_CAR.toFixed(1)}m²)`);
    }

    // 1,2,3 종 일반 주거지역은 법정 주차대수가 8.4대수를 초과할 경우에만 주차층 추가 
    if (legalParkingCount > PARKING_FLOOR_THRESHOLD) {
      if (debug) {
        debugExtraInfo.push(`기계식주차 - 지하주차층 필요 (${legalParkingCount.toFixed(1)} > ${PARKING_FLOOR_THRESHOLD})`);
      }
      // 총 필요 주차 면적
      const totalParkingArea = Math.ceil(legalParkingCount) * PARKING_AREA_PER_CAR;
      // 층당 수용 가능한 주차 면적
      const parkingAreaPerFloor = buildInfo.lowerFloorExclusiveArea;
      // 필요한 주차층수 (올림 처리)
      const requiredParkingFloors = Math.ceil(totalParkingArea / parkingAreaPerFloor);
      buildInfo.lowerFloorCount += requiredParkingFloors;
      if (debug) {
        debugExtraInfo.push(`지하주차층 ${requiredParkingFloors} 추가 = (총 필요주차면적 ${totalParkingArea.toFixed(1)} / 지하층연면적 ${parkingAreaPerFloor.toFixed(1)})`);
      }
    } else {
      if (debug) {
        debugExtraInfo.push(`자주식주차 - 지하주차층 필요없음 (${legalParkingCount.toFixed(1)} < ${PARKING_FLOOR_THRESHOLD})`);
      }
    }

  } else {
    buildInfo.lowerFloorCount += getParkingFloorCount(far) - 1;
    if (debug) {
      debugExtraInfo.push(`지하주차층 ${getParkingFloorCount(far) - 1}층 추가`);
    }
  }

  if (debug) {
    debugExtraInfo.push(`[지상층연면적] ${getAreaStrWithPyeong(buildInfo.upperFloorArea.toFixed(1))} (${Number(area).toFixed(2)}(면적) * ${far / 100}(용적률))`);
    debugExtraInfo.push(`[지상층층수] ${buildInfo.upperFloorCount} (${buildInfo.upperFloorArea.toFixed(1)}m² / ${buildInfo.buildingArea.toFixed(1)}m²)`);
    debugExtraInfo.push(`[지하층연면적] ${getAreaStrWithPyeong(buildInfo.lowerFloorArea.toFixed(1))} (${Number(area).toFixed(2)}(면적) * ${Number(BASE_FLOOR_AREA_RATIO).toFixed(2)}(대지대비지하비율) * ${buildInfo.lowerFloorCount}(지하층수))`);
    debugExtraInfo.push(`[지하층층수] ${buildInfo.lowerFloorCount} (임대층수 1 + 주차층수 ${buildInfo.lowerFloorCount - 1})`);

    // detailInfo.debugExtraInfo.push(`[지상층별 면적] ${getAreaStrWithPyeong(areaPerFloor.toFixed(1))}`);
    debugExtraInfo.push(`[공용면적] ${getAreaStrWithPyeong(buildInfo.publicAreaPerFloor.toFixed(1))}`);
    debugExtraInfo.push(`[1층 전용면적] ${getAreaStrWithPyeong(buildInfo.firstFloorExclusiveArea.toFixed(1))} (${firstFloorArea.toFixed(1)}m² (1층면적) - ${buildInfo.publicAreaPerFloor.toFixed(1)}m² (공용면적))`);
    debugExtraInfo.push(`[2층이상(총)전용면적] ${getAreaStrWithPyeong(buildInfo.secondFloorExclusiveArea.toFixed(1))} (${buildInfo.upperFloorArea.toFixed(1)}m² (지상층총연면적) - ${firstFloorArea.toFixed(1)}m² (1층면적) - (${buildInfo.publicAreaPerFloor.toFixed(1)}m² (공용면적) * ${buildInfo.upperFloorCount - 1} (2층이상 층수))`);
    debugExtraInfo.push(`[지하층(총)전용면적] ${getAreaStrWithPyeong(buildInfo.lowerFloorExclusiveArea.toFixed(1))} (${lowerAreaPerFloor.toFixed(1)}m² (지하 층별면적) - ${buildInfo.publicAreaPerFloor.toFixed(1)}m² (공용면적)) => 지하 1개층만 임대층으로 계산`);
  }

  // console.log('makeBuildInfo ', buildInfo);

  return buildInfo;

}

function makeProjectCost(
  type: 'rent' | 'remodel' | 'build',
  projectCost: ProjectCost,
  currentFloorArea: number,
  totalFloorArea: number,
  projectDuration: ProjectDuration,
  debug: boolean,
  debugExtraInfo: string[]
) {
  // console.log('makeProjectCost ', currentFloorArea, totalFloorArea, projectDuration, remodeling);
  if (debug) {
    debugExtraInfo.push(`\n`);
    debugExtraInfo.push(`사업비`);
  }
  if (type === 'remodel' || type === 'rent') {
    projectCost.demolitionCost = 0;
    projectCost.demolitionManagementCost = 0;
    if (debug) {
      debugExtraInfo.push(`[해체공사비] 0원`);
      debugExtraInfo.push(`[해체감리비] 0원`);
    }
  } else {
    if (currentFloorArea > 0) {
      projectCost.demolitionCost = currentFloorArea * 0.3025 * getDemolitionCostPerPy(currentFloorArea);
      projectCost.demolitionManagementCost = getDemolitionManagementCost(currentFloorArea);
    }

    if (debug) {
      debugExtraInfo.push(`[해체공사비] ${krwUnit(projectCost.demolitionCost)} (${(0.3025 * currentFloorArea).toFixed(2)}(건물연면적(평)) * ${getDemolitionCostPerPy(currentFloorArea).toLocaleString()}(평당금액))`);
      debugExtraInfo.push(`[해체감리비] ${krwUnit(projectCost.demolitionManagementCost)}`);
    }
  }

  projectCost.constructionDesignCost = totalFloorArea * 0.3025 * getConstructionDesignCostPerPy(totalFloorArea);

  if (type === 'remodel') {
    projectCost.constructionCost = totalFloorArea * 0.3025 * getRemodelingCostPerPy(totalFloorArea);
  } else {
    projectCost.constructionCost = totalFloorArea * 0.3025 * getConstructionCostPerPy(totalFloorArea);
  }

  if (debug) {
    debugExtraInfo.push(`[건축설계비] ${krwUnit(projectCost.constructionDesignCost)} (${(totalFloorArea * 0.3025).toFixed(2)}(건물연면적(평)) * ${getConstructionDesignCostPerPy(totalFloorArea).toLocaleString()}(평당금액))`);
    if (type === 'remodel') {
      debugExtraInfo.push(`[건축공사비] ${krwUnit(projectCost.constructionCost)} (${(totalFloorArea * 0.3025).toFixed(2)}(건물연면적(평)) * ${getRemodelingCostPerPy(totalFloorArea).toLocaleString()}(평당금액))`);
    } else {
      debugExtraInfo.push(`[건축공사비] ${krwUnit(projectCost.constructionCost)} (${(totalFloorArea * 0.3025).toFixed(2)}(건물연면적(평)) * ${getConstructionCostPerPy(totalFloorArea).toLocaleString()}(평당금액))`);
    }
  }
  projectCost.managementCost = projectCost.constructionDesignCost * MANAGEMENT_FEE_RATIO;

  projectCost.pmFee = (projectDuration.planningDurationMonths + projectDuration.designDurationMonths + projectDuration.constructionDurationMonths) * getPMFeePerMonth(totalFloorArea);

  const totalProjectCost = projectCost.demolitionCost + projectCost.demolitionManagementCost + projectCost.constructionDesignCost + projectCost.constructionCost + projectCost.managementCost + projectCost.pmFee;
  projectCost.acquisitionTax = totalProjectCost * ACQUISITION_TAX_RATIO;
  projectCost.reserveFee = totalProjectCost * RESERVE_FEE_RATIO;


  if (debug) {
    debugExtraInfo.push(`[감리비] ${krwUnit(projectCost.managementCost)} (${Number(projectCost.constructionDesignCost.toFixed(1)).toLocaleString()}(건축설계비) * ${MANAGEMENT_FEE_RATIO.toFixed(2)}(감리비율))`);
    debugExtraInfo.push(`[PM 용역비] ${krwUnit(projectCost.pmFee)} (${projectDuration.planningDurationMonths + projectDuration.designDurationMonths + projectDuration.constructionDurationMonths}(프로젝트기간) * ${getPMFeePerMonth(totalFloorArea).toFixed(0)}(PM용역비))`);
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


function makeLoan(value: ReportValue, debug: boolean = false, debugExtraInfo: string[] = []) {
  const loanAmount = (
    value.projectCost.demolitionCost +
    value.projectCost.demolitionManagementCost +
    value.projectCost.constructionDesignCost +
    value.projectCost.constructionCost +
    value.projectCost.managementCost +
    value.projectCost.pmFee +
    (value.landCost.purchaseCost
      // + value.landCost.acquisitionCost + value.landCost.agentFee // 금융차입을 계산할때에(대출을 받을때에)는 취등록세, 중개수수료는 포함안됨) 
    )
  ) * LOAN_RATIO;
  // const totalDuration = value.duration.planningDurationMonths + value.duration.designDurationMonths + value.duration.constructionDurationMonths;
  const loanInterestPerYear = loanAmount * LOAN_INTEREST_RATIO;
  const projectDuration = value.duration.planningDurationMonths + value.duration.designDurationMonths + value.duration.constructionDurationMonths;
  const loanInterest = loanInterestPerYear * (projectDuration / 12);

  if (debug) {
    debugExtraInfo.push(`\n`);
    debugExtraInfo.push(`금융차입`);
    debugExtraInfo.push(`[차입비] ${krwUnit(loanAmount)} ((토지매입비 + 사업비) * ${(LOAN_RATIO * 100).toFixed(2)}%)`);
    debugExtraInfo.push(`[이자/년] ${krwUnit(loanInterestPerYear)} (${krwUnit(loanAmount)} * ${(LOAN_INTEREST_RATIO * 100).toFixed(2)}%)`);
    debugExtraInfo.push(`[이자(사업기간내)] ${krwUnit(loanInterest)} (${krwUnit(loanInterestPerYear)} * (${projectDuration}) / 12))`);
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

function getCurrentBuildingArchArea(buildingList: BuildingData[], buildingArea: number) {
  const archArea = buildingList.reduce((acc, building) => acc + ((building.archArea ? Number(building.archArea) : 0)), 0);
  if (archArea > 0) {
    return archArea;
  } else {
    const expectedArchArea = buildingList.reduce((acc, building) => {
      let value = 0
      if (Number(building.totalFloorArea) > 0 && (Number(building.gndFloorNumber) + Number(building.baseFloorNumber)) > 0) {
        value = (Number(building.totalFloorArea) / (Number(building.gndFloorNumber) + Number(building.baseFloorNumber)));
      }
      return acc + value;
    }, 0);
    if (expectedArchArea > 0) {
      return expectedArchArea;
    }
  }


  return buildingArea;
}


function makeProfit(
  type: 'rent' | 'remodel' | 'build',
  value: ReportValue,
  // landInfo: LandData,
  buildInfo: BuildInfo,
  buildingList: BuildingData[],
  firstFloorRentProfitPerPy: number,
  upperFloorRentProfitPerPy: number,
  baseFloorRentProfitPerPy: number,
  debug: boolean = false,
  debugExtraInfo: string[] = []
) {

  let rentProfit;
  let managementProfit;
  let currentBuildingArchArea = (buildingList && buildingList.length > 0) ? getCurrentBuildingArchArea(buildingList, buildInfo.buildingArea) : 0;
  // 현재 건축물 대장에 연면적이 없으면 총 연면적을 archArea로 대체 (1층짜리 건물이라고 생각) 
  const curBuildingTotalFloorArea = buildingList?.reduce((total, building) => total + (building.totalFloorArea ? parseFloat(building.totalFloorArea) : 0.00), 0.00);
  let currentBuildingTotalFloorArea = curBuildingTotalFloorArea ? curBuildingTotalFloorArea : currentBuildingArchArea;

  // console.log('makeProfit type', type);
  console.log('current totalFloorArea', currentBuildingTotalFloorArea);
  console.log('newBuild totalFloorArea ', buildInfo.upperFloorArea + buildInfo.lowerFloorArea);

  // console.log('firstFloorRentProfitPerPy', firstFloorRentProfitPerPy);
  // console.log('upperFloorRentProfitPerPy', upperFloorRentProfitPerPy);
  // console.log('baseFloorRentProfitPerPy', baseFloorRentProfitPerPy);

  if (debug) {
    debugExtraInfo.push(`\n`);
    debugExtraInfo.push(`임대 수익`);
  }

  // if (type === 'rent'
  //   || (type === 'remodel' && currentBuildingTotalFloorArea > (buildInfo.upperFloorArea + buildInfo.lowerFloorArea))
  // ) {
  //   if (debug) {
  //     if (type === 'remodel') {
  //       debugExtraInfo.push(`* 현재 건축물의 연 면적이 개발후 연면적 보다 커서 현재 건축물대장의 연면적 기준으로 수익률 계산`);
  //     }
  //   }
  //   // 현재 건축물대장의 연면적 기준으로 수익률 계산 
  //   console.log('makeProfit with currentBuilding ', type, buildingList[0]);
  //   for (const building of buildingList) {
  //     console.log(building);
  //   }
  //   const baseFloorNumber = Number(buildingList[0].baseFloorNumber) || 0;
  //   const gndFloorNumber = Number(buildingList[0].gndFloorNumber) || 1;
  //   const publicArea = getDefaultPublicArea(currentBuildingTotalFloorArea, gndFloorNumber);
  //   const firstFloorExclusiveArea = Number(currentBuildingArchArea) - publicArea;
  //   const currentBuildingTotalLandArea = buildingList?.reduce((total, building) => total + (building.landArea ? parseFloat(building.landArea) : 0.00), 0.00);

  //   const baseExclusiveArea = baseFloorNumber > 0 ?
  //     (currentBuildingTotalLandArea * BASE_FLOOR_AREA_RATIO) - publicArea :
  //     0;
  //   const totalUpperFloorArea = Number(currentBuildingTotalFloorArea) - firstFloorExclusiveArea - baseExclusiveArea
  //   const totalUpperFloorExclusiveArea = totalUpperFloorArea - (publicArea * (gndFloorNumber - 1));

  //   rentProfit = getRentProfitRatio(type) * (firstFloorRentProfitPerPy * (firstFloorExclusiveArea * 0.3025) +
  //     upperFloorRentProfitPerPy * (totalUpperFloorExclusiveArea) * 0.3025 +
  //     baseFloorRentProfitPerPy * (baseExclusiveArea * 0.3025));

  //   if (debug) {
  //     debugExtraInfo.push(`[현재건물층수] ${gndFloorNumber} / ${baseFloorNumber}`);

  //     debugExtraInfo.push(`[현재건물연면적] ${currentBuildingTotalFloorArea.toFixed(2)} (${(currentBuildingTotalFloorArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[공용면적] ${publicArea.toFixed(2)} (${(publicArea * 0.3025).toFixed(2)}평)`);

  //     debugExtraInfo.push(`[1층전용면적] ${firstFloorExclusiveArea.toFixed(2)} (${(firstFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[1층임대수익] ${krwUnit(firstFloorRentProfitPerPy * (firstFloorExclusiveArea * 0.3025))} (${krwUnit(firstFloorRentProfitPerPy)} (주변1층평당임대료) * ${(firstFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[지상층전용면적] ${totalUpperFloorExclusiveArea.toFixed(2)} (${(totalUpperFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[지상층(총)임대수익] ${krwUnit(upperFloorRentProfitPerPy * (totalUpperFloorExclusiveArea) * 0.3025)} (${krwUnit(upperFloorRentProfitPerPy)} (주변2층이상평당임대료) * ${(totalUpperFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[지하층전용면적] ${baseExclusiveArea} (${(baseExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[지하층(총)임대수익] ${krwUnit(baseFloorRentProfitPerPy * (baseExclusiveArea * 0.3025))} (${krwUnit(baseFloorRentProfitPerPy)} (주변지하층평당임대료) * ${(baseExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`<임대수익> ${krwUnit(rentProfit)} (${getRentProfitRatio(type)}(수익률가중치) * (1층임대수익 + 지상층임대수익 + 지하층임대수익))`);
  //   }

  //   managementProfit =
  //     (getManagementCostPerPy(currentBuildingTotalFloorArea, type)
  //       * (currentBuildingTotalFloorArea) * 0.3025) / 2;

  //   if (debug) {
  //     debugExtraInfo.push(`<관리비수익> ${krwUnit(managementProfit)} (${krwUnit(getManagementCostPerPy(currentBuildingTotalFloorArea, type))} * ${(currentBuildingTotalFloorArea * 0.3025).toFixed(2)}평  / 2)`);
  //   }

  // } else if (type === 'remodel') {

  //   const baseFloorNumber = Number(buildingList[0].baseFloorNumber) || 0;
  //   const currentGndFloorNumber = Number(buildingList[0].gndFloorNumber) || 1;
  //   const currentBuildingTotalLandArea = buildingList?.reduce((total, building) => total + (building.landArea ? parseFloat(building.landArea) : 0.00), 0.00);
  //   const availableTotalFloorArea = landInfo.far * landInfo.relTotalArea;
  //   const buildingArea = landInfo.bcr * landInfo.relTotalArea;
  //   const availGndFloorCount = Math.floor(availableTotalFloorArea / buildingArea);

  //   // 현재 건축물에서 최대 증축은 2층까지 가능 
  //   const gndFloorNumber = Math.min(currentGndFloorNumber + 2, availGndFloorCount);
  //   const publicArea = getDefaultPublicArea(currentBuildingTotalFloorArea, gndFloorNumber);

  //   const firstFloorExclusiveArea = Number(currentBuildingArchArea) - publicArea;

  //   const baseExclusiveArea = baseFloorNumber > 0 ?
  //     (currentBuildingTotalLandArea * BASE_FLOOR_AREA_RATIO) - publicArea :
  //     0;
  //   const totalUpperFloorArea = Number(currentBuildingTotalFloorArea) - firstFloorExclusiveArea - baseExclusiveArea
  //   const totalUpperFloorExclusiveArea = totalUpperFloorArea - (publicArea * (gndFloorNumber - 1));

  //   rentProfit = getRentProfitRatio(type) * (firstFloorRentProfitPerPy * (firstFloorExclusiveArea * 0.3025) +
  //     upperFloorRentProfitPerPy * (totalUpperFloorExclusiveArea) * 0.3025 +
  //     baseFloorRentProfitPerPy * (baseExclusiveArea * 0.3025));

  //   if (debug) {
  //     debugExtraInfo.push(`[현재건물층수] ${currentGndFloorNumber} / ${baseFloorNumber}`);

  //     debugExtraInfo.push(`[리모델링후건물층수] ${gndFloorNumber} / ${baseFloorNumber}`);
  //     debugExtraInfo.push(`[현재건물연면적] ${currentBuildingTotalFloorArea.toFixed(2)} (${(currentBuildingTotalFloorArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[공용면적] ${publicArea.toFixed(2)} (${(publicArea * 0.3025).toFixed(2)}평)`);

  //     debugExtraInfo.push(`[1층전용면적] ${firstFloorExclusiveArea.toFixed(2)} (${(firstFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[1층임대수익] ${krwUnit(firstFloorRentProfitPerPy * (firstFloorExclusiveArea * 0.3025))} (${krwUnit(firstFloorRentProfitPerPy)} (주변1층평당임대료) * ${(firstFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[지상층전용면적] ${totalUpperFloorExclusiveArea.toFixed(2)} (${(totalUpperFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[지상층(총)임대수익] ${krwUnit(upperFloorRentProfitPerPy * (totalUpperFloorExclusiveArea) * 0.3025)} (${krwUnit(upperFloorRentProfitPerPy)} (주변2층이상평당임대료) * ${(totalUpperFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[지하층전용면적] ${baseExclusiveArea} (${(baseExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[지하층(총)임대수익] ${krwUnit(baseFloorRentProfitPerPy * (baseExclusiveArea * 0.3025))} (${krwUnit(baseFloorRentProfitPerPy)} (주변지하층평당임대료) * ${(baseExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`<임대수익> ${krwUnit(rentProfit)} (${getRentProfitRatio(type)}(수익률가중치) * (1층임대수익 + 지상층임대수익 + 지하층임대수익))`);
  //   }

  //   managementProfit =
  //     (getManagementCostPerPy(currentBuildingTotalFloorArea, type)
  //       * (currentBuildingTotalFloorArea) * 0.3025) / 2;

  //   if (debug) {
  //     debugExtraInfo.push(`<관리비수익> ${krwUnit(managementProfit)} (${krwUnit(getManagementCostPerPy(currentBuildingTotalFloorArea, type))} * ${(currentBuildingTotalFloorArea * 0.3025).toFixed(2)}평  / 2)`);
  //   }

  // } else {

  //   // 신축기준으로 수익률 계산 
  //   console.log('makeProfit with buildInfo ', type);
  //   // 월 임대료 수익 
  //   rentProfit = getRentProfitRatio(type) * ((firstFloorRentProfitPerPy * (buildInfo.firstFloorExclusiveArea * 0.3025)) +
  //     (upperFloorRentProfitPerPy * (buildInfo.secondFloorExclusiveArea * 0.3025)) +
  //     (baseFloorRentProfitPerPy * buildInfo.lowerFloorExclusiveArea * 0.3025)) // 임대료 

  //   if (debug) {
  //     debugExtraInfo.push(`[개발후건물연면적] ${(buildInfo.lowerFloorArea + buildInfo.upperFloorArea).toFixed(2)} (${((buildInfo.lowerFloorArea + buildInfo.upperFloorArea) * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[개발후건물층수] ${buildInfo.upperFloorCount} / ${buildInfo.lowerFloorCount}`);
  //     debugExtraInfo.push(`[1층전용면적] ${buildInfo.firstFloorExclusiveArea.toFixed(2)} (${(buildInfo.firstFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[1층임대수익] ${krwUnit(firstFloorRentProfitPerPy * (buildInfo.firstFloorExclusiveArea * 0.3025))} (${krwUnit(firstFloorRentProfitPerPy)} (주변1층평당임대료) * ${(buildInfo.firstFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[지상층전용면적] ${buildInfo.secondFloorExclusiveArea.toFixed(2)} (${(buildInfo.secondFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[지상층임대수익] ${krwUnit(upperFloorRentProfitPerPy * (buildInfo.secondFloorExclusiveArea) * 0.3025)} (${krwUnit(upperFloorRentProfitPerPy)} (주변2층이상평당임대료) * ${(buildInfo.secondFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[지하층전용면적] ${buildInfo.lowerFloorExclusiveArea.toFixed(2)} (${(buildInfo.lowerFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`[지하층임대수익] ${krwUnit(baseFloorRentProfitPerPy * (buildInfo.lowerFloorExclusiveArea * 0.3025))} (${krwUnit(baseFloorRentProfitPerPy)} (주변지하층평당임대료) * ${(buildInfo.lowerFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
  //     debugExtraInfo.push(`<임대수익> ${krwUnit(rentProfit)} (${getRentProfitRatio(type)}(수익률가중치) * (1층임대수익 + 지상층임대수익 + 지하층임대수익))`);
  //   }

  //   // 월 관리비 수익 (1/2 만 수익으로 계산)
  //   managementProfit =
  //     (getManagementCostPerPy(buildInfo.upperFloorArea + buildInfo.lowerFloorArea, type)
  //       * ((buildInfo.upperFloorArea + buildInfo.lowerFloorArea) * 0.3025)) / 2;

  //   if (debug) {
  //     debugExtraInfo.push(`<총관리비수익> ${krwUnit(managementProfit)} (${krwUnit(getManagementCostPerPy(buildInfo.upperFloorArea + buildInfo.lowerFloorArea, type))} * ${((buildInfo.firstFloorExclusiveArea + buildInfo.secondFloorExclusiveArea + buildInfo.lowerFloorExclusiveArea) * 0.3025).toFixed(2)}평 / 2)`);
  //   }


  // }

  if (type === 'rent') {

    // 현재 건축물대장의 연면적 기준으로 수익률 계산 
    console.log('makeProfit with currentBuilding ', type, buildingList[0]);
    for (const building of buildingList) {
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

    rentProfit = getRentProfitRatio(type) * (firstFloorRentProfitPerPy * (firstFloorExclusiveArea * 0.3025) +
      upperFloorRentProfitPerPy * (totalUpperFloorExclusiveArea) * 0.3025 +
      baseFloorRentProfitPerPy * (baseExclusiveArea * 0.3025));

    if (debug) {
      debugExtraInfo.push(`[현재건물층수] ${gndFloorNumber} / ${baseFloorNumber}`);

      debugExtraInfo.push(`[현재건물연면적] ${currentBuildingTotalFloorArea.toFixed(2)} (${(currentBuildingTotalFloorArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[공용면적] ${publicArea.toFixed(2)} (${(publicArea * 0.3025).toFixed(2)}평)`);

      debugExtraInfo.push(`[1층전용면적] ${firstFloorExclusiveArea.toFixed(2)} (${(firstFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[1층임대수익] ${krwUnit(firstFloorRentProfitPerPy * (firstFloorExclusiveArea * 0.3025))} (${krwUnit(firstFloorRentProfitPerPy)} (주변1층평당임대료) * ${(firstFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[2층이상전용면적] ${totalUpperFloorExclusiveArea.toFixed(2)} (${(totalUpperFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[2층이상임대수익] ${krwUnit(upperFloorRentProfitPerPy * (totalUpperFloorExclusiveArea) * 0.3025)} (${krwUnit(upperFloorRentProfitPerPy)} (주변2층이상평당임대료) * ${(totalUpperFloorExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[지하층전용면적] ${baseExclusiveArea.toFixed(2)} (${(baseExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[지하층임대수익] ${krwUnit(baseFloorRentProfitPerPy * (baseExclusiveArea * 0.3025))} (${krwUnit(baseFloorRentProfitPerPy)} (주변지하층평당임대료) * ${(baseExclusiveArea * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`<임대수익> ${krwUnit(rentProfit)} (${getRentProfitRatio(type)}(수익률가중치) * (1층임대수익 + 지상층임대수익 + 지하층임대수익))`);
    }

    managementProfit =
      (getManagementCostPerPy(currentBuildingTotalFloorArea, type)
        * (currentBuildingTotalFloorArea) * 0.3025) / 2;

    if (debug) {
      debugExtraInfo.push(`<관리비수익> ${krwUnit(managementProfit)} (${krwUnit(getManagementCostPerPy(currentBuildingTotalFloorArea, type))} * ${(currentBuildingTotalFloorArea * 0.3025).toFixed(2)}평  / 2)`);
    }

  } else {

    // buildInfo 기준으로 수익률 계산 
    console.log('makeProfit with buildInfo ', type);
    // 월 임대료 수익 
    rentProfit = getRentProfitRatio(type) * ((firstFloorRentProfitPerPy * (buildInfo.firstFloorExclusiveArea * 0.3025)) +
      (upperFloorRentProfitPerPy * (buildInfo.secondFloorExclusiveArea * 0.3025)) +
      (baseFloorRentProfitPerPy * buildInfo.lowerFloorExclusiveArea * 0.3025)) // 임대료 

    if (debug) {
      debugExtraInfo.push(`[개발후건물연면적] ${(buildInfo.lowerFloorArea + buildInfo.upperFloorArea).toFixed(2)} (${((buildInfo.lowerFloorArea + buildInfo.upperFloorArea) * 0.3025).toFixed(2)}평)`);
      debugExtraInfo.push(`[개발후건물층수] ${buildInfo.upperFloorCount} / ${buildInfo.lowerFloorCount}`);
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

    if (debug) {
      debugExtraInfo.push(`<총관리비수익> ${krwUnit(managementProfit)} (${krwUnit(getManagementCostPerPy(buildInfo.upperFloorArea + buildInfo.lowerFloorArea, type))} * ${((buildInfo.firstFloorExclusiveArea + buildInfo.secondFloorExclusiveArea + buildInfo.lowerFloorExclusiveArea) * 0.3025).toFixed(2)}평 / 2)`);
    }


  }

  value.annualRentProfit = rentProfit * 12;
  value.annualManagementProfit = managementProfit * 12;
  value.annualDepositProfit = rentProfit * 10;
  if (debug) {
    debugExtraInfo.push(`<연임대수익> ${krwUnit(value.annualRentProfit)} (${krwUnit(rentProfit)} * 12)`);
    debugExtraInfo.push(`<연관리비수익> ${krwUnit(value.annualManagementProfit)} (${krwUnit(managementProfit)} * 12)`);
    debugExtraInfo.push(`<연보증금수익> ${krwUnit(value.annualDepositProfit)} (${krwUnit(rentProfit)} * 10)`);
  }
  // console.log('makeProfit result', type, value);
}

function makeResult(land: LandData, value: ReportValue, tax: TaxInfo, publicPriceGrowthRate: number, debug: boolean = false, debugExtraInfo: string[] = []) {
  if (debug) {
    debugExtraInfo.push(`\n`);
    debugExtraInfo.push(`최종`);
  }
  const totalProjectCost = calculateTotalProjectCost(value, debug, debugExtraInfo);
  const initialCapital = calculateInitialCapital(value, debug, debugExtraInfo);
  // const investmentCapital = calculateRealInvestmentCapital(value, totalProjectCost, debug, debugExtraInfo);
  const annualRentProfit = calculateAnnualRentProfit(value, tax, debug, debugExtraInfo);
  const profitRatio = annualRentProfit / (totalProjectCost - value.annualDepositProfit);
  if (debug) {
    debugExtraInfo.push(`[수익률] ${(profitRatio * 100).toFixed(1)}% (${krwUnit(annualRentProfit)}(연간임대수익) / (${krwUnit(totalProjectCost)}(총사업비) - ${krwUnit(value.annualDepositProfit)}(보증금))`);
  }
  // const rentProfitRatio = annualProfit / investmentCapital;
  // if(debug){
  //   debugExtraInfo.push(`[임대수익률] ${(rentProfitRatio * 100).toFixed(1)}% (${krwUnit(annualProfit)}(연간순수익) / ${krwUnit(investmentCapital)}(실투자금))`);
  // }
  // const investmentProfitRatio = (annualProfit + (value.landCost.purchaseCost * 0.045)) / investmentCapital;
  // if(debug){
  //   debugExtraInfo.push(`[연간수익률] ${(investmentProfitRatio * 100).toFixed(1)}% (${krwUnit(annualProfit)}(연간순수익) + ${krwUnit(value.landCost.purchaseCost * 0.045)}(자산상승금액 (토지매입비 * 4.5%)) / ${krwUnit(investmentCapital)}(실투자금))`);
  // }
  let rentProfitBase = 4.0;
  if (land.legDongName.includes('강남구')
    || land.legDongName.includes('용산구')
    || land.legDongName.includes('성동구')
    || land.legDongName.includes('마포구')
    || land.legDongName.includes('종로구')
    || land.legDongName.includes('서초구')
    || land.legDongName.includes('송파구')
    || land.legDongName.includes('광진구')
    || land.legDongName.includes('영등포구')
    || land.legDongName.includes('중구')
  ) {
    rentProfitBase = 3.0;
  } else if (land.legDongName.includes('동대문구')
    || land.legDongName.includes('관악구')
    || land.legDongName.includes('강서구')
    || land.legDongName.includes('구로구')
    || land.legDongName.includes('금천구')
    || land.legDongName.includes('양천구')
    || land.legDongName.includes('강동구')
  ) {
    rentProfitBase = 3.25;
  } else if (land.legDongName.includes('동작구')
    || land.legDongName.includes('서대문구')
    || land.legDongName.includes('노원구')
  ) {
    rentProfitBase = 3.50;
  } else if (land.legDongName.includes('중랑구')
    || land.legDongName.includes('강북구')
    || land.legDongName.includes('성북구')
    || land.legDongName.includes('은평구')
    || land.legDongName.includes('도봉구')
  ) {
    rentProfitBase = 4.00;
  }

  const expectedSaleAmount = (value.annualManagementProfit + value.annualRentProfit) / (rentProfitBase / 100);
  if (debug) {
    debugExtraInfo.push(`[매각금액] ${krwUnit(expectedSaleAmount)} (${krwUnit(value.annualManagementProfit)}(연간관리비수익) + ${krwUnit(value.annualRentProfit)}(연간임대수익) / (${rentProfitBase.toFixed(2)}%))`);
  }

  return {
    grade: value.grade,
    totalProjectCost: totalProjectCost,
    initialCapital: initialCapital,
    // investmentCapital: investmentCapital,
    annualRentProfit: annualRentProfit,
    profitRatio: profitRatio,
    avgPublicLandPriceGrowthRate: publicPriceGrowthRate,
    // investmentProfitRatio: investmentProfitRatio,
    expectedSaleAmount: expectedSaleAmount
  } as ReportResult;
}

function calculateInitialCapital(value: ReportValue, debug: boolean = false, debugExtraInfo: string[] = []) {

  const costWithoutLoan = (value.projectCost.demolitionCost +
    value.projectCost.demolitionManagementCost +
    value.projectCost.constructionDesignCost +
    value.projectCost.constructionCost +
    value.projectCost.managementCost +
    value.projectCost.pmFee +
    value.landCost.purchaseCost) * (1 - LOAN_RATIO);

  const result = costWithoutLoan + value.landCost.agentFee + value.landCost.acquisitionCost + value.projectCost.acquisitionTax + value.projectCost.reserveFee + value.loan.loanInterest;

  if (debug) {
    debugExtraInfo.push(`[초기자본금] ${krwUnit(result)} (${krwUnit(costWithoutLoan)}(토지매입비 + 개발사업비) * ${((1 - LOAN_RATIO) * 100).toFixed(1)}%)
    + ${krwUnit(value.landCost.agentFee)}(중개보수) + ${krwUnit(value.landCost.acquisitionCost)}(취득세(토지)) 
    + ${krwUnit(value.projectCost.acquisitionTax)}(취득세(사업비)) + ${krwUnit(value.projectCost.reserveFee)}(예비비(사업비)) + ${krwUnit(value.loan.loanInterest)}(사업기간내금융이자)`);
  }
  return result;
}

// function calculateRealInvestmentCapital(value : ReportValue, totalProjectCost : number, debug : boolean = false, debugExtraInfo : string[] = []){

//   const result = totalProjectCost - value.loan.loanAmount - value.annualDepositProfit;

//   if(debug){
//     debugExtraInfo.push(
//       `[실투자금] ${krwUnit(result)} (` +
//       `총사업비 (${krwUnit(totalProjectCost)}) - 보증금 (${krwUnit(value.annualDepositProfit)}) - 금융차입금 (${krwUnit(value.loan.loanAmount)}))`
//     );
//   }

//   return result
// }



function calculateTotalProjectCost(value: ReportValue, debug: boolean = false, debugExtraInfo: string[] = []) {

  const result = value.projectCost.demolitionCost +
    value.projectCost.demolitionManagementCost +
    value.projectCost.constructionDesignCost +
    value.projectCost.constructionCost +
    value.projectCost.managementCost +
    value.projectCost.pmFee +
    value.landCost.purchaseCost +
    value.landCost.acquisitionCost +
    value.landCost.agentFee +
    value.loan.loanInterest

  if (debug) {
    debugExtraInfo.push(`[총사업비] ${krwUnit(result)} (사업비 ${krwUnit(value.projectCost.demolitionCost +
      value.projectCost.demolitionManagementCost +
      value.projectCost.constructionDesignCost +
      value.projectCost.constructionCost +
      value.projectCost.managementCost +
      value.projectCost.pmFee)} + 토지매입비 ${krwUnit(value.landCost.purchaseCost)} 
      + (취득세 + 법무사비) ${krwUnit(value.landCost.acquisitionCost)} + 중개보수 ${krwUnit(value.landCost.agentFee)} + 사업기간내 금융이자 ${krwUnit(value.loan.loanInterest)})`);
  }
  return result
}

// function calculateAnnualProfit(value : ReportValue, tax : TaxInfo, debug : boolean = false, debugExtraInfo : string[] = []){

//   const result = value.annualRentProfit + value.annualManagementProfit - (tax.propertyTax + tax.propertyTaxForBuilding + tax.comprehensiveRealEstateTax + value.loan.loanInterestPerYear);

//   if(debug){
//     debugExtraInfo.push(`[연간 순수익] ${krwUnit(result)} (${krwUnit(value.annualRentProfit)}(연간임대수익) + ${krwUnit(value.annualManagementProfit)}(연간관리비수익) - (${krwUnit(tax.propertyTax)}(토지재산세) + ${krwUnit(tax.propertyTaxForBuilding)}(건물재산세) + ${krwUnit(tax.comprehensiveRealEstateTax)}(종합부동산세) + ${krwUnit(value.loan.loanInterestPerYear)}(금융차입이자))`);
//   }
//   return result;
// }


function calculateAnnualRentProfit(value: ReportValue, tax: TaxInfo, debug: boolean = false, debugExtraInfo: string[] = []) {

  const result = value.annualRentProfit + value.annualManagementProfit;

  if (debug) {
    debugExtraInfo.push(`[연간임대수익] ${krwUnit(result)} (${krwUnit(value.annualRentProfit)}(연간임대수익) + ${krwUnit(value.annualManagementProfit)}(연간관리비수익)`);
  }
  return result;
}

function makeTaxInfo(curLandInfo: LandData, totalFloorArea: number, structureCodeName: string, useApprovalDate: string, taxInfo: TaxInfo, debug: boolean = false, debugInfo: string[] = []) {
  if (debug) {
    debugInfo.push(`\n`);
    debugInfo.push(`🧾 세금`);
  }
  taxInfo.propertyTax = getPropertyTax(curLandInfo.relTotalPrice, curLandInfo.relTotalArea, debug, debugInfo);

  taxInfo.propertyTaxForBuilding = getPropertyTaxForBuilding(
    curLandInfo.relTotalPrice,
    totalFloorArea,
    structureCodeName,
    useApprovalDate,
    debug, debugInfo);

  taxInfo.comprehensiveRealEstateTax = getComprehensiveRealEstateTax(curLandInfo.relTotalPrice, curLandInfo.relTotalArea, taxInfo.propertyTax, debug, debugInfo);
  // devDetailInfo.build.tax.comprehensiveRealEstateTax = getComprehensiveRealEstateTax(curLandInfo.relTotalPrice, devDetailInfo.buildInfo.upperFloorArea + devDetailInfo.buildInfo.lowerFloorArea, debug, devDetailInfo.debugExtraInfo);
  // if(debug){
  //   // devDetailInfo.debugExtraInfo.push(`<재산세(건물)> ${devDetailInfo.tax.propertyTaxForBuilding}원 (작업중..)`);
  //   debugInfo.push(`<종합부동산세> ${taxInfo.comprehensiveRealEstateTax}원 (작업중..)`);
  // }

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
    tax: {
      propertyTax: 0,
      propertyTaxForBuilding: 0,
      comprehensiveRealEstateTax: 0,
    },
    result: null,
  };
}


function reportValueToJsonString(report: ReportValue, result: ReportResult): string {
  if (report && result) {
    const reportJson = {
      '등급': report.grade,
      '공사기간': report.duration.constructionDurationMonths + report.duration.designDurationMonths + report.duration.planningDurationMonths,
      // '초기준비자금': krwUnit(result.initialCapital, true),
      // '실투자금': krwUnit(result.investmentCapital, true),
      '총사업비': krwUnit(result.totalProjectCost, true),
      '초기투자금': krwUnit(result.initialCapital, true),
      // '연간 순수익': krwUnit(result.annualProfit, true),
      '연간임대수익': krwUnit(result.annualRentProfit, true),
      // '임대수익율': result.rentProfitRatio,
      '개발 후 임대수익률': result.profitRatio,
      '공시지가 상승률(5년 평균)': result.avgPublicLandPriceGrowthRate,
      // '연간수익율': result.investmentProfitRatio,
      '수익률 환산 가치': krwUnit(result.expectedSaleAmount, true),
    }
    return JSON.stringify(reportJson);
  }
  return '없음';
}

export class AIReportModel {

  static async getBuildingDataList(landId: string) {

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
        blh.base_floor_number AS baseFloorNumber,
        blh.structure_code_name AS structureCodeName
      FROM building_leg_headline blh
      JOIN cand_building_ids c
        ON c.building_id = blh.building_id
      ORDER BY blh.total_floor_area DESC;
      `,
      [landId]
    )

    return buildingList;
  }

  static async getLandData(landId: string) {
    const landDataList = await db.query<LandData>(
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
            source,  -- main / sub 구분
            CONCAT(
              CAST(bun_pad AS UNSIGNED),
              CASE WHEN CAST(ji_pad AS UNSIGNED) > 0
                  THEN CONCAT('-', CAST(ji_pad AS UNSIGNED))
                  ELSE ''
              END
            ) AS jibun_norm
          FROM (
            SELECT 
              rm.building_id,
              rm.leg_code,
              rm.bun_pad,
              rm.ji_pad,
              'MAIN' AS source
            FROM rows_main rm

            UNION ALL

            SELECT 
              rs.building_id,
              rs.leg_code,
              rs.bun_pad,
              rs.ji_pad,
              'SUB' AS source
            FROM rows_sub rs
          ) u
        ),
        /* land_info 매칭으로 관련 필지 id 수집 */
        related_li_ids AS (
          SELECT
            li2.id AS li_id,
            MAX(CASE WHEN rk.source = 'MAIN' THEN 1 ELSE 0 END) AS is_main  -- ✅ main 여부
          FROM row_keys rk
          JOIN land_info li2
            ON li2.leg_dong_code = rk.leg_code
          AND li2.jibun         = rk.jibun_norm
          JOIN base b
            ON li2.div_code = b.div_code
          GROUP BY li2.id
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
          lc.jimok_name AS jimokName,
          lc.cur_use AS curUse,
          lc.road_contact AS roadContact,          
          llur.far,
          llur.bcr,
          COALESCE(ap_main.lat, ap_base.lat) AS lat,
          COALESCE(ap_main.lng, ap_base.lng) AS lng,
          ( SELECT CONCAT('[' , GROUP_CONCAT(JSON_OBJECT(
              'usageName', land_usage.usage_name,
              'usageCode', land_usage.usage_code,
              'lawCode', usage_code.law_code,
              'lawName', usage_code.law_name,
              'conflict', land_usage.conflict
              )), ']') FROM fs_bds.land_usage_info as land_usage
              LEFT JOIN fs_bds.land_usage_code as usage_code on land_usage.usage_code = usage_code.code or land_usage.usage_name = usage_code.name
              where land_usage.id = li.id
          ) as usageList,              
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
          ra.relParcelCount AS relParcelCount,
          (SELECT GROUP_CONCAT(id) FROM final_ids) AS relLandIds
        FROM land_info li
        LEFT JOIN land_char_latest lc
          ON lc.id = li.id
        LEFT JOIN leg_land_usage_ratio llur
          ON lc.usage1_name = llur.name
        LEFT JOIN address_polygon ap_main
          ON ap_main.id = (
            SELECT r.li_id
            FROM related_li_ids r
            WHERE r.is_main = 1         -- ✅ rows_main 에서 온 필지 중 하나
            ORDER BY r.li_id            -- 필요하면 정렬 기준(예: 가장 작은 id) 추가
            LIMIT 1
          )
        LEFT JOIN address_polygon ap_base
          ON ap_base.id = li.id
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
            WHERE (price / land_area) >= 200
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

    for (const land of landDataList) {
      if (land.usageList) {
        try {
          land.usageList = JSON.parse(land.usageList as any);
        } catch (e) {
          land.usageList = [];
        }
      }
    }

    const landInfo = landDataList[0];
    if (landInfo) {
      const ids = (landInfo.relLandIds || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

      let totalArea = landInfo.relTotalArea;

      const bcrFarList = [];
      for (const id of ids) {
        const { area, bcr, far } = await LandModel.getBcrFarByOverlappingUsage(id);
        console.log('getOverlapUsageInfo ', area, bcr, far);
        bcrFarList.push({ area, bcr, far });
      }

      const totalBcr = bcrFarList.reduce((sum, item) => {
        const ratio = item.area / totalArea;
        return sum + (item.bcr * ratio);
      }, 0);

      const totalFar = bcrFarList.reduce((sum, item) => {
        const ratio = item.area / totalArea;
        return sum + (item.far * ratio);
      }, 0);

      landInfo.relWeightedBcr = Math.round(totalBcr);
      landInfo.relWeightedFar = Math.round(totalFar);
      console.log('Weighted BCR:', landInfo.relWeightedBcr);
      console.log('Weighted FAR:', landInfo.relWeightedFar);
    }

    return landInfo;
  }

  static async getBuildProjectCost(
    landId: string,
  ): Promise<{
    landInfo: LandData;
    buildingList: BuildingData[];
    totalProjectCost: number;
  }> {
    const devDetailInfo = {
      rent: newReportValue(),
      remodel: newReportValue(),
      build: newReportValue(),
      buildInfo: null,
      remodelInfo: null,
      analysisMessage: ''
    } as DevDetailInfo;

    const buildingList = await this.getBuildingDataList(landId);

    const landInfo = await this.getLandData(landId);

    console.log('landInfo ', landInfo)
    console.log('currBuildingList ', buildingList)


    // if(landInfo){
    //   const ids = (landInfo.relLandIds || '')
    //     .split(',')
    //     .map((v) => v.trim())
    //     .filter(Boolean);

    //   let totalArea = landInfo.relTotalArea;

    //   const bcrFarList = [];
    //   for (const id of ids) {
    //     const {area, bcr, far} = await LandModel.getBcrFarByOverlappingUsage(id);
    //     console.log('getOverlapUsageInfo ', area, bcr, far);
    //     bcrFarList.push({area, bcr, far});
    //   }

    //   const totalBcr = bcrFarList.reduce((sum, item) => {
    //     const ratio = item.area / totalArea;
    //     return sum + (item.bcr * ratio);
    //   }, 0);

    //   const totalFar = bcrFarList.reduce((sum, item) => {
    //     const ratio = item.area / totalArea;
    //     return sum + (item.far * ratio);
    //   }, 0);

    //   curLandInfo.relWeightedBcr = Math.round(totalBcr);
    //   curLandInfo.relWeightedFar = Math.round(totalFar);
    //   console.log('Weighted BCR:', curLandInfo.relWeightedBcr);
    //   console.log('Weighted FAR:', curLandInfo.relWeightedFar);
    // }

    const curBuildingTotalFloorArea = buildingList?.reduce((total, building) => total + (building.totalFloorArea ? parseFloat(building.totalFloorArea) : 0.00), 0.00);

    devDetailInfo.buildInfo = makeBuildInfo(landInfo, false, null);
    devDetailInfo.build.duration = getBuildProjectDuration(devDetailInfo.buildInfo.upperFloorArea + devDetailInfo.buildInfo.lowerFloorArea, false, null);

    makeProjectCost(
      'build',
      devDetailInfo.build.projectCost,
      curBuildingTotalFloorArea,
      devDetailInfo.buildInfo.upperFloorArea + devDetailInfo.buildInfo.lowerFloorArea,
      devDetailInfo.build.duration,
      false,
      null
    );
    const totalProjectCost =
      devDetailInfo.build.projectCost.demolitionCost +
      devDetailInfo.build.projectCost.demolitionManagementCost +
      devDetailInfo.build.projectCost.constructionDesignCost +
      devDetailInfo.build.projectCost.constructionCost +
      devDetailInfo.build.projectCost.managementCost +
      devDetailInfo.build.projectCost.pmFee;

    return {
      landInfo: landInfo,
      buildingList,
      totalProjectCost
    }
  }

  static async makeDevDetailInfo(
    landId: string,
    estimatedPrice: EstimatedPriceInfo,
    debug: boolean = false
  ): Promise<{
    landInfo: LandData;
    buildingList: BuildingData[];
    devDetailInfo: DevDetailInfo;
    debug?: boolean;
    rentInfoList?: RentInfo[];
  } | null> {
    // console.log('landId', landId)
    // console.log('estimatedPrice', estimatedPrice)

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
      analysisMessage: ''
    } as DevDetailInfo;

    const publicPriceGrowthRate = await LandModel.calculatePublicPriceGrowthRate(landId);

    const buildingList = await this.getBuildingDataList(landId);

    const landInfo = await this.getLandData(landId);

    console.log('landInfo ', landInfo)
    console.log('currBuildingList ', buildingList)


    const curBuildingInfo = (buildingList && buildingList.length > 0) ? buildingList[0] : null;
    const curBuildingFar = curBuildingInfo?.floorAreaRatio ? parseFloat(curBuildingInfo.floorAreaRatio) : 0.00; // 용적률

    const curBuildingUseApprovalDate = curBuildingInfo?.useApprovalDate.trim(); // 준공연도 
    const curBuildingAge = curBuildingUseApprovalDate ? getBuildingAge(curBuildingUseApprovalDate) : 40; // 준공연도가 없으면 건물노후(40년)로 설정

    // const curBuildingTotalFloorArea = curBuildingInfo?.totalFloorArea ? parseFloat(curBuildingInfo.totalFloorArea) : 0.00;
    const curBuildingTotalFloorArea = buildingList?.reduce((total, building) => total + (building.totalFloorArea ? parseFloat(building.totalFloorArea) : 0.00), 0.00);
    // console.log('buildingAge ', buildingAge)
    // console.log('floorAreaRatio ', floorAreaRatio)
    // console.log('buildingTotalFloorArea ', buildingTotalFloorArea)

    if (debug) {
      devDetailInfo.debugExtraInfo = estimatedPrice.debugText;
      devDetailInfo.debugExtraInfo.push(`=========================`);
      if (!curBuildingUseApprovalDate) {
        devDetailInfo.debugExtraInfo.push(`* 건축물 대장에 준공년도가 없어 건물노후 40년으로 설정`);
      }
      devDetailInfo.debugExtraInfo.push(`건물 준공연도: ${curBuildingUseApprovalDate || '-'} (건물노후 ${curBuildingAge}년)`);
      devDetailInfo.debugExtraInfo.push(`건물 개수: ${buildingList?.length || 0}개`);
      devDetailInfo.debugExtraInfo.push(`건물 총 연면적: ${curBuildingTotalFloorArea.toFixed(2)}`);
      devDetailInfo.debugExtraInfo.push(`건물 용적률: ${curBuildingFar.toFixed(2)}%`);
      devDetailInfo.debugExtraInfo.push(`=> 개발후 건폐율: ${Number(landInfo.relWeightedBcr).toFixed(0)}%`);
      devDetailInfo.debugExtraInfo.push(`=> 개발후 용적률: ${Number(landInfo.relWeightedFar).toFixed(0)}%`);
    }

    console.log('env ', process.env.NODE_ENV)

    // if (debug) {
    //   devDetailInfo.debugExtraInfo.push(`✨ 추천`);
    // }
    // if (curBuildingInfo) {
    //   if (curBuildingAge < 10) {
    //     if (curBuildingFar < (landInfo.relWeightedFar * 0.5)) {
    //       console.log('10년 미만 신축 !!')
    //       if (debug) {
    //         devDetailInfo.debugExtraInfo.push(`준공 10년 미만에 현재 건물 용적률 ${curBuildingFar}이 개발후 용적률의 (50%) ${landInfo.relWeightedFar * 0.5}보다 작아 신축을 추천`);
    //       }
    //       makeReportValue(devDetailInfo.build, 'A', 'build');
    //       makeReportValue(devDetailInfo.remodel, 'C', 'remodel');
    //       makeReportValue(devDetailInfo.rent, 'B', 'rent');
    //     } else {
    //       if (debug) {
    //         devDetailInfo.debugExtraInfo.push(`준공 10년 미만에 현재 건물 용적률 ${curBuildingFar}이 개발후 용적률의 (50%) ${landInfo.relWeightedFar * 0.5}보다 크므로 임대를 추천`);
    //       }
    //       console.log('10년 미만 미개발 !!')
    //       makeReportValue(devDetailInfo.build, 'B', 'build');
    //       makeReportValue(devDetailInfo.remodel, 'C', 'remodel');
    //       makeReportValue(devDetailInfo.rent, 'A', 'rent');
    //     }
    //   } else if (curBuildingAge < 20) {
    //     if (curBuildingFar < (landInfo.relWeightedFar * 0.5)) {
    //       console.log('20년 미만 신축 !!')
    //       if (debug) {
    //         devDetailInfo.debugExtraInfo.push(`준공 20년 미만에 현재 건물 용적률 ${curBuildingFar}이 개발후 용적률의 (50%) ${landInfo.relWeightedFar * 0.5}보다 작아 신축을 추천`);
    //       }
    //       makeReportValue(devDetailInfo.build, 'A', 'build');
    //       makeReportValue(devDetailInfo.remodel, 'B', 'remodel');
    //       makeReportValue(devDetailInfo.rent, 'C', 'rent');
    //     } else {
    //       console.log('20년 미만 리모델링 !!')
    //       if (debug) {
    //         devDetailInfo.debugExtraInfo.push(`준공 20년 미만에 현재 건물 용적률 ${curBuildingFar}%이 개발후 용적률의 (50%) ${landInfo.relWeightedFar * 0.5}%보다 크므로 리모델링을 추천`);
    //       }
    //       makeReportValue(devDetailInfo.build, 'B', 'build');
    //       makeReportValue(devDetailInfo.remodel, 'A', 'remodel');
    //       makeReportValue(devDetailInfo.rent, 'C', 'rent');
    //     }
    //   } else if (curBuildingAge < 30) {
    //     if (curBuildingFar < (landInfo.relWeightedFar * 0.8)) {
    //       console.log('30년 미만 신축 !!')
    //       if (debug) {
    //         devDetailInfo.debugExtraInfo.push(`준공 30년 미만에 현재 건물 용적률 ${curBuildingFar}%이 개발후 용적률의 (80%) ${landInfo.relWeightedFar * 0.8}%보다 작아 신축을 추천`);
    //       }
    //       makeReportValue(devDetailInfo.build, 'A', 'build');
    //       makeReportValue(devDetailInfo.remodel, 'B', 'remodel');
    //       makeReportValue(devDetailInfo.rent, 'C', 'rent');
    //     } else {
    //       console.log('30년 미만 리모델링 !!')
    //       if (debug) {
    //         devDetailInfo.debugExtraInfo.push(`준공 30년 미만에 현재 건물 용적률 ${curBuildingFar}%이 개발후 용적률의 (80%) ${landInfo.relWeightedFar * 0.8}%보다 크므로 리모델링을 추천`);
    //       }
    //       makeReportValue(devDetailInfo.build, 'B', 'build');
    //       makeReportValue(devDetailInfo.remodel, 'A', 'remodel');
    //       makeReportValue(devDetailInfo.rent, 'C', 'rent');
    //     }
    //   } else {
    //     // 30년 이상
    //     console.log('30년 이상 신축 !!')
    //     if (debug) {
    //       devDetailInfo.debugExtraInfo.push(`준공 30년 이상은 신축을 추천`);
    //     }
    //     makeReportValue(devDetailInfo.build, 'A', 'build');
    //     makeReportValue(devDetailInfo.remodel, 'C', 'remodel');
    //     makeReportValue(devDetailInfo.rent, 'C', 'rent');
    //   }
    // } else {
    //   if (debug) {
    //     devDetailInfo.debugExtraInfo.push(`건물이 없어 신축을 추천`);
    //   }
    //   makeReportValue(devDetailInfo.build, 'A', 'build');
    //   devDetailInfo.remodel = null;
    //   devDetailInfo.rent = null;
    //   // makeReportValue(aiReport.remodel, 'C', 'remodel');
    //   // makeReportValue(aiReport.rent, 'C', 'rent');
    // }


    const {
      aroundRentInfo,
      rentInfoList,
    } = await LandModel.getAroundRentInfo(landInfo.lat, landInfo.lng, landInfo.roadContact, IS_DEVELOPMENT);
    // console.log('aroundRentInfoResult ', aroundRentInfoResult)
    // makeBuildInfo(devDetailInfo, landInfo, debug);

    // 1층 평균 평당 임대료
    let firstFloorRentProfitPerPy = aroundRentInfo.find((info: any) => info.floor_type === '1')?.median_rent_per_py;
    // 2층이상 평균 평당 임대료
    let upperFloorRentProfitPerPy = aroundRentInfo.find((info: any) => info.floor_type === '2')?.median_rent_per_py;
    // 지하층 평균 평당 임대료
    let baseFloorRentProfitPerPy = aroundRentInfo.find((info: any) => info.floor_type === '3')?.median_rent_per_py;

    // console.log('firstFloorRentProfitPerPy ', firstFloorRentProfitPerPy)
    // console.log('upperFloorRentProfitPerPy ', upperFloorRentProfitPerPy)
    // console.log('baseFloorRentProfitPerPy ', baseFloorRentProfitPerPy)

    firstFloorRentProfitPerPy = (firstFloorRentProfitPerPy || (upperFloorRentProfitPerPy * 1.2) || (baseFloorRentProfitPerPy * 1.4) || 0);
    upperFloorRentProfitPerPy = (upperFloorRentProfitPerPy || (firstFloorRentProfitPerPy * 0.8) || (baseFloorRentProfitPerPy * 1.2) || 0);
    if (upperFloorRentProfitPerPy > firstFloorRentProfitPerPy) {
      upperFloorRentProfitPerPy = (firstFloorRentProfitPerPy * 0.8)
    }
    baseFloorRentProfitPerPy = (baseFloorRentProfitPerPy || (firstFloorRentProfitPerPy * 0.6) || (upperFloorRentProfitPerPy * 0.8) || 0);
    if (baseFloorRentProfitPerPy > firstFloorRentProfitPerPy) {
      baseFloorRentProfitPerPy = (firstFloorRentProfitPerPy * 0.6)
    }

    firstFloorRentProfitPerPy = firstFloorRentProfitPerPy * 10000;
    upperFloorRentProfitPerPy = upperFloorRentProfitPerPy * 10000;
    baseFloorRentProfitPerPy = baseFloorRentProfitPerPy * 10000;

    if (debug) {
      devDetailInfo.debugExtraInfo.push(`---`);
      devDetailInfo.debugExtraInfo.push(`💰 주변 평당 임대료`);
      devDetailInfo.debugExtraInfo.push(`1층: ${Number(Number(firstFloorRentProfitPerPy).toFixed(0)).toLocaleString()}원`);
      devDetailInfo.debugExtraInfo.push(`2층 이상: ${Number(Number(upperFloorRentProfitPerPy).toFixed(0)).toLocaleString()}원`);
      devDetailInfo.debugExtraInfo.push(`지하층: ${Number(Number(baseFloorRentProfitPerPy).toFixed(0)).toLocaleString()}원`);
    }

    // const recommendedGradeOnly = (process.env.NODE_ENV !== 'development')
    // // const recommendedGradeOnly = true;
    // console.log('recommendedGradeOnly ', recommendedGradeOnly)
    // ////////////////////////////////////////////////////////////////
    // // 신축 
    // if (devDetailInfo.build) {

    //   if (!recommendedGradeOnly || devDetailInfo.build.grade === 'A') {
    //     if (debug) {
    //       devDetailInfo.debugBuildInfo = [];
    //       devDetailInfo.debugBuildInfo.push(`🏢 신축`);
    //     }
    //     devDetailInfo.buildInfo = makeBuildInfo(landInfo, debug, devDetailInfo.debugBuildInfo);
    //     devDetailInfo.build.duration = getBuildProjectDuration(devDetailInfo.buildInfo.upperFloorArea + devDetailInfo.buildInfo.lowerFloorArea, debug, devDetailInfo.debugBuildInfo);

    //     makeLandCost(devDetailInfo.build.landCost, estimatedPrice, debug, devDetailInfo.debugBuildInfo);
    //     makeProjectCost(
    //       'build',
    //       devDetailInfo.build.projectCost,
    //       curBuildingTotalFloorArea,
    //       devDetailInfo.buildInfo.upperFloorArea + devDetailInfo.buildInfo.lowerFloorArea,
    //       devDetailInfo.build.duration,
    //       debug,
    //       devDetailInfo.debugBuildInfo
    //     );
    //     devDetailInfo.build.loan = makeLoan(devDetailInfo.build, debug, devDetailInfo.debugBuildInfo);
    //     // devDetailInfo.build.loanForOwner = makeLoanForOwner(devDetailInfo.build, debug, devDetailInfo.debugExtraInfo);
    //     makeProfit(
    //       'build',
    //       devDetailInfo.build,
    //       // landInfo,
    //       devDetailInfo.buildInfo,
    //       buildingList,
    //       firstFloorRentProfitPerPy,
    //       upperFloorRentProfitPerPy,
    //       baseFloorRentProfitPerPy,
    //       debug,
    //       devDetailInfo.debugBuildInfo
    //     );
    //     const today = new Date();
    //     const formattedToday =
    //       today.getFullYear().toString() +
    //       (today.getMonth() + 1).toString().padStart(2, '0') +
    //       today.getDate().toString().padStart(2, '0');

    //     makeTaxInfo(
    //       landInfo,
    //       devDetailInfo.buildInfo.upperFloorArea + devDetailInfo.buildInfo.lowerFloorArea,
    //       "철근콘크리트구조",
    //       formattedToday,
    //       devDetailInfo.build.tax,
    //       debug,
    //       devDetailInfo.debugBuildInfo
    //     );

    //     devDetailInfo.build.result = makeResult(landInfo, devDetailInfo.build, devDetailInfo.build.tax, publicPriceGrowthRate, debug, devDetailInfo.debugBuildInfo);
    //   } else {
    //     devDetailInfo.build.result = {
    //       grade: devDetailInfo.build.grade,
    //     } as ReportResult;
    //   }
    // }


    if (!curBuildingInfo) {
      devDetailInfo.remodel = null;
      devDetailInfo.rent = null;
    }

    ////////////////////////////////////////////////////////////////
    // 신축 
    if (devDetailInfo.build) {

      if (debug) {
        devDetailInfo.debugBuildInfo = [];
        devDetailInfo.debugBuildInfo.push(`🏢 신축`);
      }
      devDetailInfo.buildInfo = makeBuildInfo(landInfo, debug, devDetailInfo.debugBuildInfo);
      devDetailInfo.build.duration = getBuildProjectDuration(devDetailInfo.buildInfo.upperFloorArea + devDetailInfo.buildInfo.lowerFloorArea, debug, devDetailInfo.debugBuildInfo);

      makeLandCost(devDetailInfo.build.landCost, estimatedPrice, debug, devDetailInfo.debugBuildInfo);
      makeProjectCost(
        'build',
        devDetailInfo.build.projectCost,
        curBuildingTotalFloorArea,
        devDetailInfo.buildInfo.upperFloorArea + devDetailInfo.buildInfo.lowerFloorArea,
        devDetailInfo.build.duration,
        debug,
        devDetailInfo.debugBuildInfo
      );
      devDetailInfo.build.loan = makeLoan(devDetailInfo.build, debug, devDetailInfo.debugBuildInfo);
      // devDetailInfo.build.loanForOwner = makeLoanForOwner(devDetailInfo.build, debug, devDetailInfo.debugExtraInfo);
      makeProfit(
        'build',
        devDetailInfo.build,
        // landInfo,
        devDetailInfo.buildInfo,
        buildingList,
        firstFloorRentProfitPerPy,
        upperFloorRentProfitPerPy,
        baseFloorRentProfitPerPy,
        debug,
        devDetailInfo.debugBuildInfo
      );
      const today = new Date();
      const formattedToday =
        today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, '0') +
        today.getDate().toString().padStart(2, '0');

      makeTaxInfo(
        landInfo,
        devDetailInfo.buildInfo.upperFloorArea + devDetailInfo.buildInfo.lowerFloorArea,
        "철근콘크리트구조",
        formattedToday,
        devDetailInfo.build.tax,
        debug,
        devDetailInfo.debugBuildInfo
      );

      devDetailInfo.build.result = makeResult(landInfo, devDetailInfo.build, devDetailInfo.build.tax, publicPriceGrowthRate, debug, devDetailInfo.debugBuildInfo);
    }

    ////////////////////////////////////////////////////////////////
    // 리모델링   
    if (devDetailInfo.remodel) {
      if (debug) {
        devDetailInfo.debugRemodelInfo = [];
        devDetailInfo.debugRemodelInfo.push(`🔨리모델링`);
      }
      devDetailInfo.remodelInfo = makeRemodelingInfo(landInfo, buildingList, debug, devDetailInfo.debugRemodelInfo);

      devDetailInfo.remodel.duration = getRemodelProjectDuration(devDetailInfo.remodelInfo.upperFloorArea + devDetailInfo.remodelInfo.lowerFloorArea, debug, devDetailInfo.debugRemodelInfo);
      makeLandCost(devDetailInfo.remodel.landCost, estimatedPrice, debug, devDetailInfo.debugRemodelInfo);
      makeProjectCost(
        'remodel',
        devDetailInfo.remodel.projectCost,
        curBuildingTotalFloorArea,
        devDetailInfo.remodelInfo.upperFloorArea + devDetailInfo.remodelInfo.lowerFloorArea,
        devDetailInfo.remodel.duration,
        debug,
        devDetailInfo.debugRemodelInfo
      );
      devDetailInfo.remodel.loan = makeLoan(devDetailInfo.remodel, debug, devDetailInfo.debugRemodelInfo);
      // devDetailInfo.remodel.loanForOwner = makeLoanForOwner(devDetailInfo.remodel, debug, devDetailInfo.debugExtraInfo);
      makeProfit(
        'remodel',
        devDetailInfo.remodel,
        // landInfo,
        devDetailInfo.remodelInfo,
        buildingList,
        firstFloorRentProfitPerPy,
        upperFloorRentProfitPerPy,
        baseFloorRentProfitPerPy,
        debug,
        devDetailInfo.debugRemodelInfo
      );
      const newTotalFloorArea = devDetailInfo.buildInfo.upperFloorArea + devDetailInfo.buildInfo.lowerFloorArea;
      const totalFloorArea = newTotalFloorArea > curBuildingTotalFloorArea ? newTotalFloorArea : curBuildingTotalFloorArea;
      makeTaxInfo(
        landInfo,
        totalFloorArea,
        buildingList[0].structureCodeName,
        buildingList[0].useApprovalDate,
        devDetailInfo.remodel.tax,
        debug,
        devDetailInfo.debugRemodelInfo
      );
      devDetailInfo.remodel.result = makeResult(landInfo, devDetailInfo.remodel, devDetailInfo.remodel.tax, publicPriceGrowthRate, debug, devDetailInfo.debugRemodelInfo);

    }


    ////////////////////////////////////////////////////////////////
    // 임대
    if (devDetailInfo.rent) {
      if (debug) {
        devDetailInfo.debugRentInfo = [];
        devDetailInfo.debugRentInfo.push(`⛺ 임대`);
        devDetailInfo.debugRentInfo.push(`-`);
        devDetailInfo.debugRentInfo.push(`-`);
      }
      if (!devDetailInfo.remodelInfo) {
        devDetailInfo.remodelInfo = makeRemodelingInfo(landInfo, buildingList, debug, devDetailInfo.debugRentInfo);
      }

      // aiReport.rent.duration = getRentProjectDuration(aiReport.buildInfo.upperFloorArea + aiReport.buildInfo.lowerFloorArea);
      makeLandCost(devDetailInfo.rent.landCost, estimatedPrice, debug, devDetailInfo.debugRentInfo);
      makeProjectCost(
        'rent',
        devDetailInfo.rent.projectCost,
        0,
        0,
        devDetailInfo.rent.duration,
        debug,
        devDetailInfo.debugRentInfo
      );
      devDetailInfo.rent.loan = makeLoan(devDetailInfo.rent, debug, devDetailInfo.debugRentInfo);
      // devDetailInfo.rent.loanForOwner = makeLoanForOwner(devDetailInfo.rent, debug, devDetailInfo.debugExtraInfo);
      makeProfit(
        'rent',
        devDetailInfo.rent,
        // landInfo,
        devDetailInfo.remodelInfo,
        buildingList,
        firstFloorRentProfitPerPy,
        upperFloorRentProfitPerPy,
        baseFloorRentProfitPerPy,
        debug,
        devDetailInfo.debugRentInfo
      );

      makeTaxInfo(
        landInfo,
        curBuildingTotalFloorArea,
        buildingList[0].structureCodeName,
        buildingList[0].useApprovalDate,
        devDetailInfo.rent.tax,
        debug,
        devDetailInfo.debugRentInfo
      );

      devDetailInfo.rent.result = makeResult(landInfo, devDetailInfo.rent, devDetailInfo.rent.tax, publicPriceGrowthRate, debug, devDetailInfo.debugRentInfo);
    }

    const recommendedGradeOnly = (process.env.NODE_ENV !== 'development')
    // const recommendedGradeOnly = true;
    console.log('recommendedGradeOnly ', recommendedGradeOnly)

    const buildROI = (devDetailInfo.build?.result?.annualRentProfit / devDetailInfo.build?.result?.initialCapital) || 0;
    const remodelROI = (devDetailInfo.remodel?.result?.annualRentProfit / devDetailInfo.remodel?.result?.initialCapital) || 0;
    const rentROI = (devDetailInfo.rent?.result?.annualRentProfit / devDetailInfo.rent?.result?.initialCapital) || 0;

    // console.log('buildROI', buildROI);
    // console.log('remodelROI', remodelROI);
    // console.log('rentROI', rentROI);
    if (debug) {
      devDetailInfo.debugExtraInfo.push(`✨ 추천`);
      devDetailInfo.debugExtraInfo.push(`신축 ROI(투자자본수익률) ${(buildROI * 100).toFixed(1)}%`);
      devDetailInfo.debugExtraInfo.push(`리모델링 ROI(투자자본수익률) ${(remodelROI * 100).toFixed(1)}%`);
      devDetailInfo.debugExtraInfo.push(`임대 ROI(투자자본수익률) ${(rentROI * 100).toFixed(1)}%`);
    }

    // ROI 기준으로 등급 부여: 1등 A, 2등 B, 3등 C
    const roiList: { type: string; roi: number; info: typeof devDetailInfo.build }[] = [
      { type: 'build', roi: buildROI, info: devDetailInfo.build },
      { type: 'remodel', roi: remodelROI, info: devDetailInfo.remodel },
      { type: 'rent', roi: rentROI, info: devDetailInfo.rent },
    ].filter(item => item.info != null);

    roiList.sort((a, b) => b.roi - a.roi);

    const grades = ['A', 'B', 'C'] as const;
    roiList.forEach((item, index) => {
      if (recommendedGradeOnly && index > 0) {
        item.info.result = {
          grade: grades[index],
        } as ReportResult;
        return;
      }
      item.info.result.grade = grades[index];
      makeReportValue(item.info, grades[index]);
    });


    if (debug) {
      const type = roiList[0].type === 'build' ? '신축' : roiList[0].type === 'remodel' ? '리모델링' : '임대';
      devDetailInfo.debugExtraInfo.push(`⚖️ ${type} 추천`);

    }


    console.log('devDetailInfo', devDetailInfo)

    return {
      landInfo: landInfo,
      buildingList: buildingList,
      devDetailInfo,
      rentInfoList: rentInfoList,
    };

  }

  static async getAIReport(landId: string, estimatedPrice: EstimatedPriceInfo): Promise<AIReportResult | null> {
    try {
      console.log('getAIReport ', landId, estimatedPrice)

      const {
        landInfo,
        buildingList,
        devDetailInfo,
        rentInfoList,
      } = await this.makeDevDetailInfo(landId, estimatedPrice);

      console.log('devDetailInfo', devDetailInfo)
      const aiReportResult: AIReportResult = {
        rent: devDetailInfo.rent?.result || null,
        remodel: devDetailInfo.remodel?.result || null,
        build: devDetailInfo.build?.result || null,
        analysisMessage: devDetailInfo.analysisMessage,
        summary: '',
      };

      let recommended = '';
      let recommendedInfo;
      let recommendedResult;
      if (aiReportResult.build?.grade === 'A') {
        recommended = '신축';
        recommendedInfo = devDetailInfo.build
        recommendedResult = aiReportResult.build
      } else if (aiReportResult.remodel?.grade === 'A') {
        recommended = '리모델링';
        recommendedInfo = devDetailInfo.remodel
        recommendedResult = aiReportResult.remodel
      } else if (aiReportResult.rent?.grade === 'A') {
        recommended = '임대';
        recommendedInfo = devDetailInfo.rent
        recommendedResult = aiReportResult.rent
      }

      // const input = `"""
      //     아래 데이터를 참고해서 설명글 작성해줘 
      //     추정가 : ${krwUnit(estimatedPrice.estimatedPrice, true)}
      //     주소 : ${landInfo.legDongName + ' ' + landInfo.jibun}
      //     주용도 : ${landInfo.usageName}
      //     대지면적 : ${landInfo.relTotalArea}
      //     공시지가 : ${krwUnit(landInfo.price, true)}원/㎡
      //     최대용적율 : ${landInfo.relWeightedFar} %
      //     최대건폐율 : ${landInfo.relWeightedBcr} %
      //     최근거래정보 : ${landInfo.dealPrice ? ('가격 - ' + (krwUnit(landInfo.dealPrice * 10000, true)) + ', 거래일 - ' + landInfo.dealDate + ', 거래유형 - ' + (landInfo.dealType === 'land' ? '토지' : '건물')) : '없음'}
      //     현재빌딩정보 : ${(buildingList && buildingList.length > 0) ? '사용승인일 - ' + buildingList[0].useApprovalDate + ', 지상층수 - ' + buildingList[0].gndFloorNumber + ', 지하층수 - ' + buildingList[0].baseFloorNumber : '없음'}
      //     신축시 개발 가능 층수 : 지상 ${devDetailInfo.buildInfo.upperFloorCount}, 지하 ${devDetailInfo.buildInfo.lowerFloorCount}
      //     신축정보 : ${reportValueToJsonString(devDetailInfo.build, aiReportResult.build)}
      //     리모델링정보 : ${reportValueToJsonString(devDetailInfo.remodel, aiReportResult.remodel)}
      //     임대정보 : ${reportValueToJsonString(devDetailInfo.rent, aiReportResult.rent)}
      //        """`;

      let recommendedReason = '';
      if (recommended === '신축') {
        recommendedReason = `현재 건물 준공년도, 용적률, 건폐율 등을 종합적으로 고려해 보았을때 신축이 적합.`
      } else if (recommended === '리모델링') {
        recommendedReason = `현재 건물 준공년도, 용적률, 건폐율 등을 종합적으로 고려 했을때 리모델링이 적합.`
      } else if (recommended === '임대') {
        recommendedReason = `현재 건물 준공년도를 고려했을때 임대를 추천.`
      }
      const recommendedText = `"""
      추천항목 : ${recommended}
      추천이유 : ${recommendedReason}
      설계리포트 : ${reportValueToJsonString(recommendedInfo, recommendedResult)}
      ${recommended === '신축' ? `개발 가능 층수 : 지상 ${devDetailInfo.buildInfo.upperFloorCount}, 개발후 용적률 : ${Number(devDetailInfo.buildInfo.far).toFixed(1)} %, 개발후 건폐율 : ${Number(devDetailInfo.buildInfo.bcr).toFixed(1)} %` : ''}
      ""`;

      // const input = `"""
      //     아래 데이터를 참고해서 설명글 작성해줘 
      //     추정가 : ${krwUnit(estimatedPrice.estimatedPrice, true)}
      //     주소 : ${landInfo.legDongName + ' ' + landInfo.jibun}
      //     주용도 : ${landInfo.usageName}
      //     대지면적 : ${getAreaStrWithPyeong(landInfo.relTotalArea)}
      //     공시지가 : ${krwUnit(landInfo.price, true)}원/㎡
      //     용적율 : ${Number(landInfo.relWeightedFar).toFixed(1)} %
      //     건폐율 : ${Number(landInfo.relWeightedBcr).toFixed(1)} %
      //     최근거래정보 : ${landInfo.dealPrice ? ('가격 - ' + (krwUnit(landInfo.dealPrice * 10000, true)) + ', 거래일 - ' + landInfo.dealDate + ', 거래유형 - ' + (landInfo.dealType === 'land' ? '토지' : '건물')) : '없음'}
      //     현재빌딩정보 : ${(buildingList && buildingList.length > 0) ? '사용승인일 - ' + buildingList[0].useApprovalDate + ', 지상층수 - ' + buildingList[0].gndFloorNumber + ', 지하층수 - ' + buildingList[0].baseFloorNumber : '없음'}
      //     개발 추천항목 : ${recommended}
      //     설계리포트 : ${reportValueToJsonString(recommendedInfo, recommendedResult)}
      //     ${recommended === '신축' ? `신축 개발 가능 층수 : 지상 ${devDetailInfo.buildInfo.upperFloorCount}, 지하 ${devDetailInfo.buildInfo.lowerFloorCount}` : ''}
      //        """`;
      const input = `"""
          아래 데이터를 참고해서 설명글 작성해줘 
          추정가 : ${krwUnit(estimatedPrice.estimatedPrice, true)}
          주소 : ${landInfo.legDongName + ' ' + landInfo.jibun}
          주용도 : ${landInfo.usageName}
          대지면적 : ${getAreaStrWithPyeong(landInfo.relTotalArea)}
          공시지가 : ${krwUnit(landInfo.price, true)}원/㎡
          최근거래정보 : ${landInfo.dealPrice ? ('가격 - ' + (krwUnit(landInfo.dealPrice * 10000, true)) + ', 거래일 - ' + landInfo.dealDate + ', 거래유형 - ' + (landInfo.dealType === 'land' ? '토지' : '건물')) : '없음'}
          현재빌딩정보 : ${(buildingList && buildingList.length > 0) ? '사용승인일 - ' + buildingList[0].useApprovalDate + ', 지상층수 - ' + buildingList[0].gndFloorNumber + ', 지하층수 - ' + buildingList[0].baseFloorNumber : '없음'}
          ${recommendedText}
             """`;
      const response = await client.responses.create({
        model: "gpt-4o-mini",
        instructions: INSTRUCTION_PROMPT,
        input: input,
      });


      // console.log(response.output_text);
      const outputJson = JSON.parse(response.output_text);
      aiReportResult.analysisMessage = outputJson.answer;
      aiReportResult.summary = outputJson.summary;
      aiReportResult.aroundRentInfo = rentInfoList;
      return aiReportResult;
    } catch (error) {
      // console.error('Error getting AI report:', error);
      throw error;
    }
  }

  static async getAIReportDetail(landId: string, estimatedPrice: EstimatedPriceInfo): Promise<AIReportDetail | null> {
    try {

      console.log('getAIReportDetail', landId, estimatedPrice)

      const {
        landInfo,
        buildingList,
        devDetailInfo
      } = await this.makeDevDetailInfo(landId, estimatedPrice);
      const { remodel, build, rent } = devDetailInfo;
      // console.log('getAIReportDetail!! ', devDetailInfo)
      let valueArray = [remodel, build, rent].filter((v) => v !== null);
      valueArray = valueArray.sort((a, b) => b?.result.grade > a?.result.grade ? -1 : 1);
      const resultType = valueArray[0] === remodel ? 'remodel' : valueArray[0] === build ? 'build' : 'rent';
      const resultValue = valueArray[0];
      const result = {
        type: resultType,
        landInfo,
        buildingList,
        value: resultValue,
        // tax : devDetailInfo.tax,
        tax: {
          propertyTax: resultValue.tax.propertyTax,
          propertyTaxForBuilding: resultValue.tax.propertyTaxForBuilding,
          comprehensiveRealEstateTax: resultValue.tax.comprehensiveRealEstateTax
        },
        result: {
          grade: resultValue.grade,
          // initialCapital: resultValue.result.initialCapital,
          // investmentCapital: resultValue.result.investmentCapital,
          totalProjectCost: resultValue.result.totalProjectCost,
          initialCapital: resultValue.result.initialCapital,
          annualRentProfit: resultValue.result.annualRentProfit,
          profitRatio: resultValue.result.profitRatio,
          // annualProfit: resultValue.result.annualProfit,
          // rentProfitRatio: resultValue.result.rentProfitRatio,
          // investmentProfitRatio: resultValue.result.investmentProfitRatio,
          avgPublicLandPriceGrowthRate: resultValue.result.avgPublicLandPriceGrowthRate,
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
    estimatedPrice: EstimatedPriceInfo
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


// lat: 37.506448, lng: 127.053366 

import { getUsageString, type LandInfo } from "@repo/common";

// level : 3
export const saveMapState = (centerLat: number, centerLng: number, level: number) => {
  const mapState = {
    centerLat,
    centerLng,
    level
  };
  localStorage.setItem('mapState', JSON.stringify(mapState));
};

export const loadMapState = () => {
  const mapStateString = localStorage.getItem('mapState');

  if (!mapStateString) {
    return {
      centerLat: 37.506448,
      centerLng: 127.053366,
      level: 3
    };
  }

  try {
    const mapState = JSON.parse(mapStateString);
    return {
      centerLat: mapState.centerLat ?? 37.506448,
      centerLng: mapState.centerLng ?? 127.053366,
      level: mapState.level ?? 3
    };
  } catch {
    return {
      centerLat: null,
      centerLng: null,
      level: null
    };
  }
};


export const toRad = (deg: number) => (deg * Math.PI) / 180;
export const toDeg360 = (rad: number) => {
  const deg = (rad * 180) / Math.PI;
  return (deg + 360) % 360;
};

export function bearingFromTo(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const φ1 = toRad(fromLat), φ2 = toRad(toLat), Δλ = toRad(toLng - fromLng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return toDeg360(Math.atan2(y, x));
}

export function checkIsAIReportNotAvailable(landInfo: LandInfo): { result: boolean, message: string } {
  console.log(landInfo);
  // if (Number(landInfo.relTotalArea) * 0.3025 > 50 ) {
  //   return { result: true, message: '해당 부지의 특성상 AI 설계 ·  리포트 제공이 어려우니\n고객센터를 통해 별도 문의 바랍니다.' };
  // }

  const validJimokNames = ['대', '공장용지', '학교용지', '주차장', '주유소용지', '창고용지', '잡종지'];
  const validCurUses = [
    '연립', '주거나지', '주거기타', '다세대', '단독', '업무용', '상업용', '상업나지',
    '상업기타', '주상용', '주상기타', '주차장등', '주상나지', '공업용', '공업기타',
    '공업나지', '여객자동차터미널', '물류터미널'
  ];

  if (Number(landInfo.relTotalArea) * 0.3025 >= 50 &&
    validJimokNames.includes(landInfo.jimokName) &&
    validCurUses.includes(landInfo.curUse)
  ) {
    return { result: false, message: '' };
  }

  return { result: true, message: '해당 부지의 특성상 AI 설계 ·  리포트 제공이 어려우니\n고객센터를 통해 별도 문의 바랍니다.' };
}


export const isDistrictPlanning = (landInfo: LandInfo) => {
  let usage = getUsageString(landInfo.usageList, "포함", true);
  if (usage.includes("지구단위계획")) {
    return true;
  }
  return false;
};

export const getSpecialUsageList = (landInfo: LandInfo) => {
  const specialKeywords = [
    "지구단위계획구역",
    "도심지역",
    "고도지구",
    "역사문화환경보전지역",
    "역사문화미관지구",
    "가로구역별 최고높이 제한지역",
    "시도지정문화유산구역",
    "전통사찰보존구역",
    "등록문화유산구역",
    "문화유산보호구역",
    "재정비촉진지구",
    "건축허가·착공제한지역",
    "문화지구",
    "정비구역",
    "국가지정문화유산구역"
  ];

  if (!landInfo.usageList) return [];

  const list = landInfo.usageList
    .filter((u) => u.conflict === "포함")
    .map((u) => u.usageName);

  const matched = list.filter((name) =>
    specialKeywords.find((keyword) => name.includes(keyword))
  );

  return matched;
};



export const getGradeChip = (grade: string) => {
  switch (grade) {
    case 'A':
      return <p className="font-s3 text-primary bg-primary-010 rounded-[2px] px-[4px] py-[2px]">적합</p>;
    case 'B':
      return <p className="font-s3 text-purple-060 bg-purple-010 rounded-[2px] px-[4px] py-[2px]">가능</p>;
    case 'C':
      return <p className="font-s3 text-secondary-060 bg-[#FFF2F3] rounded-[2px] px-[4px] py-[2px]">부적합</p>;
    default:
      return <p className="font-s3 text-secondary-060 bg-[#FFF2F3] rounded-[2px] px-[4px] py-[2px]">부적합</p>;
  }
}

export const maskEmail = (email) => {
  if (!email) return '';

  const [id, domain] = email.split('@');
  const len = id.length;

  if (len <= 2) {
    return `${id[0]}*@${domain}`;
  }

  const masked =
    id[0] +
    '*'.repeat(len - 2) +
    id[len - 1];

  return `${masked}@${domain}`;
};

export interface IdentityVerificationData {
  userName: string;
  userPhone: string;
}

interface IdentityVerificationOptions {
  apiHost: string;
  onSuccess?: (data: IdentityVerificationData) => void;
  onError?: (message: string) => void;
  showSuccessToast?: boolean;
  onPopupBlocked?: () => void;
}


export const openIdentityVerification = (options: IdentityVerificationOptions) => {
  const {
    apiHost,
    onSuccess,
    onError,
    showSuccessToast = false,
    onPopupBlocked
  } = options;

  const width = 400;
  const height = 640;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const popup = window.open(
    `${apiHost}/api/auth/init-verification`,
    '본인인증',
    `width=${width},height=${height},left=${left},top=${top}`
  );

  if (!popup) {
    onPopupBlocked?.();
    return;
  }

  let verificationData: IdentityVerificationData | null = null;

  const messageHandler = (event: MessageEvent) => {
    const allowedOrigins = [
      window.location.origin,
      'https://api.buildingshopai.com',
      'http://localhost:3002'
    ];

    if (!allowedOrigins.includes(event.origin)) {
      console.log('❌ origin 불일치로 메시지 무시됨');
      return;
    }

    if (event.data.type === 'IDENTITY_VERIFICATION_SUCCESS') {
      window.removeEventListener('message', messageHandler);
      verificationData = event.data.data;

      if (showSuccessToast) {
        // toast는 각 컴포넌트에서 import해서 사용하므로 여기서는 직접 호출하지 않음
        // 대신 onSuccess에서 처리하도록 함
      }
    } else if (event.data.type === 'IDENTITY_VERIFICATION_ERROR') {
      window.removeEventListener('message', messageHandler);
      console.error('본인인증 실패:', event.data.message);
      onError?.(event.data.message || '본인인증에 실패했습니다.');
    }
  };

  window.addEventListener('message', messageHandler);

  const checkPopup = setInterval(() => {
    if (popup.closed) {
      clearInterval(checkPopup);
      window.removeEventListener('message', messageHandler);

      if (verificationData) {
        onSuccess?.(verificationData);
      }
    }
  }, 500);
};
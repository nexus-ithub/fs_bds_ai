

import { Dialog } from "@mui/material";
import { AIReportLogo, BuildingShopBIText, Button, DotProgress, getAreaStrWithPyeong, getJibunAddress, getRatioStr, getRoadAddress, HDivider, krwUnit, VDivider, type AIReportDetail, type LandInfo, type User } from "@repo/common";
import { getGradeChip } from "../utils";
import { type EstimatedPrice } from "@repo/common";
import { useEffect, useState } from "react";
import useAxiosWithAuth from "../axiosWithAuth";
import { useQuery, useQueryClient } from "react-query";
import { getAccessToken } from "../authutil";
import { QUERY_KEY_USER } from "../constants";
import { toast } from "react-toastify";


export interface ConsultRequestDialogProps {
  open: boolean;
  landId: string;
  onClose: () => void;
}


export const ConsultRequestDialog = ({open, landId, onClose}: ConsultRequestDialogProps) => {
  const queryClient = useQueryClient()
  const config = queryClient.getQueryData<User>([QUERY_KEY_USER, getAccessToken()]);

  const axiosInstance = useAxiosWithAuth();
  const [loading, setLoading] = useState(true);
  const [landInfo, setLandInfo] = useState<LandInfo | null>(null);
  const [text, setText] = useState('');
  const getLandInfo = () => {
    setLoading(true);
    axiosInstance.get(`/api/land/info?id=${landId}`)
    .then((res) => {
      console.log(res.data);
      setLandInfo(res.data[0]);
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      setLoading(false);
    });
  }


  const onSubmit = () => {
    setLoading(true);
    axiosInstance.post(`/api/land/consult-request`, {
      userId: config?.id,
      landId,
      content: text,
    })
    .then((res) => {
      console.log(res.data);
      toast.success("상담요청이 완료되었습니다.");
      onClose();

    })
    .catch((error) => {
      console.error(error);
      toast.error("상담요청이 실패했습니다.");
    })
    .finally(() => {
      setLoading(false);
    });
  }
  
  useEffect(() => {
    if (!landId) return;
    getLandInfo();
    // setLoading(false);
  }, [landId]);


  return (
    <Dialog
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          width: '100%',
          maxWidth: '640px',
        },
      }}
      open={open}
      onClose={onClose}
      >
        <div className="px-[24px] h-[64px] flex items-center gap-[12px]">
          <p className="font-h4">설계상담요청하기</p>
          <VDivider className="h-[12px]" colorClassName="bg-line-03"/>
          <p className="font-s2 text-text-03">해당 물건의 설계에 관한 상담을 위해 아래 항목을 입력해 주세요.</p>
        </div>
        <HDivider/>

        { 
          loading ? 
          <div className="flex flex-col items-center justify-center h-[120px]">
            <DotProgress size="sm"/>
          </div>
          :
          <div className="p-[24px] space-y-[24px]">
            <div className="space-y-[12px]">
              <p className="font-h4">물건 정보</p>
              <div className="flex flex-col gap-[10px]">
                <div className="flex gap-[12px]">
                  <p className="font-s1-p">{getJibunAddress(landInfo)}</p>
                  {
                    landInfo.roadName && (
                      <div className="flex gap-[6px] items-center">
                        <p className="flex-shrink-0 font-c3-p px-[4px] py-[1px] text-text-03 bg-surface-third">도로명</p>
                        <p className="font-s3 flex items-center text-text-03">{getRoadAddress(landInfo)}</p>
                      </div>
                    )
                  }                
                </div>
                <div className="flex items-center gap-[6px]">
                  {
                    landInfo.usageName && (
                      <p className="font-c2-p text-primary-040 bg-primary-010 rounded-[2px] px-[6px] py-[2px]">{landInfo.usageName}</p>
                    )
                  }
                  {
                    landInfo.relMainUsageName && (
                      <p className="font-c2-p text-purple-060 bg-purple-010 rounded-[2px] px-[6px] py-[2px]">{landInfo.relMainUsageName}</p>
                    )
                  }               
                </div>              
                <div className="flex gap-[12px] items-center">
                  <div className="flex-1 flex items-center justify-between">
                    <p className="font-s3 text-text-03">토지면적{landInfo.relParcelCount > 1 ? ' (합계)' : ''}</p>
                    <p className="font-s3 text-text-02">{getAreaStrWithPyeong(landInfo.relTotalArea)}</p>
                  </div>
                  <VDivider colorClassName="bg-line-02"/>
                  <div className="flex-1 flex items-center justify-between">
                    <p className="font-s3 text-text-03">건축면적{landInfo.relBuildingCount > 1 ? ' (합계)' : ''}</p>
                    <p className="font-s3 text-text-02">{getAreaStrWithPyeong(landInfo.relArchAreaSum)}</p>
                  </div>        
                </div>
              </div>
            </div>

            <HDivider/>
            <div className="space-y-[18px]">
              <p className="font-h4">상담 내용 입력</p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="본 물건에 대해 문의하실 내용을 작성해 주세요." 
                className="font-b2 placeholder:text-text-04 h-[120px] focus:outline-none bg-surface-second rounded-[4px] w-full px-[16px] py-[12px] align-top resize-none"/>
              
            </div>
          </div>
        }
        <HDivider/>
        <div className="w-full flex p-[24px] gap-[10px]">
          <Button variant="bggray" fontSize="font-h4" size="medium" className="w-[200px]" onClick={() => {onClose()}}>취소</Button>
          <Button disabled={!text} className="flex-1" fontSize="font-h4" size="medium" onClick={() => {onSubmit()}}>문의하기</Button>
        </div>
    </Dialog>
  )
} 
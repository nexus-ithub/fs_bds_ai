

import { Dialog } from "@mui/material";
import { Button, Checkbox, DotProgress, HDivider, VDivider, CloseIcon, type BdsSale, type User } from "@repo/common";
import { useState } from "react";
import useAxiosWithAuth from "../axiosWithAuth";
import { useQueryClient } from "react-query";
import { getAccessToken } from "../authutil";
import { QUERY_KEY_USER } from "../constants";
import { toast } from "react-toastify";
import { useMediaQuery } from "@mui/material";


export interface BuildingConsultRequestDialogProps {
  open: boolean;
  bdsSale?: BdsSale;
  onClose: () => void;
}


export const BuildingConsultRequestDialog = ({open, bdsSale = null, onClose}: BuildingConsultRequestDialogProps) => {

  console.log(bdsSale);
  // const { data : config } = useQuery<User>({
  //   queryKey: [QUERY_KEY_USER, getAccessToken()],
  //   // enabled: !!getAccessToken(),
  // })

  const axiosInstance = useAxiosWithAuth();
  const queryClient = useQueryClient()
  const config = queryClient.getQueryData<User>([QUERY_KEY_USER, getAccessToken()]);
    
  const [loading, setLoading] = useState(false);
  // const [landInfo, setLandInfo] = useState<LandInfo | null>(null);
  const [name, setName] = useState(config?.name || '');
  const [phone, setPhone] = useState(config?.phone || '');
  const [text, setText] = useState('');
  const [agree, setAgree] = useState(false);
  const isMobile = useMediaQuery('(max-width:767px)');

  const onSubmit = () => {
    setLoading(true);
    axiosInstance.post(`/api/bds/consult-request`, {
      userId: config?.id,
      bdId: bdsSale?.idx,
      name,
      phone,
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
  


  return (
    <Dialog
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          width: '100%',
          maxWidth: '640px',
        },
      }}
      slotProps={{ paper: { sx: { '@media (max-width: 768px)': { margin: 'auto 16px' } } } }}
      open={open}
      onClose={onClose}
      >
        <div className="px-[24px] h-[54px] flex items-center justify-between md:h-[64px] shrink-0">
          <div className="flex items-center gap-[12px]">
            <p className="font-h4">매입상담 요청하기</p>
            {
              !isMobile && (
                <>
                  <VDivider className="h-[12px]" colorClassName="bg-line-03"/>
                  <p className="font-s2 text-text-03">해당 물건의 매입에 관한 상담을 위해 아래 항목을 입력해 주세요.</p>
                </>
              )
            }
          </div>
          <button onClick={onClose} className="font-h3"><CloseIcon/></button>
        </div>
        <HDivider/>

        { 
          loading ? 
          <div className="flex flex-col items-center justify-center h-[120px]">
            <DotProgress size="sm"/>
          </div>
          :
          <div className="px-[24px] pb-[16px] space-y-[16px] md:space-y-[24px] md:p-[24px] md:pt-0">
            <div className="space-y-[16px] md:space-y-[20px]">
              <p className="font-h4">고객 정보</p>
              <div className="flex gap-[20px] md:flex-row flex-col">
                <div className="flex-1 flex flex-col gap-[8px] md:gap-[12px]"> 
                  <p className="font-s2 text-text-02">고객명</p>
                  <input 
                    disabled={config?.name ? true : false}
                    className="font-b2 border border-line-03 rounded-[2px] px-[10px] py-[8px] md:px-[14px] md:py-[12px] md:font-b1" 
                    placeholder="이름을 입력하세요."
                    value={name}
                    onChange={(e) => {setName(e.target.value)}}/>
                </div>
                <div className="flex-1 flex flex-col gap-[8px] md:gap-[12px]"> 
                  <p className="font-s2 text-text-02">연락처</p>
                  <input 
                    disabled={config?.phone ? true : false}
                    className="font-b2 border border-line-03 rounded-[2px] px-[10px] py-[8px] md:px-[14px] md:py-[12px] md:font-b1" 
                    placeholder="휴대폰 번호를 입력하세요."
                    value={phone}
                    onChange={(e) => {setPhone(e.target.value)}}/>
                </div>
              </div>
            </div>
            <HDivider/>
            <div className="space-y-[12px] md:space-y-[18px]">
              <p className="font-h4">추가 요청 사항</p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="본 물건에 대해 문의하실 내용을 작성해 주세요." 
                className="font-b3 placeholder:text-text-04 h-[120px] focus:outline-none bg-surface-second rounded-[4px] w-full px-[10px] py-[8px] align-top resize-none md:px-[16px] md:py-[12px] md:font-b2"/>
            </div>
            {
              !config && (
                <>
                  <HDivider/>
                  <div className="space-y-[18px]">
                    <button
                      onClick={(e) => {setAgree(!agree)}} 
                      className="flex items-center gap-[8px]">
                      <Checkbox checked={agree} onChange={(checked) => setAgree(checked)}/>
                      <p className="font-s3 text-text-02 md:font-s2">개인정보 취급방침에 동의합니다.</p>
                    </button>
                    
                    <div className="font-c2 border border-line-02 rounded-[4px] divide-y divide-line-02">
                      <div className="flex divide-x divide-line-02">
                        <p className="w-[40%] md:w-[228px] text-text-02 px-[12px] py-[8px] bg-surface-second">개인정보 수집항목</p>
                        <p className="px-[12px] py-[8px] flex-1">고객명, 고객연락처</p>
                      </div>
                      <div className="flex divide-x divide-line-02">
                        <p className="w-[40%] md:w-[228px] text-text-02 px-[12px] py-[8px] bg-surface-second">수집목적</p>
                        <p className="px-[12px] py-[8px] flex-1">당사가 제공하는 상담서비스를 위해 수집</p>
                      </div>
                      <div className="flex divide-x divide-line-02">
                        <p className="w-[40%] md:w-[228px] text-text-02 px-[12px] py-[8px] bg-surface-second">보유 및 이용기간</p>
                        <p className="px-[12px] py-[8px] flex-1">상담완료 후 고객의 삭제 요청시 또는 5년이내 정보 삭제</p>
                      </div>
                      <div className="flex divide-x divide-line-02">
                        <p className="w-[40%] md:w-[228px] text-text-02 px-[12px] py-[8px] bg-surface-second">동의 거부에 따른 불이익의 내용안내</p>
                        <p className="px-[12px] py-[8px] flex-1">상담받을 수 없을뿐, 다른 불이익은 없습니다.</p>
                      </div>
                    </div>
                  </div>                    
                </>
              )
            }
          </div>
        }
        <HDivider/>
        <div className="w-full flex px-[24px] py-[16px] gap-[10px] md:p-[24px]">
          <Button variant="bggray" fontSize={isMobile ? "font-h5" : "font-h4"} size={isMobile ? "semiMedium" : "medium"} className="w-[30%] md:w-[200px]" onClick={() => {onClose()}}>취소</Button>
          <Button disabled={!name || !phone || (!agree && !config) || (text.trim().length === 0)} className="flex-1" fontSize={isMobile ? "font-h5" : "font-h4"} size={isMobile ? "semiMedium" : "medium"} onClick={() => {onSubmit()}}>문의하기</Button>
        </div>
    </Dialog>
  )
} 
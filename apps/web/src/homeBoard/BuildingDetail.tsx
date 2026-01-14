import { BookmarkFilledIcon, BookmarkIcon, Button, CloseIcon, getAreaStrWithPyeong, getShortAddress, HDivider, krwUnit, ShareIcon, VDivider, type BdsSale } from "@repo/common";
import { Dialog } from "@mui/material";
import useAxiosWithAuth from "../axiosWithAuth";
import { useQuery, useQueryClient } from "react-query";
import { QUERY_KEY_USER } from "../constants";
import { getAccessToken } from "../authutil";
import { type User } from "@repo/common";
import { useEffect, useState } from "react";
import { NeedLoginDialog } from "../auth/NeedLoginDialog";
import { BuildingConsultRequestDialog } from "./BuildingConsultRequestDialog";
import { toast } from "react-toastify";

export const BuildingDetailDialog = ({
  open,
  onClose,
  building
}: {
  open: boolean;
  onClose: () => void;
  building: BdsSale;
}) => {
  const axiosWithAuth = useAxiosWithAuth();
  const queryClient = useQueryClient()
  const config = queryClient.getQueryData<User>([QUERY_KEY_USER, getAccessToken()]);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [openNeedLogin, setOpenNeedLogin] = useState<boolean>(false);
  const [openConsultRequestDialog, setOpenConsultRequestDialog] = useState<boolean>(false);
  
  const addBookmark = async () => {
    try {
      if (!config) {
        setOpenNeedLogin(true);
        return;
      }
      await axiosWithAuth.post('/api/bds/bookmark', {building, deleteYn: isBookmarked ? 'Y' : 'N'});
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error(error);
      toast.error('관심물건 추가 중 오류가 발생했습니다.')
    }
  }

  const getIdBookmarked = async () => {
    try {
      if (!config) return;
      const res = await axiosWithAuth.get('/api/bds/is-bookmarked', {params: {bdsId: building.idx}});
      setIsBookmarked(res.data);
    } catch (error) {
      console.error(error);
      toast.error('관심물건 확인 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    getIdBookmarked();
  }, [])

  return (
    <Dialog
      maxWidth="xl"
      slotProps={{ paper: { sx: { '@media (max-width: 768px)': { margin: 'auto 8px' } } } }}
      open={open} onClose={onClose}>
      <div className="md:w-[768px]">
        <div className="flex items-center justify-between h-[64px] px-[24px]">
          <div className="relative h-full flex flex-col justify-center items-center">
            <p className="font-h3">빌딩샵 <span className="text-primary">추천 매물</span></p>
          </div>
          <div className="flex items-center font-s3 text-text-03 divide-x-[1px] divide-line-03">
            {/* <button className="flex items-center px-[16px] gap-[4px]">
              공유하기
              <ShareIcon color="var(--color-content-03)" className="h-[16px]"/>
            </button> */}
            <button 
              className="flex items-center px-[8px] gap-[4px] md:px-[16px]"
              onClick={addBookmark}
            >
              관심물건 추가
              {isBookmarked ? <BookmarkFilledIcon /> : <BookmarkIcon />}
            </button>            
            <button
              className="flex items-center pl-[8px] md:pl-[16px]"
              onClick={onClose}
            >
              <CloseIcon/>
            </button>
          </div>
        </div>

        <div className="flex flex-col mx-[24px] md:border md:border-line-02 md:flex-row md:rounded-[8px]">
          <img
            className="w-full h-[220px] md:w-[320px] md:h-[220px] object-cover rounded-[8px] md:rounded-l-[8px]"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/bd_img.png';
            }}
            src={building.imagePath || '/bd_img.png'} alt=""/>
          <div className="flex-1 flex flex-col pt-[16px] md:p-[16px] gap-[10px]">
            <div className="flex items-center gap-[8px]">
              <p className="font-c2-p bg-primary text-white px-[4px] py-[2px] rounded-[2px]">👍 빌딩샵 추천매물</p>
              {/* <p className="font-s1-p">{building.name || '-'}</p> */}
               <p className="font-s1-p">{getShortAddress(building.addr)}</p>
            </div>
            {/* <p className="font-s1-p">{getShortAddress(building.addr)}</p> */}
            <div className="flex flex-col gap-[5px] md:flex-row md:items-center">
              <div className="flex-1 flex items-center justify-between">
                <p className="font-s4 text-text-03">대지면적</p>
                <p className="font-s4 text-text-02">{getAreaStrWithPyeong(building.platArea)}</p>
              </div>
              <VDivider colorClassName="bg-line-03" className="hidden md:block"/>
              <div className="flex-1 flex items-center justify-between">
                <p className="font-s4 text-text-03">연면적</p>
                <p className="font-s4 text-text-02">{getAreaStrWithPyeong(building.totalArea)}</p>
              </div>        
            </div>
            <div className="flex border border-line-02 rounded-[4px] flex-1 items-center">
              <div className="flex-1 flex flex-col items-center gap-[8px]">
                <p className="font-c2-p text-primary-040 bg-primary-010 rounded-[2px] px-[6px] py-[2px]">매매가</p>
                <p className="font-h2-p text-primary">{krwUnit(building.saleAmount * 10000, true)}</p>
              </div>
              <VDivider className="h-[76px]"/>
              <div className="flex-1 flex flex-col items-center gap-[8px]">
                <p className="font-c2-p text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[2px]">수익률</p>
                <p className="font-h2-p">{building.sellProfit ? building.sellProfit.toFixed(1) + '%' : '-'}</p>
              </div>
              <VDivider className="h-[76px]"/>
              <div className="flex-1 flex flex-col items-center gap-[8px]">
                <p className="font-c2-p text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[2px]">가치평가점수</p>
                <p className="font-h2-p">{building.buildValue ? Number(building.buildValue).toFixed(0) + '점' : '-'}</p>
              </div>        
            </div>

          </div>
        </div>
        <div className="p-[24px] space-y-[16px]">
          <p className="font-h3">AI 분석 리포트</p>
          <p className="flex-1 font-b3 rounded-[4px] px-[16px] py-[12px] bg-surface-second">
            {building.memo?.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </p>
        </div>
      </div>
      <HDivider/>
      <div className="flex p-[24px] gap-[10px]">
        <Button className="w-full h-[48px]" fontSize="font-h4" onClick={() => setOpenConsultRequestDialog(true)}>매입 상담 요청</Button>
      </div>
      <NeedLoginDialog open={openNeedLogin} onClose={() => setOpenNeedLogin(false)}/>
        {
          openConsultRequestDialog && (
            <BuildingConsultRequestDialog open={openConsultRequestDialog} onClose={() => setOpenConsultRequestDialog(false)} bdsSale={building}/>
          )
        }
    </Dialog>  
  )
}
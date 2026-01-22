import { useEffect, useState } from "react";
import useAxiosWithAuth from "../axiosWithAuth";
import { CloseIcon, getAreaStrWithPyeong, getShortAddress, krwUnit, TabButton, type BdsSale } from "@repo/common";
import { CircularProgress, Dialog } from "@mui/material";


const BUILDING_LIST_FILTER_TABS = [
  // '실거래 슈퍼빌딩',
  '핫플레이스',
  '역세권',
  '수익용',
  '사옥용',
  '신축빌딩',
  '개발부지/토지',
  '꼬마빌딩'
]

const BUILDING_LIST_ORDER = [
  // 'recommend',
  'hotplace',
  'subway',
  'income',
  'office',
  'newbuild',
  'development',
  'minibuild'
]

export const BuildingListDialog = ({
  open,
  onClose,
  onBuildingClick,
}: {
  open: boolean;
  onClose: () => void;
  onBuildingClick: (building: BdsSale) => void;
}) => {
  const [buildings, setBuildings] = useState<BdsSale[]>([]);
  const [selectedFilterTab, setSelectedFilterTab] = useState<number>(0);
  const [order, setOrder] = useState<string>(BUILDING_LIST_ORDER[0]);
  const axiosWithAuth = useAxiosWithAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  const getBuildings = async () => {
    try {
      setLoading(true);
      setIsError(false);
      const res = await axiosWithAuth.get('/api/bds/list', {params: {filter: order}});
      setBuildings(res.data as BdsSale[]);
    } catch (error) {
      console.error(error);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    setSelectedFilterTab(0);
    setOrder(BUILDING_LIST_ORDER[0]);
  }, []);

  useEffect(() => {
    getBuildings();
  }, [order]);

  return (
    <Dialog
      maxWidth="xl"
      open={open} onClose={onClose}>
      <div className="w-[1060px]">
        <div className="flex items-center justify-between h-[64px]">
          <div className="relative h-full flex flex-col justify-center items-center px-[24px]">
            <p className="font-h3">빌딩샵 <span className="text-primary">추천 매물</span></p>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-line-03" />
          </div>
          <div className="w-full flex-1 flex items-center h-full">
            {
              BUILDING_LIST_FILTER_TABS.map((tab, index) => (
              <TabButton
                key={index}
                className="h-full flex-1"
                fontClassName="font-s3"
                selected={index === selectedFilterTab}
                onClick={() => {
                  setSelectedFilterTab(index);
                  setOrder(BUILDING_LIST_ORDER[index]);
                }}
              >
                {tab}
              </TabButton>
              ))
            }
          </div>
          <div className="relative h-full flex flex-col justify-center items-center px-[20px]">
            <button onClick={onClose} className="font-h3"><CloseIcon/></button>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-line-03" />
          </div>            
        </div>
        <div className="w-full flex flex-col h-[calc(100vh-300px)] overflow-y-auto divide-y divide-line-03">
          {loading ? (  
            <div className="flex items-center justify-center py-[60px]">
              <CircularProgress size={24}/>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-[30px]">
              <div className="flex flex-col items-center gap-[12px]">
                <div className="flex flex-col items-center gap-[2px] text-secondary-040">
                  <p className="font-s3">매물 정보를 가져오는데 실패했습니다.</p>
                  <p className="font-s3">잠시후 다시 시도해 주세요.</p>
                </div>
                <button 
                  onClick={() => getBuildings()}
                  className="font-s3 text-primary border border-primary rounded-[4px] px-[12px] py-[8px]"
                >
                  다시 시도
                </button>
              </div>
            </div>
          ) : (
            buildings.map((building, index) => (
            <button 
              key={index} 
              onClick={() => onBuildingClick(building)}
              className="flex space-x-[24px] text-start px-[20px] py-[20px] hover:bg-primary-010">
              <div className="flex items-center gap-[12px] w-[356px]">
                <div className="flex-shrink-0 relative">
                  <img
                    className="w-[160px] h-[160px] rounded-[8px] object-cover" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/bd_img.png';
                    }}
                    src={building.imagePath || '/bd_img.png'} 
                    width={160} 
                    height={160} 
                    alt=""/>
                    <p className="absolute top-[4px] left-[4px] w-[20px] h-[20px] flex items-center justify-center bg-primary text-white rounded-[2px] font-s3-p">{index+1}</p>  
                </div>
                <div className="flex-1 flex flex-col h-[160px] gap-[8px] justify-between">
                  {/* <p className="font-h4">{building.name}</p> */}
                  <div className="flex-1 flex flex-col gap-[4px]">
                    <div className="flex-1 w-full font-s4 flex items-center justify-between"><p className="text-text-03">위치</p><p>{getShortAddress(building.addr)}</p></div>
                    <div className="flex-1 w-full font-s4 flex items-center gap-[2px] justify-between"><p className="text-text-03">매매가</p><p className="font-s1-p text-primary">{krwUnit(building.saleAmount * 10000, true)}</p></div>
                    <div className="flex-1 w-full font-s4 flex items-center gap-[2px] justify-between"><p className="text-text-03">가치평가 점수</p><p className="font-s1-p">{Number(building.buildValue).toFixed(0) + '점'}</p></div>
                    <div className="flex-1 w-full font-s4 flex items-center gap-[2px] justify-between"><p className="text-text-03">수익율</p><p className="font-s3">{(building.sellProfit && building.sellProfit > 0) ? building.sellProfit.toFixed(1) + '%' : '-'}</p></div>
                    <div className="flex-1 w-full font-s4 flex items-center gap-[2px] justify-between"><p className="text-text-03">대지면적</p><p className="font-s3">{getAreaStrWithPyeong(building.platArea)}</p></div>
                    <div className="flex-1 w-full font-s4 flex items-center gap-[12px] justify-between"><p className="text-text-03">연면적</p><p className="font-s3">{getAreaStrWithPyeong(building.totalArea)}</p></div>
                  </div>
                </div>
              </div>
              <p className="flex-1 font-b3 rounded-[4px] px-[16px] py-[12px] bg-surface-second">
                {building.memo?.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </p>
            </button>
          )))}
        </div>
      </div>

    </Dialog>  
  )
}
import { HDivider, MenuDropdown, SearchBar, type User, type BdsSale, VDivider, getShortAddress, getAreaStrWithPyeong, krwUnit, CounselIcon, BookmarkFilledIcon, Pagination, DotProgress } from "@repo/common";
import { useEffect, useState, useRef } from "react";
import useAxiosWithAuth from "../axiosWithAuth";
import { useQueryClient } from "react-query";
import { QUERY_KEY_USER } from "../constants";
import { getAccessToken } from "../authutil";
import { toast } from "react-toastify";
import { BuildingConsultRequestDialog } from "../homeBoard/BuildingConsultRequestDialog";

const COUNT_BUTTON = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
]

export const BookmarkedBds = ({scrollRef}: {scrollRef: React.RefObject<HTMLDivElement>}) => {
  const axiosWithAuth = useAxiosWithAuth();
  const queryClient = useQueryClient()
  const config = queryClient.getQueryData<User>([QUERY_KEY_USER, getAccessToken()]);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [bookmarkList, setBookmarkList] = useState<BdsSale[]>([]);
  const [selectedBdsSale, setSelectedBdsSale] = useState<BdsSale | null>(null);

  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(COUNT_BUTTON[0].value);

  const [openCounselDialog, setOpenCounselDialog] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const getBookmarkList = async() => {
    try {
      setLoading(true);
      const response = await axiosWithAuth.get('/api/bds/bookmark', {params: {page: currentPage, size: pageSize}});
      console.log(response.data.result);
      setBookmarkList(response.data.result);
      setTotalCount(response.data.total);
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Failed to fetch bookmark list:', error);
      toast.error('북마크한 추천매물 목록을 가져오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const cancelBookmark = async (item: BdsSale) => {
    try {
      await axiosWithAuth.post('/api/bds/bookmark', {building: item, deleteYn: 'Y'});
      getBookmarkList();
    } catch (error) {
      console.error(error);
      toast.error('북마크를 취소하는 데 실패했습니다.');
    }
  }

  useEffect(() => {
    getBookmarkList();
  }, [pageSize, currentPage])

  const DesktopBookmarkCard = ({ item }: { item: BdsSale }) => {
    return (
      <div className="w-full flex h-[190px] rounded-[8px] border border-line-03">
        <img
          className="w-[320px] h-[190px] object-cover rounded-l-[8px]"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/bd_img.png';
          }}
          src={item.imagePath || '/bd_img.png'} alt=""/>
        <div className="flex-1 flex flex-col p-[16px] gap-[12px]">
          <div className="flex flex-col gap-[8px]">
            <div className="flex items-center justify-between gap-[8px]">
              <div className="flex items-center gap-[8px]">
                <p className="font-s1-p shrink-0">{getShortAddress(item.addr)}</p>
                {item.name && (
                  <>
                    <VDivider colorClassName="bg-line-03 !h-[12px] shrink-0"/>
                    <p className="font-s1-p shrink-0">{item.name}</p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-[8px]">
                <button className="flex items-center gap-[6px] shrink-0" onClick={() => {setSelectedBdsSale(item); setOpenCounselDialog(true)}}>
                  <p className="font-s4 text-primary">매입 상담 요청</p>
                  <CounselIcon/>
                </button>
                <VDivider colorClassName="bg-line-03 !h-[12px] shrink-0"/>
                <button onClick={() => {cancelBookmark(item)}} className="shrink-0">
                  <BookmarkFilledIcon/>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-[12px]">
              <div className="flex-1 flex items-center justify-between gap-[6px]">
                <p className="w-[44px] font-s4 text-text-03">대지면적</p>
                <p className="flex-1 font-s4 text-right">{getAreaStrWithPyeong(item.platArea)}</p>
              </div>
              <VDivider colorClassName="bg-line-03"/>
              <div className="flex-1 flex items-center justify-between gap-[6px]">
                <p className="w-[44px] font-s4 text-text-03">연면적</p>
                <p className="flex-1 font-s4 text-right">{getAreaStrWithPyeong(item.totalArea)}</p>
              </div>        
            </div>
          </div>
          <div className="flex items-center gap-[8px] px-[8px] py-[12px] border border-line-02 rounded-[4px]">
            <div className="flex-1 flex flex-col items-center gap-[8px]">
              <p className="font-c2-p text-primary-040 bg-primary-010 rounded-[2px] px-[6px] py-[2px]">매매가</p>
              <p className="font-h2-p text-primary">{krwUnit(item.saleAmount * 10000, true)}</p>
            </div>
            <VDivider className="h-[76px]"/>
            <div className="flex-1 flex flex-col items-center gap-[8px]">
              <p className="font-c2-p text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[2px]">수익률</p>
              <p className="font-h2-p">{item.sellProfit ? (Number(item.sellProfit)).toFixed(1) + '%' : '-'}</p>
            </div>
            <VDivider className="h-[76px]"/>
            <div className="flex-1 flex flex-col items-center gap-[8px]">
              <p className="font-c2-p text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[2px]">가치평가점수</p>
              <p className="font-h2-p">{item.buildValue ? Number(item.buildValue).toFixed(0) + '점' : '-'}</p>
            </div>        
          </div>

        </div>
      </div>
    )
  }

  const MobileBookmarkCard = ({ item }: { item: BdsSale }) => {
    return (
      <div className="w-full flex flex-col min-h-[170px] rounded-[8px] border border-line-03">
        <div className="w-full flex items-center justify-between p-[8px]">
          <div className="flex items-center gap-[8px]">
            <p className="font-s2-p shrink-0">{getShortAddress(item.addr)}</p>
            {item.name && (
              <>
                <VDivider colorClassName="bg-line-03 !h-[12px] shrink-0"/>
                <p className="font-s2-p shrink-0">{item.name}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-[8px]">
            <button className="flex items-center gap-[6px] shrink-0" onClick={() => {setSelectedBdsSale(item); setOpenCounselDialog(true)}}>
              <p className="font-s4 text-primary">매입 상담 요청</p>
              <CounselIcon/>
            </button>
            <VDivider colorClassName="bg-line-03 !h-[12px] shrink-0"/>
            <button onClick={() => {cancelBookmark(item)}} className="shrink-0">
              <BookmarkFilledIcon/>
            </button>
          </div>
        </div>
        <HDivider className="shrink-0"/>
        <div className="flex items-center gap-[16px] p-[8px]">
          <img
          className="w-[45%] h-[120px] object-cover rounded-[4px]"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/bd_img.png';
          }}
          src={item.imagePath || '/bd_img.png'} alt=""/>
          <div className="flex-1 flex flex-col gap-[6px]">
            <div className="flex items-center justify-between">
              <p className="font-s4 text-text-03">위치</p>
              <p className="font-s4">{getShortAddress(item.addr)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-s4 text-text-03">매매가</p>
              <p className="font-s4-p text-primary">{krwUnit(item.saleAmount * 10000, true)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-s4 text-text-03">가치평가 점수</p>
              <p className="font-s4">{item.buildValue ? Number(item.buildValue).toFixed(0) + '점' : '-'}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-s4 text-text-03">수익률</p>
              <p className="font-s4">{item.sellProfit ? (Number(item.sellProfit)).toFixed(1) + '%' : '-'}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-s4 text-text-03">대지면적</p>
              <p className="font-s4">{getAreaStrWithPyeong(item.platArea)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-s4 text-text-03">연면적</p>
              <p className="font-s4">{getAreaStrWithPyeong(item.totalArea)}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-[16px] p-[24px] md:p-[40px] md:w-[800px]">
      <div className="w-full flex flex-col gap-[4px]">
        <h2 className="font-h2">빌딩샵 추천매물</h2>
        <p className="font-s2 text-text-02">빌딩샵에서 추천하는 실매물 중 관심물건으로 저장한 매물목록 입니다.</p>
      </div>
      <HDivider colorClassName="bg-line-02"/>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[20px]">
          {/* 빌딩샵은 주소 빼기로 함 -> 검색할 항목이 없음 */}
          {/* <SearchBar
            placeholder="검색어를 입력해 주세요."
            value={searchKeyword}
            onChange={setSearchKeyword}
            variant="filled"
            prefixSize={14}
            className="font-b3 px-[8px] py-[6px]"
          /> */}
          {/* <div className="flex items-center gap-[8px]">
            <p className="font-s3 text-text-03">지역</p>
            <MenuDropdown 
              options={[
                { value: 'apple', label: '🍎 사과' },
                { value: 'banana', label: '🍌 바나나' },
                { value: 'orange', label: '🍊 오렌지' },
                { value: 'grape', label: '🍇 포도' },
                { value: 'strawberry', label: '🍓 딸기' },
              ]} 
              value={selectedMenu} 
              onChange={(value) => {setSelectedMenu(value)}}
              placeholder="전체"
            />
          </div> */}
        </div>
        <div className="flex items-center rounded-[4px] border border-line-02 divide-x divide-line-02">
          {COUNT_BUTTON.map((item) => (
            <button
              key={item.value}
              className={`w-[32px] h-[32px] flex items-center justify-center p-[4px] font-s2 ${item.value === pageSize ? 'text-primary' : 'text-text-04'}`}
              onClick={() => {setPageSize(item.value); setCurrentPage(1)}}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-[16px]">
        {bookmarkList?.length > 0 ? bookmarkList.map((item) => (
          <div key={item.idx}>
            <div className="hidden md:flex">
              <DesktopBookmarkCard item={item} />
            </div>
            <div className="flex md:hidden">
              <MobileBookmarkCard item={item} />
            </div>
          </div>
        )) : loading ? (
          <div className="w-full flex items-center justify-center">
            <DotProgress size="sm"/>
          </div>
        ) : (
          <p className="text-text-03">관심매물이 없습니다.</p>
        )}
      </div>
      <div className="w-full flex items-center justify-center py-[12px]">
        <Pagination totalItems={totalCount} itemsPerPage={pageSize} currentPage={currentPage} onPageChange={(page) => {setCurrentPage(page);}}/>
      </div>
      {
        openCounselDialog && (
          <BuildingConsultRequestDialog open={openCounselDialog} onClose={() => setOpenCounselDialog(false)} bdsSale={selectedBdsSale}/>
        )
      }
    </div>
  )
}
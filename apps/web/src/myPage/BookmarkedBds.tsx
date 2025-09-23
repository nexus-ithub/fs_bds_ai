import { HDivider, MenuDropdown, SearchBar, type User, type BdsSale, VDivider, getShortAddress, getAreaStrWithPyeong, krwUnit, CounselIcon, BookmarkFilledIcon, Pagination } from "@repo/common";
import { useEffect, useState, useRef } from "react";
import useAxiosWithAuth from "../axiosWithAuth";
import { useQuery } from "react-query";
import { QUERY_KEY_USER } from "../constants";
import { getAccessToken } from "../authutil";
import { BuildingCounselDialog } from "../homeBoard/BuildingCounselDialog";

const COUNT_BUTTON = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
]

export const BookmarkedBds = () => {
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [bookmarkList, setBookmarkList] = useState<BdsSale[]>([]);

  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(COUNT_BUTTON[0].value);

  const [openCounselDialog, setOpenCounselDialog] = useState<boolean>(false);

  const axiosWithAuth = useAxiosWithAuth();
  const { data : config } = useQuery<User>({
      queryKey: [QUERY_KEY_USER, getAccessToken()]
    })

  const getBookmarkList = async() => {
    try {
      const response = await axiosWithAuth.get('/api/bds/bookmark', {params: {userId: config?.id, page: currentPage, size: pageSize}});
      setBookmarkList(response.data.result);
      setTotalCount(response.data.total);
    } catch (error) {
      console.error('Failed to fetch bookmark list:', error);
    }
  }

  const cancelBookmark = async (item: BdsSale) => {
    try {
      await axiosWithAuth.post('/api/bds/bookmark', {userId: config?.id, building: item, deleteYn: 'Y'});
      getBookmarkList();
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    console.log("currentPage", currentPage)
    console.log("pageSize", pageSize)
    console.log("totalCount", totalCount)
    getBookmarkList();
  }, [pageSize, currentPage])

  useEffect(() => {
    window.scrollTo({top: 0, behavior: 'smooth'})
  }, [currentPage])

  return (
    <div className="w-[800px] flex flex-col gap-[16px] p-[40px]">
      <div className="w-full flex flex-col gap-[4px]">
        <h2 className="font-h2">빌딩샵 추천매물</h2>
        <p className="font-s2 text-text-02">빌딩샵에서 추천하는 실매물 중 관심물건으로 저장한 매물목록 입니다.</p>
      </div>
      <HDivider className="!border-b-line-02"/>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[20px]">
          <SearchBar
            placeholder="검색어를 입력해 주세요."
            value={searchKeyword}
            onChange={setSearchKeyword}
            variant="filled"
            prefixSize={14}
            className="font-b3 px-[8px] py-[6px]"
          />
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
        {bookmarkList.map((item) => (
          <div key={item.idx} className="w-full flex h-[220px] rounded-[8px] border border-line-03">
            <img
              className="w-[320px] h-[220px] object-cover rounded-l-[8px]"
              src={item.imagePath || 'http://buildingshop.co.kr/img/img_box_bg6.jpg'} alt=""/>
            <div className="flex-1 flex flex-col p-[16px] gap-[12px]">
              <div className="flex flex-col gap-[8px]">
                <div className="flex items-center justify-between gap-[8px]">
                  <p className="font-s1-p">{item.name || '-'}</p>
                  <div className="flex items-center gap-[8px]">
                    <button className="flex items-center gap-[6px]" onClick={() => {setOpenCounselDialog(true)}}>
                      <p className="font-s4 text-primary">매입 상담 요청</p>
                      <CounselIcon/>
                    </button>
                    <VDivider colorClassName="bg-line-03 !h-[12px]"/>
                    <button onClick={() => {cancelBookmark(item)}}>
                      <BookmarkFilledIcon/>
                    </button>
                  </div>
                </div>
                <p className="font-s1-p">{getShortAddress(item.addr)}</p>
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
        ))}
      </div>
      <div className="w-full flex items-center justify-center py-[12px]">
        <Pagination totalItems={totalCount} itemsPerPage={pageSize} currentPage={currentPage} onPageChange={(page) => {setCurrentPage(page);}}/>
      </div>
      <BuildingCounselDialog open={openCounselDialog} onClose={() => {setOpenCounselDialog(false);}}/>
    </div>
  )
}
import { BookmarkFilledIcon, CounselIcon, getAreaStrWithPyeong, getJibunAddress, getRoadAddress, getShortAddress, HDivider, MenuDropdown, SearchBar, VDivider, type User } from "@repo/common";
import { useEffect, useState } from "react";
import useAxiosWithAuth from "../axiosWithAuth";
import { useQuery } from "react-query";
import { QUERY_KEY_USER } from "../constants";
import { getAccessToken } from "../authutil";
import { type BookmarkedReportType, type LandInfo, type BuildingInfo } from "@repo/common";
import { Roadview, RoadviewMarker } from "react-kakao-maps-sdk";

const COUNT_BUTTON = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
]

export const BookmarkedReport = () => {
  const axiosWithAuth = useAxiosWithAuth();
  const { data : config } = useQuery<User>({
      queryKey: [QUERY_KEY_USER, getAccessToken()]
    })
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [bookmarkList, setBookmarkList] = useState<BookmarkedReportType[]>([]);

  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(COUNT_BUTTON[0].value);

  const [openCounselDialog, setOpenCounselDialog] = useState<boolean>(false);

  // const [selectedMenu, setSelectedMenu] = useState<string>("");

  const getBookmarkList = async() => {
    try {
      const response = await axiosWithAuth.get('/api/land/bookmark', {params: {userId: config?.id, page: currentPage, size: pageSize}});
      setBookmarkList(response.data.result);
      console.log(">>>>", response.data)
      setTotalCount(response.data.total);
    } catch (error) {
      console.error('Failed to fetch bookmark list:', error);
    }
  }

  const cancelBookmark = async (item: BookmarkedReportType) => {
    try {
      await axiosWithAuth.post('/api/land/bookmark', {
        userId: config?.id, 
        landId: item.landInfo.id, 
        buildingId: item.buildings.length > 0 ? item.buildings[0].id : null, 
        deleteYn: 'Y'
      });
      getBookmarkList();
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    getBookmarkList();
  }, [currentPage, pageSize]);

  useEffect(() => {
    window.scrollTo({top: 0, behavior: 'smooth'})
  }, [currentPage])

  return (
    <div className="min-w-[800px] flex flex-col gap-[16px] p-[40px]">
      <div className="flex flex-col gap-[4px]">
        <h2 className="font-h2">관심물건 관리</h2>
        <p className="font-s2 text-text-02">고객님이 직접 검색하여 생성한 리포트에서 추가된 관심물건 목록 입니다.</p>
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
              className={`p-[7px] font-s2 ${item.value === pageSize ? 'text-primary' : 'text-text-04'}`}
              onClick={() => setPageSize(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-[16px]">
        {bookmarkList.map((item) => (
          <div key={`${item.landInfo.id}-${item.buildings[0].id ?? 'no-building'}`} className="w-full flex h-[220px] rounded-[8px] border border-line-03">
            <Roadview
              onViewpointChange={(viewpoint) => {
                console.log(viewpoint);
                // setRoadViewCenter({
                //   ...roadViewCenter,
                //   pan: viewpoint.getViewpoint().pan,
                // })
              }}
              onPositionChanged={(position) => {
                console.log(position);
                // setRoadViewCenter({
                //   ...roadViewCenter,
                //   lat: position.getPosition().getLat(),
                //   lng: position.getPosition().getLng(),
                // })
              }}
              // pan={roadViewCenter.pan}
              position={{ lat: Number(item.polygonLat), lng: Number(item.polygonLng), radius: 50 }}
              
              className="w-[320px] h-[220px] object-cover rounded-l-[8px]"
            >
              <RoadviewMarker position={{ lat: Number(item.polygonLat), lng: Number(item.polygonLng) }} />
            </Roadview>
            <div className="flex-1 flex flex-col p-[16px] gap-[12px]">
              <div className="flex flex-col gap-[8px]">
                <div className="flex items-center justify-between gap-[8px]">
                  <div className="flex items-center gap-[8px]">
                    <p className="font-s1-p shrink-0">{getJibunAddress(item.landInfo)}</p>
                  </div>
                  {
                    item.landInfo.roadName && (
                      <div className="mt-[4px] flex gap-[6px] items-center">
                        <p className="flex-shrink-0 font-c3-p px-[4px] py-[1px] text-text-03 bg-surface-third">도로명</p>
                        <p className="font-s4 flex items-center text-text-03">{getRoadAddress(item.landInfo)}</p>
                      </div>
                    )
                  } 
                  <div className="flex items-center gap-[8px]">
                    <button className="flex items-center gap-[6px] shrink-0" onClick={() => {setOpenCounselDialog(true)}}>
                      <p className="font-s4 text-primary">매입 상담 요청</p>
                      <CounselIcon/>
                    </button>
                    <VDivider colorClassName="bg-line-03 !h-[12px] shrink-0"/>
                    <button onClick={() => {cancelBookmark(item)}} className="shrink-0">
                      <BookmarkFilledIcon/>
                    </button>
                  </div>
                </div>
                <div className="mt-[8px] flex items-center gap-[6px]">
                  {
                    item.landInfo.usageName && (
                      <p className="font-c2-p text-primary-040 bg-primary-010 rounded-[2px] px-[6px] py-[2px]">{item.landInfo.usageName}</p>
                    )
                  }
                  {
                    (item.buildings && item.buildings.length > 0) && (
                      <p className="font-c2-p text-purple-060 bg-purple-010 rounded-[2px] px-[6px] py-[2px]">{item.buildings[0].mainUsageName}</p>
                    )
                  }        
                </div>
                <div className="flex items-center gap-[12px]">
                  <div className="flex-1 flex items-center justify-between gap-[6px]">
                    <p className="w-[44px] font-s4 text-text-03">대지면적</p>
                    <p className="flex-1 font-s4 text-right">{getAreaStrWithPyeong(item.landInfo.area)}</p>
                  </div>
                  <VDivider colorClassName="bg-line-03"/>
                  <div className="flex-1 flex items-center justify-between gap-[6px]">
                    <p className="w-[44px] font-s4 text-text-03">건축면적</p>
                    <p className="flex-1 font-s4 text-right">{getAreaStrWithPyeong(item.buildings?.[0]?.archArea)}</p>
                  </div>        
                </div>
              </div>
              {/* <div className="flex items-center gap-[8px] px-[8px] py-[12px] border border-line-02 rounded-[4px]">
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
              </div> */}
  
            </div>
          </div>
        ))}
      </div>
      <div>페이지네이션</div>
    </div>
  )
}
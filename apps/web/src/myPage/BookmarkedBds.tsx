import { HDivider, MenuDropdown, SearchBar, Pagination } from "@repo/common";
import { useState } from "react";

const COUNT_BUTTON = [
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '50', label: '50' },
]

export const BookmarkedBds = () => {
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedMenu, setSelectedMenu] = useState<string>("");
  const [selectedCount, setSelectedCount] = useState<string>(COUNT_BUTTON[0].value);

  return (
    <div className="flex flex-col gap-[16px] p-[40px]">
      <div className="flex flex-col gap-[4px]">
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
          <div className="flex items-center gap-[8px]">
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
          </div>
        </div>
        <div className="flex items-center rounded-[4px] border border-line-02 divide-x divide-line-02">
          {COUNT_BUTTON.map((item) => (
            <button
              key={item.value}
              className={`p-[7px] font-s2 ${item.value === selectedCount ? 'text-primary' : 'text-text-04'}`}
              onClick={() => setSelectedCount(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        매물 리스트
      </div>
      {/* <div><Pagination totalItems={100} itemsPerPage={10} currentPage={1} onPageChange={(page) => {}} toast={(msg) => {}}/></div> */}
      <div>페이지네이션</div>
    </div>
  )
}
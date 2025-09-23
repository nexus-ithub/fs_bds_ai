import { FilterIcon, SearchIcon, Switch, VDivider, type SearchResult } from "@repo/common"
import { useCallback, useEffect, useMemo, useState } from "react"
import debounce from "lodash/debounce";
import useAxiosWithAuth from "../axiosWithAuth";
import { CircularProgress, Menu } from "@mui/material";


const DEBOUNCE_DELAY = 300

export interface SearchBarProps {
  onSelect: (id: string) => void;
}

export const SearchBar = ({onSelect}: SearchBarProps) => {

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const axiosInstance = useAxiosWithAuth()
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false)
  // const [openSearchResult, setOpenSearchResult] = useState(false)
  // 실제 API 호출 함수
  const fetchResults = async (searchTerm: string) => {

    setResults([]);
    if (!searchTerm.trim()) {
      return;
    }

    try {
      setLoading(true)
      console.log('request ', searchTerm)
      const res = await axiosInstance.get(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      console.log(res.data)
      setResults(res.data);
    } catch (error) {
      console.error("API error:", error);
    } finally{
      setLoading(false)
    }
  };

  // debounce 래핑 (500ms 대기)
  const debouncedSearch = useMemo(
    () => debounce(fetchResults, DEBOUNCE_DELAY),
    []
  );

  // input 변경 핸들러
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );



  return (
    <div className="fixed top-[84px] w-[582px] h-[48px] bg-white left-[424px] z-40 font-c3 space-y-[14px] border border-line-03 shadow-[6px_6px_12px_0_rgba(0,0,0,0.06)]">
      <div className="flex items-center h-full gap-[12px] px-[12px]">
        <button className="font-s3 flex items-center gap-[4px] text-text-02">
          <FilterIcon/>
          필터
        </button>
        <VDivider/>
        <Switch
          checked={false}
          onChange={() => {}}
        />
        <VDivider className="h-full"/>
        <SearchIcon/>
        <input
          onClick={(e) => {
            console.log('onClick  ', e.currentTarget)
            // setMenuAnchorEl(e.currentTarget);
            setMenuAnchorEl(e.currentTarget);
          }}
          onFocus={(e) => {
            console.log('onFocus  ', e.currentTarget)
            
          }}
          onBlur={() => {
            console.log('onBlur')
            // setMenuAnchorEl(null)
            // setQuery('')
          }}
          onChange={handleChange} 
          value={query}
          type="text" 
          placeholder="주소 또는 장소를 검색해주세요." 
          className="flex-1 font-b2 placeholder:text-text-04 outline-none focus:outline-none"
        />
        <Menu
          open={menuAnchorEl != null}
          anchorEl={menuAnchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: -14,
            horizontal: 40,
          }}
          style={{
           padding : 0,
           margin : 0
          }}
          disableAutoFocus
          disableEnforceFocus
          disableRestoreFocus
          onClose={()=> {
            setMenuAnchorEl(null)
            // setQuery('')
            // setResults([])
          }}
        >
          <div className="w-[446px] h-[480px] font-s2">
            <div className="w-full h-full flex flex-col">
              {
                loading ? (
                  <div className="px-[12px] py-[22px] flex items-center justify-center">
                    <CircularProgress size={20}/>
                  </div>
                ) : ( 
                !query ? (
                  <p className="px-[12px] py-[4px]">최근검색</p>
                ) : (
                  results.length === 0 ? (
                    <p className="px-[12px] py-[4px]"> "{query}" 에 대한 검색 결과가 없습니다.</p>
                  ) : (
                    <div className="flex flex-col w-full overflow-y-auto divide-y divide-line-03 text-text-02">
                      {results.map((result) => (
                        <button
                          onClick={() => {
                            console.log('onClick  ', result)
                            onSelect(result.id)
                            setMenuAnchorEl(null)
                            setQuery('')
                            setResults([])
                          }} 
                        key={result.id} className="text-start flex flex-col px-[12px] py-[3px] hover:bg-primary-010 border-b-[1px] border-b-line-03">
                        <p className="py-[2px]">{result.jibun || ''}</p>
                        <p className="py-[2px]">{(result.road || '') + (result.buildingName ? ', ' + result.buildingName : '')}</p>
                      </button>
                    ))}
                    </div>
                  )
                ))
              }
            </div>
          </div>
        </Menu>
      </div>
    </div>
  )
}
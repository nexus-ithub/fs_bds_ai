import { ChangeIcon, CloseIcon, FilterIcon, HDivider, SearchIcon, Switch, VDivider, type SearchResult } from "@repo/common"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import debounce from "lodash/debounce";
import useAxiosWithAuth from "../axiosWithAuth";
import { CircularProgress, Menu, Slider } from "@mui/material";


const DEBOUNCE_DELAY = 300
const STORAGE_KEY = "recentSelectedSearch";
const MAX_ITEMS = 30;

const AREA_MARKS = [
  { value: 0, label: '0m²' },
  { value: 2500, label: '2,500m²' },
  { value: 5000, label: '5,000m²' },
  { value: 7500, label: '7,500m²' },
  { value: 10000, label: '10,000m²+' },
]

const FAR_MARKS = [
  { value: 0, label: '0%' },
  { value: 375, label: '375%' },
  { value: 750, label: '750%' },
  { value: 1125, label: '1,125%' },
  { value: 1500, label: '1,500%+' },
]

const BUILDING_AGE_MARKS = [
  { value: 0, label: '0' },
  { value: 10, label: '10년' },
  { value: 20, label: '20년' },
  { value: 30, label: '30년' },
  { value: 40, label: '40년+' },
]

const USAGE_LIST = [
  { value: '1종전용주거지역', label: '1종전용' },
  { value: '2종전용주거지역', label: '2종전용' },
  { value: '1종일반주거지역', label: '1종일반' },
  { value: '2종일반주거지역', label: '2종일반' },
  { value: '3종일반주거지역', label: '3종일반' },
  { value: '준주거지역', label: '준주거' },
  { value: '중심상업지역', label: '중심상업' },
  { value: '일반상업지역', label: '일반상업' },
  { value: '근린상업지역', label: '근린상업' },
  { value: '유통상업지역', label: '유통상업' },
  { value: '전용공업지역', label: '전용공업' },
  { value: '일반공업지역', label: '일반공업' },
  { value: '준공업지역', label: '준공업' },
  { value: '보전녹지지역', label: '보전녹지' },
  { value: '생산녹지지역', label: '생산녹지' },
  { value: '자연녹지지역', label: '자연녹지' },
  { value: '보건관리지역', label: '보건관리' },
  { value: '생산관리지역', label: '생산관리' },
  { value: '계획관리지역', label: '계획관리' },
  { value: '농림지역', label: '농림지역' },
  { value: '자연환경보전지역', label: '자연환경' },
]

function loadRecent(): SearchResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SearchResult[]) : [];
  } catch {
    return [];
  }
}

// 맨 앞 삽입(중복 제거), 최대 개수 제한
function upsertFront(list: SearchResult[], item: SearchResult): SearchResult[] {
  const withoutDup = list.filter((x) => x.id !== item.id);
  return [item, ...withoutDup].slice(0, MAX_ITEMS);
}

function useRecentSelections() {
  const [recent, setRecent] = useState<SearchResult[]>([]);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  const push = (item: SearchResult) => {
    setRecent((prev) => {
      const updated = upsertFront(prev, item);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRecent([]);
  };

  const removeById = (id: string) => {
    setRecent((prev) => {
      const updated = prev.filter((x) => x.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return { recent, push, clear, removeById };
}


function StyledSlider({
  range,
  setRange,
  marks,
  step,
}: {
  range: number[];
  setRange: (value: number[]) => void;
  marks?: readonly { value: number; label: string }[];
  step?: number;
}) {
  return (
    <div className="px-[20px] relative">
      <Slider
        aria-label="area"
        sx={{
          '& .MuiSlider-root': {
            margin: '0px',
          },
          '& .MuiSlider-markLabel': {
            fontSize: '10px',   // 여기서 라벨 폰트 크기 조절
            fontWeight: 400,
            color: 'text-text-02',
          },
          '& .MuiSlider-thumb': {
            width: 12,
            height: 12,
            backgroundColor: 'white',
            border: '2px solid var(--primary-040)',
            // boxShadow: '0px 2px 6px rgba(0,0,0,0.3)',
            // '&:hover': {
            //   boxShadow: '0px 0px 0px 8px rgba(25,118,210,0.16)',
            // },
            '&.Mui-focusVisible': {
              boxShadow: '0px 0px 0px 8px rgba(25,118,210,0.16)',
            },
            '&.Mui-active': {
              boxShadow: '0px 0px 0px 8px rgba(25,118,210,0.2)',
            },
          },
          // 👇 선택된 트랙 색
          '& .MuiSlider-track': {
            backgroundColor: 'var(--primary-040)',
          },
          // 👇 비선택 영역 색
          '& .MuiSlider-rail': {
            opacity: 0.3,
            backgroundColor: '#aaa',
          },
        }}                    
        value={range}
        onChange={(e, value) => setRange(value as number[])}
        valueLabelDisplay="auto"
        step={step}
        // marks={[
        //   { value: 0, label: '0m²' },
        //   { value: 2500, label: '2,500m²' },
        //   { value: 5000, label: '5,000m²' },
        //   { value: 7500, label: '7,500m²' },
        //   { value: 10000, label: '10,000m²+' },
        // ]}
        min={marks?.[0].value}
        max={marks?.[marks.length - 1].value}
      />
      <div className="absolute top-[22px] left-0 right-0 px-[20px] space-x-[12px] flex justify-between">
        {marks?.map((mark) => (
          <div
            key={mark.value} 
            className="flex flex-col items-center relative" >
            <div className="w-[1px] h-[4px] bg-line-03"/>
            <p className="text-text-02 font-c3 absolute top-[8px] min-w-[40px] text-center">{mark.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export interface SearchBarProps {
  onSelect: (id: string) => void;
}

const validPattern = /^[가-힣0-9a-zA-Z\s-]+$/;

export const SearchBar = ({onSelect}: SearchBarProps) => {

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const { recent, push, clear, removeById } = useRecentSelections();
  const axiosInstance = useAxiosWithAuth()
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isKeyboardNav, setIsKeyboardNav] = useState(false); // 키보드로 이동 중 여부

  const containerRef = useRef<HTMLDivElement>(null);
  const recentContainerRef = useRef<HTMLDivElement>(null);

  const activeControllerRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);           // 발사된 요청 번호
  const latestQueryRef = useRef("");         // 마지막으로 요청한 쿼리

  const [showFilterSetting, setShowFilterSetting] = useState(false);

  const [areaRange, setAreaRange] = useState([0, 10000]);
  const [farRange, setFarRange] = useState([0, 1500]);
  const [buildingAgeRange, setBuildingAgeRange] = useState([0, 40]);

  const [usageList, setUsageList] = useState(new Set<string>());

  useEffect(() => {
    console.log('usageList', usageList);

    resetUsageList();

  }, []);


  const resetUsageList = () => {
    setUsageList(new Set<string>(USAGE_LIST.map((usage) => usage.value)));
  }


  const scrollToHighlighted = (highlightedIndex: number) => {
    const ref = query ? containerRef : recentContainerRef;

    if (ref && highlightedIndex >= 0) {
      const element = ref.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      );
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    // if(query) {
    //   if (containerRef.current && highlightedIndex >= 0) {
    //     const element = containerRef.current.querySelector(
    //       `[data-index="${highlightedIndex}"]`
    //     );
    //     if (element) {
    //       element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    //     }
    //   }
    // }else{
    //   if (recentContainerRef.current && highlightedIndex >= 0) {
    //     const element = recentContainerRef.current.querySelector(
    //       `[data-index="${highlightedIndex}"]`
    //     );
    //     if (element) {
    //       element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    //     }
    //   }
    // }
  };


  // const [openSearchResult, setOpenSearchResult] = useState(false)
  // 실제 API 호출 함수
  // const fetchResults = async (searchTerm: string) => {

  //   setResults([]);
  //   if (!searchTerm.trim()) {
  //     activeControllerRef.current?.abort();
  //     setResults([]);
  //     setLoading(false);
  //     return;
  //   }
  //   // 내 요청 번호 할당
  //   const mySeq = ++requestSeqRef.current;
  //   latestQueryRef.current = searchTerm;

  //   // 이전 요청 취소
  //   activeControllerRef.current?.abort();
  //   const controller = new AbortController();
  //   activeControllerRef.current = controller;


  //   try {
  //     setLoading(true)
  //     console.log('request ', searchTerm)
  //     const res = await axiosInstance.get(`/api/search?q=${encodeURIComponent(searchTerm)}`, { signal: controller.signal });
  //     console.log(res.data)
      
  //     // ⛑️ 최신성 확인: 내가 마지막으로 보낸 요청이 아니면 버림
  //     if (mySeq !== requestSeqRef.current || latestQueryRef.current !== searchTerm) {
  //       return;
  //     }

  //     setResults(res.data);
  //   } catch (error) {

  //     if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
  //       return;
  //     }

  //     console.error("API error:", error);
  //   } finally{
  //     if (mySeq === requestSeqRef.current) {
  //       setLoading(false)
  //     }
  //   }
  // };
  const fetchResults = useCallback(async (searchTerm: string) => {
    // 비어있으면 정리만
    if (!searchTerm.trim() || !validPattern.test(searchTerm)) {
      // 이전 요청이 남아있다면 취소
      activeControllerRef.current?.abort();
      setResults([]);
      setLoading(false);
      return;
    }

    // 내 요청 번호 할당
    const mySeq = ++requestSeqRef.current;
    latestQueryRef.current = searchTerm;

    // 이전 요청 취소
    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;

    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `/api/search?q=${encodeURIComponent(searchTerm)}`,
        { signal: controller.signal }
      );

      // ⛑️ 최신성 확인: 내가 마지막으로 보낸 요청이 아니면 버림
      if (mySeq !== requestSeqRef.current || latestQueryRef.current !== searchTerm) {
        return;
      }

      setResults(res.data);
    } catch (err: any) {
      // 취소는 에러로 오니 조용히 무시
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
        return;
      }
      console.error("API error:", err);
    } finally {
      // 마찬가지로 최신 요청인 경우에만 로딩 해제
      if (mySeq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [axiosInstance]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log(e.key, results.length, highlightedIndex);
    if(e.nativeEvent.isComposing) return;
    setIsKeyboardNav(true);

    switch (e.key) {
      case 'Escape':
        setMenuAnchorEl(null)
        setQuery('')
        setResults([])
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break;
      case 'ArrowDown': {
        const list = query ? results : recent;
        const newIndex = highlightedIndex < list.length - 1 ? highlightedIndex + 1 : highlightedIndex;
        setHighlightedIndex(newIndex);
        scrollToHighlighted(newIndex);
        break;
      }
      case 'ArrowUp': {
        console.log('ArrowUp')
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        scrollToHighlighted(highlightedIndex);
        break;
      }
      case 'Enter':
        if (highlightedIndex >= 0) {
          const list = query ? results : recent;
          onSelectResult(list[highlightedIndex])
        }
        break;
      default:
        break;
    }
  };

  const onSelectResult = (searchResult: SearchResult) => {
    onSelect(searchResult.id)
    setMenuAnchorEl(null)
    setQuery('')
    setResults([])
    setHighlightedIndex(-1)
    inputRef.current?.blur()
    push(searchResult);
  }

  const getClientPoint = (evt: any): { x: number; y: number } | null => {
    if (!evt) return null;
    // React SyntheticEvent -> nativeEvent 재귀 처리
    if ('nativeEvent' in evt) return getClientPoint(evt.nativeEvent);
    // MouseEvent
    if ('clientX' in evt && 'clientY' in evt) {
      return { x: (evt as MouseEvent).clientX, y: (evt as MouseEvent).clientY };
    }
    // TouchEvent
    const te = evt as TouchEvent;
    const t = te.changedTouches?.[0] || te.touches?.[0];
    if (t) return { x: t.clientX, y: t.clientY };
    return null;
  };
  
  const pointInRect = (pt: { x: number; y: number }, rect: DOMRect) =>
    pt.x >= rect.left && pt.x <= rect.right && pt.y >= rect.top && pt.y <= rect.bottom;

  return (
    <div className="fixed top-[84px] w-[582px] h-[48px] bg-white left-[424px] z-40 font-c3 space-y-[14px] border border-line-03 shadow-[6px_6px_12px_0_rgba(0,0,0,0.06)]">
      <div className="flex items-center h-full gap-[12px] px-[12px]">
        <button 
          className={`font-s3 flex items-center gap-[4px] ${showFilterSetting ? 'text-primary-050' : 'text-text-02'}`}
          onClick={() => setShowFilterSetting(showFilterSetting => !showFilterSetting)}
        >
          <FilterIcon color={showFilterSetting ? 'var(--primary-050)' : 'var(--gray-070)'}/>
          필터
        </button>
        <VDivider/>
        <Switch
          checked={false}
          onChange={() => {}}
          isLabel={true}
        />
        <VDivider className="h-full"/>
        <SearchIcon/>
        <input
          ref={inputRef}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          // onDoubleClick={(e) => e.currentTarget.focus()}
          onClick={(e) => {
            console.log('onClick  ', e.currentTarget)
            // setMenuAnchorEl(e.currentTarget);
            setMenuAnchorEl(e.currentTarget);
            // e.stopPropagation();
            // e.preventDefault();
            // e.currentTarget.focus();
            
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
          onClose={(event, reason) => {
            console.log('onClose  ', event, reason)
            if (reason === 'backdropClick' && menuAnchorEl) {
              const pt = getClientPoint(event as any);
              if (pt) {
                const rect = (menuAnchorEl as HTMLElement).getBoundingClientRect();
                // 클릭 좌표가 input(anchorEl) 내부면 닫지 않음
                if (pointInRect(pt, rect)) {
                  inputRef.current?.focus()
                  return;
                }
              }
            }
            setMenuAnchorEl(null);
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
                  <div>
                    <p className="px-[12px] py-[4px] text-primary">최근검색</p>
                    <div 
                      ref={recentContainerRef} 
                      onMouseMove={()=> {
                        if (isKeyboardNav) setIsKeyboardNav(false);
                      }}
                      className="flex flex-col w-full overflow-y-auto divide-y divide-line-03 text-text-02">
                        {
                          recent.map((result, index) => (
                            <button
                              onClick={() => {
                                onSelectResult(result)
                              }} 
                              onMouseEnter={() => {
                                if (!isKeyboardNav) {
                                  setHighlightedIndex(index);
                                }
                              }}
                              data-index={index} 
                              key={result.id} className={`text-start flex px-[12px] py-[3px] ${index === highlightedIndex ? 'bg-primary-010' : ''} border-b-[1px] border-b-line-03`}>
                                <div className="flex-1">
                                  <p className="py-[2px]">{result.jibun || ''}</p>
                                  <p className="py-[2px]">{(result.road || '') + (result.buildingName ? ', ' + result.buildingName : '')}</p>
                                </div>
                                <button
                                  onClick={(e)=> {
                                    e.stopPropagation()
                                    removeById(result.id)
                                  }}
                                  >
                                  <CloseIcon/>
                                </button>
                            </button>
                        ))
                        }
                    </div>
                  </div>
                ) : (
                  results.length === 0 ? (
                    <p className="px-[12px] py-[4px]"> "{query}" 에 대한 검색 결과가 없습니다.</p>
                  ) : (
                    <div 
                      ref={containerRef} 
                      onMouseMove={()=> {
                        if (isKeyboardNav) setIsKeyboardNav(false);
                      }}
                      className="flex flex-col w-full overflow-y-auto divide-y divide-line-03 text-text-02">
                      {results.map((result, index) => (
                        <button
                          onClick={() => {
                            onSelectResult(result)
                          }} 
                          onMouseEnter={() => {
                            if (!isKeyboardNav) {
                              setHighlightedIndex(index);
                            }
                          }}
                          data-index={index} 
                          key={result.id} className={`text-start flex flex-col px-[12px] py-[3px] ${index === highlightedIndex ? 'bg-primary-010' : ''} border-b-[1px] border-b-line-03`}>
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
      {
        showFilterSetting && (
          <div className="fixed top-[144px] w-[400px] p-[20px] min-h-[480px] bg-white left-[424px] z-40 font-c3 border border-line-02 rounded-[8px] shadow-[0px_20px_40px_0_rgba(0,0,0,0.06)]">
            <div className="flex justify-between">
              <p className="font-h3">필터 설정</p>
              <button className="font-s3 text-text-02 px-[8px] py-[4px] rounded-[2px] bg-surface-second flex items-center gap-[4px]">
                <ChangeIcon/>
                평
              </button>
            </div>
            <p className="mt-[4px] font-s2 text-text-03">
              찾으시는 조건을 필터설정에 맞게 검색해보세요.
            </p>
            <div className="flex flex-col mt-[16px] space-y-[30px]">
              <div>
                <p className="font-h5 text-text-02">토지 면적</p>
                <StyledSlider
                  range={areaRange}
                  setRange={setAreaRange}
                  marks={AREA_MARKS}
                  step={100}
                />
              </div>
              <div>
                <p className="font-h5 text-text-02">건물 용적률</p>
                <StyledSlider
                  range={farRange}
                  setRange={setFarRange}
                  marks={FAR_MARKS}
                  step={5}
                />
              </div>
              <div>
                <p className="font-h5 text-text-02">건물 노후</p>
                <StyledSlider
                  range={buildingAgeRange}
                  setRange={setBuildingAgeRange}
                  marks={BUILDING_AGE_MARKS}
                  step={1}
                />
              </div>
            </div>
            <HDivider className="mt-[30px]" colorClassName="bg-line-02"/>
            <div className="mt-[20px] flex flex-col space-y-[16px]">
              <div className="flex justify-between">
                <p className="font-h5 text-text-02">용도지역</p>
                <button onClick={resetUsageList} className="font-s3 text-text-02 px-[8px] py-[4px] rounded-[2px] bg-surface-second flex items-center gap-[4px]">
                  <ChangeIcon/>
                  초기화
                </button>
              </div>
              <div className="flex flex-wrap gap-[12px]">
                {USAGE_LIST.map((usage) => (
                  <button 
                    onClick={() => {
                      if(usageList.size === USAGE_LIST.length) {
                        setUsageList(new Set([usage.value]));
                        return;
                      }

                      if (usageList.has(usage.value)) {
                        usageList.delete(usage.value);
                        setUsageList(new Set(usageList));
                      } else {
                        usageList.add(usage.value);
                        setUsageList(new Set(usageList));
                      }
                    }}
                    className={`flex items-center outline-[1px] ${(usageList.has(usage.value)) ? 'outline-primary' : 'outline-line-02'} rounded-[2px] px-[6px] py-[4px]`}>
                    <p className={`font-s3 ${(usageList.has(usage.value)) ? 'text-primary' : 'text-text-02'}`}>{usage.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      }
    </div>
  )
}
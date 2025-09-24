import { CloseIcon, FilterIcon, SearchIcon, Switch, VDivider, type SearchResult } from "@repo/common"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import debounce from "lodash/debounce";
import useAxiosWithAuth from "../axiosWithAuth";
import { CircularProgress, Menu } from "@mui/material";


const DEBOUNCE_DELAY = 300
const STORAGE_KEY = "recentSelectedSearch";
const MAX_ITEMS = 30;


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


export interface SearchBarProps {
  onSelect: (id: string) => void;
}

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
      case 'ArrowDown':
        const list = query ? results : recent;
        setHighlightedIndex((prev) =>
          prev < list.length - 1 ? prev + 1 : prev
        );
        scrollToHighlighted(highlightedIndex);
     
        break;
      case 'ArrowUp':
        console.log('ArrowUp')
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        scrollToHighlighted(highlightedIndex);
        break;
      case 'Enter':
        if (highlightedIndex >= 0) {
          onSelectResult(results[highlightedIndex])
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
    </div>
  )
}
import React from "react";
import { useState } from "react";
// import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, MoreHorizontal } from "lucide-react";
import { ChevronRightCustomIcon, ChevronsRightCustomIcon } from "../icons";

interface PaginationProps {
  className?: string;
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  pageRangeDisplayed?: number;
  toast: (msg: string) => void;
}

export const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange, pageRangeDisplayed = 10, toast, className }: PaginationProps) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [pageInput, setPageInput] = useState<string>('');

  const getPageNumbers = () => {
    if (totalItems === 0) {
      return [1];
    }

    const pageNumbers: (number | string)[] = [];
    const currentBlockStartPage = Math.floor((currentPage - 1) / pageRangeDisplayed) * pageRangeDisplayed + 1;
    const currentBlockEndPage = Math.min(currentBlockStartPage + pageRangeDisplayed - 1, totalPages);

    if (currentBlockStartPage > 1) {
      pageNumbers.push(1);
      if (currentBlockStartPage > 2) pageNumbers.push('...');
    }

    for (let i = currentBlockStartPage; i <= currentBlockEndPage; i++) pageNumbers.push(i);

    if (currentBlockEndPage < totalPages) {
      if (currentBlockEndPage < totalPages - 1) pageNumbers.push('...');
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const pageNumbersToShow = getPageNumbers();

  const handlePrevBlock = () => {
    const currentBlockStart = Math.floor((currentPage - 1) / pageRangeDisplayed) * pageRangeDisplayed;
    const targetPage = Math.max(1, currentBlockStart - pageRangeDisplayed + 1);
    onPageChange(targetPage);
  };

  const handlePrevPage = () => onPageChange(Math.max(1, currentPage - 1));
  const handleNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1));
  const handleNextBlock = () => {
    const currentBlockEnd = Math.floor((currentPage - 1) / pageRangeDisplayed) * pageRangeDisplayed + pageRangeDisplayed;
    const targetPage = Math.min(totalPages, currentBlockEnd + 1);
    onPageChange(targetPage);
  };

  const handlePageClick = (page: number) => {
    if (typeof page === 'number' && page >= 1 && page <= totalPages) onPageChange(page);
  };

  const handleGoPage = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
      setPageInput(''); // Clear input on successful navigation
    } else {
      toast?.('유효하지 않은 페이지 번호입니다.');
      setPageInput('');
    }
  };

  const isEntirelyDisabled = totalItems === 0;

  const isFirstPage = currentPage === 1 || isEntirelyDisabled;
  const isLastPage = currentPage === totalPages || totalPages <= 1 || isEntirelyDisabled;

  const displayCurrentPage = isEntirelyDisabled ? 1 : currentPage;

  return (
    <div className={`flex items-center gap-[8px] ${className}`}>
      {/* 이전 블록 (<<) */}
      <button onClick={handlePrevBlock} disabled={isFirstPage}>
        {/* <ChevronsLeft color={isFirstPage ? 'rgba(0, 0, 0, 0.15)' : 'black'} size={18}/> */}
      </button>
      {/* 이전 페이지 (<) */}
      <button onClick={handlePrevPage} disabled={isFirstPage}>
        {/* <ChevronLeft color={isFirstPage ? 'rgba(0, 0, 0, 0.15)' : 'black'} size={18}/> */}
      </button>

      {/* 페이지 번호 목록 */}
      {pageNumbersToShow.map((pageNumber, index) => (
        <React.Fragment key={index}>
          {typeof pageNumber === 'string' ? ( // '...' 표시
            // <span className="text-text-4 font-s2"><MoreHorizontal size={20}/></span>
            <span>...</span>
          ) : (
            <button
              onClick={() => handlePageClick(pageNumber)}
              className={`flex items-center justify-center font-s2 p-[2px] w-[24px] h-[24px] border-none rounded-[2px] cursor-pointer
                ${displayCurrentPage === pageNumber && !isEntirelyDisabled ? 'bg-primary text-white' : 'text-text-4'}
                ${isEntirelyDisabled ? 'text-text-4 cursor-not-allowed' : ''}
              `}
              disabled={isEntirelyDisabled}
            >
              {pageNumber}
            </button>
          )}
        </React.Fragment>
      ))}

      {/* 다음 페이지 (>) */}
      <button onClick={handleNextPage} disabled={isLastPage}>
        <ChevronRightCustomIcon color={isLastPage ? '#1A1C20' : 'black'} />
      </button>
      {/* 다음 블록 (>>) */}
      <button onClick={handleNextBlock} disabled={isLastPage}>
        <ChevronsRightCustomIcon color={isLastPage ? '#1A1C20' : 'black'} />
      </button>

      {/* 직접 페이지 이동 */}
      <span className={`font-s2 ml-[16px] ${isEntirelyDisabled ? 'text-text-4' : ''}`}>PAGE</span>
      <input
        type="number"
        value={pageInput}
        onChange={(e) => setPageInput(e.target.value)}
        className={`w-[50px] p-[5px] text-center font-s2 text-text-4 border rounded-[2px] focus:outline-none
          ${isEntirelyDisabled ? 'border-line-3 bg-surface-second' : 'border-line-3 focus:border-line-4'}
        `}
        onKeyDown={(e) => {if (e.key === 'Enter' && e.nativeEvent.isComposing === false) handleGoPage();}}
        disabled={isEntirelyDisabled}
      />
      <button
        onClick={handleGoPage}
        className={`font-s2 text-text-4 ${isEntirelyDisabled ? 'text-text-4 cursor-not-allowed' : ''}`}
        disabled={isEntirelyDisabled}
      >
        GO
      </button>
    </div>
  );
};
"""
peti.go.kr 재산공개 통합 크롤러
목록 크롤링 후 바로 상세 크롤링까지 한 번에 처리

사용법:
    python crawler.py                    # 최근 1달
    python crawler.py 20240205 20240308  # 기간 지정 (시작일 종료일)
"""
import asyncio
import argparse
import csv
import sys
from datetime import datetime
from typing import List, Dict, Any
from playwright.async_api import async_playwright, Page, BrowserContext
from dateutil.relativedelta import relativedelta

from config import (
    LIST_URL, REQUEST_DELAY, DETAILS_CSV, FAILED_CSV,
    POPUP_WAIT_TIMEOUT, HEADLESS, BROWSER_TIMEOUT, DATA_DIR
)
from logger import logger
from notifier import notifier


def parse_args():
    """명령행 인자 파싱"""
    parser = argparse.ArgumentParser(description='peti.go.kr 재산공개 크롤러')
    parser.add_argument('start_date', nargs='?', help='시작일 (YYYYMMDD)')
    parser.add_argument('end_date', nargs='?', help='종료일 (YYYYMMDD)')
    return parser.parse_args()


def get_date_range(args) -> tuple:
    """인자에서 날짜 범위 추출, 없으면 최근 1달"""
    if args.start_date and args.end_date:
        start = datetime.strptime(args.start_date, "%Y%m%d")
        end = datetime.strptime(args.end_date, "%Y%m%d")
    else:
        end = datetime.now()
        start = end - relativedelta(months=1)
    return start, end


async def crawl(start_date: datetime, end_date: datetime) -> Dict[str, Any]:
    """
    메인 크롤링 함수
    목록 크롤링 후 각 항목의 상세 정보까지 한 번에 처리
    """
    from_date_str = start_date.strftime("%Y-%m-%d")
    to_date_str = end_date.strftime("%Y-%m-%d")

    # 타임스탬프 기반 출력 파일명
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = DATA_DIR / f"details_{timestamp}.csv"

    logger.info(f"크롤링 시작: {from_date_str} ~ {to_date_str}")
    logger.info(f"출력 파일: {output_file}")
    notifier.send_start(f"크롤링 ({from_date_str} ~ {to_date_str})")

    all_details = []
    success_count = 0
    failed_count = 0

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=HEADLESS)
        context = await browser.new_context(
            viewport={"width": 1400, "height": 900},
            locale="ko-KR"
        )
        context.set_default_timeout(BROWSER_TIMEOUT)
        page = await context.new_page()

        try:
            # 1. 목록 페이지 접속
            logger.info("목록 페이지 접속 중...")
            await page.goto(LIST_URL, wait_until="load", timeout=120000)
            await asyncio.sleep(3)

            # 2. Tab1 (위원회별 공개목록) 클릭
            await page.click('#tab1')
            await asyncio.sleep(1)

            # 3. 날짜 입력
            await page.fill('input[name="fromOptpDt"]', from_date_str)
            await page.fill('input[name="toOptpDt"]', to_date_str)

            # 4. 검색 버튼 클릭
            await page.click('#btnCmmt')
            await asyncio.sleep(3)

            # 5. 그리드 데이터 추출
            grid_data = await page.evaluate("() => window.gridData_tab1 || []")

            if not grid_data:
                logger.warning("목록 데이터 없음")
                return {"total": 0, "success": 0, "failed": 0}

            total_count = len(grid_data)
            logger.info(f"목록 {total_count}건 발견")

            # 6. 각 항목에 대해 상세 크롤링
            for i, item in enumerate(grid_data):
                rgs_mno = item.get("rgsMno", "")
                cmmt_ornm = item.get("cmmtOrnm", "")

                try:
                    logger.info(f"[{i+1}/{total_count}] {cmmt_ornm} 상세 크롤링 중...")

                    # 상세 데이터 크롤링
                    details = await _crawl_detail(page, context, item)

                    if details:
                        all_details.extend(details)
                        success_count += 1
                        logger.info(f"[{i+1}/{total_count}] 성공: {len(details)}건 재산정보")
                    else:
                        logger.warning(f"[{i+1}/{total_count}] 재산정보 없음")
                        success_count += 1

                except Exception as e:
                    failed_count += 1
                    logger.error(f"[{i+1}/{total_count}] 실패: {e}")
                    _save_failed(item, str(e))

                # 진행 상황 알림 (25% 단위)
                progress_pct = (i + 1) / total_count
                if total_count >= 4 and (i + 1) % max(1, total_count // 4) == 0:
                    notifier.send_progress(i + 1, total_count, "크롤링")

                # 요청 간 딜레이
                await asyncio.sleep(REQUEST_DELAY)

        except Exception as e:
            logger.error(f"크롤링 오류: {e}")
            notifier.send_error(str(e))
            raise
        finally:
            await browser.close()

    # 결과 저장
    if all_details:
        _save_details_to_csv(all_details, output_file)

    result = {
        "total": total_count if 'total_count' in dir() else 0,
        "success": success_count,
        "failed": failed_count
    }

    logger.info(f"크롤링 완료: 성공 {success_count}, 실패 {failed_count}")
    notifier.send_report(result["total"], success_count, failed_count)

    return result


async def _crawl_detail(
    page: Page,
    context: BrowserContext,
    item: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    개별 항목의 상세 정보 크롤링
    팝업 창을 열어 데이터를 추출
    """
    rgs_mno = item.get("rgsMno", "")
    optp_dt = item.get("optpDt", "")
    cmmt_ornm = item.get("cmmtOrnm", "")
    optp_shp_nm = item.get("optpShpNm", "")
    details = []

    # rgsMno의 특수문자 이스케이프 처리
    rgs_mno_escaped = rgs_mno.replace("'", "\\'").replace('"', '\\"')
    cmmt_ornm_escaped = cmmt_ornm.replace("'", "\\'").replace('"', '\\"')

    # 팝업 이벤트 대기 설정
    async with context.expect_page() as popup_info:
        # fnDtlSrch 함수 호출하여 팝업 열기
        await page.evaluate(f"""
            () => {{
                const itemData = {{
                    rgsMno: '{rgs_mno_escaped}',
                    optpDt: '{optp_dt}',
                    cmmtOrnm: '{cmmt_ornm_escaped}',
                    optpShpNm: '{optp_shp_nm}',
                    rgsDtrNm: null,
                    ornm: null
                }};
                if (typeof fnDtlSrch === 'function') {{
                    fnDtlSrch({{item: itemData}}, 'srch');
                }}
            }}
        """)

    # 팝업 페이지 가져오기
    popup = await popup_info.value

    try:
        # 팝업 로딩 대기
        await popup.wait_for_load_state("load", timeout=POPUP_WAIT_TIMEOUT)
        await asyncio.sleep(3)  # 데이터 로딩 대기

        # 데이터 테이블 로딩 대기
        try:
            await popup.wait_for_selector(
                'table tbody tr',
                timeout=POPUP_WAIT_TIMEOUT
            )
            await asyncio.sleep(2)  # 추가 대기
        except Exception:
            logger.debug(f"테이블 로딩 타임아웃, 계속 진행")

        # 기본 정보 추출
        basic_info = await _extract_basic_info(popup)

        # 재산 정보 테이블 추출
        property_data = await _extract_property_data(popup)

        # 데이터 병합
        for prop in property_data:
            details.append({
                "rgsMno": rgs_mno,
                "cmmtOrnm": cmmt_ornm,
                "optpDt": optp_dt,
                "optpShpNm": optp_shp_nm,
                **basic_info,
                **prop,
                "crawled_at": datetime.now().isoformat()
            })

        # 재산 정보가 없는 경우 기본 정보만 저장
        if not property_data:
            details.append({
                "rgsMno": rgs_mno,
                "cmmtOrnm": cmmt_ornm,
                "optpDt": optp_dt,
                "optpShpNm": optp_shp_nm,
                **basic_info,
                "crawled_at": datetime.now().isoformat()
            })

    finally:
        # 팝업 닫기
        await popup.close()

    return details


async def _extract_basic_info(popup: Page) -> Dict[str, str]:
    """팝업에서 기본 정보 추출"""
    try:
        info = await popup.evaluate("""
            () => {
                const getText = (selector) => {
                    const el = document.querySelector(selector);
                    return el ? el.textContent.trim() : '';
                };

                return {
                    name: getText('.name, [data-field="name"]') || '',
                    org: getText('.org, [data-field="org"]') || '',
                    position: getText('.position, [data-field="position"]') || ''
                };
            }
        """)
        return info
    except Exception as e:
        logger.debug(f"기본 정보 추출 실패: {e}")
        return {}


async def _extract_property_data(popup: Page) -> List[Dict[str, str]]:
    """팝업에서 재산 정보 테이블 추출"""
    try:
        data = await popup.evaluate("""
            () => {
                const results = [];
                const rows = document.querySelectorAll('table tbody tr');

                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 5) {
                        results.push({
                            relation: cells[0]?.textContent?.trim() || '',
                            propertyType: cells[1]?.textContent?.trim() || '',
                            location: cells[2]?.textContent?.trim() || '',
                            area: cells[3]?.textContent?.trim() || '',
                            currentValue: cells[4]?.textContent?.trim() || '',
                            previousValue: cells[5]?.textContent?.trim() || '',
                            increaseValue: cells[6]?.textContent?.trim() || '',
                            decreaseValue: cells[7]?.textContent?.trim() || '',
                            changeReason: cells[8]?.textContent?.trim() || ''
                        });
                    }
                });

                return results;
            }
        """)
        return data
    except Exception as e:
        logger.debug(f"재산 정보 추출 실패: {e}")
        return []


def _save_details_to_csv(details: List[Dict[str, Any]], output_file=None):
    """상세 데이터 CSV 저장"""
    if not details:
        return

    # data 디렉토리 생성
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # 출력 파일 경로
    if output_file is None:
        output_file = DETAILS_CSV

    fieldnames = [
        "rgsMno", "cmmtOrnm", "optpDt", "optpShpNm",
        "name", "org", "position",
        "relation", "propertyType", "location", "area",
        "currentValue", "previousValue", "increaseValue",
        "decreaseValue", "changeReason", "crawled_at"
    ]

    file_exists = output_file.exists() if hasattr(output_file, 'exists') else False
    mode = 'a' if file_exists else 'w'

    with open(output_file, mode, newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')

        if not file_exists:
            writer.writeheader()

        writer.writerows(details)

    logger.info(f"CSV 저장 완료: {output_file} ({len(details)}건)")


def _save_failed(item: Dict[str, str], error_message: str):
    """실패 항목 저장"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    fieldnames = ["rgsMno", "cmmtOrnm", "optpDt", "error_message", "failed_at"]

    file_exists = FAILED_CSV.exists()
    mode = 'a' if file_exists else 'w'

    with open(FAILED_CSV, mode, newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)

        if not file_exists:
            writer.writeheader()

        writer.writerow({
            "rgsMno": item.get("rgsMno", ""),
            "cmmtOrnm": item.get("cmmtOrnm", ""),
            "optpDt": item.get("optpDt", ""),
            "error_message": error_message[:500],
            "failed_at": datetime.now().isoformat()
        })


async def main():
    args = parse_args()
    start_date, end_date = get_date_range(args)

    print(f"크롤링 기간: {start_date.strftime('%Y-%m-%d')} ~ {end_date.strftime('%Y-%m-%d')}")

    result = await crawl(start_date, end_date)
    print(f"\n결과: 총 {result['total']}건, 성공 {result['success']}건, 실패 {result['failed']}건")


if __name__ == "__main__":
    asyncio.run(main())

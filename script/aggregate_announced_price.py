import sys
import pymysql
from dotenv import load_dotenv
import os
import logging
from datetime import datetime

log_filename = f'price_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'

logging.basicConfig(
  level=logging.INFO,
  format='%(asctime)s - %(levelname)s - %(message)s',
  handlers=[
    logging.FileHandler(log_filename),
    logging.StreamHandler()  # 콘솔에도 출력
  ]
)
logger = logging.getLogger(__name__)

load_dotenv()

def get_connection():
  return pymysql.connect(
    host=os.getenv('DB_HOST'),
    port=int(os.getenv('DB_PORT')),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    database=os.getenv('DB_NAME')
  )

def aggregate(year=None):
  conn = get_connection()
  cursor = conn.cursor()

  try:
    if year is None:
      print('전체 집계 모드: 기존 데이터 삭제')
      logger.info('전체 집계 모드: 기존 데이터 삭제')
      cursor.execute('DELETE FROM announced_price_avg')
      year_condition = ''
    else:
      print(f'{year}년 집계 모드')
      logger.info(f'{year}년 집계 모드')
      cursor.execute('DELETE FROM announced_price_avg WHERE year = %s', (year,))
      year_condition = f'WHERE year = {year}'

    # 시 레벨
    print('시 레벨 집계 중...')
    logger.info('시 레벨 집계 중...')
    cursor.execute(f'''
      INSERT INTO announced_price_avg (area_code, year, avg_price, land_count)
      SELECT
        LEFT(leg_dong_code, 2),
        year,
        ROUND(AVG(price)),
        COUNT(*)
      FROM (
        SELECT leg_dong_code, year, MAX(price) as price
        FROM individual_announced_price
        {year_condition}
        GROUP BY id, year
      ) AS deduped
      GROUP BY LEFT(leg_dong_code, 2), year
    ''')
    print(f'  - {cursor.rowcount}건 삽입')
    logger.info(f'  - {cursor.rowcount}건 삽입')

    # 구 레벨
    print('구 레벨 집계 중...')
    logger.info('구 레벨 집계 중...')
    cursor.execute(f'''
      INSERT INTO announced_price_avg (area_code, year, avg_price, land_count)
      SELECT
        LEFT(leg_dong_code, 5),
        year,
        ROUND(AVG(price)),
        COUNT(*)
      FROM (
        SELECT leg_dong_code, year, MAX(price) as price
        FROM individual_announced_price
        {year_condition}
        GROUP BY id, year
      ) AS deduped
      GROUP BY LEFT(leg_dong_code, 5), year
    ''')
    print(f'  - {cursor.rowcount}건 삽입')
    logger.info(f'  - {cursor.rowcount}건 삽입')

    # 동 레벨
    print('동 레벨 집계 중...')
    logger.info('동 레벨 집계 중...')
    cursor.execute(f'''
      INSERT INTO announced_price_avg (area_code, year, avg_price, land_count)
      SELECT
        leg_dong_code,
        year,
        ROUND(AVG(price)),
        COUNT(*)
      FROM (
        SELECT leg_dong_code, year, MAX(price) as price
        FROM individual_announced_price
        {year_condition}
        GROUP BY id, year
      ) AS deduped
      GROUP BY leg_dong_code, year
    ''')
    print(f'  - {cursor.rowcount}건 삽입')
    logger.info(f'  - {cursor.rowcount}건 삽입')

    conn.commit()
    print('완료!')
    logger.info('완료!')

  except Exception as e:
    conn.rollback()
    logger.error(f'에러 발생: {e}')
    print(f'에러 발생: {e}')
    raise
  finally:
    cursor.close()
    conn.close()

if __name__ == '__main__':
  year = int(sys.argv[1]) if len(sys.argv) > 1 else None
  aggregate(year)
import json
import pymysql
from sshtunnel import SSHTunnelForwarder
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict
from dotenv import load_dotenv
import os

load_dotenv()

@dataclass
class BdsSale:
  """BDS Sale 데이터 모델"""
  idx: str
  addr: str
  platArea: float
  totalArea: float
  buildValue: float
  sellProfit: float
  saleId: str
  saleAmount: float
  memo: str
  imagePath: str
  name: Optional[str] = None

  @classmethod
  def from_db_row(cls, row: tuple) -> 'BdsSale':
    """데이터베이스 row를 BdsSale 객체로 변환"""
    return cls(
      idx=str(row[0]),
      addr=row[1] or '',
      platArea=float(row[2]) if row[2] else 0.0,
      totalArea=float(row[3]) if row[3] else 0.0,
      buildValue=float(row[4]) if row[4] else 0.0,
      saleId=str(row[5]),
      saleAmount=float(row[6]) if row[6] else 0.0,
      memo=row[7] or '',
      imagePath=row[8] or '',
      sellProfit=float(row[9]) if row[9] else 0.0,
      name=row[10] if len(row) > 10 else None
    )


class BdsSaleDatabase:
  """BDS 데이터베이스 연결 및 쿼리 클래스"""
  
  def __init__(self, db_config: Dict[str, Any], image_host: str):
    self.config = db_config
    self.image_host = image_host
    self.tunnel = None
    self.connection = None

  def __enter__(self):
    """Context manager 진입"""
    self.connect()
    return self

  def __exit__(self, exc_type, exc_val, exc_tb):
    """Context manager 종료"""
    self.disconnect()

  def connect(self):
    """SSH 터널 및 데이터베이스 연결"""
    print(f"Connecting to BDS DB via SSH tunnel...")
    
    # SSH 터널 생성
    self.tunnel = SSHTunnelForwarder(
      (self.config['ssh_host'], self.config.get('ssh_port', 22)),
      ssh_username=self.config['ssh_user'],
      ssh_password=self.config['ssh_password'],
      remote_bind_address=(
        self.config.get('db_host', '127.0.0.1'),
        self.config.get('db_port', 3306)
      ),
      local_bind_address=('127.0.0.1', 0)
    )
    
    self.tunnel.start()
    print(f"SSH tunnel ready: 127.0.0.1:{self.tunnel.local_bind_port} -> "
          f"{self.config.get('db_host', '127.0.0.1')}:{self.config.get('db_port', 3306)}")
    
    # MySQL 연결
    self.connection = pymysql.connect(
      host='127.0.0.1',
      port=self.tunnel.local_bind_port,
      user=self.config['db_user'],
      password=self.config['db_password'],
      database=self.config['db_name'],
      charset='utf8mb4',
      cursorclass=pymysql.cursors.Cursor
    )
    
    # 연결 테스트
    with self.connection.cursor() as cursor:
      cursor.execute('SELECT 1 AS ok')
      result = cursor.fetchone()
      print(f'DB connected OK: {result}')

  def disconnect(self):
    """연결 종료"""
    if self.connection:
      self.connection.close()
      self.connection = None
      print("DB connection closed")
    
    if self.tunnel:
      self.tunnel.stop()
      self.tunnel = None
      print("SSH tunnel closed")

  def get_list(self, filter_type: str) -> List[BdsSale]:
    char_map = {
      'hotplace': '_1%',
      'subway': '__1%',
      'income': '___1%',
      'office': '____1%',
      'newbuild': '_____1%',
      'development': '______1%',
      'minibuild': '_______1%',
    }
    char = char_map.get(filter_type, '1%')
    
    query = f"""
    WITH LatestSales AS (
      SELECT
        bs1.*,
        ROW_NUMBER() OVER (
          PARTITION BY bs1.bd_building_id
          ORDER BY bs1.update_at DESC, bs1.id DESC
        ) AS rn
      FROM bd_sale_info bs1
      WHERE bs1.deleted_date IS NULL
    ),
    RentAgg AS (
      SELECT
        r.bd_sale_info_id,
        SUM(COALESCE(r.bsri_rent_deposit, 0))    AS tot_deposit,
        SUM(COALESCE(r.bsri_rent_fee, 0))        AS tot_rent,
        SUM(COALESCE(r.bsri_maintenance_fee, 0)) AS tot_rent_m_fee
      FROM bd_sale_rent_info r
      GROUP BY r.bd_sale_info_id
    ),
    ValAgg AS (
      SELECT
        v.bd_sale_info_id,
        SUM(COALESCE(v.value, 0)) AS build_value
      FROM bd_sale_valuation v
      GROUP BY v.bd_sale_info_id
    )
    SELECT
      bd.id AS idx,
      bd.bd_addr as addr,
      bd.bd_plat_area as platArea,
      bd.bd_total_area as totalArea,

      /* 평가값 합계 */
      COALESCE(va.build_value, 0) AS buildValue,

      /* 매물 정보 */
      bd_sale.id AS saleId,
      bd_sale.sale_amount as saleAmount,
      bd_sale.memo as memo,

      /* 이미지 경로 정규화 */
      CASE
          WHEN bd_img.image_path LIKE './%' THEN CONCAT('{self.image_host}', SUBSTRING(bd_img.image_path, 3))
          ELSE CONCAT('{self.image_host}', bd_img.image_path)
      END AS imagePath,

      /* 수익률 계산식
        (( (임대료 + 관리비 + 기타수입)*12 ) - (매매가 * 대출비율 * 대출금리/10000))
        / ( 매매가 - 보증금합 - (매매가 * 대출비율/100) ) * 100
        ※ 분모 0 방지: NULLIF
      */
      (
        (
          (
            (COALESCE(r.tot_rent, 0) + COALESCE(r.tot_rent_m_fee, 0) + COALESCE(bd_sale.sale_income_etc, 0))
            * 12
          )
          - (COALESCE(bd_sale.sale_amount, 0) * COALESCE(bd_sale.sale_loan_ratio, 0) * COALESCE(bd_sale.sale_loan_rate, 0) / 10000)
        )
        / NULLIF(
            COALESCE(bd_sale.sale_amount, 0)
            - COALESCE(r.tot_deposit, 0)
            - (COALESCE(bd_sale.sale_amount, 0) * COALESCE(bd_sale.sale_loan_ratio, 0) / 100),
            0
          )
      ) * 100 AS sellProfit,
      
      /* 건물명 */
      bd.bd_name as name
    FROM bd_building AS bd
    LEFT JOIN (
      SELECT * FROM LatestSales WHERE rn = 1
    ) AS bd_sale
      ON bd.id = bd_sale.bd_building_id
    LEFT JOIN bd_building_image AS bd_img
      ON bd.id = bd_img.bd_building_id
    AND bd_img.image_type = 'BUILDING'
    AND bd_img.deleted_date IS NULL
    LEFT JOIN ValAgg AS va
      ON va.bd_sale_info_id = bd_sale.id
    LEFT JOIN RentAgg AS r
      ON r.bd_sale_info_id = bd_sale.id
    WHERE bd.bd_char LIKE '{char}'
      AND bd_sale.deleted_date IS NULL
      AND bd_sale.sale_type = 'P'
    GROUP BY
      bd.id, bd.bd_name, bd.bd_addr, bd.bd_plat_area, bd.bd_total_area,
      buildValue,
      bd_sale.id, bd_sale.sale_amount, bd_sale.sale_loan_ratio, bd_sale.sale_loan_rate, bd_sale.sale_income_etc, bd_sale.memo,
      imagePath
    ORDER BY buildValue DESC
    LIMIT 5
    """
    
    try:
      with self.connection.cursor() as cursor:
        cursor.execute(query)
        rows = cursor.fetchall()
        
        bds_list = [BdsSale.from_db_row(row) for row in rows]
        return bds_list
        
    except Exception as error:
      print(f'Error getting building shop list: {error}')
      raise


def save_to_json(data: List[BdsSale], filename: str):
  """데이터를 JSON 파일로 저장"""
  json_data = [asdict(item) for item in data]
  
  with open(filename, 'w', encoding='utf-8') as f:
    json.dump(json_data, f, ensure_ascii=False, indent=2)
  
  print(f"Data saved to {filename}")


def get_db_config() -> Dict[str, Any]:
  """환경 변수에서 데이터베이스 설정 읽기"""
  return {
    'ssh_host': os.getenv('BDS_HOST'),
    'ssh_port': int(os.getenv('BDS_PORT', '22')),
    'ssh_user': os.getenv('BDS_USERNAME'),
    'ssh_password': os.getenv('BDS_PASSWORD'),
    'db_host': os.getenv('BDS_DB_HOST', '127.0.0.1'),
    'db_port': int(os.getenv('BDS_DB_PORT', '3306')),
    'db_user': os.getenv('BDS_DB_USER'),
    'db_password': os.getenv('BDS_DB_PASSWORD'),
    'db_name': os.getenv('BDS_DB_NAME')
  }

def get_image_host() -> str:
  """환경 변수에서 이미지 호스트 URL 읽기"""
  return os.getenv('IMAGE_HOST', 'https://example.com/')

def main():
  """메인 실행 함수"""
  db_config = get_db_config()
  image_host = get_image_host()
  
  filter_types = [
    'hotplace', 'subway', 'income', 'office',
    'newbuild', 'development', 'minibuild'
  ]
  
  all_data = {}
  
  # Context manager를 사용하여 연결 관리
  with BdsSaleDatabase(db_config, image_host) as db:
    for filter_type in filter_types:
      try:
        bds_list = db.get_list(filter_type)
        all_data[filter_type] = [asdict(item) for item in bds_list]
        
      except Exception as e:
        all_data[filter_type] = []
  
  base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
  output_filename = os.path.join(base_dir, 'apps', 'server', 'buildingshop', 'bds_sales.json')
  with open(output_filename, 'w', encoding='utf-8') as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
  main()
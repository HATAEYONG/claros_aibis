# SAP 주요 테이블 명세서

## 1. 품목정보 (DMA100)

| 필드명 | PK | NULL | FK | 데이터타입 | 설명 |
|--------|----|----|----|-----------|----|
| item_id | PK | NOT NULL | | Int | 품목ID |
| item_code | | NOT NULL | | Text | 품목코드 |
| item_name | | NOT NULL | | Text | 품목명 |
| spec | | NOT NULL | | Text | 규격 |
| model | | NOT NULL | | Combo | 모델 |
| item_type | | NOT NULL | | Combo | 품목유형 |
| unit | | NOT NULL | | Combo | 단위 |
| make_type | | NOT NULL | | Text | 제조구분 |
| purchase_type | | NOT NULL | | Text | 매입구분 |
| inspection_type | | NOT NULL | | Text | 검사구분 |
| standard_price | | NOT NULL | | Decimal | 표준단가 |
| list_price | | NOT NULL | | Decimal | 판매단가 |
| purchase_price | | NOT NULL | | Decimal | 매입단가 |
| barcode | | NOT NULL | | Text | 바코드 |
| safety_stock | | NOT NULL | | Int | 안전재고 |
| lead_time | | NOT NULL | | Int | 리드타임(일) |
| description | | NOT NULL | | Text | 품목설명 |
| use_yn | | NOT NULL | | Check | 사용여부 |
| base_item_yn | | NOT NULL | | Check | 기준품목여부 |
| eco_yn | | NOT NULL | | Check | ECO대상여부 |
| valid_from | | NOT NULL | | Date | 유효시작일 |
| valid_to | | NOT NULL | | Date | 유효종료일 |
| cid | | NOT NULL | | Int | 생성자 |
| cdt | | NOT NULL | | Date | 생성일 |
| mid | | NOT NULL | | Int | 수정자 |
| mdt | | NOT NULL | | Date | 수정일 |

## 2. 기초코드 (BCA200)

| 필드명 | PK | NULL | FK | 데이터타입 | 설명 |
|--------|----|----|----|-----------|----|
| base_code | PK | NOT NULL | | Text | 기초코드 |
| code_name | | NOT NULL | | Text | 코드명 |
| code_value | | NOT NULL | | Text | 코드값 |
| description | | NOT NULL | | Text | 설명 |
| sort_order | | NOT NULL | | Int | 정렬순서 |
| use_yn | | NOT NULL | | Check | 사용여부 |
| system_yn | | NOT NULL | | Check | 시스템코드여부 |
| remark | | NOT NULL | | Text | 비고 |
| parent_code | | NOT NULL | | Text | 상위코드 |
| level | | NOT NULL | | Int | 레벨 |
| valid_from | | NOT NULL | | Date | 유효시작일 |
| valid_to | | NOT NULL | | Date | 유효종료일 |
| cid | | NOT NULL | | Int | 생성자 |
| cdt | | NOT NULL | | Date | 생성일 |

## 3. BOM 정보 (DMB100)

| 필드명 | PK | NULL | FK | 데이터타입 | 설명 |
|--------|----|----|----|-----------|----|
| parent_item_id | PK | NOT NULL | | Int | 상위품목ID |
| item_seq | PK | NOT NULL | | Int | 품목순번 |
| component_id | PK | NOT NULL | | Int | 구성품목ID |
| quantity | | NOT NULL | | Decimal | 소요량 |
| loss_rate | | NOT NULL | | Decimal | 손실률 |
| effective_qty | | NOT NULL | | Decimal | 유효수량 |
| make_type | | NOT NULL | | Combo | 제조구분 |
| supply_type | | NOT NULL | | Combo | 공급구분 |
| item_type | | NOT NULL | | Combo | 품목유형 |
| cost_type | | NOT NULL | | Combo | 원가유형 |
| valid_from | | NOT NULL | | Date | 유효시작일 |
| valid_to | | NOT NULL | | Date | 유효종료일 |
| main_yn | | NOT NULL | | Check | 메인여부 |
| optional_yn | | NOT NULL | | Check | 선택여부 |
| remark | | NOT NULL | | Text | 비고 |
| description | | NOT NULL | | Text | 설명 |
| cid | | NOT NULL | | Int | 생성자 |
| cdt | | NOT NULL | | Date | 생성일 |
| mid | | NOT NULL | | Int | 수정자 |
| mdt | | NOT NULL | | Date | 수정일 |

## 4. 거래처정보 (BCV100)

| 필드명 | PK | NULL | FK | 데이터타입 | 설명 |
|--------|----|----|----|-----------|----|
| customer_code | PK | NOT NULL | | Text | 거래처코드 |
| customer_name | | NOT NULL | | Text | 거래처명 |
| customer_type | | NOT NULL | | Combo | 거래처유형 |
| business_type | | NOT NULL | | Combo | 업태 |
| business_category | | NOT NULL | | Combo | 업종 |
| ceo_name | | NOT NULL | | Text | 대표자명 |
| business_number | | NOT NULL | | Text | 사업자번호 |
| ceo_yn | | NOT NULL | | Check | 법인여부 |
| vat_type | | NOT NULL | | Combo | 부가세유형 |
| tax_type | | NOT NULL | | Combo | 과세유형 |
| zipcode | | NOT NULL | | Text | 우편번호 |
| address1 | | NOT NULL | | Text | 주소1 |
| address2 | | NOT NULL | | Text | 주소2 |
| tel_number | | NOT NULL | | Text | 전화번호 |
| fax_number | | NOT NULL | | Text | 팩스번호 |
| contact_person | | NOT NULL | | Text | 담당자 |
| contact_tel | | NOT NULL | | Text | 담당자연락처 |
| email | | NOT NULL | | Text | 이메일 |
| homepage | | NOT NULL | | Text | 홈페이지 |
| bank_name | | NOT NULL | | Combo | 은행명 |
| account_number | | NOT NULL | | Text | 계좌번호 |
| account_holder | | NOT NULL | | Text | 예금주 |
| credit_limit | | NOT NULL | | Decimal | 여신한도 |
| credit_term | | NOT NULL | | Int | 신용기간(일) |
| payment_term | | NOT NULL | | Combo | 결재조건 |
| currency | | NOT NULL | | Combo | 통화 |
| price_list | | NOT NULL | | Text | 가격표 |
| discount_rate | | NOT NULL | | Decimal | 할인율 |
| use_yn | | NOT NULL | | Check | 사용여부 |
| export_yn | | NOT NULL | | Check | 수출여부 |
| import_yn | | NOT NULL | | Check | 수입여부 |
| remark | | NOT NULL | | Text | 비고 |
| valid_from | | NOT NULL | | Date | 유효시작일 |
| valid_to | | NOT NULL | | Date | 유효종료일 |
| cid | | NOT NULL | | Int | 생성자 |
| cdt | | NOT NULL | | Date | 생성일 |
| mid | | NOT NULL | | Int | 수정자 |
| mdt | | NOT NULL | | Date | 수정일 |

## 5. 창고코드 (BCW100)

| 필드명 | PK | NULL | FK | 데이터타입 | 설명 |
|--------|----|----|----|-----------|----|
| warehouse_code | PK | NOT NULL | | Text | 창고코드 |
| warehouse_name | | NOT NULL | | Text | 창고명 |
| warehouse_type | | NOT NULL | | Check | 창고유형 |
| factory_yn | | NOT NULL | | Check | 공장창고여부 |
| outside_yn | | NOT NULL | | Check | 외부창고여부 |
| inspection_yn | | NOT NULL | | Check | 검사창고여부 |
| return_yn | | NOT NULL | | Check | 반품창고여부 |
| scrap_yn | | NOT NULL | | Check | 불량창고여부 |
| sample_yn | | NOT NULL | | Check | 샘플창고여부 |
| transit_yn | | NOT NULL | | Check | 이동창고여부 |
| cost_yn | | NOT NULL | | Check | 원가창고여부 |
| location_control | | NOT NULL | | Check | 로케이션관리여부 |
| remark | | NOT NULL | | Text | 비고 |
| address | | NOT NULL | | Text | 주소 |
| manager | | NOT NULL | | Text | 관리자 |
| tel_number | | NOT NULL | | Text | 전화번호 |
| capacity | | NOT NULL | | Int | 수용용량 |
| area | | NOT NULL | | Decimal | 면적 |
| valid_from | | NOT NULL | | Date | 유효시작일 |
| valid_to | | NOT NULL | | Date | 유효종료일 |
| cid | | NOT NULL | | Int | 생성자 |
| cdt | | NOT NULL | | Date | 생성일 |
| mid | | NOT NULL | | Int | 수정자 |
| mdt | | NOT NULL | | Date | 수정일 |

## 6. 전표정보 (FAB100)

| 필드명 | PK | NULL | FK | 데이터타입 | 설명 |
|--------|----|----|----|-----------|----|
| slip_no | PK | NULL | | Text | 전표번호 |
| slip_date | | NULL | | Date | 전표일자 |
| slip_type | | NOT NULL | | Combo | 전표유형 |
| slip_status | | NOT NULL | | Text | 전표상태 |
| account_dr | | NOT NULL | | Text | 차변계정 |
| account_cr | | NOT NULL | | Text | 대변계정 |
| description | | NULL | | Text | 적요 |
| amount_dr | | NOT NULL | | Int | 차변금액 |
| amount_cr | | NOT NULL | | Date | 대변금액 |
| created_by | | NOT NULL | | Text | 작성자 |
| created_date | | NOT NULL | | Date | 작성일 |
| approved_by | | NOT NULL | | Int | 승인자 |
| approved_date | | NOT NULL | | Date | 승인일 |
| posted_by | | NOT NULL | | Text | 전기자 |
| posted_date | | NOT NULL | | Combo | 전기일 |
| canceled_by | | NOT NULL | | Int | 취소자 |
| canceled_date | | NOT NULL | | Date | 취소일 |
| remark | | NOT NULL | | Text | 비고 |
| cid | | NOT NULL | | Int | 생성자 |
| cdt | | NOT NULL | | Date | 생성일 |
| mid | | NOT NULL | | Int | 수정자 |
| mdt | | NOT NULL | | Date | 수정일 |

## 7. 전표상세 (FAB200)

| 필드명 | PK | NULL | FK | 데이터타입 | 설명 |
|--------|----|----|----|-----------|----|
| slip_no | PK | NOT NULL | | Text | 전표번호 |
| line_no | PK | NOT NULL | | Int | 라인번호 |
| account_code | | NOT NULL | | Text | 계정코드 |
| account_name | | NULL | | Text | 계정명 |
| description | | NOT NULL | | Text | 적요 |
| debit_amount | | NOT NULL | | Decimal | 차변금액 |
| credit_amount | | NOT NULL | | Decimal | 대변금액 |
| dc_type | | NOT NULL | | Decimal | 차대구분 |
| cost_center | | NOT NULL | | Combo | 코스트센터 |
| department | | NOT NULL | | Decimal | 부서 |
| project | | NOT NULL | | Text | 프로젝트 |
| customer_code | | NOT NULL | | Text | 거래처코드 |
| item_code | | NOT NULL | | Int | 품목코드 |
| quantity | | NOT NULL | | Text | 수량 |
| unit_price | | NOT NULL | | Combo | 단가 |
| tax_rate | | NOT NULL | | Text | 세율 |
| tax_amount | | NOT NULL | | Decimal | 세액 |
| amount_included_tax | | NOT NULL | | Decimal | 세금포함금액 |
| remark | | NOT NULL | | Text | 비고 |
| cid | | NOT NULL | | Int | 생성자 |
| cdt | | NOT NULL | | Date | 생성일 |
| mid | | NOT NULL | | Int | 수정자 |
| mdt | | NOT NULL | | Date | 수정일 |

---

## 데이터타입 매핑

| SAP 데이터타입 | Django 필드타입 | 비고 |
|----------------|-----------------|------|
| Int | IntegerField | 정수 |
| Text | CharField(max_length=255) | 텍스트 |
| Decimal | DecimalField(max_digits=15, decimal_places=2) | 실수 |
| Date | DateField | 날짜 |
| Combo | CharField(max_length=50) | 콤보박스 |
| Check | BooleanField | 체크박스 |

## 공통 필드 규칙

1. **PK (Primary Key):** 각 테이블의 기본키
2. **cid (Created ID):** 생성자 ID (외래키 → User)
3. **cdt (Created Date):** 생성일자
4. **mid (Modified ID):** 수정자 ID (외래키 → User)
5. **mdt (Modified Date):** 수정일자
6. **valid_from:** 유효시작일 (데이터 시작일)
7. **valid_to:** 유효종료일 (데이터 종료일)
8. **use_yn:** 사용여부 (True/False)
9. **remark:** 비고 (TextField)

## Django 모델 생성 시 고려사항

1. **추상 기본 모델:** 공통 필드(c_id, c_dt, m_id, m_dt)는 추상 기본 모델로 정의
2. **소프트 삭제:** deleted_at 필드로 구현 (물리 삭제 대신)
3. **검색:** 검색을 위한 검색 벡터 필드 고려
4. **인덱스:** 자주 조회하는 필드에 인덱스 생성
5. **외래키:** User 모델로의 외래키 관계 설정

## 다음 단계

1. Django 모델 생성
2. Admin 인터페이스 구성
3. CRUD 뷰 및 템플릿 작성
4. URL 라우팅 설정

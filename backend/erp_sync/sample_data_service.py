"""
샘플 데이터 생성 서비스
모든 ERP 동기화 서비스가 비활성화되었을 때 사용할 샘플 데이터를 생성합니다.
"""

import random
from datetime import datetime, timedelta
from decimal import Decimal
from django.utils import timezone
from django.db import transaction


class ServiceManagerHelper:
    """ERPSyncServiceManager의 기능을 대체하는 헬퍼 클래스"""

    @staticmethod
    def get_all_services():
        """모든 서비스 설정 조회"""
        from erp_sync.models import ERPSyncServiceConfig
        services = {}
        for config in ERPSyncServiceConfig.objects.all():
            services[config.service_type] = config
        return services

    @staticmethod
    def get_service_config(service_type):
        """특정 서비스 타입의 설정 조회"""
        from erp_sync.models import ERPSyncServiceConfig
        try:
            return ERPSyncServiceConfig.objects.get(service_type=service_type)
        except ERPSyncServiceConfig.DoesNotExist:
            return None


class SampleDataGenerator:
    """샘플 데이터 생성기"""

    def __init__(self):
        self.customers = [
            {'code': 'C001', 'name': '삼성전자'},
            {'code': 'C002', 'name': 'LG전자'},
            {'code': 'C003', 'name': 'SK하이닉스'},
            {'code': 'C004', 'name': '포스코'},
            {'code': 'C005', 'name': '현대자동차'},
        ]

        self.products = [
            {'id': 1001, 'code': 'P001', 'name': '정밀부품A', 'unit': '개', 'price': Decimal('15000')},
            {'id': 1002, 'code': 'P002', 'name': '전자부품B', 'unit': '개', 'price': Decimal('25000')},
            {'id': 1003, 'code': 'P003', 'name': '자동차부품C', 'unit': '개', 'price': Decimal('35000')},
            {'id': 1004, 'code': 'P004', 'name': '반도체부품D', 'unit': '개', 'price': Decimal('45000')},
            {'id': 1005, 'code': 'P005', 'name': '정밀가공품E', 'unit': '개', 'price': Decimal('55000')},
        ]

        self.suppliers = [
            {'code': 'S001', 'name': '한국철강', 'grade': 'A'},
            {'code': 'S002', 'name': '대한금속', 'grade': 'B'},
            {'code': 'S003', 'name': '신성플라스틱', 'grade': 'A'},
            {'code': 'S004', 'name': '동양화학', 'grade': 'C'},
            {'code': 'S005', 'name': '국화산업', 'grade': 'B'},
        ]

        self.factories = [
            {'code': 'F001', 'name': '본동공장'},
            {'code': 'F002', 'name': '부산공장'},
            {'code': 'F003', 'name': '대전공장'},
        ]

        self.lines = [
            {'code': 'L01', 'name': '라인1'},
            {'code': 'L02', 'name': '라인2'},
            {'code': 'L03', 'name': '라인3'},
            {'code': 'L04', 'name': '라인4'},
        ]

    def generate_sales_data(self, start_date, end_date):
        """영업 샘플 데이터 생성"""
        from erp_sync.models import ERPSalesYearPlan

        current_date = start_date
        sales_data = []

        while current_date <= end_date:
            for customer in self.customers:
                for product in self.products:
                    if random.random() > 0.3:  # 70% 확률로 데이터 생성
                        plan_qty = random.randint(100, 5000)
                        plan_amt = plan_qty * product['price']

                        sales_data.append(ERPSalesYearPlan(
                            co_cd='01',
                            plan_year=current_date.year,
                            plan_rev=1,
                            fac_cd=random.choice(self.factories)['code'],
                            plan_mon=current_date.month,
                            cust_cd=customer['code'],
                            cust_nm=customer['name'],
                            itm_id=product['id'],
                            itm_cd=product['code'],
                            itm_nm=product['name'],
                            plan_qty=Decimal(str(plan_qty)),
                            plan_up=product['price'],
                            plan_amt=Decimal(str(plan_amt)),
                            erp_sync_at=timezone.now(),
                            erp_source_table='sample_data',
                            is_synced=True
                        ))
            current_date += timedelta(days=32)
            current_date = current_date.replace(day=1)

        return sales_data

    def generate_production_data(self, start_date, end_date):
        """생산 샘플 데이터 생성"""
        from erp_sync.models import ERPProductionResult, ERPShipmentPlan, ERPShipmentPlanItem

        production_data = []
        current_date = start_date

        while current_date <= end_date:
            for factory in self.factories:
                for line in self.lines:
                    for product in self.products:
                        if random.random() > 0.2:  # 80% 확률로 데이터 생성
                            plan_qty = random.randint(500, 3000)
                            prd_qty = random.randint(400, int(plan_qty * 1.1))
                            good_qty = int(prd_qty * random.uniform(0.95, 0.99))
                            bad_qty = prd_qty - good_qty

                            production_data.append(ERPProductionResult(
                                prd_dt=current_date,
                                fac_cd=factory['code'],
                                line_cd=line['code'],
                                equip_cd=f"{line['code']}_EQ01",
                                itm_id=product['id'],
                                itm_cd=product['code'],
                                itm_nm=product['name'],
                                plan_qty=Decimal(str(plan_qty)),
                                prd_qty=Decimal(str(prd_qty)),
                                good_qty=Decimal(str(good_qty)),
                                bad_qty=Decimal(str(bad_qty)),
                                counter_val=random.randint(1000, 5000),
                                erp_sync_at=timezone.now(),
                                erp_source_table='sample_data',
                                is_synced=True
                            ))

                            # 출하계획 데이터도 함께 생성
                            if random.random() > 0.5:
                                plan_no = f"PLAN{current_date.strftime('%Y%m%d')}{random.randint(1000, 9999)}"
                                shipment_plan = ERPShipmentPlan(
                                    plan_no=plan_no,
                                    dlv_dt=current_date + timedelta(days=random.randint(1, 7)),
                                    cust_cd=random.choice(self.customers)['code'],
                                    cust_nm=random.choice(self.customers)['name'],
                                    erp_sync_at=timezone.now(),
                                    erp_source_table='sample_data',
                                    is_synced=True
                                )
                                production_data.append(shipment_plan)

                                # 출하계획 품목
                                shipment_item = ERPShipmentPlanItem(
                                    plan_no=plan_no,
                                    plan_sq=1,
                                    itm_id=product['id'],
                                    itm_cd=product['code'],
                                    itm_nm=product['name'],
                                    plan_qty=Decimal(str(random.randint(100, 1000))),
                                    out_qty=Decimal('0'),
                                    rem_qty=Decimal(str(random.randint(100, 1000))),
                                    erp_sync_at=timezone.now(),
                                    erp_source_table='sample_data',
                                    is_synced=True
                                )
                                production_data.append(shipment_item)

            current_date += timedelta(days=1)

        return production_data

    def generate_quality_data(self, start_date, end_date):
        """품질 샘플 데이터 생성"""
        from erp_sync.models import (
            ERPShipmentInspection, ERPShipmentDefect,
            ERPQualityItem, ERPSPC
        )

        quality_data = []
        current_date = start_date

        # 품목 품질 정보
        for product in self.products:
            quality_data.append(ERPQualityItem(
                itm_id=product['id'],
                itm_cd=product['code'],
                itm_nm=product['name'],
                itm_spec=f'{product["name"]} 규격',
                itm_unit=product['unit'],
                qc_bc='정기검사',
                use_yn='Y',
                erp_sync_at=timezone.now(),
                erp_source_table='sample_data',
                is_synced=True
            ))

        # 검사 데이터
        while current_date <= end_date:
            for factory in self.factories:
                for product in self.products:
                    if random.random() > 0.7:  # 30% 확률로 검사 데이터 생성
                        qc_no = f"QC{current_date.strftime('%Y%m%d')}{random.randint(1000, 9999)}"
                        qc_qty = random.randint(50, 500)
                        pass_qty = int(qc_qty * random.uniform(0.95, 0.99))
                        fail_qty = qc_qty - pass_qty

                        inspection = ERPShipmentInspection(
                            qc_no=qc_no,
                            qc_dt=current_date,
                            fac_cd=factory['code'],
                            cust_cd=random.choice(self.customers)['code'],
                            cust_nm=random.choice(self.customers)['name'],
                            itm_id=product['id'],
                            itm_cd=product['code'],
                            itm_nm=product['name'],
                            lot_no=f"LOT{current_date.strftime('%Y%m%d')}{random.randint(100, 999)}",
                            qc_qty=Decimal(str(qc_qty)),
                            pass_qty=Decimal(str(pass_qty)),
                            fail_qty=Decimal(str(fail_qty)),
                            qc_result='PASS' if fail_qty == 0 else 'FAIL',
                            inspector=f'검사자{random.randint(1, 5)}',
                            erp_sync_at=timezone.now(),
                            erp_source_table='sample_data',
                            is_synced=True
                        )
                        quality_data.append(inspection)

                        # 불량 데이터
                        if fail_qty > 0:
                            defect_types = ['치수불량', '외관불량', '기능불량', '용접불량', '도장불량']
                            defect = ERPShipmentDefect(
                                qc_no=qc_no,
                                defect_sq=1,
                                defect_cd=random.choice(['D01', 'D02', 'D03', 'D04', 'D05']),
                                defect_nm=random.choice(defect_types),
                                defect_qty=Decimal(str(fail_qty)),
                                defect_rt=Decimal(str(round(fail_qty / qc_qty * 100, 2))),
                                erp_sync_at=timezone.now(),
                                erp_source_table='sample_data',
                                is_synced=True
                            )
                            quality_data.append(defect)

                        # SPC 데이터
                        if random.random() > 0.8:
                            usl = Decimal(str(random.uniform(10.5, 11.0))).quantize(Decimal('0.001'))
                            lsl = Decimal(str(random.uniform(9.0, 9.5))).quantize(Decimal('0.001'))
                            avg_val = Decimal(str(random.uniform(9.8, 10.2))).quantize(Decimal('0.001'))
                            std_val = Decimal(str(random.uniform(0.1, 0.3))).quantize(Decimal('0.001'))

                            # Cpk 계산
                            spec_range = usl - lsl
                            if std_val > 0:
                                cpk = min((usl - avg_val), (avg_val - lsl)) / (3 * std_val)
                                cpk = Decimal(str(min(float(cpk), 3.0))).quantize(Decimal('0.01'))
                            else:
                                cpk = Decimal('3.00')

                            spc = ERPSPC(
                                spc_dt=current_date,
                                fac_cd=factory['code'],
                                proc_cd=f"P{random.randint(100, 999)}",
                                proc_nm=f"{random.choice(['절단', '가공', '용접', '조립', '도장'])}공정",
                                itm_id=product['id'],
                                spec_nm=f"{product['name']} 규格",
                                usl=usl,
                                lsl=lsl,
                                avg_val=avg_val,
                                std_val=std_val,
                                cp=Decimal(str(float((usl - lsl) / (6 * std_val)) if std_val > 0 else 3.0)).quantize(Decimal('0.01')),
                                cpk=cpk,
                                erp_sync_at=timezone.now(),
                                erp_source_table='sample_data',
                                is_synced=True
                            )
                            quality_data.append(spc)

            current_date += timedelta(days=1)

        return quality_data

    def generate_purchase_data(self, start_date, end_date):
        """구매/자재 샘플 데이터 생성"""
        from erp_sync.models import (
            ERPBarcodeDelivery, ERPMaterialPlan,
            ERPLocation, ERPLocationStock, ERPSupplier
        )

        purchase_data = []

        # 공급업체
        for supplier in self.suppliers:
            purchase_data.append(ERPSupplier(
                sply_cd=supplier['code'],
                sply_nm=supplier['name'],
                biz_no=f'{random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(10000, 99999)}',
                ceo_nm=f'{supplier["name"][:2]}대표',
                addr=f'{random.choice(["서울", "부산", "대구", "인천"])}시 {random.choice(["강남구", "서초구", "해운대구"])}',
                tel_no=f'02-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}',
                email=f'info@{supplier["name"]}.co.kr',
                sply_type='제조사',
                grade=supplier['grade'],
                use_yn='Y',
                erp_sync_at=timezone.now(),
                erp_source_table='sample_data',
                is_synced=True
            ))

        # 로케이션
        locations = []
        for i in range(1, 21):
            loc_cd = f"LOC{i:03d}"
            locations.append({
                'code': loc_cd,
                'name': f'로케이션{i}',
                'warehouse': f'WH{random.randint(1, 3):02d}',
                'zone': f'Z{random.randint(1, 5)}'
            })
            purchase_data.append(ERPLocation(
                loc_cd=loc_cd,
                loc_nm=f'로케이션{i}',
                fac_cd=random.choice(self.factories)['code'],
                wh_cd=f'WH{random.randint(1, 3):02d}',
                zone_cd=f'Z{random.randint(1, 5)}',
                row_no=str(random.randint(1, 10)),
                col_no=str(random.randint(1, 10)),
                use_yn='Y',
                erp_sync_at=timezone.now(),
                erp_source_table='sample_data',
                is_synced=True
            ))

        # 자재 계획 및 재고 데이터
        current_date = start_date
        while current_date <= end_date:
            # 자재 소요 계획
            for product in self.products:
                if random.random() > 0.5:
                    plan_id = f"MP{current_date.strftime('%Y%m')}{product['code']}{random.randint(100, 999)}"
                    req_qty = random.randint(1000, 10000)

                    purchase_data.append(ERPMaterialPlan(
                        plan_id=int(plan_id.replace('MP', '').replace('P', '').replace('M', '')),
                        plan_year=current_date.year,
                        plan_mon=current_date.month,
                        itm_id=product['id'],
                        itm_cd=product['code'],
                        itm_nm=product['name'],
                        req_qty=Decimal(str(req_qty)),
                        unit_price=product['price'],
                        req_amt=Decimal(str(req_qty * product['price'])),
                        erp_sync_at=timezone.now(),
                        erp_source_table='sample_data',
                        is_synced=True
                    ))

            # 바코드 납품 및 재고
            for supplier in self.suppliers:
                for product in self.products:
                    if random.random() > 0.6:
                        bar_id = random.randint(100000, 999999)
                        bar_no = f"BAR{current_date.strftime('%Y%m%d')}{bar_id}"
                        dlv_qty = random.randint(100, 2000)

                        purchase_data.append(ERPBarcodeDelivery(
                            bar_id=bar_id,
                            bar_no=bar_no,
                            cust_cd=supplier['code'],
                            cust_nm=supplier['name'],
                            fac_cd=random.choice(self.factories)['code'],
                            wh_cd=f'WH{random.randint(1, 3):02d}',
                            itm_id=product['id'],
                            itm_cd=product['code'],
                            itm_nm=product['name'],
                            dlv_dt=current_date,
                            mng_no=f"LOT{current_date.strftime('%Y%m%d')}{random.randint(1000, 9999)}",
                            dlv_qty=Decimal(str(dlv_qty)),
                            dlv_bc='N',
                            erp_sync_at=timezone.now(),
                            erp_source_table='sample_data',
                            is_synced=True
                        ))

                        # 로케이션 재고
                        for location in random.sample(locations, min(3, len(locations))):
                            if random.random() > 0.5:
                                purchase_data.append(ERPLocationStock(
                                    loc_cd=location['code'],
                                    itm_id=product['id'],
                                    itm_cd=product['code'],
                                    itm_nm=product['name'],
                                    lot_no=f"LOT{current_date.strftime('%Y%m%d')}{random.randint(1000, 9999)}",
                                    stk_qty=Decimal(str(random.randint(50, 500))),
                                    stk_dt=current_date,
                                    erp_sync_at=timezone.now(),
                                    erp_source_table='sample_data',
                                    is_synced=True
                                ))

            current_date += timedelta(days=1)

        return purchase_data

    def generate_financial_data(self, start_date, end_date):
        """재무 샘플 데이터 생성"""
        from erp_sync.models import (
            ERPAccountLedger, ERPWorkInProcess,
            ERPProductLedger
        )

        financial_data = []
        current_date = start_date

        # 계정과목
        accounts = [
            {'code': '1100', 'name': '유동자산'},
            {'code': '1200', 'name': '비유동자산'},
            {'code': '2100', 'name': '유동부채'},
            {'code': '2200', 'name': '비유동부채'},
            {'code': '3100', 'name': '자본금'},
            {'code': '4100', 'name': '매출액'},
            {'code': '5100', 'name': '매출원가'},
            {'code': '6100', 'name': '판관비'},
            {'code': '7100', 'name': '영업외비용'},
        ]

        while current_date <= end_date:
            # 계정원장
            for account in accounts:
                dr_amt = Decimal(str(random.randint(1000000, 50000000))) if account['code'] in ['1100', '1200', '5100', '6100'] else Decimal('0')
                cr_amt = Decimal(str(random.randint(1000000, 50000000))) if account['code'] in ['2100', '2200', '3100', '4100'] else Decimal('0')

                financial_data.append(ERPAccountLedger(
                    ledger_id=random.randint(100000, 999999),
                    fiscal_year=current_date.year,
                    fiscal_month=current_date.month,
                    acct_cd=account['code'],
                    acct_nm=account['name'],
                    dr_amt=dr_amt,
                    cr_amt=cr_amt,
                    balance=dr_amt - cr_amt if dr_amt > cr_amt else cr_amt - dr_amt,
                    erp_sync_at=timezone.now(),
                    erp_source_table='sample_data',
                    is_synced=True
                ))

            # 재공품 명세서
            for product in self.products:
                wip_amt = Decimal(str(random.randint(1000000, 10000000)))

                financial_data.append(ERPWorkInProcess(
                    wip_id=random.randint(10000, 99999),
                    fiscal_year=current_date.year,
                    fiscal_month=current_date.month,
                    fac_cd=random.choice(self.factories)['code'],
                    itm_id=product['id'],
                    itm_cd=product['code'],
                    itm_nm=product['name'],
                    wip_qty=Decimal(str(random.randint(100, 1000))),
                    wip_amt=wip_amt,
                    mat_amt=wip_amt * Decimal('0.5'),
                    labor_amt=wip_amt * Decimal('0.3'),
                    exp_amt=wip_amt * Decimal('0.2'),
                    erp_sync_at=timezone.now(),
                    erp_source_table='sample_data',
                    is_synced=True
                ))

            # 제품 수불부
            for product in self.products:
                in_qty = Decimal(str(random.randint(1000, 5000)))
                out_qty = Decimal(str(random.randint(800, 4500)))
                end_qty = in_qty - out_qty + Decimal(str(random.randint(100, 500)))

                financial_data.append(ERPProductLedger(
                    ledger_id=random.randint(100000, 999999),
                    fiscal_year=current_date.year,
                    fiscal_month=current_date.month,
                    fac_cd=random.choice(self.factories)['code'],
                    itm_id=product['id'],
                    itm_cd=product['code'],
                    itm_nm=product['name'],
                    prev_qty=Decimal(str(random.randint(200, 800))),
                    prev_amt=Decimal(str(random.randint(1000000, 5000000))),
                    in_qty=in_qty,
                    in_amt=in_qty * product['price'],
                    out_qty=out_qty,
                    out_amt=out_qty * product['price'],
                    end_qty=end_qty,
                    end_amt=end_qty * product['price'],
                    erp_sync_at=timezone.now(),
                    erp_source_table='sample_data',
                    is_synced=True
                ))

            current_date += timedelta(days=32)
            current_date = current_date.replace(day=1)

        return financial_data

    @transaction.atomic
    def generate_all_sample_data(self, days=90):
        """전체 샘플 데이터 생성 (기본 90일)"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)

        all_data = []

        # 기존 샘플 데이터 삭제
        from erp_sync.models import (
            ERPSalesYearPlan, ERPProductionResult, ERPShipmentPlan,
            ERPShipmentPlanItem, ERPShipmentInspection, ERPShipmentDefect,
            ERPQualityItem, ERPSPC, ERPBarcodeDelivery, ERPMaterialPlan,
            ERPLocation, ERPLocationStock, ERPSupplier, ERPAccountLedger,
            ERPWorkInProcess, ERPProductLedger
        )

        # 샘플 데이터로 생성된 데이터 삭제
        models_to_clear = [
            ERPSalesYearPlan, ERPProductionResult, ERPShipmentPlan,
            ERPShipmentPlanItem, ERPShipmentInspection, ERPShipmentDefect,
            ERPQualityItem, ERPSPC, ERPBarcodeDelivery, ERPMaterialPlan,
            ERPLocation, ERPLocationStock, ERPSupplier, ERPAccountLedger,
            ERPWorkInProcess, ERPProductLedger
        ]

        for model in models_to_clear:
            model.objects.filter(erp_source_table='sample_data').delete()

        # 각 카테고리별 데이터 생성
        all_data.extend(self.generate_sales_data(start_date, end_date))
        all_data.extend(self.generate_production_data(start_date, end_date))
        all_data.extend(self.generate_quality_data(start_date, end_date))
        all_data.extend(self.generate_purchase_data(start_date, end_date))
        all_data.extend(self.generate_financial_data(start_date, end_date))

        # 일괄 저장
        for model in models_to_clear:
            model.objects.bulk_create([item for item in all_data if isinstance(item, model)])

        return {
            'success': True,
            'message': f'샘플 데이터가 생성되었습니다.',
            'data_count': len(all_data),
            'period': f'{start_date} ~ {end_date}',
            'details': {
                'sales': sum(1 for item in all_data if isinstance(item, (ERPSalesYearPlan,))),
                'production': sum(1 for item in all_data if isinstance(item, (ERPProductionResult, ERPShipmentPlan, ERPShipmentPlanItem))),
                'quality': sum(1 for item in all_data if isinstance(item, (ERPShipmentInspection, ERPShipmentDefect, ERPQualityItem, ERPSPC))),
                'purchase': sum(1 for item in all_data if isinstance(item, (ERPBarcodeDelivery, ERPMaterialPlan, ERPLocation, ERPLocationStock, ERPSupplier))),
                'financial': sum(1 for item in all_data if isinstance(item, (ERPAccountLedger, ERPWorkInProcess, ERPProductLedger))),
            }
        }


class SampleDataService:
    """샘플 데이터 서비스"""

    def __init__(self):
        self.generator = SampleDataGenerator()

    def is_all_services_disabled(self):
        """모든 ERP 서비스가 비활성화되어 있는지 확인"""
        all_services = ServiceManagerHelper.get_all_services()
        # sap, fom 서비스만 확인 (sample 서비스 제외)
        erp_services = {k: v for k, v in all_services.items() if k in ['sap', 'fom']}
        return all(not service.is_enabled for service in erp_services.values())

    def activate_sample_service(self):
        """샘플 데이터 서비스 활성화"""
        config = ServiceManagerHelper.get_service_config('sample')
        if not config.is_enabled:
            config.is_enabled = True
            config.sync_status = 'idle'
            config.save()

        return config

    def generate_sample_data(self, days=90):
        """샘플 데이터 생성"""
        result = self.generator.generate_all_sample_data(days)

        # 샘플 서비스 활성화
        self.activate_sample_service()

        # 샘플 서비스 동기화 상태 업데이트
        config = ServiceManagerHelper.get_service_config('sample')
        config.update_sync_status('idle')
        config.increment_sync_count(success=True)

        return result

    def get_sample_data_status(self):
        """샘플 데이터 상태 조회"""
        config = ServiceManagerHelper.get_service_config('sample')

        # 샘플 데이터 개수 조회
        sample_data_count = {
            'sales': 0,
            'production': 0,
            'quality': 0,
            'purchase': 0,
            'financial': 0,
            'total': 0
        }

        from erp_sync.models import (
            ERPSalesYearPlan, ERPProductionResult, ERPShipmentInspection,
            ERPBarcodeDelivery, ERPAccountLedger
        )

        sample_data_count['sales'] = ERPSalesYearPlan.objects.filter(erp_source_table='sample_data').count()
        sample_data_count['production'] = ERPProductionResult.objects.filter(erp_source_table='sample_data').count()
        sample_data_count['quality'] = ERPShipmentInspection.objects.filter(erp_source_table='sample_data').count()
        sample_data_count['purchase'] = ERPBarcodeDelivery.objects.filter(erp_source_table='sample_data').count()
        sample_data_count['financial'] = ERPAccountLedger.objects.filter(erp_source_table='sample_data').count()
        sample_data_count['total'] = sum(sample_data_count.values())

        return {
            'is_enabled': config.is_enabled,
            'sync_status': config.sync_status,
            'last_sync_at': config.last_sync_at,
            'data_count': sample_data_count,
            'can_generate': self.is_all_services_disabled()
        }

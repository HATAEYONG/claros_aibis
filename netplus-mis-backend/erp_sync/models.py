"""
EMAX ERP 연동 모델 정의
유한산업 EMAX ERP 테이블과 MIS Dashboard 간의 데이터 동기화를 위한 모델
"""

from django.db import models
from django.utils import timezone


# ============================================================
# 공통 추상 모델
# ============================================================

class ERPBaseModel(models.Model):
    """ERP 연동 공통 필드"""
    erp_sync_at = models.DateTimeField('ERP 동기화 시간', null=True, blank=True)
    erp_source_table = models.CharField('ERP 원본 테이블', max_length=50, blank=True)
    erp_source_id = models.CharField('ERP 원본 ID', max_length=100, blank=True)
    is_synced = models.BooleanField('동기화 여부', default=False)
    sync_error = models.TextField('동기화 오류', blank=True)

    # EMAX 공통 필드
    bs_cd = models.CharField('사업장코드', max_length=10, blank=True)
    co_cd = models.CharField('회사코드', max_length=10, blank=True)
    cid = models.IntegerField('생성자ID', null=True, blank=True)
    cdt = models.DateTimeField('생성일시', null=True, blank=True)
    mid = models.IntegerField('수정자ID', null=True, blank=True)
    mdt = models.DateTimeField('수정일시', null=True, blank=True)

    class Meta:
        abstract = True


# ============================================================
# 영업 관련 ERP 연동 테이블
# ============================================================

class ERPSalesYearPlan(ERPBaseModel):
    """
    SDY100_YH: 년제품판매계획정보
    MIS 매핑: Sales.MonthlySales
    """
    plan_year = models.IntegerField('계획년도')
    plan_rev = models.IntegerField('계획차수', default=1)
    fac_cd = models.CharField('공장코드', max_length=10)
    plan_mon = models.IntegerField('계획월')
    cust_cd = models.CharField('거래처코드', max_length=20)
    cust_nm = models.CharField('거래처명', max_length=100, blank=True)
    itm_id = models.IntegerField('품목ID')
    itm_cd = models.CharField('품목코드', max_length=50, blank=True)
    itm_nm = models.CharField('품목명', max_length=200, blank=True)
    plan_qty = models.DecimalField('계획수량', max_digits=18, decimal_places=4, default=0)
    plan_up = models.DecimalField('계획단가', max_digits=18, decimal_places=4, default=0)
    plan_amt = models.DecimalField('계획금액', max_digits=18, decimal_places=2, default=0)

    class Meta:
        db_table = 'erp_sdy100_yh'
        verbose_name = 'ERP 년제품판매계획'
        verbose_name_plural = 'ERP 년제품판매계획'
        unique_together = ['co_cd', 'plan_year', 'plan_rev', 'fac_cd', 'plan_mon', 'cust_cd', 'itm_id']

    def __str__(self):
        return f'{self.plan_year}-{self.plan_mon} {self.cust_nm} {self.itm_nm}'


class ERPShipmentPlan(ERPBaseModel):
    """
    SDA500_YH: 일일출하계획서
    MIS 매핑: Production.WorkOrder
    """
    plan_no = models.CharField('계획번호', max_length=20, primary_key=True)
    dlv_dt = models.DateField('납품일자')
    cust_cd = models.CharField('거래처코드', max_length=20)
    cust_nm = models.CharField('거래처명', max_length=100, blank=True)
    sply_cd = models.CharField('공급처코드', max_length=20, blank=True)
    rmks = models.TextField('비고', blank=True)

    class Meta:
        db_table = 'erp_sda500_yh'
        verbose_name = 'ERP 일일출하계획'
        verbose_name_plural = 'ERP 일일출하계획'

    def __str__(self):
        return f'{self.plan_no} - {self.dlv_dt}'


class ERPShipmentPlanItem(ERPBaseModel):
    """
    SDA510_YH: 일일출하계획 품목
    MIS 매핑: Production.WorkOrder (상세)
    """
    plan_no = models.CharField('계획번호', max_length=20)
    plan_sq = models.IntegerField('계획순번')
    itm_id = models.IntegerField('품목ID')
    itm_cd = models.CharField('품목코드', max_length=50, blank=True)
    itm_nm = models.CharField('품목명', max_length=200, blank=True)
    plan_qty = models.DecimalField('계획수량', max_digits=18, decimal_places=4, default=0)
    out_qty = models.DecimalField('출고수량', max_digits=18, decimal_places=4, default=0)
    rem_qty = models.DecimalField('잔량', max_digits=18, decimal_places=4, default=0)
    so_no = models.CharField('수주번호', max_length=20, blank=True)
    so_sq = models.IntegerField('수주순번', null=True, blank=True)
    qc_yn = models.CharField('검사여부', max_length=1, blank=True)
    qc_bc = models.CharField('검사구분', max_length=10, blank=True)

    class Meta:
        db_table = 'erp_sda510_yh'
        verbose_name = 'ERP 출하계획품목'
        verbose_name_plural = 'ERP 출하계획품목'
        unique_together = ['plan_no', 'plan_sq']

    def __str__(self):
        return f'{self.plan_no}-{self.plan_sq} {self.itm_nm}'


class ERPDeliveryHistory(ERPBaseModel):
    """
    SDB150_DLV: 납기이력관리
    MIS 매핑: 납기 추적
    """
    so_no = models.CharField('수주번호', max_length=20)
    so_sq = models.IntegerField('수주순번')
    sq_no = models.IntegerField('이력순번')
    dlv_dt = models.DateField('납기일자')
    rmks = models.TextField('비고', blank=True)

    class Meta:
        db_table = 'erp_sdb150_dlv'
        verbose_name = 'ERP 납기이력'
        verbose_name_plural = 'ERP 납기이력'
        unique_together = ['so_no', 'so_sq', 'sq_no']

    def __str__(self):
        return f'{self.so_no}-{self.so_sq} ({self.dlv_dt})'


# ============================================================
# 생산 관련 ERP 연동 테이블
# ============================================================

class ERPBOM(ERPBaseModel):
    """
    DMB110_yuhan: BOM
    MIS 매핑: 제품구성
    """
    bom_id = models.AutoField(primary_key=True)
    parent_itm_id = models.IntegerField('상위품목ID')
    parent_itm_cd = models.CharField('상위품목코드', max_length=50, blank=True)
    parent_itm_nm = models.CharField('상위품목명', max_length=200, blank=True)
    child_itm_id = models.IntegerField('하위품목ID')
    child_itm_cd = models.CharField('하위품목코드', max_length=50, blank=True)
    child_itm_nm = models.CharField('하위품목명', max_length=200, blank=True)
    bom_qty = models.DecimalField('소요수량', max_digits=18, decimal_places=6, default=0)
    loss_rt = models.DecimalField('손실율', max_digits=8, decimal_places=4, default=0)
    bom_level = models.IntegerField('BOM레벨', default=1)

    class Meta:
        db_table = 'erp_dmb110_yuhan'
        verbose_name = 'ERP BOM'
        verbose_name_plural = 'ERP BOM'

    def __str__(self):
        return f'{self.parent_itm_nm} -> {self.child_itm_nm}'


class ERPMRP(ERPBaseModel):
    """
    MRP100_yh: 자재소요계산
    MIS 매핑: 생산계획
    """
    mrp_id = models.AutoField(primary_key=True)
    mrp_no = models.CharField('MRP번호', max_length=20)
    mrp_dt = models.DateField('계산일자')
    fac_cd = models.CharField('공장코드', max_length=10)
    plan_fr_dt = models.DateField('계획시작일')
    plan_to_dt = models.DateField('계획종료일')
    status = models.CharField('상태', max_length=10, blank=True)

    class Meta:
        db_table = 'erp_mrp100_yh'
        verbose_name = 'ERP 자재소요계산'
        verbose_name_plural = 'ERP 자재소요계산'

    def __str__(self):
        return f'{self.mrp_no} ({self.mrp_dt})'


class ERPMRPMaterial(ERPBaseModel):
    """
    MRP110_yh: 자재소요계산 - 원자재 소요량
    MIS 매핑: 자재소요
    """
    mrp_id = models.IntegerField('MRP ID')
    mrp_sq = models.IntegerField('순번')
    itm_id = models.IntegerField('품목ID')
    itm_cd = models.CharField('품목코드', max_length=50, blank=True)
    itm_nm = models.CharField('품목명', max_length=200, blank=True)
    req_qty = models.DecimalField('소요수량', max_digits=18, decimal_places=4, default=0)
    stk_qty = models.DecimalField('재고수량', max_digits=18, decimal_places=4, default=0)
    ord_qty = models.DecimalField('발주수량', max_digits=18, decimal_places=4, default=0)
    net_qty = models.DecimalField('순소요량', max_digits=18, decimal_places=4, default=0)

    class Meta:
        db_table = 'erp_mrp110_yh'
        verbose_name = 'ERP 원자재소요량'
        verbose_name_plural = 'ERP 원자재소요량'
        unique_together = ['mrp_id', 'mrp_sq']

    def __str__(self):
        return f'MRP-{self.mrp_id} {self.itm_nm}'


class ERPProductionResult(ERPBaseModel):
    """
    ppc100_counter: 생산실적-절단기카운터정보
    MIS 매핑: Production.DailyProduction
    """
    prd_id = models.AutoField(primary_key=True)
    prd_dt = models.DateField('생산일자')
    fac_cd = models.CharField('공장코드', max_length=10)
    line_cd = models.CharField('라인코드', max_length=20)
    equip_cd = models.CharField('설비코드', max_length=20, blank=True)
    itm_id = models.IntegerField('품목ID')
    itm_cd = models.CharField('품목코드', max_length=50, blank=True)
    itm_nm = models.CharField('품목명', max_length=200, blank=True)
    plan_qty = models.DecimalField('계획수량', max_digits=18, decimal_places=4, default=0)
    prd_qty = models.DecimalField('생산수량', max_digits=18, decimal_places=4, default=0)
    good_qty = models.DecimalField('양품수량', max_digits=18, decimal_places=4, default=0)
    bad_qty = models.DecimalField('불량수량', max_digits=18, decimal_places=4, default=0)
    counter_val = models.IntegerField('카운터값', default=0)

    class Meta:
        db_table = 'erp_ppc100_counter'
        verbose_name = 'ERP 생산실적'
        verbose_name_plural = 'ERP 생산실적'

    def __str__(self):
        return f'{self.prd_dt} {self.line_cd} {self.itm_nm}'


class ERPMESData(ERPBaseModel):
    """
    MESTagValue_YH: MES통신접점데이터
    MIS 매핑: 설비 모니터링
    """
    tag_id = models.AutoField(primary_key=True)
    tag_dt = models.DateTimeField('수집일시')
    equip_cd = models.CharField('설비코드', max_length=20)
    tag_nm = models.CharField('태그명', max_length=50)
    tag_val = models.CharField('태그값', max_length=100)
    tag_unit = models.CharField('단위', max_length=20, blank=True)

    class Meta:
        db_table = 'erp_mes_tagvalue_yh'
        verbose_name = 'ERP MES 데이터'
        verbose_name_plural = 'ERP MES 데이터'

    def __str__(self):
        return f'{self.equip_cd} {self.tag_nm}: {self.tag_val}'


# ============================================================
# 품질 관련 ERP 연동 테이블
# ============================================================

class ERPQualityItem(ERPBaseModel):
    """
    QDA100_yuhan: 품질 ITEM LIST
    MIS 매핑: 품목 마스터
    """
    itm_id = models.IntegerField('품목ID', primary_key=True)
    itm_cd = models.CharField('품목코드', max_length=50)
    itm_nm = models.CharField('품목명', max_length=200)
    itm_spec = models.CharField('규격', max_length=200, blank=True)
    itm_unit = models.CharField('단위', max_length=10, blank=True)
    cust_cd = models.CharField('고객코드', max_length=20, blank=True)
    cust_nm = models.CharField('고객명', max_length=100, blank=True)
    qc_bc = models.CharField('검사구분', max_length=10, blank=True)
    use_yn = models.CharField('사용여부', max_length=1, default='Y')

    class Meta:
        db_table = 'erp_qda100_yuhan'
        verbose_name = 'ERP 품질품목'
        verbose_name_plural = 'ERP 품질품목'

    def __str__(self):
        return f'{self.itm_cd} - {self.itm_nm}'


class ERPShipmentInspection(ERPBaseModel):
    """
    QMO100: 출하검사정보
    MIS 매핑: Quality.QualityInspection
    """
    qc_no = models.CharField('검사번호', max_length=20, primary_key=True)
    qc_dt = models.DateField('검사일자')
    fac_cd = models.CharField('공장코드', max_length=10)
    cust_cd = models.CharField('거래처코드', max_length=20, blank=True)
    cust_nm = models.CharField('거래처명', max_length=100, blank=True)
    itm_id = models.IntegerField('품목ID')
    itm_cd = models.CharField('품목코드', max_length=50, blank=True)
    itm_nm = models.CharField('품목명', max_length=200, blank=True)
    lot_no = models.CharField('LOT번호', max_length=50, blank=True)
    qc_qty = models.DecimalField('검사수량', max_digits=18, decimal_places=4, default=0)
    pass_qty = models.DecimalField('합격수량', max_digits=18, decimal_places=4, default=0)
    fail_qty = models.DecimalField('불합격수량', max_digits=18, decimal_places=4, default=0)
    qc_result = models.CharField('검사결과', max_length=10, blank=True)
    inspector = models.CharField('검사자', max_length=50, blank=True)

    class Meta:
        db_table = 'erp_qmo100'
        verbose_name = 'ERP 출하검사'
        verbose_name_plural = 'ERP 출하검사'

    def __str__(self):
        return f'{self.qc_no} - {self.itm_nm} ({self.qc_result})'


class ERPShipmentDefect(ERPBaseModel):
    """
    QMO110: 출하검사불량
    MIS 매핑: Quality.DefectRecord
    """
    qc_no = models.CharField('검사번호', max_length=20)
    defect_sq = models.IntegerField('불량순번')
    defect_cd = models.CharField('불량코드', max_length=20)
    defect_nm = models.CharField('불량명', max_length=100, blank=True)
    defect_qty = models.DecimalField('불량수량', max_digits=18, decimal_places=4, default=0)
    defect_rt = models.DecimalField('불량율', max_digits=8, decimal_places=4, default=0)
    rmks = models.TextField('비고', blank=True)

    class Meta:
        db_table = 'erp_qmo110'
        verbose_name = 'ERP 출하검사불량'
        verbose_name_plural = 'ERP 출하검사불량'
        unique_together = ['qc_no', 'defect_sq']

    def __str__(self):
        return f'{self.qc_no} - {self.defect_nm}'


class ERPSupplier(ERPBaseModel):
    """
    QMM600: 공급업체대장
    MIS 매핑: 협력사 관리
    """
    sply_cd = models.CharField('공급업체코드', max_length=20, primary_key=True)
    sply_nm = models.CharField('공급업체명', max_length=100)
    biz_no = models.CharField('사업자번호', max_length=20, blank=True)
    ceo_nm = models.CharField('대표자', max_length=50, blank=True)
    addr = models.CharField('주소', max_length=200, blank=True)
    tel_no = models.CharField('전화번호', max_length=20, blank=True)
    email = models.EmailField('이메일', blank=True)
    sply_type = models.CharField('업체구분', max_length=20, blank=True)
    grade = models.CharField('등급', max_length=10, blank=True)
    use_yn = models.CharField('사용여부', max_length=1, default='Y')

    class Meta:
        db_table = 'erp_qmm600'
        verbose_name = 'ERP 공급업체'
        verbose_name_plural = 'ERP 공급업체'

    def __str__(self):
        return f'{self.sply_cd} - {self.sply_nm}'


class ERPSupplierEvaluation(ERPBaseModel):
    """
    QMM630: 공급업체평가
    MIS 매핑: 협력사 평가
    """
    eval_id = models.AutoField(primary_key=True)
    sply_cd = models.CharField('공급업체코드', max_length=20)
    eval_year = models.IntegerField('평가년도')
    eval_term = models.CharField('평가기간', max_length=10, blank=True)
    quality_score = models.DecimalField('품질점수', max_digits=5, decimal_places=2, default=0)
    delivery_score = models.DecimalField('납기점수', max_digits=5, decimal_places=2, default=0)
    price_score = models.DecimalField('가격점수', max_digits=5, decimal_places=2, default=0)
    service_score = models.DecimalField('서비스점수', max_digits=5, decimal_places=2, default=0)
    total_score = models.DecimalField('총점', max_digits=5, decimal_places=2, default=0)
    grade = models.CharField('등급', max_length=10, blank=True)

    class Meta:
        db_table = 'erp_qmm630'
        verbose_name = 'ERP 공급업체평가'
        verbose_name_plural = 'ERP 공급업체평가'

    def __str__(self):
        return f'{self.sply_cd} {self.eval_year} - {self.grade}'


class ERPSPC(ERPBaseModel):
    """
    QPM100_YH: SPC자료집계 MASTER
    MIS 매핑: Quality.ProcessCapability
    """
    spc_id = models.AutoField(primary_key=True)
    spc_dt = models.DateField('집계일자')
    fac_cd = models.CharField('공장코드', max_length=10)
    proc_cd = models.CharField('공정코드', max_length=20)
    proc_nm = models.CharField('공정명', max_length=100, blank=True)
    itm_id = models.IntegerField('품목ID', null=True, blank=True)
    spec_nm = models.CharField('규격명', max_length=100, blank=True)
    usl = models.DecimalField('상한', max_digits=18, decimal_places=6, null=True, blank=True)
    lsl = models.DecimalField('하한', max_digits=18, decimal_places=6, null=True, blank=True)
    avg_val = models.DecimalField('평균', max_digits=18, decimal_places=6, null=True, blank=True)
    std_val = models.DecimalField('표준편차', max_digits=18, decimal_places=6, null=True, blank=True)
    cp = models.DecimalField('Cp', max_digits=8, decimal_places=4, null=True, blank=True)
    cpk = models.DecimalField('Cpk', max_digits=8, decimal_places=4, null=True, blank=True)

    class Meta:
        db_table = 'erp_qpm100_yh'
        verbose_name = 'ERP SPC'
        verbose_name_plural = 'ERP SPC'

    def __str__(self):
        return f'{self.spc_dt} {self.proc_nm} Cpk:{self.cpk}'


# ============================================================
# 자재/구매 관련 ERP 연동 테이블
# ============================================================

class ERPBarcodeDelivery(ERPBaseModel):
    """
    BAR200: 바코드 납품리스트
    MIS 매핑: Purchase.PurchaseOrder
    """
    bar_id = models.IntegerField('바코드ID', primary_key=True)
    bar_no = models.CharField('바코드번호', max_length=50)
    cust_cd = models.CharField('거래처코드', max_length=20)
    cust_nm = models.CharField('거래처명', max_length=100, blank=True)
    fac_cd = models.CharField('입고공장', max_length=10)
    wh_cd = models.CharField('입고창고', max_length=10)
    itm_id = models.IntegerField('품목ID')
    itm_cd = models.CharField('품목코드', max_length=50, blank=True)
    itm_nm = models.CharField('품목명', max_length=200, blank=True)
    dlv_dt = models.DateField('납품일자')
    mng_no = models.CharField('LOT번호', max_length=50, blank=True)
    dlv_qty = models.DecimalField('납품수량', max_digits=18, decimal_places=4, default=0)
    dlv_bc = models.CharField('납품상태', max_length=10, blank=True)

    class Meta:
        db_table = 'erp_bar200'
        verbose_name = 'ERP 바코드납품'
        verbose_name_plural = 'ERP 바코드납품'

    def __str__(self):
        return f'{self.bar_no} - {self.itm_nm}'


class ERPMaterialPlan(ERPBaseModel):
    """
    MMY100_YH: 년간자재소요계획
    MIS 매핑: 자재계획
    """
    plan_id = models.AutoField(primary_key=True)
    plan_year = models.IntegerField('계획년도')
    plan_mon = models.IntegerField('계획월')
    itm_id = models.IntegerField('품목ID')
    itm_cd = models.CharField('품목코드', max_length=50, blank=True)
    itm_nm = models.CharField('품목명', max_length=200, blank=True)
    req_qty = models.DecimalField('소요수량', max_digits=18, decimal_places=4, default=0)
    unit_price = models.DecimalField('단가', max_digits=18, decimal_places=4, default=0)
    req_amt = models.DecimalField('소요금액', max_digits=18, decimal_places=2, default=0)

    class Meta:
        db_table = 'erp_mmy100_yh'
        verbose_name = 'ERP 년간자재계획'
        verbose_name_plural = 'ERP 년간자재계획'

    def __str__(self):
        return f'{self.plan_year}-{self.plan_mon} {self.itm_nm}'


class ERPInventoryCheck(ERPBaseModel):
    """
    LEB900_YH: 재고실사등록
    MIS 매핑: Purchase.Inventory
    """
    check_id = models.AutoField(primary_key=True)
    check_dt = models.DateField('실사일자')
    fac_cd = models.CharField('공장코드', max_length=10)
    wh_cd = models.CharField('창고코드', max_length=10)
    itm_id = models.IntegerField('품목ID')
    itm_cd = models.CharField('품목코드', max_length=50, blank=True)
    itm_nm = models.CharField('품목명', max_length=200, blank=True)
    book_qty = models.DecimalField('장부수량', max_digits=18, decimal_places=4, default=0)
    check_qty = models.DecimalField('실사수량', max_digits=18, decimal_places=4, default=0)
    diff_qty = models.DecimalField('차이수량', max_digits=18, decimal_places=4, default=0)
    lot_no = models.CharField('LOT번호', max_length=50, blank=True)

    class Meta:
        db_table = 'erp_leb900_yh'
        verbose_name = 'ERP 재고실사'
        verbose_name_plural = 'ERP 재고실사'

    def __str__(self):
        return f'{self.check_dt} {self.itm_nm}'


# ============================================================
# 물류/재고 관련 ERP 연동 테이블
# ============================================================

class ERPLocation(ERPBaseModel):
    """
    LCA100: LOCATION 코드
    MIS 매핑: 창고 위치
    """
    loc_cd = models.CharField('로케이션코드', max_length=20, primary_key=True)
    loc_nm = models.CharField('로케이션명', max_length=100)
    fac_cd = models.CharField('공장코드', max_length=10)
    wh_cd = models.CharField('창고코드', max_length=10)
    zone_cd = models.CharField('존코드', max_length=10, blank=True)
    row_no = models.CharField('열', max_length=10, blank=True)
    col_no = models.CharField('단', max_length=10, blank=True)
    use_yn = models.CharField('사용여부', max_length=1, default='Y')

    class Meta:
        db_table = 'erp_lca100'
        verbose_name = 'ERP 로케이션'
        verbose_name_plural = 'ERP 로케이션'

    def __str__(self):
        return f'{self.loc_cd} - {self.loc_nm}'


class ERPLocationStock(ERPBaseModel):
    """
    LCB100: LOCATION 품목보관현황
    MIS 매핑: Purchase.Inventory
    """
    stock_id = models.AutoField(primary_key=True)
    loc_cd = models.CharField('로케이션코드', max_length=20)
    itm_id = models.IntegerField('품목ID')
    itm_cd = models.CharField('품목코드', max_length=50, blank=True)
    itm_nm = models.CharField('품목명', max_length=200, blank=True)
    lot_no = models.CharField('LOT번호', max_length=50, blank=True)
    stk_qty = models.DecimalField('재고수량', max_digits=18, decimal_places=4, default=0)
    stk_dt = models.DateField('재고일자', null=True, blank=True)

    class Meta:
        db_table = 'erp_lcb100'
        verbose_name = 'ERP 로케이션재고'
        verbose_name_plural = 'ERP 로케이션재고'

    def __str__(self):
        return f'{self.loc_cd} {self.itm_nm}: {self.stk_qty}'


# ============================================================
# 회계 관련 ERP 연동 테이블
# ============================================================

class ERPWorkInProcess(ERPBaseModel):
    """
    CAM200_YH: 재공품명세서
    MIS 매핑: Financial.FinancialStatement
    """
    wip_id = models.AutoField(primary_key=True)
    fiscal_year = models.IntegerField('회계년도')
    fiscal_month = models.IntegerField('회계월')
    fac_cd = models.CharField('공장코드', max_length=10)
    itm_id = models.IntegerField('품목ID')
    itm_cd = models.CharField('품목코드', max_length=50, blank=True)
    itm_nm = models.CharField('품목명', max_length=200, blank=True)
    wip_qty = models.DecimalField('재공수량', max_digits=18, decimal_places=4, default=0)
    wip_amt = models.DecimalField('재공금액', max_digits=18, decimal_places=2, default=0)
    mat_amt = models.DecimalField('재료비', max_digits=18, decimal_places=2, default=0)
    labor_amt = models.DecimalField('노무비', max_digits=18, decimal_places=2, default=0)
    exp_amt = models.DecimalField('경비', max_digits=18, decimal_places=2, default=0)

    class Meta:
        db_table = 'erp_cam200_yh'
        verbose_name = 'ERP 재공품명세'
        verbose_name_plural = 'ERP 재공품명세'

    def __str__(self):
        return f'{self.fiscal_year}-{self.fiscal_month} {self.itm_nm}'


class ERPProductLedger(ERPBaseModel):
    """
    CAM300_YH: 제품수불부
    MIS 매핑: Financial
    """
    ledger_id = models.AutoField(primary_key=True)
    fiscal_year = models.IntegerField('회계년도')
    fiscal_month = models.IntegerField('회계월')
    fac_cd = models.CharField('공장코드', max_length=10)
    itm_id = models.IntegerField('품목ID')
    itm_cd = models.CharField('품목코드', max_length=50, blank=True)
    itm_nm = models.CharField('품목명', max_length=200, blank=True)
    prev_qty = models.DecimalField('전기이월수량', max_digits=18, decimal_places=4, default=0)
    prev_amt = models.DecimalField('전기이월금액', max_digits=18, decimal_places=2, default=0)
    in_qty = models.DecimalField('입고수량', max_digits=18, decimal_places=4, default=0)
    in_amt = models.DecimalField('입고금액', max_digits=18, decimal_places=2, default=0)
    out_qty = models.DecimalField('출고수량', max_digits=18, decimal_places=4, default=0)
    out_amt = models.DecimalField('출고금액', max_digits=18, decimal_places=2, default=0)
    end_qty = models.DecimalField('기말수량', max_digits=18, decimal_places=4, default=0)
    end_amt = models.DecimalField('기말금액', max_digits=18, decimal_places=2, default=0)

    class Meta:
        db_table = 'erp_cam300_yh'
        verbose_name = 'ERP 제품수불부'
        verbose_name_plural = 'ERP 제품수불부'

    def __str__(self):
        return f'{self.fiscal_year}-{self.fiscal_month} {self.itm_nm}'


class ERPAccountLedger(ERPBaseModel):
    """
    CAM900_YH: 계정원장 업로드
    MIS 매핑: Financial.FinancialStatement
    """
    ledger_id = models.AutoField(primary_key=True)
    fiscal_year = models.IntegerField('회계년도')
    fiscal_month = models.IntegerField('회계월')
    acct_cd = models.CharField('계정코드', max_length=20)
    acct_nm = models.CharField('계정명', max_length=100, blank=True)
    dr_amt = models.DecimalField('차변금액', max_digits=18, decimal_places=2, default=0)
    cr_amt = models.DecimalField('대변금액', max_digits=18, decimal_places=2, default=0)
    balance = models.DecimalField('잔액', max_digits=18, decimal_places=2, default=0)

    class Meta:
        db_table = 'erp_cam900_yh'
        verbose_name = 'ERP 계정원장'
        verbose_name_plural = 'ERP 계정원장'

    def __str__(self):
        return f'{self.fiscal_year}-{self.fiscal_month} {self.acct_nm}'


# ============================================================
# 동기화 로그 및 설정 테이블
# ============================================================

class ERPSyncLog(models.Model):
    """동기화 실행 로그"""
    SYNC_TYPE_CHOICES = [
        ('full', '전체 동기화'),
        ('incremental', '증분 동기화'),
        ('manual', '수동 동기화'),
    ]

    STATUS_CHOICES = [
        ('running', '실행중'),
        ('success', '성공'),
        ('failed', '실패'),
        ('partial', '부분성공'),
    ]

    sync_id = models.AutoField(primary_key=True)
    sync_type = models.CharField('동기화 유형', max_length=20, choices=SYNC_TYPE_CHOICES)
    target_table = models.CharField('대상 테이블', max_length=50)
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='running')
    started_at = models.DateTimeField('시작시간', default=timezone.now)
    finished_at = models.DateTimeField('종료시간', null=True, blank=True)
    total_count = models.IntegerField('전체 건수', default=0)
    success_count = models.IntegerField('성공 건수', default=0)
    error_count = models.IntegerField('오류 건수', default=0)
    error_message = models.TextField('오류 메시지', blank=True)

    class Meta:
        db_table = 'erp_sync_log'
        verbose_name = 'ERP 동기화 로그'
        verbose_name_plural = 'ERP 동기화 로그'
        ordering = ['-started_at']

    def __str__(self):
        return f'{self.target_table} - {self.sync_type} ({self.status})'


class ERPSyncConfig(models.Model):
    """동기화 설정"""
    SYNC_INTERVAL_CHOICES = [
        ('realtime', '실시간'),
        ('1min', '1분'),
        ('5min', '5분'),
        ('15min', '15분'),
        ('30min', '30분'),
        ('1hour', '1시간'),
        ('daily', '일 1회'),
    ]

    config_id = models.AutoField(primary_key=True)
    erp_table = models.CharField('ERP 테이블', max_length=50, unique=True)
    mis_model = models.CharField('MIS 모델', max_length=100)
    sync_interval = models.CharField('동기화 주기', max_length=20, choices=SYNC_INTERVAL_CHOICES, default='5min')
    is_active = models.BooleanField('활성화', default=True)
    last_sync_at = models.DateTimeField('마지막 동기화', null=True, blank=True)
    sync_query = models.TextField('동기화 쿼리', blank=True)
    field_mapping = models.JSONField('필드 매핑', default=dict)

    class Meta:
        db_table = 'erp_sync_config'
        verbose_name = 'ERP 동기화 설정'
        verbose_name_plural = 'ERP 동기화 설정'

    def __str__(self):
        return f'{self.erp_table} -> {self.mis_model}'

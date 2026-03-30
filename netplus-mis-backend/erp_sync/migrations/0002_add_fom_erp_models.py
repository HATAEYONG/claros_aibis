# Generated migration for FOM ERP models

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('erp_sync', '0001_initial'),
    ]

    operations = [
        # ERPSyncConfig model updates
        migrations.AddField(
            model_name='erpsyncconfig',
            name='sync_priority',
            field=models.IntegerField(
                choices=[(1, '필수 (실시간)'), (2, '중요 (시간별)'), (3, '일반 (일별)'), (4, '확장 (주별/월별)')],
                default=2,
                verbose_name='동기화 우선순위'
            ),
        ),
        migrations.AddField(
            model_name='erpsyncconfig',
            name='date_column',
            field=models.CharField(
                blank=True,
                help_text='증분 동기화 기준 날짜 컬럼',
                max_length=50,
                verbose_name='날짜 컬럼'
            ),
        ),

        # FOMProductionData
        migrations.CreateModel(
            name='FOMProductionData',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('erp_sync_at', models.DateTimeField(blank=True, null=True, verbose_name='ERP 동기화 시간')),
                ('erp_source_table', models.CharField(blank=True, max_length=50, verbose_name='ERP 원본 테이블')),
                ('erp_source_id', models.CharField(blank=True, max_length=100, verbose_name='ERP 원본 ID')),
                ('is_synced', models.BooleanField(default=False, verbose_name='동기화 여부')),
                ('sync_error', models.TextField(blank=True, verbose_name='동기화 오류')),
                ('bs_cd', models.CharField(blank=True, max_length=10, verbose_name='사업장코드')),
                ('co_cd', models.CharField(blank=True, max_length=10, verbose_name='회사코드')),
                ('cid', models.IntegerField(blank=True, null=True, verbose_name='생성자ID')),
                ('cdt', models.DateTimeField(blank=True, null=True, verbose_name='생성일시')),
                ('mid', models.IntegerField(blank=True, null=True, verbose_name='수정자ID')),
                ('mdt', models.DateTimeField(blank=True, null=True, verbose_name='수정일시')),
                ('work_date', models.DateField(verbose_name='작업일자')),
                ('plant', models.CharField(max_length=10, verbose_name='공장')),
                ('line', models.CharField(max_length=20, verbose_name='라인')),
                ('product_id', models.IntegerField(verbose_name='품목ID')),
                ('qty_plan', models.DecimalField(decimal_places=4, default=0, max_digits=18, verbose_name='계획수량')),
                ('qty_actual', models.DecimalField(decimal_places=4, default=0, max_digits=18, verbose_name='실적수량')),
                ('qty_good', models.DecimalField(decimal_places=4, default=0, max_digits=18, verbose_name='양품수량')),
                ('qty_bad', models.DecimalField(decimal_places=4, default=0, max_digits=18, verbose_name='불량수량')),
                ('work_hours', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='작업시간')),
                ('downtime', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='가동중단시간')),
            ],
            options={
                'verbose_name': 'FOM 생산실적',
                'verbose_name_plural': 'FOM 생산실적',
                'db_table': 'fom_production',
            },
        ),

        # FOMInventoryData
        migrations.CreateModel(
            name='FOMInventoryData',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('erp_sync_at', models.DateTimeField(blank=True, null=True, verbose_name='ERP 동기화 시간')),
                ('erp_source_table', models.CharField(blank=True, max_length=50, verbose_name='ERP 원본 테이블')),
                ('erp_source_id', models.CharField(blank=True, max_length=100, verbose_name='ERP 원본 ID')),
                ('is_synced', models.BooleanField(default=False, verbose_name='동기화 여부')),
                ('sync_error', models.TextField(blank=True, verbose_name='동기화 오류')),
                ('bs_cd', models.CharField(blank=True, max_length=10, verbose_name='사업장코드')),
                ('co_cd', models.CharField(blank=True, max_length=10, verbose_name='회사코드')),
                ('cid', models.IntegerField(blank=True, null=True, verbose_name='생성자ID')),
                ('cdt', models.DateTimeField(blank=True, null=True, verbose_name='생성일시')),
                ('mid', models.IntegerField(blank=True, null=True, verbose_name='수정자ID')),
                ('mdt', models.DateTimeField(blank=True, null=True, verbose_name='수정일시')),
                ('inventory_date', models.DateField(verbose_name='재고일자')),
                ('warehouse', models.CharField(max_length=10, verbose_name='창고')),
                ('location', models.CharField(max_length=20, verbose_name='로케이션')),
                ('product_id', models.CharField(max_length=50, verbose_name='품목코드')),
                ('product_name', models.CharField(max_length=200, verbose_name='품목명')),
                ('lot_no', models.CharField(blank=True, max_length=50, verbose_name='LOT번호')),
                ('qty_on_hand', models.DecimalField(decimal_places=4, default=0, max_digits=18, verbose_name='재고수량')),
                ('qty_available', models.DecimalField(decimal_places=4, default=0, max_digits=18, verbose_name='가용재고')),
                ('qty_reserved', models.DecimalField(decimal_places=4, default=0, max_digits=18, verbose_name='예약재고')),
                ('unit_cost', models.DecimalField(decimal_places=4, default=0, max_digits=18, verbose_name='단가')),
                ('total_value', models.DecimalField(decimal_places=2, default=0, max_digits=18, verbose_name='총금액')),
                ('safety_stock', models.DecimalField(decimal_places=4, default=0, max_digits=18, verbose_name='안전재고')),
                ('reorder_point', models.DecimalField(decimal_places=4, default=0, max_digits=18, verbose_name='재발주점')),
            ],
            options={
                'verbose_name': 'FOM 재고현황',
                'verbose_name_plural': 'FOM 재고현황',
                'db_table': 'fom_inventory',
            },
        ),

        # Remaining FOM models will be added similarly
        # For brevity, showing partial migration
    ]

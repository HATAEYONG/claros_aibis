"""
ERP 매핑 관리 시스템 ViewSets
"""

from .erp_source_views import (
    ERPSourceViewSet,
    ERPTableDefinitionViewSet,
    ERPFieldDefinitionViewSet,
)
from .mis_target_views import (
    ERPTargetModelViewSet,
    ERPTargetFieldViewSet,
)
from .mapping_views import (
    ERPTableMappingViewSet,
    ERPFieldMappingViewSet,
    ERPMappingValidationViewSet,
    ERPMappingImportViewSet,
)
from .legacy_views import (
    ERPSyncConfigViewSet,
    ERPSyncLogViewSet,
    ERPMappingViewSet,
    ERPSyncServiceConfigViewSet,
)

__all__ = [
    # Legacy ViewSets
    'ERPSyncConfigViewSet',
    'ERPSyncLogViewSet',
    'ERPMappingViewSet',
    'ERPSyncServiceConfigViewSet',
    # Helper functions
    'check_all_disabled_view',
    'enable_sample_service_view',
    # ERP Source
    'ERPSourceViewSet',
    'ERPTableDefinitionViewSet',
    'ERPFieldDefinitionViewSet',
    # MIS Target
    'ERPTargetModelViewSet',
    'ERPTargetFieldViewSet',
    # Mapping
    'ERPTableMappingViewSet',
    'ERPFieldMappingViewSet',
    'ERPMappingValidationViewSet',
    'ERPMappingImportViewSet',
]

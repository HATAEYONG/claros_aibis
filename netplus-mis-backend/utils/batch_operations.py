# -*- coding: utf-8 -*-
"""
배치 작업을 위한 베이스 믹스인
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction


class BatchOperationsMixin:
    """
    배치 작업 (생성, 수정, 삭제)을 위한 믹스인 클래스
    ViewSet에 이 믹스인을 추가하여 배치 작업 기능을 사용할 수 있습니다.
    """

    @action(detail=False, methods=['post'], url_path='batch-create')
    def batch_create(self, request):
        """
        일괄 생성 (Bulk Create)

        Request Body:
        {
            "items": [
                {field1: value1, field2: value2, ...},
                {field1: value1, field2: value2, ...},
                ...
            ]
        }

        Response:
        {
            "created": int,
            "failed": int,
            "results": [{id: 1, ...}, ...],
            "errors": [{index: 0, error: "..."}, ...]
        }
        """
        items = request.data.get('items', [])
        if not items:
            return Response(
                {'error': 'items 배열이 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=items, many=True)
        if not serializer.is_valid():
            return Response(
                {'error': '검증 실패', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                created_instances = serializer.save()

            return Response({
                'created': len(created_instances),
                'failed': 0,
                'results': self.get_serializer(created_instances, many=True).data,
                'errors': []
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': f'생성 실패: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post', 'put', 'patch'], url_path='batch-update')
    def batch_update(self, request):
        """
        일괄 수정 (Bulk Update)

        Request Body:
        {
            "items": [
                {id: 1, field1: new_value1, ...},
                {id: 2, field1: new_value2, ...},
                ...
            ],
            "partial": false  // optional, PATCH일 경우 true
        }

        Response:
        {
            "updated": int,
            "failed": int,
            "results": [{id: 1, ...}, ...],
            "errors": [{id: 1, error: "..."}, ...]
        }
        """
        items = request.data.get('items', [])
        partial = request.data.get('partial', request.method == 'PATCH')

        if not items:
            return Response(
                {'error': 'items 배열이 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        results = []
        errors = []
        updated_count = 0
        failed_count = 0

        for item in items:
            item_id = item.get('id')
            if not item_id:
                errors.append({
                    'item': item,
                    'error': 'id 필드가 필요합니다.'
                })
                failed_count += 1
                continue

            try:
                instance = self.queryset.get(pk=item_id)
                serializer = self.get_serializer(instance, data=item, partial=partial)
                if serializer.is_valid():
                    serializer.save()
                    results.append(serializer.data)
                    updated_count += 1
                else:
                    errors.append({
                        'id': item_id,
                        'error': serializer.errors
                    })
                    failed_count += 1
            except self.queryset.model.DoesNotExist:
                errors.append({
                    'id': item_id,
                    'error': '객체를 찾을 수 없습니다.'
                })
                failed_count += 1

        return Response({
            'updated': updated_count,
            'failed': failed_count,
            'results': results,
            'errors': errors
        })

    @action(detail=False, methods=['post', 'delete'], url_path='batch-delete')
    def batch_delete(self, request):
        """
        일괄 삭제 (Bulk Delete)

        Request Body:
        {
            "ids": [1, 2, 3, ...]
        }

        Response:
        {
            "deleted": int,
            "failed": int,
            "errors": [{id: 1, error: "..."}, ...]
        }
        """
        ids = request.data.get('ids', [])

        if not ids:
            return Response(
                {'error': 'ids 배열이 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        deleted_count = 0
        failed_count = 0
        errors = []

        for item_id in ids:
            try:
                instance = self.queryset.get(pk=item_id)
                instance.delete()
                deleted_count += 1
            except self.queryset.model.DoesNotExist:
                errors.append({
                    'id': item_id,
                    'error': '객체를 찾을 수 없습니다.'
                })
                failed_count += 1

        return Response({
            'deleted': deleted_count,
            'failed': failed_count,
            'errors': errors
        })

    @action(detail=False, methods=['post'], url_path='batch-upsert')
    def batch_upsert(self, request):
        """
        일괄 Upsert (생성 또는 수정)

        Request Body:
        {
            "items": [
                {id: 1, field1: value1, ...},  // 있으면 수정
                {field1: value2, ...},           // 없으면 생성
                ...
            ],
            "lookup_field": "id"  // optional, 기본값 "id"
        }

        Response:
        {
            "created": int,
            "updated": int,
            "failed": int,
            "results": [...],
            "errors": [...]
        }
        """
        items = request.data.get('items', [])
        lookup_field = request.data.get('lookup_field', 'id')

        if not items:
            return Response(
                {'error': 'items 배열이 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        results = []
        errors = []
        created_count = 0
        updated_count = 0
        failed_count = 0

        try:
            with transaction.atomic():
                for item in items:
                    lookup_value = item.get(lookup_field)

                    if lookup_value is not None:
                        # update 시도
                        try:
                            filters = {lookup_field: lookup_value}
                            instance = self.queryset.get(**filters)
                            serializer = self.get_serializer(instance, data=item, partial=False)
                            if serializer.is_valid():
                                serializer.save()
                                results.append(serializer.data)
                                updated_count += 1
                            else:
                                errors.append({
                                    'item': item,
                                    'error': serializer.errors
                                })
                                failed_count += 1
                        except self.queryset.model.DoesNotExist:
                            # 생성 시도
                            serializer = self.get_serializer(data=item)
                            if serializer.is_valid():
                                serializer.save()
                                results.append(serializer.data)
                                created_count += 1
                            else:
                                errors.append({
                                    'item': item,
                                    'error': serializer.errors
                                })
                                failed_count += 1
                    else:
                        # 생성
                        serializer = self.get_serializer(data=item)
                        if serializer.is_valid():
                            serializer.save()
                            results.append(serializer.data)
                            created_count += 1
                        else:
                            errors.append({
                                'item': item,
                                'error': serializer.errors
                            })
                            failed_count += 1

            return Response({
                'created': created_count,
                'updated': updated_count,
                'failed': failed_count,
                'results': results,
                'errors': errors
            })
        except Exception as e:
            return Response(
                {'error': f'Upsert 실패: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

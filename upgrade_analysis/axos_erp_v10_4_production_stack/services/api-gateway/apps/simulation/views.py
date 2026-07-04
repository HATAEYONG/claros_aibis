from uuid import uuid4
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import ReleaseProductionOrderSerializer, EquipmentDowntimeSerializer
from apps.core.services import publish_event, score_risk, forecast_margin, create_alert, create_task, update_graph

class ReleaseProductionOrderView(APIView):
    authentication_classes = []
    permission_classes = []
    def post(self, request):
        s = ReleaseProductionOrderSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = s.validated_data
        key = f"evt-{uuid4()}"
        evt, hub = publish_event("erp.production.order.released", key, "erp.production_order.released", data)
        update_graph(
            [{"id": f"ORDER:{data['sales_order_no']}", "label": f"Order {data['sales_order_no']}"},
             {"id": f"PRODUCTION_ORDER:{data['production_order_no']}", "label": f"PO {data['production_order_no']}"}],
            [{"source": f"ORDER:{data['sales_order_no']}", "target": f"PRODUCTION_ORDER:{data['production_order_no']}", "label": "TRIGGERS"}],
        )
        _, score = score_risk("ORDER", data["sales_order_no"], {"downtime": False})
        _, forecast = forecast_margin("ORDER", data["sales_order_no"], 10000000, 8200000)
        return Response({"event_id": evt.id, "hub": hub, "score": score, "forecast": forecast})

class EquipmentDowntimeView(APIView):
    authentication_classes = []
    permission_classes = []
    def post(self, request):
        s = EquipmentDowntimeSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = s.validated_data
        key = f"evt-{uuid4()}"
        evt, hub = publish_event("iot.equipment.downtime.started", key, "iot.equipment.downtime.started", data)
        update_graph(
            [{"id": f"ORDER:{data['order_no']}", "label": f"Order {data['order_no']}"},
             {"id": f"LOT:{data['lot_no']}", "label": f"Lot {data['lot_no']}"},
             {"id": f"EQUIPMENT:{data['equipment_code']}", "label": f"Equipment {data['equipment_code']}"}],
            [{"source": f"ORDER:{data['order_no']}", "target": f"LOT:{data['lot_no']}", "label": "GENERATES"},
             {"source": f"LOT:{data['lot_no']}", "target": f"EQUIPMENT:{data['equipment_code']}", "label": "PROCESSED_ON"}],
        )
        score_obj, score = score_risk("ORDER", data["order_no"], {"downtime": True, "duration_min": data["duration_min"]})
        _, forecast = forecast_margin("ORDER", data["order_no"], 10000000, 8200000, 1200000)
        alert = None
        task = None
        if score_obj.score_level == "HIGH":
            alert = create_alert("DELAY", f"ORDER {data['order_no']} delay risk", "HIGH", "ORDER", data["order_no"])
            task = create_task("REVIEW_DELAY_RISK", f"Review order {data['order_no']}", "PRODUCTION_MANAGER", "ORDER", data["order_no"])
        return Response({"event_id": evt.id, "hub": hub, "score": score, "forecast": forecast, "alert": alert, "task": task})

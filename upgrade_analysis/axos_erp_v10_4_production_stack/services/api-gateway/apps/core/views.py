from rest_framework.response import Response
from rest_framework.views import APIView
from .models import GatewayEvent, RiskScore, AlertRecord, WorkflowTaskRecord, ForecastRecord
from .serializers import GatewayEventSerializer, RiskScoreSerializer, AlertRecordSerializer, WorkflowTaskRecordSerializer, ForecastRecordSerializer

class HealthView(APIView):
    authentication_classes = []
    permission_classes = []
    def get(self, request):
        return Response({"status": "ok", "service": "api-gateway"})

class DashboardSummaryView(APIView):
    authentication_classes = []
    permission_classes = []
    def get(self, request):
        return Response({
            "events": GatewayEvent.objects.count(),
            "high_risk": RiskScore.objects.filter(score_level="HIGH").count(),
            "alerts": AlertRecord.objects.filter(status="OPEN").count(),
            "tasks": WorkflowTaskRecord.objects.filter(status="OPEN").count(),
            "forecasts": ForecastRecord.objects.count(),
        })

class EventListView(APIView):
    authentication_classes = []
    permission_classes = []
    def get(self, request):
        return Response(GatewayEventSerializer(GatewayEvent.objects.order_by("-created_at"), many=True).data)

class ScoreListView(APIView):
    authentication_classes = []
    permission_classes = []
    def get(self, request):
        return Response(RiskScoreSerializer(RiskScore.objects.order_by("-created_at"), many=True).data)

class AlertListView(APIView):
    authentication_classes = []
    permission_classes = []
    def get(self, request):
        return Response(AlertRecordSerializer(AlertRecord.objects.order_by("-created_at"), many=True).data)

class TaskListView(APIView):
    authentication_classes = []
    permission_classes = []
    def get(self, request):
        return Response(WorkflowTaskRecordSerializer(WorkflowTaskRecord.objects.order_by("-created_at"), many=True).data)

class ForecastListView(APIView):
    authentication_classes = []
    permission_classes = []
    def get(self, request):
        return Response(ForecastRecordSerializer(ForecastRecord.objects.order_by("-created_at"), many=True).data)

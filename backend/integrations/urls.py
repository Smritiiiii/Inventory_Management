from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register('categories', CategoryViewSet)
router.register('suppliers', SupplierViewSet)
router.register("customers", CustomerViewSet)
router.register("daily-sales", DailySaleViewSet, basename="daily-sale")
router.register("item-types", ItemTypeViewSet)
router.register("cylinder-inventory", CylinderInventoryViewSet, basename="cylinder-inventory")
router.register("cylinder-transactions", CylinderTransactionViewSet, basename="cylinder-transaction")

# urlpatterns = [
#     # path('dashboard/', DashboardAPIView.as_view()),
# ]

urlpatterns = router.urls

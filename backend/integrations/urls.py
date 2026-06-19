from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register('api/suppliers', SupplierViewSet)
router.register("api/customers", CustomerViewSet)
router.register("api/daily-sales", DailySaleViewSet, basename="daily-sale")
router.register("api/item-types", ItemTypeViewSet)
router.register("api/cylinder-transactions", CylinderTransactionViewSet, basename="cylinder-transaction")

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/current-user/', CurrentUserView.as_view(), name='current-user'),
]

urlpatterns += router.urls

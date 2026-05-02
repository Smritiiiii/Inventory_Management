
from django.contrib import admin
from django.urls import path,include
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    path('auth/login/', TokenObtainPairView.as_view(), name='login_token'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('api/', include('integrations.urls'))
]

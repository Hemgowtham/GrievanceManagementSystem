from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from core import views
from core.views import site_settings_api
from core.views import send_otp_api, reset_password_with_otp

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/admin/change-password/', views.admin_change_password),

    # Auth & Reg
    path('api/login/', views.login_api),
    path('api/register-student/', views.register_student),
    path('api/register-authority/', views.register_authority),
    
    # Core Logic
    path('api/grievances/', views.grievance_api),
    path('api/stats/', views.dashboard_stats),
    path('api/students/', views.manage_students),
    path('api/authorities/', views.manage_authorities),
    path('api/settings/', site_settings_api),
    path('api/forgot-password/send-otp/', send_otp_api),
    path('api/forgot-password/reset/', reset_password_with_otp),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
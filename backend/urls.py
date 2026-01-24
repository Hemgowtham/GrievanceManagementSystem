from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from core import views

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth & Reg
    path('api/login/', views.login_api),
    path('api/register-student/', views.register_student),
    path('api/register-authority/', views.register_authority),
    
    # Core Logic
    path('api/grievances/', views.grievance_api),
    path('api/stats/', views.dashboard_stats),
    path('api/students/', views.manage_students),
    path('api/authorities/', views.manage_authorities),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
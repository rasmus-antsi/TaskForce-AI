"""
URL configuration for _core project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('a_map.urls')),
    path('api/tools/', include('a_tools.urls')),
]

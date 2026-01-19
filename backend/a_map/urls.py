from django.urls import path
from . import views

app_name = 'a_map'

urlpatterns = [
    path('wms-proxy/', views.wms_proxy, name='wms_proxy'),
    path('wms-capabilities/', views.wms_capabilities, name='wms_capabilities'),
    path('elevation/profile/', views.get_elevation_profile, name='elevation_profile'),
    path('elevation/line-of-sight/', views.get_line_of_sight, name='line_of_sight'),
]

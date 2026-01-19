from django.urls import path
from . import views

app_name = 'a_map'

urlpatterns = [
    path('wms-proxy/', views.wms_proxy, name='wms_proxy'),
    path('wms-capabilities/', views.wms_capabilities, name='wms_capabilities'),
]

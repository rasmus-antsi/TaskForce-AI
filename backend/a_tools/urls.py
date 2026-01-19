from django.urls import path
from . import views

urlpatterns = [
    # Markers
    path('markers/', views.marker_list, name='marker_list'),
    path('markers/<int:marker_id>/', views.marker_detail, name='marker_detail'),
    
    # Features (drawn shapes)
    path('features/', views.feature_list, name='feature_list'),
    path('features/<int:feature_id>/', views.feature_detail, name='feature_detail'),
]

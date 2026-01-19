from django.contrib import admin
from .models import Marker, Feature


@admin.register(Marker)
class MarkerAdmin(admin.ModelAdmin):
    list_display = ('name', 'affiliation', 'sidc', 'lat', 'lon', 'created_at')
    list_filter = ('affiliation', 'created_at')
    search_fields = ('name', 'sidc')
    ordering = ('-created_at',)


@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ('name', 'feature_type', 'created_at')
    list_filter = ('feature_type', 'created_at')
    search_fields = ('name',)
    ordering = ('-created_at',)

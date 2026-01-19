from django.db import models


class Marker(models.Model):
    """MIL-STD-2525 tactical marker"""
    AFFILIATION_CHOICES = [
        ('F', 'Friendly'),
        ('H', 'Hostile'),
        ('N', 'Neutral'),
        ('U', 'Unknown'),
    ]
    
    name = models.CharField(max_length=100)
    sidc = models.CharField(max_length=30, help_text="Symbol ID Code (MIL-STD-2525)")
    affiliation = models.CharField(max_length=1, choices=AFFILIATION_CHOICES, default='U')
    lat = models.FloatField()
    lon = models.FloatField()
    properties = models.JSONField(default=dict, blank=True)  # unit size, designator, etc.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_affiliation_display()})"


class Feature(models.Model):
    """Drawn shapes: lines, polygons, circles, analyses"""
    FEATURE_TYPES = [
        ('line', 'Line/Route'),
        ('polygon', 'Polygon/Zone'),
        ('circle', 'Circle'),
        ('rectangle', 'Rectangle'),
        ('arrow', 'Arrow/Direction'),
        ('elevationProfile', 'Elevation Profile'),
        ('lineOfSight', 'Line of Sight'),
    ]
    
    name = models.CharField(max_length=100)
    feature_type = models.CharField(max_length=20, choices=FEATURE_TYPES)
    geometry = models.JSONField()  # GeoJSON geometry
    style = models.JSONField(default=dict, blank=True)  # color, weight, opacity
    properties = models.JSONField(default=dict, blank=True)  # analysis data, metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_feature_type_display()})"

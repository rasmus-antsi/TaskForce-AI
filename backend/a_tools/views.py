from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
import json

from .models import Marker, Feature


def serialize_marker(marker):
    """Serialize a Marker instance to dict."""
    return {
        'id': marker.id,
        'name': marker.name,
        'sidc': marker.sidc,
        'affiliation': marker.affiliation,
        'affiliation_display': marker.get_affiliation_display(),
        'lat': marker.lat,
        'lon': marker.lon,
        'properties': marker.properties,
        'created_at': marker.created_at.isoformat(),
        'updated_at': marker.updated_at.isoformat(),
    }


def serialize_feature(feature):
    """Serialize a Feature instance to dict."""
    return {
        'id': feature.id,
        'name': feature.name,
        'feature_type': feature.feature_type,
        'feature_type_display': feature.get_feature_type_display(),
        'geometry': feature.geometry,
        'style': feature.style,
        'created_at': feature.created_at.isoformat(),
        'updated_at': feature.updated_at.isoformat(),
    }


# ============== MARKER VIEWS ==============

@csrf_exempt
@require_http_methods(["GET", "POST"])
def marker_list(request):
    """List all markers or create a new one."""
    if request.method == "GET":
        markers = Marker.objects.all()
        return JsonResponse({
            'markers': [serialize_marker(m) for m in markers]
        })
    
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            marker = Marker.objects.create(
                name=data.get('name', 'Unnamed Marker'),
                sidc=data.get('sidc', 'SUGP------'),
                affiliation=data.get('affiliation', 'U'),
                lat=data['lat'],
                lon=data['lon'],
                properties=data.get('properties', {}),
            )
            return JsonResponse(serialize_marker(marker), status=201)
        except (json.JSONDecodeError, KeyError) as e:
            return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def marker_detail(request, marker_id):
    """Get, update, or delete a single marker."""
    marker = get_object_or_404(Marker, id=marker_id)
    
    if request.method == "GET":
        return JsonResponse(serialize_marker(marker))
    
    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            marker.name = data.get('name', marker.name)
            marker.sidc = data.get('sidc', marker.sidc)
            marker.affiliation = data.get('affiliation', marker.affiliation)
            marker.lat = data.get('lat', marker.lat)
            marker.lon = data.get('lon', marker.lon)
            marker.properties = data.get('properties', marker.properties)
            marker.save()
            return JsonResponse(serialize_marker(marker))
        except json.JSONDecodeError as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    elif request.method == "DELETE":
        marker.delete()
        return JsonResponse({'status': 'deleted'}, status=204)


# ============== FEATURE VIEWS ==============

@csrf_exempt
@require_http_methods(["GET", "POST"])
def feature_list(request):
    """List all features or create a new one."""
    if request.method == "GET":
        features = Feature.objects.all()
        return JsonResponse({
            'features': [serialize_feature(f) for f in features]
        })
    
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            feature = Feature.objects.create(
                name=data.get('name', 'Unnamed Feature'),
                feature_type=data['feature_type'],
                geometry=data['geometry'],
                style=data.get('style', {}),
            )
            return JsonResponse(serialize_feature(feature), status=201)
        except (json.JSONDecodeError, KeyError) as e:
            return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def feature_detail(request, feature_id):
    """Get, update, or delete a single feature."""
    feature = get_object_or_404(Feature, id=feature_id)
    
    if request.method == "GET":
        return JsonResponse(serialize_feature(feature))
    
    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            feature.name = data.get('name', feature.name)
            feature.feature_type = data.get('feature_type', feature.feature_type)
            feature.geometry = data.get('geometry', feature.geometry)
            feature.style = data.get('style', feature.style)
            feature.save()
            return JsonResponse(serialize_feature(feature))
        except json.JSONDecodeError as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    elif request.method == "DELETE":
        feature.delete()
        return JsonResponse({'status': 'deleted'}, status=204)

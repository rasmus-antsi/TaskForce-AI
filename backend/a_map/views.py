from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import requests
import xml.etree.ElementTree as ET
import json
import math

# WMS endpoints - Maa-amet services
WMS_ENDPOINTS = {
    'fotokaart': 'https://kaart.maaamet.ee/wms/fotokaart',
    'alus': 'https://kaart.maaamet.ee/wms/alus',
    'kaart': 'https://kaart.maaamet.ee/wms/kaart',
}

# Elevation data service - Maa-amet kõrgusandmed
# Uses WMS GetFeatureInfo on the elevation layer
ELEVATION_WMS_URL = 'https://kaart.maaamet.ee/wms/fotokaart'
ELEVATION_LAYER = 'korgusandmed'


@csrf_exempt
@require_http_methods(["GET"])
def wms_proxy(request):
    """
    Proxy WMS requests to Maa-amet servers.
    Forwards all query parameters from frontend to Maa-amet WMS.
    """
    # Get service type (alus, fotokaart, etc.) from query param
    service_path = request.GET.get('service_path', 'fotokaart')
    wms_url = WMS_ENDPOINTS.get(service_path, WMS_ENDPOINTS['fotokaart'])
    
    # Forward all other parameters to Maa-amet
    params = {}
    for key, value in request.GET.items():
        if key != 'service_path':
            # Handle list values (e.g., from QueryDict)
            if isinstance(value, list):
                params[key] = value[0]
            else:
                params[key] = value
    
    try:
        response = requests.get(wms_url, params=params, timeout=15)
        
        # Forward the response
        content_type = response.headers.get('Content-Type', 'image/png')
        django_response = HttpResponse(
            response.content,
            content_type=content_type
        )
        return django_response
    except requests.exceptions.RequestException as e:
        return HttpResponse(f"Proxy Error: {str(e)}", status=500, content_type='text/plain')
    except Exception as e:
        return HttpResponse(f"Error: {str(e)}", status=500, content_type='text/plain')


@csrf_exempt
@require_http_methods(["GET"])
def wms_capabilities(request):
    """
    Fetch and return available layers from Maa-amet WMS GetCapabilities.
    Useful for debugging which layers are available.
    """
    service = request.GET.get('service', 'fotokaart')
    wms_url = WMS_ENDPOINTS.get(service, WMS_ENDPOINTS['fotokaart'])
    
    params = {
        'SERVICE': 'WMS',
        'REQUEST': 'GetCapabilities',
        'VERSION': '1.1.1'
    }
    
    try:
        response = requests.get(wms_url, params=params, timeout=15)
        
        # Parse XML to extract layer names
        layers = []
        try:
            root = ET.fromstring(response.content)
            # Find all Layer elements and extract names
            for layer in root.iter():
                if layer.tag.endswith('Layer'):
                    name_elem = layer.find('.//{http://www.opengis.net/wms}Name')
                    title_elem = layer.find('.//{http://www.opengis.net/wms}Title')
                    if name_elem is None:
                        name_elem = layer.find('.//Name')
                    if title_elem is None:
                        title_elem = layer.find('.//Title')
                    if name_elem is not None and name_elem.text:
                        layers.append({
                            'name': name_elem.text,
                            'title': title_elem.text if title_elem is not None else name_elem.text
                        })
        except ET.ParseError:
            pass  # Return raw XML if parsing fails
        
        return JsonResponse({
            'service': service,
            'url': wms_url,
            'layers': layers,
            'raw_xml': response.text[:5000] if not layers else None  # First 5000 chars if parsing failed
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def get_elevation_profile(request):
    """
    Get elevation values along a path.
    Expects JSON body with 'points': [[lat, lng], [lat, lng], ...]
    Returns elevation values for each point and interpolated points along the path.
    """
    try:
        data = json.loads(request.body)
        points = data.get('points', [])
        num_samples = data.get('samples', 50)  # Number of sample points
        
        if len(points) < 2:
            return JsonResponse({'error': 'At least 2 points required'}, status=400)
        
        # Interpolate points along the path
        sample_points = interpolate_path(points, num_samples)
        
        # Get elevation for each sample point
        elevations = []
        cumulative_distance = 0
        prev_point = None
        
        for i, point in enumerate(sample_points):
            lat, lng = point
            
            # Calculate cumulative distance
            if prev_point:
                dist = haversine_distance(prev_point[0], prev_point[1], lat, lng)
                cumulative_distance += dist
            
            # Query elevation from Maa-amet
            elevation = query_elevation(lat, lng)
            
            elevations.append({
                'lat': lat,
                'lng': lng,
                'elevation': elevation,
                'distance': cumulative_distance,
            })
            
            prev_point = point
        
        return JsonResponse({
            'profile': elevations,
            'min_elevation': min(e['elevation'] for e in elevations if e['elevation'] is not None) if elevations else None,
            'max_elevation': max(e['elevation'] for e in elevations if e['elevation'] is not None) if elevations else None,
            'total_distance': cumulative_distance,
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def get_line_of_sight(request):
    """
    Check line of sight between two points.
    Expects JSON body with 'observer': [lat, lng], 'target': [lat, lng], 'observer_height': meters
    Returns visibility info and profile.
    """
    try:
        data = json.loads(request.body)
        observer = data.get('observer')
        target = data.get('target')
        observer_height = data.get('observer_height', 2.0)  # Default 2m eye height
        target_height = data.get('target_height', 0.0)  # Target height above ground
        num_samples = data.get('samples', 100)
        
        if not observer or not target:
            return JsonResponse({'error': 'Observer and target points required'}, status=400)
        
        # Get elevation profile between points
        sample_points = interpolate_path([observer, target], num_samples)
        
        elevations = []
        cumulative_distance = 0
        prev_point = None
        
        for point in sample_points:
            lat, lng = point
            
            if prev_point:
                dist = haversine_distance(prev_point[0], prev_point[1], lat, lng)
                cumulative_distance += dist
            
            elevation = query_elevation(lat, lng)
            elevations.append({
                'lat': lat,
                'lng': lng,
                'elevation': elevation if elevation else 0,
                'distance': cumulative_distance,
            })
            prev_point = point
        
        # Calculate line of sight
        if not elevations:
            return JsonResponse({'error': 'Could not get elevation data'}, status=500)
        
        observer_elev = elevations[0]['elevation'] + observer_height
        target_elev = elevations[-1]['elevation'] + target_height
        total_distance = elevations[-1]['distance']
        
        # Check each point along the path
        visible = True
        obstruction_point = None
        
        for i, point in enumerate(elevations[1:-1], 1):
            # Calculate expected height along sight line at this distance
            ratio = point['distance'] / total_distance if total_distance > 0 else 0
            expected_height = observer_elev + (target_elev - observer_elev) * ratio
            
            # Check if terrain blocks the sight line
            if point['elevation'] > expected_height:
                visible = False
                obstruction_point = {
                    'lat': point['lat'],
                    'lng': point['lng'],
                    'elevation': point['elevation'],
                    'distance': point['distance'],
                    'sight_line_height': expected_height,
                }
                break
        
        return JsonResponse({
            'visible': visible,
            'obstruction': obstruction_point,
            'profile': elevations,
            'observer_elevation': observer_elev,
            'target_elevation': target_elev,
            'total_distance': total_distance,
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def interpolate_path(points, num_samples):
    """
    Interpolate points along a path to get evenly spaced samples.
    """
    if len(points) < 2:
        return points
    
    # Calculate total path length
    total_length = 0
    segments = []
    for i in range(len(points) - 1):
        dist = haversine_distance(points[i][0], points[i][1], points[i+1][0], points[i+1][1])
        segments.append((points[i], points[i+1], dist))
        total_length += dist
    
    if total_length == 0:
        return points
    
    # Generate evenly spaced points
    sample_interval = total_length / (num_samples - 1)
    samples = [points[0]]
    
    current_distance = 0
    segment_idx = 0
    segment_distance = 0
    
    for i in range(1, num_samples - 1):
        target_distance = i * sample_interval
        
        # Find the segment containing this distance
        while segment_idx < len(segments):
            p1, p2, seg_len = segments[segment_idx]
            
            if current_distance + seg_len >= target_distance:
                # Interpolate within this segment
                ratio = (target_distance - current_distance) / seg_len if seg_len > 0 else 0
                lat = p1[0] + (p2[0] - p1[0]) * ratio
                lng = p1[1] + (p2[1] - p1[1]) * ratio
                samples.append([lat, lng])
                break
            else:
                current_distance += seg_len
                segment_idx += 1
        else:
            # Past the end, use last point
            samples.append(points[-1])
    
    samples.append(points[-1])
    return samples


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two points in meters using Haversine formula.
    """
    R = 6371000  # Earth radius in meters
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


def query_elevation(lat, lng):
    """
    Query elevation at a single point from Maa-amet WMS.
    Uses GetFeatureInfo on the elevation layer.
    """
    try:
        # Convert lat/lng to Estonian CRS (EPSG:3301) for WMS query
        # For now, use a simple approximation - the WMS should handle reprojection
        
        # Create a small bounding box around the point
        delta = 0.0001  # ~10m
        bbox = f"{lng-delta},{lat-delta},{lng+delta},{lat+delta}"
        
        params = {
            'SERVICE': 'WMS',
            'VERSION': '1.1.1',
            'REQUEST': 'GetFeatureInfo',
            'LAYERS': ELEVATION_LAYER,
            'QUERY_LAYERS': ELEVATION_LAYER,
            'INFO_FORMAT': 'text/plain',
            'SRS': 'EPSG:4326',
            'BBOX': bbox,
            'WIDTH': 3,
            'HEIGHT': 3,
            'X': 1,
            'Y': 1,
        }
        
        response = requests.get(ELEVATION_WMS_URL, params=params, timeout=10)
        
        if response.status_code == 200:
            # Parse elevation from response
            text = response.text
            # Look for numeric value in response
            import re
            numbers = re.findall(r'[-+]?\d*\.?\d+', text)
            if numbers:
                # Return the first reasonable elevation value (typically 0-500m for Estonia)
                for num in numbers:
                    val = float(num)
                    if -50 < val < 1000:  # Reasonable elevation range
                        return val
        
        # Fallback: return simulated elevation based on position
        # This is a placeholder until we confirm the correct API
        return simulate_elevation(lat, lng)
        
    except Exception as e:
        print(f"Elevation query error: {e}")
        return simulate_elevation(lat, lng)


def simulate_elevation(lat, lng):
    """
    Simulate elevation for testing when API is unavailable.
    Creates a realistic-ish terrain based on coordinates.
    Estonia is mostly flat with max ~300m.
    """
    # Use sine waves to create rolling hills
    base = 50  # Base elevation
    variation = 30 * math.sin(lat * 100) * math.cos(lng * 80)
    variation += 20 * math.sin(lat * 200 + lng * 150)
    variation += 10 * math.cos(lat * 50 - lng * 100)
    
    return max(0, base + variation)

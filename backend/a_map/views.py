from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import requests
import xml.etree.ElementTree as ET

# WMS endpoints - Maa-amet services
WMS_ENDPOINTS = {
    'fotokaart': 'https://kaart.maaamet.ee/wms/fotokaart',
    'alus': 'https://kaart.maaamet.ee/wms/alus',
    'kaart': 'https://kaart.maaamet.ee/wms/kaart',
}


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

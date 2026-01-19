/**
 * Feature Store - State management and API integration for markers and features
 */

// Use relative URL - Vite dev server proxies to Django
const API_BASE = '/api/tools'

// Test function - call from browser console: testAPI()
window.testAPI = async function() {
  console.log('Testing API at:', API_BASE)
  try {
    const response = await fetch(`${API_BASE}/features/`, {
      method: 'POST',
      mode: 'cors',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name: 'Browser Test',
        feature_type: 'line',
        geometry: { type: 'LineString', coordinates: [[25, 58], [26, 59]] },
        style: { color: '#ff0000' }
      }),
    })
    console.log('Response status:', response.status, response.statusText)
    const data = await response.json()
    console.log('Response data:', data)
    return data
  } catch (err) {
    console.error('Test API error:', err)
    throw err
  }
}

// Simple connectivity test
window.testConnection = async function() {
  console.log('Testing connection to:', API_BASE)
  try {
    const response = await fetch(`${API_BASE}/features/`, {
      method: 'GET',
      mode: 'cors',
    })
    console.log('GET Response:', response.status, response.statusText)
    const data = await response.json()
    console.log('Features:', data)
    return data
  } catch (err) {
    console.error('Connection test error:', err)
    throw err
  }
}

// ============== MARKERS API ==============

export async function fetchMarkers() {
  const response = await fetch(`${API_BASE}/markers/`)
  if (!response.ok) throw new Error('Failed to fetch markers')
  const data = await response.json()
  return data.markers
}

export async function createMarker(marker) {
  try {
    console.log('Sending POST to:', `${API_BASE}/markers/`)
    console.log('Body:', JSON.stringify(marker))
    
    const response = await fetch(`${API_BASE}/markers/`, {
      method: 'POST',
      mode: 'cors',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(marker),
    })
    
    console.log('Response received:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Server response:', response.status, errorText)
      throw new Error(`Server error ${response.status}: ${errorText}`)
    }
    return response.json()
  } catch (err) {
    console.error('Network/fetch error:', err)
    throw err
  }
}

export async function updateMarker(id, marker) {
  const response = await fetch(`${API_BASE}/markers/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(marker),
  })
  if (!response.ok) throw new Error('Failed to update marker')
  return response.json()
}

export async function deleteMarker(id) {
  const response = await fetch(`${API_BASE}/markers/${id}/`, {
    method: 'DELETE',
  })
  if (!response.ok && response.status !== 204) throw new Error('Failed to delete marker')
  return true
}


// ============== FEATURES API ==============

export async function fetchFeatures() {
  const response = await fetch(`${API_BASE}/features/`)
  if (!response.ok) throw new Error('Failed to fetch features')
  const data = await response.json()
  return data.features
}

export async function createFeature(feature) {
  try {
    console.log('Sending POST to:', `${API_BASE}/features/`)
    console.log('Body:', JSON.stringify(feature))
    
    const response = await fetch(`${API_BASE}/features/`, {
      method: 'POST',
      mode: 'cors',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(feature),
    })
    
    console.log('Response received:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Server response:', response.status, errorText)
      throw new Error(`Server error ${response.status}: ${errorText}`)
    }
    return response.json()
  } catch (err) {
    console.error('Network/fetch error:', err)
    throw err
  }
}

export async function updateFeature(id, feature) {
  const response = await fetch(`${API_BASE}/features/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feature),
  })
  if (!response.ok) throw new Error('Failed to update feature')
  return response.json()
}

export async function deleteFeature(id) {
  const response = await fetch(`${API_BASE}/features/${id}/`, {
    method: 'DELETE',
  })
  if (!response.ok && response.status !== 204) throw new Error('Failed to delete feature')
  return true
}


// ============== GEOMETRY HELPERS ==============

/**
 * Convert Leaflet layer to simple coordinate format
 * Stores coordinates as [lat, lng] arrays (Leaflet's native format)
 * This avoids CRS transformation issues
 */
export function layerToGeometry(layer, featureType) {
  if (featureType === 'circle') {
    const center = layer.getLatLng()
    const radius = layer.getRadius()
    return {
      type: 'circle',
      center: [center.lat, center.lng],
      radius: radius,
    }
  }
  
  if (featureType === 'polygon' || featureType === 'rectangle') {
    // Get coordinates as [lat, lng] pairs
    const latlngs = layer.getLatLngs()[0] // Get outer ring
    const coords = latlngs.map(ll => [ll.lat, ll.lng])
    return {
      type: 'polygon',
      coordinates: coords,
    }
  }
  
  if (featureType === 'line') {
    const latlngs = layer.getLatLngs()
    const coords = latlngs.map(ll => [ll.lat, ll.lng])
    return {
      type: 'line',
      coordinates: coords,
    }
  }
  
  return null
}

// Keep old function for backwards compatibility
export function layerToGeoJSON(layer, featureType) {
  return layerToGeometry(layer, featureType)
}

/**
 * Determine feature type from Leaflet layer
 */
export function getFeatureType(layer) {
  if (layer._mRadius !== undefined) return 'circle'
  if (layer._latlngs) {
    // Check if it's a polygon or line
    const latlngs = layer._latlngs
    if (Array.isArray(latlngs[0]) && Array.isArray(latlngs[0][0])) {
      return 'polygon' // Multi-polygon
    }
    if (Array.isArray(latlngs[0])) {
      return 'polygon' // Simple polygon (closed ring)
    }
    return 'line'
  }
  return 'line'
}

/**
 * Create style object from layer options
 */
export function getLayerStyle(layer) {
  return {
    color: layer.options?.color || '#3388ff',
    weight: layer.options?.weight || 3,
    opacity: layer.options?.opacity || 1,
    fillColor: layer.options?.fillColor || layer.options?.color || '#3388ff',
    fillOpacity: layer.options?.fillOpacity || 0.2,
  }
}

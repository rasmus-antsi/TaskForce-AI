/**
 * FeatureLayer - Renders saved features (lines, polygons, circles) on the map
 * Uses React-Leaflet components for proper rendering with custom CRS
 */

import { Circle, Polygon, Polyline, Popup } from 'react-leaflet'

const DEFAULT_STYLES = {
  line: { color: '#00ff00', weight: 3, opacity: 0.9 },
  polygon: { color: '#00ff00', weight: 2, opacity: 0.9, fillColor: '#00ff00', fillOpacity: 0.2 },
  rectangle: { color: '#ff6600', weight: 2, opacity: 0.9, fillColor: '#ff6600', fillOpacity: 0.2 },
  circle: { color: '#ffcc00', weight: 2, opacity: 0.9, fillColor: '#ffcc00', fillOpacity: 0.2 },
}

function FeaturePopup({ feature, onDelete }) {
  return (
    <Popup>
      <div style={{ fontFamily: 'monospace', fontSize: '12px', minWidth: '150px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{feature.name}</div>
        <div style={{ color: '#666', marginBottom: '8px' }}>{feature.feature_type_display}</div>
        <button
          onClick={() => onDelete?.(feature.id)}
          style={{
            width: '100%',
            padding: '4px 8px',
            background: '#600',
            color: '#fff',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          Delete
        </button>
      </div>
    </Popup>
  )
}

function FeatureItem({ feature, onDelete }) {
  const geom = feature.geometry
  const style = { ...DEFAULT_STYLES[feature.feature_type], ...feature.style }

  // Handle different geometry formats
  if (feature.feature_type === 'circle' || geom?.type === 'circle') {
    // New format: { type: 'circle', center: [lat, lng], radius }
    // Old format: { type: 'Point', coordinates: [lng, lat], properties: { radius } }
    let center, radius
    if (geom.center) {
      center = geom.center
      radius = geom.radius
    } else if (geom.coordinates) {
      center = [geom.coordinates[1], geom.coordinates[0]]
      radius = geom.properties?.radius || 1000
    } else {
      console.warn('Invalid circle geometry:', geom)
      return null
    }
    
    return (
      <Circle center={center} radius={radius} pathOptions={style}>
        <FeaturePopup feature={feature} onDelete={onDelete} />
      </Circle>
    )
  }

  if (feature.feature_type === 'polygon' || feature.feature_type === 'rectangle' || geom?.type === 'polygon') {
    // New format: { type: 'polygon', coordinates: [[lat, lng], ...] }
    // Old format: { type: 'Polygon', coordinates: [[[lng, lat], ...]] }
    let positions
    if (geom.type === 'Polygon') {
      // GeoJSON format - convert [lng, lat] to [lat, lng]
      positions = geom.coordinates[0].map(c => [c[1], c[0]])
    } else {
      positions = geom.coordinates
    }
    
    return (
      <Polygon positions={positions} pathOptions={style}>
        <FeaturePopup feature={feature} onDelete={onDelete} />
      </Polygon>
    )
  }

  if (feature.feature_type === 'line' || geom?.type === 'line') {
    // New format: { type: 'line', coordinates: [[lat, lng], ...] }
    // Old format: { type: 'LineString', coordinates: [[lng, lat], ...] }
    let positions
    if (geom.type === 'LineString') {
      positions = geom.coordinates.map(c => [c[1], c[0]])
    } else {
      positions = geom.coordinates
    }
    
    return (
      <Polyline positions={positions} pathOptions={style}>
        <FeaturePopup feature={feature} onDelete={onDelete} />
      </Polyline>
    )
  }

  console.warn('Unknown feature type:', feature)
  return null
}

export default function FeatureLayer({ features = [], onDelete }) {
  return (
    <>
      {features.map(feature => (
        <FeatureItem key={feature.id} feature={feature} onDelete={onDelete} />
      ))}
    </>
  )
}

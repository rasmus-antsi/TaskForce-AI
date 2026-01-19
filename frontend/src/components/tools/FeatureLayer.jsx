/**
 * FeatureLayer - Renders saved features (lines, polygons, circles) on the map
 * Uses React-Leaflet components for proper rendering with custom CRS
 */

import { Circle, Polygon, Polyline, Popup, Marker, useMap } from 'react-leaflet'
import { DivIcon } from 'leaflet'
import { calculatePathDistance, formatDistance, getFeatureCenter, calculateBearing } from '../../utils/coordinates'
import FeaturePopup from './FeaturePopup'

const DEFAULT_STYLES = {
  line: { color: '#00ff00', weight: 3, opacity: 0.9 },
  polygon: { color: '#00ff00', weight: 2, opacity: 0.9, fillColor: '#00ff00', fillOpacity: 0.2 },
  rectangle: { color: '#ff6600', weight: 2, opacity: 0.9, fillColor: '#ff6600', fillOpacity: 0.2 },
  circle: { color: '#ffcc00', weight: 2, opacity: 0.9, fillColor: '#ffcc00', fillOpacity: 0.2 },
  arrow: { color: '#ffe66d', weight: 3, opacity: 0.9 },
}

// Create label icon for center of features
function createLabelIcon(text, color = '#fff') {
  return new DivIcon({
    className: 'feature-label',
    html: `<div style="
      background: rgba(0, 0, 0, 0.8);
      color: ${color};
      padding: 4px 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 11px;
      font-weight: bold;
      white-space: nowrap;
      border: 1px solid rgba(255, 255, 255, 0.3);
      pointer-events: none;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    ">${text}</div>`,
    iconSize: [100, 20],
    iconAnchor: [50, 10],
  })
}

// Create distance label icon for lines with rotation
function createDistanceIcon(distance, bearing) {
  return new DivIcon({
    className: 'distance-label',
    html: `<div style="
      background: rgba(0, 0, 0, 0.9);
      color: #0ff;
      padding: 3px 6px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 10px;
      font-weight: bold;
      white-space: nowrap;
      border: 1px solid #0ff;
      pointer-events: none;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
      transform: rotate(${bearing}deg);
      transform-origin: center;
      display: inline-block;
    ">${formatDistance(distance)}</div>`,
    iconSize: [100, 20],
    iconAnchor: [50, 10],
  })
}

function FeatureItem({ feature, onUpdate, onDelete }) {
  const map = useMap()
  const geom = feature.geometry
  const style = { ...DEFAULT_STYLES[feature.feature_type], ...feature.style }
  
  // Apply dash array for border styles
  if (style.dashArray && style.dashArray !== 'solid') {
    style.dashArray = style.dashArray === 'dashed' ? '10, 5' : '2, 5'
  }

  // Get center for label
  const center = getFeatureCenter(geom, feature.feature_type)

  // Handle different geometry formats
  if (feature.feature_type === 'circle' || geom?.type === 'circle') {
    let centerPos, radius
    if (geom.center) {
      centerPos = geom.center
      radius = geom.radius
    } else if (geom.coordinates) {
      centerPos = [geom.coordinates[1], geom.coordinates[0]]
      radius = geom.properties?.radius || 1000
    } else {
      console.warn('Invalid circle geometry:', geom)
      return null
    }
    
    const labelIcon = createLabelIcon(feature.name, style.color)
    
    return (
      <>
        <Circle center={centerPos} radius={radius} pathOptions={style}>
          <Popup>
            <FeaturePopup feature={feature} onSave={onUpdate} onDelete={onDelete} />
          </Popup>
        </Circle>
        {centerPos && (
          <Marker position={centerPos} icon={labelIcon} interactive={false} />
        )}
      </>
    )
  }

  if (feature.feature_type === 'polygon' || feature.feature_type === 'rectangle' || geom?.type === 'polygon') {
    let positions
    if (geom.type === 'Polygon') {
      positions = geom.coordinates[0].map(c => [c[1], c[0]])
    } else {
      positions = geom.coordinates
    }
    
    const labelIcon = center ? createLabelIcon(feature.name, style.color) : null
    
    return (
      <>
        <Polygon positions={positions} pathOptions={style}>
          <Popup>
            <FeaturePopup feature={feature} onSave={onUpdate} onDelete={onDelete} />
          </Popup>
        </Polygon>
        {center && labelIcon && (
          <Marker position={center} icon={labelIcon} interactive={false} />
        )}
      </>
    )
  }

  if (feature.feature_type === 'line' || feature.feature_type === 'arrow' || geom?.type === 'line') {
    let positions
    if (geom.type === 'LineString') {
      positions = geom.coordinates.map(c => [c[1], c[0]])
    } else {
      positions = geom.coordinates
    }
    
    // Store original positions for distance calculation
    const originalPositions = [...positions]
    let arrowPositions = positions
    
    // For arrows, add arrowhead
    if (feature.feature_type === 'arrow' && positions.length >= 2) {
      const [p1, p2] = positions.slice(-2) // Get last two points
      const dx = p2[1] - p1[1]
      const dy = p2[0] - p1[0]
      const angle = Math.atan2(dy, dx)
      const arrowLength = 0.0005 // ~50m in degrees
      const arrowAngle = Math.PI / 6 // 30 degrees
      
      const arrowHead1 = [
        p2[0] - arrowLength * Math.cos(angle - arrowAngle),
        p2[1] - arrowLength * Math.sin(angle - arrowAngle),
      ]
      const arrowHead2 = [
        p2[0] - arrowLength * Math.cos(angle + arrowAngle),
        p2[1] - arrowLength * Math.sin(angle + arrowAngle),
      ]
      
      arrowPositions = [...positions.slice(0, -1), p2, arrowHead1, p2, arrowHead2]
    }
    
    // Calculate distance for label (use original positions)
    const distance = calculatePathDistance(originalPositions)
    const midIndex = Math.floor(originalPositions.length / 2)
    const midPoint = originalPositions[midIndex]
    
    // Calculate bearing for rotation
    let bearing = 0
    if (originalPositions.length >= 2) {
      const [p1, p2] = originalPositions.length === 2 
        ? originalPositions 
        : [originalPositions[0], originalPositions[originalPositions.length - 1]]
      bearing = calculateBearing(p1[0], p1[1], p2[0], p2[1])
    }
    
    const distanceIcon = midPoint ? createDistanceIcon(distance, bearing) : null
    
    return (
      <>
        <Polyline positions={arrowPositions} pathOptions={style}>
          <Popup>
            <FeaturePopup feature={feature} onSave={onUpdate} onDelete={onDelete} />
          </Popup>
        </Polyline>
        {midPoint && distanceIcon && (feature.feature_type === 'line' || feature.feature_type === 'arrow') && (
          <Marker position={midPoint} icon={distanceIcon} interactive={false} />
        )}
      </>
    )
  }

  console.warn('Unknown feature type:', feature)
  return null
}

export default function FeatureLayer({ features = [], onUpdate, onDelete }) {
  return (
    <>
      {features.map(feature => (
        <FeatureItem key={feature.id} feature={feature} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </>
  )
}

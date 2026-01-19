/**
 * FeaturePopup - Enhanced edit popup for drawn features
 */

import { useState, useEffect } from 'react'
import { formatLatLon, latLonToMGRS, formatUTM, latLonToUTM, calculatePolygonArea, squareMetersToHectares, calculatePathDistance, formatDistance } from '../../utils/coordinates'
import { getFeatureCenter } from '../../utils/coordinates'

const COLORS = [
  '#00ff00', // Green
  '#ff0000', // Red
  '#0088ff', // Blue
  '#ffcc00', // Yellow
  '#ff6600', // Orange
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#ffffff', // White
  '#000000', // Black
]

const BORDER_STYLES = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
]

const styles = {
  container: {
    fontFamily: 'monospace',
    fontSize: '12px',
    minWidth: '280px',
    maxWidth: '320px',
  },
  field: {
    marginBottom: '10px',
  },
  label: {
    color: '#888',
    fontSize: '10px',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: '6px 8px',
    background: '#1a1a1a',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '12px',
    boxSizing: 'border-box',
  },
  slider: {
    width: '100%',
    marginTop: '4px',
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '6px',
    marginTop: '4px',
  },
  colorBtn: {
    width: '32px',
    height: '32px',
    border: '2px solid transparent',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  colorBtnActive: {
    border: '2px solid #fff',
    boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
  },
  select: {
    width: '100%',
    padding: '6px 8px',
    background: '#1a1a1a',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '12px',
    cursor: 'pointer',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    borderBottom: '1px solid #333',
    fontSize: '11px',
  },
  infoLabel: {
    color: '#888',
  },
  infoValue: {
    color: '#fff',
    fontFamily: 'monospace',
  },
  actions: {
    display: 'flex',
    gap: '6px',
    marginTop: '12px',
  },
  btn: {
    flex: 1,
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  saveBtn: {
    background: '#0a0',
    color: '#fff',
  },
  deleteBtn: {
    background: '#600',
    color: '#fff',
  },
}

export default function FeaturePopup({ feature, onSave, onDelete }) {
  const [name, setName] = useState(feature.name || '')
  const [color, setColor] = useState(feature.style?.color || '#00ff00')
  const [opacity, setOpacity] = useState(feature.style?.opacity ?? 0.9)
  const [fillOpacity, setFillOpacity] = useState(feature.style?.fillOpacity ?? 0.2)
  const [borderStyle, setBorderStyle] = useState(feature.style?.dashArray || 'solid')

  useEffect(() => {
    setName(feature.name || '')
    setColor(feature.style?.color || '#00ff00')
    setOpacity(feature.style?.opacity ?? 0.9)
    setFillOpacity(feature.style?.fillOpacity ?? 0.2)
    setBorderStyle(feature.style?.dashArray || 'solid')
  }, [feature])

  // Calculate center for coordinates
  const center = getFeatureCenter(feature.geometry, feature.feature_type)
  const centerCoords = center ? { lat: center[0], lon: center[1] } : null

  // Calculate area for polygons/circles
  let area = null
  if (feature.feature_type === 'polygon' || feature.feature_type === 'rectangle') {
    const coords = feature.geometry.coordinates
    if (coords && coords.length > 0) {
      // Handle both new format [lat, lng] and old GeoJSON format [lng, lat]
      let points
      if (feature.geometry.type === 'Polygon') {
        // Old GeoJSON format
        points = coords[0].map(c => [c[1], c[0]]) // Convert [lng, lat] to [lat, lng]
      } else {
        // New format - already [lat, lng]
        points = coords.map(c => Array.isArray(c[0]) ? [c[0][0], c[0][1]] : [c[0], c[1]])
      }
      // Ensure polygon is closed
      if (points.length > 0 && (points[0][0] !== points[points.length - 1][0] || points[0][1] !== points[points.length - 1][1])) {
        points.push([points[0][0], points[0][1]])
      }
      const areaM2 = calculatePolygonArea(points)
      area = squareMetersToHectares(areaM2)
    }
  } else if (feature.feature_type === 'circle') {
    const radius = feature.geometry.radius || 1000
    area = squareMetersToHectares(Math.PI * radius * radius)
  }

  // Calculate distance for lines
  let distance = null
  if (feature.feature_type === 'line') {
    const coords = feature.geometry.coordinates
    if (coords && coords.length > 0) {
      const points = (feature.geometry.type === 'LineString' 
        ? coords.map(c => [c[1], c[0]])
        : coords
      )
      distance = calculatePathDistance(points)
    }
  }

  const handleSave = () => {
    const dashArray = borderStyle === 'dashed' ? '10, 5' : borderStyle === 'dotted' ? '2, 5' : null
    
    onSave?.({
      ...feature,
      name,
      style: {
        ...feature.style,
        color,
        fillColor: color,
        opacity,
        fillOpacity,
        dashArray,
      },
    })
  }

  const handleDelete = () => {
    if (confirm(`Delete "${feature.name}"?`)) {
      onDelete?.(feature.id)
    }
  }

  return (
    <div style={styles.container}>
      {/* Name field */}
      <div style={styles.field}>
        <div style={styles.label}>Name</div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
          placeholder="Feature name"
        />
      </div>

      {/* Type display */}
      <div style={styles.field}>
        <div style={styles.label}>Type</div>
        <div style={{ color: '#888', fontSize: '11px' }}>{feature.feature_type_display || feature.feature_type}</div>
      </div>

      {/* Coordinates */}
      {centerCoords && (
        <div style={styles.field}>
          <div style={styles.label}>Coordinates</div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Lat/Lon:</span>
            <span style={styles.infoValue}>{formatLatLon(centerCoords.lat, centerCoords.lon)}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>MGRS:</span>
            <span style={styles.infoValue}>{latLonToMGRS(centerCoords.lat, centerCoords.lon)}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>UTM:</span>
            <span style={styles.infoValue}>{formatUTM(latLonToUTM(centerCoords.lat, centerCoords.lon))}</span>
          </div>
        </div>
      )}

      {/* Area (for polygons/circles) */}
      {area !== null && (
        <div style={styles.field}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Area:</span>
            <span style={styles.infoValue}>{area.toFixed(2)} ha</span>
          </div>
        </div>
      )}

      {/* Distance (for lines) */}
      {distance !== null && (
        <div style={styles.field}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Distance:</span>
            <span style={styles.infoValue}>{formatDistance(distance)}</span>
          </div>
        </div>
      )}

      {/* Color picker */}
      <div style={styles.field}>
        <div style={styles.label}>Color</div>
        <div style={styles.colorGrid}>
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                ...styles.colorBtn,
                background: c,
                ...(color === c ? styles.colorBtnActive : {}),
              }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div style={styles.field}>
        <div style={styles.label}>Border Opacity: {Math.round(opacity * 100)}%</div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          style={styles.slider}
        />
      </div>

      {/* Fill Opacity (for polygons/circles) */}
      {(feature.feature_type === 'polygon' || feature.feature_type === 'rectangle' || feature.feature_type === 'circle') && (
        <div style={styles.field}>
          <div style={styles.label}>Fill Opacity: {Math.round(fillOpacity * 100)}%</div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={fillOpacity}
            onChange={(e) => setFillOpacity(parseFloat(e.target.value))}
            style={styles.slider}
          />
        </div>
      )}

      {/* Border Style */}
      <div style={styles.field}>
        <div style={styles.label}>Border Style</div>
        <select
          value={borderStyle}
          onChange={(e) => setBorderStyle(e.target.value)}
          style={styles.select}
        >
          {BORDER_STYLES.map(style => (
            <option key={style.value} value={style.value}>{style.label}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button 
          onClick={handleSave}
          style={{ ...styles.btn, ...styles.saveBtn }}
        >
          Save
        </button>
        <button 
          onClick={handleDelete}
          style={{ ...styles.btn, ...styles.deleteBtn }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

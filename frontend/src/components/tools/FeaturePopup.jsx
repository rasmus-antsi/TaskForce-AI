/**
 * FeaturePopup - Enhanced edit popup for drawn features
 * Premium military-style design with Tailwind CSS
 */

import { useState, useEffect } from 'react'
import { formatLatLon, latLonToMGRS, formatUTM, latLonToUTM, calculatePolygonArea, squareMetersToHectares, calculatePathDistance, formatDistance, calculatePolygonPerimeter } from '../../utils/coordinates'
import { getFeatureCenter } from '../../utils/coordinates'

const COLORS = [
  '#00ff00', '#ff0000', '#0088ff', '#ffcc00', '#ff6600',
  '#ff00ff', '#00ffff', '#ffffff', '#000000',
]

const BORDER_STYLES = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
]

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
      let points
      if (feature.geometry.type === 'Polygon') {
        points = coords[0].map(c => [c[1], c[0]])
      } else {
        points = coords.map(c => Array.isArray(c[0]) ? [c[0][0], c[0][1]] : [c[0], c[1]])
      }
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
  if (feature.feature_type === 'line' || feature.feature_type === 'arrow') {
    const coords = feature.geometry.coordinates
    if (coords && coords.length > 0) {
      const points = (feature.geometry.type === 'LineString' 
        ? coords.map(c => [c[1], c[0]])
        : coords
      )
      distance = calculatePathDistance(points)
    }
  }

  // Calculate perimeter for polygons
  let perimeter = null
  if (feature.feature_type === 'polygon' || feature.feature_type === 'rectangle') {
    const coords = feature.geometry.coordinates
    if (coords && coords.length > 0) {
      let points
      if (feature.geometry.type === 'Polygon') {
        points = coords[0].map(c => [c[1], c[0]])
      } else {
        points = coords.map(c => Array.isArray(c[0]) ? [c[0][0], c[0][1]] : [c[0], c[1]])
      }
      perimeter = calculatePolygonPerimeter(points)
    }
  } else if (feature.feature_type === 'circle') {
    const radius = feature.geometry.radius || 1000
    perimeter = 2 * Math.PI * radius
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
    <div className="font-mono text-xs min-w-[280px] max-w-[320px] bg-[#0a0e14]/95 backdrop-blur-xl border border-white/8 rounded-lg p-3 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      {/* Name field */}
      <div className="mb-2.5">
        <div className="text-[#5f6368] text-[10px] mb-1 uppercase tracking-wide font-medium">Name</div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-2 py-1.5 bg-[#0a0e14] text-white border border-white/8 rounded font-mono text-xs outline-none focus:border-[#00b4d8] transition-colors"
          placeholder="Feature name"
        />
      </div>

      {/* Type display */}
      <div className="mb-2.5">
        <div className="text-[#5f6368] text-[10px] mb-1 uppercase tracking-wide font-medium">Type</div>
        <div className="text-[#5f6368] text-[11px]">{feature.feature_type_display || feature.feature_type}</div>
      </div>

      {/* Coordinates */}
      {centerCoords && (
        <div className="mb-2.5">
          <div className="text-[#5f6368] text-[10px] mb-1 uppercase tracking-wide font-medium">Coordinates</div>
          <div className="flex justify-between py-1 border-b border-white/8 text-[11px]">
            <span className="text-[#5f6368]">Lat/Lon:</span>
            <span className="text-white font-mono">{formatLatLon(centerCoords.lat, centerCoords.lon)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/8 text-[11px]">
            <span className="text-[#5f6368]">MGRS:</span>
            <span className="text-white font-mono">{latLonToMGRS(centerCoords.lat, centerCoords.lon)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/8 text-[11px]">
            <span className="text-[#5f6368]">UTM:</span>
            <span className="text-white font-mono">{formatUTM(latLonToUTM(centerCoords.lat, centerCoords.lon))}</span>
          </div>
        </div>
      )}

      {/* Area (for polygons/circles) */}
      {area !== null && (
        <div className="mb-2.5">
          <div className="flex justify-between py-1 border-b border-white/8 text-[11px]">
            <span className="text-[#5f6368]">Area:</span>
            <span className="text-white font-mono">{area.toFixed(2)} ha</span>
          </div>
          {perimeter !== null && (
            <div className="flex justify-between py-1 border-b border-white/8 text-[11px]">
              <span className="text-[#5f6368]">Perimeter:</span>
              <span className="text-white font-mono">{formatDistance(perimeter)}</span>
            </div>
          )}
        </div>
      )}

      {/* Distance (for lines) */}
      {distance !== null && (
        <div className="mb-2.5">
          <div className="flex justify-between py-1 border-b border-white/8 text-[11px]">
            <span className="text-[#5f6368]">Distance:</span>
            <span className="text-white font-mono">{formatDistance(distance)}</span>
          </div>
        </div>
      )}

      {/* Color picker */}
      <div className="mb-2.5">
        <div className="text-[#5f6368] text-[10px] mb-1 uppercase tracking-wide font-medium">Color</div>
        <div className="grid grid-cols-5 gap-1.5 mt-1">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`
                w-8 h-8 rounded border-2 transition-all
                ${color === c 
                  ? 'border-white shadow-[0_0_8px_rgba(255,255,255,0.5)]' 
                  : 'border-transparent hover:border-white/30'
                }
              `}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div className="mb-2.5">
        <div className="text-[#5f6368] text-[10px] mb-1 uppercase tracking-wide font-medium">
          Border Opacity: {Math.round(opacity * 100)}%
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-full mt-1"
        />
      </div>

      {/* Fill Opacity (for polygons/circles) */}
      {(feature.feature_type === 'polygon' || feature.feature_type === 'rectangle' || feature.feature_type === 'circle') && (
        <div className="mb-2.5">
          <div className="text-[#5f6368] text-[10px] mb-1 uppercase tracking-wide font-medium">
            Fill Opacity: {Math.round(fillOpacity * 100)}%
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={fillOpacity}
            onChange={(e) => setFillOpacity(parseFloat(e.target.value))}
            className="w-full mt-1"
          />
        </div>
      )}

      {/* Border Style */}
      <div className="mb-2.5">
        <div className="text-[#5f6368] text-[10px] mb-1 uppercase tracking-wide font-medium">Border Style</div>
        <select
          value={borderStyle}
          onChange={(e) => setBorderStyle(e.target.value)}
          className="w-full px-2 py-1.5 bg-[#0a0e14] text-white border border-white/8 rounded font-mono text-xs cursor-pointer outline-none focus:border-[#00b4d8] transition-colors"
        >
          {BORDER_STYLES.map(style => (
            <option key={style.value} value={style.value}>{style.label}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 mt-3">
        <button 
          onClick={handleSave}
          className="flex-1 px-3 py-2 bg-gradient-to-br from-[#34d399] to-[#10b981] border-none rounded cursor-pointer font-mono text-[11px] font-bold text-white hover:shadow-[0_0_12px_rgba(52,211,153,0.4)] transition-all"
        >
          Save
        </button>
        <button 
          onClick={handleDelete}
          className="flex-1 px-3 py-2 bg-gradient-to-br from-[#ef4444] to-[#dc2626] border-none rounded cursor-pointer font-mono text-[11px] font-bold text-white hover:shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

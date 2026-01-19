import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { latLonToMGRS } from '../utils/coordinates'

// Grid line styles
const GRID_STYLES = {
  100000: { color: '#ff0000', weight: 3, opacity: 0.9 }, // 100km - Red
  10000: { color: '#ffcc00', weight: 2, opacity: 0.8 }, // 10km - Yellow
  1000: { color: '#000000', weight: 1, opacity: 0.4 }, // 1km - Black, lower opacity
}

// Label styles for each grid size
const LABEL_STYLES = {
  100000: {
    fontSize: '12px',
    padding: '2px 5px',
    background: 'rgba(255,0,0,0.9)',
    color: '#fff',
    border: '1px solid #ff0000',
  },
  10000: {
    fontSize: '10px',
    padding: '1px 4px',
    background: 'rgba(255,204,0,0.9)',
    color: '#000',
    border: '1px solid #cc9900',
  },
  1000: {
    fontSize: '9px',
    padding: '1px 3px',
    background: 'rgba(0,0,0,0.8)',
    color: '#fff',
    border: '1px solid #333',
  },
}

function MGRSGridInner({ gridLevel = 100000 }) {
  const map = useMap()
  const gridLayerRef = useRef(null)
  const labelLayerRef = useRef(null)

  useEffect(() => {
    if (!gridLayerRef.current) {
      gridLayerRef.current = L.layerGroup().addTo(map)
    }
    if (!labelLayerRef.current) {
      labelLayerRef.current = L.layerGroup().addTo(map)
    }

    const updateGrid = () => {
      gridLayerRef.current.clearLayers()
      labelLayerRef.current.clearLayers()

      const bounds = map.getBounds()
      const zoom = map.getZoom()
      
      // Check minimum zoom for each level
      const minZoom = { 100000: 3, 10000: 5, 1000: 8 }
      if (zoom < minZoom[gridLevel]) return

      const style = GRID_STYLES[gridLevel]
      const labelStyle = LABEL_STYLES[gridLevel]

      const south = bounds.getSouth()
      const north = bounds.getNorth()
      const west = bounds.getWest()
      const east = bounds.getEast()
      const centerLat = (south + north) / 2

      // Calculate grid spacing in degrees
      const degPerMeter = 1 / 111000
      const latCorrection = Math.cos(centerLat * Math.PI / 180)
      const spacingLat = gridLevel * degPerMeter
      const spacingLon = gridLevel * degPerMeter / latCorrection

      // Limit number of labels for performance
      const maxLabels = gridLevel === 1000 ? 30 : 50

      // Draw vertical lines (longitude) with labels
      const startLon = Math.floor(west / spacingLon) * spacingLon
      let labelCount = 0
      for (let lon = startLon; lon <= east; lon += spacingLon) {
        // Draw line
        const line = L.polyline(
          [[south, lon], [north, lon]],
          { ...style, interactive: false }
        )
        gridLayerRef.current.addLayer(line)

        // Add labels along the line (at intervals)
        if (labelCount < maxLabels) {
          const labelLat = south + (north - south) * 0.1 // Near bottom
          const mgrsRaw = latLonToMGRS(labelLat, lon + 0.0001, getPrecision(gridLevel), false)
          if (mgrsRaw && mgrsRaw !== 'Invalid') {
            const labelText = getEastingLabel(mgrsRaw, gridLevel)
            if (labelText) {
              addLabel(labelLat, lon, labelText, labelStyle)
              labelCount++
            }
          }
        }
      }

      // Draw horizontal lines (latitude) with labels
      const startLat = Math.floor(south / spacingLat) * spacingLat
      labelCount = 0
      for (let lat = startLat; lat <= north; lat += spacingLat) {
        // Draw line
        const line = L.polyline(
          [[lat, west], [lat, east]],
          { ...style, interactive: false }
        )
        gridLayerRef.current.addLayer(line)

        // Add labels along the line
        if (labelCount < maxLabels) {
          const labelLon = west + (east - west) * 0.05 // Near left edge
          const mgrsRaw = latLonToMGRS(lat + 0.0001, labelLon, getPrecision(gridLevel), false)
          if (mgrsRaw && mgrsRaw !== 'Invalid') {
            const labelText = getNorthingLabel(mgrsRaw, gridLevel)
            if (labelText) {
              addLabel(lat, labelLon, labelText, labelStyle)
              labelCount++
            }
          }
        }
      }

      // Add zone labels in center for 100km grid
      if (gridLevel === 100000) {
        for (let lat = startLat; lat <= north; lat += spacingLat) {
          for (let lon = startLon; lon <= east; lon += spacingLon) {
            const cLat = lat + spacingLat / 2
            const cLon = lon + spacingLon / 2
            
            if (cLat >= south && cLat <= north && cLon >= west && cLon <= east) {
              const mgrsRaw = latLonToMGRS(cLat, cLon, 0, false)
              if (mgrsRaw && mgrsRaw !== 'Invalid' && mgrsRaw.length >= 5) {
                const gzd = mgrsRaw.substring(0, 3)
                const sq = mgrsRaw.substring(3, 5)
                
                const icon = L.divIcon({
                  className: 'mgrs-zone-label',
                  iconSize: [80, 35],
                  iconAnchor: [40, 17],
                  html: `<div style="
                    background: rgba(0,0,0,0.85);
                    color: #ff0000;
                    padding: 6px 10px;
                    font-family: monospace;
                    font-size: 16px;
                    font-weight: bold;
                    border-radius: 4px;
                    border: 2px solid #ff0000;
                    text-align: center;
                    text-shadow: 0 0 10px #ff0000;
                  ">${gzd} ${sq}</div>`,
                })
                labelLayerRef.current.addLayer(
                  L.marker([cLat, cLon], { icon, interactive: false })
                )
              }
            }
          }
        }
      }
    }

    function getPrecision(size) {
      if (size === 100000) return 0
      if (size === 10000) return 1
      if (size === 1000) return 2
      return 3
    }

    function getEastingLabel(mgrsRaw, size) {
      if (!mgrsRaw || mgrsRaw.length < 5) return null
      if (size === 100000) {
        return mgrsRaw.substring(3, 5)
      }
      const coords = mgrsRaw.substring(5)
      if (!coords) return null
      const half = coords.length / 2
      return coords.substring(0, half).padStart(half, '0')
    }

    function getNorthingLabel(mgrsRaw, size) {
      if (!mgrsRaw || mgrsRaw.length < 5) return null
      if (size === 100000) {
        return mgrsRaw.substring(3, 5)
      }
      const coords = mgrsRaw.substring(5)
      if (!coords) return null
      const half = coords.length / 2
      return coords.substring(half).padStart(half, '0')
    }

    function addLabel(lat, lon, text, style) {
      const icon = L.divIcon({
        className: 'mgrs-grid-label',
        iconSize: [40, 18],
        iconAnchor: [20, 9],
        html: `<div style="
          background: ${style.background};
          color: ${style.color};
          padding: ${style.padding};
          font-family: monospace;
          font-size: ${style.fontSize};
          font-weight: bold;
          border-radius: 2px;
          border: ${style.border};
          white-space: nowrap;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.5);
        ">${text}</div>`,
      })
      labelLayerRef.current.addLayer(
        L.marker([lat, lon], { icon, interactive: false })
      )
    }

    map.on('moveend', updateGrid)
    map.on('zoomend', updateGrid)
    updateGrid()

    return () => {
      map.off('moveend', updateGrid)
      map.off('zoomend', updateGrid)
      if (gridLayerRef.current) {
        gridLayerRef.current.clearLayers()
      }
      if (labelLayerRef.current) {
        labelLayerRef.current.clearLayers()
      }
    }
  }, [map, gridLevel])

  return null
}

export default function MGRSGrid(props) {
  return <MGRSGridInner {...props} />
}

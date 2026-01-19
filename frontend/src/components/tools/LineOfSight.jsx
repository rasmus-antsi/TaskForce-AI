/**
 * LineOfSight - Raytracing visibility tool from a single point
 * Premium military-style design with Tailwind CSS
 */

import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

const API_BASE = '/api'
const RADIUS = 1000 // 1km radius

export default function LineOfSight({ isActive, onClose, onFeatureSaved }) {
  const map = useMap()
  const [observer, setObserver] = useState(null)
  const [visibilityData, setVisibilityData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [observerHeight, setObserverHeight] = useState(2.0)
  const [isSaved, setIsSaved] = useState(false)
  const layerRef = useRef(null)
  const observerMarkerRef = useRef(null)
  const circleRef = useRef(null)
  const visibilityLayerRef = useRef(null)

  useEffect(() => {
    if (!isActive) {
      cleanup()
      return
    }

    layerRef.current = L.layerGroup().addTo(map)

    const handleClick = async (e) => {
      const { lat, lng } = e.latlng
      
      if (!observer) {
        // Set observer point
        setObserver([lat, lng])
        
        observerMarkerRef.current = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'los-observer',
            html: `<div style="
              width: 20px;
              height: 20px;
              background: #34d399;
              border: 3px solid #fff;
              border-radius: 50%;
              box-shadow: 0 0 12px rgba(52, 211, 153, 0.8), 0 2px 8px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
            "><span style="font-size: 12px; font-weight: bold; color: #000;">O</span></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        }).addTo(map)
        
        // Draw 1km circle
        circleRef.current = L.circle([lat, lng], {
          radius: RADIUS,
          color: '#34d399',
          weight: 2,
          opacity: 0.8,
          fillColor: '#34d399',
          fillOpacity: 0.1,
        }).addTo(layerRef.current)
        
        // Start raytracing
        await performRaytrace([lat, lng])
      }
    }

    map.on('click', handleClick)

    return () => {
      map.off('click', handleClick)
    }
  }, [isActive, observer, map, observerHeight])

  const cleanup = () => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
    }
    if (observerMarkerRef.current) {
      map.removeLayer(observerMarkerRef.current)
      observerMarkerRef.current = null
    }
    if (circleRef.current) {
      if (layerRef.current) {
        layerRef.current.removeLayer(circleRef.current)
      }
      circleRef.current = null
    }
    if (visibilityLayerRef.current) {
      map.removeLayer(visibilityLayerRef.current)
      visibilityLayerRef.current = null
    }
    setObserver(null)
    setVisibilityData(null)
    setIsSaved(false)
  }

  const performRaytrace = async (observerPoint) => {
    setLoading(true)
    try {
      // Add timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch(`${API_BASE}/elevation/raytrace/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observer: observerPoint,
          radius: RADIUS,
          observer_height: observerHeight,
          // Backend uses optimized fixed values: 16 rays, 5 samples each
        }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        setVisibilityData(data)
        visualizeRaytrace(data)
      } else {
        const errorText = await response.text()
        console.error('Raytrace failed:', errorText)
        alert(`Raytrace failed: ${errorText}`)
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('Raytrace timeout')
        alert('Raytrace calculation timed out. Try reducing the radius or check your connection.')
      } else {
        console.error('Raytrace error:', err)
        alert(`Raytrace error: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const visualizeRaytrace = (data) => {
    if (!layerRef.current || !observer) return
    
    // Create layer for visibility visualization
    if (visibilityLayerRef.current) {
      map.removeLayer(visibilityLayerRef.current)
    }
    visibilityLayerRef.current = L.layerGroup().addTo(map)
    
    const [obsLat, obsLng] = observer
    const numRays = data.visibility_map.length
    
    // Draw pie-slice sectors between each pair of rays
    data.visibility_map.forEach((ray, rayIdx) => {
      const nextRay = data.visibility_map[(rayIdx + 1) % numRays]
      
      // Find first obstruction in this ray
      const obstructionDist = ray.first_obstruction || RADIUS
      const nextObstructionDist = nextRay.first_obstruction || RADIUS
      
      // Get the outermost point for this ray and next ray
      const rayEnd = ray.points[ray.points.length - 1]
      const nextRayEnd = nextRay.points[nextRay.points.length - 1]
      
      // Draw visible sector (pie slice from observer)
      const visibleSector = [
        [obsLat, obsLng],
        [rayEnd.lat, rayEnd.lng],
        [nextRayEnd.lat, nextRayEnd.lng],
      ]
      
      // Determine if this sector is mostly visible or obstructed
      const avgObstruction = (obstructionDist + nextObstructionDist) / 2
      const isVisible = avgObstruction > RADIUS * 0.5
      
      L.polygon(visibleSector, {
        color: isVisible ? '#34d399' : '#ef4444',
        weight: 1,
        opacity: 0.6,
        fillColor: isVisible ? '#34d399' : '#ef4444',
        fillOpacity: isVisible ? 0.2 : 0.15,
      }).addTo(visibilityLayerRef.current)
    })
    
    // Draw rays for visual effect
    data.visibility_map.forEach((ray) => {
      const points = [[obsLat, obsLng]]
      let foundObstruction = false
      
      for (const point of ray.points) {
        points.push([point.lat, point.lng])
        if (!point.visible && !foundObstruction) {
          foundObstruction = true
          // Mark obstruction point
          L.circleMarker([point.lat, point.lng], {
            radius: 3,
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.8,
          }).addTo(visibilityLayerRef.current)
        }
      }
      
      // Draw ray line
      L.polyline(points, {
        color: foundObstruction ? '#ef4444' : '#34d399',
        weight: 1,
        opacity: 0.4,
        dashArray: foundObstruction ? '4, 4' : null,
      }).addTo(visibilityLayerRef.current)
    })
  }

  const handleSave = async () => {
    if (!visibilityData || !observer) return
    
    try {
      const feature = {
        name: `LOS Raytrace ${new Date().toLocaleTimeString()}`,
        feature_type: 'lineOfSight',
        geometry: {
          type: 'circle',
          center: observer,
          radius: RADIUS,
        },
        style: {
          color: '#34d399',
          weight: 2,
          opacity: 0.8,
          fillColor: '#34d399',
          fillOpacity: 0.1,
        },
        properties: {
          observer: observer,
          observer_height: observerHeight,
          radius: RADIUS,
          visibility_map: visibilityData.visibility_map,
          observer_elevation: visibilityData.observer_elevation,
        },
      }
      
      const response = await fetch(`${API_BASE}/tools/features/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feature),
      })
      
      if (response.ok) {
        const saved = await response.json()
        setIsSaved(true)
        onFeatureSaved?.(saved)
      }
    } catch (err) {
      console.error('Failed to save line of sight:', err)
    }
  }

  const handleClose = () => {
    cleanup()
    onClose?.()
  }

  const handleReset = () => {
    cleanup()
    layerRef.current = L.layerGroup().addTo(map)
  }

  return (
    <>
      {loading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] bg-[#0a0e14]/95 backdrop-blur-xl px-6 py-4 rounded-lg text-[#00b4d8] font-mono shadow-[0_4px_24px_rgba(0,0,0,0.4)] border border-white/8">
          Raytracing visibility...
        </div>
      )}
      
      {isActive && !visibilityData && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-[#0a0e14]/95 backdrop-blur-xl px-4 py-2 rounded border border-white/8 text-[#00b4d8] font-mono text-xs shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex items-center gap-4">
          <span>Click to set observer position (1km radius)</span>
          <label className="flex items-center gap-1.5 text-[#5f6368]">
            Eye height:
            <input
              type="number"
              value={observerHeight}
              onChange={(e) => {
                const newHeight = parseFloat(e.target.value) || 2
                setObserverHeight(newHeight)
                if (observer) {
                  performRaytrace(observer)
                }
              }}
              className="w-[50px] bg-[#0a0e14] border border-white/8 text-white px-1 py-0.5 rounded font-mono text-xs outline-none focus:border-[#00b4d8] transition-colors"
            />
            m
          </label>
        </div>
      )}
      
      {visibilityData && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1001] flex gap-2">
          {!isSaved && (
            <button
              onClick={handleSave}
              className="bg-gradient-to-br from-[#0a84ff] to-[#0066cc] border-none text-white px-5 py-2 rounded font-mono text-xs cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_0_12px_rgba(10,132,255,0.4)] transition-all"
            >
              Save Analysis
            </button>
          )}
          {isSaved && (
            <div className="bg-[#34d399]/20 border border-[#34d399] text-[#34d399] px-5 py-2 rounded font-mono text-xs">
              Saved
            </div>
          )}
          <button
            onClick={handleReset}
            className="bg-[#1a1f27] border border-white/8 text-white px-4 py-2 rounded font-mono text-xs cursor-pointer hover:bg-[#1e242e] transition-colors"
          >
            New Analysis
          </button>
        </div>
      )}
    </>
  )
}

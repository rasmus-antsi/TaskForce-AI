/**
 * LineOfSight - Tool to check visibility between two points
 * Saves analysis as a feature for later viewing
 */

import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import ElevationChart from './ElevationChart'

const API_BASE = '/api'

export default function LineOfSight({ isActive, onClose, onFeatureSaved }) {
  const map = useMap()
  const [observer, setObserver] = useState(null)
  const [target, setTarget] = useState(null)
  const [losData, setLosData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [observerHeight, setObserverHeight] = useState(2.0)
  const [isSaved, setIsSaved] = useState(false)
  const layerRef = useRef(null)
  const observerMarkerRef = useRef(null)
  const targetMarkerRef = useRef(null)

  useEffect(() => {
    if (!isActive) {
      cleanup()
      return
    }

    layerRef.current = L.layerGroup().addTo(map)

    const handleClick = async (e) => {
      const { lat, lng } = e.latlng

      if (!observer) {
        // Set observer
        setObserver([lat, lng])
        
        observerMarkerRef.current = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'los-observer',
            html: `<div style="
              width: 16px;
              height: 16px;
              background: #0f0;
              border: 2px solid #fff;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
            "><span style="font-size: 10px;">O</span></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
        }).addTo(map)
        
      } else if (!target) {
        // Set target
        setTarget([lat, lng])
        
        targetMarkerRef.current = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'los-target',
            html: `<div style="
              width: 14px;
              height: 14px;
              background: #f00;
              border: 2px solid #fff;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            "></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          }),
        }).addTo(map)
        
        // Check line of sight
        await checkLineOfSight([lat, lng])
      }
    }

    map.on('click', handleClick)

    return () => {
      map.off('click', handleClick)
    }
  }, [isActive, observer, target, map, observerHeight])

  const cleanup = () => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
    }
    if (observerMarkerRef.current) {
      map.removeLayer(observerMarkerRef.current)
      observerMarkerRef.current = null
    }
    if (targetMarkerRef.current) {
      map.removeLayer(targetMarkerRef.current)
      targetMarkerRef.current = null
    }
    setObserver(null)
    setTarget(null)
    setLosData(null)
    setIsSaved(false)
  }

  const checkLineOfSight = async (targetPoint) => {
    if (!observer) return
    
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/elevation/line-of-sight/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observer: observer,
          target: targetPoint,
          observer_height: observerHeight,
          samples: 100,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setLosData(data)
        
        // Draw line of sight on map
        if (layerRef.current) {
          layerRef.current.clearLayers()
          
          // Draw the sight line
          const line = L.polyline([observer, targetPoint], {
            color: data.visible ? '#0f0' : '#f00',
            weight: 3,
            opacity: 0.8,
            dashArray: data.visible ? null : '10, 5',
          }).addTo(layerRef.current)
          
          // Mark obstruction point if blocked
          if (data.obstruction) {
            L.marker([data.obstruction.lat, data.obstruction.lng], {
              icon: L.divIcon({
                className: 'los-obstruction',
                html: `<div style="
                  width: 12px;
                  height: 12px;
                  background: #f00;
                  border: 2px solid #ff0;
                  border-radius: 50%;
                  box-shadow: 0 0 8px rgba(255, 0, 0, 0.8);
                "></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              }),
            }).addTo(layerRef.current)
          }
        }
      }
    } catch (err) {
      console.error('Line of sight error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!losData || !observer || !target) return
    
    try {
      const feature = {
        name: `LOS ${losData.visible ? 'Visible' : 'Blocked'} ${new Date().toLocaleTimeString()}`,
        feature_type: 'lineOfSight',
        geometry: {
          type: 'line',
          coordinates: [observer, target],
        },
        style: {
          color: losData.visible ? '#0f0' : '#f00',
          weight: 3,
          opacity: 0.8,
          dashArray: losData.visible ? null : '10, 5',
        },
        properties: {
          observer: observer,
          target: target,
          observer_height: observerHeight,
          visible: losData.visible,
          profile: losData.profile,
          total_distance: losData.total_distance,
          min_elevation: losData.min_elevation,
          max_elevation: losData.max_elevation,
          observer_elevation: losData.observer_elevation,
          target_elevation: losData.target_elevation,
          obstruction: losData.obstruction,
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
          Calculating line of sight...
        </div>
      )}
      
      {isActive && !losData && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-[#0a0e14]/95 backdrop-blur-xl px-4 py-2 rounded border border-white/8 text-[#00b4d8] font-mono text-xs shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex items-center gap-4">
          <span>
            {!observer ? 'Click to set OBSERVER position' : 'Click to set TARGET position'}
          </span>
          <label className="flex items-center gap-1.5 text-[#5f6368]">
            Eye height:
            <input
              type="number"
              value={observerHeight}
              onChange={(e) => setObserverHeight(parseFloat(e.target.value) || 2)}
              className="w-[50px] bg-[#0a0e14] border border-white/8 text-white px-1 py-0.5 rounded font-mono text-xs outline-none focus:border-[#00b4d8] transition-colors"
            />
            m
          </label>
        </div>
      )}
      
      {losData && (
        <>
          <ElevationChart 
            data={losData} 
            onClose={handleClose}
            title={`Line of Sight - ${losData.visible ? 'VISIBLE' : 'BLOCKED'}`}
          />
          <div className="absolute bottom-[170px] left-1/2 -translate-x-1/2 z-[1001] flex gap-2">
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
        </>
      )}
    </>
  )
}

/**
 * ElevationProfile - Tool to draw a line and view elevation profile
 * Saves analysis as a feature for later viewing
 */

import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import ElevationChart from './ElevationChart'

const API_BASE = '/api'

export default function ElevationProfile({ isActive, onClose, onFeatureSaved }) {
  const map = useMap()
  const [points, setPoints] = useState([])
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const layerRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (!isActive) {
      // Clean up
      cleanup()
      return
    }

    // Create layer for drawing
    layerRef.current = L.layerGroup().addTo(map)

    const handleClick = (e) => {
      const { lat, lng } = e.latlng
      const newPoints = [...points, [lat, lng]]
      setPoints(newPoints)

      // Add marker
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'elevation-marker',
          html: `<div style="
            width: 10px;
            height: 10px;
            background: #0ff;
            border: 2px solid #fff;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        }),
      }).addTo(map)
      markersRef.current.push(marker)

      // Draw line between points
      if (newPoints.length >= 2) {
        if (layerRef.current) {
          layerRef.current.clearLayers()
        }
        
        const line = L.polyline(newPoints, {
          color: '#0ff',
          weight: 3,
          opacity: 0.8,
        }).addTo(layerRef.current)
      }
    }

    const handleDblClick = async (e) => {
      e.originalEvent.preventDefault()
      
      if (points.length >= 2) {
        // Fetch elevation profile
        await fetchProfile(points)
      }
    }

    map.on('click', handleClick)
    map.on('dblclick', handleDblClick)

    return () => {
      map.off('click', handleClick)
      map.off('dblclick', handleDblClick)
    }
  }, [isActive, points, map])

  const cleanup = () => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
    }
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []
    setPoints([])
    setProfileData(null)
    setIsSaved(false)
  }

  const fetchProfile = async (pathPoints) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/elevation/profile/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: pathPoints, samples: 50 }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
      } else {
        console.error('Failed to fetch elevation profile')
      }
    } catch (err) {
      console.error('Elevation profile error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profileData || points.length < 2) return
    
    try {
      const feature = {
        name: `Elevation Profile ${new Date().toLocaleTimeString()}`,
        feature_type: 'elevationProfile',
        geometry: {
          type: 'line',
          coordinates: points,
        },
        style: {
          color: '#0ff',
          weight: 3,
          opacity: 0.8,
        },
        properties: {
          profile: profileData.profile,
          total_distance: profileData.total_distance,
          min_elevation: profileData.min_elevation,
          max_elevation: profileData.max_elevation,
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
      console.error('Failed to save elevation profile:', err)
    }
  }

  const handleClose = () => {
    cleanup()
    onClose?.()
  }

  return (
    <>
      {loading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] bg-[#0a0e14]/95 backdrop-blur-xl px-6 py-4 rounded-lg text-[#00b4d8] font-mono shadow-[0_4px_24px_rgba(0,0,0,0.4)] border border-white/8">
          Loading elevation data...
        </div>
      )}
      
      {isActive && !profileData && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-[#0a0e14]/95 backdrop-blur-xl px-4 py-2 rounded border border-white/8 text-[#00b4d8] font-mono text-xs shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          Click to add points. Double-click to finish.
        </div>
      )}
      
      {profileData && (
        <>
          <ElevationChart 
            data={profileData} 
            onClose={handleClose}
            title="Elevation Profile"
          />
          {!isSaved && (
            <button
              onClick={handleSave}
              className="absolute bottom-[170px] left-1/2 -translate-x-1/2 z-[1001] bg-gradient-to-br from-[#0a84ff] to-[#0066cc] border-none text-white px-5 py-2 rounded font-mono text-xs cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_0_12px_rgba(10,132,255,0.4)] transition-all"
            >
              Save Analysis
            </button>
          )}
          {isSaved && (
            <div className="absolute bottom-[170px] left-1/2 -translate-x-1/2 z-[1001] bg-[#34d399]/20 border border-[#34d399] text-[#34d399] px-5 py-2 rounded font-mono text-xs">
              Saved
            </div>
          )}
        </>
      )}
    </>
  )
}

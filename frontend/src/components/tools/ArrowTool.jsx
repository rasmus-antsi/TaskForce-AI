/**
 * ArrowTool - Draw directional arrow with 2 points
 */

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { createFeature, layerToGeoJSON, getLayerStyle } from '../../stores/featureStore'

export default function ArrowTool({ isActive, onFeatureCreated }) {
  const map = useMap()
  const pointsRef = useRef([])
  const arrowLayerRef = useRef(null)

  useEffect(() => {
    if (!isActive) {
      if (arrowLayerRef.current) {
        map.removeLayer(arrowLayerRef.current)
        arrowLayerRef.current = null
      }
      pointsRef.current = []
      return
    }

    arrowLayerRef.current = L.layerGroup().addTo(map)

    const handleClick = async (e) => {
      const { lat, lng } = e.latlng
      pointsRef.current.push([lat, lng])

      if (pointsRef.current.length === 1) {
        // First point - show marker
        L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'arrow-start',
            html: `<div style="
              width: 10px;
              height: 10px;
              background: #ffe66d;
              border: 2px solid #fff;
              border-radius: 50%;
            "></div>`,
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          }),
        }).addTo(arrowLayerRef.current)
      } else if (pointsRef.current.length === 2) {
        // Second point - create arrow
        const [p1, p2] = pointsRef.current
        
        // Calculate arrow head
        const angle = Math.atan2(p2[0] - p1[0], p2[1] - p1[1])
        const arrowLength = 30 // pixels
        const arrowAngle = Math.PI / 6 // 30 degrees
        
        const arrowHead1 = [
          p2[0] - arrowLength * Math.cos(angle - arrowAngle),
          p2[1] - arrowLength * Math.sin(angle - arrowAngle),
        ]
        const arrowHead2 = [
          p2[0] - arrowLength * Math.cos(angle + arrowAngle),
          p2[1] - arrowLength * Math.sin(angle + arrowAngle),
        ]

        // Create arrow polyline
        const arrowCoords = [p1, p2, arrowHead1, p2, arrowHead2]
        const arrow = L.polyline(arrowCoords, {
          color: '#ffe66d',
          weight: 3,
          opacity: 0.9,
        }).addTo(arrowLayerRef.current)

        // Prompt for name
        const name = prompt('Enter arrow name:', `Arrow ${new Date().toLocaleTimeString()}`)
        if (!name) {
          map.removeLayer(arrowLayerRef.current)
          arrowLayerRef.current = L.layerGroup().addTo(map)
          pointsRef.current = []
          return
        }

        // Save as feature
        try {
          const geometry = {
            type: 'line',
            coordinates: [p1, p2],
          }
          const style = {
            color: '#ffe66d',
            weight: 3,
            opacity: 0.9,
          }

          const newFeature = await createFeature({
            name,
            feature_type: 'arrow',
            geometry,
            style,
          })

          onFeatureCreated?.(newFeature)
          
          // Clear temporary layer
          map.removeLayer(arrowLayerRef.current)
          arrowLayerRef.current = L.layerGroup().addTo(map)
          pointsRef.current = []
        } catch (err) {
          console.error('Failed to save arrow:', err)
          alert('Failed to save arrow')
        }
      }
    }

    map.on('click', handleClick)

    return () => {
      map.off('click', handleClick)
      if (arrowLayerRef.current) {
        map.removeLayer(arrowLayerRef.current)
      }
    }
  }, [isActive, map, onFeatureCreated])

  return null
}

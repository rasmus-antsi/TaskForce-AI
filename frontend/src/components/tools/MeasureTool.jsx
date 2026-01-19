/**
 * MeasureTool - Measure distance between two points with live preview
 */

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { calculateDistance, formatDistance, calculateBearing } from '../../utils/coordinates'

export default function MeasureTool({ isActive }) {
  const map = useMap()
  const measureLayerRef = useRef(null)
  const pointsRef = useRef([])
  const markersRef = useRef([])
  const lineRef = useRef(null)
  const labelRef = useRef(null)

  useEffect(() => {
    if (!isActive) {
      // Clean up
      if (measureLayerRef.current) {
        map.removeLayer(measureLayerRef.current)
        measureLayerRef.current = null
      }
      markersRef.current.forEach(m => map.removeLayer(m))
      markersRef.current = []
      pointsRef.current = []
      lineRef.current = null
      labelRef.current = null
      return
    }

    // Create layer for measurement line
    measureLayerRef.current = L.layerGroup().addTo(map)

    const handleClick = (e) => {
      const { lat, lng } = e.latlng
      
      if (pointsRef.current.length === 0) {
        // First point
        pointsRef.current = [[lat, lng]]
        
        // Create marker
        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'measure-marker',
            html: `<div style="
              width: 12px;
              height: 12px;
              background: #0ff;
              border: 2px solid #fff;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          }),
        }).addTo(map)
        markersRef.current.push(marker)
        
        // Start tracking mouse for live preview
        const handleMouseMove = (e) => {
          const { lat: lat2, lng: lng2 } = e.latlng
          const p1 = pointsRef.current[0]
          
          // Remove old line and label
          if (lineRef.current) {
            measureLayerRef.current.removeLayer(lineRef.current)
          }
          if (labelRef.current) {
            measureLayerRef.current.removeLayer(labelRef.current)
          }
          
          // Draw new line
          const distance = calculateDistance(p1[0], p1[1], lat2, lng2)
          lineRef.current = L.polyline([p1, [lat2, lng2]], {
            color: '#0ff',
            weight: 2,
            opacity: 0.8,
            dashArray: '5, 5',
          }).addTo(measureLayerRef.current)
          
          // Add distance label at midpoint with rotation
          const midLat = (p1[0] + lat2) / 2
          const midLng = (p1[1] + lng2) / 2
          const bearing = calculateBearing(p1[0], p1[1], lat2, lng2)
          
          labelRef.current = L.marker([midLat, midLng], {
            icon: L.divIcon({
              className: 'measure-label',
              html: `<div style="
                background: rgba(0, 0, 0, 0.9);
                color: #0ff;
                padding: 4px 8px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 11px;
                font-weight: bold;
                white-space: nowrap;
                border: 1px solid #0ff;
                pointer-events: none;
                transform: rotate(${bearing}deg);
                transform-origin: center;
              ">${formatDistance(distance)}</div>`,
              iconSize: [100, 20],
              iconAnchor: [50, 10],
            }),
            interactive: false,
          }).addTo(measureLayerRef.current)
        }
        
        const handleSecondClick = (e2) => {
          const { lat: lat2, lng: lng2 } = e2.latlng
          pointsRef.current.push([lat2, lng2])
          
          // Create second marker
          const marker = L.marker([lat2, lng2], {
            icon: L.divIcon({
              className: 'measure-marker',
              html: `<div style="
                width: 12px;
                height: 12px;
                background: #0ff;
                border: 2px solid #fff;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              "></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            }),
          }).addTo(map)
          markersRef.current.push(marker)
          
          // Stop tracking
          map.off('mousemove', handleMouseMove)
          map.off('click', handleSecondClick)
          
          // Finalize line and label
          const [p1] = pointsRef.current
          const distance = calculateDistance(p1[0], p1[1], lat2, lng2)
          const bearing = calculateBearing(p1[0], p1[1], lat2, lng2)
          
          if (lineRef.current) {
            measureLayerRef.current.removeLayer(lineRef.current)
          }
          if (labelRef.current) {
            measureLayerRef.current.removeLayer(labelRef.current)
          }
          
          lineRef.current = L.polyline([p1, [lat2, lng2]], {
            color: '#0ff',
            weight: 2,
            opacity: 0.8,
            dashArray: '5, 5',
          }).addTo(measureLayerRef.current)
          
          const midLat = (p1[0] + lat2) / 2
          const midLng = (p1[1] + lng2) / 2
          
          labelRef.current = L.marker([midLat, midLng], {
            icon: L.divIcon({
              className: 'measure-label',
              html: `<div style="
                background: rgba(0, 0, 0, 0.9);
                color: #0ff;
                padding: 4px 8px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 11px;
                font-weight: bold;
                white-space: nowrap;
                border: 1px solid #0ff;
                pointer-events: none;
                transform: rotate(${bearing}deg);
                transform-origin: center;
              ">${formatDistance(distance)}</div>`,
              iconSize: [100, 20],
              iconAnchor: [50, 10],
            }),
            interactive: false,
          }).addTo(measureLayerRef.current)
          
          // Reset for next measurement
          setTimeout(() => {
            map.removeLayer(measureLayerRef.current)
            markersRef.current.forEach(m => map.removeLayer(m))
            measureLayerRef.current = L.layerGroup().addTo(map)
            markersRef.current = []
            pointsRef.current = []
            lineRef.current = null
            labelRef.current = null
          }, 5000) // Clear after 5 seconds
        }
        
        map.on('mousemove', handleMouseMove)
        map.once('click', handleSecondClick)
      }
    }

    map.on('click', handleClick)

    return () => {
      map.off('click', handleClick)
      map.off('mousemove')
      if (measureLayerRef.current) {
        map.removeLayer(measureLayerRef.current)
      }
      markersRef.current.forEach(m => map.removeLayer(m))
    }
  }, [isActive, map])

  return null
}

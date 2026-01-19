/**
 * DrawingCanvas - Leaflet-draw integration for drawing shapes on the map
 */

import { useEffect, useRef, useCallback } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'
import {
  createFeature,
  layerToGeoJSON,
  getFeatureType,
  getLayerStyle,
} from '../../stores/featureStore'

// Default draw options with tactical styling
const DRAW_STYLES = {
  line: {
    shapeOptions: {
      color: '#00ff00',
      weight: 3,
      opacity: 0.9,
    },
  },
  polygon: {
    shapeOptions: {
      color: '#00ff00',
      weight: 2,
      fillColor: '#00ff00',
      fillOpacity: 0.2,
    },
  },
  circle: {
    shapeOptions: {
      color: '#ffcc00',
      weight: 2,
      fillColor: '#ffcc00',
      fillOpacity: 0.2,
    },
  },
  rectangle: {
    shapeOptions: {
      color: '#ff6600',
      weight: 2,
      fillColor: '#ff6600',
      fillOpacity: 0.2,
    },
  },
}

export default function DrawingCanvas({ 
  activeTool, 
  onFeatureCreated,
  onToolDeselect,
}) {
  const map = useMap()
  const drawnItemsRef = useRef(null)
  const currentDrawerRef = useRef(null)

  // Initialize feature group for newly drawn items (temporary until saved)
  useEffect(() => {
    if (!drawnItemsRef.current) {
      drawnItemsRef.current = new L.FeatureGroup()
      map.addLayer(drawnItemsRef.current)
    }

    return () => {
      if (drawnItemsRef.current) {
        map.removeLayer(drawnItemsRef.current)
      }
    }
  }, [map])

  // Handle tool changes - activate/deactivate drawing modes
  useEffect(() => {
    // Disable any current drawer
    if (currentDrawerRef.current) {
      currentDrawerRef.current.disable()
      currentDrawerRef.current = null
    }

    if (!activeTool || !drawnItemsRef.current) return

    // Create drawer based on active tool
    let drawer = null

    switch (activeTool) {
      case 'line':
        drawer = new L.Draw.Polyline(map, DRAW_STYLES.line)
        break
      case 'polygon':
        drawer = new L.Draw.Polygon(map, DRAW_STYLES.polygon)
        break
      case 'circle':
        drawer = new L.Draw.Circle(map, DRAW_STYLES.circle)
        break
      case 'rectangle':
        drawer = new L.Draw.Rectangle(map, DRAW_STYLES.rectangle)
        break
      // Edit and delete are handled via FeatureLayer popups now
    }

    if (drawer) {
      drawer.enable()
      currentDrawerRef.current = drawer
    }

    return () => {
      if (drawer) {
        drawer.disable()
      }
    }
  }, [activeTool, map])

  // Handle draw events
  const handleCreated = useCallback(async (e) => {
    const layer = e.layer
    
    // Determine the layer type based on the draw event
    let featureType = 'line'
    if (e.layerType === 'circle') {
      featureType = 'circle'
    } else if (e.layerType === 'polygon') {
      featureType = 'polygon'
    } else if (e.layerType === 'rectangle') {
      featureType = 'rectangle'
    } else if (e.layerType === 'polyline') {
      featureType = 'line'
    } else {
      // Fallback to detection
      featureType = getFeatureType(layer)
    }
    
    const geometry = layerToGeoJSON(layer, featureType)
    const style = getLayerStyle(layer)

    // Generate default name
    const defaultName = `${featureType.charAt(0).toUpperCase() + featureType.slice(1)} ${new Date().toLocaleTimeString()}`
    
    // Prompt for name (simple for now)
    const name = prompt('Enter feature name:', defaultName)
    if (!name) {
      // User cancelled, don't add the layer
      return
    }

    const featureData = {
      name,
      feature_type: featureType,
      geometry,
      style,
    }
    
    console.log('Creating feature:', featureData)

    try {
      const newFeature = await createFeature(featureData)
      console.log('Feature created:', newFeature)
      // Don't add to drawnItems - FeatureLayer will render it
      onFeatureCreated?.(newFeature)
    } catch (err) {
      console.error('Failed to create feature:', err)
      console.error('Feature data was:', featureData)
      alert('Failed to save feature: ' + err.message)
    }
  }, [onFeatureCreated])

  // Handle ESC key to deselect tool completely
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Disable the current drawer
        if (currentDrawerRef.current) {
          currentDrawerRef.current.disable()
          currentDrawerRef.current = null
        }
        // Deselect the tool in the toolbar
        onToolDeselect?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onToolDeselect])

  // Attach event listener for new drawings
  useEffect(() => {
    map.on(L.Draw.Event.CREATED, handleCreated)

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated)
    }
  }, [map, handleCreated])

  return null // This component only handles drawing logic, no visual output
}

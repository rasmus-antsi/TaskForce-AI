import { useState, useEffect, useCallback } from 'react'
import { MapContainer, WMSTileLayer, LayersControl, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import 'proj4leaflet'
import proj4 from 'proj4'
import CoordinateDisplay from './CoordinateDisplay'
import MGRSGrid from './MGRSGrid'
import DrawingToolbar from './tools/DrawingToolbar'
import DrawingCanvas from './tools/DrawingCanvas'
import MarkerPalette from './tools/MarkerPalette'
import MilSymbolMarkers, { MarkerPlacer } from './tools/MilSymbolMarker'
import FeatureLayer from './tools/FeatureLayer'
import MeasureTool from './tools/MeasureTool'
import ArrowTool from './tools/ArrowTool'
import {
  fetchMarkers,
  createMarker,
  updateMarker,
  deleteMarker,
  fetchFeatures,
  deleteFeature,
  updateFeature,
} from '../stores/featureStore'

// Define EPSG:3301 (Estonian coordinate system L-EST97)
proj4.defs('EPSG:3301', '+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 +lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')

// Create custom CRS for EPSG:3301
const CRS_EPSG3301 = new L.Proj.CRS(
  'EPSG:3301',
  '+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 +lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  {
    resolutions: [
      4000, 2000, 1000, 500, 250, 125, 62.5, 31.25, 15.625, 7.8125, 
      3.90625, 1.953125, 0.9765625, 0.48828125, 0.244140625, 0.1220703125
    ],
    origin: [40500, 5993000],
    bounds: L.bounds([40500, 5993000], [1064500, 7017000])
  }
)

// Estonia center (default)
const DEFAULT_CENTER = [58.595, 25.013]
const DEFAULT_ZOOM = 3
const STORAGE_KEY = 'taskforce_map_view'

// Load saved map position from localStorage
function getSavedMapView() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const { center, zoom } = JSON.parse(saved)
      if (center && zoom !== undefined) {
        return { center, zoom }
      }
    }
  } catch (e) {
    console.warn('Failed to load saved map view:', e)
  }
  return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }
}

// Save map position to localStorage
function saveMapView(center, zoom) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ center, zoom }))
  } catch (e) {
    console.warn('Failed to save map view:', e)
  }
}

// WMS proxy base URL - uses Vite proxy to Django
const WMS_PROXY = '/api/wms-proxy/'

// Grid level options
const GRID_OPTIONS = [
  { value: null, label: 'OFF', color: '#555' },
  { value: 100000, label: '100km', color: '#ff0000' },
  { value: 10000, label: '10km', color: '#ffcc00' },
  { value: 1000, label: '1km', color: '#888888' },
]

// Component to save map position on move/zoom
function MapViewSaver() {
  const map = useMap()
  
  useEffect(() => {
    const handleMoveEnd = () => {
      const center = map.getCenter()
      const zoom = map.getZoom()
      saveMapView([center.lat, center.lng], zoom)
    }
    
    map.on('moveend', handleMoveEnd)
    return () => map.off('moveend', handleMoveEnd)
  }, [map])
  
  return null
}

export default function MapView() {
  // Get initial map view from localStorage
  const [initialView] = useState(() => getSavedMapView())
  const [gridLevel, setGridLevel] = useState(null)
  
  // Drawing tools state
  const [activeTool, setActiveTool] = useState(null)
  const [showMarkerPalette, setShowMarkerPalette] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState(null)
  const [selectedAffiliation, setSelectedAffiliation] = useState('F')
  
  // Data state
  const [markers, setMarkers] = useState([])
  const [features, setFeatures] = useState([])

  // Load markers and features on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedMarkers, loadedFeatures] = await Promise.all([
          fetchMarkers(),
          fetchFeatures(),
        ])
        setMarkers(loadedMarkers)
        setFeatures(loadedFeatures)
        console.log('Loaded markers:', loadedMarkers.length, 'features:', loadedFeatures.length)
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }
    loadData()
  }, [])

  // Global ESC handler to deselect all tools
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveTool(null)
        setShowMarkerPalette(false)
        setSelectedSymbol(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle tool changes
  const handleToolChange = useCallback((tool) => {
    setActiveTool(tool)
    if (tool !== 'marker') {
      setShowMarkerPalette(false)
    }
  }, [])

  // Handle marker palette toggle
  const handleMarkerPaletteToggle = useCallback(() => {
    setShowMarkerPalette(prev => !prev)
  }, [])

  // Handle symbol selection
  const handleSymbolSelect = useCallback((symbol) => {
    setSelectedSymbol(symbol)
  }, [])

  // Handle affiliation change
  const handleAffiliationSelect = useCallback((affiliation) => {
    setSelectedAffiliation(affiliation)
  }, [])

  // Handle marker placement
  const handleMarkerPlaced = useCallback(async (markerData) => {
    try {
      const newMarker = await createMarker(markerData)
      setMarkers(prev => [newMarker, ...prev])
    } catch (err) {
      console.error('Failed to create marker:', err)
      alert('Failed to save marker')
    }
  }, [])

  // Handle marker update
  const handleMarkerUpdate = useCallback(async (id, markerData) => {
    try {
      const updated = await updateMarker(id, markerData)
      setMarkers(prev => prev.map(m => m.id === id ? updated : m))
    } catch (err) {
      console.error('Failed to update marker:', err)
    }
  }, [])

  // Handle marker deletion
  const handleMarkerDelete = useCallback(async (id) => {
    try {
      await deleteMarker(id)
      setMarkers(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      console.error('Failed to delete marker:', err)
    }
  }, [])

  // Handle feature events
  const handleFeatureCreated = useCallback((feature) => {
    setFeatures(prev => [feature, ...prev])
  }, [])

  const handleFeatureUpdated = useCallback(async (updatedFeature) => {
    try {
      await updateFeature(updatedFeature.id, {
        name: updatedFeature.name,
        geometry: updatedFeature.geometry,
        style: updatedFeature.style,
      })
      setFeatures(prev => prev.map(f => f.id === updatedFeature.id ? updatedFeature : f))
    } catch (err) {
      console.error('Failed to update feature:', err)
    }
  }, [])

  const handleFeatureDeleted = useCallback(async (id) => {
    try {
      await deleteFeature(id)
      setFeatures(prev => prev.filter(f => f.id !== id))
      // Force map refresh by triggering a small state update
      setTimeout(() => {
        // This ensures the map re-renders after deletion
        window.dispatchEvent(new Event('resize'))
      }, 100)
    } catch (err) {
      console.error('Failed to delete feature:', err)
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Drawing Toolbar */}
      <DrawingToolbar 
        activeTool={activeTool}
        onToolChange={handleToolChange}
        onMarkerPaletteToggle={handleMarkerPaletteToggle}
      />

      {/* Marker Palette */}
      <MarkerPalette
        isOpen={showMarkerPalette && activeTool === 'marker'}
        onClose={() => setShowMarkerPalette(false)}
        selectedSymbol={selectedSymbol}
        selectedAffiliation={selectedAffiliation}
        onSymbolSelect={handleSymbolSelect}
        onAffiliationSelect={handleAffiliationSelect}
      />

      {/* Grid Level Selector */}
      <div style={{
        position: 'absolute',
        bottom: 140,
        left: 70,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.9)',
        borderRadius: '4px',
        border: '1px solid #444',
        padding: '8px',
      }}>
        <div style={{
          color: '#888',
          fontSize: '9px',
          fontFamily: 'monospace',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          MGRS Grid
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {GRID_OPTIONS.map(opt => (
            <button
              key={opt.label}
              onClick={() => setGridLevel(opt.value)}
              style={{
                background: gridLevel === opt.value ? opt.color : 'transparent',
                color: gridLevel === opt.value ? (opt.value === 10000 ? '#000' : '#fff') : opt.color,
                border: `1px solid ${opt.color}`,
                padding: '4px 8px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '10px',
                fontWeight: 'bold',
                opacity: gridLevel === opt.value ? 1 : 0.7,
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <MapContainer
        center={initialView.center}
        zoom={initialView.zoom}
        style={{ height: '100%', width: '100%' }}
        crs={CRS_EPSG3301}
      >
        {/* Save map position to localStorage */}
        <MapViewSaver />
        <LayersControl position="topright">
          {/* BASE LAYERS - Only one can be active */}
          <LayersControl.BaseLayer checked name="Ortofoto">
            <WMSTileLayer
              url={`${WMS_PROXY}?service_path=fotokaart`}
              layers="EESTIFOTO"
              format="image/jpeg"
              transparent={false}
              version="1.1.1"
              uppercase={true}
              attribution='&copy; <a href="https://www.maaamet.ee">Maa-amet</a>'
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Hübriidkaart">
            <WMSTileLayer
              url={`${WMS_PROXY}?service_path=fotokaart`}
              layers="HYBRID"
              format="image/jpeg"
              transparent={false}
              version="1.1.1"
              uppercase={true}
              attribution='&copy; <a href="https://www.maaamet.ee">Maa-amet</a>'
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Põhikaart">
            <WMSTileLayer
              url={`${WMS_PROXY}?service_path=alus`}
              layers="pohi_vr2"
              format="image/png"
              transparent={false}
              version="1.1.1"
              uppercase={true}
              attribution='&copy; <a href="https://www.maaamet.ee">Maa-amet</a>'
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Põhikaart + reljeef">
            <WMSTileLayer
              url={`${WMS_PROXY}?service_path=alus`}
              layers="pohi_vv"
              format="image/png"
              transparent={false}
              version="1.1.1"
              uppercase={true}
              attribution='&copy; <a href="https://www.maaamet.ee">Maa-amet</a>'
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Reljeefvarjutus">
            <WMSTileLayer
              url={`${WMS_PROXY}?service_path=fotokaart`}
              layers="reljeef"
              format="image/jpeg"
              transparent={false}
              version="1.1.1"
              uppercase={true}
              attribution='&copy; <a href="https://www.maaamet.ee">Maa-amet</a>'
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Värviline reljeef">
            <WMSTileLayer
              url={`${WMS_PROXY}?service_path=fotokaart`}
              layers="vreljeef"
              format="image/jpeg"
              transparent={false}
              version="1.1.1"
              uppercase={true}
              attribution='&copy; <a href="https://www.maaamet.ee">Maa-amet</a>'
            />
          </LayersControl.BaseLayer>

          {/* OVERLAY LAYERS - Can be toggled on/off */}
          <LayersControl.Overlay name="Hübriid kiht (teed, nimed)">
            <WMSTileLayer
              url={`${WMS_PROXY}?service_path=fotokaart`}
              layers="HYBRID"
              format="image/png"
              transparent={true}
              version="1.1.1"
              uppercase={true}
              opacity={1}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Hooned">
            <WMSTileLayer
              url={`${WMS_PROXY}?service_path=fotokaart`}
              layers="HYB_hoone"
              format="image/png"
              transparent={true}
              version="1.1.1"
              uppercase={true}
              opacity={0.8}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Teed ja tänavad">
            <WMSTileLayer
              url={`${WMS_PROXY}?service_path=alus`}
              layers="MAANTEED"
              format="image/png"
              transparent={true}
              version="1.1.1"
              uppercase={true}
              opacity={0.9}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Raudteed">
            <WMSTileLayer
              url={`${WMS_PROXY}?service_path=fotokaart`}
              layers="HYB_roobasteed"
              format="image/png"
              transparent={true}
              version="1.1.1"
              uppercase={true}
              opacity={0.9}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Halduspiirid">
            <WMSTileLayer
              url={`${WMS_PROXY}?service_path=alus`}
              layers="HALDUSPIIRID"
              format="image/png"
              transparent={true}
              version="1.1.1"
              uppercase={true}
              opacity={0.8}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Asustusüksused">
            <WMSTileLayer
              url={`${WMS_PROXY}?service_path=alus`}
              layers="KYLAD"
              format="image/png"
              transparent={true}
              version="1.1.1"
              uppercase={true}
              opacity={0.7}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Kõrgusandmed">
            <WMSTileLayer
              url={`${WMS_PROXY}?service_path=fotokaart`}
              layers="korgusandmed"
              format="image/png"
              transparent={true}
              version="1.1.1"
              uppercase={true}
              opacity={0.8}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Kaitseväe harjutusalad">
            <WMSTileLayer
              url={`${WMS_PROXY}?service_path=alus`}
              layers="KV_HARJUTUSALA"
              format="image/png"
              transparent={true}
              version="1.1.1"
              uppercase={true}
              opacity={0.6}
            />
          </LayersControl.Overlay>

        </LayersControl>

        {/* Drawing Canvas - handles shape drawing */}
        <DrawingCanvas
          activeTool={['line', 'polygon', 'circle', 'rectangle'].includes(activeTool) ? activeTool : null}
          onFeatureCreated={handleFeatureCreated}
          onToolDeselect={() => {
            setActiveTool(null)
            setShowMarkerPalette(false)
            setSelectedSymbol(null)
          }}
        />

        {/* Measure Tool */}
        <MeasureTool isActive={activeTool === 'measure'} />

        {/* Arrow Tool */}
        <ArrowTool 
          isActive={activeTool === 'arrow'}
          onFeatureCreated={handleFeatureCreated}
        />

        {/* Marker Placer - handles marker clicks */}
        <MarkerPlacer
          isActive={activeTool === 'marker' && selectedSymbol !== null}
          selectedSymbol={selectedSymbol}
          selectedAffiliation={selectedAffiliation}
          onMarkerPlaced={handleMarkerPlaced}
        />

        {/* Render all markers */}
        <MilSymbolMarkers
          markers={markers}
          onUpdate={handleMarkerUpdate}
          onDelete={handleMarkerDelete}
        />

        {/* Render all saved features (lines, polygons, circles) */}
        <FeatureLayer 
          features={features}
          onUpdate={handleFeatureUpdated}
          onDelete={handleFeatureDeleted}
        />

        {/* MGRS Grid Overlay */}
        {gridLevel && <MGRSGrid gridLevel={gridLevel} />}

        {/* Coordinate Display */}
        <CoordinateDisplay />
      </MapContainer>
    </div>
  )
}

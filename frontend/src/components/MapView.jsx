import { useState } from 'react'
import { MapContainer, WMSTileLayer, LayersControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import 'proj4leaflet'
import proj4 from 'proj4'
import CoordinateDisplay from './CoordinateDisplay'
import MGRSGrid from './MGRSGrid'

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

// Estonia center
const ESTONIA_CENTER = [58.595, 25.013]
const DEFAULT_ZOOM = 3

// WMS proxy base URL
const WMS_PROXY = 'http://localhost:8000/api/wms-proxy/'

// Grid level options
const GRID_OPTIONS = [
  { value: null, label: 'OFF', color: '#555' },
  { value: 100000, label: '100km', color: '#ff0000' },
  { value: 10000, label: '10km', color: '#ffcc00' },
  { value: 1000, label: '1km', color: '#888888' },
]

export default function MapView() {
  const [gridLevel, setGridLevel] = useState(null)

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Grid Level Selector */}
      <div style={{
        position: 'absolute',
        bottom: 140,
        left: 10,
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
        center={ESTONIA_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        crs={CRS_EPSG3301}
      >
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

        {/* MGRS Grid Overlay */}
        {gridLevel && <MGRSGrid gridLevel={gridLevel} />}

        {/* Coordinate Display */}
        <CoordinateDisplay />
      </MapContainer>
    </div>
  )
}
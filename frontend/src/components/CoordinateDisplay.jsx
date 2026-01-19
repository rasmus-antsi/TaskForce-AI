import { useState } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import { latLonToMGRS, latLonToUTM, formatLatLon, formatUTM } from '../utils/coordinates'

const styles = {
  container: {
    position: 'absolute',
    bottom: 30,
    left: 10,
    zIndex: 1000,
    background: 'rgba(0, 0, 0, 0.85)',
    color: '#00ff00',
    padding: '8px 12px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '12px',
    minWidth: '280px',
    border: '1px solid #333',
    userSelect: 'text',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  label: {
    color: '#888',
    marginRight: '12px',
    minWidth: '45px',
  },
  value: {
    color: '#00ff00',
    cursor: 'pointer',
  },
  divider: {
    borderTop: '1px solid #333',
    margin: '6px 0',
  },
  zoomInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#666',
    fontSize: '10px',
  },
}

function CoordinateDisplayInner() {
  const map = useMap()
  const [coords, setCoords] = useState({ lat: 0, lon: 0 })
  const [zoom, setZoom] = useState(map.getZoom())

  useMapEvents({
    mousemove: (e) => {
      setCoords({ lat: e.latlng.lat, lon: e.latlng.lng })
    },
    zoom: () => {
      setZoom(map.getZoom())
    },
  })

  const mgrsCoord = latLonToMGRS(coords.lat, coords.lon, 5)
  const utmCoord = latLonToUTM(coords.lat, coords.lon)
  const latLonStr = formatLatLon(coords.lat, coords.lon, 'dd')

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <span style={styles.label}>MGRS</span>
        <span 
          style={styles.value} 
          onClick={() => copyToClipboard(mgrsCoord)}
          title="Click to copy"
        >
          {mgrsCoord}
        </span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>UTM</span>
        <span 
          style={styles.value} 
          onClick={() => copyToClipboard(formatUTM(utmCoord))}
          title="Click to copy"
        >
          {formatUTM(utmCoord)}
        </span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>WGS84</span>
        <span 
          style={styles.value} 
          onClick={() => copyToClipboard(latLonStr)}
          title="Click to copy"
        >
          {latLonStr}
        </span>
      </div>
      <div style={styles.divider} />
      <div style={styles.zoomInfo}>
        <span>Zoom: {zoom}</span>
        <span>L-EST97 (EPSG:3301)</span>
      </div>
    </div>
  )
}

export default function CoordinateDisplay() {
  return <CoordinateDisplayInner />
}

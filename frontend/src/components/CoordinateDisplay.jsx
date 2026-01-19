/**
 * CoordinateDisplay - Shows current mouse position coordinates
 * Premium military-style design with Tailwind CSS
 */

import { useState } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import { latLonToMGRS, latLonToUTM, formatLatLon, formatUTM } from '../utils/coordinates'

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
    <div className="absolute bottom-7.5 left-2.5 z-[1000] bg-[#0a0e14]/85 backdrop-blur-xl text-[#00b4d8] px-3 py-2 rounded border border-white/8 font-mono text-xs min-w-[280px] select-text shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="flex justify-between mb-1">
        <span className="text-[#5f6368] mr-3 min-w-[45px]">MGRS</span>
        <span 
          className="text-[#e8eaed] cursor-pointer hover:text-[#9aa0a6] transition-colors font-semibold"
          onClick={() => copyToClipboard(mgrsCoord)}
          title="Click to copy"
        >
          {mgrsCoord}
        </span>
      </div>
      <div className="flex justify-between mb-1">
        <span className="text-[#5f6368] mr-3 min-w-[45px]">UTM</span>
        <span 
          className="text-[#e8eaed] cursor-pointer hover:text-[#9aa0a6] transition-colors font-semibold"
          onClick={() => copyToClipboard(formatUTM(utmCoord))}
          title="Click to copy"
        >
          {formatUTM(utmCoord)}
        </span>
      </div>
      <div className="flex justify-between mb-1">
        <span className="text-[#5f6368] mr-3 min-w-[45px]">WGS84</span>
        <span 
          className="text-[#e8eaed] cursor-pointer hover:text-[#9aa0a6] transition-colors font-semibold"
          onClick={() => copyToClipboard(latLonStr)}
          title="Click to copy"
        >
          {latLonStr}
        </span>
      </div>
      <div className="border-t border-white/8 my-1.5" />
      <div className="flex justify-between text-[#5f6368] text-[10px]">
        <span>Zoom: {zoom}</span>
        <span>L-EST97 (EPSG:3301)</span>
      </div>
    </div>
  )
}

export default function CoordinateDisplay() {
  return <CoordinateDisplayInner />
}

/**
 * MilSymbolMarker - Render MIL-STD-2525 tactical markers using milsymbol
 */

import { useMemo, useState } from 'react'
import { Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { getSymbolDataUrl, getSymbolAnchor, generateSIDC } from '../../utils/milsymbols'
import { latLonToMGRS } from '../../utils/coordinates'

/**
 * Create a Leaflet icon from milsymbol SIDC
 */
function createMilSymbolIcon(sidc, options = {}) {
  const size = options.size || 35
  const dataUrl = getSymbolDataUrl(sidc, { size })
  const anchor = getSymbolAnchor(sidc, { size })

  return L.icon({
    iconUrl: dataUrl,
    iconSize: [size * 2, size * 2],
    iconAnchor: [anchor.x, anchor.y],
    popupAnchor: [0, -anchor.y],
  })
}

/**
 * Single MIL-STD-2525 marker on the map
 */
export function MilSymbolMarkerItem({ marker, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(marker.name)

  const icon = useMemo(() => {
    return createMilSymbolIcon(marker.sidc, { size: 35 })
  }, [marker.sidc])

  const mgrsCoord = latLonToMGRS(marker.lat, marker.lon, 5)

  const handleSave = () => {
    onUpdate?.(marker.id, { ...marker, name: editName })
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm(`Delete marker "${marker.name}"?`)) {
      onDelete?.(marker.id)
    }
  }

  return (
    <Marker 
      position={[marker.lat, marker.lon]} 
      icon={icon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const newPos = e.target.getLatLng()
          onUpdate?.(marker.id, { ...marker, lat: newPos.lat, lon: newPos.lng })
        },
      }}
    >
      <Popup>
        <div style={{ 
          fontFamily: 'monospace', 
          fontSize: '12px',
          minWidth: '180px',
        }}>
          {isEditing ? (
            <div>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  marginBottom: '8px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  background: '#222',
                  color: '#fff',
                  border: '1px solid #444',
                  borderRadius: '3px',
                }}
              />
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={handleSave}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    background: '#0a0',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    background: '#555',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {marker.name}
              </div>
              <div style={{ color: '#666', marginBottom: '4px' }}>
                {marker.affiliation_display}
              </div>
              <div style={{ 
                color: '#0c8', 
                marginBottom: '8px',
                fontSize: '11px',
              }}>
                {mgrsCoord}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    background: '#333',
                    color: '#fff',
                    border: '1px solid #555',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    background: '#500',
                    color: '#fff',
                    border: '1px solid #700',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </Popup>
    </Marker>
  )
}

/**
 * Marker placement handler - listens for map clicks when marker tool is active
 */
export function MarkerPlacer({ 
  isActive, 
  selectedSymbol, 
  selectedAffiliation,
  onMarkerPlaced 
}) {
  useMapEvents({
    click: (e) => {
      if (!isActive || !selectedSymbol) return

      const sidc = generateSIDC(selectedSymbol.sidc, selectedAffiliation)
      
      onMarkerPlaced?.({
        name: selectedSymbol.name,
        sidc,
        affiliation: selectedAffiliation,
        lat: e.latlng.lat,
        lon: e.latlng.lng,
        properties: {
          symbolId: selectedSymbol.id,
          categoryId: selectedSymbol.categoryId,
        },
      })
    },
  })

  return null
}

/**
 * Render all markers from the backend
 */
export default function MilSymbolMarkers({ markers = [], onUpdate, onDelete }) {
  return (
    <>
      {markers.map(marker => (
        <MilSymbolMarkerItem
          key={marker.id}
          marker={marker}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </>
  )
}

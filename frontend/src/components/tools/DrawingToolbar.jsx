/**
 * DrawingToolbar - Left-side toolbar for selecting drawing tools
 */

import { useState } from 'react'

// Tool definitions
const TOOLS = [
  { id: 'marker', icon: '📍', label: 'Marker', shortcut: 'M' },
  { id: 'line', icon: '📏', label: 'Line', shortcut: 'L' },
  { id: 'polygon', icon: '⬡', label: 'Polygon', shortcut: 'P' },
  { id: 'circle', icon: '⭕', label: 'Circle', shortcut: 'C' },
  { id: 'rectangle', icon: '▢', label: 'Rectangle', shortcut: 'R' },
  { id: 'edit', icon: '✏️', label: 'Edit', shortcut: 'E' },
  { id: 'delete', icon: '🗑️', label: 'Delete', shortcut: 'D' },
]

const styles = {
  toolbar: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    background: 'rgba(0, 0, 0, 0.9)',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #444',
  },
  button: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: '1px solid #555',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '20px',
    transition: 'all 0.15s',
    position: 'relative',
  },
  buttonActive: {
    background: 'rgba(0, 200, 100, 0.3)',
    borderColor: '#0c8',
  },
  buttonHover: {
    background: 'rgba(255, 255, 255, 0.1)',
  },
  tooltip: {
    position: 'absolute',
    left: '54px',
    background: 'rgba(0, 0, 0, 0.95)',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '3px',
    fontSize: '12px',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    border: '1px solid #444',
  },
  divider: {
    height: '1px',
    background: '#444',
    margin: '4px 0',
  },
  shortcut: {
    color: '#888',
    fontSize: '10px',
    marginLeft: '6px',
  },
}

export default function DrawingToolbar({ activeTool, onToolChange, onMarkerPaletteToggle }) {
  const [hoveredTool, setHoveredTool] = useState(null)

  const handleToolClick = (toolId) => {
    if (toolId === 'marker') {
      // Toggle marker palette
      onMarkerPaletteToggle?.()
    }
    onToolChange(activeTool === toolId ? null : toolId)
  }

  return (
    <div style={styles.toolbar}>
      {TOOLS.map((tool, index) => (
        <div key={tool.id}>
          {/* Add divider before edit tools */}
          {index === 5 && <div style={styles.divider} />}
          
          <button
            onClick={() => handleToolClick(tool.id)}
            onMouseEnter={() => setHoveredTool(tool.id)}
            onMouseLeave={() => setHoveredTool(null)}
            style={{
              ...styles.button,
              ...(activeTool === tool.id ? styles.buttonActive : {}),
              ...(hoveredTool === tool.id && activeTool !== tool.id ? styles.buttonHover : {}),
            }}
            title={`${tool.label} (${tool.shortcut})`}
          >
            {tool.icon}
            
            {/* Tooltip */}
            {hoveredTool === tool.id && (
              <span style={styles.tooltip}>
                {tool.label}
                <span style={styles.shortcut}>[{tool.shortcut}]</span>
              </span>
            )}
          </button>
        </div>
      ))}
    </div>
  )
}

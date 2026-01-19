/**
 * DrawingToolbar - Left-side toolbar for selecting drawing tools
 */

import { useState } from 'react'

// SVG Icons
const Icons = {
  marker: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  line: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12"/>
    </svg>
  ),
  arrow: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  polygon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/>
    </svg>
  ),
  circle: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  ),
  rectangle: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
    </svg>
  ),
  measure: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="3" x2="21" y2="21"/>
      <circle cx="3" cy="3" r="2"/>
      <circle cx="21" cy="21" r="2"/>
      <line x1="8" y1="3" x2="8" y2="8"/>
      <line x1="16" y1="16" x2="16" y2="21"/>
    </svg>
  ),
}

// Tool definitions
const TOOLS = [
  { id: 'marker', icon: Icons.marker, label: 'Marker', shortcut: 'M', color: '#ff6b6b' },
  { id: 'line', icon: Icons.line, label: 'Line', shortcut: 'L', color: '#4ecdc4' },
  { id: 'arrow', icon: Icons.arrow, label: 'Arrow', shortcut: 'A', color: '#ffe66d' },
  { id: 'polygon', icon: Icons.polygon, label: 'Polygon', shortcut: 'P', color: '#95e1d3' },
  { id: 'circle', icon: Icons.circle, label: 'Circle', shortcut: 'C', color: '#f38181' },
  { id: 'rectangle', icon: Icons.rectangle, label: 'Rectangle', shortcut: 'R', color: '#aa96da' },
  { id: 'measure', icon: Icons.measure, label: 'Measure', shortcut: 'D', color: '#fcbad3' },
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
    gap: '6px',
    background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.95) 0%, rgba(10, 10, 20, 0.95) 100%)',
    padding: '10px 8px',
    borderRadius: '8px',
    border: '2px solid rgba(100, 100, 120, 0.5)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  },
  button: {
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(40, 40, 50, 0.8)',
    border: '2px solid rgba(80, 80, 100, 0.6)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    color: '#fff',
  },
  buttonActive: {
    background: 'rgba(0, 200, 100, 0.4)',
    borderColor: '#0c8',
    boxShadow: '0 0 12px rgba(0, 200, 100, 0.6)',
    transform: 'scale(1.05)',
  },
  buttonHover: {
    background: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    transform: 'translateX(2px)',
  },
  tooltip: {
    position: 'absolute',
    left: '60px',
    background: 'rgba(0, 0, 0, 0.95)',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    border: '1px solid rgba(100, 100, 120, 0.5)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    zIndex: 1001,
  },
  shortcut: {
    color: '#888',
    fontSize: '10px',
    marginLeft: '6px',
    fontFamily: 'monospace',
  },
}

export default function DrawingToolbar({ activeTool, onToolChange, onMarkerPaletteToggle }) {
  const [hoveredTool, setHoveredTool] = useState(null)

  const handleToolClick = (toolId) => {
    if (toolId === 'marker') {
      onMarkerPaletteToggle?.()
    }
    onToolChange(activeTool === toolId ? null : toolId)
  }

  return (
    <div style={styles.toolbar}>
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          onClick={() => handleToolClick(tool.id)}
          onMouseEnter={() => setHoveredTool(tool.id)}
          onMouseLeave={() => setHoveredTool(null)}
          style={{
            ...styles.button,
            ...(activeTool === tool.id ? styles.buttonActive : {}),
            ...(hoveredTool === tool.id && activeTool !== tool.id ? styles.buttonHover : {}),
            borderColor: activeTool === tool.id ? tool.color : undefined,
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
      ))}
    </div>
  )
}

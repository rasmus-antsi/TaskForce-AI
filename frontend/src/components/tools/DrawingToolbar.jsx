/**
 * DrawingToolbar - Left-side toolbar for selecting drawing tools
 * Premium military-style design with Tailwind CSS
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
  elevation: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 20 L6 14 L10 16 L14 8 L18 12 L22 6"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  los: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="5" cy="12" r="3"/>
      <circle cx="19" cy="12" r="2"/>
      <line x1="8" y1="12" x2="17" y2="12" strokeDasharray="3,2"/>
    </svg>
  ),
}

// Tool definitions
const TOOLS = [
  { id: 'marker', icon: Icons.marker, label: 'Marker', shortcut: 'M', color: 'border-red-500' },
  { id: 'line', icon: Icons.line, label: 'Line', shortcut: 'L', color: 'border-cyan-400' },
  { id: 'arrow', icon: Icons.arrow, label: 'Arrow', shortcut: 'A', color: 'border-amber-400' },
  { id: 'polygon', icon: Icons.polygon, label: 'Polygon', shortcut: 'P', color: 'border-emerald-400' },
  { id: 'circle', icon: Icons.circle, label: 'Circle', shortcut: 'C', color: 'border-purple-400' },
  { id: 'rectangle', icon: Icons.rectangle, label: 'Rectangle', shortcut: 'R', color: 'border-pink-400' },
  { id: 'divider1', divider: true },
  { id: 'measure', icon: Icons.measure, label: 'Measure', shortcut: 'D', color: 'border-yellow-400' },
  { id: 'elevation', icon: Icons.elevation, label: 'Elevation Profile', shortcut: 'E', color: 'border-cyan-500' },
  { id: 'los', icon: Icons.los, label: 'Line of Sight', shortcut: 'V', color: 'border-green-500' },
]

export default function DrawingToolbar({ activeTool, onToolChange, onMarkerPaletteToggle }) {
  const [hoveredTool, setHoveredTool] = useState(null)

  const handleToolClick = (toolId) => {
    if (toolId === 'marker') {
      onMarkerPaletteToggle?.()
    }
    onToolChange(activeTool === toolId ? null : toolId)
  }

  return (
    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-1.5 bg-[#12161c]/95 backdrop-blur-xl border border-white/8 rounded-lg p-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      {TOOLS.map((tool) => {
        if (tool.divider) {
          return (
            <div
              key={tool.id}
              className="h-px bg-white/10 my-1"
            />
          )
        }
        
        const isActive = activeTool === tool.id
        const isHovered = hoveredTool === tool.id
        
        return (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            onMouseEnter={() => setHoveredTool(tool.id)}
            onMouseLeave={() => setHoveredTool(null)}
            className={`
              relative w-11 h-11 flex items-center justify-center
              rounded-md transition-all duration-200
              ${isActive 
                ? 'bg-[#1e242e] border-2 border-[#00b4d8] text-[#00b4d8] shadow-[0_0_12px_rgba(0,180,216,0.4)]' 
                : 'bg-[#1a1f27] border border-white/8 text-[#9aa0a6] hover:bg-[#1e242e] hover:border-white/12 hover:-translate-y-0.5'
              }
              ${isActive ? tool.color : ''}
            `}
            title={`${tool.label} (${tool.shortcut})`}
          >
            {tool.icon}
            
            {/* Tooltip */}
            {isHovered && (
              <span className="absolute left-[60px] bg-black/95 text-white px-2.5 py-1.5 rounded border border-white/8 text-xs font-mono whitespace-nowrap pointer-events-none z-[1001] shadow-lg">
                {tool.label}
                <span className="text-[#5f6368] ml-1.5 text-[10px]">[{tool.shortcut}]</span>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * AnalysisPopup - Popup for viewing saved elevation profile and line of sight analyses
 * Premium military-style design with Tailwind CSS
 */

import { useState, useEffect, useRef } from 'react'
import { formatDistance } from '../../utils/coordinates'

export default function AnalysisPopup({ feature, onDelete }) {
  const canvasRef = useRef(null)
  const props = feature.properties || {}
  const isLOS = feature.feature_type === 'lineOfSight'
  
  // Draw mini chart
  useEffect(() => {
    if (!props.profile || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const profile = props.profile

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)

    const width = rect.width
    const height = rect.height
    const padding = { top: 5, right: 5, bottom: 5, left: 5 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Clear
    ctx.clearRect(0, 0, width, height)

    // Get data ranges
    const elevations = profile.map(p => p.elevation).filter(e => e !== null)
    if (elevations.length === 0) return
    
    const minElev = Math.min(...elevations) - 5
    const maxElev = Math.max(...elevations) + 5
    const maxDist = props.total_distance || profile[profile.length - 1]?.distance || 1

    // Draw elevation profile
    if (profile.length > 1) {
      // Fill area
      ctx.beginPath()
      ctx.moveTo(padding.left, padding.top + chartHeight)

      profile.forEach((point, i) => {
        const x = padding.left + (point.distance / maxDist) * chartWidth
        const y = padding.top + chartHeight - ((point.elevation - minElev) / (maxElev - minElev)) * chartHeight
        ctx.lineTo(x, y)
      })

      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
      ctx.closePath()

      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)')
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0.05)')
      ctx.fillStyle = gradient
      ctx.fill()

      // Draw line
      ctx.beginPath()
      profile.forEach((point, i) => {
        const x = padding.left + (point.distance / maxDist) * chartWidth
        const y = padding.top + chartHeight - ((point.elevation - minElev) / (maxElev - minElev)) * chartHeight
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.strokeStyle = '#00b4d8'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Draw LOS line if applicable
      if (isLOS && props.observer_elevation !== undefined && props.target_elevation !== undefined) {
        const startX = padding.left
        const startY = padding.top + chartHeight - ((props.observer_elevation - minElev) / (maxElev - minElev)) * chartHeight
        const endX = padding.left + chartWidth
        const endY = padding.top + chartHeight - ((props.target_elevation - minElev) / (maxElev - minElev)) * chartHeight

        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.strokeStyle = props.visible ? '#34d399' : '#ef4444'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 2])
        ctx.stroke()
        ctx.setLineDash([])

        // Obstruction point
        if (props.obstruction) {
          const obsX = padding.left + (props.obstruction.distance / maxDist) * chartWidth
          const obsY = padding.top + chartHeight - ((props.obstruction.elevation - minElev) / (maxElev - minElev)) * chartHeight
          
          ctx.beginPath()
          ctx.arc(obsX, obsY, 4, 0, Math.PI * 2)
          ctx.fillStyle = '#ef4444'
          ctx.fill()
        }
      }
    }
  }, [props, isLOS])

  const handleDelete = () => {
    if (window.confirm('Delete this analysis?')) {
      onDelete?.(feature.id)
    }
  }

  return (
    <div className="bg-[#0a0e14]/95 backdrop-blur-xl border border-white/8 rounded-lg p-3 min-w-[350px] max-w-[500px] font-mono shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-white text-[13px] font-bold uppercase tracking-wide">{feature.name}</div>
          <div className="text-[#5f6368] text-[10px] mt-1">
            {isLOS ? 'Line of Sight Analysis' : 'Elevation Profile'}
          </div>
        </div>
        {isLOS && (
          <div className={`
            inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold
            ${props.visible 
              ? 'bg-[#34d399]/20 text-[#34d399] border border-[#34d399]' 
              : 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]'
            }
          `}>
            {props.visible ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                VISIBLE
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                BLOCKED
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-black/30 p-2 rounded">
          <div className="text-[#5f6368] text-[9px] uppercase mb-1">Distance</div>
          <div className="text-[#00b4d8] text-sm font-bold">{formatDistance(props.total_distance || 0)}</div>
        </div>
        <div className="bg-black/30 p-2 rounded">
          <div className="text-[#5f6368] text-[9px] uppercase mb-1">Elevation Range</div>
          <div className="text-[#00b4d8] text-sm font-bold">
            {Math.round(props.min_elevation || 0)}m - {Math.round(props.max_elevation || 0)}m
          </div>
        </div>
        {isLOS && (
          <>
            <div className="bg-black/30 p-2 rounded">
              <div className="text-[#5f6368] text-[9px] uppercase mb-1">Observer Height</div>
              <div className="text-[#00b4d8] text-sm font-bold">{props.observer_height || 2}m</div>
            </div>
            <div className="bg-black/30 p-2 rounded">
              <div className="text-[#5f6368] text-[9px] uppercase mb-1">Elevation Diff</div>
              <div className="text-[#00b4d8] text-sm font-bold">
                {Math.round((props.target_elevation || 0) - (props.observer_elevation || 0))}m
              </div>
            </div>
          </>
        )}
      </div>
      
      {props.profile && (
        <canvas ref={canvasRef} className="w-full h-[100px] bg-black/30 rounded mb-3" />
      )}
      
      <div className="flex justify-end gap-2">
        <button 
          onClick={handleDelete}
          className="bg-gradient-to-br from-[#ef4444] to-[#dc2626] border-none text-white px-4 py-1.5 rounded text-[11px] cursor-pointer flex items-center gap-1 hover:shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all font-mono font-semibold"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  )
}

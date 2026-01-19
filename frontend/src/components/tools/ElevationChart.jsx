/**
 * ElevationChart - Displays elevation profile as a chart
 */

import { useEffect, useRef } from 'react'

const styles = {
  container: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    background: 'rgba(10, 10, 20, 0.95)',
    borderRadius: '8px',
    border: '2px solid rgba(100, 100, 120, 0.5)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    padding: '12px',
    minWidth: '400px',
    maxWidth: '600px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  title: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '0 4px',
  },
  stats: {
    display: 'flex',
    gap: '16px',
    marginBottom: '8px',
    fontFamily: 'monospace',
    fontSize: '11px',
  },
  stat: {
    color: '#888',
  },
  statValue: {
    color: '#0ff',
    fontWeight: 'bold',
  },
  canvas: {
    width: '100%',
    height: '120px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '4px',
  },
}

export default function ElevationChart({ data, onClose, title = 'Elevation Profile' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!data?.profile || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const profile = data.profile

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2 // Retina
    canvas.height = rect.height * 2
    ctx.scale(2, 2)

    const width = rect.width
    const height = rect.height
    const padding = { top: 10, right: 10, bottom: 25, left: 40 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Get data ranges
    const elevations = profile.map(p => p.elevation).filter(e => e !== null)
    const minElev = Math.min(...elevations) - 5
    const maxElev = Math.max(...elevations) + 5
    const maxDist = data.total_distance || profile[profile.length - 1]?.distance || 1

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 0.5

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight * i) / 4
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }

    // Draw axes labels
    ctx.fillStyle = '#666'
    ctx.font = '9px monospace'
    ctx.textAlign = 'right'

    // Y-axis labels (elevation)
    for (let i = 0; i <= 4; i++) {
      const elev = maxElev - ((maxElev - minElev) * i) / 4
      const y = padding.top + (chartHeight * i) / 4
      ctx.fillText(`${Math.round(elev)}m`, padding.left - 4, y + 3)
    }

    // X-axis labels (distance)
    ctx.textAlign = 'center'
    for (let i = 0; i <= 4; i++) {
      const dist = (maxDist * i) / 4
      const x = padding.left + (chartWidth * i) / 4
      const label = dist >= 1000 ? `${(dist / 1000).toFixed(1)}km` : `${Math.round(dist)}m`
      ctx.fillText(label, x, height - 5)
    }

    // Draw elevation profile
    if (profile.length > 1) {
      // Fill area under curve
      ctx.beginPath()
      ctx.moveTo(padding.left, padding.top + chartHeight)

      profile.forEach((point, i) => {
        const x = padding.left + (point.distance / maxDist) * chartWidth
        const y = padding.top + chartHeight - ((point.elevation - minElev) / (maxElev - minElev)) * chartHeight
        if (i === 0) {
          ctx.lineTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
      ctx.closePath()

      // Gradient fill
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
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.strokeStyle = '#0ff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw points
      profile.forEach((point) => {
        const x = padding.left + (point.distance / maxDist) * chartWidth
        const y = padding.top + chartHeight - ((point.elevation - minElev) / (maxElev - minElev)) * chartHeight
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fillStyle = '#0ff'
        ctx.fill()
      })
    }

    // Draw line of sight if available
    if (data.observer_elevation !== undefined && data.target_elevation !== undefined) {
      const startX = padding.left
      const startY = padding.top + chartHeight - ((data.observer_elevation - minElev) / (maxElev - minElev)) * chartHeight
      const endX = padding.left + chartWidth
      const endY = padding.top + chartHeight - ((data.target_elevation - minElev) / (maxElev - minElev)) * chartHeight

      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.lineTo(endX, endY)
      ctx.strokeStyle = data.visible ? '#0f0' : '#f00'
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 3])
      ctx.stroke()
      ctx.setLineDash([])

      // Draw obstruction point if not visible
      if (data.obstruction) {
        const obsX = padding.left + (data.obstruction.distance / maxDist) * chartWidth
        const obsY = padding.top + chartHeight - ((data.obstruction.elevation - minElev) / (maxElev - minElev)) * chartHeight
        
        ctx.beginPath()
        ctx.arc(obsX, obsY, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#f00'
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

  }, [data])

  if (!data) return null

  const formatDist = (m) => m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>{title}</span>
        <button style={styles.closeBtn} onClick={onClose}>×</button>
      </div>
      
      <div style={styles.stats}>
        <span style={styles.stat}>
          Distance: <span style={styles.statValue}>{formatDist(data.total_distance || 0)}</span>
        </span>
        <span style={styles.stat}>
          Min: <span style={styles.statValue}>{Math.round(data.min_elevation || 0)}m</span>
        </span>
        <span style={styles.stat}>
          Max: <span style={styles.statValue}>{Math.round(data.max_elevation || 0)}m</span>
        </span>
        {data.visible !== undefined && (
          <span style={{ ...styles.stat, color: data.visible ? '#0f0' : '#f00' }}>
            {data.visible ? '✓ VISIBLE' : '✗ BLOCKED'}
          </span>
        )}
      </div>
      
      <canvas ref={canvasRef} style={styles.canvas} />
    </div>
  )
}

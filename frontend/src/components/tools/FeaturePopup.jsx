/**
 * FeaturePopup - Edit popup for drawn features (shapes)
 */

import { useState } from 'react'

const COLORS = [
  '#00ff00', // Green
  '#ff0000', // Red
  '#0088ff', // Blue
  '#ffcc00', // Yellow
  '#ff6600', // Orange
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#ffffff', // White
]

const styles = {
  container: {
    fontFamily: 'monospace',
    fontSize: '12px',
    minWidth: '200px',
  },
  field: {
    marginBottom: '8px',
  },
  label: {
    color: '#666',
    fontSize: '10px',
    marginBottom: '2px',
  },
  input: {
    width: '100%',
    padding: '4px 6px',
    background: '#222',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '3px',
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '4px',
  },
  colorBtn: {
    width: '24px',
    height: '24px',
    border: '2px solid transparent',
    borderRadius: '3px',
    cursor: 'pointer',
  },
  colorBtnActive: {
    border: '2px solid #fff',
  },
  actions: {
    display: 'flex',
    gap: '4px',
    marginTop: '10px',
  },
  btn: {
    flex: 1,
    padding: '6px 10px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '11px',
  },
  saveBtn: {
    background: '#0a0',
    color: '#fff',
  },
  deleteBtn: {
    background: '#600',
    color: '#fff',
  },
}

export default function FeaturePopup({ feature, onSave, onDelete }) {
  const [name, setName] = useState(feature.name)
  const [color, setColor] = useState(feature.style?.color || '#00ff00')

  const handleSave = () => {
    onSave?.({
      ...feature,
      name,
      style: {
        ...feature.style,
        color,
        fillColor: color,
      },
    })
  }

  const handleDelete = () => {
    if (confirm(`Delete "${feature.name}"?`)) {
      onDelete?.(feature.id)
    }
  }

  return (
    <div style={styles.container}>
      {/* Name field */}
      <div style={styles.field}>
        <div style={styles.label}>NAME</div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* Type display */}
      <div style={styles.field}>
        <div style={styles.label}>TYPE</div>
        <div style={{ color: '#888' }}>{feature.feature_type_display}</div>
      </div>

      {/* Color picker */}
      <div style={styles.field}>
        <div style={styles.label}>COLOR</div>
        <div style={styles.colorGrid}>
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                ...styles.colorBtn,
                background: c,
                ...(color === c ? styles.colorBtnActive : {}),
              }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button 
          onClick={handleSave}
          style={{ ...styles.btn, ...styles.saveBtn }}
        >
          Save
        </button>
        <button 
          onClick={handleDelete}
          style={{ ...styles.btn, ...styles.deleteBtn }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

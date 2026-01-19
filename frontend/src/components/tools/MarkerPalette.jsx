/**
 * MarkerPalette - Slide-out panel for selecting MIL-STD-2525 symbols
 */

import { useState, useMemo } from 'react'
import { SYMBOL_CATEGORIES, AFFILIATIONS, generateSIDC, getSymbolDataUrl } from '../../utils/milsymbols'

const styles = {
  container: {
    position: 'absolute',
    left: 70,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 999,
    background: 'rgba(0, 0, 0, 0.95)',
    borderRadius: '6px',
    border: '1px solid #444',
    width: '280px',
    maxHeight: '70vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '12px',
    borderBottom: '1px solid #444',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#fff',
    fontWeight: 'bold',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: '18px',
    lineHeight: 1,
  },
  affiliationBar: {
    display: 'flex',
    padding: '8px',
    gap: '4px',
    borderBottom: '1px solid #333',
  },
  affiliationBtn: {
    flex: 1,
    padding: '6px',
    border: '1px solid',
    borderRadius: '3px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '10px',
    fontWeight: 'bold',
    textAlign: 'center',
    transition: 'all 0.15s',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
  },
  category: {
    marginBottom: '12px',
  },
  categoryTitle: {
    color: '#888',
    fontSize: '10px',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '6px',
    paddingLeft: '4px',
  },
  symbolGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '4px',
  },
  symbolBtn: {
    aspectRatio: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  symbolBtnActive: {
    background: 'rgba(0, 200, 100, 0.2)',
    borderColor: '#0c8',
  },
  symbolBtnHover: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderColor: '#555',
  },
  symbolImg: {
    width: '40px',
    height: '40px',
    objectFit: 'contain',
  },
  symbolName: {
    color: '#888',
    fontSize: '8px',
    fontFamily: 'monospace',
    marginTop: '2px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
  },
  selectedInfo: {
    padding: '10px',
    borderTop: '1px solid #444',
    background: 'rgba(0, 100, 50, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  selectedText: {
    color: '#0c8',
    fontFamily: 'monospace',
    fontSize: '11px',
  },
}

export default function MarkerPalette({ 
  isOpen, 
  onClose,
  selectedSymbol,
  selectedAffiliation,
  onSymbolSelect,
  onAffiliationSelect,
}) {
  const [hoveredSymbol, setHoveredSymbol] = useState(null)

  // Generate symbol previews for the current affiliation
  const symbolPreviews = useMemo(() => {
    const previews = {}
    Object.entries(SYMBOL_CATEGORIES).forEach(([catId, category]) => {
      previews[catId] = category.symbols.map(symbol => {
        const sidc = generateSIDC(symbol.sidc, selectedAffiliation)
        return {
          ...symbol,
          sidc,
          preview: getSymbolDataUrl(sidc, { size: 30 }),
        }
      })
    })
    return previews
  }, [selectedAffiliation])

  if (!isOpen) return null

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span>Symbol Palette</span>
        <button style={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      {/* Affiliation selector */}
      <div style={styles.affiliationBar}>
        {Object.entries(AFFILIATIONS).map(([code, aff]) => (
          <button
            key={code}
            onClick={() => onAffiliationSelect(code)}
            style={{
              ...styles.affiliationBtn,
              background: selectedAffiliation === code ? aff.color : 'transparent',
              borderColor: aff.color,
              color: selectedAffiliation === code ? '#000' : aff.color,
            }}
          >
            {aff.name}
          </button>
        ))}
      </div>

      {/* Symbol categories */}
      <div style={styles.content}>
        {Object.entries(SYMBOL_CATEGORIES).map(([catId, category]) => (
          <div key={catId} style={styles.category}>
            <div style={styles.categoryTitle}>{category.name}</div>
            <div style={styles.symbolGrid}>
              {symbolPreviews[catId]?.map(symbol => (
                <button
                  key={symbol.id}
                  onClick={() => onSymbolSelect(symbol)}
                  onMouseEnter={() => setHoveredSymbol(symbol.id)}
                  onMouseLeave={() => setHoveredSymbol(null)}
                  style={{
                    ...styles.symbolBtn,
                    ...(selectedSymbol?.id === symbol.id ? styles.symbolBtnActive : {}),
                    ...(hoveredSymbol === symbol.id && selectedSymbol?.id !== symbol.id ? styles.symbolBtnHover : {}),
                  }}
                  title={symbol.name}
                >
                  <img 
                    src={symbol.preview} 
                    alt={symbol.name}
                    style={styles.symbolImg}
                  />
                  <span style={styles.symbolName}>{symbol.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected symbol info */}
      {selectedSymbol && (
        <div style={styles.selectedInfo}>
          <img 
            src={getSymbolDataUrl(generateSIDC(selectedSymbol.sidc, selectedAffiliation), { size: 30 })}
            alt={selectedSymbol.name}
            style={{ width: '40px', height: '40px' }}
          />
          <div style={styles.selectedText}>
            Click on map to place<br/>
            <strong>{selectedSymbol.name}</strong>
          </div>
        </div>
      )}
    </div>
  )
}

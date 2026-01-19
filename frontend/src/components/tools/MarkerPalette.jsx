/**
 * MarkerPalette - Slide-out panel for selecting MIL-STD-2525 symbols
 * Premium military-style design with Tailwind CSS
 */

import { useState, useMemo } from 'react'
import { SYMBOL_CATEGORIES, AFFILIATIONS, generateSIDC, getSymbolDataUrl } from '../../utils/milsymbols'

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
    <div className="absolute left-[70px] top-1/2 -translate-y-1/2 z-[999] bg-[#0a0e14]/95 backdrop-blur-xl border border-white/8 rounded-lg w-[280px] max-h-[70vh] overflow-hidden flex flex-col shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-white/8 flex justify-between items-center">
        <span className="text-white text-xs font-mono font-semibold uppercase tracking-wider">Symbol Palette</span>
        <button 
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center bg-transparent border-none text-[#5f6368] cursor-pointer hover:text-[#9aa0a6] transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Affiliation selector */}
      <div className="flex p-2 gap-1 border-b border-white/8">
        {Object.entries(AFFILIATIONS).map(([code, aff]) => (
          <button
            key={code}
            onClick={() => onAffiliationSelect(code)}
            className={`
              flex-1 px-1.5 py-1.5 border rounded text-center text-[10px] font-mono font-semibold transition-all
              ${selectedAffiliation === code 
                ? `bg-[${aff.color}] text-black border-[${aff.color}]` 
                : 'bg-transparent border-[${aff.color}] text-[${aff.color}] hover:bg-[${aff.color}]/20'
              }
            `}
            style={{
              backgroundColor: selectedAffiliation === code ? aff.color : 'transparent',
              borderColor: aff.color,
              color: selectedAffiliation === code ? '#000' : aff.color,
            }}
          >
            {aff.name}
          </button>
        ))}
      </div>

      {/* Symbol categories */}
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(SYMBOL_CATEGORIES).map(([catId, category]) => (
          <div key={catId} className="mb-3">
            <div className="text-[#5f6368] text-[10px] font-mono uppercase tracking-wide mb-1.5 pl-1">
              {category.name}
            </div>
            <div className="grid grid-cols-4 gap-1">
              {symbolPreviews[catId]?.map(symbol => {
                const isSelected = selectedSymbol?.id === symbol.id
                const isHovered = hoveredSymbol === symbol.id
                
                return (
                  <button
                    key={symbol.id}
                    onClick={() => onSymbolSelect(symbol)}
                    onMouseEnter={() => setHoveredSymbol(symbol.id)}
                    onMouseLeave={() => setHoveredSymbol(null)}
                    className={`
                      aspect-square flex flex-col items-center justify-center p-1 rounded border transition-all
                      ${isSelected 
                        ? 'bg-[#34d399]/20 border-[#34d399]' 
                        : 'bg-transparent border-white/8 hover:bg-white/10 hover:border-white/20'
                      }
                    `}
                    title={symbol.name}
                  >
                    <img 
                      src={symbol.preview} 
                      alt={symbol.name}
                      className="w-10 h-10 object-contain"
                    />
                    <span className="text-[#5f6368] text-[8px] font-mono mt-0.5 text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">
                      {symbol.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected symbol info */}
      {selectedSymbol && (
        <div className="px-2.5 py-2.5 border-t border-white/8 bg-[#34d399]/10 flex items-center gap-2.5">
          <img 
            src={getSymbolDataUrl(generateSIDC(selectedSymbol.sidc, selectedAffiliation), { size: 30 })}
            alt={selectedSymbol.name}
            className="w-10 h-10"
          />
          <div className="text-[#34d399] font-mono text-[11px]">
            Click on map to place<br/>
            <strong>{selectedSymbol.name}</strong>
          </div>
        </div>
      )}
    </div>
  )
}

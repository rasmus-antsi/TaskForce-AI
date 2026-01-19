/**
 * MIL-STD-2525 Symbol utilities
 * Uses milsymbol library to generate tactical military symbols
 */

import ms from 'milsymbol'

// Affiliation codes for SIDC
export const AFFILIATIONS = {
  F: { code: 'F', name: 'Friendly', color: '#80c0ff' },
  H: { code: 'H', name: 'Hostile', color: '#ff8080' },
  N: { code: 'N', name: 'Neutral', color: '#aaffaa' },
  U: { code: 'U', name: 'Unknown', color: '#ffff80' },
}

// Symbol categories with their SIDC patterns
export const SYMBOL_CATEGORIES = {
  groundUnits: {
    name: 'Ground Units',
    symbols: [
      { id: 'infantry', name: 'Infantry', sidc: 'S*G*UCII--*****' },
      { id: 'armor', name: 'Armor', sidc: 'S*G*UCAA--*****' },
      { id: 'artillery', name: 'Artillery', sidc: 'S*G*UCAF--*****' },
      { id: 'recon', name: 'Reconnaissance', sidc: 'S*G*UCRS--*****' },
      { id: 'hq', name: 'Headquarters', sidc: 'S*G*UH----*****' },
      { id: 'engineer', name: 'Engineer', sidc: 'S*G*UCE---*****' },
      { id: 'signal', name: 'Signal', sidc: 'S*G*UCCS--*****' },
      { id: 'supply', name: 'Supply', sidc: 'S*G*USS---*****' },
      { id: 'medical', name: 'Medical', sidc: 'S*G*USM---*****' },
    ],
  },
  air: {
    name: 'Air Units',
    symbols: [
      { id: 'fixedwing', name: 'Fixed Wing', sidc: 'S*A*MF----*****' },
      { id: 'rotary', name: 'Rotary Wing', sidc: 'S*A*MH----*****' },
      { id: 'uav', name: 'UAV', sidc: 'S*A*MFQ---*****' },
    ],
  },
  points: {
    name: 'Control Points',
    symbols: [
      { id: 'waypoint', name: 'Waypoint', sidc: 'G*G*GPWA--*****' },
      { id: 'objective', name: 'Objective', sidc: 'G*G*GPO---*****' },
      { id: 'target', name: 'Target', sidc: 'G*F*T-----*****' },
      { id: 'observation', name: 'Observation Post', sidc: 'G*G*GPOP--*****' },
      { id: 'checkpoint', name: 'Checkpoint', sidc: 'G*G*GPPC--*****' },
      { id: 'rally', name: 'Rally Point', sidc: 'G*G*GPRY--*****' },
    ],
  },
}

/**
 * Generate SIDC with affiliation
 * @param {string} baseSidc - Base SIDC pattern (with * for affiliation)
 * @param {string} affiliation - F, H, N, or U
 * @returns {string} Complete SIDC
 */
export function generateSIDC(baseSidc, affiliation = 'F') {
  return baseSidc.replace('*', affiliation)
}

/**
 * Create a milsymbol Symbol object
 * @param {string} sidc - Symbol ID Code
 * @param {object} options - Additional options (size, uniqueDesignation, etc.)
 * @returns {ms.Symbol} Milsymbol Symbol object
 */
export function createSymbol(sidc, options = {}) {
  const defaultOptions = {
    size: 35,
    ...options,
  }
  return new ms.Symbol(sidc, defaultOptions)
}

/**
 * Get SVG data URL for a symbol
 * @param {string} sidc - Symbol ID Code
 * @param {object} options - Symbol options
 * @returns {string} Data URL for the SVG
 */
export function getSymbolDataUrl(sidc, options = {}) {
  const symbol = createSymbol(sidc, options)
  return symbol.toDataURL()
}

/**
 * Get symbol anchor point (center of the symbol)
 * @param {string} sidc - Symbol ID Code
 * @param {object} options - Symbol options
 * @returns {{x: number, y: number}} Anchor coordinates
 */
export function getSymbolAnchor(sidc, options = {}) {
  const symbol = createSymbol(sidc, options)
  const anchor = symbol.getAnchor()
  return { x: anchor.x, y: anchor.y }
}

/**
 * Get all symbols as a flat array for easy searching
 */
export function getAllSymbols() {
  const allSymbols = []
  Object.entries(SYMBOL_CATEGORIES).forEach(([categoryId, category]) => {
    category.symbols.forEach(symbol => {
      allSymbols.push({
        ...symbol,
        categoryId,
        categoryName: category.name,
      })
    })
  })
  return allSymbols
}

/**
 * Get symbol by ID
 */
export function getSymbolById(id) {
  return getAllSymbols().find(s => s.id === id)
}

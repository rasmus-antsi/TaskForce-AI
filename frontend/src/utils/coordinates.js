import * as mgrs from 'mgrs'
import proj4 from 'proj4'

// Define UTM zones for Estonia (zones 34N and 35N)
proj4.defs('EPSG:32634', '+proj=utm +zone=34 +datum=WGS84 +units=m +no_defs') // UTM 34N
proj4.defs('EPSG:32635', '+proj=utm +zone=35 +datum=WGS84 +units=m +no_defs') // UTM 35N

/**
 * Convert latitude/longitude to MGRS
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @param {number} precision - MGRS precision (1-5, default 5 = 1m)
 * @param {boolean} formatted - Add spaces for readability
 * @returns {string} MGRS coordinate string
 */
export function latLonToMGRS(lat, lon, precision = 5, formatted = true) {
  try {
    const raw = mgrs.forward([lon, lat], precision)
    if (!formatted || !raw || raw.length < 5) return raw
    
    // Format: "35V MG 72456 93421" from "35VMG7245693421"
    const gzd = raw.substring(0, 3) // Grid Zone Designator (e.g., "35V")
    const sq = raw.substring(3, 5)  // 100km Square ID (e.g., "MG")
    const coords = raw.substring(5) // Numeric coords
    const half = coords.length / 2
    const easting = coords.substring(0, half)
    const northing = coords.substring(half)
    
    return `${gzd} ${sq} ${easting} ${northing}`
  } catch (e) {
    return 'Invalid'
  }
}

/**
 * Convert MGRS to latitude/longitude
 * @param {string} mgrsStr - MGRS coordinate string
 * @returns {{lat: number, lon: number}} Lat/lon object
 */
export function mgrsToLatLon(mgrsStr) {
  try {
    const [lon, lat] = mgrs.toPoint(mgrsStr)
    return { lat, lon }
  } catch (e) {
    return null
  }
}

/**
 * Get UTM zone for a longitude
 * @param {number} lon - Longitude in degrees
 * @returns {number} UTM zone number
 */
export function getUTMZone(lon) {
  return Math.floor((lon + 180) / 6) + 1
}

/**
 * Get UTM zone letter for a latitude
 * @param {number} lat - Latitude in degrees
 * @returns {string} UTM zone letter
 */
export function getUTMZoneLetter(lat) {
  const letters = 'CDEFGHJKLMNPQRSTUVWX'
  if (lat < -80) return 'A'
  if (lat > 84) return 'Z'
  return letters[Math.floor((lat + 80) / 8)]
}

/**
 * Convert latitude/longitude to UTM
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @returns {{zone: number, letter: string, easting: number, northing: number}}
 */
export function latLonToUTM(lat, lon) {
  try {
    const zone = getUTMZone(lon)
    const letter = getUTMZoneLetter(lat)
    const epsgCode = lat >= 0 ? `EPSG:326${zone.toString().padStart(2, '0')}` : `EPSG:327${zone.toString().padStart(2, '0')}`
    
    // Define the UTM zone if not already defined
    if (!proj4.defs(epsgCode)) {
      const hemisphere = lat >= 0 ? '' : ' +south'
      proj4.defs(epsgCode, `+proj=utm +zone=${zone}${hemisphere} +datum=WGS84 +units=m +no_defs`)
    }
    
    const [easting, northing] = proj4('EPSG:4326', epsgCode, [lon, lat])
    
    return {
      zone,
      letter,
      easting: Math.round(easting),
      northing: Math.round(northing)
    }
  } catch (e) {
    return null
  }
}

/**
 * Convert UTM to latitude/longitude
 * @param {number} zone - UTM zone number
 * @param {string} letter - UTM zone letter
 * @param {number} easting - Easting in meters
 * @param {number} northing - Northing in meters
 * @returns {{lat: number, lon: number}}
 */
export function utmToLatLon(zone, letter, easting, northing) {
  try {
    const isNorth = letter >= 'N'
    const epsgCode = isNorth ? `EPSG:326${zone.toString().padStart(2, '0')}` : `EPSG:327${zone.toString().padStart(2, '0')}`
    
    if (!proj4.defs(epsgCode)) {
      const hemisphere = isNorth ? '' : ' +south'
      proj4.defs(epsgCode, `+proj=utm +zone=${zone}${hemisphere} +datum=WGS84 +units=m +no_defs`)
    }
    
    const [lon, lat] = proj4(epsgCode, 'EPSG:4326', [easting, northing])
    return { lat, lon }
  } catch (e) {
    return null
  }
}

/**
 * Format latitude/longitude for display
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @param {string} format - 'dd' (decimal), 'dms' (degrees/minutes/seconds)
 * @returns {string}
 */
export function formatLatLon(lat, lon, format = 'dd') {
  if (format === 'dms') {
    const latDir = lat >= 0 ? 'N' : 'S'
    const lonDir = lon >= 0 ? 'E' : 'W'
    
    const formatDMS = (deg) => {
      const d = Math.abs(deg)
      const degrees = Math.floor(d)
      const minutes = Math.floor((d - degrees) * 60)
      const seconds = ((d - degrees) * 60 - minutes) * 60
      return `${degrees}° ${minutes}' ${seconds.toFixed(1)}"`
    }
    
    return `${formatDMS(lat)} ${latDir}, ${formatDMS(lon)} ${lonDir}`
  }
  
  // Decimal degrees
  const latDir = lat >= 0 ? 'N' : 'S'
  const lonDir = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lon).toFixed(6)}° ${lonDir}`
}

/**
 * Format UTM for display
 * @param {{zone: number, letter: string, easting: number, northing: number}} utm
 * @returns {string}
 */
export function formatUTM(utm) {
  if (!utm) return 'Invalid'
  return `${utm.zone}${utm.letter} ${utm.easting} ${utm.northing}`
}

/**
 * Parse coordinate string (auto-detect format)
 * @param {string} input - Coordinate string
 * @returns {{lat: number, lon: number} | null}
 */
export function parseCoordinates(input) {
  const trimmed = input.trim().toUpperCase()
  
  // Try MGRS first (e.g., "35VMG7245693421")
  if (/^[0-9]{1,2}[C-X][A-Z]{2}[0-9]+$/i.test(trimmed)) {
    return mgrsToLatLon(trimmed)
  }
  
  // Try UTM (e.g., "35V 372456 6593421" or "35V372456 6593421")
  const utmMatch = trimmed.match(/^([0-9]{1,2})([C-X])\s*([0-9]+)\s+([0-9]+)$/i)
  if (utmMatch) {
    const zone = parseInt(utmMatch[1])
    const letter = utmMatch[2]
    const easting = parseFloat(utmMatch[3])
    const northing = parseFloat(utmMatch[4])
    return utmToLatLon(zone, letter, easting, northing)
  }
  
  // Try decimal degrees (e.g., "59.437, 24.754" or "59.437N 24.754E")
  const ddMatch = trimmed.match(/^(-?[0-9.]+)\s*°?\s*([NS])?\s*[,\s]\s*(-?[0-9.]+)\s*°?\s*([EW])?$/i)
  if (ddMatch) {
    let lat = parseFloat(ddMatch[1])
    let lon = parseFloat(ddMatch[3])
    if (ddMatch[2] === 'S') lat = -lat
    if (ddMatch[4] === 'W') lon = -lon
    return { lat, lon }
  }
  
  return null
}

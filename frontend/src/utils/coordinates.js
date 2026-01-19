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

/**
 * Calculate distance between two lat/lng points in meters (Haversine formula)
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000 // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate total distance along a path of points
 * @param {Array<[number, number]>} points - Array of [lat, lng] pairs
 * @returns {number} Total distance in meters
 */
export function calculatePathDistance(points) {
  if (points.length < 2) return 0
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += calculateDistance(points[i-1][0], points[i-1][1], points[i][0], points[i][1])
  }
  return total
}

/**
 * Calculate area of a polygon in square meters using spherical excess formula
 * @param {Array<[number, number]>} points - Array of [lat, lng] pairs (closed polygon)
 * @returns {number} Area in square meters
 */
export function calculatePolygonArea(points) {
  if (points.length < 3) return 0
  
  // Ensure polygon is closed
  const closed = [...points]
  if (closed[0][0] !== closed[closed.length - 1][0] || closed[0][1] !== closed[closed.length - 1][1]) {
    closed.push(closed[0])
  }
  
  const R = 6371000 // Earth radius in meters
  let area = 0
  
  // Use spherical excess formula (more accurate for large areas)
  for (let i = 0; i < closed.length - 1; i++) {
    const p1 = closed[i]
    const p2 = closed[i + 1]
    
    const lat1 = p1[0] * Math.PI / 180
    const lon1 = p1[1] * Math.PI / 180
    const lat2 = p2[0] * Math.PI / 180
    const lon2 = p2[1] * Math.PI / 180
    
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2))
  }
  
  area = Math.abs(area * R * R / 2)
  
  // If result seems too large, use simpler planar approximation
  if (area > 1e12) { // > 1 million km², probably wrong
    // Use shoelace formula on projected coordinates
    area = 0
    for (let i = 0; i < closed.length - 1; i++) {
      const p1 = closed[i]
      const p2 = closed[i + 1]
      area += p1[1] * p2[0] - p2[1] * p1[0]
    }
    area = Math.abs(area) / 2
    
    // Convert to square meters (rough approximation)
    const avgLat = closed.reduce((sum, p) => sum + p[0], 0) / (closed.length - 1)
    const latRad = avgLat * Math.PI / 180
    const latMetersPerDegree = 111320 // meters per degree latitude
    const lonMetersPerDegree = 111320 * Math.cos(latRad) // meters per degree longitude
    area = area * latMetersPerDegree * lonMetersPerDegree
  }
  
  return area
}

/**
 * Convert square meters to hectares
 * @param {number} squareMeters - Area in square meters
 * @returns {number} Area in hectares
 */
export function squareMetersToHectares(squareMeters) {
  return squareMeters / 10000
}

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted string (e.g., "1.5 km" or "250 m")
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(2)} km`
}

/**
 * Calculate perimeter of a polygon in meters
 * @param {Array<[number, number]>} points - Array of [lat, lng] pairs
 * @returns {number} Perimeter in meters
 */
export function calculatePolygonPerimeter(points) {
  if (points.length < 2) return 0
  
  let perimeter = 0
  for (let i = 0; i < points.length - 1; i++) {
    perimeter += calculateDistance(points[i][0], points[i][1], points[i+1][0], points[i+1][1])
  }
  
  // Close the polygon
  if (points.length > 2) {
    perimeter += calculateDistance(
      points[points.length - 1][0], points[points.length - 1][1],
      points[0][0], points[0][1]
    )
  }
  
  return perimeter
}

/**
 * Calculate bearing between two points in degrees
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Bearing in degrees (0-360)
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180
  const lat1Rad = lat1 * Math.PI / 180
  const lat2Rad = lat2 * Math.PI / 180
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad)
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon)
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI
  bearing = (bearing + 360) % 360
  return bearing
}

/**
 * Get center point of a polygon or circle
 * @param {Object} geometry - Geometry object
 * @param {string} featureType - Type of feature
 * @returns {[number, number]} Center as [lat, lng]
 */
export function getFeatureCenter(geometry, featureType) {
  if (featureType === 'circle' || geometry?.type === 'circle') {
    if (geometry.center) {
      return geometry.center
    } else if (geometry.coordinates) {
      return [geometry.coordinates[1], geometry.coordinates[0]]
    }
  }
  
  if (featureType === 'polygon' || featureType === 'rectangle' || geometry?.type === 'polygon') {
    let coords = geometry.coordinates
    if (geometry.type === 'Polygon') {
      coords = geometry.coordinates[0]
    }
    
    // Calculate centroid
    let latSum = 0, lngSum = 0
    coords.forEach(coord => {
      const [lat, lng] = Array.isArray(coord[0]) ? [coord[0][1], coord[0][0]] : [coord[1], coord[0]]
      latSum += lat
      lngSum += lng
    })
    return [latSum / coords.length, lngSum / coords.length]
  }
  
  if (featureType === 'line' || geometry?.type === 'line') {
    let coords = geometry.coordinates
    if (geometry.type === 'LineString') {
      coords = geometry.coordinates.map(c => [c[1], c[0]])
    }
    
    // Get middle point
    const mid = Math.floor(coords.length / 2)
    return coords[mid]
  }
  
  return null
}

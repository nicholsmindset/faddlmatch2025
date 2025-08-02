import { Context } from "@netlify/edge-functions"

interface GeoData {
  country?: { code?: string; name?: string }
  city?: string
  timezone?: string
  subdivision?: { code?: string; name?: string }
}

export default async (request: Request, context: Context) => {
  const { geo, ip } = context

  // Validate Singapore and nearby regions for matrimonial service
  const allowedCountries = ['SG', 'MY', 'ID', 'BN'] // Singapore, Malaysia, Indonesia, Brunei
  const countryCode = geo?.country?.code || ''
  
  if (!allowedCountries.includes(countryCode)) {
    return new Response(JSON.stringify({
      error: 'Service not available in your region',
      country: geo?.country?.name || 'Unknown',
      message: 'FADDL Match is currently available in Singapore, Malaysia, Indonesia, and Brunei.',
      supportEmail: 'support@faddlmatch.com'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=3600',
        'X-Region-Block': 'true'
      }
    })
  }

  // Map user location to our service zones for better matching
  const locationData = {
    country: countryCode,
    city: geo?.city || 'Unknown',
    timezone: geo?.timezone || 'Asia/Singapore',
    subdivision: geo?.subdivision?.code || '',
    zone: mapToServiceZone(geo as GeoData),
    prayerTimeZone: mapToPrayerTimeZone(geo as GeoData),
    // Add halal restaurant proximity data
    halalProximity: getHalalProximityZone(countryCode, geo?.city),
    islamicCommunity: getIslamicCommunityZone(countryCode, geo?.subdivision?.name)
  }

  return new Response(JSON.stringify(locationData), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=300',
      'X-Service-Zone': locationData.zone,
      'X-Prayer-Zone': locationData.prayerTimeZone
    }
  })
}

function mapToServiceZone(geo: GeoData): string {
  const country = geo?.country?.code
  
  // Singapore regions
  if (country === 'SG') {
    const regionMap: Record<string, string> = {
      'Central Region': 'sg-central',
      'North Region': 'sg-north',
      'North-East Region': 'sg-northeast',
      'East Region': 'sg-east',
      'West Region': 'sg-west',
      'South Region': 'sg-south'
    }
    return regionMap[geo?.subdivision?.name || ''] || 'sg-central'
  }
  
  // Malaysia regions
  if (country === 'MY') {
    const stateMap: Record<string, string> = {
      'Kuala Lumpur': 'my-kl',
      'Selangor': 'my-selangor',
      'Johor': 'my-johor',
      'Penang': 'my-penang',
      'Perak': 'my-perak',
      'Kedah': 'my-kedah',
      'Kelantan': 'my-kelantan',
      'Terengganu': 'my-terengganu',
      'Pahang': 'my-pahang',
      'Negeri Sembilan': 'my-ns',
      'Malacca': 'my-melaka',
      'Perlis': 'my-perlis',
      'Sabah': 'my-sabah',
      'Sarawak': 'my-sarawak'
    }
    return stateMap[geo?.subdivision?.name || ''] || 'my-kl'
  }
  
  // Indonesia regions
  if (country === 'ID') {
    const cityMap: Record<string, string> = {
      'Jakarta': 'id-jakarta',
      'Surabaya': 'id-surabaya',
      'Bandung': 'id-bandung',
      'Medan': 'id-medan',
      'Semarang': 'id-semarang',
      'Makassar': 'id-makassar',
      'Palembang': 'id-palembang',
      'Yogyakarta': 'id-yogyakarta'
    }
    return cityMap[geo?.city || ''] || 'id-jakarta'
  }
  
  // Brunei
  if (country === 'BN') {
    return 'bn-bandar'
  }
  
  return 'sg-central' // Default fallback
}

function mapToPrayerTimeZone(geo: GeoData): string {
  const country = geo?.country?.code
  
  const prayerZones: Record<string, string> = {
    'SG': 'asia_singapore',
    'MY': 'asia_kuala_lumpur',
    'ID': 'asia_jakarta',
    'BN': 'asia_brunei'
  }
  
  return prayerZones[country || ''] || 'asia_singapore'
}

function getHalalProximityZone(countryCode: string, city?: string): string {
  // High density halal areas
  const halalZones: Record<string, Record<string, string>> = {
    'SG': {
      'Singapore': 'high', // Geylang, Kampong Glam, etc.
    },
    'MY': {
      'Kuala Lumpur': 'very-high',
      'Shah Alam': 'very-high',
      'Johor Bahru': 'high',
      'Penang': 'high'
    },
    'ID': {
      'Jakarta': 'very-high',
      'Surabaya': 'very-high',
      'Bandung': 'high',
      'Medan': 'high'
    },
    'BN': {
      'Bandar Seri Begawan': 'very-high'
    }
  }
  
  return halalZones[countryCode]?.[city || ''] || 'medium'
}

function getIslamicCommunityZone(countryCode: string, subdivision?: string): string {
  // Islamic community density mapping
  const communityStrength: Record<string, string> = {
    'SG': 'medium', // 14% Muslim population
    'MY': 'very-high', // 61% Muslim population
    'ID': 'very-high', // 87% Muslim population
    'BN': 'very-high' // 78% Muslim population
  }
  
  return communityStrength[countryCode] || 'low'
}
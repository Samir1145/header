/**
 * Utility functions for location-based filtering
 */

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Filter markers based on center point and radius
export function filterMarkersByRadius(
  markers: Array<{ lat: number; lng: number; [key: string]: any }>,
  center: { lat: number; lng: number },
  radiusKm: number
): Array<{ lat: number; lng: number; [key: string]: any }> {
  if (radiusKm === 0) {
    return markers; // Show all markers
  }

  return markers.filter(marker => {
    const distance = calculateDistance(
      center.lat,
      center.lng,
      marker.lat,
      marker.lng
    );
    return distance <= radiusKm;
  });
}

// Create a circle overlay to show the search radius
export function createRadiusCircle(
  map: L.Map,
  center: { lat: number; lng: number },
  radiusKm: number
): L.Circle | null {
  if (radiusKm === 0) {
    return null; // Don't show circle for "Show all"
  }

  return L.circle([center.lat, center.lng], {
    radius: radiusKm * 1000, // Convert km to meters
    color: '#3b82f6',
    fillColor: '#3b82f6',
    fillOpacity: 0.1,
    weight: 2,
    dashArray: '5, 5'
  });
}

// Geocoding function using Nominatim (OpenStreetMap)
export async function geocodeAddress(address: string): Promise<{
  lat: number;
  lng: number;
  display_name: string;
} | null> {
  if (!address.trim()) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        display_name: result.display_name
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to find location');
  }
}

// Get location suggestions for autocomplete
export async function getLocationSuggestions(query: string): Promise<Array<{
  lat: number;
  lng: number;
  display_name: string;
  place_id: string;
}>> {
  if (!query.trim() || query.length < 2) return [];

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&extratags=1`
    );
    
    if (!response.ok) {
      throw new Error('Suggestions request failed');
    }

    const data = await response.json();
    
    return data.map((result: any) => ({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: result.display_name,
      place_id: result.place_id
    }));
  } catch (error) {
    console.error('Suggestions error:', error);
    return [];
  }
}

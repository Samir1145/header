import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useLoginUrl } from '@/components/useLoginUrl';
import LocationFilter from '@/components/LocationFilter';
import { filterMarkersByRadius, createRadiusCircle } from '@/lib/locationUtils';

export default function UshahidiMapPage2() {
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<any | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const allMarkersRef = useRef<Array<{ lat: number; lng: number; marker: L.Marker; data: any }>>([]);

  const matchedTab = useLoginUrl();
  const loginUrl = matchedTab || 'https://skillpedia.api.ushahidi.io/api/v3/posts';

  // Apply marker filtering
  const applyMarkerFilter = useCallback((center: { lat: number; lng: number } | null, radius: number) => {
    if (!clusterRef.current) return;
    
    // Clear existing markers
    clusterRef.current.clearLayers();
    
    if (!center || radius === 0) {
      // Show all markers
      allMarkersRef.current.forEach(({ marker }) => {
        clusterRef.current.addLayer(marker);
      });
    } else {
      // Filter markers by radius
      const filteredMarkers = filterMarkersByRadius(
        allMarkersRef.current.map(({ lat, lng, data }) => ({ lat, lng, ...data })),
        center,
        radius
      );
      
      // Add filtered markers
      allMarkersRef.current.forEach(({ marker, lat, lng }) => {
        const isInRadius = filteredMarkers.some(fm => fm.lat === lat && fm.lng === lng);
        if (isInRadius) {
          clusterRef.current.addLayer(marker);
        }
      });
    }
  }, []);

  // Handle location filter changes
  const handleLocationChange = useCallback((center: { lat: number; lng: number } | null, radius: number) => {
    if (mapRef.current && center) {
      // Determine appropriate zoom level based on radius
      let zoomLevel = 12; // Default zoom for better visibility
      
      if (radius === 0) {
        zoomLevel = 5; // Show all - zoom out
      } else if (radius <= 5) {
        zoomLevel = 15; // City level - more zoomed in
      } else if (radius <= 10) {
        zoomLevel = 14; // City area
      } else if (radius <= 25) {
        zoomLevel = 13; // Metropolitan area
      } else if (radius <= 50) {
        zoomLevel = 12; // Regional
      } else {
        zoomLevel = 11; // Large area
      }
      
      // Center map on the selected location with appropriate zoom
      mapRef.current.setView([center.lat, center.lng], zoomLevel, {
        animate: true,
        duration: 1.0
      });
      
      // Update radius circle
      if (radiusCircleRef.current) {
        mapRef.current.removeLayer(radiusCircleRef.current);
      }
      
      const circle = createRadiusCircle(mapRef.current, center, radius);
      if (circle) {
        radiusCircleRef.current = circle;
        mapRef.current.addLayer(circle);
      }
    }
    
    // Filter markers
    applyMarkerFilter(center, radius);
  }, [applyMarkerFilter]);

  const handleClearFilter = useCallback(() => {
    if (radiusCircleRef.current && mapRef.current) {
      mapRef.current.removeLayer(radiusCircleRef.current);
      radiusCircleRef.current = null;
    }
    
    // Reset map to original view
    if (mapRef.current) {
      mapRef.current.setView([20, 78], 5);
    }
    
    // Show all markers
    applyMarkerFilter(null, 0);
  }, [applyMarkerFilter]);

useEffect(() => {
  if (!loginUrl) return;

  // Reset map if it already exists
  if (mapRef.current) {
    mapRef.current.remove();
    mapRef.current = null;
  }

  // Reset cluster if it already exists
  if (clusterRef.current) {
    clusterRef.current.clearLayers();
    clusterRef.current = null;
  }
  
  // Clear stored markers
  allMarkersRef.current = [];

  // Ensure the map container exists
  const mapContainer = document.getElementById('ushahidi-map');
  if (!mapContainer) {
    console.error('Map container not found');
    return;
  }

  const map = L.map('ushahidi-map').setView([20, 78], 5);
  mapRef.current = map;

  // Use custom marker icon
  const defaultIcon = new L.Icon({
    iconUrl: 'leaflet/marker-icon.png',
    iconRetinaUrl: 'leaflet/marker-icon-2x.png',
    shadowUrl: 'leaflet/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);

  // Create marker cluster group
  const markerClusterGroup = (L as any).markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    chunkedLoading: true
  });
  clusterRef.current = markerClusterGroup;
  map.addLayer(markerClusterGroup);

  fetch(loginUrl)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      // Check if map still exists before adding markers
      if (!mapRef.current) return;
      
      // Handle GeoJSON FeatureCollection format
      if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
        data.features.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.type === 'GeometryCollection' && 
              Array.isArray(feature.geometry.geometries)) {
            
            // Find Point geometry in the geometries array
            const pointGeometry = feature.geometry.geometries.find((geom: any) => 
              geom.type === 'Point' && Array.isArray(geom.coordinates)
            );
            
            if (pointGeometry && pointGeometry.coordinates.length >= 2) {
              const [lon, lat] = pointGeometry.coordinates;
              if (lat && lon && clusterRef.current) {
                const marker = L.marker([lat, lon], { icon: defaultIcon })
                  .bindPopup(
                    `<b>${feature.properties?.title || 'No Title'}</b><br>${
                      feature.properties?.description || ''
                    }`
                  );
                
                // Store marker for filtering
                allMarkersRef.current.push({
                  lat,
                  lng: lon,
                  marker,
                  data: feature.properties
                });
                
                markerClusterGroup.addLayer(marker);
              }
            }
          }
        });
      } 
      // Fallback for old format (if needed)
      else {
        const posts = Array.isArray(data.results) ? data.results : [];
        posts.forEach((post: any) => {
          const locationArray = post.values?.['de7c3d0e-bf42-41e5-860c-1e624292a52a'];
          if (Array.isArray(locationArray) && locationArray.length > 0) {
            const { lat, lon } = locationArray[0];
            if (lat && lon && clusterRef.current) {
              const marker = L.marker([lat, lon], { icon: defaultIcon })
                .bindPopup(`<b>${post.title || 'No Title'}</b><br>${post.content || ''}`);
              
              // Store marker for filtering
              allMarkersRef.current.push({
                lat,
                lng: lon,
                marker,
                data: post
              });
              
              markerClusterGroup.addLayer(marker);
            }
          }
        });
      }
    })
    .catch(err => console.error('Failed to load posts:', err));

  // Cleanup function
  return () => {
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }
    if (clusterRef.current) {
      clusterRef.current.clearLayers();
      clusterRef.current = null;
    }
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  };
}, [loginUrl]);



  return (
    <div className="flex size-full gap-2 px-2 pb-12 overflow-hidden relative">
      <div id="ushahidi-map" className="w-full h-full rounded-md" />
      <LocationFilter
        onLocationChange={handleLocationChange}
        onClear={handleClearFilter}
        className="absolute top-4 right-4 z-50"
      />
    </div>
  );
}

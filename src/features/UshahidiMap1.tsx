import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useLoginUrl } from '@/components/useLoginUrl';

export default function UshahidiMapPage1() {
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<any | null>(null);


  
         const matchedTab = useLoginUrl();
         const loginUrl = matchedTab || 'https://skillpedia.api.ushahidi.io/api/v3/posts';
         

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
          const locationArray = post.values.location_default;
          if (Array.isArray(locationArray) && locationArray.length > 0) {
            const { lat, lon } = locationArray[0];
            if (lat && lon && clusterRef.current) {
              const marker = L.marker([lat, lon], { icon: defaultIcon })
                .bindPopup(`<b>${post.title || 'No Title'}</b><br>${post.content || ''}`);
              markerClusterGroup.addLayer(marker);
            }
          }
        });
      }
    })
    .catch(err => console.error('Failed to load posts:', err));

  // Cleanup function
  return () => {
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
    <div className="flex size-full gap-2 px-2 pb-12 overflow-hidden">
    {/* <div className="w-full h-screen"> */}
      <div id="ushahidi-map" className="w-full h-full rounded-md" />
    {/* </div> */}
    </div>
  );
}

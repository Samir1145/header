import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLoginUrl } from '@/components/useLoginUrl';

export default function UshahidiMapPage1() {
  const mapRef = useRef<L.Map | null>(null);


  
         const matchedTab = useLoginUrl();
         const loginUrl = matchedTab || 'https://skillpedia.api.ushahidi.io/api/v3/posts';
         

useEffect(() => {
  if (!loginUrl) return;

  // Reset map if it already exists
  if (mapRef.current) {
    mapRef.current.remove();
    mapRef.current = null;
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

  fetch(loginUrl)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      // Check if map still exists before adding markers
      if (!mapRef.current) return;
      
      const posts = Array.isArray(data.results) ? data.results : [];
      posts.forEach((post: any) => {
        const locationArray = post.values.location_default;
        if (Array.isArray(locationArray) && locationArray.length > 0) {
          const { lat, lon } = locationArray[0];
          if (lat && lon && mapRef.current) {
            L.marker([lat, lon], { icon: defaultIcon })
              .addTo(mapRef.current)
              .bindPopup(`<b>${post.title || 'No Title'}</b><br>${post.content || ''}`);
          }
        }
      });
    })
    .catch(err => console.error('Failed to load posts:', err));

  // Cleanup function
  return () => {
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

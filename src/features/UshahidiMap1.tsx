import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigationTabsStore } from '@/stores/navigationTabs';
import { useLocation } from 'react-router-dom';

export default function UshahidiMapPage1() {
  const mapRef = useRef<L.Map | null>(null);

  const allTabs = useNavigationTabsStore(state => state.tabs);
  const location = useLocation();
  const currentPath = location.pathname.replace(/^\/+/, '');

  // Memoize matched tab only when tabs are ready
  const matchedTab = useMemo(() => {
    if (allTabs.length === 0) return null;
    return allTabs.find(tab => tab.path.replace(/^\/+/, '') === currentPath);
  }, [allTabs, currentPath]);

  const loginUrl = matchedTab?.loginUrl || 'https://skillpedia.api.ushahidi.io/api/v3/posts';
useEffect(() => {
  if (!loginUrl || mapRef.current || allTabs.length === 0) return;

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
      const posts = Array.isArray(data.results) ? data.results : [];
      posts.forEach((post: any) => {
        const locationArray = post.values?.['f6c07bf1-50fe-45dc-9939-630356ad3b8a'];
        if (Array.isArray(locationArray) && locationArray.length > 0) {
          const { lat, lon } = locationArray[0];
          if (lat && lon) {
            L.marker([lat, lon], { icon: defaultIcon }) // <- pass custom icon here
              .addTo(map)
              .bindPopup(`<b>${post.title || 'No Title'}</b><br>${post.content || ''}`);
          }
        }
      });
    })
    .catch(err => console.error('Failed to load posts:', err));
}, [loginUrl, allTabs]);


  // useEffect(() => {
  //   if (!loginUrl || mapRef.current || allTabs.length === 0) return;

  //   const map = L.map('ushahidi-map').setView([20, 78], 5);
  //   mapRef.current = map;

  //   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  //     attribution: '© OpenStreetMap contributors',
  //   }).addTo(map);

  //   fetch(loginUrl)
  //     .then(res => {
  //       if (!res.ok) throw new Error(`HTTP ${res.status}`);
  //       return res.json();
  //     })
  //     .then(data => {
  //       const posts = Array.isArray(data.results) ? data.results : [];
  //       posts.forEach((post: any) => {
  //         const locationArray = post.values?.['f6c07bf1-50fe-45dc-9939-630356ad3b8a'];
  //         if (Array.isArray(locationArray) && locationArray.length > 0) {
  //           const { lat, lon } = locationArray[0];
  //           if (lat && lon) {
  //             L.marker([lat, lon])
  //               .addTo(map)
  //               .bindPopup(`<b>${post.title || 'No Title'}</b><br>${post.content || ''}`);
  //           }
  //         }
  //       });
  //     })
  //     .catch(err => console.error('Failed to load posts:', err));
  // }, [loginUrl, allTabs]);

  return (
    <div className="flex size-full gap-2 px-2 pb-12 overflow-hidden">
    {/* <div className="w-full h-screen"> */}
      <div id="ushahidi-map" className="w-full h-full rounded-md" />
    {/* </div> */}
    </div>
  );
}


import { useEffect,  useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigationTabsStore } from '@/stores/navigationTabs';
import { useLocation } from 'react-router-dom';
import { useLoginUrl } from '@/components/useLoginUrl';

export default function UshahidiMapPage() {
  const mapRef = useRef<L.Map | null>(null);

  
         const matchedTab = useLoginUrl();
         const loginUrl = matchedTab || 'https://skillpedia.api.ushahidi.io/api/v3/posts';

  useEffect(() => {
    if (!loginUrl || mapRef.current) return;

    const map = L.map('ushahidi-map').setView([20, 78], 5);
    mapRef.current = map;

    const defaultIcon = new L.Icon({
      iconUrl: '/AskAtul/leaflet/marker-icon.png',
      iconRetinaUrl: '/AskAtul/leaflet/marker-icon-2x.png',
      shadowUrl: '/AskAtul/leaflet/marker-shadow.png',
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
        console.log('API Response:', data);
        const posts = Array.isArray(data.results) ? data.results : [];

        posts.forEach((post: any) => {
          const locationArray =
            post.values?.['f6c07bf1-50fe-45dc-9939-630356ad3b8a'];
          if (Array.isArray(locationArray) && locationArray.length > 0) {
            const { lat, lon } = locationArray[0];
            if (lat && lon) {
              L.marker([lat, lon], { icon: defaultIcon })
                .addTo(map)
                .bindPopup(
                  `<b>${post.title || 'No Title'}</b><br>${
                    post.content || ''
                  }`
                );
            }
          }
        });
      })
      .catch(err => {
        console.error('Failed to load posts:', err);
        console.error('Failed URL:', loginUrl);
      });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loginUrl]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex size-full gap-2 px-2 pb-12 overflow-hidden">
      <div id="ushahidi-map" className="w-full h-full rounded-md" />
    </div>
  );
}

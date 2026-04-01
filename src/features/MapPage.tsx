import { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useLoginUrl } from '@/components/useLoginUrl';
import LocationFilter from '@/components/LocationFilter';
import { filterMarkersByRadius, createRadiusCircle } from '@/lib/locationUtils';
import BuyNowModal from '../components/BuyNowModal';

interface MapPageProps {
  mapId: string;
}

export default function MapPage({ mapId }: MapPageProps) {
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<any | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const allMarkersRef = useRef<Array<{ lat: number; lng: number; marker: L.Marker; data: any }>>([]);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedItemDescription, setSelectedItemDescription] = useState<string>('');

  const itemDataMapRef = useRef<Map<string, { title: string; description: string }>>(new Map());
  const itemIdCounterRef = useRef(0);

  const matchedTab = useLoginUrl();
  const loginUrl = matchedTab || 'https://skillpedia.api.ushahidi.io/api/v3/posts';

  const applyMarkerFilter = useCallback((center: { lat: number; lng: number } | null, radius: number) => {
    if (!clusterRef.current) return;
    clusterRef.current.clearLayers();
    if (!center || radius === 0) {
      allMarkersRef.current.forEach(({ marker }) => {
        clusterRef.current.addLayer(marker);
      });
    } else {
      const filteredMarkers = filterMarkersByRadius(
        allMarkersRef.current.map(({ lat, lng, data }) => ({ lat, lng, ...data })),
        center,
        radius
      );
      allMarkersRef.current.forEach(({ marker, lat, lng }) => {
        const isInRadius = filteredMarkers.some(fm => fm.lat === lat && fm.lng === lng);
        if (isInRadius) clusterRef.current.addLayer(marker);
      });
    }
  }, []);

  const handleLocationChange = useCallback((center: { lat: number; lng: number } | null, radius: number) => {
    if (!mapRef.current) return;
    if (radiusCircleRef.current) {
      mapRef.current.removeLayer(radiusCircleRef.current);
      radiusCircleRef.current = null;
    }
    if (center && radius > 0) {
      if (mapRef.current) {
        radiusCircleRef.current = createRadiusCircle(mapRef.current, center, radius);
        if (radiusCircleRef.current) mapRef.current.addLayer(radiusCircleRef.current);
      }
      let zoomLevel = 10;
      if (radius <= 5) zoomLevel = 15;
      else if (radius <= 10) zoomLevel = 13;
      else if (radius <= 25) zoomLevel = 11;
      else if (radius <= 50) zoomLevel = 9;
      else if (radius <= 100) zoomLevel = 8;
      else zoomLevel = 7;
      mapRef.current.setView([center.lat, center.lng], zoomLevel, { animate: true, duration: 1.0 });
    }
    applyMarkerFilter(center, radius);
  }, [applyMarkerFilter]);

  const handleBuyNowClick = useCallback((itemId: string) => {
    const itemData = itemDataMapRef.current.get(itemId);
    if (itemData) {
      setSelectedItem(itemData.title || 'Untitled');
      setSelectedItemDescription(itemData.description || '');
      setShowBuyNowModal(true);
      itemDataMapRef.current.delete(itemId);
    } else {
      setSelectedItem(itemId);
      setSelectedItemDescription('');
      setShowBuyNowModal(true);
    }
  }, []);

  useEffect(() => {
    (window as any).handleBuyNow = handleBuyNowClick;
    return () => { delete (window as any).handleBuyNow; };
  }, [handleBuyNowClick]);

  const handleNameSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) { applyMarkerFilter(null, 0); return; }
    const filteredMarkers = allMarkersRef.current.filter(({ data }) => {
      const title = data.title?.toLowerCase() || '';
      const description = data.description?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      return title.includes(searchLower) || description.includes(searchLower);
    });
    if (filteredMarkers.length === 0) { applyMarkerFilter(null, 0); return; }
    if (filteredMarkers.length === 1) {
      const { lat, lng } = filteredMarkers[0];
      mapRef.current?.setView([lat, lng], 15, { animate: true, duration: 1.0 });
    } else {
      const group = new L.FeatureGroup();
      filteredMarkers.forEach(({ marker }) => group.addLayer(marker));
      if (mapRef.current) mapRef.current.fitBounds(group.getBounds().pad(0.1), { animate: true, duration: 1.0 });
    }
    applyMarkerFilter(null, 0);
    if (clusterRef.current) {
      clusterRef.current.clearLayers();
      filteredMarkers.forEach(({ marker }) => clusterRef.current.addLayer(marker));
    }
  }, [applyMarkerFilter]);

  const handleCombinedSearch = useCallback((searchState: {
    nameSearch: string;
    locationCenter: { lat: number; lng: number } | null;
    radius: number;
    searchMode: 'name' | 'location' | 'combined' | 'none';
  }, onComplete?: () => void) => {
    const { nameSearch, locationCenter, radius, searchMode } = searchState;

    if (searchMode === 'none') { applyMarkerFilter(null, 0); onComplete?.(); return; }

    if (searchMode === 'name') {
      if (!nameSearch.trim()) { applyMarkerFilter(null, 0); onComplete?.(); return; }
      const nameMatches = allMarkersRef.current.filter(({ data }) => {
        const title = data.title?.toLowerCase() || '';
        const description = data.description?.toLowerCase() || '';
        const searchLower = nameSearch.toLowerCase();
        return title.includes(searchLower) || description.includes(searchLower);
      });
      if (nameMatches.length === 0) { applyMarkerFilter(null, 0); onComplete?.(); return; }
      if (nameMatches.length === 1) {
        const { lat, lng } = nameMatches[0];
        mapRef.current?.setView([lat, lng], 15, { animate: true, duration: 1.0 });
      } else {
        const group = new L.FeatureGroup();
        nameMatches.forEach(({ marker }) => group.addLayer(marker));
        if (mapRef.current) mapRef.current.fitBounds(group.getBounds().pad(0.1), { animate: true, duration: 1.0 });
      }
      if (clusterRef.current) {
        clusterRef.current.clearLayers();
        nameMatches.forEach(({ marker }) => clusterRef.current.addLayer(marker));
      }
      onComplete?.(); return;
    }

    if (searchMode === 'location') {
      if (!locationCenter || radius === 0) { applyMarkerFilter(null, 0); onComplete?.(); return; }
      if (radiusCircleRef.current) { mapRef.current?.removeLayer(radiusCircleRef.current); radiusCircleRef.current = null; }
      if (mapRef.current) {
        radiusCircleRef.current = createRadiusCircle(mapRef.current, locationCenter, radius);
        if (radiusCircleRef.current) mapRef.current.addLayer(radiusCircleRef.current);
      }
      let zoomLevel = 10;
      if (radius <= 5) zoomLevel = 15;
      else if (radius <= 10) zoomLevel = 13;
      else if (radius <= 25) zoomLevel = 11;
      else if (radius <= 50) zoomLevel = 9;
      else if (radius <= 100) zoomLevel = 8;
      else zoomLevel = 7;
      mapRef.current?.setView([locationCenter.lat, locationCenter.lng], zoomLevel, { animate: true, duration: 1.0 });
      applyMarkerFilter(locationCenter, radius);
      onComplete?.(); return;
    }

    if (searchMode === 'combined') {
      if (!nameSearch.trim() || !locationCenter || radius === 0) { applyMarkerFilter(null, 0); onComplete?.(); return; }
      const nameMatches = allMarkersRef.current.filter(({ data }) => {
        const title = data.title?.toLowerCase() || '';
        const description = data.description?.toLowerCase() || '';
        const searchLower = nameSearch.toLowerCase();
        return title.includes(searchLower) || description.includes(searchLower);
      });
      if (nameMatches.length === 0) { applyMarkerFilter(null, 0); onComplete?.(); return; }
      const locationMatches = filterMarkersByRadius(
        nameMatches.map(({ lat, lng, data }) => ({ lat, lng, ...data })),
        locationCenter, radius
      );
      if (locationMatches.length === 0) { applyMarkerFilter(null, 0); onComplete?.(); return; }
      if (radiusCircleRef.current) { mapRef.current?.removeLayer(radiusCircleRef.current); radiusCircleRef.current = null; }
      if (mapRef.current) {
        radiusCircleRef.current = createRadiusCircle(mapRef.current, locationCenter, radius);
        if (radiusCircleRef.current) mapRef.current.addLayer(radiusCircleRef.current);
      }
      let zoomLevel = 10;
      if (radius <= 5) zoomLevel = 15;
      else if (radius <= 10) zoomLevel = 13;
      else if (radius <= 25) zoomLevel = 11;
      else if (radius <= 50) zoomLevel = 9;
      else if (radius <= 100) zoomLevel = 8;
      else zoomLevel = 7;
      mapRef.current?.setView([locationCenter.lat, locationCenter.lng], zoomLevel, { animate: true, duration: 1.0 });
      if (clusterRef.current) {
        clusterRef.current.clearLayers();
        locationMatches.forEach(({ lat, lng }) => {
          const matchingMarker = nameMatches.find(nm => nm.lat === lat && nm.lng === lng);
          if (matchingMarker) clusterRef.current.addLayer(matchingMarker.marker);
        });
      }
      onComplete?.();
    }
  }, [applyMarkerFilter]);

  const handleClearFilter = useCallback(() => {
    if (radiusCircleRef.current && mapRef.current) {
      mapRef.current.removeLayer(radiusCircleRef.current);
      radiusCircleRef.current = null;
    }
    if (mapRef.current) mapRef.current.setView([20, 78], 5, { animate: true, duration: 1.0 });
    applyMarkerFilter(null, 0);
  }, [applyMarkerFilter]);

  useEffect(() => {
    const createLocationIcon = () => {
      const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24" height="32">
          <path fill="#ef4444" d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/>
        </svg>
      `;
      return L.divIcon({ html: svgIcon, className: 'custom-location-icon', iconSize: [24, 32], iconAnchor: [12, 32], popupAnchor: [0, -32] });
    };

    const defaultIcon = createLocationIcon();

    if (!mapRef.current) {
      mapRef.current = L.map(mapId).setView([20, 78], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
      clusterRef.current = (L as any).markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50 });
      mapRef.current.addLayer(clusterRef.current);
    }

    const fetchData = async () => {
      try {
        const response = await fetch(loginUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const posts = Array.isArray(data.results) ? data.results : [];

        posts.forEach((post: any) => {
          let locationArray = null;
          if (post.values && typeof post.values === 'object') {
            for (const key of Object.keys(post.values)) {
              const value = post.values[key];
              if (Array.isArray(value) && value.length > 0) {
                const firstItem = value[0];
                if (firstItem && typeof firstItem === 'object' && 'lat' in firstItem && 'lon' in firstItem) {
                  locationArray = value;
                  break;
                }
              }
            }
          }
          if (Array.isArray(locationArray) && locationArray.length > 0) {
            const { lat, lon } = locationArray[0];
            if (lat && lon && clusterRef.current) {
              const itemId = `item_${itemIdCounterRef.current++}`;
              itemDataMapRef.current.set(itemId, { title: post.title || 'No Title', description: post.content || '' });
              const marker = L.marker([lat, lon], { icon: defaultIcon })
                .bindPopup(
                  `<div class="popup-content">
                    <b>${post.title || 'No Title'}</b><br><br>
                    <button onclick="handleBuyNow('${itemId}')"
                            class="buy-now-btn"
                            style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                      Buy Now
                    </button>
                  </div>`
                );
              allMarkersRef.current.push({ lat, lng: lon, marker, data: post });
              clusterRef.current.addLayer(marker);
            }
          }
        });

        if (clusterRef.current && allMarkersRef.current.length > 0) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(() => {
                const visibleLayers = clusterRef.current?.getLayers()?.length || 0;
                if (visibleLayers > 0) {
                  setIsInitialLoading(false);
                } else {
                  setTimeout(() => setIsInitialLoading(false), 2000);
                }
              }, 1000);
            });
          });
        } else {
          setTimeout(() => setIsInitialLoading(false), 1000);
        }
      } catch (error) {
        console.error('Failed to load posts:', error);
        setTimeout(() => setIsInitialLoading(false), 1000);
      }
    };

    fetchData();
  }, [loginUrl, mapId]);

  return (
    <div className="w-full h-screen relative">
      {isInitialLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg border">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <div className="text-xl font-semibold text-gray-800">Loading Map Data</div>
            <div className="text-sm text-gray-600 text-center max-w-xs">
              Please wait while we load all location points...
            </div>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      )}
      <LocationFilter
        onLocationChange={handleLocationChange}
        onNameSearch={handleNameSearch}
        onCombinedSearch={handleCombinedSearch}
        onClear={handleClearFilter}
        className="absolute top-4 left-4 z-30 bg-white p-4 rounded-lg shadow-lg max-w-sm"
      />
      <div id={mapId} className="w-full h-full"></div>
      <BuyNowModal
        open={showBuyNowModal}
        onOpenChange={setShowBuyNowModal}
        itemTitle={selectedItem}
        itemDescription={selectedItemDescription}
      />
    </div>
  );
}

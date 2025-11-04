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

export default function UshahidiMapPage4() {
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<any | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const allMarkersRef = useRef<Array<{ lat: number; lng: number; marker: L.Marker; data: any }>>([]);

  // Loading state for initial page load
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Buy Now modal state
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>('');
  
  // Debug loading state
  console.log('Initial loading state:', isInitialLoading);

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

  // Handle location change from filter
  const handleLocationChange = useCallback((center: { lat: number; lng: number } | null, radius: number) => {
    if (!mapRef.current) return;

    // Clear existing radius circle
    if (radiusCircleRef.current) {
      mapRef.current.removeLayer(radiusCircleRef.current);
      radiusCircleRef.current = null;
    }

    if (center && radius > 0) {
      // Create new radius circle
      radiusCircleRef.current = createRadiusCircle(center, radius);
      mapRef.current.addLayer(radiusCircleRef.current);

      // Determine zoom level based on radius
      let zoomLevel = 10;
      if (radius <= 5) zoomLevel = 15;
      else if (radius <= 10) zoomLevel = 13;
      else if (radius <= 25) zoomLevel = 11;
      else if (radius <= 50) zoomLevel = 9;
      else if (radius <= 100) zoomLevel = 8;
      else zoomLevel = 7;

      // Set map view with animation
      mapRef.current.setView([center.lat, center.lng], zoomLevel, {
        animate: true,
        duration: 1.0
      });
    }

    // Apply marker filter
    applyMarkerFilter(center, radius);
  }, [applyMarkerFilter]);

  // Handle name search
  const handleNameSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      // If search term is empty, show all markers
      applyMarkerFilter(null, 0);
      return;
    }

    const filteredMarkers = allMarkersRef.current.filter(({ data }) => {
      const title = data.title?.toLowerCase() || '';
      const description = data.description?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      return title.includes(searchLower) || description.includes(searchLower);
    });

    if (filteredMarkers.length === 0) {
      // No matches found
      applyMarkerFilter(null, 0);
      return;
    }

    if (filteredMarkers.length === 1) {
      // Single match - zoom to that marker
      const { lat, lng } = filteredMarkers[0];
      mapRef.current?.setView([lat, lng], 15, {
        animate: true,
        duration: 1.0
      });
    } else {
      // Multiple matches - fit bounds
      const group = new L.FeatureGroup();
      filteredMarkers.forEach(({ marker }) => {
        group.addLayer(marker);
      });
      
      if (mapRef.current) {
        mapRef.current.fitBounds(group.getBounds().pad(0.1), {
          animate: true,
          duration: 1.0
        });
      }
    }

    // Show only matching markers
    applyMarkerFilter(null, 0);
    if (clusterRef.current) {
      clusterRef.current.clearLayers();
      filteredMarkers.forEach(({ marker }) => {
        clusterRef.current.addLayer(marker);
      });
    }
  }, [applyMarkerFilter]);

  // Handle combined search
  const handleCombinedSearch = useCallback((searchState: {
    nameSearch: string;
    locationCenter: { lat: number; lng: number } | null;
    radius: number;
    searchMode: 'name' | 'location' | 'combined' | 'none';
  }, onComplete?: () => void) => {
    const { nameSearch, locationCenter, radius, searchMode } = searchState;
    
    console.log('Combined search triggered:', { nameSearch, locationCenter, radius, searchMode });

    if (searchMode === 'none') {
      applyMarkerFilter(null, 0);
      onComplete?.();
      return;
    }

    if (searchMode === 'name') {
      // Name search only
      if (!nameSearch.trim()) {
        applyMarkerFilter(null, 0);
        onComplete?.();
        return;
      }

      const nameMatches = allMarkersRef.current.filter(({ data }) => {
        const title = data.title?.toLowerCase() || '';
        const description = data.description?.toLowerCase() || '';
        const searchLower = nameSearch.toLowerCase();
        return title.includes(searchLower) || description.includes(searchLower);
      });

      if (nameMatches.length === 0) {
        applyMarkerFilter(null, 0);
        onComplete?.();
        return;
      }

      if (nameMatches.length === 1) {
        const { lat, lng } = nameMatches[0];
        mapRef.current?.setView([lat, lng], 15, {
          animate: true,
          duration: 1.0
        });
      } else {
        const group = new L.FeatureGroup();
        nameMatches.forEach(({ marker }) => {
          group.addLayer(marker);
        });
        
        if (mapRef.current) {
          mapRef.current.fitBounds(group.getBounds().pad(0.1), {
            animate: true,
            duration: 1.0
          });
        }
      }

      // Show only name matches
      if (clusterRef.current) {
        clusterRef.current.clearLayers();
        nameMatches.forEach(({ marker }) => {
          clusterRef.current.addLayer(marker);
        });
      }
      onComplete?.();
      return;
    }

    if (searchMode === 'location') {
      // Location search only
      if (!locationCenter || radius === 0) {
        applyMarkerFilter(null, 0);
        onComplete?.();
        return;
      }

      // Clear existing radius circle
      if (radiusCircleRef.current) {
        mapRef.current?.removeLayer(radiusCircleRef.current);
        radiusCircleRef.current = null;
      }

      // Create new radius circle
      radiusCircleRef.current = createRadiusCircle(locationCenter, radius);
      mapRef.current?.addLayer(radiusCircleRef.current);

      // Determine zoom level based on radius
      let zoomLevel = 10;
      if (radius <= 5) zoomLevel = 15;
      else if (radius <= 10) zoomLevel = 13;
      else if (radius <= 25) zoomLevel = 11;
      else if (radius <= 50) zoomLevel = 9;
      else if (radius <= 100) zoomLevel = 8;
      else zoomLevel = 7;

      // Set map view with animation
      mapRef.current?.setView([locationCenter.lat, locationCenter.lng], zoomLevel, {
        animate: true,
        duration: 1.0
      });

      applyMarkerFilter(locationCenter, radius);
      onComplete?.();
      return;
    }

    if (searchMode === 'combined') {
      // Combined search - both name and location
      if (!nameSearch.trim() || !locationCenter || radius === 0) {
        applyMarkerFilter(null, 0);
        onComplete?.();
        return;
      }

      // First filter by name
      const nameMatches = allMarkersRef.current.filter(({ data }) => {
        const title = data.title?.toLowerCase() || '';
        const description = data.description?.toLowerCase() || '';
        const searchLower = nameSearch.toLowerCase();
        return title.includes(searchLower) || description.includes(searchLower);
      });

      if (nameMatches.length === 0) {
        applyMarkerFilter(null, 0);
        onComplete?.();
        return;
      }

      // Then filter by location
      const locationMatches = filterMarkersByRadius(
        nameMatches.map(({ lat, lng, data }) => ({ lat, lng, ...data })),
        locationCenter,
        radius
      );

      if (locationMatches.length === 0) {
        applyMarkerFilter(null, 0);
        onComplete?.();
        return;
      }

      // Clear existing radius circle
      if (radiusCircleRef.current) {
        mapRef.current?.removeLayer(radiusCircleRef.current);
        radiusCircleRef.current = null;
      }

      // Create new radius circle
      radiusCircleRef.current = createRadiusCircle(locationCenter, radius);
      mapRef.current?.addLayer(radiusCircleRef.current);

      // Determine zoom level based on radius
      let zoomLevel = 10;
      if (radius <= 5) zoomLevel = 15;
      else if (radius <= 10) zoomLevel = 13;
      else if (radius <= 25) zoomLevel = 11;
      else if (radius <= 50) zoomLevel = 9;
      else if (radius <= 100) zoomLevel = 8;
      else zoomLevel = 7;

      // Set map view with animation
      mapRef.current?.setView([locationCenter.lat, locationCenter.lng], zoomLevel, {
        animate: true,
        duration: 1.0
      });

      // Show only combined matches
      if (clusterRef.current) {
        clusterRef.current.clearLayers();
        locationMatches.forEach(({ lat, lng }) => {
          const matchingMarker = nameMatches.find(nm => nm.lat === lat && nm.lng === lng);
          if (matchingMarker) {
            clusterRef.current.addLayer(matchingMarker.marker);
          }
        });
      }
      onComplete?.();
    }
  }, [applyMarkerFilter]);

  // Handle clear filter
  const handleClearFilter = useCallback(() => {
    // Clear radius circle
    if (radiusCircleRef.current && mapRef.current) {
      mapRef.current.removeLayer(radiusCircleRef.current);
      radiusCircleRef.current = null;
    }

    // Reset map view
    if (mapRef.current) {
      mapRef.current.setView([20, 78], 5, {
        animate: true,
        duration: 1.0
      });
    }

    // Show all markers
    applyMarkerFilter(null, 0);
  }, [applyMarkerFilter]);

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map
      mapRef.current = L.map('map4').setView([20, 78], 5);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Initialize marker cluster
      clusterRef.current = (L as any).markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50
      });
      mapRef.current.addLayer(clusterRef.current);
    }

    // Fetch data
    const fetchData = async () => {
      try {
        console.log('Fetching data from:', loginUrl);
        const response = await fetch(loginUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched data:', data);

        if (data.data && Array.isArray(data.data)) {
          // Clear existing markers
          allMarkersRef.current = [];
          if (clusterRef.current) {
            clusterRef.current.clearLayers();
          }

          // Process markers
          data.data.forEach((item: any) => {
            if (item.geometry && item.geometry.type === 'Point' && item.geometry.coordinates) {
              const [lng, lat] = item.geometry.coordinates;
              
              if (typeof lat === 'number' && typeof lng === 'number' && 
                  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                
                const marker = L.marker([lat, lng]).bindPopup(`
                  <div>
                    <h3>${item.properties?.title || 'Untitled'}</h3>
                    <p>${item.properties?.description || 'No description'}</p>
                    ${item.properties?.url ? `<a href="${item.properties.url}" target="_blank">View Details</a>` : ''}
                  </div>
                `);

                allMarkersRef.current.push({
                  lat,
                  lng,
                  marker,
                  data: item.properties || {}
                });

                clusterRef.current.addLayer(marker);
              }
            }
          });

          console.log(`Added ${allMarkersRef.current.length} markers to map`);
        }

        // Hide initial loading state after markers are loaded and rendered
        // Wait for cluster to be fully rendered before hiding loader
        if (clusterRef.current && allMarkersRef.current.length > 0) {
          console.log('Markers found, waiting for rendering...');
          
          // Use multiple requestAnimationFrame calls to ensure markers are fully rendered
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // Additional check to ensure cluster has visible markers
              setTimeout(() => {
                // Check if cluster actually has visible layers
                const clusterLayers = clusterRef.current?.getLayers();
                const visibleLayers = clusterLayers?.length || 0;
                
                console.log('Cluster layers count:', visibleLayers);
                console.log('Total markers in ref:', allMarkersRef.current.length);
                
                if (visibleLayers > 0) {
                  console.log('Hiding initial loading overlay - markers loaded and rendered:', allMarkersRef.current.length);
                  setIsInitialLoading(false);
                } else {
                  console.log('No visible layers in cluster, keeping loader active');
                  // Keep loader active for a bit longer
                  setTimeout(() => {
                    console.log('Force hiding loader after extended wait');
                    setIsInitialLoading(false);
                  }, 2000);
                }
              }, 1000); // Increased delay to ensure markers are visible
            });
          });
        } else {
          // No markers loaded, hide loader after a short delay
          console.log('No markers found in data');
          setTimeout(() => {
            console.log('Hiding initial loading overlay - no markers found');
            setIsInitialLoading(false);
          }, 1000); // Increased delay for no markers case
        }

      } catch (error) {
        console.error('Failed to load posts:', error);
        console.error('Failed URL:', loginUrl);
        // Hide loading state even on error
        setTimeout(() => {
          console.log('Hiding initial loading overlay (error case)');
          setIsInitialLoading(false);
        }, 1000); // Longer delay for error case
      }
    };

    fetchData();
  }, [loginUrl]);

  return (
    <div className="w-full h-screen relative">
      {/* Initial loading overlay */}
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

      {/* Location Filter */}
      <LocationFilter
        onLocationChange={handleLocationChange}
        onNameSearch={handleNameSearch}
        onCombinedSearch={handleCombinedSearch}
        onClear={handleClearFilter}
        className="absolute top-4 left-4 z-30 bg-white p-4 rounded-lg shadow-lg max-w-sm"
      />

      {/* Map Container */}
      <div id="map4" className="w-full h-full"></div>
    </div>
  );
}

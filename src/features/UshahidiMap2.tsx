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

export default function UshahidiMapPage2() {
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<any | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const allMarkersRef = useRef<Array<{ lat: number; lng: number; marker: L.Marker; data: any }>>([]);

  // Loading state for initial page load
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Buy Now modal state
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedItemDescription, setSelectedItemDescription] = useState<string>('');
  
  // Store item data with unique IDs to avoid JSON parsing issues in HTML attributes
  const itemDataMapRef = useRef<Map<string, { title: string; description: string }>>(new Map());
  const itemIdCounterRef = useRef(0);

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

  // Handle combined search with conditions
  const handleCombinedSearch = useCallback((searchState: {
    nameSearch: string;
    locationCenter: { lat: number; lng: number } | null;
    radius: number;
    searchMode: 'name' | 'location' | 'combined' | 'none';
  }, onComplete?: () => void) => {
    const { nameSearch, locationCenter, radius, searchMode } = searchState;
    
    console.log('Combined search triggered:', { nameSearch, locationCenter, radius, searchMode });

    if (searchMode === 'none') {
      // Show all markers
      applyMarkerFilter(null, 0);
      onComplete?.();
      return;
    }

    if (searchMode === 'name') {
      // Name search only - implement directly
      if (!nameSearch.trim()) {
        applyMarkerFilter(null, 0);
        onComplete?.();
        return;
      }

      const matchingMarkers = allMarkersRef.current.filter(({ data }) => {
        const title = data.title || '';
        const description = data.description || '';
        const searchLower = nameSearch.toLowerCase();
        
        return title.toLowerCase().includes(searchLower) || 
               description.toLowerCase().includes(searchLower);
      });

      if (matchingMarkers.length > 0) {
        if (clusterRef.current) {
          clusterRef.current.clearLayers();
          matchingMarkers.forEach(({ marker }) => {
            clusterRef.current.addLayer(marker);
          });
        }

        if (matchingMarkers.length === 1) {
          const marker = matchingMarkers[0];
          if (mapRef.current) {
            mapRef.current.setView([marker.lat, marker.lng], 15, {
              animate: true,
              duration: 1.0
            });
          }
        } else if (matchingMarkers.length > 1) {
          if (mapRef.current && clusterRef.current) {
            const group = new (L as any).FeatureGroup();
            matchingMarkers.forEach(({ marker }) => {
              group.addLayer(marker);
            });
            mapRef.current.fitBounds(group.getBounds().pad(0.1), {
              animate: true,
              duration: 1.0
            });
          }
        }
      } else {
        if (clusterRef.current) {
          clusterRef.current.clearLayers();
        }
      }
      onComplete?.();
      return;
    }

    if (searchMode === 'location') {
      // Location search only - implement directly
      if (locationCenter) {
        // Determine appropriate zoom level based on radius
        let zoomLevel = 12;
        
        if (radius === 0) {
          zoomLevel = 5;
        } else if (radius <= 5) {
          zoomLevel = 15;
        } else if (radius <= 10) {
          zoomLevel = 14;
        } else if (radius <= 25) {
          zoomLevel = 13;
        } else if (radius <= 50) {
          zoomLevel = 12;
        } else {
          zoomLevel = 11;
        }
        
        // Center map on the selected location with appropriate zoom
        if (mapRef.current) {
          mapRef.current.setView([locationCenter.lat, locationCenter.lng], zoomLevel, {
            animate: true,
            duration: 1.0
          });
          
          // Update radius circle
          if (radiusCircleRef.current) {
            mapRef.current.removeLayer(radiusCircleRef.current);
          }
          
          const circle = createRadiusCircle(mapRef.current, locationCenter, radius);
          if (circle) {
            radiusCircleRef.current = circle;
            mapRef.current.addLayer(circle);
          }
        }
        
        // Filter markers
        applyMarkerFilter(locationCenter, radius);
      }
      onComplete?.();
      return;
    }

    if (searchMode === 'combined') {
      // Combined search: filter by name first, then by location
      console.log('Combined search: filtering by name first');
      const nameMatches = allMarkersRef.current.filter(({ data }) => {
        const title = data.title || '';
        const description = data.description || '';
        const searchLower = nameSearch.toLowerCase();
        
        return title.toLowerCase().includes(searchLower) || 
               description.toLowerCase().includes(searchLower);
      });
      
      console.log('Name matches found:', nameMatches.length);

      if (nameMatches.length === 0) {
        // No name matches, clear markers
        console.log('No name matches, clearing markers');
        if (clusterRef.current) {
          clusterRef.current.clearLayers();
        }
        onComplete?.();
        return;
      }

      if (locationCenter) {
        console.log('Filtering by location radius:', radius);
        // Filter name matches by location radius
        const locationMatches = filterMarkersByRadius(
          nameMatches.map(({ lat, lng, data }) => ({ lat, lng, ...data })),
          locationCenter,
          radius
        );
        
        console.log('Location matches found:', locationMatches.length);

        // Show filtered markers
        if (clusterRef.current) {
          clusterRef.current.clearLayers();
          locationMatches.forEach(({ lat, lng }) => {
            // Find the corresponding marker from nameMatches
            const matchingMarker = nameMatches.find(nm => nm.lat === lat && nm.lng === lng);
            if (matchingMarker) {
              clusterRef.current.addLayer(matchingMarker.marker);
            }
          });
        }

        // Update map view and radius circle
        if (mapRef.current) {
          let zoomLevel = 12;
          if (radius === 0) {
            zoomLevel = 5;
          } else if (radius <= 5) {
            zoomLevel = 15;
          } else if (radius <= 10) {
            zoomLevel = 14;
          } else if (radius <= 25) {
            zoomLevel = 13;
          } else if (radius <= 50) {
            zoomLevel = 12;
          } else {
            zoomLevel = 11;
          }

          mapRef.current.setView([locationCenter.lat, locationCenter.lng], zoomLevel, {
            animate: true,
            duration: 1.0
          });

          // Update radius circle
          if (radiusCircleRef.current) {
            mapRef.current.removeLayer(radiusCircleRef.current);
          }
          
          const circle = createRadiusCircle(mapRef.current, locationCenter, radius);
          if (circle) {
            radiusCircleRef.current = circle;
            mapRef.current.addLayer(circle);
          }
        }
      } else {
        // No location, just show name matches
        if (clusterRef.current) {
          clusterRef.current.clearLayers();
          nameMatches.forEach(({ marker }) => {
            clusterRef.current.addLayer(marker);
          });
        }

        // Fit bounds to show all name matches
        if (mapRef.current && nameMatches.length > 0) {
          const group = new (L as any).FeatureGroup();
          nameMatches.forEach(({ marker }) => {
            group.addLayer(marker);
          });
          mapRef.current.fitBounds(group.getBounds().pad(0.1), {
            animate: true,
            duration: 1.0
          });
        }
      }
      onComplete?.();
    }
  }, [applyMarkerFilter]);

  // Handle Buy Now button click
  const handleBuyNowClick = useCallback((itemId: string) => {
    const itemData = itemDataMapRef.current.get(itemId);
    if (itemData) {
      setSelectedItem(itemData.title || 'No Title');
      setSelectedItemDescription(itemData.description || '');
      setShowBuyNowModal(true);
      // Clean up after use
      itemDataMapRef.current.delete(itemId);
    } else {
      // Fallback for old format (just title)
      setSelectedItem(itemId);
      setSelectedItemDescription('');
      setShowBuyNowModal(true);
    }
  }, []);

  // Set up global function for popup buttons
  useEffect(() => {
    (window as any).handleBuyNow = handleBuyNowClick;
    
    return () => {
      delete (window as any).handleBuyNow;
    };
  }, [handleBuyNowClick]);

  // Handle name search
  const handleNameSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      // If search is empty, show all markers
      applyMarkerFilter(null, 0);
      return;
    }

    // Find markers that match the search term
    const matchingMarkers = allMarkersRef.current.filter(({ data }) => {
      const title = data.title || '';
      const description = data.description || '';
      const searchLower = searchTerm.toLowerCase();
      
      return title.toLowerCase().includes(searchLower) || 
             description.toLowerCase().includes(searchLower);
    });

    if (matchingMarkers.length > 0) {
      // Show only matching markers
      if (clusterRef.current) {
        clusterRef.current.clearLayers();
        matchingMarkers.forEach(({ marker }) => {
          clusterRef.current.addLayer(marker);
        });
      }

      // If there's only one match, zoom to it
      if (matchingMarkers.length === 1) {
        const marker = matchingMarkers[0];
        if (mapRef.current) {
          mapRef.current.setView([marker.lat, marker.lng], 15, {
            animate: true,
            duration: 1.0
          });
        }
      } else if (matchingMarkers.length > 1) {
        // If multiple matches, fit bounds to show all
        if (mapRef.current && clusterRef.current) {
          const group = new (L as any).FeatureGroup();
          matchingMarkers.forEach(({ marker }) => {
            group.addLayer(marker);
          });
          mapRef.current.fitBounds(group.getBounds().pad(0.1), {
            animate: true,
            duration: 1.0
          });
        }
      }
    } else {
      // No matches found, clear markers
      if (clusterRef.current) {
        clusterRef.current.clearLayers();
      }
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
  const mapContainer = document.getElementById('ushahidi-map2');
  if (!mapContainer) {
    console.error('Map container not found');
    return;
  }

  const map = L.map('ushahidi-map2').setView([20, 78], 5);
  mapRef.current = map;

  // Create custom location pin icon using SVG (smaller size)
  const createLocationIcon = () => {
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24" height="32">
        <path fill="#ef4444" d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/>
      </svg>
    `;

    return L.divIcon({
      html: svgIcon,
      className: 'custom-location-icon',
      iconSize: [24, 32],
      iconAnchor: [12, 32],
      popupAnchor: [0, -32],
    });
  };

  const defaultIcon = createLocationIcon();

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
                // Store item data with unique ID
                const itemId = `item_${itemIdCounterRef.current++}`;
                itemDataMapRef.current.set(itemId, {
                  title: feature.properties?.title || 'No Title',
                  description: feature.properties?.description || ''
                });
                
                const marker = L.marker([lat, lon], { icon: defaultIcon })
                  .bindPopup(
                    `<div class="popup-content">
                      <b>${feature.properties?.title || 'No Title'}</b>
                      <br><br>
                      <button onclick="handleBuyNow('${itemId}')" 
                              class="buy-now-btn" 
                              style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        Buy Now
                      </button>
                    </div>`
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
          // Dynamically find location data in values object
          let locationArray = null;
          if (post.values && typeof post.values === 'object') {
            // Find the first array value that contains lat/lon
            for (const key of Object.keys(post.values)) {
              const value = post.values[key];
              if (Array.isArray(value) && value.length > 0) {
                const firstItem = value[0];
                // Check if this item has lat/lon coordinates
                if (firstItem && typeof firstItem === 'object' &&
                    'lat' in firstItem && 'lon' in firstItem) {
                  locationArray = value;
                  break;
                }
              }
            }
          }

          if (Array.isArray(locationArray) && locationArray.length > 0) {
            const { lat, lon } = locationArray[0];
            if (lat && lon && clusterRef.current) {
              // Store item data with unique ID
              const itemId = `item_${itemIdCounterRef.current++}`;
              itemDataMapRef.current.set(itemId, {
                title: post.title || 'No Title',
                description: post.content || ''
              });
              
              const marker = L.marker([lat, lon], { icon: defaultIcon })
                .bindPopup(
                  `<div class="popup-content">
                    <b>${post.title || 'No Title'}</b>
                    <br><br>
                    <button onclick="handleBuyNow('${itemId}')" 
                            class="buy-now-btn" 
                            style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                      Buy Now
                    </button>
                  </div>`
                );
              
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
      })
      .catch(err => {
        console.error('Failed to load posts:', err);
        // Hide loading state even on error
        setTimeout(() => {
          console.log('Hiding initial loading overlay (error case)');
          setIsInitialLoading(false);
        }, 1000); // Longer delay for error case
      });

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
      <div id="ushahidi-map2" className="w-full h-full rounded-md" />
      
      {/* Initial Loading Overlay */}
      {isInitialLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50 rounded-md">
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
        className="absolute top-4 right-4 z-50"
      />
      
      {/* Buy Now Modal */}
      <BuyNowModal
        open={showBuyNowModal}
        onOpenChange={setShowBuyNowModal}
        itemTitle={selectedItem}
        itemDescription={selectedItemDescription}
      />
    </div>
  );
}

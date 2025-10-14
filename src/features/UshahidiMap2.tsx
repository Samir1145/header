import { useEffect, useRef, useCallback, useState } from 'react';
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

  // Loading state for initial page load
  const [isInitialLoading, setIsInitialLoading] = useState(true);

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
        
        // Hide initial loading state after markers are loaded
        setIsInitialLoading(false);
      })
      .catch(err => {
        console.error('Failed to load posts:', err);
        // Hide loading state even on error
        setIsInitialLoading(false);
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
      <div id="ushahidi-map" className="w-full h-full rounded-md" />
      
      {/* Initial Loading Overlay */}
      {isInitialLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-40">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <div className="text-lg font-medium text-gray-700">Loading map data...</div>
            <div className="text-sm text-gray-500">Please wait while we load all pins</div>
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
    </div>
  );
}

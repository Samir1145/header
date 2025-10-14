import { useState, useCallback, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { X, MapPin } from 'lucide-react';
import { getLocationSuggestions } from '@/lib/locationUtils';

interface LocationFilterProps {
  onLocationChange: (center: { lat: number; lng: number } | null, radius: number) => void;
  onNameSearch: (searchTerm: string) => void;
  onCombinedSearch: (searchState: {
    nameSearch: string;
    locationCenter: { lat: number; lng: number } | null;
    radius: number;
    searchMode: 'name' | 'location' | 'combined' | 'none';
  }) => void;
  onSearchComplete?: () => void;
  onClear: () => void;
  className?: string;
}

interface LocationSuggestion {
  lat: number;
  lng: number;
  display_name: string;
  place_id: string;
}

const radiusOptions = [
  { value: 5, label: 'within 5 km' },
  { value: 10, label: 'within 10 km' },
  { value: 25, label: 'within 25 km' },
  { value: 50, label: 'within 50 km' },
  { value: 100, label: 'within 100 km' },
  { value: 0, label: 'Show all' }
];

export default function LocationFilter({ onLocationChange, onNameSearch, onCombinedSearch, onSearchComplete, onClear, className = '' }: LocationFilterProps) {
  const [cityAddress, setCityAddress] = useState('');
  const [selectedRadius, setSelectedRadius] = useState('10');
  const [nameSearch, setNameSearch] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search state management
  const [currentLocationCenter, setCurrentLocationCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [searchMode, setSearchMode] = useState<'name' | 'location' | 'combined' | 'none'>('none');
  const [isSearching, setIsSearching] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const activeInputRef = useRef<'city' | 'name' | null>(null);

  // Focus maintenance function - only for city input
  const maintainCityFocus = useCallback(() => {
    if (activeInputRef.current === 'city' && inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Comprehensive search handler that coordinates all inputs
  const handleCombinedSearch = useCallback(() => {
    const hasNameSearch = nameSearch.trim().length > 0;
    const hasLocationSearch = currentLocationCenter !== null;
    const radius = parseInt(selectedRadius);

    let newSearchMode: 'name' | 'location' | 'combined' | 'none' = 'none';

    if (hasNameSearch && hasLocationSearch) {
      newSearchMode = 'combined';
    } else if (hasNameSearch) {
      newSearchMode = 'name';
    } else if (hasLocationSearch) {
      newSearchMode = 'location';
    }

    setSearchMode(newSearchMode);

    const searchState = {
      nameSearch: nameSearch.trim(),
      locationCenter: currentLocationCenter,
      radius,
      searchMode: newSearchMode
    };

    // Show loading state
    setIsSearching(true);

    // Call the combined search handler
    onCombinedSearch(searchState);

    // Hide loading state after search is processed
    setTimeout(() => {
      setIsSearching(false);
    }, 1000);
  }, [nameSearch, currentLocationCenter, selectedRadius, onCombinedSearch]);

  // Handle combined search with specific name value (for immediate search after paste)
  const handleCombinedSearchWithValue = useCallback((nameValue: string) => {
    const hasNameSearch = nameValue.trim().length > 0;
    const hasLocationSearch = currentLocationCenter !== null;
    const radius = parseInt(selectedRadius);

    let newSearchMode: 'name' | 'location' | 'combined' | 'none' = 'none';

    if (hasNameSearch && hasLocationSearch) {
      newSearchMode = 'combined';
    } else if (hasNameSearch) {
      newSearchMode = 'name';
    } else if (hasLocationSearch) {
      newSearchMode = 'location';
    }

    setSearchMode(newSearchMode);

    const searchState = {
      nameSearch: nameValue.trim(),
      locationCenter: currentLocationCenter,
      radius,
      searchMode: newSearchMode
    };

    // Show loading state
    setIsSearching(true);

    // Call the combined search handler
    onCombinedSearch(searchState);

    // Hide loading state after search is processed
    setTimeout(() => {
      setIsSearching(false);
    }, 1000);
  }, [currentLocationCenter, selectedRadius, onCombinedSearch]);

  // Handle name search with debouncing
  const handleNameSearch = useCallback((value: string) => {
    setNameSearch(value);
    
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce the search to avoid too many calls
    debounceRef.current = setTimeout(() => {
      // Use the current value instead of relying on state
      handleCombinedSearchWithValue(value);
    }, 300);
  }, [handleCombinedSearchWithValue]);

  // Debounced suggestions fetching and location detection
  const handleAddressChange = useCallback((value: string) => {
    setCityAddress(value);
    setError(null);
    setShowSuggestions(true);
    setSelectedSuggestionIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (value.trim() && value.length >= 2) {
        setIsLoadingSuggestions(true);
        try {
          const suggestions = await getLocationSuggestions(value);
          setSuggestions(suggestions);
          
          // If suggestions are available, check if the input matches any suggestion exactly
          // This handles cases where user types a complete location that matches a suggestion
          if (suggestions.length > 0) {
            const exactMatch = suggestions.find(s => 
              s.display_name.toLowerCase() === value.toLowerCase()
            );
            if (exactMatch) {
              setCurrentLocationCenter({ lat: exactMatch.lat, lng: exactMatch.lng });
              console.log('Exact match found for location:', exactMatch);
            }
          }
        } catch (err) {
          console.error('Suggestions error:', err);
          setSuggestions([]);
        } finally {
          setIsLoadingSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setIsLoadingSuggestions(false);
        // Clear location center if input is empty and trigger search
        if (!value.trim()) {
          setCurrentLocationCenter(null);
          // Trigger search to show name-only results after clearing location
          setTimeout(() => {
            handleCombinedSearch();
          }, 50);
        }
      }
    }, 300);
  }, [handleCombinedSearch]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: LocationSuggestion) => {
    setCityAddress(suggestion.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    
    // Update location center and immediately trigger combined search
    setCurrentLocationCenter({ lat: suggestion.lat, lng: suggestion.lng });
    
    // Trigger search immediately after state update
    setTimeout(() => {
      handleCombinedSearch();
    }, 50);
    
    // Maintain focus after selection
    setTimeout(() => {
      maintainCityFocus();
    }, 100);
  }, [maintainCityFocus, handleCombinedSearch]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  }, [showSuggestions, suggestions, selectedSuggestionIndex, handleSuggestionSelect]);

  const handleRadiusChange = useCallback((value: string) => {
    setSelectedRadius(value);
    
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce the search to avoid too many calls
    debounceRef.current = setTimeout(() => {
      handleCombinedSearch();
    }, 100);
    
    // Maintain focus after radius change
    setTimeout(() => {
      maintainCityFocus();
    }, 100);
  }, [handleCombinedSearch, maintainCityFocus]);

  const handleClear = useCallback(() => {
    setCityAddress('');
    setSelectedRadius('0');
    setNameSearch('');
    setCurrentLocationCenter(null);
    setSearchMode('none');
    setError(null);
    setSuggestions([]);
    setShowSuggestions(false);
    onClear();
    // Maintain focus after clearing
    setTimeout(() => {
      maintainCityFocus();
    }, 0);
  }, [onClear, maintainCityFocus]);

  const handleClearInput = useCallback(() => {
    setCityAddress('');
    setCurrentLocationCenter(null);
    setError(null);
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Trigger search to show name-only results after clearing location
    setTimeout(() => {
      handleCombinedSearch();
    }, 50);
    
    // Maintain focus on input after clearing
    setTimeout(() => {
      maintainCityFocus();
    }, 0);
  }, [handleCombinedSearch, maintainCityFocus]);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-focus on mount and maintain focus aggressively - only for city input
  useEffect(() => {
    const focusCityInput = () => {
      if (activeInputRef.current === 'city' && inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Initial focus on city input
    activeInputRef.current = 'city';
    focusCityInput();

    // Set up interval to maintain focus only if city input is active
    const focusInterval = setInterval(focusCityInput, 100);

    // Focus on any click outside suggestions - only if city input is active
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        activeInputRef.current === 'city' &&
        !suggestionsRef.current?.contains(target) &&
        !inputRef.current?.contains(target) &&
        !nameInputRef.current?.contains(target)
      ) {
        setTimeout(focusCityInput, 10);
      }
    };

    // Focus on any keyboard event - only if city input is active
    const handleDocumentKeydown = (event: KeyboardEvent) => {
      if (activeInputRef.current === 'city' && event.target !== inputRef.current) {
        setTimeout(focusCityInput, 10);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleDocumentKeydown);

    return () => {
      clearInterval(focusInterval);
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleDocumentKeydown);
    };
  }, []);

  // Maintain focus when suggestions change or component updates
  useEffect(() => {
    const focusCityInput = () => {
      if (activeInputRef.current === 'city' && inputRef.current) {
        inputRef.current.focus();
      }
    };

    if (!showSuggestions) {
      setTimeout(focusCityInput, 10);
    }
  }, [showSuggestions]);

  // Aggressive focus maintenance on any state change - only for city input
  useEffect(() => {
    const focusCityInput = () => {
      if (activeInputRef.current === 'city' && inputRef.current) {
        inputRef.current.focus();
      }
    };

    setTimeout(focusCityInput, 50);
  }, [cityAddress, selectedRadius, suggestions.length, isLoadingSuggestions]);

  // Trigger combined search when location center changes
  useEffect(() => {
    if (currentLocationCenter) {
      handleCombinedSearch();
    }
  }, [currentLocationCenter, handleCombinedSearch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={`bg-white rounded-lg shadow-lg border p-4 max-w-sm ${className}`}>
      <div className="space-y-3">
        {/* Search Mode Indicator */}
        {searchMode !== 'none' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                searchMode === 'combined' ? 'bg-blue-500' :
                searchMode === 'name' ? 'bg-green-500' :
                searchMode === 'location' ? 'bg-orange-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-xs text-gray-600 capitalize">
                {searchMode === 'combined' ? 'Name + Location Search' :
                 searchMode === 'name' ? 'Name Search' :
                 searchMode === 'location' ? 'Location Search' : 'No Search'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear
            </Button>
          </div>
        )}

        {/* Loading Indicator */}
        {isSearching && (
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-600">Searching...</span>
            </div>
          </div>
        )}

        {/* Clear Button - only show when no search is active */}
        {searchMode === 'none' && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear
            </Button>
          </div>
        )}

        {/* Name Search Input */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Search by name</label>
          <Input
            ref={nameInputRef}
            value={nameSearch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameSearch(e.target.value)}
            onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
              // Handle paste event to ensure search is triggered
              setTimeout(() => {
                const pastedValue = e.currentTarget.value;
                handleNameSearch(pastedValue);
              }, 10);
            }}
            onFocus={() => activeInputRef.current = 'name'}
            onBlur={() => {
              // Only switch back to city if no other input is focused
              setTimeout(() => {
                if (document.activeElement !== nameInputRef.current) {
                  activeInputRef.current = 'city';
                }
              }, 100);
            }}
            placeholder="Enter name to search"
            className="w-full"
          />
        </div>

        {/* City/Address Input with Suggestions */}
        <div className="space-y-1 relative">
          <label className="text-sm font-medium text-gray-700">City or address</label>
          <div className="relative">
                    <Input
                      ref={inputRef}
                      value={cityAddress}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAddressChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => {
                        activeInputRef.current = 'city';
                        setShowSuggestions(suggestions.length > 0);
                      }}
                      onBlur={(e) => {
                        // Prevent blur if clicking on suggestions
                        if (suggestionsRef.current?.contains(e.relatedTarget as Node)) {
                          e.preventDefault();
                          return;
                        }
                        // Otherwise maintain focus
                        setTimeout(maintainCityFocus, 10);
                      }}
                      placeholder="Enter city or address"
                      className="pr-8"
                      autoFocus
                      tabIndex={0}
                    />
            {cityAddress && !isLoadingSuggestions && (
              <button
                onClick={handleClearInput}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {isLoadingSuggestions && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.place_id}
                  className={`px-3 py-2 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 ${
                    index === selectedSuggestionIndex 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{suggestion.display_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Radius Dropdown */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Radius</label>
          <Select value={selectedRadius} onValueChange={handleRadiusChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {radiusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Map Pin Icon */}
        <div className="flex items-center justify-center pt-2">
          <MapPin className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

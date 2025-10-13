import { useState, useCallback, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { X, MapPin } from 'lucide-react';
import { getLocationSuggestions } from '@/lib/locationUtils';

interface LocationFilterProps {
  onLocationChange: (center: { lat: number; lng: number } | null, radius: number) => void;
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

export default function LocationFilter({ onLocationChange, onClear, className = '' }: LocationFilterProps) {
  const [cityAddress, setCityAddress] = useState('');
  const [selectedRadius, setSelectedRadius] = useState('10');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Focus maintenance function
  const maintainFocus = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Debounced suggestions fetching
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
        } catch (err) {
          console.error('Suggestions error:', err);
          setSuggestions([]);
        } finally {
          setIsLoadingSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setIsLoadingSuggestions(false);
      }
    }, 300);
  }, []);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: LocationSuggestion) => {
    setCityAddress(suggestion.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    
    const radius = parseInt(selectedRadius);
    onLocationChange({ lat: suggestion.lat, lng: suggestion.lng }, radius);
    
    // Maintain focus after selection
    setTimeout(() => {
      maintainFocus();
    }, 100);
  }, [selectedRadius, onLocationChange, maintainFocus]);

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
    
    if (cityAddress.trim()) {
      const radius = parseInt(value);
      // Only trigger if we have a valid location (not just typing)
      if (suggestions.length === 0 && !isLoadingSuggestions) {
        // This means we have a selected location, so we can update the radius
        // We'll need to re-geocode the current address
        getLocationSuggestions(cityAddress).then(suggestions => {
          if (suggestions.length > 0) {
            const suggestion = suggestions[0];
            onLocationChange({ lat: suggestion.lat, lng: suggestion.lng }, radius);
          }
        }).catch(err => {
          console.error('Radius change geocoding error:', err);
        });
      }
    }
    
    // Maintain focus after radius change
    setTimeout(() => {
      maintainFocus();
    }, 100);
  }, [cityAddress, onLocationChange, suggestions.length, isLoadingSuggestions, maintainFocus]);

  const handleClear = useCallback(() => {
    setCityAddress('');
    setSelectedRadius('0');
    setError(null);
    setSuggestions([]);
    setShowSuggestions(false);
    onClear();
    // Maintain focus after clearing
    setTimeout(() => {
      maintainFocus();
    }, 0);
  }, [onClear, maintainFocus]);

  const handleClearInput = useCallback(() => {
    setCityAddress('');
    setError(null);
    setSuggestions([]);
    setShowSuggestions(false);
    onClear();
    // Maintain focus on input after clearing
    setTimeout(() => {
      maintainFocus();
    }, 0);
  }, [onClear, maintainFocus]);

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

  // Auto-focus on mount and maintain focus aggressively
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Initial focus
    focusInput();

    // Set up interval to maintain focus
    const focusInterval = setInterval(focusInput, 100);

    // Focus on any click outside suggestions
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !suggestionsRef.current?.contains(target) &&
        !inputRef.current?.contains(target)
      ) {
        setTimeout(focusInput, 10);
      }
    };

    // Focus on any keyboard event
    const handleDocumentKeydown = (event: KeyboardEvent) => {
      if (event.target !== inputRef.current) {
        setTimeout(focusInput, 10);
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
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    if (!showSuggestions) {
      setTimeout(focusInput, 10);
    }
  }, [showSuggestions]);

  // Aggressive focus maintenance on any state change
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    setTimeout(focusInput, 50);
  }, [cityAddress, selectedRadius, suggestions.length, isLoadingSuggestions]);

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
        {/* Clear Button */}
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

        {/* City/Address Input with Suggestions */}
        <div className="space-y-1 relative">
          <label className="text-sm font-medium text-gray-700">City or address</label>
          <div className="relative">
                    <Input
                      ref={inputRef}
                      value={cityAddress}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAddressChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setShowSuggestions(suggestions.length > 0)}
                      onBlur={(e) => {
                        // Prevent blur if clicking on suggestions
                        if (suggestionsRef.current?.contains(e.relatedTarget as Node)) {
                          e.preventDefault();
                          return;
                        }
                        // Otherwise maintain focus
                        setTimeout(maintainFocus, 10);
                      }}
                      placeholder="Enter city or address"
                      className="pr-8"
                      disabled={isLoadingSuggestions}
                      autoFocus
                      tabIndex={0}
                    />
            {cityAddress && (
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

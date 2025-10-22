"use client";
import { useEffect, useRef, useState } from "react";
import tt from "@tomtom-international/web-sdk-maps";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import { Search, MapPin, Navigation } from "lucide-react";

interface MapProps {
  onLocationChange?: (location: {lat: number, lng: number}) => void;
}

const Map = ({ onLocationChange }: MapProps) => {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [trafficData, setTrafficData] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          setUserLocation(location);
          onLocationChange?.(location);
        },
        (error) => {
          console.warn("Geolocation error:", error);
          // Fallback to San Francisco
          const fallbackLocation = { lat: 37.7749, lng: -122.4194 };
          setUserLocation(fallbackLocation);
          onLocationChange?.(fallbackLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      // Fallback to San Francisco
      const fallbackLocation = { lat: 37.7749, lng: -122.4194 };
      setUserLocation(fallbackLocation);
      onLocationChange?.(fallbackLocation);
    }
  }, [onLocationChange]);

  // Fetch traffic data when location is available
  useEffect(() => {
    if (userLocation) {
      fetch(`/api/traffic?lat=${userLocation.lat}&lon=${userLocation.lng}`)
        .then(res => res.json())
        .then(data => setTrafficData(data))
        .catch(err => console.error("Traffic fetch error:", err));
    }
  }, [userLocation]);

  // Search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim() || !map) return;
    
    setIsSearching(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
      const response = await fetch(
        `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${apiKey}&limit=5`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle location selection
  const handleLocationSelect = (result: any) => {
    const { lat, lon } = result.position;
    const newLocation = { lat, lng: lon };
    setSelectedLocation(result);
    setSearchResults([]);
    setSearchQuery(result.address.freeformAddress);
    setUserLocation(newLocation);
    onLocationChange?.(newLocation);
    
    if (map) {
      map.setCenter([lon, lat]);
      map.setZoom(15);
      
      // Add marker for selected location
      new tt.Marker({ color: '#ef4444' })
        .setLngLat([lon, lat])
        .addTo(map);
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapElement.current || !userLocation) return;

    const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
    
    if (!apiKey) {
      // Show a custom map with current location when API key is not configured
      if (mapElement.current) {
        mapElement.current.innerHTML = `
          <div class="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6">
            <div class="text-center text-white/80">
              <div class="text-6xl mb-4">🗺️</div>
              <p class="text-xl font-bold mb-2">Your Location</p>
              <p class="text-sm mb-4">Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}</p>
              ${trafficData ? `
                <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                  <p class="text-red-400 font-semibold">Traffic: ${trafficData.trafficLevel}</p>
                  <p class="text-red-300 text-sm">Delay: ${trafficData.travelDelayMinutes} minutes</p>
                </div>
              ` : ''}
              <p class="text-xs text-white/50">Configure TomTom API key for live map</p>
            </div>
          </div>
        `;
      }
      return;
    }

    try {
      const mapInstance = tt.map({
        key: apiKey,
        container: mapElement.current,
        center: [userLocation.lng, userLocation.lat],
        zoom: 13
      });

      // Add user location marker
      const userMarker = new tt.Marker({ color: '#3B82F6' })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(mapInstance);

      // Add click handler for map
      mapInstance.on('click', (e: any) => {
        const { lng, lat } = e.lngLat;
        const newLocation = { lat, lng };
        setUserLocation(newLocation);
        onLocationChange?.(newLocation);
        
        // Add click marker
        new tt.Marker({ color: '#10b981' })
          .setLngLat([lng, lat])
          .addTo(mapInstance);
      });

      // Add popup with traffic info
      if (trafficData) {
        const popup = new tt.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-2">
              <h3 class="font-bold text-blue-600">Your Location</h3>
              <p class="text-sm">Traffic: <span class="font-semibold text-red-500">${trafficData.trafficLevel}</span></p>
              <p class="text-sm">Delay: <span class="font-semibold">${trafficData.travelDelayMinutes} min</span></p>
            </div>
          `);
        userMarker.setPopup(popup);
      }

      setMap(mapInstance);

      return () => {
        if (mapInstance) {
          mapInstance.remove();
        }
      };
    } catch (error) {
      console.error('TomTom map initialization failed:', error);
      
      // Fallback to custom display on map error
      if (mapElement.current) {
        mapElement.current.innerHTML = `
          <div class="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6">
            <div class="text-center text-white/80">
              <div class="text-6xl mb-4">🗺️</div>
              <p class="text-xl font-bold mb-2">Your Location</p>
              <p class="text-sm mb-4">Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}</p>
              ${trafficData ? `
                <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                  <p class="text-red-400 font-semibold">Traffic: ${trafficData.trafficLevel}</p>
                  <p class="text-red-300 text-sm">Delay: ${trafficData.travelDelayMinutes} minutes</p>
                </div>
              ` : ''}
              <p class="text-xs text-white/50">Map service temporarily unavailable</p>
            </div>
          </div>
        `;
      }
    }
  }, [userLocation, trafficData]);

  return (
    <div className="h-full w-full relative">
      {/* Search Interface */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                placeholder="Search for a location..."
                className="input-glass pl-10 pr-4 py-3 w-full"
                style={{ minHeight: '48px' }}
              />
            </div>
            <button
              onClick={() => handleSearch(searchQuery)}
              disabled={isSearching}
              className="btn-primary px-4 py-3"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-card max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(result)}
                  className="w-full p-3 text-left hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium text-sm">
                        {result.address.freeformAddress}
                      </p>
                      <p className="text-white/60 text-xs">
                        {result.address.country}, {result.address.countryCode}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapElement} className="h-full w-full rounded-xl" />
      
      {/* Traffic Info Overlay */}
      {trafficData && (
        <div className="absolute bottom-4 left-4 glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-4 h-4 text-blue-400" />
            <span className="text-white font-semibold text-sm">Traffic Info</span>
          </div>
          <div className="space-y-1">
            <p className="text-white/80 text-xs">
              Level: <span className={`font-semibold ${
                trafficData.trafficLevel === 'Light' ? 'text-green-400' :
                trafficData.trafficLevel === 'Moderate' ? 'text-yellow-400' :
                trafficData.trafficLevel === 'Heavy' ? 'text-orange-400' :
                'text-red-400'
              }`}>{trafficData.trafficLevel}</span>
            </p>
            <p className="text-white/80 text-xs">
              Delay: <span className="font-semibold text-white">{trafficData.travelDelayMinutes} min</span>
            </p>
            {trafficData.confidence && (
              <p className="text-white/60 text-xs">
                Confidence: {trafficData.confidence}%
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;

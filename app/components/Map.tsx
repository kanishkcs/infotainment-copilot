"use client";
import { useEffect, useRef, useState } from "react";
import tt from "@tomtom-international/web-sdk-maps";
import "@tomtom-international/web-sdk-maps/dist/maps.css";

const Map = () => {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [trafficData, setTrafficData] = useState<any>(null);
  const [map, setMap] = useState<any>(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.warn("Geolocation error:", error);
          // Fallback to San Francisco
          setUserLocation({ lat: 37.7749, lng: -122.4194 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      // Fallback to San Francisco
      setUserLocation({ lat: 37.7749, lng: -122.4194 });
    }
  }, []);

  // Fetch traffic data when location is available
  useEffect(() => {
    if (userLocation) {
      fetch(`/api/traffic-simple?lat=${userLocation.lat}&lon=${userLocation.lng}`)
        .then(res => res.json())
        .then(data => setTrafficData(data))
        .catch(err => console.error("Traffic fetch error:", err));
    }
  }, [userLocation]);

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

    const mapInstance = tt.map({
      key: apiKey,
      container: mapElement.current,
      center: [userLocation.lng, userLocation.lat],
      zoom: 13,
      style: 'https://api.tomtom.com/map/1/style/23.3.2-*?map=2/basic_night&poi=2/poi_dark&key=' + apiKey,
    });

    // Add user location marker
    const userMarker = new tt.Marker({ color: '#3B82F6' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(mapInstance);

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

    return () => mapInstance.remove();
  }, [userLocation, trafficData]);

  return <div ref={mapElement} className="h-full w-full rounded-xl" />;
};

export default Map;

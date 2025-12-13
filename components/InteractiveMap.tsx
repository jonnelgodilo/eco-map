// components/InteractiveMap.tsx - COMPLETE WORKING VERSION
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Navigation } from "lucide-react";

// Dynamically import leaflet
let L: any = null;
let leafletPromise: Promise<any> | null = null;

const loadLeaflet = () => {
  if (!leafletPromise) {
    leafletPromise = import('leaflet').then((module) => {
      L = module.default || module;
      
      // Fix for leaflet icons
      if (typeof window !== 'undefined') {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });
      }
      return L;
    });
  }
  return leafletPromise;
};

interface InteractiveMapProps {
  initialPosition: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  height?: string;
}

export default function InteractiveMap({ 
  initialPosition, 
  onLocationSelect, 
  height = "400px" 
}: InteractiveMapProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = async () => {
      try {
        await loadLeaflet();
        
        if (!mapContainerRef.current || !L) return;

        // Initialize map
        mapRef.current = L.map(mapContainerRef.current).setView(
          [initialPosition.lat, initialPosition.lng], 
          15
        );

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapRef.current);

        // Add marker
        markerRef.current = L.marker([initialPosition.lat, initialPosition.lng], {
          draggable: true,
        }).addTo(mapRef.current);

        // Marker drag end event
        markerRef.current.on('dragend', (e: any) => {
          const newPos = markerRef.current.getLatLng();
          const updatedPosition = { lat: newPos.lat, lng: newPos.lng };
          setPosition(updatedPosition);
          onLocationSelect(updatedPosition);
        });

        // Map click event
        mapRef.current.on('click', (e: any) => {
          const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
          setPosition(newPos);
          onLocationSelect(newPos);
          markerRef.current.setLatLng([newPos.lat, newPos.lng]);
          mapRef.current.panTo([newPos.lat, newPos.lng]);
        });

        // Add zoom controls
        L.control.zoom({ position: 'topright' }).addTo(mapRef.current);

        // Handle map resize
        setTimeout(() => {
          mapRef.current.invalidateSize();
        }, 100);

        setIsLoaded(true);

      } catch (error) {
        console.error("Failed to initialize map:", error);
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker when position changes
  useEffect(() => {
    if (markerRef.current && isLoaded) {
      markerRef.current.setLatLng([position.lat, position.lng]);
    }
  }, [position, isLoaded]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current.invalidateSize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Manual location update handler
  const handleLocationUpdate = (newLat: number, newLng: number) => {
    if (!isNaN(newLat) && !isNaN(newLng)) {
      const newPos = { lat: newLat, lng: newLng };
      setPosition(newPos);
      onLocationSelect(newPos);
      
      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLng]);
      }
      if (mapRef.current) {
        mapRef.current.panTo([newLat, newLng]);
      }
    }
  };

  // Use current location button
  const handleUseCurrentLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          handleLocationUpdate(newPos.lat, newPos.lng);
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Unable to get your location. Please enable location services.");
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height }}>
        <div className="h-full bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Loading interactive map...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Map Container */}
      <div 
        ref={mapContainerRef}
        className="w-full bg-gray-100"
        style={{ height: `calc(${height} - 120px)` }}
      />
      
      {/* Controls Panel */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="flex items-center text-sm text-green-600 hover:text-green-800 font-medium px-3 py-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Use My Location
          </button>
          
          <div className="text-right">
            <p className="text-xs text-gray-500">Current Pin Location:</p>
            <p className="text-sm font-mono text-gray-800 font-medium">
              {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </p>
          </div>
        </div>
        
        <div className="text-xs text-gray-600 mb-3">
          <p>✓ Click anywhere on the map to place pin</p>
          <p>✓ Drag the marker to adjust position</p>
          <p>✓ Use mouse wheel or +/- buttons to zoom</p>
        </div>
        
        {/* Manual Coordinate Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <div className="flex">
              <input
                type="number"
                value={position.lat}
                onChange={(e) => {
                  const lat = parseFloat(e.target.value);
                  if (!isNaN(lat)) {
                    handleLocationUpdate(lat, position.lng);
                  }
                }}
                step="0.000001"
                className="flex-1 p-2 text-sm border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="14.5995"
              />
              <button
                type="button"
                onClick={() => handleLocationUpdate(position.lat + 0.001, position.lng)}
                className="px-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200"
              >
                ▲
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <div className="flex">
              <input
                type="number"
                value={position.lng}
                onChange={(e) => {
                  const lng = parseFloat(e.target.value);
                  if (!isNaN(lng)) {
                    handleLocationUpdate(position.lat, lng);
                  }
                }}
                step="0.000001"
                className="flex-1 p-2 text-sm border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="120.9842"
              />
              <button
                type="button"
                onClick={() => handleLocationUpdate(position.lat, position.lng + 0.001)}
                className="px-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200"
              >
                ▲
              </button>
            </div>
          </div>
        </div>
        
        {/* Quick Navigation Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => handleLocationUpdate(14.5995, 120.9842)}
            className="flex-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
          >
            Manila
          </button>
          <button
            type="button"
            onClick={() => handleLocationUpdate(14.187865, 121.1618)}
            className="flex-1 text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded hover:bg-green-100"
          >
            Current
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.setZoom(15)}
            className="flex-1 text-xs px-3 py-1.5 bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
          >
            Reset Zoom
          </button>
        </div>
      </div>
    </div>
  );
}
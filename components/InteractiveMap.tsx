// components/InteractiveMap.tsx - UPDATED FOR v5
"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin } from "lucide-react";

// Fix para sa leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/images/marker-icon-2x.png",
  iconUrl: "/leaflet/images/marker-icon.png",
  shadowUrl: "/leaflet/images/marker-shadow.png",
});

interface InteractiveMapProps {
  initialPosition: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  height?: string;
}

// Component para sa clickable marker - UPDATED FOR v5
function LocationPicker({ 
  onLocationSelect, 
  initialPosition 
}: { 
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  initialPosition: { lat: number; lng: number };
}) {
  const [position, setPosition] = useState(initialPosition);
  
  const map = useMapEvents({
    click(e) {
      const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(newPos);
      onLocationSelect(newPos);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? (
    <Marker 
      position={[position.lat, position.lng]} 
      icon={L.icon({
        iconUrl: '/leaflet/images/marker-icon.png',
        shadowUrl: '/leaflet/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      })}
    />
  ) : null;
}

export default function InteractiveMap({ 
  initialPosition, 
  onLocationSelect, 
  height = "400px" 
}: InteractiveMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    setMapLoaded(true);
  }, []);

  if (!mapLoaded) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height }}>
      <MapContainer
        center={[initialPosition.lat, initialPosition.lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationPicker 
          onLocationSelect={onLocationSelect} 
          initialPosition={initialPosition}
        />
      </MapContainer>
    </div>
  );
}
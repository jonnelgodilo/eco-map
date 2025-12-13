// components/OpenStreetMap.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, X, Route as RouteIcon, Clock } from "lucide-react";
import Link from "next/link";

// Fix for default icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/images/marker-icon-2x.png",
  iconUrl: "/leaflet/images/marker-icon.png",
  shadowUrl: "/leaflet/images/marker-shadow.png",
});

interface Pin {
  id: string;
  title: string;
  description: string;
  category: string;
  photoData?: string;
  location: { lat: number; lng: number };
  userEmail: string;
  createdAt: string;
}

interface OpenStreetMapProps {
  pins: Pin[];
  height?: string;
  isGuest?: boolean; // ADDED: Guest mode prop
}

// Helper function to calculate distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function OpenStreetMap({ pins, height = "100%", isGuest = false }: OpenStreetMapProps) {
  console.log("🎬 OpenStreetMap component rendering");
  console.log("📌 Received pins:", pins.length);
  console.log("👤 Is guest:", isGuest);
  
  const [activeRoute, setActiveRoute] = useState<{
    from: { lat: number; lng: number };
    to: { lat: number; lng: number; title: string };
    distance: number;
  } | null>(null);
  
  const [isRouteMode, setIsRouteMode] = useState(false);
  const [routeDestination, setRouteDestination] = useState<Pin | null>(null);
  
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const allMarkersRef = useRef<L.Marker[]>([]);
  const popupRefs = useRef<{ [key: string]: L.Popup | null }>({});

  // Use only actual pins from database
  const displayPins: Pin[] = pins;

  // Clear route function - FIXED
  const clearRoute = () => {
    console.log("🗑️ Clearing route...");
    
    // Remove route elements
    if (polylineRef.current && mapRef.current) {
      mapRef.current.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
    if (userMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (destinationMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(destinationMarkerRef.current);
      destinationMarkerRef.current = null;
    }
    
    // Reset states
    setActiveRoute(null);
    setIsRouteMode(false);
    setRouteDestination(null);
    
    // Clear all markers and polylines from map
    if (mapRef.current) {
      const layersToRemove: L.Layer[] = [];
      
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          layersToRemove.push(layer);
        }
      });
      
      layersToRemove.forEach(layer => {
        mapRef.current!.removeLayer(layer);
      });
    }
    
    // Clear markers array
    allMarkersRef.current = [];
    
    console.log("🔄 Re-adding all pins after clearing route");
    
    // RE-ADD ALL PINS
    if (mapRef.current && displayPins.length > 0) {
      displayPins.forEach((pin) => {
        const marker = L.marker([pin.location.lat, pin.location.lng], {
          icon: getPinIcon(pin.category)
        })
          .addTo(mapRef.current!)
          .bindPopup(createPopupContent(pin));
        allMarkersRef.current.push(marker);
      });
      
      // Center on the first pin instead of Manila
      if (displayPins.length > 0) {
        const firstPin = displayPins[0];
        mapRef.current.flyTo([firstPin.location.lat, firstPin.location.lng], 13, { 
          duration: 1,
          easeLinearity: 0.25
        });
      }
    }
  };

  // Get pin color
  const getPinColor = (category: string) => {
    switch (category) {
      case "recycling": return "#10B981";
      case "green_space": return "#059669";
      case "transport": return "#3B82F6";
      case "water": return "#06B6D4";
      case "cleanup": return "#F97316";
      default: return "#6B7280";
    }
  };

  // Get pin emoji
  const getPinEmoji = (category: string) => {
    switch (category) {
      case 'recycling': return '♻️';
      case 'green_space': return '🌳';
      case 'transport': return '🚲';
      case 'water': return '💧';
      case 'cleanup': return '🧹';
      default: return '📍';
    }
  };

  // Get pin icon - FIXED TYPE
  const getPinIcon = (category: string): L.DivIcon => {
    const color = getPinColor(category);
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          border: 2px solid white;
        ">
          ${getPinEmoji(category)}
        </div>
      `,
      className: "custom-pin",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "recycling": return "Recycling Center";
      case "green_space": return "Green Space/Park";
      case "transport": return "Sustainable Transport";
      case "water": return "Water Station";
      case "cleanup": return "Clean-up Area";
      default: return "Other";
    }
  };

  // Create popup content - MODIFIED FOR GUEST MODE
  const createPopupContent = (pin: Pin) => {
    const popupContent = document.createElement('div');
    popupContent.className = 'p-3';
    popupContent.style.maxWidth = pin.photoData ? '280px' : '320px';
    
    // Title and category
    const titleDiv = document.createElement('div');
    titleDiv.className = 'mb-3';
    titleDiv.innerHTML = `
      <h3 class="font-bold text-base leading-tight text-gray-800 mb-1">${pin.title}</h3>
      <span class="inline-block px-2 py-1 text-xs font-medium rounded-full" style="background-color: ${getPinColor(pin.category)}20; color: ${getPinColor(pin.category)}">
        ${getCategoryLabel(pin.category)}
      </span>
    `;
    popupContent.appendChild(titleDiv);
    
    // Photo if exists
    if (pin.photoData) {
      const photoDiv = document.createElement('div');
      photoDiv.className = 'mb-3';
      const img = document.createElement('img');
      img.src = pin.photoData;
      img.alt = pin.title;
      img.className = 'w-full h-32 object-cover rounded-lg';
      photoDiv.appendChild(img);
      popupContent.appendChild(photoDiv);
    }
    
    // Description
    const descP = document.createElement('p');
    descP.className = 'text-gray-600 text-sm mb-3 line-clamp-3';
    descP.textContent = pin.description;
    popupContent.appendChild(descP);
    
    // Details
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'text-xs text-gray-500 space-y-2 mb-3';
    detailsDiv.innerHTML = `
      <div class="flex items-start">
        <svg class="w-3 h-3 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Coordinates: ${pin.location.lat.toFixed(4)}, ${pin.location.lng.toFixed(4)}</span>
      </div>
      <div class="flex items-start">
        <span class="font-medium mr-1">Added by:</span>
        <span class="truncate">${pin.userEmail.split('@')[0]}</span>
      </div>
      <div class="flex items-start">
        <span class="font-medium mr-1">Date:</span>
        <span>${new Date(pin.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>
    `;
    popupContent.appendChild(detailsDiv);
    
    // Buttons container
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'space-y-2';
    
    // Show Route button - MODIFIED FOR GUEST MODE
    const routeButton = document.createElement('button');
    routeButton.className = 'flex items-center justify-center w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium';
    routeButton.innerHTML = `
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
      ${isGuest ? 'Sign Up to View Route' : 'Show Route from Your Location'}
    `;
    routeButton.onclick = (e) => {
      e.stopPropagation();
      if (isGuest) {
        alert("Please sign up or log in to use the route feature!");
        return;
      }
      drawRoute(pin);
    };
    buttonsDiv.appendChild(routeButton);
    
    // Copy Coordinates button
    const copyButton = document.createElement('button');
    copyButton.className = 'flex items-center justify-center w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm';
    copyButton.innerHTML = `
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      Copy Coordinates
    `;
    copyButton.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(`${pin.location.lat},${pin.location.lng}`);
      alert('Coordinates copied to clipboard!');
    };
    buttonsDiv.appendChild(copyButton);
    
    // Guest mode notice
    if (isGuest) {
      const guestNotice = document.createElement('div');
      guestNotice.className = 'mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800';
      guestNotice.innerHTML = `
        <div class="flex items-start">
          <span class="mr-2">⚠️</span>
          <span>Guest mode: Sign up to add pins and access all features</span>
        </div>
      `;
      buttonsDiv.appendChild(guestNotice);
    }
    
    popupContent.appendChild(buttonsDiv);
    
    return popupContent;
  };

  // Draw route function - MODIFIED FOR GUEST MODE
  const drawRoute = (pin: Pin) => {
    if (!mapRef.current) return;

    // Check if guest
    if (isGuest) {
      alert("Please sign up or log in to use the route feature!");
      return;
    }

    // Set route mode
    setIsRouteMode(true);
    setRouteDestination(pin);

    // Clear any existing route
    if (polylineRef.current) mapRef.current.removeLayer(polylineRef.current);
    if (userMarkerRef.current) mapRef.current.removeLayer(userMarkerRef.current);
    if (destinationMarkerRef.current) mapRef.current.removeLayer(destinationMarkerRef.current);

    // REMOVE ALL OTHER PINS FROM MAP
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current!.removeLayer(layer);
      }
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          
          if (!mapRef.current) return;

          // Create polyline (route line)
          polylineRef.current = L.polyline(
            [
              [userLat, userLng],
              [pin.location.lat, pin.location.lng]
            ],
            {
              color: '#10B981',
              weight: 4,
              opacity: 0.7,
              dashArray: '10, 10'
            }
          ).addTo(mapRef.current);

          // Create user location marker (blue)
          userMarkerRef.current = L.marker([userLat, userLng], {
            icon: L.divIcon({
              html: `
                <div style="
                  background-color: #3B82F6;
                  width: 36px;
                  height: 36px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  font-size: 18px;
                  box-shadow: 0 3px 8px rgba(0,0,0,0.3);
                  border: 3px solid white;
                ">
                  🚶
                </div>
              `,
              className: "user-location-marker",
              iconSize: [36, 36],
              iconAnchor: [18, 36],
            })
          }).addTo(mapRef.current).bindPopup("Your current location");

          // Create destination marker (RED - ONLY THIS PIN)
          destinationMarkerRef.current = L.marker([pin.location.lat, pin.location.lng], {
            icon: L.divIcon({
              html: `
                <div style="
                  background-color: #EF4444;
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  font-size: 20px;
                  box-shadow: 0 3px 8px rgba(0,0,0,0.3);
                  border: 3px solid white;
                ">
                  ${getPinEmoji(pin.category)}
                </div>
              `,
              className: "destination-marker",
              iconSize: [40, 40],
              iconAnchor: [20, 40],
            })
          }).addTo(mapRef.current).bindPopup(`
            <div class="p-3" style="max-width: 300px;">
              <h3 class="font-bold text-base mb-1">${pin.title}</h3>
              <p class="text-sm text-gray-600 mb-2">${getCategoryLabel(pin.category)}</p>
              <p class="text-xs text-gray-500">Your destination</p>
            </div>
          `);

          // Calculate distance
          const distance = calculateDistance(userLat, userLng, pin.location.lat, pin.location.lng);
          
          // Set active route
          setActiveRoute({
            from: { lat: userLat, lng: userLng },
            to: { lat: pin.location.lat, lng: pin.location.lng, title: pin.title },
            distance
          });

          // Fly to user location FIRST
          mapRef.current.flyTo([userLat, userLng], 15, {
            duration: 1.5
          });

          // Then fit bounds to show both points
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.fitBounds([
                [userLat, userLng],
                [pin.location.lat, pin.location.lng]
              ], { 
                padding: [100, 100],
                maxZoom: 15
              });
            }
          }, 1600);

        },
        (error) => {
          alert("Unable to get your location. Please enable location services to see the route.");
          clearRoute(); // Go back to normal view
        }
      );
    } else {
      alert("Your browser doesn't support location services.");
      clearRoute(); // Go back to normal view
    }
  };

  // Initialize map with all pins - FIXED VERSION
  useEffect(() => {
    console.log("🔄 Map useEffect triggered");
    console.log("📌 Display pins:", displayPins.length);
    console.log("🗺️ Map ref:", !!mapRef.current);
    
    const addPinsToMap = () => {
      if (!mapRef.current || displayPins.length === 0) {
        console.log("⏸️ Skipping - no map or no pins");
        return;
      }
      
      const map = mapRef.current;
      
      // Clear existing markers
      allMarkersRef.current.forEach(marker => {
        map.removeLayer(marker);
      });
      allMarkersRef.current = [];
      
      console.log("✅ Adding", displayPins.length, "pins to map");
      
      // Add all pins to map
      displayPins.forEach((pin) => {
        const marker = L.marker([pin.location.lat, pin.location.lng], {
          icon: getPinIcon(pin.category)
        })
          .addTo(map)
          .bindPopup(createPopupContent(pin));
        allMarkersRef.current.push(marker);
      });
      
      // Center map on all pins
      if (displayPins.length > 0) {
        setTimeout(() => {
          if (mapRef.current) {
            const bounds = L.latLngBounds(
              displayPins.map(pin => [pin.location.lat, pin.location.lng])
            );
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
            console.log("🎯 Map centered on pins");
          }
        }, 500);
      }
    };
    
    // Try to add pins immediately
    addPinsToMap();
    
    // If map isn't ready yet, wait a bit and try again
    if (!mapRef.current) {
      console.log("⏳ Map not ready, retrying in 500ms...");
      const retryTimer = setTimeout(() => {
        addPinsToMap();
      }, 500);
      
      return () => clearTimeout(retryTimer);
    }
    
  }, [displayPins]);

  // If no pins, show empty state - MODIFIED FOR GUEST MODE
  if (displayPins.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No Sustainability Points Yet</h3>
          <p className="text-gray-500 mt-2">
            {isGuest 
              ? "Sign up to add the first recycling center, park, or eco-friendly location!"
              : "Be the first to add a recycling center, park, or eco-friendly location!"
            }
          </p>
          {!isGuest && (
            <Link 
              href="/add-pin"
              className="inline-block mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Add First Point
            </Link>
          )}
          {isGuest && (
            <Link 
              href="/signup"
              className="inline-block mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Sign Up to Add Points
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      {/* Map Container */}
      <MapContainer
        center={displayPins.length > 0 ? [displayPins[0].location.lat, displayPins[0].location.lng] : [14.5995, 120.9842]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>

      {/* Guest Mode Banner */}
      {isGuest && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[2000]">
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg shadow-lg flex items-center">
            <span className="mr-2"></span>
            <span className="text-sm font-medium">Viewing in Guest Mode</span>
            <button
              onClick={() => window.location.href = '/signup'}
              className="ml-3 px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}

      {/* Active Route Info Panel - ONLY SHOWS IN ROUTE MODE */}
      {isRouteMode && activeRoute && (
        <div className="absolute top-4 left-4 z-[2000] max-w-xs">
          <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            {/* Header with close button at top-right */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <RouteIcon className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <h3 className="font-bold text-gray-900">Route to Destination</h3>
                  <p className="text-sm text-gray-600">{activeRoute.to.title}</p>
                </div>
              </div>
              <button
                onClick={clearRoute}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Route Information Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Distance</span>
                </div>
                <span className="font-bold text-gray-900">{activeRoute.distance.toFixed(1)} km</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Est. Walking Time</span>
                </div>
                <span className="font-bold text-gray-900">{Math.round(activeRoute.distance * 15)} min</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS para sa popups */}
      <style jsx global>{`
        /* Leaflet popup styles */
        .leaflet-popup {
          z-index: 3000 !important;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 10px !important;
          padding: 0 !important;
          overflow: hidden !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
        
        .leaflet-popup-content {
          margin: 0 !important;
          min-width: 280px !important;
          max-width: 320px !important;
        }
        
        .leaflet-popup-tip-container {
          margin-top: -1px !important;
        }
        
        .leaflet-popup-close-button {
          padding: 10px 12px 0 0 !important;
          font-size: 18px !important;
          color: #666 !important;
        }
        
        .leaflet-container a.leaflet-popup-close-button:hover {
          color: #333 !important;
        }
        
        /* Ensure popup appears above everything */
        .leaflet-popup,
        .leaflet-popup-content-wrapper,
        .leaflet-popup-tip {
          z-index: 3000 !important;
        }
        
        /* Map controls */
        .leaflet-top,
        .leaflet-bottom {
          z-index: 1000 !important;
        }
      `}</style>
    </div>
  );
}
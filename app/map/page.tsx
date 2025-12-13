"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { MapPin, Filter, Search, ArrowLeft, X, ChevronDown, ChevronUp } from "lucide-react";

interface Pin {
  id: string;
  title: string;
  description: string;
  category: string;
  location: { lat: number; lng: number };
  userEmail: string;
  createdAt: string;
}

// DYNAMIC IMPORT PARA SA OpenStreetMap
import dynamic from 'next/dynamic';

const OpenStreetMap = dynamic(
  () => import('@/components/OpenStreetMap'),
  { 
    ssr: false, // CRITICAL: Disable server-side rendering
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }
);

export default function MapPage() {
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pins, setPins] = useState<Pin[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check guest mode first - WITH WINDOW CHECK
    const checkGuestMode = () => {
      if (typeof window === 'undefined') return false;
      
      const sessionGuest = sessionStorage.getItem("isGuest");
      const localGuest = localStorage.getItem("isGuest");
      return sessionGuest === "true" || localGuest === "true";
    };
    
    if (checkGuestMode()) {
      setIsGuest(true);
      setUser({ email: "guest@example.com", isAnonymous: true });
      fetchPins();
      setLoading(false);
      return;
    }
    
    // If not guest, check regular auth
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchPins();
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchPins = async () => {
    try {
      const pinsQuery = query(
        collection(db, "pins"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(pinsQuery);
      
      const pinsData: Pin[] = [];
      querySnapshot.forEach((doc) => {
        pinsData.push({
          id: doc.id,
          ...doc.data()
        } as Pin);
      });
      
      setPins(pinsData);
    } catch (error) {
      console.error("Error fetching pins:", error);
    }
  };

  const filteredPins = pins.filter(pin => {
    const matchesFilter = filter === "all" || pin.category === filter;
    const matchesSearch = search === "" || 
      pin.title.toLowerCase().includes(search.toLowerCase()) ||
      pin.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories = [
    { value: "all", label: "All", icon: "📍", color: "bg-gray-500", name: "All Locations" },
    { value: "recycling", label: "Recycling", icon: "♻️", color: "bg-green-500", name: "Recycling Centers" },
    { value: "green_space", label: "Green", icon: "🌳", color: "bg-emerald-500", name: "Green Spaces" },
    { value: "transport", label: "Transport", icon: "🚲", color: "bg-blue-500", name: "Sustainable Transport" },
    { value: "water", label: "Water", icon: "💧", color: "bg-cyan-500", name: "Water Stations" },
    { value: "cleanup", label: "Clean-up", icon: "🧹", color: "bg-orange-500", name: "Clean-up Areas" },
  ];

  const getCategoryInfo = (value: string) => {
    return categories.find(cat => cat.value === value) || categories[0];
  };

  // Function to handle back button
  const handleBack = () => {
    if (isGuest) {
      // Clear guest session and redirect to login - WITH WINDOW CHECK
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem("isGuest");
        sessionStorage.removeItem("guestExpiry");
        localStorage.removeItem("isGuest");
      }
      router.push("/login");
    } else {
      // Regular user goes to dashboard
      router.push("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading community map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Compact Header - Fixed height */}
      <header className="bg-white shadow-sm border-b z-40 flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back button with conditional behavior */}
            <button
              onClick={handleBack}
              className="flex items-center text-gray-700 hover:text-green-600 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            {/* Center: Title and guest badge */}
            <div className="flex-1 text-center mx-4">
              <div className="flex items-center justify-center gap-2">
                <h1 className="font-semibold text-gray-800">Eco-Map</h1>
                {isGuest && (
                  <span className="flex items-center bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    <MapPin className="w-3 h-3 mr-1" />
                    Guest Mode
                  </span>
                )}
              </div>
              
              {/* Search bar - only for logged in users */}
              {!isGuest && (
                <div className="relative max-w-md mx-auto mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search sustainability points..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-full text-sm"
                  />
                </div>
              )}
            </div>
            
            {/* Right: Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center p-2 rounded-lg transition-colors relative ${
                showFilters 
                  ? "bg-green-100 text-green-600" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Filter className="w-5 h-5 mr-1" />
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
          
          {/* Guest notice */}
          {isGuest && (
            <div className="text-center mt-2">
              <p className="text-xs text-gray-600">
                You're viewing in guest mode. <button 
                  onClick={() => router.push("/signup")}
                  className="text-green-600 hover:underline font-medium"
                >
                  Sign up
                </button> to add pins and access all features.
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Map takes remaining space */}
      <main className="flex-1 relative min-h-0">
        {/* Map Container - Takes full available space */}
        <div className="absolute inset-0">
          <OpenStreetMap 
            pins={filteredPins} 
            isGuest={isGuest}
          />
        </div>

        {/* Floating Filter Panel */}
        {showFilters && (
          <div className="absolute top-2 right-2 z-[1000] bg-white rounded-xl shadow-lg border animate-slide-in max-w-xs w-64">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">Filter by Category</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {categories.map((cat) => (
                  <div key={cat.value}>
                    <button
                      onClick={() => {
                        setFilter(cat.value);
                        setShowFilters(false);
                      }}
                      className={`flex items-center w-full p-3 rounded-lg transition-all ${
                        filter === cat.value
                          ? `${cat.color} text-white shadow-sm`
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span className="text-lg mr-3">{cat.icon}</span>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{cat.name}</div>
                        <div className="text-xs opacity-75">
                          {pins.filter(p => cat.value === "all" ? true : p.category === cat.value).length} points
                        </div>
                      </div>
                      {filter === cat.value && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Current Filter Display */}
              <div className="mt-4 pt-3 border-t">
                <div className="text-xs text-gray-500 mb-1">Current Filter:</div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${getCategoryInfo(filter).color} mr-2`}></div>
                  <span className="font-medium">{getCategoryInfo(filter).name}</span>
                  <span className="ml-auto text-sm text-gray-600">
                    {filteredPins.length} points
                  </span>
                </div>
                {filter !== "all" && (
                  <button
                    onClick={() => setFilter("all")}
                    className="mt-2 text-sm text-green-600 hover:text-green-700 w-full text-center py-1 hover:bg-green-50 rounded"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              
              {/* Guest limitations notice */}
              {isGuest && (
                <div className="mt-4 pt-3 border-t border-yellow-200">
                  <div className="text-xs text-yellow-600 mb-2">⚠️ Guest Limitations:</div>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>View only - cannot add pins</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>Cannot save locations</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Sign Up CTA for Guests */}
      {isGuest && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg px-6 py-3 flex items-center animate-pulse">
            <button
              onClick={() => router.push("/signup")}
              className="flex items-center gap-2 font-medium"
            >
              <span>✨</span>
              Get Full Access - Sign Up Free
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Add CSS for animation */}
      <style jsx global>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.2s ease-out;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        
        /* Fix for Leaflet popups */
        .leaflet-popup {
          z-index: 10000 !important;
        }
        
        .leaflet-top,
        .leaflet-bottom {
          z-index: 100 !important;
        }
        
        .leaflet-control-zoom {
          margin-top: 70px !important;
        }
      `}</style>
    </div>
  );
}
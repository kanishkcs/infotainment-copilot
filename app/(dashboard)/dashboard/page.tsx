"use client";
import { useEffect, useState } from "react";
import { useSpeechRecognition } from "../../lib/speech";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Textarea } from "../../components/ui/Textarea";
import Map from "../../components/Map";
import { 
  Mic, 
  MicOff, 
  Wind, 
  Droplets, 
  Sun, 
  AlertTriangle,
  Activity,
  Navigation,
  Sparkles
} from "lucide-react";

type LiveContext = {
  weather: { tempC: number; condition: string; windKmh: number };
  air: { usAqi: number; category: string };
  uv: { index: number };
};

type DriverScore = {
  overallScore: number;
  breakdown: {
    safety: number;
    efficiency: number;
    comfort: number;
  };
  recommendations: string[];
  metrics: {
    hardBrakes: number;
    smoothAcceleration: number;
    speedCompliance: number;
    laneDiscipline: number;
    followingDistance: number;
    distractionLevel: number;
    tripDuration: number;
    distanceTraveled: number;
  };
  lastUpdated: string;
};

type TrafficInfo = {
  trafficLevel: string;
  travelDelayMinutes: number;
  confidence: number;
  severity: number;
  currentSpeed: number;
  freeFlowSpeed: number;
  lastUpdated: string;
  source: string;
};

export default function DashboardPage() {
  const [prompt, setPrompt] = useState("Suggest a 5-minute tech podcast");
  const [liveContext, setLiveContext] = useState<LiveContext | null>(null);
  const [driverScore, setDriverScore] = useState<DriverScore | null>(null);
  const [trafficInfo, setTrafficInfo] = useState<TrafficInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [queryResponse, setQueryResponse] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const { isSupported, isListening, transcript, error, start, stop } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setPrompt(transcript);
    }
  }, [transcript]);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.warn("Geolocation error:", error);
          // Fallback to San Francisco
          setCurrentLocation({ lat: 37.7749, lng: -122.4194 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      // Fallback to San Francisco
      setCurrentLocation({ lat: 37.7749, lng: -122.4194 });
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contextRes, scoreRes] = await Promise.all([
          fetch("/api/context"),
          fetch("/api/driver-score")
        ]);
        
        if (contextRes.ok) {
          const contextData = await contextRes.json();
          if (contextData.ok) {
            setLiveContext(contextData.data);
          }
        }
        
        if (scoreRes.ok) {
          const scoreData = await scoreRes.json();
          if (scoreData.success) {
            setDriverScore(scoreData.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Fetch traffic data when location changes
  useEffect(() => {
    if (currentLocation) {
      const fetchTrafficData = async () => {
        try {
          const trafficRes = await fetch(`/api/traffic?lat=${currentLocation.lat}&lon=${currentLocation.lng}`);
          if (trafficRes.ok) {
            const trafficData = await trafficRes.json();
            setTrafficInfo(trafficData);
          }
        } catch (error) {
          console.error("Failed to fetch traffic data:", error);
        }
      };
      
      fetchTrafficData();
    }
  }, [currentLocation]);

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "text-green-400";
    if (aqi <= 100) return "text-yellow-400";
    if (aqi <= 150) return "text-orange-400";
    return "text-red-400";
  };

  const handleGetSuggestion = async () => {
    setIsQueryLoading(true);
    setQueryResponse(null);
    
    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: prompt, 
          context: {
            timeOfDay: "afternoon",
            location: "city",
            duration: 5,
            traffic: "Unknown",
            delay: 0,
            weather: "Unknown",
            preferences: { likes: [], dislikes: [] }
          }
        }),
      });
      
      const data = await response.json();
      if (data.response?.message) {
        setQueryResponse(data.response.message);
      } else {
        setQueryResponse("Sorry, I couldn't process your request right now.");
      }
    } catch (error) {
      console.error("Query error:", error);
      setQueryResponse("Sorry, there was an error processing your request.");
    } finally {
      setIsQueryLoading(false);
    }
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full p-8">
      {/* Left Column: Map */}
      <div className="lg:col-span-2 h-full glass-card p-4 overflow-hidden">
        <Map onLocationChange={setCurrentLocation} />
      </div>

      {/* Right Column: Widgets */}
      <div className="flex flex-col gap-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        
        {/* AI Assistant Card */}
        <div className="glass-card-hover p-4">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-blue-400" />
              AI Co-Pilot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask me anything..."
              className="input-glass resize-none"
              style={{ minHeight: '80px', padding: '18px 24px' }}
            />
            <div className="flex gap-3">
              <button 
                onClick={handleGetSuggestion}
                disabled={isQueryLoading}
                className="btn-primary flex-1"
              >
                {isQueryLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Thinking...
                  </div>
                ) : (
                  "Get Suggestion"
                )}
              </button>
              {isSupported ? (
                <button
                  onClick={isListening ? stop : start}
                  className={`btn-secondary px-4 ${
                    isListening ? "animate-pulse-glow bg-red-500/20" : ""
                  }`}
                  title={isListening ? "Stop recording" : "Start voice input"}
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5 text-red-400" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              ) : (
                <div className="px-4 py-2 text-xs text-white/50 bg-gray-700/50 rounded-lg">
                  🎤 Not supported
                </div>
              )}
            </div>
            {error && (
              <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/50">
                <p className="text-xs text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error === "not-supported" ? "Speech recognition not supported in this browser" : error}
                </p>
              </div>
            )}
            
            {transcript && (
              <div className="mt-4 p-3 rounded-lg bg-green-500/20 border border-green-500/50">
                <p className="text-sm text-green-400 font-semibold mb-2">Voice Input:</p>
                <p className="text-sm text-white/90">"{transcript}"</p>
              </div>
            )}
            
            {queryResponse && (
              <div className="mt-4 p-3 rounded-lg bg-blue-500/20 border border-blue-500/50">
                <p className="text-sm text-blue-400 font-semibold mb-2">AI Response:</p>
                <p className="text-sm text-white/90 whitespace-pre-line">{queryResponse}</p>
              </div>
            )}
          </CardContent>
        </div>

        {/* Live Context Card */}
        <div className="glass-card-hover">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Activity className="w-5 h-5 text-blue-400" />
              Live Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-16 w-full" />
              </div>
            ) : liveContext ? (
              <>
                <div className="metric-card">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Sun className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/60">Temperature</p>
                    <p className="text-2xl font-bold">{liveContext.weather.tempC.toFixed(0)}°C</p>
                    <p className="text-xs text-white/50">{liveContext.weather.condition}</p>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="p-3 bg-cyan-500/20 rounded-xl">
                    <Wind className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/60">Wind Speed</p>
                    <p className="text-2xl font-bold">{liveContext.weather.windKmh.toFixed(0)} km/h</p>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <Droplets className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/60">Air Quality</p>
                    <p className={`text-2xl font-bold ${getAQIColor(liveContext.air.usAqi)}`}>
                      AQI {liveContext.air.usAqi}
                    </p>
                    <p className="text-xs text-white/50">{liveContext.air.category}</p>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="p-3 bg-orange-500/20 rounded-xl">
                    <Sun className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/60">UV Index</p>
                    <p className="text-2xl font-bold">{liveContext.uv.index.toFixed(1)}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-white/50 py-8">Could not load live context.</p>
            )}
          </CardContent>
        </div>

        {/* Driver Score Card */}
        <div className="glass-card-hover animate-float">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Navigation className="w-5 h-5 text-blue-400" />
              Driver Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-12 w-full" />
                <div className="skeleton h-12 w-full" />
              </div>
            ) : driverScore ? (
              <>
                <div className="relative">
                  <div className={`text-6xl font-bold text-center bg-gradient-to-r ${
                    driverScore.overallScore >= 90 ? 'from-green-400 to-emerald-500' :
                    driverScore.overallScore >= 75 ? 'from-yellow-400 to-orange-400' :
                    'from-red-400 to-pink-500'
                  } bg-clip-text text-transparent`}>
                    {driverScore.overallScore}
                  </div>
                  <p className="text-center text-white/50 text-sm mt-1">/100</p>
                </div>
                
                <div className="mt-6 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-green-400 font-semibold">{driverScore.breakdown.safety}</div>
                      <div className="text-white/50">Safety</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-400 font-semibold">{driverScore.breakdown.efficiency}</div>
                      <div className="text-white/50">Efficiency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-400 font-semibold">{driverScore.breakdown.comfort}</div>
                      <div className="text-white/50">Comfort</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Hard Brakes</span>
                      <span className={`font-semibold ${
                        driverScore.metrics.hardBrakes === 0 ? 'text-green-400' :
                        driverScore.metrics.hardBrakes <= 2 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {driverScore.metrics.hardBrakes}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Speed Compliance</span>
                      <span className={`font-semibold ${
                        driverScore.metrics.speedCompliance <= 2 ? 'text-green-400' :
                        driverScore.metrics.speedCompliance <= 5 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {driverScore.metrics.speedCompliance} mph over
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Trip Duration</span>
                      <span className="font-semibold text-blue-400">
                        {Math.round(driverScore.metrics.tripDuration)} min
                      </span>
                    </div>
                  </div>
                  
                  {driverScore.recommendations.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-xs text-blue-400 font-semibold mb-1">Recommendation:</p>
                      <p className="text-xs text-white/80">{driverScore.recommendations[0]}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-white/50 py-8">
                <p>Unable to load driver score</p>
              </div>
            )}
          </CardContent>
        </div>

        {/* Traffic Details Card */}
        <div className="glass-card-hover">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Activity className="w-5 h-5 text-red-400" />
              Traffic Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-12 w-full" />
                <div className="skeleton h-12 w-full" />
              </div>
            ) : trafficInfo ? (
              <>
                <div className="space-y-4">
                  <div className="metric-card">
                    <div className="p-3 bg-red-500/20 rounded-xl">
                      <Activity className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white/60">Traffic Level</p>
                      <p className={`text-2xl font-bold ${
                        trafficInfo.trafficLevel === 'Light' ? 'text-green-400' :
                        trafficInfo.trafficLevel === 'Moderate' ? 'text-yellow-400' :
                        trafficInfo.trafficLevel === 'Heavy' ? 'text-orange-400' :
                        'text-red-400'
                      }`}>
                        {trafficInfo.trafficLevel}
                      </p>
                      <p className="text-xs text-white/50">Severity: {trafficInfo.severity}/4</p>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="p-3 bg-orange-500/20 rounded-xl">
                      <Navigation className="w-6 h-6 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white/60">Travel Delay</p>
                      <p className="text-2xl font-bold text-orange-400">
                        {trafficInfo.travelDelayMinutes} min
                      </p>
                      <p className="text-xs text-white/50">Additional time</p>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <Activity className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white/60">Current Speed</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {trafficInfo.currentSpeed} km/h
                      </p>
                      <p className="text-xs text-white/50">Free flow: {trafficInfo.freeFlowSpeed} km/h</p>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <Activity className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white/60">Data Confidence</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {trafficInfo.confidence}%
                      </p>
                      <p className="text-xs text-white/50">Source: {trafficInfo.source}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-white/50 py-8">
                <p>Unable to load traffic data</p>
              </div>
            )}
          </CardContent>
        </div>

      </div>
    </section>
  );
}

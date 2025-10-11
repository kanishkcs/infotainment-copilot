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

export default function DashboardPage() {
  const [prompt, setPrompt] = useState("Suggest a 5-minute tech podcast");
  const [liveContext, setLiveContext] = useState<LiveContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [queryResponse, setQueryResponse] = useState<string | null>(null);
  const { isSupported, isListening, transcript, error, start, stop } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setPrompt(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    fetch("/api/context")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setLiveContext(data.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

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
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)] p-6">
      {/* Left Column: Map */}
      <div className="lg:col-span-2 h-full glass-card p-2 overflow-hidden">
        <Map />
      </div>

      {/* Right Column: Widgets */}
      <div className="flex flex-col gap-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        
        {/* AI Assistant Card */}
        <div className="glass-card-hover">
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
            <div className="relative">
              <div className="text-6xl font-bold text-center bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                100
              </div>
              <p className="text-center text-white/50 text-sm mt-1">/100</p>
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Hard Brakes</span>
                <span className="font-semibold text-green-400">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Smooth Driving</span>
                <span className="font-semibold text-green-400">Perfect</span>
              </div>
            </div>
          </CardContent>
        </div>

      </div>
    </section>
  );
}

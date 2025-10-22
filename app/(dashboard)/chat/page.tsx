"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, ThumbsUp, ThumbsDown, Sparkles, MapPin, Zap } from "lucide-react";

// --- Type Definitions ---
interface AIResponse {
  type: "AI_Response";
  message: string | null;
  query: string;
}

interface FallbackResponse {
  type: "Fallback";
  message: string | null;
}

interface ProactiveSuggestion {
  message: string | null;
}

type ApiResponseData = AIResponse | FallbackResponse;

// --- UI Components ---
const ResponseCard = ({
  data,
  onFeedback,
}: {
  data: AIResponse;
  onFeedback: (topic: string, preference: "like" | "dislike") => void;
}) => (
  <div className="glass-card-hover p-6">
    <p className="text-white/90 mb-4 leading-relaxed">{data.message}</p>
    <div className="flex items-center gap-4 pt-4 border-t border-white/10">
      <span className="text-sm text-white/50">Was this helpful?</span>
      <button
        onClick={() => onFeedback(data.query, "like")}
        className="p-2 hover:bg-green-500/20 rounded-lg transition-colors"
      >
        <ThumbsUp className="w-4 h-4 text-green-400" />
      </button>
      <button
        onClick={() => onFeedback(data.query, "dislike")}
        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
      >
        <ThumbsDown className="w-4 h-4 text-red-400" />
      </button>
    </div>
  </div>
);

const FallbackCard = ({ data }: { data: FallbackResponse }) => (
  <div className="glass-card p-6 border-l-4 border-yellow-500">
    <p className="text-white/90">{data.message}</p>
  </div>
);

const ProactiveCard = ({ suggestion }: { suggestion: ProactiveSuggestion }) => (
  <div className="glass-card-hover p-6 border-l-4 border-purple-500">
    <div className="flex items-start gap-3">
      <Sparkles className="w-5 h-5 text-purple-400 mt-1" />
      <div>
        <p className="text-sm text-purple-400 font-semibold mb-1">Proactive Suggestion</p>
        <p className="text-white/90">{suggestion.message}</p>
      </div>
    </div>
  </div>
);

// --- MAIN PAGE COMPONENT ---
export default function ChatPage() {
  const [query, setQuery] = useState("Suggest a short podcast");
  const [timeOfDay, setTimeOfDay] = useState("morning");
  const [location, setLocation] = useState("city");
  const [duration, setDuration] = useState(15);
  const [preferences, setPreferences] = useState<{
    likes: string[];
    dislikes: string[];
  }>({ likes: [], dislikes: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<ApiResponseData | null>(null);
  const [proactiveSuggestion, setProactiveSuggestion] = useState<ProactiveSuggestion | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [traffic, setTraffic] = useState<{
    trafficLevel: string;
    travelDelayMinutes: number;
  } | null>(null);
  const [weather, setWeather] = useState<{ weatherBrief: string } | null>(null);

  // Load preferences and get geolocation
  useEffect(() => {
    try {
      const storedPrefs = localStorage.getItem("userPreferences");
      if (storedPrefs) setPreferences(JSON.parse(storedPrefs));
    } catch (e) {
      console.error("Could not load preferences", e);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => console.warn("Geolocation denied:", err.message)
      );
    }
  }, []);

  // Fetch live data when coordinates are available
  useEffect(() => {
    if (!coords) return;
    const fetchLiveData = async () => {
      try {
        const [trafficRes, weatherRes] = await Promise.all([
          fetch(`/api/traffic-simple?lat=${coords.lat}&lon=${coords.lon}`),
          fetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}`),
        ]);
        if (trafficRes.ok) setTraffic(await trafficRes.json());
        if (weatherRes.ok) setWeather(await weatherRes.json());
      } catch (e) {
        console.error("Failed to fetch live data", e);
      }
    };
    fetchLiveData();
  }, [coords]);

  // Proactive suggestions
  const getProactiveSuggestion = useCallback(async () => {
    const context = {
      timeOfDay,
      location,
      duration,
      traffic: traffic?.trafficLevel || "Unknown",
      delay: traffic?.travelDelayMinutes || 0,
      weather: weather?.weatherBrief || "Unknown",
      preferences,
    };
    const proactiveQuery =
      "Based on the current context, what is one helpful suggestion you can provide?";
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: proactiveQuery, context }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.response?.type === "AI_Response") {
          setProactiveSuggestion({ message: data.response.message });
        }
      }
    } catch (e) {
      console.error("Proactive suggestion failed", e);
    }
  }, [timeOfDay, location, duration, traffic, weather, preferences]);

  useEffect(() => {
    getProactiveSuggestion();
  }, [getProactiveSuggestion]);

  // Main query submission
  const sendQuery = async (currentQuery: string) => {
    setIsLoading(true);
    setError(null);
    setApiResponse(null);
    const context = {
      timeOfDay,
      location,
      duration,
      traffic: traffic?.trafficLevel || "Unknown",
      delay: traffic?.travelDelayMinutes || 0,
      weather: weather?.weatherBrief || "Unknown",
      preferences,
    };
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: currentQuery, context }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || `Request failed with status ${res.status}`
        );
      setApiResponse(data.response);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (topic: string, preference: "like" | "dislike") => {
    setPreferences((currentPrefs) => {
      const newPrefs = { ...currentPrefs };
      const keyword =
        topic
          .split(" ")
          .filter((w) => w.length > 3)
          .pop()
          ?.toLowerCase() || topic.toLowerCase();
      if (preference === "like" && !newPrefs.likes.includes(keyword)) {
        newPrefs.likes.push(keyword);
        newPrefs.dislikes = newPrefs.dislikes.filter((d) => d !== keyword);
      } else if (
        preference === "dislike" &&
        !newPrefs.dislikes.includes(keyword)
      ) {
        newPrefs.dislikes.push(keyword);
        newPrefs.likes = newPrefs.likes.filter((l) => l !== keyword);
      }
      localStorage.setItem("userPreferences", JSON.stringify(newPrefs));
      return newPrefs;
    });
    alert("Thanks! Your preferences have been updated.");
  };

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="text-center space-y-3 animate-float">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Trip-Aware Co-Pilot
            </h1>
          </div>
          <p className="text-white/60 text-lg">Your intelligent infotainment assistant</p>
        </header>

        {/* Live Context Display */}
        {(weather?.weatherBrief || traffic?.trafficLevel) && (
          <div className="glass-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weather?.weatherBrief && (
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Weather</p>
                    <p className="font-semibold">{weather.weatherBrief}</p>
                  </div>
                </div>
              )}
              {traffic?.trafficLevel && (
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-500/20 rounded-xl">
                    <MapPin className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Traffic</p>
                    <p className="font-semibold">
                      {traffic.trafficLevel} ({traffic.travelDelayMinutes} min delay)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Proactive Suggestion */}
        {proactiveSuggestion?.message && (
          <ProactiveCard suggestion={proactiveSuggestion} />
        )}

        {/* Main Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuery(query);
          }}
          className="glass-card p-6 space-y-4"
        >
          <div className="space-y-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything..."
              className="input-glass text-lg"
              style={{ minHeight: '60px', padding: '20px 24px' }}
            />
            
            <div className="grid grid-cols-3 gap-3">
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="input-glass"
                style={{ minHeight: '56px', padding: '16px 20px' }}
              >
                <option value="morning">🌅 Morning</option>
                <option value="afternoon">☀️ Afternoon</option>
                <option value="evening">🌆 Evening</option>
              </select>
              
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-glass"
                style={{ minHeight: '56px', padding: '16px 20px' }}
              >
                <option value="city">🏙️ City</option>
                <option value="highway">🛣️ Highway</option>
                <option value="rural">🌾 Rural</option>
              </select>
              
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                className="input-glass"
                style={{ minHeight: '56px', padding: '16px 20px' }}
              >
                <option value={5}>⏱️ 5 min</option>
                <option value={15}>⏱️ 15 min</option>
                <option value={30}>⏱️ 30 min</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Get Answer
                </>
              )}
            </button>
          </div>
        </form>

        {/* Results Area */}
        <div className="space-y-4">
          {error && (
            <div className="glass-card p-6 border-l-4 border-red-500">
              <p className="text-red-400">{error}</p>
            </div>
          )}
          
          {apiResponse?.type === "AI_Response" && (
            <ResponseCard data={apiResponse} onFeedback={handleFeedback} />
          )}
          
          {apiResponse?.type === "Fallback" && (
            <FallbackCard data={apiResponse} />
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-white/40 py-4">
          <p>AI responses powered by Hugging Face • Live data from TomTom and Open-Meteo</p>
        </footer>
      </div>
    </main>
  );
}

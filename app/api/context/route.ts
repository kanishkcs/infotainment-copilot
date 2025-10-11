import { NextResponse } from "next/server";

function getAirQualityCategory(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  return "Unhealthy";
}

// A simple map for WMO weather codes to human-readable text
const weatherCodeMap: { [key: number]: string } = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
};

export async function GET() {
  const lat = 37.77; // San Francisco coordinates
  const lon = -122.42;
  const timezone = "America/Los_Angeles";

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,precipitation&timezone=${timezone}`;
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=${timezone}`;
    const uvUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=uv_index&timezone=${timezone}`;
    
    const [weatherRes, airRes, uvRes] = await Promise.all([
      fetch(weatherUrl),
      fetch(airQualityUrl),
      fetch(uvUrl)
    ]);

    const weatherData = await weatherRes.json();
    const airData = await airRes.json();
    const uvData = await uvRes.json();

    const response = {
      weather: {
        tempC: weatherData.current.temperature_2m,
        condition: weatherCodeMap[weatherData.current.weather_code] || "Unknown",
        windKmh: weatherData.current.wind_speed_10m,
        precipMm: weatherData.current.precipitation,
      },
      air: {
        usAqi: airData.current.us_aqi,
        category: getAirQualityCategory(airData.current.us_aqi),
      },
      uv: {
        index: uvData.current.uv_index,
      },
    };
    
    return NextResponse.json({ ok: true, data: response });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to fetch live context data" },
      { status: 500 }
    );
  }
}

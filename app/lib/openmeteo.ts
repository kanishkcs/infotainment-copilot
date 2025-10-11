// lib/openmeteo.ts - free, no-key context using Open‑Meteo
type ContextResult = {
  weather: { tempC: number; windKmh: number; precipMm: number; condition: string; };
  air: { usAqi: number; category: string; };
  uv: { index: number; clearSky: number; };
  pollen: { grass?: number; tree?: number; ragweed?: number; };
};

function categoryFromUSAQI(aqi: number) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

export async function fetchLiveContext(lat: number, lon: number): Promise<ContextResult> {
  const tz = "auto";

  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
  weatherUrl.searchParams.set("latitude", String(lat));
  weatherUrl.searchParams.set("longitude", String(lon));
  weatherUrl.searchParams.set("hourly", ["temperature_2m","precipitation","wind_speed_10m","uv_index","uv_index_clear_sky","weather_code"].join(","));
  weatherUrl.searchParams.set("timezone", tz);

  const airUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  airUrl.searchParams.set("latitude", String(lat));
  airUrl.searchParams.set("longitude", String(lon));
  airUrl.searchParams.set("hourly", ["us_aqi","pm2_5","pm10","pollen_grass","pollen_tree","pollen_ragweed"].join(","));
  airUrl.searchParams.set("timezone", tz);

  const [weatherRes, airRes] = await Promise.all([fetch(weatherUrl), fetch(airUrl)]);
  const weather = await weatherRes.json();
  const air = await airRes.json();

  // Use the latest hour
  const idx = weather.hourly.time.length - 1;
  const aidx = air.hourly.time.length - 1;

  const out: ContextResult = {
    weather: {
      tempC: weather.hourly.temperature_2m[idx],
      windKmh: weather.hourly.wind_speed_10m[idx],
      precipMm: weather.hourly.precipitation[idx],
      condition: String(weather.hourly.weather_code[idx])
    },
    air: {
      usAqi: air.hourly.us_aqi[aidx],
      category: categoryFromUSAQI(air.hourly.us_aqi[aidx])
    },
    uv: {
      index: weather.hourly.uv_index[idx],
      clearSky: weather.hourly.uv_index_clear_sky[idx]
    },
    pollen: {
      grass: air.hourly.pollen_grass?.[aidx],
      tree: air.hourly.pollen_tree?.[aidx],
      ragweed: air.hourly.pollen_ragweed?.[aidx]
    }
  };

  return out;
}

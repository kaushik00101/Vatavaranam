/* ================================================================
  VATAVARANAM - Retro Futuristic Weather Command Center
   script.js
================================================================ */

'use strict';

// -- GLOBAL STATE --
const STATE = {
  lat: null,
  lon: null,
  city: '',
  country: '',
  isCelsius: true,
  currentWeatherData: null,
  forecastData: null,
  hourlyData: null,
  map: null,
  mapMarker: null,
  charts: {},
  weatherEffectsActive: false,
  acTimer: null,
  acIndex: -1,
  currentRequestId: 0,
};

// -- WMO WEATHER CODE MAPPING --
const WMO = {
  0:  { label: 'CLEAR SKY',          icon: '☀️', bg: 'sunny',  emoji: '☀️', mood: 'SUNNY' },
  1:  { label: 'MAINLY CLEAR',        icon: '🌤️', bg: 'sunny',  emoji: '🌤️', mood: 'SUNNY' },
  2:  { label: 'PARTLY CLOUDY',       icon: '⛅', bg: 'cloudy', emoji: '⛅', mood: 'PARTLY CLOUDY' },
  3:  { label: 'OVERCAST',            icon: '☁️', bg: 'cloudy',  emoji: '☁️', mood: 'CLOUDY' },
  45: { label: 'FOG',                 icon: '🌫️', bg: 'foggy',  emoji: '🌫️', mood: 'FOGGY' },
  48: { label: 'RIME FOG',            icon: '🌫️', bg: 'foggy',  emoji: '🌫️', mood: 'FOGGY' },
  51: { label: 'LIGHT DRIZZLE',       icon: '🌦️', bg: 'rainy',  emoji: '🌦️', mood: 'RAINY' },
  53: { label: 'MODERATE DRIZZLE',    icon: '🌧️', bg: 'rainy',  emoji: '🌧️', mood: 'RAINY' },
  55: { label: 'DENSE DRIZZLE',       icon: '🌧️', bg: 'rainy',  emoji: '🌧️', mood: 'RAINY' },
  61: { label: 'SLIGHT RAIN',         icon: '🌧️', bg: 'rainy',  emoji: '🌧️', mood: 'RAINY' },
  63: { label: 'MODERATE RAIN',       icon: '🌧️', bg: 'rainy',  emoji: '🌧️', mood: 'RAINY' },
  65: { label: 'HEAVY RAIN',          icon: '🌧️', bg: 'rainy',  emoji: '🌧️', mood: 'RAINY' },
  71: { label: 'SLIGHT SNOW',         icon: '🌨️', bg: 'snowy',  emoji: '🌨️', mood: 'SNOWY' },
  73: { label: 'MODERATE SNOW',       icon: '❄️', bg: 'snowy',  emoji: '❄️', mood: 'SNOWY' },
  75: { label: 'HEAVY SNOW',          icon: '❄️', bg: 'snowy',  emoji: '❄️', mood: 'SNOWY' },
  77: { label: 'SNOW GRAINS',         icon: '🌨️', bg: 'snowy',  emoji: '🌨️', mood: 'SNOWY' },
  80: { label: 'SLIGHT SHOWERS',      icon: '🌦️', bg: 'rainy',  emoji: '🌦️', mood: 'RAINY' },
  81: { label: 'MODERATE SHOWERS',    icon: '🌧️', bg: 'rainy',  emoji: '🌧️', mood: 'RAINY' },
  82: { label: 'VIOLENT SHOWERS',     icon: '⛈️', bg: 'stormy', emoji: '⛈️', mood: 'STORMY' },
  85: { label: 'SNOW SHOWERS',        icon: '🌨️', bg: 'snowy',  emoji: '🌨️', mood: 'SNOWY' },
  86: { label: 'HEAVY SNOW SHOWERS',  icon: '❄️', bg: 'snowy',  emoji: '❄️', mood: 'SNOWY' },
  95: { label: 'THUNDERSTORM',        icon: '⛈️', bg: 'stormy', emoji: '⛈️', mood: 'STORMY' },
  96: { label: 'THUNDERSTORM + HAIL', icon: '⛈️', bg: 'stormy', emoji: '⛈️', mood: 'STORMY' },
  99: { label: 'THUNDERSTORM + HAIL', icon: '⛈️', bg: 'stormy', emoji: '⛈️', mood: 'STORMY' },
};

const wmo = (code) => WMO[code] || { label: 'UNKNOWN', icon: '☁️', bg: 'cloudy', emoji: '☁️' };

// -- DOM REFS --
const $ = (id) => document.getElementById(id);

// -- LOADING SCREEN --
function initLoader() {
  const bar = $('loaderBar');
  const status = $('loaderStatus');
  status.textContent = 'LOADING...';
  bar.style.width = '100%';
  setTimeout(hideLoader, 700);
}

function hideLoader() {
  const loader = $('loadingScreen');
  loader.style.transition = 'opacity 0.8s ease';
  loader.style.opacity = '0';
  setTimeout(() => { loader.style.display = 'none'; initApp(); }, 800);
}

// -- PARTICLE SYSTEM --
function initParticles() {
  const canvas = $('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.5 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = -Math.random() * 0.4 - 0.1;
      this.opacity = Math.random() * 0.6 + 0.1;
      this.color = ['#b24bff','#00f5ff','#ff3fa4','#ffd700'][Math.floor(Math.random() * 4)];
      this.life = Math.random() * 200 + 100;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life--;
      if (this.life <= 0 || this.y < -10) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < 120; i++) particles.push(new Particle());

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  };
  animate();
}

// -- CLOCK --
function initClock() {
  const update = () => {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    $('navTime').textContent =
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };
  update();
  setInterval(update, 1000);
}

// -- NAVBAR --
function initNavbar() {
  const links = document.querySelectorAll('.nav-link, .mob-link');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      const section = link.getAttribute('data-section');
      if (section) {
        document.querySelector(`.nav-link[data-section="${section}"]`)?.classList.add('active');
      }
      $('mobileNav').classList.remove('open');
    });
  });

  $('hamburger').addEventListener('click', () => {
    $('mobileNav').classList.toggle('open');
  });

  window.addEventListener('scroll', () => {
    const sections = ['dashboard','forecast','map-section','analytics','historical'];
    let current = sections[0];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= 120) current = id;
    });
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.getAttribute('data-section') === current ||
        (current === 'map-section' && l.getAttribute('data-section') === 'map'));
    });
  });
}

// -- GEOCODING / SEARCH --
async function geocodeCity(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  return data.results || [];
}

function simpleSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');
}

function initSearch() {
  const input = $('searchInput');
  const dropdown = $('autocompleteDropdown');
  let results = [];

  const showDropdown = (items) => {
    if (!items.length) { dropdown.classList.remove('visible'); return; }
    dropdown.innerHTML = items.map((r, i) => `
      <div class="ac-item" data-index="${i}">
        <span>${simpleSearchText(r.name)}${r.admin1 ? ', ' + simpleSearchText(r.admin1) : ''}</span>
        <span class="ac-sub">${simpleSearchText(r.country)}</span>
      </div>
    `).join('');
    dropdown.classList.add('visible');
    STATE.acIndex = -1;

    dropdown.querySelectorAll('.ac-item').forEach((el, i) => {
      const select = (e) => {
        if (e) e.preventDefault();
        selectResult(results[i]);
      };
      el.addEventListener('mousedown', select);
      el.addEventListener('click', select);
    });
  };

  const hideDropdown = () => {
    dropdown.classList.remove('visible');
    STATE.acIndex = -1;
  };

  const selectResult = (r) => {
    input.value = r.name;
    hideDropdown();
    loadWeather(r.latitude, r.longitude, r.name, r.country || r.country_code || '');
  };

  input.addEventListener('input', () => {
    const q = input.value.trim();
    clearTimeout(STATE.acTimer);
    if (q.length < 2) { hideDropdown(); return; }
    STATE.acTimer = setTimeout(async () => {
      try {
        results = await geocodeCity(q);
        showDropdown(results);
      } catch { hideDropdown(); }
    }, 280);
  });

  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.ac-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      STATE.acIndex = Math.min(STATE.acIndex + 1, items.length - 1);
      items.forEach((el, i) => el.classList.toggle('selected', i === STATE.acIndex));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      STATE.acIndex = Math.max(STATE.acIndex - 1, -1);
      items.forEach((el, i) => el.classList.toggle('selected', i === STATE.acIndex));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (STATE.acIndex >= 0 && results[STATE.acIndex]) {
        selectResult(results[STATE.acIndex]);
      } else if (input.value.trim()) {
        $('searchBtn').click();
      }
    } else if (e.key === 'Escape') {
      hideDropdown();
    }
  });

  input.addEventListener('blur', () => setTimeout(hideDropdown, 200));

  $('searchBtn').addEventListener('click', async () => {
    const q = input.value.trim();
    if (!q) return;
    try {
      showToast('SCANNING...', false);
      const results = await geocodeCity(q);
      if (results.length) {
        selectResult(results[0]);
      } else {
        showToast('LOCATION NOT FOUND', true);
      }
    } catch {
      showToast('SEARCH ERROR', true);
    }
  });

  $('locationBtn').addEventListener('click', () => {
    if (!navigator.geolocation) { showToast('GEOLOCATION NOT SUPPORTED', true); return; }
    showToast('DETECTING LOCATION...', false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const name = await reverseGeocode(latitude, longitude);
        loadWeather(latitude, longitude, name, '');
      },
      () => showToast('LOCATION ACCESS DENIED', true),
      { timeout: 10000 }
    );
  });
}

async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    return data.address?.city || data.address?.town || data.address?.village ||
           data.address?.county || data.address?.state || 'UNKNOWN LOCATION';
  } catch {
    return 'UNKNOWN LOCATION';
  }
}

function normalizeCityName(city) {
  return city.toLowerCase().includes('bhubaneswar') ? 'Bhubaneswar' : city;
}

function setSearchLoadingState(city, lat, lon, timezone = 'AUTO') {
  $('locationName').textContent = city ? city.toUpperCase() : 'SEARCHING...';
  $('locationMeta').textContent = `LAT: ${lat.toFixed(4)} | LON: ${lon.toFixed(4)} | TZ: ${timezone}`;
  $('locationTime').textContent = 'LOCAL TIME: --:-- | --';
  $('tempMain').textContent = '--';
  $('weatherDesc').textContent = 'SEARCHING...';
  if ($('weatherMood')) $('weatherMood').textContent = 'LOADING...';
  $('feelsLike').textContent = '--';
  if ($('feelsUnit')) $('feelsUnit').textContent = STATE.isCelsius ? 'C' : 'F';
  $('tempMin').textContent = '--';
  $('tempMax').textContent = '--';
  $('tempFill').style.width = '5%';
  $('humidity').textContent = '--%';
  $('humidityFill').style.width = '0%';
  $('windSpeed').textContent = '-- km/h';
  $('windDir').textContent = 'DIR: ---';
  $('pressure').textContent = '-- hPa';
  $('pressureTrend').textContent = 'STABLE';
  $('visibility').textContent = '-- km';
  $('visibilityStatus').textContent = '---';
  $('uvIndex').textContent = '--';
  $('uvLevel').textContent = '---';
  $('cloudCover').textContent = '--%';
  $('cloudFill').style.width = '0%';
  $('sunrise').textContent = '--:--';
  $('sunset').textContent = '--:--';
  $('daylightHours').textContent = '-- hrs';
}

// -- MAIN WEATHER LOADER --
async function loadWeather(lat, lon, city, country) {
  const requestId = ++STATE.currentRequestId;
  city = normalizeCityName(city);
  STATE.lat = lat;
  STATE.lon = lon;
  STATE.city = city;
  STATE.country = country;

  setSearchLoadingState(city, lat, lon);
  showToast(`FETCHING DATA FOR ${city.toUpperCase()}...`, false);

  try {
    // Fetch current + hourly + daily forecast
    const [weather, airQuality] = await Promise.all([
      fetchWeather(lat, lon),
      fetchAirQuality(lat, lon),
    ]);

    if (STATE.currentRequestId !== requestId) {
      // A newer location request has started; ignore stale results.
      return;
    }

    STATE.currentWeatherData = weather;

    updateDashboard(weather, airQuality, city, country, lat, lon);
    updateForecast(weather);
    updateCharts(weather);
    updateAnalytics(weather);
    renderHeatmap(weather);
    updateMapMarker(lat, lon);
    updateHeroBg(weather.current.weather_code, weather.current.precipitation_probability);
    updateWeatherEffects(weather.current.weather_code, weather.current.precipitation_probability);
    updateFooter(lat, lon);

    showToast(`${city.toUpperCase()} DATA LOADED`, false);
  } catch (err) {
    if (STATE.currentRequestId !== requestId) return;
    console.error(err);
    showToast('FETCH FAILED - CHECK CONNECTION', true);
  }
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current_weather: 'true',
    hourly: [
      'temperature_2m','relative_humidity_2m','apparent_temperature',
      'weather_code','wind_speed_10m','wind_direction_10m','surface_pressure',
      'cloud_cover','visibility','uv_index','precipitation_probability',
    ].join(','),
    daily: [
      'temperature_2m_max','temperature_2m_min','weather_code',
      'precipitation_probability_max','wind_speed_10m_max',
      'sunrise','sunset','uv_index_max',
    ].join(','),
    forecast_days: 14,
    wind_speed_unit: 'kmh',
    timezone: 'auto',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error('Weather API failed');

  const data = await res.json();
  const currentTime = data.current_weather?.time;
  const hourlyTimes = Array.isArray(data.hourly?.time) ? data.hourly.time : [];
  const currentIndex = currentTime ? hourlyTimes.indexOf(currentTime) : -1;

  const currentTimestamp = currentTime ? new Date(currentTime).getTime() : null;
  const nearestIndex = currentTimestamp !== null
    ? hourlyTimes.reduce((best, time, idx) => {
        const diff = Math.abs(new Date(time).getTime() - currentTimestamp);
        return diff < best.diff ? { idx, diff } : best;
      }, { idx: 0, diff: Infinity }).idx
    : 0;

  const idx = currentIndex >= 0 ? currentIndex : nearestIndex;

  data.current = {
    temperature_2m: data.current_weather?.temperature ?? data.hourly?.temperature_2m?.[idx] ?? 0,
    apparent_temperature: data.hourly?.apparent_temperature?.[idx] ?? 0,
    relative_humidity_2m: data.hourly?.relative_humidity_2m?.[idx] ?? 0,
    precipitation_probability: data.hourly?.precipitation_probability?.[idx] ?? 0,
    weather_code: data.current_weather?.weathercode ?? data.hourly?.weather_code?.[idx] ?? 0,
    wind_speed_10m: data.current_weather?.windspeed ?? data.hourly?.wind_speed_10m?.[idx] ?? 0,
    wind_direction_10m: data.current_weather?.winddirection ?? data.hourly?.wind_direction_10m?.[idx] ?? 0,
    surface_pressure: data.hourly?.surface_pressure?.[idx] ?? 0,
    cloud_cover: data.hourly?.cloud_cover?.[idx] ?? 0,
    visibility: data.hourly?.visibility?.[idx] ?? 0,
    uv_index: data.hourly?.uv_index?.[idx] ?? null,
    is_day: data.current_weather?.is_day ?? null,
    time: currentTime,
  };

  return data;
}

async function fetchAirQuality(lat, lon) {
  try {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: ['pm10','pm2_5','carbon_monoxide','nitrogen_dioxide','european_aqi'].join(','),
      timezone: 'auto',
    });
    const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// -- UPDATE DASHBOARD --
function updateDashboard(weather, aq, city, country, lat, lon) {
  const cur = weather.current;
  const daily = weather.daily;

  // Location
  $('locationName').textContent = `${city.toUpperCase()}${country ? ', ' + country.toUpperCase() : ''}`;
  $('locationMeta').textContent = `LAT: ${lat.toFixed(4)} | LON: ${lon.toFixed(4)} | TZ: ${weather.timezone || 'AUTO'}`;
  updateLocationTime(weather.timezone);

  // Temperature
  const unit = STATE.isCelsius ? 'C' : 'F';
  const t = STATE.isCelsius ? cur.temperature_2m : c2f(cur.temperature_2m);
  const fl = STATE.isCelsius ? cur.apparent_temperature : c2f(cur.apparent_temperature);
  const tmin = STATE.isCelsius ? daily.temperature_2m_min[0] : c2f(daily.temperature_2m_min[0]);
  const tmax = STATE.isCelsius ? daily.temperature_2m_max[0] : c2f(daily.temperature_2m_max[0]);

  $('tempMain').textContent = Math.round(t);
  if ($('tempUnit')) $('tempUnit').textContent = unit;
  if ($('feelsLike')) $('feelsLike').textContent = Math.round(fl);
  if ($('feelsUnit')) $('feelsUnit').textContent = unit;
  $('tempMin').textContent = Math.round(tmin);
  $('tempMax').textContent = Math.round(tmax);

  // Range bar
  const pct = ((t - tmin) / (tmax - tmin || 1)) * 100;
  $('tempFill').style.width = `${Math.max(5, Math.min(95, pct))}%`;

  // Condition
  const w = wmo(cur.weather_code);
  $('mainWeatherIcon').textContent = w.icon;
  $('weatherDesc').textContent = w.label;
  if ($('weatherMood')) $('weatherMood').textContent = `${w.emoji} ${w.mood}`;

  // Stats
  $('humidity').textContent = `${cur.relative_humidity_2m}%`;
  $('humidityFill').style.width = `${cur.relative_humidity_2m}%`;
  $('windSpeed').textContent = `${Math.round(cur.wind_speed_10m)} km/h`;
  $('windDir').textContent = `DIR: ${degToCompass(cur.wind_direction_10m)}`;
  $('pressure').textContent = `${Math.round(cur.surface_pressure)} hPa`;
  $('pressureTrend').textContent = cur.surface_pressure > 1013 ? 'UP HIGH' : cur.surface_pressure < 1000 ? 'DOWN LOW' : 'STABLE';
  $('visibility').textContent = cur.visibility >= 1000
    ? `${(cur.visibility / 1000).toFixed(1)} km`
    : `${cur.visibility} m`;
  $('visibilityStatus').textContent = visibilityLabel(cur.visibility);
  $('uvIndex').textContent = cur.uv_index ?? '--';
  $('uvLevel').textContent = uvLabel(cur.uv_index);
  $('cloudCover').textContent = `${cur.cloud_cover}%`;
  $('cloudFill').style.width = `${cur.cloud_cover}%`;

  // Sunrise / Sunset
  const sr = new Date(daily.sunrise[0]);
  const ss = new Date(daily.sunset[0]);
  const pad = n => String(n).padStart(2, '0');
  $('sunrise').textContent = `${pad(sr.getHours())}:${pad(sr.getMinutes())}`;
  $('sunset').textContent = `${pad(ss.getHours())}:${pad(ss.getMinutes())}`;
  const daylight = (ss - sr) / 3600000;
  $('daylightHours').textContent = `${daylight.toFixed(1)} hrs`;
  animateSunArc(sr, ss);

  // Air Quality
  if (aq && aq.current) {
    const aqi = aq.current.european_aqi ?? 0;
    $('aqiNum').textContent = aqi;
    $('aqiStatus').textContent = aqiLabel(aqi);
    $('aqiStatus').style.color = aqiColor(aqi);
    const pct = Math.min(100, (aqi / 300) * 100);
    const dash = 157;
    $('aqiProgress').style.strokeDashoffset = dash - (dash * pct / 100);
    $('pm25').textContent = (aq.current.pm2_5 ?? '--').toString().slice(0,5);
    $('pm10').textContent = (aq.current.pm10 ?? '--').toString().slice(0,5);
    $('co').textContent = (aq.current.carbon_monoxide ?? '--').toString().slice(0,5);
    $('no2').textContent = (aq.current.nitrogen_dioxide ?? '--').toString().slice(0,5);
  }

  updateClimateInsights(weather);
}

function updateLocationTime(timezone) {
  const update = () => {
    try {
      const opts = { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: timezone, hour12: true };
      const time = new Intl.DateTimeFormat('en-US', opts).format(new Date());
      const dateOpts = { weekday: 'short', month: 'short', day: 'numeric', timeZone: timezone };
      const date = new Intl.DateTimeFormat('en-US', dateOpts).format(new Date());
      $('locationTime').textContent = `LOCAL TIME: ${time} | ${date}`;
    } catch {
      $('locationTime').textContent = `LOCAL TIME: ${new Date().toLocaleTimeString()}`;
    }
  };
  update();
  if (window._locTimeInterval) clearInterval(window._locTimeInterval);
  window._locTimeInterval = setInterval(update, 1000);
}

function animateSunArc(sunrise, sunset) {
  const now = new Date();
  const totalMs = sunset - sunrise;
  const elapsed = now - sunrise;
  let pct = Math.max(0, Math.min(1, elapsed / totalMs));

  const dash = 250;
  $('sunArcProgress').style.strokeDashoffset = dash - (dash * pct);

  // Move sun ball along arc
  const angle = Math.PI * pct;
  const cx = 10 + Math.cos(Math.PI - angle) * 90 + 90;
  const cy = 110 - Math.sin(angle) * 100;
  $('sunBall').setAttribute('cx', cx);
  $('sunBall').setAttribute('cy', cy);
}

// -- FORECAST --
function updateForecast(weather) {
  renderHourly(weather);
  renderDailyGrid(weather, 7, 'daily7Grid');
  renderDailyGrid(weather, 14, 'daily14Grid');
}

function renderHourly(weather) {
  const container = $('hourlyScroll');
  const now = new Date();
  const hours = weather.hourly;
  const html = [];

  for (let i = 0; i < Math.min(48, hours.time.length); i++) {
    const t = new Date(hours.time[i]);
    const isNow = Math.abs(t - now) < 1800000;
    const temp = STATE.isCelsius ? Math.round(hours.temperature_2m[i]) : Math.round(c2f(hours.temperature_2m[i]));
    const w = wmo(hours.weather_code[i]);
    const rain = hours.precipitation_probability[i] ?? 0;
    const pad = n => String(n).padStart(2, '0');
    const label = isNow ? 'NOW' : `${pad(t.getHours())}:00`;

    html.push(`
      <div class="hourly-card ${isNow ? 'now' : ''}">
        <div class="hc-time">${label}</div>
        <div class="hc-icon">${w.icon}</div>
        <div class="hc-temp">${temp}</div>
        <div class="hc-rain">RAIN ${rain}%</div>
      </div>
    `);
  }
  container.innerHTML = html.join('');
}

function renderDailyGrid(weather, days, containerId) {
  const container = $(containerId);
  const daily = weather.daily;
  const html = [];
  const dayNames = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

  for (let i = 0; i < days && i < daily.time.length; i++) {
    const d = new Date(daily.time[i]);
    const label = i === 0 ? 'TODAY' : i === 1 ? 'TOMORROW' : dayNames[d.getDay()];
    const w = wmo(daily.weather_code[i]);
    const tmin = STATE.isCelsius ? Math.round(daily.temperature_2m_min[i]) : Math.round(c2f(daily.temperature_2m_min[i]));
    const tmax = STATE.isCelsius ? Math.round(daily.temperature_2m_max[i]) : Math.round(c2f(daily.temperature_2m_max[i]));
    const rain = daily.precipitation_probability_max[i] ?? 0;

    html.push(`
      <div class="daily-row">
        <div class="dr-day">${label}</div>
        <div class="dr-icon">${w.icon}</div>
        <div class="dr-desc">${w.label}</div>
        <div class="dr-rain">RAIN ${rain}%</div>
        <div class="dr-bar-wrap"><div class="dr-bar" style="width:${Math.min(100,((tmax+30)/(60))*100)}%"></div></div>
        <div class="dr-temp">${tmin} / ${tmax}</div>
      </div>
    `);
  }
  container.innerHTML = html.join('');
}

// -- CHARTS --
function updateCharts(weather) {
  const hours = weather.hourly;
  const labels = hours.time.slice(0, 48).map(t => {
    const d = new Date(t);
    return `${String(d.getHours()).padStart(2,'0')}:00`;
  });
  const temps = hours.temperature_2m.slice(0, 48).map(t => STATE.isCelsius ? t : c2f(t));
  const rain = hours.precipitation_probability.slice(0, 48);
  const wind = hours.wind_speed_10m.slice(0, 48);

  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(5,1,20,0.9)',
        titleColor: '#00f5ff',
        bodyColor: '#e0d4ff',
        borderColor: 'rgba(178,75,255,0.4)',
        borderWidth: 1,
        titleFont: { family: 'Orbitron', size: 11 },
        bodyFont: { family: 'Share Tech Mono', size: 12 },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(178,75,255,0.08)' },
        ticks: { color: '#5a4f7a', font: { family: 'Share Tech Mono', size: 10 }, maxTicksLimit: 12 },
      },
      y: {
        grid: { color: 'rgba(178,75,255,0.08)' },
        ticks: { color: '#9d8ec0', font: { family: 'Share Tech Mono', size: 11 } },
      },
    },
  };

  // Temp Chart
  if (STATE.charts.temp) STATE.charts.temp.destroy();
  STATE.charts.temp = new Chart($('tempChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: temps,
        borderColor: '#b24bff',
        backgroundColor: 'rgba(178,75,255,0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#b24bff',
        tension: 0.4,
        fill: true,
      }],
    },
    options: { ...chartDefaults, plugins: { ...chartDefaults.plugins } },
  });

  // Rain Chart
  if (STATE.charts.rain) STATE.charts.rain.destroy();
  STATE.charts.rain = new Chart($('rainChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: rain,
        backgroundColor: 'rgba(0,245,255,0.25)',
        borderColor: '#00f5ff',
        borderWidth: 1,
        borderRadius: 2,
      }],
    },
    options: { ...chartDefaults },
  });

  // Wind Chart
  if (STATE.charts.wind) STATE.charts.wind.destroy();
  STATE.charts.wind = new Chart($('windChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: wind,
        borderColor: '#ff6b35',
        backgroundColor: 'rgba(255,107,53,0.08)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      }],
    },
    options: { ...chartDefaults },
  });
}

// -- ANALYTICS --
function updateAnalytics(weather) {
  renderMonthlyChart(weather);
  renderSeasonalGrid(weather);
}

function renderMonthlyChart(weather) {
  const daily = weather.daily;
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  // Aggregate available daily data by "simulated month avg"
  const avgTemps = months.map((_, mi) => {
    const temps = daily.temperature_2m_max.map((t, i) => {
      const d = new Date(daily.time[i]);
      return d.getMonth() === mi ? t : null;
    }).filter(v => v !== null);
    if (temps.length === 0) return null;
    return temps.reduce((a, b) => a + b, 0) / temps.length;
  });

  // Fill nulls with estimated values (seasonal pattern)
  const filledTemps = avgTemps.map((v, i) => {
    if (v !== null) return v;
    const base = (daily.temperature_2m_max[0] + daily.temperature_2m_min[0]) / 2;
    return base + 10 * Math.sin(((i - 3) / 12) * Math.PI * 2);
  });

  const displayTemps = filledTemps.map(t => STATE.isCelsius ? Math.round(t) : Math.round(c2f(t)));

  if (STATE.charts.monthly) STATE.charts.monthly.destroy();
  STATE.charts.monthly = new Chart($('monthlyChart'), {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          type: 'line',
          data: displayTemps,
          borderColor: '#ff3fa4',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#ff3fa4',
          tension: 0.4,
          yAxisID: 'y',
        },
        {
          data: displayTemps,
          backgroundColor: displayTemps.map(t => {
            const v = STATE.isCelsius ? t : (t - 32) * 5 / 9;
            if (v < 0)  return 'rgba(0,245,255,0.3)';
            if (v < 15) return 'rgba(0,150,255,0.3)';
            if (v < 25) return 'rgba(0,255,135,0.3)';
            if (v < 35) return 'rgba(255,215,0,0.3)';
            return 'rgba(255,107,53,0.3)';
          }),
          borderColor: 'rgba(178,75,255,0.4)',
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(5,1,20,0.9)',
          titleColor: '#00f5ff',
          bodyColor: '#e0d4ff',
          borderColor: 'rgba(178,75,255,0.4)',
          borderWidth: 1,
          titleFont: { family: 'Orbitron', size: 11 },
          bodyFont: { family: 'Share Tech Mono', size: 12 },
        },
      },
      scales: {
        x: { grid: { color: 'rgba(178,75,255,0.08)' }, ticks: { color: '#5a4f7a', font: { family: 'Share Tech Mono', size: 10 } } },
        y: { grid: { color: 'rgba(178,75,255,0.08)' }, ticks: { color: '#9d8ec0', font: { family: 'Share Tech Mono', size: 11 } } },
      },
    },
  });
}

function renderSeasonalGrid(weather) {
  const daily = weather.daily;
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const allTemps = daily.temperature_2m_max;
  const len = allTemps.length;
  const q = Math.floor(len / 4) || 1;

  const seasons = [
    { name: 'SPRING', icon: 'SPRING', temps: allTemps.slice(0, q) },
    { name: 'SUMMER', icon: 'SUMMER', temps: allTemps.slice(q, q * 2) },
    { name: 'AUTUMN', icon: 'AUTUMN', temps: allTemps.slice(q * 2, q * 3) },
    { name: 'WINTER', icon: 'WINTER', temps: allTemps.slice(q * 3) },
  ];

  $('seasonalGrid').innerHTML = seasons.map(s => {
    const t = s.temps.length ? Math.round(STATE.isCelsius ? avg(s.temps) : c2f(avg(s.temps))) : '--';
    return `
      <div class="season-card">
        <div class="season-icon">${s.icon}</div>
        <div class="season-name">${s.name}</div>
        <div class="season-temp">${t}</div>
      </div>
    `;
  }).join('');
}

function updateClimateInsights(weather) {
  const cur = weather.current;
  const daily = weather.daily;
  const insights = [];

  const maxTemp = Math.max(...daily.temperature_2m_max);
  const minTemp = Math.min(...daily.temperature_2m_min);
  const avgRain = daily.precipitation_probability_max.reduce((a,b)=>a+b,0) / daily.precipitation_probability_max.length;

  if (maxTemp > 35) insights.push('WARNING: EXTREME HEAT expected this week - stay hydrated');
  if (minTemp < 0) insights.push('WARNING: FREEZING TEMPERATURES forecast - ice risk possible');
  if (cur.uv_index >= 8) insights.push('WARNING: VERY HIGH UV INDEX - sun protection essential');
  if (cur.wind_speed_10m > 50) insights.push('WARNING: STRONG WINDS detected - outdoor activities risky');
  if (avgRain > 60) insights.push('WARNING: HIGH PRECIPITATION probability this week');
  if (cur.relative_humidity_2m > 80) insights.push('WARNING: HIGH HUMIDITY - heat feels significantly hotter');
  if (cur.relative_humidity_2m < 30) insights.push('WARNING: LOW HUMIDITY - dry air conditions detected');
  if (cur.cloud_cover < 20) insights.push('NOTICE: CLEAR SKIES - excellent conditions for outdoor activities');
  if (cur.visibility < 1000) insights.push('WARNING: LOW VISIBILITY - reduced sight conditions active');
  if (cur.surface_pressure < 995) insights.push('WARNING: LOW PRESSURE SYSTEM - weather change incoming');

  if (!insights.length) insights.push('STABLE CONDITIONS - no weather alerts for this area');

  $('insightsList').innerHTML = insights.slice(0, 6).map(i => `
    <div class="insight-item">${i}</div>
  `).join('');
}

// -- HEATMAP --
function renderHeatmap(weather) {
  const container = $('heatmapWrap');
  const days = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
  const hours = weather.hourly;
  let html = '';

  // Hour labels (first row)
  html += '<div class="hm-label">HOUR</div>';
  for (let h = 0; h < 24; h++) {
    html += `<div class="hm-hour-label">${String(h).padStart(2,'0')}</div>`;
  }

  for (let d = 0; d < 7; d++) {
    html += `<div class="hm-label">${days[d]}</div>`;
    for (let h = 0; h < 24; h++) {
      const idx = d * 24 + h;
      const temp = hours.temperature_2m[idx] ?? 15;
      const col = tempToColor(temp);
      const unit = STATE.isCelsius ? Math.round(temp) : Math.round(c2f(temp));
      html += `<div class="hm-cell" style="background:${col}" title="${unit}"></div>`;
    }
  }

  container.innerHTML = html;
}

function tempToColor(t) {
  if (t < 0)   return 'rgba(0, 200, 255, 0.7)';
  if (t < 5)   return 'rgba(0, 150, 255, 0.7)';
  if (t < 10)  return 'rgba(0, 100, 200, 0.7)';
  if (t < 15)  return 'rgba(0, 200, 150, 0.7)';
  if (t < 20)  return 'rgba(0, 255, 135, 0.6)';
  if (t < 25)  return 'rgba(200, 255, 0, 0.6)';
  if (t < 30)  return 'rgba(255, 215, 0, 0.7)';
  if (t < 35)  return 'rgba(255, 140, 0, 0.7)';
  return 'rgba(255, 60, 60, 0.8)';
}

// -- HERO BACKGROUND --
function updateHeroBg(code) {
  const bg = wmo(code).bg;
  const heroBg = $('heroBg');

  const gradients = {
    sunny:  'radial-gradient(ellipse at 50% 0%, rgba(255,215,0,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(255,107,53,0.06) 0%, transparent 50%)',
    cloudy: 'radial-gradient(ellipse at 50% 0%, rgba(100,100,180,0.10) 0%, transparent 60%), radial-gradient(ellipse at 20% 60%, rgba(80,80,120,0.06) 0%, transparent 50%)',
    rainy:  'radial-gradient(ellipse at 50% 0%, rgba(0,100,255,0.10) 0%, transparent 60%), radial-gradient(ellipse at 30% 80%, rgba(0,200,255,0.05) 0%, transparent 50%)',
    stormy: 'radial-gradient(ellipse at 50% 0%, rgba(150,0,255,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(255,0,100,0.06) 0%, transparent 50%)',
    snowy:  'radial-gradient(ellipse at 50% 0%, rgba(200,230,255,0.10) 0%, transparent 60%), radial-gradient(ellipse at 50% 80%, rgba(0,245,255,0.05) 0%, transparent 50%)',
    foggy:  'radial-gradient(ellipse at 50% 0%, rgba(150,150,150,0.08) 0%, transparent 70%)',
  };

  heroBg.style.background = `${gradients[bg] || gradients.cloudy}, var(--bg-primary)`;
}

// -- WEATHER EFFECTS --
function updateWeatherEffects(code, precipProb = 0) {
  clearWeatherEffects();
  const bg = wmo(code).bg;
  const shouldRain = precipProb >= 20 && (bg === 'rainy' || bg === 'stormy');
  if (shouldRain) createRain();
  if (bg === 'snowy') createSnow();
}

function clearWeatherEffects() {
  document.querySelectorAll('.rain-overlay, .snowflake').forEach(el => el.remove());
}

function createRain() {
  const overlay = document.createElement('div');
  overlay.className = 'rain-overlay';
  for (let i = 0; i < 60; i++) {
    const drop = document.createElement('div');
    drop.className = 'raindrop';
    drop.style.cssText = `
      left: ${Math.random() * 100}%;
      height: ${Math.random() * 20 + 10}px;
      animation-duration: ${Math.random() * 0.5 + 0.7}s;
      animation-delay: ${Math.random() * 2}s;
      opacity: ${Math.random() * 0.4 + 0.2};
    `;
    overlay.appendChild(drop);
  }
  document.body.appendChild(overlay);
}

function createSnow() {
  for (let i = 0; i < 30; i++) {
    const flake = document.createElement('div');
    flake.className = 'snowflake';
    flake.textContent = '❄️';
    flake.style.cssText = `
      left: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 4 + 4}s;
      animation-delay: ${Math.random() * 6}s;
      font-size: ${Math.random() * 10 + 8}px;
      opacity: ${Math.random() * 0.5 + 0.3};
    `;
    document.body.appendChild(flake);
  }
}

// -- MAP --
function initMap() {
  const map = L.map('weatherMap', {
    center: [20, 0],
    zoom: 2,
    zoomControl: false,
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  const layers = {
    standard: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'OSM' }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri' }),
    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: 'Carto' }),
  };

  layers.standard.addTo(map);
  STATE.map = map;
  STATE.mapLayers = layers;

  // Map click
  map.on('click', async (e) => {
    const { lat, lng } = e.latlng;
    const name = await reverseGeocode(lat, lng);
    loadWeather(lat, lng, name, '');
    showMapPanel(lat, lng, name);
  });

  // Layer controls
  document.querySelectorAll('.map-ctrl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.map-ctrl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const layer = btn.dataset.layer;
      Object.values(STATE.mapLayers).forEach(l => map.removeLayer(l));
      STATE.mapLayers[layer].addTo(map);
    });
  });
}

async function showMapPanel(lat, lon, name) {
  const panel = $('mapOverlayPanel');
  panel.innerHTML = `
    <div class="map-panel-title">${name.toUpperCase()}</div>
    <div class="map-panel-content">
      <div class="map-weather-row"><span>LAT</span><span>${lat.toFixed(4)}</span></div>
      <div class="map-weather-row"><span>LON</span><span>${lon.toFixed(4)}</span></div>
      <div class="map-weather-row"><span>STATUS</span><span>LOADING...</span></div>
    </div>
  `;
  panel.style.display = 'block';

  // Quick weather fetch for panel
  try {
    const params = new URLSearchParams({
      latitude: lat, longitude: lon,
      current: 'temperature_2m,weather_code,wind_speed_10m',
      timezone: 'auto',
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    const data = await res.json();
    const cur = data.current;
    const w = wmo(cur.weather_code);
    const t = STATE.isCelsius ? Math.round(cur.temperature_2m) : Math.round(c2f(cur.temperature_2m));
    panel.innerHTML = `
      <div class="map-panel-title">${w.icon} ${name.toUpperCase()}</div>
      <div class="map-panel-content map-weather-detail">
        <div class="map-weather-row"><span>CONDITION</span><span>${w.label}</span></div>
        <div class="map-weather-row"><span>TEMPERATURE</span><span>${t} ${STATE.isCelsius?'C':'F'}</span></div>
        <div class="map-weather-row"><span>WIND</span><span>${Math.round(cur.wind_speed_10m)} km/h</span></div>
        <div class="map-weather-row"><span>LAT</span><span>${lat.toFixed(4)}</span></div>
        <div class="map-weather-row"><span>LON</span><span>${lon.toFixed(4)}</span></div>
      </div>
    `;
  } catch {}
}

function updateMapMarker(lat, lon) {
  if (!STATE.map) return;

  const icon = L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;
      background:#b24bff;
      border:2px solid #00f5ff;
      border-radius:50%;
      box-shadow:0 0 12px #b24bff, 0 0 24px rgba(178,75,255,0.5);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  if (STATE.mapMarker) STATE.map.removeLayer(STATE.mapMarker);
  STATE.mapMarker = L.marker([lat, lon], { icon }).addTo(STATE.map);
  STATE.map.flyTo([lat, lon], Math.max(STATE.map.getZoom(), 8), { duration: 1.5 });
}

// -- HISTORICAL --
function initHistorical() {
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  $('histEndDate').value = today.toISOString().split('T')[0];
  $('histStartDate').value = oneWeekAgo.toISOString().split('T')[0];

  $('loadHistoricalBtn').addEventListener('click', async () => {
    if (!STATE.lat) { showToast('WARNING: LOAD A LOCATION FIRST', true); return; }
    const start = $('histStartDate').value;
    const end = $('histEndDate').value;
    if (!start || !end) { showToast('WARNING: SELECT DATE RANGE', true); return; }
    if (start > end) { showToast('WARNING: START MUST BE BEFORE END', true); return; }

    const btn = $('loadHistoricalBtn');
    btn.disabled = true;
    btn.textContent = 'RETRIEVING...';

    try {
      const params = new URLSearchParams({
        latitude: STATE.lat,
        longitude: STATE.lon,
        start_date: start,
        end_date: end,
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code',
        timezone: 'auto',
      });
      const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`);
      if (!res.ok) throw new Error('Archive API error');
      const data = await res.json();
      renderHistorical(data, start, end);
      showToast('HISTORICAL DATA LOADED', false);
    } catch (err) {
      showToast('FAILED TO LOAD HISTORICAL DATA', true);
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.textContent = 'RETRIEVE DATA';
    }
  });
}

function renderHistorical(data, start, end) {
  const container = $('historicalResults');
  const daily = data.daily;

  if (!daily || !daily.time.length) {
    container.innerHTML = '<div class="hist-placeholder"><div class="placeholder-text">NO DATA AVAILABLE FOR THIS RANGE</div></div>';
    return;
  }

  const temps = STATE.isCelsius ? daily.temperature_2m_max : daily.temperature_2m_max.map(c2f);
  const minsC = STATE.isCelsius ? daily.temperature_2m_min : daily.temperature_2m_min.map(c2f);
  const avgMax = temps.reduce((a,b)=>a+b,0)/temps.length;
  const avgMin = minsC.reduce((a,b)=>a+b,0)/minsC.length;
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...minsC);
  const totalRain = daily.precipitation_sum.reduce((a,b)=>a+(b||0),0);

  container.innerHTML = `
    <div class="hist-chart-card">
      <div class="chart-title">TEMPERATURE HISTORY: ${start} TO ${end}</div>
      <canvas id="histChart"></canvas>
    </div>
    <div class="hist-summary-grid">
      <div class="hist-summary-card">
        <div class="hs-label">AVG MAX TEMP</div>
        <div class="hs-value">${Math.round(avgMax)}</div>
      </div>
      <div class="hist-summary-card">
        <div class="hs-label">AVG MIN TEMP</div>
        <div class="hs-value">${Math.round(avgMin)}</div>
      </div>
      <div class="hist-summary-card">
        <div class="hs-label">PEAK TEMP</div>
        <div class="hs-value">${Math.round(maxTemp)}</div>
      </div>
      <div class="hist-summary-card">
        <div class="hs-label">LOWEST TEMP</div>
        <div class="hs-value">${Math.round(minTemp)}</div>
      </div>
      <div class="hist-summary-card">
        <div class="hs-label">TOTAL PRECIP</div>
        <div class="hs-value">${totalRain.toFixed(1)}mm</div>
      </div>
      <div class="hist-summary-card">
        <div class="hs-label">DATA POINTS</div>
        <div class="hs-value">${daily.time.length}</div>
      </div>
    </div>
  `;

  if (STATE.charts.hist) STATE.charts.hist.destroy();
  STATE.charts.hist = new Chart($('histChart'), {
    type: 'line',
    data: {
      labels: daily.time,
      datasets: [
        {
          label: 'MAX',
          data: temps.map(Math.round),
          borderColor: '#ff6b35',
          backgroundColor: 'rgba(255,107,53,0.1)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#ff6b35',
          tension: 0.3,
          fill: false,
        },
        {
          label: 'MIN',
          data: minsC.map(Math.round),
          borderColor: '#00f5ff',
          backgroundColor: 'rgba(0,245,255,0.1)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#00f5ff',
          tension: 0.3,
          fill: '-1',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: { color: '#9d8ec0', font: { family: 'Share Tech Mono', size: 11 } },
        },
        tooltip: {
          backgroundColor: 'rgba(5,1,20,0.9)',
          titleColor: '#00f5ff',
          bodyColor: '#e0d4ff',
          borderColor: 'rgba(178,75,255,0.4)',
          borderWidth: 1,
        },
      },
      scales: {
        x: { grid: { color: 'rgba(178,75,255,0.08)' }, ticks: { color: '#5a4f7a', font: { family: 'Share Tech Mono', size: 10 }, maxTicksLimit: 10 } },
        y: { grid: { color: 'rgba(178,75,255,0.08)' }, ticks: { color: '#9d8ec0', font: { family: 'Share Tech Mono', size: 11 } } },
      },
    },
  });
}

// -- UNIT TOGGLE --
function initUnitToggle() {
  $('celsiusBtn').addEventListener('click', () => {
    if (STATE.isCelsius) return;
    STATE.isCelsius = true;
    $('celsiusBtn').classList.add('active');
    $('fahrenheitBtn').classList.remove('active');
    if (STATE.currentWeatherData) {
      updateDashboard(STATE.currentWeatherData, null, STATE.city, STATE.country, STATE.lat, STATE.lon);
      updateForecast(STATE.currentWeatherData);
      updateCharts(STATE.currentWeatherData);
      renderHeatmap(STATE.currentWeatherData);
    }
  });
  $('fahrenheitBtn').addEventListener('click', () => {
    if (!STATE.isCelsius) return;
    STATE.isCelsius = false;
    $('fahrenheitBtn').classList.add('active');
    $('celsiusBtn').classList.remove('active');
    if (STATE.currentWeatherData) {
      updateDashboard(STATE.currentWeatherData, null, STATE.city, STATE.country, STATE.lat, STATE.lon);
      updateForecast(STATE.currentWeatherData);
      updateCharts(STATE.currentWeatherData);
      renderHeatmap(STATE.currentWeatherData);
    }
  });
}

// -- FORECAST TABS --
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
}

// -- FOOTER --
function updateFooter(lat, lon) {
  $('footerCoords').textContent = `SYS: ONLINE | LAT: ${lat.toFixed(4)} | LON: ${lon.toFixed(4)}`;
}

// -- TOAST --
let toastTimer;
function showToast(msg, isError = false) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast ${isError ? 'error' : ''}`;
  clearTimeout(toastTimer);
  setTimeout(() => toast.classList.add('show'), 10);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// -- UTILS --
function c2f(c) { return (c * 9/5) + 32; }

function degToCompass(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function visibilityLabel(v) {
  if (v >= 10000) return 'EXCELLENT';
  if (v >= 5000)  return 'GOOD';
  if (v >= 2000)  return 'MODERATE';
  if (v >= 1000)  return 'POOR';
  return 'VERY POOR';
}

function uvLabel(uv) {
  if (uv === null || uv === undefined) return '---';
  if (uv <= 2)  return 'LOW';
  if (uv <= 5)  return 'MODERATE';
  if (uv <= 7)  return 'HIGH';
  if (uv <= 10) return 'VERY HIGH';
  return 'EXTREME';
}

function aqiLabel(aqi) {
  if (aqi <= 20)  return 'GOOD';
  if (aqi <= 40)  return 'FAIR';
  if (aqi <= 60)  return 'MODERATE';
  if (aqi <= 80)  return 'POOR';
  if (aqi <= 100) return 'VERY POOR';
  return 'EXTREMELY POOR';
}

function aqiColor(aqi) {
  if (aqi <= 20)  return '#00ff87';
  if (aqi <= 40)  return '#ffd700';
  if (aqi <= 60)  return '#ff9500';
  if (aqi <= 80)  return '#ff3fa4';
  return '#ff0000';
}

// -- GSAP ANIMATIONS --
function initAnimations() {
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.from('.card-primary', { opacity: 0, y: 30, duration: 0.8, delay: 0.2, ease: 'power2.out' });
  gsap.from('.stat-card', { opacity: 0, y: 20, duration: 0.5, stagger: 0.05, delay: 0.4, ease: 'power2.out' });
  gsap.from('.sun-card', { opacity: 0, x: 30, duration: 0.7, delay: 0.5, ease: 'power2.out' });
  gsap.from('.air-card', { opacity: 0, x: -30, duration: 0.7, delay: 0.6, ease: 'power2.out' });
}

// -- KEYBOARD SHORTCUTS --
function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== $('searchInput')) {
      e.preventDefault();
      $('searchInput').focus();
    }
    if (e.key === 'Escape') {
      $('autocompleteDropdown').classList.remove('visible');
      $('favModal').classList.remove('open');
    }
  });
}

// -- DEFAULT LOAD (Bhubaneswar as user location) --
function loadDefaultCity() {
  // Try geolocation first
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const name = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        loadWeather(pos.coords.latitude, pos.coords.longitude, name, '');
      },
      () => {
        // Fallback to Bhubaneswar (user's location)
        loadWeather(20.2961, 85.8245, 'Bhubaneswar', 'India');
      },
      { timeout: 5000 }
    );
  } else {
    loadWeather(20.2961, 85.8245, 'Bhubaneswar', 'India');
  }
}

// -- INIT APP --
function initApp() {
  initParticles();
  initClock();
  initNavbar();
  initSearch();
  initUnitToggle();
  initTabs();
  initHistorical();
  initMap();
  initAnimations();
  initKeyboard();
  loadDefaultCity();
}

// -- BOOT --
document.addEventListener('DOMContentLoaded', initLoader);

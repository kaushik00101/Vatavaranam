# Vatavaranam

A responsive weather dashboard built with vanilla HTML, CSS, and JavaScript. Search any city or use your current location to view live conditions, forecasts, air quality, an interactive map, and historical weather data.

**[Live Demo](https://kaushik00101.github.io/Vatavaranam/)**

---

## Features

- **Current conditions:** temperature, feels-like, humidity, wind speed and direction, pressure, visibility, UV index, and cloud cover.
- **City search:** autocomplete suggestions for cities worldwide, plus automatic location detection.
- **Forecasts:** hourly, 7-day, and 14-day views.
- **Charts:** temperature, precipitation probability, and wind speed trends.
- **Air quality:** AQI with PM2.5, PM10, CO, and NO2 readings.
- **Solar cycle:** sunrise, sunset, and daylight duration.
- **Interactive map:** click anywhere to check the weather at that point, with standard, satellite, and dark map layers.
- **Climate analytics:** monthly temperature averages, seasonal breakdown, weekly heatmap, and weather insights.
- **Historical data:** retrieve past weather for any custom date range.
- **Unit toggle:** switch between Celsius and Fahrenheit.
- **Responsive design:** works on desktop, tablet, and mobile.

## Tech Stack

| Area | Tools |
| --- | --- |
| Markup and styling | HTML5, CSS3 |
| Logic | JavaScript (ES6+, async/await) |
| Charts | [Chart.js](https://www.chartjs.org/) |
| Maps | [Leaflet](https://leafletjs.com/) with OpenStreetMap, Esri, and Carto tiles |
| Animation | [GSAP](https://gsap.com/) |

## Data Sources

No API key is required.

- [Open-Meteo](https://open-meteo.com/): forecast, air quality, geocoding, and historical archive data
- [Nominatim (OpenStreetMap)](https://nominatim.openstreetmap.org/): reverse geocoding for location detection

## Getting Started

```bash
git clone https://github.com/kaushik00101/Vatavaranam.git
cd Vatavaranam
```

Open `index.html` in your browser, or serve the folder locally:

```bash
npx serve .
```

An internet connection is required for weather data and external libraries.

## Usage

- Type a city name in the search bar, or select **Locate** to use your current position.
- Press `/` to jump to the search bar from anywhere on the page.
- Use the **C / F** toggle to change temperature units.
- Switch between **Hourly**, **7-Day**, and **14-Day** forecast tabs.
- Click the map to view weather for any location.
- Choose a start and end date in **History** and select **Retrieve Data**.

## Project Structure

```
Vatavaranam/
├── index.html    # Page structure
├── style.css     # Styling and responsive layout
├── script.js     # API calls, rendering, charts, and map logic
└── README.md
```

## Author

**Kaushik** - [@kaushik00101](https://github.com/kaushik00101)

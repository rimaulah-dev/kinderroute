# KinderRoute 🏫

A production-quality Progressive Web App (PWA) that helps you find kindergartens along your driving route in Kuala Lumpur.

## Features

- **Route Planning**: Enter origin and destination addresses to calculate a driving route
- **Kindergarten Search**: Automatically finds kindergartens within 1.5km of your route
- **Interactive Map**: Visual map display powered by Leaflet with route polylines and markers
- **Detailed Information**: View kindergarten names, addresses, and distance from route
- **PWA Support**: Install on mobile devices for offline access
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Framework**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS v4
- **Mapping**: Leaflet.js
- **APIs**:
  - Nominatim (OpenStreetMap) for geocoding
  - OSRM for routing
  - Overpass API for kindergarten data

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Usage

1. Enter your starting point (Point A) - defaults to "Residensi Rumbia, Kuala Lumpur"
2. Enter your destination (Point B) - defaults to "KLCC, Kuala Lumpur"
3. Click "Find Kindergartens" to search
4. View results on the map and in the sidebar
5. Click on any kindergarten marker or list item for details

## Features in Detail

### Route Calculation
- Uses OSRM (Open Source Routing Machine) for accurate driving routes
- Displays blue polyline on the map
- Green marker for origin, red marker for destination

### Kindergarten Search
- Searches within bounding box of route + 1km padding
- Filters results to only show kindergartens within 1.5km of actual route
- Sorts results by distance (closest first)
- Shows count of results found

### Distance Calculation
- Uses Haversine formula for accurate distance calculation
- Calculates minimum distance from each kindergarten to any point on the route
- Displays distance in kilometers

### PWA Features
- Installable on mobile devices
- Offline caching with service worker
- Responsive design optimized for mobile
- Native app-like experience

## Design

- **Color Palette**:
  - Primary: #2E7D32 (deep green - nature, education)
  - Accent: #FF8F00 (warm amber - playful, child-friendly)
  - Background: #F8FBF8 (off-white with green tint)
- **Typography**:
  - Headings: Nunito (rounded, friendly)
  - Body: Inter (clean, readable)

## API Usage

All APIs used are free and open-source:
- No API keys required
- Respects usage policies and rate limits
- Includes proper User-Agent headers

## License

This project is built for educational and personal use.

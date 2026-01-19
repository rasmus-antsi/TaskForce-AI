# TaskForce AI

A tactical mission planning system built as a portfolio project and proof-of-concept for military planning applications.

![Status](https://img.shields.io/badge/status-prototype-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

## ⚠️ Disclaimer

**This is a portfolio project and proof-of-concept.** It is **NOT** intended for use in real military operations or life-critical situations. The software is provided as-is for demonstration and educational purposes only.

This project is currently being developed with plans for future field testing by military personnel and continued development based on real-world feedback.

## Overview

TaskForce AI is a web-based tactical mission planning system featuring:

- **Interactive Map** — Estonian topographic maps via Maa-amet (X-GIS) services
- **Military Symbology** — MIL-STD-2525 tactical markers and symbols
- **Drawing Tools** — Lines, polygons, circles, arrows for planning overlays
- **Coordinate Systems** — MGRS, UTM, and Lat/Lon with grid overlays
- **Terrain Analysis** — Elevation profiles and line-of-sight calculations
- **Measurement Tools** — Distance and area calculations

## Tech Stack

### Frontend
- React + Vite
- Leaflet / React-Leaflet
- Tailwind CSS
- milsymbol (MIL-STD-2525 rendering)
- proj4 (coordinate transformations)

### Backend
- Django + Django REST Framework
- SQLite (development) / PostgreSQL (production)
- Python requests (WMS proxy)

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/taskforce-ai.git
cd taskforce-ai

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install django django-cors-headers requests
python manage.py migrate
python manage.py runserver

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`

## Map Data Attribution

### Maa-amet (Estonian Land Board)

This project uses map services provided by **Maa-amet** (Estonian Land Board) via their X-GIS platform.

#### Terms of Service

The map data is provided under Maa-amet's open data license. Key points:

- **Attribution Required** — When using Maa-amet map services, proper attribution must be displayed
- **Non-Commercial Use** — This project uses the data for demonstration/portfolio purposes
- **No Redistribution** — Map tiles and data should not be redistributed without permission
- **API Fair Use** — Respect rate limits and don't overload the WMS/WMTS services

**Official Terms:** [https://geoportaal.maaamet.ee/](https://geoportaal.maaamet.ee/)

#### Services Used

| Service | Layer | Purpose |
|---------|-------|---------|
| WMS | `pohi_vr2` | Base topographic map |
| WMS | `TOPOVR` | Detailed terrain features |
| WMS | `reljeef` | Elevation/relief data |
| WMTS | `kaart` | Cached map tiles |

#### Attribution

```
Map data © Maa-amet (Estonian Land Board)
https://maaamet.ee
```

## Project Structure

```
TaskForce AI/
├── backend/
│   ├── _core/          # Django settings and main URLs
│   ├── a_map/          # Map proxy and elevation services
│   ├── a_tools/        # Drawing tools and feature storage
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapView.jsx         # Main map component
│   │   │   ├── CoordinateDisplay.jsx
│   │   │   ├── MGRSGrid.jsx
│   │   │   └── tools/              # Drawing and analysis tools
│   │   ├── stores/                 # State management
│   │   └── utils/                  # Coordinate utilities
│   └── package.json
└── README.md
```

## Features

### Current
- [x] Estonian topographic base maps
- [x] MGRS/UTM/Lat-Lon coordinate display
- [x] MGRS grid overlay (10km, 1km, 100m)
- [x] Drawing tools (line, polygon, circle, rectangle)
- [x] Arrow/direction tool
- [x] MIL-STD-2525 tactical markers
- [x] Distance and area measurements
- [x] Elevation profile analysis
- [x] Line-of-sight analysis
- [x] Feature persistence (database storage)
- [x] Map position memory (local storage)

### Planned
- [ ] Mission planning workflows
- [ ] Route optimization
- [ ] Threat modeling overlays
- [ ] Team collaboration (real-time sync)
- [ ] Weather integration
- [ ] After-action review tools
- [ ] AI tactical advisor
- [ ] Export to military formats (MGRS waypoints, etc.)

## Development Status

This project is in active development as a portfolio piece. It demonstrates:

- Integration of military mapping standards (MIL-STD-2525, MGRS)
- Working with Estonian national geospatial services
- Full-stack web development (React + Django)
- Geospatial analysis (elevation, line-of-sight)
- Modern UI/UX for tactical applications

**Future Development:** The project is planned for field testing with military personnel to gather real-world requirements and feedback for continued development.

## Contributing

This is currently a personal portfolio project. If you're interested in contributing or have feedback, please open an issue.

## License

MIT License — See [LICENSE](LICENSE) for details.

**Note:** This license applies to the application code only. Map data from Maa-amet is subject to their own licensing terms.

## Acknowledgments

- [Maa-amet](https://maaamet.ee) — Estonian Land Board for map services
- [milsymbol](https://github.com/spatialillusions/milsymbol) — Military symbology library
- [Leaflet](https://leafletjs.com) — Interactive maps library
- Estonian Defence Forces — For future field testing and feedback

---

*Built with ☕ in Estonia*

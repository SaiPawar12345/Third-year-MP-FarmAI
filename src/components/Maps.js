import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, GeoJSON, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-draw';
import './Maps.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  shadowAnchor: [12, 41]
});

const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  shadowAnchor: [12, 41]
});

const WEATHER_API_KEY = '0e218b7bd9e2434db43163834241910';
const WEATHER_API_URL = 'https://api.weatherapi.com/v1/current.json';
const SOIL_API_URL = 'https://rest.isric.org/soilgrids/v2.0/properties/query';

const Maps = () => {
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState([]);
  const [lastSelectedPoint, setLastSelectedPoint] = useState(null);
  const [selectedPointInfo, setSelectedPointInfo] = useState(null);
  const [showDrawTools, setShowDrawTools] = useState(false);
  const [showGeoJSON, setShowGeoJSON] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [useGeoMap, setUseGeoMap] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [soilData, setSoilData] = useState({ sand: 0, silt: 0, clay: 0, ph: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('soil');
  const mapRef = useRef();

  useEffect(() => {
    if (mapRef.current) {
      L.map = mapRef.current;
    }
  }, []);

  useEffect(() => {
    if (selectedPointInfo) {
      console.log('Selected Point Data:', {
        location: selectedPointInfo.location,
        weather: selectedPointInfo.weather,
        soil: selectedPointInfo.soil
      });
    }
  }, [selectedPointInfo]);

  // Load GeoJSON data
  useEffect(() => {
    const loadGeoJSON = async () => {
      try {
        const response = await fetch('farm.geojson');
        const data = await response.json();
        setGeoData(data);
      } catch (error) {
        console.error('Error loading GeoJSON data:', error);
      }
    };

    loadGeoJSON();
  }, []);

  // Set up Leaflet map with drawing tools
  useEffect(() => {
    const map = mapRef.current;

    if (map) {
      const drawnItemsGroup = new L.FeatureGroup();
      map.addLayer(drawnItemsGroup);

      const drawControl = new L.Control.Draw({
        edit: {
          featureGroup: drawnItemsGroup,
        },
        draw: {
          polygon: true,
          rectangle: true,
          polyline: false,
          circle: false,
          marker: false,
        },
      });

      map.on(L.Draw.Event.CREATED, async (e) => {
        drawnItemsGroup.clearLayers();
        const layer = e.layer;
        drawnItemsGroup.addLayer(layer);

        if (e.layerType === 'polygon' || e.layerType === 'rectangle') {
          const latlngs = layer.getLatLngs();
          const flattenedLatLngs = Array.isArray(latlngs[0]) ? latlngs.flat() : latlngs;
          setSelectedRegion(flattenedLatLngs);

          // Fetch data and update state
          await Promise.all([
            fetchWeatherData(flattenedLatLngs),
            fetchSoilData(flattenedLatLngs)
          ]);
        }
      });

      if (showDrawTools) {
        map.addControl(drawControl);
      } else {
        map.removeControl(drawControl);
      }

      return () => {
        map.removeLayer(drawnItemsGroup);
        map.removeControl(drawControl);
      };
    }
  }, [showDrawTools]);

  // Fetch weather data
  const fetchWeatherData = async (latlngs) => {
    if (latlngs.length > 0) {
      const lat = latlngs[0].lat;
      const lng = latlngs[0].lng;
      try {
        const response = await fetch(`${WEATHER_API_URL}?key=${WEATHER_API_KEY}&q=${lat},${lng}`);
        const data = await response.json();
        const fetchedWeather = {
          temperature: data.current.temp_c,
          humidity: data.current.humidity,
          windSpeed: data.current.wind_kph,
        };
        setWeatherInfo(fetchedWeather);
        return fetchedWeather;
      } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
      }
    }
  };

  // Fetch soil quality data
  const fetchSoilData = async (latlngs) => {
    if (latlngs.length > 0) {
      const lat = latlngs[0].lat;
      const lng = latlngs[0].lng;
      const properties = ['sand', 'silt', 'clay', 'phh2o'];

      try {
        const soilDataPromises = properties.map(async (property) => {
          const depth = '0-5cm';
          const response = await fetch(`${SOIL_API_URL}?lat=${lat}&lon=${lng}&property=${property}&depth=${depth}`);
          const data = await response.json();
          const meanValue = data?.properties?.layers[0]?.depths[0]?.values?.mean;
          return { property, value: meanValue ?? 0 };
        });

        const soilDataResults = await Promise.all(soilDataPromises);
        const soilInfoObject = soilDataResults.reduce((acc, curr) => {
          acc[curr.property] = curr.value;
          return acc;
        }, {});

        const updatedSoilData = {
          sand: (soilInfoObject.sand)/10 || 0,
          silt: (soilInfoObject.silt)/10 || 0,
          clay: (soilInfoObject.clay)/10 || 0,
          ph: (soilInfoObject.phh2o)/10 || 0,
        };

        setSoilData(updatedSoilData);
        return updatedSoilData;
      } catch (error) {
        console.error('Error fetching soil data:', error);
        return null;
      }
    }
  };

  // Function to handle point selection
  const handlePointSelect = async (point) => {
    console.log('Selecting point:', point);
    setSelectedPointInfo(null);

    try {
      const [weatherData, soilData] = await Promise.all([
        fetchWeatherData([point]),
        fetchSoilData([point])
      ]);

      if (!weatherData || !soilData) {
        console.error('Failed to fetch data from APIs');
        return;
      }

      console.log('Raw API soil data:', soilData);

      // First ensure all values are numbers and not null/undefined
      const rawSoil = {
        sand: Number(soilData.sand) || 0,
        silt: Number(soilData.silt) || 0,
        clay: Number(soilData.clay) || 0,
        ph: Number(soilData.ph) || 0
      };

      // Normalize to ensure values are between 0-100
      const normalizedSoil = {
        sand: Math.min(100, Math.max(0, rawSoil.sand)),
        silt: Math.min(100, Math.max(0, rawSoil.silt)),
        clay: Math.min(100, Math.max(0, rawSoil.clay)),
        ph: rawSoil.ph
      };

      console.log('Normalized soil data:', normalizedSoil);

      // Calculate the total and create percentage distribution
      const total = normalizedSoil.sand + normalizedSoil.silt + normalizedSoil.clay;
      const scaledSoil = {
        sand: Math.round((normalizedSoil.sand / total) * 100),
        silt: Math.round((normalizedSoil.silt / total) * 100),
        clay: Math.round((normalizedSoil.clay / total) * 100),
        ph: normalizedSoil.ph
      };

      // Ensure percentages add up to exactly 100%
      const scaledTotal = scaledSoil.sand + scaledSoil.silt + scaledSoil.clay;
      if (scaledTotal !== 100) {
        const diff = 100 - scaledTotal;
        // Add the difference to the largest value
        const max = Math.max(scaledSoil.sand, scaledSoil.silt, scaledSoil.clay);
        if (max === scaledSoil.sand) scaledSoil.sand += diff;
        else if (max === scaledSoil.silt) scaledSoil.silt += diff;
        else scaledSoil.clay += diff;
      }

      console.log('Final scaled soil data:', scaledSoil);

      const pointInfo = {
        location: point,
        weather: weatherData,
        soil: scaledSoil
      };

      setSelectedPointInfo(pointInfo);
      setLastSelectedPoint(pointInfo);
      setSoilData(scaledSoil);
      setWeatherInfo(weatherData);

    } catch (error) {
      console.error('Error fetching API data:', error);
      // Set default values on error
      setSoilData({ sand: 0, silt: 0, clay: 0, ph: 0 });
      setWeatherInfo(null);
    }
  };

  // Add saveData function
  const saveData = () => {
    try {
      const dataToSave = {
        points: selectedRegion,
        soil: soilData,
        weather: weatherInfo,
        timestamp: Date.now()
      };

      localStorage.setItem('mapAnalysisData', JSON.stringify(dataToSave));
      console.log('Data saved successfully:', {
        points: dataToSave.points,
        soil: dataToSave.soil,
        weather: dataToSave.weather,
        timestamp: new Date(dataToSave.timestamp).toLocaleString()
      });

      // Show success toast
      toast.success('Data saved successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

    } catch (error) {
      console.error('Error saving data:', error);
      // Show error toast
      toast.error('Failed to save data!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  return (
    <div className="maps-container">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="maps-header">
        <h2>
          <i className="fas fa-map-marker-alt"></i>
          Field Analysis Dashboard
        </h2>
        <div className="maps-actions">
          <button
            className={`tool-button ${showDrawTools ? 'active' : ''}`}
            onClick={() => setShowDrawTools(!showDrawTools)}
          >
            <i className="fas fa-draw-polygon"></i>
            Drawing Tools
          </button>
          <button
            className={`tool-button ${useGeoMap ? 'active' : ''}`}
            onClick={() => setUseGeoMap(!useGeoMap)}
          >
            <i className="fas fa-layer-group"></i>
            Terrain View
          </button>
          <button 
            className="tool-button save-btn"
            onClick={saveData}
          >
            <i className="fas fa-save"></i>
            Save Data
          </button>
        </div>
        <div className="point-count">
          <i className="fas fa-map-marker-alt"></i>
          {selectedRegion.length} Points
        </div>
      </div>

      <div className="maps-content">
        <div className="map-section">
          <MapContainer
            center={[21.7679, 78.8718]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url={useGeoMap 
                ? 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              }
            />
            {showGeoJSON && geoData && (
              <GeoJSON data={geoData} style={{ color: '#2c7a40', weight: 2 }} />
            )}
            {selectedRegion.map((point, index) => (
              <Marker 
                key={index} 
                position={point} 
                icon={lastSelectedPoint && lastSelectedPoint.location[0] === point[0] && lastSelectedPoint.location[1] === point[1] ? selectedIcon : customIcon}
                eventHandlers={{
                  click: () => handlePointSelect(point),
                  mouseover: (e) => {
                    e.target.openPopup();
                  },
                  mouseout: (e) => {
                    e.target.closePopup();
                  }
                }}
              >
                <Popup className="custom-popup">
                  <div className="point-popup">
                    <h3>Point {index + 1}</h3>
                    <p>Latitude: {point.lat.toFixed(6)}</p>
                    <p>Longitude: {point.lng.toFixed(6)}</p>
                    {lastSelectedPoint && lastSelectedPoint.location[0] === point[0] && lastSelectedPoint.location[1] === point[1] && (
                      <>
                        <div className="popup-section">
                          <h4><i className="fas fa-cloud-sun"></i> Weather</h4>
                          <p><i className="fas fa-thermometer-half"></i> Temperature: {lastSelectedPoint.weather?.temperature}°C</p>
                          <p><i className="fas fa-tint"></i> Humidity: {lastSelectedPoint.weather?.humidity}%</p>
                        </div>
                        <div className="popup-section">
                          <h4><i className="fas fa-leaf"></i> Soil</h4>
                          <p><i className="fas fa-mountain"></i> Sand: {lastSelectedPoint.soil?.sand}%</p>
                          <p><i className="fas fa-water"></i> Clay: {lastSelectedPoint.soil?.clay}%</p>
                          <p><i className="fas fa-flask"></i> pH: {lastSelectedPoint.soil?.ph}</p>
                        </div>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="info-panel">
          <div className="info-tabs">
            <button
              className={`tab-button ${activeTab === 'soil' ? 'active' : ''}`}
              onClick={() => setActiveTab('soil')}
            >
              <i className="fas fa-leaf"></i>
              Soil Analysis
            </button>
            <button
              className={`tab-button ${activeTab === 'weather' ? 'active' : ''}`}
              onClick={() => setActiveTab('weather')}
            >
              <i className="fas fa-cloud-sun"></i>
              Weather Info
            </button>
          </div>

          {isLoading ? (
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i>
              <span>Analyzing region...</span>
            </div>
          ) : (
            <div className="info-content">
              {activeTab === 'soil' && (
                <div className="info-card">
                  <h3>Soil Composition</h3>
                  <div className="soil-metrics">
                    <div className="metric">
                      <span className="metric-label">Sand</span>
                      <span className="metric-value">{soilData.sand ? `${soilData.sand}%` : 'No data'}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Silt</span>
                      <span className="metric-value">{soilData.silt ? `${soilData.silt}%` : 'No data'}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Clay</span>
                      <span className="metric-value">{soilData.clay ? `${soilData.clay}%` : 'No data'}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">pH Level</span>
                      <span className="metric-value">{soilData.ph ? soilData.ph.toFixed(1) : 'No data'}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'weather' && weatherInfo && (
                <div className="info-card">
                  <h3>Current Weather</h3>
                  <div className="weather-metrics">
                    <div className="metric">
                      <i className="fas fa-thermometer-half"></i>
                      <span className="metric-label">Temperature</span>
                      <span className="metric-value">{weatherInfo.temperature}°C</span>
                    </div>
                    <div className="metric">
                      <i className="fas fa-tint"></i>
                      <span className="metric-label">Humidity</span>
                      <span className="metric-value">{weatherInfo.humidity}%</span>
                    </div>
                    <div className="metric">
                      <i className="fas fa-wind"></i>
                      <span className="metric-label">Wind Speed</span>
                      <span className="metric-value">{weatherInfo.windSpeed} km/h</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedRegion.length > 0 && (
            <div className="selected-region">
              <h3>
                <i className="fas fa-map-marker-alt"></i>
                Selected Points ({selectedRegion.length})
              </h3>
              <div className="points-list">
                {selectedRegion.map((point, index) => (
                  <div 
                    key={index} 
                    className={`point-item ${lastSelectedPoint && lastSelectedPoint.location[0] === point[0] && lastSelectedPoint.location[1] === point[1] ? 'active' : ''}`}
                    onClick={() => handlePointSelect(point)}
                  >
                    <span>Point {index + 1}</span>
                    <span className="coordinates">
                      {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Maps;
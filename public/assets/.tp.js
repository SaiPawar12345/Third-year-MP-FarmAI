import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-draw';
import './Maps.css';

const customIcon = new L.Icon({
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Marker_icon.svg',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const WEATHER_API_KEY = '0e218b7bd9e2434db43163834241910';
const WEATHER_API_URL = 'https://api.weatherapi.com/v1/current.json';
const SOIL_API_URL = 'https://rest.isric.org/soilgrids/v2.0/properties/query';

const Maps = () => {
  const mapRef = useRef();
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState([]);
  const [showDrawTools, setShowDrawTools] = useState(false);
  const [showGeoJSON, setShowGeoJSON] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [useGeoMap, setUseGeoMap] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [soilData, setSoilData] = useState({ sand: null, silt: null, clay: null, ph: null });

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

  // Effect to save data whenever weather or soil information updates
  useEffect(() => {
    if (weatherInfo && soilData && selectedRegion.length > 0) {
      saveToLocalStorage();
    }
  }, [weatherInfo, soilData, selectedRegion]);

  // Save data to local storage
  const saveToLocalStorage = () => {
    const dataToStore = {
      polygonPoints: selectedRegion,
      weatherInfo,
      soilData,
      timestamp: new Date().toISOString(),
    };
    
    try {
      localStorage.setItem('mapData', JSON.stringify(dataToStore));
      console.log('Successfully stored data in localStorage:', {
        storedData: dataToStore,
        timestamp: new Date().toLocaleString(),
        dataSize: new Blob([JSON.stringify(dataToStore)]).size + ' bytes'
      });
    } catch (error) {
      console.error('Error storing data in localStorage:', {
        error: error.message,
        timestamp: new Date().toLocaleString()
      });
    }
  };

  // Load data from local storage
  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedData = localStorage.getItem('mapData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (parsedData.polygonPoints) setSelectedRegion(parsedData.polygonPoints);
          if (parsedData.weatherInfo) setWeatherInfo(parsedData.weatherInfo);
          if (parsedData.soilData) setSoilData(parsedData.soilData);
          console.log('Successfully loaded data from localStorage:', parsedData);
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      }
    };

    loadSavedData();
  }, []);

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
      } catch (error) {
        console.error('Error fetching weather data:', error);
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
          sand: soilInfoObject.sand || 0,
          silt: soilInfoObject.silt || 0,
          clay: soilInfoObject.clay || 0,
          ph: soilInfoObject.phh2o || 0,
        };

        setSoilData(updatedSoilData);
      } catch (error) {
        console.error('Error fetching soil data:', error);
      }
    }
  };

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

          // Fetch both weather and soil data
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

  const handleMapToggle = () => {
    setUseGeoMap((prev) => !prev);
  };

  const handleGeoJSONToggle = () => {
    setShowGeoJSON((prev) => !prev);
  };

  return (
    <div className="container bg-gradient-to-r from-green-500 via-green-400 to-green-600 flex">
      <div className="map-section">
        <h2 className="map-title">Map</h2>
        <div className="map-container">
          <MapContainer
            ref={mapRef}
            center={[19.7515, 75.7139]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            whenCreated={(mapInstance) => {
              mapRef.current = mapInstance;
            }}
          >
            <TileLayer
              url={
                useGeoMap
                  ? 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
                  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              }
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {selectedPoints.map((point, index) => (
              <Marker key={index} position={point} icon={customIcon} />
            ))}
            {showGeoJSON && geoData && <GeoJSON data={geoData} />}
          </MapContainer>
        </div>
      </div>
      <div className="info-section">
        <div className="button-container">
          <button
            className="toggle-draw-tools"
            onClick={() => {
              setShowDrawTools((prev) => !prev);
              handleGeoJSONToggle();
            }}
          >
            {showDrawTools ? 'Hide Drawing Tools' : 'Show Drawing Tools'}
          </button>
          <button className="enter-button" onClick={handleMapToggle}>
            {useGeoMap ? 'Switch to Default View' : 'Switch to Terrain View'}
          </button>
        </div>
        <div className="selection-region">
          <h3 className="text-header">Selection Region:</h3>
          {selectedRegion.length > 0 ? (
            selectedRegion.map((point, index) => (
              <div key={index} className="point-container">
                <p className="text-label">Point {index + 1}:</p>
                <input type="text" value={`${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`} readOnly className="text-box" />
              </div>
            ))
          ) : (
            <p className="text-label">No region selected</p>
          )}
        </div>
        {weatherInfo && (
          <div className="weather-info">
            <h3 className="text-header">Weather Information:</h3>
            <p>Temperature: {weatherInfo.temperature} °C</p>
            <p>Humidity: {weatherInfo.humidity} %</p>
            <p>Wind Speed: {weatherInfo.windSpeed} kph</p>
          </div>
        )}
        <div className="soil-quality-info">
          <h3 className="text-header">Soil Quality Information:</h3>
          <p>Sand: {soilData.sand/10 || 'No data'} %</p>
          <p>Silt: {soilData.silt/10 || 'No data'} %</p>
          <p>Clay: {soilData.clay/10 || 'No data'} %</p>
          <p>pH: {soilData.ph/10 || 'No data'}</p>
        </div>
      </div>
    </div>
  );
};

export default Maps;
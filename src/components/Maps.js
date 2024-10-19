import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-draw';
import './Maps.css'; // Import your custom CSS

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Marker_icon.svg',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const Maps = () => {
  const mapRef = useRef();
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [showDrawTools, setShowDrawTools] = useState(false); // State for toggling draw tools

  useEffect(() => {
    const map = mapRef.current;

    if (map) {
      // Initialize drawn items group
      const drawnItemsGroup = new L.FeatureGroup();
      map.addLayer(drawnItemsGroup);

      // Draw control will be initialized conditionally
      const drawControl = new L.Control.Draw({
        edit: {
          featureGroup: drawnItemsGroup,
        },
        draw: {
          polygon: true,
          rectangle: true,
          polyline: false,
          circle: true,
          marker: false,
        },
      });

      // Event listener for when a shape is created
      map.on(L.Draw.Event.CREATED, function (e) {
        const layer = e.layer;
        drawnItemsGroup.addLayer(layer);

        if (e.layerType === 'marker') {
          const latlng = layer.getLatLng();
          setSelectedPoints((prevPoints) => [...prevPoints, latlng]);
        }
      });

      // Add draw control to the map if showDrawTools is true
      if (showDrawTools) {
        map.addControl(drawControl);
      } else {
        map.removeControl(drawControl); // Remove draw control when not needed
      }

      return () => {
        map.removeLayer(drawnItemsGroup);
        map.removeControl(drawControl); // Ensure control is removed on unmount
      };
    }
  }, [showDrawTools]); // Run effect when showDrawTools changes

  return (
    <div className="container bg-gradient-to-r from-green-500 via-green-400 to-green-600">
      <div className="map-section">
        <h2 className="map-title">Map</h2>
        <div className="map-container">
          <MapContainer
            ref={mapRef}
            center={[19.7515, 75.7139]} // Maharashtra, India coordinates
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            whenCreated={(mapInstance) => {
              mapRef.current = mapInstance;
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {selectedPoints.map((point, index) => (
              <Marker key={index} position={point} icon={customIcon} />
            ))}
          </MapContainer>
        </div>
      </div>
      <div className="info-section bg-gradient-to-r from-green-300 to-teal-700">
        <button
          onClick={() => setShowDrawTools((prev) => !prev)} // Toggle drawing tools
          className="bg-gradient-to-r from-green-500 to-teal-500 p-6 rounded-2xl text-white shadow-2xl mb-4" // Moved button to the top
        >
          {showDrawTools ? 'Hide Drawing Tools' : 'Show Drawing Tools'}
        </button>
      </div>
    </div>
  );
};

export default Maps;

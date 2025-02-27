import React, { useState } from 'react';
import './Fertilisers.css'; 
import AgriChatbot from './AgriChatbot'; // Import the chatbot component

const Fertilisers = () => {
  const [plant, setPlant] = useState('');
  const [soilN, setSoilN] = useState('');
  const [soilP, setSoilP] = useState('');
  const [soilK, setSoilK] = useState('');
  const [landArea, setLandArea] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [fertiliserAmount, setFertiliserAmount] = useState('');
  const [error, setError] = useState('');
  const [plantImage, setPlantImage] = useState('');

  // Fertiliser recommendations and images based on plant type
  const fertiliserRecommendations = {
    tomatoes: {
      recommendation: 'High-phosphorus fertilizer, like 4-12-4, to support root growth and fruit development.',
      image: '/assets/tomato.jpg',
    },
    peas: {
      recommendation: 'Balanced NPK fertilizer, like 5-10-10, low in nitrogen to avoid excessive foliage growth.',
      image: '/assets/pea plant.jpg',
    },
    wheat: {
      recommendation: 'Nitrogen-heavy fertilizer, like 32-0-4, to promote strong stem and leaf development.',
      image: '/assets/wheat.jpg',
    },
    soybean: {
      recommendation: 'Moderate potassium and phosphorus fertilizer, like 2-4-4, to encourage pod formation.',
      image: '/assets/soyabean.jpg',
    },
    corn: {
      recommendation: 'High nitrogen fertilizer, like 16-16-8, for strong stalk growth and cob development.',
      image: '/assets/corn.jpg',
    },
  };

  // Handle input change with validation for 0-100 range
  const handleSoilChange = (e, setter) => {
    const value = Math.min(100, Math.max(0, parseInt(e.target.value, 10)));
    setter(isNaN(value) ? '' : value);
  };

  const handlePlantChange = (e) => {
    setPlant(e.target.value);
    setRecommendation('');
    setFertiliserAmount('');
    setPlantImage('');
    setError('');
  };

  // Generate recommendation based on plant and soil inputs
  const handleRecommendation = () => {
    if (!plant) {
      setError('Please select a plant type.');
      return;
    }

    if (soilN === '' || soilP === '' || soilK === '') {
      setError('Please enter values for all soil contents.');
      return;
    }

    if (soilN < 0 || soilN > 100 || soilP < 0 || soilP > 100 || soilK < 0 || soilK > 100) {
      setError('Soil content values must be between 0 and 100.');
      return;
    }

    if (landArea === '' || landArea <= 0) {
      setError('Please enter a valid land area.');
      return;
    }

    setError('');
    const { recommendation: plantRecommendation, image } = fertiliserRecommendations[plant] || {};
    setRecommendation(plantRecommendation || 'No recommendation available.');

    // Calculate the amount of fertiliser needed based on land area (example: 100 kg per acre)
    const fertiliserPerAcre = 100; // Define how much fertiliser is needed per acre
    const amountNeeded = landArea * fertiliserPerAcre;
    setFertiliserAmount(amountNeeded.toFixed(2));

    // Set the plant image URL
    setPlantImage(image);
  };

  return (
    <div className="fertiliser-container">      
      {/* Left Section: Inputs */}
      <div className="left-section">
        <h2 className="section-title">Input Parameters</h2>

        <div className="input-group">
          <label className="input-label">Select Plant Type:</label>
          <select
            value={plant}
            onChange={handlePlantChange}
            className="select"
          >
            <option value="">Choose Plant</option>
            <option value="tomatoes">Tomatoes</option>
            <option value="peas">Peas</option>
            <option value="wheat">Wheat</option>
            <option value="soybean">Soybean</option>
            <option value="corn">Corn</option>
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Soil Nitrogen (%)</label>
          <input
            type="number"
            value={soilN}
            onChange={(e) => handleSoilChange(e, setSoilN)}
            className="input"
            placeholder="0-100"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Soil Phosphorus (%)</label>
          <input
            type="number"
            value={soilP}
            onChange={(e) => handleSoilChange(e, setSoilP)}
            className="input"
            placeholder="0-100"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Soil Potassium (%)</label>
          <input
            type="number"
            value={soilK}
            onChange={(e) => handleSoilChange(e, setSoilK)}
            className="input"
            placeholder="0-100"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Land Area (acres)</label>
          <input
            type="number"
            value={landArea}
            onChange={(e) => setLandArea(e.target.value)}
            className="input"
            placeholder="Enter land area in acres"
            min="1"
          />
        </div>

        <button
          onClick={handleRecommendation}
          className="recommend-button"
        >
          Recommend Fertiliser
        </button>

        {error && <p className="error-message">{error}</p>}
      </div>

      {/* Right Section: Output */}
      <div className="right-section">
        <h2 className="section-title">Recommended Fertiliser</h2>
        {recommendation ? (
          <div className="recommendation-box">
            <h3 className="plant-title">{plant.toUpperCase()}</h3>
            <p className="recommendation-text">{recommendation}</p>
            <p className="fertiliser-amount">Amount of Fertiliser Needed: <span>{fertiliserAmount} kg</span></p>
            {plantImage && (
              <div className="plant-image-container">
                <img src={plantImage} alt={`${plant} plant`} className="plant-image" />
              </div>
            )}
          </div>
        ) : (
          <p className="placeholder-text">Please input parameters and click "Recommend Fertiliser".</p>
        )}
      </div>
      
      {/* Add the AgriChatbot component */}
      <AgriChatbot />
    </div>
  );
};

export default Fertilisers;
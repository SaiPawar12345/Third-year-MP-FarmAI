import React, { useState } from 'react';

const Fertilisers = () => {
  const [plant, setPlant] = useState('');
  const [soilN, setSoilN] = useState('');
  const [soilP, setSoilP] = useState('');
  const [soilK, setSoilK] = useState('');
  const [landArea, setLandArea] = useState(''); // New state for land area
  const [recommendation, setRecommendation] = useState('');
  const [fertiliserAmount, setFertiliserAmount] = useState(''); // New state for fertiliser amount
  const [error, setError] = useState('');

  // Fertiliser recommendations and images based on plant type
  const fertiliserRecommendations = {
    tomatoes: {
      recommendation: 'High-phosphorus fertilizer, like 4-12-4, to support root growth and fruit development.',
      image: 'public\assets\tomato.jpg.jpg', // Update with the correct image path
    },
    peas: {
      recommendation: 'Balanced NPK fertilizer, like 5-10-10, low in nitrogen to avoid excessive foliage growth.',
      image: 'public\assets\pea plant.jpg.jpg', // Update with the correct image path
    },
    wheat: {
      recommendation: 'Nitrogen-heavy fertilizer, like 32-0-4, to promote strong stem and leaf development.',
      image: 'public\assets\wheat.jpgt.jpg', // Update with the correct image path
    },
    soybean: {
      recommendation: 'Moderate potassium and phosphorus fertilizer, like 2-4-4, to encourage pod formation.',
      image: 'public\assets\soyabean.jpg', // Update with the correct image path
    },
    corn: {
      recommendation: 'High nitrogen fertilizer, like 16-16-8, for strong stalk growth and cob development.',
      image: 'public\assets\corn.jpg.jpg', // Update with the correct image path
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
    setFertiliserAmount(''); // Reset fertiliser amount
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
    setFertiliserAmount(amountNeeded.toFixed(2)); // Set fertiliser amount

    // Set the plant image URL
    setPlantImage(image);
  };

  const [plantImage, setPlantImage] = useState(''); // New state for plant image

  return (
    <div className="flex">
      {/* Left Section: Inputs */}
      <div className="w-1/2 p-4 bg-green-100">
        <h2 className="text-xl font-bold mb-4">Input Parameters</h2>

        <label className="block mb-2">Select Plant Type:</label>
        <select
          value={plant}
          onChange={handlePlantChange}
          className="w-full mb-4 p-2 border"
        >
          <option value="">Choose Plant</option>
          <option value="tomatoes">Tomatoes</option>
          <option value="peas">Peas</option>
          <option value="wheat">Wheat</option>
          <option value="soybean">Soybean</option>
          <option value="corn">Corn</option>
        </select>

        <label className="block mb-2">Soil Nitrogen (%)</label>
        <input
          type="number"
          value={soilN}
          onChange={(e) => handleSoilChange(e, setSoilN)}
          className="w-full mb-4 p-2 border"
          placeholder="0-100"
        />

        <label className="block mb-2">Soil Phosphorus (%)</label>
        <input
          type="number"
          value={soilP}
          onChange={(e) => handleSoilChange(e, setSoilP)}
          className="w-full mb-4 p-2 border"
          placeholder="0-100"
        />

        <label className="block mb-2">Soil Potassium (%)</label>
        <input
          type="number"
          value={soilK}
          onChange={(e) => handleSoilChange(e, setSoilK)}
          className="w-full mb-4 p-2 border"
          placeholder="0-100"
        />

        <label className="block mb-2">Land Area (acres)</label>
        <input
          type="number"
          value={landArea}
          onChange={(e) => setLandArea(e.target.value)}
          className="w-full mb-4 p-2 border"
          placeholder="Enter land area in acres"
          min="1"
        />

        <button
          onClick={handleRecommendation}
          className="w-full mt-4 p-2 bg-blue-500 text-white font-semibold"
        >
          Recommend Fertiliser
        </button>

        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {/* Right Section: Output */}
      <div className="w-1/2 p-4 bg-green-200">
        <h2 className="text-xl font-bold mb-4">Recommended Fertiliser</h2>
        {recommendation ? (
          <div className="p-4 bg-white border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{plant.toUpperCase()}</h3>
            <p>{recommendation}</p>
            <p className="mt-2 font-semibold">Amount of Fertiliser Needed (kg): {fertiliserAmount}</p>
            {plantImage && (
              <img src={plantImage} alt={`${plant} plant`} className="mt-4 w-full h-auto" />
            )}
          </div>
        ) : (
          <p className="text-gray-600">Please input parameters and click "Recommend Fertiliser".</p>
        )}
      </div>
    </div>
  );
};

export default Fertilisers;

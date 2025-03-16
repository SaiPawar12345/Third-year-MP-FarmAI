import React, { useState, useEffect } from 'react';
import './Fertilisers.css'; 
import AgriChatbot from './AgriChatbot';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Function to calculate polygon area using coordinates
const calculatePolygonArea = (coordinates) => {
  if (!coordinates || coordinates.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    area += coordinates[i].lng * coordinates[j].lat;
    area -= coordinates[j].lng * coordinates[i].lat;
  }
  area = Math.abs(area) * 111.32 * 111.32 * Math.cos(coordinates[0].lat * Math.PI / 180) / 2;
  // Convert square kilometers to acres
  return area * 247.105;
};

// Initialize Gemini API with direct API key
const GEMINI_API_KEY = 'AIzaSyCtM75vJXvJFJNx2R3-cZlCw6GrTbAjNIY';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Function to get region based on coordinates
const getRegion = (coordinates) => {
  if (!coordinates || coordinates.length === 0) return null;
  
  // Calculate center point of the field
  const centerLat = coordinates.reduce((sum, point) => sum + point.lat, 0) / coordinates.length;
  const centerLng = coordinates.reduce((sum, point) => sum + point.lng, 0) / coordinates.length;
  
  // Indian states rough boundaries (simplified)
  if (centerLat >= 18 && centerLat <= 26 && centerLng >= 72 && centerLng <= 78) return "Maharashtra";
  if (centerLat >= 20 && centerLat <= 26 && centerLng >= 76 && centerLng <= 82) return "Madhya Pradesh";
  // Add more states as needed
  return "India"; // Default
};

// Common fertilizer brands by region
const getFertilizerBrands = (region) => {
  const brands = {
    "Maharashtra": {
      "NPK": ["Suphala by RCF", "Sampurna by IFFCO", "Ujjwala by NFL"],
      "Urea": ["IFFCO Urea Gold", "Sagar Urea", "Krishak Bharati Urea"],
      "Organic": ["Dharti Amrit", "Bio-Gold Organic", "Kisan Organic"]
    },
    "Madhya Pradesh": {
      "NPK": ["Mangala by IFFCO", "Navratna by NFL", "MPK Special"],
      "Urea": ["MP Agro Urea", "Chambal Urea", "Kisan Urea Gold"],
      "Organic": ["MP Organic Gold", "Krishi Utpad", "Green MP"]
    },
    "India": {
      "NPK": ["IFFCO NPK", "NFL Kisan", "RCF Suphala"],
      "Urea": ["IFFCO Urea", "NFL Urea", "Kisan Urea"],
      "Organic": ["Organic India", "Bio-Fertilizer Plus", "Green Gold"]
    }
  };
  return brands[region] || brands["India"];
};

// Function to get AI recommendation
const getAIRecommendation = async (soilN, soilP, soilK, plant, polygonCoordinates) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const area = calculatePolygonArea(polygonCoordinates).toFixed(2);
    const region = getRegion(polygonCoordinates);

    const prompt = `Provide a detailed permaculture recommendation for:
Crop: ${plant}
Current Soil: N=${soilN}%, P=${soilP}%, K=${soilK}%
Area: ${area} acres
Region: ${region}

Give exactly 7 lines of permaculture recommendations:
1. Companion plants that work well with ${plant}
2. Natural soil enrichment methods (cover crops, mulching, etc.)
3. Beneficial insects and animals to encourage
4. Water management techniques (swales, rainwater harvesting)
5. Natural pest control methods
6. Sustainable planting pattern and spacing
7. Expected yield and ecosystem benefits

Keep each line under 20 words. No special formatting or symbols.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to get permaculture recommendation. Please try again.');
  }
};

// Permaculture recommendations and images based on plant type
const permacultureRecommendations = {
  tomatoes: {
    recommendation: 'Companion planting with basil and marigolds. Use mulch and encourage beneficial insects.',
    image: '/assets/tomato.jpg',
  },
  peas: {
    recommendation: 'Plant with carrots and radishes. Natural nitrogen fixation. Support beneficial soil microbes.',
    image: '/assets/pea plant.jpg',
  },
  wheat: {
    recommendation: 'Integrate with clover. Practice crop rotation. Support native pollinators.',
    image: '/assets/wheat.jpg',
  },
  soybean: {
    recommendation: 'Companion plant with corn and squash. Traditional Three Sisters method.',
    image: '/assets/soyabean.jpg',
  },
  corn: {
    recommendation: 'Plant with beans and squash. Use cover crops. Support native bird species.',
    image: '/assets/corn.jpg',
  },
};

const Fertilisers = () => {
  const [plant, setPlant] = useState('');
  const [soilN, setSoilN] = useState('');
  const [soilP, setSoilP] = useState('');
  const [soilK, setSoilK] = useState('');
  const [error, setError] = useState('');
  const [plantImage, setPlantImage] = useState('');
  const [polygonCoordinates, setPolygonCoordinates] = useState([]);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load polygon coordinates from localStorage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('mapAnalysisData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.points && parsedData.points.length > 0) {
          setPolygonCoordinates(parsedData.points);
        }
      }
    } catch (error) {
      console.error('Error loading polygon data:', error);
    }
  }, []);

  // Handle input change with validation for 0-100 range
  const handleSoilChange = (e, setter) => {
    const value = Math.min(100, Math.max(0, parseInt(e.target.value, 10)));
    setter(isNaN(value) ? '' : value);
  };

  const handlePlantChange = (e) => {
    setPlant(e.target.value);
    setError('');
    setAiRecommendation('');
  };

  // Modified handleRecommendation function
  const handleRecommendation = async () => {
    try {
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

      if (!polygonCoordinates || polygonCoordinates.length < 3) {
        setError('Please select a valid field area on the map first.');
        return;
      }

      setError('');
      setIsLoading(true);

      // Set plant image
      const plantInfo = permacultureRecommendations[plant] || {};
      setPlantImage(plantInfo.image);

      // Get AI recommendation
      try {
        const aiResponse = await getAIRecommendation(
          soilN,
          soilP,
          soilK,
          plant,
          polygonCoordinates
        );
        setAiRecommendation(aiResponse);
      } catch (error) {
        console.error('AI Recommendation Error:', error);
        setError(error.message);
      }
    } catch (error) {
      console.error('Recommendation Error:', error);
      setError('An error occurred while generating recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fertiliser-container">      
      {/* Left Section: Inputs */}
      <div className="left-section">
        <h2 className="section-title">Permaculture Planning</h2>

        <div className="input-group">
          <label className="input-label">Select Main Crop:</label>
          <select
            value={plant}
            onChange={handlePlantChange}
            className="select"
          >
            <option value="">Choose Main Crop</option>
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

        {polygonCoordinates.length > 0 && (
          <div className="area-display">
            <label className="input-label">Field Area:</label>
            <span className="area-value">{calculatePolygonArea(polygonCoordinates).toFixed(2)} acres</span>
          </div>
        )}

        <button
          onClick={handleRecommendation}
          className="recommend-button"
        >
          Get Permaculture Plan
        </button>

        {error && <p className="error-message">{error}</p>}
      </div>

      {/* Right Section: Output */}
      <div className="right-section">
        <h2 className="section-title">Permaculture Recommendation</h2>
        {isLoading ? (
          <div className="loading-indicator">
            <p>Analyzing ecosystem data and creating sustainable permaculture recommendations...</p>
          </div>
        ) : aiRecommendation ? (
          <div className="recommendation-box">
            <h3 className="plant-title">{plant.toUpperCase()} ECOSYSTEM</h3>
            <div className="recommendations">
              <div className="ai-recommendation">
                <h4>Permaculture Design Analysis</h4>
                <div className="location-info">
                  <p>Region: {getRegion(polygonCoordinates)}</p>
                  <p>Area: {calculatePolygonArea(polygonCoordinates).toFixed(2)} acres</p>
                </div>
                <div className="ai-content">
                  {aiRecommendation.split('\n').map((line, index) => (
                    <p key={index} className="recommendation-detail">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            
            {plantImage && (
              <div className="plant-image-container">
                <img src={plantImage} alt={`${plant} in permaculture setting`} className="plant-image" />
              </div>
            )}
          </div>
        ) : (
          <p className="placeholder-text">Please input parameters and click "Get Permaculture Plan".</p>
        )}
      </div>
      
      {/* Add the AgriChatbot component */}
      <AgriChatbot />
    </div>
  );
};

export default Fertilisers;
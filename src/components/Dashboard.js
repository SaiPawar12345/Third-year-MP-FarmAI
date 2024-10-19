import React, { useState } from 'react';
import Maps from './Maps';
import Simulation from './Simulation';
import Data from './Data';
import SamplePages from './SamplePages';
import Apps from './Apps';

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard'); // Set default to dashboard

  // Array of random facts for each category
  const farmingFacts = [
    "Crop diversification can increase yield stability and reduce risk.",
    "Adopting organic farming can improve soil health and reduce input costs.",
    "Switching to high-value crops like fruits and vegetables can increase profits.",
    "Utilizing weather forecasting apps can help optimize sowing and harvesting times.",
    "Direct-to-consumer sales can increase profit margins.",
    "Practicing crop rotation improves soil fertility and reduces pest issues.",
    "Implementing Integrated Pest Management (IPM) reduces pesticide use and costs.",
    "Accessing government subsidies for seeds and equipment can lower production costs.",
    "Using certified seeds can improve crop yields and quality.",
    "Joining farmer cooperatives can give access to better market prices and shared resources."
  ];

  const irrigationFacts = [
    "Drip irrigation can save up to 50% of water and increase crop yields.",
    "Rainwater harvesting can provide a reliable source of water during dry spells.",
    "Scheduling irrigation during early morning or late evening reduces water evaporation.",
    "Mulching helps retain soil moisture, reducing the need for frequent irrigation.",
    "Installing soil moisture sensors can optimize water usage and prevent over-irrigation.",
    "Switching to micro-irrigation systems can save water and reduce labor costs.",
    "Government schemes like PMKSY offer subsidies for efficient irrigation systems.",
    "Proper canal maintenance can prevent water leakage and improve irrigation efficiency.",
    "Using treated wastewater for irrigation is a sustainable water source for farming.",
    "Laser land leveling can improve water distribution and reduce runoff."
  ];

  const fertilizerFacts = [
    "Balanced fertilizer use improves soil health and prevents nutrient depletion.",
    "Organic fertilizers reduce long-term soil degradation and improve water retention.",
    "Soil testing before fertilization ensures efficient nutrient application and reduces waste.",
    "Using biofertilizers can reduce dependence on chemical inputs and lower costs.",
    "Slow-release fertilizers can reduce the frequency of application and prevent nutrient loss.",
    "Government-subsidized fertilizers like urea can significantly reduce input costs.",
    "Applying fertilizers based on crop needs can maximize yields and minimize waste.",
    "Intercropping with leguminous plants increases nitrogen content in the soil naturally.",
    "Integrated nutrient management combines organic and inorganic inputs for balanced growth.",
    "Using vermicompost boosts soil organic matter and enhances soil structure."
  ];

  const polytunnelFacts = [
    "Polytunnels extend growing seasons, allowing for multiple crop cycles.",
    "They provide protection from unpredictable monsoon rains and reduce crop damage.",
    "Polytunnels help control temperature, enabling year-round cultivation of high-value crops.",
    "They reduce pest and disease pressure, lowering the need for chemical pesticides.",
    "Installing low-cost polytunnels improves crop yield in small farms.",
    "Polytunnels help conserve water by reducing evaporation, benefiting crops in dry areas.",
    "Polytunnel farming increases productivity of high-value crops like strawberries and flowers.",
    "Farmers can receive government subsidies for setting up polytunnels under horticulture schemes.",
    "Using drip irrigation inside polytunnels maximizes water efficiency and reduces costs.",
    "Polytunnels enhance the quality of produce, making it more attractive for premium markets."
  ];

  const permacultureFacts = [
    "Permaculture increases soil fertility through natural methods like composting and mulching.",
    "Integrating livestock into farms provides natural fertilizer and reduces input costs.",
    "Companion planting reduces pest attacks, eliminating the need for chemical pesticides.",
    "Rainwater harvesting techniques ensure a steady water supply for crops year-round.",
    "Agroforestry improves biodiversity and provides additional income through timber and fruits.",
    "Permaculture requires fewer chemical inputs, reducing long-term farming costs.",
    "Swales and other water retention techniques increase groundwater recharge.",
    "Permaculture principles help build resilient systems that withstand climate variability.",
    "Using natural pest control methods like intercropping reduces reliance on chemical pesticides.",
    "Diversifying crops through permaculture reduces the risk of crop failure and stabilizes income."
  ];

  // Helper function to get a random fact from an array
  const getRandomFact = (factsArray) => {
    return factsArray[Math.floor(Math.random() * factsArray.length)];
  };

  // Handlers to set the active section
  const handleSectionClick = (section) => {
    setActiveSection(section); // Set active section to the clicked one
  };

  return (
    <div>
      {/* Header with gradient */}
      <header className=" p-4 flex justify-between items-center shadow-lg">
        <div className="text-green-800 text-2xl font-bold">FARM AI SIMULATOR</div>
      </header>

      {/* Navigation bar with gradient */}
      <nav className="bg-gradient-to-r from-green-500 via-green-400 to-green-600 p-2 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-12">
          <button onClick={() => handleSectionClick('dashboard')} className={`text-white flex items-center px-4 py-2 rounded shadow-md transition-colors duration-200 ${activeSection === 'dashboard' ? 'bg-gradient-to-r from-green-700 to-green-800 shadow-lg' : 'hover:bg-gradient-to-r from-green-600 to-green-700'} ${activeSection === 'dashboard' && 'font-bold'}`}><i className="fas fa-home mr-2"></i>Dashboard</button>
          <button onClick={() => handleSectionClick('maps')} className={`text-white flex items-center px-4 py-2 rounded shadow-md transition-colors duration-200 ${activeSection === 'maps' ? 'bg-gradient-to-r from-green-700 to-green-800 shadow-lg' : 'hover:bg-gradient-to-r from-green-600 to-green-700'} ${activeSection === 'maps' && 'font-bold'}`}><i className="fas fa-cube mr-2"></i>Maps</button>
          <button onClick={() => handleSectionClick('simulation')} className={`text-white flex items-center px-4 py-2 rounded shadow-md transition-colors duration-200 ${activeSection === 'simulation' ? 'bg-gradient-to-r from-green-700 to-green-800 shadow-lg' : 'hover:bg-gradient-to-r from-green-600 to-green-700'} ${activeSection === 'simulation' && 'font-bold'}`}><i className="fas fa-file-alt mr-2"></i>Simulation</button>
          <button onClick={() => handleSectionClick('data')} className={`text-white flex items-center px-4 py-2 rounded shadow-md transition-colors duration-200 ${activeSection === 'data' ? 'bg-gradient-to-r from-green-700 to-green-800 shadow-lg' : 'hover:bg-gradient-to-r from-green-600 to-green-700'} ${activeSection === 'data' && 'font-bold'}`}><i className="fas fa-chart-bar mr-2"></i>Data</button>
          <button onClick={() => handleSectionClick('samplePages')} className={`text-white flex items-center px-4 py-2 rounded shadow-md transition-colors duration-200 ${activeSection === 'samplePages' ? 'bg-gradient-to-r from-green-700 to-green-800 shadow-lg' : 'hover:bg-gradient-to-r from-green-600 to-green-700'} ${activeSection === 'samplePages' && 'font-bold'}`}><i className="fas fa-copy mr-2"></i>Sample Pages</button>
          <button onClick={() => handleSectionClick('apps')} className={`text-white flex items-center px-4 py-2 rounded shadow-md transition-colors duration-200 ${activeSection === 'apps' ? 'bg-gradient-to-r from-green-700 to-green-800 shadow-lg' : 'hover:bg-gradient-to-r from-green-600 to-green-700'} ${activeSection === 'apps' && 'font-bold'}`}><i className="fas fa-th mr-2"></i>Apps</button>
        </div>
      </nav>

      {/* Conditional rendering for each section */}
      <main className="p-4">
        {activeSection === 'dashboard' && (
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              {/* Main Content */}
              <div className="grid grid-cols-3 gap-12 mb-20">
                <div className="bg-gradient-to-r from-pink-500 to-red-500 p-16 rounded-2xl text-white shadow-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl">Farming Fact</span>
                    <i className="fas fa-chart-line text-6xl"></i>
                  </div>
                  <div className="text-3xl mt-6">{getRandomFact(farmingFacts)}</div>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-16 rounded-2xl text-white shadow-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl">Irrigation Fact</span>
                    <i className="fas fa-bookmark text-6xl"></i>
                  </div>
                  <div className="text-3xl mt-6">{getRandomFact(irrigationFacts)}</div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-teal-500 p-16 rounded-2xl text-white shadow-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl">Fertilizer Fact</span>
                    <i className="fas fa-map-marker-alt text-6xl"></i>
                  </div>
                  <div className="text-3xl mt-6">{getRandomFact(fertilizerFacts)}</div>
                </div>
                {/* New Container with random fact */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-700 p-16 rounded-2xl text-white shadow-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl">Polytunnel Fact</span>
                    <i className="fas fa-star text-6xl"></i>
                  </div>
                  <div className="text-3xl mt-6">{getRandomFact(polytunnelFacts)}</div>
                </div>
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-700 p-16 rounded-2xl text-white shadow-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl">Permaculture Fact</span>
                    <i className="fas fa-star text-6xl"></i>
                  </div>
                  <div className="text-3xl mt-6">{getRandomFact(permacultureFacts)}</div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-700 p-16 rounded-2xl text-white shadow-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl">Bonus Fact</span>
                    <i className="fas fa-star text-6xl"></i>
                  </div>
                  <div className="text-3xl mt-6">{getRandomFact(farmingFacts)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeSection === 'maps' && <Maps />}
        {activeSection === 'simulation' && <Simulation />}
        {activeSection === 'data' && <Data />}
        {activeSection === 'samplePages' && <SamplePages />}
        {activeSection === 'apps' && <Apps />}
      </main>
    </div>
  );
};

export default Dashboard;

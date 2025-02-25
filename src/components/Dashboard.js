import React, { useState, useEffect } from 'react';
import Maps from './Maps';
import Simulation from './Simulation';
import Data from './Data';
import SamplePages from './SamplePages';
import Apps from './Apps';

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const weatherImpactFacts = [
    "Understanding weather patterns helps optimize planting schedules.",
    "Climate-smart farming practices increase resilience to weather changes.",
    "Weather monitoring systems help protect crops from extreme conditions."
  ];

  // Helper function to get a random fact from an array
  const getRandomFact = (factsArray) => {
    return factsArray[Math.floor(Math.random() * factsArray.length)];
  };

  // Handlers to set the active section
  const handleSectionClick = (section) => {
    setActiveSection(section);
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Parallax Effect */}
      <div 
        className="fixed inset-0 w-full h-full z-0"
        style={{
          backgroundImage: 'url("https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          filter: 'brightness(0.9)',
        }}
      />

      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-40 z-0" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-green-800 bg-opacity-90 p-4 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="text-white text-2xl font-bold tracking-tight animate-fade-in">FARM AI SIMULATOR</div>
          </div>
        </header>

        {/* Navigation bar */}
        <nav className="bg-green-900 bg-opacity-90 p-3 shadow-lg backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex items-center space-x-8 overflow-x-auto">
            {[
              { name: 'dashboard', icon: 'home', label: 'Dashboard' },
              { name: 'maps', icon: 'map', label: 'Maps' },
              { name: 'simulation', icon: 'chart-line', label: 'Simulation' },
              { name: 'data', icon: 'database', label: 'Data' },
              { name: 'samplePages', icon: 'leaf', label: 'Fertilizers' },
              { name: 'apps', icon: 'th', label: 'Apps' }
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => handleSectionClick(item.name)}
                className={`text-white flex items-center px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                  activeSection === item.name
                    ? 'bg-green-700 shadow-inner scale-105'
                    : 'hover:bg-green-700/50'
                }`}
              >
                <i className={`fas fa-${item.icon} mr-2`}></i>
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto p-6">
          {activeSection === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Farming Fact', icon: 'seedling', facts: farmingFacts },
                { title: 'Irrigation Fact', icon: 'tint', facts: irrigationFacts },
                { title: 'Fertilizer Fact', icon: 'flask', facts: fertilizerFacts },
                { title: 'Polytunnel Fact', icon: 'greenhouse', facts: polytunnelFacts },
                { title: 'Permaculture Fact', icon: 'leaf', facts: permacultureFacts },
                { title: 'Weather Impact', icon: 'cloud-sun', facts: weatherImpactFacts }
              ].map((card, index) => (
                <div
                  key={card.title}
                  className="transform hover:scale-105 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="bg-white bg-opacity-90 rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300 backdrop-blur-sm">
                    <div className="bg-green-800 p-4 flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                      <i className={`fas fa-${card.icon} text-3xl text-green-100`}></i>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-800 text-lg leading-relaxed">{getRandomFact(card.facts)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {activeSection === 'maps' && <Maps />}
          {activeSection === 'simulation' && <Simulation />}
          {activeSection === 'data' && <Data />}
          {activeSection === 'samplePages' && <SamplePages />}
          {activeSection === 'apps' && <Apps />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

import React from 'react';
import { Link } from 'react-router-dom';
import './StartPage.css'; // Ensure styles are imported

const StartPage = () => {
  return (
    <div>
      <header className="header">
        <h1>Farm AI Simulator</h1>
        <div>
          <Link to="/signup" className="btn">Sign Up</Link>
          <Link to="/login" className="btn">Log In</Link>
        </div>
      </header>
      <div className="start-page">
        <div className="text-container">
          <div className="text-box">
            <h2>Manage Your Farm</h2>
            <p>Manage your farm's crop layout and sprinklers with our 3D simulation tool!</p>
          </div>
          <div className="text-box">
            <h2>Optimize Your Productivity</h2>
            <p>Explore advanced features such as crop rotation, irrigation management, and weather forecasting to optimize your farm's productivity.</p>
          </div>
          <div className="text-box">
            <h2>Fertilizer Recommendations</h2>
            <p>Get personalized fertilizer recommendations based on your crop type and soil health.</p>
          </div>
          <div className="text-box">
            <h2>Permaculture Farming</h2>
            <p>Learn about permaculture practices that enhance sustainability and biodiversity on your farm.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartPage;
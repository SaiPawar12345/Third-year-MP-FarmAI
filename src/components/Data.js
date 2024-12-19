import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';

// Registering the necessary components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Data = ({ selectedRegion, weatherInfo, soilData }) => {
    // Dummy data for testing
    const dummyWeatherInfo = {
        temperature: 25, // Dummy temperature in °C
        humidity: 60,    // Dummy humidity in %
    };

    const dummySoilData = {
        sand: 40, // Dummy sand content in percentage
        silt: 30,  // Dummy silt content in percentage
        clay: 30,  // Dummy clay content in percentage
    };

    // Dummy area data
    const dummyArea = 5.67; // Dummy area in degrees²

    // Using dummy data if no data is provided
    weatherInfo = weatherInfo || dummyWeatherInfo;
    soilData = soilData || dummySoilData;

    // Calculate area of the selected region (assuming the points are in lat/lng)
    const calculateArea = (points) => {
        if (!points || points.length < 3) return 0; // Check for undefined or insufficient points
        let area = 0;

        // Area calculation using the Shoelace formula
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length; // Wrap around
            area += points[i].lng * points[j].lat;
            area -= points[j].lng * points[i].lat;
        }
        return Math.abs(area / 2);
    };

    const area = selectedRegion ? calculateArea(selectedRegion).toFixed(2) : dummyArea.toFixed(2); // in degrees² for simplicity

    // Prepare data for temperature and humidity bar chart
    const weatherData = {
        labels: ['Temperature (°C)', 'Humidity (%)'],
        datasets: [
            {
                label: 'Weather Information',
                data: [weatherInfo.temperature, weatherInfo.humidity],
                backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
            },
        ],
    };

    // Prepare data for soil information pie chart
    const soilDataPie = {
        labels: ['Sand', 'Silt', 'Clay'],
        datasets: [
            {
                data: [soilData.sand, soilData.silt, soilData.clay],
                backgroundColor: [
                    'rgba(255, 205, 86, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                ],
            },
        ],
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Data</h2>
            <div className="bg-gray-200 p-4 mb-4 rounded">
                <h3 className="font-bold">Selected Area:</h3>
                <p>{area} degrees²</p>
            </div>
            <div className="mb-4">
                <h3 className="font-bold">Weather Information:</h3>
                <Bar data={weatherData} options={{ responsive: true }} />
            </div>
            <div className="mb-4">
                <h3 className="font-bold">Soil Quality Information:</h3>
                <div style={{ width: '200px', height: '200px' }}> {/* Adjust the size of the pie chart */}
                    <Pie data={soilDataPie} options={{ responsive: true }} />
                </div>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded mt-4">View Data</button>
        </div>
    );
};

export default Data;

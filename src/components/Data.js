import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar,
    PieChart, Pie, Cell,
    LineChart, Line,
    AreaChart, Area,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts';

const Data = () => {
    const [analysisData, setAnalysisData] = useState(null);
    const [soilQualityScore, setSoilQualityScore] = useState(0);
    const [farmingConditions, setFarmingConditions] = useState('');

    useEffect(() => {
        try {
            const savedData = localStorage.getItem('mapAnalysisData');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                setAnalysisData(parsedData);
                calculateSoilQualityScore(parsedData.soil);
                assessFarmingConditions(parsedData);
            }
        } catch (error) {
            console.error('Error loading analysis data:', error);
        }
    }, []);

    // Calculate area in different units
    const calculateArea = (points) => {
        if (!points || points.length < 3) return { acres: 0, hectares: 0, squareMeters: 0 };

        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i].lng * points[j].lat;
            area -= points[j].lng * points[i].lat;
        }
        const squareMeters = Math.abs(area) * 111319.9 * 111319.9 * Math.cos(points[0].lat * Math.PI / 180) / 2;
        return {
            squareMeters: squareMeters,
            hectares: squareMeters / 10000,
            acres: squareMeters / 4046.86
        };
    };

    // Calculate soil quality score
    const calculateSoilQualityScore = (soil) => {
        if (!soil) return;
        
        // Ideal ranges
        const idealRanges = {
            sand: { min: 20, max: 40 },
            silt: { min: 40, max: 60 },
            clay: { min: 20, max: 40 },
            ph: { min: 6.0, max: 7.5 }
        };

        // Calculate score based on how close values are to ideal ranges
        let score = 0;
        Object.keys(idealRanges).forEach(key => {
            if (soil[key]) {
                const range = idealRanges[key];
                const value = soil[key];
                if (value >= range.min && value <= range.max) {
                    score += 25;
                } else {
                    const distanceFromIdeal = Math.min(
                        Math.abs(value - range.min),
                        Math.abs(value - range.max)
                    );
                    score += Math.max(0, 25 - (distanceFromIdeal * 2));
                }
            }
        });

        setSoilQualityScore(Math.round(score));
    };

    // Assess farming conditions
    const assessFarmingConditions = (data) => {
        if (!data.weather || !data.soil) return;

        const conditions = [];
        
        // Temperature assessment
        if (data.weather.temperature < 15) conditions.push('Cold conditions - protect crops from frost');
        else if (data.weather.temperature > 35) conditions.push('Hot conditions - ensure adequate irrigation');
        else conditions.push('Optimal temperature for most crops');

        // Humidity assessment
        if (data.weather.humidity < 30) conditions.push('Low humidity - monitor water needs');
        else if (data.weather.humidity > 70) conditions.push('High humidity - watch for fungal diseases');
        else conditions.push('Good humidity levels');

        // Wind assessment
        if (data.weather.windSpeed > 20) conditions.push('High wind - consider wind breaks');
        
        // Soil assessment
        if (data.soil.ph < 6.0) conditions.push('Acidic soil - may need liming');
        else if (data.soil.ph > 7.5) conditions.push('Alkaline soil - consider acidifying amendments');

        setFarmingConditions(conditions.join('. '));
    };

    if (!analysisData) return <div>Loading data...</div>;

    const areaStats = calculateArea(analysisData.points);

    // Prepare data for charts
    const soilComposition = [
        { name: 'Sand', value: analysisData.soil.sand },
        { name: 'Silt', value: analysisData.soil.silt },
        { name: 'Clay', value: analysisData.soil.clay }
    ];

    const weatherData = [
        { name: 'Temperature', value: analysisData.weather.temperature },
        { name: 'Humidity', value: analysisData.weather.humidity },
        { name: 'Wind Speed', value: analysisData.weather.windSpeed }
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Field Analysis Dashboard</h2>
            
            {/* Area Statistics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-100 p-4 rounded-lg">
                    <h3 className="font-bold">Area (Acres)</h3>
                    <p className="text-2xl">{areaStats.acres.toFixed(2)}</p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg">
                    <h3 className="font-bold">Area (Hectares)</h3>
                    <p className="text-2xl">{areaStats.hectares.toFixed(2)}</p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-lg">
                    <h3 className="font-bold">Soil Quality Score</h3>
                    <p className="text-2xl">{soilQualityScore}%</p>
                </div>
            </div>

            {/* Soil Composition Pie Chart */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-bold mb-4">Soil Composition</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={soilComposition}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {soilComposition.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Weather Parameters Bar Chart */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-bold mb-4">Weather Parameters</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={weatherData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Soil pH and Quality Gauge */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-bold mb-4">Soil pH Level</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={[
                            { name: 'pH', value: analysisData.soil.ph }
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 14]} />
                            <Tooltip />
                            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Soil Parameters Radar Chart */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-bold mb-4">Soil Parameters Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={[{
                            sand: analysisData.soil.sand,
                            silt: analysisData.soil.silt,
                            clay: analysisData.soil.clay,
                            ph: analysisData.soil.ph * 10
                        }]}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis />
                            <Radar name="Soil" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Farming Conditions */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h3 className="font-bold mb-2">Farming Conditions Assessment</h3>
                <p className="text-gray-700">{farmingConditions}</p>
            </div>

            {/* Timestamp */}
            <div className="text-sm text-gray-500">
                Last Updated: {analysisData.timestamp}
            </div>
        </div>
    );
};

export default Data;

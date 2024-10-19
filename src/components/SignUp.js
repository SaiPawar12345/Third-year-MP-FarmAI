import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate


  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate signup process
    if (email && password && password === confirmPassword) {
      // Redirect to dashboard after successful signup
      navigate('/dashboard');
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-6">
          Sign Up
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">
              Email
            </label>
            <input
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-4 relative">
            <label className="block text-gray-700">
              Password
            </label>
            <input
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="mb-4 relative">
            <label className="block text-gray-700">
              Confirm Password
            </label>
            <input
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            className="w-full bg-green-500 text-white py-2 rounded-lg font-bold hover:bg-green-600 transition duration-300"
            type="submit"
          >
            Sign Up
          </button>
        </form>
        <div className="flex items-center my-4">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-2 text-gray-500">
            Or
          </span>
          <hr className="flex-grow border-gray-300" />
        </div>
        <button
          className="w-full bg-green-700 text-white py-2 rounded-lg font-bold hover:bg-green-800 transition duration-300 mb-2"
        >
          Login with Facebook
        </button>
        <button
          className="w-full bg-white text-gray-700 border border-gray-300 py-2 rounded-lg font-bold hover:bg-gray-100 transition duration-300"
        >
          Login with Google
        </button>
      </div>
    </div>
  );
};

export default SignUp;
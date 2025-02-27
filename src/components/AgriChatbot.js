import React, { useState, useEffect, useRef } from 'react';
import './AgriChatbot.css';

const AgriChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm AgriBot, your farming assistant. Ask me any agriculture-related questions!", sender: 'bot' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // TODO: Replace with your environment variable or secure method
  // DON'T hardcode this in production code - use environment variables
  // This should be kept in .env file and accessed via process.env
  const GEMINI_API_KEY = 'AIzaSyCtM75vJXvJFJNx2R3-cZlCw6GrTbAjNIY';

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Toggle chatbot visibility
  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  // Handle message input changes
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  // Send message to API and get response
  const sendMessage = async () => {
    if (inputMessage.trim() === '') return;
    
    // Add user message to chat
    const userMessage = { text: inputMessage, sender: 'user' };
    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Call Gemini API
      const response = await getGeminiResponse(inputMessage);
      
      // Add bot response to chat
      setMessages(prevMessages => [...prevMessages, { text: response, sender: 'bot' }]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages(prevMessages => [
        ...prevMessages, 
        { text: 'Sorry, I encountered an error while connecting to the AI service. Please try again later.', sender: 'bot' }
      ]);
      setIsLoading(false);
    }
  };

  // Function to get responses from Gemini API
  const getGeminiResponse = async (message) => {
    // Creating a context to make the model understand it should focus on agriculture
    const agriculturalContext = `You are AgriBot, a helpful assistant specialized in agriculture, farming, and gardening. 
    Provide accurate, practical advice on topics like crop management, soil health, pest control, sustainable farming, 
    irrigation, fertilizers, and other agriculture-related questions. Keep responses concise yet informative.`;
    
    const userQuery = `Question about agriculture: ${message}`;
    
    try {
      const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
      
      const requestBody = {
        contents: [{
          parts: [{
            text: `${agriculturalContext}\n\n${userQuery}`
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        }
      };
      
      const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract the text from the response
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const textResponse = data.candidates[0].content.parts[0].text;
        return textResponse;
      } else {
        return "I couldn't generate a response. Please try asking a different agriculture-related question.";
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return "Sorry, I couldn't connect to my knowledge base. Please check your internet connection and try again.";
    }
  };

  // Handle "Enter" key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="agri-chatbot-container">
      {/* Chatbot toggle button */}
      <button 
        className="chatbot-toggle-button" 
        onClick={toggleChatbot}
      >
        {isOpen ? 'Close AgriBot' : 'Ask AgriBot'}
      </button>
      
      {/* Chatbot panel */}
      {isOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <h3>AgriBot Assistant</h3>
            <p>Your farming & gardening companion</p>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.sender}`}>
                {message.text}
              </div>
            ))}
            {isLoading && (
              <div className="message bot loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chatbot-input">
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask a farming question..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgriChatbot;
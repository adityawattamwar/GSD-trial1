import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaLeaf, FaPaperPlane, FaSpinner } from 'react-icons/fa';

const SustainableChat = ({ onApiCall }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingEffect, setTypingEffect] = useState({ active: false, text: '', fullText: '' });
  
  // Green practice: Track resource usage
  const [resourceMetrics, setResourceMetrics] = useState({
    tokenCount: 0,
    totalRequests: 0,
    carbonFootprint: 0  // Estimated in grams of CO2
  });
  
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingEffect]);
  
  // Add initial bot message
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I\'m your sustainable shopping assistant. I can help you find eco-friendly products and answer questions about sustainable shopping practices. How can I assist you today?'
      }
    ]);
  }, []);
  
  // Typing effect simulation - more efficient than streaming (green practice)
  useEffect(() => {
    let interval = null;
    if (typingEffect.active && typingEffect.text.length < typingEffect.fullText.length) {
      interval = setInterval(() => {
        setTypingEffect(prev => ({
          ...prev,
          text: prev.fullText.substring(0, prev.text.length + 3)  // Show 3 chars at a time for efficiency
        }));
      }, 15);  // Fast enough to seem natural but not wasteful
    } else if (typingEffect.text.length >= typingEffect.fullText.length) {
      setTypingEffect({ active: false, text: '', fullText: '' });
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [typingEffect]);
  
  // Calculate carbon footprint of the chat
  const calculateChatCarbon = (tokens) => {
    // Based on research: approx. 0.2g-0.5g CO2 per query to an LLM
    // We'll use a conservative 0.3g per query + 0.001g per token
    return 0.3 + (tokens * 0.001);
  };
  
  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;
    
    const userMessage = {
      role: 'user',
      content: input
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      // Green practice: Save API call energy by using small payloads
      const response = await axios.post('/api/chat', {
        messages: [userMessage],  // Only send the latest message, not entire history
        userId: 'guest-user'
      });
      
      // Track API call for metrics
      if (onApiCall) onApiCall(2);  // Approx 2KB per chat message
      
      // Estimate token count (rough approximation)
      const requestTokens = input.split(' ').length * 1.5;
      const responseTokens = response.data.response.split(' ').length * 1.5;
      const totalTokens = requestTokens + responseTokens;
      
      // Update resource metrics
      setResourceMetrics(prev => ({
        tokenCount: prev.tokenCount + totalTokens,
        totalRequests: prev.totalRequests + 1,
        carbonFootprint: prev.carbonFootprint + calculateChatCarbon(totalTokens)
      }));
      
      // Begin typing effect for a more natural feel without actual streaming
      // (green practice: simulates streaming without multiple network requests)
      setTypingEffect({
        active: true,
        text: '',
        fullText: response.data.response
      });
      
      // After typing effect completes, add message to chat
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: response.data.response,
            sustainabilityTips: response.data.sustainabilityTips,
            recommendedProducts: response.data.recommendedProducts
          }
        ]);
      }, Math.min(response.data.response.length * 5, 3000));  // Cap at 3 seconds max
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback response to avoid breaking UX
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I'm having trouble connecting to the sustainability service. Please try again later or consider these general tips: choose products with recycled materials, opt for items with less packaging, and look for eco-certifications."
        }
      ]);
      
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h1>Sustainable Shopping Assistant</h1>
      <p>Ask about eco-friendly products, sustainability practices, or get personalized green shopping recommendations.</p>
      
      <div className="chat-container">
        <div className="chat-header">
          <FaLeaf size={20} />
          <h2>Eco Assistant</h2>
        </div>
        
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
            >
              <div className="message-content">
                <p>{message.content}</p>
                
                {/* Display sustainability tips if available */}
                {message.sustainabilityTips && message.sustainabilityTips.length > 0 && (
                  <div style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                    <strong>Sustainability Tips:</strong>
                    <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                      {message.sustainabilityTips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Display product recommendations if available */}
                {message.recommendedProducts && message.recommendedProducts.length > 0 && (
                  <div style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                    <strong>Recommended Sustainable Products:</strong>
                    <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                      {message.recommendedProducts.map((productId, i) => (
                        <li key={i}>
                          Product #{productId}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Show typing effect */}
          {typingEffect.active && (
            <div className="message ai-message">
              <div className="message-content">
                <p>{typingEffect.text}</p>
              </div>
            </div>
          )}
          
          {/* Loading indicator */}
          {loading && !typingEffect.active && (
            <div className="message ai-message">
              <div className="message-content" style={{ display: 'flex', alignItems: 'center' }}>
                <FaSpinner className="fa-spin" style={{ marginRight: '8px' }} />
                <p>Thinking sustainably...</p>
              </div>
            </div>
          )}
          
          {/* Element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
        
        <form className="chat-input" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about sustainable products..."
            disabled={loading || typingEffect.active}
          />
          <button 
            type="submit" 
            disabled={loading || typingEffect.active || !input.trim()}
          >
            <FaPaperPlane size={16} />
          </button>
        </form>
      </div>
      
      {/* Green metrics */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center' }}>
          <FaLeaf style={{ marginRight: '8px' }} />
          Green Chat Metrics
        </h3>
        <p>This chat is powered by a locally-run AI model through Ollama, which uses significantly less energy than cloud-based alternatives.</p>
        <ul style={{ marginTop: '10px' }}>
          <li>Estimated tokens processed: {resourceMetrics.tokenCount.toFixed(0)}</li>
          <li>Total requests: {resourceMetrics.totalRequests}</li>
          <li>Approximate carbon footprint: {resourceMetrics.carbonFootprint.toFixed(2)}g CO2e</li>
          <li>
            Carbon comparison: This chat uses about {(resourceMetrics.carbonFootprint * 100 / 4.5).toFixed(1)}% of the 
            carbon footprint compared to a typical cloud-based GPT query
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SustainableChat;

// CSS for spinner animation
const styles = document.createElement('style');
styles.innerHTML = `
@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.fa-spin {
  animation: fa-spin 1.5s linear infinite;
}
`;
document.head.appendChild(styles);
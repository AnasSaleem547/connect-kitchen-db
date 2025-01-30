import React, { useState } from 'react';
import './Chatbot.css'; // Ensure this CSS file has the same styles as previously defined

function Chatbot() {
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isChatVisible, setIsChatVisible] = useState(true); // State to control visibility

    const handleInputChange = (e) => {
        setUserInput(e.target.value);
    };

    const handleSendMessage = async () => {
        if (!userInput.trim()) return;

        // Add user message to the chat
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: 'user', text: userInput },
        ]);
        setUserInput('');

        // Send message to API
        try {
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: userInput }),
            });

            const data = await response.json();
            setMessages((prevMessages) => [
                ...prevMessages,
                { sender: 'bot', text: data.response },
            ]);
        } catch (error) {
            console.error('Error:', error);
            setMessages((prevMessages) => [
                ...prevMessages,
                { sender: 'bot', text: 'Sorry, there was an error. Please try again.' },
            ]);
        }
    };

    // Toggle the visibility of the chatbot container
    const toggleChatVisibility = () => {
        setIsChatVisible(!isChatVisible);
    };

    return (
        <div>
            {/* Chatbot Toggle Button */}
            <button className="chatbot-toggle-button" onClick={toggleChatVisibility}>
                {isChatVisible ? 'Hide Chatbot' : 'Show Chatbot'}
            </button>

            {/* Chatbot container */}
            {isChatVisible && (
                <div className="chatbot-container">
                    <div className="chat-history">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`chat-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}
                            >
                                {msg.text}
                            </div>
                        ))}
                    </div>
                    <div className="input-area">
                        <input
                            type="text"
                            value={userInput}
                            onChange={handleInputChange}
                            placeholder="Type your message..."
                        />
                        <button onClick={handleSendMessage}>Send</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Chatbot;

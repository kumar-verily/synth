import React, { useState } from 'react';
import { API_BASE_URL } from '../config'; // Import your API base URL

const ChatbotWidget = ({ patient }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen && messages.length === 0) {
            // Add a default greeting when the chat is first opened
            setMessages([{ role: 'assistant', content: 'Hello! How can I help you with this patient?' }]);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // 1. Create the system prompt with patient data
        // This tells the AI its role and gives it context.
        const systemPrompt = `You are a helpful medical AI assistant. Summarize and answer questions about the following patient. Here is the patient's data in JSON format: ${JSON.stringify(patient, null, 2)}`;
        
        try {
            // 2. Call your OWN back-end endpoint
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_prompt: input, // Send the user's message
                    patient: patient    // Send the full patient object
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get a response from the server.');
            }

            const data = await response.json();
            const assistantMessage = { role: 'assistant', content: data.response };
            setMessages(prev => [...prev, assistantMessage]);

        } catch (error) {
            console.error("Chat API Error:", error);
            const errorMessage = { role: 'assistant', content: 'Sorry, I ran into an error. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <button className="chatbot-fab" onClick={toggleChat}>
                {/* SVG Icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="32px"
                    height="32px"
                >
                    <path
                        fillRule="evenodd"
                        d="M4.804 21.644a.75.75 0 0 0 .976-.073l2.404-2.404a.75.75 0 0 1 .53-.22h6.58c1.812 0 3.29-1.477 3.29-3.29V7.19a.75.75 0 0 0-1.5 0v7.505c0 1.017-.823 1.84-1.84 1.84h-6.58a2.25 2.25 0 0 0-1.591.659l-2.404 2.404a.75.75 0 0 0 .217 1.273ZM3.75 2.25c-1.017 0-1.84.823-1.84 1.84v7.505c0 1.812 1.477 3.29 3.29 3.29h6.58a.75.75 0 0 1 .53.22l2.404 2.404a.75.75 0 0 0 .976-.073l2.404-2.404a.75.75 0 0 1 .53-.22h.028c1.812 0 3.29-1.477 3.29-3.29V4.09c0-1.017-.823-1.84-1.84-1.84H3.75Z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <h3>AI Assistant</h3>
                        <button onClick={toggleChat} className="chatbot-close-btn">&times;</button>
                    </div>
                    <div className="chatbot-body">
                        {messages.map((msg, index) => (
                            <div key={index} className={`chat-message ${msg.role}`}>
                                <p>{msg.content}</p>
                            </div>
                        ))}
                        {isLoading && <div className="chat-message assistant"><p><i>Thinking...</i></p></div>}
                    </div>
                    <div className="chatbot-footer">
                        <input
                            type="text"
                            placeholder={patient ? "Ask about this patient..." : "Select a patient first"}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={!patient || isLoading}
                        />
                        <button onClick={handleSendMessage} disabled={!patient || isLoading}>Send</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatbotWidget;
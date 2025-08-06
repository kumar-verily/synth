import React, { useState, useRef, useEffect  } from 'react';
import { API_BASE_URL } from '../config';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatbotWidget = ({ patient }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const chatBodyRef = useRef(null);

    // --- NEW: State to manage which menu is open ('todos', 'protocols', 'qa', or null)
    const [activeMenu, setActiveMenu] = useState(null);

    // --- Sample data for the new menus. You would fetch or pass this down as props.
    const deepSearchOptions = [
        { id: 'ds1', prompt: 'Search Care Protocols', displayText: 'Search Care Protocols' },
        { id: 'ds2', prompt: 'Check Medication Formulary', displayText: 'Check Formulary' },
        { id: 'ds3', prompt: 'Analyze this Patient', displayText: 'Analyze this Patient' },
    ];
    const deepActionOptions = [
        { id: 'da1', prompt: 'Initiate the workflow to send a new A1C home testing kit to this patient.', displayText: 'Send A1C Kit' },
        { id: 'da2', prompt: 'Summarize the most recent clinical note for me.', displayText: 'Graduate Patient' },
        { id: 'da3', prompt: 'What are the primary concerns noted in the care plan?', displayText: 'Scenario Planning' },
    ];


    // useEffect(() => {
    //     if (chatBodyRef.current) {
    //         chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    //     }
    // }, [messages]);

    useEffect(() => {
        // If a patient is selected, reset the chat with a new greeting.
        if (patient) {
            setMessages([
                {
                    role: 'assistant',
                    content: `Hello! I can help with questions about ${patient.name}.`
                }
            ]);
            // Also, close any menu that might have been open for the previous patient.
            setActiveMenu(null);
        } else {
            // If no patient is selected, clear the chat completely.
            setMessages([]);
        }
    }, [patient]); // <-- The dependency array tells React to run this effect when `patient` changes.


    const toggleChat = () => {
        setIsOpen(!isOpen);
        setActiveMenu(null); // Close any open menus when closing the chat
        if (!isOpen && messages.length === 0) {
            setMessages([{ role: 'assistant', content: `Hello! I can help with questions about ${patient?.name || 'this patient'}.` }]);
        }
    };

    const sendMessage = async (messageText) => {
        // if (!messageText.trim() || !patient) return;
        if (!messageText || !messageText.trim() || !patient) {
        console.error("SendMessage stopped: Missing message text or patient data.");
        return;
    }

        setActiveMenu(null); // Close menu after sending a message
        const userMessage = { role: 'user', content: messageText };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_prompt: messageText, patient: patient })
            });

            if (!response.ok) throw new Error('API response error');

            const data = await response.json();
            // console.log("Data received from server:", data); 

            const assistantMessage = { role: 'assistant', content: data.response };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Chat API Error:", error);
            const errorMessage = { role: 'assistant', content: 'Sorry, I ran into an error.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualSendMessage = () => {
        sendMessage(input);
        setInput('');
    };

    // --- NEW: Function to toggle the active menu
    const handleMenuClick = (menuName) => {
        setActiveMenu(prevMenu => (prevMenu === menuName ? null : menuName));
    };

    const renderMenuContent = () => {
        if (!activeMenu) return null;

        let items = [];
        let promptPrefix = '';

        switch (activeMenu) {
            case 'todos':
                items = patient?.toDo?.map(item => ({...item, prompt: `Help with to-do: "${item.text}"`})) || [];
                break;
            case 'search':
                items = deepSearchOptions.map(item => ({...item, text: item.displayText, prompt: `Explain the protocol for: "${item.prompt}"`}));
                break;
            case 'action':
                items = deepActionOptions.map(item => ({...item, text: item.displayText, prompt: item.prompt}));
                break;
            default:
                return null;
        }

        return (
            <div className="secondary-options-panel">
                {items.map(item => (
                    <button key={item.id} className="option-item" onClick={() => sendMessage(item.prompt)}>
                        {item.text}
                    </button>
                ))}
            </div>
        );
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
                    <div className="chatbot-body" ref={chatBodyRef}>
                        {messages.map((msg, index) => (
                            <div key={index} className={`chat-message ${msg.role}`}>
                                {/* --- 3. THIS IS THE KEY CHANGE --- */}
                                {msg.role === 'assistant' ? (
                                    // If the message is from the assistant, render it using ReactMarkdown
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                    </ReactMarkdown>
                                ) : (
                                    // Otherwise, just render the plain text for the user's message
                                    <p>{msg.content}</p>
                                )}
                            </div>
                        ))}
                        {isLoading && <div className="chat-message assistant"><p><i>Thinking...</i></p></div>}
                    </div>
                    <div className="chatbot-footer">
                        {renderMenuContent()}
                        <div className="chatbot-input-bar">
                             <div className="primary-actions">
                                <button className={`action-btn ${activeMenu === 'todos' ? 'active' : ''}`} onClick={() => handleMenuClick('todos')}>To-Dos</button>
                                <button className={`action-btn ${activeMenu === 'search' ? 'active' : ''}`} onClick={() => handleMenuClick('search')}>Deep Search</button>
                                <button className={`action-btn ${activeMenu === 'action' ? 'active' : ''}`} onClick={() => handleMenuClick('action')}>Deep Action</button>
                            </div>
                            <input
                                type="text"
                                placeholder="Ask a question or select an option..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleManualSendMessage()}
                                disabled={!patient || isLoading}
                            />
                            <button className="send-btn" onClick={handleManualSendMessage} disabled={!patient || isLoading}>
                                {/* Send Icon SVG */}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatbotWidget;
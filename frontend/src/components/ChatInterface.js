import React, { useState } from 'react';

const ChatInterface = () => {
    const [query, setQuery] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [responses, setResponses] = useState([]);

    const sendData = async () => {
        if (!query.trim() && !uploadedFile) return;

        const userAction = query ? `You asked: ${query}` : `You uploaded: ${uploadedFile.name}`;
        setResponses(prev => [...prev, userAction]);

        const formData = new FormData();
        if (query) formData.append('query', query);
        if (uploadedFile) formData.append('file', uploadedFile);

        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/chat', { method: 'POST', body: formData });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setResponses(prev => [...prev, `LLM Response: ${data.response}`]);
        } catch (error) {
            console.error("Failed to send data to backend:", error);
            setResponses(prev => [...prev, "Error: Failed to connect to backend."]);
        } finally {
            setQuery('');
            setUploadedFile(null);
            setLoading(false);
        }
    };

    const handleFileChange = (e) => setUploadedFile(e.target.files[0]);
    const handleFileRemove = () => setUploadedFile(null);

    return (
        <div className="chat-interface">
            <h3>AI Planet Chat</h3>

            <div className="chat-messages">
                {responses.map((r, i) => (
                    <div key={i} className="chat-message">{r}</div>
                ))}
                {loading && <div className="chat-message"><i>Thinking...</i></div>}
            </div>

            {/* Input with "+" inside */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '1px solid #ccc',
                overflow: 'hidden',
                paddingLeft: '8px' // padding from container's left edge
            }}>
                {/* "+" Button */}
                <label
                    htmlFor="file-input"
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '36px',
                        height: '36px',
                        backgroundColor: '#3d4458ff',
                        color: '#fff',
                        fontSize: '29px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        borderRadius: '80%',
                        flexShrink: 0, // prevent shrinking
                    }}
                >
                    +
                </label>

                <input
                    id="file-input"
                    type="file"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />

                {/* Text Input */}
                <input
                    className="chat-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type your query..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendData();
                        }
                    }}
                    style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        padding: '10px 12px',
                        fontSize: '14px',
                        marginLeft: '8px',
                        height: '36px', // same height as + button for perfect alignment
                        boxSizing: 'border-box',
                    }}
                />
            </div>


            {/* Display selected file */}
            {uploadedFile && (
                <div className="uploaded-file-display" style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{uploadedFile.name}</span>
                    <button onClick={handleFileRemove} className="remove-file-btn">&times;</button>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;

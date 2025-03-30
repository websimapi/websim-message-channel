import { config } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const messageHistory = document.getElementById('messageHistory');
    const copyButton = document.getElementById('copyButton');
    const codeSnippet = document.getElementById('codeSnippet');
    
    // Generate integration code for parent page
    const integrationCode = `// Add this code to the parent page to communicate with the iframe

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const messageHistory = document.getElementById('messageHistory');
    const iframeContainer = document.getElementById('iframeContainer');
    
    // 1. Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = 'https://websim.ai/@api/message-channel/';
    iframe.width = '100%';
    iframe.height = '400px';
    iframeContainer.appendChild(iframe);
    
    // Function to add message to the message history
    function addMessage(text, type) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type);
        messageElement.textContent = text;
        messageHistory.appendChild(messageElement);
        messageHistory.scrollTop = messageHistory.scrollHeight;
    }
    
    // Function to send message to iframe
    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (!messageText) return;
        
        // Send message to iframe
        iframe.contentWindow.postMessage({
            type: 'response',
            text: messageText
        }, 'https://websim.ai');
        
        // Add message to history
        addMessage(`You: ${messageText}`, 'sent');
        
        // Clear input
        messageInput.value = '';
    }
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // 2. Listen for messages from iframe
    window.addEventListener('message', (event) => {
        // Check origin for security
        if (event.origin !== 'https://websim.ai') return;
        
        console.log('Message from iframe:', event.data);
        
        // Handle message types
        if (event.data.type === 'message') {
            addMessage(`Iframe: ${event.data.text}`, 'received');
        }
    });
    
    // Initial instruction
    addMessage('Welcome! Send a message to the iframe below.', 'received');
});`;

    codeSnippet.textContent = integrationCode;

    // Function to send a message to the parent window
    function sendMessageToParent(text) {
        const message = {
            type: 'message',
            text: text,
            timestamp: new Date().toISOString()
        };
        
        // Target specific origin for security
        try {
            window.parent.postMessage(message, config.parentOrigin);
            console.log('Message sent to parent:', message);
        } catch (err) {
            console.error('Error sending message:', err);
        }
        
        // Add message to history
        addMessageToHistory(text, 'sent');
    }
    
    // Function to add a message to the history
    function addMessageToHistory(text, type) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type);
        messageElement.textContent = text;
        messageHistory.appendChild(messageElement);
        
        // Scroll to bottom
        messageHistory.scrollTop = messageHistory.scrollHeight;
    }
    
    // Send button click handler
    sendButton.addEventListener('click', () => {
        const text = messageInput.value.trim();
        if (text) {
            sendMessageToParent(text);
            messageInput.value = '';
            messageInput.focus();
        }
    });
    
    // Enter key handler
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });
    
    // Copy code to clipboard
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(codeSnippet.textContent)
            .then(() => {
                copyButton.classList.add('flash');
                copyButton.textContent = 'Copied!';
                
                setTimeout(() => {
                    copyButton.classList.remove('flash');
                    copyButton.textContent = 'Copy to Clipboard';
                }, 1500);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    });
    
    // Listen for messages from parent window
    window.addEventListener('message', (event) => {
        console.log('Received message event:', event);
        
        // Check origin for security
        if (!config.allowedOrigins.includes('*') && 
            !config.allowedOrigins.includes(event.origin)) {
            console.warn('Message from unauthorized origin:', event.origin);
            return;
        }
        
        const data = event.data;
        
        if (data && data.type === 'response') {
            console.log('Processing response:', data);
            addMessageToHistory(data.text, 'received');
        }
    });
    
    // Initial message
    addMessageToHistory('Ready to send and receive messages!', 'received');
});
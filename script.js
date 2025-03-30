import { config } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const messageHistory = document.getElementById('messageHistory');
    const copyButton = document.getElementById('copyButton');
    const codeSnippet = document.getElementById('codeSnippet');
    
    // Generate integration code for parent page
    const integrationCode = `// Add this code to the parent page to communicate with the iframe

// 1. Create iframe
const iframe = document.createElement('iframe');
iframe.src = 'https://websim.ai/@api/message-channel/';
iframe.width = '100%';
iframe.height = '400px';
document.getElementById('iframeContainer').appendChild(iframe);

// 2. Listen for messages from iframe
window.addEventListener('message', (event) => {
    // Check origin for security (in production, use a specific origin)
    if (event.origin !== 'https://websim.ai') return;
    
    console.log('Message from iframe:', event.data);
    
    // Example: Send response back
    if (event.data.type === 'message') {
        iframe.contentWindow.postMessage({
            type: 'response',
            text: 'Message received by parent: ' + event.data.text
        }, 'https://websim.ai');
    }
});`;

    codeSnippet.textContent = integrationCode;

    // Function to send a message to the parent window
    function sendMessageToParent(text) {
        const message = {
            type: 'message',
            text: text,
            timestamp: new Date().toISOString()
        };
        
        window.parent.postMessage(message, '*');
        
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
        // Since we're allowing all origins for demo purposes, we skip the origin check
        // In production, you should verify the origin
        
        const data = event.data;
        
        if (data && data.type === 'response') {
            addMessageToHistory(data.text, 'received');
        }
    });
    
    // Initial message
    addMessageToHistory('Ready to send and receive messages!', 'received');
});
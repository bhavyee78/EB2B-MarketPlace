'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, Send, Loader2, Minus } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  products?: any[];
  timestamp: Date;
}

interface SalesAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  userId?: string;
}

// Helper function to render formatted message content
const renderMessageContent = (content: string, products?: any[]) => {
  // Check if content is defined
  if (!content || typeof content !== 'string') {
    return <p>No content available</p>;
  }

  // Remove markdown formatting
  const cleanContent = content
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // Remove triple asterisks
    .replace(/\*\*(.+?)\*\*/g, '$1')     // Remove double asterisks (bold)
    .replace(/\*(.+?)\*/g, '$1')         // Remove single asterisks (italic)
    .replace(/###\s*(.+?)(\n|$)/g, '$1$2') // Remove ### headers
    .replace(/##\s*(.+?)(\n|$)/g, '$1$2')  // Remove ## headers
    .replace(/#\s*(.+?)(\n|$)/g, '$1$2');  // Remove # headers

  // Split into lines and render
  const lines = cleanContent.split('\n');
  
  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        if (line.trim() === '') {
          return <div key={index} className="h-2" />; // Empty line spacing
        }
        
        // Check if line contains product information (basic detection)
        const hasPrice = line.includes('$') || line.includes('price');
        const hasProduct = line.toLowerCase().includes('wreath') || 
                          line.toLowerCase().includes('garland') || 
                          line.toLowerCase().includes('decoration') ||
                          line.toLowerCase().includes('basket') ||
                          line.toLowerCase().includes('lighting');
        
        if (hasPrice && hasProduct) {
          return (
            <div key={index} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
              <p className="text-blue-800 font-medium">{line}</p>
            </div>
          );
        }
        
        return (
          <p key={index} className="leading-relaxed">
            {line}
          </p>
        );
      })}
      
      {/* Render product cards if available */}
      {products && products.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="font-medium text-gray-700">Recommended Products:</p>
          <div className="grid gap-3">
            {products.map((product, index) => (
              <div key={index} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-800">{product.name}</h4>
                    <p className="text-sm text-gray-600">{product.description}</p>
                    <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">${product.price}</p>
                    <p className="text-xs text-gray-500">MOQ: {product.moq}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SalesAgentModal: React.FC<SalesAgentModalProps> = ({ 
  isOpen, 
  onClose, 
  onMinimize,
  userId = 'guest-user' 
}) => {
  // Debug log to see what userId is being passed
  console.log('SalesAgentModal userId:', userId);
  const [mode, setMode] = useState<'selection' | 'chat'>('selection');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && mode === 'chat') {
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      console.log('Chat token check:', token ? `Token found: ${token.substring(0, 20)}...` : 'No token found');
      
      if (!token) {
        setError('Authentication required. Please login again.');
        return;
      }
      
      const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/agent`, {
        transports: ['websocket'],
        withCredentials: true,
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('Chat WebSocket connected');
        setError(null);
      });

      newSocket.on('chat-response', (data) => {
        console.log('Received chat response:', data);
        
        // Handle backend response format: { success: true, response: "message", timestamp: "..." }
        let messageContent = '';
        let products = [];
        
        if (data && data.success && data.response) {
          if (typeof data.response === 'string') {
            messageContent = data.response;
          } else if (typeof data.response === 'object') {
            messageContent = data.response.message || data.response.text || data.response.content || data.response;
            products = data.response.products || [];
          }
        } else if (data && data.error) {
          messageContent = `Error: ${data.error}`;
        } else {
          messageContent = 'Sorry, I encountered an error processing your request.';
        }
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'agent',
          content: messageContent,
          products: products,
          timestamp: new Date()
        }]);
        setIsLoading(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setError('Failed to connect to chat service');
        setIsLoading(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isOpen, mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClose = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setMessages([]);
    setInputMessage('');
    setMode('selection');
    setError(null);
    onClose();
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !socket || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // Send message to backend
    socket.emit('chat-message', {
      message: inputMessage,
      userId: userId
    });

    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startTextChat = () => {
    setMode('chat');
    setMessages([{
      id: 'greeting',
      role: 'agent',
      content: 'Hello! I\'m Ivanna from Premier Decorations. I\'m here to help you place your order. What would you like to order today?',
      timestamp: new Date()
    }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">AI Sales Agent</h3>
              <p className="text-gray-500 text-sm">
                {mode === 'selection' && 'Choose how you\'d like to interact'}
                {mode === 'chat' && 'Chat with our AI assistant'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onMinimize && (
              <button
                onClick={onMinimize}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Minimize"
              >
                <Minus className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {mode === 'selection' && (
            <div className="p-6 h-full flex flex-col justify-center">
              <div className="text-center mb-8">
                <h4 className="text-2xl font-bold text-gray-800 mb-4">How can I help you today?</h4>
                <p className="text-gray-600">Choose your preferred way to interact with our AI Sales Agent</p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <button
                  onClick={startTextChat}
                  className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">💬 Chat with Sales Agent</h4>
                    <p className="text-gray-600 text-sm">Ask questions, browse products, and place orders via text</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {mode === 'chat' && (
            <div className="flex flex-col h-full">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{height: 'calc(100% - 140px)'}}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.role === 'agent' 
                        ? renderMessageContent(message.content, message.products)
                        : <p className="leading-relaxed">{message.content}</p>
                      }
                      <div className="mt-2 text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-4 rounded-lg flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-gray-600">Typing...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4 flex-shrink-0">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={1}
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => setMode('selection')}
                  className="mt-3 text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← Back to options
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesAgentModal;
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../services/api';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const ChatPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Load session and history when opened
  useEffect(() => {
    if (isOpen && !sessionId) {
      initSession();
    }
  }, [isOpen]);

  const initSession = async () => {
    try {
      const res = await api.get('/chat/sessions');
      let currentSessionId = null;
      
      if (res.data && res.data.length > 0) {
        currentSessionId = res.data[0].id;
      } else {
        const createRes = await api.post('/chat/sessions', { title: 'New Chat' });
        currentSessionId = createRes.data.id;
      }
      
      setSessionId(currentSessionId);
      
      if (currentSessionId) {
        const msgRes = await api.get(`/chat/sessions/${currentSessionId}/messages`);
        if (msgRes.data) {
          setMessages(msgRes.data);
        }
      }
    } catch (error) {
      console.error('Failed to initialize chat session:', error);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !sessionId || isLoading) return;

    const userMessageContent = inputValue.trim();
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: userMessageContent };
    
    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue('');
    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/chat/sessions/${sessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: userMessageContent })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let fullContent = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === assistantMsgId ? { ...msg, content: fullContent } : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => 
        prev.map(msg => 
          msg.id === assistantMsgId ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.25 }}
            className="w-[380px] h-[600px] mb-4 glass-card bg-white/90 dark:bg-dark-800/90 backdrop-blur-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20 dark:border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="flex items-center space-x-3 relative z-10">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Bot size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg leading-tight">InboxSpend AI</h3>
                  <p className="text-xs text-blue-100/80 font-medium">Financial Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-10"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50/50 dark:bg-dark-900/50">
              {messages.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 space-y-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-dark-800 shadow-sm flex items-center justify-center border border-gray-100 dark:border-dark-700">
                    <Sparkles size={32} className="text-blue-500" strokeWidth={1.5} />
                  </div>
                  <p className="text-center text-sm font-medium">Hi! I'm your AI assistant.<br/>Ask me about your spending!</p>
                </motion.div>
              )}
              
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  key={msg.id} 
                  className={clsx(
                    "flex",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div 
                    className={clsx(
                      "max-w-[85%] rounded-2xl px-5 py-3 shadow-sm",
                      msg.role === 'user' 
                        ? "bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-br-sm" 
                        : "bg-white dark:bg-dark-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-dark-700 rounded-bl-sm"
                    )}
                  >
                    <div className="flex items-center space-x-2 mb-1.5">
                      {msg.role === 'assistant' && <Bot size={14} className="text-violet-500" />}
                      <span className="text-[11px] font-semibold uppercase tracking-wider opacity-60">
                        {msg.role === 'user' ? 'You' : 'AI'}
                      </span>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm break-words">
                      {msg.role === 'user' ? (
                        <p>{msg.content}</p>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content || '...'}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border-t border-gray-100 dark:border-dark-700">
              <form 
                onSubmit={handleSendMessage}
                className="flex items-center space-x-2 bg-gray-100/80 dark:bg-dark-900/80 rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-blue-500/30 focus-within:bg-white dark:focus-within:bg-dark-900 transition-all shadow-inner"
              >
                <input 
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about your expenses..."
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  disabled={isLoading}
                />
                <button 
                  type="submit" 
                  disabled={!inputValue.trim() || isLoading}
                  className="text-white bg-blue-600 hover:bg-blue-700 p-2 rounded-xl disabled:opacity-50 disabled:bg-gray-400 dark:disabled:bg-dark-700 transition-colors shadow-sm"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ y: [0, -8, 0] }}
        transition={{ y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl",
          isOpen ? "bg-dark-800 dark:bg-dark-700" : "bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 shadow-blue-500/40"
        )}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>
    </div>
  );
};

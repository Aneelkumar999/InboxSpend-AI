import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Mail, ArrowRight, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { loginWithGoogle } from '../services/api';
import { motion } from 'framer-motion';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');
        const data = await loginWithGoogle(tokenResponse.access_token);
        localStorage.setItem('token', data.access_token);
        onLogin();
      } catch (err) {
        setError('Failed to login with Google.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google Login Failed'),
    scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-dark-900 flex items-center justify-center font-sans">
      {/* Animated Mesh Gradient Background Elements */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-violet-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="glass rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden group">
          {/* Subtle shine effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          
          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
              className="flex justify-center mb-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Mail className="text-white" size={32} strokeWidth={1.5} />
              </div>
            </motion.div>
            
            <div className="text-center mb-10 space-y-3">
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-display font-bold text-gray-900 dark:text-white tracking-tight"
              >
                InboxSpend <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">AI</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-500 dark:text-gray-400 text-sm font-medium"
              >
                Intelligent Expense Tracking & Financial Insights from Gmail.
              </motion.p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 flex items-center justify-center"
              >
                {error}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <button
                onClick={() => login()}
                disabled={loading}
                className="w-full relative flex items-center justify-center py-4 px-6 rounded-xl font-medium text-white overflow-hidden group transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-violet-600 transition-all duration-300 group-hover:from-blue-500 group-hover:to-violet-500"></div>
                <div className="relative z-10 flex items-center">
                  {loading ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3 text-blue-200" />
                      Connect with Google
                      <ArrowRight className="ml-3 w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
              
              {import.meta.env.VITE_ENABLE_MOCKS === 'true' && (
                <button
                  onClick={() => {
                    localStorage.setItem('token', 'mock_token');
                    onLogin();
                  }}
                  className="w-full relative flex items-center justify-center py-4 px-6 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-300"
                >
                  Developer Mock Login
                </button>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex items-center justify-center space-x-2 text-xs text-gray-500"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400/70" />
              <span>Read access to extract receipts, send access for reports.</span>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

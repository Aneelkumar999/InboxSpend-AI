import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSubscriptions } from '../services/api';
import { Link } from 'react-router-dom';
import { Activity, LogOut, Sun, Moon, AlertTriangle, CheckCircle, FileText, Repeat, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SubscriptionsPage({ onLogout }: { onLogout: () => void }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: fetchSubscriptions,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 font-sans transition-colors duration-300">
      <header className="sticky top-0 z-40 glass border-b border-gray-200/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-8"
          >
            <h1 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 flex items-center">
              <Activity className="mr-2 text-blue-600 dark:text-blue-400" /> InboxSpend
            </h1>
            <nav className="hidden sm:flex space-x-6">
              <Link 
                to="/" 
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center"
              >
                Dashboard
              </Link>
              <Link 
                to="/subscriptions" 
                className="text-gray-900 dark:text-white font-medium relative after:absolute after:bottom-[-1.25rem] after:left-0 after:w-full after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400 flex items-center"
              >
                <Repeat size={16} className="mr-1.5"/> Subscriptions
              </Link>
              <Link 
                to="/reports" 
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center"
              >
                <FileText size={16} className="mr-1.5"/> Reports
              </Link>
              <Link 
                to="/junk-fees" 
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center"
              >
                <AlertOctagon size={16} className="mr-1.5"/> Junk Fees
              </Link>
            </nav>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <button onClick={toggleDarkMode} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-700 transition-colors">
              {darkMode ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-dark-700 mx-2"></div>
            <button onClick={onLogout} className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-dark-700 transition-colors">
              <LogOut size={16} className="mr-2" strokeWidth={1.5} /> Logout
            </button>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-display font-semibold text-gray-900 dark:text-white tracking-tight"
          >
            Smart Subscriptions
          </motion.h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading subscriptions...</div>
        ) : subscriptions?.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700">
            No subscriptions found. We'll automatically identify recurring payments as you sync receipts.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {subscriptions?.map((sub: any, index: number) => (
              <motion.div 
                key={sub.merchant}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`glass-card p-6 rounded-2xl border ${sub.price_increased ? 'border-red-200 dark:border-red-900/50' : 'border-gray-100 dark:border-dark-700'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                      {sub.merchant}
                      {sub.is_active ? (
                        <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Active
                        </span>
                      ) : (
                        <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                          Inactive
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{sub.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{Number(sub.current_amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {sub.billing_cycle ? sub.billing_cycle : 'Recurring'}
                    </p>
                  </div>
                </div>

                {sub.price_increased && (
                  <div className="mt-4 bg-red-50 dark:bg-red-900/20 rounded-xl p-4 flex items-start">
                    <AlertTriangle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">Price Hike Detected!</p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Your last bill was ₹{Number(sub.last_amount).toFixed(2)}. It increased by ₹{Number(sub.amount_difference).toFixed(2)}.
                      </p>
                    </div>
                  </div>
                )}
                
                {!sub.price_increased && (
                  <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <CheckCircle className="text-emerald-500 mr-2" size={16} /> Price is stable.
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700 text-xs text-gray-400 dark:text-gray-500 flex justify-between">
                  <span>Last paid: {new Date(sub.last_payment_date).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

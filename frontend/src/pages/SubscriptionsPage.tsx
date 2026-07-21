import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSubscriptions } from '../services/api';
import { Link } from 'react-router-dom';
import { Activity, LogOut, Sun, Moon, AlertTriangle, CheckCircle, FileText, Repeat, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '../components/Header';

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
      <Header 
        activePath="/subscriptions" 
        onLogout={onLogout} 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode} 
      />

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

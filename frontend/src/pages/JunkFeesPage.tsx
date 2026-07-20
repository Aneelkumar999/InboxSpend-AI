import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getJunkFees } from '../services/api';
import { Link } from 'react-router-dom';
import { Activity, LogOut, Sun, Moon, AlertOctagon, TrendingDown, DollarSign, Repeat, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function JunkFeesPage({ onLogout }: { onLogout: () => void }) {
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
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const { data, isLoading } = useQuery({
    queryKey: ['junkFees'],
    queryFn: getJunkFees,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 font-sans transition-colors duration-300">
      <header className="sticky top-0 z-40 glass border-b border-gray-200/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center space-x-8">
            <h1 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 flex items-center">
              <Activity className="mr-2 text-blue-600 dark:text-blue-400" /> InboxSpend
            </h1>
            <nav className="hidden sm:flex space-x-6">
              <Link to="/" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Dashboard</Link>
              <Link to="/subscriptions" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center"><Repeat size={16} className="mr-1.5"/> Subscriptions</Link>
              <Link to="/reports" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center"><FileText size={16} className="mr-1.5"/> Reports</Link>
              <Link to="/junk-fees" className="text-gray-900 dark:text-white font-medium relative after:absolute after:bottom-[-1.25rem] after:left-0 after:w-full after:h-0.5 after:bg-red-500 flex items-center text-red-600 dark:text-red-400"><AlertOctagon size={16} className="mr-1.5"/> Junk Fees</Link>
            </nav>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center space-x-2">
            <button onClick={toggleDarkMode} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-700 transition-colors">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-dark-700 mx-2"></div>
            <button onClick={onLogout} className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-dark-700 transition-colors">
              <LogOut size={16} className="mr-2" /> Logout
            </button>
          </motion.div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="text-center">
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-display font-bold text-gray-900 dark:text-white tracking-tight mb-4">
            The Wall of Shame
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Find out exactly how much money you've lost to Corporate "Service Fees", "Convenience Fees", and "Delivery Fees" this year.
          </motion.p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Calculating your lost money...</div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="glass-card bg-red-500/10 border-red-500/20 p-8 rounded-3xl text-center shadow-lg shadow-red-500/5">
              <h3 className="text-red-600 dark:text-red-400 font-bold uppercase tracking-widest text-sm mb-2">Total Stolen in Junk Fees</h3>
              <p className="text-6xl font-display font-black text-gray-900 dark:text-white flex justify-center items-center">
                <DollarSign size={56} className="text-red-500 mr-2 -mt-2" />
                {Number(data?.total_junk_fees || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <TrendingDown className="text-red-500 mr-2" /> Top Offenders
                </h3>
                {data?.top_offenders?.length === 0 ? (
                  <p className="text-gray-500">No junk fees found. You're lucky!</p>
                ) : (
                  <div className="space-y-4">
                    {data?.top_offenders?.map((offender: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-dark-800 rounded-lg transition-colors">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          <span className="text-gray-400 mr-3">#{i + 1}</span>
                          {offender.merchant}
                        </span>
                        <span className="font-bold text-red-500">₹{Number(offender.total_fees).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <AlertOctagon className="text-orange-500 mr-2" /> Recent Scams
                </h3>
                {data?.recent_fees?.length === 0 ? (
                  <p className="text-gray-500">No recent junk fees.</p>
                ) : (
                  <div className="space-y-4">
                    {data?.recent_fees?.map((fee: any) => (
                      <div key={fee.id} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-dark-800 rounded-lg transition-colors border-l-2 border-orange-500 pl-4">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{fee.merchant}</p>
                          <p className="text-xs text-gray-500">{new Date(fee.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-500">₹{Number(fee.junk_fees).toFixed(2)}</p>
                          <p className="text-xs text-gray-400">Total: ₹{Number(fee.amount).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

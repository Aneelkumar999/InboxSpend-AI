import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Moon, Sun, LogOut, FileText, Download, Mail, Clock, ArrowRight, CheckCircle2, Repeat } from 'lucide-react';
import { downloadReport, emailReport, createReportSchedule, getReportSchedules } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

export default function Reports({ onLogout }: { onLogout: () => void }) {
  const [darkMode, setDarkMode] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('pdf');
  const [downloadPeriod, setDownloadPeriod] = useState('monthly');
  const [emailTo, setEmailTo] = useState('');
  const [scheduleFreq, setScheduleFreq] = useState('monthly');
  const [message, setMessage] = useState('');
  
  const queryClient = useQueryClient();

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

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: getReportSchedules,
  });

  const emailMutation = useMutation({
    mutationFn: () => emailReport(emailTo, downloadPeriod),
    onSuccess: (data) => {
      setMessage(data.message);
      setTimeout(() => setMessage(''), 5000);
    }
  });

  const scheduleMutation = useMutation({
    mutationFn: () => createReportSchedule(scheduleFreq, emailTo),
    onSuccess: (data) => {
      setMessage(data.message);
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setTimeout(() => setMessage(''), 5000);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-300 font-sans">
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
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                to="/subscriptions" 
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center"
              >
                <Repeat size={16} className="mr-1.5"/> Subscriptions
              </Link>
              <Link 
                to="/reports" 
                className="text-gray-900 dark:text-white font-medium flex items-center relative after:absolute after:bottom-[-1.25rem] after:left-0 after:w-full after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400"
              >
                <FileText size={16} className="mr-1.5"/> Reports
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-display font-semibold text-gray-900 dark:text-white tracking-tight">Professional Reports</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Generate, download, and automate your financial statements.</p>
        </motion.div>
        
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 rounded-xl glass border border-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 flex items-center"
            >
              <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0 text-emerald-500" />
              <span className="font-medium text-sm">{message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Download & Email Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8 rounded-3xl"
          >
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mr-4 shadow-sm">
                <Download className="text-blue-600 dark:text-blue-400" size={24} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-display font-semibold text-gray-900 dark:text-white">Export & Share</h3>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reporting Period</label>
                <div className="relative">
                  <select 
                    value={downloadPeriod} 
                    onChange={(e) => setDownloadPeriod(e.target.value)}
                    className="w-full appearance-none px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-shadow cursor-pointer"
                  >
                    <option value="monthly">This Month</option>
                    <option value="yearly">This Year</option>
                    <option value="all">All Time</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Export Format</label>
                <div className="relative">
                  <select 
                    value={downloadFormat} 
                    onChange={(e) => setDownloadFormat(e.target.value)}
                    className="w-full appearance-none px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-shadow cursor-pointer"
                  >
                    <option value="pdf">PDF (Beautiful formatting & charts)</option>
                    <option value="excel">Excel (Data + Category Summary)</option>
                    <option value="csv">CSV (Raw Data)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => downloadReport(downloadFormat, downloadPeriod)}
                  className="w-full flex justify-center items-center px-4 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-violet-700 transition-all shadow-md hover:shadow-lg transform active:scale-95"
                >
                  <Download size={18} className="mr-2" /> Download File
                </button>
              </div>

              <div className="relative py-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-dark-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white dark:bg-dark-800 px-4 text-sm text-gray-400">or send via email</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recipient Email Address</label>
                <div className="flex space-x-3">
                  <input 
                    type="email" 
                    placeholder="name@example.com"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-shadow"
                  />
                  <button 
                    onClick={() => emailMutation.mutate()}
                    disabled={!emailTo || emailMutation.isPending}
                    className="flex-shrink-0 flex justify-center items-center px-5 py-3 bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-all shadow-md transform active:scale-95"
                  >
                    {emailMutation.isPending ? <Activity className="animate-spin w-5 h-5" /> : <Mail size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Schedule Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 rounded-3xl flex flex-col"
          >
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mr-4 shadow-sm">
                <Clock className="text-emerald-600 dark:text-emerald-400" size={24} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-display font-semibold text-gray-900 dark:text-white">Automation</h3>
            </div>
            
            <div className="space-y-5 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delivery Frequency</label>
                <div className="relative">
                  <select 
                    value={scheduleFreq} 
                    onChange={(e) => setScheduleFreq(e.target.value)}
                    className="w-full appearance-none px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 shadow-sm transition-shadow cursor-pointer"
                  >
                    <option value="weekly">Weekly (Every Monday)</option>
                    <option value="monthly">Monthly (1st of Month)</option>
                    <option value="yearly">Yearly (Jan 1st)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <button 
                  onClick={() => scheduleMutation.mutate()}
                  disabled={!emailTo || scheduleMutation.isPending}
                  className="w-full flex justify-center items-center px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 transition-all shadow-md hover:shadow-lg transform active:scale-95"
                >
                  <Clock size={18} className="mr-2" /> Schedule Report
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center flex items-center justify-center">
                  <ArrowRight size={12} className="mr-1" /> Requires email address in the left panel
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-dark-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 tracking-wide uppercase">Active Schedules</h4>
                {isLoading ? (
                  <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-3 py-1">
                      <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ) : !schedules || schedules.length === 0 ? (
                  <div className="text-center p-6 bg-gray-50/50 dark:bg-dark-900/30 rounded-xl border border-dashed border-gray-200 dark:border-dark-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No active schedules yet.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {schedules.map((s: any, i: number) => (
                      <motion.li 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (i * 0.1) }}
                        key={s.id} 
                        className="p-4 bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-600 flex justify-between items-center group hover:border-blue-500/30 transition-colors"
                      >
                        <div>
                          <span className="font-semibold text-sm text-gray-900 dark:text-white capitalize block mb-0.5">{s.frequency} Delivery</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate max-w-[150px] sm:max-w-[180px]">{s.email_to}</p>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-md flex-shrink-0 ${s.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {s.is_active ? 'Active' : 'Paused'}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDashboard, fetchExpenses, syncExpenses } from '../services/api';
import { Link } from 'react-router-dom';
import { RefreshCw, DollarSign, Calendar, TrendingUp, LogOut, Moon, Sun, Download, Search, Filter, ShoppingBag, CreditCard, Activity, FileText, Loader2, Repeat, AlertOctagon, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import { ChatPopup } from './ChatPopup';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'];

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const queryClient = useQueryClient();
  const [syncMsg, setSyncMsg] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const chartsRef = useRef<HTMLDivElement>(null);
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

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

  const exportCharts = async () => {
    if (chartsRef.current) {
      const canvas = await html2canvas(chartsRef.current, {
        backgroundColor: darkMode ? '#000000' : '#ffffff',
      });
      const link = document.createElement('a');
      link.download = 'inboxspend-charts.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  const { data: expenses, isLoading: expLoading } = useQuery({
    queryKey: ['expenses', { search, category, sortBy, sortOrder }],
    queryFn: () => fetchExpenses({ search, category, sort_by: sortBy, sort_order: sortOrder }),
  });

  const syncMutation = useMutation({
    mutationFn: syncExpenses,
    onSuccess: (data) => {
      setSyncMsg(data.message);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setTimeout(() => setSyncMsg(''), 5000);
    },
    onError: () => {
      setSyncMsg('Sync failed. Check backend logs or Google token.');
      setTimeout(() => setSyncMsg(''), 5000);
    }
  });

  const StatCard = ({ title, value, icon: Icon, isCurrency = true, subtitle = '', delay = 0 }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="glass-card p-6 rounded-2xl relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-violet-500/0 group-hover:from-blue-500/5 group-hover:to-violet-500/5 transition-colors duration-500"></div>
      <div className="flex items-center relative z-10">
        <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-dark-700/80 text-blue-600 dark:text-blue-400 mr-4 shadow-sm group-hover:shadow-md transition-shadow">
          <Icon size={24} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
            {isCurrency ? `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : (value || 'N/A')}
          </p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 font-sans transition-colors duration-300">
      {/* Sticky Header with Glassmorphism */}
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
                className="text-gray-900 dark:text-white font-medium relative after:absolute after:bottom-[-1.25rem] after:left-0 after:w-full after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400"
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
        
        {/* Inbox Wrapped Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between text-white shadow-xl shadow-purple-500/20"
        >
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
              <Gift size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-black tracking-tight">Your Inbox Wrapped is Here!</h2>
              <p className="text-purple-100">See your most toxic spending habits and top merchants of the year.</p>
            </div>
          </div>
          <Link 
            to="/wrapped" 
            className="px-6 py-3 bg-white text-purple-700 font-bold rounded-xl hover:bg-gray-100 transition-colors whitespace-nowrap shadow-lg"
          >
            View Wrapped 🎁
          </Link>
        </motion.div>

        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-display font-semibold text-gray-900 dark:text-white tracking-tight"
          >
            Overview
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-3"
          >
            <AnimatePresence>
              {syncMsg && (
                <motion.span 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-sm font-medium text-emerald-600 dark:text-emerald-400 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full"
                >
                  {syncMsg}
                </motion.span>
              )}
            </AnimatePresence>
            <button 
              onClick={exportCharts} 
              className="flex items-center px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors shadow-sm font-medium text-sm"
            >
              <Download size={16} className="mr-2" /> Export
            </button>
            <button 
              onClick={() => syncMutation.mutate()} 
              disabled={syncMutation.isPending} 
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl hover:from-blue-700 hover:to-violet-700 disabled:opacity-50 transition-all shadow-sm font-medium text-sm"
            >
              <RefreshCw size={16} className={`mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'Syncing...' : 'Sync Gmail'}
            </button>
          </motion.div>
        </div>

        {/* Stats Grid */}
        {dashLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="animate-pulse bg-white dark:bg-dark-800 h-28 rounded-2xl border border-gray-100 dark:border-dark-700" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="This Month" value={dashboard?.monthly_expense} icon={TrendingUp} subtitle={`${dashboard?.monthly_growth > 0 ? '+' : ''}${dashboard?.monthly_growth?.toFixed(1) || 0}% vs last month`} delay={0.1} />
            <StatCard title="This Week" value={dashboard?.weekly_expense} icon={Calendar} delay={0.2} />
            <StatCard title="Today's Spend" value={dashboard?.today_expense} icon={DollarSign} delay={0.3} />
            <StatCard title="Avg Daily Spend" value={dashboard?.avg_daily_spend} icon={Activity} delay={0.4} />
            
            <StatCard title="Highest Merchant" value={dashboard?.highest_merchant} icon={ShoppingBag} isCurrency={false} delay={0.5} />
            <StatCard title="Top Category" value={dashboard?.highest_category} icon={Filter} isCurrency={false} delay={0.6} />
            <StatCard title="Total Tracked" value={dashboard?.total_expense} icon={CreditCard} delay={0.7} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <p className="text-blue-100/80 font-medium mb-1 relative z-10 text-sm">InboxSpend Health</p>
              <h3 className="text-2xl font-display font-bold relative z-10">Good Standing</h3>
            </motion.div>
          </div>
        )}

        {/* Charts Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          ref={chartsRef} 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="glass-card p-6 rounded-3xl">
            <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-6">6-Month Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard?.monthly_chart || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1e1e1e' : '#f1f5f9'} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#737373' : '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#737373' : '#64748b', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} dx={-10} />
                  <Tooltip cursor={{ fill: darkMode ? '#141414' : '#f8fafc' }} contentStyle={{ backgroundColor: darkMode ? '#0a0a0a' : '#fff', borderRadius: '12px', border: darkMode ? '1px solid #1e1e1e' : '1px solid #e2e8f0', color: darkMode ? '#f3f4f6' : '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl">
            <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-6">Spend by Category</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dashboard?.category_pie || []} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} stroke="none">
                    {(dashboard?.category_pie || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#0a0a0a' : '#fff', borderRadius: '12px', border: darkMode ? '1px solid #1e1e1e' : '1px solid #e2e8f0', color: darkMode ? '#f3f4f6' : '#0f172a' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: darkMode ? '#a3a3a3' : '#475569' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl">
            <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-6">Recent 4 Weeks</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboard?.weekly_chart || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1e1e1e' : '#f1f5f9'} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#737373' : '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#737373' : '#64748b', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} dx={-10} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#0a0a0a' : '#fff', borderRadius: '12px', border: darkMode ? '1px solid #1e1e1e' : '1px solid #e2e8f0', color: darkMode ? '#f3f4f6' : '#0f172a' }} />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: darkMode ? '#000' : '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl">
            <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-6">Top Merchants</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard?.merchant_chart || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#1e1e1e' : '#f1f5f9'} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#737373' : '#64748b', fontSize: 12 }} />
                  <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#737373' : '#64748b', fontSize: 12 }} width={100} />
                  <Tooltip cursor={{ fill: darkMode ? '#141414' : '#f8fafc' }} contentStyle={{ backgroundColor: darkMode ? '#0a0a0a' : '#fff', borderRadius: '12px', border: darkMode ? '1px solid #1e1e1e' : '1px solid #e2e8f0', color: darkMode ? '#f3f4f6' : '#0f172a' }} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Transactions Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-card rounded-3xl overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-gray-100 dark:border-dark-700 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 bg-white/50 dark:bg-dark-800/50">
            <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-white">Transaction History</h3>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search expenses..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-shadow"
                />
              </div>
              
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-2 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-shadow cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="Food">Food</option>
                <option value="Shopping">Shopping</option>
                <option value="Travel">Travel</option>
                <option value="Bills">Bills</option>
                <option value="Subscriptions">Subscriptions</option>
                <option value="Education">Education</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Others">Others</option>
              </select>

              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-shadow cursor-pointer"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="merchant">Sort by Merchant</option>
                <option value="category">Sort by Category</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-dark-700">
              <thead className="bg-gray-50/50 dark:bg-dark-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Merchant</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-100 dark:divide-dark-700">
                {expLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex justify-center items-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading expenses...</span>
                      </div>
                    </td>
                  </tr>
                ) : !expenses || expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      No expenses found. Adjust filters or sync your Gmail.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp: any, i: number) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      key={exp.id} 
                      className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(exp.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {exp.merchant}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-300 border border-gray-200 dark:border-dark-600">
                          {exp.category || 'Others'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                        ₹{Number(exp.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {exp.email_subject}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
      <ChatPopup />
    </div>
  );
}

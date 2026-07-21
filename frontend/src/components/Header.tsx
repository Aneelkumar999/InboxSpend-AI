import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Repeat, FileText, AlertOctagon, Sun, Moon, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  onLogout?: () => void;
  activePath: string;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode, onLogout, activePath }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass border-b border-gray-200/50 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-8"
        >
          <Link to="/" className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 flex items-center">
            <Activity className="mr-2 text-blue-600 dark:text-blue-400" /> InboxSpend
          </Link>
          <nav className="hidden sm:flex space-x-6">
            <Link 
              to="/" 
              className={`font-medium relative flex items-center transition-colors ${activePath === '/' ? 'text-gray-900 dark:text-white after:absolute after:bottom-[-1.25rem] after:left-0 after:w-full after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/subscriptions" 
              className={`font-medium flex items-center transition-colors ${activePath === '/subscriptions' ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
            >
              <Repeat size={16} className="mr-1.5"/> Subscriptions
            </Link>
            <Link 
              to="/reports" 
              className={`font-medium flex items-center transition-colors ${activePath === '/reports' ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
            >
              <FileText size={16} className="mr-1.5"/> Reports
            </Link>
            <Link 
              to="/junk-fees" 
              className={`font-medium flex items-center transition-colors ${activePath === '/junk-fees' ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
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
          
          {onLogout && (
            <>
              <div className="w-px h-6 bg-gray-200 dark:bg-dark-700 mx-2 hidden sm:block"></div>
              <button onClick={onLogout} className="hidden sm:flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-dark-700 transition-colors">
                <LogOut size={16} className="mr-2" strokeWidth={1.5} /> Logout
              </button>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-700 transition-colors ml-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </motion.div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden border-t border-gray-200/50 dark:border-white/5 bg-white/95 dark:bg-dark-900/95 backdrop-blur-md overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col space-y-4">
              <Link to="/" className={`font-medium py-2 flex items-center ${activePath === '/' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`} onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </Link>
              <Link to="/subscriptions" className={`font-medium py-2 flex items-center ${activePath === '/subscriptions' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`} onClick={() => setMobileMenuOpen(false)}>
                <Repeat size={18} className="mr-3" /> Subscriptions
              </Link>
              <Link to="/reports" className={`font-medium py-2 flex items-center ${activePath === '/reports' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`} onClick={() => setMobileMenuOpen(false)}>
                <FileText size={18} className="mr-3" /> Reports
              </Link>
              <Link to="/junk-fees" className={`font-medium py-2 flex items-center ${activePath === '/junk-fees' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`} onClick={() => setMobileMenuOpen(false)}>
                <AlertOctagon size={18} className="mr-3" /> Junk Fees
              </Link>
              {onLogout && (
                <button onClick={() => { setMobileMenuOpen(false); onLogout(); }} className="text-red-500 font-medium py-2 flex items-center text-left border-t border-gray-100 dark:border-dark-700 pt-4 mt-2">
                  <LogOut size={18} className="mr-3" /> Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

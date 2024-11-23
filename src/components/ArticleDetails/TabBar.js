import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Tooltip from '../common/Tooltip';
import {
  faBook,
  faChartBar,
  faStickyNote,
  faLink,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

const TabBar = ({ tabs, activeTab, setActiveTab }) => {
  const getIcon = (id) => {
    switch (id) {
      case 'content':
        return faBook;
      case 'summary':
        return faInfoCircle;
      case 'notes':
        return faStickyNote;
      case 'related':
        return faLink;
      case 'stats':
        return faChartBar;
      default:
        return faBook;
    }
  };

  return (
    <div className="relative mb-6">
      {/* Background decoration */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gray-200"></div>
      
      {/* Tab list */}
      <div className="flex space-x-1 relative">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <Tooltip 
              key={tab.id}
              title={tab.label}
              placement="top"
            >
              <motion.button
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-4 py-3 rounded-t-lg flex items-center space-x-2
                  transition-colors duration-150 focus:outline-none
                  ${isActive 
                    ? 'text-blue-600 bg-white border-t border-x border-gray-200' 
                    : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
                  }
                `}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <FontAwesomeIcon 
                  icon={getIcon(tab.id)} 
                  className={`text-sm ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                />
                <span className="font-medium text-sm">{tab.label}</span>
                
                {/* Active tab indicator */}
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                    layoutId="activeTabIndicator"
                    initial={false}
                  />
                )}
              </motion.button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default TabBar;

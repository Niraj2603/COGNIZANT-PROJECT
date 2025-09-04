import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Menu, Sun, Moon, ChevronDown, Settings, Download, LogOut } from 'lucide-react';
import styles from './AppHeader.module.css';

const AppHeader = ({ onOpenSettings }) => {
  const { state, actions } = useApp();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeToggle = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    actions.setTheme(newTheme);
  };

  const handleLogout = () => {
    actions.logoutUser();
    setUserMenuOpen(false);
  };

  const handleSettingsClick = () => {
    setUserMenuOpen(false);
    if (onOpenSettings) {
      onOpenSettings();
    }
  };

  const handleExportClick = () => {
    setUserMenuOpen(false);
    // Export current conversation or all conversations
    if (state.conversations && state.conversations.length > 0) {
      const exportData = {
        exportedAt: new Date().toISOString(),
        user: state.currentUser?.username || 'Unknown',
        userRole: state.currentUser?.role || 'Unknown',
        totalConversations: state.conversations.length,
        conversations: state.conversations.map(conv => ({
          id: conv.id,
          title: conv.title,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          messageCount: conv.messages?.length || 0,
          messages: conv.messages?.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          })) || []
        }))
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `ireno-conversations-${timestamp}.json`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      alert(`Conversations exported successfully as ${filename}`);
    } else {
      alert('No conversations to export');
    }
  };

  const getConversationTitle = () => {
    if (state.activeConversation) {
      return state.activeConversation.title || 'New Conversation';
    }
    return 'New Conversation';
  };

  return (
    <header className={styles.appHeader}>
      <div className={styles.headerLeft}>
        <button
          className={styles.sidebarToggle}
          onClick={actions.toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <div className={styles.appLogo}>
          <div className={styles.logoIcon}>⚡</div>
          <span>IRENO Smart Assistant</span>
        </div>
      </div>
      
      <div className={styles.headerCenter}>
        <div className={styles.conversationTitle}>
          {getConversationTitle()}
        </div>
      </div>
      
      <div className={styles.headerRight}>
        <button
          className={`btn btn--secondary ${styles.themeToggle}`}
          onClick={handleThemeToggle}
          title="Toggle Theme"
          aria-label="Toggle theme"
        >
          {state.theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        
        <div className={styles.userMenu} ref={userMenuRef}>
          <button
            className={styles.userButton}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className={styles.userAvatar}>
              {state.currentUser?.avatar || 'U'}
            </div>
            <span className={styles.userName}>
              {state.currentUser?.username || 'User'}
            </span>
            <ChevronDown 
              size={16} 
              className={`${styles.chevron} ${userMenuOpen ? styles.chevronOpen : ''}`}
            />
          </button>
          
          {userMenuOpen && (
            <div className={styles.userDropdown}>
              <button className={styles.dropdownItem} onClick={handleSettingsClick}>
                <Settings size={16} />
                Settings
              </button>
              <button className={styles.dropdownItem} onClick={handleExportClick}>
                <Download size={16} />
                Export Conversations
              </button>
              <button className={styles.dropdownItem} onClick={handleLogout}>
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;

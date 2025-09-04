import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, User, Bell, Palette, Globe, Download, Trash2 } from 'lucide-react';
import styles from './SettingsModal.module.css';

const SettingsModal = ({ isOpen, onClose }) => {
  const { state, actions } = useApp();
  const [activeTab, setActiveTab] = useState('profile');

  if (!isOpen) return null;

  const handleClearAllConversations = () => {
    if (window.confirm('Are you sure you want to delete all conversations? This action cannot be undone.')) {
      // Clear all conversations except create a new empty one
      actions.clearAllConversations();
      onClose();
    }
  };

  const handleExportAllConversations = () => {
    console.log('Export conversations called', { conversations: state.conversations });
    
    if (!state.conversations || state.conversations.length === 0) {
      alert('No conversations to export');
      return;
    }

    try {
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
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Export completed successfully', { filename, conversations: state.conversations.length });
      alert(`Conversations exported successfully as ${filename}`);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export conversations. Please try again.');
    }
  };

  const renderProfileTab = () => (
    <div className={styles.tabContent}>
      <h3>Profile Settings</h3>
      <div className={styles.settingGroup}>
        <label>Username</label>
        <input 
          type="text" 
          value={state.currentUser?.username || ''} 
          disabled 
          className={styles.settingInput}
        />
      </div>
      <div className={styles.settingGroup}>
        <label>Role</label>
        <input 
          type="text" 
          value={state.currentUser?.role || ''} 
          disabled 
          className={styles.settingInput}
        />
      </div>
      <div className={styles.settingGroup}>
        <label>Department</label>
        <input 
          type="text" 
          value={state.currentUser?.department || 'Smart Grid Operations'} 
          disabled 
          className={styles.settingInput}
        />
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className={styles.tabContent}>
      <h3>Appearance</h3>
      <div className={styles.settingGroup}>
        <label>Theme</label>
        <div className={styles.themeSelector}>
          <button 
            className={`${styles.themeButton} ${state.theme === 'light' ? styles.active : ''}`}
            onClick={() => actions.setTheme('light')}
          >
            Light
          </button>
          <button 
            className={`${styles.themeButton} ${state.theme === 'dark' ? styles.active : ''}`}
            onClick={() => actions.setTheme('dark')}
          >
            Dark
          </button>
        </div>
      </div>
      <div className={styles.settingGroup}>
        <label>Sidebar</label>
        <div className={styles.toggleGroup}>
          <label className={styles.toggleLabel}>
            <input 
              type="checkbox" 
              checked={state.sidebarOpen} 
              onChange={actions.toggleSidebar}
            />
            <span className={styles.toggleSlider}></span>
            Show sidebar by default
          </label>
        </div>
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className={styles.tabContent}>
      <h3>Data Management</h3>
      <div className={styles.settingGroup}>
        <label>Conversations</label>
        <p className={styles.settingDescription}>
          You have {state.conversations?.length || 0} conversations saved.
        </p>
        <div className={styles.buttonGroup}>
          <button 
            className={styles.exportButton}
            onClick={handleExportAllConversations}
          >
            <Download size={16} />
            Export All Conversations
          </button>
          <button 
            className={styles.dangerButton}
            onClick={handleClearAllConversations}
          >
            <Trash2 size={16} />
            Clear All Conversations
          </button>
        </div>
      </div>
      <div className={styles.settingGroup}>
        <label>Storage</label>
        <p className={styles.settingDescription}>
          Data is stored locally in your browser. Export regularly to backup your conversations.
        </p>
      </div>
    </div>
  );

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data', icon: Download }
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Settings</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.tabList}>
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <IconComponent size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          
          <div className={styles.tabPanel}>
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'appearance' && renderAppearanceTab()}
            {activeTab === 'data' && renderDataTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import AppHeader from '../components/AppHeader';
import ConversationSidebar from '../components/ConversationSidebar';
import MainChat from '../components/MainChat';
import AdminDashboard from './AdminDashboard';
import SettingsModal from '../components/SettingsModal';
import styles from './MainApp.module.css';

const MainApp = () => {
  const { state } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleOpenSettings = () => setSettingsOpen(true);
  const handleCloseSettings = () => setSettingsOpen(false);

  const [showAdmin, setShowAdmin] = useState(false);
  const isAdmin = state.currentUser?.role === 'admin';

  return (
    <div className={styles.appContainer}>
      <AppHeader onOpenSettings={handleOpenSettings} />
      <div className={styles.appBody}>
        <ConversationSidebar />
        {isAdmin && (
          <button style={{position:'absolute',top:10,right:10,zIndex:10}} onClick={()=>setShowAdmin(v=>!v)}>
            {showAdmin ? 'Hide Admin Dashboard' : 'Show Admin Dashboard'}
          </button>
        )}
        {showAdmin && isAdmin ? <AdminDashboard /> : <MainChat />}
      </div>
      <SettingsModal 
        isOpen={settingsOpen} 
        onClose={handleCloseSettings} 
      />
    </div>
  );
};

export default MainApp;

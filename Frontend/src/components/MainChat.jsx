import React from 'react';
import { useApp } from '../context/AppContext';
import WelcomeScreen from './WelcomeScreen';
import ChatArea from './ChatArea';
import ChatInput from './ChatInput';
import styles from './MainChat.module.css';

const MainChat = () => {
  const { state } = useApp();

  return (
    <main className={styles.mainChat}>
      {!state.activeConversation ? (
        <WelcomeScreen />
      ) : (
        <>
          <ChatArea />
          <ChatInput />
        </>
      )}
    </main>
  );
};

export default MainChat;

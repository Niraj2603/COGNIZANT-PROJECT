import React from 'react';
import { useApp } from '../context/AppContext';
import styles from './WelcomeScreen.module.css';

const WelcomeScreen = () => {
  const { state, actions } = useApp();

  const handleQuickPrompt = (prompt) => {
    // Create a new conversation with the quick prompt
    const newConversation = {
      id: Date.now().toString(),
      title: prompt.title,
      messages: [
        {
          id: Date.now().toString(),
          role: 'user',
          content: prompt.prompt,
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: false
    };
    
    actions.addConversation(newConversation);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'll help you with "${prompt.title}". Let me analyze the current data and provide you with the information you need.`,
        timestamp: new Date()
      };
      
      actions.addMessage(newConversation.id, aiResponse);
    }, 1000);
  };

  return (
    <div className={styles.welcomeScreen}>
      <div className={styles.welcomeContent}>
        <div className={styles.welcomeLogo}>
          <div className={styles.logoIcon}>⚡</div>
          <h1>IRENO Smart Assistant</h1>
        </div>
        <p className={styles.welcomeDescription}>
          Your AI-powered utility management companion
        </p>
        
        <div className={styles.quickPromptsGrid}>
          <h3>Quick Start Prompts</h3>
          <div className={styles.promptsGrid}>
            {state.quickPrompts.map((prompt, index) => (
              <button
                key={index}
                className={styles.promptCard}
                onClick={() => handleQuickPrompt(prompt)}
              >
                <div className={styles.promptTitle}>{prompt.title}</div>
                <div className={styles.promptDescription}>{prompt.description}</div>
              </button>
            ))}
          </div>
        </div>
        
        <div className={styles.systemStatusOverview}>
          <h3>System Status</h3>
          <div className={styles.statusIndicators}>
            <div className={styles.statusItem}>
              <span className={`${styles.statusDot} ${styles.good}`}></span>
              <span>Overall Health: Good</span>
            </div>
            <div className={styles.statusItem}>
              <span className={`${styles.statusDot} ${styles.warning}`}></span>
              <span>Active Alerts: 3</span>
            </div>
            <div className={styles.statusItem}>
              <span className={`${styles.statusDot} ${styles.good}`}></span>
              <span>System Load: 87%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;

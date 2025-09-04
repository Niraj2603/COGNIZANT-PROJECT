import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ThumbsUp, ThumbsDown, Copy, Check, Trash2, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DataChart from './DataChart';
import styles from './ChatArea.module.css';

const ChatArea = () => {
  const { state, actions } = useApp();
  // Fetch chat history from backend when user or activeConversation changes
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!state.currentUser) return;
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/chat/history?username=${encodeURIComponent(state.currentUser.username)}`);
        if (res.ok) {
          const data = await res.json();
          // Convert backend messages to frontend format
          const messages = (data.history || []).map(msg => ({
            id: msg.id.toString(),
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.message,
            timestamp: msg.timestamp
          }));
          // If there is an active conversation, update its messages
          if (state.activeConversation) {
            actions.setActiveConversation({ ...state.activeConversation, messages });
          }
        }
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
      }
    };
    fetchChatHistory();
    // Only run when user or activeConversation changes
  }, [state.currentUser, state.activeConversation?.id]);
  const messagesEndRef = useRef(null);
  const [chartData, setChartData] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [likedMessages, setLikedMessages] = useState(new Set());
  const [dislikedMessages, setDislikedMessages] = useState(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.activeConversation?.messages]);

  // Action handlers for message interactions
  const handleLike = (messageId) => {
    const newLiked = new Set(likedMessages);
    const newDisliked = new Set(dislikedMessages);
    
    if (likedMessages.has(messageId)) {
      // Remove like if already liked
      newLiked.delete(messageId);
    } else {
      // Add like and remove dislike if exists
      newLiked.add(messageId);
      newDisliked.delete(messageId);
    }
    
    setLikedMessages(newLiked);
    setDislikedMessages(newDisliked);
    
    // Here you could send feedback to backend
    console.log('Liked message:', messageId);
  };

  const handleDislike = (messageId) => {
    const newLiked = new Set(likedMessages);
    const newDisliked = new Set(dislikedMessages);
    
    if (dislikedMessages.has(messageId)) {
      // Remove dislike if already disliked
      newDisliked.delete(messageId);
    } else {
      // Add dislike and remove like if exists
      newDisliked.add(messageId);
      newLiked.delete(messageId);
    }
    
    setLikedMessages(newLiked);
    setDislikedMessages(newDisliked);
    
    // Here you could send feedback to backend
    console.log('Disliked message:', messageId);
  };

  const handleCopy = async (messageContent, messageId) => {
    try {
      // Extract plain text from markdown
      const plainText = messageContent.replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
                                   .replace(/\*(.*?)\*/g, '$1')     // Remove italic
                                   .replace(/`(.*?)`/g, '$1')       // Remove inline code
                                   .replace(/#{1,6}\s/g, '')        // Remove headers
                                   .replace(/\[CHART\]/g, '')       // Remove chart markers
                                   .trim();
      
      await navigator.clipboard.writeText(plainText);
      setCopiedMessageId(messageId);
      
      // Reset copy indicator after 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
      
      console.log('Copied message:', messageId);
    } catch (err) {
      console.error('Failed to copy message:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = messageContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };


  // Export a single message as txt or json
  const handleExport = (message) => {
    // Ask user for format
    const format = window.prompt('Export as "txt" or "json"?', 'txt');
    if (!format) return;
    let blob, filename;
    if (format.toLowerCase() === 'json') {
      blob = new Blob([JSON.stringify(message, null, 2)], { type: 'application/json' });
      filename = `message-${message.id}.json`;
    } else {
      blob = new Blob([message.content], { type: 'text/plain' });
      filename = `message-${message.id}.txt`;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Delete a single message from the conversation (frontend only)
  const handleDelete = (messageId) => {
    if (!state.activeConversation) return;
    const updatedMessages = state.activeConversation.messages.filter(msg => msg.id !== messageId);
    actions.setActiveConversation({ ...state.activeConversation, messages: updatedMessages });
  };

  // Component for message action buttons
  const MessageActions = ({ message }) => {
    // Show actions for all messages (user and assistant)
    const isLiked = likedMessages.has(message.id);
    const isDisliked = dislikedMessages.has(message.id);
    const isCopied = copiedMessageId === message.id;
    return (
      <div className={styles.messageActions}>
        <button
          className={`${styles.actionButton} ${isLiked ? styles.actionButtonActive : ''}`}
          onClick={() => handleLike(message.id)}
          title="Good response"
          aria-label="Like this response"
        >
          <ThumbsUp size={14} />
        </button>
        <button
          className={`${styles.actionButton} ${isDisliked ? styles.actionButtonActive : ''}`}
          onClick={() => handleDislike(message.id)}
          title="Bad response"
          aria-label="Dislike this response"
        >
          <ThumbsDown size={14} />
        </button>
        <button
          className={styles.actionButton}
          onClick={() => handleCopy(message.content, message.id)}
          title={isCopied ? "Copied!" : "Copy"}
          aria-label={isCopied ? "Response copied to clipboard" : "Copy response to clipboard"}
        >
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
        </button>
        <button
          className={styles.actionButton}
          onClick={() => handleExport(message)}
          title="Export message"
          aria-label="Export message"
        >
          <Download size={14} />
        </button>
        <button
          className={styles.actionButton}
          onClick={() => handleDelete(message.id)}
          title="Delete message"
          aria-label="Delete message"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  };
  const fetchChartData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/charts');
      if (response.ok) {
        const data = await response.json();
        setChartData(data);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  // Function to check if message contains chart trigger and render charts
  const renderMessageContent = (message) => {
    const content = message.content;
    const hasChartTrigger = content.includes('[CHART]');
    
    if (hasChartTrigger && message.role === 'assistant') {
      // Fetch chart data if we haven't already
      if (!chartData) {
        fetchChartData();
      }
      
      // Remove [CHART] from content for display
      const cleanContent = content.replace(/\[CHART\]/g, '').trim();
      
      return (
        <>
          <div className={styles.messageText}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom component styling with reduced spacing
                p: ({children}) => <p style={{margin: '4px 0', lineHeight: '1.4'}}>{children}</p>,
                h1: ({children}) => <h1 style={{margin: '6px 0 4px 0', fontSize: '18px', fontWeight: '600'}}>{children}</h1>,
                h2: ({children}) => <h2 style={{margin: '6px 0 4px 0', fontSize: '16px', fontWeight: '600'}}>{children}</h2>,
                h3: ({children}) => <h3 style={{margin: '4px 0 2px 0', fontSize: '14px', fontWeight: '600'}}>{children}</h3>,
                strong: ({children}) => <strong style={{fontWeight: '600', color: 'var(--color-text)'}}>{children}</strong>,
                em: ({children}) => <em style={{fontStyle: 'italic'}}>{children}</em>,
                ul: ({children}) => <ul style={{margin: '4px 0', paddingLeft: '16px'}}>{children}</ul>,
                ol: ({children}) => <ol style={{margin: '4px 0', paddingLeft: '16px'}}>{children}</ol>,
                li: ({children}) => <li style={{margin: '2px 0', lineHeight: '1.4'}}>{children}</li>,
                code: ({inline, children}) => 
                  inline ? 
                    <code style={{
                      backgroundColor: 'var(--color-bg-1)', 
                      border: '1px solid var(--color-border)', 
                      borderRadius: '4px', 
                      padding: '1px 3px', 
                      fontFamily: 'var(--font-family-mono)', 
                      fontSize: '12px'
                    }}>{children}</code> :
                    <pre style={{
                      backgroundColor: 'var(--color-bg-1)', 
                      border: '1px solid var(--color-border)', 
                      borderRadius: '6px', 
                      padding: '8px', 
                      margin: '4px 0', 
                      overflow: 'auto', 
                      fontFamily: 'var(--font-family-mono)', 
                      fontSize: '12px'
                    }}><code>{children}</code></pre>,
                blockquote: ({children}) => 
                  <blockquote style={{
                    borderLeft: '3px solid var(--color-primary)', 
                    margin: '4px 0', 
                    paddingLeft: '8px', 
                    color: 'var(--color-text-secondary)', 
                    fontStyle: 'italic'
                  }}>{children}</blockquote>
              }}
            >
              {cleanContent}
            </ReactMarkdown>
          </div>
          {chartData && chartData.chart_data && (
            <DataChart 
              chartData={chartData.chart_data}
              title={chartData.title || "Collector Status Overview"}
              type={chartData.chart_type || "bar"}
            />
          )}
        </>
      );
    }
    
    return (
      <div className={styles.messageText}>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom component styling with reduced spacing
            p: ({children}) => <p style={{margin: '4px 0', lineHeight: '1.4'}}>{children}</p>,
            h1: ({children}) => <h1 style={{margin: '6px 0 4px 0', fontSize: '18px', fontWeight: '600'}}>{children}</h1>,
            h2: ({children}) => <h2 style={{margin: '6px 0 4px 0', fontSize: '16px', fontWeight: '600'}}>{children}</h2>,
            h3: ({children}) => <h3 style={{margin: '4px 0 2px 0', fontSize: '14px', fontWeight: '600'}}>{children}</h3>,
            strong: ({children}) => <strong style={{fontWeight: '600', color: 'var(--color-text)'}}>{children}</strong>,
            em: ({children}) => <em style={{fontStyle: 'italic'}}>{children}</em>,
            ul: ({children}) => <ul style={{margin: '4px 0', paddingLeft: '16px'}}>{children}</ul>,
            ol: ({children}) => <ol style={{margin: '4px 0', paddingLeft: '16px'}}>{children}</ol>,
            li: ({children}) => <li style={{margin: '2px 0', lineHeight: '1.4'}}>{children}</li>,
            code: ({inline, children}) => 
              inline ? 
                <code style={{
                  backgroundColor: 'var(--color-bg-1)', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: '4px', 
                  padding: '1px 3px', 
                  fontFamily: 'var(--font-family-mono)', 
                  fontSize: '12px'
                }}>{children}</code> :
                <pre style={{
                  backgroundColor: 'var(--color-bg-1)', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: '6px', 
                  padding: '8px', 
                  margin: '4px 0', 
                  overflow: 'auto', 
                  fontFamily: 'var(--font-family-mono)', 
                  fontSize: '12px'
                }}><code>{children}</code></pre>,
            blockquote: ({children}) => 
              <blockquote style={{
                borderLeft: '3px solid var(--color-primary)', 
                margin: '4px 0', 
                paddingLeft: '8px', 
                color: 'var(--color-text-secondary)', 
                fontStyle: 'italic'
              }}>{children}</blockquote>
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  if (!state.activeConversation) {
    return null;
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={styles.chatArea}>
      <div className={styles.chatMessages}>
        {state.activeConversation.messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.messageContainer} ${
              message.role === 'user' ? styles.userMessage : styles.assistantMessage
            }`}
          >
            <div className={styles.messageAvatar}>
              {message.role === 'user' ? (
                <div className={styles.userAvatar}>
                  {state.currentUser?.avatar || 'U'}
                </div>
              ) : (
                <div className={styles.assistantAvatar}>⚡</div>
              )}
            </div>
            
            <div className={styles.messageContent}>
              <div className={styles.messageHeader}>
                <span className={styles.messageSender}>
                  {message.role === 'user' 
                    ? state.currentUser?.username || 'You'
                    : 'IRENO Assistant'
                  }
                </span>
                <span className={styles.messageTime}>
                  {formatTime(message.timestamp)}
                </span>
              </div>
              
              {renderMessageContent(message)}
              <MessageActions message={message} />
            </div>
          </div>
        ))}
        
        {state.isTyping && (
          <div className={`${styles.messageContainer} ${styles.assistantMessage}`}>
            <div className={styles.messageAvatar}>
              <div className={styles.assistantAvatar}>⚡</div>
            </div>
            <div className={styles.messageContent}>
              <div className={styles.messageHeader}>
                <span className={styles.messageSender}>IRENO Assistant</span>
              </div>
              <div className={styles.typingIndicator}>
                <div className={styles.typingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatArea;

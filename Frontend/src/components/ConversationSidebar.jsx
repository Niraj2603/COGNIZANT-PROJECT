import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, Pin, Calendar, CalendarDays, Folder, Trash2, MoreHorizontal } from 'lucide-react';
import styles from './ConversationSidebar.module.css';

const ConversationSidebar = () => {
  const { state, actions } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const handleNewChat = () => {
    const newConversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: false
    };
    actions.addConversation(newConversation);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredConversations = state.conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categorizeConversations = (conversations) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    return {
      pinned: conversations.filter(conv => conv.pinned),
      today: conversations.filter(conv => {
        const convDate = new Date(conv.updatedAt);
        return convDate >= today && !conv.pinned;
      }),
      yesterday: conversations.filter(conv => {
        const convDate = new Date(conv.updatedAt);
        return convDate >= yesterday && convDate < today && !conv.pinned;
      }),
      older: conversations.filter(conv => {
        const convDate = new Date(conv.updatedAt);
        return convDate < yesterday && !conv.pinned;
      })
    };
  };

  const categorizedConversations = categorizeConversations(filteredConversations);

  const ConversationItem = ({ conversation }) => {
    const isActive = state.activeConversation?.id === conversation.id;
    
    const handleClick = () => {
      actions.setActiveConversation(conversation);
    };

    const handleDelete = (e) => {
      e.stopPropagation();
      actions.deleteConversation(conversation.id);
    };

    return (
      <div
        className={`${styles.conversationItem} ${isActive ? styles.active : ''}`}
        onClick={handleClick}
      >
        <div className={styles.conversationContent}>
          <div className={styles.conversationTitle}>
            {conversation.title}
          </div>
          <div className={styles.conversationPreview}>
            {conversation.messages.length > 0 
              ? conversation.messages[conversation.messages.length - 1].content.substring(0, 50) + '...'
              : 'No messages yet'
            }
          </div>
        </div>
        <div className={styles.conversationActions}>
          <button
            className={styles.actionButton}
            onClick={handleDelete}
            aria-label="Delete conversation"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  const FolderSection = ({ title, icon: Icon, conversations, emptyMessage }) => {
    if (conversations.length === 0) return null;

    return (
      <div className={styles.folderSection}>
        <div className={styles.folderHeader}>
          <Icon size={16} className={styles.folderIcon} />
          <span>{title}</span>
          <span className={styles.count}>({conversations.length})</span>
        </div>
        <div className={styles.conversationList}>
          {conversations.map(conversation => (
            <ConversationItem key={conversation.id} conversation={conversation} />
          ))}
        </div>
      </div>
    );
  };

  if (!state.sidebarOpen) {
    return null;
  }

  return (
    <aside className={styles.conversationSidebar}>
      <div className={styles.sidebarHeader}>
        <button className="btn btn--primary" onClick={handleNewChat}>
          <Plus size={16} />
          New Chat
        </button>
        
        <div className={styles.conversationSearch}>
          <div className={styles.searchContainer}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>
      
      <div className={styles.sidebarContent}>
        <div className={styles.conversationFolders}>
          <FolderSection
            title="Pinned"
            icon={Pin}
            conversations={categorizedConversations.pinned}
            emptyMessage="No pinned conversations"
          />
          
          <FolderSection
            title="Today"
            icon={Calendar}
            conversations={categorizedConversations.today}
            emptyMessage="No conversations today"
          />
          
          <FolderSection
            title="Yesterday"
            icon={CalendarDays}
            conversations={categorizedConversations.yesterday}
            emptyMessage="No conversations yesterday"
          />
          
          <FolderSection
            title="Older"
            icon={Folder}
            conversations={categorizedConversations.older}
            emptyMessage="No older conversations"
          />
          
          {filteredConversations.length === 0 && searchQuery && (
            <div className={styles.emptyState}>
              <Search size={32} />
              <p>No conversations found for "{searchQuery}"</p>
            </div>
          )}
          
          {state.conversations.length === 0 && !searchQuery && (
            <div className={styles.emptyState}>
              <Plus size={32} />
              <p>No conversations yet</p>
              <p>Start a new chat to begin!</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ConversationSidebar;

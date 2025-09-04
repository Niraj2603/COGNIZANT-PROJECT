import React, { createContext, useContext, useReducer, useEffect } from 'react';

// localStorage persistence utilities
const STORAGE_KEY = 'ireno-chat-state';

/**
 * Checks if localStorage is available and functional
 * @returns {boolean} - True if localStorage is available
 */
function isLocalStorageAvailable() {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Safely saves state to localStorage with error handling
 * @param {Object} state - The state object to save
 */
function saveStateToStorage(state) {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return;
  }

  try {
    const stateToStore = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, stateToStore);
  } catch (error) {
    // Handle storage errors (e.g., storage quota exceeded, private browsing mode)
    console.warn('Failed to save state to localStorage:', error);
    
    // Attempt to clear some space and retry once
    if (error.name === 'QuotaExceededError') {
      try {
        // Clear old theme setting (now managed in main state)
        localStorage.removeItem('ireno-theme');
        localStorage.setItem(STORAGE_KEY, stateToStore);
        console.info('Retried localStorage save after clearing space');
      } catch (retryError) {
        console.error('Failed to save state even after clearing space:', retryError);
      }
    }
  }
}

/**
 * Initializer function for useReducer that hydrates state from localStorage
 * @param {Object} defaultState - The default initial state to use if localStorage is empty or invalid
 * @returns {Object} - The hydrated state or default state
 */
function initializeStateFromStorage(defaultState) {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available, using default state');
    return defaultState;
  }

  try {
    const storedState = localStorage.getItem(STORAGE_KEY);
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      
      // Validate that the parsed state is an object
      if (typeof parsedState !== 'object' || parsedState === null) {
        throw new Error('Invalid state format in localStorage');
      }
      
      // Merge with default state to ensure all required properties exist
      // This handles cases where the stored state might be missing new properties
      const hydratedState = {
        ...defaultState,
        ...parsedState,
        // Preserve critical default values that shouldn't be overridden
        userRoles: defaultState.userRoles,
        quickPrompts: defaultState.quickPrompts
      };
      
      console.info('State successfully loaded from localStorage');
      return hydratedState;
    }
    return defaultState;
  } catch (error) {
    // Handle corrupted data or JSON parse errors
    console.warn('Failed to load state from localStorage:', error);
    
    // Clear corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.info('Cleared corrupted localStorage data');
    } catch (clearError) {
      console.warn('Failed to clear corrupted localStorage data:', clearError);
    }
    
    return defaultState;
  }
}

// Initial state
const initialState = {
  currentUser: null,
  conversations: [],
  activeConversation: null,
  isTyping: false,
  theme: 'light',
  sidebarOpen: true,
  userRoles: [
    {
      id: "field_technician",
      name: "Field Technician",
      description: "Real-time fault detection and resolution",
      color: "#10B981"
    },
    {
      id: "command_center",
      name: "Command Center Operator", 
      description: "Situational awareness and operational control",
      color: "#3B82F6"
    },
    {
      id: "senior_leadership",
      name: "Senior Leadership",
      description: "Strategic insights and performance monitoring",
      color: "#8B5CF6"
    }
  ],
  quickPrompts: [
    {
      title: "System Status Check",
      description: "Get current status of all renewable energy sources",
      prompt: "Check system status for all renewable energy sources"
    },
    {
      title: "Performance Report",
      description: "Generate monthly performance analytics",
      prompt: "Generate monthly performance report"
    },
    {
      title: "Active Alerts",
      description: "Show current active alerts and warnings",
      prompt: "What are the current active alerts?"
    },
    {
      title: "Maintenance Schedule",
      description: "View maintenance schedules for this week",
      prompt: "Show me maintenance schedules for this week"
    },
    {
      title: "Efficiency Analysis",
      description: "Analyze power generation efficiency trends",
      prompt: "Analyze power generation efficiency trends"
    },
    {
      title: "Compliance Report",
      description: "Create regulatory compliance report",
      prompt: "Create compliance report for regulatory submission"
    },
    {
      title: "Fault Detection",
      description: "Check fault detection logs for last 24 hours",
      prompt: "Check fault detection logs for last 24 hours"
    },
    {
      title: "Grid Load",
      description: "Show current grid load distribution",
      prompt: "What's the current grid load distribution?"
    }
  ]
};

// Action types
const ActionTypes = {
  SET_USER: 'SET_USER',
  LOGOUT_USER: 'LOGOUT_USER',
  SET_THEME: 'SET_THEME',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  ADD_CONVERSATION: 'ADD_CONVERSATION',
  SET_ACTIVE_CONVERSATION: 'SET_ACTIVE_CONVERSATION',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_TYPING: 'SET_TYPING',
  DELETE_CONVERSATION: 'DELETE_CONVERSATION',
  UPDATE_CONVERSATION: 'UPDATE_CONVERSATION',
  CLEAR_ALL_CONVERSATIONS: 'CLEAR_ALL_CONVERSATIONS'
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return {
        ...state,
        currentUser: action.payload
      };
    
    case ActionTypes.LOGOUT_USER:
      return {
        ...state,
        currentUser: null,
        conversations: [],
        activeConversation: null
      };
    
    case ActionTypes.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };
    
    case ActionTypes.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };
    
    case ActionTypes.ADD_CONVERSATION:
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
        activeConversation: action.payload
      };
    
    case ActionTypes.SET_ACTIVE_CONVERSATION:
      return {
        ...state,
        activeConversation: action.payload
      };
    
    case ActionTypes.ADD_MESSAGE:
      const updatedConversations = state.conversations.map(conv => 
        conv.id === action.payload.conversationId 
          ? { ...conv, messages: [...conv.messages, action.payload.message] }
          : conv
      );
      
      const updatedActiveConv = state.activeConversation?.id === action.payload.conversationId
        ? { ...state.activeConversation, messages: [...state.activeConversation.messages, action.payload.message] }
        : state.activeConversation;
      
      return {
        ...state,
        conversations: updatedConversations,
        activeConversation: updatedActiveConv
      };
    
    case ActionTypes.SET_TYPING:
      return {
        ...state,
        isTyping: action.payload
      };
    
    case ActionTypes.DELETE_CONVERSATION:
      const filteredConversations = state.conversations.filter(conv => conv.id !== action.payload);
      return {
        ...state,
        conversations: filteredConversations,
        activeConversation: state.activeConversation?.id === action.payload ? null : state.activeConversation
      };
    
    case ActionTypes.UPDATE_CONVERSATION:
      const updated = state.conversations.map(conv => 
        conv.id === action.payload.id ? { ...conv, ...action.payload.updates } : conv
      );
      return {
        ...state,
        conversations: updated
      };
    
    case ActionTypes.CLEAR_ALL_CONVERSATIONS:
      return {
        ...state,
        conversations: [],
        activeConversation: null
      };
    
    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Context provider component
export function AppProvider({ children }) {
  // Initialize state with localStorage data using initializer function
  const [state, dispatch] = useReducer(appReducer, initialState, initializeStateFromStorage);

  // Automatic state persistence on every state change
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Action creators
  const actions = {
    setUser: (user) => dispatch({ type: ActionTypes.SET_USER, payload: user }),
    logoutUser: () => dispatch({ type: ActionTypes.LOGOUT_USER }),
    setTheme: (theme) => dispatch({ type: ActionTypes.SET_THEME, payload: theme }),
    toggleSidebar: () => dispatch({ type: ActionTypes.TOGGLE_SIDEBAR }),
    addConversation: (conversation) => dispatch({ type: ActionTypes.ADD_CONVERSATION, payload: conversation }),
    setActiveConversation: (conversation) => dispatch({ type: ActionTypes.SET_ACTIVE_CONVERSATION, payload: conversation }),
    addMessage: (conversationId, message) => dispatch({ 
      type: ActionTypes.ADD_MESSAGE, 
      payload: { conversationId, message } 
    }),
    setTyping: (isTyping) => dispatch({ type: ActionTypes.SET_TYPING, payload: isTyping }),
    deleteConversation: (conversationId) => dispatch({ type: ActionTypes.DELETE_CONVERSATION, payload: conversationId }),
    updateConversation: (id, updates) => dispatch({ 
      type: ActionTypes.UPDATE_CONVERSATION, 
      payload: { id, updates } 
    }),
    clearAllConversations: () => dispatch({ type: ActionTypes.CLEAR_ALL_CONVERSATIONS }),
    // Utility function to clear all persisted data
    clearPersistedData: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
        console.info('Cleared all persisted application data');
      } catch (error) {
        console.warn('Failed to clear persisted data:', error);
      }
    }
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the app context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export { ActionTypes };

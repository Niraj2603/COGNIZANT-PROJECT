import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MainApp from './pages/MainApp';


function AppContent() {
  const { state, actions } = useApp();
  const [showSignup, setShowSignup] = React.useState(false);

  const handleLogin = (user) => {
    actions.setUser(user);
  };


  const [signupSuccess, setSignupSuccess] = React.useState(false);
  const handleSignup = () => {
    setSignupSuccess(true);
    setShowSignup(false);
  };


  if (!state.currentUser) {
    return showSignup ? (
      <SignupPage onSignup={handleSignup} onSwitchToLogin={() => setShowSignup(false)} />
    ) : (
      <>
        {signupSuccess && (
          <div style={{ color: 'green', textAlign: 'center', margin: '1rem 0' }}>
            Signup successful! Please log in.
          </div>
        )}
        <LoginPage onLogin={handleLogin} onSwitchToSignup={() => { setShowSignup(true); setSignupSuccess(false); }} />
      </>
    );
  }

  return <MainApp />;
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;

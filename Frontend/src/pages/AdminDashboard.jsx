import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

const AdminDashboard = () => {
  const { state } = useApp();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = state.currentUser?.token || localStorage.getItem('jwt_token');
      try {
        const res = await fetch('http://127.0.0.1:5000/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Not authorized or server error');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchDashboard();
  }, [state.currentUser]);

  if (error) return <div style={{color:'red'}}>Admin Dashboard Error: {error}</div>;
  if (!stats) return <div>Loading admin dashboard...</div>;

  return (
    <div style={{padding:'2rem'}}>
      <h2>Admin Dashboard</h2>
      <ul>
        <li><b>Total Users:</b> {stats.user_count}</li>
        <li><b>Total Chats:</b> {stats.chat_count}</li>
        <li><b>Total Logs:</b> {stats.log_count}</li>
      </ul>
      <div style={{marginTop:'2rem'}}>
        <ResetMemoryButton />
        <DeleteUserForm />
      </div>
    </div>
  );
};

const ResetMemoryButton = () => {
  const { state } = useApp();
  const [msg, setMsg] = useState('');
  const handleReset = async () => {
    const token = state.currentUser?.token || localStorage.getItem('jwt_token');
    setMsg('');
    try {
      const res = await fetch('http://127.0.0.1:5000/api/reset-memory', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMsg(data.message || data.status);
    } catch (err) {
      setMsg('Error: ' + err.message);
    }
  };
  return (
    <div style={{marginBottom:'1rem'}}>
      <button onClick={handleReset}>Reset Memory (Admin Only)</button>
      {msg && <div>{msg}</div>}
    </div>
  );
};

const DeleteUserForm = () => {
  const { state } = useApp();
  const [username, setUsername] = useState('');
  const [msg, setMsg] = useState('');
  const handleDelete = async (e) => {
    e.preventDefault();
    const token = state.currentUser?.token || localStorage.getItem('jwt_token');
    setMsg('');
    try {
      const res = await fetch('http://127.0.0.1:5000/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      setMsg(data.message);
    } catch (err) {
      setMsg('Error: ' + err.message);
    }
  };
  return (
    <form onSubmit={handleDelete} style={{marginTop:'1rem'}}>
      <label>
        Delete User (Admin Only):
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
      </label>
      <button type="submit">Delete</button>
      {msg && <div>{msg}</div>}
    </form>
  );
};

export default AdminDashboard;

'use client';

import { useState, useEffect } from 'react';

interface EmailNotification {
  id: string;
  from: string;
  subject: string;
  timestamp: string;
  preview: string;
}

export default function Home() {
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [config, setConfig] = useState({
    email: '',
    password: '',
    imapHost: 'imap.gmail.com',
    imapPort: '993',
    notificationMethod: 'browser'
  });
  const [error, setError] = useState('');
  const [lastCheck, setLastCheck] = useState<string>('');

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(checkForEmails, 30000);
      checkForEmails();
      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  const checkForEmails = async () => {
    try {
      const response = await fetch('/api/check-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to check emails');
        return;
      }

      setLastCheck(new Date().toLocaleTimeString());
      setError('');

      if (data.newEmails && data.newEmails.length > 0) {
        setNotifications(prev => [...data.newEmails, ...prev]);

        if (config.notificationMethod === 'browser' && 'Notification' in window) {
          data.newEmails.forEach((email: EmailNotification) => {
            if (Notification.permission === 'granted') {
              new Notification('New Email', {
                body: `From: ${email.from}\n${email.subject}`,
                icon: '/email-icon.png'
              });
            }
          });
        }
      }
    } catch (err) {
      setError('Network error checking emails');
      console.error(err);
    }
  };

  const startMonitoring = async () => {
    if (!config.email || !config.password) {
      setError('Please enter email and password');
      return;
    }

    if (config.notificationMethod === 'browser' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Browser notifications not allowed');
        return;
      }
    }

    setIsMonitoring(true);
    setError('');
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px', color: 'white' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '10px', fontWeight: 'bold' }}>📧 Email Notification Agent</h1>
          <p style={{ fontSize: '18px', opacity: 0.9 }}>Real-time email monitoring and notifications</p>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '30px', marginBottom: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Configuration</h2>

          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#555' }}>Email Address</label>
              <input
                type="email"
                value={config.email}
                onChange={(e) => setConfig({...config, email: e.target.value})}
                disabled={isMonitoring}
                placeholder="your.email@gmail.com"
                style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#555' }}>Password / App Password</label>
              <input
                type="password"
                value={config.password}
                onChange={(e) => setConfig({...config, password: e.target.value})}
                disabled={isMonitoring}
                placeholder="••••••••••••••••"
                style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#555' }}>IMAP Host</label>
                <input
                  type="text"
                  value={config.imapHost}
                  onChange={(e) => setConfig({...config, imapHost: e.target.value})}
                  disabled={isMonitoring}
                  style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#555' }}>Port</label>
                <input
                  type="text"
                  value={config.imapPort}
                  onChange={(e) => setConfig({...config, imapPort: e.target.value})}
                  disabled={isMonitoring}
                  style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#555' }}>Notification Method</label>
              <select
                value={config.notificationMethod}
                onChange={(e) => setConfig({...config, notificationMethod: e.target.value})}
                disabled={isMonitoring}
                style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
              >
                <option value="browser">Browser Notifications</option>
                <option value="dashboard">Dashboard Only</option>
              </select>
            </div>
          </div>

          {error && (
            <div style={{ marginTop: '15px', padding: '12px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c00' }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            {!isMonitoring ? (
              <button
                onClick={startMonitoring}
                style={{ padding: '14px 28px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}
              >
                🚀 Start Monitoring
              </button>
            ) : (
              <button
                onClick={stopMonitoring}
                style={{ padding: '14px 28px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}
              >
                ⏸️ Stop Monitoring
              </button>
            )}
            {isMonitoring && lastCheck && (
              <span style={{ color: '#666', fontSize: '14px' }}>Last checked: {lastCheck}</span>
            )}
          </div>

          {isMonitoring && (
            <div style={{ marginTop: '15px', padding: '12px', background: '#e7f5ff', border: '1px solid #339af0', borderRadius: '8px', color: '#1971c2' }}>
              ✓ Monitoring active - checking every 30 seconds
            </div>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
            Email Notifications ({notifications.length})
          </h2>

          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📬</div>
              <p>No new emails yet. Start monitoring to receive notifications.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {notifications.map((email) => (
                <div
                  key={email.id}
                  style={{
                    padding: '20px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    background: '#fafafa',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontWeight: 'bold', color: '#333', fontSize: '16px' }}>{email.from}</div>
                    <div style={{ color: '#999', fontSize: '14px' }}>{email.timestamp}</div>
                  </div>
                  <div style={{ fontWeight: '500', color: '#555', marginBottom: '8px' }}>{email.subject}</div>
                  <div style={{ color: '#777', fontSize: '14px', lineHeight: '1.5' }}>{email.preview}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '14px' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>📝 Setup Instructions:</p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>For Gmail: Enable IMAP and use an App Password (not your regular password)</li>
            <li>For other providers: Use the appropriate IMAP host and port</li>
            <li>Browser notifications require permission when you start monitoring</li>
            <li>The agent checks for new emails every 30 seconds while monitoring</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { TicketDetail } from './pages/TicketDetail';
import { Settings } from './pages/Settings';
import { Ticket } from './components/TicketCard';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Quick ticket update callback to sync state changes (like category or status updates)
  const handleUpdateTicket = (updatedTicket: Ticket) => {
    setSelectedTicket(updatedTicket);
  };

  return (
    <div className="app-container">
      {/* Top Header Navigation */}
      <header className="app-header">
        <div className="logo-section">
          <span className="logo-spark">✨</span>
          <div className="logo-text">
            <h1>VocalAssistAI</h1>
            <p>Vernacular Routing & Resolution Engine</p>
          </div>
        </div>

        <nav className="nav-links">
          <button 
            className={`nav-item ${activeTab === 'dashboard' && !selectedTicket ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('dashboard');
              setSelectedTicket(null);
            }}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('settings');
              setSelectedTicket(null);
            }}
          >
            ⚙️ Settings
          </button>
        </nav>
      </header>

      {/* Main Container */}
      <main className="app-main-content">
        {selectedTicket ? (
          <TicketDetail 
            ticket={selectedTicket} 
            onBack={() => setSelectedTicket(null)} 
            onUpdateTicket={handleUpdateTicket}
          />
        ) : activeTab === 'dashboard' ? (
          <Dashboard onSelectTicket={(ticket) => setSelectedTicket(ticket)} />
        ) : (
          <Settings />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer-bar">
        <p>© 2026 VocalAssistAI. All rights reserved. Powered by Gemini LLM & Pinecone Vector Search.</p>
      </footer>
    </div>
  );
}

export default App;

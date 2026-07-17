import React, { useState, useEffect } from 'react';

export const Settings: React.FC = () => {
  // Airtable
  const [airtableBaseId, setAirtableBaseId] = useState<string>('');
  const [airtableTableName, setAirtableTableName] = useState<string>('');
  const [airtablePat, setAirtablePat] = useState<string>('');

  // n8n Webhook
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState<string>('');

  // Pinecone
  const [pineconeApiKey, setPineconeApiKey] = useState<string>('');
  const [pineconeIndex, setPineconeIndex] = useState<string>('');

  // Notifications
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    setAirtableBaseId(localStorage.getItem('airtable_base_id') || 'appVocalAssist101');
    setAirtableTableName(localStorage.getItem('airtable_table_name') || 'Tickets');
    setAirtablePat(localStorage.getItem('airtable_pat') || 'pat_vocal_assist_secret_key');
    setN8nWebhookUrl(localStorage.getItem('n8n_webhook_url') || 'http://localhost:5678/webhook/vocal-ai-ticket');
    setPineconeApiKey(localStorage.getItem('pinecone_api_key') || 'pc_key_vocal_assist_similarity_search');
    setPineconeIndex(localStorage.getItem('pinecone_index') || 'vocal-tickets-embeddings');
  }, []);

  const handleSave = () => {
    localStorage.setItem('airtable_base_id', airtableBaseId);
    localStorage.setItem('airtable_table_name', airtableTableName);
    localStorage.setItem('airtable_pat', airtablePat);
    localStorage.setItem('n8n_webhook_url', n8nWebhookUrl);
    localStorage.setItem('pinecone_api_key', pineconeApiKey);
    localStorage.setItem('pinecone_index', pineconeIndex);

    setSaveStatus('Integration settings saved successfully!');
    setTimeout(() => {
      setSaveStatus(null);
    }, 3000);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Integration Settings</h2>
        <p>Configure automation webhooks, vector databases, and Airtable CRM parameters.</p>
      </div>

      {saveStatus && (
        <div className="alert alert-success">
          {saveStatus}
        </div>
      )}

      <div className="settings-grid">
        {/* Airtable Block */}
        <div className="settings-card">
          <div className="card-header">
            <h3>📊 Airtable CRM Sync</h3>
            <span className="card-badge active">Connected</span>
          </div>
          <div className="card-content">
            <div className="form-group">
              <label>Airtable Base ID</label>
              <input 
                type="text" 
                value={airtableBaseId} 
                onChange={(e) => setAirtableBaseId(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Table Name</label>
              <input 
                type="text" 
                value={airtableTableName} 
                onChange={(e) => setAirtableTableName(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Personal Access Token (PAT)</label>
              <input 
                type="password" 
                value={airtablePat} 
                onChange={(e) => setAirtablePat(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* n8n Webhook Block */}
        <div className="settings-card">
          <div className="card-header">
            <h3>⚙️ n8n Workflow Automation</h3>
            <span className="card-badge active">Active</span>
          </div>
          <div className="card-content">
            <div className="form-group">
              <label>n8n Production Webhook URL</label>
              <input 
                type="text" 
                value={n8nWebhookUrl} 
                placeholder="https://primary-n8n.domain.com/webhook/..."
                onChange={(e) => setN8nWebhookUrl(e.target.value)} 
              />
            </div>
            <div className="status-indicator">
              <span className="indicator-dot online"></span>
              <span className="indicator-text">Webhook listener active. Listening for WhatsApp/Email webhooks.</span>
            </div>
          </div>
        </div>

        {/* Pinecone Block */}
        <div className="settings-card">
          <div className="card-header">
            <h3>🌲 Pinecone Vector DB</h3>
            <span className="card-badge active">Connected</span>
          </div>
          <div className="card-content">
            <div className="form-group">
              <label>Pinecone API Key</label>
              <input 
                type="password" 
                value={pineconeApiKey} 
                onChange={(e) => setPineconeApiKey(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Pinecone Index Name</label>
              <input 
                type="text" 
                value={pineconeIndex} 
                onChange={(e) => setPineconeIndex(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Channels Configuration */}
        <div className="settings-card">
          <div className="card-header">
            <h3>🔌 Channel Configurations</h3>
            <span className="card-badge warning">Setup Required</span>
          </div>
          <div className="card-content channels-config">
            <div className="channel-row">
              <div className="channel-label">
                <strong>WhatsApp Business API</strong>
                <p>Meta Developer account settings</p>
              </div>
              <span className="channel-status active">Connected</span>
            </div>
            <hr />
            <div className="channel-row">
              <div className="channel-label">
                <strong>SMTP / IMAP Email</strong>
                <p>Gmail/Outlook support mailbox</p>
              </div>
              <span className="channel-status pending">Pending SMTP Auth</span>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button className="save-settings-btn" onClick={handleSave}>
          Save All Settings
        </button>
      </div>
    </div>
  );
};

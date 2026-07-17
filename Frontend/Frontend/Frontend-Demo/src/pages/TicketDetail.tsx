import React, { useState, useEffect } from 'react';
import { Ticket } from '../components/TicketCard';
import { StatusBadge } from '../components/StatusBadge';
import { LanguageBadge } from '../components/LanguageBadge';

interface TicketDetailProps {
  ticket: Ticket;
  onBack: () => void;
  onUpdateTicket: (updatedTicket: Ticket) => void;
}

// Context-aware simulated historical resolutions matching categories
const HISTORICAL_RESOLUTIONS_DATABASE: Record<string, Array<{ id: string; query: string; resolution: string }>> = {
  Delivery: [
    {
      id: 'pinecone-del-1',
      query: 'Delayed shipment package in Noida hub.',
      resolution: 'Checked with warehouse partner. Delivery rescheduled. Informed customer that the package will reach them within 24 hours. Status: Resolved.'
    },
    {
      id: 'pinecone-del-2',
      query: 'Customer changed address from Delhi to Noida.',
      resolution: 'Redirected shipment via logistics partner. Manually updated Airtable records. Courier contacted.'
    }
  ],
  Refund: [
    {
      id: 'pinecone-ref-1',
      query: 'Canceled order refund missing bank update.',
      resolution: 'Verified transaction status on payment gateway dashboard. Successfully initiated refund. Informed bank reference token to customer. Delay is due to normal banking cycles.'
    },
    {
      id: 'pinecone-ref-2',
      query: 'Item size incorrect, refund requested.',
      resolution: 'Approved return request. Initiated reverse pickup. Refund scheduled to trigger automatically once pickup status shows scanned.'
    }
  ],
  Product: [
    {
      id: 'pinecone-prod-1',
      query: 'Damaged item received by customer.',
      resolution: 'Requested unboxing video or pictures. Approved item exchange. Initiated shipping for replacement product. Status: In Progress.'
    }
  ],
  General: [
    {
      id: 'pinecone-gen-1',
      query: 'Inquiry about store working hours and locations.',
      resolution: 'Shared link to website store-locator. Verified operational timings (10 AM to 9 PM).'
    }
  ]
};

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, onBack, onUpdateTicket }) => {
  const [status, setStatus] = useState<string>(ticket.status);
  const [category, setCategory] = useState<string>(ticket.category);
  const [draftReply, setDraftReply] = useState<string>(ticket.draftReply || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch similar resolutions based on the ticket's category (simulating Pinecone retrieval)
  const similarResolutions = HISTORICAL_RESOLUTIONS_DATABASE[category] || HISTORICAL_RESOLUTIONS_DATABASE['General'];

  useEffect(() => {
    setStatus(ticket.status);
    setCategory(ticket.category);
    setDraftReply(ticket.draftReply || '');
  }, [ticket]);

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    const updated = { ...ticket, status: newStatus };
    onUpdateTicket(updated);

    // Sync to backend if available
    try {
      await fetch(`http://localhost:3000/tickets/${ticket._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.warn('API unavailable, updated locally');
    }
  };

  const handleCategoryChange = async (newCategory: string) => {
    setCategory(newCategory);
    const updated = { ...ticket, category: newCategory };
    onUpdateTicket(updated);

    // Sync to backend if available
    try {
      await fetch(`http://localhost:3000/tickets/${ticket._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory })
      });
    } catch (e) {
      console.warn('API unavailable, updated locally');
    }
  };

  const handleSendResponse = async () => {
    setIsSubmitting(true);
    
    // Simulate API calling n8n webhook or SMTP to send reply
    setTimeout(async () => {
      setIsSubmitting(false);
      setNotification(`Draft sent successfully to customer via ${ticket.channel}!`);
      
      const updated = { ...ticket, status: 'Resolved', draftReply };
      setStatus('Resolved');
      onUpdateTicket(updated);

      try {
        await fetch(`http://localhost:3000/tickets/${ticket._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Resolved', draftReply })
        });
      } catch (e) {
        console.warn('API unavailable, updated locally');
      }

      setTimeout(() => {
        setNotification(null);
      }, 4000);
    }, 1500);
  };

  return (
    <div className="ticket-detail-container">
      {/* Detail Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <div className="detail-title-section">
          <h2>{ticket.subject || 'Ticket Details'}</h2>
          <span className="customer-info">{ticket.customerName} ({ticket.customerContact})</span>
        </div>
      </div>

      {notification && (
        <div className="alert alert-success">
          {notification}
        </div>
      )}

      {/* Grid Layout */}
      <div className="detail-grid">
        {/* Left column: Ticket details, comparison */}
        <div className="detail-main">
          {/* Dual Translation Panel */}
          <div className="translation-panel">
            <div className="translation-box original-box">
              <div className="box-header">
                <h3>Original Message ({ticket.channel})</h3>
                <LanguageBadge languageCode={ticket.originalLanguage} />
              </div>
              <div className="box-content">
                <p className="raw-text">{ticket.rawContent}</p>
              </div>
            </div>

            <div className="translation-box english-box">
              <div className="box-header">
                <h3>English Translation (Auto)</h3>
                <span className="ai-badge">Gemini-AI</span>
              </div>
              <div className="box-content">
                <p className="translated-text">
                  {ticket.translatedContent || 'Translating...'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions and Classification Controls */}
          <div className="controls-panel">
            <div className="control-field">
              <label>Resolution Status</label>
              <div className="status-selector">
                {['New', 'In Progress', 'Resolved'].map((s) => (
                  <button
                    key={s}
                    className={`status-btn ${status === s ? 'active' : ''}`}
                    onClick={() => handleStatusChange(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-field">
              <label>Classification Category</label>
              <select value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
                <option value="Delivery">Delivery</option>
                <option value="Refund">Refund</option>
                <option value="Product">Product</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          {/* Draft Reply Area */}
          <div className="draft-panel">
            <div className="draft-header">
              <h3>Draft Response (in customer's language)</h3>
              <span className="character-count">{draftReply.length} chars</span>
            </div>
            <textarea
              className="draft-editor"
              value={draftReply}
              onChange={(e) => setDraftReply(e.target.value)}
              placeholder="Draft your reply here..."
            />
            <div className="draft-footer">
              <p className="draft-notice">
                ⚠️ Sending will update Airtable and dispatch message via {ticket.channel}.
              </p>
              <button 
                className="send-response-btn" 
                onClick={handleSendResponse}
                disabled={isSubmitting || !draftReply.trim()}
              >
                {isSubmitting ? 'Sending...' : `Send Reply via ${ticket.channel}`}
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Pinecone contextual matching */}
        <div className="detail-sidebar">
          <div className="sidebar-card similarity-panel">
            <div className="sidebar-card-header">
              <h3>💡 Pinecone Similarity Matches</h3>
              <span className="similarity-score">Top matches</span>
            </div>
            <p className="similarity-explanation">
              Vector search fetched past ticket resolutions matching the <strong>{category}</strong> category:
            </p>

            <div className="resolutions-list">
              {similarResolutions.map((res) => (
                <div key={res.id} className="resolution-item">
                  <div className="item-query">
                    <strong>Issue:</strong> "{res.query}"
                  </div>
                  <div className="item-resolution">
                    <strong>Resolution:</strong> {res.resolution}
                  </div>
                  <div className="item-footer">
                    <span className="ref-tag">{res.id}</span>
                    <button 
                      className="use-resolution-btn"
                      onClick={() => setDraftReply(prev => prev ? prev + '\n' + res.resolution : res.resolution)}
                    >
                      Copy Resolution
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

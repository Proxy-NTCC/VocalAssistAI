import React from 'react';
import { StatusBadge } from './StatusBadge';
import { LanguageBadge } from './LanguageBadge';

export interface Ticket {
  _id: string;
  originalId?: string;
  channel: 'Email' | 'WhatsApp' | string;
  customerName: string;
  customerContact: string;
  originalLanguage: string;
  subject?: string;
  rawContent: string;
  translatedContent?: string;
  category: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  location: string;
  status: 'New' | 'In Progress' | 'Resolved' | string;
  airtableRecordId?: string;
  draftReply?: string;
  similarResolvedTickets?: string[];
  createdAt: string;
  updatedAt: string;
}

interface TicketCardProps {
  ticket: Ticket;
  onClick: (ticket: Ticket) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick }) => {
  const formattedDate = new Date(ticket.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getUrgencyClass = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'urgency-critical';
      case 'High': return 'urgency-high';
      case 'Medium': return 'urgency-medium';
      default: return 'urgency-low';
    }
  };

  return (
    <div className="ticket-card" onClick={() => onClick(ticket)}>
      <div className="card-header">
        <div className="channel-info">
          {ticket.channel === 'WhatsApp' ? (
            <span className="channel-icon whatsapp-icon" title="WhatsApp">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.37 5.054L2 22l5.077-1.331a9.92 9.92 0 0 0 4.933 1.314h.005c5.505 0 9.988-4.479 9.99-9.988a9.97 9.97 0 0 0-2.928-7.06A9.928 9.928 0 0 0 12.012 2zm5.835 14.16c-.252.378-1.258 1.01-1.748 1.056-.47.043-.913.202-3.003-.617-2.51-.986-4.108-3.522-4.23-3.69-.124-.167-.993-1.318-.993-2.51 0-1.192.62-1.777.842-2.015.224-.237.49-.296.653-.296.163 0 .326.002.469.008.148.006.347-.057.545.416.202.485.693 1.692.753 1.81.06.12.1.259.02.416-.08.158-.12.256-.238.396-.118.14-.249.31-.356.416-.12.119-.246.248-.106.485.14.236.62.997 1.33 1.63.915.815 1.685 1.068 1.923 1.187.238.12.377.1.517-.06.14-.158.6-1.012.759-1.358.158-.346.317-.287.535-.208.218.08 1.385.653 1.623.77.238.12.396.179.455.278.06.1.06.574-.193.952z"/>
              </svg>
            </span>
          ) : (
            <span className="channel-icon email-icon" title="Email">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </svg>
            </span>
          )}
          <span className="customer-name">{ticket.customerName}</span>
        </div>
        <span className={`urgency-tag ${getUrgencyClass(ticket.urgency)}`}>
          {ticket.urgency}
        </span>
      </div>

      <div className="card-body">
        <h4 className="ticket-subject">{ticket.subject || 'No Subject'}</h4>
        <p className="ticket-content-preview">{ticket.rawContent}</p>
      </div>

      <div className="card-footer">
        <div className="badge-group">
          <StatusBadge status={ticket.status} />
          <LanguageBadge languageCode={ticket.originalLanguage} />
          <span className="location-tag">📍 {ticket.location}</span>
        </div>
        <span className="ticket-date">{formattedDate}</span>
      </div>
    </div>
  );
};

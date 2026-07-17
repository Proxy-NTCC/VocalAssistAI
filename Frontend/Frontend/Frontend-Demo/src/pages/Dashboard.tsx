import React, { useState, useEffect } from 'react';
import { Ticket, TicketCard } from '../components/TicketCard';

// Realistic mock data as a robust fallback
const INITIAL_MOCK_TICKETS: Ticket[] = [
  {
    _id: 'mock-1',
    channel: 'WhatsApp',
    customerName: 'Rajesh Kumar',
    customerContact: '+91 98765 43210',
    originalLanguage: 'hi',
    subject: 'Delayed Delivery Noida',
    rawContent: 'Mera parcel abhi tak Noida nahi pahuncha hai. Delivery boy bol raha hai ki status delayed hai. Please help.',
    translatedContent: 'My parcel has not reached Noida yet. The delivery boy says the status is delayed. Please help.',
    category: 'Delivery',
    urgency: 'High',
    location: 'Noida, Uttar Pradesh',
    status: 'New',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 min ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    draftReply: 'प्रिय राजेश कुमार, हमें आपके ऑर्डर में देरी के लिए खेद है। आपका पार्सल वर्तमान में नोएडा हब पर है और कल दोपहर तक डिलीवर हो जाएगा। हम डिलीवरी बॉय से भी संपर्क कर रहे हैं।'
  },
  {
    _id: 'mock-2',
    channel: 'Email',
    customerName: 'Ananya Reddy',
    customerContact: 'ananya.r@gmail.com',
    originalLanguage: 'te',
    subject: 'Incorrect Item & Refund Query',
    rawContent: 'నేను ఆర్డర్ చేసిన డ్రెస్ సైజ్ తప్పు వచ్చింది. నేను రిఫండ్ కోరుకుంటున్నాను.',
    translatedContent: 'The dress size I ordered is incorrect. I would like a refund.',
    category: 'Refund',
    urgency: 'Medium',
    location: 'Hyderabad, Telangana',
    status: 'New',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    draftReply: 'ప్రియమైన అనన్య రెడ్డి, సైజ్ సమస్యకు మేము క్షమాపణలు కోరుతున్నాము. మీ రిఫండ్ అభ్యర్థన ఆమోదించబడింది. 3-5 పని దినాలలో డబ్బులు మీ ఖాతాలో జమ చేయబడతాయి.'
  },
  {
    _id: 'mock-3',
    channel: 'WhatsApp',
    customerName: 'Srinivas Pillai',
    customerContact: '+91 99443 32211',
    originalLanguage: 'ta',
    subject: 'Damaged item received',
    rawContent: 'வணக்கம், எனது ஆர்டர் சேதமடைந்த நிலையில் வந்தது. நான் மாற்று தயாரிப்பு பெற விரும்புகிறேன்.',
    translatedContent: 'Hello, my order arrived in a damaged condition. I want to get a replacement product.',
    category: 'Product',
    urgency: 'Critical',
    location: 'Coimbatore, Tamil Nadu',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(), // 10 hours ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    draftReply: 'அன்புள்ள ஸ்ரீனிவாஸ் பிள்ளை, உங்கள் தயாரிப்பு சேதமடைந்ததற்கு வருந்துகிறோம். மாற்று தயாரிப்பு ஆர்டர் செய்யப்பட்டுள்ளது. 2 நாட்களில் புதிய தயாரிப்பு உங்களுக்கு விநியோகிக்கப்படும்.'
  },
  {
    _id: 'mock-4',
    channel: 'WhatsApp',
    customerName: 'Vikram Singh',
    customerContact: '+91 90123 45678',
    originalLanguage: 'hinglish',
    subject: 'Refund not reflecting',
    rawContent: 'Hi team, refund kab tak aayega? Kal cancel kiya tha order, bank statement me abhi tak show nahi kar raha.',
    translatedContent: 'Hi team, when will the refund arrive? Canceled the order yesterday, not showing in bank statement yet.',
    category: 'Refund',
    urgency: 'Medium',
    location: 'Gurgaon, Haryana',
    status: 'Resolved',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 36 hours ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 32).toISOString(),
    draftReply: 'Hi Vikram, normal cases me cancelation ke baad 24-48 hours lagte hain refund credit hone me. Humne details check ki hain, refund successfully process ho chuka hai. Please wait for 1 more business day.'
  }
];

interface DashboardProps {
  onSelectTicket: (ticket: Ticket) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectTicket }) => {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_MOCK_TICKETS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [channelFilter, setChannelFilter] = useState<string>('All');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('All');
  const [languageFilter, setLanguageFilter] = useState<string>('All');
  const [locationSearch, setLocationSearch] = useState<string>('');

  // Fetch Tickets from API
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('http://localhost:3000/tickets');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setTickets(data);
          } else {
            // If empty database, initialize with mock data for display
            setTickets(INITIAL_MOCK_TICKETS);
          }
        }
      } catch (err) {
        console.warn('API connection failed. Falling back to mock data.', err);
        // Silently fallback to mock data
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // Compute stats
  const totalCount = tickets.length;
  const newCount = tickets.filter(t => t.status === 'New').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

  const languagesUsed = tickets.reduce((acc: Record<string, number>, curr) => {
    acc[curr.originalLanguage] = (acc[curr.originalLanguage] || 0) + 1;
    return acc;
  }, {});

  // Apply filters
  const filteredTickets = tickets.filter((ticket) => {
    const statusMatch = statusFilter === 'All' || ticket.status === statusFilter;
    const channelMatch = channelFilter === 'All' || ticket.channel === channelFilter;
    const urgencyMatch = urgencyFilter === 'All' || ticket.urgency === urgencyFilter;
    const languageMatch = languageFilter === 'All' || ticket.originalLanguage === languageFilter;
    const locationMatch = locationSearch === '' || 
      ticket.location.toLowerCase().includes(locationSearch.toLowerCase());

    return statusMatch && channelMatch && urgencyMatch && languageMatch && locationMatch;
  });

  return (
    <div className="dashboard-container">
      {/* Stat Grid */}
      <div className="stat-grid">
        <div className="stat-card stat-total">
          <div className="stat-header">
            <h3>Total Tickets</h3>
            <span className="stat-icon">📄</span>
          </div>
          <div className="stat-number">{totalCount}</div>
          <p className="stat-subtext">All channels active</p>
        </div>

        <div className="stat-card stat-new">
          <div className="stat-header">
            <h3>New Alerts</h3>
            <span className="stat-icon">🔔</span>
          </div>
          <div className="stat-number">{newCount}</div>
          <p className="stat-subtext">Needs immediate review</p>
        </div>

        <div className="stat-card stat-progress">
          <div className="stat-header">
            <h3>Active Queue</h3>
            <span className="stat-icon">⏳</span>
          </div>
          <div className="stat-number">{inProgressCount}</div>
          <p className="stat-subtext">In-progress tickets</p>
        </div>

        <div className="stat-card stat-resolved">
          <div className="stat-header">
            <h3>Resolved</h3>
            <span className="stat-icon">✅</span>
          </div>
          <div className="stat-number">{resolvedCount}</div>
          <p className="stat-subtext">Resolved automatically</p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="dashboard-workspace">
        {/* Filters Sidebar */}
        <div className="filters-sidebar">
          <h3>Filters & Sort</h3>
          
          <div className="filter-group">
            <label>Channel</label>
            <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}>
              <option value="All">All Channels</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Email">Email</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Urgency</label>
            <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
              <option value="All">All Urgency</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Original Language</label>
            <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}>
              <option value="All">All Languages</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
              <option value="kn">Kannada</option>
              <option value="bn">Bengali</option>
              <option value="en">English</option>
              <option value="hinglish">Hinglish</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Location (City/State)</label>
            <input 
              type="text" 
              placeholder="Search location..." 
              value={locationSearch} 
              onChange={(e) => setLocationSearch(e.target.value)} 
            />
          </div>

          <div className="sidebar-footer">
            <div className="language-stats">
              <h4>Languages active</h4>
              {Object.keys(languagesUsed).map((lang) => (
                <div key={lang} className="lang-stat-row">
                  <span>{lang.toUpperCase()}</span>
                  <span>{languagesUsed[lang]} tickets</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tickets Feed */}
        <div className="tickets-feed-section">
          <div className="feed-header">
            <h2>Multilingual Ticket Feed ({filteredTickets.length})</h2>
            <button className="refresh-button" onClick={() => window.location.reload()}>
              🔄 Refresh
            </button>
          </div>

          <div className="tickets-grid">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <TicketCard 
                  key={ticket._id} 
                  ticket={ticket} 
                  onClick={onSelectTicket} 
                />
              ))
            ) : (
              <div className="no-tickets">
                <span className="no-tickets-icon">📬</span>
                <h3>No tickets found matching the selected filters.</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

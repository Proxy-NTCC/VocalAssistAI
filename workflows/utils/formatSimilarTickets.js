/**
 * Formats a list of similar tickets retrieved from Pinecone.
 *
 * @param {Array} matches - Pinecone search matches array.
 * @param {Object} options - Options containing env/config keys.
 * @param {string} options.currentTicketId - The ID of the ticket currently being processed (to exclude it).
 * @param {string} options.baseId - Airtable Base ID.
 * @param {string} options.tableNameOrId - Airtable Table Name or ID.
 * @param {number} [options.similarityThreshold=0.7] - Minimum similarity score threshold.
 * @returns {Object} An object containing formattedData (array of structured objects) and markdownText (formatted markdown string).
 */
function formatSimilarTickets(matches, options = {}) {
  const currentTicketId = options.currentTicketId || '';
  const baseId = options.baseId || '';
  const tableNameOrId = options.tableNameOrId || 'Tickets';
  const similarityThreshold = typeof options.similarityThreshold === 'number' ? options.similarityThreshold : 0.7;

  if (!Array.isArray(matches) || matches.length === 0) {
    return {
      formattedData: [],
      markdownText: '*No similar historical tickets found.*'
    };
  }

  const formattedData = [];

  for (const match of matches) {
    // Graceful check for match structure
    if (!match || typeof match !== 'object') continue;

    // Filter by similarity threshold
    const score = typeof match.score === 'number' ? match.score : 0;
    if (score < similarityThreshold) continue;

    const ticketId = match.id || '';
    // Exclude the current ticket from similar tickets list
    if (currentTicketId && ticketId === currentTicketId) continue;

    const metadata = match.metadata || {};

    // Extract summary/subject with fallback
    let summary = metadata.summary || metadata.subject || '';
    if (!summary && metadata.body) {
      summary = metadata.body.length > 60 ? metadata.body.substring(0, 57) + '...' : metadata.body;
    }
    summary = (summary || '').trim() || 'No summary available';

    // Extract date with fallback
    const rawDate = metadata.date || metadata.receivedAt || '';
    let dateStr = '';
    if (rawDate) {
      try {
        const dateObj = new Date(rawDate);
        if (!isNaN(dateObj.getTime())) {
          dateStr = dateObj.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        } else {
          dateStr = rawDate;
        }
      } catch (e) {
        dateStr = rawDate;
      }
    } else {
      dateStr = 'Unknown date';
    }

    // Extract status
    const status = metadata.status || 'New';

    // Construct link dynamically
    const recordId = metadata.airtableRecordId || '';
    let link = '';
    if (baseId && recordId) {
      // Clean up baseId and tableNameOrId to make a proper URL segment
      const cleanBase = encodeURIComponent(baseId);
      const cleanTable = encodeURIComponent(tableNameOrId);
      const cleanRecord = encodeURIComponent(recordId);
      link = `https://airtable.com/${cleanBase}/${cleanTable}/${cleanRecord}`;
    }

    formattedData.push({
      ticketId,
      summary,
      date: dateStr,
      status,
      link,
      score: parseFloat(score.toFixed(4))
    });
  }

  // Format markdown block for agents
  let markdownText = '';
  if (formattedData.length === 0) {
    markdownText = '*No similar historical tickets found.*';
  } else {
    markdownText = '### Similar Historical Tickets:\n';
    formattedData.forEach((item, index) => {
      const matchPercentage = (item.score * 100).toFixed(1);
      markdownText += `${index + 1}. **[Ticket ID: ${item.ticketId}](${item.link || '#'})** (${matchPercentage}% Match)\n`;
      markdownText += `   - **Summary:** ${item.summary}\n`;
      markdownText += `   - **Date:** ${item.date} | **Status:** ${item.status}\n`;
    });
  }

  return {
    formattedData,
    markdownText: markdownText.trim()
  };
}

// Export for Node testing, but check environment since n8n runs code inside a wrapper
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatSimilarTickets };
}

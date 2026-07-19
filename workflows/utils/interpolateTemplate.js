const defaultTemplates = require('./default-templates.json');

/**
 * Resolves the appropriate system instructions and user prompt template for a ticket,
 * and interpolates runtime variables.
 *
 * @param {string} topic - Classified topic of the ticket.
 * @param {Array} airtableTemplates - Array of template records from Airtable (fields: Topic, "System Instructions", "User Prompt Template", Active).
 * @param {Object} variables - Values to interpolate: { RawMessage, Translation, Language, SimilarTickets }.
 * @returns {Object} Compiled prompts: { systemInstructions, userPrompt }
 */
function resolveAndInterpolate(topic, airtableTemplates, variables = {}) {
  const vars = {
    RawMessage: variables.RawMessage || '',
    Translation: variables.Translation || variables.RawMessage || '',
    Language: variables.Language || 'English',
    SimilarTickets: variables.SimilarTickets || '*No similar historical tickets found.*'
  };

  let sysTemplate = '';
  let userTemplate = '';

  // 1. Try to find active template in Airtable matches
  let foundInAirtable = false;
  if (Array.isArray(airtableTemplates) && airtableTemplates.length > 0) {
    const matchedRecord = airtableTemplates.find(record => {
      if (!record || !record.fields) return false;
      const tName = record.fields.Topic || '';
      const isActive = record.fields.Active !== false; // Treat as active if not explicitly false
      return tName.toLowerCase().trim() === (topic || '').toLowerCase().trim() && isActive;
    });

    if (matchedRecord && matchedRecord.fields) {
      sysTemplate = matchedRecord.fields["System Instructions"] || '';
      userTemplate = matchedRecord.fields["User Prompt Template"] || '';
      foundInAirtable = true;
    }
  }

  // 2. If not found in Airtable, use local fallback
  if (!foundInAirtable) {
    const normalizedTopic = Object.keys(defaultTemplates).find(
      key => key.toLowerCase() === (topic || '').toLowerCase().trim()
    );

    if (normalizedTopic && defaultTemplates[normalizedTopic]) {
      sysTemplate = defaultTemplates[normalizedTopic].systemInstructions || '';
      userTemplate = defaultTemplates[normalizedTopic].userTemplate || '';
    } else {
      // 3. Ultimate Fallback to "Other"
      sysTemplate = defaultTemplates["Other"].systemInstructions || '';
      userTemplate = defaultTemplates["Other"].userTemplate || '';
    }
  }

  // Helper function to safely replace placeholders without recursive replacement
  const interpolate = (templateStr) => {
    if (typeof templateStr !== 'string') return '';
    return templateStr.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, placeholderKey) => {
      // Return matching value if present in variables, otherwise preserve bracket match
      return placeholderKey in vars ? vars[placeholderKey] : match;
    });
  };

  return {
    systemInstructions: interpolate(sysTemplate).trim(),
    userPrompt: interpolate(userTemplate).trim()
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { resolveAndInterpolate };
}

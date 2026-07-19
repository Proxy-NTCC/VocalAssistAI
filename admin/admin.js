// Default Seed Prompt Templates (matching workflows/utils/default-templates.json)
const SEED_TEMPLATES = {
  "Billing & Payment": {
    "systemInstructions": "You are an expert billing and support assistant for a premium retail chain. Your task is to draft a polite, professional reply to a billing, refund, invoice, or payment charge query. Always acknowledge the customer's financial concern immediately and guide them to send payment receipts or transaction numbers if not already provided. Never commit to a definitive refund date or outcome; instruct them that our accounts team will review and resolve it within 3-5 business days.",
    "userTemplate": "Customer Preferred Language: {{Language}}\nCustomer's Raw Query: {{RawMessage}}\nEnglish Translation (if applicable): {{Translation}}\n\nRefer to these similar past issues for resolution alignment:\n{{SimilarTickets}}\n\nGenerate the response directly in the customer's preferred language. Keep it under 150 words.",
    "active": true
  },
  "Product Issue": {
    "systemInstructions": "You are an expert product support assistant. Your task is to draft a helpful, empathetic reply regarding damaged, incorrect, low-quality, or missing products. Apologize sincerely for the inconvenience. Explain our replacement policy: items must be reported within 7 days of delivery with purchase proof. Instruct the customer to keep the product packaging and share images/videos of the damaged item.",
    "userTemplate": "Customer Preferred Language: {{Language}}\nCustomer's Raw Query: {{RawMessage}}\nEnglish Translation (if applicable): {{Translation}}\n\nRefer to these similar past issues for resolution alignment:\n{{SimilarTickets}}\n\nGenerate the response directly in the customer's preferred language. Keep it under 150 words.",
    "active": true
  },
  "Delivery & Shipping": {
    "systemInstructions": "You are an expert shipping operations coordinator. Your task is to draft a reply regarding delivery delays, shipment tracking, or carrier status. Acknowledge the delay and state that we are coordinating with our logistics partners (BlueDart/Delhivery) to prioritize their parcel. If a tracking link is not in the history, ask them to verify their delivery address.",
    "userTemplate": "Customer Preferred Language: {{Language}}\nCustomer's Raw Query: {{RawMessage}}\nEnglish Translation (if applicable): {{Translation}}\n\nRefer to these similar past issues for resolution alignment:\n{{SimilarTickets}}\n\nGenerate the response directly in the customer's preferred language. Keep it under 150 words.",
    "active": true
  },
  "Order Management": {
    "systemInstructions": "You are an expert order management representative. Your task is to draft a reply regarding cancelling, modifying, confirming, or checking order details. Advise the customer that orders can only be changed or cancelled within 1 hour of placement. Check status and provide details clearly.",
    "userTemplate": "Customer Preferred Language: {{Language}}\nCustomer's Raw Query: {{RawMessage}}\nEnglish Translation (if applicable): {{Translation}}\n\nRefer to these similar past issues for resolution alignment:\n{{SimilarTickets}}\n\nGenerate the response directly in the customer's preferred language. Keep it under 120 words.",
    "active": true
  },
  "Account & Login": {
    "systemInstructions": "You are an account access support assistant. Help the customer with sign-in problems, password reset requests, or profile modifications. Guide them to use the 'Forgot Password' link on our mobile app or web portal. For security reasons, remind them that we never ask for passwords or PINs via email.",
    "userTemplate": "Customer Preferred Language: {{Language}}\nCustomer's Raw Query: {{RawMessage}}\nEnglish Translation (if applicable): {{Translation}}\n\nGenerate the response directly in the customer's preferred language. Keep it under 100 words.",
    "active": true
  },
  "Store & Service": {
    "systemInstructions": "You are a customer relations manager. Draft a reply resolving complaints about store visits, staff behaviour, or general service feedback. Apologize for any negative experience and assure them that their feedback has been escalated to the respective regional store manager for internal action.",
    "userTemplate": "Customer Preferred Language: {{Language}}\nCustomer's Raw Query: {{RawMessage}}\nEnglish Translation (if applicable): {{Translation}}\n\nGenerate the response directly in the customer's preferred language. Keep it under 120 words.",
    "active": true
  },
  "Other": {
    "systemInstructions": "You are a general customer support assistant. Draft a helpful, professional, and friendly response. Acknowledge their message, state that we have registered their ticket, and promise an agent will review it shortly.",
    "userTemplate": "Customer Preferred Language: {{Language}}\nCustomer's Raw Query: {{RawMessage}}\n\nGenerate the response directly in the customer's preferred language. Keep it under 100 words.",
    "active": true
  }
};

// Application State
let state = {
  sandboxMode: true,
  airtablePAT: '',
  airtableBaseId: '',
  templates: {}, // Current loaded templates (key: Topic)
  selectedTopic: null,
  airtableRecordsMap: {}, // Map Topic -> Airtable Record ID for updates
  dashboardFilter: 'all',
  dashboardRuns: [] // Store fetched logs
};

// DOM Elements
const sandboxModeToggle = document.getElementById('sandbox-mode-toggle');
const airtableCredsBox = document.getElementById('airtable-creds-box');
const airtablePatInput = document.getElementById('airtable-pat');
const airtableBaseIdInput = document.getElementById('airtable-base-id');
const btnConnect = document.getElementById('btn-connect');

const topicList = document.getElementById('topic-list');
const noSelectionState = document.getElementById('no-selection-state');
const editorActiveState = document.getElementById('editor-active-state');
const currentTopicTitle = document.getElementById('current-topic-title');
const templateActiveToggle = document.getElementById('template-active-toggle');
const systemInstructionsInput = document.getElementById('system-instructions');
const userPromptTemplateInput = document.getElementById('user-prompt-template');
const sysCharCount = document.getElementById('sys-char-count');
const userCharCount = document.getElementById('user-char-count');
const templateEditorForm = document.getElementById('template-editor-form');
const btnResetDefault = document.getElementById('btn-reset-default');
const btnSaveTemplate = document.getElementById('btn-save-template');
const saveStatusMsg = document.getElementById('save-status-msg');
const toast = document.getElementById('toast');
const placeholderChips = document.querySelectorAll('.chip');

// Tab controls
const tabTemplates = document.getElementById('tab-templates');
const tabDashboard = document.getElementById('tab-dashboard');
const viewTemplates = document.getElementById('view-templates');
const viewDashboard = document.getElementById('view-dashboard');

// Dashboard logs controls
const logsTbody = document.getElementById('logs-tbody');
const dashboardEmptyState = document.getElementById('dashboard-empty-state');
const btnRefreshDashboard = document.getElementById('btn-refresh-dashboard');
const filterPills = document.querySelectorAll('.filter-pill');

// Initialize App
function init() {
  // Try loading credentials and mode from LocalStorage
  const savedCreds = localStorage.getItem('vocalassist_airtable_creds');
  if (savedCreds) {
    try {
      const creds = JSON.parse(savedCreds);
      airtablePatInput.value = creds.pat || '';
      airtableBaseIdInput.value = creds.baseId || '';
      state.airtablePAT = creds.pat || '';
      state.airtableBaseId = creds.baseId || '';
    } catch (e) {}
  }

  const savedMode = localStorage.getItem('vocalassist_sandbox_mode');
  if (savedMode !== null) {
    state.sandboxMode = savedMode === 'true';
    sandboxModeToggle.checked = state.sandboxMode;
  }

  toggleIntegrationModeView();
  loadTemplates();
  loadDashboardLogs(); // Initialize dashboard runs
  setupEventListeners();
}

// Toggle connection elements depending on Sandbox status
function toggleIntegrationModeView() {
  if (state.sandboxMode) {
    airtableCredsBox.classList.add('hidden');
  } else {
    airtableCredsBox.classList.remove('hidden');
  }
}

// Load templates depending on Mode (Sandbox/Airtable)
async function loadTemplates() {
  showSidebarSkeletons();
  
  if (state.sandboxMode) {
    // Load from LocalStorage or fall back to Seed data
    const savedSandboxTemplates = localStorage.getItem('vocalassist_sandbox_templates');
    if (savedSandboxTemplates) {
      try {
        state.templates = JSON.parse(savedSandboxTemplates);
      } catch (e) {
        state.templates = JSON.parse(JSON.stringify(SEED_TEMPLATES));
      }
    } else {
      state.templates = JSON.parse(JSON.stringify(SEED_TEMPLATES));
    }
    renderSidebar();
  } else {
    // Live Airtable Mode
    if (!state.airtablePAT || !state.airtableBaseId) {
      showStatusNotification('Credentials missing. Enter Token & Base ID.', 'error');
      renderSidebarEmpty();
      return;
    }
    await fetchTemplatesFromAirtable();
  }
}

// Fetch Templates from Airtable
async function fetchTemplatesFromAirtable() {
  const url = `https://api.airtable.com/v0/${state.airtableBaseId}/PromptTemplates`;
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${state.airtablePAT}`
      }
    });

    if (!response.ok) {
      throw new Error(`Airtable API returned status ${response.status}`);
    }

    const data = await response.json();
    const loadedTemplates = {};
    state.airtableRecordsMap = {};

    // Map response records to state
    data.records.forEach(record => {
      const topic = record.fields.Topic;
      if (topic) {
        loadedTemplates[topic] = {
          systemInstructions: record.fields["System Instructions"] || '',
          userTemplate: record.fields["User Prompt Template"] || '',
          active: record.fields.Active !== false
        };
        state.airtableRecordsMap[topic] = record.id;
      }
    });

    // Make sure we have entries for all seed categories
    Object.keys(SEED_TEMPLATES).forEach(topic => {
      if (!loadedTemplates[topic]) {
        loadedTemplates[topic] = {
          systemInstructions: SEED_TEMPLATES[topic].systemInstructions,
          userTemplate: SEED_TEMPLATES[topic].userTemplate,
          active: false // Inactive since it doesn't exist in Airtable yet
        };
      }
    });

    state.templates = loadedTemplates;
    renderSidebar();
    showStatusNotification('Templates fetched from Airtable successfully.', 'success');
  } catch (err) {
    console.error(err);
    showStatusNotification(`Failed to connect: ${err.message}`, 'error');
    // Load local seed so page remains interactively functional
    state.templates = JSON.parse(JSON.stringify(SEED_TEMPLATES));
    renderSidebar();
  }
}

// Show skeletons while loading
function showSidebarSkeletons() {
  topicList.innerHTML = `
    <li class="skeleton-item"></li>
    <li class="skeleton-item"></li>
    <li class="skeleton-item"></li>
    <li class="skeleton-item"></li>
  `;
}

function renderSidebarEmpty() {
  topicList.innerHTML = `<li style="padding: 1rem; text-align: center; color: var(--text-dark); font-size: 0.85rem;">Enter credentials above to fetch categories.</li>`;
}

// Render Sidebar List
function renderSidebar() {
  topicList.innerHTML = '';
  Object.keys(state.templates).forEach(topic => {
    const data = state.templates[topic];
    const li = document.createElement('li');
    li.className = `topic-item ${!data.active ? 'inactive-status' : ''} ${state.selectedTopic === topic ? 'active' : ''}`;
    li.dataset.topic = topic;
    
    li.innerHTML = `
      <span>${topic}</span>
      <span class="item-badge">${data.active ? 'Active' : 'Off'}</span>
    `;

    li.addEventListener('click', () => selectTopic(topic));
    topicList.appendChild(li);
  });
}

// Select category and update Editor values
function selectTopic(topic) {
  state.selectedTopic = topic;
  
  // Highlight active sidebar item
  document.querySelectorAll('.topic-item').forEach(el => {
    el.classList.remove('active');
    if (el.dataset.topic === topic) el.classList.add('active');
  });

  const data = state.templates[topic];
  
  // Update view state
  noSelectionState.classList.remove('active');
  editorActiveState.classList.add('active');

  currentTopicTitle.textContent = topic;
  templateActiveToggle.checked = data.active;
  systemInstructionsInput.value = data.systemInstructions;
  userPromptTemplateInput.value = data.userTemplate;

  // Set description helper text based on category
  const descEl = document.querySelector('.topic-desc');
  if (topic === 'Billing & Payment') descEl.textContent = 'Triggers on billing issues, refunds, duplicate charges, and receipt requests.';
  else if (topic === 'Product Issue') descEl.textContent = 'Triggers on damaged packaging, missing items, or malfunctioning hardware.';
  else if (topic === 'Delivery & Shipping') descEl.textContent = 'Triggers on courier delay tracking, address adjustments, or logistics queries.';
  else if (topic === 'Other') descEl.textContent = 'General fallback template loaded when classifications are inconclusive.';
  else descEl.textContent = `Customize templates for customer tickets classified as ${topic}.`;

  updateCharCounters();
  clearSaveMessage();
}

// Update character counter elements
function updateCharCounters() {
  sysCharCount.textContent = systemInstructionsInput.value.length;
  userCharCount.textContent = userPromptTemplateInput.value.length;
}

// Save active changes
async function saveActiveTemplate(e) {
  if (e) e.preventDefault();
  if (!state.selectedTopic) return;

  const updatedSystem = systemInstructionsInput.value.trim();
  const updatedUser = userPromptTemplateInput.value.trim();
  const isActive = templateActiveToggle.checked;

  if (!updatedSystem || !updatedUser) {
    showStatusNotification('Prompts cannot be empty!', 'error');
    return;
  }

  // Update State object
  state.templates[state.selectedTopic].systemInstructions = updatedSystem;
  state.templates[state.selectedTopic].userTemplate = updatedUser;
  state.templates[state.selectedTopic].active = isActive;

  if (state.sandboxMode) {
    // Save to LocalStorage
    localStorage.setItem('vocalassist_sandbox_templates', JSON.stringify(state.templates));
    showSaveSuccess();
    renderSidebar();
  } else {
    // Save to Airtable
    await saveTemplateToAirtable(state.selectedTopic, updatedSystem, updatedUser, isActive);
  }
}

// Save template values back to Airtable API
async function saveTemplateToAirtable(topic, systemInstructions, userTemplate, isActive) {
  const recordId = state.airtableRecordsMap[topic];
  
  if (!recordId) {
    showStatusNotification(`Save failed: This topic isn't linked to an Airtable Record ID.`, 'error');
    return;
  }

  showSaveStatusProgress('Saving to Airtable...');

  const url = `https://api.airtable.com/v0/${state.airtableBaseId}/PromptTemplates/${recordId}`;
  
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${state.airtablePAT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          "System Instructions": systemInstructions,
          "User Prompt Template": userTemplate,
          "Active": isActive
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Airtable update failed with status ${response.status}`);
    }

    showSaveSuccess();
    renderSidebar();
  } catch (err) {
    console.error(err);
    showStatusNotification(`Airtable Save Error: ${err.message}`, 'error');
    showSaveStatusProgress('Error saving to Airtable', true);
  }
}

// Reset the editor prompts to their baseline default seed values
function resetToDefault() {
  if (!state.selectedTopic) return;
  
  const seed = SEED_TEMPLATES[state.selectedTopic];
  if (seed) {
    systemInstructionsInput.value = seed.systemInstructions;
    userPromptTemplateInput.value = seed.userTemplate;
    templateActiveToggle.checked = true;
    updateCharCounters();
    showStatusNotification('Reset to baseline seed values. Remember to save!', 'success');
  }
}

// Insert tag placeholder at cursor position in User Prompt textarea
function insertPlaceholder(placeholderText) {
  const textInput = userPromptTemplateInput;
  const startPos = textInput.selectionStart;
  const endPos = textInput.selectionEnd;
  const originalVal = textInput.value;

  textInput.value = originalVal.substring(0, startPos) + placeholderText + originalVal.substring(endPos, originalVal.length);
  
  // Return focus and place cursor right after inserted text
  textInput.focus();
  textInput.selectionStart = startPos + placeholderText.length;
  textInput.selectionEnd = startPos + placeholderText.length;
  
  updateCharCounters();
}

// Notification Toasts
function showStatusNotification(message, type = 'success') {
  toast.textContent = message;
  toast.style.background = type === 'success' ? '#10b981' : '#ef4444';
  toast.style.boxShadow = type === 'success' 
    ? '0 10px 25px rgba(16, 185, 129, 0.35)' 
    : '0 10px 25px rgba(239, 68, 68, 0.35)';
  
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

function showSaveSuccess() {
  saveStatusMsg.textContent = '✓ Saved successfully!';
  saveStatusMsg.style.color = 'var(--accent-green)';
  saveStatusMsg.classList.add('active');
  showStatusNotification('Template configurations updated.');
  setTimeout(clearSaveMessage, 4000);
}

function showSaveStatusProgress(text, isError = false) {
  saveStatusMsg.textContent = text;
  saveStatusMsg.style.color = isError ? 'var(--accent-red)' : 'var(--accent-cyan)';
  saveStatusMsg.classList.add('active');
}

function clearSaveMessage() {
  saveStatusMsg.classList.remove('active');
}

// Event Listeners setup
function setupEventListeners() {
  // Mode toggle
  sandboxModeToggle.addEventListener('change', (e) => {
    state.sandboxMode = e.target.checked;
    localStorage.setItem('vocalassist_sandbox_mode', state.sandboxMode);
    toggleIntegrationModeView();
    loadTemplates();
    loadDashboardLogs();
  });

  // Connect Button
  btnConnect.addEventListener('click', () => {
    const pat = airtablePatInput.value.trim();
    const baseId = airtableBaseIdInput.value.trim();
    
    if (!pat || !baseId) {
      showStatusNotification('Credentials missing.', 'error');
      return;
    }

    state.airtablePAT = pat;
    state.airtableBaseId = baseId;
    
    localStorage.setItem('vocalassist_airtable_creds', JSON.stringify({ pat, baseId }));
    loadTemplates();
    loadDashboardLogs();
  });

  // Real-time counter bindings
  systemInstructionsInput.addEventListener('input', updateCharCounters);
  userPromptTemplateInput.addEventListener('input', updateCharCounters);

  // Form Submit
  templateEditorForm.addEventListener('submit', saveActiveTemplate);

  // Reset default
  btnResetDefault.addEventListener('click', resetToDefault);

  // Click chips to insert placeholders
  placeholderChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const tag = chip.dataset.insert;
      if (tag) insertPlaceholder(tag);
    });
  });

  // Track status check changes in list badge
  templateActiveToggle.addEventListener('change', (e) => {
    if (state.selectedTopic) {
      state.templates[state.selectedTopic].active = e.target.checked;
      renderSidebar();
    }
  });

  // Tab buttons bindings
  tabTemplates.addEventListener('click', () => switchView('templates'));
  tabDashboard.addEventListener('click', () => switchView('dashboard'));

  // Dashboard refresh
  btnRefreshDashboard.addEventListener('click', () => loadDashboardLogs());

  // Filter pills binding
  filterPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      filterPills.forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      state.dashboardFilter = e.target.dataset.filter;
      renderDashboardLogs();
    });
  });
}

// Mock runs database (default seed for local storage)
const MOCK_RUNS = [
  {
    id: "rec001",
    fields: {
      "Ticket ID": "email-2026-101",
      "Source": "Email",
      "Topic": "Billing & Payment",
      "Created Time": new Date(Date.now() - 3600000).toISOString(),
      "Status": "Draft Ready",
      "Error Log": ""
    }
  },
  {
    id: "rec002",
    fields: {
      "Ticket ID": "whatsapp-2026-102",
      "Source": "WhatsApp",
      "Topic": "Delivery & Shipping",
      "Created Time": new Date(Date.now() - 1800000).toISOString(),
      "Status": "Processing",
      "Error Log": ""
    }
  },
  {
    id: "rec003",
    fields: {
      "Ticket ID": "email-2026-103",
      "Source": "Email",
      "Topic": "Product Issue",
      "Created Time": new Date(Date.now() - 7200000).toISOString(),
      "Status": "Failed",
      "Error Log": "Timeout occurred while trying to connect to OpenAI completion service. Request payload dumped sk-BC123xyz789012345678901234567890123456789012345. Connection returned ETIMEDOUT."
    }
  },
  {
    id: "rec004",
    fields: {
      "Ticket ID": "email-2026-104",
      "Source": "Email",
      "Topic": "Account & Login",
      "Created Time": new Date(Date.now() - 86400000).toISOString(),
      "Status": "Closed",
      "Error Log": ""
    }
  }
];

// Load dashboard runs
async function loadDashboardLogs() {
  if (state.sandboxMode) {
    const savedRuns = localStorage.getItem('vocalassist_sandbox_runs');
    if (savedRuns) {
      try {
        state.dashboardRuns = JSON.parse(savedRuns);
      } catch (e) {
        state.dashboardRuns = JSON.parse(JSON.stringify(MOCK_RUNS));
      }
    } else {
      state.dashboardRuns = JSON.parse(JSON.stringify(MOCK_RUNS));
      localStorage.setItem('vocalassist_sandbox_runs', JSON.stringify(MOCK_RUNS));
    }
    renderDashboardLogs();
  } else {
    // Live Airtable log pull
    if (!state.airtablePAT || !state.airtableBaseId) {
      state.dashboardRuns = [];
      renderDashboardLogs();
      return;
    }
    
    // Sort by Created Time descending
    const url = `https://api.airtable.com/v0/${state.airtableBaseId}/Tickets?maxRecords=30&sort%5B0%5D%5Bfield%5D=Created+Time&sort%5B0%5D%5Bdirection%5D=desc`;
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${state.airtablePAT}`
        }
      });
      if (!response.ok) throw new Error(`Failed to fetch logs: Status ${response.status}`);
      const data = await response.json();
      state.dashboardRuns = data.records || [];
      renderDashboardLogs();
    } catch (e) {
      console.error(e);
      showStatusNotification(`Log Pull Error: ${e.message}`, 'error');
      state.dashboardRuns = [];
      renderDashboardLogs();
    }
  }
}

// Render runs to table
function renderDashboardLogs() {
  logsTbody.innerHTML = '';
  const filter = state.dashboardFilter;
  
  const filtered = state.dashboardRuns.filter(run => {
    if (!run || !run.fields) return false;
    if (filter === 'all') return true;
    return run.fields.Status === filter;
  });

  if (filtered.length === 0) {
    dashboardEmptyState.classList.remove('hidden');
    document.querySelector('.logs-table').style.display = 'none';
    return;
  }

  dashboardEmptyState.classList.add('hidden');
  document.querySelector('.logs-table').style.display = 'table';

  filtered.forEach(run => {
    const recordId = run.id;
    const ticketId = run.fields["Ticket ID"] || 'Unknown ID';
    const source = run.fields.Source || 'Email';
    const topic = run.fields.Topic || 'Unclassified';
    const rawTime = run.fields["Created Time"] || run.createdTime || '';
    const status = run.fields.Status || 'New';
    const errorLog = run.fields["Error Log"] || '';

    // Class for status pill
    let statusClass = 'new';
    if (status === 'Processing') statusClass = 'processing';
    else if (status === 'Draft Ready') statusClass = 'draft-ready';
    else if (status === 'Failed') statusClass = 'failed';
    else if (status === 'Closed' || status === 'Replied') statusClass = 'closed';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${ticketId}</strong></td>
      <td>${source}</td>
      <td>${topic}</td>
      <td>${formatDateTime(rawTime)}</td>
      <td><span class="status-pill ${statusClass}">${status}</span></td>
      <td>
        ${status === 'Failed' && errorLog ? `<button type="button" class="btn btn-secondary btn-sm btn-view-error" data-id="${recordId}">⚠️ View Error</button>` : '—'}
      </td>
    `;
    
    logsTbody.appendChild(row);

    // If failed and has logs, add hidden trace details row
    if (status === 'Failed' && errorLog) {
      const errRow = document.createElement('tr');
      errRow.id = `err-row-${recordId}`;
      errRow.className = 'error-details-row hidden';
      errRow.innerHTML = `
        <td colspan="6">
          <div class="error-trace-box"><strong>Stack Trace Diagnostics:</strong>\n${errorLog}</div>
        </td>
      `;
      logsTbody.appendChild(errRow);
    }
  });

  // Re-bind view error events
  document.querySelectorAll('.btn-view-error').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const rid = e.target.dataset.id;
      toggleErrorTrace(rid);
    });
  });
}

function toggleErrorTrace(recordId) {
  const errRow = document.getElementById(`err-row-${recordId}`);
  if (errRow) {
    errRow.classList.toggle('hidden');
  }
}

// Helper to format ISO date string
function formatDateTime(isoString) {
  if (!isoString) return 'No timestamp';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch (e) {
    return isoString;
  }
}

// Switch between view tabs
function switchView(targetTab) {
  if (targetTab === 'templates') {
    tabTemplates.classList.add('active');
    tabDashboard.classList.remove('active');
    viewTemplates.classList.add('active');
    viewDashboard.classList.remove('active');
    loadTemplates();
  } else if (targetTab === 'dashboard') {
    tabDashboard.classList.add('active');
    tabTemplates.classList.remove('active');
    viewDashboard.classList.add('active');
    viewTemplates.classList.remove('active');
    loadDashboardLogs();
  }
}

// Fire loading
window.addEventListener('DOMContentLoaded', init);

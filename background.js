// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "kidifyText",
    title: "🌟 Kidify This",
    contexts: ["selection"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "kidifyText" && info.selectionText) {
    // Send message to content script
    chrome.tabs.sendMessage(tab.id, {
      action: "kidify",
      text: info.selectionText
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getKidification") {
    kidifyWithCohere(request.text).then(sendResponse);
    return true; // Keep the message channel open for async response
  }
});

async function kidifyWithCohere(text) {
  try {
    const result = await chrome.storage.sync.get(['cohereApiKey']);
    const apiKey = result.cohereApiKey;
    
    if (!apiKey) {
      return { error: "Please set your Cohere API key in the Kidify extension" };
    }
    
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command',
        prompt: `You are Kidify, a friendly assistant that explains complex things in simple terms that a child would understand. Use simple words, short sentences, fun comparisons, and everyday examples. Be warm and encouraging.

Explain this in a simple, kid-friendly way:
"${text}"

Simple explanation:`,
        max_tokens: 250,
        temperature: 0.7,
        k: 0,
        stop_sequences: [],
        return_likelihoods: 'NONE'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to Kidify text');
    }
    
    const data = await response.json();
    return { explanation: data.generations[0].text.trim() };
  } catch (error) {
    return { error: error.message };
  }
}
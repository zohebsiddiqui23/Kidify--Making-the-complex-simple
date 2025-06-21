// Load saved API key
chrome.storage.sync.get(['cohereApiKey'], (result) => {
  if (result.cohereApiKey) {
    document.getElementById('apiKey').value = result.cohereApiKey;
  }
});

// Save API key
document.getElementById('saveKey').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value;
  chrome.storage.sync.set({ cohereApiKey: apiKey }, () => {
    // Visual feedback
    const button = document.getElementById('saveKey');
    const originalText = button.textContent;
    button.textContent = '✓ Saved';
    button.style.backgroundColor = '#4CAF50';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = '#5B4CFF';
    }, 2000);
  });
});

// Kidify button click
document.getElementById('explainBtn').addEventListener('click', async () => {
  const text = document.getElementById('textInput').value.trim();
  if (!text) {
    showError('Please enter some text to Kidify! 📝');
    return;
  }
  
  await kidifyText(text);
});

// Enter key support in textarea
document.getElementById('textInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    document.getElementById('explainBtn').click();
  }
});

async function kidifyText(text) {
  const resultDiv = document.getElementById('result');
  const explainBtn = document.getElementById('explainBtn');
  
  // Show loading state
  resultDiv.innerHTML = '<p class="loading">Kidifying your text</p>';
  resultDiv.classList.add('show');
  explainBtn.disabled = true;
  
  try {
    const apiKey = document.getElementById('apiKey').value;
    if (!apiKey) {
      throw new Error('Please enter your Cohere API key first');
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
      throw new Error('Failed to get explanation. Please check your API key.');
    }
    
    const data = await response.json();
    const explanation = data.generations[0].text.trim();
    
    resultDiv.innerHTML = `
      <h3>🌟 Kidified Explanation:</h3>
      <p>${explanation}</p>
    `;
  } catch (error) {
    showError(error.message);
  } finally {
    explainBtn.disabled = false;
  }
}

function showError(message) {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `<p class="error">${message}</p>`;
  resultDiv.classList.add('show');
}
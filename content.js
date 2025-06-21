// Create tooltip element with Kidify branding
const tooltip = document.createElement('div');
tooltip.style.cssText = `
  position: absolute;
  background: white;
  border: 2px solid #5B4CFF;
  border-radius: 12px;
  padding: 20px;
  max-width: 400px;
  min-width: 300px;
  box-shadow: 0 4px 20px rgba(91, 76, 255, 0.15);
  z-index: 2147483647;
  display: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  animation: tooltipFadeIn 0.3s ease-out;
`;

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes tooltipFadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .kidify-close-btn {
    margin-top: 15px;
    padding: 8px 16px;
    background: #5B4CFF;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    width: 100%;
  }
  
  .kidify-close-btn:hover {
    background: #4A3EE0;
    transform: translateY(-1px);
  }
  
  .kidify-copy-btn {
    margin-top: 10px;
    padding: 6px 12px;
    background: #f0f0f0;
    color: #333;
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .kidify-copy-btn:hover {
    background: #e0e0e0;
    border-color: #ccc;
  }
  
  .kidify-copy-btn.copied {
    background: #4CAF50;
    color: white;
    border-color: #4CAF50;
  }
  
  .kidify-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  
  .kidify-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #5B4CFF;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .kidify-explanation {
    background: #f8f9fa;
    padding: 12px;
    border-radius: 8px;
    margin: 10px 0;
  }
`;
document.head.appendChild(style);

const tooltipContent = document.createElement('div');
tooltip.appendChild(tooltipContent);
document.body.appendChild(tooltip);

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "kidify") {
    showKidification(request.text);
  }
});

async function showKidification(text) {
  // Show loading state with Kidify branding
  tooltipContent.innerHTML = `
    <div style="text-align: center;">
      <h3 style="margin: 0 0 10px 0; color: #5B4CFF; font-size: 18px;">Kidify</h3>
      <p style="margin: 0; color: #666; font-size: 14px;" class="kidify-loading">
        <span class="kidify-spinner"></span>
        Making it simple...
      </p>
    </div>
  `;
  
  // Position tooltip near the selection
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // Calculate position to keep tooltip within viewport
  let left = rect.left + window.scrollX;
  let top = rect.bottom + window.scrollY + 10;
  
  // Adjust if tooltip would go off-screen
  if (left + 400 > window.innerWidth) {
    left = window.innerWidth - 420;
  }
  if (left < 20) {
    left = 20;
  }
  
  // If tooltip would go below viewport, show it above the selection
  if (top + 300 > window.innerHeight + window.scrollY) {
    top = rect.top + window.scrollY - 300;
  }
  
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  tooltip.style.display = 'block';
  
  // Get kidified explanation from background script
  chrome.runtime.sendMessage(
    { action: "getKidification", text: text },
    (response) => {
      if (response.error) {
        tooltipContent.innerHTML = `
          <div>
            <h3 style="margin: 0 0 10px 0; color: #5B4CFF; font-size: 18px; display: flex; align-items: center; gap: 8px;">
              <span>Kidify</span>
              <span style="font-size: 14px; color: #999; font-weight: normal;">Making the complex simple</span>
            </h3>
            <p style="margin: 0 0 15px 0; color: #dc3545; font-size: 14px;">
              ⚠️ ${response.error}
            </p>
            <button class="kidify-close-btn">
              Got it!
            </button>
          </div>
        `;
      } else {
        const truncatedText = text.length > 50 ? text.substring(0, 50) + '...' : text;
        
        tooltipContent.innerHTML = `
          <div>
            <h3 style="margin: 0 0 10px 0; color: #5B4CFF; font-size: 18px; display: flex; align-items: center; gap: 8px;">
              <span>🌟 Kidified!</span>
            </h3>
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #666; font-style: italic;">
              "${truncatedText}"
            </p>
            <div class="kidify-explanation">
              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #333;" id="explanationText">
                ${response.explanation}
              </p>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
              <button class="kidify-copy-btn" id="copyBtn">
                📋 Copy
              </button>
              <button class="kidify-close-btn" style="width: auto; margin-top: 0;">
                Close
              </button>
            </div>
          </div>
        `;
      }
      
      // Add event listeners after content is loaded
      attachEventListeners();
    }
  );
}

function attachEventListeners() {
  // Add click handler to close button
  const closeBtn = tooltip.querySelector('.kidify-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      tooltip.style.display = 'none';
    };
  }
  
  // Add copy functionality
  const copyBtn = tooltip.querySelector('#copyBtn');
  const explanationText = tooltip.querySelector('#explanationText');
  if (copyBtn && explanationText) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(explanationText.textContent).then(() => {
        copyBtn.textContent = '✓ Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = '📋 Copy';
          copyBtn.classList.remove('copied');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    };
  }
}

// Only hide tooltip when clicking the close button or pressing Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && tooltip.style.display !== 'none') {
    tooltip.style.display = 'none';
  }
});

// Prevent tooltip from closing when clicking inside it
tooltip.addEventListener('click', (e) => {
  e.stopPropagation();
});

// Optional: Hide tooltip when clicking outside (remove this if you want it to stay open)
// document.addEventListener('click', (e) => {
//   if (!tooltip.contains(e.target)) {
//     tooltip.style.display = 'none';
//   }
// });
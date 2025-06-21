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
  cursor: default;
  user-select: text;
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
    margin-right: 10px;
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
  
  .kidify-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
  }
  
  .kidify-explanation {
    background: #f8f9fa;
    padding: 12px;
    border-radius: 8px;
    margin: 10px 0;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Make tooltip draggable visual cue */
  .kidify-header {
    cursor: move;
    user-select: none;
    margin: -20px -20px 15px -20px;
    padding: 15px 20px;
    background: #f8f7ff;
    border-radius: 12px 12px 0 0;
    border-bottom: 1px solid #e8e6ff;
  }
`;
document.head.appendChild(style);

const tooltipContent = document.createElement('div');
tooltip.appendChild(tooltipContent);
document.body.appendChild(tooltip);

// Keep tooltip open until explicitly closed
let keepTooltipOpen = true;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Make tooltip draggable
function makeTooltipDraggable() {
  const header = tooltip.querySelector('.kidify-header');
  if (!header) return;
  
  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragOffset.x = e.clientX - tooltip.offsetLeft;
    dragOffset.y = e.clientY - tooltip.offsetTop;
    tooltip.style.cursor = 'grabbing';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep tooltip within viewport
    const maxX = window.innerWidth - tooltip.offsetWidth - 20;
    const maxY = window.innerHeight - tooltip.offsetHeight - 20;
    
    tooltip.style.left = `${Math.min(Math.max(20, newX), maxX)}px`;
    tooltip.style.top = `${Math.min(Math.max(20, newY), maxY)}px`;
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
    tooltip.style.cursor = 'default';
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "kidify") {
    // Close any existing tooltip
    tooltip.style.display = 'none';
    showKidification(request.text);
  }
});

async function showKidification(text) {
  // Show loading state with Kidify branding
  tooltipContent.innerHTML = `
    <div class="kidify-header">
      <h3 style="margin: 0; color: #5B4CFF; font-size: 18px; display: flex; align-items: center; justify-content: space-between;">
        <span>Kidify</span>
        <span style="font-size: 12px; color: #999; font-weight: normal;">Making the complex simple</span>
      </h3>
    </div>
    <div style="text-align: center; padding: 20px;">
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
  
  // Make it draggable
  makeTooltipDraggable();
  
  // Get kidified explanation from background script
  chrome.runtime.sendMessage(
    { action: "getKidification", text: text },
    (response) => {
      if (response.error) {
        tooltipContent.innerHTML = `
          <div class="kidify-header">
            <h3 style="margin: 0; color: #5B4CFF; font-size: 18px;">
              Kidify
            </h3>
          </div>
          <div>
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
          <div class="kidify-header">
            <h3 style="margin: 0; color: #5B4CFF; font-size: 18px; display: flex; align-items: center; gap: 8px;">
              <span>🌟 Kidified!</span>
            </h3>
          </div>
          <div>
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #666; font-style: italic;">
              "${truncatedText}"
            </p>
            <div class="kidify-explanation">
              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #333;" id="explanationText">
                ${response.explanation}
              </p>
            </div>
            <div class="kidify-buttons">
              <button class="kidify-copy-btn" id="copyBtn">
                📋 Copy Explanation
              </button>
              <button class="kidify-close-btn" style="width: auto; margin-top: 0;">
                Close
              </button>
            </div>
          </div>
        `;
      }
      
      // Add click handler to close button
      const closeBtn = tooltip.querySelector('.kidify-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          tooltip.style.display = 'none';
        });
      }
      
      // Add copy functionality
      const copyBtn = tooltip.querySelector('#copyBtn');
      const explanationText = tooltip.querySelector('#explanationText');
      if (copyBtn && explanationText) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(explanationText.textContent).then(() => {
            copyBtn.textContent = '✓ Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
              copyBtn.textContent = '📋 Copy Explanation';
              copyBtn.classList.remove('copied');
            }, 2000);
          });
        });
      }
      
      // Re-enable dragging for the new content
      makeTooltipDraggable();
    }
  );
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

// Make sure tooltip stays on top
const checkZIndex = () => {
  const maxZ = Math.max(
    ...Array.from(document.querySelectorAll('*'))
      .map(el => parseInt(window.getComputedStyle(el).zIndex) || 0)
  );
  if (maxZ > parseInt(tooltip.style.zIndex)) {
    tooltip.style.zIndex = maxZ + 1;
  }
};

// Check z-index when showing tooltip
const observer = new MutationObserver(() => {
  if (tooltip.style.display !== 'none') {
    checkZIndex();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Keep tooltip visible on scroll
window.addEventListener('scroll', () => {
  // Tooltip stays open - no action needed
});

// Add resize handler to keep tooltip in viewport
window.addEventListener('resize', () => {
  if (tooltip.style.display === 'none') return;
  
  const rect = tooltip.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - 20;
  const maxY = window.innerHeight - rect.height - 20;
  
  if (rect.left > maxX) {
    tooltip.style.left = `${maxX}px`;
  }
  if (rect.top > maxY) {
    tooltip.style.top = `${maxY}px`;
  }
});
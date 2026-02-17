// Force PWA installation utilities for different browsers

export const forceBrowserInstall = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg');
  const isEdge = userAgent.includes('edg');
  const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
  const isFirefox = userAgent.includes('firefox');
  
  console.log('Force install - Browser detection:', { isChrome, isEdge, isSafari, isFirefox });

  // Try to trigger browser-specific install methods
  if (isChrome || isEdge) {
    return forceChromeEdgeInstall();
  } else if (isSafari) {
    return forceSafariInstall();
  } else if (isFirefox) {
    return forceFirefoxInstall();
  } else {
    return forceGenericInstall();
  }
};

const forceChromeEdgeInstall = () => {
  console.log('Attempting Chrome/Edge force install...');
  
  // Method 1: Try to trigger beforeinstallprompt manually
  if (window.deferredPrompt) {
    console.log('Using existing deferred prompt');
    return window.deferredPrompt.prompt();
  }
  
  // Method 2: Create and dispatch beforeinstallprompt event
  try {
    const event = new Event('beforeinstallprompt');
    event.prompt = () => {
      console.log('Manual prompt triggered');
      return Promise.resolve();
    };
    event.userChoice = Promise.resolve({ outcome: 'accepted' });
    
    window.dispatchEvent(event);
    
    // Method 3: Try to access Chrome's install API
    if ('getInstalledRelatedApps' in navigator) {
      navigator.getInstalledRelatedApps().then(apps => {
        console.log('Installed apps:', apps);
      });
    }
    
    // Method 4: Show Chrome-specific instructions
    showChromeInstallInstructions();
    return Promise.resolve({ success: true, method: 'manual' });
  } catch (error) {
    console.error('Chrome force install error:', error);
    showChromeInstallInstructions();
    return Promise.resolve({ success: false, error: error.message });
  }
};

const forceSafariInstall = () => {
  console.log('Attempting Safari force install...');
  
  // Safari doesn't support beforeinstallprompt, so show instructions
  showSafariInstallInstructions();
  return Promise.resolve({ success: true, method: 'manual' });
};

const forceFirefoxInstall = () => {
  console.log('Attempting Firefox force install...');
  
  // Firefox has limited PWA support, show instructions
  showFirefoxInstallInstructions();
  return Promise.resolve({ success: true, method: 'manual' });
};

const forceGenericInstall = () => {
  console.log('Attempting generic browser force install...');
  
  showGenericInstallInstructions();
  return Promise.resolve({ success: true, method: 'manual' });
};

const showChromeInstallInstructions = () => {
  const modal = createInstructionModal(
    'Install E-Gura Store in Chrome',
    `To install E-Gura Store in Chrome:

1. Look for the install icon (⊕) in the address bar
2. Click it and select "Install"
3. Or click the menu (⋮) → "Install E-Gura Store"
4. Click "Install" in the popup

The app will be added to your applications and home screen.`,
    '🌐'
  );
  
  document.body.appendChild(modal);
};

const showSafariInstallInstructions = () => {
  const modal = createInstructionModal(
    'Install E-Gura Store in Safari',
    `To install E-Gura Store in Safari:

1. Tap the Share button (📤) at the bottom
2. Scroll down and tap "Add to Home Screen"
3. Edit the name if needed
4. Tap "Add" to confirm

The app icon will appear on your home screen.`,
    '🧭'
  );
  
  document.body.appendChild(modal);
};

const showFirefoxInstallInstructions = () => {
  const modal = createInstructionModal(
    'Install E-Gura Store in Firefox',
    `To install E-Gura Store in Firefox:

1. Click the menu (☰) in the top-right
2. Look for "Install" or "Add to Home Screen"
3. Click it and follow the prompts
4. Or bookmark the page for quick access

Note: Firefox has limited PWA support on some devices.`,
    '🦊'
  );
  
  document.body.appendChild(modal);
};

const showGenericInstallInstructions = () => {
  const modal = createInstructionModal(
    'Install E-Gura Store',
    `To install E-Gura Store:

1. Look for an install option in your browser menu
2. Check the address bar for install icons
3. Or bookmark this page for quick access
4. Some browsers may not support app installation

You can always bookmark this page for easy access.`,
    '📱'
  );
  
  document.body.appendChild(modal);
};

const createInstructionModal = (title, instructions, icon) => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
  modal.style.zIndex = '9999';
  
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 animate-scale-in">
      <div class="p-6 text-center">
        <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl">${icon}</span>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-4">${title}</h3>
        <div class="text-sm text-gray-600 text-left whitespace-pre-line mb-6">${instructions}</div>
        <button onclick="this.closest('.fixed').remove()" 
                class="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors">
          Got It!
        </button>
      </div>
    </div>
  `;
  
  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (document.body.contains(modal)) {
      modal.remove();
    }
  }, 30000);
  
  return modal;
};

// Function to check if PWA can be installed
export const canForceInstall = () => {
  // Check if we have a deferred prompt
  if (window.deferredPrompt) {
    return { canInstall: true, method: 'native' };
  }
  
  // Check browser capabilities
  const userAgent = navigator.userAgent.toLowerCase();
  const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg');
  const isEdge = userAgent.includes('edg');
  const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
  
  if (isChrome || isEdge || isSafari) {
    return { canInstall: true, method: 'manual' };
  }
  
  return { canInstall: true, method: 'fallback' };
};

// Function to simulate install prompt for testing
export const simulateInstallPrompt = () => {
  console.log('Simulating install prompt for testing...');
  
  // Create a fake deferred prompt for testing
  const fakePrompt = {
    prompt: () => {
      console.log('Fake prompt.prompt() called');
      return Promise.resolve();
    },
    userChoice: Promise.resolve({ outcome: 'accepted' })
  };
  
  window.deferredPrompt = fakePrompt;
  
  // Dispatch beforeinstallprompt event
  const event = new Event('beforeinstallprompt');
  event.prompt = fakePrompt.prompt;
  event.userChoice = fakePrompt.userChoice;
  
  window.dispatchEvent(event);
  
  return fakePrompt;
};

export default {
  forceBrowserInstall,
  canForceInstall,
  simulateInstallPrompt
};

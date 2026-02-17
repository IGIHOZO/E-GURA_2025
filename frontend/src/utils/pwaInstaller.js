// PWA Installation utilities
let deferredPrompt = null;

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA: beforeinstallprompt event captured');
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  window.deferredPrompt = e; // Make it globally available
  
  // Log event details
  console.log('PWA: Install prompt available', {
    platforms: e.platforms,
    userChoice: e.userChoice
  });
});

// Listen for the app installed event
window.addEventListener('appinstalled', (e) => {
  console.log('PWA: App was installed successfully');
  deferredPrompt = null;
  window.deferredPrompt = null;
});

// Function to trigger install
export const triggerInstall = async () => {
  console.log('PWA: Attempting to trigger install...');
  
  if (deferredPrompt || window.deferredPrompt) {
    const prompt = deferredPrompt || window.deferredPrompt;
    console.log('PWA: Using deferred prompt', prompt);
    
    try {
      // Show the install prompt
      console.log('PWA: Calling prompt.prompt()...');
      const result = await prompt.prompt();
      console.log('PWA: Install prompt shown', result);
      
      // Wait for the user to respond to the prompt
      console.log('PWA: Waiting for user choice...');
      const choiceResult = await prompt.userChoice;
      console.log('PWA: User choice result', choiceResult);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
        return { success: true, method: 'native' };
      } else {
        console.log('PWA: User dismissed the install prompt');
        return { success: false, method: 'native', reason: 'user_dismissed' };
      }
    } catch (error) {
      console.error('PWA: Error during install', error);
      return { success: false, method: 'native', error: error.message };
    } finally {
      // Clear the deferredPrompt
      deferredPrompt = null;
      window.deferredPrompt = null;
    }
  } else {
    console.log('PWA: No install prompt available, need manual installation');
    return { success: false, method: 'manual', reason: 'no_prompt' };
  }
};

// Check if PWA is installable
export const isInstallable = () => {
  return !!(deferredPrompt || window.deferredPrompt);
};

// Check if PWA is already installed
export const isInstalled = () => {
  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check if running in PWA mode on iOS
  if (window.navigator.standalone === true) {
    return true;
  }
  
  return false;
};

// Get installation status
export const getInstallStatus = () => {
  return {
    isInstallable: isInstallable(),
    isInstalled: isInstalled(),
    hasPrompt: !!(deferredPrompt || window.deferredPrompt)
  };
};

export default {
  triggerInstall,
  isInstallable,
  isInstalled,
  getInstallStatus
};

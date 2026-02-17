// Utility to dynamically create app icons for PWA installation

export const createAppIcon = (size) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = size;
  canvas.height = size;
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#f97316'); // Orange-500
  gradient.addColorStop(1, '#ea580c'); // Orange-600
  
  // Fill background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Add rounded corners (manual implementation for compatibility)
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  const radius = size * 0.2; // 20% radius for rounded corners
  
  // Manual rounded rectangle path
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();
  
  // Reset composite operation
  ctx.globalCompositeOperation = 'source-over';
  
  // Add shopping bag icon
  const iconSize = size * 0.5;
  const iconX = (size - iconSize) / 2;
  const iconY = (size - iconSize) / 2;
  
  // Draw shopping bag
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = size * 0.05;
  
  // Bag body
  const bagWidth = iconSize * 0.8;
  const bagHeight = iconSize * 0.7;
  const bagX = iconX + (iconSize - bagWidth) / 2;
  const bagY = iconY + iconSize * 0.3;
  
  ctx.fillRect(bagX, bagY, bagWidth, bagHeight);
  
  // Bag handles
  const handleRadius = bagWidth * 0.15;
  const handleY = bagY - handleRadius;
  
  ctx.beginPath();
  ctx.arc(bagX + bagWidth * 0.3, handleY, handleRadius, 0, Math.PI, true);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(bagX + bagWidth * 0.7, handleY, handleRadius, 0, Math.PI, true);
  ctx.stroke();
  
  // Add "E" letter
  ctx.font = `bold ${size * 0.15}px Arial`;
  ctx.fillStyle = '#f97316';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('E', bagX + bagWidth / 2, bagY + bagHeight / 2);
  
  return canvas.toDataURL('image/png');
};

export const generateAllIcons = () => {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const icons = {};
  
  sizes.forEach(size => {
    icons[size] = createAppIcon(size);
  });
  
  return icons;
};

export const injectIconsIntoDOM = () => {
  console.log('Creating and injecting app icons...');
  
  const icons = generateAllIcons();
  
  Object.entries(icons).forEach(([size, dataUrl]) => {
    // Create blob URL for better performance
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        
        // Create icon link element
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.sizes = `${size}x${size}`;
        link.href = blobUrl;
        
        // Remove existing icon of same size
        const existing = document.querySelector(`link[rel="icon"][sizes="${size}x${size}"]`);
        if (existing) {
          existing.remove();
        }
        
        document.head.appendChild(link);
        console.log(`Icon created: ${size}x${size}`);
      });
  });
  
  // Create apple-touch-icon
  const appleIcon = createAppIcon(180); // iOS prefers 180x180
  fetch(appleIcon)
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      
      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = blobUrl;
      
      // Remove existing apple icon
      const existingApple = document.querySelector('link[rel="apple-touch-icon"]');
      if (existingApple) {
        existingApple.remove();
      }
      
      document.head.appendChild(appleLink);
      console.log('Apple touch icon created');
    });
};

export const createManifestBlob = () => {
  const manifest = {
    name: 'E-Gura Store - Rwanda\'s #1 Online Shopping Platform',
    short_name: 'E-Gura',
    description: 'Shop electronics, fashion, home & kitchen at Rwanda\'s best online store. Free delivery in Kigali, secure mobile money payments.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f97316',
    orientation: 'portrait-primary',
    scope: '/',
    id: 'egura-store-pwa',
    categories: ['shopping', 'lifestyle', 'business'],
    icons: [
      {
        src: createAppIcon(192),
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: createAppIcon(512),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    shortcuts: [
      {
        name: 'Shop Now',
        short_name: 'Shop',
        description: 'Browse all products',
        url: '/shop',
        icons: [{ src: createAppIcon(96), sizes: '96x96' }]
      },
      {
        name: 'My Cart',
        short_name: 'Cart',
        description: 'View your shopping cart',
        url: '/cart',
        icons: [{ src: createAppIcon(96), sizes: '96x96' }]
      }
    ]
  };
  
  const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
    type: 'application/json'
  });
  
  return URL.createObjectURL(manifestBlob);
};

export const injectManifest = () => {
  console.log('Creating and injecting manifest...');
  
  const manifestUrl = createManifestBlob();
  
  // Remove existing manifest
  const existingManifest = document.querySelector('link[rel="manifest"]');
  if (existingManifest) {
    existingManifest.remove();
  }
  
  // Create new manifest link
  const manifestLink = document.createElement('link');
  manifestLink.rel = 'manifest';
  manifestLink.href = manifestUrl;
  
  document.head.appendChild(manifestLink);
  console.log('Manifest injected');
};

export const setupPWAMeta = () => {
  console.log('Setting up PWA meta tags...');
  
  const metaTags = [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'apple-mobile-web-app-title', content: 'E-Gura Store' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'theme-color', content: '#f97316' },
    { name: 'msapplication-TileColor', content: '#f97316' },
    { name: 'msapplication-navbutton-color', content: '#f97316' },
    { name: 'application-name', content: 'E-Gura Store' },
    { name: 'apple-touch-fullscreen', content: 'yes' },
    { name: 'format-detection', content: 'telephone=no' }
  ];
  
  metaTags.forEach(tag => {
    // Remove existing meta tag
    const existing = document.querySelector(`meta[name="${tag.name}"]`);
    if (existing) {
      existing.remove();
    }
    
    // Create new meta tag
    const meta = document.createElement('meta');
    meta.name = tag.name;
    meta.content = tag.content;
    document.head.appendChild(meta);
  });
  
  console.log('PWA meta tags setup complete');
};

export const initializePWAAssets = () => {
  console.log('Initializing PWA assets...');
  
  // Setup all PWA assets
  setupPWAMeta();
  injectIconsIntoDOM();
  injectManifest();
  
  console.log('PWA assets initialization complete');
};

export default {
  createAppIcon,
  generateAllIcons,
  injectIconsIntoDOM,
  injectManifest,
  setupPWAMeta,
  initializePWAAssets
};

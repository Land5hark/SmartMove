// Simple script to generate PWA icons
const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#000000" rx="64"/>
  <rect x="64" y="64" width="384" height="384" fill="none" stroke="#ffffff" stroke-width="8" rx="32"/>
  <rect x="128" y="128" width="256" height="64" fill="#ffffff" rx="8"/>
  <rect x="128" y="224" width="256" height="64" fill="#ffffff" rx="8"/>
  <rect x="128" y="320" width="256" height="64" fill="#ffffff" rx="8"/>
  <circle cx="160" cy="160" r="16" fill="#000000"/>
  <circle cx="160" cy="256" r="16" fill="#000000"/>
  <circle cx="160" cy="352" r="16" fill="#000000"/>
  <text x="256" y="448" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="32" font-weight="bold">SM</text>
</svg>
`;

// Write the SVG file
fs.writeFileSync(path.join(__dirname, '../public/icon.svg'), svgIcon);
console.log('Generated PWA icon SVG');
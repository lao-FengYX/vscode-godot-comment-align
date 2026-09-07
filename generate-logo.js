const sharp = require('sharp')
const path = require('path')

// Create an SVG logo for Godot Comment Align extension
// Design: A stylized "#" symbol with alignment lines, using Godot-inspired colors
const size = 128
const svgLogo = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a2332;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2d4a5e;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="hash" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#478cbf;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6bb5e0;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background rounded rectangle -->
  <rect x="0" y="0" width="${size}" height="${size}" rx="24" ry="24" fill="url(#bg)" />

  <!-- Hash symbol (#) - main element -->
  <g stroke="url(#hash)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <!-- Vertical lines -->
    <line x1="48" y1="28" x2="42" y2="100" />
    <line x1="80" y1="28" x2="74" y2="100" />
    <!-- Horizontal lines -->
    <line x1="32" y1="50" x2="96" y2="50" />
    <line x1="32" y1="78" x2="96" y2="78" />
  </g>

  <!-- Alignment indicator - small arrows on the right showing alignment -->
  <g stroke="#8ab4d6" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.8">
    <!-- Top alignment guide -->
    <line x1="108" y1="30" x2="116" y2="30" />
    <polyline points="114,26 118,30 114,34" />
    <!-- Middle alignment guide -->
    <line x1="108" y1="50" x2="116" y2="50" />
    <polyline points="114,46 118,50 114,54" />
    <!-- Bottom alignment guide -->
    <line x1="108" y1="78" x2="116" y2="78" />
    <polyline points="114,74 118,78 114,82" />
    <!-- Bottom alignment guide -->
    <line x1="108" y1="98" x2="116" y2="98" />
    <polyline points="114,94 118,98 114,102" />
  </g>

  <!-- Small Godot-inspired dot (representing the node) -->
  <circle cx="96" cy="16" r="4" fill="#6bb5e0" opacity="0.6" />
</svg>
`

async function generateLogo() {
  try {
    // Create a 128x128 PNG from SVG
    const pngBuffer = await sharp(Buffer.from(svgLogo)).resize(size, size).png().toBuffer()

    const outputPath = path.join(__dirname, 'icon.png')
    await sharp(pngBuffer).toFile(outputPath)
    console.log(`Logo generated successfully: ${outputPath}`)
    console.log(`Size: ${size}x${size} PNG`)
  } catch (err) {
    console.error('Error generating logo:', err)
    process.exit(1)
  }
}

generateLogo()

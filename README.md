# 🎨 Kids Drawing App

🌐 **[Play Online](https://aaronc1992.github.io/kids-drawing-app/)** | 📱 **[Download Android App](https://github.com/AaronC1992/kids-drawing-app/raw/main/release-v1.1.4/kids-drawing-app-v1.1.4.apk)**

A fun, interactive drawing application designed for kids with colorful effects, animated tools, and special brushes!

## ✨ Features

### 🖌️ Drawing Tools
- **Basic Brushes**: Regular brush, wobbly crayon, fade brush, blend brush, spray paint
- **Special Effects**: Glitter, neon glow, balloons, fireworks, streamers, confetti
- **Animated Effects**: Colorful worms, lightning bolts, animated bugs
- **Nature Brushes**: Train tracks with animated trains, leaf trails, flower chains, grass stamper
- **Creative Tools**: Blocky builder, mirror painting (kaleidoscope effect)
- **Utilities**: Fill bucket, eraser

### 🎨 Color Options
- 10+ preset vibrant colors
- 🌈 Rainbow mode (automatically cycles through colors)
- Custom color picker for unlimited color choices
- Color-scheme aware styling to prevent dark mode issues

### 📐 Canvas Features
- Adjustable brush size (1-50 pixels)
- Zoom in/out controls
- Undo functionality
- Clear canvas
- Save drawing as PNG image
- **Orientation-safe**: Drawing is preserved when rotating tablet/device

### 🎯 Accessibility & UX
- Reduced motion toggle for users sensitive to animations
- Large, touch-friendly buttons optimized for tablets
- Colorful, kid-friendly interface with animations
- Dropdown toolbar categories to organize tools
- Visual feedback for active tools
- Persistent tool settings (remembers your last tool, brush size, and color)

### 📱 Progressive Web App (PWA)
- **Install to Home Screen**: Works like a native app on tablets and phones
- **Offline Support**: Works without internet after first visit
- **Full Screen Mode**: Launches without browser UI for immersive drawing
- **Automatic Updates**: Gets new features automatically

## 🚀 Live Demo

Visit: [https://aaronc1992.github.io/kids-drawing-app/](https://aaronc1992.github.io/kids-drawing-app/)

## 📲 Installation

### On Android Tablets/Phones:
1. Visit the app URL in Chrome or Edge
2. Tap the "Add to Home Screen" banner or menu option
3. Tap "Install" or "Add"
4. App icon appears on your home screen!

### On iPad/iOS:
1. Visit the app URL in Safari
2. Tap the Share button (□↑)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. App icon appears on your home screen!

### On Desktop:
1. Visit the app URL in Chrome or Edge
2. Look for the install icon (⊕ or ⬇) in the address bar
3. Click "Install"
4. App opens in its own window!

## 🛠️ Technical Details

### Built With:
- **HTML5 Canvas** for drawing
- **Vanilla JavaScript** (no frameworks needed!)
- **CSS3** with animations and gradients
- **Service Worker** for offline functionality
- **localStorage** for persistent settings

### Performance Optimizations:
- Particle system with spawn throttling
- Maximum particle cap to prevent lag
- Separate overlay canvas for animations
- Central animation loop using `requestAnimationFrame`
- Reduced motion support for accessibility

### Browser Compatibility:
- Chrome/Edge (recommended for best PWA experience)
- Safari (iOS/macOS)
- Firefox
- Modern mobile browsers

## 📂 Project Structure

```
kids-drawing-app/
├── index.html              # Main app HTML
├── app.js                  # Core drawing logic
├── styles.css              # All styling and animations
├── manifest.json           # PWA configuration
├── sw.js                   # Service Worker for offline support
├── offline.html            # Offline fallback page
├── modules/
│   ├── persistence.js      # localStorage management
│   └── ui.js               # UI helper functions
├── icon-192.png            # App icon (192x192)
├── icon-512.png            # App icon (512x512)
└── README.md               # This file!
```

## 🎮 How to Use

1. **Choose a Tool**: Click on the toolbar categories (Brushes & Effects, Tools, Actions, Colors)
2. **Select a Color**: Pick from preset colors or use the color picker for custom colors
3. **Adjust Brush Size**: Use the size slider to make your brush bigger or smaller
4. **Draw**: Touch/click and drag on the canvas to draw!
5. **Special Tools**:
   - **Train Track**: Draw tracks, then watch animated trains follow them!
   - **Mirror Painting**: Creates beautiful kaleidoscope patterns
   - **Fireworks**: Click to launch realistic fireworks
   - **Glitter**: Creates blinking sparkles that stay on the canvas
6. **Save Your Art**: Click the 💾 Save button to download your masterpiece!

## 🔧 Development

### Running Locally:
```bash
# Clone the repository
git clone https://github.com/AaronC1992/kids-drawing-app.git
cd kids-drawing-app

# Start a local server (Python 3)
python -m http.server 8000

# Or use Node.js
npx http-server -p 8000

# Visit http://localhost:8000 in your browser
```

### Making Changes:
1. Edit the files
2. Test locally
3. Commit changes: `git add . && git commit -m "your message"`
4. Push to GitHub: `git push origin main`
5. Changes go live automatically via GitHub Pages!

## 🐛 Known Issues & Fixes

### Issue: Canvas clears when rotating tablet
**Status**: ✅ FIXED - Drawing is now preserved during orientation changes

### Issue: Toolbar looks plain/unstyled
**Status**: ✅ FIXED - All CSS styling restored

### Version 1.1.4.0 (Magnifier Improvements)
**New / Improved:**
- Full magnifier support for ALL drawing tools and effects
- Overlay content (trains, particles, glitter, fireworks, etc.) visible inside magnifier
- Magnifier button resized for consistent toolbar layout
- Cursor now only hides while directly over magnifier (no more lost pointer)

**Fixes:**
- Cursor occasionally disappeared after leaving magnifier
- Trains/effects missing inside magnified view
- Button width mismatch in toolbar

**Notes:** Minor internal refactors to unify drawing logic between normal canvas and magnifier.

## 🎯 Roadmap / Future Features

- [ ] Settings modal for advanced options
- [ ] More drawing tools (stamp tool, shape tools)
- [ ] Drawing gallery to save multiple pictures
- [ ] Undo/Redo with history navigation
- [ ] Export to different formats (SVG, PDF)
- [ ] Collaborative drawing mode

## 📝 License

This project is open source and available for personal and educational use.

## 👤 Author

Created by AaronC - A fun drawing app for creative kids!

## 🙏 Acknowledgments

- Designed with kids in mind - colorful, fun, and easy to use
- Inspired by the joy of creative expression
- Built to work offline so kids can draw anywhere, anytime

---

**Have fun drawing! 🎨✨**
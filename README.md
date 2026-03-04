# Cherry's Magic Tiles - Rhythm Game 🎮

A fully-featured, production-ready browser-based rhythm game inspired by popular piano tile games.

## 🎯 Features

### Core Gameplay
- **3 Difficulty Levels**: Easy, Normal, and Hard with different speeds and spawn rates
- **Precise Timing System**: Perfect and Good hit zones with visual feedback
- **Dynamic Difficulty**: Game speed gradually increases from 1.0x to 2.0x over time
- **Combo System**: Build combos to increase your score multiplier (up to 4x)

### Visual & Audio
- **Particle Effects**: Stunning visual feedback for tile hits
- **Sound Effects**: Different audio cues for perfect hits, good hits, and misses
- **Screen Shake**: Optional screen shake effect on missed tiles
- **Smooth Animations**: 60 FPS gameplay with CSS animations

### Game Modes & Controls
- **Keyboard Support**: 
  - `P` - Pause/Resume
  - `ESC` - Open menu
  - `1-4` or `D-F-J-K` - Hit tiles in columns
- **Mouse/Touch**: Click or tap on tiles
- **Settings**: Customizable music volume, SFX volume, particle effects, and screen shake

### Progression & Stats
- **High Score**: Persistent high score saved to localStorage
- **Real-time Stats**: Accuracy, perfect hits, combo, and speed tracking
- **Game Over Summary**: Complete statistics with best combo and accuracy percentage

## 🚀 How to Play

1. **Select Difficulty**: Choose Easy, Normal, or Hard on the start screen
2. **Start Game**: Click "Start Game" or press Enter
3. **Hit the Tiles**: Click tiles as they reach the red hit line at the bottom
4. **Perfect Timing**: Hit tiles in the golden zone for bonus points and golden effects
5. **Build Combos**: Chain successful hits to increase your multiplier

## 🎮 Scoring System

- **Perfect Hit**: 150 points + combo multiplier (within perfect zone)
- **Good Hit**: 50 points + combo multiplier (within hit zone)
- **Miss**: -20 points and combo reset

### Multipliers
- **x1**: Default (0-9 combo)
- **x2**: 10+ combo
- **x3**: 30+ combo
- **x4**: 50+ combo

## 🛠️ Technical Details

- **Pure Vanilla JavaScript**: No frameworks or external dependencies
- **Web Audio API**: For dynamic sound generation
- **Canvas Particle System**: Hardware-accelerated particle effects
- **localStorage**: For persistent high scores and settings
- **CSS3 Animations**: Smooth, performant animations
- **Responsive Design**: Works on desktop and mobile devices

## 📦 Installation

Simply open `index.html` in a modern web browser. No build process required!

For local development:
```bash
# Start a local web server (Python 3)
python3 -m http.server 8080

# Or use Node.js
npx http-server -p 8080
```

Then navigate to `http://localhost:8080`

## 🎨 Game Structure

- `index.html` - Game structure and UI elements
- `style.css` - Styling and animations
- `game.js` - Complete game logic and functionality

## 🔧 Configuration

You can customize the game by modifying the `CONFIG` object in `game.js`:

```javascript
const CONFIG = {
    tileHeight: 100,        // Height of each tile
    columnWidth: 112.5,     // Width of each column
    hitZone: 100,           // Hit detection zone height
    perfectZone: 45,        // Perfect hit zone height
    // ... more options
};
```

## 🎯 Keyboard Shortcuts

- `P` - Pause/Resume game
- `ESC` - Back to menu/Close settings
- `1`, `2`, `3`, `4` - Hit tiles in columns 1-4
- `D`, `F`, `J`, `K` - Alternative column controls

## 📱 Browser Support

Works on all modern browsers that support:
- Web Audio API
- Canvas API
- CSS3 Animations
- localStorage
- ES6 JavaScript

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Known Issues

None! The game is fully functional and production-ready.

## 📄 License

This project is open source and available for educational purposes.

## 🙏 Credits

Created as a demonstration of vanilla JavaScript game development.

---

**Enjoy the game!** 🎵✨
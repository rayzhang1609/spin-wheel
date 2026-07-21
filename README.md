# 🎡 Spinning Wheel Application

A vibrant, modern spinning wheel application with three exciting modes! Built with modern web technologies and featuring a fun, poppy UI inspired by current social media and gaming trends.

## 🚀 Features

### Three Dynamic Modes

#### 1. **Regular Spin Mode** 🎯
- Classic spinning wheel experience
- Win any prize multiple times
- Unlimited spins for endless fun
- Perfect for casual entertainment

#### 2. **Knockout Mode** 💣
- Spin to win, but with a twist!
- Each prize can only be won ONCE
- Once claimed, items are eliminated from the wheel
- Build tension as options narrow down
- Crown the final winner!

#### 3. **Admin Control Panel** ⚙️
- Customize all wheel items and properties
- Add/edit/delete prizes
- Change colors and emojis
- Adjust spin duration and animation settings
- Real-time preview of wheel changes
- Settings sync across all modes

## 🎨 Modern Design Features

- **Vibrant Color Palette**: Neon pinks, cyans, purples, and golds
- **Smooth Animations**: Bouncing titles, glowing effects, pop-in transitions
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern Glassmorphism**: Frosted glass UI elements with backdrop blur
- **Interactive Elements**: Hover effects, floating animations, dynamic shadows
- **Confetti Celebrations**: Win animations with particle effects
- **Live Updates**: Real-time syncing between modes via Server-Sent Events (SSE)

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Advanced animations, gradients, and effects
- **JavaScript** - Canvas-based wheel rendering, animations
- **Fonts**: Fredoka One (display), Fredoka (UI), Nunito (body)

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web server and API
- **File-based Storage** - JSON data persistence
- **Server-Sent Events (SSE)** - Real-time updates

## 📁 Project Structure

```
spin wheel projct/
├── frontend/
│   ├── index.html          # Landing page with mode selection
│   ├── spin.html           # Regular spin wheel mode
│   ├── knockout.html       # Knockout elimination mode
│   ├── edit.html           # Admin control panel
│   ├── css/
│   │   ├── style.css       # Main styles (modern, vibrant theme)
│   │   └── edit.css        # Admin panel specific styles
│   └── js/
│       ├── wheel.js        # Core wheel rendering logic
│       ├── spin.js         # Regular spin mode logic
│       ├── knockout.js     # Knockout mode logic
│       └── edit.js         # Admin panel logic
└── backend/
    ├── server.js           # Express server and API
    ├── package.json        # Dependencies
    └── data/
        └── wheel.json      # Wheel data storage
```

## 🎮 How to Use

### Getting Started
1. Navigate to `http://localhost:3000`
2. Choose your mode from the vibrant landing page
3. Start spinning!

### Regular Spin
- Click the big **SPIN!** button
- Wheel rotates and lands on a prize
- Result appears at the top in a glowing banner
- Spin again immediately - no limits!

### Knockout Mode
- Same as regular spin, but with elimination
- When you win a prize, it disappears from the wheel
- Remaining items counter updates
- Watch prizes get crossed off
- When only one item remains, it's crowned the winner! 👑

### Admin Panel
- Add new prizes: Enter label, choose color, add emoji
- Edit existing items inline
- Delete items (minimum 2 required)
- Adjust spin duration (1000-15000ms)
- Set min/max rotation spins
- Preview changes in real-time
- All changes sync instantly to both modes

## 🎨 Customization

### Colors
Edit `css/style.css` CSS variables:
```css
:root {
  --accent-pink: #ff1493;
  --accent-yellow: #ffd700;
  --accent-cyan: #00d4ff;
  --accent-purple: #da70d6;
  /* ...more colors */
}
```

### Animations
Adjust animation speeds in `css/style.css`:
- `titleBounce`: 2.5s
- `glowRotate`: 10s (idle), 2s (spinning)
- `buttonPulse`: 1.2s

### Default Prizes
Edit `backend/data/wheel.json`:
```json
{
  "items": [
    { "label": "Prize Name", "color": "#FF1493", "emoji": "🎁" },
    ...
  ]
}
```

## 🚀 Installation & Running

### Prerequisites
- Node.js (v14+)
- npm

### Setup
```bash
cd backend
npm install
```

### Run Server
```bash
npm start
# Server runs on http://localhost:3000
```

## 📱 Responsive Breakpoints
- **Desktop**: Full experience with all animations
- **Tablet** (< 800px): Adjusted layouts, touch-friendly
- **Mobile** (< 480px): Scaled-down wheel, single-column layout

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/wheel` | Get current wheel data |
| `GET` | `/api/events` | Server-Sent Events stream |
| `PUT` | `/api/wheel` | Update entire wheel |
| `POST` | `/api/wheel/items` | Add new item |
| `PUT` | `/api/wheel/items/:index` | Update item |
| `DELETE` | `/api/wheel/items/:index` | Delete item |

## 🎬 Animation Effects

- **Title Bounce**: Continuous upward motion with scale
- **Pointer Pulse**: Yellow pointer glows and scales
- **Glow Rotate**: Background aura rotates continuously
- **Button Pulse**: Center button text gently scales
- **Confetti Pop**: Particle burst on win
- **Banner Slide In**: Result slides down from top
- **Winner Pop**: Final winner scales up dramatically
- **Crown Bounce**: Crown emoji bounces and rotates

## 🌟 Current Generation UI Traits

✅ Neon color scheme inspired by TikTok/Instagram  
✅ Glassmorphism with blur effects  
✅ Vibrant gradients and shadows  
✅ Smooth, bouncy animations  
✅ Bold typography with uppercase text  
✅ Emoji-heavy design  
✅ Interactive hover effects  
✅ Mobile-first responsive design  
✅ Satisfying feedback animations  

## 🐛 Troubleshooting

**Wheel not spinning?**
- Check browser console for errors
- Ensure backend is running
- Verify `/api/wheel` endpoint responds

**Changes not syncing?**
- Refresh page (live updates via SSE)
- Check network tab for `/api/events` connection
- Verify browser supports EventSource

**Styling issues?**
- Clear browser cache
- Check CSS file is loading (Network tab)
- Verify fonts are loading from Google Fonts

## 📝 License

This project is open source and available for personal and commercial use.

## 🎉 Have Fun!

Spin, win, and enjoy the vibrant experience! Perfect for:
- Giveaways and contests
- Decision making
- Party games
- Educational activities
- Entertainment

**Happy spinning! 🎡✨**

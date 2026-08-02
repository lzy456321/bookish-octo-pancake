# PocketCanvas 🎨

> **Mobile-first Visual Agent Interface**  
> Turn AI agent interactions into a spatial, graphical experience on your phone.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PWA](https://img.shields.io/badge/PWA-Ready-blue)](#)
[![Mobile First](https://img.shields.io/badge/Mobile-First-green)](#)

**PocketCanvas** is an open-source, mobile-oriented Agent Harness that replaces the traditional linear chat interface with an **infinite visual canvas**.

Messages, thoughts, tool calls, and results become **draggable cards**. You can rearrange context, force connections, pin important memories, and watch the agent’s execution flow in real time through animated nodes and edges.

Perfect for exploring Agent Harness concepts: context management, tool orchestration, state visualization, and human-in-the-loop control — all optimized for touch interaction on phones.

---

## ✨ Features

- **Infinite Canvas** — Pan, zoom, and freely arrange agent state on mobile
- **Card-based Interaction** — User messages, agent thoughts, tool calls, and results as visual nodes
- **Gesture Friendly** — Drag cards, pinch-to-zoom, long-press menus
- **Visual Execution Flow** — Watch the agent think and call tools with animated connections
- **Context Control** — Pin, group, or delete cards to shape the agent’s working memory
- **PWA Ready** — Add to Home Screen for near-native experience
- **Mock Agent included** — Fully functional demo without any API key
- **DeepSeek-ready** — Easy to plug in real LLM providers later

---

## 📱 Screenshots (Concept)

| Home Canvas | Agent Thinking | Tool Call Flow |
|-------------|----------------|----------------|
| Cards floating on infinite board | Thinking nodes appear & connect | Animated tool execution path |

---

## 🚀 Quick Start

### 1. Clone & Open

```bash
git clone https://github.com/YOUR_USERNAME/pocket-canvas.git
cd pocket-canvas
```

Just open `index.html` in a modern mobile browser (Chrome / Safari recommended),  
or use a local server:

```bash
# Python
python -m http.server 8080

# or Node
npx serve .
```

Then visit `http://localhost:8080` on your phone (same Wi-Fi) or desktop.

### 2. Add to Home Screen

On iOS Safari → Share → Add to Home Screen  
On Android Chrome → Menu → Install App / Add to Home Screen

---

## 🎮 How to Use

1. Type a message at the bottom and hit send (or press Enter)
2. The agent will create:
   - A **Thought** card (reasoning)
   - Optional **Tool** cards (if it decides to use tools)
   - A **Result** card
3. Drag any card to rearrange context
4. Long-press a card for more actions (pin / delete / focus)
5. Pinch to zoom, two-finger drag to pan the canvas
6. Double-tap empty space to reset view

The mock agent currently supports simple tool simulation (search, calculator, memory, etc.).

---

## 🏗️ Project Structure

```
pocket-canvas/
├── index.html              # Main entry + PWA shell
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (offline support)
├── css/
│   └── styles.css          # Mobile-first styles
├── js/
│   ├── app.js              # App initialization & UI binding
│   ├── canvas.js           # Canvas, nodes, edges, gestures
│   ├── agent.js            # Mock Agent + simple Harness logic
│   └── utils.js            # Helpers
├── assets/
│   └── icons/              # App icons
├── LICENSE
└── README.md
```

---

## 🧠 Agent Harness Design Notes

PocketCanvas treats the canvas itself as the **working memory**:

- Each card is a unit of context
- Spatial position and connections represent relationships
- Users can intervene by rearranging / pinning / deleting cards
- The agent “reads” the current set of visible/pinned cards as context

This is a lightweight exploration of **spatial context management** and **visual tool orchestration** — core ideas in modern Agent Harness systems.

---

## 🛠️ Roadmap

- [ ] Real LLM backend (DeepSeek / OpenAI / local)
- [ ] Persistent sessions (IndexedDB)
- [ ] Multi-agent support (multiple colored agents on same canvas)
- [ ] Voice input
- [ ] Export canvas as image / JSON
- [ ] Collaborative multiplayer mode
- [ ] Native Android/iOS wrappers (Capacitor / React Native)

---

## 📄 License

MIT License © 2026

Feel free to fork, modify, and build upon it.

---

## 🙌 Contributing

Pull requests and ideas are welcome!  
Especially interested in better gesture handling, real agent backends, and visual design improvements.

---

**Made for the DeepSeek Harness community and anyone who believes agent interfaces can be more than just chat boxes.**

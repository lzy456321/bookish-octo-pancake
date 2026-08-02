// ===== Canvas Engine =====
// Handles infinite canvas, nodes, edges, gestures (touch + mouse)

const Canvas = (() => {
  const container = () => document.getElementById('canvas-container');
  const canvasEl = () => document.getElementById('canvas');
  const nodesLayer = () => document.getElementById('nodes-layer');
  const edgesLayer = () => document.getElementById('edges-layer');

  // State
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let nodes = new Map(); // id -> nodeData
  let edges = []; // {from, to, active}

  // Gesture state
  let isPanning = false;
  let lastTouchDist = 0;
  let lastTouchMid = null;
  let dragNode = null;
  let dragStart = null;
  let longPressTimer = null;
  let longPressTarget = null;

  // ---------- Transform ----------
  function applyTransform() {
    canvasEl().style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  }

  function screenToWorld(sx, sy) {
    const rect = container().getBoundingClientRect();
    return {
      x: (sx - rect.left - offsetX) / scale,
      y: (sy - rect.top - offsetY) / scale
    };
  }

  function resetView() {
    scale = 1;
    offsetX = 0;
    offsetY = 0;
    applyTransform();
  }

  // ---------- Nodes ----------
  function addNode({ type = 'thought', title = '', content = '', x, y, meta = {} }) {
    const id = Utils.uid();
    const nodeData = {
      id,
      type, // user | thought | tool | result
      title,
      content,
      x: x ?? (window.innerWidth / 2 / scale - offsetX / scale - 100),
      y: y ?? (window.innerHeight / 2 / scale - offsetY / scale - 60),
      pinned: false,
      meta
    };
    nodes.set(id, nodeData);
    renderNode(nodeData);
    updateEmptyState();
    return id;
  }

  function renderNode(node) {
    let el = document.getElementById(node.id);
    if (!el) {
      el = document.createElement('div');
      el.id = node.id;
      el.className = `node ${node.type}`;
      el.dataset.id = node.id;
      nodesLayer().appendChild(el);

      // Touch / mouse handlers for dragging
      el.addEventListener('pointerdown', onNodePointerDown);
    }

    const icons = {
      user: '👤',
      thought: '💭',
      tool: '🔧',
      result: '✅'
    };

    const titles = {
      user: 'You',
      thought: 'Thinking',
      tool: node.title || 'Tool',
      result: 'Result'
    };

    el.innerHTML = `
      <div class="node-header">
        <span class="icon">${icons[node.type] || '•'}</span>
        <span>${titles[node.type]}</span>
        ${node.pinned ? '<span style="margin-left:auto">📌</span>' : ''}
      </div>
      <div class="node-body">${formatContent(node.content)}</div>
      <div class="node-footer">${Utils.timeNow()}</div>
    `;

    el.style.left = node.x + 'px';
    el.style.top = node.y + 'px';
    el.style.zIndex = node.pinned ? 20 : 10;
  }

  function formatContent(text) {
    if (!text) return '';
    // Simple markdown-ish: code blocks
    if (text.includes('```')) {
      return text.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');
    }
    return Utils.escapeHtml(text).replace(/\n/g, '<br>');
  }

  function updateNode(id, updates) {
    const node = nodes.get(id);
    if (!node) return;
    Object.assign(node, updates);
    renderNode(node);
    redrawEdges();
  }

  function removeNode(id) {
    nodes.delete(id);
    const el = document.getElementById(id);
    if (el) el.remove();
    edges = edges.filter(e => e.from !== id && e.to !== id);
    redrawEdges();
    updateEmptyState();
  }

  function clearAll() {
    nodes.clear();
    edges = [];
    nodesLayer().innerHTML = '';
    edgesLayer().innerHTML = '';
    updateEmptyState();
  }

  // ---------- Edges ----------
  function addEdge(fromId, toId, active = false) {
    edges.push({ from: fromId, to: toId, active });
    redrawEdges();
  }

  function setEdgeActive(fromId, toId, active) {
    const e = edges.find(ed => ed.from === fromId && ed.to === toId);
    if (e) e.active = active;
    redrawEdges();
  }

  function redrawEdges() {
    const svg = edgesLayer();
    svg.innerHTML = '';

    edges.forEach(edge => {
      const from = nodes.get(edge.from);
      const to = nodes.get(edge.to);
      if (!from || !to) return;

      // Approximate center of cards
      const x1 = from.x + 100;
      const y1 = from.y + 50;
      const x2 = to.x + 100;
      const y2 = to.y + 20;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', Utils.bezierPath(x1, y1, x2, y2));
      path.setAttribute('class', 'edge' + (edge.active ? ' active' : ''));
      svg.appendChild(path);
    });
  }

  // ---------- Empty State ----------
  function updateEmptyState() {
    const empty = document.getElementById('empty-state');
    if (nodes.size === 0) {
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
    }
  }

  // ---------- Gestures ----------
  function onNodePointerDown(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    const node = nodes.get(id);
    if (!node) return;

    // Long press detection
    longPressTarget = id;
    longPressTimer = setTimeout(() => {
      showContextMenu(e.clientX, e.clientY, id);
    }, 550);

    dragNode = node;
    const world = screenToWorld(e.clientX, e.clientY);
    dragStart = { x: world.x - node.x, y: world.y - node.y };

    e.currentTarget.classList.add('dragging');
    e.currentTarget.setPointerCapture(e.pointerId);

    const onMove = (ev) => {
      if (!dragNode) return;
      clearTimeout(longPressTimer);
      const w = screenToWorld(ev.clientX, ev.clientY);
      dragNode.x = w.x - dragStart.x;
      dragNode.y = w.y - dragStart.y;
      renderNode(dragNode);
      redrawEdges();
    };

    const onUp = (ev) => {
      clearTimeout(longPressTimer);
      if (dragNode) {
        document.getElementById(dragNode.id)?.classList.remove('dragging');
      }
      dragNode = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
      e.currentTarget.removeEventListener('pointermove', onMove);
      e.currentTarget.removeEventListener('pointerup', onUp);
      e.currentTarget.removeEventListener('pointercancel', onUp);
    };

    e.currentTarget.addEventListener('pointermove', onMove);
    e.currentTarget.addEventListener('pointerup', onUp);
    e.currentTarget.addEventListener('pointercancel', onUp);
  }

  function showContextMenu(x, y, nodeId) {
    // Remove existing
    document.querySelectorAll('.context-menu').forEach(m => m.remove());

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    const node = nodes.get(nodeId);
    menu.innerHTML = `
      <button data-action="pin">${node.pinned ? 'Unpin' : 'Pin'} 📌</button>
      <button data-action="focus">Focus</button>
      <button data-action="delete" class="danger">Delete</button>
    `;

    menu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'pin') {
        updateNode(nodeId, { pinned: !node.pinned });
      } else if (action === 'focus') {
        // Center view on node
        const n = nodes.get(nodeId);
        if (n) {
          scale = 1.1;
          offsetX = window.innerWidth / 2 - (n.x + 100) * scale;
          offsetY = window.innerHeight / 2 - (n.y + 40) * scale;
          applyTransform();
        }
      } else if (action === 'delete') {
        removeNode(nodeId);
      }
      menu.remove();
    });

    document.body.appendChild(menu);

    // Close on outside
    setTimeout(() => {
      const close = (ev) => {
        if (!menu.contains(ev.target)) {
          menu.remove();
          document.removeEventListener('pointerdown', close);
        }
      };
      document.addEventListener('pointerdown', close);
    }, 10);
  }

  // Canvas pan & zoom
  function initGestures() {
    const el = container();

    // Mouse wheel zoom
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Utils.clamp(scale * delta, 0.4, 2.5);

      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Zoom towards cursor
      offsetX = mx - (mx - offsetX) * (newScale / scale);
      offsetY = my - (my - offsetY) * (newScale / scale);
      scale = newScale;
      applyTransform();
    }, { passive: false });

    // Touch / mouse pan
    let panStart = null;

    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.node')) return; // let node handle it
      if (e.pointerType === 'touch' && e.isPrimary === false) return;

      isPanning = true;
      panStart = { x: e.clientX - offsetX, y: e.clientY - offsetY };
      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener('pointermove', (e) => {
      if (!isPanning || dragNode) return;

      // Pinch zoom (two touches)
      if (e.pointerType === 'touch') {
        const touches = Array.from(e.targetTouches || []);
        // Simplified: we rely on browser or single finger pan mainly
      }

      offsetX = e.clientX - panStart.x;
      offsetY = e.clientY - panStart.y;
      applyTransform();
    });

    el.addEventListener('pointerup', (e) => {
      isPanning = false;
      try { el.releasePointerCapture(e.pointerId); } catch (_) {}
    });

    el.addEventListener('pointercancel', () => {
      isPanning = false;
    });

    // Basic pinch support via touch events
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        lastTouchDist = Utils.dist(
          e.touches[0].clientX, e.touches[0].clientY,
          e.touches[1].clientX, e.touches[1].clientY
        );
        lastTouchMid = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && lastTouchDist) {
        e.preventDefault();
        const dist = Utils.dist(
          e.touches[0].clientX, e.touches[0].clientY,
          e.touches[1].clientX, e.touches[1].clientY
        );
        const mid = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };

        const delta = dist / lastTouchDist;
        const newScale = Utils.clamp(scale * delta, 0.4, 2.5);

        const rect = el.getBoundingClientRect();
        const mx = mid.x - rect.left;
        const my = mid.y - rect.top;

        offsetX = mx - (mx - offsetX) * (newScale / scale);
        offsetY = my - (my - offsetY) * (newScale / scale);
        scale = newScale;

        // Also pan a bit with mid point movement
        if (lastTouchMid) {
          offsetX += mid.x - lastTouchMid.x;
          offsetY += mid.y - lastTouchMid.y;
        }

        applyTransform();
        lastTouchDist = dist;
        lastTouchMid = mid;
      }
    }, { passive: false });

    el.addEventListener('touchend', () => {
      lastTouchDist = 0;
      lastTouchMid = null;
    });
  }

  // Public API
  return {
    init() {
      initGestures();
      applyTransform();
      updateEmptyState();
    },
    addNode,
    updateNode,
    removeNode,
    addEdge,
    setEdgeActive,
    clearAll,
    resetView,
    getNodes: () => Array.from(nodes.values()),
    getPinnedContext() {
      return Array.from(nodes.values())
        .filter(n => n.pinned || n.type === 'user')
        .map(n => `[${n.type}] ${n.content}`)
        .join('\n');
    }
  };
})();

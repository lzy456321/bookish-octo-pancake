// ===== App Entry =====

document.addEventListener('DOMContentLoaded', () => {
  Canvas.init();

  const input = document.getElementById('user-input');
  const sendBtn = document.getElementById('btn-send');
  const statusText = document.getElementById('status-text');
  const btnReset = document.getElementById('btn-reset-view');
  const btnClear = document.getElementById('btn-clear');

  let isRunning = false;

  // Auto-resize textarea
  input.addEventListener('input', () => {
    Utils.autoResize(input);
    sendBtn.disabled = input.value.trim().length === 0 || isRunning;
  });

  // Send on Enter (Shift+Enter for newline)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  btnReset.addEventListener('click', () => {
    Canvas.resetView();
  });

  btnClear.addEventListener('click', () => {
    if (confirm('Clear the entire canvas?')) {
      Canvas.clearAll();
      statusText.textContent = 'Ready · Mock Agent';
    }
  });

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isRunning) return;

    isRunning = true;
    sendBtn.disabled = true;
    input.value = '';
    Utils.autoResize(input);

    // Place user card near center-bottom-ish of current view
    const userId = Canvas.addNode({
      type: 'user',
      content: text,
      x: 60 + Math.random() * 50,
      y: 100 + Math.random() * 40
    });

    try {
      await Agent.run(text, (status) => {
        statusText.textContent = status;
      });
    } catch (err) {
      console.error(err);
      statusText.textContent = 'Error occurred';
      Canvas.addNode({
        type: 'result',
        content: 'Something went wrong while running the agent.',
        x: 80,
        y: 300
      });
    } finally {
      isRunning = false;
      sendBtn.disabled = input.value.trim().length === 0;
    }
  }

  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // silent fail if offline or file://
    });
  }

  // Welcome tip after short delay
  setTimeout(() => {
    if (Canvas.getNodes().length === 0) {
      statusText.textContent = 'Try: "杭州天气怎么样" or "计算 23 * 47"';
    }
  }, 1500);
});

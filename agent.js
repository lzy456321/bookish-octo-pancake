// ===== Mock Agent + Simple Harness =====
// Demonstrates a lightweight agent loop with visual feedback

const Agent = (() => {
  const TOOLS = {
    search: {
      name: 'web_search',
      description: 'Search the web for information',
      async run(query) {
        await sleep(800 + Math.random() * 600);
        return `Search results for "${query}":\n• Relevant fact 1 about ${query}\n• Relevant fact 2\n• Recent development related to the topic`;
      }
    },
    calc: {
      name: 'calculator',
      description: 'Perform mathematical calculations',
      async run(expr) {
        await sleep(400);
        try {
          // Very safe eval for demo only
          const result = Function(`"use strict"; return (${expr})`)();
          return `Result: ${result}`;
        } catch {
          return 'Could not compute that expression.';
        }
      }
    },
    memory: {
      name: 'memory_store',
      description: 'Store or recall information',
      async run(text) {
        await sleep(300);
        return `Stored in memory: "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"`;
      }
    },
    weather: {
      name: 'get_weather',
      description: 'Get current weather',
      async run(city) {
        await sleep(700);
        const temps = [18, 22, 25, 28, 15];
        const conditions = ['Sunny', 'Cloudy', 'Light rain', 'Clear'];
        return `${city}: ${temps[Math.floor(Math.random()*temps.length)]}°C, ${conditions[Math.floor(Math.random()*conditions.length)]}`;
      }
    }
  };

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // Very simple intent detection for demo
  function decideTools(userText) {
    const t = userText.toLowerCase();
    const calls = [];

    if (t.includes('search') || t.includes('什么是') || t.includes('who is') || t.includes('what is') || t.includes('最新') || t.includes('news')) {
      calls.push({ tool: 'search', input: userText });
    }
    if (t.match(/[\d\+\-\*\/\(\)]{3,}/) || t.includes('计算') || t.includes('算一下') || t.includes('calculate')) {
      const expr = userText.match(/[\d\+\-\*\/\(\)\.\s]+/);
      if (expr) calls.push({ tool: 'calc', input: expr[0].trim() });
    }
    if (t.includes('记住') || t.includes('remember') || t.includes('记下')) {
      calls.push({ tool: 'memory', input: userText });
    }
    if (t.includes('天气') || t.includes('weather') || t.includes('温度')) {
      const cityMatch = userText.match(/(北京|上海|杭州|深圳|广州|成都|New York|Tokyo|London)/i);
      calls.push({ tool: 'weather', input: cityMatch ? cityMatch[0] : 'Hangzhou' });
    }

    // Default: sometimes just think, sometimes use a tool
    if (calls.length === 0 && Math.random() > 0.4) {
      calls.push({ tool: 'search', input: userText });
    }

    return calls;
  }

  function generateThought(userText, toolCalls) {
    if (toolCalls.length === 0) {
      return `User asked: "${userText.slice(0, 80)}..."\nI can answer this directly from my knowledge.`;
    }
    const toolNames = toolCalls.map(c => TOOLS[c.tool].name).join(', ');
    return `Analyzing request...\nI should use: ${toolNames}\nPlanning the steps now.`;
  }

  function generateFinalAnswer(userText, toolResults) {
    if (toolResults.length === 0) {
      return `Regarding "${userText.slice(0, 60)}...":\n\nThis is a simulated response from the mock agent. In a real deployment this would come from DeepSeek or another LLM.\n\nThe visual canvas lets you rearrange context, pin important cards, and control what the agent sees next.`;
    }

    let answer = `I used ${toolResults.length} tool(s) to help answer you:\n\n`;
    toolResults.forEach((r, i) => {
      answer += `${i + 1}. ${r.toolName}:\n${r.output}\n\n`;
    });
    answer += `Based on the above, here's my conclusion for your question.`;
    return answer;
  }

  // Main agent loop – produces visual nodes step by step
  async function run(userText, onStatus) {
    onStatus?.('Thinking...');

    // 1. User node is already added by app.js
    // We create a thought node
    const thoughtId = Canvas.addNode({
      type: 'thought',
      content: 'Analyzing your request...',
      x: 80 + Math.random() * 40,
      y: 180 + Math.random() * 60
    });

    await sleep(600);
    const toolCalls = decideTools(userText);
    const thoughtContent = generateThought(userText, toolCalls);
    Canvas.updateNode(thoughtId, { content: thoughtContent });

    // Link last user node roughly (we take the most recent user node)
    const allNodes = Canvas.getNodes();
    const lastUser = [...allNodes].reverse().find(n => n.type === 'user');
    if (lastUser) {
      Canvas.addEdge(lastUser.id, thoughtId, true);
    }

    const toolResults = [];

    // 2. Execute tools one by one with visual cards
    for (const call of toolCalls) {
      onStatus?.(`Calling ${TOOLS[call.tool].name}...`);

      const toolId = Canvas.addNode({
        type: 'tool',
        title: TOOLS[call.tool].name,
        content: `Input: ${call.input}\n\nRunning...`,
        x: 60 + Math.random() * 80,
        y: 320 + toolResults.length * 140 + Math.random() * 30
      });

      Canvas.addEdge(thoughtId, toolId, true);

      const output = await TOOLS[call.tool].run(call.input);
      Canvas.updateNode(toolId, {
        content: `Input: ${call.input}\n\n${output}`
      });
      Canvas.setEdgeActive(thoughtId, toolId, false);

      toolResults.push({
        toolName: TOOLS[call.tool].name,
        output
      });

      await sleep(300);
    }

    // 3. Final result card
    onStatus?.('Generating answer...');
    await sleep(500);

    const resultId = Canvas.addNode({
      type: 'result',
      content: generateFinalAnswer(userText, toolResults),
      x: 100 + Math.random() * 60,
      y: 320 + toolResults.length * 140 + 80
    });

    // Connect tools (or thought) to result
    if (toolResults.length > 0) {
      // Connect last tool-ish
      const toolNodes = Canvas.getNodes().filter(n => n.type === 'tool');
      if (toolNodes.length) {
        Canvas.addEdge(toolNodes[toolNodes.length - 1].id, resultId, true);
        setTimeout(() => Canvas.setEdgeActive(toolNodes[toolNodes.length - 1].id, resultId, false), 1200);
      }
    } else {
      Canvas.addEdge(thoughtId, resultId, true);
      setTimeout(() => Canvas.setEdgeActive(thoughtId, resultId, false), 1200);
    }

    onStatus?.('Ready · Mock Agent');
    return resultId;
  }

  return {
    run,
    TOOLS
  };
})();

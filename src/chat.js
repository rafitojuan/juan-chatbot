import { marked } from 'marked';
import hljs from 'highlight.js';
import { cleanJ1Prefix } from './api.js';

// Configure marked with highlight.js
marked.setOptions({
  breaks: true,
  gfm: true,
  highlight: (code, lang) => {
    const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
    try {
      return hljs.highlight(code, { language: validLang }).value;
    } catch (_) {
      return hljs.highlightAuto(code).value;
    }
  }
});

const STORAGE_KEY = 'j1_chat_history_v1';

/**
 * Robust copy helper supporting both Clipboard API and fallback textarea
 * for non-HTTPS local domains like http://j1.local
 */
export async function copyToClipboard(text) {
  if (!text) return false;

  // 1. Try modern clipboard API if supported and in secure context
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {}
  }

  // 2. Fallback using temporary textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
}

export class ChatManager {
  constructor(messagesContainer, onMessageAdd = null) {
    this.container = messagesContainer;
    this.onMessageAdd = onMessageAdd;
    this.messages = this._loadHistory();
    this.activeAssistantMsgElement = null;
    this.shouldAutoScroll = true;

    this._setupScrollListener();
  }

  _setupScrollListener() {
    this.container.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = this.container;
      // If user is within 80px from bottom, keep auto-scrolling
      this.shouldAutoScroll = scrollHeight - (scrollTop + clientHeight) < 80;
    });
  }

  _loadHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to read localStorage:', e);
    }
    // Default initial greeting from J1
    return [
      {
        id: 'msg_welcome',
        role: 'assistant',
        content: `Yo, gua **J1**, digital clone dari **Rafito Juan**.

Mau ngapain kita hari ini? Ngobrol santai, ide project, atau coding bareng? Tinggal ketik aja di bawah.`,
        timestamp: Date.now()
      }
    ];
  }

  _saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  getHistoryForAPI() {
    // Only return user & assistant messages for API context (excluding errors and prefix)
    return this.messages
      .filter(m => (m.role === 'user' || m.role === 'assistant') && m.id !== 'msg_welcome')
      .slice(-12)
      .map(m => ({ role: m.role, content: cleanJ1Prefix(m.content) }));
  }

  renderAll() {
    this.container.innerHTML = '';
    this.messages.forEach(msg => {
      this._appendMessageDOM(msg);
    });
    this.scrollToBottom(true);
  }

  addUserMessage(text) {
    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    this.messages.push(msg);
    this._saveHistory();
    this._appendMessageDOM(msg);
    this.shouldAutoScroll = true;
    this.scrollToBottom(true);
    if (this.onMessageAdd) this.onMessageAdd(msg);
    return msg;
  }

  startAssistantStream() {
    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };
    this.messages.push(msg);
    const msgEl = this._appendMessageDOM(msg, true);
    this.activeAssistantMsgElement = { msg, element: msgEl };
    this.shouldAutoScroll = true;
    this.scrollToBottom(true);
    return msg;
  }

  updateAssistantStream(chunk, fullText) {
    if (!this.activeAssistantMsgElement) return;
    const { msg, element } = this.activeAssistantMsgElement;
    const sanitized = cleanJ1Prefix(fullText);
    msg.content = sanitized;

    // Use requestAnimationFrame throttling to avoid DOM thrashing on every token chunk
    if (!this._streamRafId) {
      this._streamRafId = requestAnimationFrame(() => {
        this._streamRafId = null;
        const contentDiv = element.querySelector('.message-bubble-content');
        if (contentDiv) {
          contentDiv.innerHTML = this._parseMarkdown(msg.content);
        }
        if (this.shouldAutoScroll) {
          this.scrollToBottom();
        }
      });
    }
  }

  finalizeAssistantStream(fullText) {
    if (this._streamRafId) {
      cancelAnimationFrame(this._streamRafId);
      this._streamRafId = null;
    }

    if (!this.activeAssistantMsgElement) return;
    const { msg, element } = this.activeAssistantMsgElement;
    const sanitized = cleanJ1Prefix(fullText);
    msg.content = sanitized;
    this._saveHistory();

    // Remove streaming cursor & do final complete render with code copy buttons
    element.classList.remove('is-streaming');
    const contentDiv = element.querySelector('.message-bubble-content');
    if (contentDiv) {
      contentDiv.innerHTML = this._parseMarkdown(sanitized);
      this._attachCodeCopyButtons(contentDiv);
    }

    // Update copy button content
    const copyBtn = element.querySelector('.copy-msg-btn');
    if (copyBtn) {
      copyBtn.dataset.content = encodeURIComponent(sanitized);
    }

    this.activeAssistantMsgElement = null;
    this.scrollToBottom();
  }

  addErrorMessage(errorText) {
    const msg = {
      id: 'msg_err_' + Date.now(),
      role: 'system_error',
      content: `⚠️ **Aduh, ada kendala koneksi nih:** ${errorText}\n\nCoba kirim ulang pesan lu ya!`,
      timestamp: Date.now()
    };
    this.messages.push(msg);
    this._saveHistory();
    this._appendMessageDOM(msg);
    this.scrollToBottom();
  }

  _parseMarkdown(text) {
    if (!text) return '<span class="typing-cursor"></span>';
    const cleaned = cleanJ1Prefix(text);
    if (!cleaned) return '<span class="typing-cursor"></span>';
    try {
      let parsed = marked.parse(cleaned);
      return parsed;
    } catch (_) {
      return cleaned.replace(/\n/g, '<br>');
    }
  }

  _appendMessageDOM(msg, isStreaming = false) {
    const isUser = msg.role === 'user';
    const isError = msg.role === 'system_error';

    const msgRow = document.createElement('div');
    msgRow.className = `message-row ${isUser ? 'user-row' : 'assistant-row'} ${isError ? 'error-row' : ''} ${isStreaming ? 'is-streaming' : ''}`;
    msgRow.dataset.id = msg.id;

    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const actionsHtml = !isUser && !isError ? `
      <div class="message-actions">
        <button class="action-btn copy-msg-btn" title="Salin Jawaban" data-content="${encodeURIComponent(msg.content)}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>Salin</span>
        </button>
      </div>
    ` : '';

    msgRow.innerHTML = `
      <div class="message-wrapper">
        <div class="message-bubble">
          <div class="message-bubble-content">
            ${this._parseMarkdown(msg.content)}
          </div>
          <div class="message-meta">
            <span class="msg-time">${timeStr}</span>
          </div>
        </div>
        ${actionsHtml}
      </div>
    `;

    this.container.appendChild(msgRow);

    const contentDiv = msgRow.querySelector('.message-bubble-content');
    this._attachCodeCopyButtons(contentDiv);
    this._attachMessageActionListeners(msgRow);

    return msgRow;
  }

  _attachCodeCopyButtons(container) {
    if (!container) return;
    const preBlocks = container.querySelectorAll('pre');
    preBlocks.forEach(pre => {
      if (pre.querySelector('.code-copy-btn')) return; // Already attached

      const code = pre.querySelector('code');
      const codeText = code ? code.innerText : pre.innerText;

      const header = document.createElement('div');
      header.className = 'code-header';

      // Detect language class
      let lang = 'CODE';
      if (code) {
        const classNames = code.className.split(' ');
        const langClass = classNames.find(c => c.startsWith('language-'));
        if (langClass) {
          lang = langClass.replace('language-', '').toUpperCase();
        }
      }

      header.innerHTML = `
        <span class="code-lang">${lang}</span>
        <button class="code-copy-btn" title="Copy Code">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>Copy</span>
        </button>
      `;

      const btn = header.querySelector('.code-copy-btn');
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const success = await copyToClipboard(codeText);
        if (success) {
          btn.classList.add('copied');
          btn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Tersalin!</span>
          `;
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy</span>
            `;
          }, 2000);
        }
      });

      pre.prepend(header);
    });
  }

  _attachMessageActionListeners(row) {
    const copyBtn = row.querySelector('.copy-msg-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        let text = '';
        if (copyBtn.dataset.content) {
          try {
            text = decodeURIComponent(copyBtn.dataset.content);
          } catch (_) {
            text = copyBtn.dataset.content;
          }
        }
        
        // Fallback: extract from text content of message bubble
        if (!text) {
          const contentDiv = row.querySelector('.message-bubble-content');
          text = contentDiv ? contentDiv.innerText : '';
        }

        const success = await copyToClipboard(text);
        if (success) {
          const span = copyBtn.querySelector('span');
          const orig = span ? span.textContent : 'Salin';
          if (span) span.textContent = 'Tersalin!';
          copyBtn.classList.add('active');
          setTimeout(() => {
            if (span) span.textContent = orig;
            copyBtn.classList.remove('active');
          }, 1800);
        }
      });
    }
  }

  clearChat() {
    this.messages = [
      {
        id: 'msg_welcome',
        role: 'assistant',
        content: `Obrolan udah bersih kembali. Mau bahas apa lagi kita hari ini?`,
        timestamp: Date.now()
      }
    ];
    this._saveHistory();
    this.renderAll();
  }

  scrollToBottom(force = false, instant = false) {
    if (force) {
      this.shouldAutoScroll = true;
    }
    if (force || this.shouldAutoScroll) {
      const scrollAction = () => {
        if (!this.container) return;
        this.container.scrollTo({
          top: this.container.scrollHeight + 100,
          behavior: instant ? 'auto' : 'smooth'
        });
      };

      requestAnimationFrame(scrollAction);
      if (force) {
        setTimeout(scrollAction, 60);
      }
    }
  }
}

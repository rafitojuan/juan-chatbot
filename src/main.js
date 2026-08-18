/**
 * Main Application Orchestrator for J1 AI Chat (Clean Capsule Reference Edition)
 * Integrated with Free Live Web Search Grounding & Chroma Key Avatar
 */

import { J1HeadController } from './chromakey.js';
import { MistralClient } from './api.js';
import { AudioManager } from './audio.js';
import { ChatManager } from './chat.js';
import { shouldSearchWeb, searchWeb } from './search.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const canvas = document.getElementById('j1Canvas');
  const chatContainer = document.getElementById('chatContainer');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const heroAvatar = document.getElementById('heroAvatar');
  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const quickCapsulesRow = document.getElementById('quickCapsulesRow');
  const toggleQuestionsBtn = document.getElementById('toggleQuestionsBtn');
  const moreOptionsBtn = document.getElementById('moreOptionsBtn');
  const clearBtn = document.getElementById('clearBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const soundSwitch = document.getElementById('soundSwitch');
  const webSearchSwitch = document.getElementById('webSearchSwitch');
  const modalClearHistoryBtn = document.getElementById('modalClearHistoryBtn');

  // Chroma key slider controls
  const similaritySlider = document.getElementById('similaritySlider');
  const similarityVal = document.getElementById('similarityVal');
  const smoothnessSlider = document.getElementById('smoothnessSlider');
  const smoothnessVal = document.getElementById('smoothnessVal');
  const spillSlider = document.getElementById('spillSlider');
  const spillVal = document.getElementById('spillVal');

  // Services Initialization
  const audio = new AudioManager();
  const mistral = new MistralClient();

  // State
  let isWebSearchEnabled = localStorage.getItem('j1_web_search_enabled') !== 'false';
  if (webSearchSwitch) {
    webSearchSwitch.checked = isWebSearchEnabled;
  }

  // Avatar Elements & Hybrid Chroma Key Controller (PNG Idle + WebGL Video Talking)
  const j1AvatarImg = document.getElementById('j1AvatarImg');
  const avatar = canvas ? new J1HeadController(canvas, j1AvatarImg, '/assets/videos/juanhead.mp4') : null;

  if (heroAvatar && avatar) {
    heroAvatar.addEventListener('click', () => {
      audio.playPopSound();
      avatar.poke();
    });
  }
  
  let isGenerating = false;
  let activeAbortController = null;

  const chat = new ChatManager(chatContainer, () => {
    audio.playPopSound();
  });

  // Render initial history
  chat.renderAll();

  // Helper to update status UI
  const updateStatus = (state) => {
    if (statusBadge) statusBadge.classList.remove('is-thinking', 'is-talking', 'is-searching');
    if (state === 'searching') {
      if (statusBadge) statusBadge.classList.add('is-searching');
      if (statusText) statusText.textContent = 'Mencari di web...';
      if (avatar) avatar.setThinking();
    } else if (state === 'thinking') {
      if (statusBadge) statusBadge.classList.add('is-thinking');
      if (statusText) statusText.textContent = 'Mikir...';
      if (avatar) avatar.setThinking();
    } else if (state === 'talking') {
      if (statusBadge) statusBadge.classList.add('is-talking');
      if (statusText) statusText.textContent = 'Menjawab...';
      if (avatar) avatar.startTalking();
    } else {
      if (statusText) statusText.textContent = 'Online';
      if (avatar) avatar.setIdle();
    }
  };

  updateStatus('idle');

  // Toggle Quick Questions Row
  let isQuestionsHidden = false;
  if (toggleQuestionsBtn && quickCapsulesRow) {
    toggleQuestionsBtn.addEventListener('click', () => {
      isQuestionsHidden = !isQuestionsHidden;
      quickCapsulesRow.classList.toggle('is-hidden', isQuestionsHidden);
      
      const arrow = toggleQuestionsBtn.querySelector('.toggle-arrow');
      const label = toggleQuestionsBtn.querySelector('.toggle-label');
      
      if (isQuestionsHidden) {
        if (arrow) arrow.textContent = '⌃';
        if (label) label.textContent = 'Show quick questions';
      } else {
        if (arrow) arrow.textContent = '⌄';
        if (label) label.textContent = 'Hide quick questions';
      }
    });
  }

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (!chatInput) return;
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
  };

  if (chatInput) {
    chatInput.addEventListener('input', adjustTextareaHeight);
  }

  // Send message action
  const handleSendMessage = async (customText = null) => {
    const text = (customText || (chatInput ? chatInput.value : '')).trim();
    if (!text || isGenerating) return;

    // Reset input
    if (!customText && chatInput) {
      chatInput.value = '';
      adjustTextareaHeight();
    }

    // Add user message to UI & history
    chat.addUserMessage(text);
    audio.playSendSound();

    isGenerating = true;
    if (sendBtn) sendBtn.disabled = true;

    // Live Web Search Detection & Execution
    let groundingContext = '';
    const needsSearch = isWebSearchEnabled && shouldSearchWeb(text);

    if (needsSearch) {
      updateStatus('searching');
      try {
        const searchResult = await searchWeb(text);
        if (searchResult && searchResult.hasResults) {
          groundingContext = searchResult.context;
        }
      } catch (searchErr) {
        console.warn('Live search error:', searchErr);
      }
    }

    updateStatus('thinking');

    // Prepare streaming
    activeAbortController = new AbortController();
    let hasReceivedFirstToken = false;
    let assistantStreamMsg = null;

    const history = chat.getHistoryForAPI();

    try {
      await mistral.streamChat(
        history,
        // onChunk
        (chunk, fullText) => {
          if (!hasReceivedFirstToken) {
            hasReceivedFirstToken = true;
            updateStatus('talking');
            assistantStreamMsg = chat.startAssistantStream();
          }
          chat.updateAssistantStream(chunk, fullText);
        },
        // onComplete
        (fullText) => {
          if (assistantStreamMsg) {
            chat.finalizeAssistantStream(fullText);
          } else {
            assistantStreamMsg = chat.startAssistantStream();
            chat.finalizeAssistantStream(fullText);
          }
          audio.playSuccessSound();
        },
        // onError
        (error) => {
          chat.addErrorMessage(error.message || 'Gagal koneksi ke J1');
        },
        activeAbortController.signal,
        groundingContext
      );
    } catch (err) {
      console.error('Stream processing error:', err);
      chat.addErrorMessage(err.message || 'Terjadi gangguan saat memproses pesan.');
    } finally {
      updateStatus('idle');
      isGenerating = false;
      if (sendBtn) sendBtn.disabled = false;
      activeAbortController = null;
    }
  };

  // Keyboard shortcut (Enter to send, Shift+Enter for newline)
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      handleSendMessage();
    });
  }

  // Capsule Quick Prompt Items
  if (quickCapsulesRow) {
    quickCapsulesRow.addEventListener('click', (e) => {
      const btn = e.target.closest('.capsule-btn');
      if (btn && !btn.classList.contains('dots-btn') && !isGenerating) {
        const prompt = btn.dataset.prompt;
        if (prompt) {
          handleSendMessage(prompt);
        }
      }
    });
  }

  // Clear Chat Confirmation Modal Elements & Logic
  const confirmModal = document.getElementById('confirmModal');
  const cancelClearBtn = document.getElementById('cancelClearBtn');
  const confirmClearBtn = document.getElementById('confirmClearBtn');

  const openConfirmModal = () => {
    if (confirmModal) confirmModal.classList.add('open');
    audio.playPopSound();
  };

  const closeConfirmModal = () => {
    if (confirmModal) confirmModal.classList.remove('open');
  };

  if (clearBtn) clearBtn.addEventListener('click', openConfirmModal);
  if (modalClearHistoryBtn) {
    modalClearHistoryBtn.addEventListener('click', () => {
      if (settingsModal) settingsModal.classList.remove('open');
      openConfirmModal();
    });
  }

  if (cancelClearBtn) cancelClearBtn.addEventListener('click', closeConfirmModal);

  if (confirmClearBtn) {
    confirmClearBtn.addEventListener('click', () => {
      chat.clearChat();
      audio.playPopSound();
      closeConfirmModal();
      if (settingsModal) settingsModal.classList.remove('open');
    });
  }

  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) {
        closeConfirmModal();
      }
    });
  }

  if (soundSwitch) {
    soundSwitch.addEventListener('change', () => {
      audio.soundEnabled = soundSwitch.checked;
    });
  }

  if (webSearchSwitch) {
    webSearchSwitch.addEventListener('change', () => {
      isWebSearchEnabled = webSearchSwitch.checked;
      localStorage.setItem('j1_web_search_enabled', isWebSearchEnabled);
    });
  }

  // Settings Modal controls
  const openSettings = () => {
    if (settingsModal) settingsModal.classList.add('open');
    audio.playPopSound();
  };

  if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
  if (moreOptionsBtn) moreOptionsBtn.addEventListener('click', openSettings);

  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => {
      if (settingsModal) settingsModal.classList.remove('open');
    });
  }

  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.remove('open');
      }
    });
  }

  // Chroma Key sliders
  if (similaritySlider && avatar) {
    similaritySlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (similarityVal) similarityVal.textContent = val.toFixed(2);
      avatar.setParameters({ similarity: val });
    });
  }

  if (smoothnessSlider && avatar) {
    smoothnessSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (smoothnessVal) smoothnessVal.textContent = val.toFixed(2);
      avatar.setParameters({ smoothness: val });
    });
  }

  if (spillSlider && avatar) {
    spillSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (spillVal) spillVal.textContent = val.toFixed(2);
      avatar.setParameters({ spill: val });
    });
  }

  // =========================================================================
  // PWA Install Prompt, Pointer Callout & Modal Controller
  // =========================================================================
  const installPwaBtn = document.getElementById('installPwaBtn');
  const installModal = document.getElementById('installModal');
  const closeInstallBtn = document.getElementById('closeInstallBtn');
  const btnTriggerInstall = document.getElementById('btnTriggerInstall');
  const pwaCalloutHint = document.getElementById('pwaCalloutHint');
  const closeCalloutBtn = document.getElementById('closeCalloutBtn');

  // Check if callout was previously dismissed
  if (pwaCalloutHint && localStorage.getItem('j1_pwa_hint_dismissed') === 'true') {
    pwaCalloutHint.classList.add('is-dismissed');
  }

  let deferredInstallPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default mini-infobar on mobile
    e.preventDefault();
    deferredInstallPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    if (installModal) installModal.classList.remove('open');
    if (pwaCalloutHint) pwaCalloutHint.classList.add('is-dismissed');
    if (installPwaBtn) {
      installPwaBtn.style.display = 'none';
    }
  });

  const openInstallModal = () => {
    if (installModal) installModal.classList.add('open');
    if (pwaCalloutHint) {
      pwaCalloutHint.classList.add('is-dismissed');
      localStorage.setItem('j1_pwa_hint_dismissed', 'true');
    }
    audio.playPopSound();
  };

  const closeInstallModal = () => {
    if (installModal) installModal.classList.remove('open');
  };

  if (installPwaBtn) installPwaBtn.addEventListener('click', openInstallModal);
  if (closeInstallBtn) closeInstallBtn.addEventListener('click', closeInstallModal);

  if (pwaCalloutHint) {
    pwaCalloutHint.addEventListener('click', (e) => {
      if (e.target === closeCalloutBtn || closeCalloutBtn.contains(e.target)) {
        e.stopPropagation();
        pwaCalloutHint.classList.add('is-dismissed');
        localStorage.setItem('j1_pwa_hint_dismissed', 'true');
      } else {
        openInstallModal();
      }
    });
  }

  if (installModal) {
    installModal.addEventListener('click', (e) => {
      if (e.target === installModal) closeInstallModal();
    });
  }

  if (btnTriggerInstall) {
    btnTriggerInstall.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choiceResult = await deferredInstallPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          deferredInstallPrompt = null;
          closeInstallModal();
        }
      } else {
        // Fallback info for iOS / already installed
        const guideBox = document.querySelector('.install-guide-box');
        if (guideBox) {
          guideBox.scrollIntoView({ behavior: 'smooth' });
          guideBox.style.borderColor = 'var(--accent-blue)';
          setTimeout(() => {
            guideBox.style.borderColor = 'var(--border-subtle)';
          }, 1500);
        }
      }
    });
  }

  // Register Service Worker for PWA Installability
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Juan PWA Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('Juan PWA Service Worker registration failed:', err);
        });
    });
  }
});

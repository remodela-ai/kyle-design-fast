 /**
  * Kyle AI Chat Widget - Embeddable Lead Capture
  * Usage: <kyle-widget office-id="xxx" primary-color="#f59e0b"></kyle-widget>
  */
 (function() {
   'use strict';
 
   const WIDGET_VERSION = '1.0.0';
   const API_BASE = 'https://smbhkmahxxwichswvgep.supabase.co/functions/v1';
 
   class KyleWidget extends HTMLElement {
     constructor() {
       super();
       this.attachShadow({ mode: 'open' });
       this.isOpen = false;
       this.messages = [];
       this.conversationId = null;
       this.isLoading = false;
     }
 
     static get observedAttributes() {
       return ['office-id', 'primary-color', 'position', 'greeting'];
     }
 
     connectedCallback() {
       this.officeId = this.getAttribute('office-id');
       this.primaryColor = this.getAttribute('primary-color') || '#f59e0b';
       this.position = this.getAttribute('position') || 'bottom-right';
       this.greeting = this.getAttribute('greeting') || "Hi! I'm Kyle, your AI design assistant. Tell me about your dream space!";
       
       if (!this.officeId) {
         console.error('Kyle Widget: office-id attribute is required');
         return;
       }
 
       this.render();
       this.attachEventListeners();
       
       // Add initial greeting
       this.messages.push({ role: 'assistant', content: this.greeting });
       this.renderMessages();
     }
 
     getStyles() {
       const positionStyles = {
         'bottom-right': 'bottom: 20px; right: 20px;',
         'bottom-left': 'bottom: 20px; left: 20px;',
         'top-right': 'top: 20px; right: 20px;',
         'top-left': 'top: 20px; left: 20px;'
       };
 
       return `
         :host {
           --kyle-primary: ${this.primaryColor};
           --kyle-primary-dark: color-mix(in srgb, ${this.primaryColor} 80%, black);
           --kyle-bg: #0a0a0a;
           --kyle-surface: #171717;
           --kyle-border: #262626;
           --kyle-text: #f5f5f5;
           --kyle-text-muted: #a3a3a3;
           font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         }
 
         * {
           box-sizing: border-box;
           margin: 0;
           padding: 0;
         }
 
         .kyle-container {
           position: fixed;
           ${positionStyles[this.position] || positionStyles['bottom-right']}
           z-index: 999999;
         }
 
         .kyle-bubble {
           width: 60px;
           height: 60px;
           border-radius: 50%;
           background: linear-gradient(135deg, var(--kyle-primary) 0%, var(--kyle-primary-dark) 100%);
           cursor: pointer;
           display: flex;
           align-items: center;
           justify-content: center;
           box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
           transition: transform 0.2s, box-shadow 0.2s;
           border: none;
         }
 
         .kyle-bubble:hover {
           transform: scale(1.05);
           box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
         }
 
         .kyle-bubble svg {
           width: 28px;
           height: 28px;
           fill: white;
         }
 
         .kyle-bubble.open svg.chat-icon {
           display: none;
         }
 
         .kyle-bubble.open svg.close-icon {
           display: block;
         }
 
         .kyle-bubble:not(.open) svg.close-icon {
           display: none;
         }
 
         .kyle-chat {
           position: absolute;
           ${this.position.includes('bottom') ? 'bottom: 70px;' : 'top: 70px;'}
           ${this.position.includes('right') ? 'right: 0;' : 'left: 0;'}
           width: 380px;
           max-width: calc(100vw - 40px);
           height: 520px;
           max-height: calc(100vh - 120px);
           background: var(--kyle-bg);
           border-radius: 16px;
           border: 1px solid var(--kyle-border);
           box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
           display: none;
           flex-direction: column;
           overflow: hidden;
           animation: kyle-slide-in 0.3s ease;
         }
 
         .kyle-chat.open {
           display: flex;
         }
 
         @keyframes kyle-slide-in {
           from {
             opacity: 0;
             transform: translateY(10px) scale(0.95);
           }
           to {
             opacity: 1;
             transform: translateY(0) scale(1);
           }
         }
 
         .kyle-header {
           background: linear-gradient(135deg, var(--kyle-primary) 0%, var(--kyle-primary-dark) 100%);
           padding: 16px 20px;
           display: flex;
           align-items: center;
           gap: 12px;
         }
 
         .kyle-avatar {
           width: 40px;
           height: 40px;
           border-radius: 50%;
           background: rgba(255, 255, 255, 0.2);
           display: flex;
           align-items: center;
           justify-content: center;
           font-size: 20px;
         }
 
         .kyle-header-info h3 {
           color: white;
           font-size: 16px;
           font-weight: 600;
           margin-bottom: 2px;
         }
 
         .kyle-header-info p {
           color: rgba(255, 255, 255, 0.8);
           font-size: 12px;
         }
 
         .kyle-messages {
           flex: 1;
           overflow-y: auto;
           padding: 16px;
           display: flex;
           flex-direction: column;
           gap: 12px;
         }
 
         .kyle-message {
           max-width: 85%;
           padding: 12px 16px;
           border-radius: 16px;
           font-size: 14px;
           line-height: 1.5;
           animation: kyle-message-in 0.2s ease;
         }
 
         @keyframes kyle-message-in {
           from {
             opacity: 0;
             transform: translateY(8px);
           }
           to {
             opacity: 1;
             transform: translateY(0);
           }
         }
 
         .kyle-message.assistant {
           align-self: flex-start;
           background: var(--kyle-surface);
           color: var(--kyle-text);
           border-bottom-left-radius: 4px;
         }
 
         .kyle-message.user {
           align-self: flex-end;
           background: var(--kyle-primary);
           color: white;
           border-bottom-right-radius: 4px;
         }
 
         .kyle-typing {
           display: flex;
           gap: 4px;
           padding: 12px 16px;
           align-self: flex-start;
           background: var(--kyle-surface);
           border-radius: 16px;
           border-bottom-left-radius: 4px;
         }
 
         .kyle-typing span {
           width: 8px;
           height: 8px;
           background: var(--kyle-text-muted);
           border-radius: 50%;
           animation: kyle-typing 1.4s infinite;
         }
 
         .kyle-typing span:nth-child(2) {
           animation-delay: 0.2s;
         }
 
         .kyle-typing span:nth-child(3) {
           animation-delay: 0.4s;
         }
 
         @keyframes kyle-typing {
           0%, 60%, 100% {
             transform: translateY(0);
             opacity: 0.4;
           }
           30% {
             transform: translateY(-4px);
             opacity: 1;
           }
         }
 
         .kyle-input-area {
           padding: 12px 16px;
           border-top: 1px solid var(--kyle-border);
           display: flex;
           gap: 8px;
           background: var(--kyle-surface);
         }
 
         .kyle-input {
           flex: 1;
           background: var(--kyle-bg);
           border: 1px solid var(--kyle-border);
           border-radius: 24px;
           padding: 10px 16px;
           color: var(--kyle-text);
           font-size: 14px;
           outline: none;
           transition: border-color 0.2s;
         }
 
         .kyle-input:focus {
           border-color: var(--kyle-primary);
         }
 
         .kyle-input::placeholder {
           color: var(--kyle-text-muted);
         }
 
         .kyle-send {
           width: 40px;
           height: 40px;
           border-radius: 50%;
           background: var(--kyle-primary);
           border: none;
           cursor: pointer;
           display: flex;
           align-items: center;
           justify-content: center;
           transition: background 0.2s, transform 0.2s;
         }
 
         .kyle-send:hover {
           background: var(--kyle-primary-dark);
         }
 
         .kyle-send:active {
           transform: scale(0.95);
         }
 
         .kyle-send:disabled {
           opacity: 0.5;
           cursor: not-allowed;
         }
 
         .kyle-send svg {
           width: 18px;
           height: 18px;
           fill: white;
         }
 
         .kyle-powered {
           text-align: center;
           padding: 8px;
           font-size: 11px;
           color: var(--kyle-text-muted);
           background: var(--kyle-bg);
         }
 
         .kyle-powered a {
           color: var(--kyle-primary);
           text-decoration: none;
         }
 
         @media (max-width: 480px) {
           .kyle-chat {
             width: calc(100vw - 20px);
             height: calc(100vh - 100px);
             ${this.position.includes('right') ? 'right: 10px;' : 'left: 10px;'}
           }
           
           .kyle-bubble {
             width: 56px;
             height: 56px;
           }
         }
       `;
     }
 
     render() {
       this.shadowRoot.innerHTML = `
         <style>${this.getStyles()}</style>
         <div class="kyle-container">
           <div class="kyle-chat">
             <div class="kyle-header">
               <div class="kyle-avatar">🏠</div>
               <div class="kyle-header-info">
                 <h3>Kyle</h3>
                 <p>AI Design Assistant</p>
               </div>
             </div>
             <div class="kyle-messages" id="messages"></div>
             <div class="kyle-input-area">
               <input type="text" class="kyle-input" placeholder="Type your message..." id="input" />
               <button class="kyle-send" id="send">
                 <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
               </button>
             </div>
             <div class="kyle-powered">
               Powered by <a href="https://lovable.dev" target="_blank">Kyle AI</a>
             </div>
           </div>
           <button class="kyle-bubble" id="bubble">
             <svg class="chat-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
             <svg class="close-icon" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
           </button>
         </div>
       `;
     }
 
     attachEventListeners() {
       const bubble = this.shadowRoot.getElementById('bubble');
       const input = this.shadowRoot.getElementById('input');
       const send = this.shadowRoot.getElementById('send');
 
       bubble.addEventListener('click', () => this.toggle());
       send.addEventListener('click', () => this.sendMessage());
       input.addEventListener('keypress', (e) => {
         if (e.key === 'Enter' && !e.shiftKey) {
           e.preventDefault();
           this.sendMessage();
         }
       });
     }
 
     toggle() {
       this.isOpen = !this.isOpen;
       const chat = this.shadowRoot.querySelector('.kyle-chat');
       const bubble = this.shadowRoot.getElementById('bubble');
       
       chat.classList.toggle('open', this.isOpen);
       bubble.classList.toggle('open', this.isOpen);
       
       if (this.isOpen) {
         setTimeout(() => {
           this.shadowRoot.getElementById('input').focus();
         }, 100);
       }
     }
 
     renderMessages() {
       const container = this.shadowRoot.getElementById('messages');
       container.innerHTML = this.messages.map(msg => `
         <div class="kyle-message ${msg.role}">
           ${this.escapeHtml(msg.content)}
         </div>
       `).join('');
       
       if (this.isLoading) {
         container.innerHTML += `
           <div class="kyle-typing">
             <span></span><span></span><span></span>
           </div>
         `;
       }
       
       container.scrollTop = container.scrollHeight;
     }
 
     escapeHtml(text) {
       const div = document.createElement('div');
       div.textContent = text;
       return div.innerHTML;
     }
 
     async sendMessage() {
       const input = this.shadowRoot.getElementById('input');
       const message = input.value.trim();
       
       if (!message || this.isLoading) return;
       
       // Add user message
       this.messages.push({ role: 'user', content: message });
       input.value = '';
       this.isLoading = true;
       this.renderMessages();
 
       try {
         // Call kyle-lead-capture edge function
         const response = await fetch(`${API_BASE}/kyle-lead-capture`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             office_id: this.officeId,
             conversation_id: this.conversationId,
             message: message,
             messages: this.messages
           })
         });
 
         const data = await response.json();
         
         if (data.conversation_id) {
           this.conversationId = data.conversation_id;
         }
 
         if (data.response) {
           this.messages.push({ role: 'assistant', content: data.response });
         } else if (data.error) {
           this.messages.push({ role: 'assistant', content: "I'm sorry, I'm having trouble right now. Please try again." });
         }
       } catch (error) {
         console.error('Kyle Widget error:', error);
         this.messages.push({ role: 'assistant', content: "Connection error. Please check your internet and try again." });
       }
 
       this.isLoading = false;
       this.renderMessages();
     }
   }
 
   // Register custom element
   if (!customElements.get('kyle-widget')) {
     customElements.define('kyle-widget', KyleWidget);
   }
 
   console.log(`Kyle Widget v${WIDGET_VERSION} loaded`);
 })();
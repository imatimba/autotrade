// ==UserScript==
// @name         POE2 Auto trade
// @namespace    http://tampermonkey.net/
// @version      0.3
// @match        https://www.pathofexile.com/trade2*
// @grant        GM_addStyle
// @grant        GM_notification
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @license      MIT
// @downloadURL  https://github.com/imatimba/autotrade/raw/refs/heads/main/autotrade.user.js
// @updateURL    https://github.com/imatimba/autotrade/raw/refs/heads/main/autotrade.user.js
// ==/UserScript==
 
(function() {
    'use strict';
 
    // Styles for the UI
    GM_addStyle(`
        .enabled-btn {
            background-color: #af4c51ff !important;
            border: none;
            color: white;
            padding: 5px 10px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 12px;
            margin: 2px;
            cursor: pointer;
            border-radius: 3px;
        }
        .enabled-btn.active {
            background-color: #10a553ff !important;
        }
    `);
 
    // Helper to wait until button is enabled
    function waitForEnabled(btn, maxTries = 10, interval = 50) {
        let tries = 0;
        const timer = setInterval(() => {
            if (!btn.disabled && !btn.classList.contains('disabled')) {
                btn.click();
                console.log('Clicked trade button after waiting for enabled');
                clearInterval(timer);
            } else if (++tries >= maxTries) {
                console.log('Button did not become enabled in time');
                clearInterval(timer);
            }
        }, interval);
    }

    function clickTrade(element) { 
        if (!window.location.href.includes('live')) return; // Only operate in live search mode
        if (element.matches('.direct-btn')) {
            waitForEnabled(element);
        } else {
            const directButton = element.querySelector('.direct-btn');
            if (!directButton) return;
            waitForEnabled(directButton);
        }
    }
 
    let observer;
    function enableObserver() {
        if (!observer) {
            observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1 && node.matches('.row[data-id]')) {
                                clickTrade(node);
                                console.log('New trade row detected, attempting to click trade button');
                            }
                        });
                    } else if (mutation.type === 'characterData') {
                        const parent = mutation.target.parentElement;
                        if (parent && parent.classList.contains('direct-btn')) {
                            // Trim and check the text content
                            const btnText = parent.textContent.trim();
                            if (btnText.includes('In demand. Teleport anyway?')) {
                                clickTrade(parent);
                                console.log('Character data changed, matching text, attempting to click trade button');
                            }
                        }
                    }
                });
            });
        }
        // Only start observing if not already observing
        if (!observer._isObserving) {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
            observer._isObserving = true;
            console.log('Observer enabled');
        }
    }
    function disableObserver() {
        if (observer && observer._isObserving) {
            observer.disconnect();
            observer._isObserving = false;
            console.log('Observer disabled');
        }
    }
 
    // BroadcastChannel for global observer control
    const channel = new BroadcastChannel('autotrade_channel');
    channel.onmessage = (event) => {
        console.log('[BroadcastChannel] Message received:', event.data);
        if (event.data === 'enable-observer') {
            if (!autoTradeBtn.classList.contains('active')) {
                autoTradeBtn.classList.add('active');
                autoTradeBtn.textContent = 'Autotrade Enabled';                
            }
            if (!globalBtn.classList.contains('active')) {
                globalBtn.classList.add('active');
                globalBtn.textContent = 'Global Enabled';
            }
            enableObserver();
        } else if (event.data === 'disable-observer') {
            if (autoTradeBtn.classList.contains('active')) {
                autoTradeBtn.classList.remove('active');
                autoTradeBtn.textContent = 'Autotrade Disabled';
            }
            if (globalBtn.classList.contains('active')) {
                globalBtn.classList.remove('active');
                globalBtn.textContent = 'Global Disabled';
            }
            disableObserver();
        }
    };
    channel.onerror = (err) => {
        console.error('[BroadcastChannel] Error:', err);
    };
    channel.onmessageerror = (err) => {
        console.error('[BroadcastChannel] Message error:', err);
    };
 
    let autoTradeBtn;
    let globalBtn;
    
    function onLoad() {
        const interval = setInterval(() => {
            const liveSearchBtn = document.querySelector("button.btn.livesearch-btn");
            if (liveSearchBtn) {
                clearInterval(interval);
                liveSearchBtn.style.minWidth = "200px";
                const controlsLeft = document.querySelector('.controls-left');
                const controlsRight = document.querySelector('.controls-right');
                const controlsCenter = document.querySelector('.controls-center');
                [controlsLeft, controlsRight, controlsCenter].forEach(el => {
                    if (el) el.style.width = "33%";
                });
                
                autoTradeBtn = document.createElement('button');
                autoTradeBtn.className = 'enabled-btn';
                autoTradeBtn.textContent = 'Autotrade Disabled';

                autoTradeBtn.addEventListener('click', () => {
                    if (autoTradeBtn.classList.contains('active')) {
                        autoTradeBtn.classList.remove('active');
                        autoTradeBtn.textContent = 'Autotrade Disabled';
                        disableObserver();
                    } else {
                        autoTradeBtn.classList.add('active');
                        autoTradeBtn.textContent = 'Autotrade Enabled';
                        enableObserver();
                    }
                });
                liveSearchBtn.after(autoTradeBtn);

                globalBtn = document.createElement('button');
                globalBtn.className = 'enabled-btn';
                globalBtn.textContent = 'Global Disabled';
                globalBtn.title = 'Toggle autotrade in all tabs';
                
                globalBtn.addEventListener('click', () => {
                    const isActive = globalBtn.classList.contains('active');
                    if (!isActive) {
                        globalBtn.textContent = 'Global Enabled';
                        globalBtn.classList.add('active');
                        autoTradeBtn.textContent = 'Autotrade Enabled';
                        autoTradeBtn.classList.add('active');
                        console.log('[BroadcastChannel] Sending message:', 'enable-observer');
                        channel.postMessage('enable-observer');
                        enableObserver();
                    } else {
                        globalBtn.textContent = 'Global Disabled';
                        globalBtn.classList.remove('active');
                        autoTradeBtn.textContent = 'Autotrade Disabled';
                        autoTradeBtn.classList.remove('active');
                        console.log('[BroadcastChannel] Sending message:', 'disable-observer');
                        channel.postMessage('disable-observer');
                        disableObserver();
                    }
                });
                autoTradeBtn.after(globalBtn);
            }
        }, 500);
    }
 
    // Initial setup
    onLoad();
})();
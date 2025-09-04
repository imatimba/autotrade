// ==UserScript==
// @name         POE2 Auto trade
// @namespace    http://tampermonkey.net/
// @version      0.1
// @match        https://www.pathofexile.com/trade2*
// @grant        GM_addStyle
// @grant        GM_notification
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @license      MIT
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
            background-color: #36f48bff !important;
        }
    `);
 
    // Function to click trade button
    function clickTrade(row) { 
        const directButton = row.querySelector('.direct-btn:not(.disabled)');
        if (!directButton) return;
        
        directButton.click();
     
    }
 
    let observer;
    function enableObserver() {
        if (!observer) {
            observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.matches('.row[data-id]')) {
                            clickTrade(node);
                        }
                    });
                });
            });
        }
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    function disableObserver() {
        if (observer) {
            observer.disconnect();
        }
    }
 
    // Add alert buttons to existing items
    function onLoad() {
        const interval = setInterval(() => {
            const liveSearchBtn = document.querySelector("button.btn.livesearch-btn");
            console.log("Looking for button");
            if (liveSearchBtn) {
                clearInterval(interval);
                liveSearchBtn.style.minWidth = "200px";
                const autoTradeBtn = document.createElement('button');
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
            }
        }, 500);
    }
 
    // Initial setup
    onLoad();
})();
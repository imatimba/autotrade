 
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
            background-color: #af4c51ff;
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
            background-color: #36f48bff;
        }
    `);
 
    // Function to add /whois button
    function clickTrade(row) {
        if (row.querySelector('.enabled-btn')) return;
 
        const directButton = row.querySelector('.direct-btn');
        if (!directButton) return;
 
        const charName = row.querySelector('.character-name').textContent;
        const cleanedName = charName.replace(/^IGN: /, '').trim();

        const whoIsString = `/whois ${cleanedName}`;

        const whoIsButton = document.createElement('button');
        whoIsButton.className = 'enabled-btn';
        whoIsButton.textContent = whoIsString;
        whoIsButton.title = 'Copy /whois command to clipboard';
 
        // Add an event listener to the button
        whoIsButton.addEventListener('click', function() {
        // Get the text content of the button
        const textToCopy = whoIsButton.textContent;

        // Use Clipboard API to copy the text
        navigator.clipboard.writeText(textToCopy)
        .then(() => {
            console.log('Text copied to clipboard');
            })
        .catch(err => {
            console.error('Could not copy text: ', err);
            });
        });

        directButton.parentNode.insertBefore(whoIsButton, directButton.nextSibling);
    }
 
    // Add alert buttons to existing items
    function onLoad() {
        const interval = setInterval(() => {
            const liveSearchBtn = document.querySelector("button.btn.livesearch-btn");
            console.log("Looking for button");
            if (liveSearchBtn) {
                clearInterval(interval);
                const newElement = document.createElement('button');
                newElement.className = "enabled-btn";
                newElement.innerHTML = `
                <button id='autotrade-button' type="button" class='enabled-btn' onclick='addResistancesClick()'>
                    <span>Autotrade Disabled</span>
                </button>
                `;
                console.log("Adding button");
                liveSearchBtn.after(newElement);
            }
        }, 500);
    }
 
    // Watch for new items being added
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.matches('.row[data-id]')) {
                    clickTrade(node);
                }
            });
        });
    });
 
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
 
    // Initial setup
    onLoad();
})();
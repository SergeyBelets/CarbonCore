// main.js - Minimal entry point for CarbonCore Platform

// Mobile debugging helper - logs to both console and localStorage for mobile inspection
function mobileLog(message, data) {
    // Format timestamp
    const now = new Date();
    const timestamp = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;
    
    // Format log entry
    const logEntry = {
        timestamp,
        message,
        data: data || null
    };
    
    // Log to console
    console.log(`[MOBILE_DEBUG] ${message}`, data || '');
    
    // Store in localStorage (keep last 50 entries)
    try {
        let logs = JSON.parse(localStorage.getItem('mobileDebugLogs') || '[]');
        logs.push(logEntry);
        
        // Keep only last 50 logs
        if (logs.length > 50) {
            logs = logs.slice(logs.length - 50);
        }
        
        localStorage.setItem('mobileDebugLogs', JSON.stringify(logs));
    } catch (e) {
        console.error('Failed to store log in localStorage:', e);
    }
}

// Application state
let appState = {
    initialized: false,
    currentPage: null,
    walletConnected: false,
    environment: {
        isMobile: false,
        isWeb3Wallet: false,
        walletType: null
    }
};

// Get the current page name
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop();
    return page || 'index.html';
}

// Detect browser environment (mobile, Web3 wallet, etc.)
function detectEnvironment() {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    const isWeb3Wallet = /WalletConnect|Trust\/|MetaMask\/|Coinbase\/|Rainbow\//.test(navigator.userAgent);
    
    // Set environment in app state
    appState.environment = {
        isMobile,
        isWeb3Wallet,
        walletType: isWeb3Wallet ? 'detected' : null
    };
    
    // Set attributes on body for CSS targeting
    if (isMobile) document.body.setAttribute('data-mobile', 'true');
    if (isWeb3Wallet) document.body.setAttribute('data-wallet-container', 'true');
    
    mobileLog('Environment detected', appState.environment);
    return appState.environment;
}

// Initialize mobile menu functionality
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            
            // Toggle hamburger animation
            const spans = mobileMenuToggle.querySelectorAll('span');
            if (mobileMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
        
        // Close mobile menu when a link is clicked
        const mobileMenuLinks = mobileMenu.querySelectorAll('a');
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('active');
                
                // Reset hamburger icon
                const spans = mobileMenuToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
    }
}

// Highlight active nav item
function highlightActiveNav() {
    const currentPage = getCurrentPage();
    
    // Select all nav links
    const navLinks = document.querySelectorAll('.main-nav a, .mobile-menu a');
    
    navLinks.forEach(link => {
        // Get the href attribute
        const href = link.getAttribute('href');
        
        // If the href matches the current page, add active class
        if (href === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Setup wallet connection buttons
function setupWalletConnectionButtons() {
    mobileLog('Setting up wallet connection buttons');
    
    // Skip entirely on mobile
    const isMobile = appState.environment.isMobile;
    if (isMobile) {
        mobileLog('Skipping wallet button setup on mobile');
        hideAllConnectButtons();
        return;
    }
    
    // Main connect wallet button
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            mobileLog('Connect wallet button clicked');
            
            try {
                if (typeof window.connectWallet === 'function') {
                    const result = await window.connectWallet();
                    mobileLog('Connection result', result);
                    
                    if (result) {
                        // Update app state
                        appState.walletConnected = true;
                        
                        // Update UI
                        updateWalletConnectionState(true);
                    }
                } else {
                    mobileLog('window.connectWallet function not available');
                    alert('Wallet connection not available yet. Please try again later.');
                }
            } catch (error) {
                mobileLog('Error connecting wallet', error.message);
                console.error('Error connecting wallet:', error);
                alert('Failed to connect wallet: ' + error.message);
            }
        });
    }
    
    // Feature connect button
    const connectWalletFeatureBtn = document.getElementById('connectWalletFeatureBtn');
    if (connectWalletFeatureBtn) {
        setupFeatureButton(connectWalletFeatureBtn);
    }
    
    // CTA connect button
    const ctaConnectWalletBtn = document.getElementById('ctaConnectWalletBtn');
    if (ctaConnectWalletBtn) {
        setupCTAButton(ctaConnectWalletBtn);
    }
    
    // Check if wallet is already connected
    const savedWalletAddress = sessionStorage.getItem('walletAddress');
    if (savedWalletAddress) {
        appState.walletConnected = true;
        updateWalletConnectionState(true);
        mobileLog('Found saved wallet address', savedWalletAddress);
    }
}

// Setup feature button (changes based on connection state)
function setupFeatureButton(button) {
    const savedWalletAddress = sessionStorage.getItem('walletAddress');
    
    if (savedWalletAddress) {
        button.textContent = 'Go to Dashboard';
        button.addEventListener('click', function() {
            window.location.href = 'dashboard.html';
        });
    } else {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            if (typeof window.connectWallet === 'function') {
                try {
                    const result = await window.connectWallet();
                    if (result) {
                        // Change button after successful connection
                        button.textContent = 'Go to Dashboard';
                        button.onclick = function() {
                            window.location.href = 'dashboard.html';
                        };
                    }
                } catch (error) {
                    console.error('Error connecting wallet:', error);
                }
            }
        });
    }
}

// Setup CTA button (changes based on connection state)
function setupCTAButton(button) {
    const savedWalletAddress = sessionStorage.getItem('walletAddress');
    const ctaButtonText = document.getElementById('ctaButtonText');
    
    if (savedWalletAddress && ctaButtonText) {
        ctaButtonText.textContent = 'Go to Dashboard';
        button.addEventListener('click', function() {
            window.location.href = 'dashboard.html';
        });
    } else {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            if (typeof window.connectWallet === 'function') {
                try {
                    const result = await window.connectWallet();
                    if (result && ctaButtonText) {
                        // Change button after successful connection
                        ctaButtonText.textContent = 'Go to Dashboard';
                        button.onclick = function() {
                            window.location.href = 'dashboard.html';
                        };
                    }
                } catch (error) {
                    console.error('Error connecting wallet:', error);
                }
            }
        });
    }
}

// Hide all connect wallet buttons on mobile
function hideAllConnectButtons() {
    const connectButtons = [
        document.getElementById('connectWalletBtn'),
        document.getElementById('mobileConnectWalletBtn'),
        document.getElementById('ctaConnectWalletBtn'),
        document.getElementById('connectWalletFeatureBtn'),
        document.getElementById('dashboardConnectWalletBtn')
    ];
    
    connectButtons.forEach(button => {
        if (button) {
            button.style.display = 'none';
        }
    });
    
    mobileLog('Hid all connect wallet buttons on mobile');
}

// Update UI based on wallet connection state
function updateWalletConnectionState(isConnected) {
    const walletAddress = sessionStorage.getItem('walletAddress');
    
    if (isConnected && walletAddress) {
        // Update header
        const connectWalletBtn = document.getElementById('connectWalletBtn');
        const walletInfo = document.getElementById('walletInfo');
        const walletAddressElement = document.getElementById('walletAddress');
        
        if (connectWalletBtn) connectWalletBtn.style.display = 'none';
        if (walletInfo) walletInfo.classList.remove('hidden');
        if (walletAddressElement) {
            const formattedAddress = `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;
            walletAddressElement.textContent = formattedAddress;
        }
        
        // Update feature button
        const connectWalletFeatureBtn = document.getElementById('connectWalletFeatureBtn');
        if (connectWalletFeatureBtn) {
            connectWalletFeatureBtn.textContent = 'Go to Dashboard';
            connectWalletFeatureBtn.onclick = function() {
                window.location.href = 'dashboard.html';
            };
        }
        
        // Update CTA button
        const ctaButtonText = document.getElementById('ctaButtonText');
        if (ctaButtonText) {
            ctaButtonText.textContent = 'Go to Dashboard';
            ctaButtonText.parentElement.onclick = function() {
                window.location.href = 'dashboard.html';
            };
        }
    }
}

// Add direct MetaMask button for mobile
function addDirectMetaMaskButton() {
    const isMobile = appState.environment.isMobile;
    if (!isMobile) return;
    
    // Check if we're already in MetaMask
    const isInMetaMask = navigator.userAgent.includes('MetaMask');
    if (isInMetaMask) {
        mobileLog('Already in MetaMask browser, not showing deep link button');
        return;
    }
    
    // Create the button
    const button = document.createElement('button');
    button.id = 'openInMetaMaskBtn';
    button.innerText = 'Open in MetaMask App';
    button.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #F6851B;
        color: white;
        font-weight: bold;
        padding: 12px 20px;
        border-radius: 8px;
        border: none;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 9999;
        font-size: 16px;
    `;
    
    // Add click handler
    button.addEventListener('click', function() {
        mobileLog('MetaMask deep link button clicked');
        
        // Create deep link URL
        const currentUrl = `${window.location.host}${window.location.pathname}${window.location.search}`;
        const mmDeepLink = `https://metamask.app.link/dapp/${currentUrl}`;
        
        mobileLog('Opening MetaMask deep link', mmDeepLink);
        
        // Save current page for return
        sessionStorage.setItem('returnToPage', window.location.href);
        
        // Redirect to MetaMask
        window.location.href = mmDeepLink;
    });
    
    // Add button to body
    document.body.appendChild(button);
    mobileLog('Added direct MetaMask button');
}

// Auto-connect wallet if mobile MetaMask browser is detected
function autoConnectWalletIfNeeded() {
    const isInMetaMask = navigator.userAgent.includes('MetaMask');
    
    if (isInMetaMask && !sessionStorage.getItem('walletAddress')) {
        mobileLog('Auto-connecting wallet in MetaMask browser');
        
        setTimeout(() => {
            if (typeof window.connectWallet === 'function') {
                window.connectWallet()
                    .then(result => {
                        mobileLog('Auto-connect result', result);
                        if (result) {
                            appState.walletConnected = true;
                            updateWalletConnectionState(true);
                        }
                    })
                    .catch(error => {
                        mobileLog('Auto-connect error', error.message);
                    });
            }
        }, 1000);
    }
}

// Check if we returned from MetaMask
function checkReturnFromMetaMask() {
    const returnPage = sessionStorage.getItem('returnToPage');
    
    if (returnPage) {
        mobileLog('Detected return from MetaMask', { returnPage });
        sessionStorage.removeItem('returnToPage');
        
        // Check if wallet is connected after return
        if (window.ethereum && window.ethereum.selectedAddress) {
            mobileLog('MetaMask connected after return', { address: window.ethereum.selectedAddress });
            
            // Save wallet address to session storage
            sessionStorage.setItem('walletAddress', window.ethereum.selectedAddress);
            
            // Update state
            appState.walletConnected = true;
            updateWalletConnectionState(true);
            
            // Show success notification
            setTimeout(() => {
                alert('Successfully connected to MetaMask');
            }, 1000);
        }
    }
}

// Initialize page-specific logic
async function initPageSpecific() {
    const currentPage = getCurrentPage();
    appState.currentPage = currentPage;
    
    mobileLog('Initializing page', currentPage);
    
    // Page-specific initializations
    switch(currentPage) {
        case 'dashboard.html':
            await initDashboard();
            break;
        case 'profile.html':
            // Profile page initialization would go here
            mobileLog('Profile page detected - full functionality pending mainnet deployment');
            break;
        default:
            // Default page initialization
            break;
    }
}

// Dashboard page initialization
async function initDashboard() {
    mobileLog('Initializing dashboard...');
    
    // Check if wallet is connected
    const walletAddress = sessionStorage.getItem('walletAddress');
    
    // Show appropriate state
    const loadingState = document.getElementById('loadingState');
    const noWalletState = document.getElementById('noWalletState');
    const dashboardContent = document.getElementById('dashboardContent');
    
    if (loadingState) loadingState.classList.add('hidden');
    
    if (!walletAddress) {
        // Show no wallet state
        if (noWalletState) noWalletState.classList.remove('hidden');
        if (dashboardContent) dashboardContent.classList.add('hidden');
        
        // Setup dashboard connect button
        const dashboardConnectWalletBtn = document.getElementById('dashboardConnectWalletBtn');
        if (dashboardConnectWalletBtn) {
            dashboardConnectWalletBtn.addEventListener('click', async function() {
                if (typeof window.connectWallet === 'function') {
                    try {
                        const result = await window.connectWallet();
                        if (result) {
                            window.location.reload(); // Reload to update dashboard state
                        }
                    } catch (error) {
                        console.error('Error connecting wallet:', error);
                    }
                }
            });
        }
    } else {
        // Show basic dashboard content
        if (noWalletState) noWalletState.classList.add('hidden');
        if (dashboardContent) {
            dashboardContent.classList.remove('hidden');
            
            // Update wallet address display
            const userWalletAddress = document.getElementById('userWalletAddress');
            if (userWalletAddress) {
                const formattedAddress = `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;
                userWalletAddress.textContent = formattedAddress;
            }
            
            // Setup disconnect button
            const disconnectWalletBtn = document.getElementById('disconnectWalletBtn');
            if (disconnectWalletBtn) {
                disconnectWalletBtn.addEventListener('click', function() {
                    sessionStorage.removeItem('walletAddress');
                    window.location.reload();
                });
            }
        }
    }
}

// Handle blockchain network changes
function handleChainChanged(chainId) {
    mobileLog('Chain changed to:', chainId);
    
    // Check if the new chain is Ethereum mainnet
    if (chainId !== '0x1') {
        alert('Please switch to Ethereum mainnet to use CarbonCore');
    } else {
        mobileLog('Connected to Ethereum mainnet');
    }
    
    // Refresh the page to ensure all state is updated
    window.location.reload();
}

// Initialize event handlers
function initEventHandlers() {
    mobileLog('Initializing global event handlers');
    
    // Listen for network changes
    if (window.ethereum) {
        window.ethereum.on('chainChanged', handleChainChanged);
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', function(accounts) {
            if (accounts.length === 0) {
                // User disconnected
                sessionStorage.removeItem('walletAddress');
                appState.walletConnected = false;
                window.location.reload();
            } else {
                // User switched accounts
                const newAccount = accounts[0];
                sessionStorage.setItem('walletAddress', newAccount);
                appState.walletConnected = true;
                updateWalletConnectionState(true);
            }
        });
    }
}

// Add mobile debug helper (only in debug mode)
function addMobileDebugHelper() {
    const isMobile = appState.environment.isMobile;
    const isDebugMode = window.location.search.includes('debug=1');
    
    if (!isMobile || !isDebugMode) return;
    
    // Create debug button
    const debugButton = document.createElement('button');
    debugButton.id = 'mobileDebugButton';
    debugButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.3);
        color: white;
        font-size: 16px;
        font-weight: bold;
        border: none;
        z-index: 9999;
    `;
    debugButton.textContent = 'D';
    
    // Create debug panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'mobileDebugPanel';
    debugPanel.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 80%;
        background-color: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 10px;
        overflow: auto;
        z-index: 10000;
        display: none;
        font-size: 12px;
        font-family: monospace;
    `;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: red;
        color: white;
        font-size: 16px;
        font-weight: bold;
        border: none;
    `;
    closeButton.textContent = 'X';
    debugPanel.appendChild(closeButton);
    
    // Add content
    const content = document.createElement('div');
    content.style.marginTop = '50px';
    debugPanel.appendChild(content);
    
    // Add to document
    document.body.appendChild(debugButton);
    document.body.appendChild(debugPanel);
    
    // Setup event listeners
    debugButton.addEventListener('click', function() {
        debugPanel.style.display = 'block';
        
        // Update content
        const logs = JSON.parse(localStorage.getItem('mobileDebugLogs') || '[]');
        const state = {
            appState: appState,
            walletAddress: sessionStorage.getItem('walletAddress'),
            environment: appState.environment
        };
        
        content.innerHTML = `
            <h3>App State:</h3>
            <pre>${JSON.stringify(state, null, 2)}</pre>
            <h3>Recent Logs:</h3>
            ${logs.slice(-10).map(log => `
                <div style="margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    <div style="color: #999;">[${log.timestamp}]</div>
                    <div style="color: #FFF; font-weight: bold;">${log.message}</div>
                    ${log.data ? `<pre style="color: #AAF;">${JSON.stringify(log.data, null, 2)}</pre>` : ''}
                </div>
            `).join('')}
        `;
    });
    
    closeButton.addEventListener('click', function() {
        debugPanel.style.display = 'none';
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    mobileLog('DOM fully loaded - initializing CarbonCore');
    
    try {
        // Check if we returned from MetaMask
        checkReturnFromMetaMask();
        
        // Detect environment
        detectEnvironment();
        
        // Auto-connect if needed
        autoConnectWalletIfNeeded();
        
        // Add MetaMask button for mobile
        addDirectMetaMaskButton();
        
        // Add debug helper if in debug mode
        addMobileDebugHelper();
        
        // Initialize mobile menu
        initMobileMenu();
        
        // Highlight active nav items
        highlightActiveNav();
        
        // Setup wallet connection buttons (desktop only)
        setupWalletConnectionButtons();
        
        // Initialize page-specific features
        await initPageSpecific();
        
        // Initialize event handlers
        initEventHandlers();
        
        // Load mobile Web3 support if available
        if (window.mobileWeb3 && typeof window.mobileWeb3.initMobileWeb3 === 'function') {
            window.mobileWeb3.initMobileWeb3();
        }
        
        // Mark app as initialized
        appState.initialized = true;
        mobileLog('CarbonCore initialization completed');
        
    } catch (error) {
        console.error('Error during application initialization:', error);
        mobileLog('Error during initialization', error.message);
    }
});

// Export app state for other scripts
window.appState = appState;
window.mobileLog = mobileLog;
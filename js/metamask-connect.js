// metamask-connect.js - Handle MetaMask wallet connection

// State for wallet connection
let walletState = {
    isConnected: false,
    address: null,
    chainId: null
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setupWalletButtons();
    checkWalletConnection();
});

// Check if window.ethereum is repeatedly available on mobile
// Some mobile browsers initialize it asynchronously
function ensureEthereumAvailable() {
    let checkCount = 0;
    const maxChecks = 10;
    
    return new Promise((resolve, reject) => {
        function checkEthereum() {
            if (window.ethereum) {
                if (window.mobileLog) {
                    window.mobileLog('window.ethereum is available', {
                        isMetaMask: window.ethereum.isMetaMask,
                        selectedAddress: window.ethereum.selectedAddress,
                        chainId: window.ethereum.chainId
                    });
                }
                resolve(window.ethereum);
                return;
            }
            
            checkCount++;
            if (checkCount >= maxChecks) {
                if (window.mobileLog) {
                    window.mobileLog('window.ethereum not available after multiple checks');
                }
                reject(new Error('MetaMask not detected after multiple checks'));
                return;
            }
            
            if (window.mobileLog) {
                window.mobileLog(`Checking for window.ethereum (${checkCount}/${maxChecks})`);
            }
            
            setTimeout(checkEthereum, 300);
        }
        
        checkEthereum();
    });
}

// Set up all wallet connection buttons
function setupWalletButtons() {
    // Main connect button in header
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', connectWallet);
    }
    
    // Mobile menu connect button
    const mobileConnectWalletBtn = document.getElementById('mobileConnectWalletBtn');
    if (mobileConnectWalletBtn) {
        mobileConnectWalletBtn.addEventListener('click', connectWallet);
    }
    
    // Feature section connect button (on home page)
    const connectWalletFeatureBtn = document.getElementById('connectWalletFeatureBtn');
    if (connectWalletFeatureBtn) {
        if (sessionStorage.getItem('walletAddress')) {
            connectWalletFeatureBtn.textContent = 'Go to Dashboard';
            connectWalletFeatureBtn.addEventListener('click', function() {
                window.location.href = 'dashboard.html';
            });
        } else {
            connectWalletFeatureBtn.addEventListener('click', connectWallet);
        }
    }
    
    // CTA section connect button
    const ctaConnectWalletBtn = document.getElementById('ctaConnectWalletBtn');
    const ctaButtonText = document.getElementById('ctaButtonText');
    if (ctaConnectWalletBtn && ctaButtonText) {
        if (sessionStorage.getItem('walletAddress')) {
            ctaButtonText.textContent = 'Disconnect Wallet';
            ctaConnectWalletBtn.addEventListener('click', function() {
                disconnectWallet();
            });
        } else {
            ctaConnectWalletBtn.addEventListener('click', connectWallet);
        }
    }
    
    // Dashboard connect button
    const dashboardConnectWalletBtn = document.getElementById('dashboardConnectWalletBtn');
    if (dashboardConnectWalletBtn) {
        dashboardConnectWalletBtn.addEventListener('click', connectWallet);
    }
}

// Connect to MetaMask wallet
async function connectWallet() {
    console.log('Attempting to connect wallet...');
    
    // Check for mobile device
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    const isInMetaMask = navigator.userAgent.includes('MetaMask');
    
    // For mobile devices, but not in MetaMask browser, offer direct link to app
    if (isMobile && !isInMetaMask && !window.ethereum) {
        console.log('Mobile device detected, offering deep link to MetaMask');
        
        // Offer to open in MetaMask app
        if (confirm('Would you like to open in MetaMask app?')) {
            const currentUrl = `${window.location.host}${window.location.pathname}${window.location.search}`;
            const mmDeepLink = `https://metamask.app.link/dapp/${currentUrl}`;
            
            // Save current page
            sessionStorage.setItem('returnToPage', window.location.href);
            
            // Redirect to MetaMask
            window.location.href = mmDeepLink;
            return { redirected: true };
        }
    }
    
    // Check if MetaMask is installed
    if (!window.ethereum) {
        console.error('MetaMask not detected');
        
        // Show error notification if available
        if (window.utils && window.utils.notify) {
            window.utils.notify.error('MetaMask not detected. Please install MetaMask to use this feature.');
        } else {
            alert('MetaMask not detected. Please install MetaMask to use this feature.');
        }
        
        // Open MetaMask install page
        window.open('https://metamask.io/download/', '_blank');
        
        return null;
    }
    
    try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length === 0) {
            console.error('No accounts found');
            
            // Show error notification
            if (window.utils && window.utils.notify) {
                window.utils.notify.error('No accounts found in MetaMask. Please create an account and try again.');
            } else {
                alert('No accounts found in MetaMask. Please create an account and try again.');
            }
            
            return null;
        }
        
        // Get the first account
        const address = accounts[0];
        console.log('Connected to wallet:', address);
        
        // Get current chain ID
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('Current chain ID:', chainId);
        
        // Check if on Ethereum mainnet (chainId 0x1 or 1)
        const requiredChainId = '0x1'; // Ethereum Mainnet
        
        if (chainId !== requiredChainId) {
            console.warn('Not connected to Ethereum mainnet');
            
            // Show notification
            if (window.utils && window.utils.notify) {
                window.utils.notify.warning('You are not connected to Ethereum mainnet. Please switch to Ethereum mainnet to use CarbonCore.');
            } else {
                alert('Please switch to Ethereum mainnet in your MetaMask wallet to use CarbonCore.');
            }
            
            // Try to switch to Ethereum mainnet
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: requiredChainId }]
                });
                
                // Get updated chain ID
                const updatedChainId = await window.ethereum.request({ method: 'eth_chainId' });
                console.log('Switched to chain ID:', updatedChainId);
                
                // Update chain ID in state
                walletState.chainId = updatedChainId;
                
                // Show success notification
                if (window.utils && window.utils.notify) {
                    window.utils.notify.success('Successfully switched to Ethereum mainnet.');
                }
            } catch (switchError) {
                console.error('Error switching to Ethereum mainnet:', switchError);
                
                // Show error notification
                if (window.utils && window.utils.notify) {
                    window.utils.notify.error('Failed to switch to Ethereum mainnet. Please switch manually in MetaMask.');
                } else {
                    alert('Please switch to Ethereum mainnet in your MetaMask wallet.');
                }
                
                return null;
            }
        }
        
        // Store in session storage
        sessionStorage.setItem('walletAddress', address);
        
        // Update wallet state
        walletState.isConnected = true;
        walletState.address = address;
        walletState.chainId = chainId;
        
        // Update UI
        updateWalletUI(address);
        
        // Show success notification
        if (window.utils && window.utils.notify) {
            window.utils.notify.success('Successfully connected to MetaMask!');
        }
        
        // Create ethers provider and signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // Return wallet data
        return {
            address,
            chainId,
            provider,
            signer
        };
    } catch (error) {
        console.error('Error connecting to wallet:', error);
        
        // Handle user rejected request
        if (error.code === 4001) {
            console.log('User rejected connection request');
            
            // Show notification
            if (window.utils && window.utils.notify) {
                window.utils.notify.warning('Wallet connection was rejected. Please try again and confirm the connection in MetaMask.');
            }
        } else {
            // Show error notification
            if (window.utils && window.utils.notify) {
                window.utils.notify.error(`Failed to connect to wallet: ${error.message}`);
            } else {
                alert(`Failed to connect to wallet: ${error.message}`);
            }
        }
        
        return null;
    }
}

// Disconnect wallet
async function disconnectWallet() {
    console.log('Disconnecting wallet...');
    
    // Remove from session storage
    sessionStorage.removeItem('walletAddress');
    sessionStorage.removeItem('userTokenId');
    sessionStorage.removeItem('userProfile');
    sessionStorage.removeItem('userRoles');
    
    // Update wallet state
    walletState.isConnected = false;
    walletState.address = null;
    walletState.chainId = null;
    
    // Update UI
    updateWalletUI(null);
    
    // Show notification
    if (window.utils && window.utils.notify) {
        window.utils.notify.info('Wallet disconnected.');
    }
    
    // If user auth module is available, call its disconnect handler
    if (window.userAuth && typeof window.userAuth.handleDisconnect === 'function') {
        await window.userAuth.handleDisconnect();
    } else {
        // Just reload the page if no handler available
        window.location.reload();
    }
    
    return true;
}

// Check if wallet is already connected
function checkWalletConnection() {
    const walletAddress = sessionStorage.getItem('walletAddress');
    
    if (walletAddress) {
        console.log('Found wallet address in session storage:', walletAddress);
        
        // Update wallet state
        walletState.isConnected = true;
        walletState.address = walletAddress;
        
        // Update UI
        updateWalletUI(walletAddress);
        
        return true;
    }
    
    return false;
}

// Update UI based on wallet connection state
function updateWalletUI(address) {
    console.log('Updating wallet UI with address:', address);
    
    // If address is provided, we're connected. Otherwise, disconnected.
    const isConnected = !!address;
    
    // Update header connection button
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const walletInfo = document.getElementById('walletInfo');
    const walletAddressElement = document.getElementById('walletAddress');
    
    if (connectWalletBtn && walletInfo && walletAddressElement) {
        if (isConnected) {
            // Format address
            const formattedAddress = formatWalletAddress(address);
            
            // Update UI
            connectWalletBtn.style.display = 'none';
            walletInfo.classList.remove('hidden');
            walletAddressElement.textContent = formattedAddress;
        } else {
            // Reset UI
            connectWalletBtn.style.display = 'block';
            walletInfo.classList.add('hidden');
            walletAddressElement.textContent = '';
        }
    }
    
    // Update Feature section connect button
    const connectWalletFeatureBtn = document.getElementById('connectWalletFeatureBtn');
    if (connectWalletFeatureBtn) {
        if (isConnected) {
            connectWalletFeatureBtn.textContent = 'Go to Dashboard';
            connectWalletFeatureBtn.onclick = function() {
                window.location.href = 'dashboard.html';
            };
        } else {
            connectWalletFeatureBtn.textContent = 'Connect Wallet';
            connectWalletFeatureBtn.onclick = connectWallet;
        }
    }
    
    // Update CTA button
    const ctaConnectWalletBtn = document.getElementById('ctaConnectWalletBtn');
    const ctaButtonText = document.getElementById('ctaButtonText');
    if (ctaConnectWalletBtn && ctaButtonText) {
        if (isConnected) {
            ctaButtonText.textContent = 'Go to Dashboard';
            ctaConnectWalletBtn.onclick = function() {
                window.location.href = 'dashboard.html';
            };
        } else {
            ctaButtonText.textContent = 'Connect Wallet';
            ctaConnectWalletBtn.onclick = connectWallet;
        }
    }
}

// Format wallet address for display
function formatWalletAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Mobile and Web3 wallet specific connection handling
async function initWalletConnection() {
    // Check for mobile/Web3 wallet environment if available
    const environment = window.mobileWeb3 ? window.mobileWeb3.detectEnvironment() : null;
    
    // If we're in a Web3 wallet environment
    if (environment && environment.isWeb3Wallet) {
        console.log('Web3 wallet environment detected:', environment);
        
        try {
            // Use built-in wallet's provider
            const provider = window.ethereum || window.web3?.currentProvider;
            
            if (provider) {
                // Create ethers provider
                const ethersProvider = new ethers.providers.Web3Provider(provider);
                const signer = ethersProvider.getSigner();
                
                // Get accounts
                const accounts = await provider.request({ method: 'eth_requestAccounts' });
                const account = accounts[0];
                
                // Store address
                sessionStorage.setItem('walletAddress', account);
                
                // Update state
                walletState.isConnected = true;
                walletState.address = account;
                
                // Update UI
                updateWalletUI(account);
                
                console.log('Auto-connected to wallet in Web3 environment:', account);
                
                return {
                    address: account,
                    provider: ethersProvider,
                    signer
                };
            }
        } catch (error) {
            console.error('Error auto-connecting to Web3 wallet:', error);
        }
    }
    
    // Fall back to standard MetaMask connection for desktop or when auto-connect fails
    return connectWallet();
}

// Function to force update all buttons on the page
function forceUpdateAllButtons() {
    console.log('Force updating all buttons');
    
    // Check connection state
    const walletAddress = sessionStorage.getItem('walletAddress');
    const isConnected = !!walletAddress;
    
    // Update buttons based on state
    if (isConnected) {
        // Hide Connect Wallet button and show wallet info
        const connectWalletBtn = document.getElementById('connectWalletBtn');
        const walletInfo = document.getElementById('walletInfo');
        const walletAddressElement = document.getElementById('walletAddress');
        
        if (connectWalletBtn) connectWalletBtn.style.display = 'none';
        if (walletInfo) walletInfo.classList.remove('hidden');
        if (walletAddressElement) walletAddressElement.textContent = formatWalletAddress(walletAddress);
        
        // Change text and function of feature connect button
        const connectWalletFeatureBtn = document.getElementById('connectWalletFeatureBtn');
        if (connectWalletFeatureBtn) {
            connectWalletFeatureBtn.textContent = 'Go to Dashboard';
            connectWalletFeatureBtn.onclick = function() {
                window.location.href = 'dashboard.html';
            };
        }
        
        // Change text and function of CTA button
        const ctaConnectWalletBtn = document.getElementById('ctaConnectWalletBtn');
        const ctaButtonText = document.getElementById('ctaButtonText');
        if (ctaConnectWalletBtn && ctaButtonText) {
            ctaButtonText.textContent = 'Go to Dashboard';
            ctaConnectWalletBtn.onclick = function() {
                window.location.href = 'dashboard.html';
            };
        }
    }
}

// Add handler on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Run force update 1 second after page load
    setTimeout(forceUpdateAllButtons, 1000);
});

// Export the function so it can be called from other places
window.forceUpdateAllButtons = forceUpdateAllButtons;

// Export the new function
window.initWalletConnection = initWalletConnection;

// Export functions
window.connectWallet = connectWallet;
window.disconnectWallet = disconnectWallet;
window.updateWalletUI = updateWalletUI;
window.getWalletState = () => walletState;
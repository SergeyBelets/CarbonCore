// web3-integration.js - Basic wallet connection without contract dependencies

// Initialize Web3 connection
async function initWeb3() {
    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed!');
        
        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            // Set up ethers provider
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            console.log('Connected account:', account);
            
            // Store in session storage
            sessionStorage.setItem('walletAddress', account);
            
            // Update UI to show connected wallet
            updateWalletUI(account);
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            
            return { provider, signer, account };
        } catch (error) {
            console.error('User denied account access:', error);
            return null;
        }
    } else {
        console.log('MetaMask is not installed!');
        alert('Please install MetaMask to connect your wallet!');
        return null;
    }
}

// Handle account changes
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected their wallet
        console.log('Wallet disconnected');
        sessionStorage.removeItem('walletAddress');
        updateWalletUI(null);
    } else {
        // User switched accounts
        const newAccount = accounts[0];
        console.log('Account changed to:', newAccount);
        sessionStorage.setItem('walletAddress', newAccount);
        updateWalletUI(newAccount);
    }
}

// Update UI based on wallet connection state
function updateWalletUI(account) {
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const mobileConnectWalletBtn = document.getElementById('mobileConnectWalletBtn');
    const walletInfo = document.getElementById('walletInfo');
    const walletAddress = document.getElementById('walletAddress');
    
    if (account) {
        // Wallet is connected
        if (connectWalletBtn) connectWalletBtn.style.display = 'none';
        if (mobileConnectWalletBtn) mobileConnectWalletBtn.style.display = 'none';
        
        if (walletInfo) {
            walletInfo.classList.remove('hidden');
            
            if (walletAddress) {
                // Format address to show first 6 and last 4 characters
                const formattedAddress = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
                walletAddress.textContent = formattedAddress;
            }
        }
    } else {
        // Wallet is disconnected
        if (connectWalletBtn) connectWalletBtn.style.display = 'flex';
        if (mobileConnectWalletBtn) mobileConnectWalletBtn.style.display = 'flex';
        
        if (walletInfo) {
            walletInfo.classList.add('hidden');
        }
    }
}

// Check wallet connection on page load
document.addEventListener('DOMContentLoaded', function() {
    const storedWalletAddress = sessionStorage.getItem('walletAddress');
    
    if (storedWalletAddress) {
        // User was previously connected
        updateWalletUI(storedWalletAddress);
    }
});

// Exported functions
async function connectWallet() {
    return await initWeb3();
}

async function disconnectWallet() {
    // Remove from session storage
    sessionStorage.removeItem('walletAddress');
    
    // Update UI
    updateWalletUI(null);
    
    // Note: There's no direct way to disconnect from MetaMask via JavaScript
    // The wallet connection will remain active in MetaMask itself
    
    console.log('Wallet disconnected from app');
    return true;
}

// Export functions
window.connectWallet = connectWallet;
window.disconnectWallet = disconnectWallet;
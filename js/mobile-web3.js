// mobile-web3.js - Support for mobile Web3 wallets and applications

/**
 * Environment detection for mobile and Web3 wallet contexts
 * @returns {Object} Environment details
 */
function detectEnvironment() {
    // Detect mobile device
    const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    // Detect Web3 wallet browser
    const isWeb3Wallet = /WalletConnect|Trust\/|MetaMask\/|Coinbase\/|Rainbow\/|TokenPocket|imToken|Brave|Status/.test(navigator.userAgent);
    
    // Detect specific wallets for customization
    const isMetaMaskMobile = /MetaMask\//.test(navigator.userAgent);
    const isTrustWallet = /Trust\//.test(navigator.userAgent);
    const isCoinbaseWallet = /Coinbase\//.test(navigator.userAgent);
    
    // Set attributes on body for CSS targeting
    if (isMobileDevice) document.body.setAttribute('data-mobile', 'true');
    if (isWeb3Wallet) document.body.setAttribute('data-wallet-container', 'true');
    
    // Detect wallet specific attributes
    if (isMetaMaskMobile) document.body.setAttribute('data-wallet-type', 'metamask');
    if (isTrustWallet) document.body.setAttribute('data-wallet-type', 'trust');
    if (isCoinbaseWallet) document.body.setAttribute('data-wallet-type', 'coinbase');
    
    // Log detection results for debugging
    console.log('Environment detected:', {
        isMobileDevice,
        isWeb3Wallet,
        walletDetails: {
            isMetaMaskMobile,
            isTrustWallet,
            isCoinbaseWallet
        }
    });
    
    return {
        isMobileDevice,
        isWeb3Wallet,
        isMetaMaskMobile,
        isTrustWallet,
        isCoinbaseWallet
    };
}

/**
 * Loads environment-specific stylesheets
 */
function loadEnvironmentStyles() {
    const { isMobileDevice, isWeb3Wallet } = detectEnvironment();
    
    // Load mobile styles
    if (isMobileDevice) {
        loadStylesheet('css/mobile.css');
    }
    
    // Load Web3 wallet specific styles
    if (isWeb3Wallet) {
        loadStylesheet('css/web3-wallet.css');
    }
    
    // Load BottomNavigation styles for both mobile and Web3 wallets
    if (isMobileDevice || isWeb3Wallet) {
        loadStylesheet('css/bottom-nav.css');
    }
}

/**
 * Creates and appends a stylesheet link
 * @param {string} href - Path to CSS file
 */
function loadStylesheet(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
}

/**
 * Creates bottom navigation for mobile devices
 */
function createBottomNavigation() {
    const { isMobileDevice, isWeb3Wallet } = detectEnvironment();
    if (!isMobileDevice && !isWeb3Wallet) return;
    
    // Check if bottom nav already exists
    if (document.querySelector('.mobile-bottom-nav')) return;
    
    // Get current page to highlight active item
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Create navigation container
    const bottomNav = document.createElement('nav');
    bottomNav.className = 'mobile-bottom-nav';
    
    // Define navigation items with updated structure
    const navItems = [
        { id: 'home', icon: 'home', text: 'Home', url: 'index.html' },
        { id: 'dashboard', icon: 'dashboard', text: 'Dashboard', url: 'dashboard.html' },
        { id: 'profile', icon: 'user', text: 'Profile', url: 'profile.html' },
        { id: 'requests', icon: 'mail', text: 'Requests', url: 'requests.html' },
        { id: 'settings', icon: 'settings', text: 'Settings', url: 'settings.html' }
    ];
    
    // Generate HTML for each navigation item
    navItems.forEach(item => {
        const isActive = currentPage === item.url;
        const navItem = document.createElement('a');
        navItem.href = item.url;
        navItem.className = `mobile-nav-item ${isActive ? 'active' : ''}`;
        navItem.id = `mobile-nav-${item.id}`;
        
        navItem.innerHTML = `
            <div class="mobile-nav-icon ${item.icon}"></div>
            <div class="mobile-nav-text">${item.text}</div>
        `;
        
        bottomNav.appendChild(navItem);
    });
    
    // Add to DOM
    document.body.appendChild(bottomNav);
    
    // Add space at the bottom to prevent content from being hidden under nav
    document.body.style.paddingBottom = '70px';
    
    console.log('Bottom navigation created with updated structure');
}

/**
 * Helper function to check if a file exists
 * Note: This is just a stub, as client-side JS cannot check if a file exists directly
 * This would need to be replaced with a server-side check or pre-configured list
 */
function fileExists(url) {
    // In a real implementation, this would check if the file exists
    // For now, we'll assume new pages don't exist yet
    return ['index.html', 'dashboard.html', 'profile.html'].includes(url);
}

/**
 * Adapts page UI for mobile and Web3 wallet experience
 */
function adaptUIForMobile() {
    const { isMobileDevice, isWeb3Wallet } = detectEnvironment();
    if (!isMobileDevice && !isWeb3Wallet) return;
    
    // General mobile UI adaptations
    document.body.classList.add('mobile-optimized');
    
    // Increase touch targets for better mobile usability
    const buttons = document.querySelectorAll('button, .btn, input[type="button"]');
    buttons.forEach(button => {
        button.classList.add('mobile-touch-target');
    });
    
    // Adapt specific page elements
    adaptHeaderForMobile();
    
    // Page-specific adaptations
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    switch(currentPage) {
        case 'profile.html':
            adaptProfileForMobile();
            break;
        case 'dashboard.html':
            adaptDashboardForMobile();
            break;
        default:
            // Default adaptations
            break;
    }
}

/**
 * Adapts header for mobile view
 */
function adaptHeaderForMobile() {
    // Simplify header for mobile
    const header = document.querySelector('.header');
    if (header) {
        header.classList.add('mobile-header');
    }
    
    // Hide desktop navigation, it will be replaced by bottom nav
    const mainNav = document.querySelector('.main-nav');
    if (mainNav) {
        mainNav.classList.add('hidden-on-mobile');
    }
}

/**
 * Adapts profile page for mobile view
 */
function adaptProfileForMobile() {
    // Move edit button to bottom of screen for easier access
    const editButton = document.getElementById('editProfileButton');
    if (editButton) {
        editButton.classList.add('mobile-floating-action');
    }
    
    // Ensure profile fields are in mobile-friendly format
    const profileFields = document.querySelectorAll('.profile-field');
    profileFields.forEach(field => {
        field.classList.add('mobile-profile-field');
    });
}

/**
 * Adapts dashboard for mobile view
 */
function adaptDashboardForMobile() {
    // Stack cards vertically
    const dashboardCards = document.querySelector('.dashboard-cards');
    if (dashboardCards) {
        dashboardCards.classList.add('mobile-stack');
    }
    
    // Simplify stats display
    const statsContainer = document.querySelector('.stats-container');
    if (statsContainer) {
        statsContainer.classList.add('mobile-stats');
    }
}

/**
 * Initialize mobile Web3 support
 */
function initMobileWeb3() {
    console.log('Initializing mobile Web3 support');
    
    // Detect environment
    const environment = detectEnvironment();
    
    // Load appropriate styles
    loadEnvironmentStyles();
    
    // Create bottom navigation for mobile and Web3 wallet environments
    if (environment.isMobileDevice || environment.isWeb3Wallet) {
        createBottomNavigation();
        adaptUIForMobile();
    }
    
    // Return environment for other scripts to use
    return environment;
}

// Export functions
window.mobileWeb3 = {
    initMobileWeb3,
    detectEnvironment,
    createBottomNavigation,
    adaptUIForMobile
};

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile support
    initMobileWeb3();
});
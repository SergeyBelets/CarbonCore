// utils.js - Common utility functions for CarbonCore platform

// Notification system
const notificationSystem = {
    show: function(message, type = 'info', duration = 5000) {
        // Create notification element if it doesn't exist
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.className = 'notification-container';
            notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(notificationContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : type === 'warning' ? '#ffaa44' : '#4444ff'};
            color: white;
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            position: relative;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add styles for animation
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .notification-hide {
                    animation: slideOut 0.3s ease-in;
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        notification.innerHTML = message;
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'notification-close';
        closeButton.innerHTML = '&times;';
        closeButton.style.cssText = `
            position: absolute;
            top: 5px;
            right: 10px;
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            opacity: 0.7;
        `;
        closeButton.addEventListener('click', () => {
            notification.remove();
        });
        notification.appendChild(closeButton);
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Auto remove after duration
        setTimeout(() => {
            notification.classList.add('notification-hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    },
    
    info: function(message, duration) {
        this.show(message, 'info', duration);
    },
    
    success: function(message, duration) {
        this.show(message, 'success', duration);
    },
    
    warning: function(message, duration) {
        this.show(message, 'warning', duration);
    },
    
    error: function(message, duration) {
        this.show(message, 'error', duration);
    }
};

// Loading state management
const loadingManager = {
    activeLoaders: new Set(),
    
    show: function(loaderId, message = 'Loading...') {
        this.activeLoaders.add(loaderId);
        
        // Create or update loading overlay
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                flex-direction: column;
                color: white;
                font-size: 18px;
            `;
            
            overlay.innerHTML = `
                <div style="
                    width: 50px; 
                    height: 50px; 
                    border: 5px solid #f3f3f3; 
                    border-top: 5px solid #667eea; 
                    border-radius: 50%; 
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                "></div>
                <div id="loading-message">${message}</div>
            `;
            
            // Add spinner animation
            if (!document.getElementById('loading-styles')) {
                const style = document.createElement('style');
                style.id = 'loading-styles';
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(overlay);
        } else {
            overlay.style.display = 'flex';
            const messageEl = document.getElementById('loading-message');
            if (messageEl) messageEl.textContent = message;
        }
    },
    
    hide: function(loaderId) {
        this.activeLoaders.delete(loaderId);
        
        // Only hide if no active loaders
        if (this.activeLoaders.size === 0) {
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        }
    },
    
    hideAll: function() {
        this.activeLoaders.clear();
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
};

// Role mapping utilities
const roleUtils = {
    // Get role hash from role name
    getRoleHash: function(roleName) {
        if (!window.appConfig) {
            console.error('App config not yet initialized');
            return null;
        }
        
        if (!window.appConfig.constants || !window.appConfig.constants.roles) {
            console.error('Role constants not available in app config');
            return null;
        }
        
        return window.appConfig.constants.roles[roleName];
    },
    
    // Get role name (internal constant name) from hash
    getRoleName: function(roleHash) {
        if (!window.appConfig) {
            console.error('App config not yet initialized');
            return 'UNKNOWN_ROLE';
        }
        
        if (!window.appConfig.constants || !window.appConfig.constants.roles) {
            console.error('Role constants not available in app config');
            return 'UNKNOWN_ROLE';
        }
        
        // Create a reverse mapping
        for (const [name, hash] of Object.entries(window.appConfig.constants.roles)) {
            if (hash.toLowerCase() === roleHash.toLowerCase()) {
                return name;
            }
        }
        
        return 'UNKNOWN_ROLE';
    },
    
    // Get display name from role hash
    getRoleDisplayName: function(roleHash) {
        const roleName = this.getRoleName(roleHash);
        return this.getDisplayNameFromRoleName(roleName);
    },
    
    // Get display name from role name
    getDisplayNameFromRoleName: function(roleName) {
        if (!roleName) return 'Unknown Role';
        
        // Convert ROLE_NAME format to Title Case
        const displayName = roleName.replace('_ROLE', '').replace(/_/g, ' ')
            .replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
            
        // Special cases for better display
        const specialCases = {
            'Admin': 'Administrator',
            'Landowner': 'Land Owner',
            'Government': 'Government Agency',
            'Guest': 'Guest User'
        };
        
        return specialCases[displayName] || displayName;
    },
    
    // Get role badge color
    getRoleBadgeColor: function(roleName) {
        const colors = {
            'ADMIN_ROLE': '#ff4444',
            'LANDOWNER_ROLE': '#44aa44', 
            'EXPERT_ROLE': '#4444ff',
            'GOVERNMENT_ROLE': '#ff8800',
            'BUYER_ROLE': '#8844ff',
            'GUEST_ROLE': '#888888'
        };
        
        return colors[roleName] || '#cccccc';
    }
};

// Error handling
function handleContractError(error, functionName) {
    console.error(`Error in ${functionName}:`, error);
    
    // Extract useful information from errors
    let errorMessage = "Unknown error occurred";
    if (error.reason) {
        errorMessage = error.reason;
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    // Add more specific error handling
    if (errorMessage.includes("user rejected transaction") || error.code === 4001) {
        return { error: "transaction_rejected", message: "Transaction was rejected by the user" };
    } else if (errorMessage.includes("Address already has a token")) {
        return { error: "token_exists", message: "This address already has an NFT profile" };
    } else if (errorMessage.includes("insufficient funds")) {
        return { error: "insufficient_funds", message: "Insufficient ETH balance for this operation" };
    } else if (errorMessage.includes("network") || errorMessage.includes("connection")) {
        return { error: "network_error", message: "Network connection error. Please check your internet connection." };
    } else if (errorMessage.includes("gas")) {
        return { error: "gas_error", message: "Transaction failed due to gas issues. Please try again." };
    }
    
    return { error: "contract_error", message: errorMessage };
}

// Format helpers
const formatHelpers = {
    // Format wallet address to display form
    walletAddress: function(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    },
    
    // Format date to readable string
    date: function(dateObj) {
        if (!dateObj) return '';
        if (typeof dateObj === 'number') {
            dateObj = new Date(dateObj * 1000); // Convert Unix timestamp
        }
        return dateObj.toLocaleString();
    },
    
    // Format ETH amount
    eth: function(amount) {
        if (!amount) return '0 ETH';
        
        try {
            const balanceInEth = typeof amount === 'string' ? amount : ethers.utils.formatEther(amount);
            const numericBalance = parseFloat(balanceInEth);
            
            if (numericBalance === 0) return '0 ETH';
            if (numericBalance < 0.0001) return '< 0.0001 ETH';
            if (numericBalance < 1) return `${numericBalance.toFixed(6)} ETH`;
            
            return `${numericBalance.toFixed(4)} ETH`;
        } catch (error) {
            console.error('Error formatting ETH amount:', error);
            return '0 ETH';
        }
    },
    
    // Format large numbers with K, M suffixes
    number: function(num) {
        if (!num) return '0';
        
        const numValue = typeof num === 'string' ? parseFloat(num) : num;
        
        if (numValue >= 1000000) {
            return (numValue / 1000000).toFixed(1) + 'M';
        } else if (numValue >= 1000) {
            return (numValue / 1000).toFixed(1) + 'K';
        }
        
        return numValue.toString();
    }
};

// Local storage helpers
const storageHelpers = {
    // Set item with expiration
    setWithExpiry: function(key, value, ttl) {
        const now = new Date();
        const item = {
            value: value,
            expiry: now.getTime() + ttl
        };
        localStorage.setItem(key, JSON.stringify(item));
    },
    
    // Get item with expiration check
    getWithExpiry: function(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        
        try {
            const item = JSON.parse(itemStr);
            const now = new Date();
            
            if (now.getTime() > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            
            return item.value;
        } catch (e) {
            localStorage.removeItem(key);
            return null;
        }
    },
    
    // Clear expired items
    clearExpired: function() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            this.getWithExpiry(key); // This will remove expired items
        });
    }
};

// Environment detection helpers
const environmentHelpers = {
    // Check if running on mobile
    isMobile: function() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    },
    
    // Check if running in Web3 wallet
    isWeb3Wallet: function() {
        return /WalletConnect|Trust\/|MetaMask\/|Coinbase\/|Rainbow\//.test(navigator.userAgent);
    },
    
    // Check if MetaMask is available
    hasMetaMask: function() {
        return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
    },
    
    // Get current network
    getCurrentNetwork: async function() {
        if (!window.ethereum) return null;
        
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            return {
                chainId,
                isMainnet: chainId === '0x1',
                isTestnet: chainId !== '0x1'
            };
        } catch (error) {
            console.error('Error getting network:', error);
            return null;
        }
    }
};

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle utility
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export utils with new additions
window.utils = {
    notify: notificationSystem,
    loading: loadingManager,
    roles: roleUtils,
    handleError: handleContractError,
    format: formatHelpers,
    storage: storageHelpers,
    environment: environmentHelpers,
    debounce: debounce,
    throttle: throttle
};
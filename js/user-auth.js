// user-auth.js - Handles NFT-based authentication flow

// User state
let currentUserState = {
    walletConnected: false,
    walletAddress: null,
    hasNFT: false,
    tokenId: null,
    profile: null,
    roles: [],
    ethBalance: null
};

// Initialize user authentication
async function initUserAuth() {
    console.log('Initializing user authentication...');
    
    // Check if wallet is already connected (from session storage)
    const savedWalletAddress = sessionStorage.getItem('walletAddress');
    if (savedWalletAddress) {
        console.log('Found saved wallet address:', savedWalletAddress);
        
        // Update wallet connection UI
        window.updateWalletUI(savedWalletAddress);
        
        // Set wallet connection state
        currentUserState.walletConnected = true;
        currentUserState.walletAddress = savedWalletAddress;
        
        // Check if user has NFT
        await checkUserAuthentication();
    }
    
    // Set up authentication listeners
    setupAuthListeners();
    
    return currentUserState;
}

// Set up authentication related event listeners
function setupAuthListeners() {
    console.log('Setting up authentication listeners...');
    
    // Listen for wallet connection changes from MetaMask
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
    
    // Listen for manual wallet disconnection
    const disconnectWalletBtn = document.getElementById('disconnectWalletBtn');
    if (disconnectWalletBtn) {
        disconnectWalletBtn.addEventListener('click', handleDisconnect);
    }
}

// Handle wallet accounts changed event
async function handleAccountsChanged(accounts) {
    console.log('Accounts changed event:', accounts);
    
    if (accounts.length === 0) {
        // User disconnected wallet
        await handleDisconnect();
    } else {
        // User switched accounts
        const newAccount = accounts[0];
        console.log('Account switched to:', newAccount);
        
        // Update session storage
        sessionStorage.setItem('walletAddress', newAccount);
        
        // Update wallet connection UI
        window.updateWalletUI(newAccount);
        
        // Update user state
        currentUserState.walletAddress = newAccount;
        
        // Re-check NFT status with new address
        await checkUserAuthentication();
    }
}

// Handle wallet disconnection
async function handleDisconnect() {
    console.log('Handling wallet disconnection...');
    
    // Remove from session storage
    sessionStorage.removeItem('walletAddress');
    sessionStorage.removeItem('userTokenId');
    sessionStorage.removeItem('userProfile');
    
    // Update UI
    window.updateWalletUI(null);
    
    // Reset user state
    currentUserState = {
        walletConnected: false,
        walletAddress: null,
        hasNFT: false,
        tokenId: null,
        profile: null,
        roles: [],
        ethBalance: null
    };
    
    // Disconnect wallet
    await window.disconnectWallet();
    
    // If on dashboard or other protected pages, redirect to home
    const currentPath = window.location.pathname;
    if (currentPath.includes('dashboard') || currentPath.includes('profile')) {
        window.location.href = 'index.html';
    }
}

// Check if user has NFT and load profile
async function checkUserAuthentication() {
    console.log('Checking user authentication status...');
    
    if (!currentUserState.walletAddress) {
        console.error('No wallet address available for authentication check');
        return false;
    }
    
    try {
        // Check ETH balance
        const balance = await window.contractAPI.checkETHBalance(currentUserState.walletAddress);
        if (balance !== null) {
            currentUserState.ethBalance = balance;
        }
        
        // Check for NFT
        const nftResult = await window.contractAPI.checkUserNFT(currentUserState.walletAddress);
        console.log('NFT check result:', nftResult);
        
        if (!nftResult) {
            // User doesn't have an NFT
            currentUserState.hasNFT = false;
            return false;
        }
        
        // User has an NFT
        currentUserState.hasNFT = true;
        currentUserState.tokenId = nftResult.tokenId;
        
        // Store tokenId in session storage
        sessionStorage.setItem('userTokenId', nftResult.tokenId.toString());
        
        // Fetch user profile
        await loadUserProfile();
        
        // Fetch user roles
        await loadUserRoles();
        
        return true;
    } catch (error) {
        console.error('Error checking user authentication:', error);
        return false;
    }
}

// Load user profile
async function loadUserProfile() {
    console.log('Loading user profile for tokenId:', currentUserState.tokenId?.toString());
    
    if (!currentUserState.tokenId) {
        console.error('No tokenId available to load profile');
        return null;
    }
    
    try {
        // Get user profile
        const profile = await window.contractAPI.getUserProfile(currentUserState.tokenId);
        if (profile) {
            currentUserState.profile = profile;
            
            // Store profile in session storage
            sessionStorage.setItem('userProfile', JSON.stringify(profile));
            
            console.log('User profile loaded:', profile);
            return profile;
        }
        return null;
    } catch (error) {
        console.error('Error loading user profile:', error);
        return null;
    }
}

// Load user roles
async function loadUserRoles() {
    console.log('Loading user roles for tokenId:', currentUserState.tokenId?.toString());
    
    if (!currentUserState.tokenId) {
        console.error('No tokenId available to load roles');
        return [];
    }
    
    try {
        // Get user roles
        const roles = await window.contractAPI.getUserRoles(currentUserState.tokenId);
        if (roles && roles.length > 0) {
            currentUserState.roles = roles;
            
            // Store roles in session storage
            sessionStorage.setItem('userRoles', JSON.stringify(roles));
            
            console.log('User roles loaded:', roles);
            return roles;
        }
        return [];
    } catch (error) {
        console.error('Error loading user roles:', error);
        return [];
    }
}

/**
 * Create new user profile with automatic request for GUEST_ROLE
 * This function handles the creation of a new user NFT profile and submits a request
 * for the GUEST_ROLE through the RequestManager contract.
 * 
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @param {string} email - User's email (optional)
 * @param {string} phoneNumber - User's phone number (optional)
 * @param {string} physicalAddress - User's physical address (optional)
 * @param {string} metadataURI - IPFS metadata URI (optional)
 * @returns {Promise<Object>} - Result with status information
 */
// Update the existing createNewUserProfile function in user-auth.js
async function createNewUserProfile(firstName, lastName, email = "", phoneNumber = "", physicalAddress = "", metadataURI = "") {
    console.log('Creating new user profile...');
    
    if (!currentUserState.walletAddress) {
        console.error('No wallet address available to create profile');
        return { error: 'no_wallet_connected' };
    }
    
    try {
        // Show loading state if available
        if (window.utils && window.utils.loading) {
            window.utils.loading.show('profileCreation', 'Creating your profile...');
        }
        
        // Check if contracts are initialized
        if (!window.contracts || !window.contracts.userNFT) {
            console.log("Contracts not initialized or missing userNFT reference");
            
            // Fall back to using contractAPI for profile creation
            console.log("Using contractAPI fallback for profile creation");
            const result = await window.contractAPI.createNewUserWithGuestRole(
                currentUserState.walletAddress,
                firstName,
                lastName,
                email,
                phoneNumber,
                physicalAddress,
                metadataURI
            );
            
            // If successful, update local state
            if (result && result.success) {
                // Update user state
                currentUserState.hasNFT = true;
                currentUserState.tokenId = result.tokenId;
                
                // Store tokenId in sessionStorage
                sessionStorage.setItem('userTokenId', result.tokenId.toString());
                
                // Load profile and roles
                await loadUserProfile();
                await loadUserRoles();
            }
            
            return result;
        }
        
        // Check balance
        const balance = await window.contractAPI.checkETHBalance(currentUserState.walletAddress);
        
        // Get NFT creation fee
        const mintFee = await window.contractAPI.getMintFee();
        
        // Check if balance is sufficient (including gas estimate)
        const gasEstimate = ethers.utils.parseEther('0.05'); // ~0.05 ETH for gas
        const totalRequired = mintFee.add(gasEstimate);
        
        if (balance.lt(totalRequired)) {
            console.error('Insufficient balance for NFT creation');
            return {
                error: 'insufficient_balance',
                balance: balance,
                required: totalRequired
            };
        }
        
        // Check if user already has an NFT
        try {
            const tokenId = await window.contracts.userNFT.getTokenIdByAddress(currentUserState.walletAddress);
            console.log('User already has NFT with token ID:', tokenId.toString());
            
            // Update user state
            currentUserState.hasNFT = true;
            currentUserState.tokenId = tokenId;
            
            // Store tokenId in sessionStorage
            sessionStorage.setItem('userTokenId', tokenId.toString());
            
            // Load profile and roles
            await loadUserProfile();
            await loadUserRoles();
            
            return {
                error: 'already_has_nft',
                tokenId: tokenId
            };
        } catch (error) {
            // Expected error "Address has no token" for new users, continue with registration
            console.log('User does not have an NFT, proceeding with creation...');
        }
        
        // Step 1: Create NFT using registerSelf
        const tx = await window.contracts.userNFT.registerSelf(
            firstName,
            lastName,
            email,
            phoneNumber,
            physicalAddress,
            metadataURI,
            { value: mintFee }
        );
        
        console.log('NFT creation transaction sent:', tx.hash);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log('NFT creation transaction confirmed:', receipt);
        
        // Find NFT creation event to get tokenId
        let tokenId;
        const selfRegEvent = receipt.events.find(e => e.event === 'SelfRegistrationCompleted');
        if (selfRegEvent) {
            tokenId = selfRegEvent.args.tokenId;
        } else {
            const createEvent = receipt.events.find(e => e.event === 'UserProfileCreated');
            if (createEvent) {
                tokenId = createEvent.args.tokenId;
            } else {
                console.error('User creation event not found in transaction receipt');
                return { error: 'event_not_found' };
            }
        }
        
        console.log('User profile created with token ID:', tokenId.toString());
        
        // Update user state
        currentUserState.hasNFT = true;
        currentUserState.tokenId = tokenId;
        
        // Store tokenId in sessionStorage
        sessionStorage.setItem('userTokenId', tokenId.toString());
        
        // Load profile and roles
        await loadUserProfile();
        await loadUserRoles();
        
        // Step 2: Create role request for GUEST_ROLE through RequestManager
        let roleRequestCreated = false;
        let roleRequestId = null;
        
        try {
            // Check if the requestManager contract is available
            if (window.contracts.requestManager) {
                // Get GUEST_ROLE value from configuration
                let GUEST_ROLE = null;
                
                // Use utils.roles if available
                if (window.utils && window.utils.roles) {
                    GUEST_ROLE = window.utils.roles.getRoleHash('GUEST_ROLE');
                    console.log('Getting GUEST_ROLE via utils.roles:', GUEST_ROLE);
                } else {
                    // Fallback to direct config access
                    if (window.appConfig && window.appConfig.constants && window.appConfig.constants.roles) {
                        GUEST_ROLE = window.appConfig.constants.roles.GUEST_ROLE;
                        console.log('Getting GUEST_ROLE directly from config:', GUEST_ROLE);
                    } else {
                        console.error('Unable to get GUEST_ROLE value, role request will not be created');
                    }
                }
                
                if (GUEST_ROLE) {
                    // Log role details for debugging
                    if (window.utils && window.utils.roles) {
                        console.log('Creating role request for role:', window.utils.roles.getRoleDisplayName(GUEST_ROLE));
                    }
                    
                    // Create guest role request through RequestManager
                    const requestTx = await window.contracts.requestManager.createRoleChangeRequest(
                        GUEST_ROLE,
                        "Self-registration as a new user",
                        ""
                    );
                    
                    console.log('Role request transaction sent:', requestTx.hash);
                    const requestReceipt = await requestTx.wait();
                    
                    // Find role request creation event
                    const requestEvent = requestReceipt.events.find(e => e.event === 'RoleChangeRequestCreated');
                    if (requestEvent) {
                        roleRequestId = requestEvent.args.requestId;
                        roleRequestCreated = true;
                        console.log('Role request created with ID:', roleRequestId.toString());
                    }
                }
            } else {
                // Try using contractAPI if direct contract access is not available
                console.log('RequestManager contract not available, using contractAPI fallback for role request');
                const roleResult = await window.contractAPI.createRoleChangeRequest(tokenId, 'GUEST_ROLE');
                if (roleResult && roleResult.success) {
                    roleRequestCreated = true;
                    roleRequestId = roleResult.requestId;
                }
            }
        } catch (roleError) {
            console.error('Error creating role request:', roleError);
            // Don't interrupt the process as the main task (NFT creation) is already completed
        }
        
        // Return successful result
        return {
            success: true,
            tokenId: tokenId,
            roleRequestCreated: roleRequestCreated,
            roleRequestId: roleRequestId
        };
    } catch (error) {
        console.error('Error creating user profile:', error);
        
        // Error handling
        if (error.code === 4001 || 
            (error.message && error.message.includes('User denied transaction'))) {
            return { error: 'transaction_rejected' };
        }
        
        return { error: 'exception', message: error.message };
    } finally {
        // Hide loading indicator
        if (window.utils && window.utils.loading) {
            window.utils.loading.hide('profileCreation');
        }
    }
}

// Update user profile
async function updateUserProfile(firstName, lastName, email = "", phoneNumber = "", physicalAddress = "", metadataURI = "") {
    console.log('Updating user profile...');
    
    if (!currentUserState.tokenId) {
        console.error('No tokenId available to update profile');
        return false;
    }
    
    try {
        // Update user profile
        const success = await window.contractAPI.updateUserProfile(
            currentUserState.tokenId,
            firstName,
            lastName,
            email,
            phoneNumber,
            physicalAddress,
            metadataURI
        );
        
        if (!success) {
            console.error('Failed to update user profile');
            return false;
        }
        
        console.log('User profile updated successfully');
        
        // Reload user profile
        await loadUserProfile();
        
        return true;
    } catch (error) {
        console.error('Error updating user profile:', error);
        return false;
    }
}

// Check if user has specific role
function hasRole(roleName) {
    console.log('Checking if user has role:', roleName);
    
    if (!currentUserState.roles || currentUserState.roles.length === 0) {
        return false;
    }
    
    return currentUserState.roles.some(role => 
        role.roleTypeName === roleName && role.active
    );
}

// Get current user state
function getUserState() {
    return currentUserState;
}

// Export functions
window.userAuth = {
    initUserAuth,
    checkUserAuthentication,
    createNewUserProfile,
    updateUserProfile,
    loadUserProfile,
    hasRole,
    getUserState,
    handleDisconnect
};
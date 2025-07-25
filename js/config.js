// config.js - Configuration settings for CarbonCore platform

// Network configuration
const networkConfig = {
    // Blockchain network configuration
    ethereum: {
        chainId: '0x1', // 1 in hex (Ethereum Mainnet)
        chainName: 'Ethereum Mainnet',
        rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY', // Replace with your key
        blockExplorerUrl: 'https://etherscan.io',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        }
    }
};

// Contract addresses - Will be updated after mainnet deployment
const contractAddresses = {
    // Deployed contract addresses on Ethereum Mainnet
    // These will be updated once contracts are deployed
    userNFT: null,
    roleManager: null,
    territoryRegistry: null,
    carbonCreditFactory: null,
    territoryTokenFactory: null,
    requestManager: null,
    commentManager: null,
    standardValidators: null,
    adminTokenId: '1'
};

// API endpoints
const apiEndpoints = {
    // Backend API endpoints
    baseUrl: 'https://api.carboncore.earth',
    territories: '/api/territories',
    verifications: '/api/verifications',
    users: '/api/users',
    tokens: '/api/tokens'
};

// Role constants
const constants = {
    roles: {
        ADMIN_ROLE: '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775',
        LANDOWNER_ROLE: '0xf7349b1c3bccd912e0705395f31ffe0c6540328bca90a43fb582e92a6c4fba65',
        EXPERT_ROLE: '0xc30672a9c8070b0e2d80ad0ec34ad08dc4bb3ab082b8e26f95864700e4684fb9',
        GOVERNMENT_ROLE: '0xd9d062b29c8756d894f301c5167d214c34d627724cd7fc859ab9329c9330cf51',
        BUYER_ROLE: '0xf8cd32ed93fc2f9fc78152a14807c9609af3d99c5fe4dc6b106a801aaddfe90e',
        GUEST_ROLE: '0xb6a185f76b0ff8a0f9708ffce8e6b63ce2df58f28ad66179fb4e230e98d0a52f'
    },
    // Request status constants
    requestStatus: {
        PENDING: 0,
        APPROVED: 1,
        REJECTED: 2,
        REVISED: 3,
        PAID: 4
    },
    // Territory status constants
    territoryStatus: {
        DRAFT: 0,
        PENDING: 1,
        EXPERT_VERIFIED: 2,
        GOVERNMENT_VERIFIED: 3,
        REJECTED: 4
    },
    // Territory types
    territoryTypes: [
        'Forest',
        'Grassland',
        'Wetland',
        'Agricultural Land',
        'Urban Green Space',
        'Marine Area',
        'Mountain Ecosystem'
    ]
};

// Export configuration to make it available in other scripts
window.appConfig = {
    networkConfig,
    contractAddresses,
    apiEndpoints,
    constants
};
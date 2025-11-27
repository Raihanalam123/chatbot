// API Keys
const CUSTOM_SEARCH_API_KEY = 'AIzaSyB1KtYZU3xnzBGpJ66ov_Amw_gGTWqywFE';
const SEARCH_ENGINE_ID = 'c7bf069ebc228481e';

// Initial product suggestions
const INITIAL_SUGGESTIONS = [
    { 
        category: "Electronics", 
        items: [
            "iPhone 15",
            "Samsung S24",
            "AirPods Pro",
            "MacBook Air",
            "iPad Pro"
        ] 
    },
    { 
        category: "Gaming", 
        items: [
            "PS5",
            "Xbox Series X",
            "Nintendo Switch",
            "Gaming Laptop",
            "Gaming Mouse"
        ] 
    },
    { 
        category: "Smart Home", 
        items: [
            "Echo Dot",
            "Google Nest",
            "Ring Doorbell",
            "Smart TV",
            "Robot Vacuum"
        ] 
    }
];

// Popular retailers and their search patterns
const RETAILERS = {
    amazon: {
        domains: ['amazon.com', 'amazon.in'],
        patterns: ['price', 'deal', 'buy now']
    },
    walmart: {
        domains: ['walmart.com'],
        patterns: ['price', 'sale', 'special buy']
    },
    bestbuy: {
        domains: ['bestbuy.com'],
        patterns: ['price', 'deal', 'on sale']
    },
    target: {
        domains: ['target.com'],
        patterns: ['price', 'sale', 'deal']
    }
};

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Function to check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('currentUser') !== null;
}

// Function to show authentication required popup
function showAuthRequiredPopup() {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-lock"></i>
            <span>Please login or register to access this feature</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add authentication check to product suggestion click handler
document.addEventListener('click', function(e) {
    if (e.target.closest('.suggestion-btn') || e.target.closest('.get-deal-btn')) {
        if (!isAuthenticated()) {
            e.preventDefault();
            e.stopPropagation();
            showAuthRequiredPopup();
            return;
        }
    }
});

// Add authentication check to search input
document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (!isAuthenticated()) {
        e.preventDefault();
        showAuthRequiredPopup();
        return;
    }
});

// Add authentication check to search button
document.getElementById('send-button').addEventListener('click', function(e) {
    if (!isAuthenticated()) {
        e.preventDefault();
        showAuthRequiredPopup();
        return;
    }
});

// Add authentication check to product clicks in the grid
document.querySelector('.products-grid').addEventListener('click', function(e) {
    if (e.target.closest('.product-card')) {
        if (!isAuthenticated()) {
            e.preventDefault();
            e.stopPropagation();
            showAuthRequiredPopup();
            return;
        }
    }
});



// Function to get current date in a readable format
function getCurrentDate() {
    return new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Function to convert USD to INR
async function convertToINR(usdPrice) {
    try {
        // Using a fixed conversion rate as fallback (1 USD = 83 INR approximately)
        const conversionRate = 83;
        return usdPrice * conversionRate;
    } catch (error) {
        console.error('Currency conversion error:', error);
        // Return the fallback conversion if API fails
        return usdPrice * 83;
    }
}

// Format price in INR
function formatINR(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(price);
}

// Function to get real-time prices and product info
async function searchProductPrices(query) {
    try {
        const formattedQuery = query.trim();
        if (!formattedQuery) {
            throw new Error('Please enter a product name');
        }

        // Create multiple search queries for better results
        const searchQueries = [
            `${formattedQuery} price`,
            `${formattedQuery} best price`,
            `${formattedQuery} for sale`
        ];

        const prices = {
            retailers: {},
            lowestPrice: null
        };

        // Try each search query
        for (const searchQuery of searchQueries) {
            const url = `https://customsearch.googleapis.com/customsearch/v1?key=${CUSTOM_SEARCH_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&num=10`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 429) {
                console.log('Rate limit reached, trying next query...');
                continue;
            }

            if (!response.ok) {
                console.log('Search failed, trying next query...');
                continue;
            }

            const data = await response.json();

            if (data.items) {
                for (const item of data.items) {
                    const itemText = (item.snippet + ' ' + item.title).toLowerCase();
                    const domain = new URL(item.link).hostname;
                    
                    // Check if the result is from a known retailer
                    const retailerMatch = Object.entries(RETAILERS).find(([_, info]) => 
                        info.domains.some(d => domain.includes(d))
                    );

                    if (retailerMatch) {
                        const [retailerName, _] = retailerMatch;
                        
                        // Extract price using multiple patterns
                        const pricePatterns = [
                            /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/,  // $XX.XX or $X,XXX.XX
                            /USD\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/i,  // USD XX.XX
                            /\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*dollars/i,  // XX.XX dollars
                            /price:\s*\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/i  // price: $XX.XX
                        ];

                        let price = null;
                        for (const pattern of pricePatterns) {
                            const match = itemText.match(pattern);
                            if (match) {
                                const extractedPrice = parseFloat(match[0].replace(/[^\d.]/g, ''));
                                if (extractedPrice > 0 && extractedPrice < 5000) {
                                    price = extractedPrice;
                                    break;
                                }
                            }
                        }

                        if (price) {
                            const inrPrice = await convertToINR(price);
                            const retailerKey = retailerName.charAt(0).toUpperCase() + retailerName.slice(1);

                            // Update price only if it's lower than existing price
                            if (!prices.retailers[retailerKey] || inrPrice < prices.retailers[retailerKey].price) {
                                prices.retailers[retailerKey] = {
                                    price: inrPrice,
                                    url: item.link,
                                    title: item.title
                                };

                                // Update lowest price
                                if (!prices.lowestPrice || inrPrice < prices.lowestPrice.price) {
                                    prices.lowestPrice = {
                                        retailer: retailerKey,
                                        price: inrPrice,
                                        url: item.link,
                                        title: item.title
                                    };
                                }
                            }
                        }
                    }
                }
            }
        }

        if (Object.keys(prices.retailers).length === 0) {
            throw new Error(`No prices found for "${query}". Please try a different search term or check the product name.`);
        }

        return prices;
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
}

// Format price results in a simple table
function formatPriceResults(data) {
    if (!data || !data.retailers || Object.keys(data.retailers).length === 0) {
        return '<p>No prices found for this product. Please try a different search.</p>';
    }

    let html = '<div class="price-comparison">';
    html += '<table class="price-table">';
    html += '<tr><th>Store</th><th>Product</th><th>Price</th><th>Link</th></tr>';
    
    Object.entries(data.retailers).forEach(([retailer, info]) => {
        const isLowest = data.lowestPrice && data.lowestPrice.retailer === retailer;
        const truncatedTitle = info.title.length > 50 ? info.title.substring(0, 50) + '...' : info.title;
        
        html += `
            <tr ${isLowest ? 'class="best-price"' : ''}>
                <td>${retailer}</td>
                <td title="${info.title}">${truncatedTitle}</td>
                <td>${formatINR(info.price)}</td>
                <td><a href="${info.url}" target="_blank" rel="noopener noreferrer">View Deal</a></td>
            </tr>
        `;
    });
    
    html += '</table>';

    if (data.lowestPrice) {
        html += `
            <div class="best-deal">
                <p>💰 Best Deal: ${formatINR(data.lowestPrice.price)} at ${data.lowestPrice.retailer}</p>
                <small>Product: ${data.lowestPrice.title}</small>
            </div>
        `;
    }

    return html;
}

// Add loading animation
function addLoadingAnimation() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot loading';
    loadingDiv.innerHTML = `
        <div class="loading-text">
            <p>Searching for prices...</p>
            <span></span><span></span><span></span>
        </div>
    `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return loadingDiv;
}

// Remove loading animation
function removeLoadingAnimation(loadingDiv) {
    loadingDiv.remove();
}

// Add message to chat
function addMessage(message, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    messageDiv.innerHTML = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle user input
async function handleUserInput() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    userInput.value = '';

    const loadingDiv = addLoadingAnimation();

    try {
        const priceData = await searchProductPrices(message);
        removeLoadingAnimation(loadingDiv);
        addMessage(formatPriceResults(priceData), false);
    } catch (error) {
        removeLoadingAnimation(loadingDiv);
        addMessage(`Error: ${error.message}`, false);
    }
}

// Event listeners
sendButton.addEventListener('click', handleUserInput);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleUserInput();
    }
});

// Function to format initial suggestions
function formatInitialSuggestions() {
    let html = '<div class="initial-suggestions">';
    html += '<h3>Popular Searches</h3>';
    html += '<div class="suggestion-categories">';
    
    INITIAL_SUGGESTIONS.forEach(category => {
        html += `
            <div class="category-section">
                <h4>${category.category}</h4>
                <div class="suggestion-buttons">
                    ${category.items.map(item => 
                        `<button class="suggestion-btn" onclick="handleSuggestionClick('${item}')">${item}</button>`
                    ).join('')}
                </div>
            </div>
        `;
    });
    
    html += '</div></div>';
    return html;
}

// Function to handle suggestion button clicks
function handleSuggestionClick(product) {
    userInput.value = product;
    handleUserInput();
}

// Clear any existing messages and initialize chat
function initializeChat() {
    // Clear any existing messages
    chatMessages.innerHTML = '';
    
    // Add welcome message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.innerHTML = `
        <p>Hello! I'm your Bargain Finder AI assistant. I can help you find the best prices for products across various e-commerce platforms.</p>
        ${formatInitialSuggestions()}
    `;
    chatMessages.appendChild(messageDiv);
}

// Initialize chat when the page loads
window.addEventListener('DOMContentLoaded', initializeChat);

// Category Products Data
const CATEGORY_PRODUCTS = {
    electronics: [
        { name: "iPhone 15 Pro", image: "https://m.media-amazon.com/images/I/81+GIkwqLIL._SL1500_.jpg" },
        { name: "Samsung Galaxy S24", image: "data:image/jpeg;base64,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" },
        { name: "Google Pixel 8", image: "data:image/jpeg;base64,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" }
    ],
    gaming: [
        { name: "PS5 Digital Edition", image: "data:image/jpeg;base64,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" },
        { name: "Xbox Series X", image: "https://m.media-amazon.com/images/I/61-jjE67uqL._SL1500_.jpg" },
        { name: "Nintendo Switch OLED", image: "https://m.media-amazon.com/images/I/61dYrzvBLbL._SL1500_.jpg" }
    ],
    "smart-home": [
        { name: "Amazon Echo Show 10", image: "https://m.media-amazon.com/images/I/61u0y9ADElL._SL1000_.jpg" },
        { name: "Google Nest Hub", image: "data:image/jpeg;base64,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" },
        { name: "Ring Video Doorbell", image: "data:image/jpeg;base64,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" }
    ],
    audio: [
        { name: "AirPods Pro 2", image: "https://m.media-amazon.com/images/I/61SUj2aKoEL._SL1500_.jpg" },
        { name: "Sony WH-1000XM5", image: "https://m.media-amazon.com/images/I/61+btxzpfDL._SL1500_.jpg" },
        { name: "Bose QuietComfort", image: "data:image/jpeg;base64,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" }
    ],
    laptops: [
        { name: "MacBook Air M2", image: "https://m.media-amazon.com/images/I/71f5Eu5lJSL._SL1500_.jpg" },
        { name: "Dell XPS 13", image: "https://m.media-amazon.com/images/I/71RD3vsjIYL._SL1500_.jpg" },
        { name: "HP Pavilion Gaming", image: "data:image/jpeg;base64,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" }
    ],
    tablets: [
        { name: "iPad Air 5th gen", image: "https://m.media-amazon.com/images/I/61XZQXFQeVL._SL1500_.jpg" },
        { name: "Samsung Galaxy Tab S9", image: "data:image/jpeg;base64,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" },
        { name: "Microsoft Surface Pro 9", image: "https://m.media-amazon.com/images/I/51qmNla8aTL._SL1500_.jpg" }
    ]
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize chat interface
    initializeChat();

    // Add event listeners for category items
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            const category = item.dataset.category;
            loadCategoryProducts(category);
            
            // Update active state
            categoryItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Load initial category (Electronics)
    loadCategoryProducts('electronics');
});

// Function to load products for a category with image error handling
function loadCategoryProducts(category) {
    const productsGrid = document.getElementById('products-grid');
    const products = CATEGORY_PRODUCTS[category];
    
    if (!products) return;

    productsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" 
                alt="${product.name}" 
                class="product-image"
                onerror="this.onerror=null; this.src='https://placehold.co/400x400/png?text=${encodeURIComponent(product.name)}'"
            >
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <button class="get-deal-btn" onclick="searchProduct('${product.name}')">
                    Get Best Deals
                </button>
            </div>
        </div>
    `).join('');
}

// Function to search for a product
function searchProduct(productName) {
    const userInput = document.getElementById('user-input');
    userInput.value = productName;
    
    // Trigger the search
    const event = new Event('input', { bubbles: true });
    userInput.dispatchEvent(event);
    
    // Focus on the input
    userInput.focus();
    
    // Scroll to chat container
    document.querySelector('.chat-container').scrollIntoView({ behavior: 'smooth' });
} 
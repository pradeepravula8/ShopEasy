// Global variables
let cart = [];
let wishlist = [];
let products = [];
let currentPage = 1;
const productsPerPage = 20;

// Fetch products from API with loading state
async function fetchProducts() {
    try {
        showLoading(true);
        const response = await fetch('https://dummyjson.com/products?limit=100');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        products = data.products.map(product => ({
            id: product.id,
            title: product.title,
            price: convertToINR(product.price),
            image: product.thumbnail,
            category: product.category,
            description: product.description,
            rating: product.rating,
            stock: product.stock,
            discount: product.discountPercentage
        }));
        initializeProductSections();
        createPagination();
    } catch (error) {
        console.error('Error fetching products:', error);
        showNotification('Failed to load products. Please try again later.', 'error');
    } finally {
        showLoading(false);
    }
}

// Convert USD to INR (approximate conversion)
function convertToINR(usdPrice) {
    const conversionRate = 75; // Approximate USD to INR conversion rate
    return Math.round(usdPrice * conversionRate);
}

// Show/hide loading state
function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (!loadingElement) {
        const loader = document.createElement('div');
        loader.id = 'loading';
        loader.className = 'loading-spinner';
        loader.innerHTML = '<div class="spinner"></div><p>Loading products...</p>';
        document.body.appendChild(loader);
    }
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

// Display products by category with pagination and filtering
function displayProductsByCategory(categoryId, products) {
    const container = document.getElementById(categoryId);
    if (!container) return;

    container.innerHTML = '';
    const filteredProducts = products.filter(product => {
        if (categoryId === 'productGrid') return true;
        if (categoryId === 'electronicsGrid') {
            return ['smartphones', 'laptops', 'lighting'].includes(product.category);
        }
        if (categoryId === 'fashionGrid') {
            return ['mens-watches', 'womens-watches', 'mens-shirts', 'womens-dresses', 'womens-shoes', 'mens-shoes'].includes(product.category);
        }
        if (categoryId === 'homeGrid') {
            return ['home-decoration', 'furniture', 'groceries'].includes(product.category);
        }
        return false;
    });

    if (filteredProducts.length === 0) {
        container.innerHTML = '<div class="no-products">No products found in this category</div>';
        return;
    }

    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    paginatedProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        const inCart = cart.some(item => item.id === product.id);
        const inWishlist = wishlist.some(item => item.id === product.id);
        
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.title}" class="product-image" 
                    onerror="this.src='placeholder.jpg'">
                ${product.stock < 10 ? `<div class="stock-warning">Only ${product.stock} left!</div>` : ''}
            </div>
            <h3 class="product-title">${product.title}</h3>
            <div class="product-details">
                <p class="product-price">₹${product.price.toLocaleString('en-IN')}</p>
                ${product.discount ? `<div class="discount">${Math.round(product.discount)}% off</div>` : ''}
                <div class="rating">
                    ${'★'.repeat(Math.round(product.rating))}${'☆'.repeat(5 - Math.round(product.rating))}
                    <span class="rating-value">${product.rating}</span>
                </div>
            </div>
            <p class="product-description">${product.description.slice(0, 100)}${product.description.length > 100 ? '...' : ''}</p>
            <div class="product-actions">
                <button onclick="addToCart(${product.id})" class="add-to-cart ${inCart ? 'in-cart' : ''}">
                    ${inCart ? 'In Cart' : 'Add to Cart'}
                </button>
                <button onclick="addToWishlist(${product.id})" class="add-to-wishlist ${inWishlist ? 'in-wishlist' : ''}">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        `;
        container.appendChild(productCard);
    });
}

// Create pagination controls
function createPagination() {
    const sections = ['productGrid', 'electronicsGrid', 'fashionGrid', 'homeGrid'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const totalPages = Math.ceil(products.length / productsPerPage);
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination';
        paginationContainer.setAttribute('data-section', sectionId);
        
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevButton.disabled = currentPage === 1;
        prevButton.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                updatePagination(sectionId);
            }
        };
        paginationContainer.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.className = currentPage === i ? 'active' : '';
            pageButton.onclick = () => {
                currentPage = i;
                updatePagination(sectionId);
            };
            paginationContainer.appendChild(pageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextButton.disabled = currentPage === totalPages;
        nextButton.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                updatePagination(sectionId);
            }
        };
        paginationContainer.appendChild(nextButton);

        // Remove existing pagination if any
        const existingPagination = section.parentElement.querySelector('.pagination');
        if (existingPagination) {
            existingPagination.remove();
        }
        section.parentElement.appendChild(paginationContainer);
    });
}

// Update pagination and product display
function updatePagination(sectionId) {
    displayProductsByCategory(sectionId, products);
    const pagination = document.querySelector(`.pagination[data-section="${sectionId}"]`);
    if (!pagination) return;

    const buttons = pagination.querySelectorAll('button');
    const totalPages = Math.ceil(products.length / productsPerPage);

    buttons.forEach((button, index) => {
        if (index === 0) {
            button.disabled = currentPage === 1;
        } else if (index === buttons.length - 1) {
            button.disabled = currentPage === totalPages;
        } else {
            button.className = currentPage === index ? 'active' : '';
        }
    });
}

// Initialize product sections
function initializeProductSections() {
    displayProductsByCategory('productGrid', products);
    displayProductsByCategory('electronicsGrid', products);
    displayProductsByCategory('fashionGrid', products);
    displayProductsByCategory('homeGrid', products);
    updateCartCount();
    updateWishlistCount();
}

// Add to cart function
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        cart.push(product);
        updateCartCount();
        showNotification(`${product.title} added to cart!`, 'success');
    }
}

// Add to wishlist function
function addToWishlist(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        wishlist.push(product);
        updateWishlistCount();
        showNotification(`${product.title} added to wishlist!`, 'success');
    }
}

// Update cart count
function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
}

// Update wishlist count
function updateWishlistCount() {
    const wishlistCount = document.getElementById('wishlist-count');
    if (wishlistCount) {
        wishlistCount.textContent = wishlist.length;
    }
}

// Search products
function searchProducts() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput.value.toLowerCase();
    
    const searchResults = products.filter(product => 
        product.title.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );

    const searchResultsContainer = document.getElementById('search-results');
    if (searchResultsContainer) {
        searchResultsContainer.innerHTML = '';
        if (searchResults.length > 0) {
            searchResults.forEach(product => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    <img src="${product.image}" alt="${product.title}">
                    <div class="search-result-info">
                        <h3>${product.title}</h3>
                        <div class="price">₹${product.price.toLocaleString('en-IN')}</div>
                    </div>
                `;
                resultItem.onclick = () => addToCart(product.id);
                searchResultsContainer.appendChild(resultItem);
            });
        } else {
            searchResultsContainer.innerHTML = '<p>No products found</p>';
        }
    }
}

// Show notification
function showNotification(message, type = 'error') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', searchProducts);
    }

    // Add category click handlers
    const categoryLinks = document.querySelectorAll('.category-item');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.getAttribute('data-category');
            filterProductsByCategory(category);
        });
    });
});

// Filter products by category
function filterProductsByCategory(category) {
    // Hide all product sections
    document.querySelectorAll('.deals-section').forEach(section => {
        section.style.display = 'none';
    });

    // Show the selected category section
    let targetSection;
    switch(category) {
        case 'all':
            targetSection = document.getElementById('productGrid');
            document.querySelector('.deals-section:nth-child(1)').style.display = 'block';
            break;
        case 'electronics':
            targetSection = document.getElementById('electronicsGrid');
            document.querySelector('.deals-section:nth-child(2)').style.display = 'block';
            break;
        case 'fashion':
            targetSection = document.getElementById('fashionGrid');
            document.querySelector('.deals-section:nth-child(3)').style.display = 'block';
            break;
        case 'home':
            targetSection = document.getElementById('homeGrid');
            document.querySelector('.deals-section:nth-child(4)').style.display = 'block';
            break;
        case 'beauty':
            // For beauty category, we'll show all products and filter them
            targetSection = document.getElementById('productGrid');
            document.querySelector('.deals-section:nth-child(1)').style.display = 'block';
            break;
    }

    // Reset to first page
    currentPage = 1;

    // Update the display
    if (category === 'beauty') {
        const beautyProducts = products.filter(product => 
            product.category.toLowerCase().includes('beauty') || 
            product.category.toLowerCase().includes('skincare') ||
            product.category.toLowerCase().includes('fragrances')
        );
        displayProductsByCategory('productGrid', beautyProducts);
    } else {
        displayProductsByCategory(targetSection.id, products);
    }

    // Scroll to the section
    targetSection.scrollIntoView({ behavior: 'smooth' });
} 

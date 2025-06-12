// Global variables
let cart = [];
let wishlist = [];
let products = [];
let currentPage = 1;
const productsPerPage = 20;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing script.js');
    // Profile related logic
    var user = localStorage.getItem('user');
    var shortName = 'Guest';
    var debugMsg = '';

    if (user) {
        try {
            var userObj = JSON.parse(user);

            // Determine the name to be displayed in the profile fields
            let displayName = '';
            if (userObj.username && !userObj.username.includes('@')) {
                displayName = userObj.username;
            } else if (userObj.fullName && !userObj.fullName.includes('@')) {
                displayName = userObj.fullName;
            } else if (userObj.email) {
                // If only email is available, use the part before @ for display name as a fallback
                displayName = userObj.email.split('@')[0];
            }

            const firstNameInput = document.getElementById('first-name');
            const lastNameInput = document.getElementById('last-name');
            const emailAddressInput = document.getElementById('email-address');
            const mobileNumberInput = document.getElementById('mobile-number');

            if (firstNameInput) firstNameInput.value = displayName.split(' ')[0] || '';
            if (lastNameInput) lastNameInput.value = displayName.split(' ')[1] || '';
            if (emailAddressInput && userObj.email) emailAddressInput.value = userObj.email;
            if (mobileNumberInput && userObj.phone) mobileNumberInput.value = userObj.phone;

            // Determine the short name for the greeting
            if (userObj.username) {
                if (userObj.username.includes('@')) {
                    shortName = userObj.username.split('@')[0];
                } else {
                    shortName = userObj.username.split(' ')[0];
                }
            } else if (userObj.email) {
                shortName = userObj.email.split('@')[0];
            }
            shortName = shortName.trim();
            if (shortName.length === 0) {
                shortName = 'Guest';
            }

            document.getElementById('profile-avatar').src = 'images/avatar.png';

        } catch (e) {
            shortName = 'Error';
            debugMsg = 'Error parsing user: ' + e;
            const inputs = ['first-name', 'last-name', 'email-address', 'mobile-number'];
            inputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) input.value = 'Error';
            });
        }
    } else {
        debugMsg = 'No user in localStorage.';
    }
    
    const profileShortname = document.getElementById('profile-shortname');
    const debugShortname = document.getElementById('debug-shortname');

    if (profileShortname) profileShortname.textContent = shortName;
    if (debugShortname) debugShortname.textContent = debugMsg;

    console.log('User for shortcut:', user, 'Shortname:', shortName, 'Debug:', debugMsg);

    // Profile sidebar navigation logic
    const profileNavLinks = document.querySelectorAll('.sidebar nav a');
    console.log('Found profile navigation links:', profileNavLinks);
    const profileSections = document.querySelectorAll('.profile-content section');
    console.log('Found profile content sections:', profileSections);

    function showProfileSection(targetId) {
        console.log('Attempting to show section:', targetId);
        profileSections.forEach(section => {
            section.style.display = 'none';
        });
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.style.display = 'block';
            console.log('Successfully set display to block for:', targetId);
        } else {
            console.error('Target section not found:', targetId);
        }
    }

    profileNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Sidebar link clicked:', this.getAttribute('data-target'));
            profileNavLinks.forEach(navLink => navLink.classList.remove('active'));
            this.classList.add('active');
            const targetId = this.getAttribute('data-target');
            if (targetId) {
                showProfileSection(targetId);
            }
        });
    });

    // Ensure the initial active section is displayed on load
    const initialActiveLink = document.querySelector('.sidebar nav a.active');
    if (initialActiveLink) {
        const initialTargetId = initialActiveLink.getAttribute('data-target');
        console.log('Initial active link target:', initialTargetId);
        if (initialTargetId) {
            showProfileSection(initialTargetId);
        }
    }

    // Product related logic
    fetchProducts();
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', searchProducts);
    }

    const categoryLinks = document.querySelectorAll('.category-item');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.getAttribute('data-category');
            filterProductsByCategory(category);
        });
    });

    // Address form logic
    const addNewAddressBtn = document.getElementById('add-new-address-btn');
    const newAddressForm = document.getElementById('new-address-form');
    const cancelAddressBtn = document.getElementById('cancel-address-btn');
    const addressListDiv = document.querySelector('.address-list');

    // Load addresses on page load
    displayAddresses();

    if (addNewAddressBtn && newAddressForm) {
        addNewAddressBtn.addEventListener('click', function() {
            newAddressForm.style.display = 'block';
            addNewAddressBtn.style.display = 'none'; // Hide the add button when form is visible
        });
    }

    if (cancelAddressBtn && newAddressForm && addNewAddressBtn) {
        cancelAddressBtn.addEventListener('click', function() {
            newAddressForm.style.display = 'none';
            addNewAddressBtn.style.display = 'block'; // Show the add button when form is hidden
            clearAddressForm();
        });
    }

    console.log('Attempting to find Save Address Button...');
    const saveAddressBtn = document.querySelector('.save-address-btn');
    console.log('Save Address Button Element found:', saveAddressBtn);
    if (saveAddressBtn) {
        console.log('Attaching click listener to Save Address Button.');
        saveAddressBtn.addEventListener('click', saveAddress);
    } else {
        console.error('Error: Save Address Button element with class \'save-address-btn\' not found.');
    }

});

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
    displayProductsByCategory('productGrid', searchResults);
    displayProductsByCategory('electronicsGrid', searchResults);
    displayProductsByCategory('fashionGrid', searchResults);
    displayProductsByCategory('homeGrid', searchResults);
}

// Show notification
function showNotification(message, type = 'error') {
    const notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        notification.addEventListener('transitionend', () => notification.remove(), { once: true });
    }, 3000);
}

// Filter products by category
function filterProductsByCategory(category) {
    const allProductContainers = document.querySelectorAll('.products-container');
    allProductContainers.forEach(container => {
        if (container.id !== 'productGrid') {
            container.style.display = 'none';
        }
    });
    if (category === 'all') {
        document.getElementById('productGrid').style.display = 'grid';
        document.getElementById('electronicsGrid').style.display = 'grid';
        document.getElementById('fashionGrid').style.display = 'grid';
        document.getElementById('homeGrid').style.display = 'grid';
    } else {
        if (category === 'electronics') {
            document.getElementById('electronicsGrid').style.display = 'grid';
        } else if (category === 'fashion') {
            document.getElementById('fashionGrid').style.display = 'grid';
        } else if (category === 'home') {
            document.getElementById('homeGrid').style.display = 'grid';
        }
    }
}

// Function to clear address form fields
function clearAddressForm() {
    document.getElementById('fullName').value = '';
    document.getElementById('mobileNumber').value = '';
    document.getElementById('pinCode').value = '';
    document.getElementById('address').value = '';
    document.getElementById('locality').value = '';
    document.getElementById('city').value = '';
    document.getElementById('state').value = '';
    const radioButtons = document.getElementsByName('addressType');
    radioButtons.forEach(radio => radio.checked = false);
}

// Function to save a new address
function saveAddress() {
    const fullName = document.getElementById('fullName').value;
    const mobileNumber = document.getElementById('mobileNumber').value;
    const pinCode = document.getElementById('pinCode').value;
    const address = document.getElementById('address').value;
    const locality = document.getElementById('locality').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const addressType = document.querySelector('input[name="addressType"]:checked');

    console.log("Attempting to save address...");
    console.log("Full Name:", fullName);
    console.log("Mobile Number:", mobileNumber);
    console.log("Pincode:", pinCode);
    console.log("Address:", address);
    console.log("Locality:", locality);
    console.log("City:", city);
    console.log("State:", state);
    console.log("Address Type:", addressType ? addressType.value : 'None selected');

    if (!fullName || !mobileNumber || !pinCode || !address || !locality || !city || !state || !addressType) {
        showNotification('Please fill in all address fields and select an address type.', 'error');
        console.error("Validation failed: One or more fields are empty.");
        return;
    }

    const newAddress = {
        fullName,
        mobileNumber,
        pinCode,
        address,
        locality,
        city,
        state,
        type: addressType.value
    };

    let savedAddresses = JSON.parse(localStorage.getItem('addresses')) || [];
    console.log("Current saved addresses before adding:", savedAddresses);
    savedAddresses.push(newAddress);
    localStorage.setItem('addresses', JSON.stringify(savedAddresses));
    console.log("Saved addresses after adding:", JSON.parse(localStorage.getItem('addresses')));

    showNotification('Address saved successfully!', 'success');
    clearAddressForm();
    document.getElementById('new-address-form').style.display = 'none';
    document.getElementById('add-new-address-btn').style.display = 'block';
    displayAddresses(); // Refresh the list of addresses
}

// Function to display saved addresses
function displayAddresses() {
    const addressListDiv = document.querySelector('.address-list');
    let savedAddresses = JSON.parse(localStorage.getItem('addresses')) || [];

    if (addressListDiv) {
        addressListDiv.innerHTML = ''; // Clear current list
        if (savedAddresses.length === 0) {
            addressListDiv.innerHTML = '<p>No addresses saved. Add a new address to get started!</p>';
        } else {
            savedAddresses.forEach((addr, index) => {
                const addressCard = document.createElement('div');
                addressCard.className = 'address-card';
                addressCard.innerHTML = `
                    <h3>${addr.fullName} (${addr.type})</h3>
                    <p>${addr.address}, ${addr.locality}</p>
                    <p>${addr.city}, ${addr.state} - ${addr.pinCode}</p>
                    <p>Mobile: ${addr.mobileNumber}</p>
                    <div class="address-actions">
                        <button class="edit-address-btn" data-index="${index}">Edit</button>
                        <button class="delete-address-btn" data-index="${index}">Delete</button>
                    </div>
                `;
                addressListDiv.appendChild(addressCard);
            });
        }
    }
} 

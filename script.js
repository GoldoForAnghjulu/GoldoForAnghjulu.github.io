document.addEventListener('DOMContentLoaded', () => {
    const productNameEl = document.getElementById('product-name');
    const productMoteurEl = document.getElementById('product-moteur');
    const productLevageEl = document.getElementById('product-levage');
    const productImageEl = document.getElementById('product-image');
    const productListContainer = document.getElementById('product-list');
    const searchBar = document.getElementById('search-bar');
    const productView = document.getElementById('product-view');
    const productViewContainer = document.getElementById('product-view-container');
    const sidebar = document.querySelector('.sidebar');

    let products = [];
    let currentIndex = -1;

    async function fetchAndParseProducts() {
        try {
            const response = await fetch('/message.txt');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            
            return text.trim().split('\n').filter(line => line).map(line => {
                const parts = line.split('–').map(p => p.trim());
                const name = parts[0];
                let moteur = 'Information non disponible';
                let levage = 'Information non disponible';

                if (parts.length > 1) {
                    if (parts[1].includes('non trouvé')) {
                        moteur = parts[1];
                        levage = '';
                    } else {
                        moteur = parts[1] || moteur;
                        levage = parts[2] || levage;
                    }
                }
                
                const imageName = name.toLowerCase().replace(/[\s–]+/g, '-');
                const imageUrl = `./images/${imageName}.png`;
                
                return { name, moteur, levage, imageUrl };
            });
        } catch (error) {
            console.error("Failed to fetch or parse products:", error);
            productNameEl.textContent = "Erreur";
            productMoteurEl.textContent = "Impossible de charger les données des produits.";
            return [];
        }
    }

    function renderProductList(filteredProducts) {
        productListContainer.innerHTML = '';
        filteredProducts.forEach(product => {
            const originalIndex = products.findIndex(p => p.name === product.name);
            const button = document.createElement('button');
            button.className = 'list-item';
            button.textContent = product.name;
            button.dataset.index = originalIndex;
            if (originalIndex === currentIndex) {
                button.classList.add('selected');
            }
            button.addEventListener('click', () => updateProductView(originalIndex));
            productListContainer.appendChild(button);
        });
    }

    function handleSearch() {
        const query = searchBar.value.toLowerCase();
        const filteredProducts = products.filter(product => product.name.toLowerCase().includes(query));
        renderProductList(filteredProducts);
    }

    function updateProductView(index) {
        if (index === currentIndex || index < 0 || index >= products.length) return;

        const oldIndex = currentIndex;
        currentIndex = index;

        const product = products[currentIndex];

        const selectedButton = productListContainer.querySelector(`.list-item[data-index='${currentIndex}']`);
        
        const timeline = gsap.timeline();
        
        // Hide old content
        if (oldIndex !== -1) {
             timeline.to(productView, {
                autoAlpha: 0,
                scale: 0.95,
                duration: 0.3,
                ease: 'power2.in'
            });
        }
       
        // Update content and position
        timeline.call(() => {
            productNameEl.textContent = product.name;
            productMoteurEl.textContent = product.moteur;
            productLevageEl.textContent = product.levage;
            productImageEl.src = product.imageUrl;
            productImageEl.onerror = () => { productImageEl.src = '/images/placeholder.png'; };

            if (selectedButton) {
                 if (window.innerWidth > 900) {
                    const containerRect = productViewContainer.getBoundingClientRect();
                    const buttonRect = selectedButton.getBoundingClientRect();
                    const desiredTop = (buttonRect.top - containerRect.top) + (buttonRect.height / 2);
                    
                    productView.style.top = `${desiredTop}px`;
                } else {
                    productView.style.top = '0px'; // Reset for mobile
                }
            }

            // Update selector states
            const selectors = document.querySelectorAll('.list-item');
            selectors.forEach(sel => {
                sel.classList.remove('selected');
            });
             if(selectedButton) {
                selectedButton.classList.add('selected');
                selectedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
        
        // Show new content
        timeline.to(productView, {
                autoAlpha: 1,
                scale: 1,
                duration: 0.5,
                ease: 'power2.out'
        });
    }

    function handleKeyDown(e) {
        if (document.activeElement === searchBar) return;

        let newIndex = currentIndex;
        
        const currentListItems = Array.from(productListContainer.querySelectorAll('.list-item'));
        const visibleIndices = currentListItems.map(item => parseInt(item.dataset.index));
        if (visibleIndices.length === 0) return;
        
        const currentInListIndex = visibleIndices.indexOf(currentIndex);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            let nextInListIndex = currentInListIndex + 1;
            if (currentInListIndex === -1 || nextInListIndex >= visibleIndices.length) {
                 nextInListIndex = 0; // wrap to top
            }
            newIndex = visibleIndices[nextInListIndex];
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            let prevInListIndex = currentInListIndex - 1;
            if (currentInListIndex === -1 || prevInListIndex < 0) {
                prevInListIndex = visibleIndices.length - 1; // wrap to bottom
            }
            newIndex = visibleIndices[prevInListIndex];
        } else {
            return;
        }
        
        if (newIndex !== currentIndex) {
            updateProductView(newIndex);
        }
    }

    async function init() {
        gsap.set(productView, { autoAlpha: 0, scale: 0.95 });
        products = await fetchAndParseProducts();
        if (products.length > 0) {
            renderProductList(products);
            searchBar.addEventListener('input', handleSearch);
            document.addEventListener('keydown', handleKeyDown);
            updateProductView(0);
        }
    }

    init();
});
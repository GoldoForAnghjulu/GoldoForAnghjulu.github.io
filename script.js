document.addEventListener('DOMContentLoaded', () => {
    const productNameEl = document.getElementById('product-name');
    const productMoteurEl = document.getElementById('product-moteur');
    const productLevageEl = document.getElementById('product-levage');
    const productImageEl = document.getElementById('product-image');
    const productListContainer = document.getElementById('product-list');
    const searchBar = document.getElementById('search-bar');

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
                
                const imageName = `${name.toLowerCase().replace(/[\s–]+/g, '-')}.png`;
                const imageUrl = `/images/${imageName}`;
                
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

    function updateProductView(index, direction = 0) {
        if (index === currentIndex || index < 0 || index >= products.length) return;

        const oldIndex = currentIndex;
        currentIndex = index;

        const product = products[currentIndex];
        
        const timeline = gsap.timeline();
        const imageX = direction === 1 ? -100 : (direction === -1 ? 100 : 0);
        const textY = direction === 1 ? -30 : (direction === -1 ? 30 : 0);

        timeline
            .to([productNameEl, productMoteurEl, productLevageEl], {
                autoAlpha: 0,
                y: -textY,
                duration: 0.3,
                ease: 'power2.in'
            })
            .to(productImageEl, {
                autoAlpha: 0,
                xPercent: imageX,
                duration: 0.3,
                ease: 'power2.in'
            }, "<");

        timeline.call(() => {
            productNameEl.textContent = product.name;
            productMoteurEl.textContent = product.moteur;
            productLevageEl.textContent = product.levage;
            productImageEl.src = product.imageUrl;
            productImageEl.onerror = () => { productImageEl.src = '/images/placeholder.png'; };

            // Update selector states
            const selectors = document.querySelectorAll('.list-item');
            selectors.forEach(sel => {
                if (parseInt(sel.dataset.index) === oldIndex) sel.classList.remove('selected');
                if (parseInt(sel.dataset.index) === currentIndex) sel.classList.add('selected');
            });
            const selectedButton = productListContainer.querySelector(`.list-item[data-index='${currentIndex}']`);
            if (selectedButton) {
                selectedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });

        timeline
            .fromTo([productNameEl, productMoteurEl, productLevageEl], 
                { autoAlpha: 0, y: textY },
                { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' }
            )
            .fromTo(productImageEl, 
                { autoAlpha: 0, xPercent: -imageX },
                { autoAlpha: 1, xPercent: 0, duration: 0.5, ease: 'power2.out' },
                "<");
    }

    function handleKeyDown(e) {
        if (document.activeElement === searchBar) return;

        let newIndex = currentIndex;
        let direction = 0;
        
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
            direction = -1;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            let prevInListIndex = currentInListIndex - 1;
            if (currentInListIndex === -1 || prevInListIndex < 0) {
                prevInListIndex = visibleIndices.length - 1; // wrap to bottom
            }
            newIndex = visibleIndices[prevInListIndex];
            direction = 1;
        } else {
            return;
        }
        
        if (newIndex !== currentIndex) {
            updateProductView(newIndex, direction);
        }
    }

    async function init() {
        gsap.set([productNameEl, productMoteurEl, productLevageEl, productImageEl], { autoAlpha: 0 });
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
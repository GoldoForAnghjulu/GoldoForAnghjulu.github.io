document.addEventListener('DOMContentLoaded', () => {
    // Références aux éléments du DOM pour la vue principale (utilisée sur mobile)
    const productNameEl = document.getElementById('product-name');
    const productMoteurEl = document.getElementById('product-moteur');
    const productLevageEl = document.getElementById('product-levage');
    const productImageEl = document.getElementById('product-image');
    
    // Références aux conteneurs et à la barre de recherche
    const productListContainer = document.getElementById('product-list');
    const searchBar = document.getElementById('search-bar');
    const productView = document.getElementById('product-view');

    let products = [];
    let currentSelectedIndex = -1; // Pour suivre l'élément sélectionné

    // La fonction de fetch reste la même, elle est très bien !
    async function fetchAndParseProducts() {
        try {
            const response = await fetch('/message.txt');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            
            return text.trim().split('\n').filter(line => line).map((line, index) => {
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
                
                return { id: index, name, moteur, levage, imageUrl };
            });
        } catch (error) {
            console.error("Failed to fetch or parse products:", error);
            productView.innerHTML = `<p style="color:red;">Erreur de chargement des produits.</p>`;
            return [];
        }
    }

    // --- NOUVELLE FONCTION : Crée la liste avec les pop-ups ---
    function renderProductList(filteredProducts) {
        productListContainer.innerHTML = ''; // On vide la liste
        
        filteredProducts.forEach(product => {
            // Crée le conteneur qui aura la position relative
            const itemContainer = document.createElement('div');
            itemContainer.className = 'product-item-container';

            // Crée le bouton
            const button = document.createElement('button');
            button.className = 'list-item';
            button.textContent = product.name;
            button.dataset.index = product.id; // On utilise l'ID unique
            if (product.id === currentSelectedIndex) {
                button.classList.add('selected');
            }

            // Crée le pop-up de détails (caché par défaut)
            const popup = document.createElement('div');
            popup.className = 'popup-details';
            popup.innerHTML = `
                <img src="${product.imageUrl}" alt="Image de ${product.name}" onerror="this.src='/images/placeholder.png'">
                <div class="popup-details-info">
                    <h3>${product.name}</h3>
                    <p>${product.moteur}</p>
                    <p>${product.levage}</p>
                </div>
            `;

            // Ajoute le bouton et le pop-up au conteneur, puis à la liste
            itemContainer.appendChild(button);
            itemContainer.appendChild(popup);
            productListContainer.appendChild(itemContainer);
        });
    }
    
    // --- NOUVELLE LOGIQUE DE CLIC ---
    productListContainer.addEventListener('click', (event) => {
        const button = event.target.closest('.list-item');
        if (!button) return;

        const index = parseInt(button.dataset.index);
        
        // Si on est sur mobile, on utilise l'ancienne logique d'affichage principal
        if (window.innerWidth <= 900) {
            updateMobileView(index);
        } else {
            // Sinon, on gère les pop-ups
            togglePopup(button);
        }
    });

    function togglePopup(button) {
        const popup = button.nextElementSibling;
        const wasVisible = popup.style.visibility === 'visible';

        // 1. Cacher tous les pop-ups ouverts
        document.querySelectorAll('.popup-details').forEach(p => {
            gsap.to(p, { autoAlpha: 0, x: -20, duration: 0.2, ease: 'power2.in' });
        });

        // 2. Retirer la classe 'selected' de tous les boutons
        document.querySelectorAll('.list-item').forEach(b => b.classList.remove('selected'));
        
        // 3. Si le pop-up cliqué n'était pas déjà visible, on l'affiche
        if (!wasVisible) {
            button.classList.add('selected');
            currentSelectedIndex = parseInt(button.dataset.index);
            gsap.fromTo(popup, 
                { autoAlpha: 0, x: -20 }, 
                { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power2.out' }
            );
        } else {
             currentSelectedIndex = -1; // Désélectionner
        }
    }
    
    // Fonction pour mettre à jour la vue principale (uniquement sur mobile)
    function updateMobileView(index) {
        if (index === currentSelectedIndex || index < 0 || index >= products.length) return;
        currentSelectedIndex = index;
        
        const product = products[currentSelectedIndex];
        
        // Mettre à jour la classe 'selected'
        document.querySelectorAll('.list-item').forEach(b => b.classList.remove('selected'));
        document.querySelector(`.list-item[data-index='${index}']`).classList.add('selected');

        // Animation GSAP pour la vue mobile
        const tl = gsap.timeline();
        tl.to([productNameEl, productMoteurEl, productLevageEl, productImageEl], { autoAlpha: 0, duration: 0.2 })
          .call(() => {
              productNameEl.textContent = product.name;
              productMoteurEl.textContent = product.moteur;
              productLevageEl.textContent = product.levage;
              productImageEl.src = product.imageUrl;
              productImageEl.onerror = () => { productImageEl.src = '/images/placeholder.png'; };
          })
          .to([productNameEl, productMoteurEl, productLevageEl, productImageEl], { autoAlpha: 1, duration: 0.3, stagger: 0.05 });
    }

    // La recherche reste la même
    function handleSearch() {
        const query = searchBar.value.toLowerCase();
        const filteredProducts = products.filter(product => product.name.toLowerCase().includes(query));
        renderProductList(filteredProducts);
    }
    
    // On garde la navigation au clavier (simplifiée pour sélectionner)
    function handleKeyDown(e) {
        if (document.activeElement === searchBar || !['ArrowDown', 'ArrowUp'].includes(e.key)) return;
        e.preventDefault();

        const visibleItems = Array.from(productListContainer.querySelectorAll('.list-item'));
        if (visibleItems.length === 0) return;

        let currentIndexInList = visibleItems.findIndex(item => parseInt(item.dataset.index) === currentSelectedIndex);
        
        if (e.key === 'ArrowDown') {
            currentIndexInList = (currentIndexInList + 1) % visibleItems.length;
        } else if (e.key === 'ArrowUp') {
            currentIndexInList = (currentIndexInList - 1 + visibleItems.length) % visibleItems.length;
        }
        
        const targetButton = visibleItems[currentIndexInList];
        targetButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        if (window.innerWidth <= 900) {
            updateMobileView(parseInt(targetButton.dataset.index));
        } else {
            togglePopup(targetButton);
        }
    }
    
    // Clic en dehors pour fermer les pop-ups
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.product-item-container')) {
            document.querySelectorAll('.popup-details').forEach(p => {
                gsap.to(p, { autoAlpha: 0, x: -20, duration: 0.2, ease: 'power2.in' });
            });
            document.querySelectorAll('.list-item').forEach(b => b.classList.remove('selected'));
            currentSelectedIndex = -1;
        }
    });

    async function init() {
        products = await fetchAndParseProducts();
        if (products.length > 0) {
            renderProductList(products);
            searchBar.addEventListener('input', handleSearch);
            document.addEventListener('keydown', handleKeyDown);
            // On ne sélectionne plus de produit par défaut pour ne pas avoir un pop-up dès le début
        }
    }

    init();
});
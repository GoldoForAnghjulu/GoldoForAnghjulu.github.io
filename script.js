document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('product-table-body');
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    const modalName = document.getElementById('modal-name');
    const modalDescription = document.getElementById('modal-description');
    const modalPrice = document.getElementById('modal-price');
    const closeModalButton = document.querySelector('.close-button');

    let products = [];
    let selectedIndex = -1;

    async function fetchAndParseProducts() {
        try {
            const response = await fetch('message.txt');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            const lines = text.trim().split('\n').filter(line => line);
            
            return lines.map(line => {
                const parts = line.split('–');
                const name = parts[0].trim();
                const description = parts.slice(1).join('–').trim();
                
                // Construct the image URL to be inside an "Image" folder
                let imageName = `${name.toLowerCase().replace(/[\s–]+/g, '-')}.png`;
                let imageUrl = `Image/${imageName}`;
                
                return {
                    name,
                    description,
                    price: '€',
                    imageUrl: imageUrl
                };
            });
        } catch (error) {
            console.error("Failed to fetch or parse products:", error);
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #ff5555;">Erreur: Impossible de charger les produits. Vérifiez que le fichier message.txt existe.</td></tr>`;
            return [];
        }
    }

    function renderTable() {
        if (!products.length) return;
        tableBody.innerHTML = '';
        products.forEach((product, index) => {
            const row = document.createElement('tr');
            row.dataset.index = index;
            row.innerHTML = `
                <td><img src="${product.imageUrl}" alt="${product.name}" class="product-image" onerror="this.src='Image/placeholder.png'; this.onerror=null;"></td>
                <td class="product-name">${product.name}</td>
                <td class="product-description">${product.description}</td>
                <td class="product-price">${product.price}</td>
            `;
            tableBody.appendChild(row);
        });

        const rows = tableBody.querySelectorAll('tr');
        gsap.from(rows, {
            opacity: 0,
            y: 20,
            duration: 0.5,
            stagger: 0.07,
            ease: "power2.out",
            onComplete: () => {
                 if (rows.length > 0) {
                    updateSelection(0, false);
                }
            }
        });

        addEventListenersToRows();
    }
    
    function addEventListenersToRows() {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            row.addEventListener('mouseenter', () => {
                if(selectedIndex !== index) {
                    updateSelection(index);
                }
            });
            row.addEventListener('click', () => {
                showModal(index);
            });
        });
    }

    function updateSelection(index, scroll = false) {
        const rows = tableBody.querySelectorAll('tr');
        if (selectedIndex > -1 && rows[selectedIndex]) {
            rows[selectedIndex].classList.remove('selected');
        }
        selectedIndex = index;
        if (selectedIndex > -1 && rows[selectedIndex]) {
            rows[selectedIndex].classList.add('selected');
            if (scroll) {
                rows[selectedIndex].scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }

    function handleKeyDown(e) {
        const rows = tableBody.querySelectorAll('tr');
        let newIndex = selectedIndex;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (selectedIndex === -1) {
                newIndex = 0;
            } else {
                newIndex = selectedIndex < rows.length - 1 ? selectedIndex + 1 : 0;
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (selectedIndex === -1) {
                 newIndex = rows.length - 1;
            } else {
                newIndex = selectedIndex > 0 ? selectedIndex - 1 : rows.length - 1;
            }
        } else if (e.key === 'Enter' && selectedIndex > -1) {
            e.preventDefault();
            showModal(selectedIndex);
        } else if (e.key === 'Escape') {
            hideModal();
        }

        if (newIndex !== selectedIndex) {
            updateSelection(newIndex, true);
        }
    }
    
    function showModal(index) {
        if (index < 0 || index >= products.length) return;
        const product = products[index];
        modalImg.src = product.imageUrl;
        modalImg.onerror = () => { modalImg.src = 'Image/placeholder.png'; };
        modalName.textContent = product.name;
        modalDescription.textContent = product.description;
        modalPrice.textContent = `Prix: ${product.price}`;
        
        modal.style.display = 'flex';
        gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        gsap.fromTo('.modal-content', { scale: 0.9, y: -20 }, { scale: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    }

    function hideModal() {
        gsap.to(modal, { opacity: 0, duration: 0.3, onComplete: () => modal.style.display = 'none' });
    }

    closeModalButton.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    document.addEventListener('keydown', handleKeyDown);

    async function init() {
        products = await fetchAndParseProducts();
        renderTable();
    }

    init();
});
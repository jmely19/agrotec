// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const gridView = document.getElementById('gridView');
const listView = document.getElementById('listView');
const farmersGrid = document.getElementById('farmersGrid');
const farmerCards = document.querySelectorAll('.farmer-card');

// Perform search
function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    farmerCards.forEach(card => {
        const farmerName = card.querySelector('.farmer-name').textContent.toLowerCase();

        if (farmerName.includes(searchTerm) || searchTerm === '') {
            card.style.display = 'block';

            // Add fade in animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';

            setTimeout(() => {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        } else {
            card.style.display = 'none';
        }
    });

    // Show "no results" message if needed
    const visibleCards = Array.from(farmerCards).filter(card =>
        card.style.display !== 'none'
    );

    if (visibleCards.length === 0 && searchTerm !== '') {
        showNoResultsMessage();
    } else {
        removeNoResultsMessage();
    }
}

// Show "no results" message
function showNoResultsMessage() {
    removeNoResultsMessage();

    const noResultsDiv = document.createElement('div');
    noResultsDiv.className = 'no-results-message';
    noResultsDiv.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
            <h3>No matching farmers were found.</h3>
            <p>Try using other search terms</p>
        </div>
    `;

    farmersGrid.appendChild(noResultsDiv);
}

// Remove "no results" message
function removeNoResultsMessage() {
    const existingMessage = document.querySelector('.no-results-message');
    if (existingMessage) {
        existingMessage.remove();
    }
}

// Toggle grid view
function toggleGridView() {
    farmersGrid.classList.remove('farmers-list');
    farmersGrid.classList.add('farmers-grid');
    gridView.classList.add('active');
    listView.classList.remove('active');

    farmerCards.forEach(card => {
        card.style.display = 'block';
    });
}

// Toggle list view
function toggleListView() {
    farmersGrid.classList.remove('farmers-grid');
    farmersGrid.classList.add('farmers-list');
    listView.classList.add('active');
    gridView.classList.remove('active');

    farmerCards.forEach(card => {
        if (card.style.display !== 'none') {
            card.style.display = 'flex';
        }
    });
}

// Card interactions (click + image hover)
function addCardInteractions() {
    farmerCards.forEach(card => {
        // Ripple on click
        card.addEventListener('click', function () {
            const farmerName = this.querySelector('.farmer-name').textContent;

            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(76, 175, 80, 0.3);
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
                left: 50%;
                top: 50%;
                width: 100px;
                height: 100px;
                margin-left: -50px;
                margin-top: -50px;
            `;

            this.style.position = 'relative';
            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);

            console.log(`Agricultor seleccionado: ${farmerName}`);
        });

        // Image hover zoom
        const img = card.querySelector('img');
        if (img) {
            card.addEventListener('mouseenter', () => {
                img.style.transform = 'scale(1.05)';
            });
            card.addEventListener('mouseleave', () => {
                img.style.transform = 'scale(1)';
            });
        }
    });
}

// Búsqueda en vivo
function setupLiveSearch() {
    searchInput.addEventListener('input', function () {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            performSearch();
        }, 300); // debounce
    });
}

// Atajos de teclado
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchInput.focus();
        }

        if (e.key === 'Enter' && document.activeElement === searchInput) {
            performSearch();
        }

        if (e.key === 'Escape') {
            searchInput.value = '';
            performSearch();
            searchInput.blur();
        }
    });
}

// Scroll suave al buscar
function smoothScrollToResults() {
    if (searchInput.value.trim() !== '') {
        farmersGrid.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Agrega animación ripple al DOM
function addRippleAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Inicializar todo
function init() {
    searchBtn.addEventListener('click', () => {
        performSearch();
        smoothScrollToResults();
    });

    gridView.addEventListener('click', toggleGridView);
    listView.addEventListener('click', toggleListView);

    setupLiveSearch();
    setupKeyboardShortcuts();
    addCardInteractions();
    addRippleAnimation();

    setTimeout(() => {
        searchInput.focus();
    }, 500);
}

// Esperar a que el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export functions if needed externally
window.FarmersApp = {
    performSearch,
    toggleGridView,
    toggleListView
};

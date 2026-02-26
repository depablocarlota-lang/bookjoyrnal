const APP_KEY = 'bookjournal_carlota_v1';
let myLibrary = JSON.parse(localStorage.getItem(APP_KEY)) || [];
let currentFilter = 'all';
let searchQuery = '';

// Estado del Cronómetro
let timerInterval;
let secondsElapsed = 0;
let isTimerRunning = false;
let activeBookIdForTimer = null;

// Configuración del Calendario
let calDate = new Date();
let calMonth = calDate.getMonth();
let calYear = calDate.getFullYear();

// --- INICIO Y RENDERIZADO ---
document.addEventListener('DOMContentLoaded', () => {
    renderLibrary();
    updateStats();
    initCalendar();
    
    // Escuchar el buscador
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderLibrary();
    });
});

function renderLibrary() {
    const grid = document.getElementById('booksGrid');
    grid.innerHTML = '';

    let filtered = myLibrary.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchQuery) || 
                              book.author.toLowerCase().includes(searchQuery);
        const matchesFilter = currentFilter === 'all' || book.category === currentFilter;
        return matchesSearch && matchesFilter;
    });

    filtered.forEach(book => {
        const card = createBookCard(book);
        grid.appendChild(card);
    });
}

function createBookCard(book) {
    const div = document.createElement('div');
    div.className = 'animate-fade-in';
    div.innerHTML = `
        <div class="glass-panel rounded-[24px] overflow-hidden flex flex-col h-full border border-white/5 shadow-xl">
            <div class="relative aspect-[2/3]">
                <img src="${book.cover}" class="w-full h-full object-cover">
                <div class="absolute top-2 right-2 flex gap-1">
                    <button onclick="deleteBook(${book.id})" class="h-8 w-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-xs">✕</button>
                </div>
                ${book.status === 'reading' ? '<div class="absolute bottom-0 left-0 right-0 bg-blue-600/90 text-[8px] font-bold text-center py-1 uppercase tracking-widest">Leyendo</div>' : ''}
            </div>
            <div class="p-3">
                <h4 class="font-bold text-xs truncate">${book.title}</h4>
                <p class="text-[10px] text-zinc-500 truncate">${book.author}</p>
                <div class="mt-2 flex justify-between items-center">
                    <span class="text-[8px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 uppercase font-bold">${book.category || 'Sin Cat.'}</span>
                    <button onclick="openTimer(${book.id})" class="text-xs">⏱️</button>
                </div>
            </div>
        </div>
    `;
    return div;
}

// --- GESTIÓN DE LIBROS ---
function saveBook() {
    const title = document.getElementById('titleInput').value;
    const author = document.getElementById('authorInput').value;
    const cover = document.getElementById('coverInput').value || 'https://images.unsplash.com/photo-1543005157-86e2064f9e66?w=400';
    const category = document.getElementById('categoryInput').value;

    if(!title || !author) return alert("Carlota, rellena al menos título y autor");

    const newBook = {
        id: Date.now(),
        title,
        author,
        cover,
        category,
        status: 'wishlist',
        addedDate: new Date().toISOString(),
        timeSpent: 0
    };

    myLibrary.push(newBook);
    localStorage.setItem(APP_KEY, JSON.stringify(myLibrary));
    
    closeModal('bookModal');
    renderLibrary();
    updateStats();
}

function deleteBook(id) {
    if(confirm('¿Seguro que quieres borrar este libro?')) {
        myLibrary = myLibrary.filter(b => b.id !== id);
        localStorage.setItem(APP_KEY, JSON.stringify(myLibrary));
        renderLibrary();
        updateStats();
    }
}

// --- CRONÓMETRO ---
function toggleTimer() {
    const btn = document.getElementById('timerControlBtn');
    if(!isTimerRunning) {
        isTimerRunning = true;
        btn.innerText = 'PAUSAR';
        btn.classList.replace('bg-emerald-600', 'bg-red-600');
        timerInterval = setInterval(() => {
            secondsElapsed++;
            updateTimerDisplay();
        }, 1000);
    } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        btn.innerText =

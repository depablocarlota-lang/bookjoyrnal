// --- ESTADO DE LA APP ---
let books = JSON.parse(localStorage.getItem('books')) || [];
let dailyGoal = localStorage.getItem('dailyGoal') || 60;
let annualGoal = localStorage.getItem('annualGoal') || 12;

// --- INICIO ---
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    renderActiveBook();
    document.getElementById('currentDateLabel').innerText = new Date().toLocaleDateString();
});

// --- FUNCIONES DE NAVEGACIÓN ---
function openModal() {
    document.getElementById('bookModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('bookModal').classList.add('hidden');
    clearForm();
}

function openCalendar() {
    document.getElementById('calendarPage').style.display = 'block';
    renderCalendar();
}

function closeCalendar() {
    document.getElementById('calendarPage').style.display = 'none';
}

// --- GESTIÓN DE LIBROS ---
function saveBook() {
    const title = document.getElementById('formTitle').value;
    const author = document.getElementById('formAuthor').value;

    if (!title || !author) return alert("Por favor, rellena título y autor");

    const newBook = {
        id: Date.now(),
        title: title,
        author: author,
        status: 'wishlist', // Por defecto a pendientes
        addedDate: new Date().toISOString()
    };

    books.push(newBook);
    localStorage.setItem('books', JSON.stringify(books));
    
    updateStats();
    closeModal();
    alert("¡Libro guardado, Carlota!");
}

function updateStats() {
    const wishlist = books.filter(b => b.status === 'wishlist').length;
    const finished = books.filter(b => b.status === 'finished').length;
    
    document.getElementById('countWishlist').innerText = wishlist;
    document.getElementById('countFinished').innerText = finished;
    document.getElementById('annualCount').innerText = finished;

    // Actualizar barra de meta anual
    const progress = Math.min((finished / annualGoal) * 100, 100);
    document.getElementById('annualGoalFill').style.width = progress + '%';
    document.getElementById('annualGoalLabel').innerText = annualGoal;
}

function renderActiveBook() {
    const activeSection = document.getElementById('activeSection');
    const readingBook = books.find(b => b.status === 'reading');

    if (!readingBook) {
        activeSection.innerHTML = `
            <div class="bg-zinc-900/50 p-8 rounded-[32px] text-center border border-dashed border-zinc-700">
                <p class="text-zinc-500 text-sm">No hay ninguna lectura activa</p>
                <button onclick="openModal()" class="mt-4 text-sky-500 font-bold text-xs uppercase">+ Empezar algo nuevo</button>
            </div>
        `;
        return;
    }
    // Aquí iría el diseño del libro que estás leyendo actualmente
}

// --- CALENDARIO BÁSICO ---
function renderCalendar() {
    const grid = document.getElementById('calendarDaysGrid');
    const label = document.getElementById('calendarMonthLabel');
    const now = new Date();
    
    label.innerText = now.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    grid.innerHTML = '';

    // Crear 31 días (simplificado)
    for (let i = 1; i <= 31; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.innerText = i;
        grid.appendChild(day);
    }
}

function clearForm() {
    document.getElementById('formTitle').value = '';
    document.getElementById('formAuthor').value = '';
}

// --- METAS ---
function openGoalModal() {
    const val = prompt("¿Cuántos minutos quieres leer al día?", dailyGoal);
    if (val) {
        dailyGoal = val;
        localStorage.setItem('dailyGoal', val);
        document.getElementById('goalLabel').innerText = val;
    }
}

function openAnnualGoalModal() {
    const val = prompt("¿Cuántos libros quieres leer este año?", annualGoal);
    if (val) {
        annualGoal = val;
        localStorage.setItem('annualGoal', val);
        updateStats();
    }
}

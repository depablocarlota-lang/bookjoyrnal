 <script>
        const APP_KEY = 'bookjournal_carlota_v1';
        let myLibrary = JSON.parse(localStorage.getItem(APP_KEY)) || [];
        let readingLogs = JSON.parse(localStorage.getItem(APP_KEY + '_logs')) || [];
        let dailyGoal = parseInt(localStorage.getItem(APP_KEY + '_goal')) || 60;
        let annualGoal = parseInt(localStorage.getItem(APP_KEY + '_annual_goal')) || 12;
        
        let editingId = null;
        let currentCover = null;
        let currentRating = 0;
        let isTimerRunning = false;
        let timerSeconds = 0;
        let timerInterval = null;
        let calMonth = new Date().getMonth();
        let calYear = new Date().getFullYear();
        let navigationStack = [];

        function save() {
            localStorage.setItem(APP_KEY, JSON.stringify(myLibrary));
            localStorage.setItem(APP_KEY + '_logs', JSON.stringify(readingLogs));
            localStorage.setItem(APP_KEY + '_goal', dailyGoal);
            localStorage.setItem(APP_KEY + '_annual_goal', annualGoal);
            updateStats();
        }

        function updateStreakUI() {
            const todayStr = getCurrentDate();
            const activityByDate = {};
            readingLogs.forEach(l => {
                activityByDate[l.date] = (activityByDate[l.date] || 0) + (l.duration || 0);
            });

            const todayMinutes = Math.floor((activityByDate[todayStr] || 0) / 60);
            
            let streak = 0;
            let checkDate = new Date();
            
            while (true) {
                const dStr = `${checkDate.getDate().toString().padStart(2,'0')}/${(checkDate.getMonth() + 1).toString().padStart(2,'0')}/${checkDate.getFullYear()}`;
                const mins = Math.floor((activityByDate[dStr] || 0) / 60);
                
                if (mins >= dailyGoal) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else if (dStr === todayStr) {
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
            
            document.getElementById('streakDays').innerText = streak;
            document.getElementById('goalLabel').innerText = dailyGoal;
            const percentage = Math.min((todayMinutes / dailyGoal) * 100, 100);
            document.getElementById('goalFill').style.width = percentage + '%';

            // Actualizar Meta Anual
            updateAnnualGoalUI();
        }

        function updateAnnualGoalUI() {
            const currentYear = new Date().getFullYear().toString();
            const booksThisYear = myLibrary.filter(b => {
                if (b.status !== 'finished' || !b.endDate) return false;
                const parts = b.endDate.split('/');
                return parts[2] === currentYear;
            });

            const count = booksThisYear.length;
            document.getElementById('annualCount').innerText = count;
            document.getElementById('annualGoalLabel').innerText = annualGoal;
            const percentage = Math.min((count / annualGoal) * 100, 100);
            document.getElementById('annualGoalFill').style.width = percentage + '%';
        }

        // --- RESUMEN ANUAL LOGIC ---
        function openAnnualReport() {
            const year = new Date().getFullYear();
            const yearStr = year.toString();
            document.getElementById('reportYearLabel').innerText = year;
            
            const booksThisYear = myLibrary.filter(b => {
                if (b.status !== 'finished' || !b.endDate) return false;
                return b.endDate.split('/')[2] === yearStr;
            });

            // Stats
            document.getElementById('reportTotalBooks').innerText = booksThisYear.length;
            const totalPages = booksThisYear.reduce((acc, b) => acc + (b.pageTotal || 0), 0);
            document.getElementById('reportTotalPages').innerText = totalPages;

            const authors = {};
            booksThisYear.forEach(b => {
                if (b.author && b.author !== 'Autor Desconocido') {
                    authors[b.author] = (authors[b.author] || 0) + 1;
                }
            });
            let topAuthor = "---";
            let maxA = 0;
            for (let a in authors) if(authors[a] > maxA) { maxA = authors[a]; topAuthor = a; }
            document.getElementById('reportTopAuthor').innerText = topAuthor;

            // Chart
            const monthlyCounts = new Array(12).fill(0);
            booksThisYear.forEach(b => {
                const monthIdx = parseInt(b.endDate.split('/')[1]) - 1;
                monthlyCounts[monthIdx]++;
            });
            const maxMonth = Math.max(...monthlyCounts, 1);
            document.getElementById('reportChart').innerHTML = monthlyCounts.map(count => {
                const h = (count / maxMonth) * 100;
                return `<div class="chart-bar" style="height: ${h}%"></div>`;
            }).join('');

            // Top 3
            const top3 = [...booksThisYear].sort((a,b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
            document.getElementById('reportTopBooks').innerHTML = top3.map((b, i) => `
                <div class="flex items-center gap-4 bg-zinc-900/30 p-4 rounded-2xl border border-white/5" onclick="viewDetail(${b.id})">
                    <div class="text-xl font-bold italic opacity-20 serif">#${i+1}</div>
                    <img src="${b.cover}" class="w-12 h-16 object-cover rounded shadow">
                    <div class="flex-1 truncate">
                        <h4 class="text-sm font-bold truncate">${b.title}</h4>
                        <div class="text-[#ffd700] text-[10px] mt-1">${'★'.repeat(b.rating)}</div>
                    </div>
                </div>
            `).join('');

            document.getElementById('annualReportPage').classList.add('active-view');
        }

        function closeAnnualReport() {
            document.getElementById('annualReportPage').classList.remove('active-view');
        }

        function openGoalModal() {
            document.getElementById('goalInput').value = dailyGoal;
            document.getElementById('goalModal').classList.remove('hidden');
        }

        function closeGoalModal() {
            document.getElementById('goalModal').classList.add('hidden');
        }

        function saveGoal() {
            const val = parseInt(document.getElementById('goalInput').value);
            if (!isNaN(val) && val > 0) {
                dailyGoal = val;
                save();
                closeGoalModal();
                updateStreakUI();
            }
        }

        // Funciones Meta Anual
        function openAnnualGoalModal() {
            document.getElementById('annualGoalInput').value = annualGoal;
            document.getElementById('annualGoalModal').classList.remove('hidden');
        }

        function closeAnnualGoalModal() {
            document.getElementById('annualGoalModal').classList.add('hidden');
        }

        function saveAnnualGoal() {
            const val = parseInt(document.getElementById('annualGoalInput').value);
            if (!isNaN(val) && val > 0) {
                annualGoal = val;
                save();
                closeAnnualGoalModal();
                updateAnnualGoalUI();
            }
        }

        function checkUnreleased(book) {
            if (!book.year || !book.month || !book.day) return false;
            const release = new Date(book.year, book.month - 1, book.day);
            const today = new Date();
            today.setHours(0,0,0,0);
            return release > today;
        }

        function getCurrentDate() {
            const today = new Date();
            return `${today.getDate().toString().padStart(2,'0')}/${(today.getMonth() + 1).toString().padStart(2,'0')}/${today.getFullYear()}`;
        }

        function parseDate(str) {
            if(!str) return null;
            const parts = str.split('/');
            if(parts.length < 3) return null;
            return new Date(parts[2], parts[1]-1, parts[0]);
        }

        function calculateReadingMetrics(bookId) {
            const logs = readingLogs.filter(l => l.bookId === bookId);
            if (logs.length === 0) return null;

            let totalSeconds = 0;
            let totalPages = 0;
            logs.forEach(l => {
                totalSeconds += l.duration || 0;
                totalPages += l.pagesRead || 0;
            });

            if (totalPages === 0 || totalSeconds === 0) return null;

            const pagesPerMinute = (totalPages / (totalSeconds / 60)).toFixed(2);
            const minutesPerPage = (totalSeconds / 60 / totalPages).toFixed(2);
            
            return {
                ppm: pagesPerMinute,
                mpp: minutesPerPage,
                avgSession: Math.round(totalSeconds / logs.length / 60)
            };
        }

        function getEstimatedTime(book) {
            const metrics = calculateReadingMetrics(book.id);
            if (!metrics || !book.pageTotal) return null;

            const remainingPages = book.pageTotal - (book.pageNow || 0);
            if (remainingPages <= 0) return "Terminado";

            const totalMinutesNeeded = remainingPages * parseFloat(metrics.mpp);
            const hours = Math.floor(totalMinutesNeeded / 60);
            const minutes = Math.round(totalMinutesNeeded % 60);

            if (hours === 0) return `${minutes} min restates`;
            return `${hours}h ${minutes}m restantes`;
        }

        function updateStats() {
            const unreleased = myLibrary.filter(b => checkUnreleased(b));
            const wishlist = myLibrary.filter(b => b.status === 'wishlist' && !checkUnreleased(b));
            const finished = myLibrary.filter(b => b.status === 'finished');

            document.getElementById('countUnreleased').innerText = unreleased.length;
            document.getElementById('countWishlist').innerText = wishlist.length;
            document.getElementById('countFinished').innerText = finished.length;
            
            document.getElementById('countWriters').innerText = new Set(myLibrary.map(b => b.author).filter(a => a && a !== 'Autor Desconocido')).size;
            document.getElementById('countPublishers').innerText = new Set(myLibrary.map(b => b.publisher).filter(Boolean)).size;
            
            const collectionMapping = {
                'Autoconclusivo': 'stat-autoconclusivo',
                'Serie': 'stat-serie',
                'Saga': 'stat-saga',
                'Bilogía': 'stat-bilogia',
                'Trilogía': 'stat-trilogia',
                'Sin finalizar': 'stat-sinfinalizar'
            };

            Object.keys(collectionMapping).forEach(type => {
                const elId = collectionMapping[type];
                const el = document.getElementById(elId);
                if (el) {
                    const booksInType = myLibrary.filter(b => b.seriesType === type);
                    if (type === 'Autoconclusivo') {
                        el.innerText = `${booksInType.length} libros`;
                    } else {
                        const uniqueSeries = new Set(booksInType.map(b => b.seriesName).filter(name => name && name.trim() !== ''));
                        const count = uniqueSeries.size;
                        el.innerText = `${count} ${count === 1 ? 'colección' : 'colecciones'}`;
                    }
                }
            });

            document.getElementById('currentDateLabel').innerText = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase();
            updateStreakUI();
        }

        function renderActive() {
            const container = document.getElementById('activeSection');
            const active = myLibrary.find(b => b.status === 'reading');
            
            if (!active) {
                container.innerHTML = '';
                container.classList.add('hidden');
                return;
            }

            container.classList.remove('hidden');
            const porcentaje = Math.min(((active.pageNow || 0) / (active.pageTotal || 1)) * 100, 100);
            const estimate = getEstimatedTime(active);
            const metrics = calculateReadingMetrics(active.id);

            container.innerHTML = `
                <div class="flex flex-col items-center">
                    <div class="w-full px-4 mb-2 flex justify-between items-end">
                        <span class="text-xl font-medium text-gray-400 serif italic">Leyendo ahora</span>
                        <div class="text-xl font-medium text-gray-400">Pág. ${active.pageNow} <span class="text-xs opacity-40">/ ${active.pageTotal}</span></div>
                    </div>
                    <div class="bookmory-card-container w-full" onclick="viewDetail(${active.id})">
                        <div class="progress-track"><div class="progress-fill" style="width: ${porcentaje}%"></div></div>
                        <h3 class="text-2xl font-medium text-white mb-1 leading-tight">${active.title}</h3>
                        <p class="text-stone-500 text-xs mb-4 uppercase tracking-widest font-bold">${active.author}</p>
                        <div class="flex gap-6 items-start">
                            <img src="${active.cover || ''}" class="book-cover-bm">
                            <div class="flex-1 pt-2 flex flex-col justify-between min-h-[160px]">
                                <div class="flex flex-col gap-1 items-start">
                                    <span class="text-sky-500/80 text-[10px] font-bold uppercase border border-sky-500/20 px-2 py-1 rounded-lg">${active.format}</span>
                                    ${metrics ? `<span class="text-amber-500/80 text-[8px] font-bold uppercase mt-1">⚡ ${metrics.ppm} pág/min</span>` : ''}
                                </div>
                                <div class="flex items-center gap-4 bg-zinc-900/50 p-3 rounded-2xl w-fit border border-white/5">
                                    <button onclick="event.stopPropagation(); openTimer()" class="w-8 h-8 flex items-center justify-center bg-sky-900/40 rounded-full">⏱</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="time-remaining-badge">
                        <span>${Math.round(porcentaje)}%</span>
                        ${estimate ? `<span class="opacity-30 mx-1">|</span><span>${estimate}</span>` : ''}
                    </div>
                </div>`;
        }

        function renderAll() { 
            document.querySelectorAll('.full-page-view').forEach(view => view.classList.remove('active-view'));
            document.getElementById('mainPage').style.display = 'block';
            renderActive(); 
            updateStats(); 
        }

        function toggleAddMenu() { 
            editingId = null; 
            resetForm(); 
            document.getElementById('modalTitle').innerText = "Añadir Libro"; 
            document.getElementById('deleteBtn').classList.add('hidden'); 
            document.getElementById('bookModal').classList.remove('hidden'); 
            handleStatusChange();
        }

        function closeModal() { document.getElementById('bookModal').classList.add('hidden'); }
        function toggleSeriesFields() { document.getElementById('dynamicSeriesFields').classList.toggle('hidden', document.getElementById('formSeriesType').value === 'Autoconclusivo'); }
        
        function handleStatusChange() {
            const status = document.getElementById('formStatus').value;
            const datesContainer = document.getElementById('manualDatesContainer');
            const endField = document.getElementById('formEndDateField');
            const ratingContainer = document.getElementById('formRatingContainer');

            ratingContainer.classList.toggle('hidden', status !== 'finished');
            
            if (status === 'wishlist') {
                datesContainer.classList.add('hidden');
            } else {
                datesContainer.classList.remove('hidden');
                endField.classList.toggle('hidden', status !== 'finished');
            }
        }

        function setRating(val, context) {
            currentRating = val;
            const containerId = context === 'form' ? 'formStarRating' : 'timerStarRating';
            const btns = document.querySelectorAll(`#${containerId} button`);
            btns.forEach((btn, idx) => btn.classList.toggle('active', idx < val));
        }

        function handleManualCoverUpload(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                currentCover = ev.target.result;
                document.getElementById('formPreview').src = currentCover;
                document.getElementById('formPreview').classList.remove('hidden');
                document.getElementById('previewPlaceholder').classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }

        function processBook() {
            const title = document.getElementById('formTitle').value;
            if (!title) return;
            
            const status = document.getElementById('formStatus').value;
            let startDate = document.getElementById('formManualStartDate').value || null;
            let endDate = document.getElementById('formManualEndDate').value || null;

            if (!editingId) {
                if (status === 'reading' && !startDate) startDate = getCurrentDate();
                if (status === 'finished' && !startDate) startDate = getCurrentDate();
                if (status === 'finished' && !endDate) endDate = getCurrentDate();
            }

            const book = {
                id: editingId || Date.now(),
                title: title,
                author: document.getElementById('formAuthor').value || 'Autor Desconocido',
                pageTotal: parseInt(document.getElementById('formPageTotal').value) || 0,
                pageNow: parseInt(document.getElementById('formPageNow').value) || 0,
                status: status,
                format: document.getElementById('formFormat').value,
                seriesType: document.getElementById('formSeriesType').value,
                seriesName: document.getElementById('formSeriesName').value || '',
                seriesNumber: parseInt(document.getElementById('formSeriesNumber').value) || 0,
                publisher: document.getElementById('formPublisher').value,
                day: parseInt(document.getElementById('formDay').value) || null,
                month: parseInt(document.getElementById('formMonth').value) || null,
                year: parseInt(document.getElementById('formYear').value) || null,
                cover: currentCover,
                rating: status === 'finished' ? currentRating : 0,
                startDate: startDate,
                endDate: status === 'finished' ? endDate : null
            };

            if (editingId) {
                const idx = myLibrary.findIndex(b => b.id === editingId);
                myLibrary[idx] = book;
            } else {
                myLibrary.unshift(book);
            }
            save(); closeModal(); renderAll();
        }

        function editBook(id) {
            const b = myLibrary.find(x => x.id === id);
            if (!b) return;
            editingId = id;
            document.getElementById('formTitle').value = b.title;
            document.getElementById('formAuthor').value = b.author;
            document.getElementById('formPageTotal').value = b.pageTotal;
            document.getElementById('formPageNow').value = b.pageNow;
            document.getElementById('formStatus').value = b.status;
            document.getElementById('formFormat').value = b.format;
            document.getElementById('formSeriesType').value = b.seriesType;
            document.getElementById('formSeriesName').value = b.seriesName || '';
            document.getElementById('formSeriesNumber').value = b.seriesNumber || '';
            document.getElementById('formPublisher').value = b.publisher || '';
            document.getElementById('formDay').value = b.day || '';
            document.getElementById('formMonth').value = b.month || '';
            document.getElementById('formYear').value = b.year || '';
            document.getElementById('formManualStartDate').value = b.startDate || '';
            document.getElementById('formManualEndDate').value = b.endDate || '';

            currentRating = b.rating || 0;
            setRating(currentRating, 'form');
            currentCover = b.cover;
            if (currentCover) {
                document.getElementById('formPreview').src = currentCover;
                document.getElementById('formPreview').classList.remove('hidden');
                document.getElementById('previewPlaceholder').classList.add('hidden');
            }
            toggleSeriesFields();
            handleStatusChange();
            document.getElementById('deleteBtn').classList.remove('hidden');
            document.getElementById('bookModal').classList.remove('hidden');
        }

        function deleteBook() { if(editingId) { myLibrary = myLibrary.filter(b => b.id !== editingId); save(); closeModal(); renderAll(); } }

        function resetForm() {
            ['formTitle', 'formAuthor', 'formPageTotal', 'formPageNow', 'formSeriesName', 'formSeriesNumber', 'formPublisher', 'formDay', 'formMonth', 'formYear', 'formManualStartDate', 'formManualEndDate'].forEach(id => document.getElementById(id).value = '');
            document.getElementById('formStatus').value = 'wishlist';
            document.getElementById('formSeriesType').value = 'Autoconclusivo';
            document.getElementById('formPreview').classList.add('hidden');
            document.getElementById('previewPlaceholder').classList.remove('hidden');
            currentCover = null; 
            currentRating = 0;
            setRating(0, 'form');
            toggleSeriesFields();
        }

        function openListView(mode) {
            navigationStack = [];
            let books = [];
            let title = "";

            if (mode === 'unreleased') {
                books = myLibrary.filter(b => checkUnreleased(b));
                title = "Próximos";
            } else if (mode === 'wishlist') {
                books = myLibrary.filter(b => b.status === 'wishlist' && !checkUnreleased(b));
                title = "Pendientes";
            } else if (mode === 'finished') {
                books = myLibrary.filter(b => b.status === 'finished');
                title = "Leídos";
            }

            document.getElementById('listTitle').innerText = title;
            document.getElementById('listSubtitle').innerText = `${books.length} libros`;
            
            document.getElementById('listItemsContainer').innerHTML = books.map(b => {
                let starsHtml = (b.status === 'finished' && b.rating > 0) ? `<div class="rating-mini">${'★'.repeat(b.rating)}</div>` : `<div class="rating-empty"></div>`;
                return `<div class="book-item-container" onclick="viewDetail(${b.id})"><img src="${b.cover || ''}" class="book-cover-only">${starsHtml}</div>`;
            }).join('');

            document.getElementById('listViewPage').classList.add('active-view');
        }

        function viewDetail(id) {
            const b = myLibrary.find(x => x.id === id);
            if (!b) return;
            document.getElementById('detailTitle').innerText = b.title;
            document.getElementById('detailAuthor').innerText = b.author;
            document.getElementById('detailCover').src = b.cover || '';
            
            const starsContainer = document.getElementById('detailRatingDisplay');
            starsContainer.innerHTML = (b.status === 'finished' && b.rating > 0) ? '★'.repeat(b.rating) + '<span class="opacity-10">' + '★'.repeat(5 - b.rating) + '</span>' : '';

            const metrics = calculateReadingMetrics(b.id);

            document.getElementById('detailStatsGrid').innerHTML = `
                <div class="stat-badge"><p class="text-[9px] text-stone-500 uppercase font-bold mb-1">Editorial</p><p class="text-xs font-medium">${b.publisher || '---'}</p></div>
                <div class="stat-badge"><p class="text-[9px] text-stone-500 uppercase font-bold mb-1">Páginas</p><p class="text-xs font-medium">${b.pageTotal}</p></div>
                <div class="stat-badge"><p class="text-[9px] text-stone-500 uppercase font-bold mb-1">Inicio</p><p class="text-xs font-medium">${b.startDate || '---'}</p></div>
                <div class="stat-badge"><p class="text-[9px] text-stone-500 uppercase font-bold mb-1">Fin</p><p class="text-xs font-medium">${b.endDate || '---'}</p></div>
                ${metrics ? `
                <div class="stat-badge col-span-2 flex justify-around py-3 bg-sky-950/20">
                    <div><p class="text-[8px] text-sky-500 uppercase font-bold">Velocidad</p><p class="text-xs font-bold">${metrics.ppm} pág/m</p></div>
                    <div><p class="text-[8px] text-sky-500 uppercase font-bold">Ritmo</p><p class="text-xs font-bold">${metrics.mpp} m/pág</p></div>
                    <div><p class="text-[8px] text-sky-500 uppercase font-bold">Sesión Media</p><p class="text-xs font-bold">${metrics.avgSession} min</p></div>
                </div>` : ''}`;
            
            document.getElementById('detailStartReadingContainer').classList.toggle('hidden', b.status !== 'wishlist' || checkUnreleased(b));
            document.getElementById('detailStartReadingBtn').onclick = () => { b.status = 'reading'; b.startDate = getCurrentDate(); save(); closeDetail(); renderAll(); };
            document.getElementById('editFromDetailBtn').onclick = () => { closeDetail(); editBook(id); };
            document.getElementById('detailPage').classList.add('active-view');
        }

        function openTimer() {
            const active = myLibrary.find(b => b.status === 'reading');
            if (!active) return;
            document.getElementById('timerBookTitle').innerText = active.title;
            document.getElementById('timerBookAuthor').innerText = active.author;
            document.getElementById('timerBookCover').src = active.cover || '';
            document.getElementById('timerPage').classList.add('active-view');
            if(!isTimerRunning) {
                isTimerRunning = true;
                timerInterval = setInterval(() => {
                    timerSeconds++;
                    const h = Math.floor(timerSeconds/3600).toString().padStart(2,'0'), m = Math.floor((timerSeconds%3600)/60).toString().padStart(2,'0'), s = (timerSeconds%60).toString().padStart(2,'0');
                    document.getElementById('timerDisplay').innerText = `${h}:${m}:${s}`;
                }, 1000);
            }
        }

        function toggleTimer() { if(isTimerRunning){ clearInterval(timerInterval); isTimerRunning=false; document.getElementById('timerBtnIcon').innerText='▶'; } else openTimer(); }
        
        function stopTimerAndRegister() { 
            const a = myLibrary.find(b => b.status === 'reading'); 
            if(a){ 
                document.getElementById('timerNewPageInput').value=a.pageNow; 
                const checkStats = () => {
                    const p = parseInt(document.getElementById('timerNewPageInput').value);
                    const pagesRead = Math.max(0, p - a.pageNow);
                    const isF = p >= a.pageTotal && a.pageTotal > 0;
                    
                    const sessionMinutes = timerSeconds / 60;
                    const ppm = sessionMinutes > 0 ? (pagesRead / sessionMinutes).toFixed(2) : 0;
                    
                    document.getElementById('sessionStatsLabel').innerText = `Has leído ${pagesRead} páginas (${ppm} PPM)`;
                    document.getElementById('standardProgressInputs').classList.toggle('hidden', isF);
                    document.getElementById('ratingInputContainer').classList.toggle('hidden', !isF);
                };
                document.getElementById('timerNewPageInput').oninput = checkStats;
                checkStats();
                document.getElementById('timerProgressModal').style.display='flex'; 
            } 
        }

        function confirmTimerProgress() {
            const a = myLibrary.find(b => b.status === 'reading'), p = parseInt(document.getElementById('timerNewPageInput').value);
            if(a && !isNaN(p)){
                const pagesRead = Math.max(0, p - a.pageNow);
                a.pageNow = p;
                
                readingLogs.push({ 
                    date: getCurrentDate(), 
                    bookId: a.id, 
                    duration: timerSeconds,
                    pagesRead: pagesRead
                });

                if(p >= a.pageTotal && a.pageTotal > 0){ 
                    a.status = 'finished'; 
                    a.endDate = getCurrentDate(); 
                    a.rating = currentRating; 
                }
                save();
            }
            closeTimer(); hideTimerProgress(); renderAll();
        }

        function hideTimerProgress() { document.getElementById('timerProgressModal').style.display = 'none'; document.getElementById('standardProgressInputs').classList.remove('hidden'); document.getElementById('ratingInputContainer').classList.add('hidden'); currentRating = 0; setRating(0, 'timer'); }
        function closeTimer() { clearInterval(timerInterval); isTimerRunning = false; timerSeconds = 0; document.getElementById('timerPage').classList.remove('active-view'); }

        function searchInMyLibrary() {
            const t = document.getElementById('searchInput').value.toLowerCase(), r = document.getElementById('quickSearchResults');
            if(t.length > 0){
                const f = myLibrary.filter(b => b.title.toLowerCase().includes(t) || b.author.toLowerCase().includes(t));
                r.innerHTML = f.map(b => `<div class="bg-zinc-900/50 p-4 rounded-2xl flex gap-4 items-center border border-white/5" onclick="viewDetail(${b.id})"><img src="${b.cover || ''}" class="w-10 h-14 object-cover rounded shadow"><div><h4 class="text-sm font-bold">${b.title}</h4><p class="text-[9px] text-stone-500 uppercase font-bold">${b.author}</p></div></div>`).join('');
            } else r.innerHTML = '';
        }

        function handleListBack() {
            if (navigationStack.length > 0) {
                const prev = navigationStack.pop();
                if (prev.type === 'Collection') openCollection(prev.name, true);
                else if (prev.type === 'FolderView') openFolder(prev.name, prev.originType, prev.parentNav, true);
            } else { document.getElementById('listViewPage').classList.remove('active-view'); }
        }
        function closeDetail() { document.getElementById('detailPage').classList.remove('active-view'); }
        function openCalendar() { updateCalendar(); document.getElementById('calendarPage').classList.add('active-view'); }
        function closeCalendar() { document.getElementById('calendarPage').classList.remove('active-view'); }
        function changeMonth(dir) { calMonth += dir; if(calMonth<0){calMonth=11; calYear--;} else if(calMonth>11){calMonth=0; calYear++;} updateCalendar(); }
        function updateCalendar() {
            const first = new Date(calYear, calMonth, 1).getDay();
            const days = new Date(calYear, calMonth + 1, 0).getDate();
            const adj = first === 0 ? 6 : first - 1;
            document.getElementById('calendarMonthLabel').innerText = new Date(calYear, calMonth).toLocaleString('es-ES', {month: 'long'});
            document.getElementById('calendarYearLabel').innerText = calYear;
            let html = '';
            for(let i=0; i<adj; i++) html += '<div class="calendar-day"></div>';
            for(let d=1; d<=days; d++) {
                const dk = `${d.toString().padStart(2,'0')}/${(calMonth+1).toString().padStart(2,'0')}/${calYear}`;
                const b = myLibrary.find(x => x.endDate === dk);
                html += `<div class="calendar-day"><span class="day-number ${dk === getCurrentDate() ? 'today' : ''}">${d}</span>${b ? `<img src="${b.cover}" class="calendar-book-thumb" onclick="viewDetail(${b.id})">` : ''}</div>`;
            }
            document.getElementById('calendarDaysGrid').innerHTML = html;
        }

        function openCollection(type, back = false) {
            if (!back) navigationStack = [];
            let groups = {};
            const isBaseType = ['Autoconclusivo', 'Serie', 'Saga', 'Bilogía', 'Trilogía', 'Sin finalizar'].includes(type);
            
            if (type === 'Writer') {
                myLibrary.forEach(b => { const a = b.author || 'Autor Desconocido'; if(!groups[a]) groups[a]=[]; groups[a].push(b); });
                document.getElementById('listTitle').innerText = 'Escritores';
            } else if (type === 'Publisher') {
                myLibrary.forEach(b => { if(b.publisher){ if(!groups[b.publisher]) groups[b.publisher]=[]; groups[b.publisher].push(b); } });
                document.getElementById('listTitle').innerText = 'Editoriales';
            } else if (type === 'Autoconclusivo') {
                const books = myLibrary.filter(b => b.seriesType === 'Autoconclusivo');
                document.getElementById('listTitle').innerText = 'Autoconclusivos';
                document.getElementById('listSubtitle').innerText = `${books.length} libros`;
                document.getElementById('listItemsContainer').innerHTML = books.map(b => `<div class="book-item-container" onclick="viewDetail(${b.id})"><img src="${b.cover || ''}" class="book-cover-only"></div>`).join('');
                document.getElementById('listViewPage').classList.add('active-view');
                return;
            } else if (isBaseType) {
                myLibrary.filter(b => b.seriesType === type).forEach(b => { if(b.seriesName){ if(!groups[b.seriesName]) groups[b.seriesName]=[]; groups[b.seriesName].push(b); } });
                document.getElementById('listTitle').innerText = type;
            }
            
            document.getElementById('listSubtitle').innerText = `${Object.keys(groups).length} categorías`;
            document.getElementById('listItemsContainer').innerHTML = Object.keys(groups).sort().map(name => {
                const books = groups[name];
                return `<div class="folder-card" onclick="openFolder('${name.replace(/'/g, "\\'")}', '${type}', {type: 'Collection', name: '${type}'})">
                    <div class="folder-badge">${books.length}</div>
                    <div class="folder-stack"><img src="${books[0].cover}" class="stack-main"></div>
                    <p class="text-[10px] font-bold text-white truncate w-full px-1">${name}</p>
                </div>`;
            }).join('');
            document.getElementById('listViewPage').classList.add('active-view');
        }

        function openFolder(name, type, parentNav, back = false) {
            if (!back) navigationStack.push(parentNav);
            const books = myLibrary.filter(b => type === 'Writer' ? (b.author === name) : (type === 'Publisher' ? b.publisher === name : b.seriesName === name));
            document.getElementById('listTitle').innerText = name;
            document.getElementById('listSubtitle').innerText = `${books.length} libros`;
            document.getElementById('listItemsContainer').innerHTML = books.map(b => `<div class="book-item-container" onclick="viewDetail(${b.id})"><img src="${b.cover || ''}" class="book-cover-only"></div>`).join('');
            document.getElementById('listViewPage').classList.add('active-view');
        }

        window.onload = renderAll;
    </script>
</body>
</html>

/**
 * DEATH SOUL TV Engine App Engine Core Script
 * Architecture: Ultra-Fast High-Performance Streaming Grid
 */

let channelPool = [];
let favoriteChannels = JSON.parse(localStorage.getItem('nexus_favorites')) || [];
let historyChannels = JSON.parse(localStorage.getItem('nexus_history')) || [];
let currentFilterCategory = 'all';
let currentFilterCountry = 'all';
let currentSearchString = '';

const CHANNELS_DATA_URL = 'https://raw.githubusercontent.com/foridul422/IPTV-/main/channels.json';
const FALLBACK_LOGO = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=150&auto=format&fit=crop&q=60';

const DOM = {
    preloader: document.getElementById('preloader'),
    channelGrid: document.getElementById('channel-grid'),
    skeletonGrid: document.getElementById('skeleton-grid'),
    noResults: document.getElementById('no-results'),
    liveCount: document.getElementById('live-count'),
    searchBar: document.getElementById('search-bar'),
    searchBarMobile: document.getElementById('search-bar-mobile'), // Added Mobile Search Selector
    countryFilter: document.getElementById('country-filter'),
    sidebarNav: document.getElementById('sidebar-nav'),
    dynamicCategories: document.getElementById('dynamic-categories'),
    sectionTitle: document.getElementById('section-title'),
    clock: document.getElementById('real-time-clock'),
    
    playerContainer: document.getElementById('player-container'),
    videoPlayer: document.getElementById('video-player'),
    playerLoader: document.getElementById('player-loader'),
    playingCategory: document.getElementById('playing-category'),
    playingTitle: document.getElementById('playing-title'),
    playingCountry: document.getElementById('playing-country'),
    playerFavBtn: document.getElementById('player-fav-btn'),
    recentChannels: document.getElementById('recent-channels'),
    heroBanner: document.getElementById('hero-banner'),
    mobileSearchTrigger: document.getElementById('mobile-search-trigger')
};

document.addEventListener('DOMContentLoaded', () => {
    runClock();
    fetchChannelsData();
    setupEventBindings();
});

function runClock() {
    setInterval(() => {
        const now = new Date();
        if(DOM.clock) DOM.clock.textContent = now.toTimeString().split(' ')[0];
    }, 1000);
}

async function fetchChannelsData() {
    try {
        const response = await fetch(CHANNELS_DATA_URL);
        if (!response.ok) throw new Error('Data payload crash.');
        
        const rawData = await response.json();
        
        channelPool = (rawData.channels || rawData).map((ch, index) => ({
            id: ch.id || `ch-${index}`,
            name: ch.name || 'Unknown Channel',
            logo: ch.logo && ch.logo.startsWith('http') ? ch.logo : FALLBACK_LOGO,
            url: ch.url,
            category: ch.category || 'General',
            country: ch.country || 'Global'
        })).filter(ch => ch.url);

        if(DOM.liveCount) DOM.liveCount.textContent = channelPool.length;
        
        populateFilterControls();
        renderApplicationView();
        renderHistoryView();
        
        if(DOM.preloader) DOM.preloader.classList.add('opacity-0', 'pointer-events-none');
    } catch (error) {
        console.error('Critical Data Fetch Error:', error);
        if(DOM.skeletonGrid) {
            DOM.skeletonGrid.innerHTML = `
                <div class="col-span-full text-center py-12 text-rubyRed font-bold">
                    <i class="fa-solid fa-triangle-exclamation text-3xl mb-2"></i>
                    <p>SERVER OFFLINE / REFRESH SITE</p>
                </div>`;
        }
    }
}

function populateFilterControls() {
    const categories = [...new Set(channelPool.map(ch => ch.category))].sort();
    const countries = [...new Set(channelPool.map(ch => ch.country))].sort();

    if(DOM.dynamicCategories) {
        DOM.dynamicCategories.innerHTML = categories.map(cat => `
            <button data-category="${cat}" class="sidebar-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold tracking-wider transition-all text-left text-zinc-400 hover:bg-zinc-800/50 hover:text-white border border-transparent">
                <i class="fa-solid fa-hashtag w-4 text-center text-zinc-500"></i> ${cat}
            </button>
        `).join('');
    }

    if(DOM.countryFilter) {
        DOM.countryFilter.innerHTML = '<option value="all">🌐 All Regions</option>';
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            DOM.countryFilter.appendChild(option);
        });
    }
}

function renderApplicationView() {
    let filtered = [...channelPool];

    // Category Filter
    if (currentFilterCategory === 'favorites') {
        filtered = filtered.filter(ch => favoriteChannels.includes(ch.id));
        if(DOM.sectionTitle) DOM.sectionTitle.textContent = 'Saved Streams';
    } else if (currentFilterCategory !== 'all') {
        if (currentFilterCategory.toLowerCase() === 'sports') {
            filtered = filtered.filter(ch => 
                ch.category.toLowerCase().includes('sport') || 
                ch.category.includes('খেলা') || 
                ch.name.toLowerCase().includes('sport')
            );
            if(DOM.sectionTitle) DOM.sectionTitle.textContent = 'Sports Arena';
        } else {
            filtered = filtered.filter(ch => ch.category.toLowerCase() === currentFilterCategory.toLowerCase());
            if(DOM.sectionTitle) DOM.sectionTitle.textContent = `${currentFilterCategory} Channels`;
        }
    } else {
        if(DOM.sectionTitle) DOM.sectionTitle.textContent = 'All Live Channels';
    }

    // Country Filter
    if (currentFilterCountry !== 'all') {
        filtered = filtered.filter(ch => ch.country === currentFilterCountry);
    }

    // High Performance Search Filter Matrix
    if (currentSearchString.trim() !== '') {
        const query = currentSearchString.toLowerCase().trim();
        filtered = filtered.filter(ch => 
            ch.name.toLowerCase().includes(query) || 
            ch.category.toLowerCase().includes(query)
        );
    }

    syncActiveButtonStates();

    if(DOM.skeletonGrid) DOM.skeletonGrid.classList.add('hidden');
    
    if (filtered.length === 0) {
        if(DOM.channelGrid) DOM.channelGrid.classList.add('hidden');
        if(DOM.noResults) DOM.noResults.classList.remove('hidden');
    } else {
        if(DOM.noResults) DOM.noResults.classList.add('hidden');
        if(DOM.channelGrid) {
            DOM.channelGrid.classList.remove('hidden');
            
            // Ultra Optimized Render Engine Loop with Image Fallback Fix
            DOM.channelGrid.innerHTML = filtered.map(ch => {
                const isFav = favoriteChannels.includes(ch.id);
                return `
                    <div class="bg-zinc-900/40 border border-white/[0.03] hover:border-rubyRed/30 rounded-[1.2rem] p-4 flex flex-col justify-between group relative cursor-pointer hover:scale-[1.02] transition-all duration-200" onclick="bootstrapStreamPlayback('${ch.id}')">
                        <button onclick="toggleFavorite(event, '${ch.id}')" class="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-rubyRed border border-white/[0.05] text-xs text-zinc-400 hover:text-white transition-colors">
                            <i class="${isFav ? 'fa-solid fa-heart text-rubyRed' : 'fa-regular fa-heart'}"></i>
                        </button>
                        <div class="aspect-video w-full bg-black/50 border border-white/[0.02] rounded-xl flex items-center justify-center overflow-hidden mb-3 p-2 relative min-h-[85px]">
                            <img src="${ch.logo}" alt="" class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" onerror="this.onerror=null; this.src='${FALLBACK_LOGO}'; this.style.opacity='0.3';">
                            <span class="absolute bottom-2 left-2 flex items-center gap-1 text-[8px] font-bold tracking-widest bg-rubyRed/90 px-1.5 py-0.5 rounded uppercase text-white">
                                <span class="w-1 h-1 bg-white rounded-full animate-ping"></span> Live
                            </span>
                        </div>
                        <div>
                            <span class="text-[8px] uppercase font-black text-rubyRed/60 tracking-widest block">${ch.category}</span>
                            <h4 class="font-bold text-xs text-zinc-200 truncate mt-0.5">${ch.name}</h4>
                            <div class="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.02] text-[10px] text-zinc-500">
                                <span class="truncate max-w-[100px]"><i class="fa-solid fa-satellite text-zinc-600 mr-1"></i>${ch.country}</span>
                                <span class="text-rubyRed"><i class="fa-solid fa-circle-play text-xs"></i></span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

function syncActiveButtonStates() {
    document.querySelectorAll('.sidebar-btn, .mobile-nav-btn, .mobile-filter-pill').forEach(btn => {
        if (btn.dataset.category === currentFilterCategory) {
            btn.classList.add('bg-zinc-800/80', 'text-white', 'shadow-ruby-glow');
        } else {
            btn.classList.remove('bg-zinc-800/80', 'text-white', 'shadow-ruby-glow');
        }
    });
}

function bootstrapStreamPlayback(channelId) {
    const targetChannel = channelPool.find(ch => ch.id === channelId);
    if (!targetChannel) return;

    if(DOM.heroBanner) DOM.heroBanner.classList.add('hidden');
    if(DOM.playerContainer) {
        DOM.playerContainer.classList.remove('hidden');
        DOM.playerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        DOM.playerContainer.dataset.activeId = targetChannel.id;
    }

    if(DOM.playingCategory) DOM.playingCategory.textContent = targetChannel.category;
    if(DOM.playingTitle) DOM.playingTitle.textContent = targetChannel.name;
    if(DOM.playingCountry) DOM.playingCountry.innerHTML = `<i class="fa-solid fa-satellite-dish text-rubyRed text-[10px]"></i> Secure Direct Feed (${targetChannel.country})`;
    
    updatePlayerFavoriteButtonState(favoriteChannels.includes(targetChannel.id));

    if(DOM.playerLoader) DOM.playerLoader.classList.remove('hidden');
    
    if (Hls.isSupported()) {
        if (window.hlsInstance) window.hlsInstance.destroy();
        
        // Pure Anti-Lag Streaming Engine Profile
        const hls = new Hls({
            maxBufferLength: 10, 
            maxMaxBufferLength: 20,
            maxBufferSize: 15 * 1024 * 1024,
            enableWorker: true,
            lowLatencyMode: true
        });
        
        window.hlsInstance = hls;
        hls.loadSource(targetChannel.url);
        hls.attachMedia(DOM.videoPlayer);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            DOM.videoPlayer.play().catch(() => console.log('Interactions needed.'));
            if(DOM.playerLoader) DOM.playerLoader.classList.add('hidden');
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
                else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
                else if(DOM.playerLoader) DOM.playerLoader.classList.add('hidden');
            }
        });
    } else if (DOM.videoPlayer && DOM.videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        DOM.videoPlayer.src = targetChannel.url;
        DOM.videoPlayer.addEventListener('loadedmetadata', () => {
            DOM.videoPlayer.play();
            if(DOM.playerLoader) DOM.playerLoader.classList.add('hidden');
        });
    }

    pushStreamHistoryLog(channelId);
}

function toggleFavorite(event, id) {
    if (event) event.stopPropagation();
    const index = favoriteChannels.indexOf(id);
    if (index === -1) favoriteChannels.push(id);
    else favoriteChannels.splice(index, 1);
    
    localStorage.setItem('nexus_favorites', JSON.stringify(favoriteChannels));
    if (DOM.playerContainer && DOM.playerContainer.dataset.activeId === id) {
        updatePlayerFavoriteButtonState(favoriteChannels.includes(id));
    }
    renderApplicationView();
}

function updatePlayerFavoriteButtonState(isActive) {
    if(!DOM.playerFavBtn) return;
    const icon = DOM.playerFavBtn.querySelector('i');
    if (icon) icon.className = isActive ? 'fa-solid fa-bookmark text-white' : 'fa-regular fa-bookmark';
}

function pushStreamHistoryLog(id) {
    historyChannels = historyChannels.filter(chId => chId !== id);
    historyChannels.unshift(id);
    if (historyChannels.length > 5) historyChannels.pop();
    localStorage.setItem('nexus_history', JSON.stringify(historyChannels));
    renderHistoryView();
}

function renderHistoryView() {
    if(!DOM.recentChannels) return;
    const records = historyChannels.map(id => channelPool.find(ch => ch.id === id)).filter(Boolean);
    if (records.length === 0) {
        DOM.recentChannels.innerHTML = `<p class="text-xs text-zinc-600 text-center py-10 font-medium">No history logged</p>`;
        return;
    }
    DOM.recentChannels.innerHTML = records.map(ch => `
        <div class="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/30 border border-white/[0.02] hover:bg-zinc-800/40 transition-all cursor-pointer" onclick="bootstrapStreamPlayback('${ch.id}')">
            <div class="w-10 h-7 rounded bg-black border border-white/[0.05] flex items-center justify-center p-1 overflow-hidden shrink-0">
                <img src="${ch.logo}" class="max-h-full max-w-full object-contain" onerror="this.src='${FALLBACK_LOGO}';">
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-zinc-300 truncate">${ch.name}</p>
                <p class="text-[9px] text-zinc-500 font-medium uppercase tracking-wider">${ch.category}</p>
            </div>
        </div>
    `).join('');
}

function setupEventBindings() {
    // Desktop Search Input
    if(DOM.searchBar) {
        DOM.searchBar.addEventListener('input', (e) => {
            currentSearchString = e.target.value;
            renderApplicationView();
        });
    }

    // Mobile Search Input Handler (Fixes search lock)
    if(DOM.searchBarMobile) {
        DOM.searchBarMobile.addEventListener('input', (e) => {
            currentSearchString = e.target.value;
            renderApplicationView();
        });
    }

    if(DOM.countryFilter) {
        DOM.countryFilter.addEventListener('change', (e) => {
            currentFilterCountry = e.target.value;
            renderApplicationView();
        });
    }

    document.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.sidebar-btn, .mobile-nav-btn, .mobile-filter-pill');
        if (targetBtn) {
            currentFilterCategory = targetBtn.dataset.category;
            renderApplicationView();
        }
    });

    if(DOM.playerFavBtn) {
        DOM.playerFavBtn.addEventListener('click', () => {
            const activeId = DOM.playerContainer ? DOM.playerContainer.dataset.activeId : null;
            if (activeId) toggleFavorite(null, activeId);
        });
    }

    // Quick Mobile Nav Trigger
    if(DOM.mobileSearchTrigger) {
        DOM.mobileSearchTrigger.addEventListener('click', () => {
            if(DOM.searchBarMobile) {
                DOM.searchBarMobile.focus();
                DOM.searchBarMobile.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }
}

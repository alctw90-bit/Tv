/**
 * NEXUS-IPTV Engine App Engine Core Script
 * Architecture: Clean, Functional Single-Page Reactive States Architecture
 */

// Application Layer Global State Machine variables
let channelPool = [];
let favoriteChannels = JSON.parse(localStorage.getItem('nexus_favorites')) || [];
let historyChannels = JSON.parse(localStorage.getItem('nexus_history')) || [];
let currentFilterCategory = 'all';
let currentFilterCountry = 'all';
let currentSearchString = '';

const CHANNELS_DATA_URL = 'https://raw.githubusercontent.com/foridul422/IPTV-/main/channels.json';

// DOM Selectors Hook Pool
const DOM = {
    preloader: document.getElementById('preloader'),
    channelGrid: document.getElementById('channel-grid'),
    skeletonGrid: document.getElementById('skeleton-grid'),
    noResults: document.getElementById('no-results'),
    liveCount: document.getElementById('live-count'),
    searchBar: document.getElementById('search-bar'),
    searchBarMobile: document.getElementById('search-bar-mobile'),
    countryFilter: document.getElementById('country-filter'),
    sidebarNav: document.getElementById('sidebar-nav'),
    dynamicCategories: document.getElementById('dynamic-categories'),
    sectionTitle: document.getElementById('section-title'),
    clock: document.getElementById('real-time-clock'),
    
    // Player Components
    playerContainer: document.getElementById('player-container'),
    videoPlayer: document.getElementById('video-player'),
    playerLoader: document.getElementById('player-loader'),
    playingCategory: document.getElementById('playing-category'),
    playingTitle: document.getElementById('playing-title'),
    playingCountry: document.getElementById('playing-country'),
    playerFavBtn: document.getElementById('player-fav-btn'),
    recentChannels: document.getElementById('recent-channels'),
    heroBanner: document.getElementById('hero-banner'),
    heroActionBtn: document.getElementById('hero-action-btn'),
    mobileSearchTrigger: document.getElementById('mobile-search-trigger')
};

// Application Boot Engine Run Initialization
document.addEventListener('DOMContentLoaded', () => {
    runClock();
    fetchChannelsData();
    setupEventBindings();
});

// Real-Time System Functional Clock Display
function runClock() {
    setInterval(() => {
        const now = new Date();
        DOM.clock.textContent = now.toTimeString().split(' ')[0];
    }, 1000);
}

// Core Async Data Fetching Layer
async function fetchChannelsData() {
    try {
        const response = await fetch(CHANNELS_DATA_URL);
        if (!response.ok) throw new Error('Network payload failure returning channels configuration.');
        
        const rawData = await response.json();
        
        // Dynamic Parser normalizes array elements schemas safely
        channelPool = (rawData.channels || rawData).map((ch, index) => ({
            id: ch.id || `ch-${index}`,
            name: ch.name || 'Unknown Channel',
            logo: ch.logo || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60',
            url: ch.url,
            category: ch.category || 'General',
            country: ch.country || 'Global'
        })).filter(ch => ch.url); // Drop entities lacking stream URLs.

        DOM.liveCount.textContent = channelPool.length;
        
        populateFilterControls();
        renderApplicationView();
        
        // Graceful structural fade-out sequence animation for loaders
        DOM.preloader.classList.add('opacity-0', 'pointer-events-none');
    } catch (error) {
        console.error('Core critical system exception thrown during parsing data:', error);
        DOM.skeletonGrid.innerHTML = `
            <div class="col-span-full text-center py-12 text-rose-400 font-medium">
                <i class="fa-solid fa-triangle-exclamation text-3xl mb-2"></i>
                <p>Failed to populate live stream configurations automatically.</p>
            </div>`;
    }
}

// Populate Filtering Element Dynamic Containers 
function populateFilterControls() {
    const categories = [...new Set(channelPool.map(ch => ch.category))].sort();
    const countries = [...new Set(channelPool.map(ch => ch.country))].sort();

    // Map Sidebar category rendering items
    DOM.dynamicCategories.innerHTML = categories.map(cat => `
        <button data-category="${cat}" class="sidebar-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left">
            <i class="fa-solid fa-hashtag w-5 text-center text-slate-500"></i> ${cat}
        </button>
    `).join('');

    // Map Dropdown configuration items for target states
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        DOM.countryFilter.appendChild(option);
    });
}

// Global Orchestrated Reactive Layout Dynamic Processing Filter Matrix
function renderApplicationView() {
    let filtered = [...channelPool];

    // Evaluate Category constraint filters
    if (currentFilterCategory === 'favorites') {
        filtered = filtered.filter(ch => favoriteChannels.includes(ch.id));
        DOM.sectionTitle.textContent = 'My Premium Bookmarks';
    } else if (currentFilterCategory !== 'all') {
        filtered = filtered.filter(ch => ch.category === currentFilterCategory);
        DOM.sectionTitle.textContent = `${currentFilterCategory} Channels`;
    } else {
        DOM.sectionTitle.textContent = 'All Live Channels';
    }

    // Evaluate Country filtering targets
    if (currentFilterCountry !== 'all') {
        filtered = filtered.filter(ch => ch.country === currentFilterCountry);
    }

    // Evaluate Query input parameters
    if (currentSearchString.trim() !== '') {
        const targetQuery = currentSearchString.toLowerCase();
        filtered = filtered.filter(ch => 
            ch.name.toLowerCase().includes(targetQuery) || 
            ch.category.toLowerCase().includes(targetQuery) || 
            ch.country.toLowerCase().includes(targetQuery)
        );
    }

    // Dom Renderer structural state execution routing logic switch 
    DOM.skeletonGrid.classList.add('hidden');
    if (filtered.length === 0) {
        DOM.channelGrid.classList.add('hidden');
        DOM.noResults.classList.remove('hidden');
    } else {
        DOM.noResults.classList.add('hidden');
        DOM.channelGrid.classList.remove('hidden');
        
        DOM.channelGrid.innerHTML = filtered.map(ch => {
            const isFav = favoriteChannels.includes(ch.id);
            return `
                <div class="glass-card rounded-2xl p-4 flex flex-col justify-between group relative cursor-pointer" onclick="bootstrapStreamPlayback('${ch.id}')">
                    <button onclick="toggleFavorite(event, '${ch.id}')" class="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 text-sm transition-all">
                        <i class="${isFav ? 'fa-solid fa-heart text-rose-500' : 'fa-regular fa-heart text-slate-400'}"></i>
                    </button>
                    <div class="aspect-video w-full bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden mb-3 p-2 relative">
                        <img data-src="${ch.logo}" alt="${ch.name} logo" class="lazy-img max-h-full max-w-full object-contain object-center group-hover:scale-105 transition-transform duration-300">
                        <span class="absolute bottom-2 left-2 flex items-center gap-1 text-[9px] font-bold tracking-widest bg-rose-600 px-1.5 py-0.5 rounded uppercase text-white shadow">
                            <span class="w-1 h-1 bg-white rounded-full animate-ping"></span> Live
                        </span>
                    </div>
                    <div>
                        <span class="text-[10px] uppercase font-bold text-blue-400 tracking-wide">${ch.category}</span>
                        <h4 class="font-bold text-sm text-slate-100 truncate group-hover:text-blue-400 transition-colors mt-0.5">${ch.name}</h4>
                        <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                            <span class="truncate max-w-[100px]"><i class="fa-solid fa-earth-americas text-slate-500 mr-1"></i>${ch.country}</span>
                            <span class="text-blue-500 group-hover:translate-x-1 transition-transform"><i class="fa-solid fa-circle-play text-base"></i></span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        initializeLazyLoading();
    }
}

// Lazy Load Controller Instance
function initializeLazyLoading() {
    const lazyImages = document.querySelectorAll('.lazy-img');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });
        lazyImages.forEach(img => observer.observe(img));
    } else {
        lazyImages.forEach(img => { img.src = img.dataset.src; img.classList.add('loaded'); });
    }
}

// Dedicated HLS Media Video Playback Router Engine Implementation
function bootstrapStreamPlayback(channelId) {
    const targetChannel = channelPool.find(ch => ch.id === channelId);
    if (!targetChannel) return;

    // View Panel visibility logic layout adaptations
    DOM.heroBanner.classList.add('hidden');
    DOM.playerContainer.classList.remove('hidden');
    DOM.playerContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });

    // Populate Video player descriptive elements strings
    DOM.playingCategory.textContent = targetChannel.category;
    DOM.playingTitle.textContent = targetChannel.name;
    DOM.playingCountry.innerHTML = `<i class="fa-solid fa-earth-americas mr-1"></i> ${targetChannel.country}`;
    DOM.playerContainer.dataset.activeId = targetChannel.id;
    
    updatePlayerFavoriteButtonState(favoriteChannels.includes(targetChannel.id));

    // Handle Streaming Pipeline Configuration Injection
    DOM.playerLoader.classList.remove('hidden');
    if (Hls.isSupported()) {
        if (window.hlsInstance) {
            window.hlsInstance.destroy();
        }
        const hls = new Hls({
            maxBufferSize: 30 * 1024 * 1024, // 30MB
            enableWorker: true,
            lowLatencyMode: true
        });
        window.hlsInstance = hls;
        hls.loadSource(targetChannel.url);
        hls.attachMedia(DOM.videoPlayer);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            DOM.videoPlayer.play().catch(() => console.log('Autoplay blocked by standard user gesture policies.'));
            DOM.playerLoader.classList.add('hidden');
        });
        hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                DOM.playerLoader.classList.add('hidden');
            }
        });
    } else if (DOM.videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        // Native fallback playback pipelines natively implemented by safari/iOS
        DOM.videoPlayer.src = targetChannel.url;
        DOM.videoPlayer.addEventListener('loadedmetadata', () => {
            DOM.videoPlayer.play();
            DOM.playerLoader.classList.add('hidden');
        });
    }

    pushStreamHistoryLog(channelId);
}

// LocalStorage Persistent State Bookmarking Management Handlers
function toggleFavorite(event, id) {
    if (event) event.stopPropagation(); // Avoid click collisions triggers with parent grid components
    
    const index = favoriteChannels.indexOf(id);
    if (index === -1) {
        favoriteChannels.push(id);
    } else {
        favoriteChannels.splice(index, 1);
    }
    
    localStorage.setItem('nexus_favorites', JSON.stringify(favoriteChannels));
    
    // Check if updating currently loaded active stream component states dynamically
    if (DOM.playerContainer.dataset.activeId === id) {
        updatePlayerFavoriteButtonState(favoriteChannels.includes(id));
    }
    
    renderApplicationView();
}

function updatePlayerFavoriteButtonState(isActive) {
    const icon = DOM.playerFavBtn.querySelector('i');
    if (isActive) {
        icon.className = 'fa-solid fa-heart text-rose-500';
    } else {
        icon.className = 'fa-regular fa-heart text-slate-300';
    }
}

// Push Log Tracker History
function pushStreamHistoryLog(id) {
    historyChannels = historyChannels.filter(chId => chId !== id);
    historyChannels.unshift(id);
    if (historyChannels.length > 6) historyChannels.pop(); // Cap structural constraint limit size to 6 items
    localStorage.setItem('nexus_history', JSON.stringify(historyChannels));
    renderHistoryView();
}

function renderHistoryView() {
    const records = historyChannels.map(id => channelPool.find(ch => ch.id === id)).filter(Boolean);
    if (records.length === 0) {
        DOM.recentChannels.innerHTML = `<p class="text-xs text-slate-500 text-center py-8">No channels streamed yet</p>`;
        return;
    }
    DOM.recentChannels.innerHTML = records.map(ch => `
        <div class="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800/50 hover:border-blue-500/30 hover:bg-slate-900 transition-all cursor-pointer" onclick="bootstrapStreamPlayback('${ch.id}')">
            <div class="w-10 h-7 rounded bg-slate-950 border border-slate-800 flex items-center justify-center p-1 overflow-hidden shrink-0">
                <img src="${ch.logo}" class="max-h-full max-w-full object-contain">
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-slate-200 truncate">${ch.name}</p>
                <p class="text-[10px] text-slate-500 truncate">${ch.category}</p>
            </div>
            <i class="fa-solid fa-chevron-right text-[10px] text-slate-600 pr-1"></i>
        </div>
    `).join('');
}

// User-Interaction Pipeline Structural Action Handlers
function setupEventBindings() {
    // Shared Input event listener matrices
    const performSearch = (e) => {
        currentSearchString = e.target.value;
        renderApplicationView();
    };
    DOM.searchBar.addEventListener('input', performSearch);
    DOM.searchBarMobile.addEventListener('input', performSearch);

    // Filter Dropdown Trigger Execution
    DOM.countryFilter.addEventListener('change', (e) => {
        currentFilterCountry = e.target.value;
        renderApplicationView();
    });

    // Integrated Global Sidebar Event Capturer Delegation Loop
    const handleCategorySwitch = (targetBtn) => {
        document.querySelectorAll('.sidebar-btn, .mobile-nav-btn').forEach(btn => btn.classList.remove('active', 'text-blue-500'));
        targetBtn.classList.add('active');
        
        currentFilterCategory = targetBtn.dataset.category;
        renderApplicationView();
    };

    document.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.sidebar-btn, .mobile-nav-btn');
        if (targetBtn) {
            handleCategorySwitch(targetBtn);
        }
    });

    // Hook Active Playback Window Favoriting Intermediary
    DOM.playerFavBtn.addEventListener('click', () => {
        const activeId = DOM.playerContainer.dataset.activeId;
        if (activeId) toggleFavorite(null, activeId);
    });

    // Hero Action Triggers 
    DOM.heroActionBtn.addEventListener('click', () => {
        DOM.channelGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Focus Target Mobile Search Bar Element Hook
    DOM.mobileSearchTrigger.addEventListener('click', () => {
        DOM.searchBarMobile.focus();
        DOM.searchBarMobile.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

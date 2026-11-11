// =============================================
// 1. MAP SETUP
// =============================================

const map = L.map('map');

map.setView([12.9716, 77.5946], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);


// =============================================
// 2. GPS LOCATION
// =============================================

let userMarker = null;
let accuracyCircle = null;

function locateUser() {
    if (!navigator.geolocation) {
        alert('Your browser does not support location.');
        return;
    }

    map.locate({
        setView: true,
        maxZoom: 17,
        enableHighAccuracy: true
    });
}

map.on('locationfound', function (e) {
    if (!userMarker) {
        userMarker = L.marker(e.latlng).addTo(map);
    } else {
        userMarker.setLatLng(e.latlng);
    }

    userMarker.bindPopup('You are here!');

    if (!accuracyCircle) {
        accuracyCircle = L.circle(e.latlng, {
            radius: e.accuracy
        }).addTo(map);
    } else {
        accuracyCircle.setLatLng(e.latlng);
        accuracyCircle.setRadius(e.accuracy);
    }
});

map.on('locationerror', function (e) {
    console.error('Location error:', e.message);
});

document.getElementById('locate-btn')
    .addEventListener('click', locateUser);

// Request location when the app opens.
locateUser();


// =============================================
// 3. SEARCH PANEL
// =============================================

const searchPanel = document.getElementById('search-panel');
const searchToggle = document.getElementById('search-toggle');
const hideSearch = document.getElementById('hide-search');

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

let searchMarker = null;

function showSearchPanel() {
    searchPanel.classList.remove('is-hidden');
    searchToggle.setAttribute('aria-expanded', 'true');
}

function hideSearchPanel() {
    searchPanel.classList.add('is-hidden');
    searchResults.replaceChildren();
    searchToggle.setAttribute('aria-expanded', 'false');
}

searchToggle.addEventListener('click', function () {
    if (searchPanel.classList.contains('is-hidden')) {
        showSearchPanel();
        searchInput.focus();
    } else {
        hideSearchPanel();
    }
});

hideSearch.addEventListener('click', hideSearchPanel);

// Tapping the map reveals the search panel.
map.on('click', function () {
    showSearchPanel();
});


// =============================================
// 4. PLACE SEARCH
// =============================================

searchForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const place = searchInput.value.trim();

    if (!place) return;

    searchResults.replaceChildren();

    const loading = document.createElement('p');
    loading.textContent = 'Searching...';
    loading.style.padding = '12px';

    searchResults.appendChild(loading);

    try {
        const url =
            'https://nominatim.openstreetmap.org/search' +
            '?format=jsonv2&limit=5&q=' +
            encodeURIComponent(place);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Search request failed');
        }

        const results = await response.json();

        searchResults.replaceChildren();

        if (results.length === 0) {
            const message = document.createElement('p');
            message.textContent =
                'No places found. Try another search.';
            message.style.padding = '12px';
            searchResults.appendChild(message);
            return;
        }

        results.forEach(function (location) {
            const button = document.createElement('button');

            button.type = 'button';
            button.className = 'search-result';

            const name = document.createElement('span');
            name.className = 'result-name';
            name.textContent = location.name || 'Unnamed place';

            const address = document.createElement('span');
            address.className = 'result-address';
            address.textContent = location.display_name;

            button.append(name, address);

            button.addEventListener('click', function () {
                const lat = Number(location.lat);
                const lon = Number(location.lon);

                map.setView([lat, lon], 16);

                if (searchMarker) {
                    map.removeLayer(searchMarker);
                }

                searchMarker = L.marker([lat, lon]).addTo(map);

                searchMarker
                    .bindPopup(location.display_name)
                    .openPopup();

                hideSearchPanel();
            });

            searchResults.appendChild(button);
        });

    } catch (error) {
        console.error('Search error:', error);

        searchResults.replaceChildren();

        const message = document.createElement('p');
        message.textContent =
            'Search failed. Check your internet connection and try again.';
        message.style.padding = '12px';

        searchResults.appendChild(message);
    }
});


// =============================================
// 5. LOCAL DATABASE
// =============================================

// Keep the same database name and version
// to preserve existing memories.

const memoryDBPromise = new Promise(function (resolve, reject) {
    const request = indexedDB.open('MemoryMapDB', 1);

    request.onupgradeneeded = function (event) {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('memories')) {
            db.createObjectStore('memories', {
                keyPath: 'id',
                autoIncrement: true
            });
        }
    };

    request.onsuccess = function () {
        resolve(request.result);
    };

    request.onerror = function () {
        reject(request.error);
    };
});


// =============================================
// 6. HTML ELEMENTS
// =============================================

// Memory form
const memoryModal = document.getElementById('memory-modal');
const memoryForm = document.getElementById('memory-form');
const memoryTitle = document.getElementById('memory-title');
const memoryNotes = document.getElementById('memory-notes');
const memoryPhoto = document.getElementById('memory-photo');
const memoryVideo = document.getElementById('memory-video');
const memoryLat = document.getElementById('memory-lat');
const memoryLon = document.getElementById('memory-lon');
const formHeading = document.getElementById('memory-form-heading');
const currentPhotoLabel = document.getElementById('current-photo-label');
const cancelMemory = document.getElementById('cancel-memory');

// Visit date input
const memoryVisitDate = document.getElementById('memory-visit-date');

// Home calendar
const homeCalendarToggle = document.getElementById('home-calendar-toggle');
const homeCalendarContent = document.getElementById('home-calendar-content');
const homeCalendarPrev = document.getElementById('home-calendar-prev');
const homeCalendarNext = document.getElementById('home-calendar-next');
const homeCalendarMonth = document.getElementById('home-calendar-month');
const homeCalendarGrid = document.getElementById('home-calendar-grid');
const homeDayMemories = document.getElementById('home-day-memories');
const homeSelectedDateHeading = document.getElementById('home-selected-date-heading');

// Place calendar
const placeCalendarPrev = document.getElementById('place-calendar-prev');
const placeCalendarNext = document.getElementById('place-calendar-next');
const placeCalendarMonth = document.getElementById('place-calendar-month');
const placeCalendarGrid = document.getElementById('place-calendar-grid');
const placePastVisits = document.getElementById('place-past-visits');
const addVisitToPlace = document.getElementById('add-visit-to-place');

// Memory viewer
const memoryViewModal = document.getElementById('memory-view-modal');
const memoryPhotoGallery = document.getElementById('memory-photo-gallery');
const viewMemoryTitle = document.getElementById('view-memory-title');
const viewMemoryNotes = document.getElementById('view-memory-notes');
const viewMemoryLocation = document.getElementById('view-memory-location');

const closeMemoryView = document.getElementById('close-memory-view');
const closeMemoryButton = document.getElementById('close-memory-button');
const editMemoryButton = document.getElementById('edit-memory');


// =============================================
// 7. MEMORY VARIABLES
// =============================================

let editingMemoryId = null;
let currentMemory = null;

const today = new Date();

let homeCalendarDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
);

let selectedHomeDate = getDateKey(today);

let placeCalendarDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
);

let selectedPlaceDate = selectedHomeDate;

const memoryMarkers = new Map();

// URLs created for temporary gallery previews.
let viewerMediaURLs = [];


// =============================================
// 8. MEDIA COMPATIBILITY
// =============================================

// Older memories may use "photo" instead of "photos".

function getMemoryPhotos(memory) {
    if (Array.isArray(memory.photos)) {
        return memory.photos;
    }

    if (memory.photo) {
        return [memory.photo];
    }

    return [];
}

function getMemoryVideos(memory) {
    return Array.isArray(memory.videos)
        ? memory.videos
        : [];
}


// =============================================
// 9. OPEN A NEW MEMORY FORM
// =============================================

// Double-click the map to add a memory.

map.doubleClickZoom.disable();

map.on('dblclick', function (e) {
    openNewMemoryForm(e.latlng);
});

function openNewMemoryForm(latlng) {
    memoryForm.reset();

    memoryVisitDate.value = getDateKey(new Date());

    editingMemoryId = null;
    currentMemory = null;

    formHeading.textContent = 'Add a Memory';

    currentPhotoLabel.textContent =
        'Choose optional photos and videos.';

    memoryLat.value = latlng.lat;
    memoryLon.value = latlng.lng;

    memoryModal.hidden = false;

    memoryTitle.focus();
}


// =============================================
// 10. CLEAR GALLERY AND RELEASE MEDIA URLS
// =============================================

function clearViewerMedia() {
    viewerMediaURLs.forEach(function (url) {
        URL.revokeObjectURL(url);
    });

    viewerMediaURLs = [];
    memoryPhotoGallery.replaceChildren();
}


// =============================================
// 11. CALENDAR HELPERS
// =============================================

function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return year + '-' + month + '-' + day;
}

// Older memories do not have visitDate,
// so use their creation date.
function getMemoryDate(memory) {
    if (memory.visitDate) {
        return memory.visitDate;
    }

    if (memory.createdAt) {
        const createdDate = new Date(memory.createdAt);

        if (!Number.isNaN(createdDate.getTime())) {
            return getDateKey(createdDate);
        }
    }

    return null;
}

function formatCalendarDate(dateKey) {
    if (!dateKey) return 'Unknown date';

    const [year, month, day] = dateKey.split('-').map(Number);

    return new Date(year, month - 1, day).toLocaleDateString(
        undefined,
        {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }
    );
}

async function getAllMemories() {
    const db = await memoryDBPromise;

    return new Promise(function (resolve, reject) {
        const transaction = db.transaction('memories', 'readonly');
        const request = transaction.objectStore('memories').getAll();

        request.onsuccess = function () {
            resolve(request.result || []);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}

function changeMonth(date, amount) {
    return new Date(
        date.getFullYear(),
        date.getMonth() + amount,
        1
    );
}

function renderCalendarDays(
    container,
    displayedMonth,
    memories,
    selectedDate,
    onDateClick
) {
    container.replaceChildren();

    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const memoryDates = new Set(
        memories.map(getMemoryDate).filter(Boolean)
    );

    // Empty cells before the first day of the month.
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('span');

        emptyCell.className = 'calendar-empty';
        emptyCell.setAttribute('aria-hidden', 'true');

        container.appendChild(emptyCell);
    }

    const todayKey = getDateKey(new Date());

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateKey = getDateKey(date);

        const button = document.createElement('button');

        button.type = 'button';
        button.className = 'calendar-day';
        button.textContent = String(day);

        button.setAttribute(
            'aria-label',
            formatCalendarDate(dateKey)
        );

        if (memoryDates.has(dateKey)) {
            button.classList.add('has-memory');
        }

        if (dateKey === selectedDate) {
            button.classList.add('selected-date');
            button.setAttribute('aria-pressed', 'true');
        } else {
            button.setAttribute('aria-pressed', 'false');
        }

        if (dateKey === todayKey) {
            button.classList.add('today');
        }

        button.addEventListener('click', function () {
            onDateClick(dateKey);
        });

        container.appendChild(button);
    }
}


// =============================================
// 12. HOME CALENDAR
// =============================================

async function showHomeDayMemories(dateKey) {
    selectedHomeDate = dateKey;

    homeSelectedDateHeading.textContent =
        formatCalendarDate(dateKey);

    homeDayMemories.replaceChildren();

    try {
        const memories = await getAllMemories();

        const matchingMemories = memories.filter(function (memory) {
            return getMemoryDate(memory) === dateKey;
        });

        if (matchingMemories.length === 0) {
            const message = document.createElement('p');

            message.textContent = 'No memories saved for this day.';

            homeDayMemories.appendChild(message);
            return;
        }

        matchingMemories.forEach(function (memory) {
            const button = document.createElement('button');

            button.type = 'button';
            button.className = 'calendar-memory-item';
            button.textContent = memory.title || 'Untitled memory';

            button.addEventListener('click', function () {
                const marker = memoryMarkers.get(memory.id);

                if (marker) {
                    map.setView(marker.getLatLng(), 16);
                } else {
                    map.setView([memory.lat, memory.lon], 16);
                }

                openMemoryViewer(memory);
            });

            homeDayMemories.appendChild(button);
        });

    } catch (error) {
        console.error(
            'Could not load memories for this date:',
            error
        );

        const message = document.createElement('p');

        message.textContent =
            'Could not load memories. Please try again.';

        homeDayMemories.appendChild(message);
    }
}

async function renderHomeCalendar() {
    const monthLabel = homeCalendarDate.toLocaleDateString(
        undefined,
        {
            month: 'long',
            year: 'numeric'
        }
    );

    homeCalendarMonth.textContent = monthLabel;

    try {
        const memories = await getAllMemories();

        renderCalendarDays(
            homeCalendarGrid,
            homeCalendarDate,
            memories,
            selectedHomeDate,
            showHomeDayMemories
        );

        await showHomeDayMemories(selectedHomeDate);

    } catch (error) {
        console.error('Home calendar error:', error);
    }
}

homeCalendarToggle.addEventListener('click', function () {
    homeCalendarContent.hidden = !homeCalendarContent.hidden;

    if (!homeCalendarContent.hidden) {
        renderHomeCalendar();
    }
});

homeCalendarPrev.addEventListener('click', function () {
    homeCalendarDate = changeMonth(homeCalendarDate, -1);
    renderHomeCalendar();
});

homeCalendarNext.addEventListener('click', function () {
    homeCalendarDate = changeMonth(homeCalendarDate, 1);
    renderHomeCalendar();
});


// =============================================
// 13. PLACE VISIT CALENDAR
// =============================================

// Treat memories with the same title within 100 metres
// as visits to the same place.
function getDistanceInMetres(lat1, lon1, lat2, lon2) {
    const earthRadius = 6371000;

    const toRadians = function (degrees) {
        return degrees * Math.PI / 180;
    };

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    return 2 * earthRadius * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );
}

async function getPlaceVisits(memory) {
    const memories = await getAllMemories();

    const targetTitle = (memory.title || '').trim().toLowerCase();

    return memories.filter(function (item) {
        const sameTitle =
            (item.title || '').trim().toLowerCase() === targetTitle;

        const distance = getDistanceInMetres(
            Number(memory.lat),
            Number(memory.lon),
            Number(item.lat),
            Number(item.lon)
        );

        return sameTitle && distance <= 100;

    }).sort(function (a, b) {
        return (getMemoryDate(a) || '').localeCompare(
            getMemoryDate(b) || ''
        );
    });
}

async function showPlaceDayVisits(dateKey) {
    selectedPlaceDate = dateKey;

    placePastVisits.replaceChildren();

    try {
        if (!currentMemory) return;

        const visits = await getPlaceVisits(currentMemory);

        const matchingVisits = visits.filter(function (visit) {
            return getMemoryDate(visit) === dateKey;
        });

        if (matchingVisits.length === 0) {
            const message = document.createElement('p');

            message.textContent = 'No visits saved for this date.';

            placePastVisits.appendChild(message);
            return;
        }

        matchingVisits.forEach(function (visit) {
            const button = document.createElement('button');

            button.type = 'button';
            button.className = 'calendar-memory-item';

            button.textContent =
                (visit.title || 'Untitled memory') +
                (visit.notes ? ' — ' + visit.notes : '');

            button.addEventListener('click', function () {
                openMemoryViewer(visit);
            });

            placePastVisits.appendChild(button);
        });

    } catch (error) {
        console.error('Could not load place visits:', error);

        const message = document.createElement('p');

        message.textContent =
            'Could not load visits. Please try again.';

        placePastVisits.appendChild(message);
    }
}

async function renderPlaceCalendar() {
    if (!currentMemory) return;

    placeCalendarMonth.textContent =
        placeCalendarDate.toLocaleDateString(
            undefined,
            {
                month: 'long',
                year: 'numeric'
            }
        );

    try {
        const visits = await getPlaceVisits(currentMemory);

        renderCalendarDays(
            placeCalendarGrid,
            placeCalendarDate,
            visits,
            selectedPlaceDate,
            showPlaceDayVisits
        );

        await showPlaceDayVisits(selectedPlaceDate);

    } catch (error) {
        console.error('Place calendar error:', error);
    }
}

placeCalendarPrev.addEventListener('click', function () {
    placeCalendarDate = changeMonth(placeCalendarDate, -1);
    renderPlaceCalendar();
});

placeCalendarNext.addEventListener('click', function () {
    placeCalendarDate = changeMonth(placeCalendarDate, 1);
    renderPlaceCalendar();
});

addVisitToPlace.addEventListener('click', function () {
    if (!currentMemory) return;

    const place = currentMemory;

    const coordinates = L.latLng(
        Number(place.lat),
        Number(place.lon)
    );

    openNewMemoryForm(coordinates);

    memoryTitle.value = place.title || '';
    memoryVisitDate.value = getDateKey(new Date());
});


// =============================================
// 14. DELETE ONE PHOTO OR VIDEO
// =============================================

async function deleteMemoryMedia(memory, mediaType, mediaIndex) {
    const mediaName = mediaType === 'photos' ? 'photo' : 'video';

    if (!confirm('Delete this ' + mediaName + ' permanently?')) {
        return;
    }

    try {
        const db = await memoryDBPromise;

        const updatedMemory = {
            ...memory,
            photos: getMemoryPhotos(memory).slice(),
            videos: getMemoryVideos(memory).slice()
        };

        const mediaArray = updatedMemory[mediaType];

        if (
            mediaIndex < 0 ||
            mediaIndex >= mediaArray.length
        ) {
            return;
        }

        mediaArray.splice(mediaIndex, 1);

        const transaction = db.transaction(
            'memories',
            'readwrite'
        );

        transaction.objectStore('memories').put(updatedMemory);

        transaction.oncomplete = function () {
            currentMemory = updatedMemory;

            addMemoryMarker(updatedMemory);
            openMemoryViewer(updatedMemory);
        };

        transaction.onerror = function () {
            console.error(
                'Media deletion failed:',
                transaction.error
            );

            alert('Could not delete the media. Please try again.');
        };

    } catch (error) {
        console.error('Media deletion error:', error);

        alert('Could not delete this media. Please try again.');
    }
}


// =============================================
// 15. OPEN A SAVED MEMORY
// =============================================

function openMemoryViewer(memory) {
    currentMemory = memory;

    clearViewerMedia();

    viewMemoryTitle.textContent =
        memory.title || 'Untitled memory';

    viewMemoryNotes.textContent =
        memory.notes || 'No notes added yet.';

    viewMemoryLocation.textContent =
        'Latitude: ' + memory.lat +
        ' | Longitude: ' + memory.lon;

    const photos = getMemoryPhotos(memory);
    const videos = getMemoryVideos(memory);

    // Display photos.
    photos.forEach(function (photo, index) {
        const item = document.createElement('div');

        item.className = 'memory-media-item';

        const image = document.createElement('img');

        image.alt =
            'Photo ' + (index + 1) + ' from ' + memory.title;

        image.loading = 'lazy';

        const imageURL = URL.createObjectURL(photo);

        viewerMediaURLs.push(imageURL);

        image.src = imageURL;

        const deleteButton = document.createElement('button');

        deleteButton.type = 'button';
        deleteButton.className = 'delete-media-btn';
        deleteButton.textContent = 'Delete photo';

        deleteButton.setAttribute(
            'aria-label',
            'Delete photo ' + (index + 1)
        );

        deleteButton.addEventListener('click', function () {
            deleteMemoryMedia(memory, 'photos', index);
        });

        item.append(image, deleteButton);

        memoryPhotoGallery.appendChild(item);
    });

    // Display videos.
    videos.forEach(function (video, index) {
        const item = document.createElement('div');

        item.className = 'memory-media-item';

        const videoElement = document.createElement('video');

        videoElement.controls = true;
        videoElement.preload = 'metadata';

        videoElement.setAttribute(
            'aria-label',
            'Video ' + (index + 1) + ' from ' + memory.title
        );

        const videoURL = URL.createObjectURL(video);

        viewerMediaURLs.push(videoURL);

        videoElement.src = videoURL;

        const deleteButton = document.createElement('button');

        deleteButton.type = 'button';
        deleteButton.className = 'delete-media-btn';
        deleteButton.textContent = 'Delete video';

        deleteButton.setAttribute(
            'aria-label',
            'Delete video ' + (index + 1)
        );

        deleteButton.addEventListener('click', function () {
            deleteMemoryMedia(memory, 'videos', index);
        });

        item.append(videoElement, deleteButton);

        memoryPhotoGallery.appendChild(item);
    });

    if (photos.length === 0 && videos.length === 0) {
        const message = document.createElement('p');

        message.textContent =
            'No photos or videos saved for this memory yet.';

        memoryPhotoGallery.appendChild(message);
    }

    memoryViewModal.hidden = false;

    // Open the place calendar at this memory's visit date.
    selectedPlaceDate =
        getMemoryDate(memory) || getDateKey(new Date());

    const [visitYear, visitMonth] =
        selectedPlaceDate.split('-').map(Number);

    placeCalendarDate = new Date(
        visitYear,
        visitMonth - 1,
        1
    );

    renderPlaceCalendar();
}


// =============================================
// 16. CREATE OR UPDATE A MEMORY MARKER
// =============================================

function addMemoryMarker(memory) {
    const oldMarker = memoryMarkers.get(memory.id);

    if (oldMarker) {
        map.removeLayer(oldMarker);
    }

    const marker = L.marker([
        memory.lat,
        memory.lon
    ]).addTo(map);

    marker.bindTooltip(memory.title || 'Untitled memory');

    marker.on('click', function () {
        openMemoryViewer(memory);
    });

    memoryMarkers.set(memory.id, marker);
}


// =============================================
// 17. EDIT AN EXISTING MEMORY
// =============================================

editMemoryButton.addEventListener('click', function () {
    if (!currentMemory) {
        return;
    }

    const memory = currentMemory;

    editingMemoryId = memory.id;

    memoryForm.reset();

    memoryTitle.value = memory.title || '';
    memoryNotes.value = memory.notes || '';

    memoryVisitDate.value =
        getMemoryDate(memory) || getDateKey(new Date());

    memoryLat.value = memory.lat;
    memoryLon.value = memory.lon;

    const photoCount = getMemoryPhotos(memory).length;
    const videoCount = getMemoryVideos(memory).length;

    currentPhotoLabel.textContent =
        photoCount + ' photo(s) and ' +
        videoCount + ' video(s) already saved. ' +
        'New media will be added; existing media will be kept.';

    formHeading.textContent = 'Edit Memory';

    // Release temporary preview URLs before closing the viewer.
    clearViewerMedia();

    memoryViewModal.hidden = true;
    memoryModal.hidden = false;

    memoryTitle.focus();
});


// =============================================
// 18. CLOSE THE MEMORY VIEWER
// =============================================

function closeMemoryViewer() {
    memoryViewModal.hidden = true;
    currentMemory = null;

    clearViewerMedia();
}

closeMemoryView.addEventListener('click', closeMemoryViewer);
closeMemoryButton.addEventListener('click', closeMemoryViewer);


// =============================================
// 19. CANCEL ADDING OR EDITING
// =============================================

cancelMemory.addEventListener('click', function () {
    memoryModal.hidden = true;

    editingMemoryId = null;
    currentMemory = null;

    memoryForm.reset();

    currentPhotoLabel.textContent =
        'Choose optional photos and videos.';
});


// =============================================
// 20. SAVE A NEW OR EDITED MEMORY
// =============================================

let isSavingMemory = false;

memoryForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    // Prevent accidental duplicate saves.
    if (isSavingMemory) {
        return;
    }

    const title = memoryTitle.value.trim();
    const notes = memoryNotes.value.trim();
    const visitDate = memoryVisitDate.value;

    if (
        !visitDate ||
        !/^\d{4}-\d{2}-\d{2}$/.test(visitDate)
    ) {
        alert('Please select a valid visit date.');
        return;
    }

    const lat = Number(memoryLat.value);
    const lon = Number(memoryLon.value);

    if (!title) {
        alert('Please enter a title.');
        return;
    }

    // Validate coordinates.
    if (
        memoryLat.value.trim() === '' ||
        memoryLon.value.trim() === '' ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        lat < -90 ||
        lat > 90 ||
        lon < -180 ||
        lon > 180
    ) {
        alert('Please enter valid latitude and longitude values.');
        return;
    }

    isSavingMemory = true;

    try {
        const db = await memoryDBPromise;

        const isEditing = editingMemoryId !== null;

        let existingMemory = null;

        // Fetch the latest saved version when editing.
        if (isEditing) {
            existingMemory = await new Promise(function (resolve, reject) {
                const readTransaction = db.transaction(
                    'memories',
                    'readonly'
                );

                const request = readTransaction
                    .objectStore('memories')
                    .get(editingMemoryId);

                request.onsuccess = function () {
                    resolve(request.result || null);
                };

                request.onerror = function () {
                    reject(request.error);
                };
            });

            if (!existingMemory) {
                alert(
                    'This memory could not be found. Please reload the app.'
                );

                return;
            }
        }

        // Collect newly selected photos and videos.
        const newPhotos = Array.from(memoryPhoto.files || []);
        const newVideos = Array.from(memoryVideo.files || []);

        // Keep existing media when editing a memory.
        const existingPhotos = existingMemory
            ? getMemoryPhotos(existingMemory)
            : [];

        const existingVideos = existingMemory
            ? getMemoryVideos(existingMemory)
            : [];

        const memory = {
            ...(existingMemory || {}),

            title: title,
            notes: notes,
            visitDate: visitDate,
            lat: lat,
            lon: lon,

            photos: existingPhotos.concat(newPhotos),
            videos: existingVideos.concat(newVideos),

            createdAt: existingMemory
                ? existingMemory.createdAt
                : new Date().toISOString()
        };

        if (isEditing) {
            memory.id = editingMemoryId;
        }

        // Save the memory to IndexedDB.
        const transaction = db.transaction(
            'memories',
            'readwrite'
        );

        const store = transaction.objectStore('memories');

        const request = isEditing
            ? store.put(memory)
            : store.add(memory);

        await new Promise(function (resolve, reject) {
            request.onsuccess = function () {
                if (!isEditing) {
                    memory.id = request.result;
                }
            };

            transaction.oncomplete = function () {
                resolve();
            };

            transaction.onerror = function () {
                reject(
                    transaction.error ||
                    new Error('Save transaction failed.')
                );
            };

            transaction.onabort = function () {
                reject(
                    transaction.error ||
                    new Error('Save transaction was cancelled.')
                );
            };
        });

        // Refresh the pin using the saved information.
        addMemoryMarker(memory);

        if (!homeCalendarContent.hidden) {
            renderHomeCalendar();
        }

        // Close and reset the form.
        memoryModal.hidden = true;

        memoryForm.reset();

        editingMemoryId = null;
        currentMemory = null;

        currentPhotoLabel.textContent =
            'Choose optional photos and videos.';

    } catch (error) {
        console.error('Memory saving error:', error);

        alert('Could not save your memory. Please try again.');

    } finally {
        isSavingMemory = false;
    }
});


// =============================================
// 21. LOAD SAVED MEMORIES
// =============================================

async function loadMemories() {
    try {
        const db = await memoryDBPromise;

        const transaction = db.transaction(
            'memories',
            'readonly'
        );

        const request = transaction
            .objectStore('memories')
            .getAll();

        request.onsuccess = function () {
            request.result.forEach(function (memory) {
                addMemoryMarker(memory);
            });
        };

        request.onerror = function () {
            console.error('Could not load saved memories.');
        };

    } catch (error) {
        console.error('Database error:', error);
    }
}


// =============================================
// 22. RESTORE SAVED MEMORY PINS
// =============================================

// Load all memories when the app starts.
loadMemories();
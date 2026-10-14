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
}

function hideSearchPanel() {
    searchPanel.classList.add('is-hidden');
    searchResults.replaceChildren();
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

    if (!place) {
        return;
    }

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
            message.textContent = 'No places found. Try another search.';
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

// Keep the existing database name and version.
// This preserves memories already saved in IndexedDB.

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
const memoryLat = document.getElementById('memory-lat');
const memoryLon = document.getElementById('memory-lon');
const formHeading = document.getElementById('memory-form-heading');
const currentPhotoLabel = document.getElementById('current-photo-label');
const cancelMemory = document.getElementById('cancel-memory');

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

let selectedLocation = null;
let editingMemoryId = null;
let currentMemory = null;

const memoryMarkers = new Map();

// Track temporary URLs created for gallery images.
let viewerImageURLs = [];


// =============================================
// 8. PHOTO COMPATIBILITY
// =============================================

// New memories use "photos".
// Older memories may contain one "photo" property.

function getMemoryPhotos(memory) {
    if (Array.isArray(memory.photos)) {
        return memory.photos;
    }

    if (memory.photo) {
        return [memory.photo];
    }

    return [];
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

    editingMemoryId = null;
    currentMemory = null;
    selectedLocation = latlng;

    formHeading.textContent = 'Add a Memory';
    currentPhotoLabel.textContent = 'Choose one or more optional photos.';

    memoryLat.value = latlng.lat;
    memoryLon.value = latlng.lng;

    memoryModal.hidden = false;

    memoryTitle.focus();
}


// =============================================
// 10. RELEASE VIEWER PHOTO URLS
// =============================================

function clearViewerPhotos() {
    viewerImageURLs.forEach(function (url) {
        URL.revokeObjectURL(url);
    });

    viewerImageURLs = [];
    memoryPhotoGallery.replaceChildren();
}


// =============================================
// 11. OPEN A SAVED MEMORY
// =============================================

function openMemoryViewer(memory) {
    currentMemory = memory;

    clearViewerPhotos();

    viewMemoryTitle.textContent = memory.title;
    viewMemoryNotes.textContent =
        memory.notes || 'No notes added yet.';

    viewMemoryLocation.textContent =
        'Latitude: ' + memory.lat +
        ' | Longitude: ' + memory.lon;

    const photos = getMemoryPhotos(memory);

    photos.forEach(function (photo) {
        const image = document.createElement('img');

        image.alt = 'Photo from ' + memory.title;
        image.loading = 'lazy';

        const imageURL = URL.createObjectURL(photo);

        viewerImageURLs.push(imageURL);
        image.src = imageURL;

        memoryPhotoGallery.appendChild(image);
    });

    memoryViewModal.hidden = false;
}


// =============================================
// 12. CREATE OR UPDATE A MEMORY MARKER
// =============================================

function addMemoryMarker(memory) {
    // Remove the previous marker if this memory was edited.
    const oldMarker = memoryMarkers.get(memory.id);

    if (oldMarker) {
        map.removeLayer(oldMarker);
    }

    const marker = L.marker([
        memory.lat,
        memory.lon
    ]).addTo(map);

    marker.bindTooltip(memory.title);

    marker.on('click', function () {
        openMemoryViewer(memory);
    });

    memoryMarkers.set(memory.id, marker);
}


// =============================================
// 13. EDIT AN EXISTING MEMORY
// =============================================

editMemoryButton.addEventListener('click', function () {
    if (!currentMemory) {
        return;
    }

    const memory = currentMemory;

    editingMemoryId = memory.id;

    selectedLocation = L.latLng(
        memory.lat,
        memory.lon
    );

    memoryForm.reset();

    memoryTitle.value = memory.title;
    memoryNotes.value = memory.notes || '';
    memoryLat.value = memory.lat;
    memoryLon.value = memory.lon;

    const photoCount = getMemoryPhotos(memory).length;

    if (photoCount > 0) {
        currentPhotoLabel.textContent =
            photoCount + ' photo(s) already saved. ' +
            'Choose additional photos to keep the existing ones.';
    } else {
        currentPhotoLabel.textContent =
            'No photos saved yet. Choose optional photos.';
    }

    formHeading.textContent = 'Edit Memory';

    memoryViewModal.hidden = true;
    memoryModal.hidden = false;

    memoryTitle.focus();
});


// =============================================
// 14. CLOSE THE MEMORY VIEWER
// =============================================

function closeMemoryViewer() {
    memoryViewModal.hidden = true;
    currentMemory = null;

    clearViewerPhotos();
}

closeMemoryView.addEventListener('click', closeMemoryViewer);

closeMemoryButton.addEventListener('click', closeMemoryViewer);


// =============================================
// 15. CANCEL ADDING OR EDITING
// =============================================

cancelMemory.addEventListener('click', function () {
    memoryModal.hidden = true;

    editingMemoryId = null;
    selectedLocation = null;
    currentMemory = null;

    memoryForm.reset();

    currentPhotoLabel.textContent = 'Choose one or more optional photos.';
});


// =============================================
// 16. SAVE A NEW OR EDITED MEMORY
// =============================================

memoryForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const title = memoryTitle.value.trim();
    const notes = memoryNotes.value.trim();

    const lat = Number(memoryLat.value);
    const lon = Number(memoryLon.value);

    if (!title) {
        alert('Please enter a title.');
        return;
    }

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

    try {
        const db = await memoryDBPromise;

        const isEditing = editingMemoryId !== null;

        const existingMemory = isEditing
            ? currentMemory
            : null;

        // Get every newly selected photo.
        const newPhotos = Array.from(memoryPhoto.files || []);

        // Preserve existing photos and append the new ones.
        const existingPhotos = existingMemory
            ? getMemoryPhotos(existingMemory)
            : [];

        const memory = {
            ...(existingMemory || {}),

            title: title,
            notes: notes,
            lat: lat,
            lon: lon,

            photos: existingPhotos.concat(newPhotos),

            // Preserve the original creation date on edits.
            createdAt: existingMemory
                ? existingMemory.createdAt
                : new Date().toISOString()
        };

        // Keep the record ID when editing.
        if (isEditing) {
            memory.id = editingMemoryId;
        }

        const transaction = db.transaction(
            'memories',
            'readwrite'
        );

        const store = transaction.objectStore('memories');

        const request = isEditing
            ? store.put(memory)
            : store.add(memory);

        request.onsuccess = function () {
            if (!isEditing) {
                memory.id = request.result;
            }
        };

        transaction.oncomplete = function () {
            addMemoryMarker(memory);

            memoryModal.hidden = true;
            memoryForm.reset();

            editingMemoryId = null;
            selectedLocation = null;
            currentMemory = null;

            currentPhotoLabel.textContent =
                'Choose one or more optional photos.';
        };

        transaction.onerror = function () {
            console.error('Save transaction failed:', transaction.error);
            alert('Could not save your memory. Please try again.');
        };

    } catch (error) {
        console.error('Memory saving error:', error);
        alert('Could not access local storage. Please try again.');
    }
});


// =============================================
// 17. LOAD SAVED MEMORIES
// =============================================

async function loadMemories() {
    try {
        const db = await memoryDBPromise;

        const transaction = db.transaction(
            'memories',
            'readonly'
        );

        const store = transaction.objectStore('memories');
        const request = store.getAll();

        request.onsuccess = function () {
            const memories = request.result;

            memories.forEach(function (memory) {
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

// Restore the memory pins whenever the app starts.
loadMemories();

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
// 11. DELETE ONE PHOTO OR VIDEO
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
// 12. OPEN A SAVED MEMORY
// =============================================

function openMemoryViewer(memory) {
    currentMemory = memory;

    clearViewerMedia();

    viewMemoryTitle.textContent = memory.title || 'Untitled memory';

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
}


// =============================================
// 13. CREATE OR UPDATE A MEMORY MARKER
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
// 14. EDIT AN EXISTING MEMORY
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
// 15. CLOSE THE MEMORY VIEWER
// =============================================

function closeMemoryViewer() {
    memoryViewModal.hidden = true;
    currentMemory = null;

    clearViewerMedia();
}

closeMemoryView.addEventListener('click', closeMemoryViewer);
closeMemoryButton.addEventListener('click', closeMemoryViewer);


// =============================================
// 16. CANCEL ADDING OR EDITING
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
// 17. SAVE A NEW OR EDITED MEMORY
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
// 18. LOAD SAVED MEMORIES
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
// 19. RESTORE SAVED MEMORY PINS
// =============================================

// Load all memories when the app starts.
loadMemories();

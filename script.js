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
// 2. USER GPS LOCATION
// =============================================

let userMarker = null;
let accuracyCircle = null;

function locateUser() {
    map.locate({
        setView: true,
        maxZoom: 17,
        enableHighAccuracy: true
    });
}

// When GPS location is found
map.on('locationfound', function (e) {

    if (userMarker === null) {
        userMarker = L.marker(e.latlng).addTo(map);
    } else {
        userMarker.setLatLng(e.latlng);
    }

    userMarker.bindPopup('You are here!');

    // Display GPS accuracy
    if (accuracyCircle === null) {
        accuracyCircle = L.circle(e.latlng, {
            radius: e.accuracy
        }).addTo(map);
    } else {
        accuracyCircle.setLatLng(e.latlng);
        accuracyCircle.setRadius(e.accuracy);
    }
});

// If GPS fails, the map can still be used
map.on('locationerror', function (e) {
    console.error('Location error:', e.message);
});

// My Location button
document.getElementById('locate-btn')
    .addEventListener('click', locateUser);

// Automatically request location when the app opens
locateUser();


// =============================================
// 3. PLACE SEARCH
// =============================================

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

let searchMarker = null;

searchForm.addEventListener('submit', async function (event) {

    event.preventDefault();

    const place = searchInput.value.trim();

    if (place === '') {
        return;
    }

    // Show loading message
    searchResults.replaceChildren();

    const loading = document.createElement('p');
    loading.textContent = 'Searching...';
    loading.style.padding = '12px';

    searchResults.appendChild(loading);

    try {

        const url =
            'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q='
            + encodeURIComponent(place);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Search request failed');
        }

        const results = await response.json();

        searchResults.replaceChildren();

        // No matching locations
        if (results.length === 0) {

            const message = document.createElement('p');
            message.textContent = 'No places found. Try another search.';
            message.style.padding = '12px';

            searchResults.appendChild(message);
            return;
        }

        // Display search results
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

            // Select a search result
            button.addEventListener('click', function () {

                const lat = Number(location.lat);
                const lon = Number(location.lon);

                map.setView([lat, lon], 16);

                if (searchMarker !== null) {
                    map.removeLayer(searchMarker);
                }

                searchMarker = L.marker([lat, lon]).addTo(map);

                searchMarker
                    .bindPopup(location.display_name)
                    .openPopup();

                searchResults.replaceChildren();
            });

            searchResults.appendChild(button);
        });

    } catch (error) {

        console.error(error);

        searchResults.replaceChildren();

        const message = document.createElement('p');
        message.textContent =
            'Search failed. Check your internet connection and try again.';
        message.style.padding = '12px';

        searchResults.appendChild(message);
    }
});


// =============================================
// 4. LOCAL MEMORY DATABASE
// =============================================

// IndexedDB saves memories and photos in this browser.
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
// 5. HTML ELEMENTS AND VARIABLES
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
const viewMemoryPhoto = document.getElementById('view-memory-photo');
const viewMemoryTitle = document.getElementById('view-memory-title');
const viewMemoryNotes = document.getElementById('view-memory-notes');
const viewMemoryLocation = document.getElementById('view-memory-location');
const closeMemoryView = document.getElementById('close-memory-view');
const closeMemoryButton = document.getElementById('close-memory-button');
const editMemoryButton = document.getElementById('edit-memory');

// Track the memory currently being created or edited
let selectedLocation = null;
let editingMemoryId = null;
let currentMemory = null;

// Keep track of memory markers to prevent duplicates
const memoryMarkers = new Map();

// Temporary URL used to display a saved photo
let viewerImageURL = null;


// =============================================
// 6. OPEN A FORM FOR A NEW MEMORY
// =============================================

// Double-click the map to add a memory
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

    currentPhotoLabel.textContent =
        'Choose an optional photo.';

    memoryLat.value = latlng.lat;
    memoryLon.value = latlng.lng;

    memoryModal.hidden = false;

    memoryTitle.focus();
}


// =============================================
// 7. OPEN A SAVED MEMORY
// =============================================

function openMemoryViewer(memory) {

    currentMemory = memory;

    viewMemoryTitle.textContent = memory.title;

    viewMemoryNotes.textContent =
        memory.notes || 'No notes added yet.';

    viewMemoryLocation.textContent =
        'Latitude: ' + memory.lat +
        ' | Longitude: ' + memory.lon;

    // Release any previously created photo URL
    if (viewerImageURL !== null) {
        URL.revokeObjectURL(viewerImageURL);
        viewerImageURL = null;
    }

    // Display the saved photo, if one exists
    if (memory.photo) {

        viewerImageURL = URL.createObjectURL(memory.photo);

        viewMemoryPhoto.src = viewerImageURL;
        viewMemoryPhoto.hidden = false;

    } else {

        viewMemoryPhoto.removeAttribute('src');
        viewMemoryPhoto.hidden = true;
    }

    memoryViewModal.hidden = false;
}


// =============================================
// 8. CREATE OR UPDATE A MEMORY MARKER
// =============================================

function addMemoryMarker(memory) {

    // Remove the old marker when updating a memory
    const oldMarker = memoryMarkers.get(memory.id);

    if (oldMarker) {
        map.removeLayer(oldMarker);
    }

    // Create the marker at the memory's coordinates
    const marker = L.marker([
        memory.lat,
        memory.lon
    ]).addTo(map);

    // Open the full-screen viewer when the marker is clicked
    marker.on('click', function () {
        openMemoryViewer(memory);
    });

    memoryMarkers.set(memory.id, marker);
}


// =============================================
// 9. EDIT AN EXISTING MEMORY
// =============================================

editMemoryButton.addEventListener('click', function () {

    if (!currentMemory) {
        return;
    }

    const memory = currentMemory;

    // Remember which saved memory is being edited
    editingMemoryId = memory.id;

    selectedLocation = L.latLng(
        memory.lat,
        memory.lon
    );

    // Fill the form with existing information
    memoryForm.reset();

    memoryTitle.value = memory.title;
    memoryNotes.value = memory.notes || '';
    memoryLat.value = memory.lat;
    memoryLon.value = memory.lon;

    // Do not require the user to upload the photo again
    currentPhotoLabel.textContent = memory.photo
        ? 'A photo is already saved. Choose another photo to replace it.'
        : 'No photo currently saved.';

    formHeading.textContent = 'Edit Memory';

    // Switch from the viewer to the edit form
    memoryViewModal.hidden = true;
    memoryModal.hidden = false;

    memoryTitle.focus();
});


// =============================================
// 10. CLOSE THE VIEWER OR CANCEL THE FORM
// =============================================

function closeMemoryViewer() {

    memoryViewModal.hidden = true;
    currentMemory = null;

    // Release the temporary photo URL
    if (viewerImageURL !== null) {
        URL.revokeObjectURL(viewerImageURL);
        viewerImageURL = null;
    }

    viewMemoryPhoto.removeAttribute('src');
}

closeMemoryView.addEventListener('click', closeMemoryViewer);

closeMemoryButton.addEventListener('click', closeMemoryViewer);


// Cancel adding or editing a memory
cancelMemory.addEventListener('click', function () {

    memoryModal.hidden = true;

    editingMemoryId = null;
    selectedLocation = null;
    currentMemory = null;

    memoryForm.reset();
});


// =============================================
// 11. SAVE A NEW OR EDITED MEMORY
// =============================================

memoryForm.addEventListener('submit', async function (event) {

    event.preventDefault();

    const title = memoryTitle.value.trim();
    const notes = memoryNotes.value.trim();

    const lat = Number(memoryLat.value);
    const lon = Number(memoryLon.value);

    // Validate title
    if (!title) {
        alert('Please enter a title.');
        return;
    }

    // Validate coordinates
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

        const newPhoto = memoryPhoto.files[0] || null;

        // Build the memory record
        const memory = {

            title: title,
            notes: notes,

            lat: lat,
            lon: lon,

            // Keep the old photo if no replacement was selected
            photo: newPhoto ||
                (existingMemory ? existingMemory.photo : null),

            // Preserve the original creation time when editing
            createdAt: existingMemory
                ? existingMemory.createdAt
                : new Date().toISOString()
        };

        if (isEditing) {
            memory.id = editingMemoryId;
        }

        // Open a read/write transaction
        const transaction = db.transaction(
            'memories',
            'readwrite'
        );

        const store = transaction.objectStore('memories');

        // Update an existing record or create a new one
        const request = isEditing
            ? store.put(memory)
            : store.add(memory);

        request.onsuccess = function () {

            if (!isEditing) {
                memory.id = request.result;
            }
        };

        transaction.oncomplete = function () {

            // Update the map marker
            addMemoryMarker(memory);

            // Close and reset the form
            memoryModal.hidden = true;
            memoryForm.reset();

            editingMemoryId = null;
            selectedLocation = null;
            currentMemory = null;
        };

        transaction.onerror = function () {
            alert('Could not save your memory. Please try again.');
        };

    } catch (error) {

        console.error('Memory saving error:', error);

        alert('Local storage failed. Please try again.');
    }
});


// =============================================
// 12. LOAD SAVED MEMORIES ON STARTUP
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

// Load all saved memory pins when the app starts
loadMemories();
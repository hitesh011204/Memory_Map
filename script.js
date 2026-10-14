const map = L.map('map');

map.setView([12.9716, 77.5946], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Store the user's location marker
let userMarker = null;
let accuracyCircle = null;

// Detect current location
function locateUser() {
    map.locate({
        setView: true,
        maxZoom: 17,
        enableHighAccuracy: true
    });
}

// When GPS location is found
map.on('locationfound', function (e) {

    // Create marker the first time, then move it
    if (userMarker === null) {
        userMarker = L.marker(e.latlng).addTo(map);
    } else {
        userMarker.setLatLng(e.latlng);
    }

    userMarker.bindPopup("You are here!");

    // Show approximate GPS accuracy
    if (accuracyCircle === null) {
        accuracyCircle = L.circle(e.latlng, {
            radius: e.accuracy
        }).addTo(map);
    } else {
        accuracyCircle.setLatLng(e.latlng);
        accuracyCircle.setRadius(e.accuracy);
    }
});

// If location detection fails
map.on('locationerror', function (e) {
    alert("Couldn't detect your location. Please enable location permission and GPS.");
});

// Button: return to current location
document.getElementById('locate-btn')
    .addEventListener('click', locateUser);

// Automatically detect location when the app opens
locateUser();

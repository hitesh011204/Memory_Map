# Memory_Map
# 🌍 Memory Map — Life Is Too Short to Forget the Good Parts

> *Life is too short to just work, dude. Go out there, make memories, collect moments, and don't forget to live.*

## 😂 The Random Idea Behind This Project

Life is too short to wake up, go to work, come back home, sleep, and repeat the same thing forever.

And one fine day, my random-ass, overcurious brain came up with a question:

**"Why not create a memory map and document my travels and memories on it?"**

And boom. 💥 Memory Map was born.

The idea was simple: what if I could save the places I visit, attach the photos and videos I take, write down what happened, and revisit those moments by exploring a map?

Not just another project to put on my résumé. Not just another bunch of code written to learn a technology.

I wanted to create something *fun*, something personal, something that reminds me why creating things with code is so damn cool.

This is **Version 1 of Memory Map** — the first version my overcurious brain came up with, and honestly, this has already been such a cool and memorable project for me.

I started with an idea, broke it down into smaller problems, worked through the implementation, and watched that idea slowly turn into something real. And that feeling? That's one of the best parts of building software.

So, here we are. My own little corner of the world where places become memories, and memories become stories. 🌱

---

## 🗺️ What Is Memory Map?

Memory Map is a personal, map-based web application that lets you save the places you've visited and associate them with your own memories.

Instead of keeping all your travel photos scattered across folders and galleries, you can pin a location on a map, give the memory a title, write your notes, and attach photos or videos.

Later, you can return to the map, find your saved location, open its memory, and relive that moment.

Whether it's a solo trip, a beautiful lake you stumbled upon, a random evening walk, a trip with friends, or a place that made you smile for no particular reason — it deserves a place in your story.

### ✨ Features

- 📍 **Interactive map:** Explore locations using Leaflet and OpenStreetMap.
- 🧭 **Current location:** Use your device's geolocation to find yourself on the map.
- 🔎 **Place search:** Search for locations and jump to them on the map.
- 📌 **Save memories:** Double-click a map location to create a memory at that point.
- ✍️ **Personal notes:** Give each memory a title and write down the story behind it.
- 📸 **Multiple photos:** Attach multiple images to a single memory.
- 🎥 **Video memories:** Store videos alongside photos and play them in the memory viewer.
- 🗂️ **Memory viewer:** Open a saved map pin to view its title, notes, coordinates, photos, and videos.
- 🗑️ **Delete individual media:** Remove a specific photo or video without deleting the entire memory.
- 📝 **Edit memories:** Update a memory's title, notes, and coordinates while keeping its existing media.
- 💾 **Local persistence:** Save memories in your browser using IndexedDB so they remain available after refreshing the app.
- 🧩 **Progressive Web App groundwork:** Includes a web app manifest as a starting point for PWA capabilities.

---

## 🛠️ Built With

| Technology | What it does |
|---|---|
| HTML5 | Structures the map interface, search controls, forms, and memory viewer. |
| CSS3 | Styles the full-screen map, floating controls, forms, modals, and media gallery. |
| JavaScript | Handles application logic, user interactions, search, media management, and database operations. |
| [Leaflet](https://leafletjs.com/) | Provides the interactive map and map markers. |
| [OpenStreetMap](https://www.openstreetmap.org/) | Provides the map tile data displayed through Leaflet. |
| [Nominatim](https://nominatim.org/) | Powers place searches using OpenStreetMap data. |
| Browser Geolocation API | Requests the device's current location when supported and permitted. |
| IndexedDB | Stores memory records and their associated media locally in the browser. |

No application backend or cloud database is required for the current version.

---

## ⚙️ How It Works — Under the Hood

This is Version 1, but I wanted it to be more than just a pretty map. Here's how the important parts fit together.

### 1. Interactive Map

Leaflet initializes the map inside the `#map` element, with Bengaluru as the initial fallback view.

OpenStreetMap tiles provide the geographic background, while Leaflet markers represent saved memories.

When a memory is saved, a marker is created at its latitude and longitude. Clicking that marker opens the corresponding memory.

When a memory is edited, its existing marker is replaced with an updated marker so the map reflects the new information.

### 2. Searching for Places

The application sends a search request to the Nominatim API using the place name entered by the user.

The response contains matching locations and their coordinates. The application displays the results as selectable items.

When a result is selected, the map moves to that location and displays a marker.

This makes it possible to find a location without manually navigating the map to the exact spot.

### 3. Finding the Current Location

The browser's Geolocation API requests access to the user's current location.

If location access succeeds, the map moves to the detected position and displays a location marker and an accuracy circle.

Location access depends on browser support, permission, and a suitable secure context. The app can still be used to explore and save locations manually if geolocation is unavailable.

### 4. Creating Memories

Double-clicking the map opens the memory form.

Each memory contains:

- A title
- Optional notes
- Latitude and longitude
- Zero or more photos
- Zero or more videos
- A creation timestamp
- A database-generated ID

The selected map coordinates are automatically placed in the form, but the user can edit them before saving.

### 5. Storing Memories with IndexedDB

Memory Map uses the browser's IndexedDB database named `MemoryMapDB`, with an object store called `memories`.

Each memory is stored as a record. Photo and video files are stored as `Blob` objects inside their respective arrays.

A simplified example of a memory record looks like this:

```javascript
{
    id: 1,
    title: "Evening at the lake",
    notes: "A random evening that turned out to be beautiful.",
    lat: 12.9716,
    lon: 77.5946,
    photos: [photoBlob1, photoBlob2],
    videos: [videoBlob1],
    createdAt: "2026-10-14T12:00:00.000Z"
}
```

*The coordinates and timestamp above are illustrative examples, not a record from an actual saved memory.*

IndexedDB is useful here because it can store structured records and binary media locally, unlike simple string-based storage such as `localStorage`.

When the application starts, it reads the saved memory records and recreates their markers on the map.

### 6. Managing Photos and Videos

The file inputs allow multiple images and videos to be selected for one memory.

When the user opens a saved memory, JavaScript creates temporary object URLs for the stored media and inserts the appropriate elements into the gallery:

- Images are displayed using `<img>`.
- Videos are displayed using `<video controls>`.

These URLs let the browser display media stored in IndexedDB without uploading it to a server.

When the viewer closes or refreshes its gallery, the application revokes the temporary object URLs to release the associated browser resources.

### 7. Editing and Deleting Media

Editing a memory retrieves its existing database record and updates its text and coordinate fields.

Newly selected media is appended to the existing photo and video arrays, rather than replacing the entire collection.

Each gallery item has its own delete button. Deleting an item removes that entry from the appropriate array and saves the updated memory record back to IndexedDB.

The memory itself and its other media remain intact.

### 8. Privacy and Storage

The current version is designed around local browser storage.

- There is no application server receiving uploaded memory files.
- Memories are saved in the browser's IndexedDB database.
- Geolocation is requested through the browser's permission system.
- Place searches send the search query to Nominatim.
- Map tiles are requested from OpenStreetMap's tile service.

**Important:** Local storage is not the same as a cloud backup. Clearing browser data, losing the browser profile, or encountering storage problems can put locally saved memories at risk. Backups and data export are possible future improvements.

---

## 🚀 Getting Started

Want to run Memory Map on your own machine? Let's go!

### Prerequisites

You'll need:

- A modern web browser.
- An internet connection for map tiles and place search.
- A code editor such as [Visual Studio Code](https://code.visualstudio.com/).
- A local development server, such as the VS Code Live Server extension.

### Installation

**1. Clone the repository**

Replace `YOUR_USERNAME` with your GitHub username and `YOUR_REPOSITORY` with your repository name.

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

**2. Open the project folder**

```bash
cd YOUR_REPOSITORY
```

**3. Check the project files**

Your project should contain the following files:

```text
Memory-Map/
├── index.html
├── style.css
├── script.js
├── manifest.json
└── README.md
```

The manifest is included as PWA groundwork. If your project does not yet have a `manifest.json`, create it or remove the manifest reference from the HTML until you're ready to add it.

**4. Start a local server**

For example, if you use Visual Studio Code, open the project folder and launch it using Live Server.

Open the local URL provided by your development server in your browser.

**5. Allow location access**

If you want to use the current-location feature, allow the browser to access your location when prompted. You can still search for places and add memories manually if you decline.

### Using the App

1. Explore the map or search for a place.
2. Double-click the location where you want to save a memory.
3. Add a title and your notes.
4. Attach any photos and videos you want to preserve.
5. Save the memory.
6. Click its map marker whenever you want to revisit it.
7. Edit the memory or remove individual media items when needed.

Go outside. Find something beautiful. Save it. Repeat. 😂

---

## ⚠️ Current Limitations

This is the first version, built as a personal learning project. There are still things I would love to improve.

- **Local-only data:** Memories aren't synchronized across devices or browsers.
- **No automatic backup:** There is currently no built-in export or restore system.
- **Browser storage limits:** Large videos can consume considerable storage, and available capacity varies by browser and device.
- **Internet dependency:** The map tiles and online place search require internet access.
- **PWA groundwork only:** A manifest alone does not make an application fully installable or offline-capable; additional PWA configuration may be required.
- **No authentication or cloud sync:** The current version is designed for individual use in a local browser.
- **External service policies:** OpenStreetMap tile usage and Nominatim search are subject to their respective usage policies.

---

## 🔮 Future Ideas

The fun part? This is only Version 1. My overcurious brain has plenty of room for more ideas.

Some things I'd love to explore:

- [ ] Export and import memories for backups.
- [ ] Add dates and travel timelines.
- [ ] Filter memories by date, location, or trip.
- [ ] Create collections for different journeys.
- [ ] Add automatic thumbnails for videos.
- [ ] Improve the mobile experience.
- [ ] Explore offline map support.
- [ ] Add optional cloud backup and cross-device synchronization.
- [ ] Make the app installable as a complete Progressive Web App.
- [ ] Build a beautiful travel journal view from the memories saved on the map.

These are ideas for the future, not features that are all implemented today.

---

## 🧠 What I Learned

This project gave me an opportunity to explore how several web technologies work together in a real application.

Some of the key concepts I worked with include:

- Structuring a web application using HTML.
- Styling a full-screen, interactive interface with CSS.
- Handling events and manipulating the DOM using JavaScript.
- Working with APIs and asynchronous `fetch()` requests.
- Using Leaflet to display maps and manage markers.
- Requesting location data through the Geolocation API.
- Storing structured records and binary media using IndexedDB.
- Managing multiple files, object URLs, and media elements.
- Updating and deleting individual items without removing an entire record.
- Thinking about compatibility with previously saved data.

More importantly, I got to experience the process of turning a random idea into something tangible.

There's something special about writing code that does more than solve a practice problem. It becomes a tool you can use, a project you can improve, and a little reminder that your curiosity can lead somewhere interesting.

---

## 🤝 Contributions

This is a personal learning project, and I'm happy to learn from ideas, suggestions, and constructive feedback.

If you spot a bug, have an improvement in mind, or simply want to build something cool, feel free to open an issue or submit a pull request.

I'm still learning, experimenting, and figuring things out. That's part of the fun.

---

## ❤️ One Last Thing

Dude, life is precious.

We're so busy thinking about the future, chasing the next goal, getting the next job, earning more, and figuring out what comes next that sometimes we forget to enjoy the life we're already living.

Go on that random trip.

Visit that lake.

Take that picture even if it looks terrible.

Laugh until your stomach hurts.

Get lost in a new place. Meet people. Try things. Build weird projects because your brain won't shut up about an idea.

And when you experience a moment that makes you happy, **document it. Not because every moment needs to be posted online, but because some moments deserve to be remembered.**

Memory Map started as a random thought from my overcurious brain, and Version 1 has already become a memorable little journey of its own.

Maybe someday I'll look back at the places I've saved and remember not just where I went, but who I was when I went there.

That's the point.

**Life is too short to just work, dude. Don't waste it. Go live it. Document your smile in Memory Map. Laugh, explore, create, and enjoy the damn ride. HAHAHAHAHA.** 😂🌍

---

*Made with curiosity, code, and a genuine desire to enjoy life — one memory at a time.*

**Memory Map — Version 1.0**

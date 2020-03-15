## Media

# player-generate.js, player.js, player.css
These files form the basis of a music player with a simple layout and fast performance.
player-generate.js creates player.html which contains data for the music files and loads player.js and player.css.
player.js is the music player itself which has the following features:
1. Shows "Now Playing" and your music library
2. Now Playing is saved in local storage
2. Keys: <> move through the Now Playing playlist; SPACE acts as play/pause; arrow keys move through the library; ENTER replaces Now Playing with the current artist or album; SHIFT+ENTER adds the current artist, album, or track to Now Playing; CTRL+0 - CTRL+9 takes you to different spaces or environments

# media-generate.js

A JXA javascript for Mac OS X that recurses through a folder gathering info for movie files and associates them with matching images and external subtitles in SRT, VTT, WEBVTT formats. The code lightly parses the directory structure and filenames to identify Show, Season Number, Episode Number, and Episode Title to produce objects or JSON describing the movies and HTML pages for browsing the collection. 

# script.js

A script to be loaded in an HTML page that adds keyboard control to the first `<video>` that it finds and keeps track of your current position within the video so that you can start the video at the same spot you left it.

SPACE: Play/Pause;
SHIFT+SPACE: Cycle through subtitles;
ENTER: Toggle Fullscreen;
SHIFT+ENTER: Toggle PIP;
ARROWLEFT: back 15s;
ARROWRIGHT: forward 30s

The `currentTime` of the `video` is stored in `localStorage` using the page address as the key (origin + path only, excluding hash and search).

The current time of the video can be set using a query string like `?t=32m14s` or a hash like `#t=32m14s`.

# container-script.js

A script to be loaded in an HTML page that adds keyboard control for navigating between `<a>` links using the up and down arrow keys. Search is enabled - it first looks for a matching prefix and if nothing found, it matches anywhere within the string. or It also looks in `localStorage` to see which of the `<a>` links was most recently active (where "active" is defined by some other page that writes to `localStorage`).

# SRTVTTGather.js

If you:
1. Start with a collection of audio, video, and subtitle files
2. Create an HTML page that contains links to all those files
3. Add SRTVTTGather.js to that page

SRTVTTGather.js will:
1. Loop through all the links and match up subtitles with the matching audio or video
2. Convert SRT to WEBVTT so that subtitles can be displayed
3. Hook up all the links so that a video player with subtitles will open when you click on the links

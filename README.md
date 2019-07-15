## Media

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

The `currentTime` of the `video` is stored in localStorage using the page address as the key (origin + path only, excluding hash and search).

The current time of the video can be set using a query string like ?t=32m14s or a hash like #t=32m14s.

# SRTVTTGather.js

If you:
1. Start with a collection of audio, video, and subtitle files
2. Create an HTML page that contains links to all those files
3. Add SRTVTTGather.js to that page

SRTVTTGather.js will:
1. Loop through all the links and match up subtitles with the matching audio or video
2. Convert SRT to WEBVTT so that subtitles can be displayed
3. Hook up all the links so that a video player with subtitles will open when you click on the links

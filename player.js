"use strict";

(function (){
    function getPID() {
        var pid = document.location.pathname;
        
        if (pid.endsWith("/index.html")) {
            pid = pid.substr(0, pid.length - "index.html".length);
        }
        if (!pid.endsWith("/")) {
            pid = pid + "/";
        }
        return pid;
    }

    function ready(callback) {
        // in case the document is already rendered
        if (document.readyState != 'loading') {
            callback();
        }
        // modern browsers
        else if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', callback);
        }
        // IE <= 8
        else {
            document.attachEvent('onreadystatechange', function(){
                if (document.readyState == 'complete') {
                    callback();
                }
            });
        }
    }

    let pid = getPID();
    let player;
    let searcher;

    class Player {
        
        constructor(player, artists) {
            this.player = player;
            this.index = 0;
            this.tracks = [];
            this.groups = [];

            player.onended = ()=>{
                this.next();
                this.play();
            };

            let saved = JSON.parse(localStorage.getItem(pid + "player"));

            if (saved) {
                // TODO - error handling
                // Map saved data back to shared objects
                function trackToTrack(o) {
                    let artist = artists.find(artist => artist.name === o.artist);
                    let album = artist.albums.find(album => album.name === o.album);
                    let track = album.tracks.find(t => t.name === o.track);
                    return { artist, album, track };
                }
                this.tracks = saved.tracks.map(trackToTrack);
                this.index = saved.index;
                this.groups = saved.groups;

                this.player.src = this.current.track.url;

                this.updateUI();
            }
        }

        get current() {
            return this.tracks[this.index];
        }

        updateUI() {
            const o = this.current;
            document.title = `${o.track.name} - ${o.artist.name} (${this.index + 1}/${this.tracks.length})`;

            let data = [
                { selector: "#now-playing-artist", value: o.artist.name},
                { selector: "#now-playing-album", value: o.album.name},
                { selector: "#now-playing-track", value: o.track.name},
                { selector: "#now-playing-track-number", value: this.index + 1},
                { selector: "#now-playing-track-count", value: this.tracks.length},
            ];

            data.forEach(d => {
                let e = document.querySelector(d.selector);
                e.innerText = d.value;
            });

            /*let np = document.getElementById("now-playing");
            // ➼ 
            np.innerText = `${o.track.name} ◆ ${o.artist.name} ◆ ${o.album.name} ◆ ${this.index + 1}/${this.tracks.length}`;*/
        }

        updateStorage() {
            const toSave = {
                index: this.index,
                groups: this.groups,
                tracks: this.tracks.map(track => {
                    return { artist: track.artist.name, album: track.album.name, track: track.track.name, url: track.track.url };
                })
            };

            localStorage.setItem(pid + "player", JSON.stringify(toSave, null, 2));
        }

        setCurrent(index) {
            if (this.tracks.length <= 0) {
                return;
            }

            if (index > this.tracks.length - 1) {
                index = 0;
            }
            
            if (index < 0) {
                index = this.tracks.length - 1;
            }

            this.index = index;

            if (this.current_ !== this.current.track.url) {
                this.current_ = this.current.track.url;

                const wasPlaying = !this.player.paused;

                this.player.src = this.current.track.url;
                
                if (wasPlaying && this.player.paused) {
                    this.play();
                }
            }

            this.updateUI();
            this.updateStorage();
        }

        next() {
            this.setCurrent(this.index + 1);
        }

        nextGroup() {
            let index = this.index + 1;
            let groups = this.groups;
            let groupIndex = groups.find(group => group >= index);
            if (groupIndex !== undefined) {
                index = groupIndex;
            } else {
                index = groups[0] || 0;
            }
            this.setCurrent(index);
        }

        previousGroup() {
            let index = this.index - 1;
            let groups = [...this.groups].reverse();
            let groupIndex = groups.find(group => group <= index);
            if (groupIndex !== undefined) {
                index = groupIndex;
            } else {
                index = groups[0] || 0;
            }
            this.setCurrent(index);
        }

        previous() {
            this.setCurrent(this.index - 1);
        }

        play() {
            this.player.play();
            document.querySelector("#now-playing").setAttribute("playing", true);
        }

        pause() {
            this.player.pause();
            document.querySelector("#now-playing").removeAttribute("playing");
        }

        togglePlay() {
            if (this.player.paused) {
                this.play();
            } else {
                this.pause();
            }
        }

        setNowPlaying(tracks, index) {
            this.tracks = tracks;
            this.groups = [0];
            this.setCurrent(index || 0);
        }

        setNextPlaying(tracks) {
            this.groups.push(this.tracks.length);
            this.tracks.push(...tracks);

            /*let index = this.player.paused ? this.index : this.index + 1;
            this.tracks.splice(index, 0, ...tracks);*/
            this.setCurrent(this.index || 0);
        }
    }

    class Menu {
        //data;
        //index = 0;

        constructor() {
            this.index = 0;
        }

        wrap(item) {
            return item;
        }

        get current() {
            return this.wrap(this.data[this.index]);
        }

        setCurrent(index) {
            if (index > this.data.length - 1) {
                index = 0;
            }
            
            if (index < 0) {
                index = this.data.length - 1;
            }

            this.index = index;
        }

        next() {
            this.setCurrent(this.index + 1);
        }

        previous() {
            this.setCurrent(this.index - 1);
        }

        descend() {
        }
    }

    class AlbumTracksMenu extends Menu {
        //artist;
        //album;

        get track() {
            return this.current.track;
        }

        constructor(artist, album) {
            super();
            this.artist = artist;
            this.album = album;
            this.data = album.tracks;
        }

        descend() {
        }

        wrap(item) {
            return { name: item.name, artist: this.artist, album: this.album, track: item };
        }
    }

    class ArtistAlbumsMenu extends Menu {
        //artist;

        get album() {
            return this.current.album;
        }

        constructor(artist) {
            super();
            this.artist = artist;
            this.data = artist.albums;
        }

        descend() {
            return new AlbumTracksMenu(this.artist, this.album);
        }

        wrap(item) {
            return { name: item.name, artist: this.artist, album: item };
        }
    }

    class ArtistsMenu extends Menu {
        //artists;

        get artist() {
            return this.current.artist;
        }

        constructor(artists) {
            super();
            this.artists = artists;
            this.data = artists;

            let saved = JSON.parse(localStorage.getItem(pid + "artist"));
            if (saved) {
                let index = this.artists.findIndex(artist => artist.name === saved.name);
                if (index >= 0) {
                    this.index = index;
                }
            }
        }

        setCurrent(index) {
            super.setCurrent(index);
            let toSave = { name: this.current.name };
            localStorage.setItem(pid + "artist", JSON.stringify(toSave, null, 2));
        }

        descend() {
            return new ArtistAlbumsMenu(this.artist);
        }

        wrap(item) {
            return { name: item.name, artist: item };
        }
    }

    class MenuStack {
        // stack;

        constructor(root) {
            this.stack = [root];
        }

        get current() {
            return this.stack[this.stack.length - 1];
        }

        updateUI() {
            let selectors = ["#library-artist", "#library-album", "#library-track"];
            let s = selectors.forEach((s, n) => {
                let m = this.stack[n];
                let o = { selector: s, name: m ? m.current.name : "" };
                let e = document.querySelector(o.selector);
                let selected = ((n + 1) === this.stack.length);
                if (!selected) {
                    e.removeAttribute("data-selected"); 
                } else {
                    e.setAttribute("data-selected", selected); 
                }
                e.innerText = o.name;
            });
        }

        setCurrent(index) {
            this.current.setCurrent(index);
            this.updateUI();
        }

        next() {
            this.current.next();
            this.updateUI();
        }

        previous() {
            this.current.previous();
            this.updateUI();
        }

        activate(shift) {
            let item = this.current.current;

            let tracks;
            let index = 0;

            function getAlbumTracks(artist, album) {
                return album.tracks.map(track => {
                    return { artist, album, track, name: track.name };
                });
            }

            function getArtistTracks(artist) {
                return artist.albums.flatMap(album => {
                    return getAlbumTracks(artist, album);
                });
            }

            if (item.album) {
                tracks = getAlbumTracks(item.artist, item.album);
            } else {
                tracks = getArtistTracks(item.artist);
            }

            if (item.track) {
                if (shift) {
                    tracks = [item];
                    index = 0;
                } else {
                    index = tracks.findIndex(track => item.track === track.track);
                }
            }
            
            if (tracks) {
                if (!shift) {
                    player.setNowPlaying(tracks, index);
                } else {
                    player.setNextPlaying(tracks);
                }
                player.play();
            }
        }

        ascend() {
            if (this.stack.length > 1) {
                this.stack.pop();
            }
            this.updateUI();
        }

        descend() {
            let result = this.current.descend();
            if (result) {
                this.stack.push(result);
            }
            this.updateUI();
        }
    }

    class Searcher {
        constructor(menu) {
            this.menu = menu;
            this.searchPrefix = "";
            this.searchConsumesSpace = false;
            this.searchTimeout = undefined;
        }

        focusByPrefix(prefix) {
            function searchable(text) {
                return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]|[.']/g, "");
            }

            let lower = searchable(prefix);
            let m = this.menu.stack[0];
            let targets = m.data;
            let nextIndex = targets.findIndex(t => searchable(t.name).startsWith(lower));
            if (nextIndex < 0) {
                nextIndex = targets.findIndex(t => searchable(t.name).includes(lower));
            }
            if (nextIndex >= 0) {
                this.menu.stack = [m];
                this.menu.setCurrent(nextIndex);
            }
        }

        addToSearch(letter) {
            this.searchPrefix += letter;
            this.searchConsumesSpace = true;
            clearTimeout(this.searchTimeout);
    
            this.focusByPrefix(this.searchPrefix);
    
            this.searchTimeout = setTimeout(()=> { this.searchPrefix = ""; this.searchConsumesSpace = false; }, 0.5 * 1000);
        }
    }

    function init() {
        player = new Player(document.getElementById("player"), artists);

        let menu = new MenuStack(new ArtistsMenu(artists));
        menu.updateUI();

        searcher = new Searcher(menu);

        function onKeyDown(key, shift) {
            switch (key) {
                case " ": {
                    player.togglePlay();
                    return true;
                }
                case "Enter": {
                    menu.activate(shift);
                    return true;
                }
                case "ArrowDown": {
                    menu.descend();
                    return true;
                }
                case "Backspace": // fallthrough
                case "ArrowUp": {
                    menu.ascend();
                    return true;
                }
                case "ArrowLeft": {
                    menu.previous();
                    return true;
                }
                case "ArrowRight": {
                    menu.next();
                    return true;
                }
                case "<": {
                    player.previousGroup();
                    return true;
                }
                case ",": {
                    player.previous();
                    return true;
                }
                case ">": {
                    player.nextGroup();
                    return true;
                }
                case ".": {
                    player.next();
                    return true;
                }
                /*case "Backspace": {
                    window.history.back();
                    return true;
                }*/
            }
        }

        document.onkeydown = function onkeydown(evt) {
            evt = evt || window.event;

            let handled = false;
            if (!evt.getModifierState("Meta") && !evt.getModifierState("Control")) {
                if (searcher.searchConsumesSpace && evt.keyCode === 32) {
                    searcher.addToSearch(" ");
                    handled = true;
                }
                if (((65 <= evt.keyCode) && (evt.keyCode < 65+26)) || ((48 <= evt.keyCode) && (evt.keyCode < 48+10))) {
                    let letter = String.fromCharCode(evt.keyCode); // works in this range
                    searcher.addToSearch(letter);
                    handled = true;
                }
            }

            if (!handled) {
                handled = onKeyDown(evt.key, evt.getModifierState("Shift"));
            }

            if (handled) {
                evt.stopPropagation();
                evt.preventDefault();
            }
        }

    }
    
    ready(init);
})();
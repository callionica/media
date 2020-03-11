"use strict";

(function (){
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

    let player;
    let searcher;

    class Player {
        
        constructor(player) {
            this.player = player;
            this.index = 0;
            this.tracks = [];

            player.onended = ()=>{
                this.next();
                this.play();
            };
        }

        get current() {
            return this.tracks[this.index];
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

             // TODO
            const o = this.current;
            document.title = `${o.track.name} - ${o.artist.name} (${this.index + 1}/${this.tracks.length})`;

            let np = document.getElementById("now-playing");
            np.innerText = `➼ ${o.track.name} ◆ ${o.artist.name} ◆ ${o.album.name} ◆ ${this.index + 1}/${this.tracks.length}`;
        }

        next() {
            this.setCurrent(this.index + 1);
        }

        previous() {
            this.setCurrent(this.index - 1);
        }

        play() {
            this.player.play();
        }

        pause() {
            this.player.pause();
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
            this.setCurrent(index || 0);
        }

        setNextPlaying(tracks) {
            let index = this.player.paused ? this.index : this.index + 1;
            this.tracks.splice(index, 0, ...tracks);
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
            let container = document.querySelector("h1");

            /*let text = this.stack.map(m => m.current.name).join(" / ");
            container.innerText = text;*/

            container.innerText = "";
            this.stack.forEach(m => {
                let e = document.createElement("div");
                e.innerText = m.current.name;
                container.appendChild(e);
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
        player = new Player(document.getElementById("player"));
        player.setNowPlaying([]);

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
                case ",": {
                    player.previous();
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
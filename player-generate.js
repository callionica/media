"use strict";

(function () {
    
    const stage0 = [
        "/Volumes/Yellow02/media-itunes/iTunes Media/Music/",
        "/Volumes/Yellow02/music/"
    ];
    
    const destination = "/Volumes/Yellow02/musicweb/";
    
    const skipStage1 = true;
    const skipStage2 = true;

    const stage1 = destination + "stage1.json";
    const stage2 = destination + "stage2.json";

    ////////////////////////////////////////////////

    const app = Application.currentApplication();
    app.includeStandardAdditions = true;

    ObjC.import('Foundation');
    ObjC.import('AppKit');

    let path = $.NSString.alloc.initWithUTF8String(app.pathTo(this)).stringByDeletingLastPathComponent.js + "/";

    path = "/Users/user/Documents/media/"; // TODO

    const fm = $.NSFileManager.defaultManager;
    const workspace = $.NSWorkspace.sharedWorkspace;

    function mimetype_from_type(type) {
        if (type == "public.mpeg-2-transport-stream") {
            return "video/mp2t";
        }
        return ObjC.unwrap($.UTTypeCopyPreferredTagWithClass(type, $.kUTTagClassMIMEType));
    }

    function is_audio(value) {
        var type = value.type || value;
        return workspace.typeConformsToType(type, $.kUTTypeAudio);
    }

    function is_image(value) {
        var type = value.type || value;
        return workspace.typeConformsToType(type, $.kUTTypeImage);
    }

    // Read a UTF8 file at a given path and return a JS string
    function read_file(path) {
        if (path.startsWith("file:")) {
            var url = $.NSURL.URLWithString(path);
            path = url.path.js;
        }
        let data = fm.contentsAtPath(path.toString()); // NSData
        let contents = $.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding);
        if (contents.isNil()) {
            contents = $.NSString.alloc.initWithDataEncoding(data, $.NSWindowsCP1252StringEncoding);
        }
        if (contents.isNil()) {
            contents = $.NSString.alloc.initWithDataEncoding(data, $.NSMacOSRomanStringEncoding);
        }
        return ObjC.unwrap(contents);
    };

    // Write a UTF8 file at a given path given a JS string
    function write_file(path, contents) {
        let s = ObjC.wrap(contents);
        s.writeToFileAtomicallyEncodingError(path.toString(), true, $.NSUTF8StringEncoding, null);
    }

    function create_directory(path) {
        var d = $.NSDictionary.alloc.init;
        var url = $.NSURL.alloc.initFileURLWithPath(path);
        fm.createDirectoryAtURLWithIntermediateDirectoriesAttributesError(url, true, d, null);
    }

    function name_without_extension(name) {
        var index = name.lastIndexOf(".");
        if (index >= 0) {
            return name.substr(0, index);
        }
        return name;
    }

    // Return an array of strings containing the names of the files within the given directory and subdirectories
    function get_files(path) {

        function is_directory(url) {
            var value = $();
            url.getResourceValueForKeyError(value, $.NSURLIsDirectoryKey, null)
            return value.boolValue;
        }

        function get_type(url) {
            var value = $();
            url.getResourceValueForKeyError(value, $.NSURLTypeIdentifierKey, null)
            return value.js;
        }

        var directoryURL = $.NSURL.fileURLWithPath(path); // URL pointing to the directory you want to browse
        var keys = $.NSArray.arrayWithObjects($.NSURLIsDirectoryKey, $.NSURLTypeIdentifierKey);

        var e = fm.enumeratorAtURLIncludingPropertiesForKeysOptionsErrorHandler(directoryURL, keys, 1 << 2, null);

        var o = e.allObjects.js;

        return o.filter(url => !is_directory(url)).map(function (url) {
            var components = url.pathComponents.js.map(c => c.js);
            var type = get_type(url);
            var linkTo;
            if (type == "public.symlink") {
                linkTo = url.URLByResolvingSymlinksInPath;
                type = get_type(linkTo);
            }
            let mimetype = mimetype_from_type(type);
            let extension = url.pathExtension.js;
            if (!mimetype) {
                if (extension === "ttml") {
                    mimetype = "application/ttml+xml";
                }
            }
            return {
                url: url.absoluteString.js,
                path: url.path.js,
                linkTo: linkTo ? linkTo.absoluteString.js : undefined,
                components,
                name: name_without_extension(url.lastPathComponent.js),
                extension,
                type,
                mimetype
            };
        });
    }

    function get_url_relative_to(url, base) {
        var c1 = url.split("/");
        var c2 = base.split("/");
    
        var i = 0;
        while (i < c1.length && i < c2.length && c1[i] == c2[i]) {
            ++i;
        }
        
        var up = "../".repeat(c2.length - 1 - i);
        var down = c1.slice(i).join("/");
        
        return up + down;
    }

    ////////////////////////////////////////////////////////////////////

    function crunch(text) {
        var nstext = ObjC.wrap(text); // NSString
        var options = $.NSCaseInsensitiveSearch | $.NSDiacriticInsensitiveSearch | $.NSWidthInsensitiveSearch;
        var locale = $.NSLocale.systemLocale;
        var result = nstext.precomposedStringWithCompatibilityMapping.stringByFoldingWithOptionsLocale(options, locale);
        return ObjC.unwrap(result);
    }

    function url_crunch(text) {
        // Lowercase and diacritic removal
        var c1 = crunch(text);

        // Remove punctuation except dashes & periods
        c1 = c1.replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\/:;<=>?@\[\]^_`{|}~]/g, "");

        // Convert northern european letters
        c1 = c1.replace(/å/g, "aa");
        c1 = c1.replace(/ø|ö|œ/g, "oe");
        c1 = c1.replace(/æ/g, "ae");

        // Collapse to english 26 and digits
        c1 = c1.replace(/[^a-z0-9]/g, "-");

        // Coalesce dashes
        c1 = c1.replace(/-{2,}/g, "-");

        // Remove trailing dash
        c1 = c1.replace(/-$/g, "");

        return c1;
    }


    function mdls(path) {

        function decode(value) {
            value = value.replace(/\\U/g, "\\u");
            value = value.replace(/\\"/g, `"`);
            value = value.replace(/"/g, `\\"`);
            let json = `{ "result" : "${value}" }`;
            try {
                return JSON.parse(json).result;
            } catch (e) {
                console.log(json);
                throw json;
            }
        }

        function cleanupName(name) {
            if (name.startsWith("kMDItem")) {
                name = name.substring("kMDItem".length);
            }
            return name;
        }

        function cleanupValue(value) {
            if (value.endsWith(",")) {
                value = value.substring(0, value.length - 1);
            }

            if (value.startsWith('"')) {
                value = value.substring(1, value.length - 1);
                value = decode(value);
            }

            return value;
        }

        let text = "";
        try {
            text = app.doShellScript(`mdls "${path}"`);
        } catch (e) {
            return {};
        }

        let lines = text.split("\r");

        let state = "property"; // "property", "list"
        let name;
        let value;

        let result = {};
        for (let line of lines) {
            switch (state) {
                case "property": {
                    [name, value] = line.split("=");
                    name = cleanupName(name.trim());
                    value = value.trim();
                    if (value === "(") {
                        state = "list";
                        value = [];
                        result[name] = value;
                    } else if (value === "(null)") {
                        // Do nothing
                    } else {
                        result[name] = cleanupValue(value);
                    }
                    break;
                }
                case "list": {
                    let v = line.trim();
                    if (v === ")") {
                        state = "property";
                    } else {
                        value.push(cleanupValue(v));
                    }
                }
            }
        }

        return result;
    }

    function metadata(file) {
        return { ...file, ...mdls(file.path) };
    }

    create_directory(destination);

    let s1;

    if (!skipStage1) {
        let files = [];
        for (let location of stage0) {
            files.push(...get_files(location));
        }
        
        let audios = files.filter(is_audio);
        s1 = audios.map(metadata);

        write_file(stage1, JSON.stringify(s1, null, 2));
    } else {
        s1 = JSON.parse(read_file(stage1));
    }

    function ensure(array, name, create) {
        let key = url_crunch(name);
        let found = array.find(item => item.key === key);
        if (found) {
            return found;
        }
        let item = create(name, key);
        array.push(item);
        return item;
    }

    function createArtist(name, key) {
        return { name, key, kind: "artist", albums: [] };
    }

    function createAlbum(name, key) {
        return { name, key, kind: "album", tracks: [] };
    }

    function doStage2(files) {
        let artists = [];
        for (let file of files) {
            let last = file.components.length - 1;
            let albumName = file.Album || file.components[last - 1];
            // mdls doesn't give us the album artist so we have to use the folder
            let artistName = /*(file.Authors && file.Authors[0]) ||*/ file.components[last - 2].replace(/_/g, "");

            let artist = ensure(artists, artistName, createArtist);
            let album = ensure(artist.albums, albumName, createAlbum);

            album.tracks.push(file);
        }

        write_file(stage2, JSON.stringify(artists, null, 2));

        return artists;
    }

    let s2;
    if (!skipStage2) {
        s2 = doStage2(s1);
    } else {
        s2 = JSON.parse(read_file(stage2));
    }

    function generateArtists(fileURL, artists) {
        
        function generateArtist(artist) {
            return `<div class="artist" id="${artist.key}"><a href="./${artist.key}/index.html"><span class="artist-name">${artist.name}</span></a></div>`;
        }

        return `
<html>
<head>
<title>Artists</title>
<link rel="stylesheet" type="text/css" href="player.css">
<script src="container-script.js"></script>
</head>
<body data-page="groups">
<h1>Artists</h1>
<div class="artist-list">
${artists.map(generateArtist).join("\n")}
</div>
</body>
</html>
`;
    }

    function generateArtist(fileURL, artist) {
        let albums = artist.albums.map(album => {
            return {
                name: album.name,
                key: album.key,
            };
        });

        function generateAlbum(album) {
            return `<div class="album" id="${album.key}"><a href="./${album.key}/index.html"><span class="album-name">${album.name}</span></a></div>`;
        }

        return `
<html>
<head>
<title>${artist.name}</title>
<link rel="stylesheet" type="text/css" href="../player.css">
<script src="../container-script.js"></script>
<script>
let albums = ${JSON.stringify(albums, null, 2)};
let artist = ${JSON.stringify({ name: artist.name, key: artist.key }, null, 2)};
</script>
</head>
<body data-page="groups">
<h1><span class="artist-name">${artist.name}</span></h1>
<div class="album-list">
${albums.map(generateAlbum).join("\n")}
</div>
</body>
</html>
`;
    }

    function generateAlbum(fileURL, artist, album) {

        function generateTrack(track) {
            return `<div class="track"><span class="track-number">${track.number || ""}</span> <span class="track-name">${track.name || "Untitled"}</span></div>`;
        }

        let simpleAlbum = {
            name: album.name,
            key: album.key,
            tracks: album.tracks.map(track => {
                return {
                    name: track.Title,
                    number: track.AudioTrackNumber,
                    url: get_url_relative_to(track.url, fileURL),
                };
            })
        };

        return `
<html>
<head>
<title>${album.name} - ${artist.name}</title>
<link rel="stylesheet" type="text/css" href="../../player.css">
<script>
let album = ${JSON.stringify(simpleAlbum, null, 2)};
let artist = ${JSON.stringify({ name: artist.name, key: artist.key }, null, 2)};
let tracks = album.tracks;
</script>
<script src="../../album-player.js"></script>
</head>
<body data-page="groups">
<h1><span class="album-name">${album.name}</span></h1>
<h2><a href="../index.html"><span class="artist-name">${artist.name}</span></a></h2>
<div class="track-list">
${simpleAlbum.tracks.map(generateTrack).join("\n")}
</div>
<video id="player" src="${simpleAlbum.tracks[0].url}"></video>
</body>
</html>
`;
    }

    function doStage3Artists(artist) {
        let directory = destination;
        create_directory(directory);

        let fileName = directory + `index.html`;
        let fileURL = $.NSURL.alloc.initFileURLWithPath(fileName).absoluteString.js;

        let content = generateArtists(fileURL, artist);
        write_file(fileName, content);
    }

    function doStage3Artist(artist) {
        let directory = destination + `${artist.key}/`;
        create_directory(directory);

        let fileName = directory + `index.html`;
        let fileURL = $.NSURL.alloc.initFileURLWithPath(fileName).absoluteString.js;

        let content = generateArtist(fileURL, artist);
        write_file(fileName, content);
    }

    function doStage3Album(artist, album) {
        let directory = destination + `${artist.key}/${album.key}/`;
        create_directory(directory);

        let fileName = directory + `index.html`;
        let fileURL = $.NSURL.alloc.initFileURLWithPath(fileName).absoluteString.js;

        let content = generateAlbum(fileURL, artist, album);
        write_file(fileName, content);
    }

    function doStage3(artists) {
        doStage3Artists(artists);
        for (let artist of artists) {
            doStage3Artist(artist);
            for (let album of artist.albums) {
                doStage3Album(artist, album);
            }
        }
    }

    function doStage4(artists) {
        
        function simplify(fileURL, artists) {
            return artists.map(artist => {
                return {
                    name: artist.name,
                    key: artist.key,
                    albums: artist.albums.map(album => {
                        return {
                            name: album.name,
                            key: album.key,
                            tracks: album.tracks.map(track => {
                                return {
                                    name: track.Title || track.name,
                                    number: track.AudioTrackNumber,
                                    url: get_url_relative_to(track.url, fileURL),
                                };
                            })
                        };
                    })
                };
            });
        }

        function generatePlayer(fileURL, artists) {
            artists = simplify(fileURL, artists);
    
            return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Player</title>
    <link rel="stylesheet" type="text/css" href="player.css">
    <script>
    let artists = ${JSON.stringify(artists, null, 2)};
    </script>
    <script src="player.js"></script>
    </head>
    <body>
    <div id="environment"></div>
    <div id="now-playing">
    <div id="now-playing-track"></div>
    <div id="now-playing-artist"></div>
    <div id="now-playing-album"></div>
    <div id="now-playing-track-number"></div><div id="now-playing-track-count"></div>
    </div>
    <div id="library">
    <div id="library-artist"></div>
    <div id="library-album"></div>
    <div id="library-track"></div>
    <div id="library-current-number"></div><div id="library-current-count"></div>
    </div>
    <video id="player" src=""></video>
    </body>
    </html>
    `;
        }

        let directory = destination;
        create_directory(directory);

        let fileName = directory + `player.html`;
        let fileURL = $.NSURL.alloc.initFileURLWithPath(fileName).absoluteString.js;

        let content = generatePlayer(fileURL, artists);
        write_file(fileName, content);
    }

    doStage3(s2);

    doStage4(s2);

    const sources = ["player.css", "player.js", "container-script.js"];
	
	sources.forEach(source => {
		var command = `cp "${path + source}" "${destination + source}"`;
		app.doShellScript(command);
	});

})();
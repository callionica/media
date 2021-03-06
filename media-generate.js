"use strict";
ObjC.import('Foundation');

var app = Application.currentApplication();
app.includeStandardAdditions = true;

var path = $.NSString.alloc.initWithUTF8String(app.pathTo(this)).stringByDeletingLastPathComponent.js + "/";

var fm = $.NSFileManager.defaultManager;

var create_directory = function (path) {
	var d = $.NSDictionary.alloc.init;
	var url = $.NSURL.alloc.initFileURLWithPath(path);
	fm.createDirectoryAtURLWithIntermediateDirectoriesAttributesError(url, true, d, null);
};

// Read a UTF8 file at a given path and return a JS string
var read_file = function (path) {
	if (path.startsWith("file:")) {
		var url = $.NSURL.URLWithString(path);
		path = url.path.js;
	}
	var data = fm.contentsAtPath(path.toString()); // NSData
	var contents = $.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding);
	if (contents.isNil()) {
		contents = $.NSString.alloc.initWithDataEncoding(data, $.NSWindowsCP1252StringEncoding);
	}
	if (contents.isNil()) {
		contents = $.NSString.alloc.initWithDataEncoding(data, $.NSMacOSRomanStringEncoding);
	}
	return ObjC.unwrap(contents);
};

// Write a UTF8 file at a given path given a JS string
var write_file = function (path, contents) {
	var s = ObjC.wrap(contents);
	s.writeToFileAtomicallyEncodingError(path.toString(), true, $.NSUTF8StringEncoding, null);
};

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
		var path = url.pathComponents.js.map(c => c.js);
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
			linkTo: linkTo ? linkTo.absoluteString.js : undefined,
			path: path,
			parent: path[path.length - 2],
			name: name_without_extension(url.lastPathComponent.js),
			extension,
			type,
			mimetype
		};
	});
}

var require = function (path) {
  var module = { exports: {} };
  var exports = module.exports;
  eval(read_file(path));

  return module.exports;
};

var alert = function (text, informationalText) {
  var options = { };
  if (informationalText) options.message = informationalText;
  app.displayAlert(text, options);
};

// Now you can do array.sort(sort_by(x => x.prop));
function sort_by(keyFn) {
	return function sorter(a, b) {
		var keyA = keyFn(a);
		var keyB = keyFn(b);
		if (keyA < keyB) return -1;
		if (keyA > keyB) return  1;
		return 0;
	}
}

function removePrefix(text, prefix) {
	if (text.startsWith(prefix)) {
		return text.substring(prefix.length);
	}
	return text;
}

function removeSuffix(text, suffix) {
	if (text.endsWith(suffix)) {
		return text.substring(0, text.length - suffix.length);
	}
	return text;
}

////////////////////////////////////////////////////////////////////

function mdls(path) {

        function decode(value) {
            value = value.replace(/\\U/g, "\\u");
			let json = `{ "result" : ${value} }`;
            return JSON.parse(json).result;
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
                value = decode(value);
            }

            return value;
        }

        let text = app.doShellScript(`mdls "${path}"`);
        let lines = text.split("\r");

        let state = "property"; // "property", "list"
        let name;
        let value;

        let result = {};
        for (let line of lines) {
            switch (state) {
                case "property":{
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
                        console.log(value);
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

////////////////////////////////////////////////////////////////////

function crunch(text) {
	var nstext = ObjC.wrap(text); // NSString
	var options = $.NSCaseInsensitiveSearch | $.NSDiacriticInsensitiveSearch | $.NSWidthInsensitiveSearch;
	var locale = $.NSLocale.systemLocale;
    var result = nstext.precomposedStringWithCompatibilityMapping.stringByFoldingWithOptionsLocale(options,  locale);
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
	
	c1 = c1.replace(/-{2,}/g, "-"); // Coalesce dashes
	
	return c1;
}

////////////////////////////////////////////////////////////////////

ObjC.import('AppKit');


var workspace = $.NSWorkspace.sharedWorkspace;

function extension_from_type(type) {
	var result = ObjC.unwrap($.UTTypeCopyPreferredTagWithClass(type, $.kUTTagClassFilenameExtension));
	return result;
}

function mimetype_from_type(type) {
	if (type == "public.mpeg-2-transport-stream") {
		return "video/mp2t";
	}
	return ObjC.unwrap($.UTTypeCopyPreferredTagWithClass(type, $.kUTTagClassMIMEType));
}

function is_movie(value) {
	var type = value.type || value;
	return workspace.typeConformsToType(type, $.kUTTypeMovie);
}

function is_audio(value) {
	var type = value.type || value;
	return workspace.typeConformsToType(type, $.kUTTypeAudio);
}

function is_image(value) {
	var type = value.type || value;
	return workspace.typeConformsToType(type, $.kUTTypeImage);
}

function is_subtitle(value) {
	var extension = value.extension || extension_from_type(value.type || value);
	return ["srt", "vtt", "webvtt", "ttml"].includes(extension.toLowerCase());
}

function is_text(value) {
	var extension = value.extension || extension_from_type(value.type || value);
	return ["txt"].includes(extension.toLowerCase());
}

////////////////////////////////////////////////////////////////////

ObjC.import('CoreMedia');
ObjC.import('AVFoundation');

// Warning: slow!
function get_duration(file) {
	var url = $.NSURL.URLWithString(file.url);
	var asset = $.AVURLAsset.URLAssetWithURLOptions(url, ObjC.wrap({}));
	var durationSeconds = $.CMTimeGetSeconds(asset.duration);
	return durationSeconds;
}

////////////////////////////////////////////////////////////////////

function tag2lang_(tag) {
	var t = tag.toLowerCase();
	var data = [
		["en", "en-us", "en-gb"],
		["da", "da-dk", "dansk", "dansk1", "dansk2", "kommentar", "non-dansk"],
		["de", "de-de", "deutsch", "german"],
		["no", "norsk", "norwegian"],
		["sv", "sv-se", "se", "svenska", "swedish"],
		["fr", "français", "francais", "french"],
		["es", "espagnol", "spanish"],
	];

	var lang;
	data.some(function (d) {
		if (d.indexOf(t) >= 0) {
			lang = d[0];
			return true;
		}
	});
	
	return lang;
}

function tag2lang(tag) {
	return tag2lang_(tag) || "en";
}

function tags2lang(tags) {
	var lang;
	tags.some(tag => {
		lang = tag2lang_(tag);
		return lang;
	});
	return lang || "en";
}

function container_key(obj) {
	return url_crunch(obj.container) + (obj.subcontainer ? ("/" + url_crunch(obj.subcontainer)) : "");
}

function get_media_groups(files) {
	files.forEach(file => {
		if (is_movie(file)) {
			file.category = "movie";
			
			// Getting the duration is incredibly slow!
			// file.duration = get_duration(file);
		}
		else if (is_audio(file)) {
			file.category = "audio";
		}
		else if (is_image(file)) {
			file.category = "image";
		}
		else if (is_subtitle(file)) {
			file.category = "subtitle";
		}
		else if (is_text(file)) {
			file.category = "text";
		}
		else {
			file.category = "unknown";
		}
		
		// The core name for a media file is its name without the quality suffix (HD) or (SD) etc
		file.core_name = file.name;
		var rxq = /^(.*) \(((1080p?)?\s*([HS]D)?)\)$/ig;
		var mq = rxq.exec(file.name);
		if (mq) {
			file.core_name = mq[1];
			file.quality = mq[2];
		}
		
		// The container is the parent folder
		file.container = file.parent;
				
		// Unless the parent folder is for a season, in which case the container is the grandparent
		var rx = /^(Season )?(\d+)$/gi;
		var m = rx.exec(file.container);
		if (m) {
			file.container = file.path[file.path.length - 3];
			file.subcontainer = file.parent;
			file.season = parseInt(m[2], 10);
		}

		file.container_key = container_key(file);
				
		// The key for a movie is it's url-simplified core name (no HD, no extension)
		// Show - 01-01 Ep1.mp4 and Show - 01-01 Ep1 (HD).m4v have the same key
		file.key = url_crunch(file.core_name);

		if (file.key.startsWith(file.container_key + "-")) {
			file.key = removePrefix(file.key, file.container_key + "-");
		} else {
			var ck = url_crunch(file.container);
			file.key = removePrefix(file.key, ck + "-");
		}
		
		file.key = removePrefix(file.key, "series-");
	});
	
	// TODO - sort within containers & sort articles
	var movies    = files.filter(file => (file.category == "movie") || (file.category == "audio")).sort((a, b) => { return a.name.localeCompare(b.name, "en", { numeric: true }); });
	var subtitles = files.filter(file => file.category == "subtitle");
	var images    = files.filter(file => file.category == "image");
	var texts     = files.filter(file => file.category == "text");
	
	// var audios    = files.filter(file => file.category == "audio");

	movies.forEach(movie => {

		// File names can be:
		// "TV Show - 01-01 Episode.mp4" // Show Season Episode Name
		// "TV Show - 1. Episode.mp4" // Show Episode Name
		// "01-01 Episode.mp4" // Season Episode Name
		// "01 Episode.mp4" // Episode Name
		// "01.mp4" // Episode
		var possibles = [
			/^((?<show>.*) - )?Series (?<season>\d{1,4}) - (?<episode>Episode (?<episodeNumber>\d{1,4}))$/ig,
			/^((?<show>.*) - )?Series (?<season>\d{1,4}) - (Episode )?(?<episodeNumber>\d{1,4})[.]?\s*(?<episode>.*)$/ig,
			/^((?<show>.*) - )?Series (?<season>\d{1,4}) - (?<episode>.*)$/ig,
			/^((?<show>.*) - )?(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})\s*(?<episode>.*)$/ig,
			/^((?<show>.*) - )?(?<season>\d{1,4})-(?<episodeNumber>\d{1,4})\s*(?<episode>.*)$/ig,
			/^((?<show>.*) - )?(?<episodeNumber>\d{1,4})[.]?\s*(-)?\s*(?<episode>.*)$/ig,
			/^((?<show>.*) - )?(?<episode>Episode (?<episodeNumber>\d{1,4}))$/ig,
		];
		
		var m;		
		for (var possible of possibles) {
			m = possible.exec(movie.core_name);
			if (m) {
				break;
			}
		}
		
		if (m) {
				var t = m.groups.show;
				var a = m.groups.season;
				var b = m.groups.episodeNumber;
				var c = m.groups.episode;
				
				if (m.groups.year) {
					a = m.groups.year;
				}
				
				if (m.groups.month && m.groups.day) {
					b = m.groups.month + m.groups.day;
				}
				
				if (t == null) {
					t = movie.container;
				}
				
				movie.show = t.trim();
				if (a != null) {
					movie.season = parseInt(a, 10);
				}
				movie.episode = parseInt(b, 10);
				movie.episode_name = c.trim();
				
				if (movie.episode_name == "") {
					// Delay generating episode names until we've gathered all the related files
				}
				
				// iTunes replaces characters like : and ? with _
				// so to clean this up, replace underscores with spaces then clean up the extra spaces
				movie.episode_name = movie.episode_name.replace(/_/g, " ");
				movie.episode_name = movie.episode_name.replace(/\s{2,}/g, " ");
				movie.episode_name = movie.episode_name.trim(); 
		}
	
		var key = movie.core_name;
		var prefix = key + ".";
		
		function is_match(other) {
			return other.parent == movie.parent && (other.name == key || other.name.startsWith(prefix))
		}
		
		function is_image_match(other) {
		// An image in the same folder with the "same" name or a name that matches the show
		// (when the movie is not in the show container) 
			return (other.parent == movie.parent) && (other.name == key || other.name.startsWith(prefix) || ((other.name == movie.show) && (other.container != movie.show)))
		}
		
		function tag(other) {
			other.tag = other.name.substr(prefix.length);
			other.tags = other.tag.split(".").filter(tag => tag.length > 0);
			other.lang = tags2lang(other.tags);
		}
		
		movie.subtitles = subtitles.filter(is_match);
		movie.subtitles.forEach(tag);
		movie.images = images.filter(is_image_match);
		movie.images.forEach(tag);
		movie.images = movie.images.sort(sort_by(image => -image.url.length));
		movie.texts = texts.filter(is_match).map(text => read_file(text.url));
	});
	
	var groups = movies.reduce(function(result, obj) {
		var key = obj.container_key;
		var sort_key = key.replace(/^((the)|(an?)|(l[aeo]s?)|(un[ae]?)|(un[ao]s)|(des))-(.*)$/i, "$8");
		function pad_number(key) {
			var pieces = key.split("-");
			pieces.forEach((piece, n) => {
				if (piece.match(/^\d{1,10}$/)) {
					pieces[n] = ("0000000000" + piece).substr(piece.length);
				}
			});
			
			return pieces.join("-");
		}
		sort_key = pad_number(sort_key);
		var group = result[key] || { key: key, sort_key, container: obj.container, subcontainer: obj.subcontainer, movies: {} };
		result[key] = group;
		
		var movies = group.movies[obj.key] || [];
		group.movies[obj.key] = movies.concat(obj);
		
  		return result;
	}, {});
	
	groups = Object.values(groups);
	
	groups.forEach(group => {
		/*
		A group image has the same name (prefix) as its parent or it is called "folder" or "poster"
		*/
		function is_match(other) {
			return other.container == group.container && ((other.subcontainer == undefined) || (other.subcontainer == group.subcontainer)) &&
				((other.name == other.parent) || other.name.startsWith(other.parent + ".") || (other.name == "folder") || (other.name == "poster"));
		}
		
		function tag(other) {
			other.tag = other.name.substr(other.parent.length + 1);
			other.tags = other.tag.split(".").filter(tag => tag.length > 0);;
			other.lang = tags2lang(other.tags);
		}
		
		group.images = images.filter(is_match).sort(sort_by(image => -image.url.length));
		group.images.forEach(tag);
		
		var m = Object.values(group.movies);
		m.forEach(movies => {
			movies.forEach(movie => {
				if (movie.episode_name === "") {
					if (m.length === 1 && movie.season === 1 && movie.episode === 1) {
						movie.episode_name = movie.show;
					} else {
						movie.episode_name = "Episode " + movie.episode;
					}
				}
			});
		});
	});
	
	groups = groups.sort(sort_by(group => group.sort_key));
	
	return groups;
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

function areShowsEqual(a, b) {
	if (a === b) {
		return true;
	}
	
	if ((a === "A Touch of Frost" && b === "Frost") || (b === "A Touch of Frost" && a === "Frost")) {
		return true;
	}
	
	var prefixes = ["The ", "A ", "An ", "Le ", "La "];
	
	if (prefixes.some(p => (p + a === b) || (p + b === a))) {
		return true;
	}
	
	var suffixes = [" Movie"];
	
	if (suffixes.some(s => (a + s === b) || (b + s === a))) {
		return true;
	}
	
	return false;
}

function selectImage(images, kind, season) {
	var checked = images;
	var previous;
	
	var passthrough = (img => true);
	var checkKindPoster = (img => img.tags.includes("poster") || (img.tags.length === 0));
	
	previous = checked;
	
	var checkKind;
	switch (kind) {
		case undefined:
			checkKind = passthrough;
			break;
		case "poster":
			checkKind = checkKindPoster;
			break;
		default:
			checkKind = (img => img.tags.includes(kind));
			break;
	}
	
	checked = checked.filter(checkKind);
	if (checked.length === 0) {
		checked = previous;
	} 
	
	previous = checked;
	var checkSeason = season ? (img => img.tags.includes("season-" + season)) : passthrough;
	checked = checked.filter(checkSeason);
	if (checked.length === 0) {
		checked = previous;
	}
	
	return checked[0];
}

function get_movie_links(group, destination) {
	var location = group.key + "/";
	var full = $.NSURL.alloc.initFileURLWithPath(destination + location).absoluteString.js;

	var lowest_season;
	var highest_season;
		
	var current_show;
	var multiple_shows = false;
			
	var movies = Object.values(group.movies).map(x => {
		
		return x.map(movie => {
		
			// Track lowest and highest season
			if (movie.season) {
				if (!lowest_season || (movie.season < lowest_season)) {
					lowest_season = movie.season;
				}
				if (!highest_season || (movie.season > highest_season)) {
					highest_season = movie.season;
				}
			}
			
			// Track multiple shows
			if (movie.show) {
				if (current_show && (current_show != movie.show)) {
					multiple_shows = true;
				}
				current_show = movie.show;
			}
		
			var name = movie.core_name;
			if (movie.episode_name) {
				name = movie.episode_name;
				
				if (movie.show && !areShowsEqual(movie.container, movie.show)) {
					name = movie.show + " - " + name;
				}
			}
		
			var subtitles = movie.subtitles.map(sub => {
				return {
					link: get_url_relative_to(sub.url, full),
					name: sub.tag || sub.lang,
					lang: sub.lang,
					tag: sub.tag
				};
			});
			return { link: movie.key, name: name, season: movie.season, episode: movie.episode, quality: movie.quality, subtitles: subtitles };
		});
	});
	
	var display_season = (lowest_season != highest_season) || multiple_shows || ((lowest_season && (lowest_season != 1)) && !group.subcontainer);
	return {
		location: location,
		container: group.container,
		subcontainer: group.subcontainer,
		name: group.container + (group.subcontainer ? (" " + group.subcontainer) : ""),
		display_season: display_season,
		movies,
		images: group.images.map(image => { return { tag: image.tag, tags: image.tags, url: get_url_relative_to(image.url, full) }; }),
		lowest_season, highest_season, multiple_shows
	};
}

function idx_doc(url) {
	return url + (!url.endsWith("/") ? "/": "") + "index.html";
}

function groups_page(p) {
	var json = JSON.stringify(p, null, "    ");
	var title = "Videos"
	var groups = p.groups.map(group => `<div><a href="${idx_doc(group.link)}">${group.container + (group.subcontainer ? (" " + group.subcontainer) : "")}</a></div>`).join("\n");
	var html = 
	`<html>
	<head>
	<title>${title}</title>
	<link rel="stylesheet" type="text/css" href="styles.css">
	<script src="container-script.js"></script>
	<script type="application/json">${json}</script>
	</head>
	<body data-page="groups">
	<h1>${title}</h1>
	${groups}
	</body>
	</html>`;
	
	p.html = html;
	return p;
}

function group_page(p) {
	var dots = p.subcontainer ? "../.." : ".."
	var sidebar_width = 156;
	var json = JSON.stringify(p, null, "    ");
	var title = p.name;
	var display_season = p.display_season ? "inline-block" : "none";
	var vid = p.movies[0][0];
	var poster_ = selectImage(p.images, "poster", vid.season); //p.images.filter(img => img.tag == "" || img.tag === "poster")[0] || p.images[0];
	var poster = poster_ ? poster_.url : `${dots}/generic-poster.jpg`;
	var movies = p.movies.map(group => {
		var movie = group[0];
		return `<a href="${idx_doc(movie.link)}"><span class="season">${movie.season || ""}</span><span class="episode">${movie.episode || ""}</span><span class="name">${movie.name}</span></a>`;
		
	}).join("\n");

	var hideSeason = p.display_season ? "" : "data-hide-season";
	
	var html = 
	`<html>
	<head>
	<title>${title}</title>
	<link rel="stylesheet" type="text/css" href="${dots}/styles.css">
	<style>
	:root {
    --display-season: ${display_season};
	}
	</style>
	<script src="${dots}/container-script.js"></script>
	<script type="application/json">${json}</script>
	</head>
	<body data-page="group" ${hideSeason}>
	<h1>${title}</h1>
	<div id="sidebar"><img src=${poster}></div>
	<div id="content">
	${movies}
	</div>
	</body>
	</html>`;
	
	p.html = html;
	return p;
}

function html_source(vid, baseURL) {
	return `<source src="${get_url_relative_to(vid.url, baseURL)}" type="${vid.mimetype}">`;
}

function html_subtitle(sub, index) {
	var default_ = (index == 0) ? "default " : "";
	return `<track kind="subtitles" ${default_}label="${sub.tag}" srclang="${sub.lang}" src="${sub.name + ".vtt"}">`;
}

function html_video(vids, poster, baseURL) {
	var vid = vids[0];
	return "" +
`<video class="backdrop-video" controls poster="${poster}" >
	${vids.map(vid => html_source(vid, baseURL)).join("\n\t")}
	${vid.subtitles.map((sub, index) => html_subtitle(sub, index)).join("\n\t")}
</video>
`;
}

function synopsis(vid) {
	var text = vid.texts[0];
	if (!text) {
		return "";
	}
	
	return `<p class="synopsis">${text}</p>`;
}

function html_video_page(vids, fallbackPoster, baseURL) {
	var vid = vids[0];
	var episode_name = vid.episode_name || vid.core_name;
	var show = vid.show || vid.container;
	var location = vid.season ? (vid.season != 1 ? "S" + vid.season : "") : vid.subcontainer;
	var locator = (location ? (location + " ") : "") + (vid.episode ? ("E" + vid.episode) : "");
	if (vid.season == 1 && vid.episode == 1) {
		locator = "";
	}
	if (areShowsEqual(show, episode_name)) {
		show = "";
	}
	var showLocatorSuffix = `${show ? " - " + show : ""}${locator ? " " + locator : ""}`;
	var dots = vid.subcontainer ? "../../.." : "../..";
	
	var image = selectImage(vid.images, "backdrop", vid.season); // vid.images.filter(img => img.tag === "backdrop")[0] || vid.images[0];
	var fb = fallbackPoster ? get_url_relative_to(fallbackPoster.url, baseURL) : `${dots}/generic-poster.jpg`;
	var poster = image ? get_url_relative_to(image.url, baseURL) : (fb);
	
	return "" +
`
<!DOCTYPE html>
<html>
<head>
<title>${episode_name}${showLocatorSuffix}</title>
<link rel="stylesheet" type="text/css" href="${dots}/styles.css">
<script src="${dots}/script.js"></script>
</head>

<body data-page="item" data-playing="false">

	<div class="backdrop">
		<img class="backdrop-image" src="${poster}">
		<div class="backdrop-gradient"></div>
${html_video(vids, poster, baseURL)}
	</div>

	<div class="overlay">
		<div class="sized-content">
			<div id="play" class="play" onclick="togglePlay()">▶</div>	
<h1 class="episode_name">${episode_name}</h1>
<h2><span class="show">${show}</span> <span class="locator">${locator}</span></h2>
			<p class="elapsed"><span class="currentTime"></span><span class="duration">--:--</span></p>
		</div>
		<div class="unsized-content">
${synopsis(vid)}
		</div>
	</div>

	<body>
</html>
`;
/*`<!DOCTYPE html>
<html>
<head>
<title>${episode_name}${showLocatorSuffix}</title>
<link rel="stylesheet" type="text/css" href="${dots}/styles.css">
<script src="${dots}/script.js"></script>
</head>
<body>
<h1 class="episode_name">${episode_name}</h1>
<h2><span class="show">${show}</span> <span class="locator">${locator}</span></h2>
${html_video(vids, fallbackPoster, baseURL)}
${synopsis(vid)}
<body>
</html>
`;*/
}

function srt2vtt(subs) {
	var cueTiming = /(\d{1,2}:\d{1,2}:\d{1,2})(,)(\d{1,3} --> \d{1,2}:\d{1,2}:\d{1,2})(,)(\d{1,3})/g;
	
	// Replace comma timings with period timings
	var vtt = subs.replace(cueTiming, "$1.$3.$5");
				
	// Add WEBVTT header if not present
	if (!vtt.startsWith("WEBVTT")) {
		vtt = "WEBVTT\n\n" + vtt;
	}
	
	return vtt;
}

// POLYFILL
function ensureFlag(flags, flag) {
    return flags.includes(flag) ? flags : flags + flag;
}

function* matchAll(str, regex) {
    const localCopy = new RegExp(
        regex, ensureFlag(regex.flags, 'g'));
    let match;
    while (match = localCopy.exec(str)) {
        yield match;
    }
}

function ttml2vtt(subs) {
	/* Make sure paragraphs are on separate lines so that regex works */
	subs = subs.replace(/<\/p><p/g, "</p>\n<p");
	
	/*
	This is a hugely hacky way to convert TTML to VTT, but it works for our limited inputs
	THIS IS A HUGE HACK THAT DROPS USEFUL FEATURES OF TTML AND WONT WORK WITH ALL INPUTS
	*/
	var sub = /<p[^>]* begin="(\d{1,2}:\d{1,2}:\d{1,2}[.]\d{1,3})"[^>]* end="(\d{1,2}:\d{1,2}:\d{1,2}[.]\d{1,3})"[^>]*>(.*)<\/p>/g;
	
	var matches = [...matchAll(subs, sub)];
	
	if (!(matches && matches.length > 0)) {
		return subs;
	}
	
	var re_style = /<style id="([^"]*)"[^>]* tts:color="([^"]*)"[^>]*\/>/g;
	var styles = [...matchAll(subs, re_style)].map(m => { return { id: m[1], color: m[2] }; });
	
	var replacements = [
		{ find: /<span tts:color="([^"]*)"[^>]*>/g, replace: "<c.$1>" },
		{ find: /<span [^>]*>/g, replace: "<c>" },
		{ find: /<\/span>/g, replace: "</c>" },
		{ find: /<br\s*\/>/g, replace: "\n" },
		{ find: /&#163;/g, replace: "£" },
		{ find: /&#39;/g, replace: "'" },
		{ find: /&#34;/g, replace: `"` },
	];
	
	function strip(sub) {
		var result = sub;
		replacements.forEach(r => {
			result = result.replace(r.find, r.replace);
		});
		return result;
	}
	
	function padTime(time) {
		// WEBVTT has exactly 3-digit milliseconds, add zeroes if we have fewer digits
		var pieces = time.split(".");
		if ((pieces.length === 2) && (pieces[1].length < 3)) {
			return time + "0".repeat(3 - pieces[1].length);
		}
		return time;
	}
	
	var re_styleRef = /<p [^>]*style="([^"]*)"/;
	var vtt = matches.map((match, n) => {
		var styleRef = [...matchAll(match[0], re_styleRef)].map(m => m[1]);
		var wrapStart = "";
		var wrapEnd = "";
		if (styleRef.length > 0) {
			var ref = styleRef[0];
			var style = styles.find(style => style.id === ref);
			if (style) {
				wrapStart = `<c.${style.color}>`;
				wrapEnd = "</c>"
			}
		}
		return `${n+1}\n${padTime(match[1])} --> ${padTime(match[2])}\n${wrapStart}${strip(match[3])}${wrapEnd}\n\n`;
	});
	
	return "WEBVTT\n\n" + vtt.join("");
}

// Generate the page data
function* get_pages(groups, destination) {
	// Generate index page
	
	yield groups_page({ location: "", groups: groups.map(group => {
		var movie_groups = Object.values(group.movies);
		if (movie_groups.length == 1) {
			var movie = movie_groups[0][0];
			var location = (movie.container_key + "/" + movie.key + "/");
			return { link: location, container: movie.container };
		}
		return { link: group.key, container: group.container, subcontainer: group.subcontainer };
		})
	});
	
	for (var group of groups) {
		var movies = get_movie_links(group, destination);
		yield group_page(movies);
		
		var pages = Object.values(group.movies).map(movie_group => {
			var movie = movie_group[0];
			var location = (movie.container_key + "/" + movie.key + "/");
			var full = $.NSURL.alloc.initFileURLWithPath(destination + location).absoluteString.js;
		
			var backdrop = selectImage(group.images, "backdrop", movie.season); //group.images.filter(img => img.tag === "backdrop")[0] || group.images[0];
			
			movie_group.forEach(movie => {
				movie.subtitles.forEach(subtitle => {
					var filename = destination + location + subtitle.name + ".vtt";
					var subs = read_file(subtitle.url);
					create_directory(destination + location);
					write_file(filename, srt2vtt(ttml2vtt(subs)));
				});
			});
			
			return { location, html: html_video_page(movie_group, backdrop, full) };
		});
		
		yield* pages;
	}
}

function main() {
//	debugger;
	var source = "/Volumes/disk/video/";
	var destination = "/Volumes/disk/media-test/";
	
	create_directory(destination);
	
	var sources = ["styles.css", "script.js", "container-script.js", "generic-poster.jpg"];
	
	sources.forEach(source => {
		/*var content = read_file(path + source);
		write_file(destination + source, content);*/
		var command = `cp "${path + source}" "${destination + source}"`;
		app.doShellScript(command);
	});
	
	var files = get_files(source);
	write_file(destination +  "files.txt", JSON.stringify(files , null, "    "));

	var groups = get_media_groups(files);
	write_file(destination + "groups.txt", JSON.stringify(groups, null, "    "));
	
	var pages = get_pages(groups, destination);
	for (var page of pages) {
		create_directory(destination + page.location);
		write_file(destination + page.location + "index.html", page.html);
	}
}

main();
new Date();

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
		var mimetype = mimetype_from_type(type);
		return {
			url: url.absoluteString.js,
			linkTo: linkTo ? linkTo.absoluteString.js : undefined,
			path: path,
			parent: path[path.length - 2],
			name: name_without_extension(url.lastPathComponent.js),
			extension: url.pathExtension.js,
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
	return ["srt", "vtt", "webvtt"].includes(extension.toLowerCase());
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

function tag2lang(tag) {
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
			file.key = file.key.substr(file.container_key.length + 1);
		}
	});
	
	var movies    = files.filter(file => file.category == "movie");
	var subtitles = files.filter(file => file.category == "subtitle");
	var images    = files.filter(file => file.category == "image");

	movies.forEach(movie => {

		// File names can be:
		// "TV Show - 01-01 Episode.mp4" // Show Season Episode Name
		// "01-01 Episode.mp4" // Season Episode Name
		// "01 Episode.mp4" // Episode Name
		// "01.mp4" // Episode
		
		var rx = /^((.*) - )?(\d{1,4})(-(\d{1,4}))?\s*(.*)$/ig;
		var m = rx.exec(movie.core_name);
		if (m) {
				var t = m[2];
				var a = m[3];
				var b = m[5];
				var c = m[6];
				
				if (t == null) {
					t = movie.container;
				}
				
				if (b == null) {
					b = a;
					a = null;
				}
				
				movie.show = t;
				if (a != null) {
					movie.season = parseInt(a, 10);
				}
				movie.episode = parseInt(b, 10);
				movie.episode_name = c;
				
				if (movie.episode_name == "") {
					movie.episode_name = "Episode " + movie.episode;
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
			other.lang = tag2lang(other.tag);
		}
		
		movie.subtitles = subtitles.filter(is_match);
		movie.subtitles.forEach(tag);
		movie.images = images.filter(is_image_match);
		movie.images.forEach(tag);
		movie.images = movie.images.sort(sort_by(image => -image.name.length));
		
	});
	
	var groups = movies.reduce(function(result, obj) {
		var key = obj.container_key;
		var sort_key = key.replace(/^((the)|(an?))-(.*)$/, "$4-$1");
		var group = result[key] || { key: key, sort_key, container: obj.container, subcontainer: obj.subcontainer, movies: {} };
		result[key] = group;
		
		var movies = group.movies[obj.key] || [];
		group.movies[obj.key] = movies.concat(obj);
		
  		return result;
	}, {});
	
	groups = Object.values(groups);
	
	groups.forEach(group => {
		/*
		A group image has the same name as its parent or it is called "folder" or "poster"
		*/
		function is_match(other) {
			return other.container == group.container && ((other.subcontainer == undefined) || (other.subcontainer == group.subcontainer)) &&
				((other.name == other.parent) || (other.name == "folder") || (other.name == "poster"));
		}
		
		group.images = images.filter(is_match);
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
				
				if (movie.show && !((movie.container == movie.show) || ("The " + movie.container == movie.show)) && (movie.container != "Frost")) { // TODO
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
	
	var display_season = (lowest_season != highest_season) || multiple_shows || ((lowest_season != 1) && !group.subcontainer);
	return {
		location: location,
		container: group.container,
		subcontainer: group.subcontainer,
		name: group.container + (group.subcontainer ? (" " + group.subcontainer) : ""),
		display_season: display_season,
		movies,
		images: group.images.map(image => { return { url: get_url_relative_to(image.url, full) }; }),
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
	<body>
	<h1>${title}</h1>
	${groups}
	</body>
	</html>`;
	
	p.html = html;
	return p;
}

function group_page(p) {
	var sidebar_width = 156;
	var json = JSON.stringify(p, null, "    ");
	var title = p.name;
	var display_season = p.display_season ? "inline-block" : "none";
	var poster = p.images[0] ? p.images[0].url : "poster.jpg";
	var movies = p.movies.map(group => {
		var movie = group[0];
		return `<div><a href="${idx_doc(movie.link)}"><span class="season">${movie.season || ""}</span><span class="episode">${movie.episode || ""}</span><span class="name">${movie.name}</span></a></div>`;
		
	}).join("\n");
	var dots = p.subcontainer ? "../.." : ".."
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
	<body>
	<h1>${title}</h1>
	<div id="sidebar" style="width: ${sidebar_width}px; float: left;"><img width="${sidebar_width}" src=${poster}></div>
	<div id="content" style="margin-left: ${sidebar_width + 8}px;">
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

function html_video(vids, fallbackPoster, baseURL) {
	var vid = vids[0];
	var image = vid.images[0];
	var fb = fallbackPoster ? get_url_relative_to(fallbackPoster.url, baseURL) : "poster.jpg";
	var poster = image ? get_url_relative_to(image.url, baseURL) : (fb);
	return "" +
`<video controls poster="${poster}" width="854" height="480">
	${vids.map(vid => html_source(vid, baseURL)).join("\n\t")}
	${vid.subtitles.map((sub, index) => html_subtitle(sub, index)).join("\n\t")}
</video>
`;
}

function html_video_page(vids, poster, baseURL) {
	var vid = vids[0];
	var episode_name = vid.episode_name || vid.core_name;
	var show = vid.show || vid.container;
	var location = vid.season ? (vid.season != 1 ? "S" + vid.season : "") : vid.subcontainer;
	var locator = (location ? (location + " ") : "") + (vid.episode ? ("E" + vid.episode) : "");
	if (vid.season == 1 && vid.episode == 1) {
		locator = "";
	}
	if (show == episode_name) {
		show = "";
	}
	var dots = vid.subcontainer ? "../../.." : "../.."
	return "" +
`<!DOCTYPE html>
<html>
<head>
<title>${episode_name} - ${show} ${locator}</title>
<link rel="stylesheet" type="text/css" href="${dots}/styles.css">
<script src="${dots}/script.js"></script>
</head>
<body>
<h1 class="episode_name">${episode_name}</h1>
<h2><span class="show">${show}</span> <span class="locator">${locator}</span></h2>
${html_video(vids, poster, baseURL)}
<body>
</html>
`;
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
		
		var poster = group.images[0];
		var pages = Object.values(group.movies).map(movie_group => {
			var movie = movie_group[0];
			var location = (movie.container_key + "/" + movie.key + "/");
			var full = $.NSURL.alloc.initFileURLWithPath(destination + location).absoluteString.js;
			
			movie_group.forEach(movie => {
				movie.subtitles.forEach(subtitle => {
					var filename = destination + location + subtitle.name + ".vtt";
					var subs = read_file(subtitle.url);
					create_directory(destination + location);
					write_file(filename, srt2vtt(subs));
				});
			});
			
			return { location, html: html_video_page(movie_group, poster, full) };
		});
		
		yield* pages;
	}
}

function main() {
	var source = "/Volumes/disk/video/";
	var destination = "/Volumes/disk/media-test/";
	
	create_directory(destination);
	
	var sources = ["styles.css", "script.js", "container-script.js"];
	
	sources.forEach(source => {
		var content = read_file(path + source);
		write_file(destination + source, content);
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

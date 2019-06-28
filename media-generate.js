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
  var contents = fm.contentsAtPath(path.toString()); // NSData
  contents = $.NSString.alloc.initWithDataEncoding(contents, $.NSUTF8StringEncoding);
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
		return {
			url: url.absoluteString.js,
			path: path,
			parent: path[path.length - 2],
			name: name_without_extension(url.lastPathComponent.js),
			extension: url.pathExtension.js,
			type: get_type(url)
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

////////////////////////////////////////////////////////////////////

function crunch(text) {
	var nstext = ObjC.wrap(text); // NSString
	var options = $.NSCaseInsensitiveSearch | $.NSDiacriticInsensitiveSearch | $.NSWidthInsensitiveSearch;
	var locale = $.NSLocale.systemLocale;
    var result = nstext.precomposedStringWithCompatibilityMapping.stringByFoldingWithOptionsLocale(options,  locale);
    return ObjC.unwrap(result);
}

function url_crunch(text) {
	var c1 = crunch(text);
	c1 = c1.replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,.\/:;<=>?@\[\]^_`{|}~]/g, ""); // Remove punctuation except dashes
	c1 = c1.replace(/å/g, "aa");
	c1 = c1.replace(/ø|ö|œ/g, "oe");
	c1 = c1.replace(/æ/g, "ae");
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
		
		// The core name for a movie is its name without (HD) or (SD)
		file.core_name = file.name.replace(/ \([HS]D\)$/gi, "");
		
		// The key for a movie is it's url-simplified core name (no HD, no extension)
		// Show - 01-01 Ep1.mp4 and Show - 01-01 Ep1.m4v have the same key
		file.key = url_crunch(file.core_name);
		
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
	});
	
	var movies    = files.filter(file => file.category == "movie");
	var subtitles = files.filter(file => file.category == "subtitle");
	var images    = files.filter(file => file.category == "image");

	movies.forEach(movie => {
		var key = movie.name;
		var prefix = key + ".";
		
		function is_match(other) {
			return other.parent == movie.parent && (other.name == key || other.name.startsWith(prefix))
		}
		
		function tag(other) {
			other.tag = other.name.substr(prefix.length);
			other.lang = tag2lang(other.tag);
		}
			
		// File names can be:
		// "TV Show - 01-01 Episode.mp4" // Show Season Episode Name
		// "01-01 Episode.mp4" // Season Episode Name
		// "01 Episode.mp4" // Episode Name
		// "01.mp4" // Episode
		
		var rx = /^((.*) - )?(\d{1,4})(-(\d{1,4}))?\s*(.*)$/ig;
		var m = rx.exec(movie.name);
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
				} else {
					var rxq = /^(.*) \(([HS]D)\)$/ig;
					var mq = rxq.exec(movie.episode_name);
					if (mq) {
						movie.episode_name = mq[1];
						movie.quality = mq[2];
					}
				}
		}
	
		movie.subtitles = subtitles.filter(is_match);
		movie.subtitles.forEach(tag);
		movie.images = images.filter(is_match);
		movie.images.forEach(tag);
	});
	
	var groups = movies.reduce(function(result, obj) {
		var key = url_crunch(obj.container) + (obj.subcontainer ? ("/" + url_crunch(obj.subcontainer)) : "");
		var group = result[key] || { key: key, container: obj.container, subcontainer: obj.subcontainer, movies: {} };
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
			return other.container == group.container && other.subcontainer == group.subcontainer &&
				((other.name == other.parent) || (other.name == "folder") || (other.name == "poster"));
		}
		
		group.images = images.filter(is_match);
	});
	
	return groups;
}

// Generate the page data
function* get_pages(groups, destination) {
	// Generate index page
	
	yield { location: "index.html" };
	
	for (var group of groups) {
		yield { location: "x.html" };
	}
}

function main() {	
	var source = "/Volumes/disk/video";
	var destination = "/Users/user/Documents/media-test/";
	
	var files = get_files(source);
	write_file(destination +  "files.txt", JSON.stringify(files , null, "    "));
		
	var groups = get_media_groups(files);
	write_file(destination + "groups.txt", JSON.stringify(groups, null, "    "));
	
	var pages = get_pages(groups, destination);
	for (var page of pages) {
	//	write_file(destination + page.location, JSON.stringify(page, null, "    "));
	}
}

main();

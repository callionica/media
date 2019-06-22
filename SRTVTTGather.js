// Looks for A links to videos and links to matching subtitles
// Adds a click handler to the video links that will display the video along with subtitles in a newly created <video>
// at the top of the page. Subtitles are added to the <video> asynchronously once downloaded and converted.
// 
(function () {

// Library : Basic
var toArray = function (lst) { return [].concat.apply([], lst); };
var queryAll = function (e, s) { return toArray(e.querySelectorAll(s)); };
var URL = window.URL || window.webkitURL;

var cueTiming = /(\d{1,2}:\d{1,2}:\d{1,2})(,)(\d{1,3} --> \d{1,2}:\d{1,2}:\d{1,2})(,)(\d{1,3})/g;

var firstSource = function (v) {
	if (v.src) {
		return v.src;
	}
	var srcs = queryAll(v, "source");
	if (srcs.length > 0) {
		return srcs[0].src;
	}
	return v.src;
};

var nameExtSplit = function (name) {
	var index = name.lastIndexOf(".");
	var slashIndex = name.lastIndexOf("/");
	if (index >= 0 && index > slashIndex) {
		return { name: name.substr(0, index), ext: name.substr(index) };
	}
	return { name: name, ext: "" };
};

var isVideo = function (file) {
	return [".mp4", ".m4v", ".mov", ".m4p", ".mpg", ".mpeg", ".mpv", ".m2v", ".wmv", ".mkv", ".webm", ".flv", ".ts"].indexOf(file.ext.toLowerCase()) >= 0;
};

var isAudio = function (file) {
	return [".m4a", ".mp3", ".m3u", ".m3u8"].indexOf(file.ext.toLowerCase()) >= 0;
};

var isImage = function (file) {
	return [".jpg", ".png", ".gif"].indexOf(file.ext.toLowerCase()) >= 0;
};

var isSubtitle = function (file) {
	return [".srt", ".vtt", ".webvtt"].indexOf(file.ext.toLowerCase()) >= 0;
};

var replaceExt = function (name, ext) {
	return name.substr(0, name.lastIndexOf(".")) + ext;
};

var tag2lang = function (tag) {
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
	
	if (lang) {
// 		console.log(lang);
		return lang;
	}
	
	return "en";
};

var snifflang = function (text) {
	if (text.indexOf("ø")) {
		return "da";
	}
	return "en";
}

var m3ublob = function (paths) {
	return new Blob(["#EXTM3U\n", paths.join("\n")], { type: "audio/x-mpegurl"/*"text/plain"*/ });
};

var displayVideo = function (o, s) {
	var v = document.createElement("video");
	v.id = "customVID_098754";
	v.controls = true;
	v.src = o.video.link.href;
	
	var subs = o.subtitles;
	if (s) {
		subs = [s];
	}
	
	subs.forEach(function (s) {
			function onLoad() {
				if (this.status != 200) {
					// Failed to load the specified resource
					return;
				}
			
				// Get the subtitle text from the response
				var subs = this.responseText;

				// Replace comma timings with period timings
				var vtt = subs.replace(cueTiming, "$1.$3.$5");
				
				// Add WEBVTT header if not present
				if (!vtt.startsWith("WEBVTT")) {
					vtt = "WEBVTT\n\n" + vtt;
				}

				// Create a BLOB so that we can create a URL
				var vttBlob = new Blob([vtt], { type: "text/vtt" });

				// Create a URL from the BLOB
				var vttURL = URL.createObjectURL(vttBlob);

				// Create a new subtitle track
				var track = document.createElement("track");
				track.src = vttURL;
			
				var t = { "kind": "subtitles", "srclang": tag2lang(s.tag), "label": (s.tag || s.ext), "default": true};
				["kind", "srclang", "label", "default"].forEach(function (attr) { track[attr] = t[attr]; });
		
				v.appendChild(track);
				
// 				var download = document.createElement("a");
// 				download.setAttribute("download", "Subtitles" + t.label + ".vtt");
// 				download.href = vttURL;
// 				download.innerText = t.label;
// 				v.parentNode.insertBefore(download, v);
			}

			var req = new XMLHttpRequest();
			req.addEventListener("load", onLoad);
			req.open("GET", s.link.href);
			req.send();
	});
	
	var existing = queryAll(document, "#" + v.id);
	if (existing && existing.length) {
		existing = existing[0];
		existing.parentNode.removeChild(existing);
		existing = true;
	}
	var parent = document.body;
	parent.insertBefore(v, parent.firstChild);
	document.body.scrollTop = document.documentElement.scrollTop = 0;
	
	var addr = v.src;
	if (s) {
		addr = s.link.href;
	}
	if (existing) {
		history.replaceState({}, "Video", addr);
	} else {
		history.pushState({}, "Video", addr);
	}
// 	console.log(JSON.stringify(o));
}; 

function fixupSubtitles() {
	var links = queryAll(document, "a[href]").map(function (link) {
		var ne = nameExtSplit(link.href);
		return { name: ne.name, ext: ne.ext, link: link };
	});
	var videos = links.filter(isVideo);
	var subtitles = links.filter(isSubtitle);
	var audios = links.filter(isAudio);
	var images = links.filter(isImage);
	
	
//	(function () {
//        var m3u = m3ublob(audios.map(function (a) { return a.link; }));
//        var m3uURL = URL.createObjectURL(m3u);
//
//		var v = document.createElement("a");
//		v.href = m3uURL;
//		v.innerText = "Playlist";
//		var parent = document.body;
//		parent.insertBefore(v, parent.firstChild);
//		
//		v.onclick = function (event) {
//			event.preventDefault();
//			displayVideo({ video: { link: v }, subtitles: []});
//		};
//	})();

// 	console.log(JSON.stringify(videos));
// 	console.log(JSON.stringify(subtitles));
	
	var videosAndSubtitles = videos.map(function (v) {
		var name = v.name.toLowerCase();
		var prefix = name + ".";
		
		// If the subtitle starts with the video name, it's related
		var match = function (s) {
			var sname = s.name.toLowerCase();
			return sname == name || sname.startsWith(prefix);
		};
		
		// The subtitle tag is the part of the name that comes after the video name
		var transform = function (s) {
			return { name: s.name, ext: s.ext, tag: s.name.substr(name.length + 1), link: s.link };
		};

		return { video: v, subtitles: subtitles.filter(match).map(transform) };
	});

	var audiosAndSubtitles = audios.map(function (v) {
		return { video: v, subtitles: []};
	});

// 	console.log(JSON.stringify(videosAndSubtitles));

	function addClicks(vs) {
			vs.video.link.onclick = function (event) {
			event.preventDefault();
			displayVideo(vs);
		};
		
		vs.subtitles.forEach(function (s) {
			s.link.onclick = function (event) {
				event.preventDefault();
				displayVideo(vs, s);
			};
		});
	};
	
	videosAndSubtitles.forEach(addClicks);
	audiosAndSubtitles.forEach(addClicks);
}

if (document.readyState == 'complete') {
	fixupSubtitles();
} else {
	window.addEventListener('load', fixupSubtitles, false);
}

})();
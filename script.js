"use strict";

function ready(callback){
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

function togglePlay(video) {
	if (video.paused) {
		video.play();
	} else {
		video.pause();
	}
}

function cycleSubtitle(video) {
	var tracks = [...video.textTracks].filter(track => track.kind === "subtitles");
	var wasOn = false;
	for (var index = 0; index < tracks.length; ++index) {
		var track = tracks[index];
		if (track.mode == "showing") {
			track.mode = "disabled";
			wasOn = true;
		} else if (wasOn) {
			track.mode = "showing";
			return;
		}
	}
	
	if (!wasOn) {
		var track = tracks[0];
		if (track) {
			track.mode = "showing";
		}
	}
}

function toggleFullscreen(video) {
	if (document.webkitFullscreenElement) {
		document.webkitExitFullscreen();
	} else {
		video.webkitRequestFullscreen();
	}
}

function togglePIP(video) {
	if (video.webkitPresentationMode === "picture-in-picture") {
		video.webkitSetPresentationMode("inline");
	} else {
		document.webkitExitFullscreen();
		video.webkitSetPresentationMode("picture-in-picture");
	}
}

function init() {
	var video = document.querySelector("video");
	
	document.onkeydown = function onkeydown(evt) {
		evt = evt || window.event;
		// console.log(evt);
		if (evt.keyCode == 32) { // SPACE
			if (!evt.getModifierState("Shift")) {
				togglePlay(video);
			} else {   
				cycleSubtitle(video);			
			}
		} else if (evt.keyCode == 13) { // ENTER
			if (!evt.getModifierState("Shift")) {
				toggleFullscreen(video);
			} else {
				togglePIP(video);
			}
		}
	};
}

ready(init);

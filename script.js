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

function toggleSubtitle(video) {
	var tracks = video.textTracks;
	for (var index = 0; index < tracks.length; ++index) {
		var track = tracks[index];
		if (track.mode == "showing") {
			track.mode = "disabled";
			return;
		}
	}
	
	{
		var track = tracks[0];
		if (track) {
			track.mode = "showing";
		}
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
				toggleSubtitle(video);			
			}
		}
	};
}

ready(init);

"use strict";

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

function exitFullscreen() {
	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document.webkitExitFullscreen) {
		document.webkitExitFullscreen();
	}
}

function requestFullscreen(video) {
	if (video.requestFullscreen) {
		video.requestFullscreen();
	} else if (video.webkitRequestFullscreen) {
		video.webkitRequestFullscreen();
	}
}

function fullscreenElement() {
	return document.fullscreenElement || document.webkitFullscreenElement;
}

function exitPictureInPicture(video) {
	if (document.exitPictureInPicture) {
		document.exitPictureInPicture();
	} else if (document.webkitExitPictureInPicture) {
		document.webkitExitPictureInPicture();
	} else if (video.webkitSetPresentationMode) {
		video.webkitSetPresentationMode("inline");
	}
}

function requestPictureInPicture(video) {
	if (video.requestPictureInPicture) {
		video.requestPictureInPicture();
	} else if (video.webkitRequestPictureInPicture) {
		video.webkitRequestPictureInPicture();
	} else if (video.webkitSetPresentationMode) {
		video.webkitSetPresentationMode("picture-in-picture");
	}
}

function isPictureInPicture(video) {
	var element = document.pictureInPictureElement;
	if (element === video) {
		return true;
	}
	return (video.webkitPresentationMode === "picture-in-picture");
}

function toggleFullscreen(video) {
	if (fullscreenElement()) {
		exitFullscreen();
	} else {
		exitPictureInPicture(video);
		requestFullscreen(video);
	}
}

function togglePIP(video) {
	if (isPictureInPicture(video)) {
		exitPictureInPicture(video);
	} else {
		exitFullscreen();
		requestPictureInPicture(video);
	}
}


function init() {
	var video = document.querySelector("video");
	
	document.onkeydown = function onkeydown(evt) {
		evt = evt || window.event;
		var handled = false;
		
		// console.log(evt);
		if (evt.keyCode == 32) { // SPACE
			if (!evt.getModifierState("Shift")) {
				togglePlay(video);
			} else {   
				cycleSubtitle(video);
			}
			handled = true;
		} else if (evt.keyCode == 13) { // ENTER
			if (!evt.getModifierState("Shift")) {
				toggleFullscreen(video);
			} else {
				togglePIP(video);
			}
			handled = true;
		} else if (evt.key === "ArrowRight") {
			video.currentTime += 30.0;
			handled = true;
		} else if (evt.key === "ArrowLeft") {
			video.currentTime -= 15.0;
			handled = true;
		} else if (evt.key === "ClosedCaptionToggle") {
			cycleSubtitle(video);
			handled = true;
		}
		
		if (handled) {
			evt.stopPropagation();
			evt.preventDefault();
		}
	};
}

ready(init);

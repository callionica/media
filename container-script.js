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

function getLatest() {
	var pid = getPID();
	var latest = localStorage.getItem(pid + "latest");
	return JSON.parse(latest);
}

function getA(url) {
	return [...document.querySelectorAll("a")].find(a => a.href === url);
}

var latestLink;

function setLatestLink(a) {
	if (latestLink === a) {
		return;
	}
	
	if (latestLink) {
		latestLink.classList.remove("latest");		
	}
	latestLink = a;
	if (latestLink) {
		latestLink.classList.add("latest");
	}
}

function updateLatestLink() {
	var latest = getLatest();
	if (latest) {
		var a = getA(latest.href);
		setLatestLink(a);
	}
}

function focus(direction) {
	var next = (direction === "forward");
	var nextElement = document.querySelector("a");
	var currentElement = document.activeElement;
	if (currentElement) {
		var targets = [...document.querySelectorAll("a")];
		var index = targets.indexOf(currentElement);
		if (index < targets.length) {
			if ((index == 0) && !next) {
				index = targets.length;
			} else if ((index == targets.length - 1) && next) {
				index = -1;
			}
			nextElement = targets[next ? (index + 1) : (index - 1)];
		}
	}

	if (nextElement) {
		nextElement.focus();
	}
}

/* Removes articles (English, French, Spanish) */
function simpleTitle(text) {
	return text.replace(/^((the)|(an?)|(l[aeo]s?)|(une?)) (.*)$/i, "$6");
}

/*
Focus the first A whose text starts with the specified prefix, otherwise the first A whose text includes the specified text
*/
function focusByPrefix(prefix) {
	var lower = prefix.toLowerCase();
	var targets = [...document.querySelectorAll("a")];
	var nextElement = targets.find(t => simpleTitle(t.innerText).toLowerCase().startsWith(lower));
	if (!nextElement) {
		nextElement = targets.find(t => t.innerText.toLowerCase().includes(lower));
	}
	if (nextElement) {
		nextElement.focus();
	}
}

function init() {
	updateLatestLink();
	if (latestLink) {
		latestLink.focus();
	}
	window.setInterval(updateLatestLink, 1 * 1000); // polling local storage every second

	var searchPrefix = "";
	var searchConsumesSpace = false;
	var searchTimeout;

	function addToSearch(letter) {
		searchPrefix += letter;
		searchConsumesSpace = true;
		clearTimeout(searchTimeout);

		focusByPrefix(searchPrefix);

		searchTimeout = setTimeout(()=> { searchPrefix = ""; searchConsumesSpace = false; }, 0.5 * 1000);
	}

	document.onkeydown = function onkeydown(evt) {
		evt = evt || window.event;
		var handled = false;

		if (evt.key === "ArrowDown") {
			handled = true;
			focus("forward");
		} else if (evt.key === "ArrowUp") {
			handled = true;
			focus("back");
		} else if (evt.keyCode == 32) { // SPACE
			if (searchConsumesSpace) {
				handled = true;
				addToSearch(" ");
			}
			// Click on the currently active element
			else if (document.activeElement) {
				handled = true;
				var e = document.activeElement;
				e.click();
			}
		} else if (((65 <= evt.keyCode) && (evt.keyCode < 65+26)) || ((48 <= evt.keyCode) && (evt.keyCode < 48+10))) {
			var letter = String.fromCharCode(evt.keyCode); // works in this range
			addToSearch(letter);
		}

		if (handled) {
			evt.stopPropagation();
			evt.preventDefault();
		}
	}
}

ready(init);

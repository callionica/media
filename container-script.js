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

function init() {
	updateLatestLink();
	window.setInterval(updateLatestLink, 1 * 1000); // polling local storage every second
}

ready(init);

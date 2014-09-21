var s = document.createElement('script');
s.src = chrome.extension.getURL('script.js');
s.onload = function() {
  this.parentNode.removeChild(this);
};
(document.head||document.documentElement).appendChild(s);

var j = document.createElement('script');
j.src = chrome.extension.getURL('jquery-2.1.1.min.js');
j.onload = function() {
  this.parentNode.removeChild(this);
};
(document.head||document.documentElement).appendChild(j);

console.log('soundtrack.io loaded');

var s = document.createElement('script');
s.src = chrome.extension.getURL('script.js');
s.onload = function() {
  this.parentNode.removeChild(this);
};
(document.head||document.documentElement).appendChild(s);

if (document.domain != 'soundcloud.com') {
  var j = document.createElement('script');
  j.src = chrome.extension.getURL('jquery-2.1.1.min.js');
  j.onload = function() {
    this.parentNode.removeChild(this);
  };
  (document.head||document.documentElement).appendChild(j);
}

/*if (document.domain == 'soundcloud.com') {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('style.css');
  
  console.log( link.href );
  
  document.head.appendChild( link );
}*/

console.log('soundtrack.io loaded');

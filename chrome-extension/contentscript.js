// http://code.google.com/chrome/extensions/content_scripts.html#host-page-communication
// http://code.google.com/chrome/extensions/messaging.html#connect
var port = chrome.extension.connect({name: "grove-notification"});

document.getElementById('groveNotificationEventDiv').addEventListener('groveNotificationEvent', function() {
    var eventData = document.getElementById('groveNotificationEventDiv').innerText;
    port.postMessage(JSON.parse(eventData));
});

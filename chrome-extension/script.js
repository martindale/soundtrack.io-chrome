var soundtrack;
var loader = setInterval(function() {
  if (!$) return;

  clearInterval(loader);
  setInterval(function() {
    addButtons();
  }, 250 );
  
  var iframe = document.createElement('iframe');
  iframe.src = 'https://soundtrack.io/?iframe=true';
  iframe.id = 'soundtrack';
  iframe.height = 0;
  iframe.width = 0;

  (document.head||document.documentElement).appendChild( iframe );
  
  soundtrack = document.getElementById('soundtrack').contentWindow;
  
  $.urlParam = function(name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results == null) {
       return null;
    } else {
       return results[1] || 0;
    }
  }
  
}, 250 );

function queue( source , id ) {
  soundtrack.postMessage( JSON.stringify({
    method: 'queue',
    data: {
      source: source,
      id: id
    }
  } ), '*'); // TODO: not use *?
}

function addButtons() {
  
  // add button to a single track's youtube page (doesn't seem to work from YT search)
  $('.yt-uix-menu:not(.soundtracked)').each(function(i) {
    var self = this;
    
    // mark it as being tracked
    $( this ).addClass('soundtracked');
    
    var track = {
      id: $.urlParam('v')
    }
    
    drawButton('youtube', self, track.id);
    
  });
  
  // is this a single sound's page?
  if ( $('meta[property="og:type"][content="soundcloud:sound"]').length || $('.listenHero').length ) {
    $('.sc-button-share.sc-button.sc-button-medium.sc-button-responsive:not(.soundtracked)').each(function(i) {
      var self = this;
      
      // mark it as being tracked
      $( this ).addClass('soundtracked');

      $.ajax({
        url: 'resolve.json', 
        data: { url: window.location.href }, 
        dataType: "jsonp",
        success: function( track ) {
          drawButton('soundcloud', self, track.id);
        }
      });
    });
  }
  
  // this works for the following SC lists: stream page(home), artist page, likes page, search page
  // works functionally but icon needs help on profile pages
  $('.sc-button-share.sc-button.sc-button-small.sc-button-responsive:not(.soundtracked)').each(function(i) {
    var self = this;
    
    // mark it as being tracked
    $( this ).addClass('soundtracked');
    
    // find the main list item for this sound and grab the title link
    var path = $(this).closest('.soundList__item, .searchList__item').find('a.soundTitle__title').attr('href');
    if (!path) return;

    var smallButton = false;
    // see if this is a user stream (needs a 'small' button)
    if ($('.userStream').length) {
      smallButton = true;
    }
    $.ajax({
      url:'resolve.json',
      data: { url: 'https://soundcloud.com' + path},
      dataType: "jsonp",
      success: function (track) {
        drawButton('soundcloud', self, track.id, smallButton);
      }
    });
  });
}

// based on source (soundcloud or youtube), draws inserts queue button after ele
function drawButton(source, ele, trackId, smallButton) {
  var buttonClass;
  var spanWrap = false;
  if (typeof smallButton === 'undefined') {
    smallButton = false;
  }

  // depending on source we need to add a handful of classes to the button
  if (source == 'soundcloud') {
    buttonClass = 'sc-button sc-button-small sc-button-responsive';
  } else if (source == 'youtube') {
    buttonClass = 'yt-uix-button yt-uix-button-size-default yt-uix-button-opacity yt-uix-button-has-icon action-panel-trigger yt-uix-button-opacity yt-uix-tooltip';
    spanWrap = true;
  }

  // for SC profile views, we need som extra love on the button - skip the text and add css: text-indent: 0
  var buttonText = '&#9835; Queue &raquo;';
  var buttonStyle = '';
  if (smallButton) {
    buttonText = '&#9835';
    buttonStyle = 'style="text-indent:0;"';
  }

  var buttonHtml = '<button class="' + buttonClass + '" title="Queue on soundtrack.io" ' + buttonStyle + '>' + buttonText + '</button>';
  if (spanWrap) {
    buttonHtml = '<span>' + buttonHtml + '</span>';
  }

  $(buttonHtml)
    .on('click', function(e) {
      e.preventDefault();
      
      $(this).slideUp(function() {
        $(this).remove();
      });
      
      queue( source, trackId );
      
      return false;
    })
    .hide()
    .fadeIn()
    .insertAfter( ele );
}
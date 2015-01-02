// namepaced all of these functions together to keep the global scope clear
var SIO = {
  settings: {
    soundCloudId: '96c2e3fbb4e99b64cc38b7a8c33a1bfe'
  },
  soundtrack: null,
  detectInterval: null,
  /*  perform the initial setup of the module */
  init: function() {
    // wait until jQuery is loaded
    var loader = setInterval(function() {
      if (typeof $ === "undefined") {
        return;
      } 
      // stop the outer interval now that we're loaded
      clearInterval(loader);
      
      // begin inner interval looking for new buttons to add
      SIO.detectInterval = setInterval(function() {
        SIO.detectPage();
      }, 250 );
      
      
    }, 250 );
  },
  /*  creates the iframe that we use for queueing */
  buildIframe: function() {
    var iframe = document.createElement('iframe');
    iframe.src = 'https://soundtrack.io/?iframe=true';
    iframe.id = 'soundtrack';
    iframe.height = 0;
    iframe.width = 0;

    (document.head||document.documentElement).appendChild( iframe );
    
    // keep a pointer to this iframe in the module's properties
    SIO.soundtrack = document.getElementById('soundtrack').contentWindow;
  },
  detectPage: function() {
    // figure out what page we're on and send the appropriate options to addButtons
    var page = 'unknown';
    // youtube single track page
    if ($('#page.watch').length) {
      page = 'yt-watch';
    } else if ($('.l-two-column-sound-hero').length) {
      if ($('.isPlaylist').length) {
        page = 'sc-playlist';
      } else {
        page = 'sc-track';  
      }
    }

    SIO.addButtons(page);
  },
  queue: function( source , id ) {
    SIO.soundtrack.postMessage( JSON.stringify({
      method: 'queue',
      data: {
        source: source,
        id: id
      }
    } ), '*'); // TODO: not use *?
  },
  urlParam: function( name ) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results == null) {
       return null;
    } else {
       return results[1] || 0;
    }
  },
  addButtons: function( page ) {
    
    if (typeof page === 'undefined') {
      return false;
    }

    console.log('adding buttons for page: ' + page);
    switch (page) {
      case 'yt-watch':
        // add button to a single track's youtube page (doesn't seem to work from YT search)
        $('.yt-uix-menu:last:not(.soundtracked)').each(function(i) {
          
          var self = this;
          
          // mark it as being tracked
          $( this ).addClass('soundtracked');
          
          var track = {
            id: SIO.urlParam('v')
          }
          
          SIO.drawButton('youtube', self, track.id);
        });
        break;
      case 'sc-track':
        // is this a single sound's page?
        $('.sc-button-share.sc-button.sc-button-medium.sc-button-responsive:not(.soundtracked)').each(function(i) {
          var self = this;
          
          // mark it as being tracked
          $( this ).addClass('soundtracked');

          // if this is a playlist page, skip the button, we'll hit that with a different function
          if ($('.listenDetails__trackList').length == 0) {
            $.ajax({
              url: 'https://api.soundcloud.com/resolve.json', 
              data: { 
                url: window.location.href, 
                client_id: SIO.settings.soundCloudId
              }, 
              dataType: "jsonp",
              success: function( track ) {
                SIO.drawButton('soundcloud', self, track.id, 'sc-button-medium');
              }
            });
          }
        });
        break;
      case 'sc-playlist':
        // works on playlist pages
        $('.sc-button-addtoset.sc-button.sc-button-small.sc-button-responsive:not(.soundtracked)').each(function(i) {
          var self = this;

          $( this ).addClass('soundtracked');

          // find the main list item for this sound and grab the title link
          var path = $(this).closest('.trackList__item').find('a.trackItem__trackTitle').attr('href');
          if (!path) return;
          console.log(path);
          $.ajax({
            url:'https://api.soundcloud.com/resolve.json',
            data: { 
              url: 'https://soundcloud.com' + path, 
              client_id: SIO.settings.soundCloudId
            },
            dataType: "jsonp",
            success: function( track ) {
              SIO.drawButton('soundcloud', self, track.id, 'sc-button-small');
            }
          });
        });
        break;
      default:
        // this works for the following SC lists: stream page(home), artist page, likes page, search page
        $('.sc-button-share.sc-button.sc-button-small.sc-button-responsive:not(.soundtracked)').each(function(i) {
          var self = this;
          
          // mark it as being tracked
          $( this ).addClass('soundtracked');
          
          // find the main list item for this sound and grab the title link
          var path = $(this).closest('.soundList__item, .searchList__item').find('a.soundTitle__title').attr('href');
          if (!path) return;

          $.ajax({
            url:'https://api.soundcloud.com/resolve.json',
            data: { 
              url: 'https://soundcloud.com' + path, 
              client_id: SIO.settings.soundCloudId
            },
            dataType: "jsonp",
            success: function( track ) {
              SIO.drawButton('soundcloud', self, track.id, 'sc-button-small');
            }
          });
        });
        break;
    }
    
  },
  // based on source (soundcloud or youtube), draws inserts queue button after ele
  drawButton: function( source, ele, trackId, classes ) {
    var buttonClass;
    var spanWrap = false;

    // depending on source we need to add a handful of classes to the button
    if (source == 'soundcloud') {
      buttonClass = 'sc-button sc-button-responsive';
    } else if (source == 'youtube') {
      buttonClass = 'yt-uix-button yt-uix-button-size-default yt-uix-button-opacity yt-uix-button-has-icon action-panel-trigger yt-uix-button-opacity yt-uix-tooltip';
      spanWrap = true;
    }

    var buttonText = '&#9835; Queue &raquo;';
    var buttonStyle = '';

    // add any classes passed in
    if (classes) buttonClass += ' ' + classes;
    buttonClass = 'soundtrack-button-queue ' + buttonClass;

    // for SC profile views, we need som extra love on the button - add css: text-indent: 0
    if (source === 'soundcloud' && classes === 'sc-button-medium') {
      buttonStyle = 'style="text-indent: 0;"';
    }

    var buttonHtml = '<button class="' + buttonClass + '" title="Queue on soundtrack.io" ' + buttonStyle + '>' + buttonText + '</button>';
    
    // spanwrap is required for some sites (youtube)
    if (spanWrap) {
      buttonHtml = '<span>' + buttonHtml + '</span>';
    }

    $(buttonHtml)
      .on('click', function( event ) {
        event.preventDefault();
        
        $(this).slideUp(function() {
          $(this).remove();
        });
        
        SIO.queue( source, trackId );
        
        return false;
      })
      .hide()
      .fadeIn()
      .insertAfter( ele );
  }
};

// initialize the module
SIO.init();


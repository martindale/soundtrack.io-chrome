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
      
      // add the iframe
      SIO.buildIframe();
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
    
    if ($('#page.watch').length) {
      // youtube single track page
      page = 'yt-watch';
    } else if ($('.l-two-column-sound-hero').length) {
      if ($('.isPlaylist').length) {
        // soundcloud playlist/set page
        page = 'sc-playlist';
      } else {
        // soundcloud single track page
        page = 'sc-track';  
      }
    } else if ($('.stream').length) {
      // soundcloud stream page
      page = 'sc-stream';
    } else if ($('.streamExplore').length) {
      // soundcloud explore page
      page = 'sc-explore';
    } else if ($('.userStream').length) {
      // soundcloud user/artist profile page
      page = 'sc-userStream';
    } else if ($('.collectionSection .badgeList').length) {
      // exclude playlist list
      if ($('.l-nav .networkTabs__sets .active').length === 0) {
        // soundcloud collection in badge view
        page = 'sc-badgeList';
      }
    } else if ($('.collectionSection .soundList').length) {
      // soundcloud collection in badge view
      page = 'sc-soundList';
    } else if ($('.searchList').length) {
      // soundcloud search page
      page = 'sc-search';
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
        // works on sc single track pages
        $('.sc-button-share.sc-button.sc-button-medium.sc-button-responsive:not(.soundtracked)').each(function(i) {
          var self = this;
          
          // mark it as being tracked
          $( this ).addClass('soundtracked');

        $.ajax({
            url: 'https://api.soundcloud.com/resolve.json', 
            data: { 
              url: window.location.href, 
              client_id: SIO.settings.soundCloudId
            }, 
            dataType: "jsonp",
            success: function( track ) {
              SIO.drawButton('soundcloud', self, track.id, 'sc-button-medium', {iconOnly: true, noIndent: true});
            }
          });
        });
        break;
      case 'sc-playlist':
        // works on SC playlist/set pages
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
              SIO.drawButton('soundcloud', self, track.id, 'sc-button-small', {iconOnly: true, noIndent: true});
            }
          });
        });
        break;
      case 'sc-userStream':
        // this works for the following SC lists: stream page(home), artist page
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
              SIO.drawButton('soundcloud', self, track.id, 'sc-button-small', {iconOnly: true, noIndent: true});
            }
          });
        });
        break;
      case 'sc-badgeList':
        // this works for the following SC lists: stream page(home), artist page, likes page, search page
        $('.genericBadge:not(.soundtracked)').each(function(i) {
          var self = this;
          
          // mark it as being tracked
          $( this ).addClass('soundtracked');
          
          // find the main list item for this sound and grab the title link
          var path = $(this).find('a.genericBadge__audibleHeading').attr('href');
          if (!path) return;

          var insertAfterEle = $(this).find('a.genericBadge__subHeading');
          $.ajax({
            url:'https://api.soundcloud.com/resolve.json',
            data: { 
              url: 'https://soundcloud.com' + path, 
              client_id: SIO.settings.soundCloudId
            },
            dataType: "jsonp",
            success: function( track ) {
              SIO.drawButton('soundcloud', insertAfterEle, track.id, 'sc-button-small');
            }
          });
        });
        break;
      case 'sc-soundList':
      case 'sc-stream':
      case 'sc-explore':
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
  drawButton: function( source, ele, trackId, classes, options ) {
    var buttonClass;
    var spanWrap = false;
    var buttonText = '&#9835; Queue &raquo;';
    var buttonStyle = '';

    // pick up any options passed in
    if (typeof options !== 'undefined') {
      if (typeof options.iconOnly !== 'undefined' && options.iconOnly) {
        buttonText = '&#9835;';
      }
      if (typeof options.noIndent !== 'undefined' && options.noIndent) {
        buttonStyle = 'style="text-indent: 0;"';
      }
    }

    // depending on source we need to add a handful of classes to the button
    if (source == 'soundcloud') {
      buttonClass = 'sc-button sc-button-responsive';
    } else if (source == 'youtube') {
      buttonClass = 'yt-uix-button yt-uix-button-size-default yt-uix-button-opacity yt-uix-button-has-icon action-panel-trigger yt-uix-button-opacity yt-uix-tooltip';
      spanWrap = true;
    }


    // add any classes passed in
    if (classes) buttonClass += ' ' + classes;
    buttonClass = 'soundtrack-button-queue ' + buttonClass;

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


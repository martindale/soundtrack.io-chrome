// namepaced all of these functions together to keep the global scope clear
var SIO = {
  settings: {
    soundCloudId: '96c2e3fbb4e99b64cc38b7a8c33a1bfe',
    soundCloudConfirmLength: 720000 /* in milliseconds. default: 720000 (12 min.) */
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
    } else if ($('.branded-page-v2-body #results').length) {
      page = 'yt-search';
    } else if ($('.more-menu-wrapper').length) {
      // youtube playlist page (?)
      page = 'yt-playlist';
    } else if ($('.fullListenHero').length) {
      if ($('.listenDetails__trackList').length) {
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
    } else if ($('.l-fixed-fluid .userStream').length) {
      // soundcloud premium artists (2 column layout)
      page = 'sc-Artist';
    } else if ($('.l-three-column .userStream').length) {
      // user profile page and non-premium artist pages
      page = 'sc-userStream';
    } else if ($('.collectionSection .badgeList').length) {
      // exclude playlist list
      if ($('.l-nav .networkTabs__sets .active').length === 0) {
        // soundcloud collection in badge view
        page = 'sc-badgeList';
      } else {
        page = 'sc-playlistList';
      }
    } else if ($('.collectionSection .soundList').length) {
      // soundcloud collection in badge view
      page = 'sc-soundList';
    } else if ($('.searchList').length) {
      // soundcloud search page
      page = 'sc-search';
    } else if ($('table.track_table').length) {
      page = 'bandcamp-album';
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
    // console.log('adding buttons for page ' + page);
    switch (page) {
      case 'yt-watch':
        // add button to a single track's youtube page (doesn't seem to work from YT search)
        $('.watch-secondary-actions:not(.soundtracked)').each(function(i) {
          var self = this;
          // mark it as being tracked
          $( this ).addClass('soundtracked');

          var track = {
            id: SIO.urlParam('v')
          }
          
          var $share = $(self).find('.action-panel-trigger-share:nth-last-child(2)');

          var buttonOptions = SIO.getYouTubeOptions(self, page);

          SIO.drawButton('youtube', $share, track.id, buttonOptions);
        });
        break;

      case 'yt-search':
        // add button to each search result
        $('#results .item-section > li > .yt-lockup:not(.soundtracked)').each(function(i) {
          var self = this;
          // mark it as being tracked
          $( this ).addClass('soundtracked');

          var track = {
            id: $(self).data('context-item-id')
          };

          var $badge = $(self).find('.yt-badge-list');

          var buttonOptions = SIO.getYouTubeOptions(self, page);

          SIO.drawButton( 'youtube' , $badge , track.id , buttonOptions);
        });
        break;
        
      case 'yt-playlist':
        // add button to each search result
        $('.pl-video:not(.soundtracked)').each(function(i) {
          var self = this;
          // mark it as being tracked
          $( this ).addClass('soundtracked');

          var track = {
            id: $(self).data('video-id')
          };

          var $badge = $(self).find('.pl-video-edit-options > *')[0];

          var buttonOptions = SIO.getYouTubeOptions(self, page);

          SIO.drawButton( 'youtube' , $badge , track.id , buttonOptions);
        });
        break;

      case 'sc-track':
        // works on sc single track pages
        $('.sc-button-share.sc-button.sc-button-medium.sc-button-responsive:not(.soundtracked)').each(function(i) {
          var self = this;
          // mark it as being tracked
          $( this ).addClass('soundtracked');

          var path = window.location.href;

          var buttonOptions = { classes: 'sc-button-medium', iconOnly: true, noIndent: true };
          SIO.resolvePath(path, self, buttonOptions);

        });
        break;

      case 'sc-playlist':
        // works on SC playlist/set pages
        $('.sc-button-addtoset.sc-button.sc-button-small.sc-button-responsive:not(.soundtracked)').each(function(i) {
          var self = this;
          // mark it as being tracked
          $( this ).addClass('soundtracked');

          // find the main list item for this sound and grab the title link
          var path = $(this).closest('.trackList__item, .trackListWithEdit__item').find('a.trackItem__trackTitle, a.trackItemWithEdit__trackTitle').attr('href');
          if (!path) return;

          var buttonOptions = {classes: 'sc-button-small', iconOnly: true, noIndent: true};

          SIO.resolvePath(path, self, buttonOptions);
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

          var buttonOptions = {classes: 'sc-button-small', iconOnly: true, noIndent: true};

          SIO.resolvePath(path, self, buttonOptions);
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

          var buttonOptions = {classes: 'sc-button-small'};

          SIO.resolvePath(path, insertAfterEle, buttonOptions);
        });
        break;

      case 'sc-playlistList':
        // items listed are all playlists, so we cannot queue them
        return false;
        break;

      case 'sc-soundList':
      case 'sc-stream':
      case 'sc-explore':
      case 'sc-Artist':
      //-default:
        // this works for the following SC lists: stream page(home), collection page list views, explore pages
        $('.sc-button-share.sc-button.sc-button-small.sc-button-responsive:not(.soundtracked)').each(function(i) {
          var self = this;
          // mark it as being tracked
          $( this ).addClass('soundtracked');

          // find the main list item for this sound and grab the title link
          var path = $(this).closest('.soundList__item, .searchList__item').find('a.soundTitle__title').attr('href');
          if (!path) return;

          var buttonOptions = {classes: 'sc-button-small'};

          SIO.resolvePath(path, self, buttonOptions);
        });
        break;
      
      case 'bandcamp-album':
        $('.track_table .play-col:not(.soundtracked)').each(function (i) {
          var self = this;
          // mark it as being tracked
          $( this ).addClass('soundtracked');
  
          var trackData = $.extend({}, TralbumData, TralbumData.trackinfo[i || 0]);
          var track = {
            artist: TralbumData.artist,
            title: trackData.title,
            id: trackData.id,
            url: trackData.file['mp3-128'],
            duration: trackData.duration,
            thumbnail: TralbumData.artThumbURL,
            artwork_url: TralbumData.artFullsizeUrl
          }
          
          $('<td class="queue-col" style="padding: 4px 3px;"></td>')
            .append($('<span data-track-id="'+track.id+'"></span>'))
            .insertAfter($(self));

          var buttonOptions = {
            classes: 'bandcamp-queue-button',
            style: 'font-size: 10px; width: 60px;'
          };
          
          var $cell = $('.queue-col span[data-track-id='+track.id+']');
          
          console.log('cell:', $cell);
          
          SIO.drawButton('bandcamp', $cell, track, buttonOptions);
        });
        break;
      
      default:
        console.log('Unhandled page:', page);
        break;
    }
  },
  getYouTubeOptions: function(ele, page) {
    var trackTime = '', trackTitle = ''. timeInMs = 0;

    if (page == 'yt-search') {
      // grab the tracktime (stored in hh:mm:ss on youtube)
      trackTime = $(ele).find('.video-time').text();
      var timeInMs = SIO.hmsToMilliseconds(trackTime);
      // grab the track title so we can block preview tracks
      trackTitle = $(ele).find('.yt-uix-tile-link').prop('title');
    } else if (page == 'yt-watch') {
      trackTitle = $('.watch-title').prop('title');
      trackTime = $('.watch-main-col meta[itemprop="duration"]').prop('content');
      var timeInMs = SIO.ytTimeToMilliseconds(trackTime);
    }

    var options = {
      duration : timeInMs,
      title: trackTitle || ''
    };
    return options;
  },
  ytTimeToMilliseconds: function(trackTime) {
    // duration on the watch pages is in a weird format:
    // "PT<number of minutes>S<number of seconds"
    // eg   4:20   =  PT4M20S
    // eg  10:11:12 = PT611M12S
    // strip off last character "S"
    // strip off first two characters "PT"
    // split on "M"
    // item [0] will be minutes
    // item [1] will be seconds
    var stripped = trackTime.substr(0,trackTime.length-1).substr(2);
    var split = stripped.split('M');
    var minutes = parseInt(split[0],10);
    var seconds = parseInt(split[1],10);

    var milliseconds = ((minutes * 60) + seconds) * 1000;
    return milliseconds;
  },
  /**
   * converts time given in HH:MM:SS  or MM:SS or SS  format to milliseconds
   */
  hmsToMilliseconds: function(hms) {
    var p = hms.split(':'),
        s = 0, m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }

    return (s * 1000);
  },
  /**
   * resolves the path using the soundcloud API and draws button on success
   */
  resolvePath: function ( path, ele, options ) {
    // make sure we have what we need
    if (typeof path === 'unidentified' || typeof ele == 'unidentified') {
      return false;
    }

    if (path.substring(0,22) !== 'https://soundcloud.com') {
      path = 'https://soundcloud.com' + path;
    }

    var pathParts = path.split('/');

    if (typeof pathParts[4] !== 'undefined' && pathParts[4] == "sets") {
      // don't make buttons for playlists/sets
      return false;
    }

    $.ajax({
      url:'https://api.soundcloud.com/resolve.json',
      data: {
        url: path,
        client_id: SIO.settings.soundCloudId
      },
      success: function( track ) {
        options.title = track.title;
        options.duration = track.duration;
        SIO.drawButton('soundcloud', ele, track.id, options);
      }
    });

  },
  // based on source (soundcloud or youtube), draws inserts queue button after ele
  drawButton: function( source, ele, trackId, options ) {

    var spanWrap = false;
    var buttonText = '&#9835; Queue &raquo;';
    var buttonStyle = '';
    var buttonClass ='soundtrack-button-queue';

    // pick up any options passed in
    if (typeof options !== 'undefined') {
      if (typeof options.iconOnly !== 'undefined' && options.iconOnly) {
        buttonText = '&#9835;';
      }
      if (typeof options.noIndent !== 'undefined' && options.noIndent) {
        buttonStyle += 'text-indent: 0;';
      }
      if (typeof options.classes !== 'undefined' && options.classes) {
        buttonClass += ' ' + options.classes;
      }
      if (typeof options.style !== 'undefined' && options.style) {
        buttonStyle += options.style;
      }
    }

    // depending on source we need to add a handful of classes to the button
    if (source == 'soundcloud') {
      buttonClass += ' sc-button sc-button-responsive';
    } else if (source == 'youtube') {
      buttonClass += ' yt-uix-button yt-uix-button-size-default yt-uix-button-opacity yt-uix-button-has-icon action-panel-trigger yt-uix-button-opacity yt-uix-tooltip';
      spanWrap = true;
    } else if (source == 'bandcamp') {
      buttonClass += '';
    }

    var buttonHtml = '<button class="' + buttonClass + '" title="Queue on soundtrack.io" style="' + buttonStyle + '">' + buttonText + '</button>';

    // spanwrap is required for some sites (youtube)
    if (spanWrap) {
      buttonHtml = '<span>' + buttonHtml + '</span>';
    }

    $(buttonHtml)
      .on('click', function( event ) {
        event.preventDefault();
        // if track is greater than 10 minutes, require confirmation
        if (typeof options.duration !== 'undefined' && options.duration > SIO.settings.soundCloudConfirmLength) {
          if (!confirm("Are you sure you want to queue this track?  It's kinda long. ¯\\_(ツ)_/¯")) {
            return false;
          }
        }

        // if track title contains 'preview', require confirmation
        if (typeof options.title !== 'undefined' && options.title.toLowerCase().indexOf("preview") > -1) {
          if (!confirm("This track looks like it might be a preview. Are you sure you wish to queue it?")) {
            return false;
          }
        }

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

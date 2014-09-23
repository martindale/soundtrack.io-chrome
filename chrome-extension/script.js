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
  
  $('.yt-uix-menu:not(.soundtracked)').each(function(i) {
    var self = this;
    
    // mark it as being tracked
    $( this ).addClass('soundtracked');
    
    var track = {
      id: $.urlParam('v')
    }
    
    $('<span><button class="yt-uix-button yt-uix-button-size-default yt-uix-button-opacity yt-uix-button-has-icon action-panel-trigger yt-uix-button-opacity yt-uix-tooltip">&#9835; Queue &raquo;</button></span>')
      .on('click', function(e) {
        e.preventDefault();
        
        $(this).slideUp(function() {
          $(this).remove();
        });
        
        queue( 'youtube', track.id );
        
        return false;
      })
      .hide()
      .fadeIn()
      .insertBefore( self );
    
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
          $('<button class="sc-button sc-button-medium sc-button-responsive" title="Queue on soundtrack.io">&#9835; Queue &raquo;</button>')
          .on('click', function(e) {
            e.preventDefault();
            
            $(this).slideUp(function() {
              $(this).remove();
            });
            
            queue( 'soundcloud', track.id );
            
            return false;
          })
          .hide()
          .fadeIn()
          .insertAfter( self );
        }
      });
    });
  }
  
  $('.sc-button-share.sc-button.sc-button-small.sc-button-responsive:not(.soundtracked)').each(function(i) {
    var self = this;
    
    // mark it as being tracked
    $( this ).addClass('soundtracked');
    
    // probably an easier way to do this
    var path = $(this).closest('.soundList__item').find('a.soundTitle__title').attr('href');
    if (!path) return;

    $.ajax({
      url:'resolve.json',
      data: { url: 'https://soundcloud.com' + path},
      dataType: "jsonp",
      success: function (track) {
        $('<button class="sc-button sc-button-small sc-button-responsive" title="Queue on soundtrack.io">&#9835; Queue &raquo;</button>')
        .on('click', function(e) {
          e.preventDefault();
          
          $(this).slideUp(function() {
            $(this).remove();
          });
          
          queue( 'soundcloud', track.id );
          
          return false;
        })
        .hide()
        .fadeIn()
        .insertAfter( self );
      }
    });
  });
}

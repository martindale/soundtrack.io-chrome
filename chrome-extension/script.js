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
  
}, 250 );

function addButtons() {
  $('.sc-button-share.sc-button.sc-button-responsive:not(.soundtracked)').each(function(i) {
    var self = this;
    
    // mark it as being tracked
    $( this ).addClass('soundtracked');
    
    // probably an easier way to do this
    var path = $( this ).parent().parent().parent().parent().parent().children('a').attr('href');
    if (!path) return;
    
    $.get('resolve.json', { url: 'https://soundcloud.com' + path }, function( track ) {
      $('<button class="sc-button sc-button-small sc-button-responsive" title="Queue on soundtrack.io">&#9835; Queue &raquo;</button>')
        .on('click', function(e) {
          e.preventDefault();
          
          $(this).slideUp(function() {
            $(this).remove();
          });
          
          soundtrack.postMessage( JSON.stringify({
            method: 'queue',
            data: {
              source: 'soundcloud',
              id: track.id
            }
          } ), '*'); // TODO: not use *?
          
          return false;
        })
        .hide()
        .fadeIn()
        .insertAfter( self );
    });
  });
}

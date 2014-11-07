function timeAgoFormat() {
  $("span[data-time]").each(function() {
    var utcms     = this.dataset.time,
    localDate = new Date(parseInt(utcms, 10));

    this.title = localDate.toString();
    this.innerHTML = moment(localDate).fromNow();
  });
}

$(document).ready(timeAgoFormat);

function startStream() {
  $(document).ready(function() {
    var sources = [];
    var retries = [];
    $('.output-pane').each(function attachStream() {
      var $messages = $(this).find('.output-messages');
      var streamUrl = $(this).data('streamUrl');
      var isMainDeploy = $(this).hasClass('main');
      var doNotify  = $('#output').data('desktopNotify');
      console.log(streamUrl);
      var source = new EventSource(streamUrl);
      sources.push(source);

      var addLine = function(data) {
        var msg = JSON.parse(data).msg;
        $messages.append(msg);
        if (following) {
          $messages.scrollTop($messages[0].scrollHeight);
        }
      };

      source.addEventListener('error', function(e) {
        source.close();
        var timeout = setTimeout(attachStream.bind(this), 2000);
        retries.push(timeout);
      }.bind(this));

      source.addEventListener('append', function(e) {
        $messages.trigger('contentchanged');
        addLine(e.data);
        console.log(e.data);
      }, false);

      source.addEventListener('replace', function(e) {
        $messages.children().last().remove();
        addLine(e.data);
      }, false);

      if (isMainDeploy) {
        source.addEventListener('viewers', function(e) {
          var users = JSON.parse(e.data);

          if (users.length > 0) {
            var viewers = $.map(users, function(user) {
              return user.name;
            }).join(', ') + '.';

            $('#viewers-link .badge').html(users.length);
            $('#viewers').html('Other viewers: ' + viewers);
          } else {
            $('#viewers-link .badge').html(0);
            $('#viewers').html('No other viewers.');
          }
        }, false);

        source.addEventListener('finished', function(e) {
          var data = JSON.parse(e.data);

          $('#header').html(data.html);
          window.document.title = data.title;

          if ( doNotify ) {
            new Notification(data.notification, {icon: '/favicon.ico'});
          }

          toggleOutputToolbar();
          timeAgoFormat();

          sources.forEach(function(source) {
            source.close();
          });
          retries.forEach(clearTimeout);
        }, false);
      }
    });
  });
}

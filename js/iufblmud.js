var gid = '228544121320';
var now = new Date();
var date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
var playlist = new Playlist();
var feed = new Feed();
var player = null;

$(document).ready(function () {
    $('#play-mode').click(function () {
        playlist.auto_advance = !playlist.auto_advance;
        $(this).text('auto-advance video: ' + (playlist.auto_advance ? 'yes' : 'no'));
    });
    $('#sort-dir').click(function () {
        feed.sort_dir = feed.sort_dir == 'asc' ? 'desc' : 'asc';
        feed.sort();
        feed.render();
        feed.events();
        playlist.curr_post = null;
    });

    $('#date-picker').val(date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear());
    $('#date-picker').datepicker({ format: 'd-m-yyyy' })
        .on('changeDate', function (e) {
            date = e.date;
            feed.refresh(); 
        });

    $('#fb-group-1').click(function () {
        $('#fb-group').text('Igreja Universal dos Fazedores de Bonitas Listas Musicais dos Últimos Dias');
        gid = '228544121320';
        feed.refresh();
    });
    $('#fb-group-2').click(function () {
        $('#fb-group').text('Tribo Cinéfila das Tapas & Vinho Tinto');
        gid = '123201917718018';
        feed.refresh();
    });
    $('#fb-group-3').click(function () {
        $('#fb-group').text('30 dias, 30 músicas');
        gid = '181935148518318';
        feed.refresh();
    });
    $('#fb-group-4').click(function () {
        $('#fb-group').text('Discos para 1 Ilha Deserta');
        gid = '117052185076587';
        feed.refresh();
    });

    $('#search-box').keyup(function () { feed.render(); });
});

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        events: {
            'onReady': playlist.onPlayerReady,
            'onStateChange': playlist.onPlayerStateChange
        }
    });
}

window.fbAsyncInit = function () {
    FB.init({
        appId: '145530318799386',
        channelUrl: '//iufblmud.apphb.com/channel.html',
        status: true,
        cookie: true,
        xfbml: true
    });

    FB.getLoginStatus(function (response) {
        if (response.status === 'connected') {
            feed.accessToken = response.authResponse.accessToken;
            feed.refresh();
        } else {
            FB.login(function (response) {
                if (response.authResponse) {
                    feed.accessToken = response.authResponse.accessToken;
                    feed.refresh();
                }
            }, { scope: 'read_stream' });
        }
    });
};

function Playlist() {
    this.auto_advance = false;
    this.curr_post = null;
}

Playlist.prototype.onPlayerReady = function (event) {
    if (playlist.curr_post == null || playlist.curr_post.link == null) {
        return;
    }

    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]{11,11}).*/;
    match = playlist.curr_post.link.match(regExp);
    if (match && match.length >= 2) {
        player.cueVideoById(match[2]);
        event.target.playVideo();
    }
}

Playlist.prototype.onPlayerStateChange = function (event) {
    var curr_post = playlist.curr_post;
    if (event.data != YT.PlayerState.ENDED || curr_post == null || !playlist.auto_advance) {
        return;
    }

    $('#player-container-' + curr_post.id).collapse('hide');

    var curr_index = -1;
    for (i = 0; i < feed.posts.length; i++) {
        if (curr_post == feed.posts[i]) {
            curr_index = i;
            break;
        }
    }

    if (curr_index == -1 || curr_index == feed.posts.length - 1) {
        return;
    }

    for (i = curr_index + 1; i < feed.posts.length; i++) {
        if (feed.posts[i].link != null && feed.posts[i].link.indexOf('youtu') != -1) {
            $('#player-container-' + feed.posts[i].id).collapse('show');
            break;
        }
    }
}

function Feed() {
    this.accessToken = null;
    this.sort_dir = 'desc';
    this.posts = [];
}

Feed.prototype.refresh = function () {
    feed.posts = [];
    $('#posts').empty();
    $('#loading').show();

    FB.api('/'+ gid +'/feed', { 
        access_token: feed.accessToken,
        limit: 1000,
        since: date.valueOf()/1000,
        until: (date.valueOf() + 86400000)/1000
    }, function (response) {
        if (response.data == null) {
            return;
        }

        $.each(response.data, function (i, v) {
            feed.posts[i] = new Post();
            feed.posts[i].init(v);
        });

        feed.sort();
        feed.render();
        feed.events();
        playlist.curr_post = null;

        $('#loading').hide();
    });
};

Feed.prototype.sort = function () {
    this.posts.sort(function (x, y) {
        if (feed.sort_dir == 'desc') {
            return Date.parse(y.created_time) - Date.parse(x.created_time);
        } else {
            return Date.parse(x.created_time) - Date.parse(y.created_time);
        }
    });
};

Feed.prototype.render = function () {
    var text = $('#search-box').val().toLowerCase();
    var container = $('#posts');

    container.empty();
    var content = '';
    $.each(this.posts,
        function (i, post) {
            if (text == null ||
                text == '' ||
                (post.from != null && post.from.name != null && post.from.name.toLowerCase().indexOf(text) != -1) ||
                (post.message != null && post.message.toLowerCase().indexOf(text) != -1) ||
                (post.name != null && post.name.toLowerCase().indexOf(text) != -1)) {

                content += post.toHtml();
            }
        }
    );
    container.html(content);
};

Feed.prototype.events = function () {
    $.each(this.posts, function (i, post) {
        if (post.link == null) {
            return;
        }

        var panel = $('#player-container-' + post.id);
        var anchor = $('#player-anchor-' + post.id);

        panel.on('show', function () {
            anchor.html('Hide Video');

            if (playlist.curr_post != null) {
                $('#player-container-' + playlist.curr_post.id).collapse('hide');
            }

            playlist.curr_post = post;
            $('#player').appendTo('#player-container-' + post.id);
        });

        panel.on('hide', function () {
            anchor.html('View Video');

            player.stopVideo();
            playlist.curr_post = null;
            $('#player').appendTo('#player-hidden');
        });
    });

    $(".player-anchor").hover(function () {
        $(this).css("cursor", "pointer");
    }, function () {
        $(this).css("cursor", "default");
    });
};

function Post() {
    this.id = null;
    this.from = null;
    this.message = null;
    this.name = null;
    this.link = null;
    this.likes = 0;
    this.comments = 0;
    this.created_time = null;
}

Post.prototype.init = function (data) {
    this.id = data.id != undefined ? data.id : null;
    this.message = data.message != undefined ? data.message : null;
    this.name = data.name != undefined ? data.name : null;
    this.created_time = data.created_time != undefined ? new Date(data.created_time) : null;
    this.likes = (data.likes != undefined && data.likes.count != undefined) ? data.likes.count : 0;
    this.comments = (data.comments != undefined && data.comments.count != undefined) ? data.comments.count : 0;

    if (data.from != undefined) {
        this.from = new User();
        this.from.init(data.from);
    }

    if (data.link != undefined) {
        this.link = data.link;
    } else if (data.source != undefined) {
        this.link = data.source;
    }
};

Post.prototype.toHtml = function () {
    var v = ''
    if (this.link != null && this.link.indexOf("youtu") == -1) {
        v = '<i class="icon-play-circle"></i>&nbsp;' +
            '<a class="player-anchor" href="' + this.link + '">Link</a>';
    } else if (this.link != null) {
        v = '<i class="icon-play-circle"></i>&nbsp;' +
            '<a id="player-anchor-' + this.id + '" class="player-anchor" data-toggle="collapse" data-target="#player-container-' + this.id + '">View video</a>'
    }

    var res =
        '<div class="post">' +
            '<a href="http://www.facebook.com/profile.php?id=' + this.from.id + '">' +
                '<img class="post-img img-rounded" src="https://graph.facebook.com/' + this.from.id + '/picture">' +
            '</a>' +
            '<div class="post-details">' +
                '<small class="post-time">' + this.created_time.toLocaleTimeString() + '</small>' +
                '<p class="post-from">' +
                    '<a href="http://www.facebook.com/profile.php?id=' + this.from.id + '">' + this.from.name + '</a>' +
                '</p>' +
                '<p class="post-message">' + this.message + '</p>' +
                '<p class="post-name">' +
                    '<a href="https://www.facebook.com/' + this.id.replace("_", "/posts/") + '">' + (this.name == null ? 'Post' : this.name) + '</a>' +
                '</p>' +
                '<p class="post-footer">' +
                    '<small>' +
                        '<i class="icon-thumbs-up"></i> ' + this.likes + '&nbsp;&nbsp;&nbsp;' +
                        '<i class="icon-comment"></i> ' + this.comments + '&nbsp;&nbsp;&nbsp;' +
                        v +
                    '</small>' +
                '</p>' +
                '<div id="player-container-' + this.id + '" class="collapse">&nbsp;</div>' +
            '</div>' +
        '</div>';

    return res;
};

function User() {
    this.id = null;
    this.name = null;
}

User.prototype.init = function (data) {
    this.id = data.id != undefined ? data.id : null;
    this.name = data.name != undefined ? data.name : null;
};

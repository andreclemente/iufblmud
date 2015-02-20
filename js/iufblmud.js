var gid = '228544121320';

var now = new Date();
var since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
var until = new Date(now.getFullYear(), now.getMonth(), now.getDate());
until.setDate(until.getDate() + 1);

var search_text = '';
var feed = new Feed();

$(document).ready(function () {
    $('input').attr('autocomplete', 'off');

    $('#opt-fb-group-1').click(function () {
        changeGroup($("#btn-fb-group-1"), '228544121320', 'Igreja Universal dos Fazedores de Bonitas Listas Musicais dos &Uacute;ltimos Dias');
    });
    $('#opt-fb-group-2').click(function () {
        changeGroup($("#btn-fb-group-2"), '123201917718018', 'Tribo Cin&eacute;fila das Tapas &amp; Vinho Tinto');
    });
    $('#opt-fb-group-3').click(function () {
        changeGroup($("#btn-fb-group-3"), '181935148518318', '30 dias, 30 m&uacute;sicas');
    });
    $('#opt-fb-group-4').click(function () {
        changeGroup($("#btn-fb-group-4"), '117052185076587', 'Discos para 1 Ilha Deserta');
    });
    $('#opt-fb-group-5').click(function () {
        changeGroup($("#btn-fb-group-5"), '174536416007544', 'Clube de Blues');
    });
    $('#btn-fb-group-1').click(function () {
        changeGroup($(this), '228544121320', 'Igreja Universal dos Fazedores de Bonitas Listas Musicais dos &Uacute;ltimos Dias');
    });
    $('#btn-fb-group-2').click(function () {
        changeGroup($(this), '123201917718018', 'Tribo Cin&eacute;fila das Tapas &amp; Vinho Tinto');
    });
    $('#btn-fb-group-3').click(function () {
        changeGroup($(this), '181935148518318', '30 dias, 30 m&uacute;sicas');
    });
    $('#btn-fb-group-4').click(function () {
        changeGroup($(this), '117052185076587', 'Discos para 1 Ilha Deserta');
    });
    $('#btn-fb-group-5').click(function () {
        changeGroup($(this), '174536416007544', 'Clube de Blues');
    });

    var data_date = since.getDate() + '-' + (since.getMonth() + 1) + '-' + since.getFullYear();
    $('.btn-date-picker').attr('data-date', data_date);
    $('.btn-date-picker').html('<i class="icon-calendar"></i> ' + data_date);
    $('.btn-date-picker').datepicker().on('changeDate', function (e) {
        changeDate(e.date);
    });

    $('#options').on('hidden', function () {
        var sort_by = $('#sort-by-group input:radio:checked').val();
        var sort_dir = $('#sort-dir-group input:radio:checked').val();
        if (sort_by != feed.sort_by || sort_dir != feed.sort_dir) {
            feed.sort_by = sort_by;
            feed.sort_dir = sort_dir;
            feed.sort();
            feed.render();
        }
    });

    $('#search-desktop').keyup(function () {
        changeSearch($(this).val(), $('#search-tablet'), $('#search-phone'));
    });
    $('#search-tablet').keyup(function () {
        changeSearch($(this).val(), $('#search-desktop'), $('#search-phone'));
    });
    $('#search-phone').keyup(function () {
        changeSearch($(this).val(), $('#search-desktop'), $('#search-tablet'));
    });
});

function changeGroup(btn, new_gid, name) {
    $('#fb-group').modal('hide');
    if (new_gid == gid) {
        return;
    }

    $('.btn-fb-group').html(name + '  <span class="caret"></span>');

    gid = new_gid;
    feed.refresh();

    $("#btn-fb-group-1").removeClass("btn-primary");
    $("#btn-fb-group-2").removeClass("btn-primary");
    $("#btn-fb-group-3").removeClass("btn-primary");
    $("#btn-fb-group-4").removeClass("btn-primary");
    $("#btn-fb-group-5").removeClass("btn-primary");
    btn.addClass("btn-primary");
}

function changeDate(new_date) {
    $('.btn-date-picker').datepicker('hide');
    if (since == new_date) {
        return;
    }

    $('.btn-date-picker').html('<i class="icon-calendar"></i> ' + new_date.getDate() + '-' + (new_date.getMonth() + 1) + '-' + new_date.getFullYear());

    since = new_date;
    until = new Date(new_date.getFullYear(), new_date.getMonth(), new_date.getDate());
    until.setDate(until.getDate() + 1);

    feed.refresh();
}

function changeSearch(text, dst1, dst2) {
    search_text = text.toLowerCase();
    dst1.val(text);
    dst2.val(text);
    feed.render();
}

window.fbAsyncInit = function () {
    FB.init({
        appId: '145530318799386',
        channelUrl: '//woli.github.com/iufblmud/channel.html',
        version: 'v2.2',
        status: true,
        cookie: true,
        xfbml: true
    });

    FB.getLoginStatus(function (response) {
        if (response.status === 'connected') {
            feed.accessToken = response.authResponse.accessToken;
            feed.refresh();
        } else {
            // FB.login(function (response) {
            //     if (response.authResponse) {
            //         feed.accessToken = response.authResponse.accessToken;
            //         feed.refresh();
            //     }
            // }, { scope: 'read_stream' });
            window.location = "https://www.facebook.com/dialog/oauth/?client_id=145530318799386&redirect_uri=http://woli.github.com/iufblmud/index.html&scope=read_stream";
        }
    });
};

function Feed() {
    this.accessToken = null;
    this.sort_by = 'time';
    this.sort_dir = 'desc';
    this.posts = [];
}

Feed.prototype.refresh = function () {
    feed.posts = [];
    $('#posts').empty();
    $('#loading').show();

    FB.api('/'+ gid +'/feed', {
        access_token: feed.accessToken,
        until: until.valueOf()/1000
    }, responseFn);
};

function responseFn(response) {
    if (response.data == null) {
        return;
    }

    var done = false;
    var j = feed.posts.length;
    $.each(response.data, function (i, v) {
        var created_time = moment(v.created_time);
        if (created_time.isBefore(since)) {
            done = true;
            return;
        }
        feed.posts[j] = new Post();
        feed.posts[j].init(v);
        j++;
    });

    if (done) {
        feed.sort();
        feed.render();

        $('#loading').hide();
        return;
    }

    if (response.paging.next != "undefined"){
        FB.api(response.paging.next, responseFn);
    }
}

Feed.prototype.sort = function () {
    switch(feed.sort_by) {
    case 'time':
        if (feed.sort_dir == 'asc') {
            this.posts.sort(function (x, y) { return x.created_time - y.created_time; });
        } else {
            this.posts.sort(function (x, y) { return y.created_time - x.created_time; });
        }
      break;
    case 'author':
        if (feed.sort_dir == 'asc') {
            this.posts.sort(function (x, y) { return x.from.name.toLowerCase().localeCompare(y.from.name.toLowerCase()); });
        } else {
            this.posts.sort(function (x, y) { return y.from.name.toLowerCase().localeCompare(x.from.name.toLowerCase()); });
        }
      break;
    case 'post':
        if (feed.sort_dir == 'asc') {
            this.posts.sort(function (x, y) {
                var x = x.name;
                var y = y.name;
                if (x == null) {
                    x = 'post';
                }
                if (y == null) {
                    y = 'post';
                }
                return x.toLowerCase().localeCompare(y.toLowerCase());
            });
        } else {
            this.posts.sort(function (x, y) {
                var x = x.name;
                var y = y.name;
                if (x == null) {
                    x = 'post';
                }
                if (y == null) {
                    y = 'post';
                }
                return y.toLowerCase().localeCompare(x.toLowerCase());
            });
        }
      break;
    }
};

Feed.prototype.render = function () {
    var container = $('#posts');
    container.empty();
    var content = '';
    $.each(this.posts,
        function (i, post) {
            if (search_text == null ||
                search_text == '' ||
                (post.from != null && post.from.name != null && post.from.name.toLowerCase().indexOf(search_text) != -1) ||
                (post.message != null && post.message.toLowerCase().indexOf(search_text) != -1) ||
                (post.name != null && post.name.toLowerCase().indexOf(search_text) != -1)) {

                if (post.created_time > since) {
                    content += post.toHtml();
                }
            }
        }
    );
    container.html(content);
};

function Post() {
    this.id = null;
    this.from = null;
    this.message = null;
    this.name = null;
    this.link = null;
    this.created_time = null;
}

Post.prototype.init = function (data) {
    this.id = data.id != undefined ? data.id : null;
    this.message = data.message != undefined ? data.message : null;
    this.name = data.name != undefined ? data.name : null;
    this.created_time = data.created_time != undefined ? moment(data.created_time) : null;

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
    var res =
        '<div class="post">' +
            '<a href="http://www.facebook.com/profile.php?id=' + this.from.id + '">' +
                '<img class="post-img img-rounded" src="https://graph.facebook.com/' + this.from.id + '/picture">' +
            '</a>' +
            '<div class="post-details">' +
                '<small class="post-time">' + this.created_time.format("HH:mm:ss") + '</small>' +
                '<p class="post-from">' +
                    '<a href="http://www.facebook.com/profile.php?id=' + this.from.id + '">' + this.from.name + '</a>' +
                '</p>' +
                '<p class="post-message">' + this.message + '</p>' +
                '<p class="post-name">' +
                    '<a href="https://www.facebook.com/' + this.id.replace("_", "/posts/") + '">' + (this.name == null ? 'Post' : this.name) + '</a>' +
                '</p>' +
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

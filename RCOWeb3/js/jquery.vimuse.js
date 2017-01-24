/*! Vimuse - HTML5 Media Player - 4.1.3
 * Copyright 2016, Nilok Bose
 * http://codecanyon.net/user/cosmocoder
*/



// polyfill for bind()
if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
        if (typeof this !== "function") {
            // closest thing possible to the ECMAScript 5
            // internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function() {},
            fBound = function() {
                return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}




(function($, document, window) {

    'use strict';

    var Vimuse = {

        init: function(options, elem) {
            this.options        = options;
            this.isChrome       = navigator.userAgent.match(/chrome/gi) !== null;
            this.isSafari       = navigator.userAgent.match(/webkit/gi) !== null && !this.isChrome;
            this.isOpera        = navigator.userAgent.match(/opera/gi) !== null;
            this.isiOS          = navigator.userAgent.match(/(iPad|iPhone|iPod)/gi) !== null;
            this.isAndroid      = navigator.userAgent.match(/android/i) !== null;
            this.hasTouch       = 'ontouchstart' in window;
            this.msie           = navigator.appName.toLowerCase().indexOf('microsoft') != -1;
            this.isIE9          = this.msie && parseFloat(navigator.appVersion.split('MSIE')[1], 10) == 9;
            this.isIE8          = this.msie && parseFloat(navigator.appVersion.split('MSIE')[1], 10) <= 8;
            this.ie9js          = this.msie && window.IE7 && IE7.recalc ? true : false;

            this.$app           = $(elem).addClass('vm-container playlist-'+ this.options.playlistPosition +' cf');
            this.$stage         = $('<div class="vm-stage loading"/>').appendTo(this.$app);
            this.$currentInfo   = $('<div class="current-item-info"/>').appendTo(this.$stage);
            this.$audioDetails  = $('<div class="vm-audio-details"/>').appendTo(this.$stage);
            this.$audioPoster   = this.$audioDetails.append('<div class="vm-audio-poster"><img src="" /></div>').children('div.vm-audio-poster');
            this.$audioInfo     = this.$audioDetails.append('<div class="vm-audio-info"><p class="track"></p><p class="artist"></p><p class="album"></p></div>').children('div.vm-audio-info');
            this.$player        = $('<div class="vm-player"/>').appendTo(this.$stage);
            this.$playlist      = $('<ol class="vm-playlist"/>').appendTo(this.$app).addClass(this.options.playlistPosition);
            this.$window        = $(window);

            this.curItemId      = 0;
            this.maxIdValue     = -1;
            this.loopEnabled    = false;
            this.shuffleEnabled = false;
            this.player         = null;
            this.playlist       = [];


            // assign unique id numbers to all vimuse players in the page
            this.vmID = $('body').find('.vm-container').index(this.$app);

            // add the container to hold postroll content
            this.$postrollContainer = $('<div id="vm-postroll-'+ this.vmID +'" class="vm-postroll"/>').appendTo('body');

            // customize the default postroll behaviour of Mediaelement.js
            this.customMEPostroll();

            // ensure that there is only one overlay element in case there are multiple players in a page
            this.$overlay = $('div.vm-player-overlay');
            if( this.$overlay.length === 0 ) {
                this.$overlay = $('<div class="vm-player-overlay" />').appendTo('body');
            }

            // hide the current info container if not enabled
            !this.options.showCurrentItemInfo && this.$currentInfo.css('display', 'none');

            // add no-touch class to playlist if no touch events are present
            if( this.hasTouch ) {
                this.$playlist.addClass('touch');
            }
            else {
                this.$playlist.addClass('no-touch');
            }

            // if not a touch screen then add special class for custom scrollbar in playlist
            !this.hasTouch && this.$playlist.addClass('custom-scrollbar');

            // if the tap plugin is included and the player is viewed in touch screen then use 'taps' instead of 'clicks'
            this.clickEventType = this.hasTouch ? 'tap' : 'click';

            // add special classes for audio mode
            if( this.options.mediaType === 'audio' ) {
                this.$app.addClass('only-audio');
                this.options.showFileTypeIcons = false;

                if( !this.options.showAudioDetails ) {
                    this.$app.addClass('no-audio-details');
                }

                if( !this.options.showAudioCover ) {
                    this.$app.addClass('no-cover');
                }

                if( !this.options.showAudioTrackInfo ) {
                    this.$app.addClass('no-track-info');
                }
            }

            // create the auxiliary controls
            this.createAuxControls();

            // if HTML5 Fullscreen API supported then show the fullscreen button
            if( document.documentElement.requestFullscreen || document.documentElement.mozRequestFullScreen || document.documentElement.webkitRequestFullscreen || document.documentElement.msRequestFullscreen ) {
                this.$makeFullscreen.css('display', 'inline-block');
            }

            // hide playlist on load if that is option set
            if( !this.options.showPlaylistOnLoad ) {
                this.$showPlaylist.removeClass('active');
                this.$playlist.hide();

                if( this.options.playlistPosition !== 'bottom' ) {
                    this.$stage.css({width: '100%', margin: 'auto', float: 'none', height: 'auto'});
                }
            }

            // activate shuffle on load if option set
            if( this.options.shuffle ) {
                this.shufflePlaylist();
            }

            // load the playlist data from the appropriate source
            this.getPlaylistData();

            // setup voice commands
            // annyang && this.setupVoiceCommands();

            // setup events
            this.bindEvents();

            // make jquery :contains selector case insensitive, to help with filtering
            $.expr[':'].contains = function(a, i, m) {
                return jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
            };
        },


        // custom postroll behaviour
        customMEPostroll: function() {
            $.extend(MediaElementPlayer.prototype, {
                buildvmpostroll: function(player, controls, layers, media) {
                    var t = this,
                        postrollLink = t.container.find('link[rel="postroll"]').attr('href');

                    if (typeof postrollLink !== 'undefined') {
                        player.postroll =
                            $('<div class="mejs-postroll-layer mejs-layer"><a class="mejs-postroll-close" onclick="jQuery(this).parent().hide();return false;">&times;</a><div class="mejs-postroll-layer-content"></div></div>').prependTo(layers).hide();

                        t.media.addEventListener('ended', function (e) {
                            layers.find('.mejs-postroll-layer-content').html( $(postrollLink).html() );
                            player.postroll.show();
                        }, false);
                    }
                }
            });
        },


        // create the auxiliary controls
        createAuxControls: function() {
            var self = this;

            var auxControls = '<div class="vm-aux-controls">' +
                              '<a class="vm-prev-track" title="Play Previous Item"></a>' +
                              '<a class="vm-next-track active" title="Play Next Item"></a>' +
                              '<a class="vm-repeat" title="Repeat Playlist"></a>' +
                              '<a class="vm-shuffle" title="Shuffle Playlist"></a>' +
                              '<a class="vm-show-playlist active" title="Show/hide playlist"></a>' +
                              '<a class="vm-make-fullscreen" title="Make the player fullscreen"></a>' +
                              '<a class="vm-lights active" title="Turn lights on/off"></a>' +
                              // '<a class="vm-voice" title="Turn voice commands on/off"></a> +'
                              '<a class="vm-search" title="Search to filter items"></a>' +
                              '</div>' +
                              '<div class="vm-search-box"><input type="text" placeholder="Type to filter items &hellip;" /></div>';

            self.$player.after(auxControls);

            self.$prevTrack      = self.$app.find('a.vm-prev-track');
            self.$nextTrack      = self.$app.find('a.vm-next-track');
            self.$repeat         = self.$app.find('a.vm-repeat');
            self.$shuffle        = self.$app.find('a.vm-shuffle');
            self.$showPlaylist   = self.$app.find('a.vm-show-playlist');
            self.$makeFullscreen = self.$app.find('a.vm-make-fullscreen');
            self.$lights         = self.$app.find('a.vm-lights');
            // self.$voice          = self.$app.find('a.vm-voice');
            self.$search         = self.$app.find('a.vm-search');
            self.$searchBox      = self.$app.find('div.vm-search-box');

            // !annyang && self.$voice.hide();

            // hide auxiliary control bar if option set
            if( !self.options.showAuxControls ) {
                self.$app.find('div.vm-aux-controls').hide();
            }
        },


        detectMobile: function() {
            return $.ajax({
                url: this.options.phpFolder + '/mobile.php',
                dataType: 'text'
            });
        },


        // function to get playlist data as JSON from
        getPlaylistJSON: function() {
            var self = this, url = '', folderUrl = '';

            if( self.options.youtubeFeed ) {
                if( !self.options.youtubeAPIKey ) {
                    throw new Error('Youtube API key not provided');
                }

                var ytOptions = self.options.youtubeOptions;
                url = 'https://www.googleapis.com/youtube/v3/';

                if( ytOptions.source === 'user' ) {
                    url += 'channels/?part=contentDetails&forUsername=' + ytOptions.userID;
                }
                else if( ytOptions.source === 'playlist' ) {
                    url += 'playlistItems/?playlistId=' + ytOptions.playlistID + '&part=contentDetails';
                }
                else if( ytOptions.source === 'search' ) {
                    url += 'search?q=' + ytOptions.search + '&part=snippet';
                }

                url += '&maxResults=' + ytOptions.limit + '&key=' + self.options.youtubeAPIKey +'&callback=?';
            }
            else if( self.options.vimeoFeed ) {
                var vmOptions = self.options.vimeoOptions;
                url = 'https://vimeo.com/api/v2/';

                if( vmOptions.source === 'user' ) {
                    url += vmOptions.userID + '/videos.json';
                }
                else if( vmOptions.source === 'album' ) {
                    url += 'album/' + vmOptions.albumID + '/videos.json';
                }
                else if( vmOptions.source === 'channel' ) {
                    url += 'channel/' + vmOptions.channelID + '/videos.json';
                }

                url+= '?callback=?';
            }
            else if( self.options.dailymotionFeed ) {
                var dmOptions = self.options.dailymotionOptions;
                url = 'https://api.dailymotion.com/';

                if( dmOptions.source === 'user' ) {
                    url += 'user/' + dmOptions.userID;
                }
                else if( dmOptions.source === 'playlist' ) {
                    url += 'playlist/' + dmOptions.playlistID;
                }
                else if( dmOptions.source === 'group' ) {
                    url += 'group/' + dmOptions.groupID;
                }
                else if( dmOptions.source === 'channel' ) {
                    url += 'channel/' + dmOptions.channelID;
                }

                url += '/videos?fields=duration,title,thumbnail_120_url,tiny_url&limit='+dmOptions.limit+'&callback=?';
            }
            else if( self.options.scanMP3Folder || self.options.scanVideoFolder ) {
                folderUrl = self.options.scanMP3Folder ? self.options.mp3Folder : self.options.videoFolder;
                url = self.options.phpFolder + (self.options.scanMP3Folder ? '/get-mp3.php' : '/get-videos.php');

                if( folderUrl.indexOf('http') === -1 ) {
                    var a = document.createElement('a');
                    a.href = folderUrl;
                    folderUrl = a.href;
                }
            }
            else {
                url = self.options.playlistURL;
            }

            if( self.options.scanMP3Folder || self.options.scanVideoFolder ) {
                return $.getJSON(url, {folder: folderUrl});
            }
            else {
                if( self.options.youtubeFeed && self.options.youtubeOptions.source === 'user' ) {
                    var req = $.Deferred();

                    $.getJSON(url, function(userData) {
                        var id = userData.items[0].contentDetails.relatedPlaylists.uploads;
                        $.getJSON('https://www.googleapis.com/youtube/v3/playlistItems?key=' + self.options.youtubeAPIKey + '&part=contentDetails&playlistId=' + id + '&maxResults=' + ytOptions.limit + '&callback=?', function(plData) {
                            req.resolve(plData);
                        });
                    });

                    return req;
                }
                else {
                    return $.getJSON(url);
                }
            }
        },


        // get the cached playlist data
        getCache: function() {
            var req = $.ajax({
                type: 'post',
                data: {interval: this.options.cacheInterval, cacheFile: this.options.cacheFileName},
                url: this.options.cacheFolder+'/get-cache.php',
                dataType: 'json',
                global: false
            });

            return req;
        },


        // update the cache file with the fresh playlist data
        updateCache: function(json) {
            $.ajax({
                type: 'post',
                data: {playlist: JSON.stringify(json), cacheFile: this.options.cacheFileName},
                url: this.options.cacheFolder+'/update-cache.php',
                dataType: 'json',
                global: false
            });
        },


        // get playlist data either from json or from cache
        getPlaylistData: function() {
            var self = this, mobileReq;

            // detect mobile if option chosen
            if( self.options.detectMobile ) {
                mobileReq = self.detectMobile();
            }
            else {
                mobileReq = $.Deferred();
                mobileReq.resolve('false');
                self.isMobile = false;
            }

            // get playlist data from cache or if cache expired or disabled then load afresh
            mobileReq.done(function(mobile) {
                mobile === 'true' && (self.isMobile = true);

                if( self.options.enableCache ) {
                    var cacheReq = self.getCache();
                }
                else {
                    var cacheReq = $.Deferred();
                    cacheReq.resolve({expired: true});
                }

                cacheReq.done(function(cache) {
                    if( cache.expired ) {
                        if( self.options.playlistURL ) {
                            var playlistReq = self.getPlaylistJSON();

                            if( (!self.options.youtubeFeed && !self.options.vimeoFeed && !self.options.dailymotionFeed && self.options.getID3Info) || self.options.scanMP3Folder ) {
                                playlistReq.done(function(data) {
                                    self.setMediaInfo(data);
                                });
                            }
                            else {
                                playlistReq.done(function(data) {
                                    self.playlistLoaded(data);
                                });
                            }
                        }
                        else {  // initialize player using playlist object
                            if( self.options.getID3Info ) {
                                self.setMediaInfo( self.options.playlistData );
                            }
                            else {
                                self.playlistLoaded( self.options.playlistData );
                            }
                        }
                    }
                    else {
                        self.playlist = cache;
                        self.processPlaylist();
                    }
                });
            });
        },


        // check the item in the json playlist and fill up missing pieces from id3 tags in the backend
        setMediaInfo: function(json, isAppending) {
            var self = this,
                cacheReq,
                searchReq = [],
                playlistData,
                a = document.createElement('a');

            if( !self.options.scanMP3Folder && !self.options.scanVideoFolder ) {
                $.each(json, function(i) {
                    if( json[i].type === 'audio' && json[i].mp3.indexOf('http') === -1 ) {
                        a.href = json[i].mp3;
                        json[i].mp3 = a.href;
                    }

                    if( json[i].type === 'video' && json[i].mp4.indexOf('http') === -1 ) {
                        a.href = json[i].mp4;
                        json[i].mp4 = a.href;
                    }
                });
            }

            $.ajax({
                url: self.options.phpFolder + '/media-info.php',
                data: {json: JSON.stringify(json)},
                dataType: 'json',
                type: 'post',
                success: function(data) {
                    playlistData = data;

                    searchReq = $.map(playlistData, function(item, i){
                        if( playlistData[i].type === 'audio' && playlistData[i].searchTerm ) {
                            var req = $.ajax({
                                url: 'https://itunes.apple.com/search',
                                data: {term: playlistData[i].searchTerm, media: 'music', entity: 'album', limit: 1},
                                dataType: 'jsonp',
                                success: function(coverdata) {
                                    if( typeof coverdata.results[0] !== 'undefined' ) {
                                        var cover = coverdata.results[0].artworkUrl100;
                                        cover = cover.replace('100x100', '600x600');
                                        playlistData[i].poster = cover;
                                    }
                                }
                            });

                            return req;
                        }
                    });

                    $.when.apply($, searchReq).done(function(){
                        self.playlistLoaded(playlistData, isAppending);
                    });
                }
            });
        },


        // perform tasks after playlist gets loaded afresh (not from cache). Also handles the same tasks when appending items
        playlistLoaded: function(data, isAppending) {
            var self = this,
                getInfo = [];

            if( self.options.youtubeFeed && !isAppending ) {
                var item = [], vIds = [], req = $.Deferred();

                if( self.options.youtubeOptions.source === 'search' ) {
                    $.each(data.items, function(i) {
                        vIds.push(this.id.videoId);
                    });
                }
                else {
                    $.each(data.items, function(i) {
                        vIds.push(this.contentDetails.videoId);
                    });
                }

                $.getJSON('https://www.googleapis.com/youtube/v3/videos/?key=' + self.options.youtubeAPIKey + '&id=' + vIds.join(',') + '&part=snippet,contentDetails&callback=?', function(ytData) {
                    $.each(ytData.items, function(i) {
                        self.maxIdValue = i;
                        self.playlist[i] = {};
                        self.playlist[i].id = i;
                        self.playlist[i].title = this.snippet.title;
                        self.playlist[i].description = this.snippet.description;
                        self.playlist[i].type = 'youtube';
                        self.playlist[i].link = 'https://www.youtube.com/watch?v=' + this.id;
                        self.playlist[i].duration = self.formatDuration( self.parseYoutubeDuration(this.contentDetails.duration) );
                        self.playlist[i].poster = this.snippet.thumbnails.default.url;
                    });

                    req.resolve();
                })

                getInfo.push(req);
            }
            else if( self.options.vimeoFeed && !isAppending ) {
                var req = $.Deferred();

                $.each(data, function(i) {
                    self.maxIdValue = i;
                    self.playlist[i] = {};
                    self.playlist[i].id = i;
                    self.playlist[i].title = this.title;
                    self.playlist[i].description = this.description.replace(/(<([^>]+)>)/ig, '');
                    self.playlist[i].type = 'vimeo';
                    self.playlist[i].link = this.url;
                    self.playlist[i].duration = self.formatDuration(this.duration);
                    self.playlist[i].poster = this.thumbnail_medium;

                    if( i === self.options.vimeoOptions.limit - 1 ) {
                        return false;
                    }
                });

                req.resolve();
                getInfo.push(req);
            }
            else if( self.options.dailymotionFeed && !isAppending ) {
                var req = $.Deferred();

                $.each(data.list, function(i) {
                    self.maxIdValue = i;
                    self.playlist[i] = {};
                    self.playlist[i].id = i;
                    self.playlist[i].title = this.title;
                    self.playlist[i].type = 'dailymotion';
                    self.playlist[i].link = this.tiny_url;
                    self.playlist[i].duration = self.formatDuration(this.duration);
                    self.playlist[i].poster = this.thumbnail_120_url;
                });

                req.resolve();
                getInfo.push(req);
            }
            else {
                getInfo = [];

                $.each(data, function(i) {
                    var req = $.Deferred();

                    self.maxIdValue++;  // increment the max id value that will be assigned
                    data[i].id = self.maxIdValue;

                    if( data[i].type === 'youtube' ) {
                        if( !self.options.youtubeAPIKey ) {
                            throw new Error('Youtube API key not provided');
                        }

                        var vId = data[i].link.split('v=')[1],
                            url = 'https://www.googleapis.com/youtube/v3/videos/?key=' + self.options.youtubeAPIKey + '&id=' + vId + '&part=snippet,contentDetails&callback=?';

                        $.getJSON(url, function(ytdata) {
                            data[i].duration = self.formatDuration( self.parseYoutubeDuration(ytdata.items[0].contentDetails.duration) );
                            data[i].poster = ytdata.items[0].snippet.thumbnails.default.url;

                            if( !data[i].title ) {
                                data[i].title = ytdata.items[0].snippet.title;
                            }

                            req.resolve();
                        });
                    }
                    else if( data[i].type === 'vimeo' ) {
                        var vId = data[i].link.split('/').pop(),
                            url = 'https://vimeo.com/api/v2/video/'+vId+'.json?callback=?';

                        $.getJSON(url, function(vmdata) {
                            data[i].duration = self.formatDuration( vmdata[0].duration );
                            data[i].poster = vmdata[0].thumbnail_medium;

                            if( !data[i].title ) {
                                data[i].title = vmdata[0].title;
                            }

                            req.resolve();
                        });
                    }
                    else if( data[i].type === 'dailymotion' ) {
                        var vId = data[i].link.split('/').pop(),
                            url = 'https://api.dailymotion.com/video/'+vId+'?fields=duration,thumbnail_120_url,title&callback=?';

                        $.getJSON(url, function(dmdata) {
                            data[i].duration = self.formatDuration( dmdata.duration );
                            data[i].poster = dmdata.thumbnail_120_url;

                            if( !data[i].title ) {
                                data[i].title = dmdata.title;
                            }

                            req.resolve();
                        });
                    }
                    else if( data[i].type === 'video' ) {
                        var src = self.isMobile ? data[i].mobileMp4 : data[i].mp4;

                        // set the duration
                        if( self.options.getID3Info ) {
                            req.resolve();  // duration already set in backend using getid3
                        }
                        else {   // else get duration from Mediaelement.js
                            if( !self.isiOS && !self.isAndroid && !self.isIE8 ) {
                                var video = $('<video id="vm-test-video-'+i+'" class="vm-test-video" preload="metadata" src="'+src+'">').appendTo('body');
                                new MediaElement('vm-test-video-'+i, {
                                    success: function(me) {
                                        me.addEventListener('loadedmetadata', function() {
                                            data[i].duration = self.formatDuration( me.duration );
                                            req.resolve();
                                            video.remove();
                                            // me.remove();
                                            me.pluginType !== 'native' && $('#' + me.pluginElement.id).remove();
                                            $('#'+me.id+'_container').remove();
                                        });
                                    }
                                });
                            }
                            else {  // duration info can't be extracted in mobile so set to 0:00
                                data[i].duration = '0:00';
                                req.resolve();
                            }
                        }
                    }
                    else if( data[i].type === 'audio' ) {
                        var src = data[i].mp3,
                            title = '';

                        // set the title using track and artist info (to be displayed in playlist)
                        if( !data[i].artist ) {
                            if( data[i].track ) {
                                title = data[i].track;
                            }
                            else {
                                title = data[i].mp3.split('/').pop().split('.')[0];
                            }
                        }
                        else {
                            title = data[i].track + ' - ' + data[i].artist;
                        }

                        data[i].title = title;

                        // set the duration
                        if( self.options.getID3Info ) {
                            req.resolve();  // duration already set in backend using getid3
                        }
                        else {
                            if( !self.isiOS && !self.isAndroid && !self.isIE8 ) {  // else get duration from Mediaelement.js
                                var audio = $('<audio id="vm-test-audio-'+i+'" class="vm-test-audio" preload="metadata" src="'+src+'">').appendTo('body');
                                new MediaElement('vm-test-audio-'+i, {
                                    success: function(me) {
                                        me.addEventListener('loadedmetadata', function() {
                                            data[i].duration = self.formatDuration( me.duration );
                                            req.resolve();
                                            audio.remove();
                                            // me.remove();
                                            me.pluginType !== 'native' && $('#' + me.pluginElement.id).remove();
                                            $('#'+me.id+'_container').remove();
                                        });
                                    }
                                });
                            }
                            else { // duration info can't be extracted in mobile so set to 0:00
                                data[i].duration = '0:00';
                                req.resolve();
                            }
                        }
                    }
                    else if( data[i].type === 'radio' ) {
                        if( self.options.pullRadioStreamCover ) {
                            self.getStreamInfo(data[i]).done(function(stdata) {
                                if( stdata.status === 'new' ) {
                                    data[i].poster = stdata.cover;
                                }

                                req.resolve();
                            });
                        }
                        else {
                            req.resolve();
                        }

                        data[i].duration = '0:00';  // no duration for radio streams
                        data[i].track = '';
                    }

                    getInfo.push(req);
                });
            }


            $.when.apply($, getInfo).done(function() {
                // window.mejs.players = {};   // clean up leftover ME player references
                if( isAppending ) {
                    Array.prototype.push.apply(self.playlist, data);
                    self.setupPlaylist(isAppending);
                }
                else {
                    if( !self.options.youtubeFeed && !self.options.vimeoFeed && !self.options.dailymotionFeed ) {
                        self.playlist = data;
                    }

                    self.options.enableCache && self.updateCache(self.playlist);
                    self.processPlaylist();
                }
            });
        },


        // post processing of playlist after it is loaded
        processPlaylist: function() {
            var self = this;

            // reverse the playlist order if option enabled
            self.options.reversePlaylistOrder && self.playlist.reverse();

            // show the playlist on the page
            self.setupPlaylist();

            // lock the player at the top of the page when scrolling
            if( self.options.fixPlayerOnScroll && self.options.playlistPosition === 'bottom' && !self.hasTouch ) {
                self.setupStageLock();
            }

            // setup player
            self.$playlist.children('li').eq(0).find('span.title').trigger(self.clickEventType);

            // make the playlist sortable
            if( self.options.enablePlaylistSort ) {
                self.makePlaylistSortable();
            }

            // set max-height on bottom playlist
            if( self.options.playlistPosition === 'bottom' && self.bottomPlaylistMaxHeight !== 'auto' ) {
                self.$playlist.css('max-height', self.options.bottomPlaylistMaxHeight);
            }

            // trigger the resize event to make adjustments to player layout
            self.$window.trigger('resize.vimuse'+self.vmId);

            // remove the loading state
            self.$stage.removeClass('loading');

            // insert custom scrollbar
            self.$playlist.filter('.custom-scrollbar').perfectScrollbar({
                minScrollbarLength: 20,
                suppressScrollX: true
            });

            // trigger the onSetup event for the player
            self.onSetup();
        },


        // make the playlist sortable
        makePlaylistSortable: function() {
            var self = this;

            self.$playlist.sortable({
                axis: 'y',
                cancel: 'a',
                containment: 'parent',
                cursor: 'move',
                items: '> li',
                revert: 400,
                helper: 'clone',
                placeholder: 'item-holder',
                // delay: self.hasTouch ? 500 : 0,
                stop: function() {
                    self.hasTouch && self.$playlist.sortable('disable').children('li').removeClass('selected');
                }
            });

            if( self.hasTouch ) {
                self.$playlist.sortable('disable');

                self.$app.
                    hammer({swipeVelocityY: 0.3, dragMinDistance: 60})
                    .on('swipeup swipedown', '.vm-playlist', function(e) {
                        self.$playlist.sortable('disable');
                    })
                    .on('tap', '.vm-playlist li', function(e) {
                        self.$playlist.sortable('enable');
                        $(this).addClass('selected');
                    });
            }
        },


        // function to format duration of videos from seconds to mm:ss
        formatDuration: function(time) {
            time = parseInt(time, 10);  // in case the time is a string
            var hours = parseInt( time / 3600, 10 ) % 24;
            var minutes = parseInt( time / 60, 10 ) % 60;
            var seconds = time % 60;
            var result = '';

            if( hours > 0 ) {
                result = (hours) + ':' + (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds  < 10 ? '0' + seconds : seconds);
            }
            else {
                result = (minutes) + ':' + (seconds  < 10 ? '0' + seconds : seconds);
            }

            return result;
        },


        // convert Youtube video duration ISO 8601 string to seconds
        parseYoutubeDuration: function(duration) {
            var matches = duration.match(/[0-9]+[HMS]/g);

            var seconds = 0;

            matches.forEach(function (part) {
                var unit = part.charAt(part.length-1);
                var amount = parseInt(part.slice(0,-1), 10);

                switch (unit) {
                    case 'H':
                        seconds += amount*60*60;
                        break;
                    case 'M':
                        seconds += amount*60;
                        break;
                    case 'S':
                        seconds += amount;
                        break;
                }
            });

            return seconds;
        },



        // setup playlist for display on page. Handles html creation of both initial playlist setup and when appending items
        setupPlaylist: function(isAppending) {
            var self = this,
                list = '',
                $allItems = self.$playlist.children('li'),
                newItemnum = self.playlist.length,
                curItemnum = $allItems.not('.loading').length,
                noIcons = self.options.showFileTypeIcons ? '' : 'no-icons',
                showThumb = self.options.showPlaylistThumbs ? ' show-thumb' : '';

            for( var i = curItemnum; i < newItemnum; i++ ) {
                list += '<li class="'+ noIcons + showThumb +'" data-type="'+ self.playlist[i].type +'" data-id="'+ self.playlist[i].id +'">';
                list += self.options.showPlaylistThumbs ? '<span class="item-thumb"><img src="'+ self.playlist[i].poster +'" alt=""></span>' : '';
                list += '<span class="title">'+ self.playlist[i].title +'</span>';

                list += self.options.showItemDuration ? '<span class="duration">'+ self.playlist[i].duration +'</span>' : '';
                list += self.options.showDeleteButtons ? '<a class="delete"></a>' : '';

                if( self.options.showLyricsLinks && self.playlist[i].lyrics ) {
                    list += '<a class="lyrics" href="'+ self.playlist[i].lyrics + '" download="'+ self.playlist[i].lyrics.split('/').pop() +'" title="Download the lyrics of this song"></a>';
                }

                if( self.options.showDownloadLinks && self.playlist[i].free !== false ) {
                    var filename = self.playlist[i].downloadName;

                    if( self.playlist[i].type === 'video' ) {
                        (filename === undefined || filename == '') && (filename = self.playlist[i].mp4.split('/').pop());
                        list += '<a class="free-media '+ self.playlist[i].type +'" href="'+ self.playlist[i].mp4 +'" download="'+ filename +'" title="Download mp4 version of this video"></a>';
                    }
                    else if( self.playlist[i].type === 'audio' ) {
                        (filename === undefined || filename == '') && (filename = self.playlist[i].mp3.split('/').pop());
                        list += '<a class="free-media '+ self.playlist[i].type +'" href="'+ self.playlist[i].mp3 +'" download="'+ filename +'" title="Download mp3 version of this audio"></a>';
                    }
                }

                if( self.options.showPurchaseLinks && self.playlist[i].purchase ) {
                    list += '<a class="purchase" href="'+ self.playlist[i].purchase + '" title="Visit page to purchase item"';
                    list += self.options.newWindowPurchaseLinks ? ' target="_blank">' : '>';
                    list += '</a>';
                }

                if( self.options.showURLLinks && self.playlist[i].url ) {
                    list += '<a class="link" href="'+ self.playlist[i].url + '" title="Visit page"';
                    list += self.options.newWindowURLLinks ? ' target="_blank">' : '>';
                    list += '</a>';
                }

                list += '</li>';
            }

            if( isAppending ) {
                self.$playlist.children('li').last().after(list).end().filter('.loading').remove();
                self.$playlist.sortable('refresh');
                self.checkTrackIndex();
                self.resizeItemTitle();
                self.onItemsAppended(); // fire the "items appended" event
            }
            else {
                self.$playlist.html(list);
            }

            // if( !self.options.showPlaylistThumbs ) {
            //     self.$playlist.find('span.free-media').each(function(){
            //         var $this = $(this);
            //         $.data(this, 'width', $this.width());
            //         $this.width(0);
            //     });
            // }
        },


        // voice commands
        // setupVoiceCommands: function() {
        //     var self = this,
        //         api = this.playerAPI();

        //     var commands = {
        //         'play': api.play,
        //         'pause': api.pause,
        //         'next': api.next,
        //         'previous': api.prev,
        //         'go to *item': api.gotoItem,
        //         'seek to *time': api.seek
        //     };

        //     annyang.addCommands(commands);
        // },


        // get specific item from playlist based on id
        getPlaylistItem: function(id) {
            return $.grep(this.playlist, function(item) {
                return item.id === id;
            })[0];
        },


        // get the index of a playlist item based on id
        getPlaylistItemIndex: function(id) {
            var self = this,
                index = -1,
                i = self.playlist.length;

            while(i--) {
                if( id === self.playlist[i].id ) {
                    index = i;
                    break;
                }
            }

            return index;
        },



        // create fresh player instance each time when selecting a playlist item
        createPlayer: function(item, play) {
            var self = this,
                $items = self.$playlist.children('li'),
                curIndex = $items.index( $items.filter('li.current') ),
                mediaHtml;

            // autoplay all items (if enabled) after the first item is played
            if( curIndex !== 0 ) {
                self.options.autoplayOnPlayerLoad = true;
            }

            if( item.type === 'video' ) {
                var mp4src = self.isMobile ? item.mobileMp4 : item.mp4;

                mediaHtml = '<video preload="metadata" width="640" height="360" poster="'+ item.poster +'" style="width: 100%;">';
                mediaHtml += '<source type="video/mp4" src="'+ mp4src +'" />';

                if( item.webm ) {
                    mediaHtml += '<source type="video/webm" src="'+ item.webm +'" />';
                }

                if( item.ogv ) {
                    mediaHtml += '<source type="video/ogg" src="'+ item.ogv +'" />';
                }

                if( item.subtitle ) {
                    $.each(item.subtitle, function() {
                        mediaHtml += '<track kind="subtitles" src="'+ this.file +'" srclang="'+ this.lang +'" />';
                    });
                }

                if( item.postroll ) {
                    mediaHtml += '<link rel="postroll" href="#vm-postroll-'+ self.vmID +'" />';
                    self.$postrollContainer.html(item.postroll);
                }

                mediaHtml += '</video>';
            }
            else if( item.type === 'youtube' ) {
                if( self.isiOS || self.isAndroid ) {
                    mediaHtml = '<video controls preload="none" width="640" height="360" style="width: 100%;">';
                }
                else {
                    mediaHtml = '<video controls preload="none" width="640" height="360" style="max-width: 100%;">';
                }
                mediaHtml += '<source type="video/youtube" src="'+ item.link +'" />';
                mediaHtml += '</video>';
            }
            else if( item.type === 'vimeo' ) {
                var vId = item.link.split('/').pop(),
                    autoplay = self.options.autoplay ? '&autoplay=1' : '';

                autoplay = !self.options.autoplayOnPlayerLoad && curIndex === 0 ? '' : autoplay;
                mediaHtml = '<iframe src="https://player.vimeo.com/video/'+ vId +'?api=1&player_id='+ vId + autoplay +'" width="640" height="360" frameborder="0" webkitAllowFullScreen allowFullScreen></iframe>';
            }
            else if( item.type === 'dailymotion' ) {
                var vId = item.link.split('/').pop(),
                    autoplay = self.options.autoplay ? '&autoplay=1' : '',
                    syndication = self.options.dailymotionSyndication ? '&syndication='+self.options.dailymotionSyndication : '';

                autoplay = !self.options.autoplayOnPlayerLoad && curIndex === 0 ? '' : autoplay;
                mediaHtml = '<iframe src="https://www.dailymotion.com/embed/video/'+ vId +'?api=postMessage'+ autoplay + syndication +'" width="640" height="360" frameborder="0" allowfullscreen></iframe>';
            }
            else if( item.type === 'radio' ) {
                var streamUrl = item.link + '?nocache=' + Math.floor(Math.random() * 10000);
                mediaHtml = '<audio controls type="audio/mpeg" width="640" style="width: 100%" src="'+ streamUrl +'"></audio>';
            }
            else {
                mediaHtml = '<audio controls width="640" style="width: 100%">';
                mediaHtml += '<source type="audio/mpeg" src="'+ item.mp3 +'" />';

                if( item.ogg ) {
                    mediaHtml += '<source type="audio/ogg" src="'+ item.ogg +'" />';
                }

                mediaHtml += '</audio>';
            }

            // to prevent jumping of the player while a new instance is created, retain its current height
            self.$stage.height( self.$stage.height() );

            self.$player.removeClass().addClass('vm-player');

            if( item.type === 'youtube' ) {
                self.$player.addClass('video');
            }
            else {
                self.$player.addClass(item.type);
            }

            // if audio item then add the poster
            if( item.type === 'audio' || item.type === 'radio' ) {
                var img = self.$audioPoster.children('img')[0];
                self.$audioPoster.show().addClass('img-loading');
                img.src = item.poster;

                // if image is already loaded or cached
                if( img.complete ) {
                    self.$audioPoster.removeClass('img-loading');
                }
                else {
                    img.onload = function() {
                        self.$audioPoster.removeClass('img-loading');
                    };
                }

                if( self.options.mediaType === 'audio' ) {
                    self.$audioInfo.children('p.track').html(item.track);
                    self.$audioInfo.children('p.artist').html(item.artist);
                    self.$audioInfo.children('p.album').html(item.album);
                }
            }
            else {
                self.$audioPoster.hide();
                // self.$player.removeClass('audio radio');
            }

            // if( item.type === 'video' || item.type === 'youtube' ) {
            //     self.$player.addClass('video');
            // }
            // else {
            //     self.$player.removeClass('video');
            // }

            // hide the control bar for Vimeo
            // if( item.type === 'vimeo' ) {
            //     self.$player.addClass('vimeo');
            // }
            // else {
            //     self.$player.removeClass('vimeo');
            // }

            // if( item.type === 'dailymotion' ) {
            //     self.$player.addClass('dailymotion');
            // }


            if( self.options.mediaType !== 'audio' && self.options.showCurrentItemInfo ) {

                // set current item info
                self.$currentInfo.html( item.title ).css('display', 'block');

                // then hide it after a few seconds (visible later on hover)
                setTimeout(function() {
                    self.$currentInfo.css('display', '');
                }, 2000);
            }

            /*
            * destroy any previous instance of the ME player
            * don't use ME's own remove() method as it forces exit from fullscreen
            */
            if( self.player ) {
                if( !((self.isAndroid || self.isiOS) && self.player.media.pluginType === 'youtube') ) {
                    self.player.media.pluginType !== 'native' && self.player.media.pluginElement && $('#' + self.player.media.pluginElement.id).parent().remove();
                }

                self.$player.empty();
                // window.mejs.players = [];
                clearInterval(self.radioStreamInterval);  // clear the interval for getting radio stream info

                // Remove the player from the mejs.players object so that pauseOtherPlayers doesn't blow up when trying to pause a non existent flash api.
                delete mejs.players[self.player.id];
                self.player.globalUnbind();
                self.player = null;
            }

            // unbind 'message' event used for Vimeo and Dailymotion
            self.$window.off('message.vimuse'+self.vmID);

            // prevent an odd Chrome bug of shifting of the playlist, where Flash is used
            self.$player.hasClass('video') && self.isChrome && self.$stage.css('overflow', 'hidden');


            // now create the new ME player instance
            self.$player.html(mediaHtml).not('.vimeo, .dailymotion').children().mediaelementplayer({
                hideVolumeOnTouchDevices: self.isAndroid ? true : false,
                alwaysShowControls: self.isiOS,
                startVolume: self.options.volume,
                enablePluginSmoothing: true,
                iPadUseNativeControls: item.type === 'youtube',
                iPhoneUseNativeControls: item.type === 'youtube',
                AndroidUseNativeControls: item.type === 'youtube',
                startLanguage: self.options.startLanguage,
                mode: (self.isChrome && !self.isiOS && !self.isAndroid) || (item.type === 'radio' && self.isOpera) ? 'shim' : 'auto',
                features: item.type === 'radio' ? ['playpause', 'current', 'volume'] : ['playpause', 'current', 'progress', 'duration', 'tracks', 'volume', 'fullscreen', 'vmpostroll'],
                success: function(me, node, player) {
                    self.player = player;

                    // restore auto height of player container
                    self.$stage.css('height', 'auto');

                    // when playing youtube videos in iPad use native iPad/Youtube controls so that fullscreen works
                    if( (self.isiOS || self.isAndroid) && item.type === 'youtube' ) {
                        var src = self.$player.find('iframe').attr('src');
                        src = src.replace('controls=0', 'controls=1');
                        self.$player.find('iframe').attr('src', src);
                    }

                    // set the size of the player for video/youtube items
                    if( self.$player.hasClass('video') ) {
                        // a timeout is needed for IE11 and Edge for Flash to initialize properly
                        setTimeout(function() {
                          var width = self.$player.width(),
                            height = width*0.5625;

                          player.setPlayerSize(width, height);
                          player.setControlsSize();
                          !self.isiOS && !self.isAndroid && self.player.media.setVideoSize(width, height);

                          // remove the Chome playlist shift fix
                          self.isChrome && self.$stage.css('overflow', '');
                        }, 50);
                    }

                    // reapply css styles when using IE9.js
                    if( self.ie9js ) {
                        IE7.recalc();
                    }

                    // if autoplay option is chosen
                    play = !self.options.autoplayOnPlayerLoad && curIndex === 0 ? false : play;
                    if( play ) {
                        if( item.type === 'youtube' ) {
                            if( me.pluginType === 'youtube' ) {
                                me.play();
                            }
                            else {
                                me.addEventListener('canplay', function() {
                                    player.play();
                                }, false);
                            }
                        }
                        else {
                            me.play();
                        }
                    }


                    // get info for radio stream
                    if( item.type === 'radio' && self.options.pullRadioTrackInfo ) {
                        self.changeRadioInfo(item);  // get stream info immediately

                        // after that keep polling continuously
                        self.radioStreamInterval = setInterval(function() {
                            self.changeRadioInfo(item);
                        }, self.options.radioInfoPollInterval);
                    }

                    me.addEventListener('play', self.started.bind(self), false);
                    me.addEventListener('pause', self.paused.bind(self), false);
                    me.addEventListener('timeupdate', self.timeupdate.bind(self), false);
                    me.addEventListener('ended', self.finishedPlaying.bind(self), false);
                }
            });

            if( self.$player.hasClass('vimeo') ) {
                self.$stage.css('height', 'auto');

                // listen for messages from the player
                self.$window.on('message.vimuse'+self.vmId, self.vimeoMsgReceived.bind(self));
            }
            else if ( self.$player.hasClass('dailymotion') ) {
                self.$stage.css('height', 'auto');

                // listen for messages from the player
                self.$window.on('message.vimuse'+self.vmId, self.dailymotionMsgReceived.bind(self));
            }
        },


        // reload the radio stream info when new track starts playing
        changeRadioInfo: function(item) {
            var self = this,
                itemIndex = self.getPlaylistItemIndex(self.curItemId),
                req = self.getStreamInfo(item);

            req.done(function(stdata) {
                if( stdata.status === 'new' ) {
                    var title = self.playlist[itemIndex].title + ' - ' + stdata.track,
                        cover = stdata.cover;

                    self.playlist[itemIndex].track = stdata.track;

                    self.options.mediaType === 'audio' && self.$audioInfo.children('p.track').html(stdata.track);
                    self.$playlist.find('li.current span.title').text(title);
                    self.$currentInfo.html(title);

                    if( self.options.pullRadioStreamCover ) {
                        self.playlist[itemIndex].poster = cover;
                        self.$playlist.find('li.current img')[0].src = cover;
                        self.$audioPoster.children('img')[0].src = cover;
                    }
                    else {
                        self.$audioPoster.children('img')[0].src = item.poster;
                    }
                }
                else if( stdata.status === 'same' ) {
                    self.$currentInfo.html( self.playlist[itemIndex].title + ' - ' + self.playlist[itemIndex].track );
                }
                else if( stdata.status === 'locked' ) {  // no info can be obtained from this stream so stop polling
                    clearInterval(self.radioStreamInterval);
                }
            });
        },


        // get radio stream info
        getStreamInfo: function(item) {
            var a = $('<a>', {href: item.link})[0];

            return $.ajax({
                url: this.options.phpFolder + '/stream-info.php',
                cache: false,
                data: {protocol: a.protocol, rootUrl: a.host, path: a.pathname, type: item.radioType, track: item.track, pullCover: this.options.pullRadioStreamCover},
                dataType: 'json',
                global: false
            });
        },


        // handle messages received from the vimeo player
        vimeoMsgReceived: function(e) {
            var data = JSON.parse(e.originalEvent.data),
                $iframe = this.$player.find('iframe'),
                url = $iframe.attr('src').split('?')[0];

            if( data.event === 'ready' ) {
                var json = {
                    method: 'addEventListener',
                    value: 'finish'
                };

                $iframe[0].contentWindow.postMessage(JSON.stringify(json), url);
            }
            else if( data.event === 'finish' ) {
                this.finishedPlaying();
            }
        },


        // handle messages received from the dailymotion player
        dailymotionMsgReceived: function(e) {
            var dmevent = e.originalEvent.data.split('=').pop();

            if( dmevent === 'ended' ) {
                this.finishedPlaying();
            }
        },


        // when the audio/video finishes playing proceed to next item
        finishedPlaying: function() {
            var self = this,
                $items = self.$playlist.children('li'),
                curIndex = $items.index( $items.filter('li.current') );

            self.ended();   // trigger the "ended" event

            if( self.options.playlistProgress ) {
                if( self.shuffleEnabled ) {
                    var $notplayed = $items.not('.played'),
                        random = Math.floor( Math.random() * $notplayed.length );

                    // if all items have been played then stop
                    if( $notplayed.length === 0 ) {
                        return false;
                    }

                    !random && (random = 0);
                    curIndex = random;
                    $notplayed.eq(curIndex).find('span.title').trigger(self.clickEventType);
                }
                else if( self.loopEnabled && self.$repeat.hasClass('one') ) {  // repeat current track
                    self.player.play();
                }
                else if( curIndex === $items.length - 1 ) {
                    if( self.loopEnabled && !self.$repeat.hasClass('one') ) {  // repeat entire playlist
                        $items.removeClass('played').eq(0).find('span.title').trigger(self.clickEventType);
                    }
                    else {
                        return false;
                    }
                }
                else {
                    $items.eq(++curIndex).find('span.title').trigger(self.clickEventType);
                }
            }
        },


        // set the length of the item title container based on available space
        resizeItemTitle: function() {
            var self = this;

            if( self.options.playlistPosition !== 'bottom' && !self.$playlist.hasClass('no-float') && self.options.showPlaylistThumbs ) {
                self.$playlist.find('span.title').css('width', '');
            }
            else {
                if( self.$playlist.is(':hidden') ) {
                    self.$playlist.addClass('resizing');
                }

                self.$playlist.children('li').each(function() {
                    var $item         = $(this),
                        itemWidth     = $item.width(),
                        downloadWidth = $item.children('a.free-media').outerWidth(true),
                        linkWidth     = $item.children('a.link').outerWidth(true),
                        purchaseWidth = $item.children('a.purchase').outerWidth(true),
                        lyricsWidth   = $item.children('a.lyrics').outerWidth(true),
                        durationWidth = $item.children('span.duration').outerWidth(true),
                        delWidth      = $item.children('a.delete').outerWidth(true),
                        titleWidth    = itemWidth - linkWidth - purchaseWidth - downloadWidth - lyricsWidth - delWidth - durationWidth - 20;

                    $item.children('span.title').outerWidth(titleWidth);
                });

                self.$playlist.removeClass('resizing');
            }
        },


        // set the layout of the app based on parent container width
        setLayout: function() {
            var self = this;

            if( self.$app.parent().width() < 630 ) {
                self.$stage.add(self.$playlist).addClass('no-float');
                self.$app.addClass('one-col');
                self.$playlist.css('max-height', self.options.bottomPlaylistMaxHeight);
                self.resizeItemTitle();
            }
            else if( document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement ) {
                self.$stage.add(self.$playlist).addClass('no-float');
                self.$playlist.css('max-height', self.options.bottomPlaylistMaxHeight);
                self.resizeItemTitle();
            }
            else {
                self.$stage.add(self.$playlist).removeClass('no-float');
                self.$app.removeClass('one-col');
                self.options.playlistPosition !== 'bottom' && self.$playlist.css('max-height', '');
                self.resizeItemTitle();
            }

            if( self.$player.hasClass('video') && self.player ) {  // self.player maybe undefined if function is executed before the player is created during initialization
                var width = self.player.container.hasClass('mejs-container-fullscreen') ? self.player.container.width() : self.$player.width(),  // ME container gives accurate width in fullscreen
                    height = width*0.5625;

                self.player.setPlayerSize(width, height);
                self.player.setControlsSize();
                !self.isiOS && !self.isAndroid && self.player.media.setVideoSize(width, height);
            }
        },


        // get the proper vendor-prefixed page-visibility attribute
        getHiddenProp: function() {
            var prefixes = ['webkit','moz','ms','o'];

            // if 'hidden' is natively supported just return it
            if ('hidden' in document) {
                return 'hidden';
            }

            // otherwise loop over all the known prefixes until we find one
            for (var i = 0; i < prefixes.length; i++){
                if ( (prefixes[i] + 'Hidden') in document ) {
                    return prefixes[i] + 'Hidden';
                }
            }

            // otherwise it's not supported
            return null;
        },


        // function to check if the page is hidden
        isPageHidden: function() {
            var prop = this.getHiddenProp();
            if( !prop ) {
                return false;
            }

            return document[prop];
        },


        // stop playing when the page is hidden or not in focus
        pageVisChange: function() {
            this.isPageHidden() && this.player && this.player.pause();
        },


        // start playing an item
        playItem: function(e) {
            var self = e.data.self,
                $itemToPlay = $(this).closest('li'),
                $items = self.$playlist.children('li');

            if( $itemToPlay.hasClass('current') ) {
                return;
            }

            // close search box if open and show all items
            if( self.$playlist.hasClass('searching') ) {  // search closed so show all items
                self.$searchBox.slideUp(400).find('input').val('');
                self.$playlist.removeClass('searching');
                $items.removeClass('filtered first last').slideDown(400);
            }

            self.curItemId = $itemToPlay.data('id');
            var playlistItem = self.getPlaylistItem(self.curItemId);

            $items.removeClass('current');
            $itemToPlay.addClass('current played');
            self.checkTrackIndex();

            // scroll the playlist if needed after all slideDown animations are complete
            $items.promise().done(function() {
                self.scrollPlaylist($itemToPlay);
            });

            self.createPlayer( playlistItem, self.options.autoplay );

            // trigger onItemChange event
            self.onItemChange();
        },


        // go to next item in playlist
        nextTrack: function() {
            var self = this,
                $items = self.$playlist.children('li'),
                curIndex = $items.index( $items.filter('li.current') );

            if( curIndex === $items.length - 1 ) {
                return false;
            }
            else {
                $items.eq(++curIndex).find('span.title').trigger(self.clickEventType);
            }
        },


        // go to previous item in playlist
        prevTrack: function() {
            var self = this,
                $items = self.$playlist.children('li'),
                curIndex = $items.index( $items.filter('li.current') );

            if( curIndex === 0 ) {
                return false;
            }
            else {
                $items.eq(--curIndex).find('span.title').trigger(self.clickEventType);
            }
        },


        // add/remove "active" class on the next/prev track buttons
        checkTrackIndex: function() {
            var self = this,
                $items = self.$playlist.children('li'),
                curIndex = $items.index( $items.filter('li.current') );

            if( curIndex === 0 ) {
                self.$prevTrack.removeClass('active');
                self.$nextTrack.addClass('active');
            }
            else if ( curIndex ===  $items.length - 1 ) {
                self.$prevTrack.addClass('active');
                self.$nextTrack.removeClass('active');
            }
            else {
                self.$prevTrack.addClass('active');
                self.$nextTrack.addClass('active');
            }
        },


        // scroll the playlist
        scrollPlaylist: function($item) {
            var self       = this,
                listHeight = self.$playlist.innerHeight(),
                itemHeight = $item.outerHeight(),
                inViewNum  = parseInt(listHeight/itemHeight, 10),
                curScroll  = self.$playlist.scrollTop(),
                curIndex   = self.$playlist.children('li').index($item),
                newScroll  = ((curIndex + 1) - inViewNum) * itemHeight;

            // scroll playlist only if selected item is out of view
            if( newScroll >= curScroll || curIndex < curScroll/itemHeight ) {
                self.$playlist.animate({scrollTop: newScroll}, 400, function() {
                    self.$playlist.hasClass('custom-scrollbar') && self.$playlist.perfectScrollbar('update');
                });
            }
        },


        /*
         * add "active" class to the loop button if loop option enabled
         * if already active then add "one" class to repeat just one track
         * if both "active" and "one" class present then deactivate "repeat" option
         */
        repeatTrack: function() {
            var self = this;

            if( self.$repeat.hasClass('one') ) {
                self.loopEnabled = false;
                self.$repeat.removeClass('active one').attr('title', 'Repeat Playlist');
            }
            else if( self.$repeat.hasClass('active') ) {
                self.$repeat.addClass('one').attr('title', 'Deactivate Repeat');
            }
            else {
                self.loopEnabled = true;
                self.$repeat.addClass('active').attr('title', 'Repeat Current Item');
            }
        },


        // add "active" class to the shuffle button if shuffle option enabled
        shufflePlaylist: function() {
            var self = this;

            self.shuffleEnabled = !self.shuffleEnabled;

            if( self.shuffleEnabled ) {
                self.$shuffle.addClass('active');
            }
            else {
                self.$shuffle.removeClass('active');
            }
        },


        // show/hide the playlist
        showPlaylist: function() {
            var self = this;

            if( self.$showPlaylist.hasClass('active') ) {
                if( self.options.playlistPosition === 'bottom' || self.$playlist.hasClass('no-float') ) {
                    self.$playlist.slideUp(600);
                }
                else {
                    self.$playlist.animate({width: 0}, 400);
                    self.$stage.animate({width: self.$app.width()}, 400, function() {
                        self.$playlist.css({display: 'none', width: ''});
                        self.$stage.css({ width: '100%', margin: 'auto', float: 'none'});

                        if( self.$player.hasClass('video') ) {
                            var width = self.$player.width(),
                                height = width*0.5625;

                            self.player.setPlayerSize(width, height);
                            self.player.setControlsSize();
                        }
                    });
                }

                self.$showPlaylist.removeClass('active');
            }
            else {
                if( self.options.playlistPosition === 'bottom' || self.$playlist.hasClass('no-float') ) {
                    self.$playlist.slideDown(600);
                    self.$stage.css({ width: '', margin: '', float: ''});
                }
                else {
                    var w = self.options.mediaType === 'audio' ? 0.4444 : 0.3333;
                    self.$playlist.css({display: 'block', width: 0}).animate({width: self.$app.width() * w}, 400);
                    self.$stage.css({ margin: '', float: ''});
                    self.$stage.animate({width: (1.0 - w) * self.$app.width()}, 400, function() {
                        self.$playlist.add(self.$stage).css('width', '');

                        if( self.$player.hasClass('video') ) {
                            var width = self.$player.width(),
                                height = width*0.5625;

                            self.player.setPlayerSize(width, height);
                            self.player.setControlsSize();
                        }
                    });
                }

                self.$showPlaylist.addClass('active');
            }
        },


        // fix the player at the top of the page
        setupStageLock: function() {
            var self = this,
                scrollTimer;

            self.lockset = false;

            self.$window.on('scroll.vimuse'+self.vmId, function(){
                if( scrollTimer ) {
                    clearTimeout(scrollTimer);
                }

                scrollTimer = setTimeout(function() {
                    self.fixStage();
                }, 10 );
            });
        },


        // helper function to fix the player on scroll
        fixStage: function() {
            var self = this,
                stageHeight = self.$stage.outerHeight(),
                appHeight = self.$app.outerHeight(),
                stageTopPos = self.$app.offset().top,
                startPos = stageTopPos - self.options.playerFixOffset,
                endPos = startPos + ( appHeight - stageHeight),
                winHeight = self.$window.height() - self.options.playerFixOffset,
                pos = self.$window.scrollTop();

            if( winHeight <= stageHeight || appHeight === stageHeight ) {
                self.$stage.removeClass('fixed scroll-end').css({left: '', top: '', width: ''});
                self.$app.css('padding-top', '');
                self.lockset = false;
            }
            else if( !self.lockset && pos > startPos && pos < endPos ) {
                self.$app.css('padding-top', self.$stage.outerHeight(true) );
                self.$stage.css({left: self.$stage.offset().left, top: self.options.playerFixOffset, width: self.$stage.width()}).addClass('fixed').removeClass('scroll-end');
                self.lockset = true;
            }
            else if( (self.lockset && (pos <= startPos || pos >= endPos)) || pos >= endPos ) {
                self.$stage.removeClass('fixed').css({left: '', top: '', width: ''});

                if( pos > endPos ) {
                    self.$stage.addClass('scroll-end');
                }
                else {
                    self.$app.css('padding-top', '');
                }

                self.lockset = false;
            }
        },


        // make the player fullscreen or exit from it
        handleFullscreen: function() {
            var self = this;

            if( !self.$makeFullscreen.hasClass('active') &&
                (!document.fullscreenElement &&    // alternative standard method
                !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) ) {  // current working methods
                if( self.$app[0].requestFullscreen ) {
                    self.$app[0].requestFullscreen();
                }
                else if( self.$app[0].mozRequestFullScreen ) {
                    self.$app[0].mozRequestFullScreen();
                }
                else if( self.$app[0].webkitRequestFullscreen ) {
                    self.$app[0].webkitRequestFullscreen();
                }
                else if( self.$app[0].msRequestFullscreen ) {
                    self.$app[0].msRequestFullscreen();
                }

                self.$makeFullscreen.addClass('active');
            }
            else {
                if(document.exitFullscreen) {
                    document.exitFullscreen();
                }
                else if(document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
                else if(document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                }
                else if(document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }

                self.$makeFullscreen.removeClass('active');
            }
        },


        // turn the "lights" on/off
        handleLights: function() {
            var self = this;

            self.$lights.toggleClass('active');
            self.$overlay.fadeToggle(600);

            var time = self.$lights.hasClass('active') ? 600 : 0;
            setTimeout(function(){
                self.$app.toggleClass('lights-off');
            }, time);
        },


        // show/hide the search box
        showSearchBox: function() {
            var self = this;

            self.$searchBox.slideToggle(400);
            self.$playlist.toggleClass('searching');

            if( ! self.$playlist.hasClass('searching') ) {  // search closed so show all items
                self.$playlist.children('li').removeClass('filtered').slideDown(400);
                self.$searchBox.find('input').val('');
            }
        },


        // handle the voice commands
        // handleVoice: function() {
        //     var self = this;

        //     self.$voice.toggleClass('active');

        //     if( self.$voice.hasClass('active') ) {
        //         annyang.start();
        //     }
        //     else {
        //         annyang.abort();
        //     }
        // },


        // delete item from playlist
        deleteItem: function(e) {
            var self = this,
                $item = $(e.target).closest('li'),
                itemId = $item.data('id'),
                $newActiveItem = false;

            $item.slideUp(400, function() {
                if( $item.hasClass('current') ) {
                    self.player.pause();
                    if( $item.next('li').length === 0 ) {
                        $newActiveItem = $item.prev('li').find('span.title');
                    }
                    else {
                        $newActiveItem = $item.next('li').find('span.title');
                    }
                }

                $item.remove();

                self.playlist = $.grep(self.playlist, function(item) {
                    return item.id !== itemId;
                });

                if( $newActiveItem ) {
                    $newActiveItem.trigger(self.clickEventType);

                    self.$playlist.animate({scrollTop: self.$playlist.scrollTop() - $newActiveItem.outerHeight()}, 400, function() {
                        self.$playlist.hasClass('custom-scrollbar') && self.$playlist.perfectScrollbar('update');
                    });
                }
                else {
                    self.checkTrackIndex();

                    // if the last item is in view then scroll to that else just update the perfect-scrollbar
                    var $itemToScroll = self.$playlist.scrollTop() + self.$playlist.innerHeight() >= self.$playlist[0].scrollHeight ? self.$playlist.children('li').last() : false;
                    if( $itemToScroll ) {
                        // self.scrollPlaylist($itemToScroll);
                        self.$playlist.animate({scrollTop: self.$playlist.scrollTop() - $itemToScroll.outerHeight()}, 400, function() {
                            self.$playlist.hasClass('custom-scrollbar') && self.$playlist.perfectScrollbar('update');
                        });
                    }
                    else {
                        self.$playlist.hasClass('custom-scrollbar') && self.$playlist.perfectScrollbar('update');
                    }
                }
            });
        },


        // filter playlist items based on search input
        filterPlaylist: function() {
            var self = this,
                $items = self.$playlist.children('li'),
                val = $.trim( self.$searchBox.find('input').val().toLowerCase() );

            if( !val ) {
                $items.removeClass('filtered first last').slideDown(400);
            }
            else {
                var $showItems = self.$playlist.find('span.title').filter(':contains(' + val + ')').closest('li').addClass('filtered').slideDown(400);
                $items.not($showItems).removeClass('filtered').slideUp(400);
                $showItems.removeClass('first last').first().addClass('first').end().last().addClass('last');
            }

            $items.promise().done(function() {
                self.$playlist.scrollTop(0);
                self.$playlist.hasClass('custom-scrollbar') && self.$playlist.perfectScrollbar('update');
            });
        },


        // bind the various events
        bindEvents: function(){
            var self = this;

            // start playing when clicking on the item title or thumb
            self.$playlist.hammer().on(self.clickEventType, 'span.title, span.item-thumb', {self: self}, self.playItem);

            // show download links on hovering over the download icon
            // if( !self.options.showPlaylistThumbs ) {
            //     self.$playlist.on('mouseenter mouseleave', 'span.free-media', function(e) {
            //         if( e.type === 'mouseenter' ) {
            //             $(this).stop(true, true).animate({width: $.data(this, 'width')}, 400)
            //                 .prev('span.title').stop(true, true).animate({width: '-=' +$.data(this, 'width')}, 400);
            //         }
            //         else {
            //             $(this).stop(true, true).animate({width: 0}, 400)
            //                 .prev('span.title').stop(true, true).animate({width: '+=' +$.data(this, 'width')}, 400);
            //         }
            //     });
            // }

            // adjust the item title length on window resize
            // self.$window.on('resize.vimuse'+self.vmId+' orientationchange.vimuse'+self.vmId, self.resizeItemTitle.bind(self));

            // adjust the player layout on window resize
            self.$window.on('resize.vimuse'+self.vmId+' orientationchange.vimuse'+self.vmId, self.setLayout.bind(self));

            // if the browser supports page-visibilty api then attach the visibilitychange event
            var pageVisProp = this.getHiddenProp();
            if( this.options.stopPlaybackOnPageHide && pageVisProp ) {
                var evtname = pageVisProp.replace(/[H|h]idden/,'') + 'visibilitychange';
                document.addEventListener(evtname, this.pageVisChange.bind(self));
            }

            // next track
            self.$nextTrack.hammer().on(self.clickEventType, self.nextTrack.bind(self) );

            // prev track
            self.$prevTrack.hammer().on(self.clickEventType, self.prevTrack.bind(self) );

            // repeat track
            self.$repeat.hammer().on(self.clickEventType, self.repeatTrack.bind(self) );

            // shuffle playlist
            self.$shuffle.hammer().on(self.clickEventType, self.shufflePlaylist.bind(self) );

            // delete item from the playlist
            self.$playlist.hammer().on(self.clickEventType, 'a.delete', self.deleteItem.bind(self));

            // show/hide the playlist
            self.$showPlaylist.hammer().on(self.clickEventType, self.showPlaylist.bind(self) );

            // make the entire app fullscreen (or exit from it)
            self.$makeFullscreen.hammer().on(self.clickEventType, self.handleFullscreen.bind(self) );

            // remove the "active" class from the make-fullscreen button on exit from fullscreen using ESC key
            // also change to one column layout when in fullscreen
            self.$window.on('fullscreenchange.vimuse'+self.vmId+' mozfullscreenchange.vimuse'+self.vmId+' webkitfullscreenchange.vimuse'+self.vmId+' MSFullscreenChange.vimuse'+self.vmId, function() {
                if( document.fullscreenElement === null || document.mozFullScreenElement === null || document.webkitFullscreenElement === null || document.msFullscreenElement === null ) {
                    self.$makeFullscreen.removeClass('active');
                }
            });

            // turn lights on/off
            self.$lights.hammer().on(self.clickEventType, self.handleLights.bind(self) );

            // turn voice commands on/off
            // self.$voice.hammer().on(self.clickEventType, self.handleVoice.bind(self) );

            // show/hide the search box
            self.$search.hammer().on(self.clickEventType, self.showSearchBox.bind(self) );

            // get search input for filtering
            self.$searchBox.find('input').keyup( self.filterPlaylist.bind(self) );
        },


        // create player API functions
        playerAPI: function() {
            var self = this;

            return {
                next: function() {
                    self.$nextTrack.trigger(self.clickEventType);
                },

                prev: function() {
                    self.$prevTrack.trigger(self.clickEventType);
                },

                play: function() {
                    self.player && self.player.play();
                },

                pause: function() {
                    self.player && self.player.pause();
                },

                gotoItem: function(index) {
                    self.$playlist.children('li').eq(parseInt(index, 10)).find('span.title').trigger(self.clickEventType);
                },

                gotoFirstItem: function() {
                    self.$playlist.children('li').eq(0).find('span.title').trigger(self.clickEventType);
                },

                gotoLastItem: function() {
                    self.$playlist.children('li').last().find('span.title').trigger(self.clickEventType);
                },

                getPlaylistLength: function() {
                    return self.$playlist.children('li').length;
                },

                currentItemIndex: function() {
                    return self.$playlist.children('li').index( self.$playlist.children('li.current') );
                },

                seek: function(time) {
                    self.player.setCurrentTime( parseInt(time, 10) );
                },

                currentTime: function() {
                    return self.player.getCurrentTime();
                },

                getVolume: function() {
                    return self.player.getVolume();
                },

                setVolume: function(v) {
                    var vol = parseFloat(v, 10);
                    self.player.setVolume( vol );
                    self.options.volume = vol;
                },

                destroy: function() {
                    self.options.enablePlaylistSort && self.$playlist.sortable('destroy');
                    self.$playlist.filter('.custom-scrollbar').perfectScrollbar('destroy');

                    if( self.player ) {
                        self.player.media.pluginType !== 'native' && self.player.media.pluginElement && $('#' + self.player.media.pluginElement.id).parent().remove();
                        self.$player.empty();
                        clearInterval(self.radioStreamInterval);  // clear the interval for getting radio stream info

                        // Remove the player from the mejs.players object so that pauseOtherPlayers doesn't blow up when trying to pause a non existent flash api.
                        delete mejs.players[self.player.id];
                        self.player.globalUnbind();
                        self.player = null;
                    }

                    self.$window.off('.vimuse'+self.vmId);

                    self.$app.empty().off('started paused timeupdate ended onItemChange onSetup').removeData('vimuse').removeClass('vm-container playlist-'+ self.options.playlistPosition +' cf one-col no-track-info no-cover no-audio-details only-audio');
                    self.$overlay.remove();
                    self.$postrollContainer.remove();
                },

                appendItems: function(items) {
                    var itemnum = items.length,
                        showThumb = self.options.showPlaylistThumbs ? ' show-thumb' : '',
                        list = '';

                    for( var i = 0; i < itemnum; i++ ) {
                        list += '<li class="loading'+ showThumb +'"></li>';
                    }

                    self.$playlist.children('li').last().after(list);
                    self.$playlist.hasClass('custom-scrollbar') && self.$playlist.perfectScrollbar('update');
                    self.$playlist.animate({scrollTop: self.$playlist[0].scrollTop + self.$playlist.children('li.loading').eq(0).position().top}, 400);

                    if( self.options.getID3Info ) {
                        self.setMediaInfo(items, true);
                    }
                    else {
                        self.playlistLoaded(items, true);
                    }
                }
            };
        },


        // player events
        started: function() {
            // for HTML5 playback of radio stream set new src on play
            var self = this;
                // item = self.getPlaylistItem(self.curItemId);

            // if( item.type === 'radio' && self.player.media.pluginType !== 'flash' && self.player.media.src.indexOf(item.link) === -1 ) {
            //     self.player.setSrc( item.link + '?nocache=' + Math.floor(Math.random() * 10000) );
            //     self.player.load();
            //     self.player.play();
            //     return;
            // }

            self.isiOS && self.$player.find('div.mejs-fullscreen-button').css('visibility', 'visible');
            self.options.started.call(self.$app[0]);
            self.$app.trigger('started');
        },

        paused: function() {
            var self = this;

            self.options.paused.call(self.$app[0]);
            self.$app.trigger('paused');

            // fix to stop caching of radio stream when player is paused
            var item = self.getPlaylistItem(self.curItemId);

            if( item.type === 'radio' ) {
                if( self.player.media.pluginType === 'flash' ) {
                    self.player.media.stop();
                }
                else {
                    self.player.setSrc( '' );
                    self.player.setSrc( item.link + '?nocache=' + Math.floor(Math.random() * 10000) );
                    self.player.load();
                }
            }
        },

        timeupdate: function() {
            this.options.timeupdate.call(this.$app[0]);
            this.$app.trigger('timeupdate');
        },

        ended: function() {
            this.options.ended.call(this.$app[0]);
            this.$app.trigger('ended');
        },

        onItemChange: function() {
            this.options.onItemChange.call(this.$app[0]);
            this.$app.trigger('onItemChange');
        },

        onSetup: function() {
            this.options.onSetup.call(this.$app[0]);
            this.$app.trigger('onSetup');
        },

        onItemsAppended: function() {
            this.options.onItemsAppended.call(this.$app[0]);
            this.$app.trigger('onItemsAppended');
        }
    };



    // Object.create support test, and fallback for browsers without it
    if ( typeof Object.create !== 'function' ) {
        Object.create = function(o) {
            function F() {}
            F.prototype = o;
            return new F();
        };
    }


    // create the jquery plugin
    $.fn.vimuse = function(options) {
        var opts = $.extend( true, {}, $.fn.vimuse.defaults, options );

        return this.each(function () {
            //prevent against multiple instantiations
            if( !$.data(this, 'vimuse') ) {
                var player = Object.create(Vimuse);
                player.init(opts, this);
                $.data(this, 'vimuse', player.playerAPI());
            }
        });
    };

    $.fn.vimuse.defaults = {
        mediaType: 'both',   // both, audio
        autoplay: false,
        autoplayOnPlayerLoad: false,
        volume: 0.8,  // 0.0 - 1.0
        shuffle: false,
        startLanguage: '',
        reversePlaylistOrder: false,
        showPlaylistOnLoad: true,
        playlistProgress: true,
        showURLLinks: true,
        newWindowURLLinks: true,
        showPurchaseLinks: true,
        newWindowPurchaseLinks: true,
        showDownloadLinks: true,
        showLyricsLinks: true,
        showFileTypeIcons: true,
        showDeleteButtons: true,
        showItemDuration: true,
        enablePlaylistSort: true,
        stopPlaybackOnPageHide: true,
        playlistPosition: 'bottom',   // bottom, right, left
        bottomPlaylistMaxHeight: 400,  // 'auto' or numeric value
        showPlaylistThumbs: false,
        showAudioDetails: true,
        showAudioCover: true,
        showAudioTrackInfo: true,
        showAuxControls: true,
        showCurrentItemInfo: true,
        fixPlayerOnScroll: true,
        playerFixOffset: 0,
        playlistURL: 'playlist.json',
        playlistData: {},
        getID3Info: true,
        pullRadioTrackInfo: true,
        pullRadioStreamCover: false,
        radioInfoPollInterval: 5000,
        enableCache: true,
        cacheFolder: 'cache',
        cacheFileName: 'playlist-cache.json',
        cacheInterval: 10,  // in minutes
        phpFolder: 'php',
        scanMP3Folder: false,
        mp3Folder: '',
        scanVideoFolder: false,
        videoFolder: '',
        detectMobile: false,
        youtubeAPIKey: '',
        dailymotionSyndication: '',
        youtubeFeed: false,
        youtubeOptions: {
            source: '',   // user, playlist, search
            userID: '',
            playlistID: '',
            search: '',
            limit: 20  // max-limit 50 set by Youtube
        },
        vimeoFeed: false,
        vimeoOptions: {
            source: '',  // user, album, channel
            userID: '',
            albumID: '',
            channelID: '',
            limit: 20  // max-limit 60 set by Vimeo, with 20 per page
        },
        dailymotionFeed: false,
        dailymotionOptions: {
            source: '',  // user, channel, group, playlist
            userID: '',
            playlistID: '',
            groupID: '',
            channelID: '',
            limit: 20   // max-limit 100 set by DailyMotion
        },
        started: function(){},
        paused: function(){},
        timeupdate: function(){},
        ended: function(){},
        onItemChange: function(){},
        onSetup: function(){},
        onItemsAppended: function(){}
    };

}) (jQuery, document, window);
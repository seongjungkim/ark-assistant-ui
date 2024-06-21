/** parse string->json */
function parseJson(value) {
  if (typeof value === 'string') {
    value = JSON.parse(value);
  }
  return value;
}

/** num 길이의 random 문자열(영문숫자) 생성 */
function randomString(num) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
  const stringLength = num;
  let randomString = '';
  for (var i = 0; i < stringLength; i++) {
    var rNum = Math.floor(Math.random() * chars.length);
    randomString += chars.substring(rNum, rNum + 1);
  }
  return randomString;
}

const sttMgr = (() => {
  let initOnce = false;
  let recognition;
  let voiceTimer;
  let voiceResults;
  let sttStatus = false;

  function init(isSTTon) {
    if (!isSTTon) {
      //console.log("STT off...");
      return sttStatus;
    } else {
      console.log('STT on...');
    }

    if (initOnce) {
      return;
    }
    initOnce = true;

    window.SpeechRecognition = window.SpeechRecognition
        || window.webkitSpeechRecognition;

    // 인스턴스 생성
    recognition = new SpeechRecognition();

    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.maxAlternatives = 10000;

    recognition.onresult = function(e) {
      clearTimeout(voiceTimer);
      voiceResults = e.results;
      voiceTimer = setTimeout(setVoiceMessage, 1500);
    };

    function setVoiceMessage() {
      recognition.abort();
      let userSay = Array.from(voiceResults)
        .map(voiceResults => voiceResults[0].transcript)
        .join('');
      setMessage(userSay);
      voiceResults = null;
    }

    $('#microphone').click(function() {
      if (ttsMgr.getStatus()) {
        ttsMgr.cancel();
      }

      console.log('microphone start ...');
      recognition.start();
    });

    $('#microphone').show();
    sttStatus = true;

    return sttStatus;
  }

  function abort() {
    if (sttStatus) {
      recognition.abort();
    }
  }

  function getStatus() {
    return sttStatus;
  }

  return {getStatus, init, abort};
})();

const ttsMgr = (function() {
  let synth;
  let voiceFounded;
  let initOnce = false;
  let ttsStatus = false;
  let lang = 'en-US';

  function init() {
    if (!isTTSon) {
      return ttsStatus;
    } else {
      console.log('TTS on...');
    }

    if (initOnce) {
      return;
    }
    initOnce = true;

    if (!window.speechSynthesis) {
      console.log('speech not supported...');
      return;
    } else {
      synth = window.speechSynthesis;
    }

    if (setVoiceList()) {
      ttsStatus = true;
    }

    console.log('ttsStatus : ' + ttsStatus);
    return ttsStatus;
  }

  async function setVoiceList() {
    const getVoices = (voiceName = '') => {
      return new Promise(resolve => {
        synth.onvoiceschanged = e => {
          resolve(synth.getVoices());
        };
        synth.getVoices();
      });
    };

    const voices = await getVoices();

    for (let i = 0; i < voices.length; i++) {
      if (voices[i].lang.indexOf(lang) >= 0 || voices[i].lang.indexOf(
          lang.replace('-', '_')) >= 0) {
        voiceFounded = voices[i];
        //console.log(voiceFounded);
      }
    }

    console.log(voiceFounded);
    return voiceFounded;
  }

  function speech(txt) {
    if (isTTSon && !initOnce) {
      init();
    }

    if (!ttsStatus) {
      return;
    }

    let utterThis = new SpeechSynthesisUtterance(txt);

    utterThis.voice = voiceFounded;

    utterThis.onend = function(event) {
      console.log('end');
    };

    utterThis.onerror = function(event) {
      console.log('error', event);
    };

    utterThis.lang = lang;
    utterThis.pitch = 1;
    utterThis.rate = 1; //속도

    synth.speak(utterThis);
  }

  function cancel() {
    console.log('synth.speaking ?? ' + synth.speaking);
    if (synth.speaking) {
      synth.cancel();
      console.log("synth.cancel... ");
    }
  }

  function getStatus() {
    return ttsStatus;
  }

  return {getStatus, speech, cancel};
})();

function tokenExpirationCheck(token) {
	if(token) {
    try {
      let payload = JSON.parse(window.atob(token.split('.')[1]));
      let a = (new Date().getTime())/1000;
      let s = Math.trunc(payload.exp - a -_timeGap);

      if(s > 0) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.log(e);
      return false;
    }
	} else {
		return false;
	}
}


var chatLogMgr = (function () {
  return {
      chatLog: [],
      addLog: function (type, msg, time) {
          if (type === 'user') {
              this.chatLog.push(`[User] ` + msg + ` (` + time + `)\n\n`);
          } else if (type === 'bot') {
              let botMsg = ``;
              for (var i in msg) {
                  let data = msg[i];

                  for (var j in data) {
                      let _data = data[j];

                      if (!Array.isArray(_data)) {
                          if (_data.basicCard) {
                              botMsg += '\n[' + _data.basicCard.title + ':' + _data.basicCard.formattedText + ']';
                          } else if (_data.btns) {
                              let _btns = [];
                              for (var k in _data.btns) {
                                  let _b = _data.btns[k];
                                  if (_b.openUriAction && _b.openUriAction.uri) {
                                      _btns.push(_b.title + ':' + _b.openUriAction.uri);
                                  }
                              }
                              botMsg += '\n[' + _btns.join(', ') + ']';
                          } else if (_data.browseCarousel) {
                              let _browseCarousels = [];
                              for (var k in _data.browseCarousel) {
                                  let _b = _data.browseCarousel[k];
                                  if (_b.openUrlAction && _b.openUrlAction.url) {
                                      _browseCarousels.push(_b.title + ':' + _b.openUrlAction.url);
                                  }
                              }
                              botMsg += '\n[' + _browseCarousels.join(', ') + ']';
                          } else if (_data.linkOutSuggestion) {
                              botMsg += '\n[' + _data.linkOutSuggestion.destinationName + ':' + _data.linkOutSuggestion.url + ']';
                          } else if (_data.suggestions) {
                              let suggestionArr = _data.suggestions.suggestions;
                              let _suggestions = [];
                              for (var k in suggestionArr) {
                                  _suggestions.push(Number(k) + 1 + '.' + suggestionArr[k].title);
                              }

                              botMsg += '\n[' + _suggestions.join(', ') + ']';
                          }
                      } else {
                          for (var k in _data) {
                              if (_data[k].textToSpeech) {
                                  botMsg += (k > 0 ? '\n' : '') + _data[k].textToSpeech;
                              }
                          }
                      }
                  }
              }

              this.chatLog.push(`[Bot] ` + botMsg + ` (` + time + `)\n\n`);
          } else {
              this.chatLog.push(`[` + type + `] ` + msg + ` (` + time + `)\n\n`);
          }

          return this;
      },
      getLog: function () {
          return this.chatLog;
      },
      init: function () {
          this.chatLog = [];
          return this;
      },
  };
})();

var autoCompleteMgr = (function () {
  let corpCd = '';
  let phrases = {};
  let currTarget = '';
  let status = false;
  let initOnce = false;

  return {
    ac: function (contexts, product) {
      //if(!status) {return false;}

      if (['us'].includes(corpCd)) {
        if (contexts === currTarget) {
          return;
        } else {
          currTarget = contexts;
        }

        let targetArr = contexts.split(',');
        let _pList = [];
        for (let i in targetArr) {
          if (phrases[targetArr[i]]) {
            _pList = _pList.concat(phrases[targetArr[i]]);
          }
        }
        _pList.sort();

        $('#chatTextArea').autocomplete({
            //source: _pList,
          source : function(request, response) {
            // delegate back to autocomplete, but extract the last term
            response($.ui.autocomplete.filter(_pList, request.term));
          }
        });
      } else if (['uk', 'il'].includes(corpCd)) {
        if (product === currTarget) {
          return;
        } else {
          currTarget = product;
        }

        let _pList = [];
        if (phrases[product]) {
          _pList = _pList.concat(phrases[product]);
        }
        if (phrases["common"]) {
          _pList = _pList.concat(phrases["common"]);
        }

        //console.log(_pList.length);
        _pList.sort();

        $('#chatTextArea').autocomplete({
              //source: _pList,
            source : function(request, response) {
              // delegate back to autocomplete, but extract the last term
              response($.ui.autocomplete.filter(_pList, request.term));
            }
        });
      }
    },
    init: function (_corpCd) {
      corpCd = _corpCd;
      if (['us','uk','il'].includes(corpCd) == false) {
        return;
      }

      //overrirde jQuery autocomple's filter function to filter based on words instead of a single string
      $.extend( $.ui.autocomplete, {
        filter: function(array, term) {
          var arraySub=term.split(' ');//split searching on a space character

          //generate a regex, including each searched term
          var regEx = '^';
          for (let i = 0; i < arraySub.length; i++) {
            regEx += '(?=.*' + $.ui.autocomplete.escapeRegex(arraySub[i]) + '.*)';
          }
          regEx += '.*$';

          var matcher = new RegExp(regEx, 'i');
          return $.grep( array, function( value ) {//filter elements which match our expression
            return matcher.test( value.label || value.value || value );
          });
        }
      });

      $.ajax({
          type: 'POST',
          url: `${contextRoot}/chatbot/v1/api/get_autocomplete_phrases`,
          dataType: 'json',
          contentType: 'application/json',
          data: JSON.stringify({
            corpCd: _corpCd,
            locale: _locale,
          }),
          success: function (data) {
            if (data && data.phraseList) {
              phrases = data.phraseList;

              $('#chatTextArea').autocomplete({
                source: [],
                select: function (event, ui) {
                    event.preventDefault();
                    setMessage(ui.item.value);
                    return false;
                },
                focus: function (event, ui) {
                    $('#chatTextArea').val(ui.item.value);
                    return false;
                },
                classes: {
                    /*'ui-autocomplete' : 'highlight'*/
                },
                delay: 100,
                minLength: 2,
                position: { my: 'left bottom', at: 'left top', of: '#chatTextArea', collision: 'flip' },
                disabled: false,
              });
            } else {
              console.log('not found autocomplete words...');
            }
          },
          error: function (request, status, error) {
            console.log('fail to set autocomplete ...');
            status = false;
          },
      });
    },
    clear: function () {
      phrases = {};
      currTarget = '';
      status = false;

      $('#chatTextArea').autocomplete({
        source: [],
        disabled: true,
      });
    },
  };
})();

async function streamingCall(msg) {

  const source = $('#simpleResponses-template').html();
  const template = Handlebars.compile(source);
  const randomId = "s_" + randomString(10);

  const AttachData = {
    simpleId: randomId,
    emoticon: '',
    msg: [{"textToSpeech":""}],
    linkOutSuggestion: [],
  }
  
  $('.gen-ai .icon').addClass('off');

  //add open ai style
  AttachData.openAi = {isExist : true};
  
  var html = template(AttachData);
  $('#chatMessage').append(html);

  let $botArea = $("#"+randomId);
  let _botSay = '';
  let _lastBreak = 0;

  function _speech(word, delimeter, isTagDelimeter) {
    let _botSayBreak = word.indexOf(delimeter)+1;
    //console.log(''+_lastBreak+" : "+(_botSay.length - _botSayBreak+1)+' = '+_botSay);

    let c =_botSay.substring(_lastBreak, (_botSay.length - _botSayBreak+1)).trim();
    if(isTagDelimeter) {
      c = c.replaceAll('<br>','').trim()
    } else {
      c = c.trim()
    }

    if(c) {
      ttsMgr.speech(c);
    }
    _lastBreak = _botSay.length - _botSayBreak+1;

    if(delimeter == '.' || delimeter == ',') {
      autoScroll();
    }
  }

  fetch(contextRoot+'/chatbot/query/stream', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      'Authorization': userInfo.token
    },
    body: JSON.stringify({
      userType: userInfo.userType,
      userId: userInfo.userId,
      sessionId: userInfo.sessionId,
			query: msg,
      platform: 'WEB',
    }),
  })
  .then(response => {
    const reader = response.body.getReader();
    return new ReadableStream({
      start(controller) {
        function push() {
          reader.read().then(({done, value}) => {
            if (done) {
              if(_botSay) {
                ttsMgr.speech(_botSay.substring(_lastBreak));
                _botSay = '';
              }
              controller.close();
              hideReady();
			        autoScroll();
              return;
            }
            controller.enqueue(value);
            push();
          });
        }
        push();
      }
    });
  })
  .then(stream => {
    const reader = stream.getReader();
    function read() {
      reader.read().then(({done, value}) => {
        if (done) {
          console.log('Stream complete');
          return;
        }
        const string = new TextDecoder("utf-8").decode(value);
        _botSay += string;

        $botArea.append(string);

        if(string.indexOf('.') > -1) {
          _speech(string, '.');
        } else if(string.indexOf('<br>') > -1) {
          _speech(string, '<br>', true);
        }

        //console.log(string);
        read();
      });
    }
    read();
  });
}

function sendPostMessage(msg, target){
  console.log('sendPostMessage ... '+msg);
  try {
    window.parent.postMessage({
      type: 'chatbotMessage',
      data: msg
    }, target);
  } catch (e) {}
}

const youTubeCtrl = (function () {
  const youtubeUrls = ['https://youtube.com/embed', 'https://youtu.be', 'https://www.youtube.com/watch', 'https://www.youtube.com/embed', 'https://youtube.com/watch'];
  const YOUTUBE_PREFIX = 'yt_';

  let youtubeList = [];

  function isYoutubeUrl(url) {
    for (const youtubeUrl of youtubeUrls) {
      if (url instanceof URL) {
        if (url.startsWith(youtubeUrl)) {
          return true;
        }
      } else if (typeof url === 'string') {
        if (!url.startsWith('https://') && !url.startsWith('http://')) {
          url = 'https://' + url;
        }
        if (url.startsWith(youtubeUrl)) {
          return true;
        }
      }
    }
    return false;
  }

  function getEmbedYoutubeId(url) {
    if (typeof url === 'string') {
      if (!url.startsWith('https://') && !url.startsWith('http://')) {
        url = 'https://' + url;
      }
      url = new URL(url);
    } else if (!(url instanceof URL)) {
      return false;
    }

    let embedYoutubeId = '';
    if (url.href.startsWith(youtubeUrls[0]) || url.href.startsWith(youtubeUrls[3])) {
      embedYoutubeId = url.pathname.substring(7);
    } else if (url.href.startsWith(youtubeUrls[1])) {
      embedYoutubeId = url.pathname.substring(1);
    } else if (url.href.startsWith(youtubeUrls[2]) || url.href.startsWith(youtubeUrls[4])) {
      embedYoutubeId = new URLSearchParams(url.searchParams).get('v');
    } else {
      return false;
    }

    return _randYoutubeId(embedYoutubeId);
  }

  function _randYoutubeId(youtube_id) {
    return randStr() + youtube_id;
    function randStr() {
      return YOUTUBE_PREFIX + Math.random().toString(36).substring(2, 7) + '_';
    }
  }

  function _onYouTubeIframeAPI(tag_id) {
    const videoId = tag_id.substring(YOUTUBE_PREFIX.length + 6);
    const onPlayerStateChange = function (event) {
      if (event.data === YT.PlayerState.PLAYING) {
        showCurrentSuggestions();
      }
    }

    let player = new YT.Player(tag_id, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      allowFullScreen: true,
      events: {
        'onStateChange': onPlayerStateChange
      }
    });
  }

  function renderYoutube() {
    youtubeList.forEach((item) => {
      _onYouTubeIframeAPI(item);
    });
    youtubeList = [];
  }

  /**
   * @author       Rob W <gwnRob@gmail.com>
   * @website      https://stackoverflow.com/a/7513356/938089
   * @version      20190409
   * @description  Executes function on a framed YouTube video (see website link)
   *               For a full list of possible functions, see:
   *               https://developers.google.com/youtube/js_api_reference
   * @param {String} frame_id The id of (the div containing) the frame
   * @param {String} func     Desired function to call, e.g. "playVideo"
   *        (Function)      Function to call when the player is ready.
   * @param {Array}  args     (optional) List of arguments to pass to function func*/
  function callPlayer(frame_id, func, args) {
    if (window.jQuery && frame_id instanceof jQuery) frame_id = frame_id.get(0).id;
    let iframe = document.getElementById(frame_id);
    if (iframe && iframe.tagName.toUpperCase() !== 'IFRAME') {
      iframe = iframe.getElementsByTagName('iframe')[0];
    }

    // When the player is not ready yet, add the event to a queue
    // Each frame_id is associated with an own queue.
    // Each queue has three possible states:
    //  undefined = uninitialised / array = queue / 0 = ready
    if (!callPlayer.queue) callPlayer.queue = {};
    let queue = callPlayer.queue[frame_id],
      domReady = document.readyState === 'complete';

    if (domReady && !iframe) {
      // DOM is ready and iframe does not exist. Log a message
      window.console && console.log('callPlayer: Frame not found; id=' + frame_id);
      if (queue) clearInterval(queue.poller);
    } else if (func === 'listening') {
      // Sending the "listener" message to the frame, to request status updates
      if (iframe && iframe.contentWindow) {
        func = '{"event":"listening","id":' + JSON.stringify('' + frame_id) + '}';
        iframe.contentWindow.postMessage(func, '*');
      }
    } else if ((!queue || !queue.ready) && (!domReady || (iframe && !iframe.contentWindow) || typeof func === 'function')) {
      if (!queue) queue = callPlayer.queue[frame_id] = [];
      queue.push([func, args]);
      if (!('poller' in queue)) {
        // keep polling until the document and frame is ready
        queue.poller = setInterval(function () {
          callPlayer(frame_id, 'listening', args);
        }, 250);
        // Add a global "message" event listener, to catch status updates:
        messageEvent(
          1,
          function runOnceReady(e) {
            if (!iframe) {
              iframe = document.getElementById(frame_id);
              if (!iframe) return;
              if (iframe.tagName.toUpperCase() !== 'IFRAME') {
                iframe = iframe.getElementsByTagName('iframe')[0];
                if (!iframe) return;
              }
            }
            if (e.source === iframe.contentWindow) {
              // Assume that the player is ready if we receive a
              // message from the iframe
              clearInterval(queue.poller);
              queue.ready = true;
              messageEvent(0, runOnceReady);
              let tmp;
              while ((tmp = queue.shift())) {
                callPlayer(frame_id, tmp[0], tmp[1]);
              }
            }
          },
          false,
        );
      }
    } else if (iframe && iframe.contentWindow) {
      // When a function is supplied, just call it (like "onYouTubePlayerReady")
      if (func.call) return func();
      // Frame exists, send message
      iframe.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: func,
          args: args || [],
          id: frame_id,
        }),
        '*',
      );
    }
    /* IE8 does not support addEventListener... */
    function messageEvent(add, listener) {
      var w3 = add ? window.addEventListener : window.removeEventListener;
      w3 ? w3('message', listener, !1) : (add ? window.attachEvent : window.detachEvent)('onmessage', listener);
    }
  }

  return {
    isYoutubeUrl,
    getEmbedYoutubeId,
    renderYoutube,
  }
})();

function checkPlatform() {
  let platform = 'WEB';
  const tempUser = navigator.userAgent;
  if (tempUser.indexOf('iPhone') > 0 || tempUser.indexOf('iPad') > 0
      || tempUser.indexOf('iPot') > 0 || tempUser.indexOf('Android') > 0) {
    platform = 'Mobile';
  }

  return platform;
}

function fnDeviceTypeCheck() {
  let deviceType = function() {
    let check = false;
    (function(a, b) {
      if (
          /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
              a,
          ) ||
          /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g|nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
              a.substr(0, 4),
          )
      ) {
        check = true;
      }
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
  };
  if (deviceType() === true) {
    gProfile.device_type = 'mobile';
  } else {
    gProfile.device_type = 'pc';
  }
}

// 레이어팝업 닫기 기능
function fnLayerPopupCls(obj, el, callback) {
	// console.log('[TEST by msk] fnLayerPopupCls : gSurvey', gSurvey);
	// QOS 레이어 팝업 설문제출 정보수집 초기화
	let value = $(obj).val();

	$('#layerPopupContainer #layerPopupWrap .layerPopup').animate(
    { bottom: '-100%' },
    300,
    () => {
      $('#layerPopupContainer #layerPopupWrap').fadeOut().remove();
    }
  );

	$('html').css({
		height: 'auto',
		overflow: 'auto',
	});

	// 메시지입력창에 포커스
	setTimeout(() => { $('#chatTextArea').focus(); }, 500);

	if (callback && typeof callback === 'function') {
		callback();
	}
}

/**
 * Browser detection using the user agent
 */
function fnInitProfile() {
  // OS 정보
  let userAgent = navigator.userAgent;

  //접속 언어 코드
  gProfile.language = navigator.language;

  if (userAgent.match(/Win(dows )?NT 6\.0/)) {
    gProfile.os.type = 'windows';
    gProfile.os.version = 'vista';
  } else if (userAgent.match(/Win(dows )?(NT 5\.1|XP)/)) {
    gProfile.os.type = 'windows';
    gProfile.os.version = 'xp';
  } else {
    if (userAgent.indexOf('Windows NT 5.1') !== -1 || userAgent.indexOf(
        'Windows XP') !== -1) {
      gProfile.os.type = 'windows';
      gProfile.os.version = 'xp';
    } else if (userAgent.indexOf('Windows NT 7.0') !== -1 || userAgent.indexOf(
        'Windows NT 6.1') !== -1) {
      gProfile.os.type = 'windows';
      gProfile.os.version = '7';
    } else if (userAgent.indexOf('Windows NT 8.0') !== -1 || userAgent.indexOf(
        'Windows NT 6.2') !== -1) {
      gProfile.os.type = 'windows';
      gProfile.os.version = '8';
    } else if (userAgent.indexOf('Windows NT 8.1') !== -1 || userAgent.indexOf(
        'Windows NT 6.3') !== -1) {
      gProfile.os.type = 'windows';
      gProfile.os.version = '8.1';
    } else if (userAgent.indexOf('Windows NT 10.0') !== -1 || userAgent.indexOf(
        'Windows NT 6.4') !== -1) {
      gProfile.os.type = 'windows';
      gProfile.os.version = '10';
    } else if (userAgent.indexOf('iPad') !== -1 || userAgent.indexOf('iPhone')
        !== -1 || userAgent.indexOf('iPod') !== -1) {
      gProfile.os.type = 'ios';
      gProfile.os.version = '10';
    } else if (userAgent.indexOf('Android') !== -1) {
      gProfile.os.type = 'android';
      gProfile.os.version = '10';
    } else if (userAgent.match(/Win(dows )?NT( 4\.0)?/)) {
      gProfile.os.type = 'windows';
      gProfile.os.version = 'nt';
    } else if (userAgent.match(/Mac|PPC/)) {
      gProfile.os.type = 'mac';
      gProfile.os.version = '1';
    } else if (userAgent.match(/Linux/)) {
      gProfile.os.type = 'linux';
      gProfile.os.version = '1';
    } else if (userAgent.match(/(Free|Net|Open)BSD/)) {
      gProfile.os.type = RegExp.$1;
      gProfile.os.version = '1';
    } else if (userAgent.match(/SunOS/)) {
      gProfile.os.type = 'solaris';
      gProfile.os.version = '1';
    }
  }

  // Device OS bit
  if (gProfile.os.type.indexOf('windows') !== -1) {
    if (navigator.userAgent.indexOf('WOW64') > -1
        || navigator.userAgent.indexOf('Win64') > -1) {
      gProfile.os.version += ' 64bit';
    } else {
      gProfile.os.version += ' 32bit';
    }
  }

  //browser information
  let agent = navigator.userAgent,
      match;
  if ((match = agent.match(/Edge\/([0-9]+)/))) {
    gProfile.browser.type = 'edge';
  } else if ((match = agent.match(/MSIE ([0-9]+)/)) || (match = agent.match(
      /Trident.*rv:([0-9]+)/))) {
    gProfile.browser.type = 'explorer';
  } else if ((match = agent.match(/Chrome\/([0-9]+)/))) {
    gProfile.browser.type = 'chrome';
  } else if ((match = agent.match(/Firefox\/([0-9]+)/))) {
    gProfile.browser.type = 'firefox';
  } else if ((match = agent.match(/Safari\/([0-9]+)/))) {
    gProfile.browser.type = 'safari';
  } else if ((match = agent.match(/OPR\/([0-9]+)/)) || (match = agent.match(
      /Opera\/([0-9]+)/))) {
    gProfile.browser.type = 'opera';
  } else {
    gProfile.browser.type = 'unknown';
  }

  //browser version information
  if (gProfile.browser.type !== 'unknown') {
    gProfile.browser.version = match[1];
  } else {
    gProfile.browser.version = 'unknown';
  }
}

export {parseJson, randomString, sttMgr, ttsMgr, chatLogMgr, autoCompleteMgr, youTubeCtrl, tokenExpirationCheck, sendPostMessage
  ,streamingCall, checkPlatform, fnDeviceTypeCheck, fnInitProfile, fnLayerPopupCls};
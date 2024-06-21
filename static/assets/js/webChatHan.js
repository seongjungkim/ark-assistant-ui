import { constants as Conts, } from './consts/constants.js'
import * as Common from './common.js'

const webChatHan = (() => {
  const CHAT_ACTIVE = 'active',
    CHAT_INACTIVE = 'inactive',
    USER_SAY_RESPONSE = true,
    NO_USER_SAY_RESPONSE = false;

  const _localeMessage = resource.hasOwnProperty(userInfo.locale) ? resource[userInfo.locale] : resource['en_US'],
    _showMsg = _localeMessage.showMsg;

  let $chatArea = $('#chatTextArea'),
    $btnSend = $('#btnSend');

  let dialogStatus = null,
    chatStatus = false,
    isTyping = false,
    isProcessing = false;

  function init () {
    _initHandlers();

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const _debug = urlParams.get('debug');
    if (_debug === 'test') {
      Common.testMessage();
    }

    function _initHandlers() {
      const partialMsg = $('#partial-msg-template').html();
      const partialIcon = $('#partial-icon-template').html();
      const partialEmoji = $('#partial-emoji-template').html();
      const partialEmojiClass = $('#partial-emoji-class-template').html();
      Handlebars.registerPartial({
        partialMsg,
        partialIcon,
        partialEmoji,
        partialEmojiClass,
      });

      Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
        return arg1 == arg2 ? options.fn(this) : options.inverse(this);
      });

      Handlebars.registerHelper('lineBreak', function (line, delim) {
        return new Handlebars.SafeString(line.split(/\r\n|\n|\r|<br\s*\/?>/).join('<br/>'));
      });

      Handlebars.registerHelper('escape', function (variable) {
        return variable.replace(/(['"])/g, '\\$1');
      });

      /**
       * eventTags (eventNoti 제거 & payload 신규)
       * Handler to check conditions
       * {{#ifCond v1 v2}}
       *   {{v1}} is equal to {{v2}}
       * {{else}}
       *   {{v1}} is not equal to {{v2}}
       * {{/ifCond}}
       */
      Handlebars.registerHelper('ifCond', function (v1, v2, options) {
        if (v1 === v2) {
          return options.fn(this);
        }
        return options.inverse(this);
      });

      /**
       * 라이브챗 상담시 파일전송 기능
       * 가능 확장자 pdf, png, jpeg, jpg, gif, txt
       */
      Handlebars.registerHelper('checkExtension', function (item, options) {
        let regexp = /\.(png|jpg|jpeg|gif|jfif|bmp)$/i;
        // console.log('[TEST by msk] checkExtension : item', item);

        if (regexp.test(item)) {
          return options.fn(this);
        }
        return options.inverse(this);
      });

      Handlebars.registerHelper('getFileName', function (file, options) {
        let fileName = file.substring(0, file.lastIndexOf('.'));
        // console.log('[TEST by msk] getFileName : fileName', fileName);

        return fileName;
      });

      Handlebars.registerHelper('getFileExtension', function (file, options) {
        let fileExtension = file.split('.').pop();
        // console.log('[TEST by msk] getFileExtension : fileExtension', fileExtension);

        return fileExtension.toUpperCase();
      });
    }
  }

  const hiddenOption = (function () {
    const PREFIX = 'hidden_';
    const hiddenTime2m = {
      target: ['ca'],
      filter: ['LIVE CHAT AGENT'],
      name: 'hiddenTime2m',
      isTarget: function (corpCd) {
        return this.target.includes(corpCd);
      },
      isFiltering: function (title) {
        return this.filter.includes(title.trim().toUpperCase());
      },
      showComponent: function () {
        $(`.${this.name}`).removeClass(this.name);
      },
      showDelayComponent: function (targetId, option) {
        const showDelayHiddenComponent = (id, option) => {
          $(`#${id}`).removeClass(option.name);
        }
        setTimeout(function () {
          showDelayHiddenComponent(targetId, option);
        }, 2 * 60 * 1000);
      }
    };

    const hiddenUtilContentClick = {
      target: '', //SUGGESTION_AFTER_VIEW_CONTENT
      filter: ['LET ME TRY TROUBLESHOOTING STEPS'],
      name: 'hiddenUtilContentClick',
      isTarget: function (corpCd) {
        return this.target.includes(corpCd);
      },
      isFiltering: function (title) {
        return !this.filter.includes(title.trim().toUpperCase());
      },
      showComponent: function () {
        console.log(this.name)
        $(`.${this.name}`).removeClass(this.name);
      }
    }

    const setHiddenOption = function (target, option) {
      target.hiddenOption = option.name;
      target.id = randstr(PREFIX)
    }

    return {
      hiddenTime2m,
      hiddenUtilContentClick,
      setHiddenOption,
    }
  })();

  function close() {
    //부모창에서 채팅창을 닫도록 메시지 발송
    Common.sendPostMessage('chatbot-close', '*');
    
    //자신을 닫는 코드도 일단 호출
    self.close();
  }

  /**
   * @param msg {[{textToSpeech: string, [linkOutSuggestion]:{url:string, destinationName: string}}]}
   * @param time
   * @param eventObj
   */
  function simpleResponses({ msg, time = chatTime(), eventObj }) {
    if (msg) {
      for (const m of msg) {
        if (!m?.linkOutSuggestion?.url) {
          continue;
        }

        if (youTubeCtrl.isYoutubeUrl(m.linkOutSuggestion.url)) {
          let videoId = youTubeCtrl.getEmbedYoutubeId(m.linkOutSuggestion.url);
          if (!videoId) continue;
          m.linkOutSuggestion['youtube'] = videoId;
          youtubeList.push(videoId);
        }
      }
    }
    renderChatMessage('#simpleResponses-template', { msg, time, eventObj });
  }

  /**
   * @param msg {[{textToSpeech: string}]}
   * @param basicCard {{[image]:{imageUri:string,accessibilityText:string},title:string, [subtitle]:string, [formattedText]:string}}
   * @param btns {[{openUriAction:{uri:string},title:string}]}
   * @param linkOutSuggestion
   * @param time
   * @param eventObj
   */
  function basicCard({ msg, basicCard, btns, linkOutSuggestion, time = chatTime(), eventObj }) {
    if (btns) {
      for (const b of btns) {
        if (!b.hasOwnProperty('openUriAction') || !b.openUriAction?.uri) {
          continue;
        }

        if (youTubeCtrl.isYoutubeUrl(b.openUriAction.uri)) {
          let videoId = youTubeCtrl.getEmbedYoutubeId(b.openUriAction.uri);
          if (!videoId) continue;
          b.openUriAction['youtube'] = videoId;
          youtubeList.push(videoId);
        }
      }
    }
    renderChatMessage('#basicCard-template', { msg, basicCard, btns, linkOutSuggestion, time, eventObj });
  }

  /**
   * @param msg {[{textToSpeech: string}]}
   * @param browseCarousel {[{openUrlAction:{url:string}, title: string, [description]: string}]}
   * @param time
   * @param eventObj
   */
  function browseCarousel({ msg, browseCarousel, time = chatTime(), eventObj }) {
    let youtubes = [];
    let browseCarouselFilteredYoutube = [];
    if (browseCarousel) {
      for (const carousel of browseCarousel) {
        if (!carousel?.openUrlAction?.url) {
          continue;
        }
        if (youTubeCtrl.isYoutubeUrl(carousel.openUrlAction.url)) {
          let videoId = youTubeCtrl.getEmbedYoutubeId(carousel.openUrlAction.url);
          if (!videoId) {
            browseCarouselFilteredYoutube.push(carousel);
            continue;
          }
          youtubeList.push(videoId);
          youtubes.push({ youtube: videoId, title: carousel.title });
        } else {
          browseCarouselFilteredYoutube.push(carousel);
        }
      }
    }
    renderChatMessage('#browseCarousel-template', { msg, browseCarousel: browseCarouselFilteredYoutube, youtubes, time, eventObj });
  }

  /**
   * @param [title] {string}
   * @param description {string}
   * @param [btn] {string}
   * @param [callback] {string}
   */
  function alertPopup({ title, description, btn }, callback = null) {
    if (!btn) {
      if (resource?.hasOwnProperty(userInfo.locale) && _localeMessage?.btn?.confirm) {
        btn = _localeMessage?.btn?.confirm;
      } else {
        btn = 'confirm';
      }
    }
    let source = $('#popup-alert-template').html();
    let template = Handlebars.compile(source);
    let AttachData = { title, description, btn, callback };
    let html = template(AttachData);
    $('#layerPopupContainer').append(html);
    $('#layerPopupContainer #layerPopupWrap').fadeIn(() => {
      $('#layerPopupContainer #layerPopupWrap .layerPopup').animate({ bottom: 0 }, 300);
    });
    $('html').css({
      height: '100%',
      overflow: 'hidden',
    });
    // ios 키보드 이슈
    $chatArea.blur();
  }

    /**
   * @param [title] {string}
   * @param description {string}
   * @param [btn] {string}
   * @param [callback] {string}
   */
    function loginPopup({ title, description, btn }, callback = null) {
      if (!btn) {
        if (resource?.hasOwnProperty(userInfo.locale) && _localeMessage?.btn?.confirm) {
          btn = _localeMessage?.btn?.confirm;
        } else {
          btn = 'confirm';
        }
      }
      let source = $('#popup-login-template').html();
      let template = Handlebars.compile(source);
      let AttachData = { title, description, btn, callback };
      let html = template(AttachData);
      $('#layerPopupContainer').append(html);
      $('#layerPopupContainer #layerPopupWrap').fadeIn(() => {
        $('#layerPopupContainer #layerPopupWrap .layerPopup').animate({ bottom: 0 }, 300);
      });
      $('html').css({
        height: '100%',
        overflow: 'hidden',
      });
      // ios 키보드 이슈
      $chatArea.blur();
    }

  function renderChatMessage(
    sourceId,
    { msg, basicCard, btns, browseCarousel, listSelect, listSelect2, youtubes, linkOutSuggestion, time, eventObj, randomId, isHidden, options },
  ) {
    let source = $(sourceId).html(); // 핸들바 템플릿 가져오기
    let template = Handlebars.compile(source); // 핸들바 템플릿 컴파일

    // 핸들바 템플릿에 바인딩할 데이터
    let AttachData = {
      msg,
      basicCard,
      btns,
      browseCarousel,
      listSelect,
      listSelect2,
      youtubes,
      linkOutSuggestion,
      time,
      eventObj, // 감정표현 아이콘 추가
      randomId,
      isHidden,
      options,
    };

    // 핸들바 템플릿에 데이터를 바인딩해서 HTML 생성
    let html = template(AttachData);

    // 생성된 HTML을 DOM에 주입
    $('#chatMessage').append(html);

    // 감정표현 아이콘 위치
    if (eventObj && eventObj.code) {
      const $icoChatbotEmotion = $('#chatMessage #icoChatbotEmotion');
      let idxCode = $icoChatbotEmotion.length - 1;
      $icoChatbotEmotion.eq(idxCode).find(`.ico-chatbot-emotion.${eventObj.code}`).attr('id', `idxCode${idxCode}`);

      webChatHan.posIcoChatbot(eventObj.code, idxCode);
      $(window).resize(function () {
        webChatHan.posIcoChatbot(eventObj.code, idxCode);
      });
    }

    youTubeCtrl.renderYoutube();
  }

  /**
   * @returns {string} current Time with format 'h:mm a'
   */
  function chatTime() {
    return moment().format('h:mm a');
  }

  function showCurrentSuggestions() {
    hiddenOption.hiddenUtilContentClick.showComponent();
  }

  function startYoutube(obj) {
    let $videoStartCover = $(obj);
    let $youtubeIframe = $($videoStartCover).next();
    youTubeCtrl.callPlayer($youtubeIframe.attr('id'), 'playVideo', null);
    $videoStartCover.remove();
    if (hiddenOption.hiddenUtilContentClick.isTarget(userInfo.corpCd)) {
      showCurrentSuggestions();
    }
  }

  /**
   * @param isUserSayResponse {boolean} {@link USER_SAY_RESPONSE}: userSay <br/>
   *                                    {@link NO_USER_SAY_RESPONSE}: botSay
   */
  function autoScroll(isUserSayResponse = true) {
    if (window.scrollY + window.innerHeight === $(document).height()) {
      return;
    }
    let $lastMessage = $('#chatMessage div.chat-bot').last();
    let scrollTop = 0;
    if ($lastMessage.length > 0) {
      if (isUserSayResponse) {
        let $meMessage = $('#chatMessage div.chat-me').last();
        if ($meMessage && $meMessage.length > 0 && $meMessage.get(0)) {
          scrollTop = window.scrollY + $('#chatMessage div.chat-me').last().get(0).getBoundingClientRect().top - $('#chatHeader').height() - 15;
        }
      } else if ($lastMessage.get(0)) {
        scrollTop = window.scrollY + $lastMessage.get(0).getBoundingClientRect().top - $('#chatHeader').height() - 15;
      }
    }

    $('html, body').animate({ scrollTop }, 'slow');
  }

  function userMessage(text, time = chatTime(), isHidden = false) {
    let AttachData = { msg: text, isHidden, time };
    this.renderChatMessage('#me-template', AttachData);
  }

  // 사용자를 기다리게 하지 않기
  function _showMsgAnim() {
    let html = '';
    // 한국: 요청에 대한 작업 중입니다. 네트워크 상황으로 인해 작업 미진행 시 우측 상단에 있는 X버튼을 눌러 챗봇을 재시작 해주세요.

    html += '<div class="message-box-inner">';
    html += `${_showMsg.animMsg}`;
    html += '</div>';
    // html += '<div class="time">' + webChatHan.chatTime() + '</div>';

    if ($('.readyAnim').length) {
      $('.readyAnim .message-box').append(html);
      autoScroll();
    }
  }

  // 젠데스크 상담시 아이콘 제거
  function anim(chatObj) {
    if (isTyping) {
      this.hideAnim();
    }
    isTyping = true;
    this.renderChatMessage('#anim-template', {});
    // 사용자를 기다리게 하지 않기 - 2초후 노출
    setTimeout(function () {
      _showMsgAnim(chatObj);
    }, 2000);
  }

  function hiddenChatInput() {
    $('.chat-input-container').css('visibility', 'hidden');
    $('#btnDelete').css('visibility', 'hidden');
    $('#$btnSend').css('visibility', 'hidden');
  }

  function showChatInput() {
    $('.chat-input-container').css('visibility', 'visible');
    $('#btnDelete').css('visibility', 'visible');
    $('#$btnSend').css('visibility', 'visible');
  }

  function hasExternalContent() {
    let $botLastMessage = $([]).add($('#chatMessage>.chat-bot:last'));
    $botLastMessage = $botLastMessage.add($($botLastMessage[0]).nextAll());
    return hasLinkButton($botLastMessage) || hasYouTubeVideo($botLastMessage);

    function hasLinkButton($botLastMessage) {
      return $botLastMessage.find('.list-btn, .btnMsgLink, .btn-detail').length > 0;
    }

    function hasYouTubeVideo($botLastMessage) {
      return $botLastMessage.find('.video-container').length > 0;
    }
  }

  function suggestions({ msg }) {
    $('#chatMessage .curr-suggestion').remove();

    if (hiddenOption.hiddenUtilContentClick.isTarget(userInfo.corpCd) && hasExternalContent()) {
      for (const suggestion of msg.suggestions) {
        if (hiddenOption.hiddenUtilContentClick.isFiltering(suggestion.title)) {
          hiddenOption.setHiddenOption(suggestion, hiddenOption.hiddenUtilContentClick);
        }
      }
    }
    renderChatMessage('#suggestion1-template', { msg });
  }

  function  tets1(){

  }

  return {
    tets1,
    CHAT_INACTIVE,
    CHAT_ACTIVE,
    USER_SAY_RESPONSE,
    NO_USER_SAY_RESPONSE,
    close,
    simpleResponses,
    basicCard,
    browseCarousel,
    renderChatMessage,
    chatTime,
    startYoutube,
    alertPopup,
    loginPopup,
    autoScroll,
    userMessage,
    anim,
    hiddenChatInput,
    showChatInput,
    suggestions,
    showCurrentSuggestions,
    hiddenOption,
    init,
    activeChat: function () {
      chatStatus = true;
    },
    inactiveChat: function () {
      chatStatus = false;
    },
    statusChat: function () {
      return chatStatus;
    },
    setMainDialog: function (dialogId) {
      dialogStatus = dialogId;
    },
    currentDialog: function () {
      return dialogStatus;
    },
    resetChatArea: function () {
      $chatArea.val('');
      // 입력창 X 버튼 추가
      $('#btnDelete').hide();
      // 사용자가 채팅창에 대화 입력 하는 동안 Sending 버튼 색깔 활성화(빨간색) 기능 수정
      $btnSend.removeClass('on').attr('disabled', true);
    },
    resumeChat: function (suggestionClickOnly, placeholder) {
      chatStatus = false;
      if (suggestionClickOnly) {
        $chatArea.attr('disabled', true);

        if (placeholder) {
          $chatArea.attr('placeholder', placeholder);
        } else {
          $chatArea.attr('placeholder', '');
        }
      } else {
        if (_serviceType != 'B2B') {
          $chatArea.attr('disabled', false);
          $chatArea.attr('placeholder', _placeholder);
        }
      }
    },
    pauseChat: function () {
      chatStatus = true;
      $chatArea.attr('disabled', true);
      $chatArea.attr('placeholder', '');
      // 입력창 X 버튼 추가
      $('#btnDelete').hide();
      $btnSend.removeClass('on').attr('disabled', true);
    },
    chatAlert: function (text) {
      let AttachData = { msg: text };
      this.renderChatMessage('#chat-alert-template', AttachData);
    },
    qosSuggestions: function ({ msg }) {
      this.renderChatMessage('#suggestion-qos-template', { msg });
    },
    fileMessage: function ({ title, formattedText, url, time = this.chatTime() }) {
      let source = $('#file-template').html();
      let template = Handlebars.compile(source);
      let AttachData = { title, formattedText, url, time };
      let html = template(AttachData);
      $('#chatMessage').append(html);
    },
    manualMessage: function ({ msg, browseCarousel, time = this.chatTime() }) {
      let source = $('#manual-template').html();
      let template = Handlebars.compile(source);
      let AttachData = { msg, browseCarousel, time };
      let html = template(AttachData);
      $('#chatMessage').append(html);
    },
    fileUserMessage: function ({ title, formattedText, url, time = this.chatTime() }) {
      let source = $('#file-me-template').html();
      let template = Handlebars.compile(source);
      let AttachData = { title, formattedText, url, time };
      let html = template(AttachData);
      $('#chatMessage').append(html);
    },
    hideAnim: function () {
      isTyping = false;
      $('.readyAnim').remove();
    },
    // 라이브챗 상담시 파일전송 기능 추가 22-07 (파일전송하는동안 user anim추가)
    userAnim: function () {
      this.renderChatMessage('#anim-me-template', {});
    },
    hideUserAnim: function () {
      $('.userAnim').remove();
    },
    focusChatbot: function (obj) {
      if (obj === 'chatTextArea') {
        // 메시지입력창에 포커스
        if (gProfile.device_type === 'pc') {
          setTimeout(() => {
            $('#chatTextArea').focus();
          }, 500);
        }
      } else if (obj === 'fileAlertClose') {
        setTimeout(() => {
          $('#fileAlertClose').focus();
        }, 500);
      }
    },
    posIcoChatbot: function (code, idxCode) {
      // 감정표현 아이콘 위치 (미국,캐나다,중남미(멕시코,페루,칠레,콜롬비아,파나마) - 대화화면 챗봇 아이콘 제거)
      let $icoChatbotEmotionCode = $(`#idxCode${idxCode}.ico-chatbot-emotion.${code}`);
      let nextDivW = $icoChatbotEmotionCode.next('div').width();
      let nextDivWLocale = userInfo.corpCd === 'us' || userInfo.corpCd === 'ca' || userInfo.localeLang === 'lang_es' ? nextDivW - 30 : nextDivW + 10;

      $icoChatbotEmotionCode.css({
        left: nextDivWLocale,
        right: 'auto',
      });
    },
    endChat: function () {
      $('#mktDefaultSuggestions').hide();

      _cLogger.getIns().uploadLog();
      $chatArea.attr('readonly', true);
      $chatArea.attr('placeholder', _endchat);
      $chatArea.val('');
      $btnSend.removeClass('on').attr('disabled', true);
      $('.suggestion-qos').remove(); // QOS 별점 제거
      $('#btnDelete').hide(); // 입력창 X 버튼
      // 대화종료시 추가
      $('#chatInput').addClass('disabled');
      $('button[name="btn"]').attr('disabled', true); // #btnNav, #btnHome 등
      $('.btnMsgLink').attr('disabled', true);

      fnLayerPopupCls();
      // 세션만료시 대화재설정 제공
      clearInterval(SESSION_CHECK);
      // 챗봇종료 버튼 클릭시 QOS 레이어 팝업
      QOS_POPUP_FLAG = false;
    },
    restartShow: function () {
      // 세션만료시 대화재설정 제공
      $('#chatInput').hide();
      $('#chatMessage').css('padding-bottom', '0');
      // SG Chip의 Disabled 되는 버튼 Remove
      $('#chatMessage .curr-suggestion').remove();
    },
    restartDone: function () {
      // 세션만료시 대화재설정 제공
      $chatArea.attr('readonly', false);
      $chatArea.attr('placeholder', _placeholder);
      $('#chatInput').removeClass('disabled');
      $('button[name="btn"]').attr('disabled', false);
      $('.btnMsgLink').attr('disabled', false);
      $('#restartContainer').remove();
      $('#chatInput').show();
      $('#chatMessage').css('padding-bottom', '100px');
      // [영국법인] 대화이력 다운로드 기능 아이콘 개발 23-01
      if (userInfo.corpCd === 'uk') {
        $('#chatInput .btn.btnDownload').css('left', '46px');
        $('#chatInput .chat-input-element').css('padding', '12px 16px 12px 90px');
      }
      // [멕시코법인] 글로벌챗봇에서 OBS로 전환하는 UI버튼 개발 23-02
      if (userInfo.corpCd === 'ms') {
        $('#chatInput .btn.btnObs').css('left', '46px');
        $('#chatInput .chat-input-element').css('padding', '12px 16px 12px 90px');
      }

      // QoS 재질의시 종료 기능 추가 22-05
      gInfo.qos_scenario = true;
      // 챗봇종료 버튼 클릭시 QOS 레이어 팝업
      QOS_POPUP_FLAG = true;
      // 세션만료시 대화재설정 제공
      gInfo.session_connected = true;
    },
  };
})();

export default webChatHan;

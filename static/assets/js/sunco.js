const sunco = (function () {
	const DUMMY_URL = 'https://zendesk-live-chat',
    EMAIL_REGEX = /^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+([a-z0-9][a-z0-9-]*[a-z0-9])$/i,
    WEBSOCKET_URL = "wss://coway-proxy-hxgt5fuu5q-uc.a.run.app" + (contextRoot?("/"+contextRoot):'') + '/websocket/zendesk';
    //WEBSOCKET_URL = "ws://localhost:8080" + (contextRoot?("/"+contextRoot):'') + '/websocket/zendesk';

  const SOC_MSG_TYPE_CMD = 'cmd',
    SOC_MSG_CMD_CONNECT = 'connect',
    SOC_MSG_TYPE_MSG = 'text',
    SOC_MSG_TYPE_FILE_BEGIN = 'file_begin',
    SOC_MSG_TYPE_FILE_END = 'file_end';

  let term = $('#zendesk'),
    inpName = $('#inpNameZendesk', term),
    inpEmail = $('#inpEmailZendesk', term),
    inpPhone = $('#inpPhoneZendesk', term),
    inpTerm = $('#inpTermZendesk', term),
    labTerm = $("label[for='inpTermZendesk']", term),
    allFields = $([]).add(inpName).add(inpEmail).add(inpPhone).add(labTerm);

  let btnSubmit = $('#btnSubmitZendesk', term),
    btnClose = $('#btnCloseZendesk', term);

  let ws;
  let initOnce = false;
  let connected = false;
  let chatClosed = false;
  function openDialog(){
    if(!connected) {
      $("#zendeskContainer #layerPopupWrap").show();
      $("#zendesk").show();
    }
  }

  function cancel(){
    closeDialog();
  }

  function connect(){
    let chk = validateDialogInput();
    if(chk) {
      userInfo.email = $('#inpEmailZendesk').val();
      closeDialog();
      init();
    }
    return chk;
  }

  function closeDialog(){
    $("#zendeskContainer #layerPopupWrap").hide();
    $("#zendesk").hide();
  }

  function init(){
    webSocketInit();
    $("#zendeskupload").show();
  }

  function sendMessage(text){
    socketMsgSend(SOC_MSG_TYPE_MSG, text);
    //autoScroll();
  }

  ///////

  function webSocketInit(){
    ws = new WebSocket(WEBSOCKET_URL);
    ws.onopen = function(event) { socketOpen(event);};
    ws.onclose = function(event) { socketClose(event);};
    ws.onmessage = function(event) { socketMessage(event);};
    ws.onerror = function(event) { socketError(event);};
  }  

  function socketOpen(event){
    console.log("연결 완료");

    if(!initOnce) {
      initOnce = true;
      socketMsgSend(SOC_MSG_TYPE_CMD, SOC_MSG_CMD_CONNECT);
    }
  }

  function socketClose(event){
    console.log('socketClose ['+chatClosed+']');
    if(chatClosed) {
      setZendeskMessage('System', 'text', 'Live chatting has ended.');
      setZendeskLine();
      showErrorTemplate();
      autoScroll();
    } else {
      webSocketInit();
    }
  }

  function setZendeskMessage(author, type, text, mediaUrl, mediaTitle){
    console.log('setMessage ['+author+']:['+text+']');
    var source = $('#zendeskSay-template').html();
    var template = Handlebars.compile(source);

    var AttachData = {
      author: author,
      text: text,
      time: new Handlebars.SafeString(getTime()),
    };

    if(type == 'image') {
      AttachData.image = mediaUrl;
      AttachData.imageTitle = mediaTitle;
    } else if(type == 'file') {
      AttachData.fileUrl = mediaUrl;
      AttachData.fileTitle = mediaTitle;
    }

    var html = template(AttachData);
    $('#chatMessage').append(html);
  }

  function setUserFileMessage(type, url, title) {
    console.log('setUserFileMessage ['+url+']:['+title+']');
    var source = $('#zendesk-myImage-template').html();
    var template = Handlebars.compile(source);

    let AttachData = null;
    if(type == 'image') {
      AttachData = {
        image: url,
        imageTitle: title,
        time: new Handlebars.SafeString(getTime()),
      };
    } else {
      AttachData = {
        fileUrl: url,
        fileTitle: title,
        time: new Handlebars.SafeString(getTime()),
      };
    }

    var html = template(AttachData);
    $('#chatMessage').append(html);
  }

  function showErrorTemplate() {
    let source = $('#error-template').html();
    let template = Handlebars.compile(source);
    let AttachData = {};
    let html = template(AttachData);
    $('#chatMessage').append(html);
  }

  function setZendeskLine(){
    console.log('setZendeskLine');
    var source = $('#zendeskLine-template').html();
    var template = Handlebars.compile(source);

    var AttachData = {};

    var html = template(AttachData);
    $('#chatMessage').append(html);
  }

  var _isMove = false;
  function autoScroll() {
    if (_isMove) {
      return true;
    }
    _isMove = true;

    $('#chatMessage').animate(
      {scrollTop: $('#chatMessage').get(0).scrollHeight},'slow' , function() {_isMove = false;},
    );
  }

  function getTime() {
    let currentDate = new Date();
    let hour = currentDate.getHours();
    let min = currentDate.getMinutes();
    let ampm = '';
    if (hour > 12) {
      ampm = '<span>PM</span> ';
    } else {
      ampm = '<span>AM</span> ';
    }
    let time = ampm;
    time += hour < 10 ? '0' + hour : hour;
    time += ':';
    time += min < 10 ? '0' + min : min;
    return time;
  }

  function socketMsgSend(type, value){
    console.log("socketMsgSend ["+type+"]["+value+"]");
    var msg = {
      corpCd : userInfo.corpCd,
      locale : userInfo.locale,
      sessionId : userInfo.sessionId,
      email : userInfo.email,
      type : type,
      value : value
    }

    ws.send(JSON.stringify(msg));
  }

  function parseJson(value) {
    if (typeof value === 'string') {
      value = JSON.parse(value);
    }
    return value;
  }

  function socketMessage(event){
    try {
      let receiveData = parseJson(event.data);
      console.log("수신된 msg : " + event.data);
      if(receiveData.type == 'system' ){
        if(receiveData.value == 'connected') {
          connected = true;
          setZendeskLine();
          autoScroll();
        } else if (receiveData.value == 'image') {
          setUserFileMessage(receiveData.value, receiveData.imageUrl, receiveData.imageTitle);
          autoScroll();
        } else if (receiveData.value == 'file') {
          setUserFileMessage(receiveData.value, receiveData.fileUrl, receiveData.fileTitle);
          autoScroll();
        }
      } else if(receiveData.author?.type != 'user') {
        if(receiveData.content?.type == 'text') {
          if(receiveData.content.text == '#종료') {
            chatClosed = true;
            connected = false;
            disconnect();
            $("#chatMessage").find("a").each(function(){ $(this).off('click');$(this).attr('href', 'javascipt:void(0);'); });
            $(".chat-input").hide();
          } else {
            setZendeskMessage(receiveData.author.displayName, receiveData.content?.type, receiveData.content.text);
            autoScroll();
          }
        } else if (receiveData.content?.type == 'image') {
          setZendeskMessage(receiveData.author.displayName, receiveData.content?.type, null, receiveData.content.mediaUrl, receiveData.content.altText);
          autoScroll();
        } else if (receiveData.content?.type == 'file') {
          setZendeskMessage(receiveData.author.displayName, receiveData.content?.type, null, receiveData.content.mediaUrl, receiveData.content.altText);
          autoScroll();
        }
      }
    } catch (e){
      console.log(e);
    }
  }

  function isConnected(){
    return connected;
  }

  function socketError(event){
  	console.log("Socket Error");
  }

  function disconnect(){
  	ws.close();
  }

  function validateDialogInput(isAlerting) {
    _resetInputError();

		let valid = true;
		valid = valid && _checkRegexp(inpEmail, EMAIL_REGEX, isAlerting ? validateMsg.email : null);
		valid = valid && _checkTermsAndConditions(inpTerm, isAlerting ? validateMsg.termsAndConditions : null);
		return valid;
	}

	function _checkTermsAndConditions(o, n) {
		let $errMsgBox = labTerm.siblings('.errMsgBox');

		if (!o.is(':checked')) {
			if (n) {
				labTerm.addClass('ui-state-error');
				showErrMsg($errMsgBox, n);
			}
			return false;
		} else {
			labTerm.removeClass('ui-state-error');
			$errMsgBox.hide();
			return true;
		}
	}

  function _checkRegexp(o, regexp, n) {
		let $errMsgBox = o.siblings('.errMsgBox');

		if (!regexp.test(o.val())) {
			if (n) {
				o.addClass('ui-state-error');
				showErrMsg($errMsgBox, n);
			}
			return false;
		} else {
			o.removeClass('ui-state-error');
			$errMsgBox.hide();
			return true;
		}
	}

  function _resetInputError() {
		allFields.removeClass('ui-state-error');
		$('.errMsgBox').hide();
	}

  function sendFile(){
    let orgFileName = $('#zendeskFile').val().split('\\').pop();
    let file = document.getElementById('zendeskFile').files[0];
    socketMsgSend(SOC_MSG_TYPE_FILE_BEGIN, orgFileName);

    let reader = new FileReader();
    let rawData = new ArrayBuffer();            

    reader.loadend = function() {

    }
    
    reader.onload = function(e) {
      rawData = e.target.result;
      ws.send(rawData);
      console.log('file send Complete');
      socketMsgSend(SOC_MSG_TYPE_FILE_END, orgFileName);
      cancelUpload();
    }

    reader.readAsArrayBuffer(file);
  }

  function showUploadPopup() {
    $("#zendeskContainer #layerPopupWrap").show();
    $("#zendesk_fileupload").show();
    $("#zendeskFile").val("");
	}

	function cancelUpload() {
		$("#zendeskContainer #layerPopupWrap").hide();
    $("#zendesk_fileupload").hide();
	}

  function upload() {
    let fileName = $("#zendeskFile").val();
    if(fileName) {
      sendFile();
    }
  }

  //이미지 목록 배열
  var items = [];
  var openPhotoSwipe = function(idx) {
    var pswpElement = document.querySelectorAll('.pswp')[0];
    var options = {
      index : idx,
      history: false,
      focus: false,
      showAnimationDuration: 0,
      hideAnimationDuration: 0
    };
    var gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
    gallery.init();
  };

  $('#chatMessage').delegate(".mapImg","click",function(){
	  console.log('clicked image...');
    var imgSrc = $(this).attr('src');
    items = [];
    var idx = 0;
    $(".mapImg").each(function(index){
      var nsrc = $(this).attr('src');
      items.push({src: nsrc,w: 964,h: 1024});
      if(imgSrc == nsrc){
        idx = index;
      }
    });

    console.log(items);
    console.log(idx);
    openPhotoSwipe(idx);
  });

	return {
		init,
    openDialog,
		cancel,
		connect,
    sendMessage,
    validateDialogInput,
    isConnected,
    showUploadPopup,
    cancelUpload,
    upload,
	};
})();

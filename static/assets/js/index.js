'use strict';

import * as Common from './common.js'
import webChatHan from './webChatHan.js'

let counter = 0;

function initChatbot() {
  console.log('initChatbotSession');

  $.ajax({
    type: 'POST',
    url: contextRoot + '/chatbot/init',
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify({
      corpCd: userInfo.corpCd,
      locale: userInfo.locale,
      userId: userInfo.userId,
      platform: 'WEB',
      accessDeviceType: gProfile.device_type,
      accessOS: gProfile.os.type,
      accessOSVer: gProfile.os.version,
      accessBrowser: gProfile.browser.type,
      accessBrowserVer: gProfile.browser.version,
    }),
    beforeSend: function(xhr) {},
    success: function(res) {
      let data = '';
      data = Common.parseJson(res);
      console.log(data);

      if (data.status.code === 200) {
        console.log('초기화 정상');
        userInfo.sessionId = data.sessionId;
        userInfo.token = data.token;

        //chart
        if(userInfo.corpCd == 'demo3') {
          google.charts.load('current', {'packages':['corechart', 'bar']});
        }

        ajaxCall('welcome');
      } else {
        console.log('오류코드');
      }
    },
    complete: function() {
    },
  });
}

let isProcessing = false;
let _lastChartData = {};
function ajaxCall(msg) {
  console.log('사용자가 입력한 메시지 : ' + msg);

  alert('ajaxCall: ' + msg);
  $.ajax({
    type: 'POST',
    url: contextRoot + '/chatbot/query',
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify({
      corpCd: userInfo.corpCd,
      locale: userInfo.locale,
      userId: userInfo.userId,
      sessionId: userInfo.sessionId,
      query: msg,
      platform: 'WEB',
    }),
    beforeSend: handleUIBeforeSend,
    success: function(res) {
      let data = Common.parseJson(res);
      console.log(data);

      if (data.token) {userInfo.token = data.token;}

      var resultSource = data.result.source;
      var simpleResponses = data.result.simpleResponses;
      var suggestions = data.result.suggestions;

      var basicCard = data.result.basicCard;
      var carouselSelect = data.result.carouselSelect;
      var browseCarousel = data.result.browseCarousel;
      var listSelect = data.result.listSelect;
      var emoticon = data.result.emoticon;
      var linkOutSuggestion = data.result.linkOutSuggestion;
      var payload = data.result.payload;
      if (!handleErrorStatus(data)) {
        return;
      }

      if (data.status.code === 200) {
        if ("medLM" == userInfo.corpCd && payload && payload.needLogin) {
          let description = "Login is required.";
          webChatHan.loginPopup({ description });
        }

        if (emoticon !== undefined) {
          console.log(emoticon);
          emoticon = data.result.emoticon;
        } else {
          emoticon = '';
        }

        // linkOutSuggestion
        if (linkOutSuggestion === undefined) {
          linkOutSuggestion = '';
        }

        // simpleResponses
        if (simpleResponses !== undefined && basicCard === undefined
            && browseCarousel === undefined && listSelect
            === undefined && carouselSelect === undefined) {
          console.log('simpleResponses 존재 >>>');
          var source = $('#simpleResponses-template').html();
          var template = Handlebars.compile(source);

          for(let i=0; i < simpleResponses.simpleResponses.length; i++) {
            let temp = simpleResponses.simpleResponses[i].textToSpeech;
            simpleResponses.simpleResponses[i].textToSpeech = temp.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            console.log(simpleResponses.simpleResponses[i].textToSpeech);
          }

          var youtube = null;
          if (_isYoutubeUrl(linkOutSuggestion.url)) {
            youtube = {"url":linkOutSuggestion.url};
            linkOutSuggestion = null;
          }

          //youtube = {"url":'https://www.youtube.com/embed/u1zgFlCw8Aw?enablejsapi=1'};

          var AttachData = {
            emoticon: emoticon,
            msg: simpleResponses.simpleResponses,
            linkOutSuggestion: linkOutSuggestion,
            youtube: youtube,
          };

          if(resultSource == 'genAI' || ["MATCH_TYPE_UNSPECIFIED"].includes(payload?.intentName)) {
            $('.gen-ai .icon').addClass('off');
            //add gen ai style
            AttachData.genAi = {isExist : true};
          }

          if (suggestions !== undefined) {
            var randomId = 'browse' + Common.randomString(10);
            AttachData.suggestionId = 'suggestion_' + randomId;
            AttachData.suggestions = suggestions;
          }

          var html = template(AttachData);
          $('#chatMessage').append(html);
        }

        // basicCard
        if (basicCard !== undefined && simpleResponses !== undefined
            && browseCarousel === undefined) {
          console.log('basicCard 존재 >>>');
          var source = $('#basicCard-template').html();
          var template = Handlebars.compile(source);
          var msg = simpleResponses.simpleResponses;
          if (data.result.basicCard.hasOwnProperty(
              'image')) {
            data.result.basicCard.image.imageUri = (data.result.basicCard.image.imageUri).replace(
                'https://localhost/', '/');
          }
          var AttachData = {
            emoticon: emoticon,
            msg: msg,
            basicCard: basicCard,
            btns: basicCard.buttons,
            linkOutSuggestion: linkOutSuggestion,
          };

          if (suggestions !== undefined) {
            var randomId = 'browse' + Common.randomString(10);
            AttachData.suggestionId = 'suggestion_' + randomId;
            AttachData.suggestions = suggestions;
          }

          var html = template(AttachData);
          $('#chatMessage').append(html);
        }

        // carouselSelect
        if (carouselSelect !== undefined && simpleResponses !== undefined
            && basicCard === undefined && listSelect === undefined) {
          console.log('carouselSelect 존재 >>>');
          payload = '';
          var source = $('#carouselSelect-template').html();
          var template = Handlebars.compile(source);
          var msg = simpleResponses.simpleResponses;
          var randomId = 'browse' + Common.randomString(10);
          var AttachData = {
            carouselId: randomId,
            emoticon: emoticon,
            msg: msg,
            carouselSelect: carouselSelect.items,
            payload: payload,
            linkOutSuggestion: linkOutSuggestion,
          };

          if (suggestions !== undefined) {
            var randomId = 'browse' + Common.randomString(10);
            AttachData.suggestionId = 'suggestion_' + randomId;
            AttachData.suggestions = suggestions;
          }

          var html = template(AttachData);
          $('#chatMessage').append(html);
          setCarousel(randomId);
        }

        // carouselBrowse
        if (browseCarousel !== undefined && simpleResponses !== undefined
            && basicCard === undefined && listSelect === undefined) {
          console.log('browseCarousel 존재 >>>');
          payload = '';
          var source = $('#browseCarousel-template').html();
          var template = Handlebars.compile(source);
          var msg = simpleResponses.simpleResponses;
          var randomId = 'browse' + Common.randomString(10);
          var AttachData = {
            carouselId: randomId,
            emoticon: emoticon,
            msg: msg,
            browseCarousel: browseCarousel.items,
            payload: payload,
            linkOutSuggestion: linkOutSuggestion,
          };
          if (suggestions !== undefined) {
            var randomId = 'browse' + Common.randomString(10);
            AttachData.suggestionId = 'suggestion_' + randomId;
            AttachData.suggestions = suggestions;
          }


          if (resultSource === 'match_engine') {
            source = $('#match-engine-template').html();
            template = Handlebars.compile(source);
            const gsUrlPrefix = "gs://";
            const publicPrefix = "https://storage.googleapis.com/";
            for (var i = 0; i < browseCarousel.items.length; i++) {
              const url = browseCarousel.items[i].openUrlAction.url;
              browseCarousel.items[i].openUrlAction.url = url.replace(gsUrlPrefix, publicPrefix);

              const contentList = data.result.payload?.searchRes?.contentList;
              if (contentList && contentList.length > 0) {
                const extractiveAnswers = contentList[i].extractiveAnswers;
                let pageNumber = extractiveAnswers && extractiveAnswers[0] ? extractiveAnswers[0].pageNumber : null;
                if (pageNumber) {
                  browseCarousel.items[i].openUrlAction.url += `#page=${pageNumber}`;
                }
              }

              if (!browseCarousel.items[i]?.image?.imageUri) {
                browseCarousel.items[i].image = {
                  imageUri: "/assets/img/file-svgrepo-com.svg"
                }
              }
              // Check file extension and set imageUri accordingly
              if (url.endsWith('.pdf')) {
                browseCarousel.items[i].image.imageUri = "/assets/img/pdf-svgrepo-com.svg";
              } else if (url.endsWith('.html')) {
                browseCarousel.items[i].image.imageUri = "/assets/img/html-svgrepo-com.svg";
              } else if (url.endsWith('.doc')) {
                browseCarousel.items[i].image.imageUri = "/assets/img/doc-svgrepo-com.svg";
              } else if (url.endsWith('.pptx') || url.endsWith('.ppt')) {
                browseCarousel.items[i].image.imageUri = "/assets/img/pptx-svgrepo-com.svg";
              } else if (url.endsWith('.txt')) {
                browseCarousel.items[i].image.imageUri = "/assets/img/txt-svgrepo-com.svg";
              }
            }

            AttachData['browseCarousel'] = browseCarousel.items;

          }
          var html = template(AttachData);
          $('#chatMessage').append(html);
          setCarousel(randomId);
        }

        // listSelect
        if (listSelect !== undefined && simpleResponses !== undefined && basicCard
            === undefined && browseCarousel === undefined) {
          var payload = '';
          var source = $('#listSelect-template').html();
          var template = Handlebars.compile(source);
          var msg = simpleResponses.simpleResponses;

          var AttachData = {
            emoticon: emoticon,
            msg: msg,
            listSelect: listSelect,
            payload: payload,
            linkOutSuggestion: linkOutSuggestion,
          };

          if (suggestions != undefined) {
            var randomId = 'browse' + Common.randomString(10);
            AttachData.suggestionId = 'suggestion_' + randomId;
            AttachData.suggestions = suggestions;
          }

          var html = template(AttachData);
          $('#chatMessage').append(html);
        }

        if (payload !== undefined) {
          if (typeof payload === "object"
              && payload?.richContent
              && Array.isArray(payload.richContent)
              && payload.richContent.length > 0
              && Array.isArray(payload.richContent[0])
              && payload.richContent[0].length > 0
              && typeof payload.richContent[0][0] === "object"
              && payload.richContent[0][0].hasOwnProperty("actionLink")
              && payload.richContent[0][0].hasOwnProperty("subtitle")
          ) {
            if (payload.richContent[0][0].type === "go") {
              interactWorkspaceData({
                actionLink: payload.richContent[0][0].actionLink
              });
            } else {
              var source = $('#vertex-ai-website-template').html();
              var template = Handlebars.compile(source);
              var richContentList_0 = payload.richContent[0];

              // 중복을 제거할 객체
              const uniqueObject = {};

              // 중복이 없는 항목만 유지
              const richContentList = richContentList_0.filter(item => {
                if (!uniqueObject[item.title]) {
                  uniqueObject[item.title] = true;
                  return true;
                }
                return false;
              });

              for (let i=0; i<richContentList.length;i++) {
                let richContent = richContentList[i];
                if(i == 0) {
                  var AttachData = {
                    richContent: [{
                      title: richContent.title,
                      subtitle: richContent.subtitle,
                      actionLink: richContent.actionLink,
                    }]
                  }
                  var html = template(AttachData);
                  $('#chatMessage').append(html);
                } else {
                  /*
                  var AttachData = {
                    richContent: [{
                      title: richContent.title,
                      actionLink: richContent.actionLink,
                    }]
                  }
                  var html = template(AttachData);
                  $('#chatMessage').append(html);
                  */
                }
              }
            }
          }
          const message = {};
          if (payload?.currentPage) {
            message.currentPage = payload.currentPage;
          }
          if (payload?.parameters) {
            message.parameters = payload.parameters;
          }
          if (Object.keys(message).length > 0) {
            sendInfoMessage(message);
          }

          if(payload?.dkMedicalTestResultList){
            console.log(payload.dkMedicalTestResultList);
            _lastChartData = payload.dkMedicalTestResultList;
            drawMedicalChart(payload.dkMedicalTestResultList);
          }
        }

        console.log(simpleResponses.simpleResponses);
        simpleResponses.simpleResponses.forEach(
            e => {Common.ttsMgr.speech(e.textToSpeech);});
      } else {
        console.log('오류코드');
      }

      counter++;
      if (counter > 1) {
        $('#chatTextArea').focus();
      }

      autoScroll();
    },
    complete: function() {
      hideReady();
      autoScroll();
      isProcessing = false;

      if(msg == 'welcome') {
        showIntro();

        let description = "Login is required.";
        webChatHan.loginPopup({ description });
      }
    },
  });
}

let showIntroOnce = false;
function showIntro() {
  if(showIntroOnce) {
    return false;
  } else {
    showIntroOnce = true;
  }

  var source = $('#medlmIntro-template').html();
  var template = Handlebars.compile(source);
  var AttachData = {};

  var html = template(AttachData);
  $('#chatMessage').append(html);
  //autoScroll();
}

export function openChart() {
  if (!_lastChartData || _lastChartData.length === 0) {
    return;
  }
  interactWorkspaceData({type: "chart", chartData: _lastChartData});
}

export function closeLoginPopup() {
  $("#loginError").text("");

  let inputEmail = $("#inputEmail").val();
  let inputPass = $("#inputPass").val();

  if(!inputEmail) {
    $("#inputEmail").focus();
    $("#loginError").text("Please enter your Email.");
    return false;
  }

  if (!inputPass) {
    $("#inputPass").focus();
    $("#loginError").text("Please enter your Password.");
    return false;
  }
  
  //console.log("@@@@@@@@@@@@@@@@@@");
  //console.log(inputEmail+" : "+inputPass);
  //return false;

  $.ajax({
    type: 'POST',
    url: contextRoot + '/chatbot/mediLogin',
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify({
      corpCd: userInfo.corpCd,
      locale: userInfo.locale,
      sessionId: userInfo.sessionId,
      inputEmail: inputEmail,
      inputPass: inputPass,
      platform: 'WEB',
    }),
    beforeSend: handleUIBeforeSend,
    success: function(res) {
      $("#inputEmail").val("");
      $("#inputPass").val("");

      let data = '';
      data = Common.parseJson(res);
      console.log(data);

      if (data.result == "success") {
        Common.fnLayerPopupCls(null, null, );
      } else {
        console.log('오류코드');
        $("#loginError").text("Invalid Email or Password.");
      }
    },
    complete: function() {
      hideReady();
    },
  });
}

export function closeAlertPopup() {
  Common.fnLayerPopupCls(null, null, );
}


function drawMedicalChart(item_list) {
  if (!item_list || item_list.length === 0) {
    return;
  }

  const source = $('#chart-template').html();
  const template = Handlebars.compile(source);
  const chartId = 'chart' + Common.randomString(10);
  const AttachData = {
    chartId: chartId,
  };
  const html = template(AttachData);
  $('#chatMessage').append(html);

  // 각 방별로 별도의 차트를 그립니다.
  const roomNames = new Set(item_list.map(item => item.roomName));
  roomNames.forEach(roomName => {
    // 현재 치료실의 데이터만 필터링
    const filteredList = item_list.filter(item => item.roomName === roomName);
    // 이 치료실의 차트를 그리는 함수 호출
    drawChartForRoom(chartId, roomName, filteredList);
  });
}

const youtubeUrls = ['https://youtube.com/embed', 'https://youtu.be', 'https://www.youtube.com/watch', 'https://www.youtube.com/embed', 'https://youtube.com/watch'];
function _isYoutubeUrl(url) {
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

function drawChartForRoom(chartId, roomName, itemList) {

  // 데이터 테이블 생성
  var data = new google.visualization.DataTable();

  // 전압별로 열 추가
  const voltages = new Set(itemList.map(item => item.voltage));

  // 날짜와 전압별 데이터 매핑
  const dateVoltageMap = {};
  itemList.forEach(item => {
    const dateKey = item.insDate;
    if (!dateVoltageMap[dateKey]) {
      dateVoltageMap[dateKey] = {};
    }
    dateVoltageMap[dateKey][item.voltage] = parseFloat(item.difference);
  });

  var options = {
    title: `${roomName} - Motivation and Energy Level Throughout the Day`,
    curveType: 'function',
    width: 400, height: 300,
    vAxis: { title: 'Difference (%)' }
  };

  var chart;
  const rows = [];
  if (Object.keys(dateVoltageMap).length === 1) { // 단 하나의 날짜만 있는 경우 막대 그래프

    const singleDateKey = Object.keys(dateVoltageMap)[0]; // 단 하나의 날짜 키 추출
    const voltagesData = dateVoltageMap[singleDateKey]; // 해당 날짜의 전압 데이터 추출

    const rows = Object.entries(voltagesData)
    .map(([voltage, difference]) => [voltage, difference]);

    data.addColumn('string', 'Voltage');
    data.addColumn('number', 'Difference');
    data.addRows(rows);
    options.hAxis = { title: 'Voltage'};
    chart = new google.visualization.ColumnChart(document.getElementById(chartId));
  } else { // 여러 날짜가 있는 경우 선 그래프
    // rows 데이터 구성
    for (const [date, voltagesData] of Object.entries(dateVoltageMap)) {
      const row = [new Date(date)];
      voltages.forEach(voltage => {
        row.push(voltagesData[voltage] || 0);
      });
      rows.push(row);
    }

    rows.sort((a, b) => a[0] - b[0]);
    data.addColumn('date', 'Date');
    voltages.forEach(voltage => {
      data.addColumn('number', voltage);
    });
    data.addRows(rows);
    options.curveType = 'function';
    options.hAxis = { title: 'Date', format: 'M월 d일' };
    chart = new google.visualization.LineChart(document.getElementById(chartId));
  }
  chart.draw(data, options);
}

function handleUIBeforeSend(xhr) {
  if (Common.ttsMgr.getStatus()) {
    Common.ttsMgr.cancel();
  }
  $('#chatTextArea').empty();
  showReady();
  autoScroll();
  xhr.setRequestHeader('Authorization', userInfo.token);
}

function handleErrorStatus(data) {
  if (data.status.hasOwnProperty('code')) {
    if ([999, 300, 301, 302, 400].includes(data.status.code)) {
      console.error('Error: ', {
        code: data.status.code,
        message: data.status.message,
      });
      showErrorTemplate();
      $('#chatTextArea').attr({'readonly': true, 'disabled': true});
      autoScroll();
      return false;
    }
  }

  return true;
}

/**
 * 채팅창 자동 스크롤
 * @returns
 */
var _isMove = false;


/**
 * 채팅창 자동 스크롤
 * @returns
 */
function autoScroll() {
  if (_isMove) {
    return true;
  }
  _isMove = true;

  $('#chatMessage').animate(
    {scrollTop: $('#chatMessage').get(0).scrollHeight},
    'slow'
    , function() {_isMove = false;},
  );
}

// 브레이크 포인트별 설정 객체
const breakPointSettings = {
  413: { centerPadding: '86px' }, // iphone 6/7/8 plus, iphoneXR 414px
  411: { centerPadding: '85px' }, // Galaxy S10+ 412px
  374: { centerPadding: '60px' }, // iphoneX, iphoneXs 375px
  359: { centerPadding: '68px' }, // Galaxy S9, Galaxy S10e 360px
  319: { centerPadding: '50px' }, // iphone5/SE 320px, Galaxy S9+
  450: { slidesToShow: 2, centerMode: false },
  640: { slidesToShow: 3, centerMode: false },
  768: { slidesToShow: 4, centerMode: false }  // ipad
};

function setCarousel(target) {
  const responsiveSettings = Object.entries(breakPointSettings).map(([breakpoint, settings]) => {
    return {
      breakpoint: parseInt(breakpoint),
      settings: settings
    };
  });

  $('#' + target).slick({
    arrows: true,
    centerMode: true,
    infinite: false,
    mobileFirst: true,
    variableWidth: false,
    responsive: responsiveSettings
  });
}

function getTime() {
  let currentDate = new Date();
  let hour = currentDate.getHours();
  let min = currentDate.getMinutes();
  let ampm = '';
  if (hour > 12) {
    ampm = '<span>AM</span> ';
  } else {
    ampm = '<span>PM</span> ';
  }
  let time = ampm;
  time += hour < 10 ? '0' + hour : hour;
  time += ':';
  time += min < 10 ? '0' + min : min;
  return time;
}

/**
 * 사용자가 쓴 메시지
 * @param text
 * @returns
 */
export function setMessage(text) {
  if(isProcessing) {
    console.log('isProcessing !!!!!!!!!!!!!!');
    return;
  }
  isProcessing = true;
  $('#input-suggestion, .autocomplete-suggestions').hide();
  $('.autocomplete-suggestions').find('li').length > 0;
  let source = $('#me-template').html();
  let template = Handlebars.compile(source);
  let AttachData = {
    msg: text,
    time: new Handlebars.SafeString(getTime()),
  };
  let html = template(AttachData);
  $('#chatMessage').append(html);
  ajaxCall(text);
  $('#chatTextArea').val('');
  autoScroll();
}

function showErrorTemplate() {
  let source = $('#error-template').html();
  let template = Handlebars.compile(source);
  let AttachData = {};
  let html = template(AttachData);
  $('#chatMessage').append(html);
}

var timerVar = null;

/**
 * 입력대기 말풍선 출력
 * @returns
 */
function showReady() {
  let source = $('#ready-template').html();
  let template = Handlebars.compile(source);
  let AttachData = {};
  let html = template(AttachData);
  $('#chatMessage').append(html);
}

export function setOutLink(value) {
  if(value.startsWith("goto")) {
    console.log("페이지 이동 ..." + value)
    let target = value.split('//')[1];
    let data = {target:target, data:{}};
    Common.sendPostMessage(data);
  } else if(value.indexOf("zendesk-live-chat") > -1) {
    sunco.openDialog();
  } else {
    window.open(value, '_blank');
  }
}

export function interactWorkspaceData(value) {
  console.log("interactWorkspaceData ... ");
  console.log(value);
  try {
    window.parent.postMessage({
      type: 'chatbot-to-iframe',
      data: value
    }, "*");
  } catch (e) {}
}

export function sendInfoMessage(value) {
  console.log("sendInfoMessage ... ");
  console.log(value);
  try {
    window.parent.postMessage({
      type: 'chatbot-to-iframe',
      data: {
        type: 'info',
        data: value
      }
    }, "*");
  } catch (e) {}
}

export function interactWorkspace(value) {
  interactWorkspaceData({actionLink: value})
}

/**
 * 입력대기 말풍선 숨김
 * @returns
 */
function hideReady() {
  if (timerVar) {
    clearTimeout(timerVar);
    timerVar = null;
  }

  $('.dv-ready').remove();
}

/** 글자 크기 확대 */
function setZoom() {
  const className = $('html, body').attr('class');
  let html = $('html');
  if (className === undefined || className === '') {
    html.attr('class', '');
    html.addClass('zoom1');
  } else if (className === 'zoom1') {
    html.attr('class', '');
    html.addClass('zoom2');
  } else if (className === 'zoom2') {
    html.attr('class', '');
  }
}

function showLooker(lookerEmbedUrl, params) {
  let jsonConfig = {"ds01": {}};
  jsonConfig.ds01[''] = val;

  let encoded = encodeURIComponent(JSON.stringify(jsonConfig))
  let _url = lookerEmbedUrl+"?config="+encoded;

  $("#datastudio").attr("src",_url);
}

$(function() {
  userInfo.platform = Common.checkPlatform();
  Common.fnInitProfile();
  Common.fnDeviceTypeCheck();
  webChatHan.init();
  initChatbot();

  /* 텍스트 입력 영역에 엔터키가 눌러지거나 '전송' 버튼을 누르면 */
  $('#chatTextArea').keydown(function(event) {
    if (this.value && event.keyCode === 13) {
      setMessage(this.value);

      this.value = '';
      return false;
    } else if (this.value == '' && event.keyCode === 13) {
      return false;
    }
    autoScroll();
  });

  $('#chatTextArea').on('keydown keyup paste', function (e) {
    let _len = $(this).val().trim().length;
    if (_len > 255) {
      let description = _localeMessage.validate.$chatArea.replaceAll('{0}', '0').replaceAll('{1}', '256');
      webChatHan.alertPopup({ description });
    }
    // 붙여넣기 이면
    if (_len > 0 || e.type === 'paste') {
      $('#btnSend').addClass('on').attr('disabled', false);
      // 입력창 X 버튼 추가
      $('#btnDelete').show();
    } else {
      $('#btnSend').removeClass('on').attr('disabled', true);
      // 입력창 X 버튼 추가
      $('#btnDelete').hide();
    }
  });

  /* 전송 버튼 */
  $('#btnSend').click(function() {
    const textArea = $('#chatTextArea');
    const text = textArea.val();
    if (text !== '') {
      setMessage(text);
      textArea.val('');
      textArea.blur();
    }
  });

  /* 메뉴 감추기 보이기 */
  $('.btn-collapse').click(function() {
    const isActive = $(this).hasClass('active');
    if (isActive) {
      $(this).removeClass('active');
      $(this).find('.append').removeClass('show');
      $(this).find('.collapse').addClass('show');
      $('.chat').removeClass('nav-opened');
    } else {
      $(this).addClass('active');
      $(this).find('.append').addClass('show');
      $(this).find('.collapse').removeClass('show');
      $('.chat').addClass('nav-opened');
    }
    $(this).find('.nav-arr').toggleClass('active');
    $('#nav').slideToggle('fast');
  });
  
  /* 메뉴 - Zoom */
  $('#btnZoom').click(function(){
    setZoom();
  });

  /* 메뉴 - Chatbot Guide */
  $('#btnChatbotGuide').click(function(){
    let text = $(this).attr("data-text");
    setMessage(text);
  });

  $('.btnReset').click(function(){
    window.location.reload();
  });

  $(".btn-radio label").keydown(function(event) {
    if (event.keyCode === 13) {
      $(this).find('input').click();
    }
  });

  $(".gnb nav ul li").keydown(function(event) {
    if (event.keyCode === 13) {
      $(this).find('button').click();
    }
  });

  $(".btn-submit").keydown(function(event) {
    if (event.keyCode === 13) {
      $(this).click();
    }
  });

  window.addEventListener('message', function(event) {
    if (event.data.type && event.data.type === 'iframe-to-chatbot') {
      let data = event.data.data;
      if (data.type === 'message') {
        var source = $('#basicCard-template').html();
        var template = Handlebars.compile(source);
        var msg = data.data.result.simpleResponses.simpleResponses;
        var AttachData = {
          msg: msg,
          basicCard: data.data.result.basicCard,
        };

        var html = template(AttachData);
        $('#chatMessage').append(html);
        autoScroll();
      }
      if (data.type === 'sendChat') {
        setMessage(data.data);
      }
    }
  });
});

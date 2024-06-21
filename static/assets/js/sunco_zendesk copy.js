const sunco_zendesk = (function () {
	const DUMMY_URL = 'https://zendesk-live-chat',
		// From http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#e-mail-state-%28type=email%29
		EMAIL_REGEX = /^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+([a-z0-9][a-z0-9-]*[a-z0-9])$/i,
		_tag = ['via_tpcg', 'via_tpcg_in'],
		_tag_de_marketing = ['lg_germany', 'lgedg', 'lgepro_de', 'locale_de', 'marketing_disagree', 'pp_agree', 'pp_agree_save'],
		_tag_disconnect_once = ['disconnect_single'],
		_tag_disconnect_more = ['disconnect_multiple'],
		_init_remove_tags = [
			'disconnect_single',
			'disconnect_multiple',
			'chatrating_good',
			'chatrating_bad',
			'chatrating_solved',
			'chatrating_unsolved',
			'chatrating_1',
			'chatrating_2',
			'chatrating_3',
			'chatrating_4',
			'chatrating_5',
			'chatrating_agent',
			'chatrating_customer',
		],
		_tag_chatrating_agent = ['agent'],
		_tag_chatrating_customer = ['customer'],
		_path = {
			title: 'thinq',
			url: window.location.href,
		},
		MIN_NAME_LENGTH = 1,
		MAX_NAME_LENGTH = 16,
		localeMsg = resource.hasOwnProperty(_locale) ? resource[_locale] : resource['en_US'],
		validateMsg = localeMsg.validate,
		qosMsg = localeMsg.showMsg.qosMsg,
		nameValidMsg = validateMsg.name.replaceAll('{0}', MIN_NAME_LENGTH.toString()).replaceAll('{1}', MAX_NAME_LENGTH.toString()),
		phoneValidMsg = validateMsg.phoneZendesk;
	const FIRST_MESSAGE = 'Connect Request';
	const MODEL_CODE_MESSAGE = 'Model Code : ';
	let CURRENT_MODEL_CODE_MESSAGE = '';
	let MIN_PHONE_LENGTH = 8,
		MAX_PHONE_LENGTH = 12;
	const QUEUE_LIMIT = _environment === 'prod' ? 100 : 3;
	let QUEUE_LIMIT_MSG = false;
	let clearDeptId = { clear_dept_id_on_chat_ended: true };

	// 라이브챗 상담시 파일전송 기능 추가 22-07 (허용 확장자)
	const _allowed_extensions = [
		'zip', // 압축파일
		'txt', // 문서
		'odt',
		'rtf',
		'pdf',
		'doc',
		'docx',
		'ods',
		'csv',
		'xls',
		'xlsx',
		'ppt',
		'pptx',
		'm4a', // 오디오
		'mp2',
		'wav',
		'aac',
		'mpg', // 동영상
		'mpeg',
		'qt',
		'mp4',
		'mov',
		'wmv',
		'avi',
		'png', // 이미지
		'jpeg',
		'jpg',
		'gif',
		'tif',
		'tiff',
		'jfif',
		'bmp',
	];

	const _corpInitFunc = {
		il : {
			openDialog : (param) => {
				if(param.deptName == 'obs'){
					$("label[for='inpPhoneZendesk']", term).hide();
					inpPhone.hide();
				}
				else{
					$("label[for='inpPhoneZendesk']", term).show();
					inpPhone.show();
				}
			}
		}
	}

	// 라이브챗 상담시 파일전송 기능 추가 22-07 (최대 20MB 까지 가능)
	const getByteSize = (size) => {
		const byteUnits = ['KB', 'MB', 'GB', 'TB'];
		let i = 0;

		while (size >= 1024 && i < byteUnits.length) {
			size /= 1024;
			i++;
		}

		return `${size.toFixed(1)}${byteUnits[i]}`;
	};

	let term = $('#zendesk'),
		inpName = $('#inpNameZendesk', term),
		inpEmail = $('#inpEmailZendesk', term),
		inpPhone = $('#inpPhoneZendesk', term),
		labProduct = $("label[for='optProductZendesk']", term),
		optProduct = $('#optProductZendesk', term),
		optServiceType = $('#optServiceTypeZendesk', term),
		optCategoryZendesk = $('#optCategoryZendesk', term),
		inpTerm = $('#inpTermZendesk', term),
		labTerm = $("label[for='inpTermZendesk']", term),
		dvCategory = $('#dvCategoryZendesk', term),
		dvProduct = $('#dvProductZendesk', term)
		// [rollback][LGEAI] Live Chat Agent 연결정보에 model 필드 추가
		//inpModelCode = $("#inpModelCodeZendesk", term),
		//description = $('.descriptionProduct', term),
		allFields = $([]).add(inpName).add(inpEmail).add(inpPhone).add(optProduct).add(optServiceType).add(optCategoryZendesk).add(labTerm);

	let btnSubmit = $('#btnSubmitZendesk', term),
		btnClose = $('#btnCloseZendesk', term);

	let isPreventedTypingAnimated = false;

	// <code>true</code> indicates that the agent is connected.
	let connection = false,
		RATING_FLAG = true,
		PREVENT_CLICK = false,
		RATING_BY_AGENT = false;

	let _wating_memberjoin = false,
		_wating_agenttrigger = false,
		_agent_counter = new Set(),
		_ENDCHAT_TIMEOUT = null,
		_surveychat_counter = new Set();

	let isNotInit = true,
		isZendeskInit = false,
		isZendeskConnected = false,
		isZChattingStarted = false,
		isZChattingAgent = false,
		isShowDisconnected = false;

	let zendeskKey = null,
		zendeskDepartment = null,
		visitorInfo = null,
		visitorPath = null;

	let disconnCount = 0;
	let zendeskInitStep = 0;
	let lastTimestamp = 0;
	let ztimestamps = new Set();

	const addTagsWithModelCode = (tags) => {
    /*
		const updatedTags = SEND_MODEL_CODE.includes(_corpCd) && inpModelCode.val() ? [...tags, inpModelCode.val()] : tags;
		zChat.addTags(updatedTags, () => {
			console.log('[addTags]', updatedTags);
		});
    */
	};

	function isConnectAgent(status) {
		if (status === 'session_restart') {
			connection = false;
		}
		return connection;
	}

	// 상담원 진입 팝업 TEXTAREA 카운트
	function fnMessageTxtCnt() {
		$('#messageTxtWrapZendesk .remaining').each(function () {
			let $maxcount = $('.maxcount', this);
			let $count = $('.count', this);
			let $messageTxt = $('#messageTxtZendesk');

			// .text()가 문자열을 반환하기에 이 문자를 숫자로 만들기 위해 1을 곱한다.
			let maximumByte = $maxcount.text() * 1;
			// update 함수는 keyup, paste, input 이벤트에서 호출한다.
			let update = function () {
				// var before = $count.text() * 1;
				let str_len = $messageTxt.val().length;
				let cbyte = 0;
				let li_len = 0;
				for (let i = 0; i < str_len; i++) {
					let ls_one_char = $messageTxt.val().charAt(i);
					if (escape(ls_one_char).length > 4) {
						cbyte += 2; // 한글이면 2를 더한다
					} else {
						cbyte++; // 한글아니면 1을 다한다
					}
					if (cbyte <= maximumByte) {
						li_len = i + 1;
					}
				}
				// 사용자가 입력한 값이 제한 값을 초과하는지를 검사한다.
				if (parseInt(cbyte) > parseInt(maximumByte)) {
					// var str = $opinionTxt.val();
					let str2 = $messageTxt.val().substr(0, li_len);
					$messageTxt.val(str2);
					let cbyte = 0;
					for (let i = 0; i < $messageTxt.val().length; i++) {
						let ls_one_char = $messageTxt.val().charAt(i);
						if (escape(ls_one_char).length > 4) {
							cbyte += 2; // 한글이면 2를 더한다
						} else {
							cbyte++; // 한글아니면 1을 다한다
						}
					}
				}
				$count.text(cbyte);
			};
			// input, keyup, paste 이벤트와 update 함수를 바인드한다
			$messageTxt.on('input keyup keydown paste change', function () {
				setTimeout(update, 0);
			});
			update();
		});
	}

	function init() {
		// 언어에 따른 UI 언어 변경
		$('#tipZendesk', term).html(localeMsg.zchat.tips);
		$("label[for='inpNameZendesk']", term).html(localeMsg.label.name);
		$("label[for='inpEmailZendesk']", term).html(localeMsg.label.email);
		$("label[for='optProductZendesk']", term).html(localeMsg.label.product);
		$("label[for='optCategoryZendesk']", term).html(localeMsg.label.product);
		$("label[for='inpPhoneZendesk']", term).html(localeMsg.label.phone);
		$('#txtTermZendesk', term).html(localeMsg.termsAndConditions);
		/* // [rollback][LGEAI] Live Chat Agent 연결정보에 model 필드 추가
        if (SEND_MODEL_CODE.includes(_corpCd)) {
            $("label[for='inpModelCodeZendesk']", term).html(localeMsg.label.modelCode);
            description.html(localeMsg.gsfs.repair.descriptionProduct);
        }

         */
		btnSubmit.html(localeMsg.btn.connect);
		btnClose.html(localeMsg.btn.cancel);
		if (PRE_MESSAGE.includes(_corpCd)) {
			setTimeout(() => {
				fnMessageTxtCnt();
			}, 100);
		}

		$('#btnCloseZendesk').on('click', function () {
			zendesk.closeDialog();
		});

		btnSubmit.on('click', function () {
			if (zendesk.connect()) {
				zendesk.closeDialog();
			}
		});

		$('input', term).on('keydown keypress keyup paste', function () {
			btnSubmit.toggleClass('on', validate());
		});

		$('.chk', term).on('mouseover mouseout click', function () {
			btnSubmit.toggleClass('on', validate());
		});

		$('#optServiceTypeZendesk').on('change', function () {
			if ('MKT' === $(this).val()) {
				dvCategory.show();
				dvProduct.hide();
			} else {
				dvCategory.hide();
				dvProduct.show();
				dvCategory.val($('#dvCategoryZendesk option:first').val());
			}
			btnSubmit.toggleClass('on', validate());
		});
		dvCategory.on('change', function () {
			btnSubmit.toggleClass('on', validate());
		});

		// 라이브챗 상담시 파일전송 기능 추가 22-07 (파일첨부 폴더 내 파일 선택시)
		$(document)
			.off()
			.on('change', '#inputFile', function () {
				let files = this.files;
				let fileInfo = this.files[0];

				if (files && fileInfo) {
					let fileName = fileInfo.name;
					let fileSize = fileInfo.size;
					let fileExtension = fileName.split('.').pop().toLowerCase();
					let fileByteSize = getByteSize(fileSize);

					// 파일 전송 전 확장자 확인
					if (!_allowed_extensions.includes(fileExtension)) {
						fnLayerPopupOpen(fileExtension, 'sendFileExtension');
						webChatHan.focusChatbot('fileAlertClose');

						console.log(`not allowed extensions: ${fileExtension}`);
						return;
					}

					// 파일 전송 전 사이즈 확인
					if (fileSize > 20 * 1024 * 1024) {
						fnLayerPopupOpen(fileByteSize, 'sendFileSize', fileName);
						webChatHan.focusChatbot('fileAlertClose');

						console.log(`File size Exceeds threshold of 20MB: ${fileName}(${fileSize})`);
						return;
					}

					$('#uploadFileName').text(fileName);
					$('#uploadFileSize').html(`&nbsp;(${fileByteSize})`);
					$('#inputFileInner').show();
					$('#chatMessage').addClass('zendesk');
					$('#btnSend').addClass('on').attr('disabled', false);
					webChatHan.autoScroll();
					// 메시지입력창에 포커스
					webChatHan.focusChatbot('chatTextArea');
				} else {
					zendesk.fnInitFile(); // 파일선택 취소시 초기화
					// 메시지입력창에 포커스
					webChatHan.focusChatbot('chatTextArea');
				}
			});

		inpPhone.on('input', (ev) => {
			if (!['us', 'il', 'ms'].includes(_corpCd)) {
				return;
			}

			const originStr = ev.target.value;
			let numberOnly = originStr.replace(/\D/g, '');
			let len = numberOnly.length;
			let phoneInfo = {
				originStr,
				numberOnly,
				len,
			};

			if (_corpCd === 'us') {
				_LGEAI(ev, phoneInfo);
			} else if (_corpCd === 'ms') {
				_LGEMS(ev, phoneInfo);
			} else if (_corpCd === 'il') {
				if (phoneInfo.originStr.startsWith('+91 ')) {
					phoneInfo.numberOnly = originStr.substring(4).replace(/\D/g, '');
				}
				phoneInfo.len = phoneInfo.numberOnly.length;
				_LGEIL(ev, phoneInfo);
			}

			function _LGEAI(ev, phoneInfo) {
				let result = phoneInfo.numberOnly;
				if (phoneInfo.len >= 1) {
					result = '(' + result.substring(0);
				}
				if (phoneInfo.len >= 4) {
					result = result.substring(0, 4) + ') ' + result.substring(4);
				}
				if (phoneInfo.len >= 7) {
					result = result.substring(0, 9) + '-' + result.substring(9);
				}
				result = result.substring(0, 14);
				if (result !== phoneInfo.originStr) {
					ev.target.focus();
					ev.target.value = '';
					ev.target.value = result;
				}
			}
			function _LGEMS(ev, phoneInfo) {
				let result = phoneInfo.numberOnly;
				if (phoneInfo.len >= 1) {
					result = '(' + result.substring(0);
				}
				if (phoneInfo.len >= 3) {
					result = result.substring(0, 3) + ') ' + result.substring(3);
				}
				if (phoneInfo.len >= 7) {
					result = result.substring(0, 9) + '-' + result.substring(9);
				}
				result = result.substring(0, 14);
				if (result !== phoneInfo.originStr) {
					ev.target.focus();
					ev.target.value = '';
					ev.target.value = result;
				}
			}
			function _LGEIL(ev, phoneInfo) {
				if ((phoneInfo.originStr === '' || phoneInfo.originStr.startsWith('+')) && phoneInfo.originStr.length < 4) {
					ev.target.focus();
					ev.target.value = '';
					return;
				}
				let result = phoneInfo.numberOnly;
				result = '+91 ' + result;
				result = result.substring(0, 14);
				if (result !== phoneInfo.originStr) {
					ev.target.focus();
					ev.target.value = '';
					ev.target.value = result;
				}
			}
		});

		// 젠데스크 라이브챗 운영 시간 외 테스트 22-06
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		const _debug = urlParams.get('debug');
		if (_debug === 'zendesk') {
			webChatHan.browseCarousel({
				msg: [{ textToSpeech: 'ZENDESK Test' }],
				browseCarousel: [
					{
						openUrlAction: { url: 'https://zendesk-live-chat' },
						title: 'Live Chat',
						description: '',
					},
				],
			});
		}
	}

	function _setZChatKey() {
		if (!zendeskKey) {
			return false;
		}

		console.log('zendesk_key : ' + zendeskKey + ', zendesk department : ' + zendeskDepartment);

		zChat.init({ account_key: zendeskKey });

		zChat.on('connection_update', (status) => {
			_updateConnection(status);
		});

		zChat.on('chat', function (event_data) {
			chat(event_data);
		});

		zendeskInitStep = 1;

		return true;
	}

	function _resetConfigurations() {
		connection = false;
		RATING_FLAG = true;
		isNotInit = true;
		_wating_memberjoin = false;
		_wating_agenttrigger = false;
		visitorInfo = null;
		visitorPath = null;

		_agent_counter.clear();
		disconnCount = 0;
	}

	function _resetTerm() {
		_resetInputError();
		inpName.val('');
		inpEmail.val('');
		inpPhone.val('');
		inpTerm.prop('checked', false);
		// [rollback][LGEAI] Live Chat Agent 연결정보에 model 필드 추가
		//inpModelCode.val('');
		if (PRE_MESSAGE.includes(_corpCd)) {
			$('#messageTxtZendesk').val('');
		}
		optProduct.val($('#optProductZendesk option:first').val());
		btnSubmit.removeClass('on');
	}

	function openDialog(dept_name) {
		if(_corpInitFunc[_corpCd] && _corpInitFunc[_corpCd].openDialog) {
			const param = {
				deptName: dept_name
			};

			_corpInitFunc[_corpCd].openDialog(param);
		}
		
		if (webChatHan.currentDialog() || connection) {
			return;
		}
		webChatHan.setMainDialog(zendesk);
		_resetTerm();
		logger('zendesk.openDialog', {
			livechatLog: {
				step: 0,
				stepName: stepName[0],
			},
			zChat: 'endChat',
		});
		livechatLog(0);

		if (MKT_LIVE_CHAT.includes(_corpCd)) {
			$('#optServiceTypeZendesk').val('');
			dvCategory.hide();
			dvProduct.hide();
			dvCategory.val($('#dvCategoryZendesk option:first').val());
		}

		if (dept_name) {
			fnLayerPopupOpen(term, 'zendesk_term');
			let _targetOption = '#optProductZendesk option:contains("' + dept_name + '")';
			$(_targetOption).attr('selected', 'selected');
		} else {
			fnLayerPopupOpen(term, 'zendesk_term');
		}
		
		term.addClass('active');
	}

  function closeDialog(obj) {
        //GA360
        if(obj && obj.id === 'btnClsLayerPopup'){
            webChatHan.pushGA360(selectedProduct, 'zendesk', 'closeBtn', 'zendesk');
        }

		webChatHan.setMainDialog(null);

		fnLayerPopupCls(term, 'zendesk_term');
		term.removeClass('active');
	}

	function connect() {
		function _ajaxCallZendesk() {
			$.ajax({
				type: 'POST',
				url: `${contextRoot}/chatbot/v1/api/zendesk`,
				dataType: 'json',
				contentType: 'application/json; charset=utf-8',
				data: JSON.stringify({
					corpCd: _corpCd,
					locale: _locale,
					serviceType: optServiceType.val(),
					sessionId: _sessionId,
					platform: 'WEB',
				}),
				success: function (res) {
					webChatHan.pauseChat();

					if (res.zendesk_key && res.department) {
						if (['us', 'uk', 'de', 'il'].includes(_corpCd)) {
							zendeskKey = res.zendesk_key;

							if (MKT_LIVE_CHAT.includes(_corpCd)) {
								if ('CS' === optServiceType.val()) {
									zendeskDepartment = res.department;
								}

								$('#mktDefaultSuggestions').hide();
							}
						} else {
							zendeskKey = res.zendesk_key;
							zendeskDepartment = res.department;
						}
					}

					visitorPath = { title: 'User Chat Log', url: res.chat_log_url };
					if (_corpCd === 'us') {
						visitorInfo = {
							display_name: inpName.val().trim(),
							phone: inpPhone.val().replace(/\D/g, ''),
						};
					} else {
						visitorInfo = {
							display_name: inpName.val().trim(),
							email: inpEmail.val(),
							phone: inpPhone.val().replace(/\D/g, ''),
						};
					}

					_setZChatKey();

					webChatHan.resumeChat();
					return res;
				},
				complete: function (res) {
					livechatLog(1);

					logger('zendesk._ajaxCallZendesk', {
						visitorInfo,
						chat_log_url: res.responseJSON.chat_log_url,
						livechatLog: {
							step: 1,
							stepName: stepName[1],
						},
					});

					// 젠데스크 상담시 메시지입력창에 포커스 22-06
					webChatHan.focusChatbot('chatTextArea');
				},
			});
		}
		function getZendeskDepartment() {
			const $inpProductZendesk = $('#inpProductZendesk');
			const $optProductZendesk = $('#optProductZendesk');
			const $inpCategoryZendesk = $('#inpCategoryZendesk');
			const $optCategoryZendesk = $('#optCategoryZendesk');

			if (optServiceType.val() === 'MKT') {
				return $inpCategoryZendesk.val() || $optCategoryZendesk.val() || '';
			} else {
				return $inpProductZendesk.val() || $optProductZendesk.val() || '';
			}
		}

		_resetInputError();
		let valid = validate(true);

		if (valid) {
			connection = true;
			RATING_FLAG = true;

			zendeskDepartment = getZendeskDepartment();

			if (!zendeskDepartment) {
				return false;
			}

			_ajaxCallZendesk();
		}
		return valid;
	}

	function _updateConnection(status) {
		console.log('[connection_update]', status);
		if (status === 'connected') {
			isZendeskConnected = true;

			if (zendeskInitStep > 0) {
				progress.off();
			}

			if (isNotInit) {
				_cLogger.getIns().addLog('ZENDESK_INIT_START', {});
				isNotInit = false;

				//remove dummy Tags first
				zChat.removeTags(_init_remove_tags, function () {
					console.log('[removeTags]', _init_remove_tags);
				});

				// [rollback][LGEAI] Live Chat Agent 연결정보에 model 필드 추가
				if (MKT_LIVE_CHAT.includes(_corpCd) && 'MKT' === optServiceType.val()) {
					//addTagsWithModelCode(_tag_de_marketing);
					zChat.addTags(_tag_de_marketing, function () {
						console.log('[addTags]', _tag_de_marketing);
					});
				} else {
					//addTagsWithModelCode(_tag);
					zChat.addTags(_tag, function () {
						console.log('[addTags]', _tag);
					});
				}

				zChat.sendVisitorPath(_path, function () {
					console.log('[sendVisitorPath]', _path);
				});

				zendeskInitStep = 2;
				zChat.setVisitorDefaultDepartment(parseInt(zendeskDepartment), function (d) {
					console.log('[setVisitorDefaultDepartment]', d);
					zendeskInitStep = 3;
					zChat.setVisitorInfo(visitorInfo, function () {
						console.log('[setVisitorInfo]', visitorInfo);
						zendeskInitStep = 4;
						zChat.sendVisitorPath(visitorPath, function () {
							console.log('[sendVisitorPath]', visitorPath);
							zendeskInitStep = 5;
							zChat.sendChatMsg(FIRST_MESSAGE, function () {
								zendeskInitStep = 6;
								console.log('[sendChatMsg:firstMessage->trigger zendesk queue]');
								clearInterval(SESSION_CHECK);

								//send chatlog
								let chatLogData = webChatHan.chatLogMgr.getLog();
								let chatLogMsg = '';
								for (var i in chatLogData) {
									if (!chatLogData[i].startsWith('[System]')) {
										chatLogMsg += chatLogData[i];
									}
								}

								zChat.sendChatMsg(chatLogMsg, function () {
									console.log('[sendChatMsg:Chat History]');

									if (PRE_MESSAGE.includes(_corpCd)) {
										let messageTxt = $('#messageTxtZendesk').val().trim();
										if (messageTxt) {
											zChat.sendChatMsg(messageTxt, function () {
												console.log('[sendChatMsg:User Message]');
											});
										}
									}
								});

								/* // [rollback][LGEAI] Live Chat Agent 연결정보에 model 필드 추가
                                if (SEND_MODEL_CODE.includes(_corpCd)) {
                                    CURRENT_MODEL_CODE_MESSAGE = MODEL_CODE_MESSAGE + inpModelCode.val();
                                    zChat.sendChatMsg(CURRENT_MODEL_CODE_MESSAGE, function () {
                                        console.log('[sendChatMsg:Model Code]');
                                    });
                                }
                                
                                _cLogger.getIns().addLog('ZENDESK_INIT_DONE', {});

                                 */
							});
						});
					});
				});
			}

			if (isZChattingStarted && zendeskInitStep > 5) {
				_cLogger.getIns().addLog('ZENDESK_CONNECTED', {});
				if (reconnectJobTimer == null) {
					reconnectJobTimer = setTimeout(reconnectJob, 1000);
				}
			}
		} else if (status === 'connecting') {
			if (zendeskInitStep > 0) {
				progress.on();
			}

			isZendeskConnected = false;
			if (isZChattingStarted) {
				webChatHan.pauseChat();
				_cLogger.getIns().addLog('ZENDESK_CONNECTING', {});
				disconnCount++;
				isShowDisconnected = true;
			}
		}
	}

	function reOpenDialogPopup() {
		term.addClass('active');
		term.parent().show();
	}

	var reconnectJobTimer = null;
	function reconnectJob() {
		if (isZChattingStarted) {
			console.log('reconnectJob ...');
			reconnectJobTimer = null;

			if (isZChattingAgent) {
				let _ainfo = zChat.getServingAgentsInfo();
				console.log('getServingAgentsInfo : ' + _ainfo);

				if (_ainfo.length === 0) {
					waitAndExit();
					return;
				} else {
					zChat.sendChatMsg(localeMsg.zchat.networkConnectedAgent);

					if (disconnCount === 1) {
						zChat.addTags(_tag_disconnect_once, function () {
							console.log('[addTags:disConnectOnce]', _tag_disconnect_once);
						});
					} else if (disconnCount === 2) {
						zChat.addTags(_tag_disconnect_more, function () {
							console.log('[addTags:disConnectMore]', _tag_disconnect_more);
						});
					}
				}
			}

			if (isShowDisconnected) {
				isShowDisconnected = false;
			}

			webChatHan.resumeChat();
		} else {
			console.log('reconnectJob cancel ...');
		}
	}

	let waitingQPos = false;
	function resetWaitingQPos() {
		waitingQPos = false;
	}

	function chat(event_data) {
		if (!connection) {
			return;
		}

		webChatHan.hideAnim();
		console.log('[event_data]', event_data);

		let isOldMessage = false;
		let isDuplMessage = false;
		if (event_data.timestamp) {
			if (ztimestamps.has(event_data.timestamp)) {
				isDuplMessage = true;
			} else {
				ztimestamps.add(event_data.timestamp);
			}

			if (lastTimestamp === 0) {
				lastTimestamp = event_data.timestamp;
			} else {
				if (lastTimestamp > event_data.timestamp) {
					isOldMessage = true;
				} else {
					lastTimestamp = event_data.timestamp;
				}
			}
		}

		//중복, 이전 메시지 처리 안함 + 메시지는 상세처리
		if ((isDuplMessage || isOldMessage) && event_data['type'] !== 'chat.msg') {
			if (isDuplMessage) {
				console.log('[dupl event]', event_data);
			}
			if (isOldMessage) {
				console.log('[old event]', event_data);
			}
			return;
		}

		if (event_data['type'] === 'chat.msg') {
			if (_wating_agenttrigger && event_data['nick'] === 'agent:trigger') {
				resetEndChatByAgenttrigger();
			}

			if (!isZendeskConnected) {
				return;
			}

			//메시지는 자동 메시지만 제거
			if (event_data['msg'] === localeMsg.zchat.networkConnectedAgent || event_data['msg'] === FIRST_MESSAGE) {
				return;
			}

			if (event_data['nick'] === 'visitor') {
				// [rollback][LGEAI] Live Chat Agent 연결정보에 model 필드 추가
				if (localeMsg.zchat.networkConnectedAgent !== event_data['msg'] && FIRST_MESSAGE !== event_data['msg']) {
					webChatHan.userMessage(event_data['msg']);
				}
			} else {
				let msg = [{ textToSpeech: event_data['msg'] }];
				webChatHan.zendeskResponse({ msg });
				if (isZChattingAgent) {
					setSurveyFlagByChat(2);
				}
				_preventChatAnimation();

				//chat log agent
				webChatHan.chatLogMgr.addLog('Agent:' + event_data['display_name'], event_data['msg'], webChatHan.chatTime());
			}
		} else if (event_data['type'] === 'chat.memberjoin') {
			if (event_data['nick'] === 'visitor') {
				_cLogger.getIns().addLog('ZENDESK_ENTER_VISITOR', {});
				if (!isZChattingStarted) {
					if (_corpCd === 'us') {
						webChatHan.autoCompleteMgr.clear();
					}

					isZChattingStarted = true;
					webChatHan.chatAlert(localeMsg.zchat.connectAgent);

					// 라이브챗 상담시 파일전송 기능 추가 22-07
					zendesk.getInputFile();
				} else {
					if (!isZChattingAgent) {
						return;
					}

					let _ainfo = zChat.getServingAgentsInfo();
					let _qPos = zChat.getQueuePosition();

					if (_ainfo.length === 0 || _qPos > 0) {
						waitAndExit();
					} else {
						waitingQPos = true;
						setTimeout(resetWaitingQPos, 2000);
						console.log('Still connect with Agent ...');
					}
				}
			} else {
				isZChattingAgent = true;

				_cLogger.getIns().addLog('ZENDESK_ENTER_AGENT', { agentName: event_data['display_name'] });
				_agent_counter.clear();
				_agent_counter.add(event_data['display_name']);
				console.log('agent count : ' + _agent_counter.size);

				if (_wating_agenttrigger) {
					resetEndChatByAgenttrigger();
				}

				if (_wating_memberjoin) {
					_wating_memberjoin = false;
				}

				livechatLog(2);
				let aName = event_data['display_name'];
				logger('zendesk.chat.memberjoin', {
					agent: {
						nick: event_data.nick,
						display_name: aName,
					},
					livechatLog: {
						step: 2,
						stepName: stepName[2],
					},
				});
				let textToSpeech = localeMsg.zchat.welcomeAgent.replaceAll('{0}', aName);
				webChatHan.zendeskResponse({ msg: [{ textToSpeech }] });

				//chat log agent join
				webChatHan.chatLogMgr.addLog('System', textToSpeech, webChatHan.chatTime());
			}
		} else if (event_data['type'] === 'chat.queue_position') {
			let queue = parseInt(event_data['queue_position']);

			if (waitingQPos && queue > 0) {
				waitAndExit();
			}

			if (queue === 1) {
				let msg = [{ textToSpeech: localeMsg.zchat.lastWaiting }];
				webChatHan.zendeskResponse({ msg });

				//chat log lastWaiting
				webChatHan.chatLogMgr.addLog('System', '' + localeMsg.zchat.lastWaiting, webChatHan.chatTime());
			} else if (queue > 1) {
				let msg = [{ textToSpeech: localeMsg.zchat.howManyWaiting.replaceAll('{0}', (queue - 1).toString()) }];
				webChatHan.zendeskResponse({ msg });

				//chat log queue
				webChatHan.chatLogMgr.addLog('System', '' + localeMsg.zchat.howManyWaiting.replaceAll('{0}', (queue - 1).toString()), webChatHan.chatTime());

				if (_corpCd === 'us' && !QUEUE_LIMIT_MSG && queue > QUEUE_LIMIT) {
					QUEUE_LIMIT_MSG = true;
					webChatHan.zendeskResponse({
						msg: [
							{
								textToSpeech:
									'You have to wait for the chat consultation with the customer who came first. Please wait a little longer. Or would you like to have an e-mail consultation?',
								linkOutSuggestion: {
									destinationName: 'E-Mail Link',
									url: 'https://www.lg.com/us/support/email-appointment',
								},
							},
						],
					});
				}
			}
		} else if (event_data['type'] === 'typing' && event_data['typing'] && !isPreventedTypingAnimated) {
			// 젠데스크 상담시 아이콘 제거
			webChatHan.anim('zendesk');
		} else if (event_data['type'] === 'chat.memberleave') {
			if (event_data['nick'] !== 'visitor') {
				_agent_counter.delete(event_data['display_name']);
				console.log('agent count : ' + _agent_counter.size);
			}

			if (!isZendeskConnected) {
				return;
			}

			if (event_data['nick'] !== 'visitor' && _agent_counter.size < 1) {
				console.log('채팅방에 머문 상담원이 0 이므로 2초 뒤 채팅 종료함 ...');
				_ENDCHAT_TIMEOUT = setTimeout(endChatByMemberLeave, 2000);
				_wating_memberjoin = true;
				_wating_agenttrigger = true;
			}
		} else if (event_data['type'] === 'chat.request.rating' && RATING_FLAG && isZendeskConnected && shouldRateAgent()) {
			RATING_FLAG = false;
			RATING_BY_AGENT = true;
			fnLayerPopupOpen({ click: true }, 'zendesk');
		} else if (event_data['type'] === 'chat.file') {
			if (!isZendeskConnected) {
				return;
			}

			if (event_data['nick'] === 'visitor') {
				webChatHan.fileUserMessage({
					title: event_data['attachment']['name'],
					formattedText: '',
					url: event_data['attachment']['url'],
				});
			} else {
				_preventChatAnimation();
				/**
				 * Zendesk 서버에서 상담원이 파일을 첨부하면 반응하는 이벤트
				 *
				 * 샘플 파일 이벤트
				 * {
				 *   attachment: {mime_type: "image/jpeg", name: "Unknown.jpeg", size: 6569, url: "https://sample.com/?name=Unknown.jpeg"},
				 *   display_name: "User",
				 *   nick: "agent:123456789000",
				 *   timestamp: 1657257120323,
				 *   type: "chat.file"
				 * }
				 */
				let data = { ...event_data };
				const fileUrl = data.attachment.url;
				const fileName = data.attachment.name;
				webChatHan.fileMessage({
					title: fileName,
					formattedText: '',
					url: fileUrl,
				});
			}
		}
		webChatHan.autoScroll(webChatHan.NO_USER_SAY_RESPONSE);
	}

	function waitAndExit() {
		console.log('No Agent found ...');
		isZChattingStarted = false;
		isZChattingAgent = false;
		zChat.un('connection_update');
		zChat.un('chat');

		let msg = [{ textToSpeech: localeMsg.zchat.agentChatEnded }];
		webChatHan.zendeskResponse({ msg });
		webChatHan.autoScroll(webChatHan.NO_USER_SAY_RESPONSE);
		endChatByMemberLeave();
	}

	function getWatingMemberjoin() {
		return _wating_memberjoin;
	}

	function getWatingAgenttrigger() {
		return _wating_agenttrigger;
	}

	function resetEndChatByAgenttrigger() {
		//상담원 교체들어옴
		clearTimeout(_ENDCHAT_TIMEOUT);
		_wating_agenttrigger = false;
	}

	function _preventChatAnimation() {
		isPreventedTypingAnimated = true;
		setTimeout(function () {
			isPreventedTypingAnimated = false;
		}, 300);
	}

	function endChatByMemberLeave() {
		console.log('endChatByMemberLeave ...');
		_cLogger.getIns().addLog('ZENDESK_ENDCHAT', {});
		_cLogger.getIns().uploadLog();

		isZChattingStarted = false;
		isZChattingAgent = false;

		endChat();
		logger('zendesk.chat.memberleave', {
			livechatLog: {
				step: 3,
				stepName: stepName[3],
			},
			zChat: 'endChat',
		});
		// 상담사 채팅 후 챗봇 종료처리 22-05
		reconnectChatbot('memberleave');
		webChatHan.autoScroll(webChatHan.NO_USER_SAY_RESPONSE);
	}

	function sendChatMsg(text) {
		zChat.sendChatMsg(text);

		// 젠데스크 상담시 메시지입력창에 포커스 22-06
		webChatHan.focusChatbot('chatTextArea');
	}

	function shouldRateAgent() {
		console.log('shouldRateAgent ...');
		if (!RATING_FLAG) {
			console.log('already done ...');
			return false;
		}

		console.log('chatting check for survey :' + _surveychat_counter.size);
		return _surveychat_counter.size > 1;
	}

	function disconnect() {
		connection = false;
		if (shouldRateAgent()) {
			RATING_FLAG = false;
			fnLayerPopupOpen({ click: true }, 'zendesk');
		} else {
			$.when(endChat()).then(() => {
				showChatEndMsgAndUI();
			});
		}
	}

	// validation 체크 alert -> error msg 변경 22-06
	function _checkLength(o, min, max, n) {
		let $errMsgBox = o.siblings('.errMsgBox');

		if (o.val().trim().length > max || o.val().trim().length < min) {
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

	// validation 체크 alert -> error msg 변경 22-06
	function _checkPhone(o, min, max, n) {
		let $errMsgBox = o.siblings('.errMsgBox');

		let len = o.val().replace(/\D/g, '').length;
		if (len > max || len < min) {
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

	// validation 체크 alert -> error msg 변경 22-06
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

	// validation 체크 alert -> error msg 변경 22-06
	function _checkSelect(o, n) {
		let $errMsgBox = o.siblings('.errMsgBox');

		if (!o.val()) {
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

	// validation 체크 alert -> error msg 변경 22-06
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

	function _checkModelCode(o, n) {
		function _ajaxCheckModelCode(modelStr) {
			return _modelList.some((e) => e.modelCode === modelStr);
		}

		let valid = (o.val() || '').trim();
		valid = valid && _ajaxCheckModelCode(inpModelCode.val().trim());
		let $errMsgBox = o.siblings('.errMsgBox');

		if (!valid) {
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

	function validate(isAlerting) {
		let valid = true;
		valid = valid && _checkLength(inpName, MIN_NAME_LENGTH, MAX_NAME_LENGTH, isAlerting ? nameValidMsg : null);
		if (_corpCd !== 'us') {
			valid = valid && _checkRegexp(inpEmail, EMAIL_REGEX, isAlerting ? validateMsg.email : null);
		}
		if (_corpCd === 'il') {
			MIN_PHONE_LENGTH = 10;
			MAX_PHONE_LENGTH = 10;
			// +91 국가번호때문에 Validation 길이 2 추가
			MIN_PHONE_LENGTH += 2;
			MAX_PHONE_LENGTH += 2;
		} else if (_corpCd === 'de') {
			MIN_PHONE_LENGTH = 8;
			MAX_PHONE_LENGTH = 20;
		}
		else if (_corpCd == 'id') {
			MIN_PHONE_LENGTH = 10;
			MAX_PHONE_LENGTH = 11;
		}
		if(inpPhone.css('display') != 'none') {
			valid = valid && _checkPhone(inpPhone, MIN_PHONE_LENGTH, MAX_PHONE_LENGTH, isAlerting ? phoneValidMsg : null);
		}
		if (_corpCd === 'us' || _corpCd === 'uk') {
			valid = valid && _checkSelect(optProduct, isAlerting ? validateMsg.product : null);
		}
		if (MKT_LIVE_CHAT.includes(_corpCd)) {
			valid = valid && _checkSelect(optServiceType, isAlerting ? validateMsg.serviceType : null);
			if(optServiceType.val() == 'MKT') {
				valid = valid && _checkSelect(optCategoryZendesk, isAlerting ? validateMsg.product : null);
			}else{
				valid = valid && _checkSelect(optProduct, isAlerting ? validateMsg.product : null);
			}
		}
		/* // [rollback][LGEAI] Live Chat Agent 연결정보에 model 필드 추가
        if (inpModelCode?.length > 0) {
            valid = valid && _checkModelCode(inpModelCode, isAlerting ? validateMsg.modelCode : null);
        }

         */
		valid = valid && _checkTermsAndConditions(inpTerm, isAlerting ? validateMsg.termsAndConditions : null);
		return valid;
	}

	// 챗봇종료 버튼 클릭시 QOS 레이어 팝업 (zendesk)
	// 멕시코 - 만족도조사 별점 UI 변경 22-11
	function getPopupQOS(obj) {
		let html = '';

		html += '<div id="layerPopupWrap">';
		html += '    <div class="layerPopup qosPopup">';
		html += '        <div class="top">';
		html += '            <h1>';
		html += `${qosMsg.titleZendesk}`;
		html += '            </h1>';
		html += `            <button id="btnClsLayerPopup" value="qos" type="button" onclick="zendesk.closePopup(${obj.click})">Close layer Popup</button>`;
		html += '        </div>';
		html += '        <div class="cont">';

		// 만족도 별점 선택 박스
		// QOS팝업 별점 default 값 수정 (zendesk)
		html += '            <div class="qosBox contBox">';
		html += '                <h2>';
		html += `${qosMsg.question1Zendesk}`;
		html += '                </h2>';
		html += '                <div class="btnQosWrap">';
		html += '                    <button id="btnQos1"';
		html += '                       class="btnQos zendesk"';
		html += '                       value="1" onclick="onclickBtnQos(this);">';
		html += `${qosMsg.btnQos1}`;
		html += '                    </button>';
		html += '                    <button id="btnQos2"';
		html += '                       class="btnQos zendesk"';
		html += '                       value="2" onclick="onclickBtnQos(this);">';
		html += `${qosMsg.btnQos2}`;
		html += '                    </button>';
		html += '                    <button id="btnQos3"';
		html += '                       class="btnQos zendesk"';
		html += '                       value="3" onclick="onclickBtnQos(this);">';
		html += `${qosMsg.btnQos3}`;
		html += '                    </button>';
		html += '                    <button id="btnQos4"';
		html += '                       class="btnQos zendesk"';
		html += '                       value="4" onclick="onclickBtnQos(this);">';
		html += `${qosMsg.btnQos4}`;
		html += '                    </button>';
		html += '                    <button id="btnQos5"';
		html += '                       class="btnQos zendesk"';
		html += '                       value="5" onclick="onclickBtnQos(this);">';
		html += `${qosMsg.btnQos5}`;
		html += '                    </button>';
		html += '                </div>';
		if (_corpCd == 'jp') {
			html += `            <span id="btnQosTxt1" class="btnQosTxt" value="">${qosMsg.btnQos1}</span>`;
			html += `            <span id="btnQosTxt5" class="btnQosTxt" value="">${qosMsg.btnQos5}</span>`;
		}
		html += '            </div>';

		// 만족여부 라디오 버튼 선택 박스
		if (_corpCd == 'jp') {
			const isYesFirstResolved = true;
			const _answer1 = qosMsg.answer1;
			const _answer2 = qosMsg.answer2;
			html += '            <div class="resolveBox contBox btnListBox">';
			html += '                <h2>';
			html += `${qosMsg.question2}`;
			html += '                </h2>';
			html += '                <ul class="btnListUl">';
			html += '                    <li>';
			html += `                        <button type="button" class="zendesk" name="btn" value="${isYesFirstResolved ? 'YES' : 'NO'}" onclick="onclickQosRadio(this)">${
				isYesFirstResolved ? _answer2 : _answer1
			}</button>`;
			html += '                    </li>';
			html += '                    <li>';
			html += `                        <button type="button" class="zendesk" name="btn" value="${isYesFirstResolved ? 'NO' : 'YES'}" onclick="onclickQosRadio(this)">${
				isYesFirstResolved ? _answer1 : _answer2
			}</button>`;
			html += '                    </li>';
			html += '                </ul>';
			html += '            </div>';
		} else {
			html += '            <div class="resolveBox contBox">';
			html += '                <h2>';
			html += `${qosMsg.question2Zendesk ?? ''}`;
			html += '                </h2>';
			html += '                <ul class="resolveRadioUl">';
			html += '                    <li>';
			html += '                        <label for="qosRadio1" class="zendesk" onclick="onclickQosRadio(this);"><input type="radio" name="csSatisfaction" id="qosRadio1" value="unsolved">';
			html += `${qosMsg.answer1}`;
			html += '                        </label>';
			html += '                    </li>';
			if (_corpCd === 'us') {
				html += '                    <li class="zendesk checked">';
				html +=
					'                        <label for="qosRadio2" class="zendesk" onclick="onclickQosRadio(this);"><input type="radio" name="csSatisfaction" id="qosRadio2" value="solved" checked>';
			} else {
				html += '                    <li class="zendesk">';
				html += '                        <label for="qosRadio2" class="zendesk" onclick="onclickQosRadio(this);"><input type="radio" name="csSatisfaction" id="qosRadio2" value="solved">';
			}
			html += `${qosMsg.answer2}`;
			html += '                        </label>';
			html += '                    </li>';
			html += '                </ul>';
			html += '            </div>';
		}

		// 사용자 의견 입력 텍트스 박스 (필수값 X)
		html += '            <div class="opinionBox contBox">';
		html += '                <h2>';
		html += `${qosMsg.question3Zendesk ?? qosMsg.question3}`;
		html += '                </h2>';
		html += '                <div id="surveyTxtWrap">';
		html += `                    <textarea id="surveyTxt" rows="3" placeholder="${qosMsg.placeholder}"></textarea>`;
		html += '                    <div class="remaining">';
		html += '                       <span class="count">0</span>/<span class="maxcount">4000</span>byte';
		html += '                   </div>';
		html += '                </div>';
		html += '            </div>';

		// QOS팝업 별점 default 값 수정 (zendesk) - 오류메시지 노출
		html += '            <div class="errMsgBox" value="error">';
		// html += `${resource[_locale].showMsg.qosMsg.errMsg}`;
		html += '            </div>';

		// cancel(창닫기 동일), submit 버튼
		html += '            <div class="btnListBox btnQosEnd">';
		html += '                <ul class="btnListUl">';
		if (_corpCd == 'jp') {
			html += '                    <li style="width: calc(100% - 64px); margin-left: 32px">';
			html += `                        <button id="qosSubmit" class="btn-submit" type="button" name="btn" data-name="zQos" onclick="zendesk.submitSurvey(this, ${obj.click});">`;
			html += `${qosMsg.submit}`;
			html += '                        </button>';
			html += '                    </li>';
		} else {
			html += '                    <li><!-- 팝업창 닫기 버튼 -->';
			html += `                      <button id="qosClose" type="button" name="btn" onclick="zendesk.closePopup(${obj.click})">`;
			html += `${qosMsg.cancel}`;
			html += '                      </button>';
			html += '                    </li>';
			html += '                    <li>';
			html += `                        <button id="qosSubmit" class="btn-submit" type="button" name="btn" data-name="zQos" onclick="zendesk.submitSurvey(this, ${obj.click});">`;
			html += `${qosMsg.submit}`;
			html += '                        </button>';
			html += '                    </li>';
		}
		html += '                </ul>';
		html += '            </div>';

		html += '        </div>'; // cont
		html += '    </div>'; // layerPopup
		html += '</div>'; // layerPopupWrap

		$('#layerPopupContainer').append(html);
		setTimeout(() => {
			fnsurveyTxtCnt();
		}, 100);
	}
	function closePopup(click) {
		if (click) {
			_closePopupEndWindow();
		} else {
			_closePopupReconnect();
		}
	}
	function _closePopupReconnect() {
		console.log('_closePopupReconnect ...');
		if (!connection) {
			console.log('connection == false => endChat ');
			endChat();
			logger('zendesk._closePopupReconnect', {
				livechatLog: {
					step: 3,
					stepName: stepName[3],
				},
				zChat: 'endChat',
			});
			reconnectChatbot('closePopup'); // 상담사 채팅 후 챗봇 종료처리 22-05
		}
		fnLayerPopupCls();
	}
	function _closePopupEndWindow() {
		console.log('_closePopupEndWindow ...');
		endChat();
		logger('zendesk._closePopupEndWindow', {
			livechatLog: {
				step: 3,
				stepName: stepName[3],
			},
			zChat: 'endChat',
		});
		webChatHan.chatAlert(localeMsg.zchat.disconnectAgent);
		fnLayerPopupCls();
		showChatEndMsgAndUI();
		fnChatbotCls();
	}
	function endChat() {
		progress.off(); //progress off when chat end
		console.log('endChat ...');
		webChatHan.hideAnim();
		_resetConfigurations();
		livechatLog(3);
		zChat.endChat();
	}
	// 상담사 채팅 후 챗봇 종료처리 22-05
	function reconnectChatbot(param) {
		webChatHan.chatAlert(localeMsg.zchat.disconnectAgent); // Conversation has ended
		if (param === 'memberleave') {
			fnLayerPopupCls();
			showChatEndMsgAndUI();
		} else if (param === 'closePopup') {
			fnLayerPopupCls();
			showChatEndMsgAndUI();
			fnChatbotCls();
		} else {
			reconnectWelcome();
		}
	}

	function showChatEndMsgAndUI() {
		if (_corpCd === 'us') {
			showChatEndBar();
		} else {
			fnChatbotSpeech('zchatEnd', resource[_locale].showMsg.chatbotMsg.zchatEnd);
			webChatHan.endChat();
		}
	}

	function submitSurvey(obj, click) {
		// 사용자 입력정보 validation 체크
		if (!fnValidationChk(obj)) {
			return false;
		}
		if (PREVENT_CLICK) {
			return;
		}

		PREVENT_CLICK = true;
		// 멕시코 - 만족도조사 별점 UI 변경 22-11
		function sendSurveyZendesk() {
			return new Promise(function (resolve, reject) {
				const $layerPopupWrap = $('#layerPopupWrap');
				const prefix = 'chatrating_';
				const rate = gSurvey.zChat.rate;
				const solve = gSurvey.zChat.solve;
				const goodBad = gSurvey.zChat.goodBad;
				const ratingBy = RATING_BY_AGENT ? _tag_chatrating_agent : _tag_chatrating_customer;
				const tags = [rate, solve, goodBad, ratingBy].map((el) => prefix + el);
				gSurvey.zChat.survey = $('#surveyTxt', $layerPopupWrap).val().trim();

				try {
					zChat.sendChatRating(goodBad, function () {
						zChat.addTags(tags, function () {
							zChat.sendChatComment(gSurvey.zChat.survey, function () {
								resolve();
							});
						});
					});
					console.log('[Zendesk QOS Survey]', gSurvey.zChat);
				} catch (error) {
					console.log(error);
					reject(error);
				}
			});
		}
		sendSurveyZendesk()
			.then(() => {
				closePopup(click);
			})
			.then(() => {
				PREVENT_CLICK = false;
			});
	}

	// 라이브챗 상담시 파일전송 기능 추가 22-07 (파일첨부시 엘리먼트 정의)
	function getInputFile() {
		let html = '';

		html += '<form id="formUploadFile" name="formUploadFile" method="POST" action="#" enctype="multipart/form-data">';
		html += '   <input id="inputFile" type="file" />';
		html += '   <button id="btnUploadFile" type="button" onclick="zendesk.onclickBtnUploadFile();">' + localeMsg.btn.upload + '</button>';
		html += '   <div id="inputFileInner">';
		html += '       <div id="uploadFileBox">';
		html += '           <p id="uploadFileName">' + localeMsg.gsfs.repair.fileHolder + '</p>';
		html += '           <span id="uploadFileSize"></span>';
		html += '       </div>';
		html += '       <button id="btnDeleteFile" type="button" onclick="zendesk.fnInitFile();">Delete file</button>';
		html += '   </div>';
		html += '</form>';

		$('#fileContainer').append(html);

		// 홈버튼 제거를 위한 클래스명 추가
		$('.chat-input-element').addClass('zendesk');
	}

	// 라이브챗 상담시 파일전송 기능 추가 22-07 (파일첨부 버튼 클릭)
	function onclickBtnUploadFile() {
		$('#inputFile').trigger('click');
		// [미국법인] 음성인식 Web speech (Speech recognition) STT API 23-07
		if (['us'].includes(_corpCd) && gProfile.device_type === 'mobile') {
			$('#btnMicWebSpeech').addClass('disabled').prop('disabled', true);
		}
	}

	// 라이브챗 상담시 파일전송 기능 추가 22-07 (젠데스크 상담 끝났을때, 대화재시작시 복원)
	function removeInputFile() {
		$('#formUploadFile').remove();
		$('.chat-input-element').removeClass('zendesk');
		// [미국법인] 음성인식 Web speech (Speech recognition) STT API 23-07
		if (['us'].includes(_corpCd) && gProfile.device_type === 'mobile') {
			$('#btnMicWebSpeech').removeClass('disabled').prop('disabled', false);
		}
	}

	// 라이브챗 상담시 파일전송 기능 추가 22-07 (파일확장자, 크기 오류시 레이어팝업 오픈)
	function getFileAlert(fileChk) {
		let html = '';

		html += '<div id="layerPopupWrap">';
		html += '    <div class="layerPopup fileAlertPopup">';
		html += '        <div class="top">';
		html += '           <h1>' + validateMsg.fileFailedTitle + '</h1>';
		html += '        </div>';
		html += '        <div class="cont">';
		html += '            <div class="contBox">';
		html += '                <h2>' + fileChk + '</h2>';
		html += '            </div>';
		html += '            <div class="btnListBox">';
		html += '                <ul class="btnListUl">';
		html += '                    <li>';
		html += '                      <button id="fileAlertClose" type="button" onclick="fnLayerPopupCls();">' + localeMsg.btn.confirm + '</button>';
		html += '                    </li>';
		html += '                </ul>';
		html += '            </div>';
		html += '        </div>'; // cont
		html += '    </div>'; // layerPopup
		html += '</div>'; // layerPopupWrap

		$('#layerPopupContainer').append(html);
	}

	// 라이브챗 상담시 파일전송 기능 추가 22-07 (파일 input 초기화)
	function fnInitFile() {
		let text = $('#chatTextArea').val().trim();

		$('#inputFile').val('');
		$('#uploadFileName').text('');
		$('#uploadFileSize').html('');
		$('#inputFileInner').hide();
		$('#chatMessage').removeClass('zendesk');
		if (text === '') {
			$('#btnSend').removeClass('on').attr('disabled', true);
		}
		// 메시지입력창에 포커스
		webChatHan.focusChatbot('chatTextArea');
		// [미국법인] 음성인식 Web speech (Speech recognition) STT API 23-07
		if (['us'].includes(_corpCd) && gProfile.device_type === 'mobile') {
			$('#btnMicWebSpeech').removeClass('disabled').prop('disabled', false);
		}
	}
	// 라이브챗 상담시 파일전송 기능 추가 22-07 (input file 노출 여부 반환)
	function inputFileActive() {
		return $('#chatMessage').hasClass('zendesk');
	}
	/**
	 * 상담원에게 파일 전송 하는 기능.
	 * @param {File} file default 로 전송 가능한 {@link _allowed_extensions} 확장자(pdf, png, jpeg, gif, txt) 추가 확장자가 필요하면 zendesk 설정이 필요함.
	 */
	function sendFile(file) {
		webChatHan.userAnim();
		zendesk.fnInitFile();

		return new Promise((resolve) => {
			zChat.sendFile(file, function (err, data) {
				if (!err) {
					webChatHan.fileUserMessage({ title: data.name, formattedText: '', url: data.url });

					resolve('done');
				} else {
					fnLayerPopupOpen(err, 'sendFileErr');
					console.log(err);
					resolve('done');
				}
			});
		});
	}

	function setSurveyFlagByChat(userType) {
		_surveychat_counter.add(userType);
	}

	return {
		chat, // [TEST by msk] 상담사 채팅 후 챗봇 종료처리 22-05  zendesk.chat({'type':'chat.memberleave'})
		init,
		openDialog,
		closeDialog,
		connect,
		validate,
		isConnectAgent,
		getPopupQOS,
		submitSurvey,
		disconnect,
		closePopup,
		DUMMY_URL,
		sendChatMsg,
		getWatingAgenttrigger,
		getWatingMemberjoin,
		sendFile,
		getInputFile,
		removeInputFile,
		inputFileActive,
		fnInitFile,
		getFileAlert,
		onclickBtnUploadFile,
		shouldRateAgent,
		setSurveyFlagByChat,
		reOpenDialogPopup,
	};
})();

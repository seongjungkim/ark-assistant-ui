let resource = {
    en_US: {
        step: 'STEP {0}', // GSFS 팝업창 단계를 나타내는 문구(ex. STEP 1, STEP 2, ..)
        termsAndConditions:
            'By Checking this box and clicking "Connect", I acknowledge that I have read the <a href="javascript:openWinUrl(\'https://www.lg.com/us/privacy\')">Privacy Policy</a> and that I agree to their terms.', // 약관 동의가 필요할 때 쓰이는 문구
        termMobile:
            'I would like to receive repair service notification with an SMS message to my mobile phone. Message and data rates may apply depending upon your mobile service plan.',
        termEmail: 'I would like to receive repair service notification at my email address. Message and data rates may apply depending upon your service plan.',
        selectHolder: '── select ──', // select 을 하는 입력창의 placeholder 문구
        label: {
            email: 'Email', // email 입력 창 라벨
            name: 'Name', // name 입력 창 라벨
            firstName: 'First Name', // first name 입력 창 라벨
            lastName: 'Last Name', // last name 입력 창 라벨
            mobile: 'Mobile', // mobile 입력 창 라벨
            phone: 'Phone', // phone 입력 창 라벨
            zipcode: 'Zip Code', // zipcode 입력 창 라벨
            product: 'Product', // product 입력 창 라벨
            subProduct: 'Sub Product', // subProduct 입력 창 라벨
            receipt: 'Receipt Number', // receipt 입력 창 라벨
            symptom: 'Symptom', // symptom 입력 창 라벨
            subSymptom: 'Sub Symptom', // subSymptom 입력 창 라벨
            address: 'Address', // address 입력 창 라벨
            city: 'City', // city 입력 창 라벨
            state: 'State', // state 입력 창 라벨
            country: 'Country', // country 입력 창 라벨
            modelCode: 'Model Number',
        },
        btn: {
            cancel: 'Cancel', // 취소 버튼
            connect: 'Connect', // 상담원 연결 버튼
            confirm: 'Confirm', // 확인 버튼
            next: 'Next', // 다음 스텝으로 넘어가는 버튼
            prev: 'Prev', // 이전 스텝으로 돌아가는 버튼
            browse: 'Browse', // 파일 업로드를 위한 탐색 버튼
            upload: 'Upload',
            skip: 'Skip',
            findServiceCenter: 'service center location',
            liveChatAgent: 'live chat agent',
        },
        validate: {
            email: 'Please enter a valid email address', // 올바른 양식의 이메일을 입력해주세요.
            name: 'Your name must be between {0} and {1} characters', // 이름은 최소 {0} 자리에서 최대 {1}로 입력하셔야 합니다.
            chatArea: 'Input Chat length must be between {0} and {1} characters', // 이름은 최소 {0} 자리에서 최대 {1}로 입력하셔야 합니다.
            phoneZendesk: 'Your phone number cannot exceed 10 digits', // 전화번호는 10자리입니다.
            phoneGsfs: 'The phone number needs to be of 10 digit only.', // 전화번호를 입력해주세요.
            mobile: 'The mobile number needs to be of 10 digit only.', // 전화번호를 입력해주세요.
            termsAndConditions: 'Please accept all terms and conditions', // 약관에 동의하셔야 합니다.
            termsMobileOPTIN: 'Please check the mobile opt-in button.',
            termsEmailOPTIN: 'Please check agree to receive emails button.',
            zipcode: 'Please enter a valid pin code', // 올바른 PINCODE를 입력해주세요.
            product: 'Please select product', // 제품을 선택해주세요.
            subProduct: 'Please select sub product', // 제품 세부 카테고리를 선택해주세요.
            receipt: 'Please enter a valid receipt number', // 올바른 수리번호를 입력해주세요.
            symptom: 'Please select symptom', // 제품 증상을 선택해주세요.
            subSymptom: 'Please select sub symptom', // 제품 세부 증상을 선택해주세요.
            purchaseDate: 'Please select your product purchase date', // 제품 구매일을 선택하세요.
            address: 'Please enter your address', // 출장 수리를 받을 주소를 입력해주세요.
            city: 'Please enter your city', // 도시를 입력해주세요.
            state: 'Please enter your state', // 주를 입력해주세요.
            country: 'Please enter your country', // 나라를 입력해주세요.
            repairDate: 'Please select repair date', // 출장 수리를 받으실 날짜를 선택해주세요.
            repairDateTime: 'Please select repair time', // 출장 수리를 받으실 시간을 선택해주세요.
            serviceType: 'Please select service type', // 출장 수리를 받으실 시간을 선택해주세요.
            uploadFile: 'Please upload file', // 업로드할 파일이 없습니다.
            modelCode: 'Please enter your model code',
            modelCodeSelected: 'Please select model number on the list',
            // 라이브챗 상담시 파일전송 기능 추가
            fileFailedTitle: 'Upload failed',
            fileExtension: 'The file type that you selected is not supported. Please use a compatible file type.',
            fileSize: 'The file size exceeds the maximum allowed limit of 20MB.',
            fileCommonErr: 'File upload failed due to a system error.<br />Please try again.',
        },
        zchat: {
            connectAgent: 'The live agent has joined this conversation', // 상담원과 연결합니다.
            disconnectAgent: 'Conversation has ended', // 상담이 끝났습니다.
            lastWaiting: 'The live agent will connect you soon. Please stay connected with us', // 잠시만 기다려주세요 곧 상담원과 연결됩니다.
            howManyWaiting: '{0} users waiting...', // {0} 명 대기중...
            welcomeAgent: '{0} joined the conversation', // 상담원 {0}이 연결되었습니다.
            tips: 'You must fill out all required fields', // 모든 항목을 채워주세요.
            networkConnecting: `Network connection was lost - reconnecting\nIf issue persists, check your network connection`, // 재연결 중입니다.
            networkConnectedAgent: 'The customer has been reconnected', // 다시 연결 되었습니다. 상담원용
            networkConnectedCustomer: 'Network connection has been reconnected', // 다시 연결 되었습니다. 고객용
            agentChatEnded: 'The live agent connection has been terminated', //상담원 연결이 종료되었습니다.
            failConnectZendesk: 'Fail to connect agent.', //상담 연결중 통신 실패
        },
        gsfs: {
            message: {
                notAvailable: 'It will be updated soon.',
            },
            center: {
                title: 'Service Center Locator', // 서비스 센터 찾기
                resultMsg: 'Visit your nearest LG repair service Center', // 센터 찾기 메시지
                errorMsg: 'Center not found.', // 센터 찾기 에러 메시지
            },
            track: {
                title: 'Track Repair', // 수리 내역 조회
                resultMsg1: "LG's tracking system to check the status of your repair",
                resultMsg2: `Here is your LG repair status.
                    
                    {CUSTOMER_NAME}
                    Case Number: {SERVICE_REPAIR_NO}
                    
                    <strong><u>Repair Information:</u></strong>
                    
                    {STATUS_DESCRIPTION}
                    {REASON}
                    
                    Appointment Date: {PROMISE_DATE} {PROMISE_TIME}
                    
                    <strong><u>Product Information:</u></strong>
                    
                    {PRODUCT_NAME}
                    Model Number: {SALES_MODEL_CODE}
                    Symptom: {SUB_SYMP_NAME}
                    
                    <strong><u>Service Provider Information:</u></strong>
                    
                    {ASC_NAME}
                    Technician: {O_ENGINEER_NAME}
                    Phone: {ASC_PHONE_NO} `,
                errorMsg: 'No repair history was found.', // 수리 내역 검색 에러 메시지
                pendingMsg: `Repair History
                
                {PENDING_HISTORY}`,
                completed: 'Repair Completed',
            },
            repair: {
                titleProduct: 'Product in need of repair', // 수리가 필요한 제품
                descriptionProduct: `<a href="javascript:openWinUrl('https://www.lg.com/us/support/help-library/how-to-find-my-model-and-serial-number-CT10000018-20152254906058')">Find my model #?</a>`, // 모델명 입력에 대한 가이드 문구 추가 22-08
                titleSymptom: 'Symptom', // 고장 증상
                titlePurchase: 'Purchase Date', // 제품 구매/설치일
                titlePersonal: 'Personal information', // 개인 정보 입력
                titleRepair: 'Schedule a repair date', // 수리 요청일자
                titleTime: 'Time Preference', // 수리 받을 시간
                titleServiceType: 'Service Type', // 서비스 타입 선택
                titleUploadFile: 'Upload Proof of Purchase', // 파일 선택 타이틀
                optionServiceType: ['Repair', 'Installation'], // 서비스 타입 옵션
                morningTime: 'Morning<br />(8am-12pm)', // 오전(8시~12시)
                afternoonTime: 'Afternoon<br />(1pm-5pm)', // 오후(1시~5시)
                uploadFileGuide:
                    'In order to validate the warranty of your product, please upload your proof of purchase (receipt). Note: File must be less than 10MB. Allowed file types are txt, doc, jpeg, gif, pdf, png)', // 제품에 대한 보증을 확인할 수 있는 파일을 업로드해주세요. 파일(txt, doc, jpeg, gif, pdf, png은 10MB 이하여야 합니다.
                fileHolder: 'Choose a file', // 파일을 선택해주세요.
                resultMsg1: `Your repair request has been saved. Below is the summary.
                      You will receive an email confirmation of your repair request.`,
                resultMsg2: `1) Service information
                        - Receipt Number: {SERVICE_REPAIR_NO}
                        - Expected repair date: {REPAIR_DATE}
                        - Service Center: {DEPARTMENT_NAME}
                      
                      2) Product information
                        - Product: {PRODUCT}
                        - Model: {MODEL_CODE}
                        - Symptom: {SYMPTOM}
                      
                      3) Customer information
                        - Name: {CUSTOMER_NAME}
                        - Address: {CUSTOMER_ADDRESS}
                        - Phone: {CUSTOMER_PHONE}
                        
                        If the above information is not correct and you want to change/cancel this appointment, please call 800-243-0000`, // 수리 내역 메시지
                errorMsg: 'Failed to receive repairs due to an unexpected reason.', // 수리 내역 에러 메시지
                connectAgentMessage: [
                    {
                        textToSpeech: 'This case needs our specialist to set up an appointment. Please click the below.',
                        linkOutSuggestion: {
                            destinationName: 'live chat agents',
                            url: 'https://zendesk-live-chat',
                        },
                    },
                ],
                consultationMessage: `An LG representative will call you within the next 2 business days to schedule your appointment.
                
                If it is an urgent issue, you can connect to representative right away.`,
            },
        },
        // en_US
        showMsg: {
            animMsg: 'Please wait while system is loading...', // 사용자를 기다리게 하지 않기
            agentAnimMsg: 'Agent is typing...', // 사용자를 기다리게 하지 않기
            introMsg: 'Hello, this is LG Chatbot.', // 인트로 Splash Sequence X
            // 챗봇 발화를 프론트에서 simpleResponses template 버블로 노출
            chatbotMsg: {
                // 상담사 채팅 후 챗봇 종료처리 22-05
                zchatEnd: [
                    { textToSpeech: 'Thank you for using LG Online Chat. Have a great day!' },
                    { textToSpeech: 'If you need further assistance via chat, please refresh or reload the page to start a session.' },
                ],
                // QoS 재질의시 종료 기능 추가 22-05 (미국법인은 노출안됨.)
                chatBye: [{ textToSpeech: 'Thanks for reaching out to LG Customer service, have a great day.' }],
            },
            qosMsg: {
                title: 'Customer Feedback',
                titleZendesk: 'Live Chat Feedback',
                question0: 'Thanks for your time.', // 미국 Survey UI 변경건 요청 23-02
                question1: 'We do appreciate if you rate our service.', // 미국 Survey UI 변경건 요청 23-02
                question1Zendesk: 'How would you rate your experience<br />with LG Live Agent?',
                btnQos1: 'Very Poor',
                btnQos2: 'Poor',
                btnQos3: 'Good',
                btnQos4: 'Very Good',
                btnQos5: 'Excellent',
                question2: 'Was chatbot helpful?', // 미국 Survey UI 변경건 요청 23-02
                question2Zendesk: 'Was this chat able to help you today?', // 미국 Survey UI 변경건 요청 23-02
                answer1: 'No',
                answer2: 'Yes',
                question3: 'How can we improve Chatbot in the future?', // 미국 QoS 문구 수정 요청
                question3Zendesk: 'Do you have any feedback from your chat experience?', // 미국 QoS 문구 수정 요청
                placeholder: 'Please share your thoughts with us.',
                errMsg1: 'Please use the star rating to rate your experience.', // QOS팝업 별점 default값 수정
                errMsg2: 'Kindly let us know if we have resolved your query.', // QoS 해결여부 default 변경 22-07
                cancel: 'Skip',
                noThanks: 'No, Thanks',
                submit: 'Submit',
            },
            restartMsg: {
                EndMsg: "I'm sorry, your connection has timed out. Please click the restart button for further assistance.",
                question: 'How was your experience chatting today?',
                btnMsg: 'If you need any further help, please click restart below, and we can try and resolve your issue!',
                btn: 'Restart Chat',
            },
        },
        gscs: {
            title: "Find Owner's Manual", // 메뉴얼
            modelCode: 'Model number',
            resultMsg: `Here is the owner's manual for your unit. Click below icon to download it.`, // 메뉴얼 결과
            errorMsg: "I can't find any manual for that unit. Please click below to connect to a live agent.", // 메뉴얼 실패
            descriptionProduct: `<a href="javascript:openWinUrl('https://www.lg.com/us/support/help-library/find-my-lg-model-and-serial-number--20152254906058#:~:text=Additionally%2C%20on%202018%20models%20or,Service%20Info%20%3E%20Press%20OK%20button')">Find my Model number?</a>`, // 모델명 입력에 대한 가이드 문구 추가 22-08
            manual: {
                OWM: 'Owner`s Manual',
                USG: 'User Guide',
                OLM: 'Online Manual',
                QSG: 'Quick Setup Guide',
                ISM: 'Installation Manual',
            },
        },
    },
};

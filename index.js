const settingsBtn = document.querySelector(".button-settings");
const chatBlock = document.querySelector(".chat-block");
const settingsBlock = document.querySelector(".settings-block-wrap");
const settingsCloseBtn = document.querySelector(".setting-block-close");
const messageSendBtn = document.querySelector(".message-send");
const messageTemplate = document.querySelector("#message-tmpl");
const messageInput = document.querySelector(".message-input");
const messageBlock = document.querySelector(".messages-block");
const authorizationBlock = document.querySelector(".authorization-block-wrap");
const authorizationSendBtn = document.querySelector(".authorization-block-send");
const authorizationInput = document.querySelector(".authorization-block-input");
const authorizationCloseBtn = document.querySelector(".authorization-block-close");
const confirmationBlock = document.querySelector(".confirmation-block-wrap");
const confirmationSendBtn = document.querySelector(".confirmation-block-send");
const confirmationInput = document.querySelector(".confirmation-block-input");
const confirmationCloseBtn = document.querySelector(".confirmation-block-close");
const settingsSendBtn = document.querySelector(".settings-block-send");
const settingsInput = document.querySelector(".settings-block-input");

settingsBtn.addEventListener("click", openSettings);
settingsCloseBtn.addEventListener("click", closeSettings);
messageSendBtn.addEventListener("click", sendMessage);
authorizationSendBtn.addEventListener("click", sendEmail);
authorizationCloseBtn.addEventListener("click", closeAuthorization);
confirmationSendBtn.addEventListener("click", sendCode);
confirmationCloseBtn.addEventListener("click", closeConfirmation);
settingsSendBtn.addEventListener("click", sendName);

let cookieList;
let code;
let myEmail;
let socket;
let messageSocket;
let scrollBottom;
let loadHistory = true;
let mouseDown;

checkAuthorization();

function checkAuthorization() {
    cookieList = document.cookie.split("; ");
    cookieList.forEach(function(item) {
        if (item.includes('code=')) {
            code = item.slice(5);
            socket = new WebSocket(`ws://chat1-341409.oa.r.appspot.com/websockets?${code}`);
            socket.onmessage = function(event) {
                messageSocket = JSON.parse(event.data);
                postMessage(messageSocket.user.name, messageSocket.text, messageSocket.createdAt, messageSocket.user.email);
            };
            closeAuthorization();
            // getHistory();
        }
    })

}

getHistory();

function checkScroll(event) {
    if (messageBlock.scrollTop == -(messageBlock.scrollHeight - messageBlock.clientHeight)) {
        messageBlock.removeEventListener('scroll', checkScroll);
       
        let y = messageBlock.scrollTop;

        const promise = new Promise(resolve => {
            resolve(getHistory());
          });

        promise.then(
            result => {
                messageBlock.scrollTop = y;
                console.log(messageBlock.scrollTop);
            }
        );

        setTimeout(() => {
            messageBlock.addEventListener('scroll', checkScroll);
        }, 1000);
    }
}

messageBlock.addEventListener('scroll', checkScroll);

messageBlock.addEventListener('mousedown', function(e) {
    mouseDown = true;
    console.log(mouseDown);
});

messageBlock.addEventListener('mouseup', function() {
    mouseDown = false;
    console.log(mouseDown);
});

function sendMessage() {
    socket.send(JSON.stringify({
        'text': `${messageInput.value}`
    }));
    messageInput.value = "";
}

function openSettings() {
    chatBlock.style.display = "none";
    settingsBlock.style.display = "flex";
}

function closeSettings() {
    settingsBlock.style.display = "none";
    chatBlock.style.display = "block";
}

function closeAuthorization() {
    authorizationBlock.style.display = "none";
    chatBlock.style.display = "block";
}

function closeConfirmation() {
    confirmationBlock.style.display = "none";
    chatBlock.style.display = "block";
}

// function sendMessage() {
//     let cloneMessage = messageTemplate.content.cloneNode(true);
//     let messageText = cloneMessage.querySelector(".message-item-text");
//     messageText.innerHTML = `Я: ${messageInput.value}`;
//     let messageTime = cloneMessage.querySelector(".message-item-time");
//     let minutes = new Date().getMinutes();
//     if (minutes < 10) {
//         minutes = "0" + minutes;
//     }
//     messageTime.innerHTML = `${new Date().getHours()}:${minutes}`;
//     messageBlock.prepend(cloneMessage);
// }

async function sendEmail() {
    const authorizationInfo = {
        'email': authorizationInput.value
    }

    document.cookie = `myEmail=${authorizationInput.value}`;

    let response = await fetch('https://chat1-341409.oa.r.appspot.com/api/user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
          },
        body: JSON.stringify(authorizationInfo)
    });

    authorizationBlock.style.display = "none";
    confirmationBlock.style.display = "flex";
}

function sendCode() {
    const confirmationInfo = {
        'code': confirmationInput.value
    }
    document.cookie = `code=${confirmationInput.value}`;

    confirmationBlock.style.display = "none";
    chatBlock.style.display = "block";
}

async function sendName() {
    const settingsInfo = {
        'name': settingsInput.value
    }
    let response = await fetch('https://chat1-341409.oa.r.appspot.com/api/user', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Authorization': `Bearer ${code}`
          },
        body: JSON.stringify(settingsInfo)
      });

    let response2 = await fetch('https://chat1-341409.oa.r.appspot.com/api/user/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${code}`
          }
      });
      let myInfo = await response2.json();
}

async function getHistory() {
    let response = await fetch('https://chat1-341409.oa.r.appspot.com/api/messages', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${code}`
          }
      });
      let history = await response.json();
      console.log(history);
      let historyPart = history.messages.slice(-20);
      console.log(historyPart);
      historyPart.forEach(function(item) {
        postMessage(item.user.name, item.text, item.createdAt, item.user.email);
      })
      return historyPart;
}

function postMessage(name, text, time, mail) {
    cookieList = document.cookie.split(";");
    cookieList.forEach(function(item) {
        if (item.includes('myEmail=')) {
            myEmail = item.slice(8);
        }
    })

    let cloneMessage = messageTemplate.content.cloneNode(true);
    if (myEmail == mail) {
        let messageItem = cloneMessage.querySelector(".message-item");
        messageItem.style.flexDirection = "row-reverse";
        name = "Я";
    }
    let messageText = cloneMessage.querySelector(".message-item-text");
    messageText.innerHTML = `${name}: ${text}`;

    time = time.split("T");

    let messageTime = cloneMessage.querySelector(".message-item-time");
    messageTime.innerHTML = `${time[0]} ${(time[1]).slice(0, 8)}`;
    messageBlock.prepend(cloneMessage);
}
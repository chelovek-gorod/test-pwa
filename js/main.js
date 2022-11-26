'use strict'

// REGISTERED SERVICE WORKER
/*
if ('serviceWorker' in navigator) {
  console.log('Есть поддержка Service worker');
  navigator.serviceWorker.register('./sw.js').then(function(registration) {
    console.log('Service worker зарегистрирован:', registration);
  }).catch(function(error) {
    console.log('Ошибка при регистрации service worker-а:', error);
  });
} else {
  console.log('Текущий браузер не поддерживает service worker-ы');
}
*/

// CONNECTION

const socketURL = 'wss://cursovaya-psp-server.onrender.com' // 'wss://cursovaya-psp-server.onrender.com'; // 'wss://cursovaya-psp.herokuapp.com' // 'ws://localhost:9000' 
const connectionTimeout = 6000;

let connectionIs = false;
let registrationIs = false;

let author = null;

class Message {
  constructor(author, target, message, isImage) {
    this.author = author; // {nickName, avatar}
    this.target = target; // {nickName, avatar}
    this.message = message; // string
    this.isImage = isImage; // true / false
    this.date = Date.now(); // data
  }
};

function connection() {
  console.log('--connection request--');

  let socket = new WebSocket(socketURL);

  socket.onopen = function () {
    console.log('socket on open');
    connectionIs = true;
    connectionShow(connectionIs);

    socket.send(JSON.stringify({ action: 'firstConnect' }));
  
    setTimeout(connectionTest, connectionTimeout);
  };
  
  socket.onmessage = function (message) {
    let { action, data } = JSON.parse(message.data);
    switch (action) {
      case 'firstConnect' : getConnectionStart(data, socket); break;
      case 'registration' : getRegistrationResponse(data, socket); break;
      case 'onConnect' : getOnConnectResponse(data); break;
      case 'newMessage' : getNewMessage(data); break;
      default : getWrongActionInResponse(action, data);
    }
  };

  socket.onclose = function(event) {
    if (event.wasClean) {
      console.group('socket on close');
      console.log('clean close connection');
      console.log('code: ${event.code}');
      console.log('reason: ${event.reason}');
      console.groupEnd();
    } else {
      console.group('socket on close');
      console.log('connection terminated:');
      console.log(event);
      console.groupEnd();
    }
    connectionIs = false;
    connectionShow(connectionIs)
    connection();
  };
  
  socket.onerror = function(error) {
    console.group('socket on error');
    console.log('connection error:');
    console.log(error);
    console.groupEnd();
  };

  function connectionTest() {
    socket.send(JSON.stringify({ action: 'onConnect', data: Date.now() }));
    if (connectionIs) setTimeout(connectionTest, connectionTimeout);
  }

}

function getConnectionStart(usedAvatarsArr, socket) {
  console.group('--connection start--');
  console.log('used avatars array:');
  console.log(usedAvatarsArr);
  console.groupEnd();

  registration(usedAvatarsArr, socket);
}

function getOnConnectResponse(data) {
  let {clientSendTime, serverSendTime} = data;
  console.log(`--PingPong[client -> server : ${serverSendTime - clientSendTime}ms; server -> client: ${Date.now() - serverSendTime}ms]--`);
}

function getRegistrationResponse(data, socket) {
  let { registrationIs, avatarIs, nickNameIs, messages } = data;

  if (!registrationIs) {
    socket.send(JSON.stringify({ action: 'firstConnect' }));
    if (!avatarIs) showModalMessage('Аватар уже занят');
    else if (!nickNameIs) showModalMessage('Ник-нейм уже занят');
    else showModalMessage('Ошибка регистрации');
  } else {
    containerDiv.innerHTML = '';

    messageListDiv = document.createElement("div");
    messageListDiv.id = 'messages';
    containerDiv.append(messageListDiv);

    let messageInput = document.createElement("textarea");
    messageInput.id = 'messageInput';
    containerDiv.append(messageInput);

    const inputFile = document.getElementById("inputFile");
    inputFile.onchange = function(event) {
      console.log('--open--', event.target.files.length);
      if (!event.target.files.length) return;
      const reader = new FileReader();
      reader.onload = function(event) {
        let imageData = event.target.result;
        console.log('IMAGE:');console.log(imageData);
        let message = new Message(author, null, imageData, true);
        socket.send(JSON.stringify({ action: 'newMessage', data: message }));
        messageInput.focus();
      };
      reader.readAsDataURL(event.target.files[0])
      
    }

    let sendBoard = document.createElement("div");
    sendBoard.id ="sendBoard";
    containerDiv.append(sendBoard);

    let imageButton = document.createElement("button");
    imageButton.id = 'imageButton';
    imageButton.innerHTML = '&#128449;';
    imageButton.onclick = function() { inputFile.click() };
    sendBoard.append(imageButton);

    let sendButton = document.createElement("button");
    sendButton.id = 'sendButton';
    sendButton.innerHTML = 'Отправить';
    sendButton.onclick = function() {
      let messageText = messageInput.value.trim();
      if (!messageText) showModalMessage('Вы не ввели сообщение');
      else {
        let message = new Message(author, null, messageText, false);
        messageInput.value = '';
        socket.send(JSON.stringify({ action: 'newMessage', data: message}));
        messageInput.focus();
      }
    };
    sendBoard.append(sendButton);

    console.log(messages);
    messages.forEach(messageData => {
      console.log(messageData);
      getNewMessage(messageData);
      console.log('--e--');
    });
  }
}

let messageListDiv;

function getNewMessage(messageData) {
  let { author, target, message, isImage, date } = messageData;

  let messageDiv = document.createElement("div");

  if(!author) {
    // SYSTEM MESSAGE
    messageDiv.className = 'notification';

    let messageImg = document.createElement("img");
    messageImg.src = avatarImgPath + target.avatar + avatarImgType;
    messageDiv.append(messageImg);

    let messageTxt = document.createElement("span");
    let messageSystemText;
    switch(message) {
      case 'newConnect' : messageSystemText = 'теперь в чате'; break;
      case 'disconnect' : messageSystemText = 'покинул(а) чат'; break;
      default : messageSystemText = '--';
    }
    console.log(messageSystemText);
    messageTxt.innerHTML = `<span class="nick-name">${target.nickName}</span> ${messageSystemText}`;
    messageDiv.append(messageTxt);

  } else {
    // USER MESSAGE
    messageDiv.className = 'message';
    let messageAuthorAvatar = document.createElement("img");
    messageAuthorAvatar.src = avatarImgPath + author.avatar + avatarImgType;
    messageAuthorAvatar.className = 'avatar';
    messageDiv.append(messageAuthorAvatar);

    let messageAuthorNickName = document.createElement("div");
    messageAuthorNickName.innerText = author.nickName;
    messageAuthorNickName.className = 'nick-name';
    messageDiv.append(messageAuthorNickName);

    let messageContent = document.createElement("div");
    if (isImage) messageContent.innerHTML = `<img src="${message}" alt="${author.nickName}-img-${date}">`;
    else messageContent.innerText = message;
    messageContent.className = 'message-text';
    messageDiv.append(messageContent);

    let messageDate = document.createElement("div");
    messageDate.innerHTML = getDateFromMilliSeconds(date);
    messageDate.className = 'message-date';
    messageDiv.append(messageDate);

  }

  messageListDiv.append(messageDiv);
  messageListDiv.scrollTop = messageListDiv.scrollHeight - messageListDiv.clientHeight;
}

function getWrongActionInResponse(action, data) {
  console.log(`--wrong action: ${action} (data: ${data})--`);
}

// INTERFACE

const connectionDiv = document.getElementById('connection');
const containerDiv = document.getElementById('container');

let userNickName = '';
let avatarImgPath = 'src/avatars/';
let avatarImgType = '.png';
let avatarsArr = ['antman', 'captan', 'dragonfly', 'draks', 'falcon', 'hawkeye',
  'gamora', 'groot', 'halk', 'ironman', 'loki', 'mantis', 'marvel', 'mech', 'mercury',
  'nebula', 'panther', 'piter', 'rocket', 'romanov', 'spiderman', 'strange', 'tanas',
  'thor', 'vision', 'wanda', 'yondu'
];

let avatarsNames = ['Человек-Муравей', 'Капитан Америка', 'Стрекоза', 'Дракс', 'Сокол', 'Ястребиный глаз',
  'Гамора', 'Грут', 'Халк', 'Тони Старк', 'Локи', 'Мантис', 'Капитан Марвел', 'Альтрон', 'Ртуть',
  'Небула', 'Черная Пантера', 'Звездный лорд', 'Ракета', 'Наташа Романов', 'Человек-Паук', 'Доктор Стрендж', 'Танас',
  'Тор', 'Вижен', 'Ванда', 'Йонду'
];

setTimeout(() => {
  document.getElementById('logo').remove();
  connectionShow(connectionIs);
  connection();
}, 6000);

function connectionShow(status) {
  if (status) {
    connectionDiv.style.display = 'none';
    containerDiv.style.display = 'block';
  }
  else {
    connectionDiv.style.display = 'block';
    containerDiv.style.display = 'none';
  }
}

function registration (usedAvatarsArr, socket) {
  containerDiv.innerHTML = '';

  let avatarsImgArr = [];
  let chosenAvatarNode;
  let chosenAvatarName;

  let titleDiv = document.createElement("div");
  titleDiv.id = 'avatarsTitle';
  titleDiv.innerText = 'Выберите Аватарку';
  containerDiv.append(titleDiv);

  let avatarsDiv = document.createElement("div");
  avatarsDiv.id = 'avatars';
  containerDiv.append(avatarsDiv);

  let nickNameInput = document.createElement("input");
  nickNameInput.type = 'text';
  nickNameInput.id = 'inputNickName';
  containerDiv.append(nickNameInput);

  let registrationButton = document.createElement("button");
  registrationButton.id = 'registrationButton';
  registrationButton.innerHTML = 'Регистрация';
  registrationButton.onclick = function() {
    let nickName = nickNameInput.value.trim();
    if (!chosenAvatarNode) showModalMessage('Вы не выбрали аватар');
    else if (!nickName) showModalMessage('Пустой ник-нейм');
    else if (nickName.length < 2) showModalMessage('Слишком короткий ник-нейм<br>(нужно от 2х до 20ти символов)');
    else if (nickName.length > 20) showModalMessage('Слишком длинный ник-нейм<br>(нужно от 2х до 20ти символов)');
    else {
      console.group('Registration');
      console.log('chosenAvatar');
      console.log(chosenAvatarName);
      console.groupEnd();

      author = {nickName: nickName, avatar: chosenAvatarName};
      socket.send(JSON.stringify({ action: 'registration', data: author}));
    }
  };
  containerDiv.append(registrationButton);

  avatarsArr.forEach((img, index) => {
    let disable = ~usedAvatarsArr.indexOf(img);
    
    let avatarImg = document.createElement('img');
    avatarImg.src = avatarImgPath + img + avatarImgType;
    if (disable) avatarImg.className = 'disable';
    else avatarImg.onclick = function() {
      if (chosenAvatarNode) chosenAvatarNode.classList.remove('choose');
      chosenAvatarNode = this;
      chosenAvatarName = img;
      this.classList.add('choose');
      nickNameInput.value = avatarsNames[index];
    };
    avatarsImgArr.push(avatarImg);
    avatarsDiv.append(avatarImg);
  });

}

function showModalMessage(message) {
  let modalShell = document.createElement("div");
  modalShell.id = 'modalShell';
  modalShell.className = 'full-screen flex-wrapper';
  modalShell.style.zIndex = 3;
  modalShell.onclick = function() {
    this.style.opacity = 0;
    setTimeout(() => this.remove(), 600);
  };

  let modalMessage = document.createElement("div");
  modalMessage.innerHTML = message;
  modalShell.append(modalMessage);

  document.body.append(modalShell);
}

function getDateFromMilliSeconds(ms) {
  let resultHTML;

  let fullDate = new Date(ms);
  let year = fullDate.getFullYear();
  let month = fullDate.getMonth() + 1;
  if (month < 10) month = '0' + month;
  let date = fullDate.getDate();
  resultHTML = [date, month, year].join(' - ');

  let hours = fullDate.getHours();
  let minutes = fullDate.getMinutes();
  resultHTML += `<br><span class="time">${[hours, minutes].join(':')}</span>`;

  let seconds = fullDate.getSeconds();
  resultHTML += `<span class="seconds"> ${seconds > 9 ? seconds : '0'+seconds}</span>`;

  return resultHTML;
}

function testContentMessage(message) {
  let regExp = /([^\"=]{2}|^)((https?|ftp):\/\/\S+[^\s.,> )\];'\"!?])/;
  let subst = '$1<a href="$2" target="_blank">$2</a>';
  return message.replace(regExp, subst);
}

function sendFile() {
  let file = document.getElementById('filename').files[0];
  let reader = new FileReader();
  let rawData = new ArrayBuffer();            
  reader.loadend = function() {
  }
  reader.onload = function(e) {
    rawData = e.target.result;
    ws.send(rawData);
    alert("the File has been transferred.")
  }
  reader.readAsArrayBuffer(file);
}
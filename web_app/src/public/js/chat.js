const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-sheet');
const room = document.getElementById('room-name').innerHTML;
const username = document.getElementById('current-user').innerHTML;

const socket = io();

// Join chatroom
socket.emit('joinRoom', { username, room });

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  if (message.date) {
    div.innerHTML = `<p class="meta">${message.username} <span>${message.date}</span></p>
    <p class="text">
      ${message.text}
    </p>`;
  } else {
    div.innerHTML = `<p class="meta">${message.username}</p>
    <p class="text">
      ${message.text}
    </p>`;
  }
  document.getElementById('chat-sheet').appendChild(div);
}

// Format current date
function formatDate() {
  let today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();

  // Get hours
  let minutes = today.getMinutes();
  let hour = today.getHours();

  if (minutes < 10) {
    minutes = `0${minutes}`;
  }
  if (hour < 10) {
    hour = `0${hour}`;
  }

  today = `${dd}-${mm}-${yyyy}  ${hour}:${minutes}`;
  return today;
}

// Input message into DOM
function inputMessage(message) {
  const div = document.createElement('div');
  const dating = formatDate();
  div.classList.add('message-emit');
  div.innerHTML = `<p class="meta">${message.username} <span>${dating}</span></p>
  <p class="text">
    ${message.text}
  </p>`;
  document.getElementById('chat-sheet').appendChild(div);
}

// Message from server
socket.on('message', (message) => {
  outputMessage(message);
  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Get message text
  const msg = e.target.elements.msg.value;

  // Add message on the DOM
  inputMessage({ text: msg, username });

  // Emit message to server
  socket.emit('chatMessage', { msg, username, room });

  // Clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

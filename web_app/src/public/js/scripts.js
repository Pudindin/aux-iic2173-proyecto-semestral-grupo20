console.log('Hello world i\'m executing in the browser too!');

// Get fields to work with
const checkRoom = document.getElementById('room-question');
const newRoom = document.getElementById('create-room');
const selectRoom = document.getElementById('select-room');
const existingRooms = document.getElementById('existing-rooms');
const checkRoomValue = document.getElementById('checkValue');

// default to uncheck
if (checkRoom.type === 'checkbox') {
  checkRoom.checked = false;
}

// unless there is no existing rooms
if (existingRooms && existingRooms.length === 0) {
  checkRoom.checked = true;
  newRoom.style.display = 'block';
  selectRoom.style.display = 'none';
  checkRoom.disabled = true;
  checkRoomValue.value = 'true';
}

checkRoom.addEventListener('change', (e) => {
  if (e.target.checked) {
    newRoom.style.display = 'block';
    selectRoom.style.display = 'none';
    checkRoomValue.value = 'true';
  } else {
    newRoom.style.display = 'none';
    selectRoom.style.display = 'block';
    checkRoomValue.value = 'false';
  }
});

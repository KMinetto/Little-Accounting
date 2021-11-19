const { ipcRenderer } = require('electron');

//================== HTML Elements ==================//
const addItem = document.getElementById('addItem');



//================== Events ==================//
addItem.addEventListener('submit', event => {
  event.preventDefault();

  const newItem = [...new FormData(addItem)].reduce((obj, [item, value]) => {
    obj[item] = value;
    return obj;
  }, {});

  ipcRenderer.send('add-new-item', newItem);

  addItem.reset();
});

const { ipcRenderer } = require('electron');

//================== HTML Elements ==================//
const updateItem = document.getElementById('updateItem');

//================== Variables ==================//
let item = null;
let typeItem = null;

//================== IPC Methods ==================//
ipcRenderer.on('item-data', (event, data) => {
    item = data.item;
    typeItem = data.typeItem;

    let itemLabel = document.getElementById('itemLabel');
    const itemValue = document.getElementById('itemValue');
    itemLabel.value = item.label;
    itemValue.value = item.value;
});

//================== Events ==================//
updateItem.addEventListener('submit', event => {
    event.preventDefault();

    const updatedItem = [...new FormData(updateItem)].reduce((obj, [item, value]) => {
        obj[item] = value;
        return obj;
    }, {});

    updatedItem.id = item.id;

    ipcRenderer.send('update-item', { item: updatedItem, typeItem: typeItem });
});

const { app, BrowserWindow, ipcMain } = require('electron');

let expenses = [
    {
        id: 1,
        label: 'Achat huile moteur',
        value: 80,
    },
    {
        id: 2,
        label: 'Achat joint vidange',
        value: 10,
    },
    {
        id: 3,
        label: 'Achat filtre à huile',
        value: 20,
    },
    {
        id: 4,
        label: 'Materiel divers',
        value: 1020,
    },
];
let recipes = [
    {
        id: 1,
        label: 'Vidange véhicule',
        value: 150,
    },
    {
        id: 2,
        label: 'Réparation véhicule',
        value: 550,
    },
];

let mainWindow = null;
let targetAddItemId = null;

/**
 * Calcule la balance financière
 * @param recipes
 * @param expenses
 * @return {number}
 */
function generateBalanceSheet(recipes, expenses) {
    const sumRecipes = recipes.reduce((a, b) => a + (parseFloat(b.value) || 0), 0);
    const sumExpenses = expenses.reduce((a, b) => a + (parseFloat(b.value) || 0), 0);

    return sumRecipes - sumExpenses;
}

/**
 * Créer une fenêtre
 * @param {string} pathFile
 * @param {number} width
 * @param {number} height
 * @return {Electron.BrowserWindow}
 */
function createWindow(pathFile, width = 1200, height = 800) {
    let win = new BrowserWindow({
        width: width,
        height: height,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    win.loadFile(pathFile);

    win.on('closed', () => { win = null; });

    return win;
}

app.whenReady().then(() => {
    mainWindow = createWindow('views/home/home.html');

    mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.send('store-data', {
            expensesData: expenses,
            recipesData: recipes,
            balanceSheet: generateBalanceSheet(recipes, expenses)
        });
    });
});

ipcMain.on('open-new-item-window', (event, data) => {
    const win = createWindow('./views/addItem/addItem.html', 500, 450);
    targetAddItemId = data;
    win.on('closed', () => { targetAddItemId = null; });
});

ipcMain.on('add-new-item', (event, newItem) => {
   let newId = 1;
   let arrayForAdd = recipes;
   if (targetAddItemId === 'addExpenses') arrayForAdd = expenses;

   if (arrayForAdd.length > 0) {
       newId = arrayForAdd[arrayForAdd.length - 1].id + 1;
   }

   newItem.id = newId;
   arrayForAdd.push(newItem);

   mainWindow.webContents.send('update-with-new-item', {
       newItem: [newItem],
       balanceSheet: generateBalanceSheet(recipes, expenses),
       targetId: targetAddItemId
   });
})

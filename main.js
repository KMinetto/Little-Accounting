const { app, BrowserWindow, ipcMain, Menu } = require('electron');

let expenses = [];
let recipes = [];

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
});

ipcMain.on('delete-item', (event, data) => {
    let arrayForDelete = recipes;
    if (data.typeItem === 'Expense') arrayForDelete = expenses;

    for (let i = 0; i < arrayForDelete.length; i++) {
        if (arrayForDelete[i].id === data.id) {
            arrayForDelete.splice(i, 1);
            break;
        }
    }

    data.balanceSheet = generateBalanceSheet(recipes, expenses);
    event.sender.send('update-delete-item', data);
});

// config menu
const templateMenu = [
    {
        label: 'Action',
        submenu: [
            {
                label: 'Nouvelle dépense',
                accelerator: 'CommandOrControl+N',
                click() {
                    const win = createWindow('./views/addItem/addItem.html', 500, 450);
                    targetAddItemId = 'addExpenses';
                    win.on('closed', () => {
                        targetAddItemId = null;
                    });
                }
            },
            {
                label: 'Nouvelle recette',
                accelerator: 'CommandOrControl+B',
                click() {
                    const win = createWindow('./views/addItem/addItem.html', 500, 450);
                    targetAddItemId = 'addRecipes';
                    win.on('closed', () => {
                        targetAddItemId = null;
                    });
                }
            },
            {
                label: 'Activer/Désactiver Mode Edition',
                accelerator: 'CommandOrControl+E',
                click() {
                    mainWindow.webContents.send('toggle-edition-mode');
                }
            },
        ],
    },
    {
        label: 'Fenêtre',
        submenu: [
            { role: 'reload' },
            { role: 'toggledevtools' },
            { role: 'separator' },
            { role: 'togglefullscreen' },
            { role: 'minimize' },
            { role: 'separator' },
            { role: 'close' },
        ]
    }
];

if (process.platform === 'darwin') {
    templateMenu.unshift({
        label: app.name,
        submenu: [
            { role: 'quit' }
        ]
    });
}

const menu = Menu.buildFromTemplate(templateMenu);
Menu.setApplicationMenu(menu);

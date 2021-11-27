const { app, BrowserWindow, ipcMain, Menu, dialog, Notification, nativeImage } = require('electron');
const path = require("path");
const csv = require("csvtojson");

Store = require('electron-store');
const store = new Store();

let mainWindow = null;
let targetAddItemId = null;

let expenses = store.has('expenses') ? store.get('expenses') : [];
let recipes = store.has('recipes') ? store.get('recipes') : [];

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

function getLastIdArray(array) {

    if (array.length > 0) {
        return array[array.length - 1].id + 1;
    }

    return 1;
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
            devTools: false
        },
        icon: path.join(__dirname, 'assets/img/icon.png')
    });

    win.loadFile(pathFile);

    win.on('closed', () => { win = null; });

    return win;
}

function showDesktopNotification(title, body, imgPath, textButton) {
    const notification = new Notification({
        title,
        body,
        icon: nativeImage.createFromPath(imgPath),
        closeButtonText: textButton
    });

    notification.show();
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
   let arrayForAdd = recipes;
   let storeKey = 'recipes';

   newItem.id = getLastIdArray(arrayForAdd);

   if (targetAddItemId === 'addExpenses') {
       arrayForAdd = expenses;
       storeKey = 'expenses';
   }

   arrayForAdd.push(newItem);
   store.set(storeKey, arrayForAdd);

   showDesktopNotification('Ajout D\'une nouvelle opération réussi', 'L\'opération a été ajouté avec succés !', path.join(__dirname, '/assets/img/checked.png', 'Fermer'));

   mainWindow.webContents.send('update-with-new-item', {
       newItem: [newItem],
       balanceSheet: generateBalanceSheet(recipes, expenses),
       targetId: targetAddItemId
   });
});

ipcMain.on('delete-item', (event, data) => {
    let arrayForDelete = recipes;
    let storeKey = 'recipes';
    if (data.typeItem === 'Expense') {
        arrayForDelete = expenses;
        storeKey = 'expenses';
    }
    for (let i = 0; i < arrayForDelete.length; i++) {
        if (arrayForDelete[i].id === data.id) {
            arrayForDelete.splice(i, 1);
            break;
        }
    }
    store.set(storeKey, arrayForDelete);

    data.balanceSheet = generateBalanceSheet(recipes, expenses);
    event.sender.send('update-delete-item', data);
});

ipcMain.on('open-update-item-window', (event, data) => {
    const win = createWindow('views/updateItem/updateItem.html', 500, 450);

    win.webContents.once('did-finish-load', () => {
        win.send('item-data', data);
    });
});

ipcMain.on('update-item', (event, data) => {
    let arrayForUpdate = recipes;
    let storeKey = 'recipes';
    if (data.typeItem === 'Expense') {
        arrayForUpdate = expenses;
        storeKey = 'expenses';
    }
    for (let i = 0; i < arrayForUpdate.length; i++) {
        if (arrayForUpdate[i].id === data.item.id) {
            arrayForUpdate[i].label = data.item.label;
            arrayForUpdate[i].value = data.item.value;
            break;
        }
    }

    store.set(storeKey, arrayForUpdate);

    data.balanceSheet = generateBalanceSheet(recipes, expenses);

    mainWindow.webContents.send('updated-item', data );
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
            {
                label: 'Exporter les données',
                accelerator: 'CommandOrControl+T',
                click() {
                    const objectsToCsv = require('objects-to-csv');

                    // Save recipes to file
                    let recipesCsv = new objectsToCsv(recipes);
                    recipesCsv.toDisk(path.join(app.getPath('downloads'), '/recettes.csv'), { append: true });

                    // Save expenses to files
                    let expensesCsv = new objectsToCsv(expenses);
                    expensesCsv.toDisk(path.join(app.getPath('downloads'), '/dépenses.csv'), { append: true });
                }
            },
            {
                label: 'Importer des recettes',
                click() {
                    dialog.showOpenDialog(mainWindow, {
                        properties: ['openFile'],
                        filtres: [
                            { name: 'Fichiers de données', extensions: ['csv'] }
                        ]
                    }).then(response => {
                            if (!response.canceled) {
                                const csv = require('csvtojson');
                                csv()
                                    .fromFile(response.filePaths[0])
                                    .then((jsonObj) => {
                                        let newId = getLastIdArray(recipes);
                                        jsonObj.forEach((item) => {
                                            item.id = newId;
                                            newId++;
                                        });

                                        recipes = recipes.concat(jsonObj);
                                        store.set('recipes', recipes);
                                        mainWindow.send('update-with-new-item', {
                                            newItem: jsonObj,
                                            balanceSheet: generateBalanceSheet(recipes, expenses),
                                            targetId: 'addRecipes'
                                        });
                                    })
                            }
                    }).catch(error => console.error(error));
                }
            },
            {
                label: 'Importer des dépenses',
                click() {
                    dialog.showOpenDialog(mainWindow, {
                        properties: ['openFile'],
                        filtres: [
                            { name: 'Fichiers de données', extensions: ['csv'] }
                        ]
                    }).then(response => {
                        if (!response.canceled) {
                            const csv = require('csvtojson');
                            csv()
                                .fromFile(response.filePaths[0])
                                .then((jsonObj) => {
                                    let newId = getLastIdArray(expenses);
                                    jsonObj.forEach((item) => {
                                        item.id = newId;
                                        newId++;
                                    });

                                    expenses = expenses.concat(jsonObj);
                                    store.set('expenses', expenses);
                                    mainWindow.send('update-with-new-item', {
                                        newItem: jsonObj,
                                        balanceSheet: generateBalanceSheet(recipes, expenses),
                                        targetId: 'addExpenses'
                                    });
                                })
                        }
                    }).catch(error => console.error(error));
                }
            },
        ],
    },
    {
        label: 'Fenêtre',
        submenu: [
            { role: 'reload' },
            { role: 'separator' },
            { role: 'togglefullscreen' },
            { role: 'minimize' },
            { role: 'separator' },
            { role: 'close' },
        ]
    },
    {
      label: 'Développement',
      submenu: [
          {
              label: 'Replire la base de données',
              click() {
                  expenses = [
                      {
                          id: 1,
                          label: 'Achat huile moteur',
                          value: 80
                      },
                      {
                          id: 2,
                          label: 'Achat Joint vidange',
                          value: 10
                      },
                      {
                          id: 1,
                          label: 'Achat filtre à huile',
                          value: 20
                      },
                      {
                          id: 4,
                          label: 'Materiels divers',
                          value: 1020
                      },
                  ];
                  recipes = [
                      {
                        id: 1,
                        label: 'Vidange Voiture',
                        value: 150
                      },
                      {
                          id: 2,
                          label: 'Réparation voiture',
                          value: 550
                      }
                  ];

                  store.set('expenses', expenses);
                  store.set('recipes', recipes);

                  mainWindow.send('store-data', {
                      expensesData: expenses,
                      recipesData: recipes,
                      balanceSheet: generateBalanceSheet(recipes, expenses)
                  });
              }
          },
          {
              label: 'Supprimer la base de données',
              click() {
                  store.clear();
              }
          }
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

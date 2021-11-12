const { app, BrowserWindow } = require('electron');

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


function createWindow() {
    let win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    win.loadFile('views/home/home.html');

    win.webContents.once('did-finish-load', () => {
        win.send('store-data', {
            expensesData: expenses,
            recipesData: recipes,
            balanceSheet: generateBalanceSheet(recipes, expenses)
        });
    })

    win.on('closed', () => {
        win = null;
    });

    return win;
}

app.whenReady().then(createWindow);

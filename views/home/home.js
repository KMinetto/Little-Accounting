const { ipcRenderer } = require('electron');

//================== HTML Elements ==================//
const addExpenses = document.getElementById('addExpenses');
const addRecipes = document.getElementById('addRecipes');

//================== Functions ==================//
/**
 * Créer les élements des tableaux dépenses/recettes
 * @param rowData
 * @return {HTMLTableRowElement}
 */
function createTBodyElements(rowData) {
    const tr = document.createElement('tr');
    tr.setAttribute('class', 'table-light');

    const th = document.createElement('th');
    th.setAttribute('scope', 'row');
    th.innerText = rowData.id;
    tr.appendChild(th);

    const tdLabel = document.createElement('td');
    tdLabel.innerText = rowData.label;
    tr.appendChild(tdLabel);

    const tdValue = document.createElement('td');
    tdValue.innerText = rowData.value;
    tr.appendChild(tdValue);

    const tdButtons = document.createElement('td');
    const buttonMod = document.createElement('button');
    buttonMod.setAttribute('class', 'btn btn-outline-warning me-2');
    buttonMod.innerText = "Modifier";
    tdButtons.appendChild(buttonMod);
    const buttonSuppr = document.createElement('button');
    buttonSuppr.setAttribute('class', 'btn btn-outline-danger');
    buttonSuppr.innerText = "Supprimer";
    tdButtons.appendChild(buttonSuppr);
    tr.appendChild(tdButtons);

    return tr;
}

/**
 * Génère les tableaux dans le HTML
 * @param tableId
 * @param tableData
 */
function generateTableRow(tableId, tableData) {
    const tbodyElem = document.getElementById(tableId);
    tableData.forEach((rowData) => {
        tbodyElem.appendChild(createTBodyElements(rowData));
    });
}

function updateBalanceSheet(newBalanceSheet) {
    const balanceSheetElem = document.getElementById('balanceSheet');

    // Retire toutes les classes de l'élément
    ['bg-success', 'bg-danger'].map((e) => balanceSheetElem.classList.remove(e));
    balanceSheetElem.innerText = newBalanceSheet + ' €';

    if (newBalanceSheet > 0) {
        balanceSheetElem.classList.add('bg-success');
    } else if (newBalanceSheet < 0) {
        balanceSheetElem.classList.add('bg-danger');
    }
}

//================== IPC Methods ==================//
ipcRenderer.on('store-data', (event, data) => {
    console.log(data.recipesData);
    console.log(data.expensesData);

    generateTableRow('recipesTbody', data.recipesData);
    generateTableRow('expensesTbody', data.expensesData);
    updateBalanceSheet(data.balanceSheet);
});

ipcRenderer.on('update-with-new-item', (event, data) => {
    // console.log(data);
   let tableId = 'expensesTbody';
   if (data.targetId === 'addRecipes') tableId = 'recipesTbody';
    generateTableRow(tableId, data.newItem);
    updateBalanceSheet(data.balanceSheet);
});

/**
 * Envoi les informations au main.js
 * @param event
 */
function openWindowAddItem(event) {
    ipcRenderer.send('open-new-item-window', event.id);
}

//================== Events ==================//
addExpenses.addEventListener('click', event => {
    openWindowAddItem(addExpenses);
});

addRecipes.addEventListener('click', event => {
    openWindowAddItem(addRecipes);
});

const { ipcRenderer } = require('electron');
const { dialog, Menu, MenuItem, getCurrentWindow } = require('electron').remote;

//================== HTML Elements ==================//
const addExpenses = document.getElementById('addExpenses');
const addRecipes = document.getElementById('addRecipes');

//================== Functions ==================//
function deleteButton(rowId, typeItem) {
    dialog.showMessageBox({
        type: 'warning',
        buttons: ['Non', 'Oui'],
        title: 'Confirmation de suppression',
        message: 'Êtes vous sûr de vouloir supprimer cette opération ?'
    })
        .then(response => {
            if (response.response === 1) {
                ipcRenderer.send('delete-item', {id: rowId, typeItem: typeItem});
            }
        })
        .catch(error => {
            console.error(error);
        })
}

/**
 * Créer les élements des tableaux dépenses/recettes
 * @param rowData
 * @param typeItem
 * @return {HTMLTableRowElement}
 */
function createTBodyElements(rowData, typeItem) {
    const tr = document.createElement('tr');
    tr.setAttribute('id', `row${typeItem}_${rowData.id}`);
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
    tdButtons.setAttribute('id', `cells${typeItem}_${rowData.id}`);
    tdButtons.style.display = 'none';
    const buttonMod = document.createElement('button');
    buttonMod.setAttribute('id', `modify${typeItem}_${rowData.id}`);
    buttonMod.setAttribute('class', 'btn btn-outline-warning me-2');
    buttonMod.innerText = "Modifier";
    tdButtons.appendChild(buttonMod);
    const buttonSuppr = document.createElement('button');
    buttonSuppr.setAttribute('id', `delete${typeItem}_${rowData.id}`)
    buttonSuppr.setAttribute('class', 'btn btn-outline-danger');
    buttonSuppr.innerText = "Supprimer";
    tdButtons.appendChild(buttonSuppr);
    tr.appendChild(tdButtons);

    buttonSuppr.addEventListener('click', event => {
        event.preventDefault();
        deleteButton(rowData.id, typeItem);
    })

    return tr;
}

/**
 * Génère les tableaux dans le HTML
 * @param tableId
 * @param tableData
 * @param typeItem
 */
function generateTableRow(tableId, tableData, typeItem) {
    const tbodyElem = document.getElementById(tableId);
    tableData.forEach((rowData) => {
        tbodyElem.appendChild(createTBodyElements(rowData, typeItem));
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

function toggleEditionMode() {
    const expensesActionElem = document.getElementById('expensesAction');
    const recipesActionElem = document.getElementById('recipesAction');
    const expensesCellsElems = document.querySelectorAll('*[id^="cellsExpense_"]');
    const recipesCellsElems = document.querySelectorAll('*[id^="cellsRecipe_"]');

    if (expensesActionElem.style.display === 'none' && recipesActionElem.style.display === 'none') {
        expensesActionElem.style.display = 'block';
        recipesActionElem.style.display = 'block';
        expensesCellsElems.forEach(cell => cell.style.display = 'block');
        recipesCellsElems.forEach(cell => cell.style.display = 'block');
    }
    else {
        expensesActionElem.style.display = 'none';
        recipesActionElem.style.display = 'none';
        expensesCellsElems.forEach(cell => cell.style.display = 'none');
        recipesCellsElems.forEach(cell => cell.style.display = 'none');
    }
}

//================== IPC Methods ==================//
ipcRenderer.on('store-data', (event, data) => {
    generateTableRow('recipesTbody', data.recipesData, 'Recipe');
    generateTableRow('expensesTbody', data.expensesData, 'Expense');
    updateBalanceSheet(data.balanceSheet);
});

ipcRenderer.on('update-with-new-item', (event, data) => {
   let tableId = 'expensesTbody';
   let typeItem = 'Expense';
   if (data.targetId === 'addRecipes') {
       tableId = 'recipesTbody';
       typeItem = 'Recipe';
   }
    generateTableRow(tableId, data.newItem, typeItem);
    updateBalanceSheet(data.balanceSheet);
});

/**
 * Envoi les informations au main.js
 * @param event
 */
function openWindowAddItem(event) {
    ipcRenderer.send('open-new-item-window', event.id);
}

ipcRenderer.on('update-delete-item', (event, data) => {
    document.getElementById(`row${data.typeItem}_${data.id}`).remove();
    updateBalanceSheet(data.balanceSheet);
});

ipcRenderer.on('toggle-edition-mode', (event, data) => {
    toggleEditionMode();
});

//================== Events ==================//
addExpenses.addEventListener('click', event => {
    openWindowAddItem(addExpenses);
});

addRecipes.addEventListener('click', event => {
    openWindowAddItem(addRecipes);
});

window.addEventListener('load', event => {
   const  menu = new Menu();
   menu.append(new MenuItem({
       label: 'Nouvelle dépense',
       click() { openWindowAddItem({ target: { id: 'addExpenses' } }); }
   }));
    menu.append(new MenuItem({
        label: 'Nouvelle recette',
        click() { openWindowAddItem({ target: { id: 'addRecipes' } }); }
    }));
    menu.append(new MenuItem({
        label: 'Activer/Désactiver Mode Edition',
        click() { toggleEditionMode(); }
    }));

    document.addEventListener('contextmenu', event => {
        event.preventDefault();
        menu.popup({ window: getCurrentWindow() });
    });
});

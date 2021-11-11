const { app, BrowserWindow } = require('electron');

function createWindow() {
    let win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
        }
    });

    win.loadFile('views/home/home.html');

    win.on('closed', () => {
        win = null;
    });

    return win;
}

app.whenReady().then(createWindow);

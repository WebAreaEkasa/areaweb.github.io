var isElectron = false;

var ipcRenderer;

if (typeof (require) !== "undefined") {
    isElectron = true;
    var { ipcRenderer } = require('electron')
    window.ipc = window.ipcRenderer || {};
}

window.addEventListener('DOMContentLoaded', function () {
    const updateBtn = document.getElementById('openfolder');
    const calcBtn = document.getElementById('opencalc');
    const calcFrame = document.getElementById('calcFrame');

    updateBtn.addEventListener('click', function () {
        if (isElectron) {
            ipcRenderer.send('open-item', "www");
        }
        else {
            M.toast({html: 'Estas en browser!!!', classes: 'green'})
        }
        return false;
    })

    calcBtn.addEventListener('click', function () {
        if (isElectron) {
            ipcRenderer.send('open-calc', "");
        }
        else {
            calcFrame.style.display = null;
        }
        return false;
    })
});






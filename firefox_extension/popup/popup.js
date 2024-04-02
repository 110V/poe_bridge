let isConnected = false;

const screen1 = document.getElementById("screen1");
const screen2 = document.getElementById("screen2");
const ipInput = document.getElementById("ipInput");
const connectBtn = document.getElementById("connectBtn");
const loadingSpinner = document.getElementById("loadingSpinner");
const nameInput = document.getElementById("nameInput");
const registerBtn = document.getElementById("registerBtn");

function showScreen(screenId) {
    screen1.style.display = "none";
    screen2.style.display = "none";

    document.getElementById(screenId).style.display = "block";
    if (screenId == "screen2") {
        sendToCurrentTab((id) => { return { action: "con_getname" } }, (name) => {
            nameInput.value = name;
        });
    }
}

connectBtn.addEventListener("click", () => {
    checkIsConnected((connection) => {
        if (connection == 0) {
            connect(ipInput.value, 8080);
            loadingSpinner.style.display = "block";
        }
        if (connection == 1) {
            showScreen("screen1");
            loadingSpinner.style.display = "block";
        }
        if (connection == 2) {
            showScreen("screen2");
        }
    });
});

registerBtn.addEventListener("click", () => {
    const name = nameInput.value;
    sendToCurrentTab((id) => { return { action: "con_register", tabID: id, roomname: name } });
});

function checkIsConnected(callback) {
    browser.runtime.sendMessage({ action: "back_isConnected" }).then((connection) => {
        callback(connection);
    });
}

function connect(ip, port) {
    browser.runtime.sendMessage({ action: "back_connect", ip, port });
}

checkIsConnected((connection) => {
    if (connection == 0) {
        showScreen("screen1");
        loadingSpinner.style.display = "none";
    }
    if (connection == 1) {
        showScreen("screen1");
        loadingSpinner.style.display = "block";
    }
    if (connection == 2) {
        showScreen("screen2");
    }
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "pop_connected":
            showScreen("screen2");
            loadingSpinner.style.display = "none";
            break;
        case "pop_closed":
            showScreen("screen1");
            loadingSpinner.style.display = "none";
            break;
    }
});

const getcurrentTabID = (callback) => {
    browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
        callback(tabs[0].id);
    });
}

const sendToCurrentTab = (msgFunc, callback) => {
    getcurrentTabID(((tabID) => {

        browser.tabs.sendMessage(tabID, msgFunc(tabID)).then((data) => {
            if (callback) {
                callback(data);
            }
        });
    }));
}

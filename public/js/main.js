
let loc = window.location, new_uri;
if (loc.protocol === "https:") {
    new_uri = "wss:";
} else {
    new_uri = "ws:";
}
const WS_URL = new_uri + "//" + loc.host;

let socket = new WebSocket(WS_URL);

socket.onopen = function (e) {
    console.log("connexion established")
};

socket.onmessage = function (event) {
    //console.log(`[message] Data received from server: ${event.data}`);
    var jsonObject = JSON.parse(event.data);
    if(jsonObject['percent']) {
        incrementProgressBar(jsonObject['percent']);
    } else {
        orderBook.updateVisualisation(jsonObject["orderBook"], jsonObject["resolvedPrice"])
    }
};

socket.onclose = function (event) {
    if (event.wasClean) {
        console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        const progressBar = document.querySelector('.progress-bar');
        progressBar.style.width = '100%';
        progressBar.innerHTML = "WS closed. Please reload";
        document.querySelector('.progress').classList.add('height-35');
    } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        console.log('[close] Connection died');
    }
};

socket.onerror = function (error) {
    console.log(`[error] ${error.message}`);
};

function incrementProgressBar(percent) {
    document.querySelector('.progress-bar').style.width = percent + '%';
}

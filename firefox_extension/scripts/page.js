let roomname = "";
let tabID = null;

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "con_register":
      if (roomname == request.roomname) {
        return;
      }
      const change = () => {
        if (request.roomname == "") {
          return;
        }
        tabID = request.tabID;
        const temp = request.roomname
        getInfo((chatRoomData) => {
          chatRoomData.id = temp;
          browser.runtime.sendMessage({ action: "back_register", name: request.roomname, tabID: tabID, chatRoomData }).then((result) => {
            if (result === "ok") {
              roomname = temp;
            }
          });
        });
      }
      if (roomname == "") {
        change();
        return;
      }
      unregister(change);

      break;
    case "con_find":
      target = request.roomname;
      if (roomname == target) {
        sendResponse(tabID);
      }
      break;
    case "con_request":
      sendChat(request.prompt, (status, msg) => {
        getInfo((chatRoomData) => {
          chatRoomData.id = roomname;
          let data = {};
          data.requestID = request.requestID;
          data.status = status;
          data.msg = msg;
          data.chatRoomData = chatRoomData;
          browser.runtime.sendMessage({ action: "back_response", data: data });
          console.log(data)
        })
      });
      sendResponse("ok");
      break;
    case "con_getname":
      sendResponse(roomname);
      break;
  }
});

function unregister(callback) {
  if (roomname == "") return;
  browser.runtime.sendMessage({ action: "back_unregister", name: roomname, browserID: tabID }).then((result) => {
    if (result === "ok") {
      roomname = "";
      callback();
    }
  })
}

const textarea = () => document.querySelector(".GrowingTextArea_textArea__ZWQbP");
const sendButton = () => document.querySelector(".ChatMessageSendButton_sendButton__4ZyI4");
const clearButton = () => document.querySelector(".ChatBreakButton_button__zyEye");
const actionBarButtons = () => document.getElementsByClassName("Button_buttonBase__Bv9Vx Button_tertiary__KEQm1 Button_iconOnly__poDNY")
const messages = () => document.querySelectorAll(".Message_botMessageBubble__aYctV");
const head = () => document.querySelector(".ChatHeader_clickable__7fBYF");
const actionBar = () => document.querySelector(".ChatBotActionBar_actionRow__b8y3p");
const botInfo = () => document.querySelector(".BotInfoCardHeader_pointsLink__Wg12p");
const tokenLeft = () => document.querySelectorAll(".MessagePointsOverviewModal_rowTextBase__PpE0W")[1];
const botCost = () => document.querySelectorAll(".MessagePointsOverviewModal_rowTextBase__PpE0W")[3];
const modelName = () => document.querySelector(".MessagePointsOverviewModal_botName__N0PwC");
const closeBtn = () => document.querySelector(".Modal_closeButton__GycnR");

function sendChat(message, callback) {
  textarea().value = message;
  textarea().dispatchEvent(new Event('input'));
  clearButton().click();
  waitFor(() => actionBarButtons().length == 0, () => {
    console.log(1);
    waitFor(() => !sendButton().disabled,
      () => {
        waitFor(() => {
          sendButton().click();
          console.log(3);
          return actionBarButtons().length > 0
        },
          () => {
            console.log(4);
            const count = actionBarButtons().length;
            if (count == 1) {
              callback("fail", "");
              return;
            }
            const msgs = messages();
            const content = msgs[msgs.length - 1].innerText
            callback("success", content);
          }
        );
      }
    )
  });
}

function waitFor(condition, callback) {
  const intervalId = setInterval(() => {
    if (condition()) {
      clearInterval(intervalId);
      callback();
    }
  }, 100);
}

function getInfo(callback) {
  waitFor(head, () => {
    head().click();
    waitFor(actionBar, () => {
      actionBar().click();
      waitFor(botInfo, () => {
        botInfo().click();
        waitFor(tokenLeft, () => {
          let data = {}
          data.model = modelName().innerText;
          data.tokenLeft = tokenLeft().innerText;
          data.tokenPerMsg = botCost().innerText;
          callback(data)
          closeBtn().click();
        })
      })
    })
  })
}


window.addEventListener("beforeunload", function (event) {
  unregister();
});


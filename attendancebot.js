const TOKEN = '7950091328:AAGr2z8bH4JXTSwiFOYz0yup80gXvcZmGP4'; // Replace with your bot token
const SHEET_NAME = 'ACC_Attendance';
const DATA_SHEET_NAME = 'DATA_SHEET';
const GROUP_CHAT_ID = -1002704637403; // Replace with your group chat ID
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

// ⏰ Time Settings (24-hour format)
const REMINDER_TIME = "02:08"; // 7 AM reminder
const DEADLINE_TIME = "02:10"; // 8 AM deadline

// ===== MAIN FUNCTIONS =====
function doPost(e) {
  const update = JSON.parse(e.postData.contents);

  // 1. Handle /start command
  if (update.message?.text === '/start') {
    handleStartCommand(update.message);
  }

  // 2. Handle "Mark Attendance" button click
  else if (update.callback_query?.data === 'mark_attendance') {
    handleAttendanceButton(update.callback_query);
  }
}

// ===== HELPER FUNCTIONS =====
function handleStartCommand(msg) {
  const chatId = msg.chat.id;
  const fullName = getUserFullName(msg.from);

  sendMessage(chatId, `👋 ${fullName}, click below to mark attendance:`, [
    [{ text: "📍 Mark Attendance", callback_data: "mark_attendance" }]
  ]);
}

function handleAttendanceButton(callback) {
  const user = callback.from;
  const chatId = callback.message.chat.id;
  const messageId = callback.message.message_id; // Needed to delete the message
  const userId = user.id;
  const fullName = getUserFullName(user);
  const now = new Date();
  const currentTime = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm");
  const today = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");

  // 📛 Check if attendance is closed (after 8 AM)
  if (currentTime > DEADLINE_TIME) {
    answerCallbackwithalert(callback.id, `❌ ${fullName}, Sorry, attendance ⏰ closed at ${DEADLINE_TIME}.`);
    // sendMessage(chatId, `⏰ Sorry, attendance closed at ${DEADLINE_TIME}.`);
    sendMsgWithDelete(chatId, `⏰ Sorry, attendance closed at ${DEADLINE_TIME}.`);

    return;
  }

  // 🔄 Check if already marked attendance today
  const alreadyMarked = checkIfAlreadyMarked(userId, today);
  if (alreadyMarked) {
    answerCallbackwithalert(callback.id, `⚠️ ${fullName}, you already marked attendance today!`);
    return;
  }

  // ✅ Record attendance in Google Sheets
  const hashdata = crc32(userId + today).toString(16);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  sheet.appendRow([
    fullName,
    user.username || "N/A",
    userId,
    today,
    Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss"),
    currentTime <= DEADLINE_TIME ? "On Time" : "Late", // Status column
    hashdata
  ]);

  // 📩 Notify user & delete the original message with the button
  answerCallbackwithalert(callback.id, `✅ ${fullName}, attendance recorded! at ${currentTime}.`);
  // deleteMessage(chatId, messageId); // Delete the message with the button
  // sendMsgWithDelete(chatId, `📝 ${fullName}, you marked attendance at ${currentTime}.`);
  // sendMessage(chatId, `📝 ${fullName}, you marked attendance at ${currentTime}.`);

}

// ===== UTILITY FUNCTIONS =====
function getUserFullName(user) {
  return `${user.first_name || ""} ${user.last_name || ""}`.trim();
}

function checkIfAlreadyMarked(userId, dates) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const hashdata = crc32(userId + dates).toString(16);

  // Example usage
  // console.log("CRC32 Hex:", hashdata.toString(16));  // e.g. "1c291ca3"

  const isExist = data.some(row => {
    const rowhash = row[6]?.toString().toLowerCase().trim();
    console.log(rowhash);
    return rowhash === hashdata;
  });
  console.log(isExist);
  return isExist;
}

function sendMessage(chatId, text, keyboard = null) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML"
  };

  if (keyboard) {
    payload.reply_markup = JSON.stringify({ inline_keyboard: keyboard });
  }

  UrlFetchApp.fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  });
}

function sendMsgWithDelete(chatId, text, keyboard = null, delaySeconds = 5) {
  // Send the message
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML"
  };

  if (keyboard) {
    payload.reply_markup = JSON.stringify({ inline_keyboard: keyboard });
  }

  try {
    const response = UrlFetchApp.fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload)
    });

    const responseData = JSON.parse(response.getContentText());

    if (responseData.ok && responseData.result) {
      const messageId = responseData.result.message_id;

      // Add delay before deletion (in milliseconds)
      Utilities.sleep(delaySeconds * 500);

      // Delete the message after delay
      deleteMessage(chatId, messageId);

      return messageId;
    }
  } catch (e) {
    console.error("Error in sendMsgWithDelete:", e);
  }
  return null;
}

function deleteMessage(chatId, messageId) {
  UrlFetchApp.fetch(`${TELEGRAM_API}/deleteMessage`, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: chatId,
      message_id: messageId
    })
  });
}

function answerCallback(callbackId, text) {
  UrlFetchApp.fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      callback_query_id: callbackId,
      text: text,
      show_alert: false
    })
  });
}
function answerCallbackwithalert(callbackId, text) {
  UrlFetchApp.fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      callback_query_id: callbackId,
      text: text,
      show_alert: true
    })
  });
}
// ===== AUTO-REMINDER FUNCTION =====
function sendDailyReminder() {
  const now = new Date();
  const currentTime = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm");

  // Debug: Log current time to ensure it matches
  console.log(`Current time: ${currentTime}, Reminder time: ${REMINDER_TIME}`);

  // Only send reminder at exactly 7 AM
  if (currentTime === REMINDER_TIME) {
    const message = `📢 @everyone, it's time for class!\n\n` +
      `Click the button below to mark your attendance before ${DEADLINE_TIME}.`;

    sendMessage(GROUP_CHAT_ID, message, [
      [{ text: "📍 Mark Attendance", callback_data: "mark_attendance" }]
    ]);
  }
}
function crc32(str) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ str.charCodeAt(i)) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

const table = (() => {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }
  return table;
})();

// ===== SETUP WEBHOOK =====
function setWebhook() {
  const webhookUrl = ScriptApp.getService().getUrl();
  UrlFetchApp.fetch(`${TELEGRAM_API}/setWebhook?url=${webhookUrl}`);
}
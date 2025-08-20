const TOKEN = '7950091328:AAGr2z8bH4JXTSwiFOYz0yup80gXvcZmGP4';
const ATTENDANCE_SHEET_NAME = 'ACC_Attendance';
const SETTINGS_SHEET_NAME = 'Group_Settings';
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const ONE_HOUR_IN_SECONDS = 3600;

// CRC32 Table for hash generation
const CRC32_TABLE = (() => {
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

// ===== MAIN FUNCTIONS =====
function doPost(e) {
  try {
    const update = JSON.parse(e.postData.contents);

    if (update.message?.text === '/start' || update.message?.text === '/start@alp_attendance_bot') {
      handleStartCommand(update.message);
    }
    else if (update.message?.text === '/info' || update.message?.text === '/info@alp_attendance_bot') {
      handleStartCommand(update.message);
    }
    else if (update.message?.text === '/startsign' || update.message?.text === '/startsign@alp_attendance_bot') {
      handleStartSignCommand(update.message);
    }
    else if (update.message?.text === '/startsignout' || update.message?.text === '/startsignout@alp_attendance_bot') {
      handleStartSignCommand(update.message);
    }
    else if (update.message?.text === '/timetable' || update.message?.text === '/timetable@alp_attendance_bot') {
      handleStartCommand(update.message);
    }
    else if (update.callback_query) {
      if (update.callback_query.data === 'sign_in') {
        handleSignIn(update.callback_query);
      }
      else if (update.callback_query.data === 'sign_out') {
        handleSignOut(update.callback_query);
      }
    }
  } catch (e) {
    console.error("Error in doPost:", e);
  }
}
function handleStartSignCommand(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const settings = getGroupSettings(chatId);

  if (!settings) {
    sendMessage(chatId, "❌ This group is not configured for attendance tracking.");
    deleteMessage(chatId, msg.message_id);
    return;
  }

  // Check if user is a teacher
  if (!settings.teacherIds.includes(userId.toString())) {
    let replyMessage = sendMessage(chatId, "⛔ Only teachers can start attendance!");
    deleteMessage(chatId, msg.message_id);
    deleteMessage(chatId, replyMessage.message_id);
    return;
  }

  const now = new Date();
  const currentTime = formatTimeForSheet(Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm"));
  const fullName = getUserFullName(msg.from);
  const cache = CacheService.getScriptCache();

  // Calculate end times based on settings
  const signInEndTime = addMinutes(currentTime, settings.signInDelay);
  const signOutEndTime = addMinutes(currentTime, settings.signOutDelay);
  // Check if the message contains "out" to start sign-out instead
  if (msg?.text === '/startsignout' || msg?.text === '/startsignout@alp_attendance_bot') {
    cache.put(`manual_sign_active_${chatId}`, "out", ONE_HOUR_IN_SECONDS);
    cache.put(`manual_signout_end_${chatId}`, signOutEndTime, ONE_HOUR_IN_SECONDS);

    sendMessage(chatId,
      `📢 @everyone\n` +
      `🚪 <b>MANUAL SIGN-OUT STARTED</b> by teacher ${fullName}\n\n` +
      `📍 Sign-out will be open for ${settings.signOutDelay} minutes!\n` +
      `Click below to sign out:`,
      [[{ text: "📍 Sign Out", callback_data: "sign_out" }]]
    );
    deleteMessage(chatId, msg.message_id);
    return;
  }
  // Store in cache what we're starting (sign-in or sign-out)
  cache.put(`manual_sign_active_${chatId}`, "in", ONE_HOUR_IN_SECONDS); // 6 hours
  cache.put(`manual_sign_end_${chatId}`, signInEndTime, ONE_HOUR_IN_SECONDS);

  sendMessage(chatId,
    `📢 @everyone\n` +
    `✅ <b>MANUAL SIGN-IN STARTED</b> by teacher ${fullName}\n\n` +
    `📍 Sign-in will be open for ${settings.signInDelay} minutes!\n` +
    `Click below to sign in:`,
    [[{ text: "📍 Sign In", callback_data: "sign_in" }]]
  );

  // Delete teacher's command
  deleteMessage(chatId, msg.message_id);
}

// ===== CORE FUNCTIONALITY =====
function handleStartCommand(msg) {
  const chatId = msg.chat.id;
  const settings = getGroupSettings(chatId);

  if (!settings) {
    sendMessage(chatId, "❌ Sorry This Group/Chat is not configured for attendance tracking.");
    return;
  }
  if (msg?.text === '/info' || msg?.text === '/info@alp_attendance_bot') {
    const cache = CacheService.getScriptCache();
    const lastInfoMsgId = cache.get(`last_info_${chatId}`);

    // Delete the bot's previous /info response (if exists)
    if (lastInfoMsgId) {
      deleteMessage(chatId, lastInfoMsgId);
      Utilities.sleep(500); // Short delay to ensure deletion
    }
    deleteMessage(chatId, msg.message_id);

    let infomsg = `👋 <b>Hello amazing students!</b>\n\n` +

      `I’m <b>ALP Attendance Bot</b>, your smart assistant for keeping track of class attendance 📚✨\n\n` +

      `I’m here to help you easily sign in and sign out during your lessons - no stress, no paperwork!\n` +
      `Just follow the steps below:\n\n` +

      `✅ <b>To Sign In:</b>\n` +
      `Click the button I’ll send when class starts (within the first few minutes ⏰).\n` +
      `You’ll see a <b>📍 Sign In</b> button - just tap it!\n\n` +

      `✅ <b>To Sign Out:</b>\n` +
      `At the end of class, I’ll send another message with a <b>📍 Sign Out</b> button.\n` +
      `Tap it during the sign-out window to complete your attendance.\n\n` +

      `⚠️ <b>Note:</b>\n` +
      `• You can only sign in <i>during the allowed sign-in time</i>.\n` +
      `• You can only sign out <i>at the end of the class</i>, during the last few minutes.\n` +
      `• If you miss any step, your attendance won’t count for the day 😔\n\n` +

      `💡 <b>Need help?</b>\n` +
      `Just type <code>/info</code> and I’ll guide you again!\n\n` +

      `🤖 <b>Availabe Commands:</b> \n` +
      `• <code>/info</code>, Guide.\n` +
      `• <code>/start</code>, Start The Bot.\n` +
      `• <code>/timetable</code>, Timetable.\n` +
      `• <code>/startsign</code>, (Only Teachers) \n` +
      `• <code>/startsignout</code>, (Only Teachers)\n\n` +
      /*
      /start - Start The Bot
      /info - Guide
      /timetable - View Class Timetable
      /startsign - Start Manual Sign-In (Only Teachers)
      /startsignout - Start Manual Sign-Out (Only Teachers)
      */
      `Let’s have a great learning experience together 🚀\n` +
      `Sit tight and I’ll let you know when it’s time to take action 🕓\n\n` +

      `- With care,\n` +
      `<b>ALP Attendance Bot 🤖💙</b>\n\n` +

      `📩 <b>For more info or assistance:</b> <a href="https://t.me/Thedevdanalmag">Dev. Abdullmajeed</a>`;
    const sentMessage = sendMessage(chatId, infomsg);

    // Store the new message_id in cache (expires in 6 hours)
    if (sentMessage && sentMessage.message_id) {
      cache.put(`last_info_${chatId}`, sentMessage.message_id.toString(), ONE_HOUR_IN_SECONDS); // 6h cache
    }
    return;
  }
  if (msg?.text === '/timetable' || msg?.text === '/timetable@alp_attendance_bot') {
    const cache = CacheService.getScriptCache();
    const lastTimetableMsgId = cache.get(`last_timetable_${chatId}`);
    // Delete the bot's previous /timetable response (if exists)
    if (lastTimetableMsgId) {
      deleteMessage(chatId, lastTimetableMsgId);
      Utilities.sleep(500); // Short delay to ensure deletion
    }
    deleteMessage(chatId, msg.message_id);
    const timetableMsg = getFormattedTimetable(settings);
    const senttMessage = sendMessage(chatId, timetableMsg);
    // Store the new message_id in cache (expires in 6 hours)
    if (senttMessage && senttMessage.message_id) {
      cache.put(`last_timetable_${chatId}`, senttMessage.message_id.toString(), ONE_HOUR_IN_SECONDS); // 6h cache
    }
    return;
  }
  // If not info or timetable, proceed with normal start command
  const now = new Date();
  const currentTime = formatTimeForSheet(Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm"));
  const fullName = getUserFullName(msg.from);

  // Calculate time windows
  const signInEndTime = addMinutes(settings.startTime, settings.signInDelay);
  const signOutStartTime = subtractMinutes(settings.endTime, settings.signOutDelay);
  const cache = CacheService.getScriptCache();
  const manualActive = cache.get(`manual_sign_active_${chatId}`);
  const manualEndTime = cache.get(`manual_sign_end_${chatId}`);
  const laststartres = cache.get(`last_start_res_${chatId}`);
  console.log("Last cached message ID:", laststartres); // Debug cache

  // Delete bot's previous response (if exists)
  if (laststartres) {
    console.log("Attempting to delete previous message:", laststartres);
    deleteMessage(chatId, laststartres);
    Utilities.sleep(500); // Ensure deletion completes
  }

  // Delete user's /start command (optional)
  try {
    deleteMessage(chatId, msg.message_id);
  } catch (e) {
    console.error("Failed to delete user message:", e);
  }

  let message = `👋 ${fullName} (${settings.course})\n\n`;

  if (manualActive === "in") {
    if (compareTimes(currentTime, manualEndTime) > 0) {
      const replyMessage = sendMessage(chatId, "⏳ Manual sign-in period has ended!");
      deleteMessage(chatId, msg.message_id);
      if (replyMessage && replyMessage.message_id) {
        cache.put(`last_start_res_${chatId}`, replyMessage.message_id.toString(), ONE_HOUR_IN_SECONDS);
      }
      return;
    }
    message += `✅ <b>MANUAL SIGN-IN ACTIVE</b>\n\n` +
      `📍 Sign-in is open for ${settings.signInDelay} minutes!\n` +
      `Click below to sign in:`;
    const replyMessage = sendMessage(chatId, message, [[{ text: "📍 Sign In", callback_data: "sign_in" }]]);
    if (replyMessage && replyMessage.message_id) {
      cache.put(`last_start_res_${chatId}`, replyMessage.message_id.toString(), ONE_HOUR_IN_SECONDS);
    }
    return;
  }
  else if (manualActive === "out") {
    if (compareTimes(currentTime, manualEndTime) > 0) {
      const replyMessage = sendMessage(chatId, "⏳ Manual sign-out period has ended!");
      deleteMessage(chatId, msg.message_id);
      if (replyMessage && replyMessage.message_id) {
        cache.put(`last_start_res_${chatId}`, replyMessage.message_id.toString(), ONE_HOUR_IN_SECONDS);
      }
      return;
    }
    message += `🚪 <b>MANUAL SIGN-OUT ACTIVE</b>\n\n` +
      `📍 Sign-out is open for ${settings.signOutDelay} minutes!\n` +
      `Click below to sign out:`;
    const replyMessage = sendMessage(chatId, message, [
      [{ text: "📍 Sign Out", callback_data: "sign_out" }]
    ]);
    if (replyMessage && replyMessage.message_id) {
      cache.put(`last_start_res_${chatId}`, replyMessage.message_id.toString(), ONE_HOUR_IN_SECONDS);
    }
    return;
  }

  // Default message when no manual activity is active
  message += `📍 <b>ATTENDANCE NOT ACTIVE</b>\n\n` +
    `⏰ Class starts at ${removeHash(settings.startTime)}\n` +
    `🔴 Class ends at ${removeHash(settings.endTime)}\n\n` +
    `✅ Sign-In opens for ${settings.signInDelay} minutes \n` +
    `🚪 Sign-Out opens for ${settings.signOutDelay} minutes \n` +
    `📅 Class Days: ${getDayEmojis(settings.days)}\n\n` +
    `👨‍🏫 Teacher: ${settings.teacher}\n\n` +
    `Available Commands:\n` +
    `• /start - Start the Bot\n` +
    `• /info - Get Help and Info\n` +
    `• /startsign - Start Manual Sign-In (Only Teachers)\n` +
    `• /startsignout - Start Manual Sign-Out (Only Teachers)\n` +
    `• /timetable - View Class Timetable\n\n` +
    `⚠️ Note: You can only sign in during the allowed sign-in time and sign out at the end of class.`;

  const replyMessage = sendMessage(chatId, message);
  if (replyMessage && replyMessage.message_id) {
    cache.put(`last_start_res_${chatId}`, replyMessage.message_id.toString(), ONE_HOUR_IN_SECONDS);
  }
}

function handleSignIn(callback) {
  const user = callback.from;
  const chatId = callback.message.chat.id;
  const messageId = callback.message.message_id;
  const settings = getGroupSettings(chatId);

  if (!settings) {
    answerCallbackWithAlert(callback.id, "❌ Group configuration error");
    deleteMessage(chatId, messageId);
    return;
  }
  const cache = CacheService.getScriptCache();
  const manualActive = cache.get(`manual_sign_active_${chatId} `);
  const manualEndTime = cache.get(`manual_sign_end_${chatId} `);

  // If in manual mode, check if still within allowed time
  if (manualActive === "in") {
    const now = new Date();
    const currentTime = formatTimeForSheet(Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm"));

    if (compareTimes(currentTime, manualEndTime) > 0) {
      answerCallbackWithAlert(callback.id, "⏳ Manual sign-in period has ended!");
      return;
    }
    // Skip normal time checks if in manual mode
  }

  // Check if attendance is active
  if (!manualActive) {
    answerCallbackWithAlert(callback.id, "⏳ Attendance hasn't been started yet by the teacher.");
    return;
  }
  const now = new Date();
  const currentTime = formatTimeForSheet(Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm"));
  const today = formatDateForSheet(Utilities.formatDate(now, Session.getScriptTimeZone(), "dd-MM-yyyy"));
  const fullName = getUserFullName(user);
  const signInEndTime = addMinutes(settings.startTime, settings.signInDelay);

  // Time validation
  // if (compareTimes(currentTime, settings.startTime) < 0 || compareTimes(currentTime, signInEndTime) > 0) {
  //   answerCallbackWithAlert(callback.id, `❌ ${ fullName }, Sign - In closed!(Only first ${ settings.signInDelay } min)`);
  //   deleteMessage(chatId, messageId);
  //   return;
  // }

  // Check for existing sign-in
  const existingRecord = findAttendanceRecord(user.id, today, chatId);
  if (existingRecord && existingRecord.signedInTime) {
    answerCallbackWithAlert(callback.id, `⚠️ ${fullName}, You already signed in today at ${removeHash(existingRecord.signedInTime)} !`);
    return;
  }

  // Record sign-in
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ATTENDANCE_SHEET_NAME);
  const timestamp = formatTimeForSheet(Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"));

  if (existingRecord) {
    // Update existing incomplete record
    sheet.getRange(existingRecord.row, 1).setValue(timestamp);
    sheet.getRange(existingRecord.row, 8).setValue(currentTime);
    sheet.getRange(existingRecord.row, 10).setValue("Signed In");
  } else {
    // Create new record
    sheet.appendRow([
      timestamp,               // Timestamp
      fullName,                // Name
      user.username || "N/A",  // Username
      user.id,                // Telegram ID
      today,                  // Date
      settings.course,        // Course
      chatId,                 // Group ID
      currentTime,            // Signed In Time
      "",                     // Sign Out Time (empty)
      "Signed In",            // Status
      ""                      // Hash (empty)
    ]);
  }

  answerCallbackWithAlert(callback.id, `✅ ${fullName}, Sign - In recorded at ${removeHash(currentTime)} `);
}

function handleSignOut(callback) {
  const user = callback.from;
  const chatId = callback.message.chat.id;
  const messageId = callback.message.message_id;
  const settings = getGroupSettings(chatId);

  if (!settings) {
    answerCallbackWithAlert(callback.id, "❌ Group configuration error");
    deleteMessage(chatId, messageId);
    return;
  }

  const now = new Date();
  const currentTime = formatTimeForSheet(Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm"));
  const today = formatDateForSheet(Utilities.formatDate(now, Session.getScriptTimeZone(), "dd-MM-yyyy"));
  const fullName = getUserFullName(user);
  const signOutStartTime = subtractMinutes(settings.endTime, settings.signOutDelay);

  const cache = CacheService.getScriptCache();
  const manualActive = cache.get(`manual_sign_active_${chatId} `);
  const manualEndTime = cache.get(`manual_signout_end_${chatId} `);

  // If in manual mode, check if still within allowed time
  if (manualActive === "out") {
    if (compareTimes(currentTime, manualEndTime) > 0) {
      answerCallbackWithAlert(callback.id, "⏳ Manual sign-in period has ended!");
      return;
    }
    // Skip normal time checks if in manual mode
  }

  // Check if attendance is active
  if (!manualActive) {
    answerCallbackWithAlert(callback.id, "⏳ Attendance hasn't been started yet by the teacher.");
    return;
  }
  // Time validation
  // if (compareTimes(currentTime, signOutStartTime) < 0 || compareTimes(currentTime, settings.endTime) > 0) {
  //   answerCallbackWithAlert(callback.id, `❌ ${ fullName }, Sign - Out not available yet!(Last ${ settings.signOutDelay } min)`);
  //   deleteMessage(chatId, messageId);
  //   return;
  // }

  // Find existing record
  const existingRecord = findAttendanceRecord(user.id, today, chatId);
  if (!existingRecord) {
    answerCallbackWithAlert(callback.id, `❌ ${fullName}, You must sign in first!`);
    // deleteMessage(chatId, messageId);
    return;
  }

  if (existingRecord.signOutTime) {
    answerCallbackWithAlert(callback.id, `⚠️ ${fullName}, You already signed out today at ${removeHash(existingRecord.signOutTime)} !`);
    return;
  }

  // Generate hash and update record
  const uniqueHash = generateAttendanceHash(user.id, today, chatId);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ATTENDANCE_SHEET_NAME);

  sheet.getRange(existingRecord.row, 9).setValue(currentTime); // Sign Out Time
  sheet.getRange(existingRecord.row, 10).setValue("Completed"); // Status
  sheet.getRange(existingRecord.row, 11).setValue(uniqueHash); // Hash

  answerCallbackWithAlert(callback.id, `✅ ${fullName}, Sign - Out recorded at ${removeHash(currentTime)} \nAttendance complete!`);
}

// ===== HELPER FUNCTIONS =====
function getGroupSettings(chatId) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTINGS_SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[4] == chatId) {
        return {
          course: row[0],
          startTime: formatTimeForSheet(String(row[1])),
          endTime: formatTimeForSheet(String(row[2])),
          reminderTime: formatTimeForSheet(String(row[3])),
          groupId: row[4],
          signInDelay: parseInt(row[5]) || 5,
          signOutDelay: parseInt(row[6]) || 5,
          days: String(row[7]),
          teacher: String(row[8]),
          teacherIds: String(row[9]).split(',').map(id => id.trim()) // New column for teacher IDs
        };
      }
    }
    return null;
  } catch (e) {
    console.error("Error in getGroupSettings:", e);
    return null;
  }
}
function findAttendanceRecord(userId, date, groupId) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ATTENDANCE_SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[3] == userId && row[4] == date && row[6] == groupId) {
        return {
          row: i + 1,
          signedInTime: row[7],
          signOutTime: row[8],
          status: row[9],
          hash: row[10]
        };
      }
    }
    return null;
  } catch (e) {
    console.error("Error in findAttendanceRecord:", e);
    return null;
  }
}

function formatTimeForSheet(timeStr) {
  return `#${timeStr.replace(/^#/, '')} `;
}

function formatDateForSheet(dateStr) {
  return `#${dateStr.replace(/^#/, '')} `;
}

function removeHash(value) {
  return String(value).replace(/^#/, '');
}

function generateAttendanceHash(userId, date, groupId) {
  const uniqueString = `${userId}| ${removeHash(date)}| ${groupId} `;
  return crc32(uniqueString).toString(16);
}

function crc32(str) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ str.charCodeAt(i)) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function compareTimes(time1, time2) {
  const t1 = removeHash(time1).replace(/:/g, '');
  const t2 = removeHash(time2).replace(/:/g, '');
  return parseInt(t1) - parseInt(t2);
}

function addMinutes(timeStr, minutes) {
  const [hours, mins] = removeHash(timeStr).split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins + minutes, 0, 0);
  return formatTimeForSheet(Utilities.formatDate(date, Session.getScriptTimeZone(), "HH:mm"));
}

function subtractMinutes(timeStr, minutes) {
  return addMinutes(timeStr, -minutes);
}

function getUserFullName(user) {
  return `${user.first_name || ""} ${user.last_name || ""} `.trim();
}

function sendMessage(chatId, text, keyboard = null) {
  try {
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: "HTML"
    };

    if (keyboard) {
      payload.reply_markup = JSON.stringify({ inline_keyboard: keyboard });
    }

    const response = UrlFetchApp.fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload)
    });

    const responseData = JSON.parse(response.getContentText());
    return responseData.result; // Contains message_id
  } catch (e) {
    console.error("Error in sendMessage:", e);
    return null;
  }
}

function deleteMessage(chatId, messageId) {
  try {
    UrlFetchApp.fetch(`${TELEGRAM_API}/deleteMessage`, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        chat_id: chatId,
        message_id: messageId
      })
    });
  } catch (e) {
    console.error("Error in deleteMessage:", e);
  }
}

function answerCallbackWithAlert(callbackId, text) {
  try {
    UrlFetchApp.fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        callback_query_id: callbackId,
        text: text,
        show_alert: true
      })
    });
  } catch (e) {
    console.error("Error in answerCallbackWithAlert:", e);
  }
}

// ===== AUTOMATED REMINDERS =====
function sendDailyReminders() {
  try {
    const now = new Date();
    const currentTime = formatTimeForSheet(Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm"));
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTINGS_SHEET_NAME);
    const groups = sheet.getDataRange().getValues();

    for (let i = 1; i < groups.length; i++) {
      const group = groups[i];
      const settings = {
        course: group[0],
        startTime: formatTimeForSheet(String(group[1])),
        endTime: formatTimeForSheet(String(group[2])),
        reminderTime: formatTimeForSheet(String(group[3])),
        groupId: group[4],
        signInDelay: parseInt(group[5]) || 5,
        signOutDelay: parseInt(group[6]) || 5,
        days: String(group[7]),
        teacher: String(group[8])
      };
      // testing(settings.groupId);
      let classDays = settings.days;
      let classDaysArray = classDays.split(",").map(day => day.trim());
      const today = Utilities.formatDate(now, Session.getScriptTimeZone(), "EEEE");
      if (!classDaysArray.includes(today)) {
        Logger.log("No Class Today for group: " + settings.groupId);
        continue;  // Skip this group but continue with others
      }

      // // Send sign-out reminder at exact reminder time
      if (removeHash(currentTime) === removeHash(settings.reminderTime)) {
        let message = "📚 Good day, amazing students!\n\nToday is <b>" + today +
          "</b>, and we have our scheduled class with " + settings.teacher + ".\n\n" +
          "🕒 <b>Class Time:</b> " + removeHash(settings.startTime) + "\n\n" +
          "📍 <b>Teacher:</b> Please use /startattendance when ready to begin.\n" +
          "Students, for Attendace please wait for the teacher to start attendance.";

        sendMessage(settings.groupId, message);
      }


      // // Send sign-in reminder at exact start time
      // if (removeHash(currentTime) === removeHash(settings.startTime)) {
      //   sendMessage(settings.groupId,
      //     `📢 @everyone (${settings.course})\n\n` +
      //     `⏰ Sign-In open for ${settings.signInDelay} minutes!\n` +
      //     `Click below to sign in:`,
      //     [[{ text: "📍 Sign In", callback_data: "sign_in" }]]
      //   );
      // }


      // // Send actual sign-out message at calculated time
      // const signOutStartTime = subtractMinutes(settings.endTime, settings.signOutDelay);
      // if (removeHash(currentTime) === removeHash(signOutStartTime)) {
      //   sendMessage(settings.groupId,
      //     `📢 @everyone (${settings.course})\n\n` +
      //     `⏰ Sign-Out open for ${settings.signOutDelay} minutes!\n` +
      //     `Click below to sign out:`,
      //     [[{ text: "📍 Sign Out", callback_data: "sign_out" }]]
      //   );
      // }
    }
  } catch (e) {
    console.error("Error in sendDailyReminders:", e);
  }
}
function getFormattedTimetable(settings) {
  const signOutStartTime = subtractMinutes(settings.endTime, settings.signOutDelay);

  return `📅 <b>${settings.course} Timetable</b> 📅\n\n` +
    `⏰ <b>Class Hours</b>\n` +
    `🟢 Start: ${removeHash(settings.startTime)}\n` +
    `🔴 End: ${removeHash(settings.endTime)}\n\n` +

    `📝 <b>Attendance Windows</b> \n\n` +
    `✅ Sign-In: First ${settings.signInDelay} mins after start\n` +
    `   └ ${removeHash(settings.startTime)} - ${removeHash(addMinutes(settings.startTime, settings.signInDelay))}\n\n` +

    `🚪 Sign-Out: Last ${settings.signOutDelay} mins before end\n` +
    `   └ ${removeHash(signOutStartTime)} - ${removeHash(settings.endTime)}\n\n` +

    `📅 <b>Class Days</b> \n` +
    `${getDayEmojis(settings.days)}\n\n` +

    `👨‍🏫 <b>Teacher</b> ${settings.teacher}\n` +
    `⚙️ Use /startsign to begin attendance early`;
}

function getDayEmojis(daysString) {
  const days = daysString.split(',').map(d => d.trim());
  const dayEmojis = {
    'Monday': '📅 Monday',
    'Tuesday': '📅 Tuesday',
    'Wednesday': '📅 Wednesday',
    'Thursday': '📅 Thursday',
    'Friday': '📅 Friday',
    'Saturday': '📅 Saturday',
    'Sunday': '📅 Sunday'
  };

  return days.map(day => dayEmojis[day] || day).join(' • ');
}
// ===== SETUP FUNCTIONS =====
function setWebhook() {
  try {
    const webhookUrl = ScriptApp.getService().getUrl();
    const response = UrlFetchApp.fetch(`${TELEGRAM_API}/setWebhook?url=${webhookUrl}`);
    console.log("Webhook setup response:", response.getContentText());
  } catch (e) {
    console.error("Error in setWebhook:", e);
  }
}
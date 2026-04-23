// ─── HELPERS ────────────────────────────────────────────────────────────────

function ok(data) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function err(msg) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Returns all messages from a search query (flattens threads)
function fetchMessages(query, maxThreads) {
  var threads = GmailApp.search(query, 0, maxThreads || 50);
  var messages = [];
  threads.forEach(function(thread) {
    thread.getMessages().forEach(function(msg) {
      messages.push(msg);
    });
  });
  return messages;
}

// ─── LIST ENDPOINTS ──────────────────────────────────────────────────────────

// GET /emailsreceived — all emails in inbox (received, not sent by you)
function getEmailsReceived() {
  try {
    var msgs = fetchMessages('in:inbox', 50);
    var result = msgs.map(function(msg) {
      return {
        messageId: msg.getId(),
        from:      msg.getFrom(),
        to:        msg.getTo(),
        subject:   msg.getSubject(),
        snippet:   msg.getPlainBody().substring(0, 200),
        date:      msg.getDate().toISOString(),
        isRead:    !msg.isUnread()
      };
    });
    return ok({ count: result.length, messages: result });
  } catch(e) { return err(e.toString()); }
}

// GET /emailsanswered — emails you replied to (sent replies)
function getEmailsAnswered() {
  try {
    var msgs = fetchMessages('in:sent', 50);
    var result = msgs.map(function(msg) {
      return {
        messageId: msg.getId(),
        to:        msg.getTo(),
        subject:   msg.getSubject(),
        snippet:   msg.getPlainBody().substring(0, 200),
        date:      msg.getDate().toISOString()
      };
    });
    return ok({ count: result.length, messages: result });
  } catch(e) { return err(e.toString()); }
}

// ─── NUMBER ENDPOINTS ────────────────────────────────────────────────────────

// GET /pendingEmails — count of unread inbox emails with no reply
function getPendingEmails() {
  try {
    var receivedMsgs = fetchMessages('in:inbox is:unread', 100);
    var sentMsgs     = fetchMessages('in:sent', 100);

    // Build a set of thread IDs you've already replied to
    var repliedThreadIds = {};
    sentMsgs.forEach(function(msg) {
      repliedThreadIds[msg.getThread().getId()] = true;
    });

    var pending = receivedMsgs.filter(function(msg) {
      return !repliedThreadIds[msg.getThread().getId()];
    });

    return ok({ pendingCount: pending.length });
  } catch(e) { return err(e.toString()); }
}

// GET /avgResponseTime — average time (ms) between received email and your reply
function getAvgResponseTime() {
  try {
    var times = _collectResponseTimes(50);
    if (!times.length) return ok({ avgResponseTimeMs: null, avgResponseTimeHours: null, sampleSize: 0 });
    var avg = times.reduce(function(a, b) { return a + b; }, 0) / times.length;
    return ok({ avgResponseTimeMs: avg, avgResponseTimeHours: +(avg / 3600000).toFixed(2), sampleSize: times.length });
  } catch(e) { return err(e.toString()); }
}

// GET /medianResponseTime — median time (ms) between received email and your reply
function getMedianResponseTime() {
  try {
    var times = _collectResponseTimes(50);
    if (!times.length) return ok({ medianResponseTimeMs: null, medianResponseTimeHours: null, sampleSize: 0 });
    times.sort(function(a, b) { return a - b; });
    var mid    = Math.floor(times.length / 2);
    var median = times.length % 2 === 0 ? (times[mid - 1] + times[mid]) / 2 : times[mid];
    return ok({ medianResponseTimeMs: median, medianResponseTimeHours: +(median / 3600000).toFixed(2), sampleSize: times.length });
  } catch(e) { return err(e.toString()); }
}

// Shared helper: finds threads where you replied, returns array of delay values (ms)
function _collectResponseTimes(maxThreads) {
  var userEmail = Session.getEffectiveUser().getEmail();
  var threads   = GmailApp.search('in:inbox', 0, maxThreads);
  var times     = [];

  threads.forEach(function(thread) {
    var msgs      = thread.getMessages();
    var received  = null;
    var repliedAt = null;

    msgs.forEach(function(msg) {
      var from = msg.getFrom();
      if (!received && from.indexOf(userEmail) === -1) {
        received = msg.getDate();
      }
      if (received && from.indexOf(userEmail) !== -1) {
        repliedAt = msg.getDate();
      }
    });

    if (received && repliedAt) {
      times.push(repliedAt.getTime() - received.getTime());
    }
  });

  return times;
}

// GET /volumeTrend — email count received per day for the last 14 days
function getVolumeTrend() {
  try {
    var days = 14;
    var now  = new Date();
    var buckets = {};

    // Initialise all days to 0
    for (var i = 0; i < days; i++) {
      var d = new Date(now);
      d.setDate(now.getDate() - i);
      buckets[_dateKey(d)] = 0;
    }

    var msgs = fetchMessages('in:inbox newer_than:14d', 200);
    msgs.forEach(function(msg) {
      var key = _dateKey(msg.getDate());
      if (buckets.hasOwnProperty(key)) buckets[key]++;
    });

    // Return as sorted array
    var trend = Object.keys(buckets).sort().map(function(date) {
      return { date: date, count: buckets[date] };
    });

    return ok({ days: days, trend: trend });
  } catch(e) { return err(e.toString()); }
}

// GET /responseRateTrend — % of threads replied to, per day, for the last 14 days
function getResponseRateTrend() {
  try {
    var days      = 14;
    var now       = new Date();
    var userEmail = Session.getEffectiveUser().getEmail();

    var received  = {}; // date → count
    var replied   = {}; // date → count

    for (var i = 0; i < days; i++) {
      var d = new Date(now);
      d.setDate(now.getDate() - i);
      var k = _dateKey(d);
      received[k] = 0;
      replied[k]  = 0;
    }

    var threads = GmailApp.search('in:inbox newer_than:14d', 100);
    threads.forEach(function(thread) {
      var msgs          = thread.getMessages();
      var firstReceived = null;
      var hasReply      = false;

      msgs.forEach(function(msg) {
        var from = msg.getFrom();
        if (!firstReceived && from.indexOf(userEmail) === -1) {
          firstReceived = msg.getDate();
        }
        if (firstReceived && from.indexOf(userEmail) !== -1) {
          hasReply = true;
        }
      });

      if (firstReceived) {
        var key = _dateKey(firstReceived);
        if (received.hasOwnProperty(key)) {
          received[key]++;
          if (hasReply) replied[key]++;
        }
      }
    });

    var trend = Object.keys(received).sort().map(function(date) {
      var r = received[date];
      return {
        date:         date,
        received:     r,
        replied:      replied[date],
        responseRate: r > 0 ? +((replied[date] / r) * 100).toFixed(1) : null
      };
    });

    return ok({ days: days, trend: trend });
  } catch(e) { return err(e.toString()); }
}

// GET /busiestHours — email volume by hour of day (0–23), last 30 days
function getBusiestHours() {
  try {
    var hours = new Array(24).fill(0);
    var msgs  = fetchMessages('in:inbox newer_than:30d', 300);

    msgs.forEach(function(msg) {
      var h = msg.getDate().getHours();
      hours[h]++;
    });

    var result = hours.map(function(count, h) {
      return { hour: h, label: _hourLabel(h), count: count };
    });

    result.sort(function(a, b) { return b.count - a.count; });
    var peak = result[0];
    result.sort(function(a, b) { return a.hour - b.hour; });

    return ok({ hourly: result, peakHour: peak });
  } catch(e) { return err(e.toString()); }
}

// ─── SMALL UTILITIES ─────────────────────────────────────────────────────────

function _dateKey(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function _hourLabel(h) {
  if (h === 0)  return '12 AM';
  if (h < 12)   return h + ' AM';
  if (h === 12) return '12 PM';
  return (h - 12) + ' PM';
}

// ─── UPDATED ROUTER ──────────────────────────────────────────────────────────

function doGet(e) {
  var action = e.parameter.action;

  switch (action) {
    // existing
    case 'unread':          return getUnread();
    case 'read':            return getAllRead();
    case 'message':         return getMessageById(e);
    // new list endpoints
    case 'emailsreceived':  return getEmailsReceived();
    case 'emailsanswered':  return getEmailsAnswered();
    // new number endpoints
    case 'pendingEmails':        return getPendingEmails();
    case 'avgResponseTime':      return getAvgResponseTime();
    case 'medianResponseTime':   return getMedianResponseTime();
    case 'volumeTrend':          return getVolumeTrend();
    case 'responseRateTrend':    return getResponseRateTrend();
    case 'busiestHours':         return getBusiestHours();
    default:
      return err('Unknown action: ' + action);
  }
}

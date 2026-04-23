function getUnread() {
  try {
    var threads = GmailApp.search('is:unread', 0, 20);
    var messages = [];

    threads.forEach(function(thread) {
      thread.getMessages().forEach(function(message) {
         
          messages.push({
            messageId: message.getId(),
            threadId: thread.getId(),
            from: message.getFrom(),
            to: message.getTo(),
            subject: message.getSubject(),
            snippet: message.getPlainBody().substring(0, 200),
            body: message.getBody(),
            date: message.getDate().toISOString(),
            isRead: false
          });
        
      });
    });

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, count: messages.length, messages: messages })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error fetching unread emails: ' + error);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}


function getAllRead() {
  try {
    var threads = GmailApp.search('is:read', 0, 20);
    var messages = [];

    threads.forEach(function(thread) {
      thread.getMessages().forEach(function(message) {

          messages.push({
            messageId: message.getId(),
            threadId: thread.getId(),
            from: message.getFrom(),
            to: message.getTo(),
            subject: message.getSubject(),
            snippet: message.getPlainBody().substring(0, 200),
            body: message.getBody(),
            date: message.getDate().toISOString(),
            isRead: true
          });
        
      });
    });

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, count: messages.length, messages: messages })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error fetching read emails: ' + error);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function getMessageById(e) {
  try {
    var messageId = e.parameter.messageId;

    if (!messageId) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Missing required parameter: messageId' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var message = GmailApp.getMessageById(messageId);

    if (!message) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Message not found with ID: ' + messageId })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var thread = message.getThread();

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: {
          messageId: message.getId(),
          threadId: thread.getId(),
          from: message.getFrom(),
          to: message.getTo(),
          subject: message.getSubject(),
          snippet: message.getPlainBody().substring(0, 200),
          body: message.getBody(),
          date: message.getDate().toISOString(),
          isRead: !message.isUnread()
        }
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error fetching message by ID: ' + error);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}


function doReply(e) {
  try {
    Logger.log('Received POST request with data: ' + e.postData.contents);
    var data = JSON.parse(e.postData.contents);

    var messageId = data.messageId;
    var replyBody = data.replyBody;

    var originalMessage = GmailApp.getMessageById(messageId);

    if (!originalMessage) {
      Logger.log('Message not found with ID: ' + messageId);
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Message not found' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    originalMessage.reply(replyBody);

    Logger.log('Reply sent successfully');
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: 'Reply sent successfully' })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error sending reply: ' + error);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}


// Router — handles GET requests by ?action= param
function doGet(e) {
  var action = e.parameter.action;

  if (action === 'unread') {
    return getUnread();
  } else if (action === 'read') {
    return getAllRead();
  } else if (action === 'message') {
    return getMessageById(e);
  } else {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: 'Unknown action. Use ?action=unread, ?action=read, or ?action=message&messageId=...' })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}


// Router — handles POST requests by action field in body
function doPost(e) {
  try {
    var action = e.parameter.action;

    if (action === 'reply') {
      return doReply(e);
    } else {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Unknown action. Use action: "reply"' })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
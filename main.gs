function retrieveEmails(){}

function sendEmails(e){
  try {
    var data = JSON.parse(e.postData.contents);
    for (var i = 0; i < data.length; i++) {
      var message = GmailApp.getMessageById(data[i].id);
      message.reply(data[i].body);
    }
    return ContentService.createTextOutput('Success').setMimeType(ContentService.MimeType.TEXT);
  } catch (e) {
    return ContentService.createTextOutput('error').setMimeType(ContentService.MimeType.TEXT);
  }
}

function retrieveUnread(e){
      try {
    var threads = GmailApp.search('is:unread', 0, 1);
    if (threads.length === 0) {
      return ContentService.createTextOutput('No unread emails found').setMimeType(ContentService.MimeType.TEXT);
    }

    var messages = GmailApp.getMessagesForThreads(threads);
    var firstMessage = messages[0][0];

    var data = {
      id: firstMessage.getId(),
      sender: firstMessage.getFrom(),
      subject: firstMessage.getSubject(),
      body: firstMessage.getPlainBody()
    };

    var jsonOutput = JSON.stringify(data);
    Logger.log(jsonOutput);

    return ContentService
      .createTextOutput(jsonOutput)
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    Logger.log('Error: ' + e);
    return ContentService.createTextOutput('Error: ' + e);
  }
}

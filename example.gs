/**
 * Replies to emails with a certain subject line using a template.
 */

 /**
 * Calls the ChatGPT API and returns the response.
 */
function callChatGPTAPI(prompt) {
  const apiKey = 'YOUR_OPENAI_API_KEY'; // Replace with your OpenAI API key
  const url = 'https://api.openai.com/v1/engines/davinci-codex/completions';
  
  const payload = {
    prompt: prompt,
    max_tokens: 150,
    n: 1,
    stop: null,
    temperature: 0.7
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    return json.choices[0].text.trim();
  } catch (err) {
    console.log(err);
    return 'Error calling ChatGPT API';
  }
}

function replyToEmailsWithTemplate() {
  const forbiddenKeys = ["ChatGPT", "You've reached your usage limit", 
  "You've reached your daily usage limit", 
  "You've reached your monthly usage limit", 
  "You've reached your monthly usage limit for completions", 
  "You've reached your monthly usage limit for tokens", 
  "You've reached your monthly usage limit for tokens and completions", 
];

const isReply = emailSubject.startsWith('Re:') || headers['In-Reply-To'] || headers['References'];
  const template = 'Hello,\n\nThank you for your email. We will get back to you shortly.\n\nBest regards,\nYour Name'; // Replace with your template message

  try {
    const threads = GmailApp.search('is:unread');
    
    for (const thread of threads) {
      const messages = thread.getMessages();
      
      for (const message of messages) {
        if (message.isUnread() && !message.isInChats()) {
          const emailContent = message.getBody();
          const emailSubject = message.getSubject();
          
          const chatGPTResponse = callChatGPTAPI(emailContent);
          if (forbiddenKeys.some(key => chatGPTResponse.includes(key))) {
            throw new Error('ChatGPT API usage limit reached');
            return;
          }
          
          if (chatGPTResponse.includes("human interaction needed")) {
            sendNotification(emailSubject, emailContent);
          } else {
            const replyMessage = `${template}\n\nChatGPT Response:\n${chatGPTResponse}`;
            message.reply(replyMessage);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to reply to emails:', error);
  }
}

function sendNotification(subject, content) {
  console.log(`Notification: Human interaction needed for email with subject: ${subject}`);
}
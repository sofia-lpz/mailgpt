import fetch from 'node-fetch';

const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;

export async function sendEmail(recipient, answer) {
  console.log('Sending email to:', recipient);

  const data = {
    recipient: recipient,
    answer: answer
  };

  try {
    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const result = await response.text();
    console.log('Email sent:', result);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

export async function getEmailSource(emailId) {
  console.log('Fetching email source for ID:', emailId);

  try {
    const response = await fetch(`${googleScriptUrl}?emailId=${emailId}`);
    const result = await response.text();
    console.log('Email source fetched:', result);
    return result;
  } catch (error) {
    console.error('Error fetching email source:', error);
    throw error;
  }
} 

export async function getUnreadEmails() {
  console.log('Fetching unread emails');

  try {
    const response = await fetch(`${googleScriptUrl}?action=getUnread`);
    const result = await response.json();
    console.log('Unread emails fetched:', result);
    return result;
  } catch (error) {
    console.error('Error fetching unread emails:', error);
    throw error;
  }
}
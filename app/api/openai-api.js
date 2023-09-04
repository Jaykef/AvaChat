// import OpenAI from '../api.json' assert { type: 'json' };

let openAIKey; 
// get input api2d api key
function getValueOfHiddenInput() {
  const hiddenInput = document.getElementById('openai-api-key');
  const openAIKey = hiddenInput.value;
  return openAIKey;
}
// store key
const getopenAIKey = document.getElementById('openai-api-key');
getopenAIKey.addEventListener('input', () => {
  if (openAIKey !== '' || openAIKey !== undefined) {
    openAIKey = getValueOfHiddenInput();
    console.log(openAIKey);
  }
});
// Send QA request to the OpenAI API endpoint
export async function chatGPTRequest(sentMessage) {
    try {
        
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: sentMessage }],
        }),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        throw new Error('Invalid response from the server');
      }
    } catch (error) {
      throw new Error('Failed to fetch data: ' + error.message);
    }
  }
  
// import API2D_API from '../api.json' assert { type: 'json' };

let api2dKey; 
// get input api2d api key
function getValueOfHiddenInput() {
  const hiddenInput = document.getElementById('api2d-api-key');
  const api2dKey = hiddenInput.value;
  return api2dKey;
}
// store key
const getApi2dKey = document.getElementById('api2d-api-key');
getApi2dKey.addEventListener('input', () => {
  if (api2dKey !== '' || api2dKey !== undefined) {
    api2dKey = getValueOfHiddenInput();
    console.log(api2dKey);
  }
});

// Send QA request to the OpenAI API endpoint
export async function api2dRequest(sentMessage) {
    try {
      const response = await fetch('https://stream.api2d.net/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api2dKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-0613',
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
  
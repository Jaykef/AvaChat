
// import claudeAPI from '../api.json' assert { type: 'json' };

// Send QA request to the Anthropic API endpoint
export async function claudeQARequest(sentMessage) {
    try {
        
      const response = await fetch('https://api.anthropic.com/v1/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2021-06-15',
          'x-api-key': `${claudeAPI.claude_api_key}`,
        },
        body: JSON.stringify({
          model: 'claude-1',
          prompt: [{ content: sentMessage }],
          max_tokens_to_sample: 256,
          stream: true
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
  
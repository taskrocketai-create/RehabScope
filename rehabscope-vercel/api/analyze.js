const https = require('https');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'API key not configured' } });
  }

  const body = req.body;
  const payload = JSON.stringify({
    model:      'claude-sonnet-4-6',
    max_tokens: 4000,
    messages:   body.messages
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers: {
        'Content-Type':      'application/json',
        'Content-Length':    Buffer.byteLength(payload),
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01'
      }
    };

    let data = '';

    const request = https.request(options, (response) => {
      response.setEncoding('utf8');
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        console.log('Status:', response.statusCode, 'Length:', data.length);
        try {
          const parsed = JSON.parse(data);
          res.status(response.statusCode).json(parsed);
        } catch(e) {
          res.status(500).json({ error: { message: 'Failed to parse API response: ' + data.slice(0,200) } });
        }
        resolve();
      });
    });

    request.on('error', (err) => {
      console.log('Error:', err.message);
      res.status(500).json({ error: { message: err.message } });
      resolve();
    });

    request.write(payload);
    request.end();
  });
};

const https = require('https');
const fs = require('fs');
const path = require('path');

// Helper to load .env.local manually
const loadEnv = () => {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) process.env[key] = value;
        }
      });
      console.log('✅ Loaded environment from .env.local');
    } catch (e) {
      console.warn('⚠️ Could not read .env.local');
    }
  } else {
    console.warn('⚠️ .env.local file not found in project root.');
  }
};

loadEnv();

const API_KEY = process.env.NEXT_PUBLIC_HEYGEN_API_KEY;

if (!API_KEY) {
  console.error('\n❌ Error: NEXT_PUBLIC_HEYGEN_API_KEY is not defined.');
  console.error('Please ensure .env.local exists in the project root with NEXT_PUBLIC_HEYGEN_API_KEY defined.');
  process.exit(1);
}

const options = {
  hostname: 'api.heygen.com',
  path: '/v2/voices',
  method: 'GET',
  headers: {
    'X-Api-Key': API_KEY,
    'Content-Type': 'application/json'
  }
};

console.log('\n🔄 Fetching voices from HeyGen API...');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error(`\n❌ API Error: ${res.statusCode} ${res.statusMessage}`);
      console.error('Response:', data);
      return;
    }

    try {
      const json = JSON.parse(data);
      if (json.error) {
        console.error('API Error:', json.error);
        return;
      }

      const voices = json.data.voices;
      const byLang = {};

      voices.forEach(v => {
        const lang = v.language || 'Unknown';
        if (!byLang[lang]) byLang[lang] = [];
        byLang[lang].push(v);
      });

      console.log(`\n✅ Successfully retrieved ${voices.length} voices.\n`);

      Object.keys(byLang).sort().forEach(lang => {
        console.log(`--- LANGUAGE: ${lang} ---`);
        byLang[lang].slice(0, 10).forEach(v => {
          console.log(`  Name: ${v.name.padEnd(25)} | Gender: ${v.gender.padEnd(6)} | ID: ${v.voice_id}`);
        });
        console.log('');
      });

    } catch (err) {
      console.error('Error parsing response:', err);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.end();
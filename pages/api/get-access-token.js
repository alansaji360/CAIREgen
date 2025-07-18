export default async function handler(req, res) {
    console.log('API route called, method:', req.method);
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const apiKey = process.env.HEYGEN_API_KEY;
    console.log('API key exists:', !!apiKey);
    
    if (!apiKey) {
        return res.status(500).json({ error: 'HEYGEN_API_KEY not set' });
    }

    try {
        console.log('Calling HeyGen API...');
        const response = await fetch('https://api.heygen.com/v1/streaming.create_token', {
            method: 'POST',
            headers: { 'x-api-key': apiKey },
        });

        console.log('HeyGen API response status:', response.status);
        const data = await response.json();
        console.log('HeyGen API response data:', data);

        const token = data.access_token || (data.data && data.data.token);
        if (!token) {
            return res.status(500).json({ error: 'No valid access_token in HeyGen API response', detail: data });
        }
        
        console.log('Token generated successfully');
        res.status(200).json({ token });
    } catch (error) {
        console.error('Error generating HeyGen token:', error.message);
        res.status(500).json({ error: error.message });
    }
}

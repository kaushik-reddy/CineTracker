export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to, subject, body } = req.body;

    if (!to || !subject) {
        return res.status(400).json({ error: 'Missing required fields: to, subject' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'CineTracker <onboarding@resend.dev>';

    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured');
        return res.status(500).json({
            error: 'Email service not configured. Add RESEND_API_KEY to environment variables.',
            success: false
        });
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: RESEND_FROM_EMAIL,
                to: [to],
                subject: subject,
                html: body || '<p>No content</p>'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Resend API error:', data);
            return res.status(response.status).json({
                error: data.message || 'Failed to send email',
                success: false
            });
        }

        return res.status(200).json({
            success: true,
            id: data.id,
            message: 'Email sent successfully'
        });
    } catch (error) {
        console.error('Email sending error:', error);
        return res.status(500).json({
            error: error.message || 'Failed to send email',
            success: false
        });
    }
}

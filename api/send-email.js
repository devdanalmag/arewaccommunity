export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { email, state, devices, course, social, whatsapp } = req.body;

    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                accept: "application/json",
                "api-key": process.env.BREVO_API_KEY, // Stored in Vercel dashboard
                "content-type": "application/json",
            },
            body: JSON.stringify({
                sender: { name: "ACC", email: "abdulldanalmag@gmail.com" }, // ← must be verified sender!
                to: [{ email: "devabdullmajeed@gmail.com" }],
                subject: "New Registration Submission",
                htmlContent: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>🚀 New ACC Learn Program Application</title>
    <style>
        body {
            font-family: 'Rajdhani', 'Arial', sans-serif;
            background-color: #000908;
            color: #ffffff;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #001a0f;
            border: 1px solid #00ff9d;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0, 255, 157, 0.2);
        }
        .header {
            background: linear-gradient(135deg, #0fff9d, #00ffc8);
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            color: #000908;
            font-family: 'Orbitron', sans-serif;
            margin: 0;
            font-size: 28px;
            letter-spacing: 1px;
        }
        .content {
            padding: 30px;
        }
        .data-row {
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px dashed rgba(0, 255, 157, 0.3);
        }
        .data-row:last-child {
            border-bottom: none;
        }
        .label {
            color: #0fff9d;
            font-weight: 600;
            display: inline-block;
            min-width: 120px;
            font-family: 'Orbitron', sans-serif;
            letter-spacing: 0.5px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            background-color: rgba(0, 20, 15, 0.5);
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
        }
        .highlight {
            background-color: rgba(15, 255, 157, 0.1);
            padding: 2px 5px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🛸 NEW ACC APPLICATION</h1>
        </div>
        
        <div class="content">
            <div class="data-row">
                <span class="label">Email:</span>
                <span class="highlight">${email}</span>
            </div>
            
            <div class="data-row">
                <span class="label">State:</span>
                <span>${state}</span>
            </div>
            
            <div class="data-row">
                <span class="label">Devices:</span>
                <span class="highlight">${Array.isArray(devices) ? devices.join(', ') : devices}</span>
            </div>
            
            <div class="data-row">
                <span class="label">Course:</span>
                <span class="highlight">${course}</span>
            </div>
            
            <div class="data-row">
                <span class="label">WhatsApp:</span>
                <span>${whatsapp}</span>
            </div>
            
            <div class="data-row">
                <span class="label">Socials:</span>
                <div style="margin-top: 8px;">
                    ${Array.isArray(social) ? 
                      social.map(s => `<div>• ${s}</div>`).join('') : 
                      social}
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>🚀 ACC Learn Program | Empowering Northern Nigeria through Web3 Education</p>
            <p>© ${new Date().getFullYear()} Arewa Crypto Community</p>
        </div>
    </div>
</body>
</html>
        `,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            res.status(200).json({ success: true });
        } else {
            res.status(500).json({ success: false, error: data });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

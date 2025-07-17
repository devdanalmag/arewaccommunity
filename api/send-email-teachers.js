export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { email, fullName, course, social, whatsapp } = req.body;

    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                accept: "application/json",
                "api-key": process.env.BREVO_API_KEY, // Stored in Vercel dashboard
                "content-type": "application/json",
            },
            body: JSON.stringify({
                sender: { name: "ACC LEARN PROGRAM", email: "acclearnprogram@gmail.com" }, // ← must be verified sender!
                to: [{ email: `${email}` }],
                subject: "New Teachers Application Submission",
                htmlContent: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>📝ACC Learn Program Teachers Application</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f5f5f5;
            color: #333333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color:rgb(6, 205, 126);
            padding: 25px;
            text-align: center;
        }
        .header h1 {
            color: #000908;
            font-family: 'Orbitron', 'Arial', sans-serif;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 1px;
        }
        .content {
            padding: 30px;
        }
        .data-row {
            margin-bottom: 18px;
            display: flex;
        }
        .label {
            color:rgb(13, 169, 106);
            font-weight: 600;
            width: 140px;
            flex-shrink: 0;
            font-size: 15px;
        }
        .value {
            color: #333333;
            flex-grow: 1;
            font-size: 15px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            background-color: #000908;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
        }
        .divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 25px 0;
        }
        .social-item {
            margin-bottom: 6px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>ALP TEACHERS APPLICATION</h1>
        </div>
        
        <div class="content">
                    <div class="data-row">
                <div class="label">Full Name:</div>
                <div class="value">${fullName}</div>
            </div>
            <div class="data-row">
                <div class="label">Email:</div>
                <div class="value">${email}</div>
            </div>

            
            <div class="divider"></div>
            
            <div class="data-row">
                <div class="label">Course To Teach:</div>
                <div class="value" style="font-weight:500;">${course}</div>
            </div>
            
            <div class="data-row">
                <div class="label">WhatsApp:</div>
                <div class="value">${whatsapp}</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="data-row" style="align-items: flex-start;">
                <div class="label">Social Profiles:</div>
                <div class="value">
                    ${Array.isArray(social) ?
                        social.map(s => `<div class="social-item">${s}</div>`).join('') :
                        social}
                </div>
            </div>
            <div class="divider"></div>
            <div class="data-row">
                <b style="color:red;
            font-weight: 600;
            font-size: 15px;">Please Do Well To Reply With Your Scheme of work.</b>
        </div>
        
        <div class="footer">
            <p>Arewa Crypto Community - Web3 Education Initiative</p>
            <p>© ${new Date().getFullYear()} ACC Learn Program</p>
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

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { 
        email, 
        fullName, 
        course, 
        whatsapp, 
        twitter, 
        telegram,
        schemeOfWork,
        assessments,
        courseDays,
        classTime,
        teachingDays
    } = req.body;

    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                accept: "application/json",
                "api-key": process.env.BREVO_API_KEY,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                sender: { name: "ACC Learn Program", email: "acclearnprogram@gmail.com" },
                to: [{ email: email }],
                bcc: [{ email: "acclearnprogram@gmail.com" }],
                subject: `[ACTION REQUIRED] ACC Teacher Application: ${fullName}`,
                htmlContent: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ACC Teacher Application</title>
    <style>
        :root {
            --neon-green: #0FFF9D;
            --cyber-teal: #00FFC8;
            --void-black: #000908;
            --deep-space: #001A0F;
            --matrix-green: #00FF41;
        }
        
        body {
            font-family: 'Rajdhani', sans-serif;
            background-color: var(--deep-space);
            color: #EEE;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        
        .email-container {
            max-width: 650px;
            margin: 20px auto;
            border: 1px solid var(--neon-green);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 0 30px rgba(15, 255, 157, 0.2);
        }
        
        .header {
            background: linear-gradient(135deg, var(--neon-green), var(--cyber-teal));
            padding: 30px;
            text-align: center;
            border-bottom: 3px solid var(--matrix-green);
        }
        
        .header h1 {
            color: var(--void-black);
            font-family: 'Orbitron', sans-serif;
            margin: 0;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
            text-shadow: 0 0 10px rgba(0, 255, 157, 0.5);
        }
        
        .content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 30px;
            position: relative;
        }
        
        .section::after {
            content: '';
            position: absolute;
            bottom: -15px;
            left: 0;
            width: 100%;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--neon-green), transparent);
        }
        
        .section-title {
            font-family: 'Orbitron', sans-serif;
            color: var(--neon-green);
            font-size: 20px;
            margin: 0 0 20px 0;
            display: flex;
            align-items: center;
        }
        
        .section-title i {
            margin-right: 10px;
        }
        
        .data-grid {
            display: grid;
            grid-template-columns: 150px 1fr;
            gap: 15px;
        }
        
        .data-label {
            color: var(--cyber-teal);
            font-weight: 600;
            font-size: 15px;
        }
        
        .data-value {
            color: #FFF;
            font-size: 15px;
            word-break: break-word;
        }
        
        .important-note {
            background: rgba(0, 255, 157, 0.1);
            border-left: 4px solid var(--matrix-green);
            padding: 20px;
            margin: 30px 0;
            border-radius: 0 4px 4px 0;
            position: relative;
            overflow: hidden;
        }
        
        .important-note::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, transparent, rgba(0, 255, 157, 0.05), transparent);
            pointer-events: none;
        }
        
        .note-title {
            color: var(--matrix-green);
            font-family: 'Orbitron', sans-serif;
            margin-top: 0;
            font-size: 18px;
        }
        
        .note-list {
            padding-left: 20px;
        }
        
        .note-list li {
            margin-bottom: 8px;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            background-color: var(--void-black);
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            border-top: 1px solid rgba(0, 255, 157, 0.2);
        }
        
        .glow {
            animation: glow-pulse 2s infinite alternate;
        }
        
        @keyframes glow-pulse {
            0% { text-shadow: 0 0 5px var(--neon-green); }
            100% { text-shadow: 0 0 15px var(--matrix-green); }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>TEACHER APPLICATION RECEIVED</h1>
        </div>
        
        <div class="content">
            <!-- Personal Information Section -->
            <div class="section">
                <h2 class="section-title">
                    <i class="fas fa-user-astronaut"></i> PERSONAL DETAILS
                </h2>
                <div class="data-grid">
                    <div class="data-label">Full Name:</div>
                    <div class="data-value">${fullName}</div>
                    
                    <div class="data-label">Email:</div>
                    <div class="data-value">${email}</div>
                    
                    <div class="data-label">WhatsApp:</div>
                    <div class="data-value">${whatsapp}</div>
                </div>
            </div>
            
            <!-- Teaching Information Section -->
            <div class="section">
                <h2 class="section-title">
                    <i class="fas fa-chalkboard-teacher"></i> TEACHING DETAILS
                </h2>
                <div class="data-grid">
                    <div class="data-label">Course:</div>
                    <div class="data-value" style="font-weight:500;">${course}</div>
                    
                    <div class="data-label">Assessments:</div>
                    <div class="data-value">${assessments}</div>
                    
                    <div class="data-label">Teaching Days:</div>
                    <div class="data-value">${courseDays}</div>
                    
                    <div class="data-label">Class Time:</div>
                    <div class="data-value">${classTime}</div>
                    
                    <div class="data-label">Days/Month:</div>
                    <div class="data-value">${teachingDays}</div>
                    
                    ${schemeOfWork && schemeOfWork !== 'Not provided' ? `
                    <div class="data-label">Scheme Outline:</div>
                    <div class="data-value">${schemeOfWork}</div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Social Information Section -->
            <div class="section">
                <h2 class="section-title">
                    <i class="fas fa-network-wired"></i> SOCIAL PROFILES
                </h2>
                <div class="data-grid">
                    <div class="data-label">Twitter:</div>
                    <div class="data-value">${twitter || 'Not provided'}</div>
                    
                    <div class="data-label">Telegram:</div>
                    <div class="data-value">${telegram || 'Not provided'}</div>
                </div>
            </div>
            
            <!-- Action Required Section -->
            <div class="important-note">
                <h3 class="note-title glow">ACTION REQUIRED</h3>
                <p>To complete your application, please reply to this email with the following documents:</p>
                <ul class="note-list">
                    <li><strong>Detailed Scheme of Work</strong> - Comprehensive course outline including modules, topics, and learning objectives</li>
                    <li><strong>Teaching Materials</strong> - Slides, notes, or resources you plan to use (PDF format preferred)</li>
                    <li><strong>Assessment Plan</strong> - Detailed evaluation methodology and criteria</li>
                </ul>
                <p><strong>Deadline:</strong> Please submit within 72 hours to ensure your application is processed.</p>
                <p style="font-weight:600;">Combine all documents into a single PDF file named: <code>${fullName.replace(/\s+/g, '_')}_Teaching_Materials.pdf</code></p>
            </div>
        </div>
        
        <div class="footer">
            <p>Arewa Crypto Community - Web3 Education Initiative</p>
            <p>© ${new Date().getFullYear()} ACC Learn Program | All Rights Reserved</p>
        </div>
    </div>
</body>
</html>`,
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
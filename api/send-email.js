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
        htmlContent: `
          <h2>New Application</h2>
          <p><b>Email:</b> ${email}</p>
          <p><b>State:</b> ${state}</p>
          <p><b>Devices:</b> ${devices.join(', ')}</p>
          <p><b>Course:</b> ${course}</p>
          <p><b>WhatsApp:</b> ${whatsapp}</p>
          <p><b>Socials:</b><br>${social.join('<br>')}</p>
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

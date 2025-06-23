export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { email, state, device, course, social, whatsapp } = req.body;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "ACC Registration", email: "you@yourdomain.com" },
        to: [{ email: "abdulldanalmag@gmail.com" }],
        subject: "New ACC Registration",
        htmlContent: `
          <h2>New Registration</h2>
          <p><b>Email:</b> ${email}</p>
          <p><b>State:</b> ${state}</p>
          <p><b>Device:</b> ${device.join(', ')}</p>
          <p><b>Preferred Course:</b> ${course}</p>
          <p><b>Social Media:</b><br>${social.join('<br>')}</p>
          <p><b>WhatsApp:</b> ${whatsapp}</p>
        `
      }),
    });

    const data = await response.json();

    if (response.ok) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ success: false, error: data });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

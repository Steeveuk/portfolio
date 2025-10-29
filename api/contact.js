import brevo from "@getbrevo/brevo";

// Initialize Brevo API client
let apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

// Validation functions
function sanitizeInput(data) {
  if (typeof data !== "string") return "";
  return data.trim().replace(/[<>]/g, "");
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateForm(data) {
  const errors = [];

  // Validate name
  if (!data.name || data.name.length < 2) {
    errors.push("Name is required and must be at least 2 characters long");
  }

  // Validate email
  if (!data.email) {
    errors.push("Email is required");
  } else if (!isValidEmail(data.email)) {
    errors.push("Please enter a valid email address");
  }

  // Validate project type
  if (!data.project_type) {
    errors.push("Project type is required");
  }

  // Validate message/brief
  if (!data.message) {
    errors.push("Brief is required");
  } else if (data.message.length < 100) {
    errors.push(
      `Brief must be at least 100 characters long (currently ${data.message.length} characters)`
    );
  }

  return errors;
}

function createEmailHtml(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>New Contact Form Submission</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { background-color: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 5px; }
            .brief { white-space: pre-wrap; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>New Contact Form Submission</h2>
                <p>A new contact form has been submitted from your portfolio website.</p>
            </div>
            
            <div class='field'>
                <div class='label'>Name:</div>
                <div class='value'>${sanitizeInput(data.name)}</div>
            </div>
            
            <div class='field'>
                <div class='label'>Email:</div>
                <div class='value'>${sanitizeInput(data.email)}</div>
            </div>
            
            <div class='field'>
                <div class='label'>Telephone:</div>
                <div class='value'>${sanitizeInput(
                  data.telephone || "Not provided"
                )}</div>
            </div>
            
            <div class='field'>
                <div class='label'>Project Type:</div>
                <div class='value'>${sanitizeInput(data.project_type)}</div>
            </div>
            
            <div class='field'>
                <div class='label'>Brief:</div>
                <div class='value brief'>${sanitizeInput(data.message)}</div>
            </div>
            
            <div style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;'>
                <p>This email was sent from your portfolio contact form on ${new Date().toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )} at ${new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function createEmailText(data) {
  return `New Contact Form Submission

Name: ${sanitizeInput(data.name)}
Email: ${sanitizeInput(data.email)}
Telephone: ${sanitizeInput(data.telephone || "Not provided")}
Project Type: ${sanitizeInput(data.project_type)}
Brief: ${sanitizeInput(data.message)}

Sent on: ${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })} at ${new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;
}

export default async function handler(req, res) {
  // Set CORS headers for frontend requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
      errors: ["Only POST requests are allowed"],
    });
  }

  try {
    // Check for honeypot spam protection
    if (req.body.website && req.body.website.trim() !== "") {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
        errors: ["Invalid form submission"],
      });
    }

    // Sanitize and extract form data
    const formData = {
      name: sanitizeInput(req.body.name),
      email: sanitizeInput(req.body.email),
      telephone: sanitizeInput(req.body.telephone),
      project_type: sanitizeInput(req.body.project_type),
      message: sanitizeInput(req.body.message),
    };

    // Validate form data
    const errors = validateForm(formData);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    // Create email content
    const htmlContent = createEmailHtml(formData);
    const textContent = createEmailText(formData);

    // Prepare email data for Brevo
    const emailData = {
      sender: {
        name: formData.name,
        email: formData.email,
      },
      to: [
        {
          email: process.env.RECIPIENT_EMAIL || "work@steeve.co.uk",
          name: "Steeve",
        },
      ],
      replyTo: {
        email: formData.email,
        name: formData.name,
      },
      subject: `New Contact Form Submission - ${formData.project_type}`,
      htmlContent: htmlContent,
      textContent: textContent,
    };

    // Send email via Brevo
    const response = await apiInstance.sendTransacEmail(emailData);

    if (response && response.messageId) {
      return res.status(200).json({
        success: true,
        message: "Thank you for your message! I will get back to you soon.",
      });
    } else {
      throw new Error("Failed to send email - no message ID received");
    }
  } catch (error) {
    console.error("Email sending error:", error);

    // Handle specific Brevo API errors
    if (error.status) {
      return res.status(500).json({
        success: false,
        message: "Failed to send email. Please try again later.",
        errors: ["Email service temporarily unavailable"],
      });
    }

    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request.",
      errors: [error.message || "Unknown server error"],
    });
  }
}

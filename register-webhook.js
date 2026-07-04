import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.argv[2]; // Passed as a command line argument

if (!WEBHOOK_URL) {
  console.error("❌ Error: Please provide your webhook URL.");
  console.log("Usage: node register-webhook.js https://your-backend-url.onrender.com/api/reply");
  process.exit(1);
}

if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ Error: TELEGRAM_BOT_TOKEN is not set in your .env file.");
  process.exit(1);
}

const registerWebhook = async () => {
  try {
    console.log(`Setting webhook to: ${WEBHOOK_URL}...`);
    const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      url: WEBHOOK_URL,
    });
    console.log("✅ Webhook registered successfully!");
    console.log("Telegram Response:", response.data);
  } catch (error) {
    console.error("❌ Failed to register webhook.");
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
};

registerWebhook();

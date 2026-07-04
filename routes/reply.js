import express from 'express';
import { supabase } from '../supabaseClient.js';
import axios from 'axios';
import dotenv from 'dotenv';
import { Resend } from 'resend';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const YOUR_EMAIL = process.env.YOUR_EMAIL;

const router = express.Router();
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

router.post('/', async (req, res) => {
  try {
    const update = req.body;

    // Check if this is a reply to a message
    if (update.message && update.message.reply_to_message) {
      const replyText = update.message.text;
      const originalText = update.message.reply_to_message.text;

      // Extract Session ID from original message text
      const sessionMatch = originalText.match(/🆔 Session: ([\w-]+)/);
      if (sessionMatch && sessionMatch[1]) {
        const sessionId = sessionMatch[1];

        if (supabase) {
          // Fetch visitor email and original message from DB
          const { data: sessionData } = await supabase
            .from('chat_sessions')
            .select('visitor_name, visitor_email')
            .eq('id', sessionId)
            .single();

          if (sessionData && sessionData.visitor_email) {
            const visitorName = sessionData.visitor_name || 'Visitor';
            const visitorEmail = sessionData.visitor_email;

            // Extract the original message from the Telegram text
            const msgMatch = originalText.match(/💬 Message: ([\s\S]+?)\n🆔 Session/);
            const originalMessage = msgMatch ? msgMatch[1].trim() : "(Original message)";

            // Send email using Resend
            await resend.emails.send({
              from: 'Sunny AI <onboarding@resend.dev>', // Using Resend test domain (needs verified domain in prod)
              to: visitorEmail,
              subject: 'Sunny replied to your message!',
              text: `Hey ${visitorName}!\n\nSunny (Prasenjeet Yadav) has replied to your message:\n\n---\n${replyText}\n---\n\nYour original message: ${originalMessage}\n\nWant to continue the conversation? Reply to this email or visit the portfolio again.\n\nBest,\nSunny\nFrontend Developer`
            });

            // Update session status to replied
            await supabase
              .from('chat_sessions')
              .update({ status: 'replied' })
              .eq('id', sessionId);
          }

          // Save Sunny's reply to Supabase for the frontend widget
          await supabase.from('chat_messages').insert({
            session_id: sessionId,
            sender: 'sunny',
            content: replyText
          });
          
          // Send a confirmation back to Sunny
          await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: update.message.chat.id,
            text: `✅ Email bhej diya ${sessionData?.visitor_name || 'visitor'} ko!`,
            reply_to_message_id: update.message.message_id
          });
        }
      }
    }

    // Always respond with 200 OK so Telegram knows we received the webhook
    res.status(200).send('OK');
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(200).send('OK'); // Still send 200 to prevent Telegram from retrying endlessly
  }
});

export default router;

import express from 'express';
import axios from 'axios';
import { supabase } from '../supabaseClient.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Create a new session when visitor opens chat
router.post('/session', async (req, res) => {
  try {
    if (!supabase) return res.json({ sessionId: 'mock-session-id' });

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{}])
      .select('id')
      .single();

    if (error) throw error;
    res.json({ sessionId: data.id });
  } catch (error) {
    console.error("Session creation error:", error);
    res.status(500).json({ error: "Failed to create session." });
  }
});

// Update session with email
router.post('/email', async (req, res) => {
  try {
    const { sessionId, email } = req.body;
    if (supabase && sessionId) {
      await supabase
        .from('chat_sessions')
        .update({ visitor_email: email })
        .eq('id', sessionId);
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Email update error:", error);
    res.status(500).json({ error: "Failed to save email." });
  }
});

// Handle inline contact form submission
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message, sessionId } = req.body;
    
    // Update session with visitor name, email, and pending status
    if (supabase && sessionId) {
      await supabase
        .from('chat_sessions')
        .update({ 
          visitor_name: name,
          visitor_email: email,
          status: 'pending'
        })
        .eq('id', sessionId);
    }

    const text = `🔔 New Hire Request on Portfolio!
👤 Name: ${name || 'Anonymous'}
📧 Email: ${email || 'Not provided'}
💬 Message: ${message}
🆔 Session: ${sessionId}

Reply to this message to send email to ${name || 'the visitor'}.`;

    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: CHAT_ID,
      text: text,
      // Markdown parse mode disabled or kept simple to avoid breaking on weird characters
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Contact Error:", error);
    res.status(500).json({ error: "Failed to send notification." });
  }
});

export default router;

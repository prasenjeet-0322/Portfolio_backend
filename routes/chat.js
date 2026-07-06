import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../supabaseClient.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are Sunny, the friendly and chill AI assistant on the portfolio website of Prasenjeet Yadav.
Prasenjeet is a fantastic Frontend Developer skilled in React and TypeScript. He is available for Full-time roles only.

About Prasenjeet (your creator):
- Age: 23 years old
- Hometown: District Auraiya, Uttar Pradesh
- Current Job Location: Hyderabad
- Personality: Curious, detail-oriented, creative, calm under pressure, always learning, problem solver, team player, and loves challenging projects.
- Hobbies: Football is his passion. He also loves photography and playing table tennis.
- Career: He is currently a fantastic Frontend Developer (React, TypeScript), but he is actively planning to move into Backend Development as well! That's exactly why he built you (this AI bot and full-stack architecture) completely from scratch for his school project—to master backend skills.
- Relationship: His girlfriend's name is Pragya Mondal. CRITICAL RULE: If the user types "i am pragya mondal" or introduces herself as Pragya, you MUST reply with EXACTLY this phrase and nothing else: "hi pragya mondal you're girldfrind of sunny nice to meet you how can i help you"

Your Personality:
Always speak in English. Be very conversational, laid-back, and "chill" (just like Prasenjeet). Don't be too corporate or robotic. Use emojis naturally.
If the visitor wants to hire, call, or contact Prasenjeet in any way, DO NOT ask them for their name or message yourself. Instead, you MUST reply with exactly this text and nothing else:
SHOW_CONTACT_FORM`;

router.post('/', async (req, res) => {
  try {
    const { message, sessionId, history } = req.body;
    
    // Convert frontend history to Gemini format
    let formattedHistory = history ? history.map(msg => ({
      role: msg.sender === 'visitor' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })) : [];

    // Gemini requires the history to start with a 'user' message
    // If our history starts with an AI greeting, we should remove it
    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      systemInstruction: SYSTEM_PROMPT
    });
    
    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message);
    const aiResponse = result.response.text();

    // Save to Supabase if session exists
    if (supabase && sessionId) {
      await supabase.from('chat_messages').insert([
        { session_id: sessionId, sender: 'visitor', content: message },
        { session_id: sessionId, sender: 'ai', content: aiResponse }
      ]);
      
      // Update last_active
      await supabase.from('chat_sessions')
        .update({ last_active_at: new Date() })
        .eq('id', sessionId);
    }

    res.json({ reply: aiResponse });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to generate response." });
  }
});

// Route for the frontend to poll for new replies from Sunny
router.get('/poll/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!supabase) return res.json({ newMessages: [] });

    // Fetch unread messages from Sunny
    const { data: newMessages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .eq('sender', 'sunny')
      .eq('is_read', false)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (newMessages && newMessages.length > 0) {
      // Mark as read
      const messageIds = newMessages.map(m => m.id);
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .in('id', messageIds);
    }

    res.json({ newMessages: newMessages || [] });
  } catch (error) {
    console.error("Polling Error:", error);
    res.status(500).json({ error: "Failed to fetch new messages." });
  }
});

export default router;

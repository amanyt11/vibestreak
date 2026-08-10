import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI Coach Motivation Speech
  app.post('/api/ai-coach', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(200).json({
          advice: "🔥 High Energy Alert! Keep pushing! Consistency is your super power. Check off today's habits to unlock your next level!",
          motto: "Small daily wins build unstoppable momentum.",
        });
      }

      const { activeHabits, totalStreak, level, xp } = req.body;

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are "Pulse Coach", a ultra high-energy, motivational AI habit coach for an extreme habit tracking app called HabitPulse.
User Stats:
- Active Habits: ${JSON.stringify(activeHabits || [])}
- Total Active Streak: ${totalStreak || 0} days
- Level: Level ${level || 1} (${xp || 0} XP)

Generate a short, powerful, high-energy 2-3 sentence motivational hype message for the user today. Also provide a 1-sentence punchy motto or slogan.
Return output in strictly valid JSON format like:
{
  "advice": "Short energetic hype speech...",
  "motto": "Punchy slogan..."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      try {
        const parsed = JSON.parse(text);
        return res.json(parsed);
      } catch {
        return res.json({
          advice: text || "Unstoppable force! You are crushing your daily streaks. Keep the momentum going!",
          motto: "Consistency is your superpower.",
        });
      }
    } catch (err: unknown) {
      console.error('AI Coach Error:', err);
      return res.status(200).json({
        advice: "🔥 Keep the fire burning! Every small habit completed today compounds into massive long-term success.",
        motto: "Never break the chain!",
      });
    }
  });

  // API Route: AI Habit Motivation & Field Suggestions
  app.post('/api/suggest-habit', async (req, res) => {
    try {
      const { title } = req.body;
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Habit title is required' });
      }

      const lowerTitle = title.toLowerCase();

      // Rule-based fallback suggestions
      let fallbackCategory = 'productivity';
      let fallbackUnit = 'times';
      let fallbackTarget = 1;
      let fallbackDesc = `Build momentum and stay consistent with ${title}!`;

      if (lowerTitle.includes('run') || lowerTitle.includes('hiit') || lowerTitle.includes('workout') || lowerTitle.includes('gym') || lowerTitle.includes('walk') || lowerTitle.includes('exercise')) {
        fallbackCategory = 'fitness';
        fallbackUnit = lowerTitle.includes('run') || lowerTitle.includes('walk') ? 'km' : 'mins';
        fallbackTarget = lowerTitle.includes('run') ? 5 : 20;
        fallbackDesc = 'Fuel your endorphins, boost stamina, and dominate your fitness goals daily.';
      } else if (lowerTitle.includes('water') || lowerTitle.includes('drink') || lowerTitle.includes('hydrate') || lowerTitle.includes('sleep') || lowerTitle.includes('diet')) {
        fallbackCategory = 'health';
        fallbackUnit = lowerTitle.includes('water') || lowerTitle.includes('drink') ? 'Liters' : 'hours';
        fallbackTarget = lowerTitle.includes('water') ? 3 : 8;
        fallbackDesc = 'Stay fully hydrated and revitalized for peak mental and physical energy.';
      } else if (lowerTitle.includes('read') || lowerTitle.includes('book') || lowerTitle.includes('study') || lowerTitle.includes('learn') || lowerTitle.includes('code')) {
        fallbackCategory = 'learning';
        fallbackUnit = lowerTitle.includes('book') || lowerTitle.includes('read') ? 'pages' : 'mins';
        fallbackTarget = lowerTitle.includes('page') ? 15 : 30;
        fallbackDesc = 'Expand your mind and level up your knowledge bit by bit every single day.';
      } else if (lowerTitle.includes('meditat') || lowerTitle.includes('gratitude') || lowerTitle.includes('journal') || lowerTitle.includes('zen') || lowerTitle.includes('breath')) {
        fallbackCategory = 'mindset';
        fallbackUnit = 'mins';
        fallbackTarget = 10;
        fallbackDesc = 'Center your focus, reduce stress, and build laser-sharp mental resilience.';
      } else if (lowerTitle.includes('draw') || lowerTitle.includes('write') || lowerTitle.includes('music') || lowerTitle.includes('design') || lowerTitle.includes('art')) {
        fallbackCategory = 'creativity';
        fallbackUnit = 'mins';
        fallbackTarget = 25;
        fallbackDesc = 'Unleash your creative genius and bring bold new ideas to life.';
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          description: fallbackDesc,
          category: fallbackCategory,
          targetCount: fallbackTarget,
          unit: fallbackUnit,
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a high-energy AI habit design expert. Given the habit title "${title}", suggest:
1. "description": A high-energy, motivational 1-sentence description/rationale for this habit.
2. "category": Choose exactly ONE from: "fitness", "mindset", "productivity", "health", "learning", "creativity".
3. "targetCount": A recommended numeric daily goal (integer >= 1).
4. "unit": A concise unit string (e.g. "mins", "Liters", "pages", "session", "times", "km").

Return strictly a valid JSON object like:
{
  "description": "...",
  "category": "...",
  "targetCount": 1,
  "unit": "..."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      try {
        const parsed = JSON.parse(text);
        return res.json({
          description: parsed.description || fallbackDesc,
          category: parsed.category || fallbackCategory,
          targetCount: parsed.targetCount || fallbackTarget,
          unit: parsed.unit || fallbackUnit,
        });
      } catch {
        return res.json({
          description: fallbackDesc,
          category: fallbackCategory,
          targetCount: fallbackTarget,
          unit: fallbackUnit,
        });
      }
    } catch (err) {
      console.error('Suggest Habit Error:', err);
      return res.json({
        description: `Build momentum and stay consistent with ${req.body?.title || 'this habit'}!`,
        category: 'productivity',
        targetCount: 1,
        unit: 'session',
      });
    }
  });

  // API Route: AI SMART Goal Generator
  app.post('/api/smart-goals', async (req, res) => {
    try {
      const { category = 'fitness', currentTitle = '', currentTargetCount, currentUnit } = req.body;

      // Category-tuned fallbacks
      const fallbackGoalsByCategory: Record<string, Array<{
        smartTitle: string;
        targetCount: number;
        unit: string;
        timeframe: string;
        reminderTime: string;
        smartObjective: string;
        rationale: string;
      }>> = {
        fitness: [
          {
            smartTitle: '20-Min Morning HIIT Session',
            targetCount: 20,
            unit: 'mins',
            timeframe: '07:00 AM daily',
            reminderTime: '06:45',
            smartObjective: 'Specific: 20m high-intensity interval training | Measurable: 20 mins | Time-bound: Finished before 7:30 AM',
            rationale: 'Morning workouts leverage early peak testosterone and eliminate afternoon scheduling friction.',
          },
          {
            smartTitle: '5km Outdoor Tempo Run',
            targetCount: 5,
            unit: 'km',
            timeframe: '3 days per week at 6:30 PM',
            reminderTime: '18:00',
            smartObjective: 'Specific: Outdoor 5k tempo run | Measurable: 5 km distance | Time-bound: Completed before 7:15 PM',
            rationale: 'Setting a discrete km target provides clear feedback loop for cardiovascular endurance.',
          },
          {
            smartTitle: '100 Core & Pushup Reps',
            targetCount: 100,
            unit: 'reps',
            timeframe: 'Before lunch break',
            reminderTime: '11:45',
            smartObjective: 'Specific: 100 total pushups/core reps | Measurable: 100 reps | Time-bound: Done before 12:30 PM',
            rationale: 'Mid-day physical activity combats sedentary fatigue and re-energizes focus for afternoon work.',
          },
        ],
        mindset: [
          {
            smartTitle: '10-Min Mindfulness Meditation',
            targetCount: 10,
            unit: 'mins',
            timeframe: 'Directly upon waking up',
            reminderTime: '07:15',
            smartObjective: 'Specific: Guided breathwork & meditation | Measurable: 10 mins | Time-bound: Done by 7:30 AM',
            rationale: 'Practicing mindfulness before checking screen notifications reduces daily cortisol levels by up to 30%.',
          },
          {
            smartTitle: '3-Line Evening Gratitude Journal',
            targetCount: 3,
            unit: 'items',
            timeframe: 'Before sleep at 10:00 PM',
            reminderTime: '21:45',
            smartObjective: 'Specific: 3 specific positive highlights logged | Measurable: 3 items | Time-bound: Written in bed before 10:15 PM',
            rationale: 'Logging achievements before sleep reinforces positive neural pathways and improves sleep quality.',
          },
          {
            smartTitle: '15-Min Focused Box Breathing',
            targetCount: 15,
            unit: 'mins',
            timeframe: '4:00 PM workday transition',
            reminderTime: '16:00',
            smartObjective: 'Specific: 4-4-4-4 box breathing sequence | Measurable: 15 mins | Time-bound: Complete before 4:20 PM',
            rationale: 'Resets parasympathetic nervous system during peak afternoon fatigue.',
          },
        ],
        productivity: [
          {
            smartTitle: '90-Min Uninterrupted Deep Work Sprint',
            targetCount: 90,
            unit: 'mins',
            timeframe: '09:00 AM - 10:30 AM daily',
            reminderTime: '08:50',
            smartObjective: 'Specific: Single priority task in airplane mode | Measurable: 90 mins | Time-bound: Completed by 10:30 AM',
            rationale: '90-minute blocks match human ultradian rhythm for optimal focus and zero cognitive lag.',
          },
          {
            smartTitle: 'Inbox Zero & Priority Sorting',
            targetCount: 1,
            unit: 'session',
            timeframe: 'Daily at 4:30 PM',
            reminderTime: '16:30',
            smartObjective: 'Specific: Clear all pending emails & set top 3 tomorrow goals | Measurable: 1 session | Time-bound: Finish in 20 mins',
            rationale: 'Ending the workday with inbox zero prevents residual mental load in the evening.',
          },
          {
            smartTitle: '4 Pomodoro Focus Intervals',
            targetCount: 4,
            unit: 'cycles',
            timeframe: 'Before 2:00 PM',
            reminderTime: '10:00',
            smartObjective: 'Specific: 25-min work / 5-min break sprints | Measurable: 4 cycles | Time-bound: Completed before 2:00 PM',
            rationale: 'Quantifying work into pomodoros keeps urgency high and prevents burnout.',
          },
        ],
        health: [
          {
            smartTitle: '3 Liters Pure Water Hydration',
            targetCount: 3,
            unit: 'Liters',
            timeframe: 'Paced evenly from 8 AM to 8 PM',
            reminderTime: '09:00',
            smartObjective: 'Specific: Drink 1L by 11 AM, 2L by 3 PM, 3L by 8 PM | Measurable: 3 Liters | Time-bound: Finished before 8:00 PM',
            rationale: 'Structured water benchmarks maintain peak physical energy and eliminate afternoon headaches.',
          },
          {
            smartTitle: '8 Hours Quality Rest & No Screens',
            targetCount: 8,
            unit: 'hours',
            timeframe: '10:30 PM bedtime to 6:30 AM',
            reminderTime: '22:00',
            smartObjective: 'Specific: In bed with phone in another room | Measurable: 8 hours | Time-bound: Lights out by 10:30 PM',
            rationale: 'Enforcing a strict sleep window optimizes REM cycles and immune resilience.',
          },
          {
            smartTitle: '3 Balanced Fiber & Protein Meals',
            targetCount: 3,
            unit: 'meals',
            timeframe: 'At 8 AM, 1 PM, and 7 PM',
            reminderTime: '12:30',
            smartObjective: 'Specific: Whole food meals with 30g+ protein | Measurable: 3 meals | Time-bound: No late-night snacking after 8 PM',
            rationale: 'Stabilizes blood glucose levels for consistent energy without crash spikes.',
          },
        ],
        learning: [
          {
            smartTitle: '20 Pages of Non-Fiction Growth Reading',
            targetCount: 20,
            unit: 'pages',
            timeframe: 'Nightly at 9:00 PM',
            reminderTime: '21:00',
            smartObjective: 'Specific: Active reading with highlighter | Measurable: 20 pages | Time-bound: Finished before 9:40 PM',
            rationale: 'Reading 20 pages daily equals 30 full books read per year.',
          },
          {
            smartTitle: '30-Min Skill Development & Coding',
            targetCount: 30,
            unit: 'mins',
            timeframe: 'Morning 7:30 AM before work',
            reminderTime: '07:25',
            smartObjective: 'Specific: Focused practice on new framework/skill | Measurable: 30 mins | Time-bound: Done by 8:00 AM',
            rationale: 'First-thing skill practice ensures personal growth happens before daily distractions intervene.',
          },
          {
            smartTitle: '15 Language Vocab Flashcards',
            targetCount: 15,
            unit: 'cards',
            timeframe: 'During morning commute at 8:30 AM',
            reminderTime: '08:30',
            smartObjective: 'Specific: Anki or Duolingo flashcard review | Measurable: 15 cards | Time-bound: Completed in 15 mins',
            rationale: 'Habit stacking learning on existing commute time guarantees 100% execution consistency.',
          },
        ],
        creativity: [
          {
            smartTitle: '30-Min Unfiltered Creative Sketching/Writing',
            targetCount: 30,
            unit: 'mins',
            timeframe: 'Daily at 5:00 PM',
            reminderTime: '17:00',
            smartObjective: 'Specific: Free-form creative output with zero judgment | Measurable: 30 mins | Time-bound: Done before dinner at 6:00 PM',
            rationale: 'Daily unstructured creation builds fluid artistic momentum and reduces perfectionism block.',
          },
          {
            smartTitle: '1 Original Design/Audio Concept',
            targetCount: 1,
            unit: 'concept',
            timeframe: 'Every evening at 8:00 PM',
            reminderTime: '20:00',
            smartObjective: 'Specific: Complete 1 tangible project draft/sample | Measurable: 1 concept | Time-bound: Exported by 9:00 PM',
            rationale: 'Focusing on finished micro-deliverables builds an impressive portfolio quickly.',
          },
          {
            smartTitle: '15-Min Visual Inspiration Curation',
            targetCount: 15,
            unit: 'mins',
            timeframe: '1:00 PM post-lunch reset',
            reminderTime: '13:00',
            smartObjective: 'Specific: Study top-tier design galleries | Measurable: 15 mins | Time-bound: Wrap up by 1:15 PM',
            rationale: 'Continuous visual inputs expand aesthetic range and spark fresh project ideas.',
          },
        ],
      };

      const fallbackList = fallbackGoalsByCategory[category] || fallbackGoalsByCategory.productivity;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({ goals: fallbackList });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an elite behavioral science AI and habit design expert.
User Category: "${category}"
User Current Title (optional): "${currentTitle}"
User Current Target (optional): ${currentTargetCount || 'none'} ${currentUnit || ''}

Generate exactly 3 SMART (Specific, Measurable, Achievable, Relevant, Time-bound) habit goals engineered to maximize habit compliance and success rate for this category.

For each goal, return a JSON object with:
- "smartTitle": A punchy, action-oriented title (e.g. "20-Min Morning HIIT Session", "20 Pages of Growth Reading")
- "targetCount": Recommended numeric target (e.g. 20, 5, 1, 30)
- "unit": Concise unit (e.g. "mins", "km", "session", "pages", "Liters")
- "timeframe": Specific time window (e.g. "07:00 AM daily before breakfast", "At 9:00 PM before sleep")
- "reminderTime": Recommended 24-hour time string for reminder (e.g. "06:45", "21:00", "08:30")
- "smartObjective": Concise breakdown statement like "Specific: [detail] | Measurable: [quantity] | Time-bound: [window]"
- "rationale": 1 sentence explaining why this SMART formulation increases habit completion rate by 40%+.

Return strictly a valid JSON object:
{
  "goals": [
    {
      "smartTitle": "...",
      "targetCount": 20,
      "unit": "...",
      "timeframe": "...",
      "reminderTime": "08:00",
      "smartObjective": "...",
      "rationale": "..."
    }, ... 2 more
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.goals) && parsed.goals.length > 0) {
          return res.json({ goals: parsed.goals });
        }
      } catch (err) {
        console.error('Failed to parse SMART goals JSON:', err);
      }

      return res.json({ goals: fallbackList });
    } catch (err) {
      console.error('SMART Goals Error:', err);
      return res.json({
        goals: [
          {
            smartTitle: '20-Min Morning Focus Sprint',
            targetCount: 20,
            unit: 'mins',
            timeframe: 'Daily at 08:00 AM',
            reminderTime: '07:45',
            smartObjective: 'Specific: 20 mins uninterrupted focus | Measurable: 20 mins | Time-bound: Done before 8:30 AM',
            rationale: 'Structured morning time-blocking guarantees steady daily execution.',
          },
        ],
      });
    }
  });

  // Mock Cloud Data Sync Backup Endpoint
  const cloudSyncStorage = new Map<string, unknown>();

  app.post('/api/sync/save', (req, res) => {
    const { syncToken, data } = req.body;
    if (!syncToken) {
      return res.status(400).json({ error: 'Sync token required' });
    }
    cloudSyncStorage.set(syncToken, {
      data,
      syncedAt: new Date().toISOString(),
    });
    return res.json({ success: true, message: 'Cloud backup saved successfully!' });
  });

  app.get('/api/sync/load/:syncToken', (req, res) => {
    const { syncToken } = req.params;
    const item = cloudSyncStorage.get(syncToken);
    if (!item) {
      return res.status(404).json({ error: 'Sync token not found or expired' });
    }
    return res.json({ success: true, payload: item });
  });

  // Vite Middleware or Production Static Handler
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HabitPulse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

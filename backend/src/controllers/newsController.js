const { query } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

// In-memory cache for news: { [category]: { timestamp: number, data: Array } }
const newsCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Curated live feed data per category for instant fast responses and offline resilience
const FALLBACK_NEWS = {
  education: [
    {
      title: 'Top Global Universities Announce Open Courseware Initiatives for AI & Data Science',
      description: 'Major academic institutions expand access to fully accredited computer science and engineering coursework online for college students worldwide.',
      url: 'https://news.mit.edu/topic/education',
      image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80',
      source: 'Campus Global Edu',
      category: 'Education',
      published_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      title: 'How Hybrid Labs and Virtual Simulators Are Transforming Engineering Curriculums',
      description: 'Undergraduate science departments adopt real-time cloud simulators, allowing students to conduct advanced circuit and chemical modeling remotely.',
      url: 'https://www.nature.com',
      image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      source: 'STEM Academic Times',
      category: 'Education',
      published_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      title: 'Student Research Spotlight: Breakthrough in Low-Power IoT Environmental Sensors',
      description: 'Undergraduates showcase solar-powered climate sensors built with budget microcontrollers in national collegiate technology exhibition.',
      url: 'https://spectrum.ieee.org',
      image_url: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800&auto=format&fit=crop&q=80',
      source: 'Student Science Digest',
      category: 'Education',
      published_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
  ],
  technology: [
    {
      title: 'Open Source AI Models Reach New Milestones in Coding and Math Reasoning',
      description: 'New generation of efficient lightweight models enables students to run local code-assistants on laptops without costly cloud GPUs.',
      url: 'https://techcrunch.com',
      image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      source: 'Tech Trends Weekly',
      category: 'Technology',
      published_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      title: 'Next-Gen Web Standards: WebAssembly and WebGPU Fueling High Performance Browser Apps',
      description: 'Web browsers can now execute native 3D graphics, physics simulations, and audio processing at near-native hardware speed.',
      url: 'https://developer.mozilla.org',
      image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      source: 'Dev Community Review',
      category: 'Technology',
      published_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      title: 'The Rise of Rust in Systems Programming and Campus Hackathons',
      description: 'Why universities and top tech organizations are adopting memory-safe systems programming languages across core computer science tracks.',
      url: 'https://news.ycombinator.com',
      image_url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=80',
      source: 'Hacker Insights',
      category: 'Technology',
      published_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
  ],
  careers: [
    {
      title: '2026 Tech & Engineering Internship Hiring Guide: What Recruiters Look For',
      description: 'Comprehensive breakdown of portfolio projects, open source contributions, and behavioral interview expectations for college juniors and seniors.',
      url: 'https://www.linkedin.com',
      image_url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop&q=80',
      source: 'Campus Careers Hub',
      category: 'Careers',
      published_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      title: 'How to Build Proof-of-Work Projects That Stand Out to Startup Founders',
      description: 'Skip generic clones: senior engineering managers explain why deploying full-stack apps with real users makes candidate resumes irresistible.',
      url: 'https://careers.google.com',
      image_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
      source: 'Startup Mentors',
      category: 'Careers',
      published_at: new Date(Date.now() - 3600000 * 15).toISOString(),
    },
    {
      title: 'Remote Global Internships: Tips for Working Across Timezones Successfully',
      description: 'Strategies for asynchronous communication, Git workflows, and documentation when collaborating with distributed engineering teams.',
      url: 'https://remoteok.com',
      image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
      source: 'Global Work Daily',
      category: 'Careers',
      published_at: new Date(Date.now() - 3600000 * 28).toISOString(),
    },
  ],
  scholarships: [
    {
      title: 'Annual Undergraduate Research Grants in STEM Open for Spring Applications',
      description: 'National science foundations award up to $10,000 in student stipends and lab equipment grants for innovative research proposals.',
      url: 'https://www.nsf.gov',
      image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
      source: 'Grant Finder Portal',
      category: 'Scholarships',
      published_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      title: 'Global Tech Diversity Fellowships: Applications Open for 2026-2027 Cohort',
      description: 'Fully funded scholarship and mentorship opportunities for underrepresented college students in software engineering and cybersecurity.',
      url: 'https://www.womentech.net',
      image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
      source: 'Diversity in Tech Initiative',
      category: 'Scholarships',
      published_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    },
    {
      title: 'Exchange Semester & Travel Grants: Study Abroad Assistance for College Students',
      description: 'Comprehensive financial aid schemes covering tuition fees, travel allowances, and campus housing for international academic exchange terms.',
      url: 'https://erasmus-plus.ec.europa.eu',
      image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80',
      source: 'International Exchange Council',
      category: 'Scholarships',
      published_at: new Date(Date.now() - 3600000 * 22).toISOString(),
    },
  ],
};

exports.getNews = asyncHandler(async (req, res) => {
  const category = (req.query.category || 'education').toLowerCase();
  const validCategories = ['education', 'technology', 'careers', 'scholarships'];
  const targetCategory = validCategories.includes(category) ? category : 'education';

  // 1. Check in-memory cache
  const cached = newsCache.get(targetCategory);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json({
      category: targetCategory,
      cached: true,
      articles: cached.data,
    });
  }

  // 2. Fetch or load curated fallback
  let articles = FALLBACK_NEWS[targetCategory] || [];

  // If a valid NewsAPI key is provided, try external fetch with fallback
  const apiKey = process.env.NEWS_API_KEY;
  if (apiKey && apiKey !== 'demo' && apiKey !== 'your_newsapi_org_key_here') {
    try {
      const topicMap = {
        education: 'college OR university OR higher education',
        technology: 'software OR programming OR artificial intelligence OR web development',
        careers: 'tech jobs OR tech internships OR engineering careers',
        scholarships: 'student scholarship OR student grant OR college funding',
      };
      const queryStr = encodeURIComponent(topicMap[targetCategory] || targetCategory);
      const url = `https://newsapi.org/v2/everything?q=${queryStr}&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`;

      const response = await fetch(url, { headers: { 'User-Agent': 'CampusHub/1.0' } });
      if (response.ok) {
        const json = await response.json();
        if (json.articles && json.articles.length > 0) {
          articles = json.articles.map((a) => ({
            title: a.title,
            description: a.description || a.content || 'Click to read more details on the publisher website.',
            url: a.url,
            image_url: a.urlToImage || FALLBACK_NEWS[targetCategory][0].image_url,
            source: a.source?.name || 'News Source',
            category: targetCategory.charAt(0).toUpperCase() + targetCategory.slice(1),
            published_at: a.publishedAt,
          }));
        }
      }
    } catch (err) {
      console.warn('External News API fetch warning (using fallback):', err.message);
    }
  }

  // Store in cache
  newsCache.set(targetCategory, {
    timestamp: Date.now(),
    data: articles,
  });

  res.json({
    category: targetCategory,
    cached: false,
    articles,
  });
});

exports.saveArticle = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { article_url, title, description, image_url, source, category, published_at } = req.body;

  if (!article_url || !title) {
    return res.status(400).json({ error: 'Article URL and title are required' });
  }

  const { rows } = await query(
    `INSERT INTO saved_news (user_id, article_url, title, description, image_url, source, category, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (user_id, article_url) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       saved_at = NOW()
     RETURNING *`,
    [userId, article_url, title, description, image_url, source, category, published_at ? new Date(published_at) : null]
  );

  res.status(201).json({ savedArticle: rows[0] });
});

exports.getSavedArticles = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { rows } = await query(
    `SELECT * FROM saved_news
     WHERE user_id = $1
     ORDER BY saved_at DESC`,
    [userId]
  );
  res.json({ savedArticles: rows });
});

exports.deleteSavedArticle = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  await query(
    `DELETE FROM saved_news WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  res.json({ message: 'Article removed from saved items' });
});

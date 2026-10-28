-- ============================================================
-- CampusHub Seed Data
-- ============================================================
-- Passwords are all: password123
-- Hash generated with bcrypt rounds=10

-- ============================================================
-- USERS
-- ============================================================
INSERT INTO users (id, name, email, password_hash, college, course, year, bio, avatar_url) VALUES
(
  'a1b2c3d4-0001-0001-0001-000000000001',
  'Alex Johnson',
  'alex@university.edu',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
  'State University',
  'Computer Science',
  3,
  'CS student passionate about AI and open source. Love building things!',
  NULL
),
(
  'a1b2c3d4-0002-0002-0002-000000000002',
  'Sarah Chen',
  'sarah@university.edu',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
  'State University',
  'Data Science',
  2,
  'Data science enthusiast. Math nerd. Coffee addict ☕',
  NULL
),
(
  'a1b2c3d4-0003-0003-0003-000000000003',
  'Marcus Williams',
  'marcus@university.edu',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
  'Tech College',
  'Electronics Engineering',
  4,
  'Hardware hacker. Robotics club president. Building the future one circuit at a time.',
  NULL
),
(
  'a1b2c3d4-0004-0004-0004-000000000004',
  'Priya Sharma',
  'priya@university.edu',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
  'State University',
  'Computer Science',
  1,
  'First year CS student! Learning to code and loving every bit of it 💻',
  NULL
),
(
  'a1b2c3d4-0005-0005-0005-000000000005',
  'Jordan Lee',
  'jordan@university.edu',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
  'Arts College',
  'Digital Media',
  3,
  'Creative coder. Designer at heart. Making the web beautiful.',
  NULL
);

-- ============================================================
-- BOOKS
-- ============================================================
INSERT INTO books (id, owner_id, title, author, subject, condition, listing_type, price, description, status, photos) VALUES
(
  'b0000001-0001-0001-0001-000000000001',
  'a1b2c3d4-0001-0001-0001-000000000001',
  'Introduction to Algorithms',
  'Cormen, Leiserson, Rivest, Stein',
  'Data Structures & Algorithms',
  'good',
  'sell',
  450.00,
  'CLRS 3rd edition. Some highlights but in great shape overall. Perfect for CS students.',
  'available',
  '[]'
),
(
  'b0000001-0002-0002-0002-000000000002',
  'a1b2c3d4-0002-0002-0002-000000000002',
  'Python Data Science Handbook',
  'Jake VanderPlas',
  'Data Science',
  'new',
  'exchange',
  0,
  'Brand new, barely used. Looking to exchange for a Machine Learning textbook.',
  'available',
  '[]'
),
(
  'b0000001-0003-0003-0003-000000000003',
  'a1b2c3d4-0003-0003-0003-000000000003',
  'Digital Design and Computer Architecture',
  'David Harris & Sarah Harris',
  'Electronics',
  'fair',
  'donate',
  0,
  'Donating this. Has some notes in margins. Good for ECE students.',
  'available',
  '[]'
),
(
  'b0000001-0004-0004-0004-000000000004',
  'a1b2c3d4-0001-0001-0001-000000000001',
  'Operating System Concepts',
  'Abraham Silberschatz',
  'Operating Systems',
  'good',
  'sell',
  380.00,
  'Dinosaur book. 10th edition. All chapters intact.',
  'available',
  '[]'
),
(
  'b0000001-0005-0005-0005-000000000005',
  'a1b2c3d4-0005-0005-0005-000000000005',
  'Don''t Make Me Think',
  'Steve Krug',
  'UI/UX Design',
  'good',
  'exchange',
  0,
  'Classic UX design book. Want to exchange for anything about typography or visual design.',
  'available',
  '[]'
);

-- ============================================================
-- NOTES
-- ============================================================
INSERT INTO notes (id, uploader_id, title, subject, semester, description, file_url, file_type, tags, download_count) VALUES
(
  'e0000001-0001-0001-0001-000000000001',
  'a1b2c3d4-0001-0001-0001-000000000001',
  'Dynamic Programming Complete Guide',
  'Data Structures & Algorithms',
  5,
  'Comprehensive notes covering DP patterns, top-down vs bottom-up, and 30+ practice problems with solutions.',
  '/uploads/notes/dp_guide.pdf',
  'pdf',
  '["algorithms","dynamic-programming","competitive-coding"]',
  47
),
(
  'e0000001-0002-0002-0002-000000000002',
  'a1b2c3d4-0002-0002-0002-000000000002',
  'Machine Learning Fundamentals',
  'Data Science',
  4,
  'Notes from ML course covering regression, classification, clustering, and neural networks basics.',
  '/uploads/notes/ml_fundamentals.pdf',
  'pdf',
  '["machine-learning","AI","data-science"]',
  89
),
(
  'e0000001-0003-0003-0003-000000000003',
  'a1b2c3d4-0003-0003-0003-000000000003',
  'Microprocessors 8085 Quick Reference',
  'Electronics',
  3,
  'Quick reference sheet for 8085 microprocessor instructions, pin diagram and architecture.',
  '/uploads/notes/8085_ref.pdf',
  'pdf',
  '["microprocessors","electronics","ECE"]',
  33
),
(
  'e0000001-0004-0004-0004-000000000004',
  'a1b2c3d4-0004-0004-0004-000000000004',
  'Python Basics for Beginners',
  'Programming',
  1,
  'My first-year notes on Python. Variables, loops, functions, OOP basics. Great for absolute beginners!',
  '/uploads/notes/python_basics.pdf',
  'pdf',
  '["python","programming","beginner"]',
  124
),
(
  'e0000001-0005-0005-0005-000000000005',
  'a1b2c3d4-0005-0005-0005-000000000005',
  'UI/UX Design Principles',
  'Design',
  4,
  'Color theory, typography, layout grids, accessibility guidelines. With visual examples.',
  '/uploads/notes/ux_principles.pdf',
  'pdf',
  '["design","UI","UX","accessibility"]',
  61
);

-- ============================================================
-- NOTE LIKES
-- ============================================================
INSERT INTO note_likes (note_id, user_id) VALUES
('e0000001-0001-0001-0001-000000000001', 'a1b2c3d4-0002-0002-0002-000000000002'),
('e0000001-0001-0001-0001-000000000001', 'a1b2c3d4-0003-0003-0003-000000000003'),
('e0000001-0001-0001-0001-000000000001', 'a1b2c3d4-0004-0004-0004-000000000004'),
('e0000001-0002-0002-0002-000000000002', 'a1b2c3d4-0001-0001-0001-000000000001'),
('e0000001-0002-0002-0002-000000000002', 'a1b2c3d4-0003-0003-0003-000000000003'),
('e0000001-0004-0004-0004-000000000004', 'a1b2c3d4-0001-0001-0001-000000000001'),
('e0000001-0004-0004-0004-000000000004', 'a1b2c3d4-0002-0002-0002-000000000002'),
('e0000001-0004-0004-0004-000000000004', 'a1b2c3d4-0005-0005-0005-000000000005');

-- ============================================================
-- NOTE COMMENTS
-- ============================================================
INSERT INTO note_comments (note_id, user_id, content) VALUES
('e0000001-0001-0001-0001-000000000001', 'a1b2c3d4-0002-0002-0002-000000000002', 'These DP notes saved my exam! The patterns explanation is so clear.'),
('e0000001-0001-0001-0001-000000000001', 'a1b2c3d4-0004-0004-0004-000000000004', 'Can you add more examples for knapsack problems? Really helpful!'),
('e0000001-0002-0002-0002-000000000002', 'a1b2c3d4-0001-0001-0001-000000000001', 'Great intro to ML. Are you planning to add deep learning notes too?'),
('e0000001-0004-0004-0004-000000000004', 'a1b2c3d4-0003-0003-0003-000000000003', 'This is perfect for beginners. Sharing with my juniors!');

-- ============================================================
-- COMMUNITIES
-- ============================================================
INSERT INTO communities (id, name, slug, description, category, is_private, admin_id, member_count) VALUES
(
  'c0000001-0001-0001-0001-000000000001',
  'CS Study Group',
  'cs-study-group',
  'A community for Computer Science students to share resources, solve problems, and prep for exams together.',
  'course',
  false,
  'a1b2c3d4-0001-0001-0001-000000000001',
  1
),
(
  'c0000001-0002-0002-0002-000000000002',
  'Data Science & ML Hub',
  'data-science-ml-hub',
  'Discuss datasets, ML papers, Kaggle competitions and data science careers.',
  'subject',
  false,
  'a1b2c3d4-0002-0002-0002-000000000002',
  1
),
(
  'c0000001-0003-0003-0003-000000000003',
  'Robotics Club',
  'robotics-club',
  'Official robotics club community. Build robots, compete in contests, share schematics.',
  'club',
  false,
  'a1b2c3d4-0003-0003-0003-000000000003',
  1
),
(
  'c0000001-0004-0004-0004-000000000004',
  'Startup Garage',
  'startup-garage',
  'For student entrepreneurs. Share ideas, find co-founders, discuss funding and product building.',
  'interest',
  false,
  'a1b2c3d4-0005-0005-0005-000000000005',
  1
);

-- ============================================================
-- COMMUNITY MEMBERS
-- ============================================================
INSERT INTO community_members (community_id, user_id, role) VALUES
('c0000001-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001', 'admin'),
('c0000001-0001-0001-0001-000000000001', 'a1b2c3d4-0002-0002-0002-000000000002', 'member'),
('c0000001-0001-0001-0001-000000000001', 'a1b2c3d4-0004-0004-0004-000000000004', 'member'),
('c0000001-0002-0002-0002-000000000002', 'a1b2c3d4-0002-0002-0002-000000000002', 'admin'),
('c0000001-0002-0002-0002-000000000002', 'a1b2c3d4-0001-0001-0001-000000000001', 'member'),
('c0000001-0003-0003-0003-000000000003', 'a1b2c3d4-0003-0003-0003-000000000003', 'admin'),
('c0000001-0003-0003-0003-000000000003', 'a1b2c3d4-0001-0001-0001-000000000001', 'member'),
('c0000001-0004-0004-0004-000000000004', 'a1b2c3d4-0005-0005-0005-000000000005', 'admin'),
('c0000001-0004-0004-0004-000000000004', 'a1b2c3d4-0001-0001-0001-000000000001', 'member'),
('c0000001-0004-0004-0004-000000000004', 'a1b2c3d4-0002-0002-0002-000000000002', 'member');

-- ============================================================
-- POSTS
-- ============================================================
INSERT INTO posts (id, author_id, community_id, content, tags, like_count, comment_count) VALUES
(
  'd0000001-0001-0001-0001-000000000001',
  'a1b2c3d4-0001-0001-0001-000000000001',
  'c0000001-0001-0001-0001-000000000001',
  'Just solved my 100th LeetCode problem! 🎉 Consistency is key. If anyone wants to pair-program for interview prep, drop a comment!',
  '["coding","leetcode","interviews"]',
  12, 3
),
(
  'd0000001-0002-0002-0002-000000000002',
  'a1b2c3d4-0002-0002-0002-000000000002',
  NULL,
  'Hot take: Data cleaning is 80% of data science work and nobody talks about it enough. What tools do you use for EDA? Sharing my Pandas cheat sheet soon 📊',
  '["data-science","python","pandas"]',
  24, 5
),
(
  'd0000001-0003-0003-0003-000000000003',
  'a1b2c3d4-0003-0003-0003-000000000003',
  'c0000001-0003-0003-0003-000000000003',
  'Our robot just completed the obstacle course in 4.2 seconds! 🤖 Next up: autonomous navigation. Super proud of the team this semester!',
  '["robotics","engineering","proud"]',
  31, 7
),
(
  'd0000001-0004-0004-0004-000000000004',
  'a1b2c3d4-0004-0004-0004-000000000004',
  NULL,
  'First week of college done! CS is harder than I expected but the community here is amazing. Grateful for all the notes and seniors helping out 🙏',
  '["firstyear","college","grateful"]',
  45, 12
),
(
  'd0000001-0005-0005-0005-000000000005',
  'a1b2c3d4-0005-0005-0005-000000000005',
  'c0000001-0004-0004-0004-000000000004',
  'Idea: a campus-wide app where students can post micro-tasks (tutoring, delivery, design gigs) and earn credits. Anyone want to build this? Looking for a dev co-founder! #startup-idea',
  '["startup-idea","app","collaborate"]',
  18, 9
);

-- ============================================================
-- POST LIKES
-- ============================================================
INSERT INTO post_likes (post_id, user_id) VALUES
('d0000001-0001-0001-0001-000000000001', 'a1b2c3d4-0002-0002-0002-000000000002'),
('d0000001-0001-0001-0001-000000000001', 'a1b2c3d4-0003-0003-0003-000000000003'),
('d0000001-0002-0002-0002-000000000002', 'a1b2c3d4-0001-0001-0001-000000000001'),
('d0000001-0002-0002-0002-000000000002', 'a1b2c3d4-0004-0004-0004-000000000004'),
('d0000001-0004-0004-0004-000000000004', 'a1b2c3d4-0001-0001-0001-000000000001'),
('d0000001-0004-0004-0004-000000000004', 'a1b2c3d4-0002-0002-0002-000000000002'),
('d0000001-0005-0005-0005-000000000005', 'a1b2c3d4-0001-0001-0001-000000000001');

-- ============================================================
-- POST COMMENTS
-- ============================================================
INSERT INTO post_comments (post_id, user_id, content) VALUES
('d0000001-0001-0001-0001-000000000001', 'a1b2c3d4-0002-0002-0002-000000000002', 'That is amazing! I am at problem 56. The grind continues 💪'),
('d0000001-0001-0001-0001-000000000001', 'a1b2c3d4-0004-0004-0004-000000000004', 'Would love to pair-program! Can we start this weekend?'),
('d0000001-0002-0002-0002-000000000002', 'a1b2c3d4-0001-0001-0001-000000000001', 'Please share that Pandas cheat sheet! We need it for our ML project.'),
('d0000001-0004-0004-0004-000000000004', 'a1b2c3d4-0001-0001-0001-000000000001', 'Welcome! It gets better. Reach out anytime if you need help.'),
('d0000001-0005-0005-0005-000000000005', 'a1b2c3d4-0001-0001-0001-000000000001', 'This is a great idea! I can help with the backend. DM me.');

-- ============================================================
-- MESSAGES (Sample chat history)
-- ============================================================
INSERT INTO messages (sender_id, receiver_id, community_id, content, is_read) VALUES
('a1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0002-0002-0002-000000000002', NULL, 'Hey Sarah! Got your ML notes. Super helpful, thanks!', true),
('a1b2c3d4-0002-0002-0002-000000000002', 'a1b2c3d4-0001-0001-0001-000000000001', NULL, 'Glad they helped! Let me know if you have any questions 😊', true),
('a1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0002-0002-0002-000000000002', NULL, 'Will do! Are you free this weekend to go over the neural network part?', false),
('a1b2c3d4-0001-0001-0001-000000000001', NULL, 'c0000001-0001-0001-0001-000000000001', 'Hey CS Study Group! Quiz next week. Anyone up for a group session?', true),
('a1b2c3d4-0002-0002-0002-000000000002', NULL, 'c0000001-0001-0001-0001-000000000001', 'Count me in! Saturday evening works for me.', true),
('a1b2c3d4-0004-0004-0004-000000000004', NULL, 'c0000001-0001-0001-0001-000000000001', 'Me too! Can someone share the syllabus?', false);


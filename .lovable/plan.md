# Rethink the Community left menu around the SOQ community

## Is the current menu working?
The links in the menu work, but the menu doesn't really fit a community yet. 9 of its 11 links are academy pages (courses, funding, about, contact) that are already in the main site menu. It shows nothing that helps members connect with each other. dev.to's menu works because it's built around what members do: read, ask, show their work, find events and jobs.

The SOQ community has four kinds of members, each with different needs:
- **Prospective students:** want honest reviews and answers before they sign up.
- **Current students:** want study help, class questions and deadlines.
- **Alumni:** want to show their work, find clients and get hired.
- **Trainers and businesses:** want to share know-how, find talent and gain trust (the Verified badge).

## New menu (top to bottom)

**Community**
- Home (all posts)
- Ask & Answer: posts tagged as questions
- Showcase: before/after photos, portfolios and projects
- Jobs & Gigs: hiring posts from businesses, freelance work
- Stories: career-switch and personal-journey posts
- Tech & AI: API, AI and tool guides, plus video posts
- Members: a directory with filters for Students, Alumni, Trainers, Businesses and Verified
- Saved posts (for signed-in members)

**Learn with SOQ** (short, can be collapsed)
- Find my course, Course calendar, Funding & SkillsFuture, Student portal

**Posts from:** stays as it is (Everyone, Students, Alumni, Trainers, Businesses)

**Other:** Community guidelines (new short page), Student policies, PEI profile

The dropped links (All courses, Compare, Trainers, Resources, About, Contact) stay reachable from the main site menu and footer.

## Also
- A short "Community guidelines" page covering being respectful, no spam, honest reviews, how staff moderate, and what the Verified badge means.
- The "Write a post" page gets a **Post type** choice (Question, Showcase, Job, Story, Guide) that sets the matching topic tag automatically, so each menu section fills up without extra work.
- Put the existing sample posts into the new sections so none of them are empty.

## Technical details
- Each section is a filter on the existing community feed through its search settings (a preset tag such as question, showcase, jobs, story or tech). No database changes are needed.
- New pages: the Members directory (reads the public community profiles, with member type and verified filters), Saved posts (reads the member's own bookmarks) and Community guidelines. Each has its own page title and description.
- The active menu item is highlighted based on the current filter. On phones the menu becomes a row of filter buttons you can swipe sideways.

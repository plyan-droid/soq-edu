# SOQ International Academy website rebuild

## Goal
Rebuild the complete SOQ website with the approved landing-page design as the visual authority, while migrating accurate public content, links, and course information from the current `soq.edu.sg` website.

## Visual direction
- Recreate the approved cream, navy, white, and gold presentation with editorial serif headings and clean sans-serif supporting text.
- Match the approved homepage composition: branded header, learning-focused banner, four study-path cards, credibility strip, course finder, featured courses, corporate-training band, and detailed footer.
- Use polished, relevant education and course imagery rather than embedding the supplied screenshot itself.
- Adapt every layout for desktop, tablet, and mobile while preserving the approved hierarchy and premium academic character.
- Keep motion restrained: subtle content reveals, course-card transitions, and clear interactive feedback.

## Pages and content
- Home page based closely on the approved design.
- Course catalogue with categories for AI & Business, Beauty & Wellness, Retail & Service, Workshops, Diplomas, and professional qualifications.
- Individual course pages populated from the current public course information, including duration, delivery mode, fees/funding information, outcomes, and enrollment actions where available.
- For Businesses / Corporate Training page.
- Funding information page.
- About SOQ and trainer profiles.
- Resources area covering news/blog, FAQs, registration guidance, PEI profile, student policies, data policy, and recruitment-agent information.
- Contact and course-advice page with phone, email, location, WhatsApp, and enquiry options from the current site.
- Preserve important existing public URLs where practical; provide redirects where the new structure differs.

## Shared experience
- Build a consistent site-wide header, mobile navigation, footer, breadcrumbs, and calls to action.
- Add working category filtering and course discovery controls.
- Keep enrollment connected to the existing external training-management portal rather than recreating booking or payment systems.
- Keep social links, downloadable resources, WhatsApp consultation, and enquiry paths functional.
- Add clear empty, loading, unavailable, and form-validation states where relevant.

## Content and assets
- Audit the public site page by page and migrate usable text, course facts, regulatory content, contact details, outbound links, and metadata.
- Source or generate a cohesive set of new images matching the approved art direction; reuse official public brand marks only where suitable.
- Flag any content that is inaccessible, contradictory, or clearly outdated instead of inventing replacements.

## Search and quality
- Give every public page unique titles, descriptions, social-sharing metadata, and suitable structured data for courses and FAQs.
- Preserve search value through stable paths and redirects.
- Meet accessibility basics: semantic structure, keyboard navigation, visible focus, descriptive image text, readable contrast, and properly labelled forms.
- Verify navigation, course filtering, external enrollment links, WhatsApp/contact actions, forms, and downloadable resources.
- Check the finished site visually at desktop and mobile sizes and resolve layout, loading, and console errors.

## Technical approach
- Use the existing TanStack Start application and its shared design-token system.
- Organize migrated content into maintainable typed data and reusable page sections so course and policy pages stay consistent.
- Keep the rebuild frontend-first and retain external systems for enrollment; no new database or login system is included unless a later requirement needs one.
- Implement the work in batches: shared design and navigation, approved homepage, catalogue/course templates, institutional/resource pages, then redirects and final verification.

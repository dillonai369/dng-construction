// Builds the DNG Construction site into dist/: pages, blog, sitemap, styles and photos.
import { mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { posts } from '../src/posts.mjs';
import { fetchImages } from './fetch-images.mjs';

const SITE = 'https://www.dngllcconstruction.com';
const NAME = 'DNG Construction';
const PHONE = '(786) 358-7238';
const EMAIL = 'info@dngllcconstruction.com';
// Preview mode keeps search engines out until contact details and photos are final.
const PREVIEW = true;

const OUT = 'dist';
const arrow = '<svg class="arrow" aria-hidden="true" viewBox="0 0 18 10" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M0 5h16M12 1l4 4-4 4"/></svg>';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const NAV = [
  ['/home-remodeling', 'Home Remodeling'],
  ['/commercial-remodeling', 'Commercial'],
  ['/projects', 'Projects'],
  ['/process', 'Process'],
  ['/about', 'About'],
  ['/blog', 'Blog'],
];

function layout({ path, title, desc, body, schema = [], ogType = 'website' }) {
  const url = SITE + (path === '/' ? '/' : path);
  const current = (href) => (path === href || path.startsWith(href + '/') ? ' aria-current="page"' : '');
  const org = {
    '@context': 'https://schema.org', '@type': 'GeneralContractor', name: NAME, url: SITE + '/',
    logo: SITE + '/brand/logo-dark.png', image: SITE + '/img/og.jpg',
    description: 'Home and commercial remodeling by one accountable crew.',
  };
  const ld = [org, ...schema].map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${PREVIEW ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="index, follow">'}
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#050A1E">
<link rel="icon" type="image/png" href="/brand/mark.png">
<meta property="og:type" content="${ogType}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="${NAME}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE}/img/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/img/og.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..125,400..700&display=swap">
<link rel="stylesheet" href="/styles.css">
${ld}
</head>
<body>
<script>document.documentElement.classList.add("js")</script>
<a class="skip" href="#main">Skip to content</a>
<div class="progress" id="progress" aria-hidden="true"></div>

<header id="hdr">
  <div class="wrap bar">
    <a class="logo" href="/"><img src="/brand/logo-white.png" width="720" height="262" alt="${NAME} home"></a>
    <nav aria-label="Main">
      ${NAV.map(([h, t]) => `<a href="${h}"${current(h)}>${t}</a>`).join('\n      ')}
    </nav>
    <div class="bar-end">
      <a class="btn" href="/contact">Free Estimate</a>
      <button class="menu-btn" id="menu-btn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mnav"><span></span></button>
    </div>
  </div>
</header>
<div class="mnav" id="mnav" hidden>
  <a href="/">Home</a>
  ${NAV.map(([h, t]) => `<a href="${h}"${current(h)}>${t}</a>`).join('\n  ')}
  <a class="btn solid" href="/contact">Get a Free Estimate ${arrow}</a>
</div>

<main id="main">
${body}
</main>

<footer>
  <div class="wrap">
    <div class="foot">
      <div>
        <a class="logo" href="/"><img src="/brand/logo-white.png" width="720" height="262" loading="lazy" alt="${NAME}"></a>
        <p>Home and commercial remodeling, built by one accountable crew.</p>
      </div>
      <div>
        <h3>Explore</h3>
        <ul>
          ${NAV.map(([h, t]) => `<li><a href="${h}">${t === 'Commercial' ? 'Commercial Remodeling' : t}</a></li>`).join('\n          ')}
        </ul>
      </div>
      <div>
        <h3>Contact</h3>
        <ul>
          <li>${PHONE}</li>
          <li>${EMAIL}</li>
          <li><a href="/contact">Request a free estimate</a></li>
        </ul>
      </div>
    </div>
    <div class="legal">
      <span>© 2026 DNG Construction LLC. All rights reserved.</span>
      <span>Website by Studio 7</span>
    </div>
  </div>
</footer>

<script src="/site.js" defer></script>
</body>
</html>
`;
}

const crumbs = (items) => ({
  html: `<ol class="crumbs"><li><a href="/">Home</a></li>${items.map(([h, t], i) => (i === items.length - 1 ? `<li aria-current="page">${t}</li>` : `<li><a href="${h}">${t}</a></li>`)).join('')}</ol>`,
  schema: {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [['/', 'Home'], ...items].map(([h, t], i) => ({ '@type': 'ListItem', position: i + 1, name: t, item: SITE + h })),
  },
});

function pageHero({ label, title, lead, img, alt, trail, actions = '', meta = '' }) {
  return `<div class="page-hero${img ? '' : ' plain'}">
  ${img ? `<img class="bg" src="/img/${img}.jpg" width="2000" height="1125" alt="${esc(alt)}" fetchpriority="high">` : ''}
  <div class="wrap">
    ${trail.html}
    <p class="label">${label}</p>
    <h1>${title}</h1>
    ${lead ? `<p class="lead">${lead}</p>` : ''}
    ${meta ? `<p class="meta">${meta}</p>` : ''}
    ${actions ? `<div class="actions">${actions}</div>` : ''}
  </div>
</div>`;
}

const estimate = (heading = 'Tell Us About Your Project') => `<section class="paper" id="estimate">
  <div class="wrap quote">
    <div>
      <p class="label">Free estimate</p>
      <h2>${heading}</h2>
      <p>Share a few details and we'll get back to you to schedule a visit. There's no cost and no obligation.</p>
      <div class="lines">
        <div><span>Phone</span>${PHONE}</div>
        <div><span>Email</span>${EMAIL}</div>
      </div>
    </div>
    <form id="estimate-form" novalidate>
      <div class="field"><label for="f-name">Name</label><input id="f-name" name="name" autocomplete="name" required></div>
      <div class="field"><label for="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" required></div>
      <div class="field full"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email"></div>
      <div class="field"><label for="f-type">Property type</label>
        <select id="f-type" name="type"><option>Home</option><option>Commercial</option></select></div>
      <div class="field"><label for="f-service">Project</label>
        <select id="f-service" name="service"><option>Kitchen</option><option>Bathroom</option><option>Basement</option><option>Addition or whole-home</option><option>Tenant build-out</option><option>Office or retail renovation</option><option>Electrical or low-voltage</option><option>Something else</option></select></div>
      <div class="field full"><label for="f-msg">What do you have in mind?</label><textarea id="f-msg" name="message"></textarea></div>
      <button class="btn" type="submit">Request My Estimate</button>
      <p id="sent" role="status" hidden>This is a preview, so the form isn't connected yet. On the finished site this sends your request straight to the DNG team.</p>
    </form>
  </div>
</section>`;

const band = (label, heading, text, href, cta) => `<div class="band">
  <img class="bg" src="/img/crew.jpg" width="2000" height="1125" loading="lazy" alt="Construction crew walking through a building under renovation">
  <div class="wrap">
    <p class="label">${label}</p>
    <h2>${heading}</h2>
    <p>${text}</p>
    <a class="btn" href="${href}">${cta} ${arrow}</a>
  </div>
</div>`;

const svc = (items) => `<div class="svc-grid">${items.map(([t, p, list], i) => `
  <div class="svc"><i>${String(i + 1).padStart(2, '0')}</i><h3>${t}</h3><p>${p}</p>${list ? `<ul>${list.map((l) => `<li>${l}</li>`).join('')}</ul>` : ''}</div>`).join('')}
</div>`;

function faq(items) {
  return {
    html: `<div class="faq">${items.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>`,
    schema: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  };
}

const postCard = (p) => `<a class="post-card" href="/blog/${p.slug}">
  <div class="shot"><img src="/img/${p.img}.jpg" width="1000" height="625" loading="lazy" alt="${esc(p.alt)}"></div>
  <div class="body"><small>${p.category}</small><h3>${p.title}</h3><p>${p.excerpt}</p><span class="more">Read article</span></div>
</a>`;

const steps = [
  ['Walkthrough and estimate', 'We visit the space, listen to what you want and measure everything. The estimate is free.'],
  ['Scope, schedule and price', 'You get it in writing and approve it before any work starts.'],
  ['Build', 'Our crew does the work, keeps the site clean and keeps you updated along the way.'],
  ['Electrical and low-voltage', 'Panels, lighting, EV chargers, network and security wiring, handled by people who do it for a living.'],
  ['Final walkthrough', 'We go through the finished job together and fix anything you flag.'],
];
const rows = (extra = []) => `<div class="rows">${steps.map(([t, p], i) => `
  <div class="row"><i>${String(i + 1).padStart(2, '0')}</i><div><h3>${t}</h3><p>${p}${extra[i] ? ' ' + extra[i] : ''}</p></div></div>`).join('')}
</div>`;

const projects = [
  ['kitchen', 'Kitchen with navy and white cabinets', 'residential', 'Kitchen Remodel'],
  ['bath', 'Bathroom with a glass walk-in shower', 'residential', 'Primary Bath Renovation'],
  ['office', 'Open office with a glass conference room', 'commercial', 'Office Build-Out'],
  ['basement', 'Finished basement with a media wall', 'residential', 'Finished Basement'],
  ['commercial', 'Commercial lobby with a stone reception desk', 'commercial', 'Lobby Renovation'],
  ['home', 'Kitchen with dark cabinetry and a marble island', 'residential', 'Kitchen and Great Room'],
];

const pages = [];
const add = (p) => pages.push(p);

// ---------- Home
{
  const home = await readFile('src/home.html', 'utf8');
  const blogTeaser = `<section id="blog">
  <div class="wrap">
    <div class="head">
      <div><p class="label">From the blog</p><h2>Remodeling Advice Worth Reading</h2></div>
      <a class="btn" href="/blog">All Articles</a>
    </div>
    <div class="posts">${posts.slice(0, 3).map(postCard).join('\n')}</div>
  </div>
</section>`;
  add({
    path: '/', file: 'index.html',
    title: 'DNG Construction | Home & Commercial Remodeling',
    desc: 'DNG Construction remodels homes and commercial spaces with one crew from first walkthrough to final finish. Free estimates.',
    body: home.replace(/src="img\//g, 'src="/img/') + '\n' + blogTeaser + '\n' + estimate(),
  });
}

// ---------- Home remodeling
{
  const trail = crumbs([['/home-remodeling', 'Home Remodeling']]);
  const q = faq([
    ['How much does an estimate cost?', 'Nothing. We visit your home, talk through what you want, take measurements and send you an estimate at no charge and with no obligation.'],
    ['Will I know the price before work starts?', 'Yes. You get a written scope, schedule and price, and nothing starts until you approve it.'],
    ['How long will my remodel take?', 'It depends on the size of the job and the materials you choose. Your written schedule spells out the timeline before we begin, and we keep you updated if anything changes.'],
    ['Do you handle the electrical work too?', 'Yes. Electrical and low-voltage work is where our team comes from, so lighting, panel upgrades, EV chargers and network wiring are part of the same job.'],
  ]);
  add({
    path: '/home-remodeling', file: 'home-remodeling.html',
    title: 'Home Remodeling | Kitchens, Baths & Basements | DNG Construction',
    desc: 'Kitchen, bathroom, basement and whole-home remodeling by one accountable crew. Written scope and price before work starts. Free estimates.',
    schema: [trail.schema, q.schema],
    body: `${pageHero({ label: 'Home Remodeling', title: 'Make the House You Have Work the Way You Want', lead: 'Kitchens, bathrooms, basements, additions and whole-home renovations, planned properly and finished cleanly.', img: 'home', alt: 'Remodeled kitchen with dark cabinetry and a marble island', trail, actions: `<a class="btn solid" href="/contact">Get a Free Estimate ${arrow}</a><a class="btn" href="/projects">See Our Work</a>` })}

<section class="paper">
  <div class="wrap">
    <div class="head"><div><p class="label">What we remodel</p><h2>Every Room, One Crew</h2></div></div>
    ${svc([
      ['Kitchens', 'The room that gets used the most deserves the most thought.', ['Cabinets and countertops', 'Islands and layout changes', 'Lighting and appliance wiring']],
      ['Bathrooms', 'From a quick refresh to a full gut renovation.', ['Walk-in showers and tubs', 'Vanities and tile', 'Ventilation and heated floors']],
      ['Basements', 'Turn unused square footage into space you live in.', ['Family and media rooms', 'Wet bars and guest rooms', 'Home offices and gyms']],
      ['Additions', 'More room without moving.', ['Room and second-story additions', 'Sunrooms and mudrooms', 'Garage conversions']],
      ['Whole-home renovations', 'New floor plans and top-to-bottom updates.', ['Open-concept conversions', 'Rewiring and panel upgrades', 'Coordinated room-by-room phasing']],
      ['Flooring, paint and trim', 'The finish work that makes a remodel feel complete.', ['Hardwood, tile and vinyl plank', 'Interior painting', 'Doors, casings and millwork']],
    ])}
  </div>
</section>

<section>
  <div class="wrap approach">
    <div><p class="label">How it works</p><h2 style="margin-top:14px">A Remodel Without the Runaround</h2><p>The same five steps on every home project, so you always know what happens next.</p><a class="btn" style="margin-top:28px" href="/process">Our Full Process ${arrow}</a></div>
    ${rows()}
  </div>
</section>

<section class="paper">
  <div class="wrap">
    <div class="head"><div><p class="label">Common questions</p><h2>Before You Start</h2></div></div>
    ${q.html}
  </div>
</section>

${band('Ready when you are', 'Tell Us What You Want to Change', 'A short visit is all it takes to get a real number and a real schedule.', '/contact', 'Request a Free Estimate')}`,
  });
}

// ---------- Commercial remodeling
{
  const trail = crumbs([['/commercial-remodeling', 'Commercial Remodeling']]);
  const q = faq([
    ['Can you work while our business stays open?', 'In most cases, yes. We plan the work in phases and schedule the loud or disruptive parts around your hours where we can, and we agree on that plan with you before starting.'],
    ['Do you handle data, security and low-voltage wiring?', 'Yes. Network cabling, cameras, access control and lighting controls are built into the job, not handed to a separate contractor after the walls are closed.'],
    ['Will we get a fixed scope and schedule?', 'Yes. You receive a written scope, schedule and price to approve before any work begins.'],
    ['What kinds of spaces do you remodel?', 'Offices, retail stores, restaurants and tenant build-outs, from a single suite to a full floor.'],
  ]);
  add({
    path: '/commercial-remodeling', file: 'commercial-remodeling.html',
    title: 'Commercial Remodeling & Tenant Build-Outs | DNG Construction',
    desc: 'Tenant build-outs, office, retail and restaurant renovations with electrical, data and security wiring handled by the same crew. Free estimates.',
    schema: [trail.schema, q.schema],
    body: `${pageHero({ label: 'Commercial Remodeling', title: 'Spaces Built Around How Your Business Runs', lead: 'Tenant build-outs and renovations for offices, retail and restaurants, delivered on a schedule you can plan around.', img: 'commercial', alt: 'Finished commercial lobby with a stone reception desk', trail, actions: `<a class="btn solid" href="/contact">Get a Free Estimate ${arrow}</a><a class="btn" href="/projects">See Our Work</a>` })}

<section class="paper">
  <div class="wrap">
    <div class="head"><div><p class="label">What we build</p><h2>From Empty Shell to Open for Business</h2></div></div>
    ${svc([
      ['Tenant build-outs', 'Take a bare suite to move-in ready.', ['Framing, drywall and ceilings', 'Flooring and finishes', 'Power, lighting and data']],
      ['Office renovations', 'Update the space without losing the workweek.', ['Conference rooms and open floors', 'Reception and break areas', 'Phased, after-hours work']],
      ['Retail spaces', 'Storefronts and interiors that are ready for customers.', ['Sales floors and fitting rooms', 'Display lighting', 'Back-of-house storage']],
      ['Restaurants', 'Dining rooms and service areas built to work hard.', ['Dining and bar areas', 'Service counters', 'Lighting and power for equipment']],
      ['Electrical and lighting', 'The trade our team was built on.', ['Panels and circuits', 'LED lighting and controls', 'EV charging stations']],
      ['Data and security', 'Wired in while the walls are open.', ['Network cabling', 'Cameras and access control', 'Audio-visual rough-in']],
    ])}
  </div>
</section>

<section>
  <div class="wrap approach">
    <div><p class="label">How it works</p><h2 style="margin-top:14px">Built Around Your Schedule</h2><p>Downtime costs money. Every commercial job runs on a written plan you approve first.</p><a class="btn" style="margin-top:28px" href="/process">Our Full Process ${arrow}</a></div>
    ${rows()}
  </div>
</section>

<section class="paper">
  <div class="wrap">
    <div class="head"><div><p class="label">Common questions</p><h2>What Owners and Managers Ask</h2></div></div>
    ${q.html}
  </div>
</section>

${band('Let\'s plan it', 'Walk Us Through Your Space', 'We\'ll come out, look at the space and give you a scope, schedule and price in writing.', '/contact', 'Request a Free Estimate')}`,
  });
}

// ---------- Projects
{
  const trail = crumbs([['/projects', 'Projects']]);
  add({
    path: '/projects', file: 'projects.html',
    title: 'Remodeling Projects | DNG Construction',
    desc: 'A look at the home and commercial remodeling work DNG Construction does: kitchens, baths, basements, offices and lobbies.',
    schema: [trail.schema],
    body: `${pageHero({ label: 'Projects', title: 'The Kind of Work We Do', lead: 'Kitchens, baths, basements and commercial spaces, finished the way they were planned.', img: 'hero', alt: 'Modern home at dusk with interior lights on', trail })}

<section class="paper">
  <div class="wrap">
    <div class="filters" role="group" aria-label="Filter projects">
      <button type="button" data-filter="all" aria-pressed="true">All</button>
      <button type="button" data-filter="residential" aria-pressed="false">Residential</button>
      <button type="button" data-filter="commercial" aria-pressed="false">Commercial</button>
    </div>
    <div class="grid three">${projects.map(([img, alt, cat, title]) => `
      <figure class="card" data-cat="${cat}"><div class="shot"><img src="/img/${img}.jpg" width="1000" height="750" loading="lazy" alt="${esc(alt)}"></div><figcaption><small>${cat}</small><strong>${title}</strong></figcaption></figure>`).join('')}
    </div>
    <p class="fine">Sample images for this preview. Your own project photos go here.</p>
  </div>
</section>

${band('Your project next', 'Have a Space in Mind?', 'Tell us about it and we\'ll come take a look.', '/contact', 'Request a Free Estimate')}`,
  });
}

// ---------- Process
{
  const trail = crumbs([['/process', 'Process']]);
  add({
    path: '/process', file: 'process.html',
    title: 'Our Remodeling Process | DNG Construction',
    desc: 'Five clear steps from free walkthrough to final finish. A written scope, schedule and price before any work starts.',
    schema: [trail.schema],
    body: `${pageHero({ label: 'Our process', title: 'No Surprises. No Loose Ends.', lead: 'Every project runs the same way, whether it\'s one bathroom or a full tenant build-out.', img: 'crew', alt: 'Construction crew walking through a building under renovation', trail })}

<section class="paper">
  <div class="wrap two">
    <div><p class="label">Why it matters</p><h2 style="margin-top:14px">Most Remodel Problems Start Before the Work Does</h2></div>
    <div>
      <p>Unclear scope, a price that moves, a schedule nobody wrote down. Those are the things that turn a remodel into a headache, and all of them can be settled before the first tool comes out.</p>
      <p>So we settle them first. You see exactly what we're building, what it costs and when it will be done, and you approve it in writing.</p>
    </div>
  </div>
</section>

<section>
  <div class="wrap approach">
    <div><p class="label">Step by step</p><h2 style="margin-top:14px">Five Steps, Start to Finish</h2><p>Here's what happens after you get in touch.</p></div>
    ${rows([
      'Bring any photos, drawings or ideas you already have.',
      'If you want to change something, this is the easiest time to do it.',
      'One point of contact answers your questions throughout.',
      'Because it\'s our own trade, it\'s planned from day one and not squeezed in at the end.',
      'The job isn\'t finished until you say it is.',
    ])}
  </div>
</section>

${estimate('Start With a Free Walkthrough')}`,
  });
}

// ---------- About
{
  const trail = crumbs([['/about', 'About']]);
  add({
    path: '/about', file: 'about.html',
    title: 'About DNG Construction | Home & Commercial Remodeling',
    desc: 'DNG Construction comes from the family behind DNexus Group, with 33+ years in electrical and low-voltage construction. One crew, every trade.',
    schema: [trail.schema],
    body: `${pageHero({ label: 'About us', title: 'One Crew. Every Trade. Start to Finish.', lead: 'A remodeling company built on three decades of construction discipline.', img: 'crew', alt: 'Construction crew walking through a building under renovation', trail })}

<section class="paper">
  <div class="wrap two">
    <div><p class="label">Our story</p><h2 style="margin-top:14px">Built on the Work Nobody Sees</h2></div>
    <div>
      <p>DNG Construction comes from the family behind DNexus Group, a builder with 33+ years in electrical and low-voltage construction. That work is judged on precision: it either passes, performs and lasts, or it doesn't.</p>
      <p>We started DNG to bring the same standard to remodeling. Homeowners and business owners get one crew that plans the job properly, does the work itself and stands in the room with you at the end to make sure it's right.</p>
      <a class="btn dark" style="margin-top:28px" href="/process">How We Work ${arrow}</a>
    </div>
  </div>
</section>

<div class="stats">
  <div class="wrap">
    <div class="stat"><b data-to="33" data-suffix="+">33+</b><span>Years of experience behind our team</span></div>
    <div class="stat"><b data-to="100" data-suffix="%">100%</b><span>Of projects scoped and priced in writing</span></div>
    <div class="stat"><b data-to="5">5</b><span>Clear steps from walkthrough to final finish</span></div>
    <div class="stat"><b>Free</b><span>Estimates, with no obligation</span></div>
  </div>
</div>

<section>
  <div class="wrap">
    <p class="label">What we stand for</p>
    <h2 style="margin-top:14px;max-width:820px">Three Things We Don't Compromise On</h2>
    <div class="values">
      <div class="value"><h3>Clarity</h3><p>Scope, schedule and price in writing before any work starts. If something changes, you hear it from us first.</p></div>
      <div class="value"><h3>Craft</h3><p>The parts of a remodel you can't see are done as carefully as the parts you can.</p></div>
      <div class="value"><h3>Accountability</h3><p>One crew and one point of contact from the first walkthrough to the final one.</p></div>
    </div>
  </div>
</section>

${estimate('Let\'s Talk About Your Project')}`,
  });
}

// ---------- Contact
{
  const trail = crumbs([['/contact', 'Contact']]);
  add({
    path: '/contact', file: 'contact.html',
    title: 'Contact DNG Construction | Free Remodeling Estimates',
    desc: 'Request a free remodeling estimate from DNG Construction. Tell us about your home or commercial project and we\'ll schedule a visit.',
    schema: [trail.schema],
    body: `${pageHero({ label: 'Contact', title: 'Get Your Free Estimate', lead: 'Tell us about your project and we\'ll get back to you to schedule a walkthrough.', trail })}

${estimate()}

<section>
  <div class="wrap">
    <p class="label">What happens next</p>
    <h2 style="margin-top:14px">Three Things You Can Expect</h2>
    <div class="values">
      <div class="value"><h3>We get in touch</h3><p>Someone from our team contacts you to learn more and set a time to visit.</p></div>
      <div class="value"><h3>We walk the space</h3><p>We look at the job in person, take measurements and talk through options.</p></div>
      <div class="value"><h3>You get it in writing</h3><p>A clear scope, schedule and price, with no obligation to move forward.</p></div>
    </div>
  </div>
</section>`,
  });
}

// ---------- Blog
{
  const trail = crumbs([['/blog', 'Blog']]);
  add({
    path: '/blog', file: 'blog.html',
    title: 'Remodeling Blog | Advice From DNG Construction',
    desc: 'Practical remodeling advice for homeowners and business owners: planning a kitchen, finishing a basement, renovating an office and more.',
    schema: [trail.schema, { '@context': 'https://schema.org', '@type': 'Blog', name: 'DNG Construction Blog', url: SITE + '/blog' }],
    body: `${pageHero({ label: 'Blog', title: 'Remodeling Advice Worth Reading', lead: 'Straight answers on planning, budgeting and building, for homes and commercial spaces.', trail })}

<section class="paper">
  <div class="wrap">
    <div class="posts">${posts.map(postCard).join('\n')}</div>
  </div>
</section>

${band('Have a project in mind?', 'Skip the Reading and Ask Us Directly', 'A free walkthrough answers more than any article can.', '/contact', 'Request a Free Estimate')}`,
  });

  for (const p of posts) {
    const t = crumbs([['/blog', 'Blog'], ['/blog/' + p.slug, p.title]]);
    const more = posts.filter((x) => x.slug !== p.slug).slice(0, 3);
    add({
      path: '/blog/' + p.slug, file: `blog/${p.slug}.html`, ogType: 'article',
      title: `${p.title} | DNG Construction`,
      desc: p.excerpt,
      schema: [t.schema, {
        '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.excerpt,
        datePublished: p.date, dateModified: p.date, image: SITE + `/img/${p.img}.jpg`,
        author: { '@type': 'Organization', name: NAME }, publisher: { '@type': 'Organization', name: NAME, logo: { '@type': 'ImageObject', url: SITE + '/brand/logo-dark.png' } },
        mainEntityOfPage: SITE + '/blog/' + p.slug,
      }],
      body: `${pageHero({ label: p.category, title: p.title, trail: t, meta: `${p.dateText} · ${p.read} min read · By DNG Construction` })}

<section class="paper">
  <div class="wrap">
    <article class="article">
      <figure><img src="/img/${p.img}.jpg" width="1600" height="900" alt="${esc(p.alt)}"></figure>
      <div class="prose">${p.html}</div>
      <div class="article-cta"><h3>Planning a project like this?</h3><a class="btn solid" href="/contact">Get a Free Estimate ${arrow}</a></div>
    </article>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="head"><div><p class="label">Keep reading</p><h2>More From the Blog</h2></div><a class="btn" href="/blog">All Articles</a></div>
    <div class="posts">${more.map(postCard).join('\n')}</div>
  </div>
</section>`,
    });
  }
}

// ---------- 404
add({
  path: '/404', file: '404.html', skipSitemap: true,
  title: 'Page Not Found | DNG Construction',
  desc: 'That page could not be found.',
  body: `<div class="notfound"><div><p class="label" style="justify-content:center">Error 404</p><h1 style="margin-top:14px">Page Not Found</h1><p>That page has moved or never existed.</p><a class="btn solid" href="/">Back to Home ${arrow}</a></div></div>`,
});

// ---------- Write everything
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp('static', OUT, { recursive: true });
await cp('src/styles.css', `${OUT}/styles.css`);
await cp('src/site.js', `${OUT}/site.js`);
for (const p of pages) {
  const file = `${OUT}/${p.file}`;
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, layout(p));
}
const today = new Date().toISOString().slice(0, 10);
await writeFile(`${OUT}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.filter((p) => !p.skipSitemap).map((p) => `  <url><loc>${SITE}${p.path === '/' ? '/' : p.path}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
await writeFile(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`wrote ${pages.length} pages`);

await fetchImages(`${OUT}/img`);

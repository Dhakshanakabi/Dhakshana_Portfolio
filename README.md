# Dhakshana Kabi S B – Data Portfolio

Responsive, colourful portfolio (HTML/CSS/JS front end + small Node/Express back end).
- Home page with your photo (taken from your CV)
- Contact form -> sends name, email and message to your Gmail
- "Download my résumé" button + live download counter
- Light / dark theme, animated data-network background, mobile friendly

## Run it on your computer
1. Install Node.js (LTS) from https://nodejs.org
2. Open a terminal in this folder and run: `npm install`
3. Copy `.env.example` to `.env`
4. Create a Gmail App Password: Google Account -> Security -> turn on 2-Step Verification ->
   https://myaccount.google.com/apppasswords -> create one -> paste the 16 characters as `SMTP_PASS`
5. Run `npm start` and open http://localhost:3000
6. Test: fill the contact form (check your inbox), click Download résumé (counter goes up)

## Edit your content
- Text/sections: `public/index.html`
- Skills list: top of `public/js/main.js` (the `skills` array)
- Colours: variables at the top of `public/css/style.css`
- New résumé: replace `public/assets/Dhakshana_CV.pdf` (keep the file name)
- Photo: replace `public/assets/dhakshana.jpg`

## Put it online (recommended: Render + Upstash)
1. Create a free account at https://github.com and upload this folder as a new repository
   (`.env` and `node_modules` are git-ignored, so your password is not uploaded).
2. Create a free Redis database at https://upstash.com -> copy the REST URL and REST token.
   (Free hosts delete local files on restart; Upstash keeps your download count safe.)
3. At https://render.com -> New -> Web Service -> connect your GitHub repo.
   Build command: `npm install`   Start command: `npm start`
4. Under Environment add: OWNER_EMAIL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN (same names as `.env.example`).
5. Deploy. You get a link like https://dhakshana-portfolio.onrender.com
6. Custom domain: Render -> Settings -> Custom Domains, then add the DNS records it shows
   at your domain registrar. HTTPS is added automatically.

Free Render services sleep after inactivity, so the first visit can take ~30-60 seconds.
Check current pricing before choosing a plan.

# GitHub Pages + Custom Domain Starter

This repo is a minimal starter for hosting a website on **GitHub Pages** with a **custom domain**.

## What’s inside
- `index.html` – your homepage
- `styles.css` – your styles
- `script.js` – a tiny script
- `CNAME` – sets your custom domain (edit it if your domain isn’t `xyz.ca`)

---

## How to use (Web UI, no command line)

1) **Create a repository**
- Go to GitHub → New repository → Name it e.g. `my-website`
- Set **Public** (Pages works best with public repos for beginners)
- Click **Create repository**

2) **Upload these files**
- Click **Add file → Upload files**
- Drag & drop all the files from this starter (including `CNAME`)
- Click **Commit changes**

3) **Enable GitHub Pages**
- Go to **Settings → Pages**
- Under **Build and deployment → Source**, choose **Deploy from a branch**
- Set **Branch** to `main` and **/ (root)`**
- Click **Save**
- A preview URL like `https://<username>.github.io/my-website/` will appear

4) **Set your custom domain**
- On the same **Settings → Pages** screen, in **Custom domain**, enter **`xyz.ca`** and click **Save**.
- Ensure **Enforce HTTPS** is checked.

5) **Set your domain’s DNS**
Open your domain registrar’s DNS panel and add the following records.

### If you want **xyz.ca** (root) to be the main domain:
Create four **A** records for `@` pointing to GitHub Pages IPs:
```
A    @    185.199.108.153
A    @    185.199.109.153
A    @    185.199.110.153
A    @    185.199.111.153
```

Optionally, make `www.xyz.ca` redirect to `xyz.ca` using your registrar’s URL forwarding.

### If you want **www.xyz.ca** as your main domain:
- Set a **CNAME** record:
```
CNAME    www    <your-username>.github.io
```
- Change the `CNAME` file in this repo to contain `www.xyz.ca` instead of `xyz.ca`.

> DNS changes can take some time to propagate.

6) **Check it**
- Visit `https://xyz.ca` (or `https://www.xyz.ca` if that’s your choice)
- If you see the sample page, you’re done!

---

## Edit your site
- Change text in `index.html`
- Add pages like `about.html` and link to them
- Update styles in `styles.css`

Have fun! ✨

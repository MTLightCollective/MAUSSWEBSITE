# MAUSS — Cloudflare Pages + Functions (gratuit, avec GitHub)

Ce dossier est prêt à être importé sur **Cloudflare Pages** (gratuit).
Il contient votre site (HTML/CSS/JS) et une **Function** `/api/contact` qui envoie l’email via l’API **Resend** (gratuite).

## Déploiement (pas-à-pas)

### 1) Créez un dépôt GitHub
- Créez un repo vide (privé ou public).
- Poussez-y **tout le contenu** de ce dossier à la racine (y compris `functions/`).

### 2) Créez un compte Resend (gratuit)
- Obtenez un **API Key** (RESEND_API_KEY).
- (Optionnel mais recommandé) **Vérifiez votre domaine** `mauss.ca` chez Resend pour envoyer depuis `no-reply@mauss.ca` (ils vous donnent des enregistrements DNS DKIM à ajouter dans Cloudflare).
  Tant que ce n'est pas vérifié, le `FROM` par défaut est `onboarding@resend.dev`.

### 3) Créez un projet **Cloudflare Pages**
- Dans Cloudflare → *Pages* → **Create a project** → **Connect to Git** → choisissez votre repo.
- **Build command** : *(vide)* (site statique)
- **Build output directory** : `/` (racine)
- **Functions** : activées automatiquement grâce au dossier `functions/`

### 4) Variables d’environnement (Pages → Settings → Environment Variables)
Ajoutez au minimum :
- `RESEND_API_KEY` = *votre clé API Resend*
- `TO_ADDRESS` = *où vous recevez le message* (ex. `toi@mauss.ca`)
- (Optionnel) `FROM_ADDRESS` = *expéditeur*, ex. `no-reply@mauss.ca` **après** vérification de domaine Resend

**Déployez** le projet. Une URL `https://<nom>.pages.dev` s’affiche.

### 5) Test
```bash
curl https://<nom>.pages.dev/api/health
# -> {"ok":true}
```

### 6) Domaine personnalisé
- Pages → **Custom Domains** → ajoutez **www.mauss.ca** (recommandé d’abord).
- Comme votre DNS est déjà chez Cloudflare, l’enregistrement **CNAME** sera créé automatiquement.
- (Optionnel) Créez une **règle de redirection** de `mauss.ca` vers `https://www.mauss.ca/*` (ou ajoutez l’apex aussi dans les Custom Domains).

### 7) Utilisation
Les formulaires du site postent vers **`/api/contact`** (même domaine).
Le formulaire RDV envoie un **sujet** `Demande de rendez-vous – <Nom>` et un **message** comprenant date + créneau.

---

## Fichiers clés
- `functions/api/contact.ts` — Endpoint POST (CORS minimal, validation, appel Resend)
- `functions/api/health.ts` — Vérification rapide
- `index.html` / `styles.css` / `script.js` — votre site + formulaires intégrés

---

## Remarques
- **Aucun mot de passe d’application Gmail requis**.
- Si vous tenez à utiliser votre propre SMTP **sans** fournisseur API, utilisez plutôt **Netlify Functions** + `nodemailer` (mais vous devrez gérer l’App Password Gmail et la délivrabilité).
- Avec Resend, pensez à **vérifier `mauss.ca`** pour un *From* propre (DKIM/DMARC via Cloudflare).

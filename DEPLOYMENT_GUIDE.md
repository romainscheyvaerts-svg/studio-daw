# 🚀 Guide de Déploiement

Trois façons de déployer votre DAW directement depuis GitHub pour avoir un preview en ligne.

---

## ⚡ **Option 1: Vercel (Recommandé)**

### Avantages
- ✅ Le plus rapide (2 minutes)
- ✅ HTTPS automatique
- ✅ Déploiement automatique à chaque push
- ✅ Preview pour chaque PR
- ✅ Gratuit pour projets personnels

### Étapes

1. **Aller sur Vercel**
   - Visitez https://vercel.com
   - Connectez-vous avec votre compte GitHub

2. **Importer le projet**
   - Cliquez sur "Add New Project"
   - Sélectionnez votre repository `studio-daw`
   - Sélectionnez la branche `claude/improve-app-code-1Z77q`

3. **Configuration automatique**
   - Vercel détecte automatiquement Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Cliquez sur "Deploy"

4. **C'est fait!**
   - Vous aurez une URL comme: `https://studio-daw.vercel.app`
   - À chaque push, déploiement automatique en ~30 secondes

### Variables d'environnement (si besoin Supabase)
```
VITE_SUPABASE_URL=votre_url
VITE_SUPABASE_ANON_KEY=votre_clé
```

---

## 🔷 **Option 2: Netlify**

### Avantages
- ✅ Interface très simple
- ✅ HTTPS automatique
- ✅ Déploiement automatique
- ✅ Functions serverless incluses

### Étapes

1. **Aller sur Netlify**
   - Visitez https://netlify.com
   - Connectez-vous avec GitHub

2. **Ajouter un nouveau site**
   - "Import from Git" → GitHub
   - Sélectionnez `studio-daw`
   - Branche: `claude/improve-app-code-1Z77q`

3. **Configuration automatique**
   - Le fichier `netlify.toml` est déjà configuré
   - Cliquez sur "Deploy site"

4. **URL obtenue**
   - `https://studio-daw-xxx.netlify.app`
   - Déploiement automatique à chaque commit

---

## 📄 **Option 3: GitHub Pages**

### Avantages
- ✅ Hébergé directement par GitHub
- ✅ Gratuit
- ✅ Intégration native

### Étapes

1. **Activer GitHub Pages**
   - Allez sur votre repo GitHub
   - Settings → Pages
   - Source: "GitHub Actions"

2. **Pusher le workflow**
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "feat: Add GitHub Pages deployment"
   git push
   ```

3. **Le workflow se lance automatiquement**
   - Actions → Deploy to GitHub Pages
   - Attendez la fin du build (~2 min)

4. **Votre site sera disponible sur**
   ```
   https://romainscheyvaerts-svg.github.io/studio-daw/
   ```

### Activer GitHub Pages (si pas encore fait)
- Repo → Settings → Pages
- Source: GitHub Actions
- Save

---

## 🎯 **Comparaison Rapide**

| Feature | Vercel | Netlify | GitHub Pages |
|---------|--------|---------|--------------|
| **Vitesse déploiement** | ⚡ ~30s | ⚡ ~45s | 🐢 ~2min |
| **HTTPS** | ✅ Auto | ✅ Auto | ✅ Auto |
| **Custom domain** | ✅ Gratuit | ✅ Gratuit | ✅ Gratuit |
| **Preview PRs** | ✅ Oui | ✅ Oui | ❌ Non |
| **Analytics** | ✅ Inclus | ⚠️ Payant | ❌ Non |
| **Serverless functions** | ✅ Oui | ✅ Oui | ❌ Non |
| **Limite bande passante** | 100GB/mois | 100GB/mois | Illimité |

**Recommandation:** **Vercel** pour la simplicité et la vitesse

---

## 🔧 **Configuration Locale pour Build**

Si vous voulez tester le build avant de déployer:

```bash
# Build de production
npm run build

# Vérifier le dossier dist/
ls -la dist/

# Tester le build localement
npm run preview
# Ouvre sur http://localhost:4173
```

---

## 🐛 **Résolution de Problèmes**

### **Build échoue avec erreurs TypeScript**
```bash
# Le mode strict peut causer des erreurs
# Option 1: Fixer les erreurs TypeScript
# Option 2: Désactiver temporairement en dev
npm run build -- --mode development
```

### **Variables d'environnement manquantes**
Ajoutez dans les settings du service de déploiement:
- Vercel: Settings → Environment Variables
- Netlify: Site settings → Environment variables
- GitHub Pages: Repo → Settings → Secrets

### **Application blanche après déploiement**
Vérifiez le fichier `vite.config.ts`:
```typescript
export default {
  base: '/', // Pour Vercel/Netlify
  // base: '/studio-daw/', // Pour GitHub Pages
}
```

---

## 📊 **URLs de Preview**

Après configuration, vous aurez:

### Vercel
```
Production: https://studio-daw.vercel.app
Preview PR: https://studio-daw-git-[branch].vercel.app
```

### Netlify
```
Production: https://studio-daw.netlify.app
Preview PR: https://deploy-preview-[pr-number]--studio-daw.netlify.app
```

### GitHub Pages
```
Production: https://romainscheyvaerts-svg.github.io/studio-daw/
```

---

## 🚀 **Déploiement Immédiat**

Pour déployer **maintenant**:

### 1. Commit les fichiers de config
```bash
git add vercel.json netlify.toml .github/
git commit -m "feat: Add deployment configs"
git push
```

### 2. Choisissez votre plateforme
- **Vercel**: Connectez-vous et importez le repo
- **Netlify**: Connectez-vous et importez le repo
- **GitHub Pages**: Le workflow se lance automatiquement

### 3. Partagez l'URL
Une fois déployé, partagez l'URL avec n'importe qui!

---

## 📝 **Prochaines Étapes**

1. ✅ Choisir une plateforme (Vercel recommandé)
2. ✅ Pusher les configs de déploiement
3. ✅ Connecter le repo sur la plateforme
4. 🎉 Votre DAW est en ligne!

**Besoin d'aide? Dites-moi quelle plateforme vous préférez!**

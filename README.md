# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/61d12aa5-1580-40b5-a87f-5796be17f554

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/61d12aa5-1580-40b5-a87f-5796be17f554) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Adding New Tribal Languages

Jal Rakshak is designed to be easily extensible for tribal languages. To add a new language:

### Step 1: Create a new language file
Create a new JSON file in `src/locales/` named with the language code (e.g., `mizo.json`, `khasi.json`).

### Step 2: Add translations
Copy the structure from `src/locales/en.json` and translate all the keys. For reference, see:
- `src/locales/en.json` - English (base)
- `src/locales/hi.json` - Hindi 
- `src/locales/as.json` - Assamese
- `src/locales/bodo.json` - Bodo (sample implementation)

### Step 3: Register the language
In `src/i18n.ts`:
1. Import your new language file:
   ```typescript
   import mizo from './locales/mizo.json';
   ```

2. Add it to the resources object:
   ```typescript
   const resources = {
     // ... existing languages
     mizo: {
       translation: mizo
     }
   };
   ```

### Step 4: Add to language selector
In `src/components/LanguageToggle.tsx`, add a new SelectItem:
```jsx
<SelectItem value="mizo">{t('mizo')}</SelectItem>
```

### Step 5: Add language name translation
Add the language name to all translation files:
```json
{
  "mizo": "Mizo ṭawng"
}
```

### Language Structure
Each language file should include translations for:
- App metadata (name, description)
- Authentication flows
- Dashboard interfaces  
- Role descriptions
- Forms and inputs
- Health education content
- Water quality metrics
- Symptoms and water sources
- Offline functionality
- SMS features

### Note for Tribal Languages
When adding tribal languages, consider:
- Use appropriate scripts (Devanagari, Latin, etc.)
- Include cultural context in health education
- Adapt terminology for local understanding
- Test with native speakers
- Consider right-to-left languages if applicable

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/61d12aa5-1580-40b5-a87f-5796be17f554) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

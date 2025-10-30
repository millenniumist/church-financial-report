# Setup Instructions

## Update Church Contact Information

To add real church contact information, update the following file:

### `/lib/contact-info.js`

Replace all TODO items with actual church information:

1. **Address**
   ```js
   address: {
     th: 'ใส่ที่อยู่คริสตจักรภาษาไทย',
     en: 'Add English address',
   }
   ```

2. **Phone Number**
   ```js
   phone: '038-XXX-XXXX',
   ```

3. **Email**
   ```js
   email: 'info@chonburichurch.org',
   ```

4. **Social Media**
   ```js
   social: {
     facebook: 'https://www.facebook.com/yourpage',
     line: '@churchid',
   }
   ```

5. **Google Maps**
   - Go to https://www.google.com/maps
   - Search for your church location
   - Click "Share" → "Embed a map"
   - Copy the URL from the iframe src
   - Update `mapEmbedUrl`

6. **Coordinates** (for SEO/Schema)
   - Find latitude/longitude from Google Maps
   - Update `coordinates: { latitude: X, longitude: Y }`

7. **Worship Times**
   - Update the `worshipTimes` array with actual service times

### `/lib/seo.js`

Update the site URL:
```js
url: 'https://your-actual-domain.com',
```

### Add Icons

Add these icon files to `/public/`:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

These are used for PWA and mobile home screen icons.

## SEO Setup Complete ✅

The following are already configured:
- ✅ Metadata for all pages
- ✅ Open Graph tags
- ✅ Twitter cards
- ✅ Auto-generated sitemap (`/sitemap.xml`)
- ✅ Auto-generated OG image
- ✅ PWA manifest (`/manifest.json`)
- ✅ robots.txt
- ✅ Structured data ready

## Next Steps

1. Update all TODO items in `/lib/contact-info.js`
2. Update URL in `/lib/seo.js`
3. Add icon files to `/public/`
4. Test the site
5. Deploy!

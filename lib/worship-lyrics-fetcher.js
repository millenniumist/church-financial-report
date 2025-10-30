#!/usr/bin/env node

/**
 * Worship Leader App Lyrics Fetcher
 * Fetches song lyrics from songs.worshipleaderapp.com
 * Usage: node worship-lyrics-fetcher.js <song_id>
 * Example: node worship-lyrics-fetcher.js 41333
 */

const https = require('https');

function fetchLyrics(songId) {
  return new Promise((resolve, reject) => {
    // Construct the URL - the site uses URL-encoded Thai characters, but we can use the simpler song_id parameter
    const url = `https://songs.worshipleaderapp.com/?song_id=${songId}`;

    console.log(`Fetching lyrics for song ID: ${songId}...`);

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          // Extract all JSON-LD structured data
          const scriptRegex = /<script type="application\/ld\+json">([^<]+)<\/script>/g;
          let match;
          let songData = null;

          while ((match = scriptRegex.exec(data)) !== null) {
            try {
              const json = JSON.parse(match[1]);
              // Look for the MusicComposition object
              if (json['@type'] === 'MusicComposition' && json.lyrics) {
                songData = json;
                break;
              }
            } catch (e) {
              // Continue to next script tag if parsing fails
              continue;
            }
          }

          if (songData && songData.lyrics && songData.lyrics.text) {
            resolve({
              success: true,
              songId: songId,
              title: songData.name || 'Unknown Title',
              language: songData.inLanguage || 'Unknown',
              lyrics: songData.lyrics.text,
              url: url
            });
          } else {
            reject(new Error('Lyrics not found in the page data'));
          }
        } catch (error) {
          reject(new Error(`Error parsing page data: ${error.message}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Main execution
if (require.main === module) {
  const songId = process.argv[2];

  if (!songId) {
    console.error('Usage: node worship-lyrics-fetcher.js <song_id>');
    console.error('Example: node worship-lyrics-fetcher.js 41333');
    process.exit(1);
  }

  fetchLyrics(songId)
    .then(result => {
      console.log('\n' + '='.repeat(80));
      console.log(`Title: ${result.title}`);
      console.log(`Language: ${result.language}`);
      console.log(`URL: ${result.url}`);
      console.log('='.repeat(80));
      console.log('\nLYRICS:\n');
      console.log(result.lyrics);
      console.log('\n' + '='.repeat(80));
    })
    .catch(error => {
      console.error('Error fetching lyrics:', error.message);
      process.exit(1);
    });
}

module.exports = { fetchLyrics };

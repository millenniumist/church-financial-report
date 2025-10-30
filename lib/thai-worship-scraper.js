#!/usr/bin/env node

/**
 * Thai Worship Songs Scraper
 * Scrapes Thai worship songs from songs.worshipleaderapp.com
 *
 * Usage:
 *   node thai-worship-scraper.js list          - List all Thai songs found
 *   node thai-worship-scraper.js fetch <id>    - Fetch a specific song by ID
 *   node thai-worship-scraper.js fetch-all     - Fetch all Thai songs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Known Thai song IDs (starter list - you can expand this)
const KNOWN_THAI_SONGS = [
  41333, // วันนี้เป็นวันเปรมปรีดิ์
  // Add more song IDs as you discover them
];

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ data, statusCode: res.statusCode }));
    }).on('error', reject);
  });
}

function parseSongData(html) {
  try {
    const scriptRegex = /<script type="application\/ld\+json">([^<]+)<\/script>/g;
    let match;

    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        const json = JSON.parse(match[1]);
        if (json['@type'] === 'MusicComposition' && json.lyrics) {
          return json;
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  } catch (error) {
    throw new Error(`Error parsing song data: ${error.message}`);
  }
}

async function fetchSong(songId) {
  const url = `https://songs.worshipleaderapp.com/?song_id=${songId}`;
  console.log(`Fetching song ${songId}...`);

  try {
    const { data, statusCode } = await httpsGet(url);

    if (statusCode !== 200) {
      return { success: false, songId, error: `HTTP ${statusCode}` };
    }

    const songData = parseSongData(data);

    if (!songData) {
      return { success: false, songId, error: 'No song data found' };
    }

    return {
      success: true,
      songId,
      title: songData.name || 'Unknown Title',
      language: songData.inLanguage || 'Unknown',
      lyrics: songData.lyrics.text,
      url: `https://songs.worshipleaderapp.com/?song_id=${songId}`
    };
  } catch (error) {
    return { success: false, songId, error: error.message };
  }
}

async function discoverThaiSongs(startId = 40000, endId = 45000) {
  console.log(`Searching for Thai songs between ID ${startId} and ${endId}...`);
  console.log('This may take a while...\n');

  const thaiSongs = [];
  const batchSize = 10;

  for (let i = startId; i <= endId; i += batchSize) {
    const promises = [];

    for (let j = i; j < Math.min(i + batchSize, endId); j++) {
      promises.push(fetchSong(j));
    }

    const results = await Promise.all(promises);

    for (const result of results) {
      if (result.success && result.language === 'th') {
        thaiSongs.push(result);
        console.log(`✓ Found: [${result.songId}] ${result.title}`);
      }
    }

    // Small delay to be respectful to the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return thaiSongs;
}

async function fetchAllKnownSongs() {
  console.log(`Fetching ${KNOWN_THAI_SONGS.length} known Thai songs...\n`);

  const results = [];
  for (const songId of KNOWN_THAI_SONGS) {
    const result = await fetchSong(songId);
    if (result.success) {
      results.push(result);
      console.log(`✓ [${result.songId}] ${result.title}`);
    } else {
      console.log(`✗ [${result.songId}] Failed: ${result.error}`);
    }
  }

  return results;
}

function saveSongs(songs, filename = 'thai-worship-songs.json') {
  const outputPath = path.join(__dirname, filename);
  fs.writeFileSync(outputPath, JSON.stringify(songs, null, 2), 'utf8');
  console.log(`\nSaved ${songs.length} songs to ${outputPath}`);
}

function displaySong(song) {
  console.log('\n' + '='.repeat(80));
  console.log(`ID: ${song.songId}`);
  console.log(`Title: ${song.title}`);
  console.log(`Language: ${song.language}`);
  console.log(`URL: ${song.url}`);
  console.log('='.repeat(80));
  console.log('\nLYRICS:\n');
  console.log(song.lyrics);
  console.log('\n' + '='.repeat(80));
}

// Main execution
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case 'list':
      console.log('Known Thai Songs:');
      KNOWN_THAI_SONGS.forEach(id => console.log(`  - Song ID: ${id}`));
      console.log(`\nTotal: ${KNOWN_THAI_SONGS.length} songs`);
      console.log('\nTo add more songs, edit the KNOWN_THAI_SONGS array in this file.');
      break;

    case 'fetch':
      if (!arg) {
        console.error('Please provide a song ID');
        console.error('Usage: node thai-worship-scraper.js fetch <song_id>');
        process.exit(1);
      }
      const song = await fetchSong(parseInt(arg));
      if (song.success) {
        displaySong(song);
      } else {
        console.error(`Error: ${song.error}`);
        process.exit(1);
      }
      break;

    case 'fetch-all':
      const songs = await fetchAllKnownSongs();
      if (songs.length > 0) {
        saveSongs(songs);
      } else {
        console.log('No songs were successfully fetched.');
      }
      break;

    case 'discover':
      const startId = parseInt(arg) || 40000;
      const endId = parseInt(process.argv[4]) || 45000;
      const discovered = await discoverThaiSongs(startId, endId);
      if (discovered.length > 0) {
        saveSongs(discovered, 'discovered-thai-songs.json');
        console.log('\nDiscovered song IDs:');
        discovered.forEach(s => console.log(`  ${s.songId}`));
      } else {
        console.log('No Thai songs were discovered in this range.');
      }
      break;

    default:
      console.log('Thai Worship Songs Scraper');
      console.log('\nUsage:');
      console.log('  node thai-worship-scraper.js list                    - List known Thai song IDs');
      console.log('  node thai-worship-scraper.js fetch <id>              - Fetch a specific song');
      console.log('  node thai-worship-scraper.js fetch-all               - Fetch all known Thai songs');
      console.log('  node thai-worship-scraper.js discover [start] [end]  - Discover Thai songs in ID range');
      console.log('\nExamples:');
      console.log('  node thai-worship-scraper.js fetch 41333');
      console.log('  node thai-worship-scraper.js discover 40000 42000');
      process.exit(0);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = { fetchSong, discoverThaiSongs, saveSongs };

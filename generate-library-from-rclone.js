// generate-library-from-rclone.js
// Generates library.json from Rclone's file listing

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CDN_BASE = 'https://f001.backblazeb2.com/file/1994HipHop';

console.log('🎵 CloudStream Library Generator (Rclone Edition)');
console.log('================================================\n');

function isAudioFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ['.mp3', '.m4a', '.flac', '.wav', '.aac'].includes(ext);
}

function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
}

function parseFilePath(filePath) {
  const parts = filePath.split('/').filter(p => p);
  const fileName = parts[parts.length - 1];
  const folderName = parts[parts.length - 2] || '';
  
  let year;
  for (const part of parts) {
    const match = part.match(/\b(19\d{2}|20\d{2})\b/);
    if (match) {
      year = parseInt(match[1]);
      break;
    }
  }
  
  let trackNumber;
  let title = fileName.replace(/\.(mp3|m4a|flac|wav|aac)$/i, '');
  
  const patterns = [
    /^(\d+)\s*[-.\s]+(.+)$/,
    /^(\d+)\s+(.+)$/,
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      trackNumber = parseInt(match[1]);
      title = match[2].trim();
      break;
    }
  }
  
  title = title
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .trim();
  
  let artist = 'Unknown Artist';
  let album = folderName.replace(/\s*\[.*?\]\s*/g, '').trim();
  
  const artistAlbumMatch = album.match(/^(.+?)\s*[-–]\s*(.+)$/);
  if (artistAlbumMatch) {
    artist = artistAlbumMatch[1].trim();
    album = artistAlbumMatch[2].trim();
  }
  
  if (artist === 'Unknown Artist') {
    const fileArtistMatch = title.match(/^(.+?)\s*[-–]\s*(.+)$/);
    if (fileArtistMatch) {
      artist = fileArtistMatch[1].trim();
      title = fileArtistMatch[2].trim();
    }
  }
  
  return { artist, album, title, year, trackNumber };
}

function generateTrackId(filePath) {
  return crypto.createHash('md5').update(filePath).digest('hex');
}

function encodeUrl(filePath) {
  return filePath.split('/').map(part => encodeURIComponent(part)).join('/');
}

function generateLibrary() {
  console.log('📂 Reading files.json...');
  
  if (!fs.existsSync('files.json')) {
    console.error('❌ Error: files.json not found!');
    console.error('Run this command first: rclone lsjson b2music:1994HipHop --recursive > files.json');
    process.exit(1);
  }
  
  const filesData = JSON.parse(fs.readFileSync('files.json', 'utf8'));
  console.log(`✅ Loaded ${filesData.length} files\n`);
  
  const audioFiles = filesData.filter(f => !f.IsDir && isAudioFile(f.Path));
  const imageFiles = filesData.filter(f => !f.IsDir && isImageFile(f.Path));
  
  console.log(`🎵 Audio files: ${audioFiles.length}`);
  console.log(`🖼️  Image files: ${imageFiles.length}\n`);
  
  console.log('📸 Mapping artwork to folders...');
  const artworkMap = new Map();
  for (const img of imageFiles) {
    const dir = path.dirname(img.Path);
    if (!artworkMap.has(dir)) {
      artworkMap.set(dir, []);
    }
    artworkMap.get(dir).push(img.Path);
  }
  console.log(`✅ Found artwork in ${artworkMap.size} folders\n`);
  
  console.log('🎶 Processing tracks...');
  const tracks = [];
  const yearStats = new Map();
  
  for (let i = 0; i < audioFiles.length; i++) {
    if ((i + 1) % 100 === 0) {
      process.stdout.write(`\r  Processing: ${i + 1}/${audioFiles.length}`);
    }
    
    const file = audioFiles[i];
    const metadata = parseFilePath(file.Path);
    const dir = path.dirname(file.Path);
    
    if (metadata.year) {
      yearStats.set(metadata.year, (yearStats.get(metadata.year) || 0) + 1);
    }
    
    let artworkUrl;
    const dirArtwork = artworkMap.get(dir);
    if (dirArtwork && dirArtwork.length > 0) {
      const coverImg = dirArtwork.find(f => 
        /cover|folder|front|albumart/i.test(path.basename(f))
      ) || dirArtwork[0];
      
      artworkUrl = `${CDN_BASE}/${encodeUrl(coverImg)}`;
    }
    
    const track = {
      id: generateTrackId(file.Path),
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album,
      year: metadata.year,
      genre: 'Hip-Hop',
      duration: 0,
      bitrate: 320000,
      sampleRate: 44100,
      trackNumber: metadata.trackNumber,
      streamUrl: `${CDN_BASE}/${encodeUrl(file.Path)}`,
      artworkUrl: artworkUrl,
      filePath: `/${file.Path}`,
    };
    
    tracks.push(track);
  }
  
  console.log(`\n✅ Processed ${tracks.length} tracks\n`);
  
  tracks.sort((a, b) => {
    if (a.artist !== b.artist) return a.artist.localeCompare(b.artist);
    if (a.album !== b.album) return a.album.localeCompare(b.album);
    return (a.trackNumber || 0) - (b.trackNumber || 0);
  });
  
  const library = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalTracks: tracks.length,
    tracks: tracks,
    playlists: [],
  };
  
  const outputPath = 'library.json';
  fs.writeFileSync(outputPath, JSON.stringify(library, null, 2));
  console.log(`✅ Library saved to ${outputPath}`);
  console.log(`📊 Total tracks: ${tracks.length}`);
  
  const artists = new Set(tracks.map(t => t.artist));
  const albums = new Set(tracks.map(t => `${t.artist}|${t.album}`));
  const tracksWithArtwork = tracks.filter(t => t.artworkUrl).length;
  
  console.log(`\n📊 Statistics:`);
  console.log(`   Artists: ${artists.size}`);
  console.log(`   Albums: ${albums.size}`);
  console.log(`   Tracks with artwork: ${tracksWithArtwork} (${Math.round(tracksWithArtwork/tracks.length*100)}%)`);
  
  console.log(`\n📅 Tracks by Year:`);
  const sortedYears = Array.from(yearStats.entries()).sort((a, b) => a[0] - b[0]);
  for (const [year, count] of sortedYears) {
    console.log(`   ${year}: ${count} tracks`);
  }
  
  console.log('\n✅ Done! Upload library.json to your B2 bucket with:');
  console.log('   rclone copy library.json b2music:1994HipHop/');
}

generateLibrary();

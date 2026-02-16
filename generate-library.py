#!/usr/bin/env python3
# generate-library.py
# Generates library.json by directly calling rclone and parsing output

import subprocess
import json
import os
import hashlib
import re
from pathlib import Path
from urllib.parse import quote

CDN_BASE = 'https://f001.backblazeb2.com/file/1994HipHop'
RCLONE_PATH = r'C:\Users\PC-1\Downloads\rclone-current-windows-amd64\rclone-v1.73.0-windows-amd64\rclone.exe'

print('🎵 CloudStream Library Generator (Python Edition)')
print('=' * 50)
print()

def is_audio_file(filename):
    ext = os.path.splitext(filename)[1].lower()
    return ext in ['.mp3', '.m4a', '.flac', '.wav', '.aac']

def is_image_file(filename):
    ext = os.path.splitext(filename)[1].lower()
    return ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']

def parse_file_path(file_path):
    """Extract metadata from file path"""
    parts = [p for p in file_path.split('/') if p]
    file_name = parts[-1] if parts else ''
    folder_name = parts[-2] if len(parts) > 1 else ''
    
    # Extract year
    year = None
    for part in parts:
        match = re.search(r'\b(19\d{2}|20\d{2})\b', part)
        if match:
            year = int(match.group(1))
            break
    
    # Extract track number and title
    track_number = None
    title = os.path.splitext(file_name)[0]
    
    patterns = [
        r'^(\d+)\s*[-.\s]+(.+)$',
        r'^(\d+)\s+(.+)$',
    ]
    
    for pattern in patterns:
        match = re.match(pattern, title)
        if match:
            track_number = int(match.group(1))
            title = match.group(2).strip()
            break
    
    # Clean title
    title = re.sub(r'\[.*?\]', '', title)
    title = re.sub(r'\(.*?\)', '', title)
    title = title.strip()
    
    # Extract artist and album
    artist = 'Unknown Artist'
    album = re.sub(r'\s*\[.*?\]\s*', '', folder_name).strip()
    
    match = re.match(r'^(.+?)\s*[-–]\s*(.+)$', album)
    if match:
        artist = match.group(1).strip()
        album = match.group(2).strip()
    
    if artist == 'Unknown Artist':
        match = re.match(r'^(.+?)\s*[-–]\s*(.+)$', title)
        if match:
            artist = match.group(1).strip()
            title = match.group(2).strip()
    
    return {
        'artist': artist,
        'album': album,
        'title': title,
        'year': year,
        'trackNumber': track_number
    }

def generate_track_id(file_path):
    """Generate unique ID for track"""
    return hashlib.md5(file_path.encode()).hexdigest()

def encode_url(file_path):
    """URL encode file path"""
    parts = file_path.split('/')
    return '/'.join(quote(part, safe='') for part in parts)

def get_all_files():
    """Get all files from B2 using rclone"""
    print('📂 Fetching file list from B2...')
    
    cmd = [RCLONE_PATH, 'lsf', 'b2music:1994HipHop', '-R']
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
        if result.returncode != 0:
            print(f'❌ Error: {result.stderr}')
            return []
        
        files = [line.strip() for line in result.stdout.split('\n') if line.strip()]
        print(f'✅ Found {len(files)} files\n')
        return files
    except Exception as e:
        print(f'❌ Error running rclone: {e}')
        return []

def main():
    # Get all files
    all_files = get_all_files()
    if not all_files:
        print('❌ No files found or error occurred')
        return
    
    # Filter audio and image files
    audio_files = [f for f in all_files if is_audio_file(f)]
    image_files = [f for f in all_files if is_image_file(f)]
    
    print(f'🎵 Audio files: {len(audio_files)}')
    print(f'🖼️  Image files: {len(image_files)}\n')
    
    # Build artwork map
    print('📸 Mapping artwork to folders...')
    artwork_map = {}
    for img in image_files:
        directory = os.path.dirname(img)
        if directory not in artwork_map:
            artwork_map[directory] = []
        artwork_map[directory].append(img)
    
    print(f'✅ Found artwork in {len(artwork_map)} folders\n')
    
    # Process tracks
    print('🎶 Processing tracks...')
    tracks = []
    year_stats = {}
    
    for i, file_path in enumerate(audio_files):
        if (i + 1) % 100 == 0:
            print(f'  Processing: {i + 1}/{len(audio_files)}', end='\r')
        
        metadata = parse_file_path(file_path)
        directory = os.path.dirname(file_path)
        
        # Track year stats
        if metadata['year']:
            year_stats[metadata['year']] = year_stats.get(metadata['year'], 0) + 1
        
        # Find artwork
        artwork_url = None
        if directory in artwork_map:
            dir_artwork = artwork_map[directory]
            # Prefer cover, folder, front images
            cover_img = None
            for img in dir_artwork:
                basename = os.path.basename(img).lower()
                if any(word in basename for word in ['cover', 'folder', 'front', 'albumart']):
                    cover_img = img
                    break
            
            if not cover_img and dir_artwork:
                cover_img = dir_artwork[0]
            
            if cover_img:
                artwork_url = f'{CDN_BASE}/{encode_url(cover_img)}'
        
        track = {
            'id': generate_track_id(file_path),
            'title': metadata['title'],
            'artist': metadata['artist'],
            'album': metadata['album'],
            'year': metadata['year'],
            'genre': 'Hip-Hop',
            'duration': 0,
            'bitrate': 320000,
            'sampleRate': 44100,
            'trackNumber': metadata['trackNumber'],
            'streamUrl': f'{CDN_BASE}/{encode_url(file_path)}',
            'artworkUrl': artwork_url,
            'filePath': f'/{file_path}'
        }
        
        tracks.append(track)
    
    print(f'\n✅ Processed {len(tracks)} tracks\n')
    
    # Sort tracks
    tracks.sort(key=lambda t: (t['artist'], t['album'], t['trackNumber'] or 0))
    
    # Create library
    library = {
        'version': '1.0.0',
        'generatedAt': '2026-02-07T00:00:00.000Z',
        'totalTracks': len(tracks),
        'tracks': tracks,
        'playlists': []
    }
    
    # Save to file
    output_path = 'library.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(library, f, indent=2, ensure_ascii=False)
    
    print(f'✅ Library saved to {output_path}')
    print(f'📊 Total tracks: {len(tracks)}')
    
    # Statistics
    artists = set(t['artist'] for t in tracks)
    albums = set(f"{t['artist']}|{t['album']}" for t in tracks)
    tracks_with_artwork = sum(1 for t in tracks if t['artworkUrl'])
    
    print(f'\n📊 Statistics:')
    print(f'   Artists: {len(artists)}')
    print(f'   Albums: {len(albums)}')
    print(f'   Tracks with artwork: {tracks_with_artwork} ({round(tracks_with_artwork/len(tracks)*100)}%)')
    
    print(f'\n📅 Tracks by Year:')
    for year in sorted(year_stats.keys()):
        print(f'   {year}: {year_stats[year]} tracks')
    
    print('\n✅ Done! Upload library.json to your B2 bucket with:')
    print(f'   {RCLONE_PATH} copy library.json b2music:1994HipHop/')

if __name__ == '__main__':
    main()

# Cloud Music Player - Product Specification

## Overview

Cloud Music Player is a cross-platform music streaming application that enables users to sync and play their personal music collections stored across multiple cloud storage providers. The app provides a unified library experience with rich metadata support, embedded artwork display, and seamless offline playback.

---

## Table of Contents

1. [Vision & Goals](#vision--goals)
2. [Supported Platforms](#supported-platforms)
3. [Cloud Provider Integration](#cloud-provider-integration)
4. [Core Features](#core-features)
5. [Audio & Metadata Support](#audio--metadata-support)
6. [User Interface](#user-interface)
7. [Architecture](#architecture)
8. [Security & Privacy](#security--privacy)
9. [Performance Requirements](#performance-requirements)
10. [Future Considerations](#future-considerations)

---

## Vision & Goals

### Vision
Create the definitive personal cloud music player that treats users' existing cloud storage as their music library, eliminating the need for proprietary music lockers or additional subscriptions.

### Goals
- **Unified Library**: Aggregate music from multiple cloud providers into a single, cohesive library
- **Metadata Excellence**: Preserve and display all metadata and artwork exactly as the user has organized it
- **Offline First**: Enable full offline playback with smart caching and sync
- **Privacy Focused**: Never upload or analyze user music - all processing happens on-device
- **Cross-Platform**: Consistent experience across mobile, desktop, and web

---

## Supported Platforms

### Mobile
| Platform | Minimum Version | Target Version |
|----------|-----------------|----------------|
| iOS | 15.0 | 17.0+ |
| Android | API 26 (8.0) | API 34 (14)+ |

### Desktop
| Platform | Support |
|----------|---------|
| macOS | 12.0 Monterey+ |
| Windows | Windows 10 (1903)+ |
| Linux | Ubuntu 22.04+ / Flatpak |

### Web
- Progressive Web App (PWA) with offline support
- Modern browsers: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+

---

## Cloud Provider Integration

### Tier 1 - Launch Providers
| Provider | Authentication | API |
|----------|----------------|-----|
| **Dropbox** | OAuth 2.0 + PKCE | Dropbox API v2 |
| **Google Drive** | OAuth 2.0 + PKCE | Google Drive API v3 |
| **OneDrive** | OAuth 2.0 + PKCE | Microsoft Graph API |

### Tier 2 - Post-Launch
| Provider | Authentication | API |
|----------|----------------|-----|
| **iCloud Drive** | Apple Sign-In | CloudKit |
| **Box** | OAuth 2.0 | Box API v2 |
| **pCloud** | OAuth 2.0 | pCloud API |
| **Nextcloud** | OAuth 2.0 / WebDAV | WebDAV / OCS API |

### Tier 3 - Future
- Amazon S3 (self-hosted)
- Backblaze B2
- WebDAV (generic)
- SFTP/FTP

### Provider Features Matrix

| Feature | Dropbox | Google Drive | OneDrive |
|---------|---------|--------------|----------|
| Delta sync | ✅ | ✅ | ✅ |
| Streaming | ✅ | ✅ | ✅ |
| Thumbnails | ✅ | ✅ | ✅ |
| Shared folders | ✅ | ✅ | ✅ |
| Offline pins | ✅ | ✅ | ✅ |

---

## Core Features

### 1. Library Management

#### Music Discovery & Indexing
- Scan configured folders for audio files
- Background indexing with progress indication
- Incremental sync using provider delta APIs
- Smart folder detection (auto-detect "Music" folders)
- Manual folder selection for granular control

#### Library Organization
- **Views**: Artists, Albums, Songs, Genres, Folders, Playlists
- **Smart Playlists**: Auto-generated based on metadata (Recently Added, Most Played, etc.)
- **User Playlists**: Create, edit, reorder, export
- **Favorites**: Quick access to liked tracks/albums/artists

#### Search & Filter
- Full-text search across all metadata fields
- Real-time search-as-you-type
- Filters: Cloud provider, file format, year, genre, rating
- Search history and suggestions

### 2. Metadata & Artwork

#### Supported Metadata Tags
| Tag | ID3v2 | Vorbis Comment | MP4/M4A | FLAC |
|-----|-------|----------------|---------|------|
| Title | TIT2 | TITLE | ©nam | TITLE |
| Artist | TPE1 | ARTIST | ©ART | ARTIST |
| Album | TALB | ALBUM | ©alb | ALBUM |
| Album Artist | TPE2 | ALBUMARTIST | aART | ALBUMARTIST |
| Track Number | TRCK | TRACKNUMBER | trkn | TRACKNUMBER |
| Disc Number | TPOS | DISCNUMBER | disk | DISCNUMBER |
| Year | TDRC | DATE | ©day | DATE |
| Genre | TCON | GENRE | ©gen | GENRE |
| Composer | TCOM | COMPOSER | ©wrt | COMPOSER |
| Comment | COMM | COMMENT | ©cmt | COMMENT |
| Lyrics | USLT | LYRICS | ©lyr | LYRICS |
| Rating | POPM | RATING | rate | RATING |
| BPM | TBPM | BPM | tmpo | BPM |
| Replay Gain | TXXX | REPLAYGAIN_* | ---- | REPLAYGAIN_* |

#### Artwork Handling
- **Embedded artwork**: Extract from audio file tags (APIC frame)
- **Folder artwork**: Detect cover.jpg, folder.jpg, album.png, etc.
- **Resolution support**: Up to 3000x3000px
- **Caching**: Local thumbnail cache at multiple resolutions (64, 256, 512px)
- **Fallback**: Provider-generated thumbnails → placeholder art

#### Metadata Sync Behavior
- Read-only by default (never modify source files)
- Optional: Write changes back to files (user opt-in)
- Local metadata overrides stored in app database
- Conflict resolution: Local edits take precedence

### 3. Playback

#### Audio Engine
- Gapless playback
- Crossfade (configurable 0-12 seconds)
- Replay Gain support (track and album modes)
- Playback speed adjustment (0.5x - 2.0x)
- Sleep timer

#### Queue Management
- Now Playing queue with drag-to-reorder
- Play Next / Add to Queue
- Shuffle modes: Off, Songs, Albums
- Repeat modes: Off, All, One

#### Streaming & Buffering
- Adaptive bitrate based on network conditions
- Configurable buffer size (5-60 seconds)
- Stream quality settings (Original, High 320kbps, Normal 192kbps, Low 96kbps)
- Transcoding on-device for incompatible formats

### 4. Offline Mode

#### Download Management
- Download individual tracks, albums, playlists, or artists
- Download queue with priority management
- Storage location selection (internal/SD card on Android)
- Download quality settings (match stream or specify)

#### Smart Sync
- Auto-download favorited content
- Predictive downloads based on listening habits
- Wi-Fi only download option
- Storage quota management with auto-cleanup

#### Offline Playback
- Full functionality without internet
- Automatic fallback to cached content
- Visual indicators for offline-available content

### 5. Sync & Multi-Device

#### Account System
- Optional account for cross-device sync
- Anonymous local-only mode available
- Data synced: Playlists, favorites, play history, settings, queue position

#### Sync Features
- Real-time playback position sync (continue on another device)
- Library changes sync within 30 seconds
- Conflict-free merge for concurrent edits

---

## Audio & Metadata Support

### Supported Audio Formats

| Format | Extension | Codec | Container | Metadata |
|--------|-----------|-------|-----------|----------|
| MP3 | .mp3 | MPEG-1/2 Layer III | - | ID3v1, ID3v2, APE |
| AAC | .m4a, .aac | AAC-LC, HE-AAC | MP4, ADTS | MP4 tags |
| ALAC | .m4a | Apple Lossless | MP4 | MP4 tags |
| FLAC | .flac | FLAC | - | Vorbis Comment |
| Ogg Vorbis | .ogg | Vorbis | Ogg | Vorbis Comment |
| Ogg Opus | .opus | Opus | Ogg | Vorbis Comment |
| WAV | .wav | PCM | RIFF | BWF, ID3v2 |
| AIFF | .aiff, .aif | PCM | AIFF | ID3v2 |
| WMA | .wma | WMA | ASF | ASF metadata |
| APE | .ape | Monkey's Audio | - | APE tags |
| WavPack | .wv | WavPack | - | APE tags |
| DSD | .dsf, .dff | DSD64/128/256 | DSF/DFF | ID3v2 (DSF) |

### Audio Specifications

| Spec | Support |
|------|---------|
| Sample rates | 8kHz - 384kHz |
| Bit depths | 8, 16, 24, 32-bit |
| Channels | Mono, Stereo, up to 7.1 |
| Max file size | 2GB per file |

---

## User Interface

### Design Principles
- **Clean & Focused**: Minimal chrome, content-first design
- **Album Art Forward**: Large artwork display, especially on Now Playing
- **Dark Mode First**: OLED-optimized dark theme as default
- **Accessible**: WCAG 2.1 AA compliance, VoiceOver/TalkBack support

### Key Screens

#### Home
- Quick access: Recently played, recently added, favorites
- Continue listening (resume last session)
- Personalized recommendations (local ML, not cloud-based)

#### Library Browser
- Tab navigation: Artists / Albums / Songs / Genres / Folders
- Grid and list view options
- Sort options: Name, Date Added, Year, Play Count
- Alphabet scrubber for fast navigation

#### Now Playing
- Full-screen album art
- Playback controls with gestures
- Queue access (swipe up)
- Lyrics display (if available)
- Audio info (format, bitrate, sample rate)

#### Cloud Accounts
- Connected accounts overview
- Per-account folder selection
- Sync status and last sync time
- Storage usage per provider

#### Settings
- Playback preferences
- Download & storage management
- Theme selection
- Cloud account management
- Equalizer (10-band)
- Audio output selection

### Gestures & Shortcuts

| Action | Mobile Gesture | Desktop Shortcut |
|--------|----------------|------------------|
| Play/Pause | Tap center | Space |
| Next track | Swipe left | → or N |
| Previous track | Swipe right | ← or P |
| Seek | Drag progress bar | J/L (±10s) |
| Volume | Hardware buttons | ↑/↓ |
| Show queue | Swipe up | Q |
| Add to favorites | Double-tap art | F |

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Applications                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │   iOS   │  │ Android │  │ Desktop │  │   Web (PWA)     │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └───────┬─────────┘ │
└───────┼────────────┼────────────┼───────────────┼───────────┘
        │            │            │               │
        ▼            ▼            ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Shared Core Library                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Cloud Sync   │  │ Audio Engine │  │ Metadata     │       │
│  │ Manager      │  │              │  │ Parser       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Library      │  │ Download     │  │ Cache        │       │
│  │ Database     │  │ Manager      │  │ Manager      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
        │            │            │               │
        ▼            ▼            ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloud Provider APIs                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Dropbox  │  │  Google  │  │ OneDrive │  │  Others  │    │
│  │ API      │  │  Drive   │  │ (Graph)  │  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology |
|-----------|------------|
| **iOS** | Swift, SwiftUI, AVFoundation |
| **Android** | Kotlin, Jetpack Compose, ExoPlayer |
| **Desktop** | Rust + Tauri, or Electron |
| **Web** | TypeScript, React, Web Audio API |
| **Shared Core** | Rust (cross-compiled) |
| **Database** | SQLite (via SQLCipher for encryption) |
| **Audio Engine** | Platform-native + FFmpeg for transcoding |

### Data Model

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Account   │       │   Track     │       │   Album     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ provider    │       │ account_id  │──────▶│ name        │
│ credentials │       │ album_id    │──────▶│ artist_id   │
│ root_folder │       │ title       │       │ year        │
│ last_sync   │       │ artist_id   │       │ artwork_id  │
└─────────────┘       │ duration    │       └─────────────┘
                      │ track_num   │              │
┌─────────────┐       │ file_path   │              │
│   Artist    │◀──────│ file_size   │              │
├─────────────┤       │ format      │       ┌──────▼──────┐
│ id          │       │ bitrate     │       │   Artwork   │
│ name        │       │ sample_rate │       ├─────────────┤
│ artwork_id  │       │ cached      │       │ id          │
└─────────────┘       └─────────────┘       │ source_type │
                                            │ source_path │
┌─────────────┐       ┌─────────────┐       │ hash        │
│  Playlist   │       │ PlaylistItem│       │ cached_path │
├─────────────┤       ├─────────────┤       └─────────────┘
│ id          │◀──────│ playlist_id │
│ name        │       │ track_id    │
│ created_at  │       │ position    │
│ is_smart    │       └─────────────┘
│ rules_json  │
└─────────────┘
```

---

## Security & Privacy

### Authentication & Authorization
- OAuth 2.0 + PKCE for all cloud providers
- No passwords stored - only refresh tokens
- Tokens encrypted at rest using platform keychain/keystore
- Automatic token refresh with retry logic

### Data Security
- All network traffic over HTTPS/TLS 1.3
- Local database encrypted with SQLCipher (AES-256)
- Encryption key derived from device-specific secure storage
- No user data sent to our servers (unless sync account enabled)

### Privacy Principles
- **No analytics by default**: Opt-in only
- **No music fingerprinting**: We don't identify what you're listening to
- **No cloud processing**: All metadata parsing happens on-device
- **Transparent permissions**: Clear explanation of each permission request

### Compliance
- GDPR compliant (EU)
- CCPA compliant (California)
- Data export functionality
- Account deletion with complete data removal

---

## Performance Requirements

### Startup Time
| Platform | Cold Start | Warm Start |
|----------|------------|------------|
| Mobile | < 2s | < 500ms |
| Desktop | < 3s | < 1s |
| Web | < 4s | < 1s |

### Library Performance
| Metric | Target |
|--------|--------|
| Library size support | 100,000+ tracks |
| Search latency | < 100ms |
| Scroll performance | 60fps |
| Album art load | < 200ms |

### Sync Performance
| Metric | Target |
|--------|--------|
| Delta sync (no changes) | < 5s |
| Initial scan (10,000 files) | < 5 minutes |
| Metadata parse per file | < 50ms |

### Battery & Resources
| Metric | Target |
|--------|--------|
| Background playback battery | < 3% per hour |
| Memory usage (idle) | < 100MB |
| Memory usage (playing) | < 200MB |
| Offline cache efficiency | 1:1 (no overhead) |

---

## Future Considerations

### Potential Features (Post-Launch)
- **CarPlay / Android Auto** support
- **Chromecast / AirPlay 2** streaming
- **Apple Watch / Wear OS** companion apps
- **Scrobbling**: Last.fm, ListenBrainz integration
- **Lyrics sync**: Time-synced lyrics display (LRC format)
- **MusicBrainz integration**: Auto-fetch missing metadata
- **Collaborative playlists**: Share with friends
- **Audio effects**: Equalizer presets, bass boost, virtualizer
- **Sleep timer with fade**: Gradual volume reduction
- **Podcast support**: RSS feed subscription

### Technical Debt Considerations
- Plan for API versioning from day one
- Modular architecture for easy feature additions
- Comprehensive test coverage (>80%)
- CI/CD pipeline for all platforms

### Monetization Options (TBD)
- Freemium model (limited cloud accounts on free tier)
- One-time purchase
- Subscription for sync features
- No ads ever

---

## Appendix

### Glossary
| Term | Definition |
|------|------------|
| Delta sync | Syncing only changes since last sync |
| PKCE | Proof Key for Code Exchange (OAuth security extension) |
| Replay Gain | Metadata for normalizing playback volume |
| Gapless playback | Seamless transition between tracks |

### References
- [Dropbox API Documentation](https://www.dropbox.com/developers/documentation)
- [Google Drive API Documentation](https://developers.google.com/drive)
- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [ID3v2 Specification](https://id3.org/id3v2.4.0-structure)
- [Vorbis Comment Specification](https://xiph.org/vorbis/doc/v-comment.html)

---

*Last Updated: January 2026*
*Version: 1.0.0*

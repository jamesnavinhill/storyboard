# MediaBunny Integration - Project Outline

## Executive Summary

This document outlines the comprehensive integration of **MediaBunny** into the VibeBoard storyboarding application. MediaBunny is a browser-based media processing library that provides FFmpeg-like capabilities for reading, writing, and converting media files entirely client-side using WebCodecs API.

**Official Documentation:** <https://github.com/Vanilagy/mediabunny>

### Integration Goals

1. **Timeline-Based Video Composition** - Add a dedicated timeline page where users can drag-and-drop image, video, and audio assets to compose final videos
2. **Full-Featured Video Editor** - Enable clip editing, transitions, effects, and multi-track composition
3. **Client-Side Processing** - Leverage MediaBunny's browser-based architecture for maximum performance and privacy
4. **Format Flexibility** - Support all MediaBunny export formats (MP4, WebM, MKV, etc.)
5. **System Integration** - Evaluate where MediaBunny can replace or enhance existing thumbnail/preview/optimization systems

---

## Current System Analysis

### Existing Media Pipeline

**Asset Types Currently Supported:**

- Images (PNG, JPEG, WebP, GIF) - Generated via Gemini API
- Videos (MP4, WebM) - Generated via Veo API
- Attachments - User uploads

**Current Media Processing:**

- **Server-side storage** - Assets stored in `data/assets/{projectId}/` directory structure
- **Base64 upload** - Client sends base64-encoded data to `/api/assets` endpoint
- **Checksum validation** - SHA256 hashing for file integrity
- **URL generation** - Public URLs via `/api/assets/files/{relativePath}`
- **No transcoding** - Assets stored as-is from API responses
- **No thumbnail generation** - Images displayed at full resolution
- **No preview optimization** - Videos loaded in full quality

**Key Files:**

- `server/routes/assets.ts` - Asset upload endpoint
- `server/utils/assetPersistence.ts` - File system operations
- `server/utils/assetHelpers.ts` - URL generation and file checks
- `server/types.ts` - Asset type definitions

---

## MediaBunny Capabilities Overview

### Core Features

- **Reading** - Demux MP4, MOV, WebM, MKV, MP3, WAV, OGG, AAC, FLAC
- **Writing** - Mux to MP4, WebM, MKV with various codec options
- **Converting** - Transcode, transmux, resize, crop, rotate, trim
- **Decoding/Encoding** - Hardware-accelerated via WebCodecs API
- **Streaming** - Handle large files with lazy loading and backpressure
- **Metadata** - Read/write tags (title, artist, cover art, etc.)

### Supported Codecs

**Video:** H.264, H.265/HEVC, VP8, VP9, AV1
**Audio:** AAC, MP3, Opus, Vorbis, FLAC, PCM

### Key Abstractions

- `Input` - Read from Blob, File, ArrayBuffer, ReadableStream
- `Output` - Write to ArrayBuffer, WritableStream, FileSystemWritableFileStream
- `Conversion` - High-level API for file conversion with progress tracking
- `VideoSource` / `AudioSource` - Decode media for playback or processing
- `VideoSink` / `AudioSink` - Extract decoded frames/samples from tracks

---

## Proposed Architecture

### New Timeline Page

**Route:** `/projects/:projectId/timeline`

**Features:**

- Multi-track timeline (video, audio, text/titles)
- Drag-and-drop from scene library
- Waveform visualization for audio tracks
- Frame-accurate scrubbing
- Real-time preview canvas
- Export queue with progress tracking

**UI Components:**

- `TimelineEditor.tsx` - Main timeline container
- `TimelineTrack.tsx` - Individual track (video/audio/text)
- `TimelineClip.tsx` - Draggable clip with trim handles
- `TimelinePlayhead.tsx` - Scrubber with time display
- `TimelineToolbar.tsx` - Playback controls, zoom, export
- `ClipInspector.tsx` - Properties panel for selected clip
- `TransitionPicker.tsx` - Transition selection UI
- `ExportDialog.tsx` - Format/codec/quality settings

### Data Model Extensions

**New Types:**

```typescript
// Timeline composition
interface Timeline {
  id: string;
  projectId: string;
  name: string;
  duration: number; // milliseconds
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
}

interface Track {
  id: string;
  timelineId: string;
  type: 'video' | 'audio' | 'text';
  orderIndex: number;
  clips: Clip[];
}

interface Clip {
  id: string;
  trackId: string;
  assetId?: string; // Reference to Asset table
  startTime: number; // Timeline position (ms)
  duration: number; // Clip duration (ms)
  trimStart: number; // Trim from source start (ms)
  trimEnd: number; // Trim from source end (ms)
  effects: Effect[];
  transition?: Transition;
}

interface Effect {
  id: string;
  type: 'fade' | 'crop' | 'rotate' | 'scale' | 'filter';
  parameters: Record<string, unknown>;
}

interface Transition {
  type: 'crossfade' | 'dissolve' | 'wipe' | 'slide';
  duration: number; // ms
  parameters?: Record<string, unknown>;
}
```

### MediaBunny Service Layer

**Client-Side Services:**

```typescript
// src/services/mediabunny/
├── MediaBunnyService.ts          // Main service facade
├── TimelineComposer.ts           // Compose timeline to video
├── AssetProcessor.ts             // Thumbnail/preview generation
├── VideoDecoder.ts               // Decode for preview
├── AudioAnalyzer.ts              // Waveform generation
├── FormatConverter.ts            // Transcode utilities
└── ExportQueue.ts                // Background export management
```

**Key Responsibilities:**

1. **TimelineComposer** - Orchestrate multi-track rendering
   - Read clips from timeline data
   - Decode source assets
   - Apply effects and transitions
   - Encode to target format
   - Report progress

2. **AssetProcessor** - Generate optimized derivatives
   - Extract video thumbnails (first frame, middle frame)
   - Generate preview videos (lower resolution/bitrate)
   - Create waveform data for audio
   - Optimize images for web display

3. **VideoDecoder** - Real-time preview
   - Decode frames for canvas rendering
   - Seek to specific timestamps
   - Handle multiple simultaneous clips

4. **AudioAnalyzer** - Audio visualization
   - Extract PCM samples
   - Generate waveform peaks
   - Calculate RMS/peak levels

---

## Integration Points & Trade-offs

### 1. Thumbnail Generation

**Current System:**

- No thumbnail generation
- Full images loaded for scene cards
- Potential performance issues with many scenes

**MediaBunny Solution:**

- Extract first/middle frame from videos
- Generate scaled-down thumbnails (e.g., 320x180)
- Store as separate assets or data URLs

**Trade-offs:**

| Aspect              | Current             | MediaBunny                   | Winner     |
| ------------------- | ------------------- | ---------------------------- | ---------- |
| **Performance**     | ❌ Loads full assets | ✅ Loads small thumbnails     | MediaBunny |
| **Storage**         | ✅ No extra files    | ⚠️ Additional thumbnail files | Current    |
| **Complexity**      | ✅ Simple            | ⚠️ Processing pipeline needed | Current    |
| **User Experience** | ❌ Slow loading      | ✅ Fast, responsive UI        | MediaBunny |
| **Bandwidth**       | ❌ High              | ✅ Low                        | MediaBunny |

**Decision:** ✅ **Implement MediaBunny thumbnails**

- **Difficulty:** Medium
- **Risk:** Low (non-breaking addition)
- **Impact:** High (significant UX improvement)
- **Status:** Approved for Phase 4 implementation

### 2. Video Preview Optimization

**Current System:**

- Full-quality videos loaded for preview
- No adaptive streaming
- Potential bandwidth/performance issues

**MediaBunny Solution:**

- Generate lower-resolution preview versions (e.g., 720p @ 2Mbps)
- Keep original for final export
- Lazy-load full quality only when needed

**Trade-offs:**

| Aspect          | Current                    | MediaBunny                        | Winner     |
| --------------- | -------------------------- | --------------------------------- | ---------- |
| **Quality**     | ✅ Always full quality      | ⚠️ Preview is lower quality        | Current    |
| **Performance** | ❌ Slow on slow connections | ✅ Fast preview loading            | MediaBunny |
| **Storage**     | ✅ Single file              | ❌ 2x storage (original + preview) | Current    |
| **Bandwidth**   | ❌ High                     | ✅ Low for previews                | MediaBunny |
| **Complexity**  | ✅ Simple                   | ⚠️ Dual-file management            | Current    |

**Decision:** ❌ **Not implementing initially**

- **Difficulty:** Medium-High
- **Risk:** Medium (storage management complexity)
- **Impact:** Medium (mainly benefits slow connections)
- **Status:** Deferred - Will implement only if user testing shows preview performance issues
- **Alternative:** Adaptive preview quality (see Decision #7) addresses performance concerns

### 3. Format Conversion & Optimization

**Current System:**

- Assets stored exactly as received from API
- No format standardization
- No compression options

**MediaBunny Solution:**

- Transcode to web-optimized formats (WebM/VP9, MP4/H.264)
- Apply compression while maintaining quality
- Standardize on specific codecs for consistency

**Trade-offs:**

| Aspect              | Current                   | MediaBunny                  | Winner     |
| ------------------- | ------------------------- | --------------------------- | ---------- |
| **Compatibility**   | ⚠️ Depends on API output   | ✅ Guaranteed web-compatible | MediaBunny |
| **File Size**       | ⚠️ Unoptimized             | ✅ Compressed                | MediaBunny |
| **Processing Time** | ✅ Instant (no processing) | ❌ Transcoding delay         | Current    |
| **Quality Control** | ⚠️ API-dependent           | ✅ Configurable              | MediaBunny |
| **Storage**         | ⚠️ Larger files            | ✅ Smaller files             | MediaBunny |

**Decision:** ⚠️ **Selective implementation**

- **Difficulty:** Medium
- **Risk:** Medium (transcoding can introduce quality loss)
- **Impact:** Medium-High (depends on API output quality)
- **Status:** Conditional - Only transcode if API provides non-web-optimal formats
- **Default behavior:** Keep originals from Gemini/Veo APIs (already web-optimized)

### 4. Client-Side vs Server-Side Processing

**Current System:**

- All processing happens server-side (minimal - just storage)
- Client only uploads/downloads

**MediaBunny Solution:**

- All media processing happens client-side
- Server only stores final outputs
- Leverages user's hardware (GPU acceleration via WebCodecs)

**Trade-offs:**

| Aspect                  | Server-Side                   | Client-Side (MediaBunny)        | Winner     |
| ----------------------- | ----------------------------- | ------------------------------- | ---------- |
| **Server Load**         | ❌ High CPU usage              | ✅ Zero processing load          | MediaBunny |
| **Scalability**         | ❌ Limited by server resources | ✅ Scales with users             | MediaBunny |
| **Privacy**             | ⚠️ Files uploaded to server    | ✅ Processing stays local        | MediaBunny |
| **Device Requirements** | ✅ Works on any device         | ⚠️ Requires modern browser       | Server     |
| **Processing Speed**    | ⚠️ Network latency + queue     | ✅ Instant, hardware-accelerated | MediaBunny |
| **Offline Capability**  | ❌ Requires connection         | ✅ Can work offline (with PWA)   | MediaBunny |
| **Cost**                | ❌ Server compute costs        | ✅ Free (user's device)          | MediaBunny |

**Decision:** ✅ **Client-side processing only**

- **Difficulty:** Low (MediaBunny handles complexity)
- **Risk:** Low (graceful degradation possible)
- **Impact:** Very High (cost savings, performance, privacy)
- **Status:** Approved - All media processing will happen client-side
- **Fallback:** Display browser compatibility warning for unsupported browsers

---

## Feature Scope & Implementation Phases

### Phase 1: Foundation (Timeline Infrastructure)

**Goal:** Basic timeline page with asset management

**Features:**

- Timeline data model (database migrations)
- Timeline CRUD API endpoints
- Basic timeline UI (tracks, clips, playhead)
- Drag-and-drop scenes to timeline
- Simple playback preview (no effects)

**MediaBunny Usage:**

- `Input` - Read video/audio assets
- `VideoSource` / `AudioSource` - Decode for preview
- Canvas rendering for video preview

**Deliverables:**

- Timeline database schema
- `/api/timelines` REST endpoints
- `TimelineEditor` component
- Basic clip management

**Estimated Effort:** 2-3 weeks
**Risk Level:** Low

### Phase 2: Editing Capabilities

**Goal:** Enable clip manipulation and basic effects

**Features:**

- Trim clips (in/out points)
- Split clips
- Reorder clips
- Volume control
- Fade in/out effects
- Crop/rotate video
- Text overlays (simple titles)

**MediaBunny Usage:**

- `Conversion` API for applying effects
- Video resizing, cropping, rotation
- Audio resampling, volume adjustment
- Canvas API for text rendering

**Deliverables:**

- `ClipInspector` component
- Effect application pipeline
- Real-time preview with effects
- Undo/redo system

**Estimated Effort:** 3-4 weeks
**Risk Level:** Medium

### Phase 3: Transitions & Advanced Effects

**Goal:** Professional-quality transitions and effects

**Features:**

- Crossfade transitions
- Dissolve transitions
- Wipe transitions (directional)
- Slide transitions
- Color grading (brightness, contrast, saturation)
- Speed adjustment (slow-mo, time-lapse)
- Audio crossfades

**MediaBunny Usage:**

- Frame-by-frame blending for transitions
- Canvas compositing operations
- Frame rate adjustment
- Audio mixing and crossfading

**Deliverables:**

- `TransitionPicker` component
- Transition rendering engine
- Effect presets library
- Performance optimization

**Estimated Effort:** 3-4 weeks
**Risk Level:** Medium-High (performance challenges)

### Phase 4: Export & Optimization

**Goal:** High-quality export with format options

**Features:**

- Export to MP4 (H.264/AAC)
- Export to WebM (VP9/Opus)
- Export to MKV
- Quality presets (Low, Medium, High, Lossless)
- Custom resolution/bitrate settings
- Background export with progress
- Export queue management
- Thumbnail generation for all assets
- Waveform visualization for audio

**MediaBunny Usage:**

- `Output` with various formats
- `Conversion` API for final render
- Progress tracking
- Thumbnail extraction
- Audio analysis for waveforms

**Deliverables:**

- `ExportDialog` component
- `ExportQueue` service
- Format/codec selection UI
- Thumbnail generation pipeline
- Waveform generation

**Estimated Effort:** 2-3 weeks
**Risk Level:** Low-Medium

### Phase 5: Polish & Performance

**Goal:** Production-ready experience

**Features:**

- Keyboard shortcuts
- Snap-to-grid timeline
- Zoom controls
- Multi-select clips
- Batch operations
- Timeline templates
- Auto-save
- Performance profiling
- Memory management
- Error recovery

**MediaBunny Usage:**

- Optimize memory usage
- Implement streaming for large files
- Background processing with Web Workers
- Caching strategies

**Deliverables:**

- Keyboard shortcut system
- Timeline snapping logic
- Performance monitoring
- Error boundaries
- User documentation

**Estimated Effort:** 2-3 weeks
**Risk Level:** Low

---

## Technical Considerations

### Browser Compatibility

**WebCodecs API Support:**

- ✅ Chrome/Edge 94+
- ✅ Safari 16.4+
- ❌ Firefox (experimental, behind flag)

**Fallback Strategy:**

- Detect WebCodecs support on load
- Show warning for unsupported browsers
- Provide download links for supported browsers
- Consider server-side fallback for critical features (future)

**Reference:** <https://caniuse.com/webcodecs>

### Performance Optimization

**Memory Management:**

- Limit simultaneous decoded frames
- Implement frame pooling
- Release resources promptly
- Monitor memory usage

**Rendering Pipeline:**

- Use OffscreenCanvas for background rendering
- Implement frame skipping for smooth playback
- Cache decoded frames strategically
- Use Web Workers for heavy processing

**Large File Handling:**

- Stream large files instead of loading entirely
- Implement progressive loading
- Use IndexedDB for temporary storage
- Chunk processing for exports

### Security Considerations

**Client-Side Processing Benefits:**

- User data never leaves their device during editing
- No server-side storage of intermediate files
- Reduced attack surface

**Potential Risks:**

- Malicious video files could exploit decoder bugs
- Memory exhaustion attacks
- Cross-origin resource loading

**Mitigations:**

- Validate file types before processing
- Implement memory limits
- Use CORS properly for external assets
- Sanitize user inputs for text overlays

### Storage Strategy

**Asset Storage:**

- Keep original high-quality assets
- Generate thumbnails on-demand (cache in IndexedDB)
- Store timeline compositions as JSON
- Export final videos to server for sharing

**Database Schema:**

```sql
-- New tables needed
CREATE TABLE timelines (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL, -- milliseconds
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE tracks (
  id TEXT PRIMARY KEY,
  timeline_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('video', 'audio', 'text')),
  order_index INTEGER NOT NULL,
  FOREIGN KEY (timeline_id) REFERENCES timelines(id)
);

CREATE TABLE clips (
  id TEXT PRIMARY KEY,
  track_id TEXT NOT NULL,
  asset_id TEXT,
  start_time INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  trim_start INTEGER NOT NULL DEFAULT 0,
  trim_end INTEGER NOT NULL DEFAULT 0,
  effects TEXT, -- JSON
  transition TEXT, -- JSON
  FOREIGN KEY (track_id) REFERENCES tracks(id),
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);
```

---

## Dependencies & Installation

### NPM Packages

```json
{
  "dependencies": {
    "mediabunny": "^1.x.x",
    "@mediabunny/mp3-encoder": "^1.x.x"
  }
}
```

**Installation:**

```bash
npm install mediabunny @mediabunny/mp3-encoder
```

**Bundle Size Impact:**

- MediaBunny core: ~150KB gzipped (tree-shakeable)
- MP3 encoder extension: ~130KB gzipped
- Total: ~280KB (only if MP3 encoding needed)

**Tree Shaking:**
MediaBunny is highly modular - only import what you use:

```typescript
// Only imports MP4 muxer/demuxer
import { Input, Output, MP4, BufferTarget } from 'mediabunny';

// Adds WebM support
import { WebMOutputFormat } from 'mediabunny';
```

---

## Example Code Snippets

### 1. Generate Video Thumbnail

```typescript
import { Input, BlobSource, ALL_FORMATS } from 'mediabunny';

async function generateThumbnail(videoFile: File): Promise<string> {
  const input = new Input({
    source: new BlobSource(videoFile),
    formats: ALL_FORMATS,
  });

  const videoTrack = await input.getPrimaryVideoTrack();
  const videoSource = await videoTrack.createVideoSource();

  // Seek to 1 second (or middle of video)
  const frame = await videoSource.readFrame(1000000); // microseconds

  // Draw to canvas
  const canvas = document.createElement('canvas');
  canvas.width = frame.displayWidth;
  canvas.height = frame.displayHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(frame, 0, 0);
  frame.close();

  // Convert to data URL
  return canvas.toDataURL('image/jpeg', 0.8);
}
```

### 2. Convert Video Format

```typescript
import {
  Input,
  Output,
  BlobSource,
  BufferTarget,
  WebMOutputFormat,
  Conversion,
  ALL_FORMATS,
} from 'mediabunny';

async function convertToWebM(inputFile: File): Promise<ArrayBuffer> {
  const input = new Input({
    source: new BlobSource(inputFile),
    formats: ALL_FORMATS,
  });

  const output = new Output({
    format: new WebMOutputFormat(),
    target: new BufferTarget(),
  });

  const conversion = await Conversion.init({
    input,
    output,
    video: {
      codec: 'vp9',
      bitrate: 2_000_000, // 2 Mbps
    },
    audio: {
      codec: 'opus',
      bitrate: 128_000, // 128 kbps
    },
  });

  // Track progress
  conversion.onProgress = (progress) => {
    console.log(`Progress: ${(progress * 100).toFixed(1)}%`);
  };

  await conversion.execute();

  return output.target.buffer;
}
```

### 3. Compose Timeline to Video

```typescript
import {
  Input,
  Output,
  BlobSource,
  BufferTarget,
  Mp4OutputFormat,
  VideoEncoder,
  AudioEncoder,
} from 'mediabunny';

async function renderTimeline(clips: Clip[]): Promise<ArrayBuffer> {
  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new BufferTarget(),
  });

  // Add video track
  const videoTrack = output.addVideoTrack({
    codec: 'avc',
    width: 1920,
    height: 1080,
    frameRate: 30,
  });

  // Add audio track
  const audioTrack = output.addAudioTrack({
    codec: 'aac',
    sampleRate: 48000,
    numberOfChannels: 2,
  });

  await output.start();

  // Process each clip
  for (const clip of clips) {
    const input = new Input({
      source: new BlobSource(clip.file),
      formats: ALL_FORMATS,
    });

    const videoSource = await input.getPrimaryVideoTrack().createVideoSource();
    const audioSource = await input.getPrimaryAudioTrack().createAudioSource();

    // Read and encode frames/samples
    // (simplified - actual implementation needs timing logic)
    for await (const frame of videoSource) {
      await videoTrack.addFrame(frame);
    }

    for await (const samples of audioSource) {
      await audioTrack.addSamples(samples);
    }
  }

  await output.finalize();
  return output.target.buffer;
}
```

### 4. Generate Audio Waveform

```typescript
import { Input, BlobSource, ALL_FORMATS } from 'mediabunny';

async function generateWaveform(
  audioFile: File,
  width: number
): Promise<number[]> {
  const input = new Input({
    source: new BlobSource(audioFile),
    formats: ALL_FORMATS,
  });

  const audioTrack = await input.getPrimaryAudioTrack();
  const audioSource = await audioTrack.createAudioSource();

  const duration = audioTrack.duration; // microseconds
  const samplesPerPixel = Math.ceil(
    (audioTrack.sampleRate * duration) / 1_000_000 / width
  );

  const peaks: number[] = [];
  let sampleCount = 0;
  let maxPeak = 0;

  for await (const audioData of audioSource) {
    const samples = audioData.data; // Float32Array

    for (let i = 0; i < samples.length; i++) {
      const abs = Math.abs(samples[i]);
      maxPeak = Math.max(maxPeak, abs);
      sampleCount++;

      if (sampleCount >= samplesPerPixel) {
        peaks.push(maxPeak);
        maxPeak = 0;
        sampleCount = 0;
      }
    }
  }

  return peaks;
}
```

---

## Design Decisions

### 1. Timeline Scope

**Decision:** Single video track with multiple audio tracks

**Rationale:**

- Covers 80% of use cases for music video storyboarding
- Simpler UI/UX for users
- Better performance and reliability
- Faster implementation timeline
- Multi-track video can be added in future phase if needed

**Implementation:**

- One primary video track
- Multiple audio tracks (background music, voiceover, video audio)
- Text/title overlay track (rendered on top of video)

### 2. Audio Handling

**Decision:** Support custom audio tracks (background music, voiceover)

**Rationale:**

- Essential for music video use case (primary workflow)
- Enables background music separate from video audio
- Supports voiceover narration
- Aligns with professional video editing expectations

**Implementation:**

- Audio library/upload UI for custom tracks
- Multiple audio tracks with independent volume controls
- Audio mixing engine for combining tracks
- Waveform visualization for all audio tracks

### 3. Transition Library Size

**Decision:** Standard library with 8-10 transitions

**Rationale:**

- Good balance of features and development time
- Provides professional feel without overwhelming users
- Covers most common use cases
- Extensible for future additions

**Implementation:**

- **Core transitions:** Crossfade, dissolve, cut, fade to black
- **Directional wipes:** Left, right, up, down
- **Slide transitions:** Slide left, slide right
- Configurable duration for all transitions
- Preview capability in timeline

### 4. Export Format Priority

**Decision:** MP4 and WebM export formats

**Rationale:**

- MP4 provides universal compatibility (all devices/platforms)
- WebM offers better compression and modern web standard
- Two formats cover all use cases without overwhelming users
- Both formats well-supported by MediaBunny

**Implementation:**

- **MP4 (H.264/AAC)** - Default format, maximum compatibility
- **WebM (VP9/Opus)** - Alternative format, better compression
- Quality presets: Low (720p), Medium (1080p), High (1080p high bitrate), Lossless
- Custom resolution and bitrate options for advanced users

### 5. Thumbnail Generation Strategy

**Decision:** On-demand generation with IndexedDB caching

**Rationale:**

- Faster upload flow (no blocking)
- Only generates thumbnails for viewed assets
- Caching eliminates delay on subsequent views
- Best balance of performance and UX

**Implementation:**

- Generate thumbnail on first view of asset
- Show loading spinner during generation
- Cache thumbnail in IndexedDB with asset ID as key
- Thumbnail size: 320x180 (16:9) or 180x320 (9:16)
- Extract frame from 1 second into video (or middle frame)
- JPEG format at 80% quality for optimal size/quality

### 6. Text/Title Support

**Decision:** Basic text overlays with position, font, and color controls

**Rationale:**

- Essential for music videos (song titles, artist names, lyrics)
- Covers common needs without excessive complexity
- Moderate implementation effort
- Can be enhanced with animations in future phase

**Implementation:**

- Text track in timeline (separate from video track)
- Text properties: content, font family, size, color, position
- Position presets: top, center, bottom, custom
- Font selection from web-safe fonts
- Opacity control for fade effects
- Render text on canvas layer above video

### 7. Performance vs Quality Trade-offs

**Decision:** Adaptive preview quality based on device capabilities

**Rationale:**

- Provides best experience for all users
- Smooth playback on lower-end devices
- High-quality preview on capable devices
- Better user experience overall

**Implementation:**

- Detect device capabilities on load (GPU, memory, CPU)
- **High-end devices:** Full resolution preview (1080p)
- **Mid-range devices:** 720p preview with frame skipping if needed
- **Low-end devices:** 480p preview, aggressive frame skipping
- User can manually override quality setting
- Display quality indicator in timeline toolbar
- Final export always uses full quality regardless of preview setting

---

## Risk Assessment

### High Risk Areas

1. **Browser Compatibility**
   - **Risk:** WebCodecs not available in Firefox
   - **Mitigation:** Clear browser requirements, graceful degradation
   - **Impact:** Medium (most users on Chrome/Edge/Safari)

2. **Memory Management**
   - **Risk:** Large videos could exhaust memory
   - **Mitigation:** Streaming, frame pooling, memory limits
   - **Impact:** High (could crash browser)

3. **Performance on Low-End Devices**
   - **Risk:** Slow encoding/decoding on older hardware
   - **Mitigation:** Adaptive quality, progress indicators, background processing
   - **Impact:** Medium (users can wait, but UX suffers)

### Medium Risk Areas

1. **Complex Timeline Logic**
   - **Risk:** Bugs in clip timing, transitions, effects
   - **Mitigation:** Comprehensive testing, unit tests, visual regression tests
   - **Impact:** Medium (affects output quality)

2. **Audio Synchronization**
   - **Risk:** Audio/video drift during composition
   - **Mitigation:** Precise timestamp handling, testing with various formats
   - **Impact:** High (critical for music videos)

### Low Risk Areas

1. **UI/UX Complexity**
   - **Risk:** Timeline interface too complex
   - **Mitigation:** User testing, iterative design, tooltips/help
   - **Impact:** Low (can be improved iteratively)

2. **Storage Costs**
   - **Risk:** Thumbnails/previews increase storage
   - **Mitigation:** Compression, cleanup policies, user quotas
   - **Impact:** Low (storage is cheap)

---

## Success Metrics

### Phase 1 Success Criteria

- [ ] Users can create a timeline
- [ ] Users can drag scenes to timeline
- [ ] Basic playback works
- [ ] Timeline persists to database

### Phase 2 Success Criteria

- [ ] Users can trim clips
- [ ] Users can apply fade effects
- [ ] Users can adjust volume
- [ ] Changes preview in real-time

### Phase 3 Success Criteria

- [ ] Users can add transitions between clips
- [ ] At least 8 transition types available
- [ ] Transitions render smoothly
- [ ] No visual artifacts

### Phase 4 Success Criteria

- [ ] Users can export to MP4 and WebM
- [ ] Export completes without errors
- [ ] Thumbnails generate for all videos
- [ ] Waveforms display for audio

### Phase 5 Success Criteria

- [ ] Timeline is responsive and smooth
- [ ] Memory usage stays under 2GB
- [ ] Export time < 2x video duration
- [ ] No crashes during normal use

---

## Timeline & Resources

### Estimated Timeline

| Phase                | Duration        | Dependencies            |
| -------------------- | --------------- | ----------------------- |
| Phase 1: Foundation  | 2-3 weeks       | Database, API, basic UI |
| Phase 2: Editing     | 3-4 weeks       | Phase 1 complete        |
| Phase 3: Transitions | 3-4 weeks       | Phase 2 complete        |
| Phase 4: Export      | 2-3 weeks       | Phase 3 complete        |
| Phase 5: Polish      | 2-3 weeks       | Phase 4 complete        |
| **Total**            | **12-17 weeks** | **~3-4 months**         |

### Resource Requirements

**Development:**

- 1 Full-stack developer (primary)
- 1 Frontend specialist (for complex UI/Canvas work)
- Part-time UX designer (for timeline interface)

**Testing:**

- QA tester for cross-browser testing
- Beta users for real-world feedback

**Infrastructure:**

- No additional server resources (client-side processing)
- Potentially more storage for thumbnails/previews

---

## References & Documentation

### MediaBunny Official Resources

- **GitHub Repository:** <https://github.com/Vanilagy/mediabunny>
- **Documentation:** <https://mediabunny.dev/>
- **API Reference:** <https://mediabunny.dev/api/>
- **Examples:** <https://mediabunny.dev/examples>
- **Quick Start:** <https://mediabunny.dev/guide/quick-start>
- **Converting Files:** <https://mediabunny.dev/guide/converting-media-files>
- **Reading Files:** <https://mediabunny.dev/guide/reading-media-files>
- **Writing Files:** <https://mediabunny.dev/guide/writing-media-files>

### Related Technologies

- **WebCodecs API:** <https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API>
- **Canvas API:** <https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API>
- **Web Audio API:** <https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API>
- **IndexedDB:** <https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API>
- **Web Workers:** <https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API>

### Inspiration & Examples

- **DaVinci Resolve:** Professional video editing (feature reference)
- **Adobe Premiere Rush:** Simplified timeline (UX reference)
- **CapCut Web:** Browser-based editing (technical reference)
- **Clipchamp:** Microsoft's web editor (competitor analysis)

---

## Next Steps

### Immediate Actions

1. **Review & Approve Outline**
   - Stakeholder review of scope and phases
   - Answer clarifying questions (see section above)
   - Finalize feature priorities

2. **Proof of Concept**
   - Build minimal MediaBunny integration
   - Test thumbnail generation
   - Validate browser compatibility
   - Measure performance baseline

3. **Detailed Design**
   - Create wireframes for timeline UI
   - Design database schema
   - Define API contracts
   - Plan component architecture

4. **Setup Development Environment**
   - Install MediaBunny dependencies
   - Configure build tools
   - Setup testing framework
   - Create development branch

### Confirmed Design Decisions

All key design decisions have been finalized:

1. ✅ **Timeline Scope:** Single video track with multiple audio tracks
2. ✅ **Audio Handling:** Custom audio tracks supported (background music, voiceover)
3. ✅ **Transition Library:** 8-10 standard transitions
4. ✅ **Export Formats:** MP4 (H.264/AAC) and WebM (VP9/Opus)
5. ✅ **Thumbnail Strategy:** On-demand generation with IndexedDB caching
6. ✅ **Text Support:** Basic text overlays with position, font, and color controls
7. ✅ **Performance Trade-offs:** Adaptive preview quality based on device capabilities

---

**Document Version:** 2.0  
**Last Updated:** 2025-10-15  
**Author:** Kiro AI Assistant  
**Status:** ✅ Approved - Ready for Implementation

**All design decisions finalized and approved by stakeholder.**

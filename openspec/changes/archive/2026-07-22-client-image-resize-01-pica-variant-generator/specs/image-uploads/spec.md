## ADDED Requirements

### Requirement: Client-side variant generation contract
The system SHALL be able to produce the six product JPEG variants (`original.jpg`, `hero-1920.jpg`, `large-1280.jpg`, `medium-640.jpg`, `small-320.jpg`, `og-1200x630.jpg`) in the browser using Pica (plus canvas cover-crop for OG), matching the dimension and non-upscale rules already defined for server-side generation.

#### Scenario: Generator emits six JPEG variants
- **WHEN** a valid source image (≥800×420, JPEG/PNG/WebP) is passed to the client generator
- **THEN** it returns six JPEG blobs named with the fixed variant filenames and OG exactly 1200×630

#### Scenario: Aspect-preserving variants never upscale
- **WHEN** a valid source image narrower than a ladder target (e.g. width 800) is passed to the client generator
- **THEN** each of `original.jpg`, `hero-1920.jpg`, `large-1280.jpg`, `medium-640.jpg`, and `small-320.jpg` has width less than or equal to the source width (and within that variant’s max edge/width cap)

#### Scenario: Undersized sources are rejected
- **WHEN** a source image smaller than 800×420 is passed to the client generator
- **THEN** the generator fails validation without emitting a partial variants map

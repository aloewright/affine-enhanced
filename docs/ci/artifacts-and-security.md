# CI/CD: Artifact Storage and Security Scanning

This document covers two important CI/CD workflows:
1. Cloud Storage Upload for artifact archival
2. Snyk Security Analysis for dependency scanning

## Cloud Storage Uploads

The `cloud-storage-upload.yml` workflow automatically uploads build artifacts to Google Cloud Storage.

### Key Features
- Uploads separate artifacts for web, mobile, and admin builds
- Triggers on pushes to main branches and releases
- Uses GZIP compression to reduce storage costs
- Implements immutable caching for optimal CDN performance
- Structures artifacts by commit hash and release tag

### Required Secrets
Secrets are managed via `gopass` with GitHub Actions GPG key access:

```bash
# Store GCP service account credentials (with roles/storage.objectAdmin):
gopass insert gcloud/affine/ci-service-account
gopass insert gcloud/affine/project-id
gopass insert gcloud/affine/artifacts-bucket

# Store GPG key for CI access to gopass store
gh secret set GOPASS_GPG_KEY "$(cat ci-gpg.key)"
gh secret set GOPASS_GPG_PASSPHRASE "your-passphrase"
```

### Artifact Structure
```plaintext
gs://affine-ci-artifacts/
├── builds/
│   ├── {commit-sha}/
│   │   ├── web/
│   │   ├── mobile/
│   │   └── admin/
└── releases/
    ├── v1.0.0/
    │   ├── web/
    │   ├── mobile/
    │   └── admin/
```

### Storage Lifecycle
It's recommended to configure lifecycle rules in GCS:
- builds/: Delete objects older than 30 days
- releases/: Keep indefinitely (manual cleanup if needed)

### Cache Control
- Push builds: `max-age=3600, immutable` (1 hour)
- Release builds: `max-age=31536000, immutable` (1 year)

## Security Scanning

The `security-analysis-snyk.yml` workflow provides automated vulnerability scanning.

### Key Features
- Runs on all PRs and push to main branches
- Scans each workspace independently (frontend/backend/common)
- Reports to GitHub Code Scanning
- Uses SARIF for standardized reporting
- Includes PR comments for easy review

### Required Secrets
```bash
# Store Snyk auth token in gopass
gopass insert security/snyk/token

# Optional: Store org-specific config (if using Snyk Teams/Enterprise)
gopass insert security/snyk/org-id
```

Note: The CI workflow will automatically retrieve the token from gopass using the same GPG key setup as the Cloud Storage workflow.

### False Positive Management
1. Create a `.snyk` policy file:
   ```yaml
   version: v1.25.0
   ignore:
     SNYK-JS-PACKAGENAME-123:
       - '> affected-package@1.0.0':
           reason: 'False positive - package not used in production'
           expires: 2024-12-31T00:00:00.000Z
   ```

2. Reference it in the workflow:
   ```yaml
   - name: Run Snyk test
     with:
       args: --severity-threshold=low --policy-path=.snyk
   ```

### Code Scanning Results
Access scan results in GitHub:
1. Repository → Security tab
2. Code Scanning section
3. Filter by Snyk provider

### Build Script Adaptations
If you need to modify build commands or artifact paths:

1. Cloud Storage Upload:
   ```yaml
   - name: Build Core
     run: yarn affine @affine/web build
     # Add/modify env vars as needed:
     env:
       NODE_ENV: production
       # ... other build-specific vars

   - name: Upload web artifacts
     with:
       path: ./packages/frontend/apps/web/dist
   ```

2. Security Scanning:
   ```yaml
   - name: Run Snyk test (frontend)
     with:
       file: ./packages/frontend/package.json
       args: --severity-threshold=low
   ```

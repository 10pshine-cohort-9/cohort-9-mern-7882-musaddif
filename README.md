# cohort-9-mern-7882-musaddif
Cohort 9 — MERN (NodeJS+ReactJS) assignment for musaddif taj

## SonarQube analysis

### Start SonarQube server (Docker)
Requires Docker Desktop. Port 9002 is used to avoid conflict with MinIO on 9000.

```
docker run -d --name sonarqube -p 9002:9000 -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true sonarqube:lts-community
```

Open `http://localhost:9002` (admin/admin). Generate a token via **My Account → Security** or API.

### Run backend analysis
```
# From repo root
cd Backend
npm run test:coverage            # writes coverage/lcov.info

SONAR_TOKEN=<your-token> \
SONAR_HOST_URL=http://localhost:9002 \
docker run --rm \
  -v "$(pwd):/usr/src" -w /usr/src \
  -e SONAR_TOKEN -e SONAR_HOST_URL \
  sonarsource/sonar-scanner-cli
```

### Run frontend analysis
```
cd Frontend
CI=true npm run test:coverage    # writes coverage/lcov.info

SONAR_TOKEN=<your-token> \
SONAR_HOST_URL=http://localhost:9002 \
docker run --rm \
  -v "$(pwd):/usr/src" -w /usr/src \
  -e SONAR_TOKEN -e SONAR_HOST_URL \
  sonarsource/sonar-scanner-cli
```

### Coverage commands
| Component | Command |
|-----------|---------|
| Backend   | `npm run test:coverage` (c8 + Mocha) |
| Frontend  | `npm run test:coverage` (Vitest + v8) |

### SonarQube metrics (final snapshot)

| Metric | Backend | Frontend |
|--------|---------|----------|
| Quality Gate | OK | OK |
| Coverage | 73.9% | 27.7% |
| Bugs | 0 | 0 |
| Vulnerabilities | 0 | 0 |
| Code Smells | 1 | 2 |
| Security Hotspots | 2 | 2 |
| Duplication | 12.1% | 0.5% |

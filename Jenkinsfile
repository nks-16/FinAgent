pipeline {
  agent any
  environment {
    VENV = "venv"
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    stage('Backend Tests (Java 21)') {
      steps {
        // Run Maven tests for backend using Java 21 inside Docker (no local Maven required)
        sh 'docker run --rm -v "$(pwd)/backend:/workspace" -w /workspace maven:3.9-eclipse-temurin-21 mvn -B -e test'
      }
      post {
        always {
          // Publish JUnit results and archive reports
          junit 'backend/target/surefire-reports/*.xml'
          archiveArtifacts artifacts: 'backend/target/surefire-reports/**', allowEmptyArchive: true
        }
      }
    }
    stage('Dependency CVE Scan (OWASP)') {
      steps {
        // Run OWASP Dependency-Check in Docker to scan Maven dependencies
        sh 'mkdir -p backend/odc'
        sh 'docker run --rm -v "$(pwd)/backend:/src" -v "$(pwd)/backend/odc:/report" owasp/dependency-check:latest --scan /src --format "HTML" --out /report --project "finagent-backend"'
      }
      post {
        always {
          archiveArtifacts artifacts: 'backend/odc/**', allowEmptyArchive: true
        }
      }
    }
    stage('Test') {
      steps {
        sh 'python -m venv $VENV; source $VENV/bin/activate; pip install -r requirements.txt; pytest -q'
      }
    }
    stage('Build Backend Image (Java 21)') {
      steps {
        sh 'docker build -t finagent/backend:java21 backend'
      }
    }
    stage('Backend Smoke Test (Docker)') {
      steps {
        script {
          sh '''
            set -e
            docker network create finagent-ci || true
            docker rm -f backend-ci >/dev/null 2>&1 || true
            docker run -d --name backend-ci --network finagent-ci finagent/backend:java21
            # wait for service to be ready and fetch health
            for i in {1..30}; do
              if docker run --rm --network finagent-ci curlimages/curl:8.11.0 -fsS http://backend-ci:8080/health | tee backend/health.json; then
                break
              fi
              sleep 2
            done
            grep -q '"status":"ok"' backend/health.json
          '''
        }
      }
      post {
        always {
          sh 'docker rm -f backend-ci >/dev/null 2>&1 || true'
          sh 'docker network rm finagent-ci >/dev/null 2>&1 || true'
          archiveArtifacts artifacts: 'backend/health.json', allowEmptyArchive: true
        }
      }
    }
    stage('Build Image') {
      steps {
        sh 'docker build -t finagent/agent:latest .'
      }
    }
  }
}

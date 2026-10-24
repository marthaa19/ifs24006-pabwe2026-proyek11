// Pipeline Jenkins LombaRadar: install -> test -> build.
// Sesuaikan nama tool Node.js di bawah dengan yang terdaftar di
// Manage Jenkins > Tools > NodeJS installations (harus Node.js 22.5 atau lebih baru).
// Jika agent Jenkins berjalan di Windows, ganti `sh` dengan `bat`.
pipeline {
  agent any

  tools { nodejs 'NodeJS-22' }

  options {
    timestamps()
    timeout(time: 15, unit: 'MINUTES')
  }

  environment {
    CI = 'true'
  }

  stages {
    stage('Info Lingkungan') {
      steps {
        sh 'node -v && npm -v'
      }
    }

    stage('Back-end: Install') {
      steps {
        dir('backend') { sh 'npm ci' }
      }
    }

    stage('Back-end: Test') {
      steps {
        dir('backend') { sh 'npm run test:ci' }
      }
    }

    stage('Front-end: Install') {
      steps {
        dir('frontend') { sh 'npm ci' }
      }
    }

    stage('Front-end: Test') {
      steps {
        dir('frontend') { sh 'npm run test:ci' }
      }
    }

    stage('Front-end: Build') {
      steps {
        dir('frontend') { sh 'npm run build' }
      }
    }
  }

  post {
    always {
      junit allowEmptyResults: true, testResults: '**/test-results/junit.xml'
    }
    success { echo 'Semua tahap lulus.' }
    failure { echo 'Pipeline gagal, cek log tahap yang berwarna merah.' }
  }
}

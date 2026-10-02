pipeline {
    agent any

    environment {
        IMAGE     = 'caderno-devops'
        CONTAINER = 'caderno-devops'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh 'docker build -t ${IMAGE}:${BUILD_NUMBER} -t ${IMAGE}:latest .'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker rm -f ${CONTAINER} || true'
                sh 'docker run -d --name ${CONTAINER} -p 127.0.0.1:8081:80 ${IMAGE}:latest'
            }
        }
    }
}

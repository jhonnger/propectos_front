pipeline {
    agent {
        kubernetes {
            yaml """
            apiVersion: v1
            kind: Pod
            spec:
              serviceAccountName: jenkins
              automountServiceAccountToken: true
              nodeSelector:
                kubernetes.io/hostname: corelcloud1
              containers:
              - name: node
                image: node:20-bullseye
                command: ["tail", "-f", "/dev/null"]
                volumeMounts:
                - name: node-cache
                  mountPath: /root/.npm
              - name: kaniko
                image: gcr.io/kaniko-project/executor:debug
                command: ["tail", "-f", "/dev/null"]
              - name: kubectl
                image: lachlanevenson/k8s-kubectl
                command: ["tail", "-f", "/dev/null"]
                tty: true
              volumes:
              - name: node-cache
                emptyDir: {}
            """
        }
    }
    environment {
        REGISTRY_URL = 'registry.registry.svc.cluster.local:5000'
        IMAGE_NAME   = 'prospectos-frontend-app'
        NAMESPACE    = 'frontend-ns'
        // URL pública del backend (Ingress). Se hornea en la imagen al construir.
        API_URL      = 'https://prospectos-api.pdmmonitor.com'
    }
    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-token',
                    url: 'https://github.com/jhonnger/propectos_front.git'
            }
        }
        stage('Build Angular App') {
            steps {
                container('node') {
                    sh """
                    npm ci
                    npx tsc -p tsconfig.app.json --noEmit
                    npm run build
                    """
                }
            }
        }
        stage('Build and Push Image') {
            steps {
                container('kaniko') {
                    sh """
                    /kaniko/executor --context=\$(pwd) \
                        --dockerfile=\$(pwd)/Dockerfile \
                        --destination=${REGISTRY_URL}/${IMAGE_NAME}:latest \
                        --build-arg API_URL=${API_URL} \
                        --insecure --skip-tls-verify
                    """
                }
            }
        }
        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh "kubectl rollout restart deployment/${IMAGE_NAME} -n ${NAMESPACE}"
                }
            }
        }
    }
    post {
        success {
            echo "Pipeline completed successfully! Image: ${REGISTRY_URL}/${IMAGE_NAME}:latest"
        }
        failure {
            echo "Pipeline failed!"
        }
    }
}

@Library('central-cicd-template') _

servicePipeline(
    projectType    : 'node',
    serviceName    : 'scrum-poker',
    gitRepoUrl     : 'https://github.com/chakkapong1999/scrum-poker.git',
    gitCredentials : 'github-creds',
    nodeVersion    : '20',
    pkgManager     : 'npm',
    testScript     : 'test:coverage',
    hostPort       : 3000,
    containerPort  : 3000
)

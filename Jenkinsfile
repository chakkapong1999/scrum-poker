@Library('central-cicd-template') _

servicePipeline(
    projectType    : 'node',
    serviceName    : 'scrum-poker',
    gitRepoUrl     : 'https://github.com/chakkapong1999/scrum-poker.git',
    gitCredentials : 'github-creds',
    nodeVersion    : '20',
    pkgManager     : 'npm',
    buildScript    : 'build',
    testScript     : 'test:ci',
    hostPort       : 3000,
    containerPort  : 3000
)

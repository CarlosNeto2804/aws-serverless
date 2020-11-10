# SLS API

API composed of Serverless functions that run on AWS Lambda that perform CRUD actions on AWS DynamoDB

## Dependeces
- [Node.js](https://nodejs.org/en/)
- [Package serverless](https://www.npmjs.com/package/serverless)

## Get Started

```bash
# install serverless
$ npm i -g serverless
```
- configure your [credentials](https://www.serverless.com/framework/docs/providers/aws/guide/credentials/) 
```bash
# create project
$ sls create -t aws-nodejs
```

after creating the project it is necessary to configure the serverless.yml file
## Deploy
```bash
# create project
$ sls deploy
```
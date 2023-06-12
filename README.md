# Image Classification AI Web Application using Amazon ECS and Amazon SageMaker

Microservices architecture (MSA) and artificial intelligence (AI) are the most talked about technologies for modernizing application implementation. When an application grows in scale, microservices that run in various environments are created, and an environment that can operate them is required. And for artificial intelligence services, an environment in which machine learning models can be created, learned, and trained models can be operated is required.

Amazon ECS and AWS Fargate, used to build the service, configure AI web applications as container-based microservices to automate operations and make it easy to deploy, manage, and scale. Microservice configuration is separated into Web layer and WAS layer to efficiently expand according to server load and to minimize exposed parts to users to enhance security. Several microservices can be deployed in the web layer and the WAS layer to extend functionality. And Amazon SageMaker trains and deploys machine learning models that you can use to infer images. Additionally, AWS CodePipeline automates the process of building and deploying code into containers, and automating the process of training and deploying models using Amazon SageMaker Pipelines. Through this, you can achieve operational efficiency by improving software quality and shortening the release cycle.


# AI Web Application Architecture

<img width="1024" alt="architecture-3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/0a93afac-2287-48af-b37d-c49c846253af">

## AI Web Application using Amazon ECS and Amazon SageMaker
Amazon ECS uses AWS Fargate to run applications consisting of Web Services and Web Application Server (WAS) Services. And Amazon SageMaker trains the model and provides the trained model to WAS in the form of an API through Amazon SageMaker Endpoint. NAT gateway is a network address translation service that is used when WAS Service located in a private subnet needs to connect to an external service. However, external services cannot initiate a connection to the WAS Service, so security can be strengthened. Application Load Balancer distributes traffic to multiple replicated Tasks running in Service. A Task can define one or more containers. In this architecture, one container is defined and operated in Task. In this system, users access AI web applications through the UI provided by the web service. Web Service calls WAS Service to perform business logic, and WAS Service calls Amazon SageMaker Endpoint to perform AI functions such as image classification.

## Application CI/CD using AWS CodePipeline

We provide CI/CD services that can automate code integration and deployment. Application developers use AWS CodePipeline to quickly and reliably build applications and automate the process of deploying to infrastructure configured with Amazon ECS. First, you can configure the code under development through AWS CodeCommit. And when the code is updated or merged to a specific branch, a container image is built through AWS CodeBuild and uploaded to ECR. It is then deployed to the ECS environment via AWS CodeDeploy.

## Machine Learning CI/CD using Amazon SageMaker Pipeline

We provide CI/CD services that can learn and deploy machine learning models. AWS SageMaker Pipeline enables model engineers to automate training and deployment, visualize and manage workflows. In this article, it consists of training, model registration, and deployment. When training starts, training data is downloaded from Amazon S3 and training begins. The trained model is saved to S3 for use in the next step, and the saved model is registered for use. It is then deployed as an Amazon SageMaker Endpoint to provide APIs.

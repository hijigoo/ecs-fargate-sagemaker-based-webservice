# Amazon ECS 와 Amazon SageMaker 를 이용한 AI 웹 어플리케이션 구현과 CI/CD 파이프라인 구축

[MSA, AI/ML 동향 (블로그 목적)]

본 블로그에서는 Amazon ECS 와 Amazon SageMaker 를 이용하여 AI 웹 서비스를 구현하고 배포 자동화를 위한 CI/CD 파이프라인을 구축하는 방법을 소개합니다.

Amazon ECS 는 Fargate를 사용해서 Web Service 와 WAS(Web Application Server) Service 로 구성된 애플리케이션을 운영합니다. 그리고 Amazon SageMaker 는 모델을 학습하고 학습된 모델을 Amazon SageMaker Endpoint 를 통해 API 형태로 WAS 에게 제공합니다. 완성된 AI 웹 어플리케이션을 이용하기 위해서 사용자는 Web Service 에서 제공하는 UI 를 통해 AI 웹 어플리케이션에 접근합니다. Web Service 는 비지니스 로직을 수행해야 하는 경우 WAS Service 를 호출합니다. 그리고 WAS Service 는 이미지 분류와 같은 AI 기능을 수행하기 위해서 Amazon SageMaker Endpoint 를 호출합니다.

[파이프라인 소개]

# AI 웹 어플리케이션 아키텍처

<img width="1024" alt="overall-architecture" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/cf160a90-dda9-4998-84b4-2d74d44edae4">

[Pipeline 그림]

**Amazon ECS**

컨테이너화된 애플리케이션을 쉽게 배포, 관리, 스케일링할 수 있도록 도와주는 완전 관리형 컨테이너 오케스트레이션 서비스로 컨테이너 운영 환경을 직접 구성하지 않더라도 어플리케이션을 컨테이너 환경에서 쉽게 운영할 수 있습니다.

**AWS Fargate**

Amazon EC2 인스턴스의 서버나 클러스터를 관리할 필요 없이 컨테이너를 실행하기 위해 Amazon ECS에 사용할 수 있는 기술입니다. Fargate를 사용하면 더 이상 컨테이너를 실행하기 위해 가상 머신의 클러스터를 프로비저닝, 구성 또는 조정할 필요가 없습니다. 

**Amazon SageMaker**

데이터 과학자 및 개발자가 모든 규모의 기계 학습 모델을 간편하게 빌드, 학습 및 배포할 수 있도록 하는 완전 관리형 서비스로 클라우드 환경에서 학습을 진행하고 모델 서빙을 위한 Endpoint 를 구성할 수 있습니다. 또한 학습부터 배포까지 자동화할 수 있는 Pipeline 기능도 제공합니다.


# Amazon ECS 구성

# AWS Fargate 기반 Web Service 구성

# AWS Fargate 기반 WAS Service 구성

# AWS CodePipeline 을 이용한 CI/CD 구성

# 결론
# Amazon ECS 와 Amazon SageMaker 를 이용한 AI 웹 애플리케이션 구현과 CI/CD 파이프라인 구축

마이크로 서비스 아키텍처(MSA)와 인공지능(AI)은 현대화 애플리케이션 구현에서 가장 많이 언급되는 기술입니다. 애플리케이션은 규모가 커질 경우 다양한 환경에서 구동되는 마이크로 서비스가 만들어지는데 이를 운영할 수 있는 환경이 필요합니다. 그리고 인공지능 서비스를 위해서는 머신러닝 모델을 생성 및 학습하고 학습된 모델을 운영할 수 있는 환경이 필요합니다. 

본 문서에서는 컨테이너화된 애플리케이션을 쉽게 배포, 관리, 확장할 수 있도록 도와주는 완전 관리형 컨테이너 오케스트레이션 서비스인 Amazon ECS 와 머신러닝 모델을 학습하고 배포하여 운영할 수 있는 Amazon SageMaker 를 이용하여 AI 웹 서비스를 구현합니다. 그리고 Amazon SageMaker Pipeline 을 이용하여 머신 러닝 모델 학습 및 배포를 자동화하고 AWS CodePipeline 을 이용해서 컨테이너 통합 및 배포를 위한 CI/CD 파이프라인을 구축하는 방법을 소개합니다.

# AI 웹 어플리케이션 아키텍처

<img width="1024" alt="overall-architecture" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/cf160a90-dda9-4998-84b4-2d74d44edae4">

Amazon ECS 는 AWS Fargate 를 사용해서 Web Service 와 WAS(Web Application Server) Service 로 구성된 애플리케이션을 운영합니다. 그리고 Amazon SageMaker 는 모델을 학습하고 학습된 모델을 Amazon SageMaker Endpoint 를 통해 API 형태로 WAS 에 제공합니다. NAT gateway 는 네트워크 주소 변환 서비스로 Private Subnet 에 위치한 WAS Service 가 외부의 서비스와 연결이 필요한 경우 사용됩니다. 하지만 외부 서비스에서는 WAS Service 에 연결을 시작할 수 없어 보안을 강화할 수 있습니다. Application Load Balancer 는 Service 에서 운영되고 있는 복제된 여러개의 Task에 트래픽을 분산합니다. Task는 한 개 이상의 컨테이너를 정의할 수 있습니다. 이번 아키텍처에서는 Task 에 하나의 컨테이너를 정의하여 운영합니다. 본 시스템에서 사용자는 Web Service 에서 제공하는 UI 를 통해 AI 웹 애플리케이션에 접근합니다. Web Service 는 비지니스 로직을 수행을 위해서 WAS Service 를 호출하고 WAS Service 는 이미지 분류와 같은 AI 기능을 수행하기 위해서 Amazon SageMaker Endpoint 를 호출합니다.

[AWS CodePipeline 그림]

코드의 통합과 배포를 자동화할 수 있는 CI/CD 서비스르 제공합니다. 애플리케이션 개발자는 AWS CodePipeline 를 통해서 빠르고 안정적으로 애플리케이션을 빌드하고 Amazon ECS 로 구성된 인프라 배포하는 과정을 자동화합니다. 먼저 AWS CodeCommit 을 통해서 개발 중인 코드를 형상관리 할 수 있습니다. 그리고 코드는 특정 브랜치에 업데이트 되거나 머지되어 변경 사항이 생기면 AWS CodeBuild 를 통해서 컨테이너 이미지를 빌드하고 ECR 에 업로드됩니다. 이후 AWS CodeDeploy 를 통해서 ECS 환경에 배포합니다.

[AWS SageMaker Pipeline 그림]

기계 학습 Model 을 학습하고 배포할 수 있는 CI/CD 서비스를 제공합니다. 모델 엔지니어는 AWS SageMaker Pipeline 을 통해서 학습과 배포를 자동화하고 워크플로를 시각화하고 관리할 수 있습니다. 본 글에서는 학습, 모델 등록 그리고 배포 구성되어 있습니다. 학습을 시작하면 Amazon S3 에서 학습 데이터를 다운로드하고 학습을 시작합니다. 학습이 완료된 모델은 다음 스텝에서 사용할 수 있도록 S3 에 저장하고 저장된 모델을 사용할 수 있도록 등록합니다. 이후 Amazon SageMaker Endpoint 로 배포되어 API 를 제공합니다.


## 아키텍처에 사용된 주요 AWS 서비스
**Amazon ECS**

컨테이너화된 애플리케이션을 쉽게 배포, 관리, 스케일링할 수 있도록 도와주는 완전 관리형 컨테이너 오케스트레이션 서비스로 컨테이너 운영 환경을 직접 구성하지 않더라도 애플리케이션을 컨테이너 환경에서 쉽게 운영할 수 있습니다.

**AWS Fargate**

Amazon EC2 인스턴스의 서버나 클러스터를 관리할 필요 없이 컨테이너를 실행하기 위해 Amazon ECS에 사용할 수 있는 기술입니다. Fargate를 사용하면 더 이상 컨테이너를 실행하기 위해 가상 머신의 클러스터를 프로비저닝, 구성 또는 조정할 필요가 없습니다. 

**Amazon SageMaker**

데이터 과학자 및 개발자가 모든 규모의 기계 학습 모델을 간편하게 빌드, 학습 및 배포할 수 있도록 하는 완전 관리형 서비스로 클라우드 환경에서 학습을 진행하고 모델 서빙을 위한 Endpoint 를 구성할 수 있습니다. 또한 학습부터 배포까지 자동화할 수 있는 Pipeline 기능도 제공합니다.

# VPC 생성
VPC 콘솔로 이동 후 Create VPC 버튼을 눌러서 VPC 생성을 시작합니다. 

<p align="center">
<img width="1024" alt="0" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/597166b5-7584-4cee-b9af-ea039a99384f">
</p>

Resources to create 으로 VPC and more 를 선택합니다. 2개의 AZ 를 구성할 예정이기 때문에 Number of Availability Zones (AZs) 값으로 2를 선택합니다. 그리고 Number of public subnets 은 2, Number of private subnets 는 2를 선택합니다. 전체 구성은 아래와 같습니다. 

<p align="center">
<img width="400" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/40047ac6-99cc-44ef-b5f9-fdd714b1349e">
<img width="400" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/d243317d-ed30-4262-9505-e10d0a922f21">
<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/6ad72229-d781-4606-a751-f2d9b479bd81">

</p>

구성을 완료한 다음에 Create VPC 버튼을 누르고 기다리면 VPC 와 Subnet이 생성된 것을 확인할 수 있습니다.

# Amazon ECS 클러스터 구성
Amazon ECS(Elastic Container Service) 콘솔로 이동 후 왼쪽 메뉴에서 Clusters 를 선택 하고 Create Cluster 버튼을 눌러서 클러스터를 생성을 시작합니다. 

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/28445be5-3374-43f4-b611-72b928a5e5c2">

클러스터는 아래 그림과 같이 구성합니다. 이름은 AppEcsCluster 로 입력합니다. 그리고 Multi Available Zone 에 클러스터를 구성하기 때문에 각 Available Zone 에 위치한 Private Subnet 을 각각 선택합니다. 또한 AWS Fargate 를 사용하기 때문에 Infrastructure 에서 AWS Fargate (serverless) 를 선택합니다.

<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/c16d52f1-9f8e-40aa-88aa-fb4f19ebaa45">
<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/46bbb48d-59de-43a9-8540-aeeea82e75c1">
<img width="1024" alt="4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/e598504f-85ab-447c-8df2-4319226701e4">

구성을 완료한 다음에 Create 버튼을 누르고 기다리면 Amazon ECS 클러스터가 생성된 것을 확인할 수 있습니다.

<img width="1024" alt="5" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/a18254a4-362e-488a-84f2-b6bf7f6bafd3">


# AWS Fargate 기반 Web Service 구성
[내용 추가 필요]
## Web Application 다운로드 및 빌드

[Web Application](https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/tree/feat/add-readme/web) 샘플 프로젝트 코드를 다운 받습니다. 그리고 콘솔이나 터미널에서 web 디렉토리로 이동 후 다음 명령어로 Docker 빌드를 진행합니다.
```
docker build  -t app-web .
```

Mac M1, M2 환경에서는 기본 linux/arm64 로 빌드되기 때문에 다음 명령어로 Docker 빌드를 수행합니다.
```
docker buildx build --platform=linux/amd64 -t app-web .
```

Docker 이미지가 빌드되었는지 확인합니다.
```
docker images
```

## Amazon ECR 에 Web Application 이미지 등록
Amazon ECR(Elastic Container Registry) 콘솔로 이동 후 왼쪽 메뉴에서 Repositories 를 선택합니다. 그리고 Private 탭에서 Create repository 버튼을 눌러서 레지스토리를 생성을 시작합니다.

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/d3b7c698-c72e-4a00-92b8-3d1f093671ef">

레파지토리는 다음 그림과 같이 구성합니다. 이름은 app-web  으로 입력하고 나머지는 그대로 둡니다.

<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/c11ff57f-b3c8-455c-bef3-976548fe968b">

구성을 완료한 다음에 맨 아래에 있는 Create 버튼을 누르고 기다리면 레지스트리가 생성된 것을 확인할 수 있습니다.

<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/9e7e97fd-7f1d-4b70-ba4c-e7d26b136931">

다음으로 생성한 레파지토리의 app-web 링크를 눌러서 이동합니다. 그리고 오른쪽의 View push commands 버튼을 눌러서 계정을 인증하고 빌드한 이미지를 생성한 레파지토리에 푸시합니다. 앞에서 이미지를 이미 빌드한 경우에 빌드 명령어는 제외해도 괜찮습니다.

<img width="1024" alt="4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/00b58583-7101-4d60-bc39-8f00fe9208a6">

이미지 푸시를 완료하면 다음과 같이 등록된 것을 확인할 수 있습니다.

<img width="1024" alt="5" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/2c162950-c223-4a20-88f6-ca65d2b0187e">


## Task definitions 구성
Amazon ECS 에서 Docker 컨테이너를 실행하기 위해서 태스크를 정의합니다. 하나의 태스크에서 한 개 이상의 컨테이너를 정의할 수 있습니다. 즉 서비스를 실행하기 위한 최소 단위라고 생각할 수 있습니다. Amazon ECS(Elastic Container Service) 콘솔로 이동 후 왼쪽 메뉴에서 Task definition 을 열고 Create new task definition 버튼을 눌러서 태스크 정의를 시작합니다. 

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/a90b05e1-bb2a-4a19-8592-d75a526fe276">


태스크 정의는 다음 그림과 같이 구성합니다. Task definition family 는 app-web-td 로 지정합니다. 그리고 태스크를 구성할 컨테이너 정보를 입력합니다. Name 은 app-web 으로 지정하고 Image URI 는 ECR 콘솔에서 앞 단계에서 푸시한 이미지 URI 를 찾아서 입력합니다. 포트는 8000 으로 입력합니다. Next 버튼을 눌러서 다음으로 진행합니다. 

<p align="center">
<img width="800" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/5f5d98e5-befc-4a15-be00-ab9448093b8a">
</p>

모두 기본 값으로 남기고 다시 Next 버튼을 눌러서 다음 진행 단계로 넘어갑니다. 구성을 확인하고 맨 아래에 있는 Create 버튼을 누르고 기다리면 태스크 정의가 생성된 것을 확인할 수 있습니다.

<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/c32dd2c0-ec4c-4702-928a-7212677a7178">

## Security Group 생성
AWS ECS 서비스에 적용할 보안 그룹과 서비스 앞에서 트래픽을 분산할 로드 배런서에 적용할 보안 그룹을 생성합니다. 먼저 로드 밸런서에 적용할 보안 그룹을 생성합니다. EC2 콘솔로 이동 후 왼쪽 메뉴에서 Security Groups 를 선택합니다. 그리고 Create security group 버튼을 눌러서 보안 그룹 생성을 시작합니다. Security group name 은 app-web-alb-sg 로 지정합니다. VPC 는 처음 생성한 app-vpc 를 선택합니다. 외부와 HTTP 통신을 위해서 80 포트를 인바운드 값으로 허용하고 Source 로 Anywhere 를 선택합니다. 구성을 완료한 다음에 Create security group 버튼을 눌러서 보안 그룹을 생성합니다.

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/6a3f5456-5b5c-4d83-83e7-a05370ee7978">

다음으로 ECS 서비스에 적용할 보안 그룹을 생성합니다. Security group name 은 app-web-sg 로 지정합니다. VPC 는 처음 생성한 app-vpc 를 선택합니다. 8000 포트 트래픽을 인바운드 값으로 허용하고 Source 로 방금 생성한 app-web-alb-sg 를 선택합니다. 구성을 완료한 다음에 Create security group 버튼을 눌러서 보안 그룹을 생성합니다.

<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/9a189f8b-0b60-410b-b27d-8710eed86fd0">

기다리면 다음과 같이 두 개의 보안 그룹이 생성된 것을 확인할 수 있습니다. 보기 편하게 Name 값을 Security Group Name 과 동일하게 변경합니다.

<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/6694397b-d770-461e-ac4e-893c481a30b1">


## AWS ECS 서비스 생성
서비스 구성을 위해서 AWS ECS 클러스터 콘솔로 이동합니다. 처음에 생성한 AppEcsCluster 링크를 클릭해서 들어간 뒤, Services 탭에서 Create 버튼을 눌러 서비스 구성을 시작합니다. 

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/f2d9d52f-c540-400e-802f-ba540d3cee29">

Environment 는 다음과 같이 구성합니다. Compute options 으로 Launch Type 을 선택하고, Application type 으로 Service 를 선택합니다. 그리고 family 값으로 앞서 생성한 task definition 인 app-web 을 선택합니다. Service Name 으로는 app-web-service 를 입력합니다. Desired tasks 값으로 2를 입력합니다.

<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/879595fb-e543-40dc-9817-28512fde554b">
<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/ed0509fa-d887-4ecd-9457-a3dfed5a04bd">

Networking 구성에서 VPC 는 생성해 놓은 app-vpc 를 선택하고 Subnets 에는 private subnets 두 개를 선택합니다. 그리고 Security group 에는 미리 생성해놓은 app-web-sg 를 적용합니다. 그리고 로드 밸런서를 통해 접근할 예정이기 때문에 Public IP 는 disable 해놓습니다.

<img width="1024" alt="4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/daf8cbce-ec3b-4ea9-8932-edd587f0c333">


Load Balancing 구성에서 트래픽을 분산하기 위해 로드 밸런스를 생성합니다. Load balancer type 으로 Application Load Balancer 를 선택합니다.  Create a new load balancer 를 선택하고 Load balancer name 값으로 app-web-alb 를 입력합니다. 그리고 Target group name 값으로 app-web-alb-tg 를 입력하고, Health check path 값으로 /health 를 입력합니다.

<img width="1024" alt="5-alb" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/494e07bd-e3fc-44d4-9d7f-960409e5b8f3">
<img width="1024" alt="6-alb" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/341a6841-3f48-471e-bae3-ec37856eb4bb">


Service auto scaling 구성에서 Use service auto scaling 를 체크합니다. Minimum number of tasks 값으로 2를 입력하고 Maximum number of tasks 값으로 4를 입력합니다. Policy name 값으로 app-web-asg-policy 을 입력합니다. ECS service metric 으로 ECSServiceMetricAverageCPUUtilization 을 선택하고 Target value 로 70 을 입력합니다. Scale-out cooldown period 과 Scale-in cooldown period 모두 300으로 입력합니다. 모든 구성을 완료한 다음에 Create 버튼을 눌러서 서비스를 생성합니다.

<img width="1024" alt="7-asg" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/6422f76d-bc8d-4016-8c66-12a10b537f17">
<img width="1024" alt="8-asg" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/2e2428d0-bb8c-4620-b147-113bd231777a">

다음으로 함께 생성한 로드 밸런서의 Subnets 을 Public subnet 으로 변경하고 보안 그룹도 app-web-alb-sg 로 변경합니다. 변경하지 않으면 서비스의 설정이 자동으로 적용되어 로드 밸런서의 Subnets 은 Private subnet 으로 설정되어 있고 보안 그룹도 app-web-sg 으로 적용되어 있습니다. 변경을 위해서 EC2 콘솔로 이동 후 왼쪽 메뉴에서 Load Balancers 를 선택합니다. 그리고 app-web-alb 를 체크하고 Actions 을 눌러서 버튼을 오픈한뒤 Edit subnets 을 선택합니다. 모두 Public subnet 으로 변경하고 Save changes 버튼을 눌러서 적용합니다.

<img width="1024" alt="12-alb-subnets" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/50bd20c5-7c9f-477f-88f9-d0c887413c9a">

다음으로 다시 app-web-alb 를 체크하고 Actions 을 눌러서 버튼을 오픈한뒤 Edit security groups 을 선택합니다. Security groups 을 app-web-alb-sg 로 변경하고 Save changes 버튼을 눌러서 적용합니다.

<img width="1024" alt="10-alb-sg" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/59745dbb-2d55-4811-a09a-d86b909f681e">
<img width="1024" alt="11-alb-sg" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/7e3ab936-d96f-4ba6-ba96-89433bcd09b4">

다시 AWS ECS 클러스터 콘솔로 이동합니다. 처음에 생성한 AppEcsCluster 를 선택하고 Services 탭에서 app-web-service 를 선택하면 다음과 같이 태스크가 구동되는 것을 확인할 수 있습니다.

<img width="1024" alt="9" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/76f88772-7df3-45f2-b5a9-ea09fa1520b9">



# AWS Fargate 기반 WAS Service 구성
AWS Fargate 기반 Web Service 구성과 비슷한 흐름으로 진행되지만 다른 부분이 있기 때문에 주의해서 보시기 바랍니다.

[내용 추가 필요]

## WAS Application 다운로드 및 빌드
[WAS Application](https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/tree/feat/add-readme/was) 샘플 프로젝트 코드를 다운 받습니다. 그리고 콘솔이나 터미널에서 web 디렉토리로 이동 후 다음 명령어로 Docker 빌드를 진행합니다.
```
docker build  -t app-was .
```

Mac M1, M2 환경에서는 기본 linux/arm64 로 빌드되기 때문에 다음 명령어로 Docker 빌드를 수행합니다.
```
docker buildx build --platform=linux/amd64 -t app-was .
```

Docker 이미지가 빌드되었는지 확인합니다.
```
docker images
```

## Amazon ECR 에 WAS Application 이미지 등록
Amazon ECR(Elastic Container Registry) 콘솔로 이동 후 왼쪽 메뉴에서 Repositories 를 선택합니다. 기존에 등록한 app-web 레지스트리가 있는 것을 볼 수 있습니다. 우리는 WAS Application 레지스트리가 추가로 필요하기 때문에 Private 탭에서 Create repository 버튼을 눌러서 레지스트리를 생성을 시작합니다.

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/2403522d-e9e3-4802-a9bd-f52909f3e327">

레파지토리는 다음 그림과 같이 구성합니다. 이름은 app-was 으로 입력하고 나머지는 그대로 둡니다.

<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/016c07a9-d8de-44f9-a3ad-7c37a7d3380e">

구성을 완료한 다음에 맨 아래에 있는 Create 버튼을 누르고 기다리면 레지스트리가 생성된 것을 확인할 수 있습니다. 현재까지 총 2개의 레지스트리가 생성되었습니다.

<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/574d46aa-4304-4c70-8d04-68a2eb30b8da">

다음으로 생성한 레파지토리의 app-was 링크를 눌러서 이동합니다. 그리고 오른쪽의 View push commands 버튼을 눌러서 계정을 인증하고 빌드한 이미지를 생성한 레파지토리에 푸시합니다. 앞에서 이미지를 이미 빌드한 경우에 빌드 명령어는 제외해도 괜찮습니다.

<img width="1024" alt="4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/e2609f9d-8f7e-4ed7-b973-d310872ed9e7">

이미지 푸시를 완료하면 다음과 같이 등록된 것을 확인할 수 있습니다.

<img width="1024" alt="5" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/0cb17fbf-abdc-4b72-8fbf-bce70411b594">

## Task definitions 구성
Task definition 을 구성하기 전에 Task 에서 Amazon SageMaker Endpoint 를 호출하기 위한 역할을 먼저 생성합니다. Identity and Access Management(IAM) 콘솔로 이동합니다. 왼쪽 메뉴에서 Roles 를 선택하고 Create role 버튼을 눌러서 역할 생성을 시작합니다.

<img width="1024" alt="0-1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/e39a12ee-f494-4d77-a552-751a823fd437">

Trusted entity type 으로 AWS service 를 선택합니다. User Case 아래 있는 Use cases for other AWS services 에서 Elastic Container Service 를 선택합니다. 그리고 다시 Elastic Container Service Task 를 선택합니다. 구성은 다음과 같습니다. Next 버튼을 눌러서 다음 진행 단계로 넘어갑니다. 

<img width="1024" alt="0-2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/c4e81f64-342a-4386-a0d8-df474d7a0ac8">

Add permissions 단계에서 Create policy 를 눌러서 정책 생성을 시작합니다. 

<img width="1024" alt="0-3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/c00a4792-c7bc-418d-bad2-03ab4586d40b">

Policy editor 에서 JSON 을 선택하고 아래와 같이 입력하고 Next 버튼을 눌러서 다음 단계로 넘어갑니다. 

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "sagemaker:InvokeEndpoint",
            "Resource": "*"
        }
    ]
}
```

<img width="1024" alt="0-4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/e528911f-8bf5-4d56-bcfc-cf5bce38e7c6">

Policy name 에 InvokeSageMakerEndpoint 을 입력하고 맨 아래에 있는 Create policy 버튼을 눌러서 정책을 생성합니다.

<img width="1024" alt="0-5" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/c55065e6-ecf1-4200-b9ab-d2dfa1ff28c0">

InvokeSageMakerEndpoint 으로 검색하면 다음과 같이 정책이 생성된 것을 확인할 수 있습니다.

<img width="1024" alt="0-6" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/1dd1342f-81b0-491e-8ae5-1e2981a03311">

역할을 생성하던 페이지로 다시 돌아온 뒤 Create Policy 버튼 옆에 있는 새로고침 아이콘 버튼을 눌러서 정책리스트를 다시 로드합니다. InvokeSageMakerEndpoint 을 검색하면 방금 생성한 정책이 나옵니다. 나온 정책을 선택하고 Next 버튼을 눌러서 다음 단계로 진행합니다.

<img width="1024" alt="0-7" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/e94ff1f5-3171-4817-a675-f38bdcc6b54e">

Role name 으로 ecsWasTaskRole 으로 입력하고 Create role 버튼을 눌러서 롤 생성을 완료합니다.

<img width="1024" alt="0-8" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/214abdd0-67a7-4fab-846b-260a33bb4968">

Amazon ECS(Elastic Container Service) 콘솔로 이동 후 왼쪽 메뉴에서 Task definition 을 선택합니다. 기존에 등록한 app-web 레지스트리가 있는 것을 볼 수 있습니다. Create new task definition 버튼을 눌러서 태스크 정의를 시작합니다. 

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/a4cb9be8-9e55-413b-86cb-d7aae34dccce">

태스크 정의는 다음 그림과 같이 구성합니다. Task definition family 는 app-was-td 로 지정합니다. 그리고 태스크를 구성할 컨테이너 정보를 입력합니다. Name 은 app-was 으로 지정하고 Image URI 는 ECR 콘솔에서 앞 단계에서 푸시한 이미지 URI 를 찾아서 입력합니다. 포트는 8081 으로 입력합니다. Environment 칸에 있는 Task role 에 앞서 생성한 ecsWasRole 을 선택하여 입력합니다. Next 버튼을 눌러서 다음으로 진행합니다.

<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/5e4c9828-12c6-4f46-bbf9-e189b134fac9">

<img width="1024" alt="2-1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/63fa0856-98e6-4704-acf3-fc649004179d">

Next 버튼을 눌러서 다음 진행 단계로 넘어갑니다. 구성을 확인하고 맨 아래에 있는 Create 버튼을 누르고 기다리면 태스크 정의가 생성된 것을 확인할 수 있습니다.

<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/c39dfaae-f206-47aa-87d6-8517df60ec14">



## Application Load Balancer 생성
## Security Group 생성
## AWS ECS Service 생성

# AWS CodePipeline 을 이용한 CI/CD 구성

# Amazon SageMaker 학습 환경 구성

# Amazon SageMaker 배포 환경 구성

# Amazon SagemMaker Pipeline 을 이용한 CI/CD 구성

# 결론
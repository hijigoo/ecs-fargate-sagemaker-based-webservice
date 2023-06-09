# CDK를 이용한 인프라 설치

## AWS Cloud9 환경 준비

배포의 편의를 위하여 [AWS Cloud](https://aws.amazon.com/ko/cloud9/)을 이용하여 설치를 진행합니다.

[Cloud9 Console](https://ap-northeast-2.console.aws.amazon.com/cloud9control/home?region=ap-northeast-2#/create)에 접속하여 [Create environment] 이름으로 “AIWebApplication”를 입력하고, EC2 instance는 편의상 “m5.large”를 선택합니다. 나머지는 기본값을 유지하고, 하단으로 스크롤하여 [Create]를 선택합니다.

![noname](https://github.com/kyopark2014/ecs-fargate-sagemaker-based-webservice/assets/52392004/85933efa-3e9e-458b-a9cc-a1ca0ba5bfa9)

[Environment]에서 “AIWebApplication”를 [Open]한 후에 아래와 같이 터미널을 실행합니다.

![image](https://github.com/kyopark2014/ecs-fargate-sagemaker-based-webservice/assets/52392004/272281b0-a99d-42ff-b771-2e69ba986a4f)

Cloud9 용량을 확장합니다.

```java
wget https://raw.githubusercontent.com/kyopark2014/technical-summary/main/resize.sh
chmod a+rx resize.sh
./resize.sh 100
```

## CDK로 설치하기

소스를 다운로드 합니다. (아래 경로 변경 필요함)

```java
git clone https://github.com/kyopark2014/ecs-fargate-sagemaker-based-webservice
```

관련된 라이브러리를 설치합니다.

```java
cd ecs-fargate-sagemaker-based-webservice/cdk-ai-wep-application && npm install
```

Account ID를 확인합니다.

```java
aws sts get-caller-identity --query Account --output text
```

아래와 같이 bootstrap을 수행합니다. 여기서 “account-id”는 상기 명령어로 확인한 12자리의 Account ID입니다. bootstrap 1회만 수행하면 되므로, 기존에 cdk를 사용하고 있었다면 bootstrap은 건너뛰어도 됩니다.

```java
cdk bootstrap aws://account-id/ap-northeast-2
```

아래와 같이 설치합니다.
 
```java
cdk deploy
```

실행이 완료 되면 아래와 같이 CDK의 Output을 확인할 수 있습니다.


## 리소스 정리하기

Cloud9의 터미널에 접속하여 아래와 같이 설치한 인프라들을 삭제합니다.

```java
cdk destroy
```


## Reference

[class Vpc (construct)](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html)

[Creating an AWS Fargate service using the AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/ecs_example.html)

[Introduction to the Cloud Development Kit (CDK)](https://catalog.us-east-1.prod.workshops.aws/workshops/5962a836-b214-4fbf-9462-fedba7edcc9b/en-US)

[VPC: enum SubnetType](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.SubnetType.html)

[CDK Construct library for higher-level ECS Constructs](https://docs.aws.amazon.com/cdk/api/v1/docs/aws-ecs-patterns-readme.html)

[class ApplicationLoadBalancedFargateService (construct)](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-ecs-patterns.ApplicationLoadBalancedFargateService.html)

[Deploying applications to ECS Fargate with AWS CDK](https://www.gravitywell.co.uk/insights/deploying-applications-to-ecs-fargate-with-aws-cdk/)

[How to setup AutoScale for ECS service using CDK](https://medium.com/@alexander.sirenko/setup-autoscale-for-ecs-service-using-cdk-39f03cc3f046)

[class SecurityGroup (construct)](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.SecurityGroup.html)

[Security Group Examples in AWS CDK - Complete Guide](https://bobbyhadz.com/blog/aws-cdk-security-group-example)

[Creating an Application Load Balancer in AWS CDK](https://bobbyhadz.com/blog/aws-cdk-application-load-balancer)

[class ApplicationTargetGroup (construct)](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-elasticloadbalancingv2.ApplicationTargetGroup.html)

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as path from "path";
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
// import * as ecrdeploy from 'cdk-ecr-deployment';
// import * as aws_elasticloadbalancingv2 from 'aws-cdk-lib/ aws_elasticloadbalancingv2';
import * as logs from "aws-cdk-lib/aws-logs"


export class CdkAiWepApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC, Subnet
    const vpc = new ec2.Vpc(this, 'my-app-vpc', {
      maxAzs: 2, // Default is all AZs in region
      natGateways: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      vpcName : 'app-vpc',
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC, // PUBLIC, PRIVATE_ISOLATED, PRIVATE_WITH_EGRESS
          cidrMask: 20,
          name: 'public'
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 20,
          name: 'private'
        },
      ]
    }); 

    // Security Group - app-web-alb-sg
    const sg_WebAlb = new ec2.SecurityGroup(this, "AppWebAlbSg", {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'security group',
      securityGroupName: "app-web-alb-sg",
    }); 
    sg_WebAlb.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'allow HTTP traffic from anywhere',
    );  

    // Security Group - app-web-sg
    const sg_Web = new ec2.SecurityGroup(this, "AppWebSg", {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'security group',
      securityGroupName: "app-web-sg",
    }); 
    sg_Web.addIngressRule(
      // ec2.Peer.anyIpv4(),
      ec2.Peer.securityGroupId(sg_WebAlb.securityGroupId),
      ec2.Port.tcp(8000),
      'allow HTTP traffic from anywhere',
    );  

    const webImage = ecs.ContainerImage.fromAsset('../web');
    const wasImage = ecs.ContainerImage.fromAsset('../was'); 

    // define task definition family
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ServiceTask', {
      family: 'app-web-td'
    });
    const webContainerDefinition = taskDefinition.addContainer('app-web', {
      image: webImage,
      portMappings: [{ 
        containerPort: 8000,
        protocol: ecs.Protocol.TCP,  
        name: "app-web-8000-tcp",
        appProtocol: ecs.AppProtocol.http,        
      }],
      containerName: "app-web"
    });
    const wasContainerDefinition = taskDefinition.addContainer('Was', {
      image: wasImage,
      portMappings: [{ containerPort: 8000 }]
    });

    // ecs cluster
    const cluster = new ecs.Cluster(this, "AppEcsCluster", {
      vpc: vpc,
      // name: "AppEcsCluster"
    }); 

    // Create an application load-balanced Fargate service and make it public
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "MyFargateService", {
      cluster: cluster, // Required
    //  circuitBreaker: {
    //    rollback: true,
    //  }, 
      cpu: 512, // Default is 256
      desiredCount: 1, // Default is 1
      taskImageOptions: { 
        image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample")
      //  image: webImage,
      //  containerPort: 80,
      //  logDriver: ecs.LogDrivers.awsLogs({
      //    streamPrefix: id,
      //    logRetention: logs.RetentionDays.ONE_YEAR,
      //  }), 
      },
    //  taskDefinition: taskDefinition,
      securityGroups: [sg_WebAlb, sg_Web],
      memoryLimitMiB: 2048, // Default is 512
      // loadBalancerName
      // publicLoadBalancer: true, // Default is true
    }); 

    fargateService.targetGroup.configureHealthCheck({
      path: "/health",
    });

    const scalableTaskCount = fargateService.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 4,
    });

    scalableTaskCount.scaleOnCpuUtilization('CpuUtilizationScaling', {
      targetUtilizationPercent: 70,      
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(300),
    });  
  } 
}



  /*  const image = new DockerImageAsset(this, 'CDKDockerImageforWeb', {
      directory: path.join(__dirname, '../../web'),
    }); */

  /*  const tg = new elbv2.ApplicationTargetGroup(this, 'TG', {
      targetType: elbv2.TargetType.IP,
      port: 50051,
      protocol: elbv2.ApplicationProtocol.HTTP,
      protocolVersion: elbv2.ApplicationProtocolVersion.GRPC,
      healthCheck: {
        enabled: true,
        healthyGrpcCodes: '0-99',
      },
      vpc,
    }); */    

// const image = ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample";    
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
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';


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
      ec2.Peer.securityGroupId(sg_WebAlb.securityGroupId),
      ec2.Port.tcp(8000),
      'allow TCP traffic from Web',
    );  

    
    // target group
  /*  const tg = new elbv2.ApplicationTargetGroup(this, 'TG', {
      targetType: elbv2.TargetType.IP,
      targetGroupName: "app-web-alb-tg",
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 8000,
      vpc: vpc,
      protocolVersion: elbv2.ApplicationProtocolVersion.HTTP1,
      healthCheck: {
        enabled: true,
        path: "/health",
        // port: "8000",
      },      
    }); */


    // create auto-scaling group
  /*  const asg = new autoscaling.AutoScalingGroup(this, 'asg', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      userData,
      minCapacity: 2,
      maxCapacity: 3,
    }); */



    // ECR image registration
    const webImage = ecs.ContainerImage.fromAsset('../web');
    const wasImage = ecs.ContainerImage.fromAsset('../was'); 
    
    // define task definition family
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ServiceTask', {
      family: 'app-web-td'
    });
    taskDefinition.addContainer('app-web', {
      image: webImage,
      portMappings: [{ 
        containerPort: 8000,
        protocol: ecs.Protocol.TCP,  
        name: "app-web-8000-tcp",
        appProtocol: ecs.AppProtocol.http,        
      }],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'AppWeb',
        logRetention: logs.RetentionDays.ONE_WEEK,
      }), 
      containerName: "app-web"
    });
    taskDefinition.addContainer('app-was', {
      image: wasImage,
      portMappings: [{ 
        containerPort: 8081,
        protocol: ecs.Protocol.TCP,  
        name: "app-was-8081-tcp",
        appProtocol: ecs.AppProtocol.http,        
      }],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'AppWas',
        logRetention: logs.RetentionDays.ONE_WEEK,
      }), 
      containerName: "app-was"
    });

    // ecs cluster
    const cluster = new ecs.Cluster(this, "AppEcsCluster", {
      vpc: vpc,
      clusterName: "AppEcsCluster"
    }); 

    const fargateService = new ecs.FargateService(this, 'Service', {
      cluster: cluster,
      taskDefinition: taskDefinition,
      serviceName: "app-web-service",
      desiredCount: 2,
      assignPublicIp: false,
      securityGroups: [sg_Web],      
    }); 

    // Setup AutoScaling policy
    const scaling = fargateService.autoScaleTaskCount({ 
      minCapacity: 2,
      maxCapacity: 4      
    });
    scaling.scaleOnCpuUtilization('CpuScaling', {
      policyName: "app-web-asg-policy",
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(300)
    });

    // load balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'alb', {
      loadBalancerName: "app-web-alb",
      internetFacing: true,
      ipAddressType: elbv2.IpAddressType.IPV4,
      vpc: vpc,
      securityGroup: sg_WebAlb,
    });
    const listener = alb.addListener('Listener', {
      port: 80,
      open: true,
    }); 
    listener.addTargets('targetService', {
      targets: [fargateService],
      healthCheck: {
        enabled: true,
        path: '/health',
      },
      targetGroupName: "app-web-alb-tg",
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 8000,
      protocolVersion: elbv2.ApplicationProtocolVersion.HTTP1,      
    }); 

    new cdk.CfnOutput(this, 'WebPageURL', {
      value: "url: "+alb.loadBalancerDnsName,
      description: 'Url of webpage',
    }); 

    // Security Group - aapp-was-alb-sg
  /*  const sg_WasAlb = new ec2.SecurityGroup(this, "AppWasAlbSg", {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'security group of WAS ALB',
      securityGroupName: "app-was-alb-sg",
    }); 
    sg_WasAlb.addIngressRule(
      ec2.Peer.securityGroupId(sg_Web.securityGroupId),
      ec2.Port.tcp(80),
      'allow HTTP traffic from Web',
    );  

     // Security Group - app-was-sg
     const sg_Was = new ec2.SecurityGroup(this, "AppWasSg", {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'security group of WAS',
      securityGroupName: "app-was-sg",
    }); 
    sg_WasAlb.addIngressRule(
      ec2.Peer.securityGroupId(sg_WasAlb.securityGroupId),
      ec2.Port.tcp(8081),
      'allow tcp traffic from WAS ALB',
    );  

    // load balancer for WAS
    const alb_was = new elbv2.ApplicationLoadBalancer(this, 'AlbWas', {
      loadBalancerName: "app-was-alb",
      internetFacing: false,  // internal
      ipAddressType: elbv2.IpAddressType.IPV4,
      vpc: vpc,
      securityGroup: sg_WasAlb,
    });
    const listener_was = alb_was.addListener('Listener', {
      port: 80,
      open: true,
    }); 
    listener_was.addTargets('targetServiceForWAS', {
      targets: [fargateService],
      healthCheck: {
        enabled: true,
        path: '/health',
      },
      targetGroupName: "app-was-alb-tg",
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 8081,
      protocolVersion: elbv2.ApplicationProtocolVersion.HTTP1,      
    }); */

  } 
}

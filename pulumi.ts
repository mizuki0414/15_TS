import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// get VPC
const vpc = awsx.ec2.Vpc.fromExistingIds("name", {
    vpcId: "id",
});
// get Subnets
const PubicSubnet1c = "id";
const PubicSubnet1a = "id";
const PubicSubnet1d = "id";

// Create an ECS EC2 cluster.
const cluster = new awsx.ecs.Cluster("name", {
    name: "name",
    vpc: vpc,
});

// Create SG for ALB, EC2
const sgForALB = new awsx.ec2.SecurityGroup("name", {
    vpc: vpc,
    ingress: [],
    // Outboundが`All traffic`の場合も明示的に指定しないといけない。terraformのプロバイダもそうなってる
    // 以下の設定で`All traffic`になる
    // 参考： https://www.terraform.io/docs/providers/aws/r/security_group.html#description-2
    egress: [
      { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"], ipv6CidrBlocks: ["::/0"] },
    ],
});
const sgForEC2 = new awsx.ec2.SecurityGroup("name", {
    vpc: vpc,
    ingress: [
      { protocol: "tcp", fromPort: 0, toPort: 65535, sourceSecurityGroupId: sgForALB.id },
      { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
    ],
    egress: [
      { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"], ipv6CidrBlocks: ["::/0"] },
    ],
});

// Create ALB
const alb = new awsx.lb.ApplicationLoadBalancer("name", {
    name: "name",
    vpc: vpc,
    subnets: [
      PubicSubnet1c,
      PubicSubnet1a,
      PubicSubnet1d
    ],
    securityGroups: [sgForALB],
});

// Create TargetGroup
const tg = new awsx.lb.ApplicationTargetGroup("name", {
    name: "name",
    vpc: vpc,
    targetType: "name",
    healthCheck: {
      path: "/humans.txt",
      timeout: 5,
    },
    // tgがalbからのforwardingを受けるport（dynamic port mappingの場合はcontainer port）
    port: 3031,
    // protocolのデフォルトはHTTPS
    protocol: "HTTP",
    loadBalancer: alb,
});

// Create Listener(https)
const httpsListener = new awsx.lb.ApplicationListener("name", {
    vpc: vpc,
    name: "namme",
    loadBalancer: alb,
    // albがlistenするport
    port: 443,
    certificateArn: "arn",
    defaultAction: {
      targetGroupArn: tg.targetGroup.arn,
      type: "forward",
    },
  });

  // Create Listener(http)
const httpListener = new awsx.lb.ApplicationListener("name", {
    vpc: vpc,
    name: "name",
    loadBalancer: alb,
    // albがlistenするport
    port: 80,
    defaultAction: {
      type: "redirect",
      redirect: {
        // なぜかintではなくstring
        port: "443",
        statusCode: "HTTP_301",
        protocol: "HTTPS",
      }
    },
});

// Create IAM
const taskRole = new aws.iam.Role("name", {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Action: "sts:AssumeRole",
        // コンソールではTrusted Entitiesとか呼ばれているやつ
        // taskに貼るIAMなのでecs-taskを指定する
        Principal: {
          Service: "service",
        },
        Effect: "Allow",
      }]
    })
});
const taskExecutionRole = new aws.iam.Role("name", {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Action: "sts:AssumeRole",
        Principal: {
          Service: "ecs-tasks.amazonaws.com",
        },
        Effect: "Allow",
      }]
    })
});

const taskExecutionAttachment = new aws.iam.RolePolicyAttachment("name", {
    role: taskExecutionRole,
    // これがないとコンテナを起動できない
    policyArn: "arn",
});

const taskExecutionSSMROAttachment = new aws.iam.RolePolicyAttachment("name", {
    role: taskExecutionRole,
    // コンテナにParameter Storeとかで環境変数バインドする時はこれも必要
    policyArn: "arn",
});

// Create AutoScalingGroup
const asg = cluster.createAutoScalingGroup("name", {
  vpc: vpc,
  // known bug
  // https://github.com/pulumi/pulumi-awsx/issues/289
  subnetIds: [
    PubicSubnet1c,
    PubicSubnet1a,
    PubicSubnet1d
  ],
  templateParameters: {
    minSize: 0,
    maxSize: 1,
  },
  launchConfigurationArgs: {
    securityGroups: [sgForEC2],
    associatePublicIpAddress: true,
    // aws ssm get-parameters --names /aws/service/ecs/optimized-ami/amazon-linux-2/recommended --region ap-northeast-1 でとってくるといいよ
    ecsOptimizedAMIName: "amzn2-ami-ecs-hvm-2.0.20210301-x86_64-ebs",
    instanceType: "t2.small",
    // /dev/xvda （30 GiB, root device）
    rootBlockDevice: {
      volumeSize: 30,
    },
    keyName: "name",
    ebsBlockDevices: [],
  },
  targetGroups: [ tg ],
});

// Create TaskDefinition
const portMapping: aws.ecs.PortMapping = {
    containerPort: 9100,
    // dynamic port mapping
    hostPort: 9100,
    protocol: "tcp",
  };
  const container: awsx.ecs.Container = {
    image: `image`,
    memory: 1024,
    portMappings: [portMapping],
  };
  const taskDefinition = new awsx.ecs.EC2TaskDefinition("name",{
    // デフォルト値はawsvpc
    networkMode: "bridge",
    containers: {
      exporter: container,
    },
    taskRole: taskRole,
    executionRole: taskExecutionRole,
});

// Create Service
const service = new awsx.ecs.EC2Service("name", {
    name: "name",
    deploymentMaximumPercent: 200,
    deploymentMinimumHealthyPercent: 100,
    healthCheckGracePeriodSeconds: 5,
    waitForSteadyState: false,
    cluster: cluster,
    taskDefinition: taskDefinition,
    desiredCount: 1,
    loadBalancers: [{
      targetGroupArn: tg.targetGroup.arn,
      containerName: "exporter",
      containerPort: 9100,
    }],
  });
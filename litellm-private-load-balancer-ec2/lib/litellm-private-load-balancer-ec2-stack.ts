import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface LiteLLMStackProps extends cdk.StackProps {
  vpcId: string;
  keyPairName: string;
}

export class LitellmPrivateLoadBalancerEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LiteLLMStackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'ImportedVpc', { vpcId: props.vpcId })

    // 2) Create Security Group for the Windows instance
    const windowsSg = new ec2.SecurityGroup(this, 'WindowsInstanceSG', {
      vpc,
      allowAllOutbound: true,
    });

    // WARNING: This opens RDP from anywhere — not recommended in production!
    windowsSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3389),
    );

    // 4) Define a Windows AMI (Server 2019 as an example)
    const windowsAmi = ec2.MachineImage.latestWindows(
      ec2.WindowsVersion.WINDOWS_SERVER_2022_ENGLISH_FULL_BASE
    );

    // 5) Launch a Windows EC2 instance in a public subnet
    const windowsInstance = new ec2.Instance(this, 'WindowsBrowserInstance', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: windowsSg,
      instanceType: new ec2.InstanceType('t3.small'),
      machineImage: windowsAmi,
      keyPair: ec2.KeyPair.fromKeyPairName(this, "ec2litellmkeypair", props.keyPairName)
    });
  }
}

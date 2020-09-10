import AWS from "aws-sdk";

export interface AccessKey {
  AccessKeyId: string;
  SecretAccessKey: string;
}

export interface Credentials {
  list: () => Promise<Array<string>>;
  create: () => Promise<AccessKey>;
  delete: (accessKeyId: string) => Promise<void>;
}

export class AwsCredentials implements Credentials {
  private readonly iam: AWS.IAM;
  private readonly userName: string;

  constructor(iam: AWS.IAM, userName: string) {
    this.iam = iam;
    this.userName = userName;
  }

  list = async () =>
    (
      await this.iam
        .listAccessKeys({
          UserName: this.userName,
        })
        .promise()
    ).AccessKeyMetadata.map((meta) => meta.AccessKeyId || "");

  create = async () =>
    (
      await this.iam
        .createAccessKey({
          UserName: this.userName,
        })
        .promise()
    ).AccessKey;

  delete = async (AccessKeyId: string) =>
    await this.iam
      .deleteAccessKey({
        UserName: this.userName,
        AccessKeyId,
      })
      .promise()
      .then((_) => {});
}

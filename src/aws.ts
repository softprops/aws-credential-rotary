import AWS from "aws-sdk";

export interface AccessKey {
  AccessKeyId: string;
  SecretAccessKey: string;
}

export interface Aws {
  accessKeys: (userName: string) => Promise<Array<string>>;
  createAccessKey: (userName: string) => Promise<AccessKey>;
  deleteAccessKey: (userName: string, accessKeyId: string) => Promise<void>;
}

export class DefaultAws implements Aws {
  private readonly iam: AWS.IAM;

  constructor(iam: AWS.IAM) {
    this.iam = iam;
  }

  accessKeys = async (UserName: string) =>
    (
      await this.iam
        .listAccessKeys({
          UserName,
        })
        .promise()
    ).AccessKeyMetadata.map((meta) => meta.AccessKeyId || "");

  createAccessKey = async (UserName: string) =>
    (
      await this.iam
        .createAccessKey({
          UserName,
        })
        .promise()
    ).AccessKey;

  deleteAccessKey = async (UserName: string, AccessKeyId: string) =>
    await this.iam
      .deleteAccessKey({
        UserName,
        AccessKeyId,
      })
      .promise()
      .then((_) => {});
}

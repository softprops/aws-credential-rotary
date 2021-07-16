import { IAM } from "@aws-sdk/client-iam";

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
  private readonly iam: IAM;
  private readonly userName: string;

  constructor(iam: IAM, userName: string) {
    this.iam = iam;
    this.userName = userName;
  }

  list = async () =>
    (
      await this.iam.listAccessKeys({
        UserName: this.userName,
      })
    ).AccessKeyMetadata?.map((meta) => meta.AccessKeyId || "") || [];

  create = async () => {
    const key = (
      await this.iam.createAccessKey({
        UserName: this.userName,
      })
    ).AccessKey;
    // dubiously the sdk can return a key which as undefined key id/access secret
    if (key?.AccessKeyId !== undefined && key?.SecretAccessKey !== undefined) {
      return {
        AccessKeyId: key?.AccessKeyId || "",
        SecretAccessKey: key?.SecretAccessKey || "",
      };
    }

    throw new Error("failed to create new access key");
  };

  delete = async (AccessKeyId: string) =>
    await this.iam
      .deleteAccessKey({
        UserName: this.userName,
        AccessKeyId,
      })
      .then((_) => {});
}

import { setFailed, info } from "@actions/core";
import { IAM } from "@aws-sdk/client-iam";
import { STS } from "@aws-sdk/client-sts";
import { AwsCredentials, Credentials } from "./credentials";
import {
  GitHubRepositorySecrets,
  Secrets,
  encrypt,
  GitHubOrganizationSecrets,
} from "./secrets";
import { Input, input } from "./input";

export interface Logger {
  setFailed: (msg: any) => void;
  info: (msg: any) => void;
}

export async function rotate(
  input: Input,
  secrets: Secrets,
  credentials: Credentials,
  logger: Logger
) {
  const {
    iamUserName,
    githubAccessKeyIdName,
    githubSecretAccessKeyName,
  } = input;
  logger.info("Checking current credentials");
  const keys = await credentials.list();
  if (keys.length == 2) {
    logger.setFailed(`AWS user ${iamUserName} already has 2 access keys`);
    return;
  }

  logger.info("Provisoning new access key");
  const { AccessKeyId, SecretAccessKey } = await credentials.create();

  logger.info("Fetching public key");
  const { key, key_id } = await secrets.publicKey();

  logger.info(`Upserting secret ${githubAccessKeyIdName}`);
  await secrets.upsert(
    githubAccessKeyIdName,
    encrypt(AccessKeyId, key),
    key_id
  );

  logger.info(`Upserting secret ${githubSecretAccessKeyName}`);
  await secrets.upsert(
    githubSecretAccessKeyName,
    encrypt(SecretAccessKey, key),
    key_id
  );

  logger.info("Deleting previous access key");
  await credentials.delete(keys[0]);
}

async function main() {
  try {
    const actionInput = input(process.env);
    const { githubToken, organization, owner, repo, iamUserName } = actionInput;

    const secrets =
      organization == null
        ? new GitHubRepositorySecrets(githubToken, owner, repo)
        : new GitHubOrganizationSecrets(githubToken, organization);

    const username =
      iamUserName ||
      (
        await new STS({
          region: process.env.AWS_REGION || "us-east-1",
        }).getCallerIdentity({})
      ).Arn?.split("/")[1] ||
      "";
    const credentials = new AwsCredentials(
      new IAM({ region: process.env.AWS_REGION || "us-east-1" }),
      username
    );
    await rotate(
      { iamUserName: username, ...actionInput },
      secrets,
      credentials,
      { setFailed, info: console.log }
    );
  } catch (error) {
    setFailed(error.message);
  }
}

console.log(`require main ${require.main}`);

//if (require.main === module) {
main();
//}

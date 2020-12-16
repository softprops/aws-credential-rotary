import { setFailed, info } from "@actions/core";
import AWS from "aws-sdk";
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
      (await new AWS.STS().getCallerIdentity().promise()).Arn?.split("/")[1] ||
      "";
    const credentials = new AwsCredentials(new AWS.IAM(), username);
    await rotate(
      { iamUserName: username, ...actionInput },
      secrets,
      credentials,
      { setFailed, info }
    );
  } catch (error) {
    setFailed(error.message);
  }
}

if (require.main === module) {
  main();
}

import { setFailed, info } from "@actions/core";
import AWS from "aws-sdk";
import { AwsCredentials, Credentials } from "./credentials";
import { GitHubSecrets, Secrets, encrypt } from "./secrets";
import { Input, input } from "./input";

async function rotate(
  input: Input,
  secrets: Secrets,
  credentials: Credentials
) {
  const {
    iamUserName,
    githubAccessKeyIdName,
    githubSecretAccessKeyName,
  } = input;
  const keys = await credentials.list();
  if (keys.length == 2) {
    setFailed(`AWS user ${iamUserName} already has 2 access keys`);
    return;
  }

  info("Provisoning new access key");
  const { AccessKeyId, SecretAccessKey } = await credentials.create();
  console.log("Fetching repository public key");
  const { key, key_id } = await secrets.publicKey();
  info(`Upserting secret ${githubAccessKeyIdName}`);
  await secrets.upsert(
    githubAccessKeyIdName,
    encrypt(AccessKeyId, key),
    key_id
  );
  info(`Upserting secret ${githubSecretAccessKeyName}`);
  await secrets.upsert(
    githubSecretAccessKeyName,
    encrypt(SecretAccessKey, key),
    key_id
  );
  info("Deleting previous access key");
  await credentials.delete(keys[0]);
}

async function main() {
  try {
    const actionInput = input(process.env);
    const { githubToken, owner, repo, iamUserName } = actionInput;
    const secrets = new GitHubSecrets(githubToken, owner, repo);
    const credentials = new AwsCredentials(
      new AWS.IAM(),
      iamUserName ||
        (await new AWS.STS().getCallerIdentity().promise()).Arn?.split(
          "/"
        )[1] ||
        ""
    );
    await rotate(actionInput, secrets, credentials);
  } catch (error) {
    setFailed(error.message);
  }
}

if (require.main === module) {
  main();
}

import { setFailed } from "@actions/core";
import AWS from "aws-sdk";
import { AwsCredentials } from "./credentials";
import { GitHubSecrets, encrypt } from "./secrets";
import { input } from "./input";

async function run() {
  try {
    const {
      githubToken,
      owner,
      repo,
      githubAccessKeyIdName,
      githubSecretAccessKeyName,
      iamUserName,
    } = input(process.env);

    const secrets = new GitHubSecrets(githubToken, owner, repo);
    const credentials = new AwsCredentials(new AWS.IAM(), iamUserName);

    const keys = await credentials.list();
    if (keys.length == 2) {
      setFailed(`AWS user ${iamUserName} already has 2 access keys`);
      return;
    }

    const { AccessKeyId, SecretAccessKey } = await credentials.create();
    const publicKey = await secrets.publicKey();
    await secrets.upsert(
      githubAccessKeyIdName,
      encrypt(AccessKeyId, publicKey)
    );
    await secrets.upsert(
      githubSecretAccessKeyName,
      encrypt(SecretAccessKey, publicKey)
    );
    await credentials.delete(keys[0]);
  } catch (error) {
    setFailed(error.message);
  }
}

if (require.main === module) {
  run();
}

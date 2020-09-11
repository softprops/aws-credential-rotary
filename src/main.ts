import { setFailed, info } from "@actions/core";
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
    const credentials = new AwsCredentials(
      new AWS.IAM(),
      iamUserName ||
        (await new AWS.STS().getCallerIdentity().promise()).Arn?.split(
          "/"
        )[1] ||
        ""
    );

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
  } catch (error) {
    setFailed(error.message);
  }
}

if (require.main === module) {
  run();
}

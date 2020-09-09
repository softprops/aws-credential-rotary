import { setFailed, getInput } from "@actions/core";
import { Octokit } from "@octokit/rest";
import AWS from "aws-sdk";
import * as soduim from "tweetsodium";
import { DefaultAws } from "./aws";
import { OctokitGitHub } from "./github";
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

    const github = new OctokitGitHub(githubToken);
    const aws = new DefaultAws(new AWS.IAM());

    const currentKeys = await aws.accessKeys(iamUserName);
    if (currentKeys.length == 2) {
      setFailed(`AWS user ${iamUserName} already has 2 access keys`);
      return;
    }

    const { AccessKeyId, SecretAccessKey } = await aws.createAccessKey(
      iamUserName
    );
    const publicKey = await github.publicKey(owner, repo);
    const encryptedAccessKeyId = Buffer.from(
      soduim.seal(Buffer.from(AccessKeyId), Buffer.from(publicKey, "base64"))
    ).toString("base64");
    const encryptedSecretAccessKey = Buffer.from(
      soduim.seal(
        Buffer.from(SecretAccessKey),
        Buffer.from(publicKey, "base64")
      )
    ).toString("base64");
    await github.upsertSecret(
      owner,
      repo,
      githubAccessKeyIdName,
      encryptedAccessKeyId
    );
    await github.upsertSecret(
      owner,
      repo,
      githubSecretAccessKeyName,
      encryptedSecretAccessKey
    );
      await aws.deleteAccessKey(iamUserName, currentKeys[0])
  } catch (error) {
    setFailed(error.message);
  }
}

if (require.main === module) {
  run();
}

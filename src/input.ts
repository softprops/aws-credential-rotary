export interface Input {
  /** GitHub authentication bearer token */
  githubToken: string;
  /** if set, updates the secrets of this organization instead of the current repository */
  organization?: string;
  /** GitHub repository owner */
  owner: string;
  /** GitHub repository name */
  repo: string;
  /** Name of GitHub secret storing aws_access_key_id */
  githubAccessKeyIdName: string;
  /** Name of GitHub secret storing aws_secret_access_key */
  githubSecretAccessKeyName: string;
  /** AWS IAM user name */
  iamUserName: string | undefined;
  /** Repo environment name */
  environment?: string;
}

export const input = (env: Record<string, string | undefined>): Input => {
  const githubToken = env.GITHUB_TOKEN || "";
  const organization = env["INPUT_ORGANIZATION"];
  const environment = env["INPUT_ENVIRONMENT"];
  const [owner, repo] = (env.GITHUB_REPOSITORY || "").split("/");
  const githubAccessKeyIdName =
    env["INPUT_GITHUB-ACCESS-KEY-ID-NAME"] || "AWS_ACCESS_KEY_ID";

  const githubSecretAccessKeyName =
    env["INPUT_GITHUB-SECRET-ACCESS-KEY-NAME"] || "AWS_SECRET_ACCESS_KEY";
  const iamUserName = env["INPUT_IAM-USER-NAME"];

  return {
    githubToken,
    owner,
    repo,
    organization,
    githubAccessKeyIdName,
    githubSecretAccessKeyName,
    iamUserName,
    environment,
  };
};

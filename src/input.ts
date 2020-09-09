export interface Input {
  /** GitHub authentication bearer token */
  githubToken: string;
  /** GitHub repository owner */
  owner: string;
  /** GitHub repository name */
  repo: string;
  /** Name of GitHub secret storing aws_access_key_id */
  githubAccessKeyIdName: string;
  /** Name of GitHub secret storing aws_secret_access_key */
  githubSecretAccessKeyName: string;
  /** AWS IAM user name */
  iamUserName: string;
}

export const input = (env: Record<string, string | undefined>): Input => {
  const githubToken = env.GITHUB_TOKEN || "";
  const [owner, repo] = (env.GITHUB_REPOSITORY || "").split("/");
  const githubAccessKeyIdName = env["INPUT_GITHUB-ACCESS-KEY-ID-NAME"] || "";
  const githubSecretAccessKeyName =
    env["INPUT_GITHUB-SECRET-ACCESS-KEY-NAME"] || "";
  const iamUserName = env["INPUT_IAM-USER-NAME"] || "";
  return {
    githubToken,
    owner,
    repo,
    githubAccessKeyIdName,
    githubSecretAccessKeyName,
    iamUserName,
  };
};

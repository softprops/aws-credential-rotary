import { Octokit } from "@octokit/rest";

export interface GitHub {
  publicKey: (owner: string, repo: string) => Promise<string>;
  upsertSecret: (
    owner: string,
    repo: string,
    name: string,
    value: string
  ) => Promise<void>;
}

export class OctokitGitHub implements GitHub {
  private readonly octokit: Octokit;

  constructor(githubToken: string) {
    this.octokit = new Octokit({ auth: githubToken });
  }

  publicKey = async (owner: string, repo: string) => {
    const { key } = (
      await this.octokit.request(
        "GET /repos/{owner}/{repo}/actions/secrets/public-key",
        {
          owner,
          repo,
        }
      )
    ).data;
    return key;
  };

  upsertSecret = async (
    owner: string,
    repo: string,
    secret_name: string,
    encrypted_value: string
  ) => {
    await this.octokit.request(
      "PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}",
      {
        owner,
        repo,
        secret_name,
        encrypted_value,
      }
    );
  };
}

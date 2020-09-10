import { Octokit } from "@octokit/rest";
import { seal } from "tweetsodium";

export interface Secrets {
  publicKey: () => Promise<string>;
  upsert: (name: string, value: string) => Promise<void>;
}

export const encrypt = (plaintext: string, publicKey: string): string =>
  Buffer.from(
    seal(Buffer.from(plaintext), Buffer.from(publicKey, "base64"))
  ).toString("base64");

export class GitHubSecrets implements Secrets {
  private readonly octokit: Octokit;
  private readonly owner: string;
  private readonly repo: string;

  constructor(githubToken: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: githubToken });
    this.owner = owner;
    this.repo = repo;
  }

  publicKey = async () => {
    const { key } = (
      await this.octokit.request(
        "GET /repos/{owner}/{repo}/actions/secrets/public-key",
        {
          owner: this.owner,
          repo: this.repo,
        }
      )
    ).data;
    return key;
  };

  upsert = async (secret_name: string, encrypted_value: string) => {
    await this.octokit.request(
      "PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}",
      {
        owner: this.owner,
        repo: this.repo,
        secret_name,
        encrypted_value,
      }
    );
  };
}

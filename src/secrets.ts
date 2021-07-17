import { Octokit } from "@octokit/rest";
import { seal } from "tweetsodium";

export interface PublicKey {
  key: string;
  key_id: string;
}
export interface Secrets {
  publicKey: () => Promise<PublicKey>;
  upsert: (name: string, value: string, key_id: string) => Promise<void>;
}

export const encrypt = (plaintext: string, publicKey: string): string =>
  Buffer.from(
    seal(Buffer.from(plaintext), Buffer.from(publicKey, "base64"))
  ).toString("base64");

export class GitHubRepositorySecrets implements Secrets {
  private readonly octokit: Octokit;
  private readonly owner: string;
  private readonly repo: string;

  constructor(githubToken: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: githubToken });
    this.owner = owner;
    this.repo = repo;
  }

  async publicKey() {
    return (
      await this.octokit
        .request("GET /repos/{owner}/{repo}/actions/secrets/public-key", {
          owner: this.owner,
          repo: this.repo,
        })
        .catch((e) => {
          console.log(e.headers);
          throw e;
        })
    ).data;
  }

  async upsert(secret_name: string, encrypted_value: string, key_id: string) {
    await this.octokit.request(
      "PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}",
      {
        owner: this.owner,
        repo: this.repo,
        secret_name,
        encrypted_value,
        key_id,
      }
    );
  }
}

export class GitHubOrganizationSecrets implements Secrets {
  private readonly octokit: Octokit;
  private readonly organization: string;

  constructor(githubToken: string, organization: string) {
    this.octokit = new Octokit({ auth: githubToken });
    this.organization = organization;
  }

  async publicKey() {
    return (
      await this.octokit.request("GET /orgs/{org}/actions/secrets/public-key", {
        org: this.organization,
      })
    ).data;
  }

  async upsert(secret_name: string, encrypted_value: string, key_id: string) {
    const oldSecret = await this.getSecret(secret_name);
    const selected_repository_ids = await this.getSelectedRepositoryIdsOfSecret(
      secret_name
    ).then((ids) => ids.map((id) => id.toString()));

    await this.octokit.request(
      "PUT /orgs/{org}/actions/secrets/{secret_name}",
      {
        org: this.organization,
        secret_name,
        encrypted_value,
        key_id,
        visibility: oldSecret.visibility,
        selected_repository_ids,
      }
    );
  }

  async getSecret(secret_name: string) {
    try {
      return (
        await this.octokit.request(
          "GET /orgs/{org}/actions/secrets/{secret_name}",
          {
            org: this.organization,
            secret_name,
          }
        )
      ).data;
    } catch (e) {
      throw new Error(
        `Could not retrieve organization secret ${this.organization}/${secret_name}. Root cause: ${e.message}`
      );
    }
  }

  async getSelectedRepositoryIdsOfSecret(
    secret_name: string
  ): Promise<Array<number>> {
    const { data } = await this.octokit.request(
      "GET /orgs/{org}/actions/secrets/{secret_name}/repositories",
      {
        org: this.organization,
        secret_name,
      }
    );

    return data.repositories.map((r) => r.id);
  }
}

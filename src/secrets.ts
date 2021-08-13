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
  protected readonly octokit: Octokit;
  protected readonly owner: string;
  protected readonly repo: string;

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
          console.log(
            `failed to fetch public key for ${this.owner}/${this.repo}`
          );
          console.log(e.headers);
          throw e;
        })
    ).data;
  }

  async upsert(secret_name: string, encrypted_value: string, key_id: string) {
    await this.octokit
      .request("PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}", {
        owner: this.owner,
        repo: this.repo,
        secret_name,
        encrypted_value,
        key_id,
      })
      .catch((e) => {
        console.log(
          `failed to upsert secret ${secret_name} for ${this.owner}/${this.repo}`
        );
        console.log(e.headers);
        throw e;
      });
  }
}

export class GitHubRepositoryEnvironmentSecrets extends GitHubRepositorySecrets {
  private readonly env: string;

  constructor(githubToken: string, owner: string, repo: string, env: string) {
    super(githubToken, owner, repo);
    this.env = env;
  }

  async getRepoId() {
    return (
      await this.octokit
        .request("GET /repos/{owner}/{repo}", {
          owner: this.owner,
          repo: this.repo,
        })
        .catch((e) => {
          console.log(
            `failed to fetch public key for ${this.owner}/${this.repo}`
          );
          console.log(e.headers);
          throw e;
        })
    ).data.id;
  }

  async publicKey() {
    const repository_id = await this.getRepoId();
    return (
      await this.octokit
        .request(
          "GET /repositories/{repository_id}/environments/{environment_name}/secrets/public-key",
          {
            repository_id,
            environment_name: this.env,
            owner: this.owner,
            repo: this.repo,
          }
        )
        .catch((e) => {
          console.log(
            `failed to fetch public key for ${this.owner}/${this.repo}`
          );
          console.log(e.headers);
          throw e;
        })
    ).data;
  }

  async upsert(secret_name: string, encrypted_value: string, key_id: string) {
    const repository_id = await this.getRepoId();
    await this.octokit
      .request(
        "PUT /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}",
        {
          repository_id,
          environment_name: this.env,
          secret_name,
          encrypted_value,
          key_id,
        }
      )
      .catch((e) => {
        console.log(
          `failed to upsert secret ${secret_name} for ${this.owner}/${this.repo}`
        );
        console.log(e.headers);
        throw e;
      });
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
      await this.octokit
        .request("GET /orgs/{org}/actions/secrets/public-key", {
          org: this.organization,
        })
        .catch((e) => {
          console.log(
            `failed to fetch public key for organization ${this.organization}`
          );
          console.log(e.headers);
          throw e;
        })
    ).data;
  }

  async upsert(secret_name: string, encrypted_value: string, key_id: string) {
    const oldSecret = await this.getSecret(secret_name);
    const selected_repository_ids = await this.getSelectedRepositoryIdsOfSecret(
      secret_name
    ).then((ids) => ids.map((id) => id.toString()));

    await this.octokit
      .request("PUT /orgs/{org}/actions/secrets/{secret_name}", {
        org: this.organization,
        secret_name,
        encrypted_value,
        key_id,
        visibility: oldSecret.visibility,
        selected_repository_ids,
      })
      .catch((e) => {
        console.log(
          `failed to upsert secret ${secret_name} for ${this.organization}`
        );
        console.log(e.headers);
        throw e;
      });
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
      console.log(
        `failed to get secret ${secret_name} for ${this.organization}`
      );
      throw e;
    }
  }

  async getSelectedRepositoryIdsOfSecret(
    secret_name: string
  ): Promise<Array<number>> {
    const { data } = await this.octokit
      .request("GET /orgs/{org}/actions/secrets/{secret_name}/repositories", {
        org: this.organization,
        secret_name,
      })
      .catch((e) => {
        console.log(
          `failed to get list of repositories using ${secret_name} for ${this.organization}`
        );
        console.log(e.headers);
        throw e;
      });

    return data.repositories.map((r) => r.id);
  }
}

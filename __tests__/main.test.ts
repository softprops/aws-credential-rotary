import * as assert from "assert";
import { Input } from "../src/input";
import { rotate, getSecretHandler } from "../src/main";
import {
  GitHubRepositoryEnvironmentSecrets,
  GitHubOrganizationSecrets,
} from "../src/secrets";
// https://github.com/dwyl/aws-sdk-mock#using-typescript

describe("main", () => {
  describe("rotate", () => {
    it("expects an user with only one credential", async () => {
      const input = {
        githubToken: "xxx",
        owner: "xxx",
        repo: "xxx",
        githubAccessKeyIdName: "xxx",
        githubSecretAccessKeyName: "xxx",
        iamUserName: "emma",
      };
      const credentials = {
        list: () => Promise.resolve(["a", "b"]),
        create: () => Promise.reject(),
        delete: (accessKeyId: string) => Promise.reject(),
      };
      const secrets = {
        publicKey: () => Promise.resolve({ key: "xxx", key_id: "yyy" }),
        upsert: (name: string, value: string, key_id: string) =>
          Promise.resolve(),
      };
      const errs: Array<string> = [];
      const infos: Array<string> = [];
      await rotate(input, secrets, credentials, {
        setFailed: (msg: any) => errs.push(msg),
        info: (msg: any) => infos.push(msg),
      });
      assert.deepStrictEqual(infos, ["Checking current credentials"]);
      assert.deepStrictEqual(errs, ["AWS user emma already has 2 access keys"]);
    });

    it("creates and upserts credentials before deleting the current credentials", async () => {
      const input = {
        githubToken: "xxx",
        owner: "xxx",
        repo: "xxx",
        githubAccessKeyIdName: "xxx",
        githubSecretAccessKeyName: "yyy",
        iamUserName: "emma",
      };
      const credentials = {
        list: () => Promise.resolve(["a"]),
        create: () =>
          Promise.resolve({ AccessKeyId: "xxx", SecretAccessKey: "yyy" }),
        delete: (accessKeyId: string) => Promise.resolve(),
      };
      const secrets = {
        publicKey: () =>
          Promise.resolve({
            key: "wEAcbZUUnvyLzJ2bFIuyE/RRX8RrvV5cd/PIq57N1kA=",
            key_id: "yyy",
          }),
        upsert: (name: string, value: string, key_id: string) =>
          Promise.resolve(),
      };
      const errs: Array<string> = [];
      const infos: Array<string> = [];
      await rotate(input, secrets, credentials, {
        setFailed: (msg: any) => errs.push(msg),
        info: (msg: any) => infos.push(msg),
      });
      assert.deepStrictEqual(infos, [
        "Checking current credentials",
        "Provisoning new access key",
        "Fetching public key",
        "Upserting secret xxx",
        "Upserting secret yyy",
        "Deleting previous access key",
      ]);
      assert.deepStrictEqual(errs, []);
    });
  });

  describe("secrets handler", () => {
    it("validate selected handler when environment parameter is set", () => {
      const input: Input = {
        githubToken: "xxx",
        owner: "xxx",
        repo: "xxx",
        githubAccessKeyIdName: "xxx",
        githubSecretAccessKeyName: "xxx",
        iamUserName: "emma",
        environment: "sandbox",
      };

      const secretHandler = getSecretHandler(input);
      expect(secretHandler).toBeInstanceOf(GitHubRepositoryEnvironmentSecrets);
    });

    it("validate selected handler when both environment and organization parameters are set", () => {
      const input: Input = {
        githubToken: "xxx",
        owner: "xxx",
        repo: "xxx",
        githubAccessKeyIdName: "xxx",
        githubSecretAccessKeyName: "xxx",
        iamUserName: "emma",
        environment: "sandbox",
        organization: "organization",
      };

      const secretHandler = getSecretHandler(input);
      expect(secretHandler).toBeInstanceOf(GitHubOrganizationSecrets);
    });
  });
});

import * as assert from "assert";
import { Credentials } from "../src/credentials";
import { Secrets } from "../src/secrets";
import { Input } from "../src/input";
import { rotate } from "../src/main";
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
        publicKey: () => Promise.reject(),
        upsert: (name: string, value: string, key_id: string) =>
          Promise.reject(""),
      };
      const errs: Array<string> = [];
      const infos: Array<string> = [];
      await rotate(input, secrets, credentials, {
        setFailed: (msg: any) => errs.push(msg),
        info: (msg: any) => infos.push(msg),
      });
      assert.deepStrictEqual(infos, []);
      assert.deepStrictEqual(errs, ["AWS user emma already has 2 access keys"]);
    });
  });
});

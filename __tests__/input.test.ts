import * as assert from "assert";
import { input } from "../src/input";
// https://github.com/dwyl/aws-sdk-mock#using-typescript

describe("input", () => {
  it("parses input from env with sane defaults", async () => {
    assert.deepStrictEqual(
      input({
        GITHUB_TOKEN: "xxx",
        GITHUB_REPOSITORY: "foo/bar",
      }),
      {
        githubToken: "xxx",
        owner: "foo",
        repo: "bar",
        githubAccessKeyIdName: "AWS_ACCESS_KEY_ID",
        githubSecretAccessKeyName: "AWS_SECRET_ACCESS_KEY",
        organization: undefined,
        environment: undefined,
        iamUserName: undefined,
      }
    );
  });
});

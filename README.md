<h1 align="center">
  🔄
  <br/>
  AWS Credential Rotary
</h1>

<p align="center">
   A GitHub action for rotating AWS credentials stored in GitHub secrets
</p>

<div align="center">
  <a href="https://github.com/softprops/aws-credential-rotary/actions">
		<img src="https://github.com/softprops/aws-credential-rotary/workflows/Main/badge.svg"/>
	</a>
</div>

<br />

## 🤔 why bother

AWS assumes a shared security responsibility model with you and it's services.

It goes to great lengths to secure your privacy and access to services which your users depend on.
It also assumes that you are doing the same with the credentials that permit access to those services and data.
AWS [documents some helpful best practices](https://docs.aws.amazon.com/general/latest/gr/aws-access-keys-best-practices.html) to manage that.

One of those practices is ensuring you are periodically rotating your credentials. The longer lived your credentials are, the greater the opportunity of inviting unwanted and unintential breach of your aws managed systems and data is.

In short, it is much easier to rotate your credentials than to cope with the aftermath of a data access breach.

## 🤸 usage

This action depends on the ability to update repository secrets. As such it requires an GitHub api token with `repo` permissions.

Create a personal access token with `repo` permissions on [github.com](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) or if you prefer the command line, [try octopat](https://github.com/softprops/octopat). If you intend to update organization wide secrets, the access token must have `admin:org` permissions.

Store that access token in your [GitHub repository secrets](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets), then provide that as `GITHUB_TOKEN` environment variable to the GitHub action step for aws-credential-rotary.

This action also depends on having the ability to list, create, and delete iam access keys.

The IAM Statement permitting this permissions should look something like the following

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "iam:ListAccessKeys",
        "iam:CreateAccessKey",
        "iam:DeleteAccessKey",
        "sts:GetCallerIdentity"
      ],
      "Resource": "arn:aws:iam::*:user/*",
      "Effect": "Allow"
    }
  ]
}
```

By default, this action assumes the credentials used to rotate are the same as the iam user for other GitHub action scontinuous integration and deployment operations.

The example below rotates credentials just before they are used

```diff
name: Main

on: push

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
+     - name: Rotate credentials
+       uses: softprops/aws-credential-rotary@v1
+       env:
+         GITHUB_TOKEN: ${{ secrets.REPO_GITHUB_TOKEN }}
+         AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
+         AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      - name: Print Create Date
        run: aws iam list-access-keys --user name-of-iam-user-associated-with-credentials --query 'AccessKeyMetadata[0].CreateDate' --output text
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
```

### Rotating on a schedule

It is recommended to rotate credentials on a [schedule](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#scheduled-events). You can find some [example schedules here](https://crontab.guru/examples.html)

```diff
name: Rotate AWS Credentials

+ on:
+  schedule:
+    # At 00:00 on Sunday.
+    - cron:  '0 0 * * 0'

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
     - name: Rotate credentials
       uses: softprops/aws-credential-rotary@v1
       env:
         GITHUB_TOKEN: ${{ secrets.REPO_GITHUB_TOKEN }}
         AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
         AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      - name: Print Create Date
        run: aws iam list-access-keys --user name-of-iam-user-associated-with-credentials --query 'AccessKeyMetadata[0].CreateDate' --output text
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
```

### Specifying IAM username

When the IAM user associated with for the credentials to be rotated is not the same as the IAM user used to rotate credentials, you can specify an `iam-user-name` for disambiguating the two.

```diff
name: Main

on: push

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
     - name: Rotate credentials
       uses: softprops/aws-credential-rotary@v1
+       with:
+           iam-user-name: 'name-of-iam-user-associated-with-credentials'
       env:
         GITHUB_TOKEN: ${{ secrets.REPO_GITHUB_TOKEN }}
         AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
         AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      - name: Print Create Date
        run: aws iam list-access-keys --user name-of-iam-user-associated-with-credentials --query 'AccessKeyMetadata[0].CreateDate' --output text
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
```

### Specifying AWS_REGION

This action uses the aws v3 sdk which [requires a region to be provided](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-region.html). If you do not provide one via an `AWS_REGION` env variable `us-east-1` is assumed

```diff
name: Main

on: push

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
     - name: Rotate credentials
       uses: softprops/aws-credential-rotary@v1
       env:
         GITHUB_TOKEN: ${{ secrets.REPO_GITHUB_TOKEN }}
         AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
         AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
+        AWS_REGION: 'us-west-2'
      - name: Print Create Date
        run: aws iam list-access-keys --user name-of-iam-user-associated-with-credentials --query 'AccessKeyMetadata[0].CreateDate' --output text
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
```

### Custom secret names

By default, this action will assume the credentials to be rotated exist as secrets named `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. You can override these with the following inputs

```diff
name: Main

on: push

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - name: Rotate credentials
        uses: softprops/aws-credential-rotary@v1
        with:
            iam-user-name: 'name-of-iam-user-associated-with-credentials'
+           github-access-key-id-name: 'CUSTOM_ACCESS_KEY_ID_NAME'
+           github-secret-access-key-name: 'CUSTOM_SECRET_ACCESS_KEY_NAME'
        env:
          GITHUB_TOKEN: ${{ secrets.REPO_GITHUB_TOKEN }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      - name: Print Create Date
        run: aws iam list-access-keys --user name-of-iam-user-associated-with-credentials --query 'AccessKeyMetadata[0].CreateDate' --output text
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
```

### Rotating repository's environment secrets

If you utilise the repository [environment](https://docs.github.com/en/actions/reference/environments) protection rules, you can specify the `environment` input parameter. Only the secrets from the repository's environment will be updated.

```diff
name: Rotate environment secrets

on: push

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - name: Rotate credentials
        uses: softprops/aws-credential-rotary@v1
        with:
+           environment: 'sandbox'
        ...
```

### Rotating organization secrets

If you specify the `organization` input parameter, the secrets from this organization will be updated instead of the secrets of the current repository.

```diff
name: Rotate organization secrets

on: push

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - name: Rotate credentials
        uses: softprops/aws-credential-rotary@v1
        with:
+           organization: 'name-of-the-github-organization'
        ...
```

> :warning: Do **NOT** set both `organization` and `environment` parameters.  
If you do, the script will prioritise the `organization` parameter and ignore the `environment` parameter.

### Rotating multiple keys

Monorepos which deploy multiple aws services may use multiple sets of aws credentials to do so. You can simply add multiple aws credential rotary steps

```diff
name: Rotate Multiple AWS Credentials

on:
 schedule:
   # At 00:00 on Sunday.
   - cron:  '0 0 * * 0'


jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - name: Rotate service a credentials
        uses: softprops/aws-credential-rotary@v1
        with:
           github-access-key-id-name: 'SERVICE_A_AWS_ACCESS_KEY_ID'
           github-secret-access-key-name: 'SERVICE_A_AWS_SECRET_ACCESS_KEY'
        env:
          GITHUB_TOKEN: ${{ secrets.REPO_GITHUB_TOKEN }}
          AWS_ACCESS_KEY_ID: ${{ secrets.SERVICE_A_AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.SERVICE_A_AWS_SECRET_ACCESS_KEY }}
      - name: Rotate service b credentials
        uses: softprops/aws-credential-rotary@v1
        with:
           github-access-key-id-name: 'SERVICE_B_AWS_ACCESS_KEY_ID'
           github-secret-access-key-name: 'SERVICE_B_AWS_SECRET_ACCESS_KEY'
        env:
          GITHUB_TOKEN: ${{ secrets.REPO_GITHUB_TOKEN }}
          AWS_ACCESS_KEY_ID: ${{ secrets.SERVICE_B_AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.SERVICE_B_AWS_SECRET_ACCESS_KEY }}
```

### Special note

GitHub actions workflows can be triggered asynchonously. Without coordination you can run into a case where two workflows triggered independently try to create/delete credentials at the same time. When you trigger your rotation workflow on a schedule it's unlikely this will happen. If you trigger your workflow on a push or other means we recommend serializing your workflow runs with an action like [Turnstyle](https://github.com/softprops/turnstyle)

## inputs

| Name                            | Type   | Description                                                                                                       |
| ------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| `iam-user-name`                 | string | AWS IAM username associated with credentials to be rotated. Defaults to sts get-caller-identity infered user name |
| `github-access-key-id-name`     | string | GitHub secret name used to store AWS access key id. Defaults to AWS_ACCESS_KEY_ID                                 |
| `github-secret-access-key-name` | string | GitHub secret name used to store AWS access key secret. Defaults to AWS_SECRET_ACCESS_KEY                         |
| `organization`                  | string | If specified, the secret of this organization will be rotated instead of the one from the current repository      |

Doug Tangren (softprops) 2020.

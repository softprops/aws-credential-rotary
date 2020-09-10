# AWS Credential Rotary

> Rotate AWS credentials stored in GitHub secrets

## usage

This action depends on the ability to update repository secrets. As such it requires an GitHub api token with `repo` permissions. Create a personal access token with `repo` permissions,  store that in GitHub secrets, and provide that as `GITHUB_TOKEN` environment variable.

This action also depends on having the ability to list, create, and delete iam access keys.

You will need to provide at a minimum an `iam-user-name` to for the action to fetch the members access keys.

```diff
name: Main

on: push

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
+     - name: Rotate credentials
+       uses: softprops/aws-credential-rotary@master
+       with:
+           iam-user-name: 'name-of-iam-user-associated-with-credentials'
+       env:
+         GITHUB_TOKEN: ${{ secrets.REPO_GITHUB_TOKEN }}
+         AWS_ACCESS_TOKEN_ID: ${{ secrets.AWS_ACCESS_TOKEN_ID }}
+         AWS_SECRET_ACCESS_TOKEN: ${{ secrets.AWS_SECRET_ACCESS_TOKEN }}
      - name: Print Create Date
        run: aws iam list-access-keys --user name-of-iam-user-associated-with-credentials --query 'AccessKeyMetadata[0].CreateDate' --output text
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

### Custom secret names

By default this action will assume the credentials to be rotated exist as secrets named `AWS_ACCESS_TOKEN_ID` and `AWS_SECRET_ACCESS_TOKEN`. You can override these 


```diff
name: Main

on: push

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Rotate credentials
        uses: softprops/aws-credential-rotary@master
        with:
            iam-user-name: 'name-of-iam-user-associated-with-credentials'
+           github-access-key-id-name: 'CUSTOM_ACCESS_KEY_ID_NAME'
+           github-secret-access-key-name: 'CUSTOM_SECRET_ACCESS_KEY_NAME'
        env:
          GITHUB_TOKEN: ${{ secrets.REPO_GITHUB_TOKEN }}
          AWS_ACCESS_TOKEN_ID: ${{ secrets.AWS_ACCESS_TOKEN_ID }}
          AWS_SECRET_ACCESS_TOKEN: ${{ secrets.AWS_SECRET_ACCESS_TOKEN }}
      - name: Print Create Date
        run: aws iam list-access-keys --user name-of-iam-user-associated-with-credentials --query 'AccessKeyMetadata[0].CreateDate' --output text
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

#### inputs

| Name        | Type    | Description                                                     |
|-------------|---------|-----------------------------------------------------------------|
| `iam-user-name`   | string  | AWS IAM username associated with credentials to be rotated                         |
| `github-access-key-id-name`      | string  | GitHub secret name used to store AWS access key id. Defaults to AWS_ACCESS_KEY_ID                |
| `github-secret-access-key-name`      | string  | GitHub secret name used to store AWS access key secret. Defaults to AWS_SECRET_ACCESS_KEY                |



Doug Tangren (softprops) 2020.

# PostgresTools GitHub Action

This is a simple action that will install the [Postgres Language Server](https://github.com/supabase-community/postgres-language-server) on your runner. It will install the appropriate binary for your machine.

It has a single input: `version: latest | <semver>`.
Use `latest` if you want to use the latest available PostgresTools version in your runner.
Use a specific tag, such as `0.13.0`, if you want to use a specific version.

Whatever version is used will be output as `outputs.installed-version`.

## Example Usage

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase-community/postgrestools-cli-action@main
        with:
          version: 0.13.0
      - run: postgrestools check --skip-db test.sql
```

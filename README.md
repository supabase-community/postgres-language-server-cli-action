# PostgresTools GitHub Action

This is a simple action that will install [PostgresTools](https://github.com/supabase-community/postgres_lsp) on your runner. It will install the appropriate binary for your machine.

It has a single input: `version: latest | <semver>`.
Use `latest` if you want to use the latest available version in your runner.
Use a specific tag, such as `0.2.0`, if you want to use a specific version.

Whatever version is used will be output as `outputs.installed-version`.

## Example Usage

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase-community/pglt-cli-action@1
        with:
          version: 0.2.0
      - run: postgrestools check --skip-db test.sql
```

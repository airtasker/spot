# syntax=docker/dockerfile:1

# Packages the Spot CLI so consumers need Docker rather than a Node toolchain and a
# node_modules beside their contracts.
#
# Run it against a bind-mounted workspace:
#
#   docker run --rm --user "$(id -u):$(id -g)" \
#     --volume "$PWD:$PWD" --workdir "$PWD" \
#     ghcr.io/airtasker/spot:<version> \
#     generate -c api.ts -g openapi3 -l yaml -o doc/output
#
# Path arguments reach the filesystem unresolved, so they are interpreted relative to
# the working directory inside the container. Mounting the workspace at its real
# absolute path keeps every path argument resolving the same way inside and outside.
# `-o ~/x` is the exception that cannot: a tilde expands against the container's home.
#
# `--user` matters beyond file ownership: rails-monolith's RSpec boot caches on the
# mtime of Spot's output, and bff-client's Gradle codegen treats it as a task input.
# Root-owned output breaks both.
#
# No `.npmrc` is copied in: nothing in Spot's dependency tree is @airtasker-scoped, so
# the image builds with no registry credential at all.
#
# The `node` tag tracks the `nodejs` line in .tool-versions, and the corepack pin
# tracks `packageManager` in package.json. Keep all three in step.

FROM node:22.22.1-bookworm-slim AS base
WORKDIR /opt/spot
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
# docs/package.json is a workspace member, so --frozen-lockfile refuses to install
# without it. Its own dependencies are all devDependencies, so no webpack or redoc
# reaches the prod-deps stage below.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY docs/package.json ./docs/package.json

# Runtime dependencies only. Resolved in its own stage rather than by pruning the
# build stage, so the compiler and the test toolchain never reach the final image.
FROM base AS prod-deps
RUN pnpm install --frozen-lockfile --prod

FROM base AS builder
RUN pnpm install --frozen-lockfile
COPY tsconfig.json index.ts ./
COPY lib ./lib
COPY cli ./cli
# `tsc` directly rather than `pnpm build`, to stay off the `prepack` script: that one
# also builds the redoc documentation bundle through webpack, which needs
# --openssl-legacy-provider and ships nothing this image serves.
RUN pnpm exec tsc

FROM node:22.22.1-bookworm-slim AS runtime
WORKDIR /opt/spot
COPY --from=prod-deps /opt/spot/node_modules ./node_modules
COPY --from=builder /opt/spot/build ./build
COPY bin ./bin
# oclif discovers commands by scanning the `oclif.commands` directory relative to the
# nearest package.json, so package.json, bin/ and build/ have to keep these relative
# positions. No oclif.manifest.json is shipped — the scan costs a few milliseconds —
# which is what makes deleting a command file below actually remove the command.
COPY package.json ./

# mock, docs and init are npm-only: mock and docs serve long-running local dev servers,
# and init scaffolds a project on the host. Removing the compiled files removes the
# commands, because there is no manifest that could still advertise them.
RUN rm -f build/cli/src/commands/mock.* \
          build/cli/src/commands/docs.* \
          build/cli/src/commands/init.*

# Load-bearing, and not a convenience. Spot is meant to be run with
# `--user "$(id -u):$(id -g)"`, which names a uid with no /etc/passwd entry, so
# `os.homedir()` returns `/`. oclif writes an error log under the home directory
# before it exits, that mkdir fails with EACCES, and the throw inside the error
# handler pre-empts the exit code — so every failing command exits 0. `spot validate`
# would report an invalid contract and still pass its CI gate. /tmp because an
# arbitrary uid has to be able to write it.
ENV HOME=/tmp

# Overridden by `--workdir` in normal use; a sensible default for a bare `docker run`.
WORKDIR /workspace
ENTRYPOINT ["node", "/opt/spot/bin/run"]

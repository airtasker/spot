# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spot is a TypeScript-based API contract definition tool that generates OpenAPI, Swagger, and JSON Schema documentation from TypeScript decorator syntax. It allows developers to write API contracts using familiar TypeScript syntax instead of YAML/JSON.

## Commands

### Build and Development
- `yarn build` - Compile TypeScript to JavaScript output in `build/` directory
- `yarn build:watch` - Compile with watch mode for development

### Testing
- `yarn test` - Run all tests with Jest (uses 4 workers)
- `yarn ci:test` - Run tests in CI mode with coverage reporting
- Single test: `yarn test path/to/test.spec.ts` or `yarn test -- --testNamePattern="test name"`

### Code Quality
- `yarn lint:check` - Run both ESLint and Prettier checks
- `yarn lint:fix` - Auto-fix ESLint and Prettier issues
- `yarn eslint:check` / `yarn eslint:fix` - Run ESLint only
- `yarn prettier:check` / `yarn prettier:fix` - Run Prettier only

### CLI Usage (after build)
- `npx @airtasker/spot generate --contract api.ts --generator openapi3 --out output/` - Generate OpenAPI3 from contract
- `npx @airtasker/spot lint api.ts` - Lint a Spot contract
- `npx @airtasker/spot mock api.ts` - Run mock server from contract
- `npx @airtasker/spot validate api.ts` - Validate contract syntax

## Architecture

### Core Structure
- **`lib/src/`** - Main library code
  - `core.ts` - Main API exposing parsers and generators
  - `lib.ts` - Library entry point
  - `syntax/` - TypeScript decorator definitions for API contracts (@api, @endpoint, @request, @response, etc.)
  - `generators/` - Code generators for different output formats
  - `parser/` - TypeScript AST parsing logic
  - `linting/` - Contract validation and linting rules

### Generators
- **`generators/openapi2/`** - OpenAPI 2.0 (Swagger) generator
- **`generators/openapi3/`** - OpenAPI 3.x generator
- **`generators/json-schema/`** - JSON Schema generator

### CLI Commands
- **`cli/src/commands/`** - OCLIF-based CLI commands
  - Each command corresponds to a spot CLI function (generate, lint, mock, etc.)

### Key Concepts
- **Contracts** - TypeScript files with @api decorated classes defining API structure
- **Endpoints** - @endpoint decorated classes defining individual API endpoints
- **Decorators** - @request, @response, @body, @pathParams, @queryParams, @headers for API components
- **Generators** - Transform parsed contracts into target formats (OpenAPI, JSON Schema)
- **Linting Rules** - Validate contract structure and enforce best practices

### TypeScript Configuration
- Strict TypeScript settings enabled
- Experimental decorators enabled for syntax support
- Builds to CommonJS modules targeting ES2019
- Path mapping: `@airtasker/spot` → `./lib/src/lib`

### Testing
- Jest with ts-jest preset
- Tests located alongside source files with `.spec.ts` extension
- Spec examples in `__spec-examples__/` directories for testing generators
- Test coverage configured for CI

## Development Notes

- The project uses a monolithic structure with both library and CLI in the same repository
- TypeScript decorators are central to the API - any changes to syntax should consider backward compatibility
- Generator output is tested against snapshot files to catch breaking changes
- The linting system is extensible - new rules can be added in `lib/src/linting/rules/`
- OCLIF handles CLI structure - new commands should follow existing patterns in `cli/src/commands/`
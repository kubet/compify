# Compify CLI

A powerful CLI tool for managing and syncing components from your global registry.

## Features

- 🔐 **Secure Authentication**: Token-based authentication with secure credential storage
- 🔄 **Smart Component Management**: Add, remove, and update components with ease
- 📁 **Flexible Organization**: Choose between folder or flat file structures
- 🔍 **Intelligent Diffing**: Track and review component changes
- 🔄 **Safe Updates**: Automatic backups during migrations (stored in `.compify-backup` with timestamped versions)
- 🎯 **Project-Specific Config**: Maintains component metadata in `compify.json`

## Installation

```bash
npm install -g compify-cli
# or
yarn global add compify-cli
```

## Quick Start

1. **Login to your registry:**
```bash
compify login
```

2. **Add a component:**
```bash
compify add <component-id>
```

3. **Check for updates:**
```bash
compify diff
```

## Commands

### `login`

Authenticate with your Compify registry.

```bash
compify login
# or with token
compify login -t <your-token>
```

### `logout`

Log out from your Compify registry.

```bash
compify logout
```

### `list`

List all available components from the registry.

```bash
compify list
```

Options:
- `-s, --silent`: Mute output

### `add`

Add components to your project. Supports both folder and flat organization.

```bash
# Interactive mode
compify add <component-id>

# Non-interactive with flags
compify add <component-id> --yes --flat
```

Options:
- `-y, --yes`: Skip confirmation prompts
- `-o, --overwrite`: Overwrite existing files
- `-f, --flat`: Use flat file structure
- `-p, --path <path>`: Custom installation path
- `-s, --silent`: Mute output
- `--all`: Add all available components
- `--src-dir`: Use source directory structure

### `remove`

Remove components from your project.

```bash
# Interactive mode
compify remove

# Remove specific component
compify remove <component-id>

# Non-interactive
compify remove <component-id> --yes
```

Options:
- `-y, --yes`: Skip confirmation prompts
- `-s, --silent`: Mute output

### `diff`

Check for component updates against the registry.

```bash
# Check all components
compify diff

# Check specific component
compify diff <component-id>
```

Options:
- `-c, --cwd <path>`: Specify the working directory (defaults to current directory)

### `migrate`

Update components to their latest versions. Automatically creates backups of modified files in the `.compify-backup` directory.

```bash
# Update all components
compify migrate

# Update specific component
compify migrate <component-id>
```

Options:
- `-y, --yes`: Skip confirmation prompts
- `-b, --backup`: Create backups before migrating (default: true)
- `-s, --silent`: Mute output
- `-c, --cwd <path>`: Specify the working directory (defaults to current directory)

Note: When backups are enabled (default), each modified file is backed up with a timestamp (e.g. `filename.1234567890.bak`) in the `.compify-backup` directory.

### `info`

Display information about your project and installed components.

```bash
compify info
# or as JSON
compify info --json
```

Options:
- `--json`: Output information in JSON format
- `-c, --cwd <path>`: Specify the working directory (defaults to current directory)

## Configuration

Compify maintains a `compify.json` file in your project root:

```json
{
  "components": [
    {
      "id": "button-id",
      "name": "Button"
    }
  ],
  "version": "1.0.0",
  "componentPath": "src/components"
}
```

## Common Workflows

### Adding Multiple Components

```bash
compify add button-id card-id modal-id
```

### Updating with Backups

```bash
# Check for updates
compify diff

# Migrate with automatic backups
compify migrate
```

### Clean Removal

```bash
# Interactive component selection
compify remove

# Remove specific components
compify remove button-id card-id
```

## Error Handling

- Authentication errors will prompt you to login
- Network issues will be reported clearly
- Backup files are created before risky operations
- Interactive prompts help prevent accidental changes

## Best Practices

1. **Component Organization**:
   - Use folder structure for complex components
   - Use flat structure for simple, single-file components

2. **Updates**:
   - Run `diff` before `migrate` to review changes
   - Keep backups enabled for safe migrations

3. **Maintenance**:
   - Regularly check for updates
   - Clean up unused components with `remove`

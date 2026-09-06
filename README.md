# Godot Comment Align

A VS Code extension for GDScript that aligns comments in Go-style after formatting, keeping your code clean and readable.

## Features

- **One-click format & align** — Formats the document and aligns `#` comments to a consistent column position
- **Smart grouping** — Detects consecutive comment blocks and aligns them within the same group
- **Configurable indent** — Customize the spacing before `#` symbols via settings
- **Non-destructive** — Only modifies comment positioning, never touches your code logic

### Before

```gdscript
var speed = 10.0  # movement speed
var position = Vector2.ZERO # current position
var health = 100   # player health
var max_health = 100 # maximum health
```

### After

```gdscript
var speed = 10.0                # movement speed
var position = Vector2.ZERO     # current position
var health = 100                # player health
var max_health = 100            # maximum health
```

## Requirements

- VS Code 1.75.0 or higher
- GDScript language support (built-in with Godot extensions)

## Usage

1. Open any `.gd` file
2. Press `Shift+Alt+F` (or run command `Godot: Format Document with Comment Align` from Command Palette)
3. Comments will be automatically aligned after formatting

### How it works

1. **Format** — First runs the built-in GDScript formatter
2. **Align** — Then scans the document for comment blocks and aligns `#` symbols within each consecutive group

## Extension Settings

This extension contributes the following setting:

| Setting                               | Default | Description                                                     |
| ------------------------------------- | ------- | --------------------------------------------------------------- |
| `godotCommentAlign.commentIndentSize` | `4`     | Number of `tabs` before the `#` symbol in comments (range: 1-8) |

## Keybindings

| Key           | Context                                                   |
| ------------- | --------------------------------------------------------- |
| `Shift+Alt+F` | When editing a GDScript file (`editorLangId == gdscript`) |

## Known Issues

- Only works with `#` line comments
- Single-line code without comments is not affected

## Release Notes

### 0.0.1

Initial release:

- Basic comment alignment after formatting
- Configurable comment indent size
- Smart grouping of consecutive comment lines
- Output channel logging for debugging

---

## License

[MIT](LICENSE)

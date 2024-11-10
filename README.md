# Find Then Jump 2

> This extension is a fork of [find-then-jump](https://github.com/tranhl/find-then-jump).

## Getting Started

Available keyboard shortcuts in order to use the extension: 

- `findThenJump2.initiate`: Starts a jump-search without text selection.
- `findThenJump2.initiateWithSelection`: Starts a jump-search with text selection.

Example in `settings.json` using [vscode-vim](https://github.com/VSCodeVim/Vim/):
```json
"vim.normalModeKeyBindingsNonRecursive": [
   {
      "before": ["s"], 
      "commands": ["findThenJump2.initiate"]
   }
]

"vim.visualModeKeyBindings": [
   {
      "before": ["s"], "after": [""], 
      "commands": ["findThenJump2.initiateWithSelection"]
   }
]
```

## Theming

You can customize the match colors displayed by adding the following in `settings.json`:

- `findThenJump2.textDecorationForeground`: Controls text color of the text decoration.
- `findThenJump2.textDecorationBackground`: Controls the background color of the text decoration.

Example in `settings.json`:

```json
"workspace.colorCustomizations": {
   "findThenJump2.textDecorationForeground": "#e1dcd6",
   "findThenJump2.textDecorationBackground": "#4c4c4d"
}
```

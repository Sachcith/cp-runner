# CP Runner

A simple C++ Competitive Programming runner for VS Code.

## Features

* ⚡ Quick Run
* 🧪 Full Test
* 🔄 Reset code from template
* 🧹 Clear testcases
* ⏱️ Execution time
* ⏰ Configurable timeout
* ❌ Compilation, runtime and wrong-answer reporting
* ♻️ Undo support for Reset and Clear Testcases

## Requirements

* VS Code `1.132.0+`
* `g++`
* A dedicated CP workspace

## Workspace

```text
CPRunner/
├── main.cpp
├── template.cpp
├── input.txt
├── expected.txt
├── output.txt
└── config.json
```

### `template.cpp`

Use `$$` to mark where the cursor should be placed after Reset.

```cpp
int main() {
    $$
}
```

### `config.json`

```json
{
    "compiler": "C:\\path\\to\\g++.exe",
    "standard": "c++17",
    "optimization": "O2",
    "timeoutMs": 2000,
    "messageTimeoutMs": 800
}
```

## Shortcuts

| Shortcut                   | Action             |
| -------------------------- | ------------------ |
| `Ctrl + '`                 | ⚡ Quick Run        |
| `Ctrl + Enter`             | 🧪 Full Test       |
| `Ctrl + Shift + Backspace` | 🔄 Reset           |
| `Ctrl + Shift + Delete`    | 🧹 Clear Testcases |

## Quick Run

Runs `main.cpp` using `input.txt` and writes the program output to `output.txt`.

Compilation is skipped when the existing executable is up to date.

## Full Test

Runs the **entire `input.txt` once** and compares the output with `expected.txt`.

It does not split or interpret testcases. The input format is completely handled by the C++ program.

On success:

```text
✅ PASSED
⏱️ 12.43 ms
🕐 11:05:32 PM
```

On failure, `output.txt` shows the input, expected output and actual output.

## Reset

Copies `template.cpp` into `main.cpp`, removes `$$`, and places the cursor at the marker.

`Ctrl + Z` can undo the reset.

## Clear Testcases

Clears:

```text
input.txt
expected.txt
output.txt
```

`Ctrl + Z` can undo the operation.

## Development

```bash
npm install
npm run compile
```

Package the extension:

```bash
npm run package:vsix
```

CP Runner is intentionally small and focused on the local:

```text
Write → Run → Test → Fix
```

workflow.

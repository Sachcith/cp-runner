import * as vscode from 'vscode';

export function getCPRunnerRoot(): string | undefined {

    const workspaceFolder =
        vscode.workspace.workspaceFolders?.[0];

    if (!workspaceFolder) {

        vscode.window.showErrorMessage(
            'CP Runner: No workspace is open.'
        );

        return undefined;
    }

    return workspaceFolder.uri.fsPath;
}
import * as vscode from 'vscode';
import {
    getCPRunnerRoot
} from './config';

import {
    compile,
    runProgram,
    needsCompilation,
    loadConfig
} from './runner';

import {
    runFullTest
} from './judge';

import * as path from 'path';

async function saveCPFiles(
    root: string,
    includeExpected: boolean = false
): Promise<void> {

    const files = [
        'main.cpp',
        'input.txt'
    ];

    if (includeExpected) {
        files.push('expected.txt');
    }

    for (const file of files) {

        const filePath = vscode.Uri.file(
            path.join(root, file)
        );

        const document =
            await vscode.workspace.openTextDocument(
                filePath
            );

        if (document.isDirty) {
            await document.save();
        }
    }
}

const resetCommand =
    vscode.commands.registerCommand(
        'cp-runner.reset',
        async () => {

            const root = getCPRunnerRoot();

            if (!root) {
                return;
            }

            const mainPath =
                vscode.Uri.file(
                    path.join(root, 'main.cpp')
                );

            const templatePath =
                vscode.Uri.file(
                    path.join(root, 'template.cpp')
                );

            try {

                const template =
                    await vscode.workspace.fs.readFile(
                        templatePath
                    );

                let content =
                    Buffer.from(template).toString('utf8');

                const marker = '$$';
                const position =
                    content.indexOf(marker);

                if (position !== -1) {
                    content =
                        content.slice(0, position) +
                        content.slice(
                            position + marker.length
                        );
                }

                const document =
                    await vscode.workspace.openTextDocument(
                        mainPath
                    );

                const edit =
                    new vscode.WorkspaceEdit();

                const fullRange =
                    new vscode.Range(
                        document.positionAt(0),
                        document.positionAt(
                            document.getText().length
                        )
                    );

                edit.replace(
                    mainPath,
                    fullRange,
                    content
                );

                await vscode.workspace.applyEdit(
                    edit
                );

                const editor =
                    await vscode.window.showTextDocument(
                        document
                    );

                if (position !== -1) {

                    const cursor =
                        document.positionAt(position);

                    editor.selection =
                        new vscode.Selection(
                            cursor,
                            cursor
                        );

                    editor.revealRange(
                        new vscode.Range(
                            cursor,
                            cursor
                        )
                    );
                }

            } catch (error) {

                const message =
                    error instanceof Error
                        ? error.message
                        : String(error);

                vscode.window.showErrorMessage(
                    `❌ CP Runner: ${message}`
                );
            }
        }
    );

const clearTestcasesCommand =
    vscode.commands.registerCommand(
        'cp-runner.clearTestcases',
        async () => {

            const root = getCPRunnerRoot();

            if (!root) {
                return;
            }

            const files = [
                'input.txt',
                'expected.txt',
                'output.txt'
            ];

            try {

                const edit =
                    new vscode.WorkspaceEdit();

                for (const file of files) {

                    const filePath =
                        vscode.Uri.file(
                            path.join(root, file)
                        );

                    const document =
                        await vscode.workspace.openTextDocument(
                            filePath
                        );

                    const fullRange =
                        new vscode.Range(
                            document.positionAt(0),
                            document.positionAt(
                                document.getText().length
                            )
                        );

                    edit.replace(
                        filePath,
                        fullRange,
                        ''
                    );
                }

                await vscode.workspace.applyEdit(edit);

            } catch (error) {

                const message =
                    error instanceof Error
                        ? error.message
                        : String(error);

                vscode.window.showErrorMessage(
                    `❌ CP Runner: ${message}`
                );
            }
        }
    );

export function activate(
    context: vscode.ExtensionContext
) {

    /*
     * QUICK RUN
     */

    const quickRunCommand =
        vscode.commands.registerCommand(
            'cp-runner.quickRun',
            async () => {

                const root =
                    getCPRunnerRoot();

                if (!root) {
                    return;
                }

                const config =
                    loadConfig(root);

                try {

                    await vscode.window.withProgress(
                        {
                            location:
                                vscode.ProgressLocation.Notification,

                            title:
                                'CP Runner',

                            cancellable:
                                false
                        },

                        async (progress) => {

                            progress.report({
                                message:
                                    'Running...'
                            });

                            await saveCPFiles(root);

                            if (needsCompilation(root)) {
                                await compile(root);
                            }

                            const time =
                                await runProgram(root);

                            progress.report({
                                message:
                                    `✓ Completed in ${time.toFixed(2)} ms`
                            });

                            await new Promise(
                                resolve =>
                                    setTimeout(
                                        resolve,
                                        config.messageTimeoutMs
                                    )
                            );
                        }
                    );

                } catch (error) {

                    const message =
                        error instanceof Error
                            ? error.message
                            : String(error);

                    vscode.window.showErrorMessage(
                        `✗ CP Runner: ${message}`
                    );
                }
            }
        );


    /*
     * FULL TEST
     */

    const fullTestCommand =
        vscode.commands.registerCommand(
            'cp-runner.fullTest',
            async () => {

                const root =
                    getCPRunnerRoot();

                if (!root) {
                    return;
                }

                const config =
                    loadConfig(root);

                try {

                    await vscode.window.withProgress(
                        {
                            location:
                                vscode.ProgressLocation.Notification,

                            title:
                                'CP Runner',

                            cancellable:
                                false
                        },

                        async (progress) => {

                            progress.report({
                                message:
                                    'Testing...'
                            });

                            /*
                             * Save main.cpp,
                             * input.txt and expected.txt
                             */
                            await saveCPFiles(
                                root,
                                true
                            );

                            /*
                             * Compile only when required.
                             */
                            if (needsCompilation(root)) {

                                progress.report({
                                    message:
                                        'Compiling...'
                                });

                                await compile(root);
                            }

                            progress.report({
                                message:
                                    'Running tests...'
                            });

                            /*
                             * Entire input.txt is passed
                             * to the program ONCE.
                             */
                            const result =
                                await runFullTest(root);

                            if (result.passed) {

                                progress.report({
                                    message:
                                        `✅ All tests passed — ${result.executionTimeMs.toFixed(2)} ms`
                                });

                            } else {

                                progress.report({
                                    message:
                                        `❌ Wrong Answer — ${result.executionTimeMs.toFixed(2)} ms`
                                });
                            }

                            await new Promise(
                                resolve =>
                                    setTimeout(
                                        resolve,
                                        config.messageTimeoutMs
                                    )
                            );
                        }
                    );

                } catch (error) {

                    const message =
                        error instanceof Error
                            ? error.message
                            : String(error);

                    /*
                     * Compilation errors come here,
                     * as well as runtime/timeout errors.
                     */
                    vscode.window.showErrorMessage(
                        `❌ CP Runner: ${message}`
                    );
                }
            }
        );


    context.subscriptions.push(
        quickRunCommand,
        fullTestCommand,
		resetCommand
    );
}

export function deactivate() {}
import * as fs from 'fs';
import * as path from 'path';
import { runProgramForTest } from './runner';

export interface FullTestResult {
    passed: boolean;
    executionTimeMs: number;
}

const clean = (s: string) =>
    s.replace(/\r\n/g, '\n').trim();

export async function runFullTest(
    root: string
): Promise<FullTestResult> {

    const input =
        fs.readFileSync(
            path.join(root, 'input.txt'),
            'utf8'
        );

    const expected =
        fs.readFileSync(
            path.join(root, 'expected.txt'),
            'utf8'
        );

    const time =
        new Date().toLocaleTimeString();

    try {

        const result =
            await runProgramForTest(root);

        const passed =
            clean(expected) === clean(result.output);

        const report = passed
            ? `✅ PASSED
⏱️ ${result.executionTimeMs.toFixed(2)} ms
🕐 ${time}`
            : `❌ WRONG ANSWER
⏱️ ${result.executionTimeMs.toFixed(2)} ms
🕐 ${time}

──────────────
📥 INPUT
──────────────
${input}

──────────────
🎯 EXPECTED
──────────────
${expected}

──────────────
📤 ACTUAL
──────────────
${result.output}`;

        fs.writeFileSync(
            path.join(root, 'output.txt'),
            report
        );

        return {
            passed,
            executionTimeMs:
                result.executionTimeMs
        };

    } catch (error) {

        const message =
            error instanceof Error
                ? error.message
                : String(error);

        const timeout =
            message.startsWith('TIMEOUT:');

        const report =
`${timeout
    ? '⏰ TIME LIMIT EXCEEDED'
    : '❌ RUNTIME ERROR'}
🕐 ${time}

──────────────
📥 INPUT
──────────────
${input}

──────────────
⚠️ ERROR
──────────────
${timeout
    ? `Limit: ${message.split(':')[1]} ms`
    : message}`;

        fs.writeFileSync(
            path.join(root, 'output.txt'),
            report
        );

        throw error;
    }
}
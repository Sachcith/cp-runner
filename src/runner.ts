import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { performance } from 'perf_hooks';

interface CPRunnerConfig {
    compiler: string;
    standard: string;
    optimization: string;
    timeoutMs: number;
    messageTimeoutMs: number;
}

export function loadConfig(root: string): CPRunnerConfig {
    const configPath = path.join(root, 'config.json');

    const data = fs.readFileSync(configPath, 'utf8');

    return JSON.parse(data);
}

export function needsCompilation(root: string): boolean {
    const source = path.join(root, 'main.cpp');
    const executable = path.join(root, 'cp_temp');

    if (!fs.existsSync(executable)) {
        return true;
    }

    const sourceStats = fs.statSync(source);
    const executableStats = fs.statSync(executable);

    return sourceStats.mtimeMs > executableStats.mtimeMs;
}

export function compile(root: string): Promise<void> {
    return new Promise((resolve, reject) => {

        const config = loadConfig(root);

        const source = path.join(root, 'main.cpp');
        const executable = path.join(root, 'cp_temp');

        const args = [
            source,
            `-std=${config.standard}`,
            `-${config.optimization}`,
            '-o',
            executable
        ];

        const compiler = spawn(config.compiler, args);

        let stderr = '';

        compiler.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        compiler.on('error', (error) => {
            reject(error);
        });

        compiler.on('close', (code) => {

            if (code !== 0) {

                reject(
                    new Error(
                        `Compilation failed:\n\n${stderr}`
                    )
                );

                return;
            }

            resolve();
        });
    });
}

export function runProgram(root: string): Promise<number> {
    return new Promise((resolve, reject) => {

        const config = loadConfig(root);

        const executable = path.join(root, 'cp_temp');
        const inputPath = path.join(root, 'input.txt');
        const outputPath = path.join(root, 'output.txt');

        const input = fs.createReadStream(inputPath);
        const output = fs.createWriteStream(outputPath);

        const startTime = performance.now();

        const program = spawn(executable, [], {
            cwd: root
        });

        let stderr = '';

        program.stdout.pipe(output);

        program.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        const timeout = setTimeout(() => {

            program.kill();

            reject(
                new Error(
                    `Program timed out after ${config.timeoutMs} ms.`
                )
            );

        }, config.timeoutMs);

        input.pipe(program.stdin);

        program.on('error', (error) => {

            clearTimeout(timeout);
            output.close();

            reject(error);
        });

        program.on('close', (code) => {

            clearTimeout(timeout);

            const endTime = performance.now();
            const executionTime = endTime - startTime;

            output.close();

            if (code !== 0) {

                reject(
                    new Error(
                        `Program exited with code ${code}.\n\n${stderr}`
                    )
                );

                return;
            }

            resolve(executionTime);
        });
    });
}


/*
 * Full Test runner.
 *
 * Runs the complete input.txt exactly once
 * and returns the complete stdout instead of
 * writing it directly to output.txt.
 */
export function runProgramForTest(
    root: string
): Promise<{
    output: string;
    executionTimeMs: number;
}> {

    return new Promise((resolve, reject) => {

        const config = loadConfig(root);

        const executable = path.join(root, 'cp_temp');
        const inputPath = path.join(root, 'input.txt');

        const input = fs.createReadStream(inputPath);

        const startTime = performance.now();

        const program = spawn(executable, [], {
            cwd: root
        });

        let stdout = '';
        let stderr = '';

        program.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        program.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        let timedOut = false;

        const timeout = setTimeout(() => {

            timedOut = true;

            program.kill();

        }, config.timeoutMs);

        input.pipe(program.stdin);

        program.on('error', (error) => {

            clearTimeout(timeout);

            reject(error);
        });

        program.on('close', (code) => {

            clearTimeout(timeout);

            const endTime = performance.now();

            const executionTimeMs =
                endTime - startTime;

            if (timedOut) {

                reject(
                    new Error(
                        `TIMEOUT:${executionTimeMs}`
                    )
                );

                return;
            }

            if (code !== 0) {

                reject(
                    new Error(
                        `RUNTIME:${code}:${stderr}`
                    )
                );

                return;
            }

            resolve({
                output: stdout,
                executionTimeMs
            });
        });
    });
}
import chalk from 'chalk';
import logSymbols from 'log-symbols';
import figures from 'figures';
import elegantSpinner from 'elegant-spinner';
import TaskTree from './tasktree';

const spinner = elegantSpinner();

export enum Status {
    Pending,
    Completed,
    Failed,
    Skipped
}

export default class Task {
    private text: string;
    private status: Status;
    private subtasks: Task[] = [];
    private logs: Set<string> = new Set();
    private warnings: Set<string> = new Set();

    public constructor(text: string, status: Status = Status.Pending) {
        this.text = text;
        this.status = status;
    }

    public add(text: string, status: Status = Status.Pending): Task {
        const task = new Task(text, status);

        this.subtasks.push(task);

        return task;
    }

    public complete(text?: string): void {
        if (!this.subtasks.filter((task): boolean => task.isPending()).length) {
            this.update(Status.Completed, text);
        } else {
            this.fail('Subtasks is not complete.');
        }
    }

    public skip(text?: string): Task {
        this.update(Status.Skipped, text);

        return this;
    }

    public fail(text?: string): Task {
        this.update(Status.Failed, this.error(text));

        TaskTree.tree().stop(false);

        return this;
    }

    public log(text: string): Task {
        if (this.isPending()) this.logs.add(text);

        return this;
    }

    public warn(text: string): Task {
        if (this.isPending()) this.warnings.add(text);

        return this;
    }

    public isPending(): boolean {
        return this.status === Status.Pending;
    }

    public getActive(): Task {
        const { subtasks } = this;
        const subtask = subtasks[subtasks.length - 1];
        let task: Task = this;

        if (subtask && subtask.isPending()) task = subtask.getActive();

        return task;
    }

    public render(level: number = 0): string {
        const skipped = this.status === Status.Skipped ? ` ${chalk.dim('[skip]')}` : '';
        const prefix = level ? `${chalk.dim(figures.arrowRight)} ` : '';
        const indent = (str: string, count: number): string => `${'  '.padStart(2 * count)}${str}`;
        const text = [
            indent(`${prefix}${this.getSymbol()} ${this.text}${skipped}`, level),
            ...[...this.warnings].map((value): string => indent(`${logSymbols.warning} ${value}`, level + 1)),
            ...[...this.logs].map((value): string => indent(`${logSymbols.info} ${value}`, level + 1)),
            ...this.subtasks.map((task: Task): string => task.render(level + 1))
        ].join('\n');

        return level ? chalk.dim(text) : text;
    }

    private getSymbol(): string {
        let symbol: string;

        switch (this.status) {
            case Status.Skipped:
                symbol = chalk.yellow(figures.arrowDown);
                break;
            case Status.Completed:
                symbol = logSymbols.success;
                break;
            case Status.Failed:
                symbol = logSymbols.error;
                break;
            default:
                symbol = this.subtasks.length ? chalk.yellow(figures.pointer) : chalk.yellow(spinner());
                break;
        }

        return symbol;
    }

    private error(text?: string): string {
        return text ? `${this.text}: ${chalk.redBright(text)}` : this.text;
    }

    private update(status: Status, text?: string): void {
        if (this.isPending()) {
            if (text) this.text = text;

            this.status = status;
        } else {
            this.text = this.error(`Task is already complete (${chalk.bold(this.status.toString())})`);
            this.status = Status.Failed;
        }
    }
}
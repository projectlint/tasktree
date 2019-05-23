import logUpdate from 'log-update';
import { Task } from './task';
import * as Types from './types';
import { Theme } from './theme';

export class TaskTree {
    public static TIMEOUT = 100;
    private static instance: TaskTree;

    private handle: NodeJS.Timeout | undefined;
    private tasks: Task[];
    private theme: Theme;
    private silence: boolean = false;

    private constructor(theme?: Types.Theme) {
        this.tasks = [];
        this.theme = new Theme(theme);
    }

    public static tree(theme?: Types.Theme): TaskTree {
        if (!TaskTree.instance) {
            TaskTree.instance = new TaskTree(theme);
        }

        return TaskTree.instance;
    }

    public start(silence?: boolean): void {
        this.silence = !!silence;
        this.tasks = [];

        if (!this.handle && !this.silence) {
            this.handle = setInterval((): void => {
                this.log();
            }, TaskTree.TIMEOUT);
        }
    }

    public stop(success: boolean): void {
        if (this.handle) {
            clearInterval(this.handle);

            this.log();
            logUpdate.done();
            this.handle = undefined;
        }

        if (!this.silence) process.exit(Number(success));
    }

    public add(text: string): Task {
        const { tasks } = this;
        let task = tasks[tasks.length - 1];

        if (task && task.isPending()) {
            task = task.getActive();
            task = task.add(text);
        } else {
            tasks.push((task = new Task(text)));
        }

        return task;
    }

    public render(): string {
        return this.tasks.map((task): string => task.render(this.theme)).join('\n');
    }

    private log(): void {
        logUpdate(this.render());
    }
}

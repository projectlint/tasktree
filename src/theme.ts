import chalk from 'chalk';
import convert from 'color-convert';
import elegantSpinner from 'elegant-spinner';
import * as Figures from 'figures';
import * as Types from './types';
import * as Enums from './enums';
import { Task } from './task';
import { Progress } from './progress';

const frame = elegantSpinner();

export class Theme {
    public static SEPARATOR = '\n';
    public static EMPTY = '';
    public static SPACE = ' ';
    public static INDENT = '  ';

    private colors: Map<Enums.Type, string> = new Map();
    private symbols: Map<Enums.Type, string> = new Map();
    private badges: Map<Enums.Type, string> = new Map();

    public constructor(options?: Types.Theme) {
        if (options) {
            const { colors, symbols, badges } = this;
            const list = new Map(Object.entries(options));
            const set = (key: Enums.Type, color?: string, symbol?: string, badge?: string): void => {
                if (color) colors.set(key, color);
                if (symbol) symbols.set(key, symbol);
                if (badge) badges.set(key, badge);
            };

            Object.values(Enums.Type).forEach(
                (key: Enums.Type): void => {
                    const option = list.get(key);

                    if (Array.isArray(option)) {
                        set(key, ...option);
                    } else if (typeof option === 'string') {
                        colors.set(key, option);
                    } else if (typeof option === 'object') {
                        const { color, symbol, badge } = option;

                        set(key, color, symbol, badge);
                    }
                }
            );
        }
    }

    public static type(status: Enums.Status, isList: boolean = false): Enums.Type {
        let type: Enums.Type;

        switch (status) {
            case Enums.Status.Completed:
                type = Enums.Type.Success;
                break;
            case Enums.Status.Skipped:
                type = Enums.Type.Skip;
                break;
            case Enums.Status.Failed:
                type = Enums.Type.Error;
                break;
            case Enums.Status.Pending:
            default:
                type = isList ? Enums.Type.List : Enums.Type.Active;
                break;
        }

        return type;
    }

    public static join(separator: string, ...text: string[]): string {
        return text.filter((value): boolean => !!value.length).join(separator);
    }

    public static dye(str: string, color: string): string {
        return color ? chalk.hex(color)(str) : str;
    }

    public static indent(count: number, ...text: string[]): string {
        return `${Theme.INDENT.padStart(count * Enums.Indent.Default)}${Theme.join(Theme.SPACE, ...text)}`;
    }

    private static getValueBy<T>(map: Map<Enums.Type, T>, type: Enums.Type, getDefault: () => T): T {
        let result = map.get(type);

        if (!result) result = getDefault();

        return result;
    }

    public getColor(type: Enums.Type): string {
        const { colors } = this;

        return Theme.getValueBy(
            this.colors,
            type,
            (): string => {
                if (type === Enums.Type.Active) return Enums.Color.Active;
                if (type === Enums.Type.Success) return Enums.Color.Success;
                if (type === Enums.Type.Skip) return Enums.Color.Skip;
                if (type === Enums.Type.Error) return Enums.Color.Error;
                if (type === Enums.Type.Message) return Enums.Color.Message;
                if (type === Enums.Type.Info) return Enums.Color.Info;
                if (type === Enums.Type.Warning) return Enums.Color.Warning;
                if (type === Enums.Type.Subtask) return Enums.Color.Subtask;
                if (type === Enums.Type.List) return Enums.Color.List;
                if (type === Enums.Type.Dim) return Enums.Color.Dim;

                return colors.get(Enums.Type.Default) || Enums.Color.Default;
            }
        );
    }

    public paint(str: string, type: Enums.Type): string {
        return Theme.dye(str, this.getColor(type));
    }

    public gradient(str: string, gradient: Types.Gradient): string {
        const begin = convert.hex.rgb(this.getColor(gradient.begin));
        const end = convert.hex.rgb(this.getColor(gradient.end));
        const w = gradient.position * 2 - 1;
        const w1 = (w + 1) / 2.0;
        const w2 = 1 - w1;

        return Theme.dye(
            str,
            convert.rgb.hex([
                Math.round(end[0] * w1 + begin[0] * w2),
                Math.round(end[1] * w1 + begin[1] * w2),
                Math.round(end[2] * w1 + begin[2] * w2),
            ])
        );
    }

    public symbol(type: Enums.Type): string {
        const { symbols } = this;
        const symbol = Theme.getValueBy(
            symbols,
            type,
            (): string => {
                if (type === Enums.Type.Active) return frame();
                if (type === Enums.Type.Success) return Figures.tick;
                if (type === Enums.Type.Skip) return Figures.arrowDown;
                if (type === Enums.Type.Error) return Figures.cross;
                if (type === Enums.Type.Message) return Figures.line;
                if (type === Enums.Type.Info) return Figures.info;
                if (type === Enums.Type.Warning) return Figures.warning;
                if (type === Enums.Type.Subtask) return Figures.pointerSmall;
                if (type === Enums.Type.List) return Figures.pointer;

                return symbols.get(Enums.Type.Default) || this.symbol(Enums.Type.Subtask);
            }
        );

        return symbol ? this.paint(symbol, type) : symbol;
    }

    public badge(type: Enums.Type): string {
        const { badges } = this;
        const badge = Theme.getValueBy(
            badges,
            type,
            (): string => {
                if (type === Enums.Type.Error) return Enums.Badge.Error;
                if (type === Enums.Type.Skip) return Enums.Badge.Skip;

                return badges.get(Enums.Type.Default) || Enums.Badge.Default;
            }
        );

        return badge ? this.paint(badge, Enums.Type.Dim) : badge;
    }

    public title(task: Task, level: number): string {
        const type = Theme.type(task.getStatus(), task.isList());
        const badge = this.badge(type);
        const symbol = this.symbol(type);
        let prefix = Theme.EMPTY;

        if (level) prefix = task.isList() ? this.symbol(Enums.Type.Subtask) : this.symbol(Enums.Type.Default);

        return Theme.indent(level, prefix, symbol, task.getText(), badge);
    }

    public errors(errors: string[], level: number): string[] {
        const type = Enums.Type.Error;
        const sublevel = level + Enums.Level.Stride;

        return errors.map(
            (text): string => {
                const [error, ...lines] = text.split(Theme.SEPARATOR);
                const title = Theme.join(Theme.SPACE, this.symbol(Enums.Type.Message), this.symbol(type), error.trim());

                return Theme.join(
                    Theme.SEPARATOR,
                    Theme.indent(level + Enums.Level.Step, this.paint(title, type)),
                    ...lines.map((line): string => Theme.indent(sublevel, this.paint(line.trim(), Enums.Type.Dim)))
                );
            }
        );
    }

    public messages(list: string[], type: Enums.Type, level: number): string[] {
        const symbol = this.symbol(type);
        const sign = this.symbol(Enums.Type.Message);
        const indent = level + Enums.Level.Step;

        return list.map((text): string => Theme.indent(indent, sign, symbol, text));
    }

    public bars(list: Progress[], level: number): string[] {
        const symbol = this.symbol(Enums.Type.Subtask);

        return list
            .filter((bar): boolean => !bar.isCompleted() || !bar.clear)
            .map((bar): string => Theme.indent(level, symbol, bar.render(this)));
    }
}

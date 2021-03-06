import stripAnsi from 'strip-ansi';
import { ProgressBar, IProgressBarOptions } from '../ProgressBar';
import { Theme } from '../Theme';

const template = ':bar :percent :etas :custom';
const theme = new Theme();
const options: IProgressBarOptions = { complete: '*', incomplete: '_' };
const step = 1;
let bar: ProgressBar;
let before: number;

describe('ProgressBar', (): void => {
    it('Default', (): void => {
        bar = new ProgressBar(template, { total: step * 2, ...options });

        expect(bar.getPercent()).toBe(ProgressBar.MIN_PERCENT);
        expect(bar.getRatio()).toBe(ProgressBar.MIN_RATIO);
        expect(bar.getStart()).toBeTruthy();
        expect(bar.getEnd()).toBeFalsy();
        expect(bar.getRate()).toBeFalsy();
        expect(bar.getETA()).toBe(Infinity);
        expect(bar.isCompleted()).toBeFalsy();

        bar.tick();

        expect(bar.getPercent()).toBe(ProgressBar.MAX_PERCENT / 2);
        expect(bar.getRatio()).toBe(ProgressBar.MAX_RATIO / 2);
        expect(bar.getStart()).toBeTruthy();
        expect(bar.getEnd()).toBeFalsy();
        expect(bar.getElapsed()).toBeTruthy();
        expect(bar.getRate()).toBeTruthy();
        expect(bar.getETA()).toBeTruthy();
        expect(bar.isCompleted()).toBeFalsy();

        bar.tick(step, {
            custom: 'test',
        });

        expect(bar.getPercent()).toBe(ProgressBar.MAX_PERCENT);
        expect(bar.getRatio()).toBe(ProgressBar.MAX_RATIO);
        expect(bar.getStart()).toBeTruthy();
        expect(bar.getEnd()).toBeTruthy();
        expect(bar.getElapsed()).toBeTruthy();
        expect(bar.getRate()).toBeTruthy();
        expect(bar.getETA()).toBeFalsy();
        expect(bar.isCompleted()).toBeTruthy();
        expect(stripAnsi(bar.render(theme))).toMatchSnapshot();
    });

    describe('Statuses', (): void => {
        beforeEach((): void => {
            bar = new ProgressBar(template, options);
            before = new Date().getTime();
            bar.tick(bar.total / 2);
        });

        it('Complete', (): void => {
            bar.complete();

            expect(bar.getPercent()).toBe(ProgressBar.MAX_PERCENT);
            expect(stripAnsi(bar.render(theme))).toMatchSnapshot();
            expect(bar.isCompleted()).toBeTruthy();
            expect(bar.getEnd()).toBeGreaterThanOrEqual(before);
            expect(bar.getEnd()).toBeLessThanOrEqual(new Date().getTime());
        });

        it('Skip', (): void => {
            bar.skip();

            expect(bar.getPercent()).toBe(ProgressBar.MAX_PERCENT / 2);
            expect(stripAnsi(bar.render(theme))).toMatchSnapshot();
        });

        it('Fail', (): void => {
            bar.fail();

            expect(bar.getPercent()).toBe(ProgressBar.MAX_PERCENT / 2);
            expect(stripAnsi(bar.render(theme))).toMatchSnapshot();
        });
    });
});

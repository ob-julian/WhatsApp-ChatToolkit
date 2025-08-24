const { describe, test, expect } = require('@jest/globals');

const regex = /^!schedule\s+"(?<message>(?:[^"\\]|\\.)+)"\s+to\s+"(?<target>(?:[^"\\]|\\.)+)"\s+(?:(?:at\s+(?<hhmm>(?:[01]?\d|2[0-3]):[0-5]\d))|(?:in\s+(?<amount>\d+)\s*(?<unit>minutes?|hours?|days?)))\s*$/i;

describe('schedule command regex', () => {
    test('matches message with at HH:MM', () => {
        const input = '!schedule "Es is 14:05" to "Lara Katharina Ursula Köller" at 14:05';
        const match = input.match(regex);
        expect(match).not.toBeNull();
        expect(match.groups.message).toBe('Es is 14:05');
        expect(match.groups.target).toBe('Lara Katharina Ursula Köller');
        expect(match.groups.hhmm).toBe('14:05');
        expect(match.groups.amount).toBeUndefined();
        expect(match.groups.unit).toBeUndefined();
    });

    test('matches message with in x minutes', () => {
        const input = '!schedule "Test message" to "Group Chat" in 15 minutes';
        const match = input.match(regex);
        expect(match).not.toBeNull();
        expect(match.groups.message).toBe('Test message');
        expect(match.groups.target).toBe('Group Chat');
        expect(match.groups.amount).toBe('15');
        expect(match.groups.unit).toBe('minutes');
        expect(match.groups.hhmm).toBeUndefined();
    });

    test('matches message with in x hours', () => {
        const input = '!schedule "Another test" to "Jane" in 2 hours';
        const match = input.match(regex);
        expect(match).not.toBeNull();
        expect(match.groups.message).toBe('Another test');
        expect(match.groups.target).toBe('Jane');
        expect(match.groups.amount).toBe('2');
        expect(match.groups.unit).toBe('hours');
        expect(match.groups.hhmm).toBeUndefined();
    });

    test('matches message with in x days', () => {
        const input = '!schedule "Day test" to "Team" in 3 days';
        const match = input.match(regex);
        expect(match).not.toBeNull();
        expect(match.groups.message).toBe('Day test');
        expect(match.groups.target).toBe('Team');
        expect(match.groups.amount).toBe('3');
        expect(match.groups.unit).toBe('days');
        expect(match.groups.hhmm).toBeUndefined();
    });

    test('does not match invalid format', () => {
        const input = '!schedule Hello to John at 13:45';
        const match = input.match(regex);
        expect(match).toBeNull();
    });

    test('matches message with escaped quotes', () => {
        const input = '!schedule "Say \\"hi\\"" to "Alice" at 09:00';
        const match = input.match(regex);
        expect(match).not.toBeNull();
        expect(match.groups.message).toBe('Say \\"hi\\"');
        expect(match.groups.target).toBe('Alice');
        expect(match.groups.hhmm).toBe('09:00');
    });
});
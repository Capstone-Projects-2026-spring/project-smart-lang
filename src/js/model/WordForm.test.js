jest.mock('../externals/objectmodel', () => {
    class MockModel {
        static definition = {};

        static defaults(defaults) {
            this._defaults = defaults;
        }

        constructor(properties = {}) {
            Object.assign(this, this.constructor._defaults || {}, properties);
        }
    }
    
    const ModelFactory = (definition) => {
        return class extends MockModel {
            static definition = definition;
        };
    };
    
    ModelFactory.Array = (itemType) => Array;
    
    return { Model: ModelFactory };
});

import { WordForm } from './WordForm';

describe('WordForm', () => {
    test('constructor applies defaults', () => {
        const form = new WordForm();
        expect(form.tags).toEqual([]);
        expect(form.value).toBe('');
    });

    test('constructor accepts lang property', () => {
        const form = new WordForm({ lang: 'en' });
        expect(form.lang).toBe('en');
    });

    test('constructor accepts tags property', () => {
        const tags = ['noun', 'plural'];
        const form = new WordForm({ tags });
        expect(form.tags).toEqual(tags);
    });

    test('constructor accepts value property', () => {
        const form = new WordForm({ value: 'running' });
        expect(form.value).toBe('running');
    });

    test('constructor accepts pronunciation property', () => {
        const form = new WordForm({ pronunciation: 'ˈrʌnɪŋ' });
        expect(form.pronunciation).toBe('ˈrʌnɪŋ');
    });

    test('constructor accepts all properties', () => {
        const form = new WordForm({
            lang: 'de',
            tags: ['verb', 'past'],
            value: 'lief',
            pronunciation: 'liːf'
        });
        expect(form.lang).toBe('de');
        expect(form.tags).toEqual(['verb', 'past']);
        expect(form.value).toBe('lief');
        expect(form.pronunciation).toBe('liːf');
    });

    test('constructor handles empty object', () => {
        const form = new WordForm({});
        expect(form.tags).toEqual([]);
        expect(form.value).toBe('');
    });
});

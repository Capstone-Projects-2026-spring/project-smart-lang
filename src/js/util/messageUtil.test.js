jest.mock('../vue/mainVue', () => ({
    MainVue: {
        showProgressBar: jest.fn(),
        showMessageBox: jest.fn()
    }
}));

import { messageUtil } from './messageUtil';
import { MainVue } from '../vue/mainVue';
import { constants } from './constants';

describe('messageUtil.showImportSuccess', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        MainVue.showProgressBar.mockResolvedValue(undefined);
        MainVue.showMessageBox.mockResolvedValue('closed');
    });

    test('shows progress and success modal with both counters', async () => {
        const result = await messageUtil.showImportSuccess({
            grids: [{}, {}],
            dictionaries: [{}]
        });

        expect(MainVue.showProgressBar).toHaveBeenCalledWith(100);
        expect(MainVue.showMessageBox).toHaveBeenCalledWith({
            type: constants.MODAL_TYPE_SUCCESS,
            header: 'importSuccessful',
            items: ['2 grid(s) imported', '1 dictionaries imported'],
            buttonPreset: constants.BUTTONS_OK,
            onClose: undefined
        });
        expect(result).toBe('closed');
    });

    test('builds empty items for empty or missing data', async () => {
        await messageUtil.showImportSuccess({ grids: [], dictionaries: [] });
        expect(MainVue.showMessageBox.mock.calls[0][0].items).toEqual([]);

        await messageUtil.showImportSuccess();
        expect(MainVue.showMessageBox.mock.calls[1][0].items).toEqual([]);
    });

    test('passes onClose callback through', async () => {
        const onClose = jest.fn();
        await messageUtil.showImportSuccess({ grids: [{}] }, onClose);
        expect(MainVue.showMessageBox.mock.calls[0][0].onClose).toBe(onClose);
    });
});

import {ActiveObserversManager} from "../src/active-observers-manager";
import {OneshotObserver} from "../src/data/oneshot-observer";
import createSpy = jasmine.createSpy;
import createSpyObj = jasmine.createSpyObj;

describe('ActiveObserversManager', () => {

    function mockObserver(): MutationObserver {
        return createSpyObj('MutationObserver', {
            disconnect: createSpy('disconnect'),
            observe: createSpy('observe')
        }) as MutationObserver;
    }

    it('should disconnect previous oneshot observer for same id', () => {
        const doc = document.createElement('div');
        const manager = new ActiveObserversManager();
        const mockObserver1 = mockObserver();
        const mockObserver2 = mockObserver();

        manager.upsertOneshotObserver(new OneshotObserver('test', mockObserver1))
            .observe(doc, {attributes: true});

        manager.upsertOneshotObserver(new OneshotObserver('test', mockObserver2))
            .observe(doc, {attributes: true});

        expect(mockObserver1.disconnect).toHaveBeenCalled();
        expect(mockObserver2.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect all observers', () => {
        const manager = new ActiveObserversManager();
        const mockObserver1 = mockObserver();
        const mockObserver2 = mockObserver();
        const mockObserver3 = mockObserver();
        const mockObserver4 = mockObserver();

        manager.upsertOneshotObserver(new OneshotObserver('test', mockObserver1));
        manager.upsertOneshotObserver(new OneshotObserver('test2', mockObserver2));
        manager.addBackgroundObserver(mockObserver3);
        manager.addBackgroundObserver(mockObserver4);

        manager.disconnectAll();

        expect(mockObserver1.disconnect).toHaveBeenCalled();
        expect(mockObserver2.disconnect).toHaveBeenCalled();
        expect(mockObserver3.disconnect).toHaveBeenCalled();
        expect(mockObserver4.disconnect).toHaveBeenCalled();
    });
});
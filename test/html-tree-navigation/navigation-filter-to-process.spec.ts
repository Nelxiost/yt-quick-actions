import {NavigationFilterToProcess} from "../../src/html-navigation/navigation-filter-to-process";
import {TagNavigationFilter} from "../../src/html-navigation/navigation-filter";
import {Tags} from "../../src/html-navigation/element-data";

describe('NavigationFilterToProcess', () => {
    it('should mark filter as processed', () => {
        const filterToProcess = new NavigationFilterToProcess(new TagNavigationFilter(Tags.DIV));
        filterToProcess.markProcessed();

        expect(filterToProcess.isProcessed()).toBeTrue();
    });

    describe('isProcessed', () => {
        it('should return true when filter is processed', () => {
            const filterToProcess = new NavigationFilterToProcess(new TagNavigationFilter(Tags.DIV));
            filterToProcess.markProcessed();
            expect(filterToProcess.isProcessed()).toBeTrue();
        })

        it('should return false when filter is not processed', () => {
            const filterToProcess = new NavigationFilterToProcess(new TagNavigationFilter(Tags.DIV));
            expect(filterToProcess.isProcessed()).toBeFalse();
        })
    })
});
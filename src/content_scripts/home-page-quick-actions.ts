import * as Browser from "webextension-polyfill";
import {RuntimeMessages} from "../runtime-messages";
import {IntervalRunner} from "../interval-runner";
import {HtmlParentNavigator} from "../html-navigation/html-parent-navigator";
import {
    IdNavigationFilter,
    TagNavigationFilter,
    TextContentNavigationFilter
} from "../html-navigation/navigation-filter";
import {Ids, Tags, TextContent} from "../html-navigation/element-data";
import {YtQuickActionsElements} from "../yt-quick-action-elements";
import {activePageObserverManager} from "../active-page-observer-manager";
import {HtmlTreeNavigator} from "../html-navigation/html-tree-navigator";

const globalPageReadyInterval = new IntervalRunner(5);
globalPageReadyInterval.registerIterationLimitReachedCallback(() => {
    console.error('Could not determine if page is ready for operation. Please enable debug mode and check' +
        ' the logs.')
});

function setupWatchLaterButton(videoMenuButton: HTMLElement): HTMLButtonElement {
    const watchLaterButton = YtQuickActionsElements.watchLaterHomeVideoButton();
    watchLaterButton.onclick = () => {
        videoMenuButton.click();

        const popupReadyObserver = new MutationObserver((mutations, observer) => {
            for (const mutation of mutations) {
                const target = mutation.target;
                if (target.nodeName.toLowerCase() === Tags.YTD_MENU_SERVICE_ITEM_RENDERER
                    && mutation.oldValue === '') {
                    const watchLaterButton = HtmlTreeNavigator.startFrom(document.body)
                        .filter(new IdNavigationFilter(Tags.TP_YT_PAPER_LISTBOX, Ids.ITEMS))
                        .findFirst(new TextContentNavigationFilter(Tags.YT_FORMATTED_STRING, TextContent.SAVE_TO_WATCH_LATER));
                    watchLaterButton.click();
                    observer.disconnect();
                }
            }
        });

        const popupContainer = HtmlTreeNavigator.startFrom(document.body)
            .findFirst(new TagNavigationFilter(Tags.YTD_POPUP_CONTAINER));
        popupReadyObserver.observe(popupContainer, {
            subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['hidden']
        })
    };

    return watchLaterButton;
}

function main(homePageVideos: HTMLElement[]): void {
    // Home page videos are lazily loaded on scrolling, therefore, we need to observe them.
    const homePageVideoElementsObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            const target = mutation.target as HTMLElement;
            const ytdRichGridRow = HtmlParentNavigator.startFrom(target)
                .find(new TagNavigationFilter(Tags.YTD_RICH_GRID_ROW));

            if (target.nodeName.toLowerCase() === Tags.BUTTON && !!ytdRichGridRow) {
                const menuButton = target as HTMLButtonElement;
                const divMenu = HtmlParentNavigator.startFrom(menuButton)
                    .find(new IdNavigationFilter(Tags.DIV, Ids.MENU));

                const existingWatchLaterButton = HtmlTreeNavigator.startFrom(divMenu.parentElement)
                    .findFirst(new IdNavigationFilter(Tags.BUTTON, Ids.YT_QUICK_ACTIONS_HOME_WATCH_LATER));
                if (!existingWatchLaterButton) {
                    divMenu.parentElement.insertBefore(setupWatchLaterButton(menuButton), divMenu);
                }
            }
        }
    });

    const firstHomePageVideo = homePageVideos[0];
    activePageObserverManager.switchObserver(homePageVideoElementsObserver);
    homePageVideoElementsObserver.observe(firstHomePageVideo.parentElement, {
        subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['aria-label']
    })
}

Browser.runtime.onMessage.addListener(message => {
    if (message === RuntimeMessages.NAVIGATED_TO_HOME_PAGE) {
        globalPageReadyInterval.start(1000, runningInterval => {
            const homePageVideos = HtmlTreeNavigator.startFrom(document.body)
                .filter(new TagNavigationFilter(Tags.YTD_APP))
                .filter(new IdNavigationFilter(Tags.DIV, Ids.CONTENT))
                .filter(new TagNavigationFilter(Tags.YTD_TWO_COLUMN_BROWSE_RESULTS_RENDERER))
                .find(new TagNavigationFilter(Tags.YTD_RICH_GRID_ROW));
            if (homePageVideos.length > 0) {
                runningInterval.stop();
                main(homePageVideos);
            }
        });
    }
});
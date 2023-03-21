import type * as api from "../typings/api";

const BASE_FUNCTION_PATH = ".netlify/functions/latest";
const BACKGROUND_REFRESH_TIMEOUT_SECONDS = 120;

function cloneIntoWithPartsFromName<T>(templateName: string, target: Element): T {
    const template = document.querySelector<HTMLTemplateElement>(`[data-template='${templateName}']`)!;

    return cloneIntoWithParts(template, target);
}

function cloneIntoWithParts<T>(template: HTMLTemplateElement, target: Element): T {
    const content = document.importNode(template.content, true);

    const parts = Array.from(content.querySelectorAll("[data-part]")).reduce<any>(
        (localParts: any, el: Element) => {
            const partName = el.getAttribute("data-part")!;
            el.removeAttribute("data-part");
            localParts[partName] = el;
            return localParts;
        },
        {});

    target.appendChild(content);

    return parts;
}

//#region Borrowed from: https://blog.webdevsimplified.com/2020-07/relative-time-format/
const formatter = new Intl.RelativeTimeFormat(undefined, {
    numeric: 'auto'
})

const DIVISIONS: { amount: number;  name: Intl.RelativeTimeFormatUnit}[] = [
    { amount: 60, name: 'seconds' },
    { amount: 60, name: 'minutes' },
    { amount: 24, name: 'hours' },
    { amount: 7, name: 'days' },
    { amount: 4.34524, name: 'weeks' },
    { amount: 12, name: 'months' },
    { amount: Number.POSITIVE_INFINITY, name: 'years' }
]

function formatTimeAgo(date: Date): string {
    let duration = (date.getTime() - Date.now()) / 1000;

    for (let i = 0; i <= DIVISIONS.length; i++) {
        const division = DIVISIONS[i];
        if (Math.abs(duration) < division.amount) {
            return formatter.format(Math.round(duration), division.name);
        }
        duration /= division.amount;
    }

    return "unknown";
}

//#endregion

function getTweetTypeSymbol(tweet: api.TweetResponse): string {
    if (tweet.retweet_author) {
        return "repeat";
    }

    if (tweet.quotedTweet) {
        return "format_quote"
    }

    if (tweet.replyingToId) {
        return "reply";
    }

    return "mail";
}

function generateImages(imageUrls: string[], container: HTMLElement): void {
    const template = document.querySelector<HTMLTemplateElement>("[data-template='image']")!;

    for (const image of imageUrls) {
        const parts: {
            link: HTMLAnchorElement,
            image: HTMLImageElement
        } = cloneIntoWithParts(template, container);

        parts.link.href = image;
        parts.image.src = image;
    }
}

function getVideo(videoInfo: api.VideoInfo): HTMLVideoElement {
    const template = document.querySelector<HTMLTemplateElement>("[data-template='video']")!;
    const fragment = document.importNode(template.content, true);
    const videoElement = <HTMLVideoElement>fragment.firstElementChild!
    videoElement.src = videoInfo.url;
    videoElement.poster = videoInfo.poster;

    return videoElement;
}

function generateTweet(tweet: api.TweetResponse, container: Element): void {
    const parts: {
        author: HTMLAnchorElement
        content: HTMLElement
        media: HTMLElement
        type: HTMLElement
        postedAt: HTMLAnchorElement
        quoteContainer: HTMLElement,
        repliesContainer: HTMLElement,
        reply: HTMLAnchorElement
    } = cloneIntoWithPartsFromName("tweet", container);

    parts.author.textContent = tweet.author;
    parts.author.href = tweet.author_url;
    parts.content.innerHTML = tweet.content;

    if (tweet.video) {
        const videoElement = getVideo(tweet.video);
        parts.media.replaceWith(videoElement);
    } else if (tweet.images?.length) {
        generateImages(tweet.images, parts.media);
    } else {
        parts.media.parentElement?.removeChild(parts.media);
    }

    if (tweet.quotedTweet) {
        generateTweet(tweet.quotedTweet, parts.quoteContainer);
    } else {
        parts.quoteContainer.parentElement?.removeChild(parts.quoteContainer);
    }

    if (tweet.replies?.length) {
        tweet.replies.forEach((tweet) => {
            const replyContainer = document.createElement("div");
            replyContainer.classList.add("tweet-container");
            generateTweet(tweet, replyContainer);
            parts.repliesContainer.appendChild(replyContainer);
        });
    } else {
        parts.repliesContainer.parentElement?.removeChild(parts.repliesContainer);
    }

    parts.type.textContent = getTweetTypeSymbol(tweet);
    parts.postedAt.textContent = formatTimeAgo(new Date(tweet.posted));
    parts.postedAt.href = tweet.url;

    if (tweet.replyingToUrl) {
        parts.reply.href = tweet.replyingToUrl;
    } else {
        parts.reply.parentElement?.removeChild(parts.reply);
    }
}

async function loadTopTweets(max_id?: string) {
    const timeline = document.querySelector("[data-id='timeline']")!;
    if (!max_id) {
        // If there wasn't a max_id supplied, that impiles it's a load of the
        // top of the list or a refresh, so ensure we clear any existing content
        timeline.innerHTML = "";
    }

    const params = new URLSearchParams(window.location.search);
    const service_params = [];
    if (params.get("canned") === "true") {
        service_params.push("canned=true")
    }

    if (max_id) {
        service_params.push(`max_id=${max_id}`);
    }

    const function_query = `${BASE_FUNCTION_PATH}${(service_params.length ? "?" : "")}${service_params.join("&")}`;
    const result: api.LatestResponse = await (await fetch(function_query)).json();
    document.body.classList.toggle("archived-data", result.isArchivedData);
    for (let m of result.tweets) {
        let container: HTMLElement = document.createElement("div");
        container.classList.add("tweet-container");
        
        // Set the tweet id so we can leverage for paging in the tweets later
        container.setAttribute("tweet-id", m.id);

        generateTweet(m, container);

        timeline.appendChild(container);
    }
}

let pendingLoad = false;

document.addEventListener("DOMContentLoaded", function () {
    const timeline = document.querySelector("[data-id='timeline']")!;
    const doit = document.querySelector("[data-id='doit']")!;

    doit.addEventListener("click", () => loadTopTweets());

    // When scrolling, we're going to load a new set of tweets if we aren't
    // already loading some new tweets. Not perfect 'cause maybe we'll get stuck
    // at the bottom, but this is a low-grade side for just us.
    document.addEventListener("scroll", async () => {
        if (pendingLoad) {
            return;
        }

        const lastElement = timeline.lastElementChild as HTMLElement;
        if (!lastElement) {
            return;
        }

        const position = lastElement.getBoundingClientRect();
        if (position.bottom <= document.body.clientHeight) {
            var tweet_id = lastElement.getAttribute("tweet-id");
            if (!tweet_id) {
                return;
            }

            pendingLoad = true;
            await loadTopTweets(tweet_id);
            pendingLoad = false;
        }
    });
    loadTopTweets();
});

let backgroundedTimeMs = -1;
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        backgroundedTimeMs = Date.now();
        return;
    }

    if (backgroundedTimeMs === -1) {
        return;
    }

    const backgroundedDurationSeconds = (Date.now() - backgroundedTimeMs) / 1000;
    backgroundedTimeMs = -1;

    if (backgroundedDurationSeconds < BACKGROUND_REFRESH_TIMEOUT_SECONDS) {
        return;
    }

    loadTopTweets();
});
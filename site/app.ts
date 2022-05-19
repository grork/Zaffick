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

function getTweetTraits(tweet: api.TweetResponse): string {
    let tweetTypes: string[] = [];

    if (tweet.retweet_author) {
        tweetTypes.push("retweet");
    }

    if (tweet.quotedTweet) {
        tweetTypes.push("quote");
    }

    if (tweet.replyingTo) {
        tweetTypes.push("reply");
    }

    if (!tweetTypes.length) {
        // Must just be a tweet
        tweetTypes.push("tweet");
    }

    if (tweet.images?.length) {
        tweetTypes.push("images");
    }

    if (tweet.video) {
        tweetTypes.push("video");
    }

    return tweetTypes.join(" + ");;
}

function getTweetTypeSymbol(tweet: api.TweetResponse): string {
    if (tweet.retweet_author) {
        return "repeat";
    }

    if (tweet.quotedTweet) {
        return "format_quote"
    }

    if (tweet.replyingTo) {
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

    parts.type.textContent = getTweetTypeSymbol(tweet);
    parts.postedAt.textContent = formatTimeAgo(new Date(tweet.posted));
    parts.postedAt.href = tweet.url;

    if (tweet.replyingTo) {
        parts.reply.href = tweet.replyingTo;
    } else {
        parts.reply.parentElement?.removeChild(parts.reply);
    }
}

async function loadTopTweets() {
    const timeline = document.querySelector("[data-id='timeline']")!;
    timeline.innerHTML = "";

    const params = new URLSearchParams(window.location.search);
    let function_query = BASE_FUNCTION_PATH;
    if (params.get("canned") === "true") {
        function_query += "?canned=true";
    }

    const result: api.LatestResponse = await (await fetch(function_query)).json();
    for (let m of result.tweets) {
        let container: HTMLElement = document.createElement("div");
        container.classList.add("tweet-container");

        generateTweet(m, container);

        timeline.appendChild(container);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const doit = document.querySelector("[data-id='doit']")!;

    doit.addEventListener("click", loadTopTweets);
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
import type * as api from "../typings/api";

const BASE_FUNCTION_PATH = ".netlify/functions/latest";

function cloneIntoWithParts<T>(templateName: string, target: Element): T {
    const template = document.querySelector<HTMLTemplateElement>(`[data-template='${templateName}']`)!;
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

function getPostedTimeAsString(time: Date): string {
    const formatter = new Intl.DateTimeFormat([], {
        dateStyle: "medium",
        timeStyle: "short"
    });

    return formatter.format(time);
}

function generateImages(imageUrls: string[]): HTMLElement {
    const container = document.createElement("div");
    container.classList.add("tweet-images");

    for (const image of imageUrls) {
        const link = document.createElement("a");
        link.href = image;
        link.target = "_blank";

        const imageElement = document.createElement("img");
        imageElement.src = image;
        link.appendChild(imageElement)

        container.appendChild(link);
    }

    return container;
}

function getVideo(videoInfo: api.VideoInfo): HTMLVideoElement {
    const videoElement = document.createElement("video");
    videoElement.preload = "auto";
    videoElement.src = videoInfo.url;
    videoElement.controls = true;
    videoElement.loop = true;
    videoElement.poster = videoInfo.poster;

    return videoElement;
}

function generateTweet(tweet: api.TweetResponse, container: Element): void {
    const parts: {
        author: HTMLElement
        content: HTMLElement
        media: HTMLElement
        type: HTMLElement
        postedAt: HTMLElement
        quoteContainer: HTMLElement
    } = cloneIntoWithParts("tweet", container);

    parts.author.textContent = tweet.author;
    parts.content.innerHTML = tweet.content;
    
    let contentType = (tweet.retweet_author ? " + retweet" : "");
    if (tweet.video) {
        const videoElement = getVideo(tweet.video);
        parts.media.replaceWith(videoElement);
        contentType += " + video";
    } else if (tweet.images?.length) {
        const imageContainer = generateImages(tweet.images);
        parts.media.replaceWith(imageContainer);
        contentType += " + images";
    } else {
        parts.media.parentElement?.removeChild(parts.media);
    }

    if (tweet.type === "quote") {
        generateTweet(tweet.quotedTweet, parts.quoteContainer);
    } else {
        parts.quoteContainer.parentElement?.removeChild(parts.quoteContainer);   
    }

    parts.type.textContent = `${tweet.type}${contentType}`;
    parts.postedAt.textContent = getPostedTimeAsString(new Date(tweet.posted));
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
    
        switch (m.type) {
            case "quote":          
            case "tweet":
            case "reply":
                generateTweet(m, container);
        }
        
        timeline.appendChild(container);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const doit = document.querySelector("[data-id='doit']")!;

    doit.addEventListener("click", loadTopTweets);
    loadTopTweets();
});
import type * as api from "../typings/api";

const BASE_FUNCTION_PATH = ".netlify/functions/latest";

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

function getPostedTimeAsString(time: Date): string {
    const formatter = new Intl.DateTimeFormat([], {
        dateStyle: "medium",
        timeStyle: "short"
    });

    return formatter.format(time);
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
        author: HTMLElement
        content: HTMLElement
        media: HTMLElement
        type: HTMLElement
        postedAt: HTMLElement
        quoteContainer: HTMLElement
    } = cloneIntoWithPartsFromName("tweet", container);

    parts.author.textContent = tweet.author;
    parts.content.innerHTML = tweet.content;
    
    let contentType = (tweet.retweet_author ? " + retweet" : "");
    if (tweet.video) {
        const videoElement = getVideo(tweet.video);
        parts.media.replaceWith(videoElement);
        contentType += " + video";
    } else if (tweet.images?.length) {
        generateImages(tweet.images, parts.media);
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
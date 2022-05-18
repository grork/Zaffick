import * as api from "../typings/api";

const BASE_FUNCTION_PATH = ".netlify/functions/latest";

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

function generateTweet(tweet: api.NonQuoteTweetResponse, container: HTMLElement): void {
    const authorElement = document.createElement("div");
    authorElement.innerText = tweet.author;
    container.appendChild(authorElement);

    const tweetContent = document.createElement("div");
    tweetContent.classList.add("tweet-content");
    tweetContent.innerHTML = tweet.content;
    container.appendChild(tweetContent);

    let contentType = (tweet.retweet_author ? " + retweet" : "");
    if (tweet.video) {
        const videoElement = getVideo(tweet.video);
        container.appendChild(videoElement);
        contentType += " + video";
    } else if (tweet.images?.length) {
        const imageContainer = generateImages(tweet.images);
        container.appendChild(imageContainer);
        contentType += " + images";
    }

    const tweetType = document.createElement("div");
    tweetType.classList.add("tweet-type");
    tweetType.innerText = `${tweet.type}${contentType}`;
    container.appendChild(tweetType);

    const postedAt = document.createElement("div");
    postedAt.innerText = getPostedTimeAsString(new Date(tweet.posted));
    container.appendChild(postedAt);
}

function generateQuoteTweet(tweet: api.QuoteTweetResponse, container: HTMLElement): void {
    const authorElement = document.createElement("div");
    authorElement.innerText = tweet.author;
    container.appendChild(authorElement);

    const tweetContent = document.createElement("div");
    tweetContent.classList.add("tweet-content");
    tweetContent.innerHTML = tweet.content;
    container.appendChild(tweetContent);

    const quotedTweet = document.createElement("div");
    quotedTweet.classList.add("tweet-container");
    generateTweet(tweet.quotedTweet, quotedTweet);
    container.appendChild(quotedTweet);

    const tweetType = document.createElement("div");
    tweetType.classList.add("tweet-type");
    tweetType.innerText = `${tweet.type}${(tweet.retweet_author ? " + retweet" : "")}`;
    container.appendChild(tweetType);

    const postedAt = document.createElement("div");
    postedAt.innerText = getPostedTimeAsString(new Date(tweet.posted));
    container.appendChild(postedAt);
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
                generateQuoteTweet(m, container);
                break;
            
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
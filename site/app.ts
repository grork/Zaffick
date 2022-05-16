import type * as api from "../typings/api";

const BASE_FUNCTION_PATH = ".netlify/functions/latest";

function generateTweet(tweet: api.TweetResponse): HTMLElement {
    const container = document.createElement("div");
    container.classList.add("tweet-container");

    const tweetContent = document.createElement("div");
    tweetContent.classList.add("tweet-content");
    tweetContent.innerHTML = tweet.content;
    container.appendChild(tweetContent);

    if (tweet.type === "quote") {
        const childTweet = generateTweet(tweet.quotedTweet);
        container.appendChild(childTweet);
    }

    const tweetType = document.createElement("div");
    tweetType.classList.add("tweet-type");
    tweetType.innerText = tweet.type;

    container.appendChild(tweetType);

    return container;
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
        const tweet = generateTweet(m);

        timeline.appendChild(tweet);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const doit = document.querySelector("[data-id='doit']")!;

    doit.addEventListener("click", loadTopTweets);
    loadTopTweets();
});
import * as api from "../typings/api";

const BASE_FUNCTION_PATH = ".netlify/functions/latest";

function generateTweet(tweet: api.TweetResponse, container: HTMLElement): void {
    const tweetContent = document.createElement("div");
    tweetContent.classList.add("tweet-content");
    tweetContent.innerHTML = tweet.content;
    container.appendChild(tweetContent);

    const tweetType = document.createElement("div");
    tweetType.classList.add("tweet-type");
    tweetType.innerText = tweet.type;

    container.appendChild(tweetType);
}

function generateQuoteTweet(tweet: api.QuoteTweetResponse, container: HTMLElement): void {
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
    tweetType.innerText = tweet.type;

    container.appendChild(tweetType);
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
            case "retweet":
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
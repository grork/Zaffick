import type { LatestResponse } from "../typings/api";

const BASE_FUNCTION_PATH = ".netlify/functions/latest";

async function loadTopTweets() {
    const timeline = document.querySelector("[data-id='timeline']")!;
    timeline.innerHTML = "";

    const params = new URLSearchParams(window.location.search);
    let function_query = BASE_FUNCTION_PATH;
    if (params.get("canned") === "true") {
        function_query += "?canned=true";
    }

    const result: LatestResponse = await (await fetch(function_query)).json();
    for (let m of result.tweets) {
        const logLine = document.createElement("div");
        logLine.classList.add("tweet-container");
        logLine.innerHTML = m.content;

        timeline.appendChild(logLine);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const doit = document.querySelector("[data-id='doit']")!;

    doit.addEventListener("click", loadTopTweets);
    loadTopTweets();
});
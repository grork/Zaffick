type LatestTweets = string[];

async function loadTopTweets() {
    const timeline = document.querySelector("[data-id='timeline']")!;
    timeline.innerHTML = "";
    const result: LatestTweets = await (await fetch(".netlify/functions/latest")).json();

    for (let m of result) {
        const logLine = document.createElement("div");
        logLine.classList.add("tweet-container");
        logLine.innerHTML = m;

        timeline.appendChild(logLine);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const doit = document.querySelector("[data-id='doit']")!;

    doit.addEventListener("click", loadTopTweets);
    loadTopTweets();
});
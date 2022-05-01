document.addEventListener("DOMContentLoaded", function () {
    const doit = document.querySelector("[data-id='doit']")!;
    const log = document.querySelector("[data-id='log']")!;

    doit.addEventListener("click", async function () {
        const result = await (await fetch(".netlify/functions/latest")).json();

        const logLine = document.createElement("div");
        logLine.innerText = result.message;

        log.appendChild(logLine);
    });
});
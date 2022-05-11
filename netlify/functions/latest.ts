import * as nfunc from "@netlify/functions";
import { v1 } from "../../tweets/timeline";
import type * as twypes from "../../tweets/twypes-v1";
import stitched from "../../sample_data/stitched";

async function handler(event: nfunc.HandlerEvent): Promise<nfunc.HandlerResponse> {
    const cannedResponseRequested = (event.queryStringParameters["canned"] == "true");

    let result: twypes.Tweet[] = [];

    if (!cannedResponseRequested) {
        result = await v1.getTimeLineForUserByHandle("wsdot_traffic");
    } else {
        result = stitched();
    }

    const body = result.map((t) => t.full_text);

    return {
        statusCode: 200,
        body: JSON.stringify(body)
    };
}

export { handler };
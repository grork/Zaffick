import * as nfunc from "@netlify/functions";
import { getTimelineForUser } from "../../tweets/timeline";

async function handler(): Promise<nfunc.HandlerResponse> {
    const result = await getTimelineForUser("17900666");
    const body = result.data.map((t) => t.text);

    return {
        statusCode: 200,
        body: JSON.stringify(body)
    };
}

export { handler };
import * as nfunc from "@netlify/functions";
import { getTimelineForUser } from "../../tweets/timeline";

async function handler(): Promise<nfunc.HandlerResponse> {
    const result = await getTimelineForUser("17900666");
    const body = {
        message: result.data[0].text
    };

    return {
        statusCode: 200,
        body: JSON.stringify(body)
    };
}

export { handler };
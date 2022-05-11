import * as nfunc from "@netlify/functions";
import { v1 } from "../../tweets/timeline";

async function handler(): Promise<nfunc.HandlerResponse> {
    const result = await v1.getTimeLineForUserByHandle("wsdot_traffic");
    const body = result.map((t) => t.full_text);

    return {
        statusCode: 200,
        body: JSON.stringify(body)
    };
}

export { handler };
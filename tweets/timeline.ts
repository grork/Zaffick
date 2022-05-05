import fetch from "node-fetch";
import * as twypes from "./twypes";

const fetchOptions = {
    headers: {
        "Authorization": `Bearer ${process.env.CV_MAGIC_VALUE}`
    }
};

async function getFromTwitterWithType<T>(url): Promise<T> {
    const result = <T>(await (await fetch(url, fetchOptions)).json());
    return result;
}

async function getUserDetails(): Promise<twypes.SingleUserLookup> {
    return getFromTwitterWithType<twypes.SingleUserLookup>("https://api.twitter.com/2/users/by/username/wsdot_traffic");
}

async function getTimelineForUser(user_id: string): Promise<twypes.UserTimeline> {
    return getFromTwitterWithType<twypes.UserTimeline>(`https://api.twitter.com/2/users/${user_id}/tweets`);
}

export { getTimelineForUser }
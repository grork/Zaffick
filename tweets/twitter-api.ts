import fetch from "node-fetch";
import type * as twypesv1 from "./twypes-v1";
import type * as twypesv2 from "./twypes-v2";

const fetchOptions = {
    headers: {
        "Authorization": `Bearer ${process.env.CV_MAGIC_VALUE}`
    }
};

async function getFromTwitterWithType<T>(url): Promise<T> {
    const result = <T>(await (await fetch(url, fetchOptions)).json());
    return result;
}

const v2 = {
    async getUserDetails(): Promise<twypesv2.SingleUserLookup > {
        return getFromTwitterWithType("https://api.twitter.com/2/users/by/username/wsdot_traffic");
    },

    async getTimelineForUserById(user_id: string): Promise<twypesv2.UserTimeline > {
        return getFromTwitterWithType(`https://api.twitter.com/2/users/${user_id}/tweets`);
    }
}

const v1 = {
    async getTimeLineForUserByHandle(screen_name: string, max_id?: string): Promise<twypesv1.Tweet[]> {
        let url = `https://api.twitter.com/1.1/statuses/user_timeline.json?tweet_mode=extended&screen_name=${screen_name}`
        if (max_id) {
            url = `${url}&max_id=${max_id}`
        }
        return getFromTwitterWithType(url);
    },
    async lookupTweets(ids: string[]): Promise<twypesv1.Tweet[]> {
        const idsCombined = ids.join(",");
        return getFromTwitterWithType(`https://api.twitter.com/1.1/statuses/lookup.json?id=${idsCombined}&tweet_mode=extended`);
    }
};

export { v2, v1 }
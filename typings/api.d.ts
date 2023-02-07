export declare interface VideoInfo {
    url: string;
    poster: string;
}

declare interface TweetResponse {
    url: string;
    content: string;
    images?: string[];
    video?: VideoInfo;
    posted: string;
    author: string;
    author_url: string;
    retweet_author?: string;
    quotedTweet?: TweetResponse;
    replyingToUrl?: string;
    replyingToId?: string;
    replies?: TweetResponse[];
}

export declare interface LatestResponse {
    tweets: TweetResponse[];
    isArchivedData: boolean;
}
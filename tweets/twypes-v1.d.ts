declare interface VideoInfo {
    variants: {
        content_type: "application/x-mpegURL" | "video/mp4";
        url: string;
        bitrate: number;
     }[];
}

declare interface UserInfo {
    screen_name: string;
}

export declare interface UrlEntity {
    url: string;
    expanded_url: string,
    display_url: string,
    indices: [number, number];
}

export declare interface PhotoEntity {
    type: "photo";
    media_url_https: string;
}

export declare interface VideoEntity {
    type: "video";
    media_url_https: string;
    video_info: VideoInfo;
}

type MediaEntity = PhotoEntity | VideoEntity;

export declare interface Tweet {
    created_at: string;
    id_str: string;
    full_text: string;
    truncated: boolean;
    display_text_range: [number, number];
    entities: { urls: UrlEntity[] };
    in_reply_to_status_id_str?: string;
    in_reply_to_screen_name?: string;
    is_quote_status?: boolean;
    retweeted_status?: Tweet;
    quoted_status?: Tweet;
    extended_entities?: { media?: MediaEntity[] };
    user: UserInfo;
}
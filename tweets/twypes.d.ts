export declare interface UserDetail {
    id: string;
    name: string;
    username: string;
}

export declare interface SingleUserLookup {
    data: UserDetail;
}

export declare interface Tweet {
    id: string;
    text: string;
}

export declare interface UserTimeline {
    data: Tweet[];
}
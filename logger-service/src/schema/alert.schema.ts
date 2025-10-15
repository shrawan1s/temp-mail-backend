export interface AlertTemplateProps {
    service: string;
    level: string;
    occurrences: number;
    lastMessage?: string;
}

export interface AlertProps extends AlertTemplateProps {
    // extend in future (e.g., requestId, environment, links)
    env?: string;
    timestamp?: string;
}

import { Resend } from 'resend';
import { appConfig } from '../config/app.config';
import { generateAlertHTML } from '../templates/alert.template';
import { logger } from '../logger/logger.util';

export interface AlertProps {
    service: string;
    level: string;
    occurrences: number;
    lastMessage: string;
}

export class ResendAdapter {
    private client: any;
    private cooldownMap = new Map<string, number>();
    private COOLDOWN_MS = 5 * 60 * 1000;

    constructor() {
        this.client = new Resend(appConfig.resendApiKey);
    }

    private isOnCooldown(key: string) {
        const last = this.cooldownMap.get(key) || 0;
        return Date.now() - last < this.COOLDOWN_MS;
    }

    async sendAlert(subject: string, props: AlertProps, key: string) {
        if (!appConfig.alertToEmail || appConfig.alertToEmail.length === 0) {
            logger.warn('No alert recipients configured; skipping alert', { key });
            return;
        }

        if (this.isOnCooldown(key)) {
            logger.info('ResendAdapter: cooldown active, skipping alert', { key });
            return;
        }

        const html = generateAlertHTML(props);
        try {
            await this.client.emails.send({
                from: appConfig.alertFromEmail,
                to: appConfig.alertToEmail,
                subject,
                html,
            });
            this.cooldownMap.set(key, Date.now());
            logger.info('ResendAdapter: alert sent', { key });
        } catch (err: any) {
            logger.error('ResendAdapter: failed to send', { key, error: err?.message || err });
            throw err;
        }
    }
}

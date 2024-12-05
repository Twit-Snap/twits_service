import axios from 'axios';
import { Hashtag } from '../types/types';

export class MetricController {
  constructor() {}

  private async createMetric(
    username: string,
    type: string,
    errorMessage: string,
    metrics: Record<string, string | number | boolean | Date>
  ) {
    await axios
      .post(`${process.env.METRICS_SERVICE_URL}/metrics`, {
        type: type,
        createdAt: new Date(),
        username: username,
        metrics: metrics
      })
      .catch(error => {
        console.error(errorMessage, error);
      });
  }

  async createTwitMetric(username: string) {
    await this.createMetric(username, 'twit', 'Error posting twit metric', {});
  }
  async createLikeMetric(username: string) {
    await this.createMetric(username, 'like', 'Error posting like metric', {});
  }
  async createRetwitMetric(username: string) {
    await this.createMetric(username, 'retwit', 'Error posting retwit metric', {});
  }
  async createCommentMetric(username: string) {
    await this.createMetric(username, 'comment', 'Error posting comment metric', {});
  }

  async createHashtagMetrics(username: string, hashtags: Hashtag[]) {
    for (const hashtag of hashtags) {
      await this.createMetric(username, 'hashtag', 'Error posting hashtag metric', {
        hashtag: hashtag.text
      });
    }
  }
}

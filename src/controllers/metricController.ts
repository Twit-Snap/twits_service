import axios from 'axios';


export class MetricController{

  constructor() {}

  private async createMetric(username: string, type: string, errorMessage: string) {
    await axios
      .post(`${process.env.METRIC_SERVICE_URL}/metrics`, {
        type: type,
        createdAt: new Date(),
        username: username,
        metrics: {}
      }).catch((error) => {
        console.error(errorMessage, error);
    })
  }

  async createTwitMetric(username: string) {
    await this.createMetric(username, 'twit', 'Error posting twit metric');
  }
  async createLikeMetric(username: string) {
    await this.createMetric(username, 'like', 'Error posting like metric');
  }
  async createRetwitMetric(username: string) {
    await this.createMetric(username, 'retwit', 'Error posting retwit metric');
  }
  async createCommentMetric(username: string) {
    await this.createMetric(username, 'comment', 'Error posting comment metric');
  }

}
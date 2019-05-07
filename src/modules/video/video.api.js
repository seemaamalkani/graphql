const { BaseAPI } = require("../base");
const { MEDIA } = require("../../controllers");

module.exports = class VideoApi extends BaseAPI {
  constructor() {
    super();

    this.path = MEDIA;
    this.getVideo = this.getVideo.bind(this);
  }

  async getVideo(id, token) {
    // this.setDebugBackend(true);
    this.setToken(token);
    const response = await this.get(`${this.path}/${id}`);
    return response;
  }

  async createVideo(input, token) {
    this.setToken(token);
    // node-fetch or apollo is a little picky, so need to do this, in order
    // to have body.constructor === Object:
    const body = { ...input };
    const response = await this.post(this.path, body);
    return response;
  }

  async updateVideo(id, input, token) {
    // node-fetch or apollo is a little picky, so need to do this, in order
    // to have body.constructor === Object:
    this.setToken(token);
    const body = { ...input };
    const response = await this.put(`${this.path}/${id}`, body);
    return response;
  }
};
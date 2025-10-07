import { GoogleGenAI, Video } from "@google/genai";

class VEO3Service {
  private veo3: GoogleGenAI;

  constructor() {
    this.veo3 = new GoogleGenAI({
      apiKey: process.env.GOOGLE_VEO3_API_KEY || "",
    });
  }

  async generateVideo(
    prompt: string,
    negativePrompt: string,
    video?: Video
  ): Promise<Video | undefined> {
    let operation = await this.veo3.models.generateVideos({
      model: "veo-3.0-fast-generate-001",
      prompt: prompt,
      config: {
        negativePrompt: negativePrompt,
      },
      video,
    });

    // Poll the operation status until the video is ready.
    while (!operation.done) {
      console.log("Waiting for video generation to complete...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await this.veo3.operations.getVideosOperation({
        operation: operation,
      });
    }

    if (!operation?.response?.generatedVideos?.length) {
      console.error("No videos were generated.");
      return undefined;
    }

    return operation.response.generatedVideos[0]?.video;
  }

  async downloadVideo(video: Video, path: string) {
    await this.veo3.files.download({
      file: video,
      downloadPath: path,
    });
  }
}

export default new VEO3Service();

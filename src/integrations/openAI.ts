import { writeFileSync } from "fs";
import OpenAI from "openai";
import { AutoParseableTextFormat } from "openai/lib/parser";
import { Video } from "openai/resources/videos";

class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPEN_AI_KEY,
      project: process.env.OPEN_AI_PROJECT_ID,
    });
  }

  async createStructuredResponses(
    messages: OpenAI.Responses.ResponseInput,
    responseSchema: AutoParseableTextFormat<any>
  ) {
    return await this.openai.responses.parse({
      model: "gpt-5-nano",
      input: messages,
      text: {
        format: responseSchema,
      },
    });
  }

  async generateSceneVideo(prompt: string) {
    let video = await this.openai.videos.create({
      model: "sora-2",
      prompt,
    });

    console.log("Video generation started: ", video);
    let progress = video.progress ?? 0;

    while (video.status === "in_progress" || video.status === "queued") {
      video = await this.openai.videos.retrieve(video.id);
      progress = video.progress ?? 0;

      // Display progress bar
      const barLength = 30;
      const filledLength = Math.floor((progress / 100) * barLength);
      // Simple ASCII progress visualization for terminal output
      const bar =
        "=".repeat(filledLength) + "-".repeat(barLength - filledLength);
      const statusText = video.status === "queued" ? "Queued" : "Processing";

      process.stdout.write(`${statusText}: [${bar}] ${progress.toFixed(1)}%`);

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Clear the progress line and show completion
    process.stdout.write("\n");

    if (video.status === "failed") {
      console.error("Video generation failed");
      return;
    }

    console.log("Video generation completed: ", video);

    return video;
  }

  async downloadVideo(video: Video, path: string) {
    const content = await this.openai.videos.downloadContent(video.id);

    const body = content.arrayBuffer();
    const buffer = Buffer.from(await body);

    writeFileSync(path, buffer);
  }

  async listVideos() {
    const videos = await this.openai.videos.list();

    return videos.data;
  }
}

export default new OpenAIService();

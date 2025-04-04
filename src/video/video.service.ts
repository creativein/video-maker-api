import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';

export interface ExportVideoDto {
  format?: string;
  quality?: string;
  includeAudio?: boolean;
  // Add any other export parameters you might need
}

export interface VideoExportResult {
  exportId: string;
  status: string;
  estimatedTime?: number;
  downloadUrl?: string;
}

@Injectable()
export class VideoService {
  async exportVideo(
    projectId: string,
    exportOptions: ExportVideoDto,
  ): Promise<VideoExportResult> {
    const mockDataPath = './mock.json';
    if (!fs.existsSync(mockDataPath)) {
      throw new Error('Mock data file not found');
    }

    const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf-8'));
    const layers = mockData.layers;

    const outputFilePath = `./output/${projectId}.mp4`;

    return new Promise((resolve, reject) => {
      const command = ffmpeg();

      layers.forEach((layer: any) => {
        switch (layer.layerType) {
          case 'image':
            command.input(layer.imagePath)
              .inputOptions([
                `-loop 1`,
                `-t ${layer.endTime - layer.startTime}`,
                `-vf scale=${mockData.projectWidth}:${mockData.projectHeight}`
              ]);
            break;
          case 'video':
            command.input(layer.videoPath)
              .inputOptions([
                `-ss ${layer.startTime}`,
                `-to ${layer.endTime}`
              ]);
            break;
          case 'audio':
            command.input(layer.audioPath)
              .inputOptions([
                `-ss ${layer.startTime}`,
                `-to ${layer.endTime}`
              ]);
            break;
          // Add more cases for other layer types like text, shape, etc.
        }
      });

      command
        .on('start', () => {
          console.log('FFmpeg process started');
        })
        .on('error', (err) => {
          console.error('Error during video export:', err);
          reject(err);
        })
        .on('end', () => {
          console.log('Video export completed');
          resolve({
            exportId: `export-${Date.now()}`,
            status: 'completed',
            downloadUrl: outputFilePath,
          });
        })
        .save(outputFilePath);
    });
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';

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
    const mockDataPath = path.resolve(__dirname, '../../mock.json');
    if (!fs.existsSync(mockDataPath)) {
      throw new Error('Mock data file not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf-8'));
    const layers = mockData?.layers;

    const outputDir = path.resolve(__dirname, '../../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFilePath = path.join(outputDir, `${projectId}.mp4`);

    return new Promise((resolve, reject) => {
      const command = ffmpeg();

      layers.forEach((layer: any) => {
        switch (layer.layerType) {
          case 'image':
            command
              .input(layer.imagePath)
              .inputOptions([
                `-loop 1`,
                `-t ${layer.endTime - layer.startTime}`,
                `-vf scale=${mockData.projectWidth}:${mockData.projectHeight}`,
              ]);
            break;
          case 'video':
            command
              .input(layer.videoPath)
              .inputOptions([`-ss ${layer.startTime}`, `-to ${layer.endTime}`]);
            break;
          case 'text':
            //const fontFilePath = path.resolve(__dirname, '../../fonts/arial.ttf'); // Ensure this font file exists
            command
              .input('')
              .inputOptions([
                `-vf drawtext=text='${layer.text.replace(/'/g, "\\'")}':x=${layer.position.x}:y=${layer.position.y}:fontsize=${layer.fontSize}:fontcolor=${layer.color}`,
              ]);
            break;
          case 'shape': {
            const shapeFilter =
              layer.shapeType === 'rectangle'
                ? `drawbox=x=${layer.position.x}:y=${layer.position.y}:w=${layer.dimensions.width}:h=${layer.dimensions.height}:color=${layer.color}@${layer.opacity}`
                : '';
            if (shapeFilter) {
              command.input('').inputOptions([`-vf ${shapeFilter}`]);
            }
            break;
          }
          case 'audio':
            command
              .input(layer.audioPath)
              .inputOptions([`-ss ${layer.startTime}`, `-to ${layer.endTime}`]);
            break;
          // Add more cases for other layer types like text, shape, etc.
        }
      });

      console.log('FFmpeg command:', command._getArguments());

      command
        .on('start', () => {
          console.log('FFmpeg process started');
        })
        .on('error', (err) => {
          console.error('Error during video export:', err.message);
          reject(new Error(`FFmpeg error: ${err.message}`));
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

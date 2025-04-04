import { Controller, Param, Post, Body } from '@nestjs/common';
import {
  VideoService,
  ExportVideoDto,
  VideoExportResult,
} from './video.service';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post(':projectId/export')
  async exportVideo(
    @Param('projectId') projectId: string,
    @Body() exportOptions: ExportVideoDto,
  ): Promise<VideoExportResult> {
    return this.videoService.exportVideo(projectId, exportOptions);
  }
}

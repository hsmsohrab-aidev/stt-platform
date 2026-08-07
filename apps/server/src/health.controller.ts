import { Controller, Get } from '@nestjs/common';
import type { ApiResponse } from '@stt/types';

@Controller('health')
export class HealthController {
  @Get()
  check(): ApiResponse<{ status: string; service: string }> {
    return {
      data: { status: 'ok', service: 'stt-api' },
      error: null,
      message: 'STT API is running',
    };
  }
}

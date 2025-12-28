import { Module } from '@nestjs/common';
import { HostPropertiesController } from './host-properties.controller';
import { HostPropertiesService } from './host-properties.service';

@Module({
  controllers: [HostPropertiesController],
  providers: [HostPropertiesService],
})
export class HostModule {}

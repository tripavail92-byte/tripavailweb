import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module';
import { OperatorProfileService } from './operator-profile.service';
import { OperatorProfileController } from './operator-profile.controller';

@Module({
  imports: [ProvidersModule],
  providers: [OperatorProfileService],
  controllers: [OperatorProfileController],
  exports: [OperatorProfileService],
})
export class OperatorProfileModule {}

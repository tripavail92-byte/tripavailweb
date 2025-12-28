import { Global, Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { VerifiedProviderGuard } from './guards/verified-provider.guard';
import { ProviderOwnerGuard } from './guards/provider-owner.guard';
import { ListingOwnerGuard } from './guards/listing-owner.guard';

@Global()
@Module({
  imports: [RbacModule],
  providers: [VerifiedProviderGuard, ProviderOwnerGuard, ListingOwnerGuard],
  exports: [VerifiedProviderGuard, ProviderOwnerGuard, ListingOwnerGuard],
})
export class ProvidersModule {}

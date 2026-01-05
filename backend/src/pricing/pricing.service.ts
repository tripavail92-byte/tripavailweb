import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface PriceCalculationInput {
  packageType: 'HOTEL_PACKAGE' | 'TOUR_PACKAGE';
  packageId: string;
  checkInDate?: string;
  checkOutDate?: string;
  departureDate?: string;
  numberOfGuests: number;
  numberOfRooms?: number;
  selectedRoomIds?: string[];
  selectedAddOns?: string[];
}

export interface PriceBreakdown {
  basePrice: number;
  tax: number;
  commission: number;
  total: number;
  breakdown: {
    nights?: number;
    pricePerNight?: number;
    roomCharges?: Array<{ roomId: string; roomName: string; price: number }>;
    packagePrice?: number;
    pricePerPerson?: number;
    addOns?: Array<{ addOnId: string; addOnName: string; price: number }>;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    commissionRate: number;
    commissionAmount: number;
    grandTotal: number;
  };
}

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * CRITICAL: Server-side price calculation - never trust client prices
   * This is the single source of truth for all pricing in the system
   */
  async calculatePrice(input: PriceCalculationInput): Promise<PriceBreakdown> {
    if (input.packageType === 'HOTEL_PACKAGE') {
      return this.calculateHotelPackagePrice(input);
    } else if (input.packageType === 'TOUR_PACKAGE') {
      return this.calculateTourPackagePrice(input);
    }
    throw new BadRequestException('Invalid package type');
  }

  private async calculateHotelPackagePrice(input: PriceCalculationInput): Promise<PriceBreakdown> {
    const prisma = this.prisma as any;
    // Fetch hotel package with cancellation policy and pricing
    const hotelPackage = await prisma.hotelPackage.findUnique({
      where: { id: input.packageId },
      select: {
        id: true,
        status: true,
        pricePerPerson: true,
        cancellationPolicy: true,
      },
    });

    if (!hotelPackage) {
      throw new BadRequestException('Hotel package not found');
    }

    if (hotelPackage.status !== 'PUBLISHED') {
      throw new BadRequestException('Hotel package is not available for booking');
    }

    // Calculate nights
    const checkIn = new Date(input.checkInDate!);
    const checkOut = new Date(input.checkOutDate!);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    if (nights < 1) {
      throw new BadRequestException('Check-out must be after check-in');
    }

    // Calculate base price
    const pricePerNight = Number(hotelPackage.pricePerPerson);
    const numberOfRooms = input.numberOfRooms || 1;
    const subtotal = pricePerNight * nights * numberOfRooms;

    // Tax calculation (10%)
    const taxRate = 0.1;
    const taxAmount = subtotal * taxRate;

    // Commission (10% of subtotal)
    const commissionRate = 0.1;
    const commissionAmount = subtotal * commissionRate;

    // Grand total
    const grandTotal = subtotal + taxAmount;

    return {
      basePrice: subtotal,
      tax: taxAmount,
      commission: commissionAmount,
      total: grandTotal,
      breakdown: {
        nights,
        pricePerNight,
        subtotal,
        taxRate,
        taxAmount,
        commissionRate,
        commissionAmount,
        grandTotal,
      },
    };
  }

  private async calculateTourPackagePrice(input: PriceCalculationInput): Promise<PriceBreakdown> {
    const prisma = this.prisma as any;
    // Fetch tour package with departure and cancellation policy and pricing
    const tourPackage = await prisma.tourPackage.findUnique({
      where: { id: input.packageId },
      select: {
        id: true,
        status: true,
        basePrice: true,
        departures: {
          where: {
            departureDate: new Date(input.departureDate!),
            status: 'AVAILABLE',
          },
        },
        addOns: true,
        cancellationPolicy: true,
      },
    });

    if (!tourPackage) {
      throw new BadRequestException('Tour package not found');
    }

    if (tourPackage.status !== 'PUBLISHED') {
      throw new BadRequestException('Tour package is not available for booking');
    }

    // Check departure availability
    const departure = tourPackage.departures[0];
    if (!departure) {
      throw new BadRequestException('No available departure for selected date');
    }

    if (departure.availableSeats < input.numberOfGuests) {
      throw new BadRequestException(
        `Only ${departure.availableSeats} seats available for this departure`,
      );
    }

    // Calculate base price
    const pricePerPerson = Number(tourPackage.basePrice);
    let subtotal = pricePerPerson * input.numberOfGuests;

    // Add-ons calculation
    const addOnsBreakdown: Array<{ addOnId: string; addOnName: string; price: number }> = [];
    if (input.selectedAddOns && input.selectedAddOns.length > 0) {
      const selectedAddOns = tourPackage.addOns.filter((addOn: { id: string }) =>
        input.selectedAddOns!.includes(addOn.id),
      );

      for (const addOn of selectedAddOns) {
        const addOnPrice = Number(addOn.price) * input.numberOfGuests;
        subtotal += addOnPrice;
        addOnsBreakdown.push({
          addOnId: addOn.id,
          addOnName: addOn.name,
          price: addOnPrice,
        });
      }
    }

    // Tax calculation (10%)
    const taxRate = 0.1;
    const taxAmount = subtotal * taxRate;

    // Commission (10% of subtotal)
    const commissionRate = 0.1;
    const commissionAmount = subtotal * commissionRate;

    // Grand total
    const grandTotal = subtotal + taxAmount;

    return {
      basePrice: subtotal,
      tax: taxAmount,
      commission: commissionAmount,
      total: grandTotal,
      breakdown: {
        packagePrice: pricePerPerson,
        pricePerPerson,
        addOns: addOnsBreakdown.length > 0 ? addOnsBreakdown : undefined,
        subtotal,
        taxRate,
        taxAmount,
        commissionRate,
        commissionAmount,
        grandTotal,
      },
    };
  }
}
